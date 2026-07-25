// Pure AWS Signature Version 4 ondertekening (geen SDK-dependency), gebruikt door de SES-e-maildriver
// (`SesMailSender` in mail-sender.ts). Zelfde filosofie als de Resend/Postmark/Upstash-adapters: praat
// rechtstreeks via `fetch` met de AWS-REST-API i.p.v. de zware `@aws-sdk`-pakketten te laden.
//
// De implementatie volgt het gedocumenteerde SigV4-proces
// (https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html) en is deterministisch: alle
// tijd-/willekeur-afhankelijke invoer wordt als parameter meegegeven (`date`), zodat de signer tegen
// AWS' officiële testvector te controleren is (zie aws-sigv4.test.ts). Er worden nooit secrets gelogd.

import { createHash, createHmac } from "node:crypto";

const ALGORITHM = "AWS4-HMAC-SHA256";

export interface SigV4Input {
  /** HTTP-methode, hoofdletters (bv. "POST", "GET"). */
  method: string;
  /** Host-header zonder schema (bv. "email.eu-west-1.amazonaws.com"). */
  host: string;
  /** Canonieke pad, met leidende slash (bv. "/v2/email/outbound-emails"). */
  path: string;
  /** Query-string zonder leidend "?" (bv. "Action=ListUsers&Version=2010-05-08"); leeg indien geen. */
  query?: string;
  /** Ruwe request-body (leeg bij GET). */
  body?: string;
  /** AWS-regio (bv. "eu-west-1"). */
  region: string;
  /** AWS-service-naam voor de signing scope (bv. "ses", "iam"). */
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Optioneel STS-sessietoken (voegt x-amz-security-token toe aan de ondertekende headers). */
  sessionToken?: string;
  /** Tijdstip van de request — expliciet meegegeven zodat de signer deterministisch/testbaar is. */
  date: Date;
  /**
   * Extra headers die mee-ondertekend moeten worden (bv. Content-Type). Namen worden lowercased;
   * host en x-amz-date worden altijd zelf toegevoegd en hoeven hier niet mee.
   */
  extraHeaders?: Record<string, string>;
}

export interface SigV4Result {
  /** De volledige Authorization-headerwaarde. */
  authorization: string;
  /** De x-amz-date-header (ISO basic, YYYYMMDDTHHMMSSZ) die mee-ondertekend is en meegestuurd moet worden. */
  amzDate: string;
  /** Alle headers die op de request gezet moeten worden (incl. host, x-amz-date, evt. security-token). */
  headers: Record<string, string>;
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

/** YYYYMMDDTHHMMSSZ (ISO 8601 basic, UTC) — het formaat dat x-amz-date en de StringToSign vereisen. */
function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/**
 * Ondertekent een AWS-request volgens SigV4 en geeft de te zetten headers terug. Pure functie: geen
 * netwerk, geen globale tijd — de aanroeper levert `date`. Werpt nooit; verwacht geldige invoer.
 */
export function signAwsV4(input: SigV4Input): SigV4Result {
  const amzDate = toAmzDate(input.date); // 20150830T123600Z
  const dateStamp = amzDate.slice(0, 8); // 20150830

  const payload = input.body ?? "";
  const payloadHash = sha256Hex(payload);

  // Headers die mee-ondertekend worden: altijd host + x-amz-date, plus eventuele extra headers en
  // (optioneel) het sessietoken. Namen lowercased, waarden getrimd, gesorteerd op naam.
  const headerMap: Record<string, string> = {
    host: input.host,
    "x-amz-date": amzDate,
  };
  for (const [k, v] of Object.entries(input.extraHeaders ?? {})) {
    headerMap[k.toLowerCase()] = v.trim();
  }
  if (input.sessionToken) {
    headerMap["x-amz-security-token"] = input.sessionToken;
  }

  const sortedHeaderNames = Object.keys(headerMap).sort();
  const canonicalHeaders =
    sortedHeaderNames.map((name) => `${name}:${headerMap[name]}`).join("\n") + "\n";
  const signedHeaders = sortedHeaderNames.join(";");

  const canonicalRequest = [
    input.method.toUpperCase(),
    input.path,
    input.query ?? "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = [ALGORITHM, amzDate, credentialScope, sha256Hex(canonicalRequest)].join(
    "\n",
  );

  // Afgeleide ondertekeningssleutel (HMAC-keten). De secret verlaat deze functie nooit.
  const kDate = hmac(`AWS4${input.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, input.region);
  const kService = hmac(kRegion, input.service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization =
    `${ALGORITHM} Credential=${input.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    authorization,
    amzDate,
    headers: { ...headerMap, Authorization: authorization },
  };
}
