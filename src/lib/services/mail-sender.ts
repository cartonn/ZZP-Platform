// E-mailkanaal-abstractie (PLATFORM_OVERHAUL.md §3 punt 5). Dezelfde service-grens als
// StorageDriver (lokaal/S3), DiplomaVerifier (mock/duo), BigVerifier (mock/bigregister):
// een interface + een noop-implementatie als veilige standaard + een stub voor productie-
// koppeling. EMAIL_DRIVER bepaalt welke wordt geladen. De echte SMTP-implementatie vereist
// een externe dependency (bijv. nodemailer) en productie-onboarding — dat is mensenwerk.

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
    if (process.env.NODE_ENV !== "test") {
      console.log(`[mail:noop] To: ${message.to} | Subject: ${message.subject}`);
    }
  }
}

/**
 * SMTP-kanaal — nog niet geïmplementeerd. Gooit een duidelijke foutmelding zodra het
 * systeem probeert te verzenden zonder de benodigde configuratie.
 *
 * Om dit in productie te activeren:
 *  1. Voeg nodemailer (of een alternatief) toe als dependency.
 *  2. Implementeer `send()` met de SMTP-configuratie hieronder.
 *  3. Stel EMAIL_DRIVER=smtp in samen met de SMTP-variabelen.
 */
class SmtpMailSender implements MailSender {
  async send(_message: MailMessage): Promise<void> {
    const required = ["EMAIL_SMTP_HOST", "EMAIL_SMTP_PORT", "EMAIL_SMTP_USER", "EMAIL_SMTP_PASS", "EMAIL_FROM"];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(
        `SMTP-mailkanaal is niet geconfigureerd. Ontbrekende omgevingsvariabelen: ${missing.join(", ")}. ` +
          "Zie .env.example voor instructies. Productie-onboarding = mensenwerk.",
      );
    }
    throw new Error(
      "SMTP-driver is geconfigureerd maar nog niet geïmplementeerd. " +
        "Voeg nodemailer (of een vergelijkbare bibliotheek) toe en implementeer SmtpMailSender.send().",
    );
  }
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
