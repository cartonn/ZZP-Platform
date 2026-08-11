// E-mailkanaal-abstractie (PLATFORM_OVERHAUL.md §3 punt 5). Dezelfde service-grens als
// StorageDriver (lokaal/S3), DiplomaVerifier (mock/duo), BigVerifier (mock/bigregister):
// een interface + een noop-implementatie als veilige standaard + vier echte drivers:
//   - smtp     → nodemailer (lazy geladen, zoals de S3-driver @aws-sdk), voor eigen SMTP-relays.
//   - resend   → HTTP-API (Resend) via fetch, géén SDK-dependency. Nodig omdat veel PaaS-hosts
//                (o.a. Railway) uitgaande SMTP-poorten (25/465/587) blokkeren; een HTTP-API is dan
//                de enige route die e-mail daadwerkelijk aflevert.
//   - postmark → HTTP-API (Postmark) via fetch, géén SDK-dependency. Tweede Railway-proof
//                HTTP-keuze naast Resend; sommige domeinen/DPA's/deliverability-profielen passen
//                beter bij Postmark. Zelfde seam, zelfde fail-open-vrije foutafhandeling.
//   - ses      → Amazon SES v2 HTTP-API via fetch + eigen SigV4-ondertekening (aws-sigv4.ts), géén
//                @aws-sdk-dependency. Railway-proof (HTTPS) en met een EU-regio (eu-west-1/eu-central-1)
//                AVG-vriendelijker dan Resend/Postmark (VS) — de natuurlijke keuze voor dit platform.
// EMAIL_DRIVER bepaalt welke wordt geladen. De credentials + productie-onboarding (DNS/SPF/DKIM)
// blijven mensenwerk — de code is hierop voorbereid.

import { signAwsV4 } from "@/lib/services/aws-sigv4";
import { fetchWithTimeout, resolveHttpTimeoutMs } from "@/lib/services/fetch-timeout";
import {
  recordMailDeliverySuccess,
  recordMailDeliveryFailure,
} from "@/lib/observability/mail-delivery-heartbeat";

export interface MailMessage {
  /** Ontvanger, bv. "jan@voorbeeld.nl" of "Jan Jansen <jan@voorbeeld.nl>". */
  to: string;
  subject: string;
  /** Platte-tekst variant (verplicht als fallback). */
  text: string;
  /** Optioneel HTML-lichaam. */
  html?: string;
}

export interface MailSender {
  send(message: MailMessage): Promise<void>;
  /**
   * READ-ONLY connectiviteitscontrole: bewijst dat het kanaal bereikbaar is en de credentials geldig
   * zijn ZONDER een e-mail te versturen (Resend: authenticated GET /domains; SMTP: transporter.verify()).
   * Resolvet bij bereikbaar + geldige auth, werpt bij een HTTP-/netwerk-/auth-fout (bij Resend een
   * `MailConnectivityError` met een bewust veilig bericht: provider + HTTP-status, nooit de sleutel).
   * Hierdoor kan mail meedraaien in de go-live-sweep (§11) — anders dan de losse `send`-zelftest die
   * een echte mail naar een persoon stuurt. De `noop`-standaard heeft niets te controleren en resolvet.
   */
  checkConnectivity(): Promise<void>;
}

/**
 * Fout uit een mail-connectiviteitscontrole (`checkConnectivity`). Draagt een bewust veilig opgesteld
 * bericht (provider-naam + HTTP-status) dat we mogen tonen — nooit een rauw bericht dat een
 * endpoint/API-sleutel zou kunnen bevatten. Parity met `BillingConnectivityError`.
 */
export class MailConnectivityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailConnectivityError";
  }
}

/** Doet niets (standaard in dev/test). Logt alleen naar de console buiten testomgevingen. */
class NoopMailSender implements MailSender {
  async send(message: MailMessage): Promise<void> {
    if (process.env.NODE_ENV === "test") return;
    // In productie géén adres/onderwerp loggen: e-mailadressen zijn persoonsgegevens en horen
    // niet in hosting-logs (security-review M-3). Dev blijft verbose voor debuggen.
    if (process.env.NODE_ENV === "production") {
      console.log(
        "[mail:noop] e-mail overgeslagen — geen mailkanaal geconfigureerd (EMAIL_DRIVER).",
      );
      return;
    }
    console.log(`[mail:noop] To: ${message.to} | Subject: ${message.subject}`);
  }

  async checkConnectivity(): Promise<void> {
    // Geen kanaal geconfigureerd — niets externs om te controleren. De zelftest roept dit niet aan
    // wanneer de driver op `noop` staat (dan: "niets getest"); we resolven veilig voor volledigheid.
  }
}

/** De SMTP-variabelen die voor verzending aanwezig moeten zijn. */
const SMTP_REQUIRED = [
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "EMAIL_SMTP_USER",
  "EMAIL_SMTP_PASS",
  "EMAIL_FROM",
] as const;

/**
 * Echte SMTP-verzending via nodemailer (lazy geladen). Activeer met EMAIL_DRIVER=smtp en de
 * EMAIL_SMTP_*-variabelen (+ EMAIL_FROM). Poort 465 → impliciet TLS (secure), anders STARTTLS.
 * De transporter wordt eenmalig opgezet en hergebruikt.
 */
class SmtpMailSender implements MailSender {
  private transporter: import("nodemailer").Transporter | null = null;
  private from = "";

  private async ensureTransporter(): Promise<import("nodemailer").Transporter> {
    if (this.transporter) return this.transporter;

    const missing = SMTP_REQUIRED.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(
        `SMTP-mailkanaal is niet geconfigureerd. Ontbrekende omgevingsvariabelen: ${missing.join(", ")}. ` +
          "Zie .env.example voor instructies. Productie-onboarding = mensenwerk.",
      );
    }

    const port = Number(process.env.EMAIL_SMTP_PORT);
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(`Ongeldige EMAIL_SMTP_PORT: "${process.env.EMAIL_SMTP_PORT}".`);
    }

    const nodemailer = await import("nodemailer");
    this.from = process.env.EMAIL_FROM!;
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port,
      secure: port === 465, // 465 = impliciete TLS; 587/25 = STARTTLS
      auth: { user: process.env.EMAIL_SMTP_USER, pass: process.env.EMAIL_SMTP_PASS },
    });
    return this.transporter;
  }

  async send(message: MailMessage): Promise<void> {
    const transporter = await this.ensureTransporter();
    await transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }

  async checkConnectivity(): Promise<void> {
    // `verify()` opent de verbinding, doet EHLO en AUTH (met de opgegeven credentials) en sluit weer —
    // zonder een bericht te versturen. Bewijst dus bereikbaarheid + geldige inloggegevens read-only.
    const transporter = await this.ensureTransporter();
    await transporter.verify();
  }
}

/** De Resend-variabelen die voor verzending aanwezig moeten zijn. */
const RESEND_REQUIRED = ["RESEND_API_KEY", "EMAIL_FROM"] as const;

/**
 * Echte verzending via de Resend HTTP-API (POST https://api.resend.com/emails). Praat via `fetch`
 * met de REST-API — géén SDK-dependency, net als de Upstash-rate-limit-adapter. Activeer met
 * EMAIL_DRIVER=resend + RESEND_API_KEY + EMAIL_FROM. Werkt op hosts die uitgaande SMTP blokkeren.
 */
export class ResendMailSender implements MailSender {
  private readonly endpoint = "https://api.resend.com/emails";
  // Read-only endpoint voor de connectiviteitscontrole: authenticated GET dat de sleutel valideert
  // zonder iets te versturen of te muteren.
  private readonly connectivityEndpoint = "https://api.resend.com/domains";

  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = resolveHttpTimeoutMs(process.env.EMAIL_HTTP_TIMEOUT_MS),
  ) {}

  async send(message: MailMessage): Promise<void> {
    const missing = RESEND_REQUIRED.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(
        `Resend-mailkanaal is niet geconfigureerd. Ontbrekende omgevingsvariabelen: ${missing.join(", ")}. ` +
          "Zie .env.example voor instructies. Productie-onboarding (domeinverificatie) = mensenwerk.",
      );
    }

    // Resend eist ten minste één van html/text; `text` is in ons contract verplicht, dus altijd aanwezig.
    const body: Record<string, unknown> = {
      from: process.env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
    };
    if (message.html) body.html = message.html;

    const res = await fetchWithTimeout(
      this.endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Resend" },
    );

    if (!res.ok) {
      // De responsbody kan een leesbare Resend-fout bevatten; nooit het adres/onderwerp loggen (PII).
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        // negeer: de status alleen is voldoende signaal
      }
      throw new Error(
        `Resend: e-mail versturen mislukte (status ${res.status})${detail ? ` — ${detail}` : ""}.`,
      );
    }
  }

  async checkConnectivity(): Promise<void> {
    // Alleen de sleutel is nodig voor een auth-controle; EMAIL_FROM (domeinverificatie) is pas bij het
    // daadwerkelijk versturen relevant. Ontbreekt de sleutel, dan is er niets te controleren.
    if (!process.env.RESEND_API_KEY) {
      throw new MailConnectivityError(
        "Resend: geen API-sleutel geconfigureerd (RESEND_API_KEY ontbreekt).",
      );
    }

    const res = await fetchWithTimeout(
      this.connectivityEndpoint,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Resend" },
    );

    if (!res.ok) {
      // Alleen de HTTP-status tonen — nooit de responsbody (kan endpoint-/accountdetails bevatten).
      throw new MailConnectivityError(
        `Resend: connectiviteitscontrole faalde (status ${res.status}).`,
      );
    }
  }
}

/** De Postmark-variabelen die voor verzending aanwezig moeten zijn. */
const POSTMARK_REQUIRED = ["POSTMARK_SERVER_TOKEN", "EMAIL_FROM"] as const;

/**
 * Echte verzending via de Postmark HTTP-API (POST https://api.postmarkapp.com/email). Praat via
 * `fetch` met de REST-API — géén SDK-dependency, net als de Resend-adapter. Activeer met
 * EMAIL_DRIVER=postmark + POSTMARK_SERVER_TOKEN + EMAIL_FROM. Werkt op hosts die uitgaande SMTP
 * blokkeren (Railway). Authenticatie via de `X-Postmark-Server-Token`-header (server-token, niet de
 * account-token). Optioneel `POSTMARK_MESSAGE_STREAM` (default "outbound").
 */
export class PostmarkMailSender implements MailSender {
  private readonly endpoint = "https://api.postmarkapp.com/email";
  // Read-only endpoint voor de connectiviteitscontrole: authenticated GET dat het server-token
  // valideert zonder iets te versturen of te muteren.
  private readonly connectivityEndpoint = "https://api.postmarkapp.com/server";

  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = resolveHttpTimeoutMs(process.env.EMAIL_HTTP_TIMEOUT_MS),
  ) {}

  async send(message: MailMessage): Promise<void> {
    const missing = POSTMARK_REQUIRED.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(
        `Postmark-mailkanaal is niet geconfigureerd. Ontbrekende omgevingsvariabelen: ${missing.join(", ")}. ` +
          "Zie .env.example voor instructies. Productie-onboarding (domeinverificatie) = mensenwerk.",
      );
    }

    // Postmark eist ten minste één van HtmlBody/TextBody; `text` is in ons contract verplicht.
    const body: Record<string, unknown> = {
      From: process.env.EMAIL_FROM,
      To: message.to,
      Subject: message.subject,
      TextBody: message.text,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || "outbound",
    };
    if (message.html) body.HtmlBody = message.html;

    const res = await fetchWithTimeout(
      this.endpoint,
      {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN!,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Postmark" },
    );

    if (!res.ok) {
      // De responsbody kan een leesbare Postmark-fout bevatten; nooit het adres/onderwerp loggen (PII).
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        // negeer: de status alleen is voldoende signaal
      }
      throw new Error(
        `Postmark: e-mail versturen mislukte (status ${res.status})${detail ? ` — ${detail}` : ""}.`,
      );
    }
  }

  async checkConnectivity(): Promise<void> {
    // Alleen het server-token is nodig voor een auth-controle; EMAIL_FROM (domeinverificatie) is pas
    // bij het daadwerkelijk versturen relevant. Ontbreekt het token, dan is er niets te controleren.
    if (!process.env.POSTMARK_SERVER_TOKEN) {
      throw new MailConnectivityError(
        "Postmark: geen server-token geconfigureerd (POSTMARK_SERVER_TOKEN ontbreekt).",
      );
    }

    const res = await fetchWithTimeout(
      this.connectivityEndpoint,
      {
        method: "GET",
        headers: {
          "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN,
          Accept: "application/json",
        },
      },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Postmark" },
    );

    if (!res.ok) {
      // Alleen de HTTP-status tonen — nooit de responsbody (kan endpoint-/accountdetails bevatten).
      throw new MailConnectivityError(
        `Postmark: connectiviteitscontrole faalde (status ${res.status}).`,
      );
    }
  }
}

/** De SES-variabelen die voor verzending aanwezig moeten zijn (naast de credentials, zie hieronder). */
const SES_REQUIRED = ["SES_REGION", "EMAIL_FROM"] as const;

/**
 * Lost de AWS-credentials voor SES op: bij voorkeur de SES-specifieke sleutels (least privilege — een
 * eigen IAM-gebruiker met alléén `ses:SendEmail`/`ses:GetAccount`), met een veilige terugval op de
 * generieke `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (dezelfde die de S3-opslag gebruikt) voor
 * setups met één AWS-account. Geeft `null` als een van beide ontbreekt.
 */
function resolveSesCredentials(): { accessKeyId: string; secretAccessKey: string } | null {
  const accessKeyId = process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return { accessKeyId, secretAccessKey };
}

/**
 * Echte verzending via de Amazon SES v2 HTTP-API (POST /v2/email/outbound-emails). Praat via `fetch`
 * met de REST-API + eigen SigV4-ondertekening (`aws-sigv4.ts`) — géén `@aws-sdk`-dependency, net als de
 * Resend/Postmark-adapters. Activeer met EMAIL_DRIVER=ses + SES_REGION (EU-regio, bv. eu-west-1) +
 * credentials + EMAIL_FROM. Werkt op hosts die uitgaande SMTP blokkeren (Railway) en is voor een
 * Nederlands platform met gevoelige gegevens AVG-vriendelijker dan Resend/Postmark (EU-datalocatie).
 */
export class SesMailSender implements MailSender {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = resolveHttpTimeoutMs(process.env.EMAIL_HTTP_TIMEOUT_MS),
  ) {}

  private endpoint(region: string): string {
    return `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;
  }

  private host(region: string): string {
    return `email.${region}.amazonaws.com`;
  }

  async send(message: MailMessage): Promise<void> {
    const missing = SES_REQUIRED.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(
        `SES-mailkanaal is niet geconfigureerd. Ontbrekende omgevingsvariabelen: ${missing.join(", ")}. ` +
          "Zie .env.example voor instructies. Productie-onboarding (domeinverificatie) = mensenwerk.",
      );
    }
    const creds = resolveSesCredentials();
    if (!creds) {
      throw new Error(
        "SES-mailkanaal is niet geconfigureerd. Ontbrekende credentials: SES_ACCESS_KEY_ID/" +
          "SES_SECRET_ACCESS_KEY (of AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY).",
      );
    }

    const region = process.env.SES_REGION!;
    const bodyContent: Record<string, unknown> = {
      Subject: { Data: message.subject, Charset: "UTF-8" },
      Body: { Text: { Data: message.text, Charset: "UTF-8" } },
    };
    if (message.html) {
      (bodyContent.Body as Record<string, unknown>).Html = { Data: message.html, Charset: "UTF-8" };
    }
    const payload = JSON.stringify({
      FromEmailAddress: process.env.EMAIL_FROM,
      Destination: { ToAddresses: [message.to] },
      Content: { Simple: bodyContent },
    });

    const signed = await signAwsV4({
      method: "POST",
      host: this.host(region),
      path: "/v2/email/outbound-emails",
      body: payload,
      region,
      service: "ses",
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
      date: new Date(),
      extraHeaders: { "Content-Type": "application/json" },
    });

    const res = await fetchWithTimeout(
      this.endpoint(region),
      { method: "POST", headers: signed.headers, body: payload },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "SES" },
    );

    if (!res.ok) {
      // De responsbody kan een leesbare SES-fout bevatten; nooit het adres/onderwerp loggen (PII).
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        // negeer: de status alleen is voldoende signaal
      }
      throw new Error(
        `SES: e-mail versturen mislukte (status ${res.status})${detail ? ` — ${detail}` : ""}.`,
      );
    }
  }

  async checkConnectivity(): Promise<void> {
    // Read-only round-trip: authenticated GET /v2/email/account bewijst bereikbaarheid + geldige
    // credentials zonder een mail te versturen. EMAIL_FROM (domeinverificatie) is pas bij het
    // daadwerkelijk versturen relevant.
    const region = process.env.SES_REGION;
    if (!region) {
      throw new MailConnectivityError("SES: geen regio geconfigureerd (SES_REGION ontbreekt).");
    }
    const creds = resolveSesCredentials();
    if (!creds) {
      throw new MailConnectivityError(
        "SES: geen credentials geconfigureerd (SES_ACCESS_KEY_ID/SES_SECRET_ACCESS_KEY of AWS_*).",
      );
    }

    const signed = await signAwsV4({
      method: "GET",
      host: this.host(region),
      path: "/v2/email/account",
      body: "",
      region,
      service: "ses",
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
      date: new Date(),
    });

    const res = await fetchWithTimeout(
      `https://${this.host(region)}/v2/email/account`,
      { method: "GET", headers: signed.headers },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "SES" },
    );

    if (!res.ok) {
      // Alleen de HTTP-status tonen — nooit de responsbody (kan endpoint-/accountdetails bevatten).
      throw new MailConnectivityError(
        `SES: connectiviteitscontrole faalde (status ${res.status}).`,
      );
    }
  }
}

/**
 * Of er een kanaal is dat e-mail daadwerkelijk aflevert (EMAIL_DRIVER=smtp, resend, postmark of ses).
 * Taken waarvan e-mail het enige effect is (zoals de notificatie-digest) horen zonder echt kanaal over
 * te slaan, zodat hun voortgangsmarkering niet wordt gezet terwijl er niets is verzonden.
 */
export function isMailDeliveryConfigured(): boolean {
  const driver = process.env.EMAIL_DRIVER ?? "noop";
  return driver === "smtp" || driver === "resend" || driver === "postmark" || driver === "ses";
}

/**
 * Decorator die de UITKOMST van elke échte verzending registreert in de mail-aflever-heartbeat
 * (dead-man's-switch, src/lib/observability/mail-delivery-heartbeat.ts) zonder het verzendgedrag te
 * veranderen: bij succes markeert 'ie het kanaal als afleverend, bij een fout telt 'ie de
 * opeenvolgende-mislukkingen-teller op en gooit de originele fout door (zodat de oproeper 'm nog steeds
 * PII-veilig kan loggen). De registratie is fail-open — een DB-storing in de heartbeat mag een
 * geslaagde verzending niet alsnog laten falen, noch een echte verzendfout maskeren. Wordt uitsluitend
 * om een echte driver gewikkeld; de noop-driver levert niets af en registreert dus niets.
 *
 * `checkConnectivity()` gaat ongewijzigd door: dat is een read-only controle, geen aflevering.
 */
export class RecordingMailSender implements MailSender {
  constructor(
    readonly inner: MailSender,
    private readonly driver: string,
  ) {}

  async send(message: MailMessage): Promise<void> {
    try {
      await this.inner.send(message);
    } catch (error) {
      await recordMailDeliveryFailure(this.driver);
      throw error;
    }
    await recordMailDeliverySuccess(this.driver);
  }

  checkConnectivity(): Promise<void> {
    return this.inner.checkConnectivity();
  }
}

let cached: MailSender | null = null;

/** Geeft de geconfigureerde MailSender-instantie terug (singleton). */
export function getMailSender(): MailSender {
  if (cached) return cached;
  const driver = process.env.EMAIL_DRIVER ?? "noop";
  // Echte drivers worden in de aflever-heartbeat gewikkeld (uitkomst-registratie); de noop-driver
  // levert niets af en blijft kaal, zodat de heartbeat geen "geslaagde" verzending registreert die er
  // in werkelijkheid niet was.
  if (driver === "smtp") cached = new RecordingMailSender(new SmtpMailSender(), driver);
  else if (driver === "resend") cached = new RecordingMailSender(new ResendMailSender(), driver);
  else if (driver === "postmark")
    cached = new RecordingMailSender(new PostmarkMailSender(), driver);
  else if (driver === "ses") cached = new RecordingMailSender(new SesMailSender(), driver);
  else cached = new NoopMailSender();
  return cached;
}

/** Vervangt de singleton — uitsluitend voor tests. */
export function _setMailSenderForTest(sender: MailSender): void {
  cached = sender;
}

/** Herstelt de singleton — uitsluitend voor tests. */
export function _resetMailSender(): void {
  cached = null;
}
