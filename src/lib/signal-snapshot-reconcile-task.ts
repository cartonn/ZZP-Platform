// Reconciliatie van de signaal-snapshots (plan/apply, draait mee in /api/tasks/run-all).
//
// Twee taken in één run:
//  1. INVALIDATIE-SWEEP. Elke betekenisvolle handeling schrijft een DomainEvent — ook de handelingen
//     die niet via de event-bus lopen (de reminder-runners schrijven 'm rechtstreeks). Die tabel is
//     daarmee het enige echte chokepoint dat we hebben. De sweep leest de events sinds de vorige run,
//     vertaalt ze via de tabel-gedreven `SIGNAL_INVALIDATION` naar betrokken gebruikers en markeert
//     hun snapshot als verlopen. Idempotent: nog eens invalideren is een no-op.
//  2. DRIFT-METING. Van een handvol nog-verse snapshots wordt de berekening opnieuw gedraaid en
//     vergeleken met wat er staat. Elk verschil is per definitie een gemiste invalidatie — precies
//     het bewijs dat deze taak moet leveren. De afwijking wordt geteld en gelogd (niet stil
//     weggeschreven), en de snapshot wordt met de verse waarden bijgewerkt.
//
// De taak is een VANGNET, geen fundament: de korte TTL op de snapshot (SIGNAL_SNAPSHOT_TTL_MS) zorgt
// er sowieso voor dat niets langer dan een minuut achterloopt.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
import { type UserRole } from "@/lib/enums";
import {
  planHasWork,
  planSignalInvalidation,
  type SignalInvalidationEvent,
} from "@/lib/signals/invalidation";
import { invalidateSignals } from "@/lib/signals/invalidate";
import { diffSignals, recomputeSignalSnapshot, toNavBadges } from "@/lib/signals/snapshot";

/** Hoe ver de sweep terugkijkt. Ruim boven het cron-interval, zodat een gemiste run zichzelf inhaalt. */
export const SIGNAL_SWEEP_LOOKBACK_MS = 90 * 60_000; // 90 minuten

/** Harde bovengrens op de sweep-lezing — een drukke nacht mag de cron niet laten ontsporen. */
export const SIGNAL_SWEEP_EVENT_LIMIT = 500;

/** Hoeveel snapshots per run opnieuw worden doorgerekend (de berekening is duur; dit is een steekproef). */
export const SIGNAL_RECONCILE_SAMPLE = 25;

export interface SignalSnapshotReconcileResult {
  /** Aantal gebruikers waarvan de snapshot op verlopen is gezet. */
  invalidated: number;
  /** Aantal events dat geen bekend onderwerp had (die leunen op de TTL). */
  unmappedEvents: number;
  /** Aantal snapshots dat opnieuw is doorgerekend. */
  reconciled: number;
  /** Aantal daarvan dat afweek van de bewaarde waarde — hoort 0 te zijn. */
  drifted: number;
}

/**
 * Zoek de betrokken gebruikers bij een invalidatieplan op. Gescheiden van het (pure) plan: dit is
 * puur I/O, met per onderwerp één begrensde query.
 */
async function resolveAffectedUserIds(plan: ReturnType<typeof planSignalInvalidation>) {
  const userIds = new Set<string>(plan.userIds);
  const collaborationIds = new Set(plan.collaborationIds);

  if (plan.invoiceIds.length > 0) {
    const invoices = await prisma.invoice.findMany({
      where: { id: { in: plan.invoiceIds } },
      select: { issuerUserId: true, counterpartyUserId: true, collaborationId: true },
      take: SIGNAL_SWEEP_EVENT_LIMIT,
    });
    for (const inv of invoices) {
      if (inv.issuerUserId) userIds.add(inv.issuerUserId);
      if (inv.counterpartyUserId) userIds.add(inv.counterpartyUserId);
      if (inv.collaborationId) collaborationIds.add(inv.collaborationId);
    }
  }

  if (plan.performanceIds.length > 0) {
    const performances = await prisma.performance.findMany({
      where: { id: { in: plan.performanceIds } },
      select: { collaborationId: true },
      take: SIGNAL_SWEEP_EVENT_LIMIT,
    });
    for (const perf of performances) collaborationIds.add(perf.collaborationId);
  }

  if (collaborationIds.size > 0) {
    // Beide partijen + de bemiddelaar van de tenant: die ziet dezelfde samenwerking in zijn cockpit,
    // dus zijn badges bewegen mee.
    const collaborations = await prisma.collaboration.findMany({
      where: { id: { in: [...collaborationIds] } },
      select: {
        freelancer: { select: { userId: true, tenant: { select: { ownerUserId: true } } } },
        company: { select: { userId: true, tenant: { select: { ownerUserId: true } } } },
      },
      // De id-lijst komt uit het (gecapte) event-venster, maar een expliciete cap houdt de query
      // begrensd ook als dat venster ooit ruimer wordt.
      take: SIGNAL_SWEEP_EVENT_LIMIT,
    });
    for (const col of collaborations) {
      userIds.add(col.freelancer.userId);
      userIds.add(col.company.userId);
      if (col.freelancer.tenant) userIds.add(col.freelancer.tenant.ownerUserId);
      if (col.company.tenant) userIds.add(col.company.tenant.ownerUserId);
    }
  }

  if (plan.credentialIds.length > 0) {
    const credentials = await prisma.credential.findMany({
      where: { id: { in: plan.credentialIds } },
      select: {
        freelancerProfile: { select: { userId: true, tenant: { select: { ownerUserId: true } } } },
      },
      take: SIGNAL_SWEEP_EVENT_LIMIT,
    });
    for (const cred of credentials) {
      userIds.add(cred.freelancerProfile.userId);
      if (cred.freelancerProfile.tenant) userIds.add(cred.freelancerProfile.tenant.ownerUserId);
    }
    // De verificatie-wachtrij (/admin/verificaties) verandert mee bij élk certificaat-event.
    // unbounded-allow: het aantal actieve beheerders is inherent klein (handvol) en ze moeten
    // allemaal geïnvalideerd worden — een cap zou juist een beheerder met een verouderde wachtrij
    // achterlaten.
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    for (const admin of admins) userIds.add(admin.id);
  }

  return [...userIds];
}

export async function runSignalSnapshotReconcileTask(opts: {
  now?: Date;
}): Promise<SignalSnapshotReconcileResult> {
  const now = opts.now ?? new Date();
  const since = new Date(now.getTime() - SIGNAL_SWEEP_LOOKBACK_MS);

  // --- 1. Invalidatie-sweep ------------------------------------------------
  const events: SignalInvalidationEvent[] = await prisma.domainEvent.findMany({
    where: { occurredAt: { gte: since } },
    select: { type: true, subjectId: true },
    orderBy: { occurredAt: "desc" },
    take: SIGNAL_SWEEP_EVENT_LIMIT,
  });
  const plan = planSignalInvalidation(events);
  let invalidated = 0;
  if (planHasWork(plan)) {
    const affected = await resolveAffectedUserIds(plan);
    await invalidateSignals(affected);
    invalidated = affected.length;
  }

  // --- 2. Drift-meting -----------------------------------------------------
  // Alleen nog-verse snapshots zeggen iets: een al-verlopen rij wordt sowieso herberekend, dus een
  // verschil daar is geen bewijs van een gemiste invalidatie. De oudste eerst, zodat de steekproef
  // over de runs heen rondgaat.
  const candidates = await prisma.userSignalSnapshot.findMany({
    where: { staleAfter: { gt: now } },
    select: {
      userId: true,
      role: true,
      pendingTaskCount: true,
      unreadNotifications: true,
      badges: { select: { href: true, count: true, tone: true } },
    },
    orderBy: { computedAt: "asc" },
    take: SIGNAL_RECONCILE_SAMPLE,
  });

  let drifted = 0;
  for (const candidate of candidates) {
    const fresh = await recomputeSignalSnapshot(candidate.userId, candidate.role as UserRole, now);
    const diffs = diffSignals(
      {
        badges: toNavBadges(candidate.badges),
        pendingTaskCount: candidate.pendingTaskCount,
        unreadNotifications: candidate.unreadNotifications,
      },
      fresh,
    );
    if (diffs.length > 0) {
      drifted++;
      // Geen persoonsgegevens: alleen de sleutels die afweken (nav-hrefs + tellernamen).
      logger.warn("signal-snapshot: afwijking tussen snapshot en herberekening", {
        role: candidate.role,
        keys: diffs.join(","),
      });
    }
  }

  return {
    invalidated,
    unmappedEvents: plan.unmapped,
    reconciled: candidates.length,
    drifted,
  };
}
