import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { currentActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { profileVisibleTo } from "@/lib/profile";
import { summarizeAvailability } from "@/lib/availability";
import { computeTrustLevel } from "@/lib/trust";
import {
  type Availability,
  type AvailabilityWindowType,
  type Visibility,
  type WorkMode,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrustBadge } from "@/components/trust/trust-badge";

export const metadata: Metadata = { title: "ZZP-profiel · ZZP Platform" };

const AVAILABILITY: Record<
  Availability,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt beschikbaar", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
  UNKNOWN: { label: "Beschikbaarheid onbekend", variant: "muted" },
};
const WORK_MODE: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.freelancerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, identityVerifiedAt: true } },
      skills: { include: { skill: { select: { name: true } } } },
      industries: { include: { industry: { select: { name: true } } } },
      credentials: {
        where: { visibility: "PUBLIC", status: "VERIFIED" },
        select: { id: true, title: true, type: true, expiresAt: true },
        orderBy: { title: "asc" },
      },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
    },
  });

  if (!profile) notFound();

  const viewer = await currentActor();
  if (!profileVisibleTo(viewer, profile.userId, profile.visibility as Visibility)) {
    notFound();
  }

  const availability = AVAILABILITY[profile.availability as Availability];
  const languages = parseLanguages(profile.languages);
  const availabilitySummary = summarizeAvailability(
    profile.availabilityWindows.map((w) => ({ ...w, type: w.type as AvailabilityWindowType })),
  );
  const now = Date.now();
  const verifiedCredentials = profile.credentials.filter(
    (c) => !c.expiresAt || c.expiresAt.getTime() > now,
  );
  const trust = computeTrustLevel({
    identityVerified: !!profile.user.identityVerifiedAt,
    verifiedCredentialCount: verifiedCredentials.length,
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              Z
            </div>
            <span className="text-sm font-semibold">ZZP Platform</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Inloggen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">{profile.user.name}</h1>
                  <TrustBadge level={trust.level} />
                </div>
                {profile.headline && (
                  <p className="text-sm text-muted-foreground">{profile.headline}</p>
                )}
              </div>
              <Badge variant={availability.variant}>{availability.label}</Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden /> {profile.location}
                </span>
              )}
              <span>{WORK_MODE[profile.workMode as WorkMode]}</span>
              {profile.hourlyRate != null && <span>€ {profile.hourlyRate}/uur</span>}
              {languages.length > 0 && <span>Talen: {languages.join(", ")}</span>}
              {availabilitySummary && <span>{availabilitySummary}</span>}
            </div>

            {profile.bio && (
              <p className="whitespace-pre-line text-sm leading-relaxed">{profile.bio}</p>
            )}
          </CardContent>
        </Card>

        {profile.skills.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <Badge key={s.skillId} variant="muted">
                  {s.skill.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {profile.industries.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Branches</h2>
            <div className="flex flex-wrap gap-2">
              {profile.industries.map((i) => (
                <Badge key={i.industryId} variant="muted">
                  {i.industry.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {verifiedCredentials.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Geverifieerde certificaten</h2>
            <div className="flex flex-wrap gap-2">
              {verifiedCredentials.map((c) => (
                <Badge key={c.id} variant="success">
                  {c.title}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
