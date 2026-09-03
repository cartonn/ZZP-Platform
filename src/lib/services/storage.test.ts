import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertContentMatchesMime,
  buildContentDisposition,
  generateStorageKey,
  getStorage,
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  resolveExpectedSse,
  resolveS3TimeoutConfig,
  resolveSignedUrlTtl,
  resolveSseParams,
  S3_CONNECTION_TIMEOUT_MS_DEFAULT,
  S3_CONNECTION_TIMEOUT_MS_MAX,
  S3_CONNECTION_TIMEOUT_MS_MIN,
  S3_REQUEST_TIMEOUT_MS_DEFAULT,
  S3_REQUEST_TIMEOUT_MS_MAX,
  S3_REQUEST_TIMEOUT_MS_MIN,
  SIGNED_URL_TTL_DEFAULT,
  SIGNED_URL_TTL_MAX,
  SIGNED_URL_TTL_MIN,
  sniffMimeType,
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

  // Alleen-afbeelding allowlist (logo-upload): een PDF hoort niet via /api/media aan elke ingelogde
  // gebruiker geserveerd te worden. Server-side is de waarheid (regel 1), niet enkel `accept`-attribuut.
  it("weigert een PDF wanneer alleen afbeeldingen zijn toegestaan (logo-upload)", () => {
    expect(() =>
      validateUpload(
        { filename: "logo.pdf", mimeType: "application/pdf", size: 1024 },
        IMAGE_MIME_TYPES,
      ),
    ).toThrow(UploadValidationError);
  });

  it("accepteert een afbeelding onder de alleen-afbeelding allowlist", () => {
    expect(() =>
      validateUpload({ filename: "logo.png", mimeType: "image/png", size: 1024 }, IMAGE_MIME_TYPES),
    ).not.toThrow();
  });
});

describe("sniffMimeType / assertContentMatchesMime (magic bytes)", () => {
  const pdf = Buffer.from("%PDF-1.7\n...", "latin1");
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const webp = Buffer.concat([
    Buffer.from("RIFF", "latin1"),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from("WEBP", "latin1"),
  ]);
  const html = Buffer.from("<!DOCTYPE html><script>alert(1)</script>", "latin1");

  it("herkent toegestane signaturen", () => {
    expect(sniffMimeType(pdf)).toBe("application/pdf");
    expect(sniffMimeType(png)).toBe("image/png");
    expect(sniffMimeType(jpeg)).toBe("image/jpeg");
    expect(sniffMimeType(webp)).toBe("image/webp");
  });

  it("geeft null voor onbekende/niet-toegestane inhoud", () => {
    expect(sniffMimeType(html)).toBeNull();
    expect(sniffMimeType(Buffer.alloc(2))).toBeNull();
  });

  it("accepteert wanneer inhoud bij het opgegeven type past", () => {
    expect(() => assertContentMatchesMime(pdf, "application/pdf")).not.toThrow();
    expect(() => assertContentMatchesMime(png, "image/png")).not.toThrow();
  });

  it("weigert een vervalst Content-Type (HTML als pdf, of pdf-bytes als png)", () => {
    expect(() => assertContentMatchesMime(html, "application/pdf")).toThrow(UploadValidationError);
    expect(() => assertContentMatchesMime(pdf, "image/png")).toThrow(UploadValidationError);
  });

  // Zelfs een eerlijk als application/pdf gedeclareerde, écht-PDF upload moet worden geweigerd zodra
  // het doel alleen afbeeldingen toestaat (logo). De signatuur matcht dan wél het opgegeven type, maar
  // valt buiten de allowlist — de tweede poort vangt dit (CWE-434 / server-side is de waarheid).
  it("weigert een echte PDF onder de alleen-afbeelding allowlist (logo)", () => {
    expect(() => assertContentMatchesMime(pdf, "application/pdf", IMAGE_MIME_TYPES)).toThrow(
      UploadValidationError,
    );
    expect(() => assertContentMatchesMime(png, "image/png", IMAGE_MIME_TYPES)).not.toThrow();
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

  it("ondersteunt geen presigning (geeft null → caller streamt)", async () => {
    const storage = getStorage();
    expect(await storage.getSignedDownloadUrl("2026/x.pdf")).toBeNull();
  });
});

describe("resolveSignedUrlTtl", () => {
  const original = process.env.STORAGE_S3_URL_TTL;
  afterAll(() => {
    if (original === undefined) delete process.env.STORAGE_S3_URL_TTL;
    else process.env.STORAGE_S3_URL_TTL = original;
  });

  it("gebruikt de default zonder env/expliciete waarde", () => {
    delete process.env.STORAGE_S3_URL_TTL;
    expect(resolveSignedUrlTtl()).toBe(SIGNED_URL_TTL_DEFAULT);
  });

  it("leest een geldige env-waarde", () => {
    process.env.STORAGE_S3_URL_TTL = "600";
    expect(resolveSignedUrlTtl()).toBe(600);
  });

  it("valt bij een ongeldige env-waarde terug op de default", () => {
    process.env.STORAGE_S3_URL_TTL = "niet-een-getal";
    expect(resolveSignedUrlTtl()).toBe(SIGNED_URL_TTL_DEFAULT);
  });

  it("klemt op [min, max] en geeft voorrang aan de expliciete waarde", () => {
    process.env.STORAGE_S3_URL_TTL = "600";
    expect(resolveSignedUrlTtl(10)).toBe(SIGNED_URL_TTL_MIN);
    expect(resolveSignedUrlTtl(99999)).toBe(SIGNED_URL_TTL_MAX);
    expect(resolveSignedUrlTtl(120)).toBe(120);
  });
});

describe("resolveS3TimeoutConfig", () => {
  const originalReq = process.env.STORAGE_S3_REQUEST_TIMEOUT_MS;
  const originalConn = process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS;
  afterAll(() => {
    if (originalReq === undefined) delete process.env.STORAGE_S3_REQUEST_TIMEOUT_MS;
    else process.env.STORAGE_S3_REQUEST_TIMEOUT_MS = originalReq;
    if (originalConn === undefined) delete process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS;
    else process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS = originalConn;
  });

  it("gebruikt de defaults zonder env", () => {
    delete process.env.STORAGE_S3_REQUEST_TIMEOUT_MS;
    delete process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS;
    expect(resolveS3TimeoutConfig()).toEqual({
      requestTimeout: S3_REQUEST_TIMEOUT_MS_DEFAULT,
      connectionTimeout: S3_CONNECTION_TIMEOUT_MS_DEFAULT,
      throwOnRequestTimeout: true,
    });
  });

  it("leest geldige env-waarden", () => {
    process.env.STORAGE_S3_REQUEST_TIMEOUT_MS = "30000";
    process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS = "5000";
    expect(resolveS3TimeoutConfig()).toEqual({
      requestTimeout: 30000,
      connectionTimeout: 5000,
      throwOnRequestTimeout: true,
    });
  });

  it("valt bij een ongeldige/lege env-waarde terug op de defaults", () => {
    process.env.STORAGE_S3_REQUEST_TIMEOUT_MS = "niet-een-getal";
    process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS = "";
    expect(resolveS3TimeoutConfig()).toEqual({
      requestTimeout: S3_REQUEST_TIMEOUT_MS_DEFAULT,
      connectionTimeout: S3_CONNECTION_TIMEOUT_MS_DEFAULT,
      throwOnRequestTimeout: true,
    });
  });

  it("klemt op de veilige boven- en ondergrenzen", () => {
    process.env.STORAGE_S3_REQUEST_TIMEOUT_MS = "1";
    process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS = "1";
    expect(resolveS3TimeoutConfig()).toEqual({
      requestTimeout: S3_REQUEST_TIMEOUT_MS_MIN,
      connectionTimeout: S3_CONNECTION_TIMEOUT_MS_MIN,
      throwOnRequestTimeout: true,
    });
    process.env.STORAGE_S3_REQUEST_TIMEOUT_MS = "999999999";
    process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS = "999999999";
    expect(resolveS3TimeoutConfig()).toEqual({
      requestTimeout: S3_REQUEST_TIMEOUT_MS_MAX,
      connectionTimeout: S3_CONNECTION_TIMEOUT_MS_MAX,
      throwOnRequestTimeout: true,
    });
  });

  it("weigert een negatieve waarde en valt terug op de default", () => {
    process.env.STORAGE_S3_REQUEST_TIMEOUT_MS = "-5000";
    delete process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS;
    expect(resolveS3TimeoutConfig().requestTimeout).toBe(S3_REQUEST_TIMEOUT_MS_DEFAULT);
  });

  it("zet throwOnRequestTimeout zodat een requestTimeout-breach de request écht afbreekt", () => {
    // Zonder deze vlag emit @smithy/node-http-handler alleen een console.warn bij een requestTimeout-breach
    // (geen req.destroy/reject) — dan hangt de response-fase alsnog onbeperkt. Regressiebescherming.
    delete process.env.STORAGE_S3_REQUEST_TIMEOUT_MS;
    delete process.env.STORAGE_S3_CONNECTION_TIMEOUT_MS;
    expect(resolveS3TimeoutConfig().throwOnRequestTimeout).toBe(true);
  });
});

describe("buildContentDisposition", () => {
  it("geeft alleen het type zonder bestandsnaam", () => {
    expect(buildContentDisposition({ type: "inline" })).toBe("inline");
    expect(buildContentDisposition({ type: "attachment" })).toBe("attachment");
  });

  it("saneert de bestandsnaam tegen header-injectie/traversal", () => {
    expect(buildContentDisposition({ type: "attachment", filename: "diploma.pdf" })).toBe(
      'attachment; filename="diploma.pdf"',
    );
    const value = buildContentDisposition({ type: "inline", filename: '../e"vil\r\n.pdf' });
    expect(value).not.toMatch(/[\r\n]/); // geen header-splitsing
    expect(value).toBe('inline; filename=".._e_vil_.pdf"'); // ingesloten quote/CRLF/slash gesaneerd
  });
});

describe("resolveSseParams (S3 encryption-at-rest)", () => {
  const originalSse = process.env.STORAGE_S3_SSE;
  const originalKey = process.env.STORAGE_S3_SSE_KMS_KEY_ID;
  afterAll(() => {
    if (originalSse === undefined) delete process.env.STORAGE_S3_SSE;
    else process.env.STORAGE_S3_SSE = originalSse;
    if (originalKey === undefined) delete process.env.STORAGE_S3_SSE_KMS_KEY_ID;
    else process.env.STORAGE_S3_SSE_KMS_KEY_ID = originalKey;
  });

  it("versleutelt default met SSE-S3 (AES256) als er niets gezet is", () => {
    delete process.env.STORAGE_S3_SSE;
    delete process.env.STORAGE_S3_SSE_KMS_KEY_ID;
    expect(resolveSseParams()).toEqual({ ServerSideEncryption: "AES256" });
  });

  it("valt bij een onbekende waarde veilig terug op AES256 (nooit onversleuteld)", () => {
    process.env.STORAGE_S3_SSE = "rommel";
    expect(resolveSseParams()).toEqual({ ServerSideEncryption: "AES256" });
  });

  it("gebruikt SSE-KMS met de door AWS beheerde sleutel als er geen key-id is", () => {
    process.env.STORAGE_S3_SSE = "aws:kms";
    delete process.env.STORAGE_S3_SSE_KMS_KEY_ID;
    expect(resolveSseParams()).toEqual({ ServerSideEncryption: "aws:kms" });
  });

  it("gebruikt SSE-KMS met een eigen key-id als die gezet is", () => {
    process.env.STORAGE_S3_SSE = "aws:kms";
    process.env.STORAGE_S3_SSE_KMS_KEY_ID = "arn:aws:kms:eu-west-1:123:key/abc";
    expect(resolveSseParams()).toEqual({
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: "arn:aws:kms:eu-west-1:123:key/abc",
    });
  });

  it("laat de SSE-header bewust weg bij 'none' (S3-compatibele opslag zonder SSE)", () => {
    process.env.STORAGE_S3_SSE = "none";
    expect(resolveSseParams()).toEqual({});
  });

  it("resolveExpectedSse leidt de verwachte modus af voor de zelftest-verificatie", () => {
    delete process.env.STORAGE_S3_SSE;
    expect(resolveExpectedSse()).toBe("AES256");
    process.env.STORAGE_S3_SSE = "aws:kms";
    expect(resolveExpectedSse()).toBe("aws:kms");
    process.env.STORAGE_S3_SSE = "none";
    expect(resolveExpectedSse()).toBe("none");
  });
});
