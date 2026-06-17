import { type Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";
import {
  CONVERSATION_STALE_DAYS,
  conversationTurn,
  daysSince,
  isStaleAwaitingReply,
  staleLabel,
  summarizeConversationTurns,
  type ConversationTurn,
} from "@/lib/conversation-turn";

export const metadata: Metadata = { title: "Berichten · ZZP Platform" };

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} uur geleden`;
  return formatDateShortNl(d);
}

export default async function BerichtenPage() {
  const actor = await requireActor();

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

  return (
    <div className="space-y-6">
      <PageHeader title="Berichten" description="Je gesprekken met opdrachtgevers en ZZP'ers." />

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
            description="Een opdrachtgever start een gesprek vanuit een reactie op een opdracht."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {conversations.map((c) => {
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
                    <p className="truncate text-sm font-medium">{other?.user.name ?? "Onbekend"}</p>
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
                    <p className="truncate text-xs text-muted-foreground">Over: {c.job.title}</p>
                  )}
                  {last && (
                    <>
                      <p className="truncate text-xs text-muted-foreground">{last.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {relativeTime(last.createdAt)}
                      </p>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
