// CSV-export van het bemiddelaar-roster (`/franchise/zzpers`). Exporteert exact de op het scherm
// getoonde (gefilterde + gesorteerde) roster-rijen — dezelfde tenant-scope, dezelfde afleidingen
// (inzetbaarheid, certificaat-waarschuwing, afwezigheid, vrijkomdatum, re-engagement) en dezelfde
// filter-/sorteerhelpers als de pagina, zodat de export nooit afwijkt van wat de bemiddelaar ziet.
// Server-side waarheid (CLAUDE.md regel 1); read-only; alleen de eigen pool (tenant-gescopet).

import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { awayUntil } from "@/lib/availability";
import { type Availability, type AvailabilityWindowType } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";
import { computeEngageability } from "@/lib/engageability";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { summarizeExpiryAlert, expiryAlertLabel } from "@/lib/franchise/credential-alerts";
import { classifyRosterDormancy } from "@/lib/franchise/roster-dormancy";
import { freeDateFromActiveCollaborations } from "@/lib/franchise/roster-availability-forecast";
import {
  parseRosterFilter,
  filterRoster,
  sortRoster,
  type RosterZzper,
} from "@/lib/franchise/zzper-roster-filter";
import { rosterCsv, type RosterExportRow } from "@/lib/franchise/roster-export";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export const dynamic = "force-dynamic";

/** Render-rij: de filter-/sorteervorm (RosterZzper) + de extra CSV-velden (RosterExportRow). */
type Row = RosterZzper & RosterExportRow;

export async function GET(request: Request): Promise<Response> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }
  if (actor.role !== "FRANCHISER") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `franchise-roster:${actor.id}`);
  if (limited) return limited;

  const url = new URL(request.url);
  const sp: Record<string, string> = Object.fromEntries(url.searchParams.entries());
  const filter = parseRosterFilter(sp);
  const now = new Date();

  // unbounded-allow: franchise-tenant-scoped freelancers; beheerbaar volume (spiegelt de pagina).
  const freelancers = await prisma.freelancerProfile.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, identityVerifiedAt: true, lastLoginAt: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      skills: { include: { skill: { select: { name: true } } } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
      collaborations: { where: { status: "ACTIVE" }, select: { endDate: true } },
      _count: {
        select: {
          credentials: true,
          collaborations: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  const rows: Row[] = freelancers.map((f) => {
    const credentials = f.credentials.map(
      (c): FreelancerCredential => ({
        type: c.type as FreelancerCredential["type"],
        status: c.status as FreelancerCredential["status"],
        expiresAt: c.expiresAt,
      }),
    );
    const alert = summarizeExpiryAlert(
      f.credentials.map((c) => ({
        id: `${f.id}:${c.type}`,
        title: CREDENTIAL_TYPE_LABEL[c.type as keyof typeof CREDENTIAL_TYPE_LABEL] ?? c.type,
        type: c.type as FreelancerCredential["type"],
        status: c.status as FreelancerCredential["status"],
        expiresAt: c.expiresAt,
      })),
      now,
    );
    const eng = computeEngageability(
      {
        credentials,
        completeness: f.completeness,
        availability: f.availability as Availability,
        identityVerified: f.user.identityVerifiedAt != null,
        lastActiveAt: f.user.lastLoginAt,
      },
      now,
    );
    const away = awayUntil(
      f.availabilityWindows as { startDate: Date; endDate: Date; type: AvailabilityWindowType }[],
      now,
    );
    const dormancy = classifyRosterDormancy(
      { lastActiveAt: f.user.lastLoginAt, activeCollaborations: f._count.collaborations },
      now,
    );
    const alertLabel = expiryAlertLabel(alert);
    return {
      id: f.id,
      name: f.user.name ?? "—",
      email: f.user.email,
      headline: f.headline ?? null,
      location: f.location ?? null,
      workMode: f.workMode,
      skillLabels: f.skills.map((s) => s.skill.name),
      availability: f.availability,
      hourlyRate: f.hourlyRate,
      completeness: f.completeness,
      credentialCount: f._count.credentials,
      engageabilityStatus: eng.status,
      hasAlert: alertLabel != null,
      credentialAlert: alertLabel,
      activeCollaborations: f._count.collaborations,
      freeDate: freeDateFromActiveCollaborations(f.collaborations.map((c) => c.endDate)),
      awayUntil: away,
      unavailableNow: away != null,
      dormancyTier: dormancy.tier,
    } satisfies Row;
  });

  // Exact dezelfde filter-/sorteervorm als de pagina → de CSV bevat wat de bemiddelaar ziet.
  const visible = sortRoster(filterRoster(rows, filter), filter.sort);
  const csv = rosterCsv(visible);

  // AVG art. 5(2) (verantwoordingsplicht): leg de export van PII vast — parity met de andere
  // export-routes. Zo is "wie exporteerde wat wanneer" traceerbaar.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "ROSTER_EXPORTED",
      entityType: "FreelancerProfile",
      entityId: "self",
      metadata: { count: visible.length },
    }),
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="roster-${date}.csv"`,
    },
  });
}
