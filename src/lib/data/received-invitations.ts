// Server-side ophaallaag voor de ontvangen uitnodigingen van één ZZP'er. Leidt de lijst af uit de
// gezaghebbende `JOB_INVITED`-auditrecords (zelfde bron als de "Uitgenodigd"-badge op de opdracht-
// detail), verrijkt met de nog-gepubliceerde opdrachten en filtert de reeds-beantwoorde weg. Read-only,
// geen mutatie; alleen eigen data (de auditrecords bevatten de eigen `freelancerProfileId`).

import { prisma } from "@/lib/db";
import { JOB_INVITED_AUDIT_ACTION, parseInvitedFreelancerIds } from "@/lib/job-invite";
import {
  selectOpenInvitations,
  type InvitationJobRef,
  type RawInvitation,
  type ReceivedInvitation,
} from "@/lib/received-invitations";

// Begrenzingen: geen enkele query mag onbegrensd zijn. Een actief-uitgenodigde ZZP'er heeft
// realistisch niet meer dan een paar honderd uitnodigingen; de audit-scan is bovendien op de
// geïndexeerde `action` gefilterd.
const MAX_AUDIT_ROWS = 200;
const MAX_JOBS = 200;

/**
 * De open, nog-onbeantwoorde uitnodigingen voor de ZZP'er met dit profiel-id. Drie begrensde,
 * eigenaar-gescopete queries:
 *  1. de eigen `JOB_INVITED`-auditrecords (metadata bevat het eigen profiel-id);
 *  2. de betrokken opdrachten die nog `PUBLISHED` zijn (+ opdrachtgever-naam);
 *  3. de eigen niet-ingetrokken reacties op die opdrachten (om al-gereageerd uit te sluiten).
 * De pure `selectOpenInvitations` ontdubbelt/sorteert/begrenst. Lege lijst als er niets te tonen is.
 */
export async function getReceivedInvitations(
  freelancerProfileId: string,
  now: Date = new Date(),
): Promise<ReceivedInvitation[]> {
  // 1. Eigen uitnodiging-auditrecords. De metadata-`contains` matcht het eigen profiel-id; de
  //    daaropvolgende parse bevestigt dat exact (nooit een substring-vals-positief tussen id's).
  const auditRows = await prisma.auditLog.findMany({
    where: {
      action: JOB_INVITED_AUDIT_ACTION,
      entityType: "Job",
      metadata: { contains: `"freelancerId":"${freelancerProfileId}"` },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_AUDIT_ROWS,
    select: { entityId: true, createdAt: true, metadata: true },
  });

  const invites: RawInvitation[] = auditRows
    .filter((row) => parseInvitedFreelancerIds([row]).has(freelancerProfileId))
    .map((row) => ({ jobId: row.entityId, invitedAt: row.createdAt }));
  if (invites.length === 0) return [];

  const jobIds = [...new Set(invites.map((inv) => inv.jobId))].slice(0, MAX_JOBS);

  // 2. Alleen nog-gepubliceerde opdrachten zijn oppakbaar. Ontbreken = gesloten/verwijderd → weg.
  const [jobRows, reactedRows] = await Promise.all([
    prisma.job.findMany({
      where: { id: { in: jobIds }, status: "PUBLISHED" },
      select: { id: true, title: true, company: { select: { name: true } } },
    }),
    // 3. Eigen niet-ingetrokken reacties op deze opdrachten — die tellen als "al beantwoord".
    prisma.application.findMany({
      where: {
        freelancerId: freelancerProfileId,
        jobId: { in: jobIds },
        status: { not: "WITHDRAWN" },
      },
      select: { jobId: true },
    }),
  ]);

  const jobs = new Map<string, InvitationJobRef>(
    jobRows.map((j) => [j.id, { id: j.id, title: j.title, companyName: j.company.name }]),
  );
  const reactedJobIds = new Set(reactedRows.map((r) => r.jobId));

  // `now` is (nog) niet nodig voor de selectie zelf, maar wordt doorgegeven zodat een toekomstige
  // vervaldatum-afkap deterministisch en testbaar blijft.
  void now;
  return selectOpenInvitations(invites, jobs, reactedJobIds);
}
