import { type Metadata } from "next";
import { ChevronUp, Lightbulb } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { rankIdeas, IDEA_STATUS_LABEL, IDEA_STATUS_VARIANT } from "@/lib/ideas";
import { IDEA_TRANSITIONS, type IdeaStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateShortNl } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { IdeaForm } from "./idea-form";
import { toggleVote, setIdeaStatus } from "./actions";

export const metadata: Metadata = { title: "Ideeën · ZZP Platform" };

export default async function IdeeenPage() {
  const actor = await requireActor();
  const rows = await prisma.idea.findMany({
    include: {
      author: { select: { name: true } },
      _count: { select: { votes: true } },
      votes: { where: { userId: actor.id }, select: { userId: true } },
    },
  });

  const ideas = rankIdeas(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status as IdeaStatus,
      createdAt: r.createdAt,
      voteCount: r._count.votes,
      hasVoted: r.votes.length > 0,
      authorName: r.author.name,
    })),
  );
  const isAdmin = actor.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Ideeën"
        description="Stel verbeteringen voor en stem op de ideeën van anderen. De meest gewenste staan bovenaan."
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Nieuw idee</h2>
          <IdeaForm />
        </CardContent>
      </Card>

      {ideas.length === 0 ? (
        <Card>
          <EmptyState
            icon={Lightbulb}
            title="Nog geen ideeën"
            description="Wees de eerste die een verbetering voorstelt."
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Card>
                <CardContent className="flex gap-4 p-4">
                  <VoteButton ideaId={idea.id} count={idea.voteCount} hasVoted={idea.hasVoted} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{idea.title}</p>
                      <Badge variant={IDEA_STATUS_VARIANT[idea.status]}>
                        {IDEA_STATUS_LABEL[idea.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {idea.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {idea.authorName} · {formatDateShortNl(idea.createdAt)}
                    </p>
                    {isAdmin && (
                      <StatusControl ideaId={idea.id} status={idea.status} title={idea.title} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Stem-knop: toont de telling en of jij gestemd hebt; klikken togglet (server-side waarheid). */
function VoteButton({
  ideaId,
  count,
  hasVoted,
}: {
  ideaId: string;
  count: number;
  hasVoted: boolean;
}) {
  return (
    <form action={toggleVote.bind(null, ideaId)} className="shrink-0">
      <button
        type="submit"
        aria-pressed={hasVoted}
        aria-label={hasVoted ? "Stem intrekken" : "Stem op dit idee"}
        className={cn(
          "focus-ring flex w-12 flex-col items-center gap-0.5 rounded-md border py-1.5 transition-colors",
          hasVoted
            ? "border-primary bg-accent text-primary"
            : "border-border text-muted-foreground hover:border-foreground/40",
        )}
      >
        <ChevronUp className="size-4" aria-hidden />
        <span className="text-sm font-semibold tabular-nums">{count}</span>
      </button>
    </form>
  );
}

/** Beheerder zet de status van een idee — alleen geldige overgangen (incl. de huidige status). */
function StatusControl({
  ideaId,
  status,
  title,
}: {
  ideaId: string;
  status: IdeaStatus;
  title: string;
}) {
  const options: IdeaStatus[] = [status, ...IDEA_TRANSITIONS[status]];
  return (
    <form
      action={setIdeaStatus.bind(null, ideaId)}
      className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"
    >
      <span className="text-xs text-muted-foreground">Status:</span>
      <Select
        name="status"
        defaultValue={status}
        aria-label={`Status van idee: ${title}`}
        className="h-8 max-w-40 text-sm"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {IDEA_STATUS_LABEL[s]}
          </option>
        ))}
      </Select>
      <Button type="submit" size="xs" variant="secondary">
        Opslaan
      </Button>
    </form>
  );
}
