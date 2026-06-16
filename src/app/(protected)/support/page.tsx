import { type Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SUPPORT_STATUS_LABEL, SUPPORT_CATEGORY_LABEL, statusVariant } from "@/lib/support/labels";
import { type SupportTicketStatus, type SupportCategory } from "@/lib/enums";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Support · ZZP Platform" };

export default async function SupportPage() {
  const actor = await requireActor();
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: actor.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Stel je vraag — vaak heb je direct antwoord, anders pakt de helpdesk het op."
        action={
          <Button asChild size="sm">
            <Link href="/support/nieuw">Nieuwe vraag</Link>
          </Button>
        }
      />

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
                {formatDateShortNl(t.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
