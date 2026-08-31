import { type Metadata } from "next";
import Link from "next/link";
import { ExternalLink, UserX } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { summarizeAvailabilityFreshness, usableAvailability } from "@/lib/availability";
import { summarizeFindability } from "@/lib/freelancer-findability";
import { FindabilityCard } from "@/components/profile/findability-card";
import { computeMarketRate } from "@/lib/market-rate";
import { MARKET_RATE_MIN_SAMPLE, MARKET_RATE_SAMPLE_CAP } from "@/lib/config";
import { type Availability } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { MarketRateCard } from "@/components/profile/market-rate-card";
import { RateCalculatorCard } from "@/components/profile/rate-calculator-card";
import { SkillDemandCard } from "@/components/profile/skill-demand-card";
import { computeSkillDemand } from "@/lib/skill-demand";
import { getSkillDemandRequirements } from "@/lib/data/freelancer-skill-demand";
import { ProfileForm } from "../profile-form";
import { WorkExperienceEditor } from "@/components/profile/work-experience-editor";
import { parseLanguages } from "@/lib/parse-languages";

export const metadata: Metadata = { title: "Profiel bewerken · Handslag" };

export default async function ProfielPage() {
  const actor = await requireRole("FREELANCER");

  const [profile, skills, industries] = await Promise.all([
    prisma.freelancerProfile.findUnique({
      where: { userId: actor.id },
      include: {
        skills: true,
        industries: true,
        workExperiences: true,
        availabilityWindows: { orderBy: { startDate: "asc" } },
      },
    }),
    // unbounded-allow: skills-referentielijst voor profielpagina
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // unbounded-allow: branches-referentielijst voor profielpagina
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!profile) {
    return (
      <div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={UserX}
              title="Geen freelancerprofiel gevonden"
              description="Er is nog geen profiel gekoppeld aan dit account."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const languages = parseLanguages(profile.languages);
  const skillIds = profile.skills.map((s) => s.skillId);
  const industryIds = profile.industries.map((i) => i.industryId);

  // Peer-tarieven voor de marktband. We selecteren alleen `hourlyRate` en cappen
  // de set met een ruime `take`: een steekproef van deze omvang levert een
  // representatieve mediaan/spreiding én een harde geheugengrens (de band is
  // expliciet indicatief).
  const [industryPeers, platformPeers] = await Promise.all([
    prisma.freelancerProfile.findMany({
      where: {
        id: { not: profile.id },
        hourlyRate: { not: null },
        industries: { some: { industryId: { in: industryIds } } },
      },
      select: { hourlyRate: true },
      take: MARKET_RATE_SAMPLE_CAP,
    }),
    prisma.freelancerProfile.findMany({
      where: { id: { not: profile.id }, hourlyRate: { not: null } },
      select: { hourlyRate: true },
      take: MARKET_RATE_SAMPLE_CAP,
    }),
  ]);

  const marketRate = computeMarketRate({
    ownRate: profile.hourlyRate,
    industryPeerRates: industryPeers.map((p) => p.hourlyRate as number),
    platformPeerRates: platformPeers.map((p) => p.hourlyRate as number),
    minSample: MARKET_RATE_MIN_SAMPLE,
  });

  const { score, missing } = computeFreelancerCompleteness({
    headline: profile.headline,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate,
    location: profile.location,
    availability: profile.availability as Availability,
    languages,
    skillCount: skillIds.length,
    industryCount: industryIds.length,
  });

  // Gevraagde-vaardigheden-signaal: welke vereiste skills vragen de open opdrachten die deze ZZP'er
  // ziet, terwijl ze nog niet in zijn profiel staan? Nudge om het skills-veld te vervolledigen.
  const skillDemand = computeSkillDemand(await getSkillDemandRequirements(actor.id), skillIds);

  // Vindbaarheid-signaal: kan een opdrachtgever dit profiel vinden? Spiegelt exact de server-filters
  // (discoverableFreelancerWhere: PUBLIC-profiel; surfacing: skills + beschikbaarheid). Beschikbaarheid
  // volgt dezelfde bron als de opdrachtgever-zoeklijst: een inzetbaar venster óf de scalaire fallback
  // AVAILABLE/LIMITED (spiegelt freelancer-search.ts).
  const availabilityScalar = profile.availability as Availability;
  const availabilityWindows = profile.availabilityWindows as {
    startDate: Date;
    endDate: Date;
    type: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
  }[];
  const now = new Date();
  // Spiegel exact de opdrachtgever-zoeklijst (`freelancer-search.ts`): een inzetbaar venster óf de
  // scalar-fallback (AVAILABLE/LIMITED) telt als "beschikbaar" — behalve wanneer de ZZP'er nú in een
  // afwezigheidsvenster (vakantie) zit; dan valt hij uit "Alleen beschikbaar" en is de afwezigheid het
  // waarheidssignaal. Zonder deze away-suppressie maskeert een oud "Direct beschikbaar"-veld de vakantie
  // met een misleidend groen vinkje op de vindbaarheid-kaart.
  const { hasAvailability, awaySummary } = usableAvailability(
    availabilityWindows,
    availabilityScalar === "AVAILABLE" || availabilityScalar === "LIMITED",
    now,
  );
  // Verouderde agenda: wél vensters gedeeld, maar alle einddata liggen in het verleden. De ZZP'er is
  // dan nog vindbaar via de scalar-fallback, maar opdrachtgevers zien geen toekomstige inzet meer —
  // dezelfde `expired`-conditie waar het actiecentrum op nudget (pending-tasks.ts).
  const availabilityStale =
    summarizeAvailabilityFreshness(availabilityWindows, now).status === "expired";
  const findability = summarizeFindability({
    isPublic: profile.visibility === "PUBLIC",
    hasSkills: skillIds.length > 0,
    hasAvailability,
    availabilityStale,
    awaySummary,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="break-words font-display text-2xl font-semibold tracking-tight">
            Profiel bewerken
          </h1>
          <p className="text-sm text-muted-foreground">
            Houd je profiel actueel zodat opdrachtgevers je goed kunnen vinden.
          </p>
        </div>
        <Link
          href={`/zzp/${profile.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Naar mijn profiel <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </header>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profiel-compleetheid</span>
            <span className="text-sm tabular-nums text-muted-foreground">{score}%</span>
          </div>
          <Progress value={score} />
          {missing.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Nog aan te vullen: {missing.map((m) => m.label).join(", ")}.
            </p>
          ) : (
            <p className="text-xs text-success">Je profiel is compleet.</p>
          )}
        </CardContent>
      </Card>

      <FindabilityCard findability={findability} />

      <MarketRateCard insight={marketRate} />

      <RateCalculatorCard currentRateEuros={profile.hourlyRate ?? null} />

      <SkillDemandCard demand={skillDemand} />

      <ProfileForm
        initial={{
          headline: profile.headline ?? "",
          bio: profile.bio ?? "",
          hourlyRate: profile.hourlyRate?.toString() ?? "",
          location: profile.location ?? "",
          availability: profile.availability,
          workMode: profile.workMode,
          maxTravelMinutes: profile.maxTravelMinutes?.toString() ?? "",
          languages: languages.join(", "),
          kvkNumber: profile.kvkNumber ?? "",
          btwNumber: profile.btwNumber ?? "",
          iban: profile.iban ?? "",
          website: profile.website ?? "",
          visibility: profile.visibility,
          defaultMotivation: profile.defaultMotivation ?? "",
          skillIds,
          industryIds,
        }}
        skills={skills}
        industries={industries}
      />

      <Card>
        <CardContent className="py-4">
          <WorkExperienceEditor
            items={profile.workExperiences.map((w) => ({
              id: w.id,
              role: w.role,
              organization: w.organization,
              startYear: w.startYear,
              endYear: w.endYear,
              description: w.description,
              createdAt: w.createdAt,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
