import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, MessageSquarePlus, Users } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { avatarAccent } from "@/lib/avatar-accent";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { plural } from "@/lib/plural";
import { startFranchiseConversation } from "../actions";

export const metadata: Metadata = { title: "Nieuw gesprek · Bemiddeling" };

interface Contact {
  userId: string;
  name: string;
  subtitle: string | null;
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

/**
 * FRANCHISER kiest een contact binnen de eigen bemiddeling om een gesprek mee te starten: een
 * ZZP'er uit het eigen roster of een opdrachtgever. Server-rendered keuzelijst (geen zware
 * client-state); elke keuze roept de tenant-gescopete server action aan die het gesprek start of
 * heropent.
 */
export default async function NieuwGesprekPage() {
  const actor = await requireRole("FRANCHISER");
  const scope = tenantScopeWhere(actor);

  // Begrensde picker: de recentste contacten per groep. Een bemiddeling met meer contacten
  // gebruikt de gerichte roster-/opdrachtgeverpagina's; deze snelkeuze blijft licht en bounded.
  const [freelancers, companies] = await Promise.all([
    prisma.freelancerProfile.findMany({
      where: { ...scope, user: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        headline: true,
        location: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.company.findMany({
      where: { ...scope, user: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        name: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const zzpers: Contact[] = freelancers.map((f) => ({
    userId: f.user.id,
    name: f.user.name ?? f.user.email,
    subtitle: f.headline ?? f.location ?? f.user.email,
  }));
  const opdrachtgevers: Contact[] = companies.map((c) => ({
    userId: c.user.id,
    name: c.user.name ?? c.user.email,
    subtitle: c.name,
  }));

  const hasContacts = zzpers.length > 0 || opdrachtgevers.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/berichten"
          className="focus-ring -ml-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar berichten
        </Link>
        <div className="mt-2">
          <PageHeader
            title="Nieuw gesprek"
            description="Start een gesprek met een ZZP'er uit je roster of een opdrachtgever."
          />
        </div>
      </div>

      {!hasContacts ? (
        <Card>
          <EmptyState
            icon={MessageSquarePlus}
            title="Nog geen contacten"
            description="Zodra je ZZP'ers of opdrachtgevers in je bemiddeling hebt, kun je hen hier direct aanschrijven."
          />
        </Card>
      ) : (
        <div className="space-y-8">
          <ContactGroup
            icon={Users}
            title="ZZP'ers"
            count={zzpers.length}
            singular="ZZP'er"
            plural="ZZP'ers"
            emptyLabel="Nog geen ZZP'ers in je roster."
            contacts={zzpers}
          />
          <ContactGroup
            icon={Building2}
            title="Opdrachtgevers"
            count={opdrachtgevers.length}
            singular="opdrachtgever"
            plural="opdrachtgevers"
            emptyLabel="Nog geen opdrachtgevers."
            contacts={opdrachtgevers}
          />
        </div>
      )}
    </div>
  );
}

function ContactGroup({
  icon: Icon,
  title,
  count,
  singular,
  plural: pluralLabel,
  emptyLabel,
  contacts,
}: {
  icon: typeof Users;
  title: string;
  count: number;
  singular: string;
  plural: string;
  emptyLabel: string;
  contacts: Contact[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {count > 0 ? plural(count, singular, pluralLabel) : ""}
        </span>
      </div>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {contacts.map((c) => (
            <div key={c.userId} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarAccent(
                    c.userId,
                  )}`}
                  aria-hidden
                >
                  {initials(c.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>
                  )}
                </div>
              </div>
              <form action={startFranchiseConversation.bind(null, c.userId)} className="shrink-0">
                <PendingSubmitButton size="sm" variant="secondary">
                  Bericht
                </PendingSubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
