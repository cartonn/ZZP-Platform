import { type Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { relativeTime } from "@/lib/relative-time";
import {
  CONVERSATION_STALE_DAYS,
  conversationTurn,
  daysSince,
  isStaleAwaitingReply,
  staleLabel,
  summarizeConversationTurns,
  type ConversationTurn,
} from "@/lib/conversation-turn";
import {
  conversationFilterParams,
  countConversations,
  filterConversations,
  parseConversationFilter,
  type ConversationFilterStatus,
  type FilterableConversation,
} from "@/lib/conversation-filter";

export const metadata: Metadata = { title: "Berichten · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Gedeelde recency-helper (DRY, één bron met /reacties + /notificaties). Deze lijst is NL; we
// geven een identiteits-translator mee zodat de teksten onveranderd blijven.
const nl = (s: string) => s;

export default async function BerichtenPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireActor();
  const filter = parseConversationFilter(await searchParams);

  // Alleen het laatste bericht meeladen; ongelezen tellen we per conversatie met een
  // goedkope COUNT (niet alle berichten ophalen) — perf-fix Sessie 9.
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: actor.id } } },
    orderBy: { updatedAt: "desc" },
    include: {
      job: { select: { title: true } },
      participants: { include: { user: { select: { id: true, name: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  const unreadByConversation = new Map(
    await Promise.all(
      conversations.map(async (c) => {
        const me = c.participants.find((p) => p.user.id === actor.id);
        const count = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: actor.id },
            ...(me?.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}),
          },
        });
        return [c.id, count] as const;
      }),
    ),
  );

  // Aan-zet-signaal per gesprek: wiens beurt + (voor de wachtende kant) of het stilligt.
  // Leunt op het al opgehaalde laatste bericht + de bestaande ongelezen-telling.
  const now = new Date();
  const turnByConversation = new Map<string, { turn: ConversationTurn; staleDays: number }>(
    conversations.map((c) => {
      const last = c.messages[0] ?? null;
      const turn = conversationTurn({
        lastMessage: last,
        unreadFromOther: unreadByConversation.get(c.id) ?? 0,
        viewerId: actor.id,
      });
      const stale = isStaleAwaitingReply(turn, last, now);
      return [c.id, { turn, staleDays: stale && last ? daysSince(last.createdAt, now) : 0 }];
    }),
  );

  const summary = summarizeConversationTurns(
    [...turnByConversation.values()].map((t) => ({ turn: t.turn, stale: t.staleDays > 0 })),
  );
  const hasSignal = summary.awaitingYou > 0 || summary.awaitingThem > 0;

  // Filter + zoeken (server-side, via de URL). De rijen dragen het al-berekende aan-zet-
  // signaal + de tegenpartij/opdrachttitel zodat de pure filter erop kan matchen.
  type Row = FilterableConversation & { conversation: (typeof conversations)[number] };
  const rows: Row[] = conversations.map((c) => ({
    conversation: c,
    turn: turnByConversation.get(c.id)?.turn ?? "none",
    otherName: c.participants.find((p) => p.user.id !== actor.id)?.user.name ?? "Onbekend",
    jobTitle: c.job?.title ?? null,
  }));
  const counts = countConversations(rows, filter.query);
  const visibleRows = filterConversations(rows, filter);

  const filterTabs: { key: ConversationFilterStatus; label: string; count: number }[] = [
    { key: "all", label: "Alle", count: counts.all },
    { key: "awaiting-you", label: "Wacht op jou", count: counts.awaitingYou },
    { key: "awaiting-them", label: "Wacht op antwoord", count: counts.awaitingThem },
  ];

  const isFranchiser = actor.role === "FRANCHISER";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Berichten"
        description="Je gesprekken met opdrachtgevers en ZZP'ers."
        action={
          isFranchiser ? (
            <Button asChild size="sm">
              <Link href="/berichten/nieuw">
                <Plus className="size-4" aria-hidden /> Nieuw gesprek
              </Link>
            </Button>
          ) : undefined
        }
      />

      {hasSignal && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {summary.awaitingYou > 0 && (
            <Badge variant="warning">{summary.awaitingYou} wacht op jouw antwoord</Badge>
          )}
          {summary.awaitingThem > 0 && (
            <Badge variant="muted">{summary.awaitingThem} wacht op antwoord</Badge>
          )}
          {summary.stale > 0 && (
            <span className="text-muted-foreground">
              waarvan {summary.stale} al {CONVERSATION_STALE_DAYS}+ dagen stil
            </span>
          )}
        </div>
      )}

      {conversations.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="Nog geen gesprekken"
            description={
              isFranchiser
                ? "Start zelf een gesprek met een ZZP'er uit je roster of een opdrachtgever."
                : "Een opdrachtgever start een gesprek vanuit een reactie op een opdracht."
            }
            action={isFranchiser ? { label: "Nieuw gesprek", href: "/berichten/nieuw" } : undefined}
          />
        </Card>
      ) : (
        <>
          {/* Filter (aan zet) + zoeken — server-side via de URL, deelbaar/herlaadbaar. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {filterTabs.map((tab) => {
                const active = filter.status === tab.key;
                return (
                  <Link
                    key={tab.key}
                    href={`/berichten${conversationFilterParams({ status: tab.key, query: filter.query })}`}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-border bg-foreground text-background"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </Link>
                );
              })}
            </div>
            <form method="get" action="/berichten" className="flex items-center gap-2">
              {filter.status !== "all" && (
                <input type="hidden" name="status" value={filter.status} />
              )}
              <input
                type="search"
                name="q"
                defaultValue={filter.query}
                placeholder="Zoek op naam of opdracht"
                aria-label="Zoek in gesprekken"
                className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
              />
            </form>
          </div>

          {visibleRows.length === 0 ? (
            <Card>
              <EmptyState
                icon={MessageSquare}
                title="Geen gesprekken in deze selectie"
                description="Pas het filter of de zoekterm aan om meer gesprekken te zien."
              />
            </Card>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {visibleRows.map(({ conversation: c }) => {
                const other = c.participants.find((p) => p.user.id !== actor.id);
                const last = c.messages[0];
                const unread = unreadByConversation.get(c.id) ?? 0;
                const turnInfo = turnByConversation.get(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/berichten/${c.id}`}
                    className="card-interactive flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {other?.user.name ?? "Onbekend"}
                        </p>
                        {unread > 0 ? (
                          <Badge variant="default" className="shrink-0">
                            {unread} nieuw
                          </Badge>
                        ) : (
                          turnInfo?.turn === "theirs" && (
                            <Badge variant="muted" className="shrink-0">
                              {turnInfo.staleDays > 0
                                ? staleLabel(turnInfo.staleDays)
                                : "Wacht op antwoord"}
                            </Badge>
                          )
                        )}
                      </div>
                      {c.job && (
                        <p className="truncate text-xs text-muted-foreground">
                          Over: {c.job.title}
                        </p>
                      )}
                      {last && (
                        <>
                          <p className="truncate text-xs text-muted-foreground">
                            {last.senderId === actor.id && (
                              <span className="font-medium text-foreground/70">Jij: </span>
                            )}
                            {last.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relativeTime(last.createdAt, nl)}
                          </p>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
