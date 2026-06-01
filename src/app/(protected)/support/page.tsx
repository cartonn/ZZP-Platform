import { type Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SUPPORT_STATUS_LABEL, SUPPORT_CATEGORY_LABEL, statusVariant } from "@/lib/support/labels";
import { type SupportTicketStatus, type SupportCategory } from "@/lib/enums";

export const metadata: Metadata = { title: "Support · ZZP Platform" };

export default async function SupportPage() {
  const actor = await requireActor();
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: actor.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            Stel je vraag — vaak heb je direct antwoord, anders pakt de helpdesk het op.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/support/nieuw">Nieuwe vraag</Link>
        </Button>
      </header>

      {tickets.length === 0 ? (
        <Card>
          <EmptyState
            icon={LifeBuoy}
            title="Nog geen vragen"
            description="Loop je ergens tegenaan? Stel je vraag en je krijgt vaak meteen antwoord."
            action={{ href: "/support/nieuw", label: "Nieuwe vraag" }}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/support/${t.id}`}
              className="card-interactive block rounded-lg border border-border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{t.subject}</span>
                <Badge variant={statusVariant(t.status as SupportTicketStatus)}>
                  {SUPPORT_STATUS_LABEL[t.status as SupportTicketStatus]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {SUPPORT_CATEGORY_LABEL[t.category as SupportCategory]} · {t._count.messages}{" "}
                {t._count.messages === 1 ? "bericht" : "berichten"} ·{" "}
                {t.updatedAt.toLocaleDateString("nl-NL")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
