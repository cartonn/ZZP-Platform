// Uitnodiging-opvolging voor de opdrachtgever. De directe uitnodiging (`job-invite.ts`, #625) en de
// bulk-uitnodiging (#715) zijn "fire-and-forget": de opdrachtgever nodigt passende ZZP'ers uit, maar
// ziet daarna nergens of die uitnodiging landde. Dit sluit de lus — hoeveel uitgenodigde ZZP'ers
// reageerden daadwerkelijk, hoeveel wachten nog, en (als niemand bijt terwijl de uitnodigingen
// verouderen) een nudge om het bereik te verruimen. Benchmark: recruiters (Pidz/Zorgwerk/Bullhorn)
// sturen op invite→response-conversie.
//
// Puur en deterministisch; geen schema-wijziging. De uitnodigingen komen gezaghebbend uit de
// `JOB_INVITED`-auditrecords (freelancerId + createdAt), "gereageerd" uit de niet-ingetrokken
// reacties (`Application`) op dezelfde opdracht. Toont uitsluitend geaggregeerde tellingen.

export interface InviteRecord {
  /** ZZP'er die is uitgenodigd. */
  freelancerId: string;
  /** Moment van uitnodigen (AuditLog.createdAt, onveranderlijk). */
  invitedAt: Date;
}

export type InviteFollowupTone = "none" | "good" | "neutral" | "warning";

export interface InviteFollowup {
  /** Aantal unieke uitgenodigde ZZP'ers. */
  invited: number;
  /** Uitgenodigde ZZP'ers die reageerden (een niet-ingetrokken reactie plaatsten). */
  responded: number;
  /** Uitgenodigde ZZP'ers die nog niet reageerden. */
  pending: number;
  /** Responspercentage (responded / invited); null wanneer er niets is uitgenodigd. */
  responseRate: number | null;
  /** Leeftijd in dagen van de oudste nog-openstaande uitnodiging; null als niets openstaat. */
  oldestPendingDays: number | null;
  tone: InviteFollowupTone;
  /** Korte samenvatting/nudge; null bij `none` (dan rendert de kaart niet). */
  headline: string | null;
}

/**
 * Zet `JOB_INVITED`-auditrecords om in uitnodigingsrecords. De ZZP'er-id zit in de JSON-metadata
 * (`freelancerId`), het tijdstip is de onveranderlijke `createdAt`-kolom. Robuust tegen malforme
 * metadata (overslaan, nooit de hele lijst laten crashen) — gedeelde bron zodat de parse-logica niet
 * driftgevoelig gedupliceerd wordt in de page.
 */
export function parseInviteRecords(
  logs: ReadonlyArray<{ metadata: string | null; createdAt: Date }>,
): InviteRecord[] {
  const records: InviteRecord[] = [];
  for (const log of logs) {
    if (!log.metadata) continue;
    try {
      const meta = JSON.parse(log.metadata) as { freelancerId?: unknown };
      if (typeof meta.freelancerId === "string") {
        records.push({ freelancerId: meta.freelancerId, invitedAt: log.createdAt });
      }
    } catch {
      // Malforme metadata: overslaan.
    }
  }
  return records;
}

// Grenzen voor de toon-bepaling (gedocumenteerd zodat aanpassen traceerbaar is).
const GOOD_MIN_RESPONSE_PCT = 50; // ≥ 50% van de uitgenodigden reageerde = goede conversie
const STALE_DAYS = 7; // een uitnodiging die > 7 dagen zonder reactie openstaat = veroudert
const MS_PER_DAY = 86_400_000;

/**
 * Ontdubbelt uitnodigingsrecords op ZZP'er en houdt per ZZP'er de vróégste uitnodiging aan (de
 * relevante leeftijd — hoe lang wacht de opdrachtgever al op een reactie). Robuust tegen dubbele
 * `JOB_INVITED`-records voor hetzelfde paar (idempotent bij de bron, maar niet vertrouwd hier).
 */
function dedupeEarliest(invites: readonly InviteRecord[]): InviteRecord[] {
  const byFreelancer = new Map<string, InviteRecord>();
  for (const rec of invites) {
    const existing = byFreelancer.get(rec.freelancerId);
    if (!existing || rec.invitedAt.getTime() < existing.invitedAt.getTime()) {
      byFreelancer.set(rec.freelancerId, rec);
    }
  }
  return [...byFreelancer.values()];
}

/**
 * Berekent de uitnodiging-opvolging uit de verstuurde uitnodigingen en de set ZZP'ers die op deze
 * opdracht reageerden. Puur en deterministisch; `now` wordt geïnjecteerd zodat de leeftijd van
 * openstaande uitnodigingen reproduceerbaar is.
 */
export function summarizeInviteFollowup(
  invites: readonly InviteRecord[],
  respondedFreelancerIds: ReadonlySet<string>,
  now: Date = new Date(),
): InviteFollowup {
  const unique = dedupeEarliest(invites);
  const invited = unique.length;

  if (invited === 0) {
    return {
      invited: 0,
      responded: 0,
      pending: 0,
      responseRate: null,
      oldestPendingDays: null,
      tone: "none",
      headline: null,
    };
  }

  const pendingRecords = unique.filter((rec) => !respondedFreelancerIds.has(rec.freelancerId));
  const pending = pendingRecords.length;
  const responded = invited - pending;
  const responseRate = Math.round((responded / invited) * 100);

  // Leeftijd van openstaande uitnodigingen; een createdAt in de toekomst (data-ruis) wordt op 0
  // geklemd zodat de leeftijd nooit misleidend negatief is.
  const pendingAges = pendingRecords.map((rec) =>
    Math.max(0, Math.floor((now.getTime() - rec.invitedAt.getTime()) / MS_PER_DAY)),
  );
  const oldestPendingDays = pendingAges.length > 0 ? Math.max(...pendingAges) : null;
  const stalePending = pendingAges.filter((d) => d >= STALE_DAYS).length;

  const tone = determineTone(responseRate, pending, stalePending);
  const headline = buildHeadline(tone, { invited, responded, pending });

  return { invited, responded, pending, responseRate, oldestPendingDays, tone, headline };
}

function determineTone(
  responseRate: number,
  pending: number,
  stalePending: number,
): Exclude<InviteFollowupTone, "none"> {
  // Alles beantwoord, of een goede conversie → positief.
  if (pending === 0 || responseRate >= GOOD_MIN_RESPONSE_PCT) return "good";

  // Niemand reageerde en er staat minstens één uitnodiging te lang open → verruim je bereik.
  if (stalePending > 0 && responseRate === 0) return "warning";

  return "neutral";
}

function buildHeadline(
  tone: Exclude<InviteFollowupTone, "none">,
  counts: { invited: number; responded: number; pending: number },
): string {
  const { responded, pending } = counts;

  if (tone === "good") {
    if (pending === 0) return "Alle uitgenodigde ZZP'ers hebben gereageerd.";
    return `${responded} van je uitnodigingen leidde tot een reactie.`;
  }

  if (tone === "warning") {
    return "Je uitnodigingen blijven onbeantwoord — verruim je bereik of pas de opdracht aan.";
  }

  // neutral
  return `${responded} reageerde, ${pending} ${pending === 1 ? "wacht" : "wachten"} nog.`;
}
