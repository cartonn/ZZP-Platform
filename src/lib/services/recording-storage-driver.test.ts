import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de heartbeat-opslag: de decorator importeert 'm lazy (dynamic import); vi.mock onderschept dat.
const recordSuccess = vi.fn(async () => {});
const recordFailure = vi.fn(async () => {});
vi.mock("@/lib/observability/storage-delivery-heartbeat", () => ({
  recordStorageDeliverySuccess: recordSuccess,
  recordStorageDeliveryFailure: recordFailure,
}));

import {
  RecordingStorageDriver,
  type StorageDriver,
  type StoredObject,
  type StorageEncryptionInfo,
} from "./storage";

/** Minimale in-memory driver zonder describeEncryption (zoals de lokale disk-driver). */
class FakeDriver implements StorageDriver {
  putCalls = 0;
  constructor(private readonly fail = false) {}
  async put(key: string, data: Buffer): Promise<StoredObject> {
    this.putCalls += 1;
    if (this.fail) throw new Error("BackendDown");
    return { key, size: data.byteLength };
  }
  async get(): Promise<Buffer> {
    if (this.fail) throw new Error("BackendDown");
    return Buffer.from("x");
  }
  async delete(): Promise<void> {
    if (this.fail) throw new Error("BackendDown");
  }
  async exists(): Promise<boolean> {
    if (this.fail) throw new Error("BackendDown");
    return true;
  }
  async getSignedDownloadUrl(): Promise<string | null> {
    return "https://signed.example/x";
  }
}

/** Driver mét describeEncryption (zoals de S3-driver). */
class FakeS3Driver extends FakeDriver {
  async describeEncryption(): Promise<StorageEncryptionInfo> {
    return { serverSideEncryption: "AES256" };
  }
}

describe("RecordingStorageDriver — aflever-heartbeat-registratie", () => {
  beforeEach(() => {
    recordSuccess.mockClear();
    recordFailure.mockClear();
  });

  it("registreert succes na een geslaagde put en geeft het resultaat door", async () => {
    const rec = new RecordingStorageDriver(new FakeDriver(), "s3");
    const out = await rec.put("k", Buffer.from("hallo"), "application/pdf");
    expect(out).toEqual({ key: "k", size: 5 });
    expect(recordSuccess).toHaveBeenCalledWith("s3");
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("registreert een mislukking én gooit de originele fout door", async () => {
    const rec = new RecordingStorageDriver(new FakeDriver(true), "s3");
    await expect(rec.put("k", Buffer.from("x"), "application/pdf")).rejects.toThrow("BackendDown");
    expect(recordFailure).toHaveBeenCalledWith("s3");
    expect(recordSuccess).not.toHaveBeenCalled();
  });

  it("registreert ook get/delete/exists", async () => {
    const rec = new RecordingStorageDriver(new FakeDriver(), "s3");
    await rec.get("k");
    await rec.delete("k");
    await rec.exists("k");
    expect(recordSuccess).toHaveBeenCalledTimes(3);
  });

  it("registreert getSignedDownloadUrl NIET (lokale berekening, geen backend-round-trip)", async () => {
    const rec = new RecordingStorageDriver(new FakeDriver(), "s3");
    const url = await rec.getSignedDownloadUrl("k");
    expect(url).toBe("https://signed.example/x");
    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("exposeert describeEncryption alleen als de inner-driver 'm heeft en registreert 'm dan", async () => {
    const plain = new RecordingStorageDriver(new FakeDriver(), "s3");
    expect(typeof plain.describeEncryption).toBe("undefined");

    const s3 = new RecordingStorageDriver(new FakeS3Driver(), "s3");
    expect(typeof s3.describeEncryption).toBe("function");
    const info = await s3.describeEncryption!("k");
    expect(info.serverSideEncryption).toBe("AES256");
    expect(recordSuccess).toHaveBeenCalledWith("s3");
  });
});
