import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Clock,
  Receipt,
  FolderOpen,
  History,
  AlertTriangle,
} from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getRosterDossier, type RosterDossier } from "@/lib/franchise/roster-dossier";
import { summarizeExpiry } from "@/lib/credential-expiry-overview";
import { plural } from "@/lib/plural";
import { type PerformanceState } from "@/lib/lifecycles";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { formatEuro } from "@/lib/invoices";
import { formatDateShortNl, formatDateRangeNl, formatDateTimeNl } from "@/lib/format-date";
import { auditActionLabel } from "@/lib/audit-labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AvailabilityBadge } from "@/components/availability-badge";
import { EngageabilityBadge } from "@/components/engageability-badge";
import { EngageabilityExplanation } from "@/components/engageability-explanation";
import { CredentialStatusBadge } from "@/components/credentials/credential-status-badge";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";

export const metadata: Metadata = { title: "ZZP'er · Franchise" };

const TABS = ["profiel", "overeenkomsten", "uren", "facturen", "bestanden", "logboek"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  profiel: "Profiel",
  overeenkomsten: "Overeenkomsten",
  uren: "Urenregistraties",
  facturen: "Facturen",
  bestanden: "Bestanden",
  logboek: "Logboek",
};

const PERF_STATUS: Record<
  PerformanceState,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ingediend", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
};

const STAGE_VARIANT: Record<string, "warning" | "muted" | "success"> = {
  attention: "warning",
  info: "muted",
  success: "success",
};

export default async function RosterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireRole("FRANCHISER");
  const dossier = await getRosterDossier(actor, id);
  if (!dossier) notFound();

  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as Tab) : "profiel";
  const { profile, counts } = dossier;

  // Proactief vervalsignaal: meest urgente verlopende/verlopen certificaten bovenaan, zodat de
  // franchiser actie kan ondernemen vóórdat een verplicht bewijsstuk verloopt.
  const expiry = summarizeExpiry(dossier.credentials);

  const tabCount: Record<Tab, number | null> = {
    profiel: null,
    overeenkomsten: counts.collaborations,
    uren: counts.performances,
    facturen: counts.invoices,
    bestanden: counts.credentials,
    logboek: null,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/franchise/zzpers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Terug naar ZZP&apos;ers
      </Link>
      <PageHeader
        title={profile.name}
        description={`${profile.headline ?? profile.email}${
          profile.location ? ` · ${profile.location}` : ""
        }`}
        action={
          // Twee verschillende assen: inzetbaarheid (compliance-blokkade) vs. beschikbaarheid (agenda).
          // Expliciet gelabeld zodat een rood "Nog niet inzetbaar" náást een groen "Beschikbaar" niet
          // als tegenstrijdigheid leest.
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              Inzetbaarheid
              <EngageabilityBadge status={dossier.engageability.status} />
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              Beschikbaarheid
              <AvailabilityBadge status={profile.availability} />
            </span>
          </div>
        }
      />

      {expiry.total > 0 && <ExpiryAlertBand expiry={expiry} />}

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Dossier-onderdelen">
        {TABS.map((t) => {
          const active = t === tab;
          const c = tabCount[t];
          return (
            <Link
              key={t}
              href={
                t === "profiel" ? `/franchise/zzpers/${id}` : `/franchise/zzpers/${id}?tab=${t}`
              }
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-full bg-primary px-3 py-1 text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }
            >
              {TAB_LABEL[t]}
              {c != null && c > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground/70">({c})</span>
              )}
            </Link>
          );
        })}
      </nav>

      {tab === "profiel" && <ProfielTab dossier={dossier} />}
      {tab === "overeenkomsten" && <OvereenkomstenTab dossier={dossier} />}
      {tab === "uren" && <UrenTab dossier={dossier} />}
      {tab === "facturen" && <FacturenTab dossier={dossier} />}
      {tab === "bestanden" && <BestandenTab dossier={dossier} />}
      {tab === "logboek" && <LogboekTab dossier={dossier} />}
    </div>
  );
}

function ExpiryAlertBand({ expiry }: { expiry: ReturnType<typeof summarizeExpiry> }) {
  // Toon de twee meest urgente bewijsstukken expliciet; de rest in een telling.
  const lead = expiry.items.slice(0, 2);
  const rest = expiry.total - lead.length;
  // Verlopen = danger, anders bijna-verlopen = warning. Eén band, geen kaart-in-kaart.
  const hasExpired = expiry.expired > 0;
  const tone = hasExpired
    ? "border-danger/30 bg-danger/10 text-danger"
    : "border-warning/30 bg-warning/15 text-warning";

  const heading = hasExpired
    ? `${plural(expiry.expired, "certificaat is", "certificaten zijn")} verlopen`
    : `${plural(expiry.total, "certificaat verloopt", "certificaten verlopen")} binnenkort`;

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${tone}`} role="status">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-medium">{heading}</p>
        <p className="mt-0.5 text-xs">
          {lead.map((i, idx) => (
            <span key={i.id}>
              {idx > 0 && " · "}
              {i.title}{" "}
              {i.days < 0
                ? "verlopen"
                : i.days === 0
                  ? "verloopt vandaag"
                  : `verloopt over ${i.days} d`}
            </span>
          ))}
          {rest > 0 && ` · +${plural(rest, "ander bewijsstuk", "andere bewijsstukken")}`}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function ProfielTab({ dossier }: { dossier: RosterDossier }) {
  const { profile } = dossier;
  const WORKMODE: Record<string, string> = {
    REMOTE: "Remote",
    ONSITE: "Op locatie",
    HYBRID: "Hybride",
  };
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Inzetbaarheid</h2>
          <EngageabilityExplanation result={dossier.engageability} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profile.hourlyRate != null && <Badge variant="muted">€ {profile.hourlyRate}/uur</Badge>}
          <Badge variant="muted">Profiel {profile.completeness}%</Badge>
          {profile.maxTravelMinutes != null && (
            <Badge variant="muted">max. {profile.maxTravelMinutes} min reizen</Badge>
          )}
        </div>
        {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Werkmodus" value={WORKMODE[profile.workMode] ?? profile.workMode} />
          <Field label="Locatie" value={profile.location ?? "—"} />
          <Field
            label="Talen"
            value={profile.languages.length ? profile.languages.join(", ") : "—"}
          />
          <Field label="KvK" value={profile.kvkNumber ?? "—"} />
          <Field label="Btw" value={profile.btwNumber ?? "—"} />
          <Field label="E-mail" value={profile.email} />
        </dl>

        <div>
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Skills</h2>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen skills vastgelegd.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <Badge key={s} variant="muted">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {profile.industries.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold tracking-tight">Branches</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.industries.map((i) => (
                <Badge key={i} variant="muted">
                  {i}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OvereenkomstenTab({ dossier }: { dossier: RosterDossier }) {
  if (dossier.collaborations.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="Nog geen overeenkomsten"
          description="Zodra deze ZZP'er een dienst aanneemt, verschijnt de samenwerking hier met de actuele fase."
        />
      </Card>
    );
  }
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {dossier.collaborations.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{c.jobTitle}</p>
            <p className="truncate text-sm text-muted-foreground">{c.companyName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateRangeNl(c.startDate, c.endDate)}
              {c.rate != null && ` · € ${c.rate}/uur`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <Badge variant={STAGE_VARIANT[c.stage.tone] ?? "muted"}>{c.stage.badgeLabel}</Badge>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              stap {c.stage.step}/{c.stage.totalSteps}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function UrenTab({ dossier }: { dossier: RosterDossier }) {
  const hours = dossier.performances.filter((p) => p.type === "HOURS");
  const milestones = dossier.performances.filter((p) => p.type === "MILESTONE");
  if (dossier.performances.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Clock}
          title="Nog geen urenregistraties"
          description="Ingediende urenstaten en opleveringen van deze ZZP'er verschijnen hier."
        />
      </Card>
    );
  }
  const totalApprovedHours = hours
    .filter((p) => p.status === "APPROVED")
    .reduce((sum, p) => sum + (p.hours ?? 0), 0);
  return (
    <div className="space-y-4">
      {totalApprovedHours > 0 && (
        <p className="text-sm text-muted-foreground">
          Goedgekeurd:{" "}
          <span className="font-medium tabular-nums text-foreground">{totalApprovedHours}</span> uur
        </p>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {dossier.performances.map((p) => {
          const s = PERF_STATUS[p.status];
          return (
            <div key={p.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.jobTitle}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateRangeNl(p.periodStart, p.periodEnd)}
                  {p.type === "HOURS" && p.hours != null && ` · ${p.hours} uur`}
                  {p.type === "MILESTONE" &&
                    p.amountCents != null &&
                    ` · ${formatEuro(p.amountCents)}`}
                </p>
              </div>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
          );
        })}
      </div>
      {milestones.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {plural(milestones.length, "oplevering", "opleveringen")} ·{" "}
          {plural(hours.length, "urenstaat", "urenstaten")}
        </p>
      )}
    </div>
  );
}

function FacturenTab({ dossier }: { dossier: RosterDossier }) {
  if (dossier.invoices.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Receipt}
          title="Nog geen facturen"
          description="Facturen die deze ZZP'er uitschrijft verschijnen hier — registratie, geen betaling via het platform."
        />
      </Card>
    );
  }
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {dossier.invoices.map((i) => (
        <div key={i.id} className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{i.number ?? "Concept"}</p>
            <p className="truncate text-sm text-muted-foreground">{i.companyName ?? "—"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {i.issuedAt ? `verstuurd ${formatDateShortNl(i.issuedAt)}` : "nog niet verstuurd"}
              {i.dueAt && ` · vervalt ${formatDateShortNl(i.dueAt)}`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-medium tabular-nums">{formatEuro(i.totalCents)}</p>
            <div className="mt-1">
              <InvoiceStatusBadge status={i.status} dueAt={i.dueAt} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BestandenTab({ dossier }: { dossier: RosterDossier }) {
  if (dossier.credentials.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FolderOpen}
          title="Nog geen bestanden"
          description="Certificaten en bewijsstukken die de ZZP'er uploadt verschijnen hier zodra ze zijn ingediend."
        />
      </Card>
    );
  }
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {dossier.credentials.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{c.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {CREDENTIAL_TYPE_LABEL[c.type] ?? c.type}
              {c.documentFilename && ` · ${c.documentFilename}`}
              {c.expiresAt && ` · verloopt ${formatDateShortNl(c.expiresAt)}`}
            </p>
          </div>
          <CredentialStatusBadge status={c.status} />
        </div>
      ))}
    </div>
  );
}

function LogboekTab({ dossier }: { dossier: RosterDossier }) {
  if (dossier.logbook.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={History}
          title="Nog geen logboekregels"
          description="Wijzigingen aan dit profiel die in de audit trail belanden, verschijnen hier."
        />
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-5">
        <ol className="space-y-3">
          {dossier.logbook.map((l) => (
            <li key={l.id} className="flex items-start gap-3 text-sm">
              <ClipboardList className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p>{auditActionLabel(l.action)}</p>
                <p className="text-xs text-muted-foreground">{formatDateTimeNl(l.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
