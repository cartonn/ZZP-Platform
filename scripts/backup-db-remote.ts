import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  buildBackupFilename,
  buildPgDumpArgs,
  buildPgRestoreListArgs,
} from "../src/lib/ops/db-backup";
import { decryptStoredObject, encryptStoredObject } from "../src/lib/services/storage";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} ontbreekt.`);
  return value;
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} faalde met exitcode ${result.status ?? "n.v.t."}.`);
  }
}

async function main() {
  const databaseUrl = required("DATABASE_URL");
  const bucket = required("BACKUP_S3_BUCKET");
  const encryptionKey = Buffer.from(required("BACKUP_ENCRYPTION_KEY"), "base64");
  if (encryptionKey.byteLength !== 32)
    throw new Error("BACKUP_ENCRYPTION_KEY moet exact 32 bytes zijn (base64). ");
  const retentionDays = Math.max(
    1,
    Number.parseInt(process.env.BACKUP_RETENTION_DAYS ?? "30", 10) || 30,
  );
  const dir = mkdtempSync(join(tmpdir(), "zzp-backup-"));
  const filename = buildBackupFilename(new Date());
  const file = join(dir, filename);

  const client = new S3Client({
    region: required("BACKUP_S3_REGION"),
    endpoint: required("BACKUP_S3_ENDPOINT"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("BACKUP_S3_ACCESS_KEY_ID"),
      secretAccessKey: required("BACKUP_S3_SECRET_ACCESS_KEY"),
    },
  });

  try {
    run("pg_dump", buildPgDumpArgs({ url: databaseUrl, file }));
    run("pg_restore", buildPgRestoreListArgs(file));
    const plaintext = readFileSync(file);
    const checksum = createHash("sha256").update(plaintext).digest("hex");
    const key = `postgres/${filename}.enc`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: encryptStoredObject(plaintext, encryptionKey),
        ContentType: "application/octet-stream",
        Metadata: { format: "pg-custom-aes-256-gcm-v1", plaintextSha256: checksum },
      }),
    );

    const fetched = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!fetched.Body) throw new Error("Back-upobject kwam leeg terug.");
    const roundtrip = decryptStoredObject(
      Buffer.from(await fetched.Body.transformToByteArray()),
      encryptionKey,
    );
    if (createHash("sha256").update(roundtrip).digest("hex") !== checksum) {
      throw new Error("Back-upchecksum verschilt na upload/download.");
    }

    const cutoff = Date.now() - retentionDays * 86_400_000;
    const listed = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: "postgres/" }),
    );
    const expired = (listed.Contents ?? [])
      .filter(
        (object) => object.Key && object.LastModified && object.LastModified.getTime() < cutoff,
      )
      .map((object) => ({ Key: object.Key! }));
    if (expired.length) {
      await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: expired, Quiet: true } }),
      );
    }

    const heartbeatUrl = process.env.BACKUP_HEARTBEAT_URL?.trim();
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (heartbeatUrl && cronSecret) {
      const response = await fetch(heartbeatUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      if (!response.ok) throw new Error(`Back-upheartbeat faalde (HTTP ${response.status}).`);
    }
    console.log(
      `[backup] geverifieerde versleutelde back-up opgeslagen: ${key}; retentie ${retentionDays} dagen.`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[backup] mislukt: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
