import { createCipheriv } from "node:crypto";
import { closeSync, mkdtempSync, openSync, readSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  decryptRemoteBackup,
  encryptRemoteBackup,
  remoteBackupEncryptionKey,
  readBackupDescriptor,
  uploadVerifiedRemoteBackup,
} from "./db-backup-remote";

const key = Buffer.alloc(32, 7);
const plaintext = Buffer.from("PGDMP synthetic test archive");

describe("backup descriptor reads", () => {
  it("reads the opened archive even if its pathname is replaced", () => {
    const dir = mkdtempSync(join(tmpdir(), "backup-descriptor-test-"));
    const file = join(dir, "archive.dump");
    writeFileSync(file, plaintext);
    const fd = openSync(file, "r");
    try {
      renameSync(file, join(dir, "original.dump"));
      writeFileSync(file, "replacement must never be uploaded");
      expect(readBackupDescriptor(fd, 1024)).toEqual(plaintext);
      const header = Buffer.alloc(5);
      readSync(fd, header, 0, header.length, null);
      expect(header.toString()).toBe("PGDMP"); // pg_restore inherits this descriptor at offset zero.
    } finally {
      closeSync(fd);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it.each([Buffer.alloc(0), Buffer.alloc(33)])(
    "rejects empty and oversized files before reading",
    (data) => {
      const dir = mkdtempSync(join(tmpdir(), "backup-descriptor-test-"));
      const file = join(dir, "archive.dump");
      writeFileSync(file, data);
      const fd = openSync(file, "r");
      try {
        expect(() => readBackupDescriptor(fd, 32)).toThrow(/buiten limiet/);
      } finally {
        closeSync(fd);
        rmSync(dir, { recursive: true, force: true });
      }
    },
  );
});

describe("remote backup encryption", () => {
  it.each([undefined, "", "secret", Buffer.alloc(31).toString("base64"), "!".repeat(44)])(
    "refuses absent or malformed keys without plaintext fallback (%s)",
    (value) => expect(() => remoteBackupEncryptionKey(value)).toThrow(/32 bytes/),
  );

  it("roundtrips with a unique IV and no plaintext in the stored object", () => {
    const parsed = remoteBackupEncryptionKey(key.toString("base64"));
    const encrypted = encryptRemoteBackup(plaintext, parsed);
    expect(encrypted.includes(plaintext)).toBe(false);
    expect(encrypted.equals(encryptRemoteBackup(plaintext, parsed))).toBe(false);
    expect(decryptRemoteBackup(encrypted, parsed)).toEqual(plaintext);
  });

  it("reads the historical c8b096b2 archive layout", () => {
    const iv = Buffer.alloc(12, 3);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const legacy = Buffer.concat([Buffer.from("ZZPENC01"), iv, cipher.getAuthTag(), data]);
    expect(decryptRemoteBackup(legacy, key)).toEqual(plaintext);
  });

  it("rejects plaintext, truncation, wrong keys, corrupted tags and ciphertext", () => {
    const encrypted = encryptRemoteBackup(plaintext, key);
    expect(() => decryptRemoteBackup(plaintext, key)).toThrow();
    expect(() => decryptRemoteBackup(encrypted.subarray(0, 20), key)).toThrow();
    expect(() => decryptRemoteBackup(encrypted, Buffer.alloc(32, 8))).toThrow();
    for (const offset of [20, encrypted.length - 1]) {
      const damaged = Buffer.from(encrypted);
      damaged[offset] = damaged[offset]! ^ 1;
      expect(() => decryptRemoteBackup(damaged, key)).toThrow();
    }
  });
});

function fixture() {
  let stored: Buffer = Buffer.alloc(0);
  const events: string[] = [];
  const store = {
    put: vi.fn(async (_key: string, data: Buffer) => {
      stored = data;
      events.push("put");
    }),
    get: vi.fn(async () => {
      events.push("get");
      return stored;
    }),
  };
  const heartbeat = vi.fn(async () => {
    events.push("heartbeat");
  });
  return {
    events,
    options: { plaintext, encryptionKey: key, objectKey: "postgres/test.enc", store, heartbeat },
  };
}

describe("verified backup completion", () => {
  it("reports success only after stored ciphertext has been read back and verified", async () => {
    const { options, events } = fixture();
    await uploadVerifiedRemoteBackup(options);
    expect(events).toEqual(["put", "get", "heartbeat"]);
    expect(options.store.put.mock.calls[0]![1]).not.toEqual(plaintext);
  });

  it.each(["put", "get"] as const)("does not heartbeat after %s fails", async (operation) => {
    const { options } = fixture();
    options.store[operation].mockRejectedValue(new Error("synthetic failure"));
    await expect(uploadVerifiedRemoteBackup(options)).rejects.toThrow();
    expect(options.heartbeat).not.toHaveBeenCalled();
  });

  it.each([Buffer.from("plaintext"), encryptRemoteBackup(Buffer.from("PGDMP other"), key)])(
    "does not heartbeat when the returned object is invalid or belongs to another dump",
    async (download) => {
      const { options } = fixture();
      options.store.get.mockResolvedValue(download);
      await expect(uploadVerifiedRemoteBackup(options)).rejects.toThrow();
      expect(options.heartbeat).not.toHaveBeenCalled();
    },
  );

  it("does not upload invalid input and propagates a failed success heartbeat", async () => {
    const { options } = fixture();
    await expect(
      uploadVerifiedRemoteBackup({ ...options, plaintext: Buffer.from("bad") }),
    ).rejects.toThrow();
    expect(options.store.put).not.toHaveBeenCalled();
    options.heartbeat.mockRejectedValue(new Error("heartbeat unavailable"));
    await expect(uploadVerifiedRemoteBackup(options)).rejects.toThrow("heartbeat unavailable");
  });
});
