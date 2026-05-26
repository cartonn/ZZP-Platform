import { type Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { COLLABORATION_TRANSITIONS } from "@/lib/collaborations";
import { type CollaborationStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { changeCollaborationStatus } from "./actions";

export const metadata: Metadata = { title: "Samenwerkingen · ZZP Platform" };

const STATUS: Record<CollaborationStatus, { label: string; variant: "default" | "success" | "muted" | "danger" }> = {
  PROPOSED: { label: "Voorgesteld", variant: "default" },
  ACTIVE: { label: "Actief", variant: "success" },
  COMPLETED: { label: "Afgerond", variant: "muted" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

const ACTION_LABEL: Record<CollaborationStatus, string> = {
  PROPOSED: "Terug naar voorstel",
  ACTIVE: "Markeer als actief",
  COMPLETED: "Markeer als afgerond",
  CANCELLED: "Annuleren",
};

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function SamenwerkingenPage() {
  const actor = await requireActor();

  const collaborations = await prisma.collaboration.findMany({
    where: { OR: [{ company: { userId: actor.id } }, { freelancer: { userId: actor.id } }] },
    orderBy: { updatedAt: "desc" },
    include: {
      job: { select: { id: true, title: true } },
      company: { select: { name: true, userId: true } },
      freelancer: { select: { userId: true, user: { select: { name: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Samenwerkingen</h1>
        <p className="text-sm text-muted-foreground">Voorgestelde en lopende samenwerkingen.</p>
      </header>

      {collaborations.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-muted-foreground">
            Nog geen samenwerkingen. Een opdrachtgever stelt er een voor vanuit een geaccepteerde reactie.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {collaborations.map((c) => {
            const status = c.status as CollaborationStatus;
            const isClient = c.company.userId === actor.id;
            const counterparty = isClient ? c.freelancer.user.name : c.company.name;
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/opdrachten/${c.job.id}`} className="font-medium underline-offset-4 hover:underline">{c.job.title}</Link>
                        <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Met {counterparty}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.rate != null && <span>Tarief: € {c.rate}/uur</span>}
                    {fmt(c.startDate) && <span>Start: {fmt(c.startDate)}</span>}
                    {fmt(c.endDate) && <span>Eind: {fmt(c.endDate)}</span>}
                  </div>

                  {COLLABORATION_TRANSITIONS[status].length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                      {COLLABORATION_TRANSITIONS[status].map((to) => (
                        <form key={to} action={changeCollaborationStatus.bind(null, c.id, to)}>
                          <Button type="submit" size="sm" variant={to === "CANCELLED" ? "danger" : to === "ACTIVE" ? "primary" : "secondary"}>
                            {ACTION_LABEL[to]}
                          </Button>
                        </form>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
