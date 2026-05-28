import { type Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Berichten · ZZP Platform" };

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} uur geleden`;
  return d.toISOString().slice(0, 10);
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
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Berichten</h1>
        <p className="text-sm text-muted-foreground">Je gesprekken met opdrachtgevers en ZZP&apos;ers.</p>
      </header>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-muted-foreground">
            Nog geen gesprekken. Een opdrachtgever start een gesprek vanuit een reactie.
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {conversations.map((c) => {
            const other = c.participants.find((p) => p.user.id !== actor.id);
            const last = c.messages[0];
            const unread = unreadByConversation.get(c.id) ?? 0;
            return (
              <Link key={c.id} href={`/berichten/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{other?.user.name ?? "Onbekend"}</p>
                    {unread > 0 && <Badge variant="default">{unread} nieuw</Badge>}
                  </div>
                  {c.job && <p className="text-xs text-muted-foreground">Over: {c.job.title}</p>}
                  {last && (
                    <>
                      <p className="truncate text-xs text-muted-foreground">{last.body}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(last.createdAt)}</p>
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
