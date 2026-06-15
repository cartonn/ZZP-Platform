// Vervalkalender: vat de aankomende verloopmomenten van de certificaten van een ZZP'er samen,
// zodat hij in één oogopslag ziet wat vernieuwd moet worden — vóór een verplicht bewijsstuk
// verloopt en het vertrouwensniveau zakt. Puur, geen I/O; server-side is de waarheid.

import { type CredentialStatus, type CredentialType } from "@/lib/enums";
import { daysUntilExpiry } from "@/lib/credentials";

/** Tot hoeveel dagen vooruit de vervalkalender certificaten meeneemt. */
export const EXPIRY_HORIZON_DAYS = 90;

export type ExpiryWindow = "EXPIRED" | "WITHIN_30" | "WITHIN_60" | "WITHIN_90";

export interface ExpiryCredentialInput {
  id: string;
  title: string;
  type: CredentialType;
  status: CredentialStatus;
  expiresAt?: Date | null;
}

export interface ExpiryItem {
  id: string;
  title: string;
  type: CredentialType;
  expiresAt: Date;
  /** Hele dagen tot expiry; negatief = al verlopen. */
  days: number;
  window: ExpiryWindow;
}

export interface ExpiryOverview {
  /** Gesorteerd: meest urgent eerst (kleinste/negatiefste dagen), dan op titel. */
  items: ExpiryItem[];
  expired: number;
  within30: number;
  within60: number;
  within90: number;
  /** Totaal aantal certificaten dat aandacht vraagt (= items.length). */
  total: number;
}

/**
 * Plaats een certificaat in het juiste venster. Alleen certificaten die werkelijk kunnen verlopen
 * (VERIFIED of al EXPIRED, mét vervaldatum) komen in aanmerking; concept/ingediend/afgewezen niet.
 * Geeft `null` als het certificaat geen aandacht vraagt (geen vervaldatum, ver buiten de horizon,
 * of een status die niet verloopt).
 */
function windowFor(credential: ExpiryCredentialInput, days: number | null): ExpiryWindow | null {
  const { status } = credential;
  if (status !== "VERIFIED" && status !== "EXPIRED") return null;
  if (days === null) return null;
  // Een door de expiry-taak gemarkeerd EXPIRED-certificaat is verlopen, ongeacht de exacte datum.
  if (status === "EXPIRED" || days < 0) return "EXPIRED";
  if (days <= 30) return "WITHIN_30";
  if (days <= 60) return "WITHIN_60";
  if (days <= EXPIRY_HORIZON_DAYS) return "WITHIN_90";
  return null;
}

/**
 * Bouwt de vervalkalender uit de certificaten van één ZZP'er. Read-only, deterministisch.
 * Muteert de invoer niet.
 */
export function summarizeExpiry(
  credentials: readonly ExpiryCredentialInput[],
  now: Date = new Date(),
): ExpiryOverview {
  const items: ExpiryItem[] = [];

  for (const c of credentials) {
    if (!c.expiresAt) continue;
    const days = daysUntilExpiry(c.expiresAt, now);
    const window = windowFor(c, days);
    if (window === null || days === null) continue;
    items.push({
      id: c.id,
      title: c.title,
      type: c.type,
      expiresAt: c.expiresAt,
      days,
      window,
    });
  }

  items.sort((a, b) => (a.days !== b.days ? a.days - b.days : a.title.localeCompare(b.title)));

  return {
    items,
    expired: items.filter((i) => i.window === "EXPIRED").length,
    within30: items.filter((i) => i.window === "WITHIN_30").length,
    within60: items.filter((i) => i.window === "WITHIN_60").length,
    within90: items.filter((i) => i.window === "WITHIN_90").length,
    total: items.length,
  };
}
