import { describe, expect, it, vi } from "vitest";
import {
  probePayload,
  runStorageSelfTest,
  SELFTEST_PREFIX,
  type SelfTestDriver,
} from "@/lib/services/storage-selftest";

const KEY = `${SELFTEST_PREFIX}probe-1.txt`;

/** In-memory fake driver die de round-trip correct ondersteunt. */
function memoryDriver(): SelfTestDriver & { store: Map<string, Buffer> } {
  const store = new Map<string, Buffer>();
  return {
    store,
    async put(key, data) {
      store.set(key, Buffer.from(data));
      return { key, size: data.byteLength };
    },
    async exists(key) {
      return store.has(key);
    },
    async get(key) {
      const v = store.get(key);
      if (!v) throw new Error("NotFound");
      return v;
    },
    async delete(key) {
      store.delete(key);
    },
  };
}

describe("runStorageSelfTest", () => {
  it("slaagt op de volledige round-trip en laat niets achter", async () => {
    const driver = memoryDriver();
    const report = await runStorageSelfTest({ driver, driverMode: "local", probeKey: KEY });

    expect(report.ok).toBe(true);
    expect(report.driverMode).toBe("local");
    expect(report.probeKey).toBe(KEY);
    expect(report.steps.map((s) => s.key)).toEqual([
      "write",
      "exists",
      "read",
      "delete",
      "cleanup",
    ]);
    expect(report.steps.every((s) => s.ok)).toBe(true);
    expect(driver.store.size).toBe(0);
  });

  it("faalt en stopt wanneer schrijven een fout werpt (secret-vrije detail)", async () => {
    const driver = memoryDriver();
    driver.put = vi.fn(async () => {
      throw Object.assign(new Error("connect ECONNREFUSED 10.0.0.1:443"), {
        name: "CredentialsProviderError",
      });
    });

    const report = await runStorageSelfTest({ driver, driverMode: "s3", probeKey: KEY });

    expect(report.ok).toBe(false);
    expect(report.steps).toHaveLength(1);
    expect(report.steps.at(0)).toMatchObject({ key: "write", ok: false });
    // Alleen de error-NAAM lekt, nooit het bericht (endpoint/IP).
    expect(report.steps.at(0)?.detail).toBe("CredentialsProviderError");
    expect(report.steps.at(0)?.detail).not.toContain("ECONNREFUSED");
  });

  it("faalt wanneer put een verkeerde grootte teruggeeft", async () => {
    const driver = memoryDriver();
    driver.put = vi.fn(async (key) => ({ key, size: 1 }));

    const report = await runStorageSelfTest({ driver, driverMode: "s3", probeKey: KEY });

    expect(report.ok).toBe(false);
    expect(report.steps).toHaveLength(1);
    expect(report.steps.at(0)?.key).toBe("write");
  });

  it("faalt wanneer het object niet bestaat direct na schrijven", async () => {
    const driver = memoryDriver();
    driver.exists = vi.fn(async () => false);

    const report = await runStorageSelfTest({ driver, driverMode: "s3", probeKey: KEY });

    expect(report.ok).toBe(false);
    expect(report.steps.map((s) => s.key)).toEqual(["write", "exists"]);
    expect(report.steps.at(1)?.ok).toBe(false);
    // Vangnet ruimde het geschreven object op.
    expect(driver.store.size).toBe(0);
  });

  it("faalt bij een byte-mismatch tijdens lezen en ruimt op", async () => {
    const driver = memoryDriver();
    driver.get = vi.fn(async () => Buffer.from("andere inhoud"));

    const report = await runStorageSelfTest({ driver, driverMode: "s3", probeKey: KEY });

    expect(report.ok).toBe(false);
    expect(report.steps.map((s) => s.key)).toEqual(["write", "exists", "read"]);
    expect(report.steps.at(2)?.ok).toBe(false);
    expect(driver.store.size).toBe(0);
  });

  it("faalt wanneer het object na verwijderen nog bestaat", async () => {
    const driver = memoryDriver();
    driver.delete = vi.fn(async () => {
      // Doet niets: object blijft staan → opruim-check faalt.
    });

    const report = await runStorageSelfTest({ driver, driverMode: "s3", probeKey: KEY });

    expect(report.ok).toBe(false);
    expect(report.steps.map((s) => s.key)).toEqual([
      "write",
      "exists",
      "read",
      "delete",
      "cleanup",
    ]);
    expect(report.steps.at(-1)).toMatchObject({ key: "cleanup", ok: false });
  });

  it("laat geen probe-object achter als een latere stap faalt (finally-cleanup)", async () => {
    const driver = memoryDriver();
    driver.get = vi.fn(async () => {
      throw new Error("boom");
    });

    await runStorageSelfTest({ driver, driverMode: "s3", probeKey: KEY });

    expect(driver.store.size).toBe(0);
  });

  it("slaat de encryptie-stap over bij lokale opslag (geen describeEncryption)", async () => {
    // Ook mét een verwachte SSE-modus: een driver zonder describeEncryption (lokaal) kan het niet
    // verifiëren, dus de stap verschijnt niet en de round-trip blijft groen.
    const driver = memoryDriver();
    const report = await runStorageSelfTest({
      driver,
      driverMode: "local",
      probeKey: KEY,
      expectedSse: "AES256",
    });

    expect(report.ok).toBe(true);
    expect(report.steps.map((s) => s.key)).toEqual([
      "write",
      "exists",
      "read",
      "delete",
      "cleanup",
    ]);
  });

  it("slaat de encryptie-stap over wanneer geen SSE verwacht wordt (none)", async () => {
    const driver = memoryDriver();
    driver.describeEncryption = vi.fn(async () => ({ serverSideEncryption: null }));

    const report = await runStorageSelfTest({
      driver,
      driverMode: "s3",
      probeKey: KEY,
      expectedSse: "none",
    });

    expect(report.ok).toBe(true);
    expect(report.steps.map((s) => s.key)).not.toContain("encrypt");
    expect(driver.describeEncryption).not.toHaveBeenCalled();
  });

  it("bevestigt encryptie-at-rest wanneer het algoritme aanwezig is", async () => {
    const driver = memoryDriver();
    driver.describeEncryption = vi.fn(async () => ({ serverSideEncryption: "AES256" }));

    const report = await runStorageSelfTest({
      driver,
      driverMode: "s3",
      probeKey: KEY,
      expectedSse: "AES256",
    });

    expect(report.ok).toBe(true);
    expect(report.steps.map((s) => s.key)).toEqual([
      "write",
      "exists",
      "read",
      "encrypt",
      "delete",
      "cleanup",
    ]);
    const encrypt = report.steps.find((s) => s.key === "encrypt");
    expect(encrypt).toMatchObject({ ok: true });
    expect(encrypt?.detail).toContain("AES256");
    expect(driver.store.size).toBe(0);
  });

  it("faalt (AVG) wanneer het object onversleuteld terugkomt en ruimt op", async () => {
    const driver = memoryDriver();
    driver.describeEncryption = vi.fn(async () => ({ serverSideEncryption: null }));

    const report = await runStorageSelfTest({
      driver,
      driverMode: "s3",
      probeKey: KEY,
      expectedSse: "AES256",
    });

    expect(report.ok).toBe(false);
    expect(report.steps.map((s) => s.key)).toEqual(["write", "exists", "read", "encrypt"]);
    expect(report.steps.at(-1)).toMatchObject({ key: "encrypt", ok: false });
    expect(report.steps.at(-1)?.detail).toContain("ONVERSLEUTELD");
    // De verval-stappen draaien niet meer, maar het vangnet ruimt het probe-object op.
    expect(driver.store.size).toBe(0);
  });

  it("blijft groen bij een algoritme-mismatch maar noemt beide", async () => {
    const driver = memoryDriver();
    driver.describeEncryption = vi.fn(async () => ({ serverSideEncryption: "AES256" }));

    const report = await runStorageSelfTest({
      driver,
      driverMode: "s3",
      probeKey: KEY,
      expectedSse: "aws:kms",
    });

    expect(report.ok).toBe(true);
    const encrypt = report.steps.find((s) => s.key === "encrypt");
    expect(encrypt?.ok).toBe(true);
    expect(encrypt?.detail).toContain("AES256");
    expect(encrypt?.detail).toContain("aws:kms");
  });

  it("faalt secret-vrij wanneer describeEncryption werpt en ruimt op", async () => {
    const driver = memoryDriver();
    driver.describeEncryption = vi.fn(async () => {
      throw Object.assign(new Error("HeadObject 403 for bucket https://minio.internal"), {
        name: "AccessDenied",
      });
    });

    const report = await runStorageSelfTest({
      driver,
      driverMode: "s3",
      probeKey: KEY,
      expectedSse: "AES256",
    });

    expect(report.ok).toBe(false);
    expect(report.steps.at(-1)).toMatchObject({
      key: "encrypt",
      ok: false,
      detail: "AccessDenied",
    });
    expect(report.steps.at(-1)?.detail).not.toContain("minio.internal");
    expect(driver.store.size).toBe(0);
  });

  it("probePayload is deterministisch en gebonden aan de key", () => {
    expect(probePayload(KEY).equals(probePayload(KEY))).toBe(true);
    expect(probePayload(KEY).equals(probePayload(`${SELFTEST_PREFIX}other.txt`))).toBe(false);
    expect(probePayload(KEY).toString("utf8")).toContain(KEY);
  });
});
