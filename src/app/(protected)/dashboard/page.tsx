import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { type UserRole } from "@/lib/enums";
import { recommendedJobs, type JobMatch } from "@/lib/recommendations";
import { clientCredentialAlerts, describeCredentialAlert } from "@/lib/collaboration-alerts";
import { Badge } from "@/components/ui/badge";
import { ComplianceBadge } from "@/components/compliance-badge";

export const metadata: Metadata = { title: "Dashboard · ZZP Platform" };

const WERKPLEK: Record<UserRole, string> = {
  FREELANCER: "ZZP-werkplek",
  CLIENT: "Opdrachtgever-werkplek",
  ADMIN: "Beheerwerkplek",
};

const INTRO: Record<UserRole, { lead: string; next: string[] }> = {
  FREELANCER: {
    lead: "Beheer je profiel, certificaten en reacties op opdrachten op één plek.",
    next: [
      "Maak je profiel compleet zodat opdrachtgevers je vinden.",
      "Upload je VOG en diploma's en vraag verificatie aan.",
      "Reageer op opdrachten die bij je passen.",
    ],
  },
  CLIENT: {
    lead: "Plaats opdrachten en zie in één oogopslag welke kandidaten geverifieerd zijn.",
    next: [
      "Vul je bedrijfsprofiel aan.",
      "Plaats je eerste opdracht met de vereiste certificaten.",
      "Bekijk kandidaten en hun compliance-status.",
    ],
  },
  ADMIN: {
    lead: "Verifieer certificaten, beheer gebruikers en bewaak de kwaliteit van het platform.",
    next: [
      "Werk de verificatiequeue bij.",
      "Controleer gebruikers en rollen.",
      "Bekijk de audit trail van gevoelige acties.",
    ],
  },
};

interface Stat {
  label: string;
  value: string | number;
  href: string;
}
interface Attention {
  label: string;
  href: string;
}

async function dashboardData(role: UserRole, userId: string): Promise<{ stats: Stat[]; attention: Attention[] }> {
  const attention: Attention[] = [];

  if (role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId }, select: { id: true, completeness: true } });
    const pid = profile?.id;
    const soon = new Date(Date.now() + 30 * 86400_000);
    const now = new Date();
    const [applications, verified, rejected, expiring, account] = await Promise.all([
      pid ? prisma.application.count({ where: { freelancerId: pid } }) : Promise.resolve(0),
      pid ? prisma.credential.count({ where: { freelancerProfileId: pid, status: "VERIFIED" } }) : Promise.resolve(0),
      pid ? prisma.credential.count({ where: { freelancerProfileId: pid, status: "REJECTED" } }) : Promise.resolve(0),
      pid ? prisma.credential.count({ where: { freelancerProfileId: pid, status: "VERIFIED", expiresAt: { gt: now, lte: soon } } }) : Promise.resolve(0),
      prisma.user.findUnique({ where: { id: userId }, select: { identityVerifiedAt: true } }),
    ]);
    if (!account?.identityVerifiedAt) attention.push({ label: "Verifieer je identiteit voor een hoger vertrouwensniveau", href: "/account" });
    if ((profile?.completeness ?? 0) < 100) attention.push({ label: `Profiel is ${profile?.completeness ?? 0}% compleet — vul aan`, href: "/profiel" });
    if (rejected > 0) attention.push({ label: `${rejected} certificaat/certificaten afgewezen — opnieuw indienen`, href: "/certificaten" });
    if (expiring > 0) attention.push({ label: `${expiring} certificaat verloopt binnenkort — vernieuw`, href: "/certificaten" });
    return {
      stats: [
        { label: "Profiel compleet", value: `${profile?.completeness ?? 0}%`, href: "/profiel" },
        { label: "Geverifieerde certificaten", value: verified, href: "/certificaten" },
        { label: "Mijn reacties", value: applications, href: "/reacties" },
      ],
      attention,
    };
  }

  if (role === "CLIENT") {
    const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
    const cid = company?.id;
    const [openJobs, newApps, drafts, activeCollabs, credentialAlerts] = await Promise.all([
      cid ? prisma.job.count({ where: { companyId: cid, status: "PUBLISHED" } }) : Promise.resolve(0),
      cid ? prisma.application.count({ where: { job: { companyId: cid }, status: "NEW" } }) : Promise.resolve(0),
      cid ? prisma.job.count({ where: { companyId: cid, status: "DRAFT" } }) : Promise.resolve(0),
      cid ? prisma.collaboration.count({ where: { companyId: cid, status: "ACTIVE" } }) : Promise.resolve(0),
      clientCredentialAlerts(userId),
    ]);
    // Compliance van een lopende samenwerking weegt het zwaarst — bovenaan.
    for (const a of credentialAlerts) {
      attention.push({ label: describeCredentialAlert(a.freelancerName, a.jobTitle, a.alert), href: "/samenwerkingen" });
    }
    if (newApps > 0) attention.push({ label: `${newApps} nieuwe reactie(s) — beoordeel kandidaten`, href: "/kandidaten" });
    if (drafts > 0) attention.push({ label: `${drafts} concept-opdracht(en) — publiceren?`, href: "/opdrachten" });
    return {
      stats: [
        { label: "Gepubliceerde opdrachten", value: openJobs, href: "/opdrachten" },
        { label: "Nieuwe reacties", value: newApps, href: "/kandidaten" },
        { label: "Actieve samenwerkingen", value: activeCollabs, href: "/samenwerkingen" },
      ],
      attention,
    };
  }

  const [pending, users, jobs] = await Promise.all([
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    prisma.user.count(),
    prisma.job.count(),
  ]);
  if (pending > 0) attention.push({ label: `${pending} certificaat/certificaten wachten op verificatie`, href: "/admin/verificaties" });
  return {
    stats: [
      { label: "Openstaande verificaties", value: pending, href: "/admin/verificaties" },
      { label: "Gebruikers", value: users, href: "/admin/gebruikers" },
      { label: "Opdrachten", value: jobs, href: "/admin/opdrachten" },
    ],
    attention,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const role = user.role as UserRole;
  const intro = INTRO[role];
  const firstName = (user.name ?? "").split(" ")[0] || "daar";
  const today = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  const [{ stats, attention }, matches] = await Promise.all([
    dashboardData(role, user.id!),
    role === "FREELANCER" ? recommendedJobs(user.id!) : Promise.resolve<JobMatch[]>([]),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {WERKPLEK[role]} · {today}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Welkom terug, {firstName}</h1>
        <p className="text-sm text-muted-foreground">
          {attention.length === 0
            ? intro.lead
            : attention.length === 1
              ? "Er is 1 punt dat je aandacht vraagt."
              : `Er zijn ${attention.length} punten die je aandacht vragen.`}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/40 focus-ring"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Vraagt aandacht</h2>
        </div>
        {attention.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            Niets dat nu aandacht vraagt. Goed bezig.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {attention.map((a) => (
              <li key={a.label}>
                <Link href={a.href} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-muted/40 focus-ring">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
                    {a.label}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {matches.length > 0 && (
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Opdrachten die bij je passen</h2>
            <Link href="/opdrachten" className="text-xs text-muted-foreground hover:text-foreground focus-ring">
              Alle opdrachten
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {matches.map((m) => (
              <li key={m.jobId}>
                <Link
                  href={`/opdrachten/${m.jobId}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-muted/40 focus-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{m.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{m.companyName}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <ComplianceBadge status={m.compliance} />
                    <Badge variant="muted">Match {m.score}%</Badge>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-medium">Volgende stappen</h2>
        <ul className="mt-3 space-y-2">
          {intro.next.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-medium text-foreground">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
