import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert, ShieldCheck, Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { DBA_DISCLAIMER } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildComplianceDossier, type DossierInput } from "@/lib/compliance/dossier";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Compliance-dossier · ZZP Platform" };

function parseReasons(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor();

  const col = await prisma.collaboration.findUnique({
    where: { id },
    include: {
      job: { select: { title: true, dbaRisk: true, dbaReasons: true, modelAgreementType: true } },
      company: { select: { name: true, userId: true } },
      freelancer: {
        select: {
          userId: true,
          user: { select: { name: true } },
          credentials: { select: { type: true, title: true, status: true, verifiedAt: true } },
        },
      },
      performances: { select: { description: true, status: true, approvedAt: true } },
      invoices: {
        select: { number: true, lifecycleStatus: true, totalCents: true, issuedAt: true },
      },
    },
  });
  if (!col) notFound();
  // Ownership: opdrachtgever (eigenaar), de ZZP'er zelf, of admin.
  const isClient = col.company.userId === actor.id;
  const isFreelancer = col.freelancer.userId === actor.id;
  if (!isClient && !isFreelancer && actor.role !== "ADMIN") notFound();

  const input: DossierInput = {
    jobTitle: col.job.title,
    freelancerName: col.freelancer.user.name,
    companyName: col.company.name,
    contractStatus: col.contractStatus,
    dbaRisk: col.job.dbaRisk,
    dbaReasons: parseReasons(col.job.dbaReasons),
    modelAgreementType: col.job.modelAgreementType,
    credentials: col.freelancer.credentials,
    performances: col.performances,
    invoices: col.invoices.map((i) => ({
      number: i.number,
      lifecycleStatus: i.lifecycleStatus,
      totalCents: i.totalCents,
      submittedAt: i.issuedAt,
    })),
    startDate: col.startDate,
    createdAt: col.createdAt,
  };
  const dossier = buildComplianceDossier(input);
  const totalInvoiced = col.invoices.reduce((s, i) => s + i.totalCents, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            Compliance-dossier
          </h1>
          <p className="text-sm text-muted-foreground">
            {dossier.jobTitle} · {dossier.freelancerName}
            {dossier.attentionCount > 0
              ? ` · ${plural(dossier.attentionCount, "aandachtspunt", "aandachtspunten")}`
              : " · alles compleet"}
          </p>
        </div>
        <a
          href={`/api/samenwerkingen/${id}/dossier`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Download className="size-3.5" aria-hidden /> Exporteer bundel
        </a>
      </header>

      <section className="space-y-2">
        {dossier.sections.map((s) => (
          <Card key={s.key} className={s.attention ? "border-warning/40" : ""}>
            <CardContent className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.summary}</p>
              </div>
              <Badge variant={s.attention ? "warning" : "success"}>
                {s.attention ? "Let op" : "Compleet"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Totaal gefactureerd</h2>
        <Card>
          <CardContent className="py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Som van facturen in deze samenwerking</span>
              <span className="font-medium tabular-nums">{formatEuro(totalInvoiced)}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Tijdlijn</h2>
        <Card>
          <CardContent className="space-y-2 py-3">
            {dossier.timeline.map((t, i) => (
              <div key={i} className="flex items-baseline gap-3 text-sm">
                <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatDateShortNl(t.at)}
                </span>
                <span>{t.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {DBA_DISCLAIMER} Dit dossier documenteert feiten en signalen ter onderbouwing; het is geen
        goedkeuring of vrijwaring. De feitelijke werkwijze is bepalend.
      </p>
    </div>
  );
}
