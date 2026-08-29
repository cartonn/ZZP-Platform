// Maakt de JSON-metadata van een audit-regel leesbaar voor het toezichtscherm: nette NL-labels en
// geformatteerde bedragen (centen → euro) i.p.v. een rauwe JSON-string. Pure functie, getest.

import { formatEuro } from "@/lib/invoices";

const LABELS: Record<string, string> = {
  subtotalCents: "Subtotaal",
  vatCents: "Btw",
  totalCents: "Totaal",
  feeCents: "Fee",
  priceCents: "Bedrag",
  amountCents: "Bedrag",
  email: "E-mail",
  number: "Nummer",
  planKey: "Plan",
  party: "Partij",
  reason: "Reden",
  from: "Van",
  to: "Naar",
  score: "Score",
  agreementType: "Overeenkomst",
  tenantInvoices: "Tenant-facturen",
  membershipInvoices: "Abonnementsfacturen",
  weekdays: "Weekdagen",
};

// NL-vertaling van rauwe enum-WAARDEN die in audit-metadata voorkomen (vooral de from/to-statussen
// van verificatie- en factuurbeslissingen). Onbekende waarden vallen ongewijzigd terug.
const VALUE_LABELS: Record<string, string> = {
  DRAFT: "Concept",
  SUBMITTED: "Ingediend",
  VERIFIED: "Geverifieerd",
  REJECTED: "Afgewezen",
  EXPIRED: "Verlopen",
  SENT: "Verzonden",
  APPROVED: "Goedgekeurd",
  PAID: "Betaald",
  OVERDUE: "Te laat",
  CANCELLED: "Geannuleerd",
  PROCESSED: "Verwerkt",
  CREDITED: "Gecrediteerd",
  WITHDRAWN: "Ingetrokken",
};

function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  // camelCase → "Camel case" als nette fallback (zinszinkapitalen, geen titelkapitalen).
  const spaced = key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Formatteert de audit-metadata (JSON-string) tot een leesbare NL-regel. Lege/ongeldige invoer
 *  valt terug op de ruwe string. Bedragen op `*Cents`-velden worden als euro getoond. */
export function formatAuditMetadata(raw: string | null | undefined): string {
  if (!raw) return "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (parsed === null || typeof parsed !== "object") return String(parsed);

  const parts: string[] = [];
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (/Cents$/.test(key) && typeof value === "number") {
      parts.push(`${labelFor(key)} ${formatEuro(value)}`);
    } else {
      const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
      // Bekende enum-statussen (bv. from/to bij een verificatie- of factuurbeslissing) naar NL.
      const shown = VALUE_LABELS[raw] ?? raw;
      parts.push(`${labelFor(key)}: ${shown}`);
    }
  }
  return parts.join(" · ");
}
