// Voordracht-opvolging (aging) voor de bemiddelaar op `/franchise/diensten`. Het hele voordracht-
// systeem is vandaag forward-only: `dienst-fill-signal.ts` en `dienst-voordraag-overzicht.ts`
// beantwoorden "wie kán ik nog voordragen?" — maar niets beantwoordt de omgekeerde, even belangrijke
// vraag: "wie heb ik al voorgedragen en laat me hangen?" Een voordracht plaatst geen reactie namens de
// ZZP'er (die houdt de regie); de bemiddelaar nodigt uit en wacht. Zonder opvolgingssignaal verdwijnt
// een uitnodiging waar niemand op reageert stilletjes en blijft de dienst onnodig open.
//
// Bron van waarheid is het gezaghebbende voordracht-auditrecord (`FRANCHISE_FREELANCER_PROPOSED`,
// `entityType="Job"`, `createdAt` = uitnodigingsmoment, metadata `{freelancerId, tenantId}`). Een
// voordracht valt weg uit de opvolging zodra ze haar doel bereikte of achterhaald is:
//   1. de ZZP'er reageerde zelf (een niet-ingetrokken `Application` op die dienst), of
//   2. de dienst is niet langer open (gevuld met een ACTIEVE samenwerking, of niet meer PUBLISHED).
// Wat overblijft is een openstaande uitnodiging; we bucketen die op leeftijd (vers / wachtend / stil)
// zodat de bemiddelaar in één oogopslag ziet welke voordracht een herinnering of een plan-B vraagt.
//
// Pure beslislogica los van de DB-laag (deterministisch, los unit-getest); de loader hieronder levert
// alleen de al tenant-gescopet opgehaalde rijen. Read-only — geen mutatie, geen nieuw auth-oppervlak.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { tenantScopeWhere } from "@/lib/tenancy";
import { plural } from "@/lib/plural";
import { PROPOSAL_ACTION } from "@/lib/franchise/dienst-voordracht";

const DAY = 86_400_000;

/**
 * Leeftijdsdrempels (dagen) voor de opvolging. Een verse voordracht (≤ WACHTEND) is nog gezond: de
 * ZZP'er heeft redelijkerwijs de tijd om te reageren. Daarboven wordt stilte een signaal — bij
 * WACHTEND een zachte herinnering, bij STIL een plan-B (iemand anders voordragen of werven).
 */
export const VOORDRACHT_WACHTEND_DAYS = 2;
export const VOORDRACHT_STIL_DAYS = 5;

/** Leeftijdsbucket van een openstaande voordracht. */
export type VoordrachtAgeBucket = "fresh" | "waiting" | "stale";

/** Eén voordracht-auditrecord in de vorm die de pure kern nodig heeft. */
export interface VoordrachtRecord {
  jobId: string;
  freelancerId: string;
  /** Uitnodigingsmoment (auditrecord `createdAt`). */
  proposedAt: Date;
}

/** Context om achterhaalde voordrachten weg te filteren, al tenant-gescopet geladen. */
export interface VoordrachtContext {
  /** `${jobId}:${freelancerId}` voor elke niet-ingetrokken reactie — de ZZP'er reageerde al. */
  respondedKeys: ReadonlySet<string>;
  /** Dienst-ids die nog écht open zijn (PUBLISHED én niet gevuld). Alles daarbuiten is achterhaald. */
  openJobIds: ReadonlySet<string>;
  /** Weergavevelden per dienst voor de opvolgingslijst. */
  jobMeta: ReadonlyMap<string, { title: string; freelancerName: Map<string, string> }>;
}

/** Eén openstaande voordracht die opvolging verdient, verrijkt voor weergave. */
export interface VoordrachtOpvolgingItem {
  jobId: string;
  jobTitle: string;
  freelancerId: string;
  freelancerName: string;
  ageDays: number;
  bucket: VoordrachtAgeBucket;
}

export interface VoordrachtOpvolgingSummary {
  /** Totaal openstaande (nog niet-beantwoorde, dienst-nog-open) voordrachten. */
  open: number;
  /** Verse voordrachten (≤ WACHTEND dagen) — nog gezond, geen actie. */
  fresh: number;
  /** Wachtende voordrachten (> WACHTEND, ≤ STIL dagen) — een herinnering waard. */
  waiting: number;
  /** Stille voordrachten (> STIL dagen) — plan-B: iemand anders voordragen of werven. */
  stale: number;
  /**
   * De voordrachten die opvolging verdienen (waiting + stale), oudste eerst. Verse voordrachten
   * staan hier bewust niet in — die vragen (nog) niets.
   */
  items: VoordrachtOpvolgingItem[];
}

/** Klassificeer een leeftijd (in dagen) naar een bucket. */
export function voordrachtAgeBucket(ageDays: number): VoordrachtAgeBucket {
  if (ageDays > VOORDRACHT_STIL_DAYS) return "stale";
  if (ageDays > VOORDRACHT_WACHTEND_DAYS) return "waiting";
  return "fresh";
}

/**
 * Pure kern: filter de voordracht-auditrecords tot de nog-openstaande (ZZP'er reageerde niet én de
 * dienst is nog open) en bucket ze op leeftijd. De opvolgingslijst (`items`) bevat alleen de wachtende
 * en stille voordrachten, oudste eerst; verse voordrachten tellen mee in de samenvatting maar vragen
 * geen actie. Deterministisch: `now` wordt doorgegeven, leeftijd afgerond naar hele dagen.
 */
export function summarizeVoordrachtOpvolging(
  records: readonly VoordrachtRecord[],
  ctx: VoordrachtContext,
  now: Date = new Date(),
): VoordrachtOpvolgingSummary {
  const nowMs = now.getTime();
  let fresh = 0;
  let waiting = 0;
  let stale = 0;
  const items: VoordrachtOpvolgingItem[] = [];

  for (const rec of records) {
    // Achterhaald: dienst niet meer open, of de ZZP'er reageerde al zelf → geen opvolging nodig.
    if (!ctx.openJobIds.has(rec.jobId)) continue;
    if (ctx.respondedKeys.has(`${rec.jobId}:${rec.freelancerId}`)) continue;

    // Leeftijd in hele dagen; een (data-ruis) toekomstige datum klemt op 0 = vers.
    const ageDays = Math.max(0, Math.floor((nowMs - rec.proposedAt.getTime()) / DAY));
    const bucket = voordrachtAgeBucket(ageDays);
    if (bucket === "fresh") {
      fresh += 1;
      continue;
    }
    if (bucket === "waiting") waiting += 1;
    else stale += 1;

    const meta = ctx.jobMeta.get(rec.jobId);
    items.push({
      jobId: rec.jobId,
      jobTitle: meta?.title ?? "—",
      freelancerId: rec.freelancerId,
      freelancerName: meta?.freelancerName.get(rec.freelancerId) ?? "—",
      ageDays,
      bucket,
    });
  }

  // Oudste (stilste) bovenaan; tiebreak op naam voor een stabiele volgorde.
  items.sort(
    (a, b) => b.ageDays - a.ageDays || a.freelancerName.localeCompare(b.freelancerName, "nl"),
  );

  return { open: fresh + waiting + stale, fresh, waiting, stale, items };
}

/**
 * Eén compacte samenvattingsregel voor de opvolgingsstrip, of `null` (geen wachtende/stille voordracht
 * → geen strip, rustige lijst). We tonen alleen het actie-vragende deel: verse voordrachten zijn geen
 * signaal. De toon is `warning` zodra er ≥1 stille voordracht is (plan-B), anders `muted`.
 */
export function voordrachtOpvolgingStrip(
  summary: VoordrachtOpvolgingSummary,
): { label: string; tone: "warning" | "muted" } | null {
  const actionable = summary.waiting + summary.stale;
  if (actionable <= 0) return null;
  if (summary.stale > 0) {
    const stilLabel = `${plural(summary.stale, "voordracht is", "voordrachten zijn")} al ${VOORDRACHT_STIL_DAYS}+ dagen stil`;
    return {
      label:
        summary.waiting > 0
          ? `${stilLabel} · ${summary.waiting} wacht op reactie`
          : `${stilLabel} — draag iemand anders voor of werf.`,
      tone: "warning",
    };
  }
  return {
    label: `${plural(summary.waiting, "voordracht wacht", "voordrachten wachten")} op een reactie — een herinnering waard.`,
    tone: "muted",
  };
}

/**
 * Laadt de openstaande voordrachten van de bemiddelaar met hun opvolgingsstatus. Tenant-gescopet: eerst
 * de eigen diensten (isolatie), dan de voordracht-auditrecords op die diensten, de niet-ingetrokken
 * reacties en de vulstatus. Puur in-memory gebucket. Geeft een lege samenvatting bij een bemiddelaar
 * zonder tenant of zonder voordrachten. Read-only.
 */
export async function getVoordrachtOpvolging(
  actor: Actor,
  now: Date = new Date(),
): Promise<VoordrachtOpvolgingSummary> {
  const empty: VoordrachtOpvolgingSummary = {
    open: 0,
    fresh: 0,
    waiting: 0,
    stale: 0,
    items: [],
  };
  if (!actor.tenantId) return empty;

  // De eigen diensten (tenant-isolatie via tenantScopeWhere). We hebben titel + vulstatus nodig om
  // "nog open" te bepalen en de lijst te labelen.
  // unbounded-allow: franchise-tenant-scoped diensten; beheerbaar volume (zelfde bron als de page).
  const jobs = await prisma.job.findMany({
    where: tenantScopeWhere(actor),
    select: {
      id: true,
      title: true,
      status: true,
      collaborations: { select: { status: true } },
    },
  });
  if (jobs.length === 0) return empty;

  const jobIds = jobs.map((j) => j.id);
  const openJobIds = new Set(
    jobs
      .filter(
        (j) => j.status === "PUBLISHED" && !j.collaborations.some((c) => c.status === "ACTIVE"),
      )
      .map((j) => j.id),
  );
  // Geen open dienst met een voordracht mogelijk → niets op te volgen.
  if (openJobIds.size === 0) return empty;

  const [proposals, applications, freelancers] = await Promise.all([
    // Gezaghebbende voordracht-markering, alleen op de eigen diensten (entityId ∈ tenant-diensten).
    // unbounded-allow: tenant-gescopet op de eigen dienst-ids; beheerbaar volume.
    prisma.auditLog.findMany({
      where: { action: PROPOSAL_ACTION, entityType: "Job", entityId: { in: jobIds } },
      select: { entityId: true, metadata: true, createdAt: true },
    }),
    // Niet-ingetrokken reacties op deze diensten → de ZZP'er reageerde al zelf.
    // unbounded-allow: tenant-gescopet op de eigen dienst-ids; beheerbaar volume.
    prisma.application.findMany({
      where: { jobId: { in: jobIds }, status: { not: "WITHDRAWN" } },
      select: { jobId: true, freelancerId: true },
    }),
    // Namen van de voorgedragen ZZP'ers (tenant-roster) voor de opvolgingslijst.
    // unbounded-allow: tenant-gescopet roster; beheerbaar volume.
    prisma.freelancerProfile.findMany({
      where: { tenantId: actor.tenantId },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  const respondedKeys = new Set(applications.map((a) => `${a.jobId}:${a.freelancerId}`));
  const nameById = new Map(freelancers.map((f) => [f.id, f.user.name ?? "—"]));

  const records: VoordrachtRecord[] = [];
  const jobMeta = new Map<string, { title: string; freelancerName: Map<string, string> }>();
  for (const j of jobs) {
    jobMeta.set(j.id, { title: j.title, freelancerName: nameById });
  }
  for (const p of proposals) {
    let freelancerId: string | null = null;
    try {
      freelancerId = p.metadata ? ((JSON.parse(p.metadata).freelancerId as string) ?? null) : null;
    } catch {
      freelancerId = null;
    }
    if (!freelancerId) continue;
    records.push({ jobId: p.entityId, freelancerId, proposedAt: p.createdAt });
  }

  return summarizeVoordrachtOpvolging(records, { respondedKeys, openJobIds, jobMeta }, now);
}
