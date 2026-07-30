import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MessageSquare } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { isParticipant } from "@/lib/messaging";
import { summarizeReplyLatency } from "@/lib/message-reply-latency";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageComposer } from "./message-composer";
import { MarkRead } from "./mark-read";
import { formatDateTimeNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Gesprek · Handslag" };

export default async function GesprekPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true } },
      participants: { include: { user: { select: { id: true, name: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  if (
    !conversation ||
    !isParticipant(
      conversation.participants.map((p) => p.user.id),
      actor.id,
    )
  ) {
    notFound();
  }

  const other = conversation.participants.find((p) => p.user.id !== actor.id);

  // Reactietijd-gewoonte van de gesprekspartner ("reageert meestal binnen ~X"): afgeleid uit de al-
  // geladen, onveranderlijke berichttijdstippen — geen extra query, geen schemawijziging. Zet
  // verwachtingen en neemt "heb ik geghost?"-onzekerheid weg. Null (geen regel) onder de steekproefgrens.
  const replyLatency = other
    ? summarizeReplyLatency(
        conversation.messages.map((m) => ({ senderId: m.senderId, createdAt: m.createdAt })),
        other.user.id,
      )
    : null;

  return (
    <div className="flex h-full flex-col gap-4">
      <MarkRead conversationId={conversation.id} />

      <div>
        <Link
          href="/berichten"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar berichten
        </Link>
        <h1 className="mt-2 text-lg font-semibold tracking-tight">
          {other?.user.name ?? "Gesprek"}
        </h1>
        {replyLatency && (
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            Reageert meestal {replyLatency.label}
          </p>
        )}
        {conversation.job && (
          <p className="text-sm text-muted-foreground">
            Over:{" "}
            <Link
              href={`/opdrachten/${conversation.job.id}`}
              className="underline-offset-4 hover:underline"
            >
              {conversation.job.title}
            </Link>
          </p>
        )}
      </div>

      <div className="space-y-3">
        {conversation.messages.length === 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState
              icon={MessageSquare}
              title="Nog geen berichten"
              description="Stuur het eerste bericht om het gesprek te starten."
            />
          </div>
        ) : (
          conversation.messages.map((m) => {
            const mine = m.sender.id === actor.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground"
                      : "border border-border bg-card",
                  )}
                >
                  <p className="whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {m.body}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine
                        ? "text-primary-foreground/70 dark:text-accent-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDateTimeNl(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageComposer conversationId={conversation.id} />
    </div>
  );
}
