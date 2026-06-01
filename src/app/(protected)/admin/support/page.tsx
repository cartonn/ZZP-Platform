import { type Metadata } from "next";
import { Headphones } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ASSISTANT_NAME } from "@/lib/support/knowledge-base";
import { SUPPORT_STATUS_LABEL, SUPPORT_CATEGORY_LABEL, statusVariant } from "@/lib/support/labels";
import {
  type SupportTicketStatus,
  type SupportCategory,
  type SupportAuthorKind,
} from "@/lib/enums";
import { adminReply, adminResolve } from "./actions";

export const metadata: Metadata = { title: "Helpdesk · ZZP Platform" };

const AUTHOR_LABEL: Record<SupportAuthorKind, string> = {
  USER: "Gebruiker",
  AGENT: "Helpdesk",
  ASSISTANT: ASSISTANT_NAME,
};

export default async function AdminSupportPage() {
  await requireRole("ADMIN");
  // Wachtrij: open tickets eerst (geëscaleerd/heropend), opgeloste onderaan.
  const tickets = await prisma.supportTicket.findMany({
    where: { status: { in: ["ESCALATED", "REOPENED", "TRIAGED", "NEW"] } },
    orderBy: { updatedAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Helpdesk</h1>
        <p className="text-sm text-muted-foreground">
          Tickets die door de {ASSISTANT_NAME} naar een medewerker zijn doorgezet.
        </p>
      </header>

      {tickets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Headphones}
            title="Geen openstaande tickets"
            description="Vragen worden vaak direct beantwoord. Wat een mens nodig heeft, verschijnt hier."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const status = t.status as SupportTicketStatus;
            const last = t.messages[t.messages.length - 1];
            return (
              <Card key={t.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{t.subject}</span>
                    <Badge variant={statusVariant(status)}>{SUPPORT_STATUS_LABEL[status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.user.name} · {SUPPORT_CATEGORY_LABEL[t.category as SupportCategory]} ·{" "}
                    {t.updatedAt.toLocaleDateString("nl-NL")}
                  </p>
                  {last && (
                    <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <span className="text-xs font-medium text-muted-foreground">
                        {AUTHOR_LABEL[last.authorKind as SupportAuthorKind]}:{" "}
                      </span>
                      <span className="whitespace-pre-wrap">{last.body}</span>
                    </div>
                  )}
                  <form action={adminReply.bind(null, t.id)} className="space-y-2">
                    <textarea
                      name="body"
                      rows={2}
                      required
                      className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                      placeholder="Antwoord van de helpdesk…"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm">
                        Antwoord versturen
                      </Button>
                    </div>
                  </form>
                  <form action={adminResolve.bind(null, t.id)}>
                    <Button type="submit" variant="secondary" size="sm">
                      Markeer als opgelost
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
