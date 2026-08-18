// Gedeelde bron van waarheid voor de FREELANCER cascade-"aan zet"-taken, zodat het actiecentrum
// (`/acties`, pending-tasks.ts `freelancerTasks`) en de `/samenwerkingen`-nav-badge (signals.ts
// `cascadeWork`) dezelfde WHERE-clausules delen en niet kunnen driften. Persona-sweep run 82.
//
// Achtergrond (de gerepareerde defectklasse): de badge las de cascade-taken uit één gecombineerde
// `collaboration.findMany({ orderBy: { updatedAt: "desc" }, take: 50 })`, terwijl /acties al eerder
// (run 76-81) was losgekoppeld naar aparte, status-gefilterde, `createdAt asc`-queries per taaksoort.
// `Collaboration.updatedAt` is een @updatedAt-kolom die ALLEEN bij een directe mutatie op de rij wordt
// gebumpt (tekenen/dispuut/annuleren/auto-afronding); een prestatie indienen of een factuur goedkeuren
// raakt de rij niet. Voor een ACTIVE-samenwerking staat `updatedAt` dus bevroren op het teken-moment,
// zodat bij >50 gelijktijdige PROPOSED+ACTIVE-samenwerkingen een ouder-getekende samenwerking met
// openstaand geld/prestatiewerk buiten het `updatedAt desc`-venster viel — de badge onderteldе die actie
// PERMANENT (de actie afhandelen bumpt `updatedAt` niet → niet self-healing), terwijl /acties + de
// dashboard-rail 'm wél toonden ("signaal op één oppervlak"-anti-patroon). Bovendien capte de badge de
// facturen per samenwerking op `take: 5` zónder `orderBy` (niet-deterministische ondertelling + flicker)
// en las 'ie de prestatie-fase uit alléén de meest-recente prestatie (miste een oudere REJECTED-prestatie
// onder een nieuwere). Deze helper spiegelt exact de vier /acties-emitters en heelt alle drie.

import { Prisma } from "@prisma/client";

import { collaborationPlacementBlocked } from "@/lib/collaborations";
import { prisma } from "@/lib/db";
import { type CredentialType } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";

// Zelfde cap als de /acties-emitters (`MAX` in pending-tasks.ts): de badge moet exact tellen wat /acties
// tóónt, en /acties toont per taaksoort ten hoogste `MAX` taken. Eén gedeelde constante → geen drift.
export const FREELANCER_CASCADE_SCAN_LIMIT = 50;

/** PROPOSED-samenwerkingen van de ZZP'er (contract ondertekenen). Spiegelt `proposedCollabs`. */
export function proposedCollabWhere(userId: string): Prisma.CollaborationWhereInput {
  return { freelancer: { userId }, status: "PROPOSED", disputedAt: null };
}

/**
 * ACTIVE-samenwerkingen die een uren-/oplevering-indienen-taak KÚNNEN opleveren (nog geen prestatie of
 * een DRAFT). Spiegelt `submitCollabs`. De fase-bepaling (meest recente prestatie null/DRAFT) gebeurt na
 * de fetch, gelijk aan /acties.
 */
export function submitCollabWhere(userId: string): Prisma.CollaborationWhereInput {
  return {
    freelancer: { userId },
    status: "ACTIVE",
    disputedAt: null,
    OR: [{ performances: { none: {} } }, { performances: { some: { status: "DRAFT" } } }],
  };
}

/** Elke AFGEKEURDE prestatie (ook uit een oude cyclus) vraagt om herindiening. Spiegelt `rejectedPerfs`. */
export function rejectedPerfWhere(userId: string): Prisma.PerformanceWhereInput {
  return {
    status: "REJECTED",
    collaboration: { freelancer: { userId }, status: "ACTIVE", disputedAt: null },
  };
}

/** Openstaande cascade-facturen (indienen/betaling markeren). Spiegelt `openInvoices`. */
export function openInvoiceWhere(userId: string): Prisma.InvoiceWhereInput {
  return {
    lifecycleStatus: { in: ["DRAFT", "REJECTED", "APPROVED", "OVERDUE"] },
    collaboration: { freelancer: { userId }, status: "ACTIVE", disputedAt: null },
  };
}

/**
 * Lopende/voorgestelde samenwerkingen met een VERPLICHT certificaat-vereiste — de bron voor de
 * collab-vereist-certificaat-gaten in de /certificaten-badge. Spiegelt `credentialCollabs` in
 * pending-tasks.ts (run 79).
 */
export function credentialCollabWhere(userId: string): Prisma.CollaborationWhereInput {
  return {
    freelancer: { userId },
    status: { in: ["PROPOSED", "ACTIVE"] },
    disputedAt: null,
    job: { credentialRequirements: { some: { required: true } } },
  };
}

/**
 * Telt de FREELANCER cascade-"aan zet"-taken exact zoals /acties (`freelancerTasks`) ze emit: één per
 * niet-geblokkeerde PROPOSED (contract ondertekenen), één per ACTIVE zonder ingediende prestatie (uren
 * indienen), één per AFGEKEURDE prestatie (herindienen) en één per openstaande cascade-factuur (indienen/
 * betaling markeren) — elk gecapt op `FREELANCER_CASCADE_SCAN_LIMIT`, gelijk aan de /acties-take. Vier
 * status-gefilterde `createdAt asc`-queries → self-healing (een rij verlaat de telling pas als 'ie niet
 * langer aan de status-voorwaarde voldoet), geen `updatedAt`-venster, geen inner-cap op facturen, en de
 * afgekeurde-prestatie-tak leest álle REJECTED-prestaties i.p.v. alleen de meest-recente.
 */
export async function getFreelancerCascadeWorkCount(userId: string, now: Date): Promise<number> {
  const [proposed, submitCollabs, rejectedPerfCount, openInvoiceCount, creds] = await Promise.all([
    prisma.collaboration.findMany({
      where: proposedCollabWhere(userId),
      select: {
        job: {
          select: {
            credentialRequirements: { where: { required: true }, select: { credentialType: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: FREELANCER_CASCADE_SCAN_LIMIT,
    }),
    prisma.collaboration.findMany({
      where: submitCollabWhere(userId),
      select: {
        performances: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
      take: FREELANCER_CASCADE_SCAN_LIMIT,
    }),
    prisma.performance.count({ where: rejectedPerfWhere(userId) }),
    prisma.invoice.count({ where: openInvoiceWhere(userId) }),
    prisma.credential.findMany({
      where: { freelancerProfile: { userId } },
      select: { type: true, status: true, expiresAt: true },
    }),
  ]);

  const credList: FreelancerCredential[] = creds.map((c) => ({
    type: c.type as CredentialType,
    status: c.status as FreelancerCredential["status"],
    expiresAt: c.expiresAt,
  }));

  let count = 0;
  // PROPOSED → contract ondertekenen, tenzij de plaatsing door een certificaat-gat is geblokkeerd
  // (/acties onderdrukt de teken-taak dan; signContract weigert server-side) — badge↔lijst-pariteit.
  for (const c of proposed) {
    const requiredTypes = c.job.credentialRequirements.map(
      (r) => r.credentialType as CredentialType,
    );
    if (!collaborationPlacementBlocked(requiredTypes, credList, now)) count += 1;
  }
  // ACTIVE zonder ingediende prestatie → uren indienen (alleen als de laatste prestatie ontbreekt/DRAFT;
  // SUBMITTED/APPROVED = opdrachtgever aan zet; REJECTED valt onder de aparte afgekeurde-prestatie-tak).
  for (const c of submitCollabs) {
    const latest = c.performances[0];
    if (!latest || latest.status === "DRAFT") count += 1;
  }
  return (
    count +
    Math.min(rejectedPerfCount, FREELANCER_CASCADE_SCAN_LIMIT) +
    Math.min(openInvoiceCount, FREELANCER_CASCADE_SCAN_LIMIT)
  );
}
