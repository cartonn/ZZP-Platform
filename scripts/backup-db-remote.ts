/** Restores the existing Railway db:backup:remote command from c8b096b2.
 * No remote pruning: BACKUP_RETENTION_DAYS remains reserved until recovery is proven.
 * Logs contain fixed stages only, never provider errors, child output or secret values.
 */
import { randomUUID } from "node:crypto";
import { closeSync, constants, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  assertPostgresUrl,
  buildBackupFilename,
  isValidArchiveListing,
} from "../src/lib/ops/db-backup";
import {
  remoteBackupEncryptionKey,
  readBackupDescriptor,
  uploadVerifiedRemoteBackup,
} from "../src/lib/ops/db-backup-remote";

const TIMEOUT_MS = 120_000;
const MAX_DUMP_BYTES = 128 * 1024 * 1024;
let stage = "configuratie";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("Verplichte configuratie ontbreekt.");
  return value;
}

function run(command: string, args: string[], env = process.env, stdinFd?: number): string {
  const result = spawnSync(command, args, {
    env,
    encoding: "utf8",
    stdio: [stdinFd ?? "ignore", "pipe", "pipe"],
    timeout: TIMEOUT_MS,
    killSignal: "SIGKILL",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error("Databasecommando mislukt.");
  return result.stdout;
}

async function main(): Promise<void> {
  process.umask(0o077);
  const databaseUrl = new URL(assertPostgresUrl(required("DATABASE_URL")));
  const bucket = required("BACKUP_S3_BUCKET");
  const encryptionKey = remoteBackupEncryptionKey(required("BACKUP_ENCRYPTION_KEY"));
  const heartbeatUrl = new URL(required("BACKUP_HEARTBEAT_URL"));
  const endpoint = new URL(required("BACKUP_S3_ENDPOINT"));
  if (heartbeatUrl.protocol !== "https:" || endpoint.protocol !== "https:") {
    throw new Error("Externe back-upkanalen vereisen HTTPS.");
  }
  const cronSecret = required("CRON_SECRET");
  const client = new S3Client({
    region: required("BACKUP_S3_REGION"),
    endpoint: endpoint.href,
    forcePathStyle: true,
    maxAttempts: 2,
    credentials: {
      accessKeyId: required("BACKUP_S3_ACCESS_KEY_ID"),
      secretAccessKey: required("BACKUP_S3_SECRET_ACCESS_KEY"),
    },
  });
  // No connection secrets in subprocess arguments. Prisma-only query params are not libpq params.
  const childEnv = {
    ...process.env,
    PGHOST: databaseUrl.hostname,
    PGPORT: databaseUrl.port || "5432",
    PGUSER: decodeURIComponent(databaseUrl.username),
    PGPASSWORD: decodeURIComponent(databaseUrl.password),
    PGDATABASE: decodeURIComponent(databaseUrl.pathname.slice(1)),
    PGCONNECT_TIMEOUT: "15",
    ...(databaseUrl.searchParams.has("sslmode")
      ? { PGSSLMODE: databaseUrl.searchParams.get("sslmode")! }
      : {}),
  };
  const dir = mkdtempSync(join(tmpdir(), "zzp-backup-"));
  const filename = buildBackupFilename(new Date());
  const file = join(dir, filename);
  // Concurrent/manual runs cannot overwrite an existing good archive.
  const objectKey = `postgres/${filename}.${randomUUID()}.enc`;
  try {
    stage = "database-dump";
    run("pg_dump", ["--no-owner", "--no-privileges", "--format=custom", "--file", file], childEnv);
    stage = "archiefcontrole";
    const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    let plaintext: Buffer;
    try {
      plaintext = readBackupDescriptor(fd, MAX_DUMP_BYTES);
      // Positional reads above leave the descriptor at offset zero. Give pg_restore this same
      // inode, not a pathname that could be replaced. A descriptor also avoids EPIPE when --list
      // exits after reading the TOC without consuming the complete archive on a buffered pipe.
      if (!isValidArchiveListing(run("pg_restore", ["--list"], process.env, fd)))
        throw new Error("Ongeldig archief.");
    } finally {
      closeSync(fd);
    }
    await uploadVerifiedRemoteBackup({
      plaintext,
      encryptionKey,
      objectKey,
      store: {
        async put(key, encrypted, checksum) {
          stage = "versleutelde-upload";
          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: encrypted,
              ContentType: "application/octet-stream",
              Metadata: { format: "pg-custom-aes-256-gcm-v1", plaintextSha256: checksum },
            }),
            { abortSignal: AbortSignal.timeout(TIMEOUT_MS) },
          );
        },
        async get(key) {
          stage = "download-en-decryptiecontrole";
          const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), {
            abortSignal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!(result.Body instanceof Readable)) throw new Error("Leeg of onleesbaar object.");
          const body = result.Body;
          const timer = setTimeout(() => body.destroy(new Error("Downloadtime-out.")), TIMEOUT_MS);
          try {
            let length = 0;
            const chunks: Buffer[] = [];
            for await (const chunk of body) {
              const buffer = Buffer.from(chunk as Uint8Array);
              length += buffer.length;
              if (length > MAX_DUMP_BYTES + 36) throw new Error("Object groter dan back-uplimiet.");
              chunks.push(buffer);
            }
            return Buffer.concat(chunks);
          } finally {
            clearTimeout(timer);
            body.destroy();
          }
        },
      },
      async heartbeat() {
        stage = "succes-heartbeat";
        const response = await fetch(heartbeatUrl, {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(15_000),
          headers: { Authorization: `Bearer ${cronSecret}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ok: true }),
        });
        if (!response.ok) throw new Error("Heartbeat mislukt.");
        const receipt: unknown = await response.json();
        if (
          !receipt ||
          typeof receipt !== "object" ||
          !("recorded" in receipt) ||
          receipt.recorded !== true ||
          !("ok" in receipt) ||
          receipt.ok !== true
        ) {
          throw new Error("Heartbeat niet bevestigd.");
        }
      },
    });
    console.log(
      `[backup] versleuteld object geverifieerd: ${objectKey}; bestaande back-ups behouden.`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
    client.destroy();
  }
}

main().catch(() => {
  console.error(`[backup] mislukt bij ${stage}; geen succes bevestigd, geen back-ups verwijderd.`);
  process.exitCode = 1;
});
