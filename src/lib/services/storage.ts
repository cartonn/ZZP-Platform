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

/** Genereert een niet-raadbare storage-key. Nooit de originele bestandsnaam als pad gebruiken. */
export function generateStorageKey(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, "");
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

class S3StorageDriver implements StorageDriver {
  // Implementatie in Sessie 10 (productie). Bewust nog niet geïmplementeerd.
  private fail(): never {
    throw new Error("S3-storage is nog niet geïmplementeerd (zie Sessie 10).");
  }
  async put(): Promise<StoredObject> {
    return this.fail();
  }
  async get(): Promise<Buffer> {
    return this.fail();
  }
  async delete(): Promise<void> {
    return this.fail();
  }
  async exists(): Promise<boolean> {
    return this.fail();
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
