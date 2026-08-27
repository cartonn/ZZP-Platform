// Mail-intake: een opdrachtgever mailt een dienstaanvraag naar het intake-adres van het
// platform; de webhook van de inbound-mailprovider (Postmark/SES) levert de mail hier af,
// waarna hij deterministisch wordt geparsed naar een concept-aanvraag in de reviewqueue
// (/opdrachten/mail-intake). Benchmark: planners die aanvragen handmatig overtypen — die stap
// vervalt, maar de opdrachtgever houdt menselijke controle: publiceren gaat altijd via de
// bestaande concept-opdracht-flow (plan-gating, DBA-check), nooit rechtstreeks vanuit e-mail.
//
// Dit bestand is puur (geen prisma/next) zodat parser, autorisatie en overgangen los
// unit-getest zijn. De webhook-route en de server actions leveren de I/O-keten
// (auth → rol → ownership → Zod → actie → audit, CLAUDE.md regel 2).

import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { MAIL_INTAKE_TRANSITIONS, type MailIntakeStatus, type WorkMode } from "@/lib/enums";

// Opslaggrenzen (dataminimalisatie, AVG): we bewaren alleen wat de reviewqueue nodig heeft.
export const MAIL_INTAKE_SUBJECT_MAX = 200;
export const MAIL_INTAKE_BODY_MAX = 10_000;

// ---------------------------------------------------------------------------
// Statusovergangen (CLAUDE.md regel 3)
// ---------------------------------------------------------------------------

export class MailIntakeTransitionError extends Error {
  constructor(from: MailIntakeStatus, to: MailIntakeStatus) {
    super(`Ongeldige mail-intake-overgang: ${from} → ${to}.`);
    this.name = "MailIntakeTransitionError";
  }
}

export function canMailIntakeTransition(from: MailIntakeStatus, to: MailIntakeStatus): boolean {
  return MAIL_INTAKE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertMailIntakeTransition(from: MailIntakeStatus, to: MailIntakeStatus): void {
  if (!canMailIntakeTransition(from, to)) {
    throw new MailIntakeTransitionError(from, to);
  }
}

// ---------------------------------------------------------------------------
// Webhook-autorisatie
// ---------------------------------------------------------------------------

/**
 * True als de Authorization-header het intake-secret draagt. Twee vormen, beide timing-safe
 * (parity met authorizeCron): `Bearer <secret>` (handmatig/curl) en `Basic base64(user:secret)` —
 * inbound-mailproviders zoals Postmark kunnen geen custom headers zetten, maar wél basic-auth-
 * credentials in de webhook-URL (https://intake:<secret>@host/...); de gebruikersnaam negeren we.
 * Zonder geconfigureerd secret altijd false (feature staat dan uit; halve activering bestaat niet).
 */
export function isAuthorizedMailIntakeHeader(header: string | null, secret: string): boolean {
  if (!secret) return false;
  const value = header ?? "";
  let provided = "";
  if (value.startsWith("Bearer ")) {
    provided = value.slice("Bearer ".length);
  } else if (value.startsWith("Basic ")) {
    const decoded = Buffer.from(value.slice("Basic ".length), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    provided = sep >= 0 ? decoded.slice(sep + 1) : "";
  }
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(secret, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Webhook-payload (Postmark-inbound-vorm; SES/Mailgun leveren dezelfde velden mappable aan)
// ---------------------------------------------------------------------------

export const mailIntakeWebhookSchema = z.object({
  /** Provider-MessageID — idempotentiesleutel bij webhook-retries. */
  MessageID: z.string().trim().min(1).max(200),
  From: z.string().optional(),
  FromFull: z.object({ Email: z.string().optional() }).optional(),
  To: z.string().optional(),
  ToFull: z.array(z.object({ Email: z.string().optional() })).optional(),
  Subject: z.string().optional(),
  TextBody: z.string().optional(),
  HtmlBody: z.string().optional(),
});
export type MailIntakeWebhookPayload = z.infer<typeof mailIntakeWebhookSchema>;

/**
 * Afzenderadres uit de payload, genormaliseerd naar lowercase (registratie slaat e-mail lowercase
 * op, dus dit matcht 1-op-1 op `User.email`). `FromFull.Email` heeft voorrang; anders wordt het
 * adres uit een `Naam <adres>`-From-header geplukt. Ongeldig/afwezig → null.
 */
export function mailIntakeSenderEmail(payload: MailIntakeWebhookPayload): string | null {
  return extractEmailAddress(payload.FromFull?.Email?.trim() || payload.From?.trim() || "");
}

/** "Naam <adres>" of kaal adres → gevalideerd lowercase-adres, anders null. */
function extractEmailAddress(raw: string): string | null {
  const bracketed = raw.match(/<([^<>\s]+@[^<>\s]+)>/);
  const candidate = (bracketed?.[1] ?? raw).trim().toLowerCase();
  return z.string().email().safeParse(candidate).success ? candidate : null;
}

// ---------------------------------------------------------------------------
// Per-bedrijf intake-alias (plus-adressering)
//
// Elk bedrijf kan een uniek alias-token krijgen; mail aan `local+<alias>@intake-domein`
// wordt dan aan dát bedrijf gekoppeld, ongeacht de afzender. Zo kan een aanvrager die
// zelf geen accounthouder is (bv. de planner van een zorginstelling) rechtstreeks mailen.
// Het token is een capability: deel het alleen met partijen die aanvragen mogen indienen;
// vernieuwen trekt het oude adres in. De reviewqueue blijft de menselijke poort.
// ---------------------------------------------------------------------------

/** Vorm van een geldig alias-token (lowercase hex uit generateMailIntakeAlias). */
export const MAIL_INTAKE_ALIAS_RE = /^[a-z0-9]{8,32}$/;

/** Nieuw, niet-raadbaar alias-token (20 hex-tekens ≈ 80 bits entropie). */
export function generateMailIntakeAlias(): string {
  return randomBytes(10).toString("hex");
}

/**
 * Alias-token uit de ontvangeradressen van de payload: het deel na de eerste `+` in de
 * local part (`aanvraag+<alias>@domein`). `ToFull` is gezaghebbend; `To` ("Naam <a@b>, c@d")
 * is de fallback. Eerste geldige token wint; geen (geldig) token → null.
 */
export function mailIntakeRecipientAlias(payload: MailIntakeWebhookPayload): string | null {
  const candidates: string[] = [];
  for (const entry of payload.ToFull ?? []) {
    if (entry.Email) candidates.push(entry.Email);
  }
  for (const part of (payload.To ?? "").split(",")) {
    if (part.trim()) candidates.push(part);
  }
  for (const raw of candidates) {
    const email = extractEmailAddress(raw);
    if (!email) continue;
    const local = email.slice(0, email.indexOf("@"));
    const plus = local.indexOf("+");
    if (plus < 0) continue;
    const token = local.slice(plus + 1);
    if (MAIL_INTAKE_ALIAS_RE.test(token)) return token;
  }
  return null;
}

/**
 * Volledig intake-adres voor een bedrijf: basisadres `local@domein` + alias →
 * `local+<alias>@domein`. Ongeldig basisadres → null (de UI toont dan alleen het token).
 */
export function formatMailIntakeAddress(baseAddress: string, alias: string): string | null {
  const at = baseAddress.indexOf("@");
  if (at <= 0 || at !== baseAddress.lastIndexOf("@") || at === baseAddress.length - 1) return null;
  const local = baseAddress.slice(0, at);
  const domain = baseAddress.slice(at + 1);
  if (local.includes("+") || /\s/.test(baseAddress)) return null;
  return `${local}+${alias}@${domain}`;
}

/** Grove HTML→tekst-fallback voor mails zonder TextBody: tags eruit, basisentiteiten terug. */
export function mailHtmlToText(html: string): string {
  return (
    html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      // &amp; als LAATSTE decoderen: eerder zou "&amp;lt;" via "&lt;" dubbel ontsnappen naar "<"
      // (CWE-116, CodeQL js/double-escaping).
      .replace(/&amp;/gi, "&")
      .replace(/[ \t]+/g, " ")
      .replace(/^ +| +$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// ---------------------------------------------------------------------------
// Deterministische parser (geen externe verwerker; server-side waarheid)
// ---------------------------------------------------------------------------

export interface ParsedMailIntake {
  title: string | null;
  description: string | null;
  location: string | null;
  rateMin: number | null;
  rateMax: number | null;
  startDate: Date | null;
  workMode: WorkMode | null;
}

type FieldKey = "title" | "location" | "rate" | "start" | "workMode" | "description";

// NL-labels die planners/zorginstellingen in aanvraagmails gebruiken; eerste treffer per veld wint.
const FIELD_LABELS: Record<FieldKey, readonly string[]> = {
  title: ["titel", "functie", "opdracht", "dienst", "rol", "vacature"],
  location: ["locatie", "plaats", "standplaats", "regio", "adres", "vestiging"],
  rate: ["tarief", "uurtarief", "tarief per uur", "uurloon"],
  start: ["start", "startdatum", "begindatum", "datum", "ingangsdatum"],
  workMode: ["werkwijze", "werkvorm", "waar"],
  description: ["omschrijving", "beschrijving", "toelichting", "details"],
};

const KEY_LINE = /^\s*([a-zà-ÿ][a-zà-ÿ' ]{1,30})\s*[:=]\s*(.*)$/i;

function fieldForLabel(label: string): FieldKey | null {
  const normalized = label.trim().toLowerCase();
  for (const [field, labels] of Object.entries(FIELD_LABELS) as [FieldKey, readonly string[]][]) {
    if (labels.includes(normalized)) return field;
  }
  return null;
}

/** "Re: Fwd: Aanvraag" → "Aanvraag". Leeg onderwerp → null. */
export function cleanMailSubject(subject: string | null | undefined): string | null {
  let s = (subject ?? "").trim();
  for (;;) {
    const stripped = s.replace(/^(re|fw|fwd|antw)\s*:\s*/i, "");
    if (stripped === s) break;
    s = stripped;
  }
  s = s.trim();
  return s.length > 0 ? s : null;
}

/**
 * Uurtarief-range uit vrije tekst: "€ 85", "85-95", "85 tot 95 euro". Eerste twee plausibele
 * getallen (1–1000, hele euro's) worden min/max; één getal → alleen min. Duizendtal-notatie
 * ("1.250") en jaartallen vallen buiten de plausibiliteitsgrens en worden genegeerd.
 */
export function parseRateRange(value: string): { rateMin: number | null; rateMax: number | null } {
  const tokens = value.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const amounts = tokens
    .map((t) => Math.round(Number.parseFloat(t.replace(",", "."))))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 1000);
  const [a, b] = amounts;
  if (a == null) return { rateMin: null, rateMax: null };
  if (b == null) return { rateMin: a, rateMax: null };
  return a <= b ? { rateMin: a, rateMax: b } : { rateMin: b, rateMax: a };
}

const DUTCH_MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
] as const;

function validUtcDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Verwerp overflow (bv. 31-02): Date corrigeert stil naar de volgende maand.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Datum uit vrije tekst: "2026-09-01", "01-09-2026", "1/9/2026" of "1 september 2026"
 * (UTC-middernacht — kalenderdatum, geen tijdzone-drift). Onherkenbaar/ongeldig → null.
 */
export function parseDutchDate(value: string): Date | null {
  const iso = value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return validUtcDate(Number(iso[1] ?? ""), Number(iso[2] ?? ""), Number(iso[3] ?? ""));

  const dmy = value.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return validUtcDate(Number(dmy[3] ?? ""), Number(dmy[2] ?? ""), Number(dmy[1] ?? ""));

  const written = value.toLowerCase().match(/(\d{1,2})\s+([a-zà-ÿ]+)\s+(\d{4})/);
  if (written) {
    const monthWord = written[2] ?? "";
    const monthIndex = DUTCH_MONTHS.findIndex((m) => m.startsWith(monthWord.slice(0, 3)));
    if (monthIndex >= 0) {
      return validUtcDate(Number(written[3] ?? ""), monthIndex + 1, Number(written[1] ?? ""));
    }
  }
  return null;
}

/** Werkwijze uit vrije tekst; hybride wint van "locatie" ("hybride, deels op locatie"). */
export function parseWorkMode(value: string): WorkMode | null {
  const v = value.toLowerCase();
  if (/hybrid/.test(v)) return "HYBRID";
  if (/(remote|thuis|op afstand)/.test(v)) return "REMOTE";
  if (/(locatie|onsite|ter plaatse|aanwezig|kantoor)/.test(v)) return "ONSITE";
  return null;
}

/**
 * Deterministische parse van een aanvraagmail. Herkent NL sleutel-waarde-regels
 * (`Functie: …`, `Tarief: …`); alles wat geen sleutelregel is vormt de omschrijving
 * (of de regels ná `Omschrijving:` tot de volgende sleutelregel). Titel valt terug op het
 * (opgeschoonde) onderwerp. Niets herkend → nulls; de reviewqueue toont dan de ruwe mail
 * en de opdrachtgever vult zelf aan — parseren mag nooit een mail laten verdwijnen.
 */
export function parseMailIntake(subject: string, textBody: string): ParsedMailIntake {
  const result: ParsedMailIntake = {
    title: null,
    description: null,
    location: null,
    rateMin: null,
    rateMax: null,
    startDate: null,
    workMode: null,
  };

  const plainLines: string[] = [];
  const descriptionLines: string[] = [];
  let inDescription = false;

  for (const line of textBody.split(/\r?\n/)) {
    const match = line.match(KEY_LINE);
    const field = match ? fieldForLabel(match[1] ?? "") : null;
    if (!match || !field) {
      // Vervolgregel: hoort bij de omschrijving-sectie of bij de vrije tekst.
      (inDescription ? descriptionLines : plainLines).push(line);
      continue;
    }
    inDescription = false;
    const value = (match[2] ?? "").trim();
    switch (field) {
      case "title":
        if (!result.title && value) result.title = value;
        break;
      case "location":
        if (!result.location && value) result.location = value;
        break;
      case "rate":
        if (result.rateMin == null) {
          const { rateMin, rateMax } = parseRateRange(value);
          result.rateMin = rateMin;
          result.rateMax = rateMax;
        }
        break;
      case "start":
        if (!result.startDate) result.startDate = parseDutchDate(value);
        break;
      case "workMode":
        if (!result.workMode) result.workMode = parseWorkMode(value);
        break;
      case "description":
        inDescription = true;
        if (value) descriptionLines.push(value);
        break;
    }
  }

  const explicitDescription = descriptionLines.join("\n").trim();
  const fallbackDescription = plainLines.join("\n").trim();
  result.description = explicitDescription || fallbackDescription || null;
  result.title = result.title ?? cleanMailSubject(subject);
  return result;
}
