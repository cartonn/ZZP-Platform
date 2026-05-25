import { type Metadata } from "next";
import { auth } from "@/auth";
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

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const role = user.role as UserRole;
  const intro = INTRO[role];
  const firstName = (user.name ?? "").split(" ")[0] || "daar";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {intro.title}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{intro.lead}</p>
      </header>

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
        <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          De fundering staat. De schermen hierboven worden in de volgende sessies
          opgeleverd (zie BUILD_ORDER.md).
        </p>
      </section>
    </div>
  );
}
