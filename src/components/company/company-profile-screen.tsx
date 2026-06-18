import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { computeCompanyCompleteness } from "@/lib/profile";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { RatingStars } from "@/components/reviews/rating-stars";
import { ReviewList } from "@/components/reviews/review-list";
import { FlexpoolPanel } from "@/components/favorites/flexpool-panel";

const TABS = [
  { key: "bedrijf", label: "Bedrijf" },
  { key: "flexpool", label: "Flexpool" },
  { key: "beoordelingen", label: "Beoordelingen" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function initials(name: string | null): string {
  if (!name) return "B";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * Bedrijfsprofiel-hub (kopkaart + tabs + tabinhoud), gemodelleerd op ProfileScreen.
 * Strikt eigenaar-gescoped: rendert het bedrijf dat aan `companyUserId` hangt — er bestaat
 * geen publiek bedrijfsprofiel, dus geen cross-viewer-lek. De aanroeper (zie /bedrijf) levert
 * altijd `actor.id` van de ingelogde CLIENT als `companyUserId`.
 */
export async function CompanyProfileScreen({
  companyUserId,
  tab: rawTab,
}: {
  companyUserId: string;
  tab?: string;
}) {
  const company = await prisma.company.findUnique({
    where: { userId: companyUserId },
    include: {
      industry: { select: { name: true } },
      _count: { select: { jobs: true } },
    },
  });

  if (!company) notFound();

  const tab: TabKey = TABS.find((t) => t.key === rawTab)?.key ?? "bedrijf";

  // Beoordelingen die ZZP'ers over deze opdrachtgever achterlieten na een afgeronde samenwerking
  // (richting FREELANCER_ON_CLIENT). Alleen PUBLISHED telt mee (een nog-blinde PENDING_REVEAL mag
  // niet lekken vóór de simultane onthulling). Aparte aggregatie over ÁLLE beoordelingen voor het
  // juiste gemiddelde/totaal — de getoonde lijst is begrensd tot de 20 recentste en mag dat cijfer
  // niet vertekenen, dus telt/middelt de database, niet de afgekapte rijen.
  const reviewWhere = {
    subjectId: companyUserId,
    direction: "FREELANCER_ON_CLIENT",
    status: "PUBLISHED",
  } as const;
  const [completedCollabs, reviewRows, reviewStats] = await Promise.all([
    prisma.collaboration.count({ where: { companyId: company.id, status: "COMPLETED" } }),
    prisma.review.findMany({
      where: reviewWhere,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.review.aggregate({
      where: reviewWhere,
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const reviewAgg = {
    count: reviewStats._count.rating,
    average: reviewStats._avg.rating != null ? Math.round(reviewStats._avg.rating * 10) / 10 : 0,
  };

  const { score, missing } = computeCompanyCompleteness({
    description: company.description,
    location: company.location,
    website: company.website,
    hasIndustry: !!company.industryId,
    hasLogo: !!company.logoKey,
  });

  const memberSince = formatDateShortNl(company.createdAt);
  const subtitle = [
    company.industry?.name,
    company.location,
    `op het platform sinds ${memberSince}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const tabHref = (key: TabKey) => (key === "bedrijf" ? "/bedrijf" : `/bedrijf?tab=${key}`);

  return (
    <div className="space-y-6">
      {/* Bedrijfskop — Warmte-ontwerp: logo/avatar, naam + badges, subtitel, kerncijfers. */}
      <Card className="border-hero bg-hero text-primary-foreground">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-foreground font-display text-xl font-semibold text-primary sm:size-20 sm:text-2xl"
            >
              {initials(company.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {company.name}
                </h1>
                {company.industry?.name && (
                  <Badge variant="muted" className="border-transparent bg-primary-foreground">
                    {company.industry.name}
                  </Badge>
                )}
                {reviewAgg.count > 0 && (
                  <RatingStars
                    average={reviewAgg.average}
                    count={reviewAgg.count}
                    size="md"
                    showValue
                  />
                )}
              </div>
              <p className="mt-1 text-sm text-primary-foreground sm:text-base">{subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-sm text-primary-foreground">
                  {plural(company._count.jobs, "opdracht", "opdrachten")}
                </span>
                {completedCollabs > 0 && (
                  <span className="text-sm text-primary-foreground">
                    {plural(completedCollabs, "afgeronde samenwerking", "afgeronde samenwerkingen")}
                  </span>
                )}
                <span className="text-sm text-primary-foreground">{score}% compleet</span>
              </div>
            </div>
            {/* Eigen bedrijfsprofiel: direct door naar bewerken. */}
            <Link
              href="/bedrijf/bewerken"
              className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary-foreground/55 px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary-foreground/10"
            >
              Bewerk bedrijfsprofiel
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — server-gerenderd via ?tab=, geen client-JS nodig. */}
      <nav
        aria-label="Bedrijfsprofielsecties"
        className="flex flex-wrap gap-1 border-b border-border text-sm"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={
              tab === t.key
                ? "focus-ring -mb-px border-b-2 border-primary px-3 py-2 font-medium text-foreground"
                : "focus-ring -mb-px border-b-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "bedrijf" && (
        <div className="grid gap-6 md:grid-cols-[3fr_2fr] lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="py-4">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Stamgegevens
                </h2>
                <dl className="mt-2 divide-y divide-border">
                  <Stat label="Naam" value={company.name} />
                  {company.industry?.name && <Stat label="Branche" value={company.industry.name} />}
                  {company.location && (
                    <Stat
                      label="Locatie"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                          {company.location}
                        </span>
                      }
                    />
                  )}
                  {company.website && (
                    <Stat
                      label="Website"
                      value={
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-ring inline-flex items-center gap-1 rounded hover:underline"
                        >
                          <Globe className="size-3.5 text-muted-foreground" aria-hidden />
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      }
                    />
                  )}
                  <Stat label="Op het platform sinds" value={memberSince} />
                </dl>
              </CardContent>
            </Card>

            {company.description && (
              <Card>
                <CardContent className="py-4">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Over het bedrijf
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                    {company.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="py-4">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Profiel-compleetheid
                </h2>
                <div className="mt-3 flex justify-center">
                  <ScoreRing value={score} label="Profiel-compleetheid" />
                </div>
                {missing.length > 0 ? (
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Nog aan te vullen: {missing.map((m) => m.label).join(", ")}.
                  </p>
                ) : (
                  <p className="mt-4 text-xs text-success">Je bedrijfsprofiel is compleet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "flexpool" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Je poule van bewezen ZZP&apos;ers — beschikbaren eerst.
          </p>
          <FlexpoolPanel companyId={company.id} />
        </div>
      )}

      {tab === "beoordelingen" && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Beoordelingen door ZZP&apos;ers
              </h2>
              {reviewAgg.count > 0 && (
                <RatingStars average={reviewAgg.average} count={reviewAgg.count} showValue />
              )}
            </div>
            {reviewAgg.count === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nog geen beoordelingen. ZZP&apos;ers kunnen je beoordelen na een afgeronde
                samenwerking.
              </p>
            ) : (
              <div className="mt-2">
                <ReviewList
                  reviews={reviewRows.map((r) => ({
                    id: r.id,
                    authorName: r.author.name,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt,
                  }))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
