// E-mailkanaal-abstractie (PLATFORM_OVERHAUL.md §3 punt 5). Dezelfde service-grens als
// StorageDriver (lokaal/S3), DiplomaVerifier (mock/duo), BigVerifier (mock/bigregister):
// een interface + een noop-implementatie als veilige standaard + een echte SMTP-implementatie.
// EMAIL_DRIVER bepaalt welke wordt geladen. nodemailer wordt lazy geladen (zoals de S3-driver
// @aws-sdk), zodat de bundel licht blijft als SMTP niet wordt gebruikt. De SMTP-credentials +
// productie-onboarding (DNS/SPF/DKIM) blijven mensenwerk — de code is hierop voorbereid.

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

/**
 * Of er een kanaal is dat e-mail daadwerkelijk aflevert (EMAIL_DRIVER=smtp). Taken waarvan
 * e-mail het enige effect is (zoals de notificatie-digest) horen zonder echt kanaal over te
 * slaan, zodat hun voortgangsmarkering niet wordt gezet terwijl er niets is verzonden.
 */
export function isMailDeliveryConfigured(): boolean {
  return (process.env.EMAIL_DRIVER ?? "noop") === "smtp";
}

let cached: MailSender | null = null;

/** Geeft de geconfigureerde MailSender-instantie terug (singleton). */
export function getMailSender(): MailSender {
  if (cached) return cached;
  const driver = process.env.EMAIL_DRIVER ?? "noop";
  cached = driver === "smtp" ? new SmtpMailSender() : new NoopMailSender();
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
