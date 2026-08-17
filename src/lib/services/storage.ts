// Storage-abstractie (CLAUDE.md regel 4). Documenten zijn standaard privé en gaan
// NOOIT in git of op een publiek pad. Lokaal: .gitignore'de map. Productie: S3
// (implementatie in Sessie 10). Upload wordt altijd gevalideerd (type + grootte).

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

// Upload-ceiling. Bron van waarheid voor zowel validateUpload als de server-action-body-limiet in
// next.config.mjs (experimental.serverActions.bodySizeLimit). Blijven die twee uit de pas lopen —
// bodySizeLimit lager dan deze waarde — dan weigert Next.js een grote upload stil vóór validateUpload
// draait. upload-body-limit.test.ts bewaakt die drift.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Alleen-afbeelding subset. Voor upload-doelen die géén PDF horen te accepteren (bv. het bedrijfslogo,
 * dat via de un-sandboxed /api/media-route aan élke ingelogde gebruiker inline wordt geserveerd). Zonder
 * een per-doel-allowlist valideert een logo-upload tegen de brede `ALLOWED_MIME_TYPES` en passeert een
 * echte PDF de server-side controle — terwijl alleen het client-side `accept`-attribuut hem tegenhoudt
 * (schending van CLAUDE.md regel 1: server-side is de waarheid). CWE-434 / OWASP A04 (insecure design).
 */
export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Leesbare labels per MIME-type voor de validatie-foutmelding (geen rauw MIME naar de gebruiker). */
const MIME_LABEL: Record<AllowedMimeType, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WEBP",
};

/** "PDF, PNG, JPEG, WEBP" — de toegestane types als leesbare, komma-gescheiden lijst. */
function allowedLabels(allowed: readonly AllowedMimeType[]): string {
  return allowed.map((m) => MIME_LABEL[m]).join(", ");
}

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

/**
 * Valideert type + grootte vóór opslag. Werpt `UploadValidationError` bij afkeuring.
 * `allowed` beperkt de toegestane MIME-types voor dit specifieke doel (default: alle toegestane
 * types). Geef bv. `IMAGE_MIME_TYPES` mee voor een logo-upload die geen PDF hoort te accepteren.
 */
export function validateUpload(
  file: UploadCandidate,
  allowed: readonly AllowedMimeType[] = ALLOWED_MIME_TYPES,
): void {
  if (!file.filename?.trim()) {
    throw new UploadValidationError("Bestandsnaam ontbreekt.");
  }
  if (!allowed.includes(file.mimeType as AllowedMimeType)) {
    throw new UploadValidationError(
      `Bestandstype niet toegestaan: ${file.mimeType}. Toegestaan: ${allowedLabels(allowed)}.`,
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
 * `allowed` beperkt daarnaast de toegestane types voor dit doel: zo weigert een logo-upload een echte
 * PDF óók wanneer de client `application/pdf` eerlijk opgeeft (dan matcht de signatuur wél, maar valt
 * het type buiten de allowlist). Default: alle toegestane types (gedrag ongewijzigd voor documenten).
 */
export function assertContentMatchesMime(
  buffer: Buffer,
  declaredMime: string,
  allowed: readonly AllowedMimeType[] = ALLOWED_MIME_TYPES,
): void {
  const sniffed = sniffMimeType(buffer);
  if (sniffed === null || sniffed !== declaredMime || !allowed.includes(sniffed)) {
    throw new UploadValidationError(
      `De bestandsinhoud komt niet overeen met het opgegeven type. Upload een geldig bestand (${allowedLabels(
        allowed,
      )}).`,
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

/** Opties voor een kortlevende, ondertekende download-URL. */
export interface SignedUrlOptions {
  /** Geldigheidsduur in seconden. Wordt geklemd op [30, 3600]; default uit STORAGE_S3_URL_TTL of 300. */
  expiresInSeconds?: number;
  /** Forceer de Content-Type die de opslag teruggeeft (override van de object-metadata). */
  contentType?: string;
  /** Tonen in de browser (inline) of downloaden (attachment), met optionele bestandsnaam. */
  disposition?: { type: "inline" | "attachment"; filename?: string };
}

export const SIGNED_URL_TTL_MIN = 30;
export const SIGNED_URL_TTL_MAX = 3600;
export const SIGNED_URL_TTL_DEFAULT = 300;

/**
 * Bepaalt de TTL (seconden) voor een presigned URL: expliciete waarde > STORAGE_S3_URL_TTL > default,
 * altijd geklemd op [30, 3600]. Een ongeldige/lege env-waarde valt veilig terug op de default.
 */
export function resolveSignedUrlTtl(explicit?: number): number {
  const fromEnv = Number(process.env.STORAGE_S3_URL_TTL);
  const base =
    typeof explicit === "number" && Number.isFinite(explicit)
      ? explicit
      : Number.isFinite(fromEnv) && fromEnv > 0
        ? fromEnv
        : SIGNED_URL_TTL_DEFAULT;
  return Math.min(SIGNED_URL_TTL_MAX, Math.max(SIGNED_URL_TTL_MIN, Math.round(base)));
}

/**
 * Bouwt een veilige `Content-Disposition`-headerwaarde. De bestandsnaam wordt ontdaan van tekens
 * die de header (of een traversal) kunnen breken; ontbreekt een naam, dan alleen het type.
 */
export function buildContentDisposition(disposition: {
  type: "inline" | "attachment";
  filename?: string;
}): string {
  if (!disposition.filename) return disposition.type;
  const safe = disposition.filename.replace(/[^\w.\-]+/g, "_").slice(0, 200) || "bestand";
  return `${disposition.type}; filename="${safe}"`;
}

/**
 * Server-side-encryption-parameters voor een S3 `PutObjectCommand`. Gevoelige documenten (VOG,
 * diploma's, verzekering) moeten versleuteld op schijf staan (AVG-dataminimalisatie/beveiliging).
 * We zetten dit expliciet op elke upload i.p.v. te leunen op de bucket-default-encryptie: een
 * verkeerd geconfigureerde bucket zou anders stilzwijgend onversleuteld opslaan.
 *
 * - `STORAGE_S3_SSE` = `AES256` (default, SSE-S3, door S3 beheerde sleutels) of `aws:kms` (SSE-KMS).
 * - `STORAGE_S3_SSE_KMS_KEY_ID` (optioneel, alleen bij `aws:kms`): een eigen KMS-sleutel; leeg →
 *   de door AWS beheerde `aws/s3`-standaardsleutel.
 * - `STORAGE_S3_SSE=none` schakelt de expliciete header bewust uit (voor S3-compatibele opslag die
 *   de parameter niet accepteert; de bucket-default-encryptie blijft dan de enige laag).
 *
 * Puur/testbaar: leest env en geeft de exacte velden terug die aan de command worden meegegeven.
 */
export function resolveSseParams(): {
  ServerSideEncryption?: "AES256" | "aws:kms";
  SSEKMSKeyId?: string;
} {
  const raw = (process.env.STORAGE_S3_SSE ?? "AES256").trim().toLowerCase();
  if (raw === "none") return {};
  if (raw === "aws:kms" || raw === "kms") {
    const keyId = process.env.STORAGE_S3_SSE_KMS_KEY_ID?.trim();
    return {
      ServerSideEncryption: "aws:kms",
      ...(keyId ? { SSEKMSKeyId: keyId } : {}),
    };
  }
  // Alles anders (incl. de default en een onbekende waarde) → veilige SSE-S3-versleuteling.
  return { ServerSideEncryption: "AES256" };
}

/** De server-side-encryptie-modus die we verwachten terug te zien op een opgeslagen object. */
export type ExpectedSse = "AES256" | "aws:kms" | "none";

/**
 * Leidt uit de env af welke SSE-modus we op een object *verwachten* (voor de zelftest-verificatie).
 * `none` betekent dat encryptie-at-rest bewust niet expliciet wordt afgedwongen (dan valt er niets
 * te verifiëren). Puur/testbaar — deelt de bron van waarheid met `resolveSseParams`.
 */
export function resolveExpectedSse(): ExpectedSse {
  return resolveSseParams().ServerSideEncryption ?? "none";
}

/** Rapport over de server-side-encryptie-status van één object (voor de zelftest). */
export interface StorageEncryptionInfo {
  /**
   * Het door de opslag gerapporteerde SSE-algoritme (bv. "AES256" / "aws:kms"), of `null` wanneer het
   * object **onversleuteld** terugkwam — dan negeerde de opslag de ingestelde encryptie (AVG-risico).
   */
  serverSideEncryption: string | null;
}

export interface StorageDriver {
  put(key: string, data: Buffer, mimeType: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /**
   * Geeft een kortlevende, ondertekende GET-URL waarmee de client het object rechtstreeks bij de
   * opslag ophaalt (bespaart bandbreedte + geheugen op de app-server, productie-standaard voor S3).
   * Geeft `null` wanneer de driver geen presigning ondersteunt (lokale opslag) — de caller valt
   * dan terug op het streamen van de bytes via de server. Authz/audit blijven altijd server-side.
   */
  getSignedDownloadUrl(key: string, opts?: SignedUrlOptions): Promise<string | null>;
  /**
   * Optioneel: rapporteert de server-side-encryptie-status van een opgeslagen object. Alleen zinvol
   * voor object-opslag (S3) die dit terugmeldt; lokale opslag ondersteunt dit niet (methode ontbreekt).
   * Wordt gebruikt door de opslag-zelftest om te bevestigen dat gevoelige documenten écht versleuteld
   * op schijf staan i.p.v. te vertrouwen dat de opslag de SSE-instelling honoreert.
   */
  describeEncryption?(key: string): Promise<StorageEncryptionInfo>;
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

  // Lokale opslag kent geen presigning: de caller valt terug op streamen via de server.
  async getSignedDownloadUrl(): Promise<string | null> {
    return null;
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
      new lib.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: mimeType,
        // Encryptie-at-rest expliciet afdwingen (niet leunen op de bucket-default).
        ...resolveSseParams(),
      }),
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

  async describeEncryption(key: string): Promise<StorageEncryptionInfo> {
    const { client, bucket, lib } = await this.svc();
    const res = await client.send(new lib.HeadObjectCommand({ Bucket: bucket, Key: key }));
    // S3 (en compatibele stores die SSE honoreren) echoot het toegepaste algoritme in deze header.
    // Ontbreekt hij, dan staat het object onversleuteld op schijf — de zelftest markeert dat.
    return { serverSideEncryption: res.ServerSideEncryption ?? null };
  }

  async getSignedDownloadUrl(key: string, opts?: SignedUrlOptions): Promise<string | null> {
    const { client, bucket, lib } = await this.svc();
    // Lazy import zoals @aws-sdk/client-s3: houdt de bundel licht als S3 niet wordt gebruikt.
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const cmd = new lib.GetObjectCommand({
      Bucket: bucket,
      Key: key,
      // Forceer content-type + disposition via response-override-params zodat de browser het object
      // correct toont/downloadt, ongeacht de opgeslagen metadata.
      ...(opts?.contentType ? { ResponseContentType: opts.contentType } : {}),
      ...(opts?.disposition
        ? { ResponseContentDisposition: buildContentDisposition(opts.disposition) }
        : {}),
    });
    return getSignedUrl(client, cmd, { expiresIn: resolveSignedUrlTtl(opts?.expiresInSeconds) });
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
