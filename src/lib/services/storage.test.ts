import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  generateStorageKey,
  getStorage,
  MAX_UPLOAD_BYTES,
  UploadValidationError,
  validateUpload,
} from "@/lib/services/storage";

describe("validateUpload", () => {
  const ok = { filename: "vog.pdf", mimeType: "application/pdf", size: 1024 };

  it("accepteert een geldig PDF", () => {
    expect(() => validateUpload(ok)).not.toThrow();
  });

  it("weigert een niet-toegestaan type", () => {
    expect(() => validateUpload({ ...ok, mimeType: "application/x-msdownload" })).toThrow(
      UploadValidationError,
    );
  });

  it("weigert een te groot bestand", () => {
    expect(() => validateUpload({ ...ok, size: MAX_UPLOAD_BYTES + 1 })).toThrow(
      UploadValidationError,
    );
  });

  it("weigert een leeg bestand en lege naam", () => {
    expect(() => validateUpload({ ...ok, size: 0 })).toThrow(UploadValidationError);
    expect(() => validateUpload({ ...ok, filename: "" })).toThrow(UploadValidationError);
  });
});

describe("generateStorageKey", () => {
  it("genereert een unieke key met extensie en zonder de originele naam", () => {
    const key = generateStorageKey("Mijn Diploma.PDF");
    expect(key).toMatch(/^\d{4}\/[0-9a-f-]{36}\.pdf$/);
    expect(key).not.toContain("Mijn");
    expect(generateStorageKey("a.pdf")).not.toBe(generateStorageKey("a.pdf"));
  });
});

describe("LocalStorageDriver", () => {
  const dir = path.join(os.tmpdir(), `zzp-storage-test-${Date.now()}`);

  beforeAll(() => {
    process.env.STORAGE_DRIVER = "local";
    process.env.STORAGE_LOCAL_DIR = dir;
  });
  afterAll(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("doet een put/get/exists/delete round-trip", async () => {
    const storage = getStorage();
    const key = generateStorageKey("test.pdf");
    const data = Buffer.from("hallo");
    await storage.put(key, data, "application/pdf");
    expect(await storage.exists(key)).toBe(true);
    expect((await storage.get(key)).toString()).toBe("hallo");
    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
  });

  it("weigert path traversal", async () => {
    const storage = getStorage();
    await expect(storage.get("../../etc/passwd")).rejects.toThrow();
  });
});
