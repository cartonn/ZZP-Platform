// E-mailkanaal-abstractie (PLATFORM_OVERHAUL.md §3 punt 5). Dezelfde service-grens als
// StorageDriver (lokaal/S3), DiplomaVerifier (mock/duo), BigVerifier (mock/bigregister):
// een interface + een noop-implementatie als veilige standaard + twee echte drivers:
//   - smtp   → nodemailer (lazy geladen, zoals de S3-driver @aws-sdk), voor eigen SMTP-relays.
//   - resend → HTTP-API (Resend) via fetch, géén SDK-dependency. Nodig omdat veel PaaS-hosts
//              (o.a. Railway) uitgaande SMTP-poorten (25/465/587) blokkeren; een HTTP-API is dan
//              de enige route die e-mail daadwerkelijk aflevert.
// EMAIL_DRIVER bepaalt welke wordt geladen. De credentials + productie-onboarding (DNS/SPF/DKIM)
// blijven mensenwerk — de code is hierop voorbereid.

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
}

/** De Resend-variabelen die voor verzending aanwezig moeten zijn. */
const RESEND_REQUIRED = ["RESEND_API_KEY", "EMAIL_FROM"] as const;

/**
 * Echte verzending via de Resend HTTP-API (POST https://api.resend.com/emails). Praat via `fetch`
 * met de REST-API — géén SDK-dependency, net als de Upstash-rate-limit-adapter. Activeer met
 * EMAIL_DRIVER=resend + RESEND_API_KEY + EMAIL_FROM. Werkt op hosts die uitgaande SMTP blokkeren.
 */
class ResendMailSender implements MailSender {
  private readonly endpoint = "https://api.resend.com/emails";

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

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

    const res = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

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
}

/**
 * Of er een kanaal is dat e-mail daadwerkelijk aflevert (EMAIL_DRIVER=smtp of resend). Taken waarvan
 * e-mail het enige effect is (zoals de notificatie-digest) horen zonder echt kanaal over te
 * slaan, zodat hun voortgangsmarkering niet wordt gezet terwijl er niets is verzonden.
 */
export function isMailDeliveryConfigured(): boolean {
  const driver = process.env.EMAIL_DRIVER ?? "noop";
  return driver === "smtp" || driver === "resend";
}

let cached: MailSender | null = null;

/** Geeft de geconfigureerde MailSender-instantie terug (singleton). */
export function getMailSender(): MailSender {
  if (cached) return cached;
  const driver = process.env.EMAIL_DRIVER ?? "noop";
  if (driver === "smtp") cached = new SmtpMailSender();
  else if (driver === "resend") cached = new ResendMailSender();
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
