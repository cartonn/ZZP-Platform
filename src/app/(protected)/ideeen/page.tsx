import { type Metadata } from "next";
import { Lightbulb, Search } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import {
  sortIdeas,
  parseIdeaSort,
  isIdeaAudience,
  isIdeaTheme,
  IDEA_SORTS,
  IDEA_SORT_LABEL,
  IDEA_STATUS_LABEL,
  IDEA_STATUS_VARIANT,
  IDEA_AUDIENCE_LABEL,
  IDEA_THEME_LABEL,
} from "@/lib/ideas";
import {
  IDEA_STATUSES,
  IDEA_AUDIENCES,
  IDEA_THEMES,
  type IdeaStatus,
  type IdeaAudience,
  type IdeaTheme,
} from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateShortNl } from "@/lib/format-date";
import { IdeaComposer } from "./idea-composer";
import { VoteButton } from "./vote-button";
import { StatusControl } from "./status-control";
import { CategoryControl } from "./category-control";
import { IdeaComments } from "./idea-comments";

export const metadata: Metadata = { title: "Ideeën · Handslag" };

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
  const audienceParam = first(sp.audience);
  const audienceFilter = isIdeaAudience(audienceParam) ? audienceParam : undefined;
  const themeParam = first(sp.theme);
  const themeFilter = isIdeaTheme(themeParam) ? themeParam : undefined;
  const q = first(sp.q).trim();
  const hasFilter = Boolean(statusFilter || audienceFilter || themeFilter || q);

  // unbounded-allow: ideeënlijst met filter; laag volume; kandidaat voor toekomstige paginatie
  const rows = await prisma.idea.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(audienceFilter ? { audience: audienceFilter } : {}),
      ...(themeFilter ? { theme: themeFilter } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
    },
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
      audience: r.audience as IdeaAudience,
      theme: (r.theme as IdeaTheme | null) ?? null,
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Het loket · ideeën"
        title="Ideeën"
        description="Stel verbeteringen voor en stem op de ideeën van anderen. De meest gewenste staan bovenaan."
      />

      <IdeaComposer />

      <form
        method="get"
        role="search"
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"
      >
        <div className="relative basis-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Zoek in ideeën…"
            aria-label="Zoek in ideeën"
            className="pl-9"
          />
        </div>
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
        <Select
          name="audience"
          defaultValue={audienceFilter ?? ""}
          aria-label="Filter op doelgroep"
          className="h-9 max-w-44 text-sm"
        >
          <option value="">Alle doelgroepen</option>
          {IDEA_AUDIENCES.map((a) => (
            <option key={a} value={a}>
              {IDEA_AUDIENCE_LABEL[a]}
            </option>
          ))}
        </Select>
        <Select
          name="theme"
          defaultValue={themeFilter ?? ""}
          aria-label="Filter op thema"
          className="h-9 max-w-44 text-sm"
        >
          <option value="">{"Alle thema's"}</option>
          {IDEA_THEMES.map((t) => (
            <option key={t} value={t}>
              {IDEA_THEME_LABEL[t]}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" variant="secondary">
          Toepassen
        </Button>
        {hasFilter && (
          /* Volledige navigatie kapt eventueel nog openstaande stem-/indien-actionstreams af (#329). */
          /* eslint-disable-next-line @next/next/no-html-link-for-pages */
          <a
            href="/ideeen"
            className="focus-ring text-sm text-muted-foreground hover:text-foreground"
          >
            Wissen
          </a>
        )}
      </form>

      {ideas.length === 0 ? (
        <Card>
          <EmptyState
            icon={q ? Search : Lightbulb}
            title={
              q
                ? "Geen ideeën gevonden"
                : hasFilter
                  ? "Geen ideeën voor dit filter"
                  : "Nog geen ideeën"
            }
            description={
              q
                ? `Geen idee komt overeen met “${q}”. Probeer andere woorden of pas de filters aan.`
                : hasFilter
                  ? "Pas de filters aan om andere ideeën te zien."
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
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant="muted">{IDEA_AUDIENCE_LABEL[idea.audience]}</Badge>
                      {idea.theme && (
                        <Badge variant="default">{IDEA_THEME_LABEL[idea.theme]}</Badge>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">
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
                      <>
                        <StatusControl ideaId={idea.id} status={idea.status} title={idea.title} />
                        <CategoryControl
                          ideaId={idea.id}
                          audience={idea.audience}
                          theme={idea.theme}
                          title={idea.title}
                        />
                      </>
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
