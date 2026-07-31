import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import {
  LEGAL_BASIS_LABEL,
  PROCESSING_REGISTER,
  RETENTION_SCHEDULE,
} from "@/lib/compliance/processing-register";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

export async function GET() {
  // Consistente auth-foutafhandeling met de andere export-routes (o.a. /api/account/export): een
  // niet-ingelogde aanroep levert een nette JSON-401 i.p.v. een propagerende 500. De middleware
  // (isAdminPath) blokkeert dit pad al vóór de handler, dus dit is defense-in-depth.
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  if (actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `admin-avg:${actor.id}`);
  if (limited) return limited;

  // Audit alles wat telt (CLAUDE.md regel 5): een beheerder die het verwerkingsregister/de
  // bewaartermijnen exporteert is een verantwoordingswaardige admin-actie op compliance-materiaal —
  // pariteit met de andere export-routes, die elk hun export auditen.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "AVG_REGISTER_EXPORTED",
      entityType: "ProcessingRegister",
      entityId: actor.id,
      ...(await requestMeta()),
    }),
  });

  const registerHeader = [
    "Verwerking",
    "Doel",
    "Rechtsgrond",
    "Betrokkenen",
    "Gegevenscategorieën",
    "Gevoelig",
    "Ontvangers",
    "Bewaartermijn",
    "Beveiliging",
  ] as const;

  const registerRows: (readonly string[])[] = PROCESSING_REGISTER.map((a) => [
    a.name,
    a.purpose,
    LEGAL_BASIS_LABEL[a.legalBasis],
    a.dataSubjects.join(" | "),
    a.dataCategories.join(" | "),
    a.sensitive ? "Ja" : "Nee",
    a.recipients.join(" | "),
    a.retention,
    a.securityMeasures.join(" | "),
  ]);

  const retentionHeader = ["Gegevenscategorie", "Bewaartermijn", "Grondslag"] as const;

  const retentionRows: (readonly string[])[] = RETENTION_SCHEDULE.map((r) => [
    r.category,
    r.period,
    r.rationale,
  ]);

  const rows: (readonly string[])[] = [
    registerHeader,
    ...registerRows,
    // Lege scheidingsrij
    ["", "", "", "", "", "", "", "", ""],
    retentionHeader,
    ...retentionRows,
  ];

  const csv = toCsv(rows);

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="verwerkingsregister-${date}.csv"`,
    },
  });
}
