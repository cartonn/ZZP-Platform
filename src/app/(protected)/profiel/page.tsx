import { type Metadata } from "next";
import Link from "next/link";
import { ExternalLink, UserX } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { type Availability } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mijn profiel · ZZP Platform" };

function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

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
      <div className="mx-auto max-w-3xl">
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
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mijn profiel</h1>
          <p className="text-sm text-muted-foreground">
            Houd je profiel actueel zodat opdrachtgevers je goed kunnen vinden.
          </p>
        </div>
        {profile.visibility === "PUBLIC" && (
          <Link
            href={`/zzp/${profile.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Bekijk publiek profiel <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}
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
