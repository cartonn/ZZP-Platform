import { type Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { unreadCount } from "@/lib/messaging";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Berichten · ZZP Platform" };

export default async function BerichtenPage() {
  const actor = await requireActor();

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: actor.id } } },
    orderBy: { updatedAt: "desc" },
    include: {
      job: { select: { title: true } },
      participants: { include: { user: { select: { id: true, name: true } } } },
      messages: { orderBy: { createdAt: "asc" }, select: { senderId: true, createdAt: true, body: true } },
    },
  });

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
            const me = c.participants.find((p) => p.user.id === actor.id);
            const other = c.participants.find((p) => p.user.id !== actor.id);
            const last = c.messages[c.messages.length - 1];
            const unread = unreadCount(c.messages, me?.lastReadAt ?? null, actor.id);
            return (
              <Link key={c.id} href={`/berichten/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{other?.user.name ?? "Onbekend"}</p>
                    {unread > 0 && <Badge variant="default">{unread} nieuw</Badge>}
                  </div>
                  {c.job && <p className="text-xs text-muted-foreground">Over: {c.job.title}</p>}
                  {last && <p className="truncate text-sm text-muted-foreground">{last.body}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
