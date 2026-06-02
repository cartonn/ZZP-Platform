// Storage-abstractie (CLAUDE.md regel 4). Documenten zijn standaard privé en gaan
// NOOIT in git of op een publiek pad. Lokaal: .gitignore'de map. Productie: S3
// (implementatie in Sessie 10). Upload wordt altijd gevalideerd (type + grootte).

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export interface UploadCandidate {
  filename: string;
  mimeType: string;
  size: number;
}

/** Valideert type + grootte vóór opslag. Werpt `UploadValidationError` bij afkeuring. */
export function validateUpload(file: UploadCandidate): void {
  if (!file.filename?.trim()) {
    throw new UploadValidationError("Bestandsnaam ontbreekt.");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType as AllowedMimeType)) {
    throw new UploadValidationError(
      `Bestandstype niet toegestaan: ${file.mimeType}. Toegestaan: PDF, PNG, JPEG, WEBP.`,
    );
  }
  if (file.size <= 0) {
    throw new UploadValidationError("Leeg bestand.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError(
      `Bestand te groot (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`,
    );
  }
}

/**
 * Detecteert het werkelijke bestandstype aan de byte-signatuur (magic bytes), onafhankelijk van
 * de door de client opgegeven Content-Type. Geeft null bij een onbekende/niet-toegestane signatuur.
 */
export function sniffMimeType(buffer: Buffer): AllowedMimeType | null {
  if (buffer.length >= 5 && buffer.toString("latin1", 0, 5) === "%PDF-") {
    return "application/pdf";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("latin1", 0, 4) === "RIFF" &&
    buffer.toString("latin1", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Werpt `UploadValidationError` als de echte byte-signatuur niet overeenkomt met het opgegeven
 * MIME-type. Voorkomt dat een uitvoerbaar/HTML-bestand met een vervalste Content-Type passeert.
 */
export function assertContentMatchesMime(buffer: Buffer, declaredMime: string): void {
  if (sniffMimeType(buffer) !== declaredMime) {
    throw new UploadValidationError(
      "De bestandsinhoud komt niet overeen met het opgegeven type. Upload een geldig PDF-, PNG-, JPEG- of WEBP-bestand.",
    );
  }
}

/** Genereert een niet-raadbare storage-key. Nooit de originele bestandsnaam als pad gebruiken. */
export function generateStorageKey(filename: string): string {
  const ext = path
    .extname(filename)
    .toLowerCase()
    .replace(/[^.a-z0-9]/g, "");
  return `${new Date().getFullYear()}/${randomUUID()}${ext}`;
}

export interface StoredObject {
  key: string;
  size: number;
}

export interface StorageDriver {
  put(key: string, data: Buffer, mimeType: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

class LocalStorageDriver implements StorageDriver {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    // Voorkom path traversal: key mag niet uit de baseDir breken.
    const target = path.resolve(this.baseDir, key);
    const base = path.resolve(this.baseDir);
    if (target !== base && !target.startsWith(base + path.sep)) {
      throw new Error("Ongeldige storage-key.");
    }
    return target;
  }

  async put(key: string, data: Buffer): Promise<StoredObject> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    return { key, size: data.byteLength };
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}

// Productie-driver. AWS SDK wordt lazy geïmporteerd zodat lokaal/tests 'm niet laden.
// Werkt met AWS S3 én S3-compatible (STORAGE_S3_ENDPOINT, path-style). Credentials via de
// standaard AWS-provider-chain (AWS_ACCESS_KEY_ID/SECRET of IAM-rol). De bucket/IAM zelf is infra.
class S3StorageDriver implements StorageDriver {
  private svcPromise?: Promise<{
    client: import("@aws-sdk/client-s3").S3Client;
    bucket: string;
    lib: typeof import("@aws-sdk/client-s3");
  }>;

  private svc() {
    if (!this.svcPromise) {
      this.svcPromise = (async () => {
        const lib = await import("@aws-sdk/client-s3");
        const bucket = process.env.STORAGE_S3_BUCKET;
        if (!bucket) throw new Error("STORAGE_S3_BUCKET ontbreekt voor S3-storage.");
        const client = new lib.S3Client({
          region: process.env.STORAGE_S3_REGION,
          ...(process.env.STORAGE_S3_ENDPOINT
            ? { endpoint: process.env.STORAGE_S3_ENDPOINT, forcePathStyle: true }
            : {}),
        });
        return { client, bucket, lib };
      })();
    }
    return this.svcPromise;
  }

  async put(key: string, data: Buffer, mimeType: string): Promise<StoredObject> {
    const { client, bucket, lib } = await this.svc();
    await client.send(
      new lib.PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: mimeType }),
    );
    return { key, size: data.byteLength };
  }

  async get(key: string): Promise<Buffer> {
    const { client, bucket, lib } = await this.svc();
    const res = await client.send(new lib.GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = res.Body as { transformToByteArray(): Promise<Uint8Array> } | undefined;
    if (!body) throw new Error("Leeg S3-antwoord.");
    return Buffer.from(await body.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    const { client, bucket, lib } = await this.svc();
    await client.send(new lib.DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    const { client, bucket, lib } = await this.svc();
    try {
      await client.send(new lib.HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (e: unknown) {
      const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) return false;
      throw e;
    }
  }
}

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") {
    cached = new S3StorageDriver();
  } else {
    const dir = process.env.STORAGE_LOCAL_DIR ?? "./storage";
    cached = new LocalStorageDriver(path.resolve(process.cwd(), dir));
  }
  return cached;
}
