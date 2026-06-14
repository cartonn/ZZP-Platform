import { type Metadata } from "next";
import Link from "next/link";
import { ExternalLink, UserX } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { computeMarketRate } from "@/lib/market-rate";
import { MARKET_RATE_MIN_SAMPLE, MARKET_RATE_SAMPLE_CAP } from "@/lib/config";
import { type Availability } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { MarketRateCard } from "@/components/profile/market-rate-card";
import { ProfileForm } from "../profile-form";
import { parseLanguages } from "@/lib/parse-languages";

export const metadata: Metadata = { title: "Profiel bewerken · ZZP Platform" };

export default async function ProfielPage() {
  const actor = await requireRole("FREELANCER");

  const [profile, skills, industries] = await Promise.all([
    prisma.freelancerProfile.findUnique({
      where: { userId: actor.id },
      include: { skills: true, industries: true },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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

      <MarketRateCard insight={marketRate} />

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
          visibility: profile.visibility,
          skillIds,
          industryIds,
        }}
        skills={skills}
        industries={industries}
      />
    </div>
  );
}
