// Klant-relatiegezondheid voor de bemiddelaar (franchiser) op `/franchise/opdrachtgevers`. Pure,
// deterministische aggregatie over de reeds tenant-gescopet opgehaalde opdrachtgevers — geen I/O, los
// getest. Beantwoordt de kernvraag van elke bemiddeling/CRM (benchmark Bullhorn/PIDZ-regiokantoor):
// "welke klanten plaatsen nu werk, en wie is stilgevallen en verdient een belletje?" Een klant die
// geen open dienst en geen lopende samenwerking heeft en al een tijd niets deed, is churn-risico dat
// nu onzichtbaar was tussen de statische tellingen. De server bepaalt de waarheid; deze helper levert
// enkel de afgeleide presentatie (CLAUDE.md regel 1).

import { startOfUtcDay } from "@/lib/signals";
import { plural } from "@/lib/plural";

/** Dagen zonder activiteit waarna een niet-plaatsende klant om aandacht vraagt (re-engagement). */
export const CLIENT_IDLE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Hele kalenderdagen tussen twee momenten (UTC-dag, TZ-robuust). */
export function wholeDaysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
}

/**
 * Relatiegezondheid van één klant:
 * - `active`   — plaatst nu werk (≥1 gepubliceerde opdracht óf ≥1 lopende samenwerking).
 * - `attention`— plaatst niets én de laatste activiteit (of, bij nooit-plaatsen, de aanmelddatum) is
 *                ≥ `CLIENT_IDLE_DAYS` geleden: stilgevallen, benader de klant.
 * - `quiet`    — plaatst niets maar recent aangemeld/actief: geef het rust, nog geen churn-signaal.
 */
export type ClientHealth = "active" | "attention" | "quiet";

/** Minimale invoer per klant — volledig afleidbaar uit de al opgehaalde opdrachtgever-rijen. */
export interface ClientActivityInput {
  /** Aanmelddatum van de klant (fallback-referentie als er nooit activiteit was). */
  createdAt: Date;
  /** Aantal PUBLISHED-opdrachten; > 0 = werft nu actief. */
  publishedJobCount: number;
  /** Aantal ACTIVE-samenwerkingen; > 0 = heeft nu vakmensen geplaatst. */
  activeCollaborationCount: number;
  /** Laatste aanraakmoment (recentste opdracht of samenwerking); `null` = nog nooit iets geplaatst. */
  lastActivityAt: Date | null;
}

/** Classificeert één klant. `now` wordt geïnjecteerd zodat de functie puur en testbaar blijft. */
export function classifyClientHealth(input: ClientActivityInput, now: Date): ClientHealth {
  if (input.publishedJobCount > 0 || input.activeCollaborationCount > 0) {
    return "active";
  }
  const reference = input.lastActivityAt ?? input.createdAt;
  return wholeDaysBetween(reference, now) >= CLIENT_IDLE_DAYS ? "attention" : "quiet";
}

/**
 * Hoeveel hele dagen een klant al rustig is: sinds de laatste activiteit, of — als er nooit iets
 * liep — sinds de aanmelddatum. Zelfde referentiekeuze als `classifyClientHealth`, zodat de leeftijd
 * in de re-engagement-taak nooit tegenspreekt of een klant überhaupt `attention` is.
 */
export function clientIdleDays(input: ClientActivityInput, now: Date): number {
  return wholeDaysBetween(input.lastActivityAt ?? input.createdAt, now);
}

/** Prisma `job.groupBy({ by: ["companyId"], _count: { _all }, _max: { createdAt } })`-vorm. */
export interface PublishedJobActivity {
  companyId: string;
  _count: { _all: number };
  _max: { createdAt: Date | null };
}

/** Prisma `collaboration.groupBy({ by: ["companyId"], _max: { updatedAt } })`-vorm. */
export interface CollaborationActivity {
  companyId: string;
  _max: { updatedAt: Date | null };
}

/** Minimale klant-rij voor de gezondheidsafleiding (uit de al tenant-gescopet opgehaalde bedrijven). */
export interface ClientCompanyActivityRow {
  id: string;
  createdAt: Date;
  activeCollaborationCount: number;
}

/**
 * Bouwt per klant de `ClientActivityInput` uit de al opgehaalde bedrijf-rijen + de twee gegroepeerde
 * activiteitsaggregaten (open opdrachten, laatste samenwerking). Eén bron van waarheid voor de
 * klantenlijst-pagina, de next-action-engine (`/acties`) én de nav-badge: de "laatst-actief"-afleiding
 * (recentste van open-opdracht vs. laatste samenwerking) leeft hier, niet ge-inlined per oppervlak —
 * anders driften de drie surfaces. Pure functie, los testbaar; geen I/O.
 */
export function buildClientActivityInputs(
  companies: readonly ClientCompanyActivityRow[],
  publishedJobs: readonly PublishedJobActivity[],
  collabActivity: readonly CollaborationActivity[],
): Map<string, ClientActivityInput> {
  const publishedByCompany = new Map(publishedJobs.map((g) => [g.companyId, g]));
  const lastCollabByCompany = new Map(collabActivity.map((g) => [g.companyId, g._max.updatedAt]));
  const out = new Map<string, ClientActivityInput>();
  for (const c of companies) {
    const pub = publishedByCompany.get(c.id);
    const lastJobAt = pub?._max.createdAt ?? null;
    const lastCollabAt = lastCollabByCompany.get(c.id) ?? null;
    const lastActivityAt =
      lastJobAt && lastCollabAt
        ? lastJobAt > lastCollabAt
          ? lastJobAt
          : lastCollabAt
        : (lastJobAt ?? lastCollabAt);
    out.set(c.id, {
      createdAt: c.createdAt,
      publishedJobCount: pub?._count._all ?? 0,
      activeCollaborationCount: c.activeCollaborationCount,
      lastActivityAt,
    });
  }
  return out;
}

export interface ClientHealthSummary {
  total: number;
  /** Plaatst nu werk. */
  active: number;
  /** Stilgevallen — benader de klant (hoofdmaat / actielijst). */
  attention: number;
  /** Recent, plaatst (nog) niets — geen actie nodig. */
  quiet: number;
}

/**
 * Partitioneert de klantenlijst in drie elkaar uitsluitende buckets die samen exact `total` vormen.
 * "Plaatst nu" wint van alle andere signalen; de resterende klanten splitsen op recentheid.
 */
export function summarizeClientHealth(
  items: readonly ClientActivityInput[],
  now: Date,
): ClientHealthSummary {
  const summary: ClientHealthSummary = { total: items.length, active: 0, attention: 0, quiet: 0 };
  for (const c of items) {
    summary[classifyClientHealth(c, now)] += 1;
  }
  return summary;
}

/**
 * Eén verklarende regel boven de tegels ("wat vraagt nu mijn aandacht?"). `null` bij een lege lijst —
 * dan toont de pagina zijn eigen lege staat.
 */
export function clientHealthHeadline(summary: ClientHealthSummary): string | null {
  if (summary.total === 0) return null;
  if (summary.attention > 0) {
    return `${summary.attention} ${summary.attention === 1 ? "klant is" : "klanten zijn"} stilgevallen — benader ze voor een vervolgopdracht.`;
  }
  if (summary.active > 0) {
    return `${plural(summary.active, "klant plaatst", "klanten plaatsen")} nu werk; geen stilgevallen relaties.`;
  }
  return "Nog geen lopende plaatsingen; geen klant is lang genoeg stil voor een signaal.";
}

/** Presentatielabel + toon per gezondheidsstatus voor de rij-chip. */
export function clientHealthLabel(status: ClientHealth): {
  label: string;
  tone: "success" | "warning" | "muted";
} {
  switch (status) {
    case "active":
      return { label: "Plaatst nu", tone: "success" };
    case "attention":
      return { label: "Stilgevallen", tone: "warning" };
    case "quiet":
      return { label: "Rustig", tone: "muted" };
  }
}
