import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ASSISTANT_NAME } from "@/lib/support/knowledge-base";
import { SUPPORT_STATUS_LABEL, statusVariant } from "@/lib/support/labels";
import { type SupportTicketStatus, type SupportAuthorKind } from "@/lib/enums";
import { replyToTicket, markResolved } from "../actions";

export const metadata: Metadata = { title: "Vraag · ZZP Platform" };

const AUTHOR_LABEL: Record<SupportAuthorKind, string> = {
  USER: "Jij",
  AGENT: "Helpdesk",
  ASSISTANT: ASSISTANT_NAME,
};

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor();
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  // Ownership: alleen de aanvrager (of admin) ziet het ticket.
  if (!ticket || (ticket.userId !== actor.id && actor.role !== "ADMIN")) notFound();

  const status = ticket.status as SupportTicketStatus;
  const resolved = status === "RESOLVED";
  // Alleen de aanvrager mag hier reageren/afhandelen. Een ADMIN bekijkt het ticket alleen-lezen en
  // beheert het via de helpdesk (/admin/support) — anders falen de gebruikersacties (loadOwnedTicket)
  // én vervuilen ze het audit-log met valse "toegang geweigerd"-regels tegen de eigen admin.
  const isOwner = ticket.userId === actor.id;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight">{ticket.subject}</h1>
          <Badge variant={statusVariant(status)}>{SUPPORT_STATUS_LABEL[status]}</Badge>
        </div>
      </header>

      <div className="space-y-3">
        {ticket.messages.map((m) => {
          const kind = m.authorKind as SupportAuthorKind;
          const mine = kind === "USER";
          return (
            <Card key={m.id} className={mine ? "" : "border-primary/30 bg-accent/30"}>
              <CardContent className="space-y-1 py-3">
                <p className="text-xs font-medium text-muted-foreground">{AUTHOR_LABEL[kind]}</p>
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {status === "ESCALATED" && (
        <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-muted-foreground">
          Je vraag staat bij de helpdesk. Een medewerker reageert zo snel mogelijk.
        </p>
      )}

      {status === "AWAITING_USER" && (
        <p className="rounded-md border border-primary/30 bg-accent/30 px-3 py-2 text-sm text-muted-foreground">
          De helpdesk heeft gereageerd. Reageer hieronder als je nog een vraag hebt, of markeer het
          als opgelost.
        </p>
      )}

      {!isOwner ? (
        <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Je bekijkt dit ticket als beheerder. Reageren en afhandelen doe je via de{" "}
          <Link href="/admin/support" className="font-medium underline underline-offset-4">
            helpdesk
          </Link>
          .
        </p>
      ) : !resolved ? (
        <div className="space-y-3">
          <form action={replyToTicket.bind(null, ticket.id)} className="space-y-2">
            <textarea
              name="body"
              rows={3}
              required
              className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              placeholder="Een aanvulling of vervolgvraag…"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm">
                Reageren
              </Button>
            </div>
          </form>
          <form action={markResolved.bind(null, ticket.id)}>
            <Button type="submit" variant="secondary" size="sm">
              Heeft dit geholpen? Markeer als opgelost
            </Button>
          </form>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Dit ticket is opgelost. Reageer hieronder om het te heropenen.
          </p>
          <form action={replyToTicket.bind(null, ticket.id)} className="space-y-2">
            <textarea
              name="body"
              rows={3}
              required
              className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              placeholder="Toch nog een vraag? Heropen het ticket…"
            />
            <Button type="submit" variant="secondary" size="sm">
              Heropenen
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
