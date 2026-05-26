import { type Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { type UserRole } from "@/lib/enums";

export const metadata: Metadata = { title: "Dashboard · ZZP Platform" };

const INTRO: Record<UserRole, { title: string; lead: string; next: string[] }> = {
  FREELANCER: {
    title: "Welkom terug",
    lead: "Beheer je profiel, certificaten en reacties op opdrachten op één plek.",
    next: [
      "Maak je profiel compleet zodat opdrachtgevers je vinden.",
      "Upload je VOG en diploma's en vraag verificatie aan.",
      "Reageer op opdrachten die bij je passen.",
    ],
  },
  CLIENT: {
    title: "Welkom terug",
    lead: "Plaats opdrachten en zie in één oogopslag welke kandidaten geverifieerd zijn.",
    next: [
      "Vul je bedrijfsprofiel aan.",
      "Plaats je eerste opdracht met de vereiste certificaten.",
      "Bekijk kandidaten en hun compliance-status.",
    ],
  },
  ADMIN: {
    title: "Beheeroverzicht",
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

async function statsForRole(role: UserRole, userId: string): Promise<Stat[]> {
  if (role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId }, select: { id: true, completeness: true } });
    const [applications, verified] = await Promise.all([
      profile ? prisma.application.count({ where: { freelancerId: profile.id } }) : Promise.resolve(0),
      profile ? prisma.credential.count({ where: { freelancerProfileId: profile.id, status: "VERIFIED" } }) : Promise.resolve(0),
    ]);
    return [
      { label: "Profiel compleet", value: `${profile?.completeness ?? 0}%`, href: "/profiel" },
      { label: "Geverifieerde certificaten", value: verified, href: "/certificaten" },
      { label: "Mijn reacties", value: applications, href: "/reacties" },
    ];
  }
  if (role === "CLIENT") {
    const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
    const [openJobs, newApps, activeCollabs] = await Promise.all([
      company ? prisma.job.count({ where: { companyId: company.id, status: "PUBLISHED" } }) : Promise.resolve(0),
      company ? prisma.application.count({ where: { job: { companyId: company.id }, status: "NEW" } }) : Promise.resolve(0),
      company ? prisma.collaboration.count({ where: { companyId: company.id, status: "ACTIVE" } }) : Promise.resolve(0),
    ]);
    return [
      { label: "Gepubliceerde opdrachten", value: openJobs, href: "/opdrachten" },
      { label: "Nieuwe reacties", value: newApps, href: "/kandidaten" },
      { label: "Actieve samenwerkingen", value: activeCollabs, href: "/samenwerkingen" },
    ];
  }
  const [pending, users, jobs] = await Promise.all([
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    prisma.user.count(),
    prisma.job.count(),
  ]);
  return [
    { label: "Openstaande verificaties", value: pending, href: "/admin/verificaties" },
    { label: "Gebruikers", value: users, href: "/admin/gebruikers" },
    { label: "Opdrachten", value: jobs, href: "/admin/opdrachten" },
  ];
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const role = user.role as UserRole;
  const intro = INTRO[role];
  const firstName = (user.name ?? "").split(" ")[0] || "daar";
  const stats = await statsForRole(role, user.id!);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {intro.title}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{intro.lead}</p>
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
