import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Preserve the original remote-backup format from c8b096b2. Independent of document storage.
const MAGIC = Buffer.from("ZZPENC01", "ascii");
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = MAGIC.length + IV_BYTES + TAG_BYTES;

export function remoteBackupEncryptionKey(raw: string | undefined): Buffer {
  const value = raw?.trim();
  if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new Error("BACKUP_ENCRYPTION_KEY moet een base64-sleutel van exact 32 bytes zijn.");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) {
    throw new Error("BACKUP_ENCRYPTION_KEY moet een base64-sleutel van exact 32 bytes zijn.");
  }
  return key;
}

export function encryptRemoteBackup(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), encrypted]);
}

export function decryptRemoteBackup(data: Buffer, key: Buffer): Buffer {
  if (data.length < HEADER_BYTES || !data.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("Back-upobject mist een geldige encryptieheader.");
  }
  const tagStart = MAGIC.length + IV_BYTES;
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(MAGIC.length, tagStart));
  decipher.setAuthTag(data.subarray(tagStart, HEADER_BYTES));
  return Buffer.concat([decipher.update(data.subarray(HEADER_BYTES)), decipher.final()]);
}

export interface RemoteBackupStore {
  put(key: string, encrypted: Buffer, checksum: string): Promise<void>;
  get(key: string): Promise<Buffer>;
}

/** No deletion API: recovery must be proven before enabling remote retention pruning. */
export async function uploadVerifiedRemoteBackup(options: {
  plaintext: Buffer;
  encryptionKey: Buffer;
  objectKey: string;
  store: RemoteBackupStore;
  heartbeat: () => Promise<void>;
}): Promise<void> {
  const { plaintext, encryptionKey, objectKey, store, heartbeat } = options;
  if (plaintext.length < 5 || plaintext.toString("ascii", 0, 5) !== "PGDMP") {
    throw new Error("Geen PostgreSQL custom-format back-uparchief.");
  }
  const digest = (data: Buffer) => createHash("sha256").update(data).digest("hex");
  const checksum = digest(plaintext);
  await store.put(objectKey, encryptRemoteBackup(plaintext, encryptionKey), checksum);
  const restored = decryptRemoteBackup(await store.get(objectKey), encryptionKey);
  if (digest(restored) !== checksum) throw new Error("Back-upchecksum verschilt na download.");
  await heartbeat();
}
