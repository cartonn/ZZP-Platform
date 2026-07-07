import { type Metadata } from "next";
import Link from "next/link";
import { Headphones } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { ASSISTANT_NAME } from "@/lib/support/knowledge-base";
import { SUPPORT_STATUS_LABEL, SUPPORT_CATEGORY_LABEL } from "@/lib/support/labels";
import { ticketAgeLabel, ticketSla, SLA_BREACH_DAYS } from "@/lib/support/ticket-age";
import {
  type SupportTicketStatus,
  type SupportCategory,
  type SupportAuthorKind,
} from "@/lib/enums";
import { adminReply, adminResolve } from "./actions";
import { formatDateShortNl } from "@/lib/format-date";
import { TicketList, type TicketRow } from "./ticket-list";

export const metadata: Metadata = { title: "Helpdesk · ZZP Platform" };

const AUTHOR_LABEL: Record<SupportAuthorKind, string> = {
  USER: "Gebruiker",
  AGENT: "Helpdesk",
  ASSISTANT: ASSISTANT_NAME,
};

// De helpdesk-wachtrij: alles wat een medewerker nog moet oppakken. AWAITING_USER hoort erbij zodat
// een lopend gesprek zichtbaar blijft; opgeloste tickets vallen buiten de queue.
const QUEUE_STATUSES = [
  "ESCALATED",
  "REOPENED",
  "TRIAGED",
  "NEW",
  "AWAITING_USER",
] as const satisfies readonly SupportTicketStatus[];

// Korte uitleg per wachtrij-status voor de legenda onder de filters — zodat een nieuwe medewerker
// meteen weet wat elke status betekent zonder de codebase te kennen.
const STATUS_EXPLAIN: Record<(typeof QUEUE_STATUSES)[number], string> = {
  NEW: "net binnen, nog niet opgepakt",
  TRIAGED: "in behandeling",
  ESCALATED: "doorgezet naar de helpdesk",
  REOPENED: "opnieuw geopend na een antwoord",
  AWAITING_USER: "wacht op reactie van de aanvrager",
};

function parseStatusFilter(value: string | string[] | undefined): SupportTicketStatus | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v && (QUEUE_STATUSES as readonly string[]).includes(v) ? (v as SupportTicketStatus) : null;
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm transition-colors",
        active
          ? "border-accent-foreground/20 bg-accent text-accent-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN");
  const filter = parseStatusFilter((await searchParams).status);

  // Hele wachtrij ophalen; server sorteert oudst-aangemaakt eerst (langst open = grootste SLA-risico
  // bovenaan), zodat de rode SLA-chip logisch van boven naar beneden afneemt.
  // unbounded-allow: actieve queue met status-filter; structureel klein bij goede SLA
  const tickets = await prisma.supportTicket.findMany({
    where: { status: { in: [...QUEUE_STATUSES] } },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, select: { authorKind: true, body: true } },
    },
  });

  // Tellingen per status (over de volledige queue) voor de filter-pills.
  const counts = new Map<SupportTicketStatus, number>();
  for (const t of tickets) {
    const s = t.status as SupportTicketStatus;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const now = Date.now();
  const visible = filter ? tickets.filter((t) => t.status === filter) : tickets;
  const rows: TicketRow[] = visible.map((t) => {
    const sla = ticketSla(t.createdAt, now);
    return {
      id: t.id,
      subject: t.subject,
      status: t.status as SupportTicketStatus,
      userName: t.user.name ?? "Onbekend",
      categoryLabel: SUPPORT_CATEGORY_LABEL[t.category as SupportCategory],
      updatedLabel: formatDateShortNl(t.updatedAt),
      ageLabel: ticketAgeLabel(t.updatedAt, now),
      slaBreached: sla.breached,
      slaLabel: sla.label,
      messages: t.messages.map((m) => ({
        authorKind: m.authorKind as SupportAuthorKind,
        body: m.body,
      })),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helpdesk"
        description={<>Tickets die door de {ASSISTANT_NAME} naar een medewerker zijn doorgezet.</>}
      />

      {tickets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Headphones}
            title="Geen openstaande tickets"
            description="Vragen worden vaak direct beantwoord. Wat een mens nodig heeft, verschijnt hier."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <FilterPill href="/admin/support" active={filter === null}>
              Alle ({tickets.length})
            </FilterPill>
            {QUEUE_STATUSES.filter((s) => (counts.get(s) ?? 0) > 0).map((s) => (
              <FilterPill key={s} href={`/admin/support?status=${s}`} active={filter === s}>
                {SUPPORT_STATUS_LABEL[s]} ({counts.get(s)})
              </FilterPill>
            ))}
          </div>

          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {QUEUE_STATUSES.map((s) => (
              <div key={s} className="flex gap-1.5">
                <dt className="font-medium text-foreground">{SUPPORT_STATUS_LABEL[s]}</dt>
                <dd>— {STATUS_EXPLAIN[s]}</dd>
              </div>
            ))}
            <div className="flex gap-1.5">
              <dt className="text-destructive font-medium">SLA</dt>
              <dd>— rood na {SLA_BREACH_DAYS} dagen open</dd>
            </div>
          </dl>

          {rows.length === 0 ? (
            <Card>
              <EmptyState
                icon={Headphones}
                title="Geen tickets met dit filter"
                description="Kies een ander filter om andere tickets te zien."
              />
            </Card>
          ) : (
            <TicketList
              tickets={rows}
              authorLabels={AUTHOR_LABEL}
              adminReply={adminReply}
              adminResolve={adminResolve}
            />
          )}
        </div>
      )}
    </div>
  );
}
