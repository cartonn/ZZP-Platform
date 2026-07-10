// security.txt (RFC 9116): één pure bron van waarheid voor gecoördineerde kwetsbaarheidsmelding.
//
// Dit platform verwerkt gevoelige documenten (VOG, diploma's, ID). Vóór een securityreview/pentest
// (MENSENWERK §5d) hoort er een duidelijk, machine-leesbaar meldpunt te zijn zodat een welwillende
// onderzoeker een kwetsbaarheid verantwoord kan melden i.p.v. publiek te dumpen. security.txt is de
// standaard (RFC 9116) daarvoor: geserveerd op `/.well-known/security.txt`.
//
// Zelfde "veilige default achter een env-flag"-patroon als de overige productie-voorzieningen: het
// contact is instelbaar via SECURITY_CONTACT; ontbreekt dat, dan valt de resolver terug op een
// mailto: afgeleid uit het productie-webadres (AUTH_URL). Het bestand wordt altijd geserveerd — een
// meldpunt is beter dan geen — maar het beste is een expliciet, bewaakt adres.

/** Standaard geldigheidsduur van het bestand: RFC 9116 vereist een Expires in de toekomst. */
export const SECURITY_TXT_EXPIRY_DAYS = 365;

/** Voorkeurstalen voor meldingen (Nederlands eerst, Engels als tweede). */
export const SECURITY_TXT_PREFERRED_LANGUAGES = "nl, en";

export interface SecurityTxtInput {
  /** Eén of meer contacten (mailto:/https:), al genormaliseerd. Minstens één. */
  contacts: string[];
  /** Vertrouwde publieke origin zonder trailing slash (bv. https://app.zzp-platform.nl). */
  canonicalOrigin: string;
  /** Referentietijd (injecteerbaar voor tests). */
  now: Date;
  /** Geldigheidsduur in dagen; default {@link SECURITY_TXT_EXPIRY_DAYS}. */
  expiryDays?: number;
  /** Optionele voorkeurstalen; default {@link SECURITY_TXT_PREFERRED_LANGUAGES}. */
  preferredLanguages?: string;
}

/**
 * Normaliseert één contactwaarde naar een geldig RFC 9116-contact. Een kaal e-mailadres krijgt het
 * `mailto:`-schema; een al-geschemede waarde (`mailto:`, `http(s):`, `tel:`) blijft ongewijzigd.
 * Retourneert `null` voor lege of onbruikbare invoer.
 */
export function normalizeSecurityContact(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^(mailto:|https?:|tel:)/i.test(trimmed)) return trimmed;
  // Kaal e-mailadres? Voeg mailto: toe. Anders (geen @, geen schema) laten we het vallen: een
  // ongeldig contact in security.txt is schadelijker dan het weglaten ervan.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  return null;
}

/**
 * Bepaalt het/de beveiligingscontact(en). Bron van waarheid is SECURITY_CONTACT (komma-gescheiden,
 * meerdere toegestaan). Ontbreekt dat, dan wordt een `mailto:security@<host>` afgeleid uit de
 * geconfigureerde origin; zonder host valt het terug op `mailto:security@localhost` (alleen dev).
 * Puur/testbaar: env-waarde en origin komen als argument binnen.
 */
export function resolveSecurityContacts(
  securityContact: string | undefined,
  canonicalOrigin: string,
): string[] {
  const configured = (securityContact ?? "")
    .split(",")
    .map((part) => normalizeSecurityContact(part))
    .filter((value): value is string => value !== null);
  if (configured.length > 0) return configured;

  let host = "localhost";
  try {
    host = new URL(canonicalOrigin).host || host;
  } catch {
    // Onbruikbare origin → dev-fallback.
  }
  return [`mailto:security@${host}`];
}

/** True zodra er een expliciet SECURITY_CONTACT is gezet (voor de systeemstatus-posture). */
export function isSecurityContactConfigured(securityContact: string | undefined): boolean {
  return (securityContact ?? "").split(",").some((part) => normalizeSecurityContact(part) !== null);
}

/** ISO 8601-tijdstip (RFC 9116 Expires) op `now + days`, geklemd op minstens 1 dag. */
export function securityTxtExpires(now: Date, days: number = SECURITY_TXT_EXPIRY_DAYS): string {
  const safeDays = Number.isFinite(days) && days >= 1 ? Math.floor(days) : SECURITY_TXT_EXPIRY_DAYS;
  return new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Rendert de RFC 9116-`security.txt`-inhoud. Deterministisch: identieke invoer → identieke tekst
 * (op de Expires-tijd na, die uit `now` volgt). Velden in de door RFC 9116 aanbevolen volgorde.
 */
export function buildSecurityTxt(input: SecurityTxtInput): string {
  const {
    contacts,
    canonicalOrigin,
    now,
    expiryDays = SECURITY_TXT_EXPIRY_DAYS,
    preferredLanguages = SECURITY_TXT_PREFERRED_LANGUAGES,
  } = input;

  const origin = canonicalOrigin.replace(/\/+$/, "");
  const lines: string[] = [
    "# security.txt (RFC 9116) — gecoördineerde kwetsbaarheidsmelding.",
    "# Meld beveiligingsproblemen verantwoord via het contact hieronder. Bedankt.",
    "",
  ];
  for (const contact of contacts) lines.push(`Contact: ${contact}`);
  lines.push(`Expires: ${securityTxtExpires(now, expiryDays)}`);
  lines.push(`Preferred-Languages: ${preferredLanguages}`);
  lines.push(`Canonical: ${origin}/.well-known/security.txt`);
  lines.push("");
  return lines.join("\n");
}
