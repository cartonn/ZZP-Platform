import { type Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import {
  sortIdeas,
  parseIdeaSort,
  IDEA_SORTS,
  IDEA_SORT_LABEL,
  IDEA_STATUS_LABEL,
  IDEA_STATUS_VARIANT,
} from "@/lib/ideas";
import { IDEA_STATUSES, type IdeaStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateShortNl } from "@/lib/format-date";
import { IdeaForm } from "./idea-form";
import { VoteButton } from "./vote-button";
import { StatusControl } from "./status-control";
import { IdeaComments } from "./idea-comments";

export const metadata: Metadata = { title: "Ideeën · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const isIdeaStatus = (v: string): v is IdeaStatus =>
  (IDEA_STATUSES as readonly string[]).includes(v);

export default async function IdeeenPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const sort = parseIdeaSort(first(sp.sort));
  const statusParam = first(sp.status);
  const statusFilter = isIdeaStatus(statusParam) ? statusParam : undefined;

  const rows = await prisma.idea.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      author: { select: { name: true } },
      _count: { select: { votes: true } },
      votes: { where: { userId: actor.id }, select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  const ideas = sortIdeas(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status as IdeaStatus,
      declineReason: r.declineReason,
      createdAt: r.createdAt,
      voteCount: r._count.votes,
      hasVoted: r.votes.length > 0,
      authorName: r.author.name,
      comments: r.comments.map((c) => ({
        id: c.id,
        authorName: c.author.name,
        body: c.body,
        createdAt: c.createdAt,
      })),
    })),
    sort,
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

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"
      >
        <Select
          name="sort"
          defaultValue={sort}
          aria-label="Sorteren"
          className="h-9 max-w-44 text-sm"
        >
          {IDEA_SORTS.map((s) => (
            <option key={s} value={s}>
              {IDEA_SORT_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select
          name="status"
          defaultValue={statusFilter ?? ""}
          aria-label="Filter op status"
          className="h-9 max-w-44 text-sm"
        >
          <option value="">Alle statussen</option>
          {IDEA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {IDEA_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" variant="secondary">
          Toepassen
        </Button>
      </form>

      {ideas.length === 0 ? (
        <Card>
          <EmptyState
            icon={Lightbulb}
            title={statusFilter ? "Geen ideeën in deze status" : "Nog geen ideeën"}
            description={
              statusFilter
                ? "Pas het filter aan om andere ideeën te zien."
                : "Wees de eerste die een verbetering voorstelt."
            }
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
                    {idea.status === "DECLINED" && idea.declineReason && (
                      <p className="mt-2 rounded-md bg-danger/5 px-3 py-2 text-sm text-danger">
                        <span className="font-medium">Afgewezen:</span> {idea.declineReason}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {idea.authorName} · {formatDateShortNl(idea.createdAt)}
                    </p>
                    {isAdmin && (
                      <StatusControl ideaId={idea.id} status={idea.status} title={idea.title} />
                    )}
                    <IdeaComments ideaId={idea.id} comments={idea.comments} />
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
