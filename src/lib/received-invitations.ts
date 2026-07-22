// Ontvangen uitnodigingen voor de ZZP'er. Een directe uitnodiging (`inviteFreelancerToJob` /
// bulk) is de hoogst-intente lead op een marktplaats: een opdrachtgever koos jóu specifiek
// (benchmark LinkedIn/Malt/Upwork "invited to apply"). Vandaag landt die uitnodiging alleen als
// een vluchtige `Notification` + een gezaghebbend `JOB_INVITED`-auditrecord — de ZZP'er heeft geen
// blijvende plek waar hij ziet "welke opdrachtgevers nodigden mij uit, en heb ik al gereageerd?".
// Deze module leidt die lijst deterministisch af uit de bestaande auditrecords; geen eigen
// datamodel, geen mutatie, server-side de waarheid (CLAUDE.md regel 1).
//
// Pure functies (geen I/O), los getest. De data-laag (`data/received-invitations.ts`) levert de
// ruwe auditrijen + de gepubliceerde opdrachten + de reeds-gereageerde opdracht-id's aan.

/** Maximaal aantal uitnodigingen dat de band toont — houdt de find-work-pagina rustig. */
export const MAX_RECEIVED_INVITATIONS = 6;

/** Eén ruwe uitnodiging, afgeleid uit een `JOB_INVITED`-auditrecord van deze ZZP'er. */
export interface RawInvitation {
  /** De opdracht waarvoor is uitgenodigd (AuditLog.entityId). */
  jobId: string;
  /** Wanneer de uitnodiging is verstuurd (AuditLog.createdAt, onveranderlijk). */
  invitedAt: Date;
}

/** Minimale opdracht-referentie; de data-laag levert alleen nog-gepubliceerde opdrachten aan. */
export interface InvitationJobRef {
  id: string;
  title: string;
  companyName: string;
}

/** Eén toonbare uitnodiging: opdracht + opdrachtgever + het meest recente uitnodigingsmoment. */
export interface ReceivedInvitation {
  jobId: string;
  jobTitle: string;
  companyName: string;
  /** Meest recente uitnodiging voor deze opdracht (nieuwste eerst gesorteerd). */
  invitedAt: Date;
}

/**
 * Selecteert de open, nog-onbeantwoorde uitnodigingen uit de ruwe auditrijen.
 *
 * - Ontdubbelt per opdracht (meerdere uitnodigingen — enkelvoudig én bulk, of een her-uitnodiging —
 *   tellen als één; het **meest recente** moment blijft behouden).
 * - Houdt alleen opdrachten over die nog **gepubliceerd** zijn (aanwezig in `jobs`) — een gesloten of
 *   verwijderde opdracht kan niet meer worden opgepakt.
 * - Sluit opdrachten uit waarop de ZZP'er al **reageerde** (`reactedJobIds`) — de data-laag bepaalt
 *   wat als "gereageerd" telt (een niet-ingetrokken reactie).
 * - Sorteert nieuwste uitnodiging eerst, met de opdracht-id als deterministische tiebreaker.
 * - Begrenst tot `cap`.
 *
 * Deterministisch en zonder I/O; `jobs`/`reactedJobIds` komen uit begrensde server-queries.
 */
export function selectOpenInvitations(
  invites: readonly RawInvitation[],
  jobs: ReadonlyMap<string, InvitationJobRef>,
  reactedJobIds: ReadonlySet<string>,
  cap: number = MAX_RECEIVED_INVITATIONS,
): ReceivedInvitation[] {
  if (cap <= 0) return [];

  // Meest recente uitnodiging per opdracht (dedup).
  const latest = new Map<string, Date>();
  for (const inv of invites) {
    const prev = latest.get(inv.jobId);
    if (prev === undefined || inv.invitedAt.getTime() > prev.getTime()) {
      latest.set(inv.jobId, inv.invitedAt);
    }
  }

  const out: ReceivedInvitation[] = [];
  for (const [jobId, invitedAt] of latest) {
    if (reactedJobIds.has(jobId)) continue;
    const job = jobs.get(jobId);
    if (!job) continue; // niet meer gepubliceerd → niet toonbaar
    out.push({ jobId, jobTitle: job.title, companyName: job.companyName, invitedAt });
  }

  out.sort(
    (a, b) => b.invitedAt.getTime() - a.invitedAt.getTime() || a.jobId.localeCompare(b.jobId),
  );
  return out.slice(0, cap);
}

/**
 * Vanaf hoeveel dagen zonder reactie een openstaande uitnodiging urgenter wordt getoond: de
 * opdrachtgever koos deze ZZP'er specifiek en wacht; hoe langer die stil blijft, hoe groter de kans
 * dat de opdracht intussen aan een ander gaat. Bewust ruim (een uitnodiging is een kans, geen
 * verplichting) — pas na enkele dagen stilte verschuift de toon van "info" naar "attention".
 */
export const INVITATION_AGING_DAYS = 5;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Aantal hele dagen dat een uitnodiging al openstaat (`now − invitedAt`, naar beneden afgerond,
 * ondergrens 0). Deterministisch en zonder I/O — voedt de toon en het leeftijdslabel van de
 * next-action, los getest.
 */
export function invitationAgeDays(invitedAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - invitedAt.getTime()) / MS_PER_DAY));
}

/**
 * Menselijk leeftijdslabel voor een openstaande uitnodiging ("vandaag uitgenodigd" / "gisteren
 * uitgenodigd" / "N dagen geleden uitgenodigd"). Grove buckets — geen schijnprecisie.
 */
export function invitationAgeLabel(ageDays: number): string {
  const days = Math.max(0, Math.floor(ageDays));
  if (days === 0) return "vandaag uitgenodigd";
  if (days === 1) return "gisteren uitgenodigd";
  return `${days} dagen geleden uitgenodigd`;
}
