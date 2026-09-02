import Link from "next/link";
import { Star, Target, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { sortFavorites } from "@/lib/favorites";
import { lockedInJobIds } from "@/lib/data/job-locked-in";
import { hasFlexpoolSummary, summarizeFlexpool } from "@/lib/favorites-summary";
import {
  bestOpenJobMatch,
  type FlexpoolJobMatch,
  type FlexpoolMatchJob,
} from "@/lib/favorites/open-job-match";
import { type FreelancerMatchSource } from "@/lib/matching";
import { type Availability } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { removeFavorite } from "@/app/(protected)/favorieten/actions";

const AVAILABILITY: Record<
  Availability,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt beschikbaar", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
  UNKNOWN: { label: "Beschikbaarheid onbekend", variant: "muted" },
};

const EMPTY_JOB_SET: ReadonlySet<string> = new Set();

/** De favoriet-rijen die `buildOpenJobMatches` nodig heeft om te scoren (subset van de query). */
interface FavoriteProfileRow {
  freelancerProfileId: string;
  freelancer: {
    headline: string | null;
    bio: string | null;
    location: string | null;
    hourlyRate: number | null;
    workMode: string;
    maxTravelMinutes: number | null;
    availability: string;
    skills: readonly { skillId: string }[];
    credentials: readonly { type: string; status: string; expiresAt: Date | null }[];
    industries: readonly { industryId: string }[];
    availabilityWindows: readonly { startDate: Date; endDate: Date; type: string }[];
  };
}

/**
 * Bepaal per favoriet de sterkste eigen open opdracht waarvoor deze bewezen ZZP'er nu een match is.
 * Eén findMany voor de open opdrachten van de opdrachtgever + één voor de reeds-gereageerde
 * combinaties; de scoring zelf is puur (`bestOpenJobMatch`, dezelfde motor als de kandidatenlijst).
 * Read-only, eigenaar-gescoped (alleen `companyId`); geen mutatie, geen geldstroom.
 */
async function buildOpenJobMatches(
  companyId: string,
  rows: readonly FavoriteProfileRow[],
): Promise<Map<string, FlexpoolJobMatch>> {
  const result = new Map<string, FlexpoolJobMatch>();
  if (rows.length === 0) return result;

  const jobs = await prisma.job.findMany({
    where: { companyId, status: "PUBLISHED" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      industryId: true,
      rateMin: true,
      rateMax: true,
      workMode: true,
      location: true,
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
    },
  });
  if (jobs.length === 0) return result;

  // Reeds-vergeven opdrachten (een kandidaat vastgelegd óf een niet-geannuleerde samenwerking) mogen
  // geen "sterke match — nodig X uit"-signaal opleveren: de rol is al bezet, dus dat spreekt de echte
  // status tegen. Spiegelt de lockedIn-poort van de opdrachtgever-next-actions (getClientColdJobs/
  // getClientOverdueJobs) en van het ZZP'er-"direct te starten"-signaal.
  const lockedIn = await lockedInJobIds(jobs.map((j) => j.id));

  const scorableJobs: FlexpoolMatchJob[] = jobs
    .filter((j) => !lockedIn.has(j.id))
    .map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      industryId: j.industryId,
      rateMin: j.rateMin,
      rateMax: j.rateMax,
      workMode: j.workMode,
      location: j.location,
      skills: j.skills,
      credentialRequirements: j.credentialRequirements,
    }));

  // Opdrachten waarop de favoriet al reageerde vallen af — geen dubbel signaal.
  const freelancerIds = rows.map((r) => r.freelancerProfileId);
  // unbounded-allow: id-paren over twee reeds op 100 begrensde sets (opdrachten × favorieten)
  const applied = await prisma.application.findMany({
    where: { jobId: { in: jobs.map((j) => j.id) }, freelancerId: { in: freelancerIds } },
    select: { jobId: true, freelancerId: true },
  });
  const appliedByFreelancer = new Map<string, Set<string>>();
  for (const a of applied) {
    const set = appliedByFreelancer.get(a.freelancerId) ?? new Set<string>();
    set.add(a.jobId);
    appliedByFreelancer.set(a.freelancerId, set);
  }

  const now = new Date();
  for (const row of rows) {
    const f = row.freelancer;
    const source: FreelancerMatchSource = {
      skills: f.skills,
      credentials: f.credentials,
      hourlyRate: f.hourlyRate,
      workMode: f.workMode,
      location: f.location,
      maxTravelMinutes: f.maxTravelMinutes,
      headline: f.headline,
      bio: f.bio,
      availability: f.availability,
      industries: f.industries,
      availabilityWindows: f.availabilityWindows,
    };
    const match = bestOpenJobMatch(
      scorableJobs,
      source,
      appliedByFreelancer.get(row.freelancerProfileId) ?? EMPTY_JOB_SET,
      now,
    );
    if (match) result.set(row.freelancerProfileId, match);
  }
  return result;
}

/**
 * Flexpool/favorieten-paneel — de poule van bewezen ZZP'ers van één opdrachtgever.
 * Eigenaar-gescoped: laadt uitsluitend favorieten van `companyId` (server-side waarheid).
 * Gedeeld tussen /favorieten en de "flexpool"-tab van de bedrijfsprofiel-hub, zodat beide
 * exact dezelfde lijst tonen. Begrensd met `take: 100`.
 */
export async function FlexpoolPanel({ companyId }: { companyId: string }) {
  const rows = await prisma.favoriteFreelancer.findMany({
    // Geen geschorste/geanonimiseerde ZZP'ers in de poule-weergave: server-side waarheid, consistent
    // met discoverableFreelancerWhere (zoek/suggesties) en planPoolInvites (uitnodigingen).
    where: { companyId, freelancer: { user: { status: "ACTIVE" } } },
    take: 100,
    select: {
      freelancerProfileId: true,
      note: true,
      createdAt: true,
      freelancer: {
        select: {
          id: true,
          headline: true,
          bio: true,
          location: true,
          hourlyRate: true,
          workMode: true,
          maxTravelMinutes: true,
          availability: true,
          user: { select: { name: true } },
          skills: { select: { skillId: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
          industries: { select: { industryId: true } },
          availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
        },
      },
    },
  });

  // Beschikbaren bovenaan (pure sortFavorites): een string-kolom kan dat in de DB niet uitdrukken.
  const favorites = sortFavorites(
    rows.map((r) => ({ ...r, availability: r.freelancer.availability as Availability })),
  );

  // Per favoriet: tegen welke van je eigen open opdrachten is deze bewezen ZZP'er nu een sterke
  // match? Server-side waarheid met dezelfde matchmotor als de kandidatenlijst. Read-only signaal;
  // de deep-link brengt de opdrachtgever naar de opdracht waar hij de uitnodiging verstuurt.
  const matches = await buildOpenJobMatches(companyId, rows);

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 sm:p-8">
          <EmptyState
            icon={Star}
            title="Nog geen ZZP'ers in je poule"
            description="Voeg bewezen ZZP'ers toe vanaf hun profiel. Zo heb je je eigen mensen meteen bij de hand voor nieuwe diensten."
            action={{ label: "ZZP'ers bekijken", href: "/freelancers" }}
          />
        </CardContent>
      </Card>
    );
  }

  // Samenvatting bovenaan: "wie kan er nu?" in één oogopslag over de hele poule, zodat een
  // groeiende flexpool niet rij-voor-rij gescand hoeft te worden. Puur afgeleid uit dezelfde
  // rijen als de lijst → kan niet driften.
  const summary = summarizeFlexpool(favorites);

  return (
    <div className="space-y-3">
      {hasFlexpoolSummary(summary) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium">
            Beschikbaar nu:{" "}
            <span
              className={summary.available > 0 ? "text-success" : "text-muted-foreground"}
              data-testid="flexpool-available-count"
            >
              {summary.available}
            </span>
          </span>
          {summary.limited > 0 && (
            <span className="text-muted-foreground">{summary.limited} beperkt</span>
          )}
          {summary.unknown > 0 && (
            <span className="text-muted-foreground">{summary.unknown} onbekend</span>
          )}
          {summary.unavailable > 0 && (
            <span className="text-muted-foreground">{summary.unavailable} niet</span>
          )}
          <span className="ml-auto text-muted-foreground">{summary.total} in je poule</span>
        </div>
      )}
      <ul className="space-y-3">
        {favorites.map((fav) => {
          const a = AVAILABILITY[fav.availability];
          const subtitle = [fav.freelancer.headline, fav.freelancer.location]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={fav.freelancerProfileId}>
              <Card>
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/zzp/${fav.freelancer.id}`}
                        className="focus-ring rounded font-medium hover:underline"
                      >
                        {fav.freelancer.user.name}
                      </Link>
                      <Badge variant={a.variant}>{a.label}</Badge>
                      {fav.freelancer.hourlyRate != null && (
                        <span className="text-sm text-muted-foreground">
                          <span className="font-mono">€ {fav.freelancer.hourlyRate}</span>/uur
                        </span>
                      )}
                    </div>
                    {subtitle && (
                      <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                    )}
                    {fav.note && <p className="text-sm">{fav.note}</p>}
                    {matches.get(fav.freelancerProfileId) &&
                      (() => {
                        const match = matches.get(fav.freelancerProfileId)!;
                        return (
                          <Link
                            href={`/opdrachten/${match.jobId}`}
                            className="focus-ring inline-flex max-w-full items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs font-medium text-success hover:bg-success/15"
                            data-testid="flexpool-open-job-match"
                            title={match.reason ?? undefined}
                          >
                            <Target className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">
                              Sterke match voor je opdracht «{match.jobTitle}»
                            </span>
                            <span className="shrink-0 font-mono">{match.score}%</span>
                          </Link>
                        );
                      })()}
                  </div>
                  <ConfirmButton
                    action={removeFavorite.bind(null, fav.freelancerProfileId)}
                    title="Uit je poule verwijderen?"
                    description={`${fav.freelancer.user.name} wordt uit je flexpool gehaald. Je kunt deze ZZP'er later opnieuw toevoegen.`}
                    confirmLabel="Verwijderen"
                    aria-label={`${fav.freelancer.user.name} uit je poule verwijderen`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Verwijderen
                  </ConfirmButton>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
