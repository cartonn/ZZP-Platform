import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { currentActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { profileVisibleTo, computeFreelancerCompleteness } from "@/lib/profile";
import { tenantEntityVisibleTo } from "@/lib/tenancy";
import { summarizeAvailability } from "@/lib/availability";
import { computeTrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import {
  type Availability,
  type AvailabilityWindowType,
  type CredentialType,
  type Visibility,
  type WorkMode,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { TrustBadge } from "@/components/trust/trust-badge";
import { TrustExplanation } from "@/components/trust/trust-explanation";
import { VerificationMarks } from "@/components/credentials/verification-marks";

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
const WINDOW_TYPE: Record<
  AvailabilityWindowType,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
};
const COLLAB_STATUS: Record<string, { label: string; variant: "success" | "warning" | "muted" }> = {
  COMPLETED: { label: "Afgerond", variant: "success" },
  ACTIVE: { label: "Lopend", variant: "warning" },
  PROPOSED: { label: "Voorstel", variant: "muted" },
};

// Verificatiebron per certificaattype — zelfde taal als het ontwerp (DUO/BIG/ADMIN).
const SOURCE_TAG: Partial<Record<CredentialType, string>> = {
  DIPLOMA: "DUO",
  LICENSE: "BIG",
};

const TABS = [
  { key: "profiel", label: "Profiel" },
  { key: "certificaten", label: "Certificaten" },
  { key: "beschikbaarheid", label: "Beschikbaarheid" },
  { key: "samenwerkingen", label: "Samenwerkingen" },
  { key: "beoordelingen", label: "Beoordelingen" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function initials(name: string | null): string {
  if (!name) return "Z";
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

function SignalBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{clamped}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className="h-full rounded-full bg-success" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: TabKey = (TABS.find((t) => t.key === rawTab)?.key ?? "profiel") as TabKey;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, identityVerifiedAt: true } },
      skills: { include: { skill: { select: { name: true } } } },
      industries: { include: { industry: { select: { name: true } } } },
      credentials: {
        where: { status: "VERIFIED" },
        select: {
          id: true,
          title: true,
          type: true,
          issuer: true,
          verifiedAt: true,
          expiresAt: true,
          visibility: true,
        },
        orderBy: { title: "asc" },
      },
      availabilityWindows: {
        select: { startDate: true, endDate: true, type: true, hoursPerWeek: true, note: true },
        orderBy: { startDate: "asc" },
      },
      // Samenwerkingen geanonimiseerd getoond (alleen opdrachttitel + status — géén bedrijfsnaam
      // van derden op een publiek profiel). Recentste eerst, begrensd.
      collaborations: {
        select: { id: true, status: true, updatedAt: true, job: { select: { title: true } } },
        orderBy: { updatedAt: "desc" },
        take: 8,
      },
    },
  });

  if (!profile) notFound();

  const viewer = await currentActor();
  if (!profileVisibleTo(viewer, profile.userId, profile.visibility as Visibility)) {
    notFound();
  }
  // Gesloten per tenant: een aan een franchise gebonden ZZP-profiel mag niet publiek (of cross-tenant)
  // worden ingezien — alleen de eigenaar, een ADMIN of iemand binnen dezelfde tenant. Directe profielen
  // (tenantId == null) blijven publiek. Consistent met visibleFreelancersWhere op /freelancers.
  if (!tenantEntityVisibleTo(viewer, profile.tenantId, profile.userId)) {
    notFound();
  }

  const availability = AVAILABILITY[profile.availability as Availability];
  const languages = parseLanguages(profile.languages);
  const availabilitySummary = summarizeAvailability(
    profile.availabilityWindows.map((w) => ({ ...w, type: w.type as AvailabilityWindowType })),
  );
  const now = Date.now();
  const DAY = 86_400_000;
  // Geldige (niet-verlopen) geverifieerde certificaten. Het vertrouwensniveau telt ze ALLE — het is
  // een platform-verificatiesignaal, consistent met /kandidaten en de suggesties — terwijl de getoonde
  // lijst alleen de openbare bevat (de ZZP'er bepaalt zelf wat publiek zichtbaar is).
  const verifiedActive = profile.credentials.filter(
    (c) => !c.expiresAt || c.expiresAt.getTime() > now,
  );
  const publicCredentials = profile.credentials.filter((c) => c.visibility === "PUBLIC");
  const publicValid = publicCredentials.filter((c) => !c.expiresAt || c.expiresAt.getTime() > now);
  const mandatory = mandatoryDocuments(
    verifiedActive.map((c) => ({
      type: c.type as CredentialType,
      status: "VERIFIED" as const,
      expiresAt: c.expiresAt,
    })),
  );
  const trust = computeTrustLevel({
    identityVerified: !!profile.user.identityVerifiedAt,
    verifiedCredentialCount: verifiedActive.length,
    mandatoryDocsComplete: mandatory.allSatisfied,
  });
  const completeness = computeFreelancerCompleteness({
    headline: profile.headline,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate,
    location: profile.location,
    availability: profile.availability as Availability,
    languages,
    skillCount: profile.skills.length,
    industryCount: profile.industries.length,
  });
  const completed = profile.collaborations.filter((c) => c.status === "COMPLETED").length;
  const hoursPerWeek =
    profile.availabilityWindows.find(
      (w) => w.hoursPerWeek != null && w.type !== "UNAVAILABLE" && w.endDate.getTime() > now,
    )?.hoursPerWeek ?? null;
  const memberSince = formatDateShortNl(profile.createdAt);

  const tabHref = (key: TabKey) => (key === "profiel" ? `/zzp/${id}` : `/zzp/${id}?tab=${key}`);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              Z
            </div>
            <span className="text-sm font-semibold">ZZP Platform</span>
          </Link>
          {!viewer && (
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Inloggen
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Profielkop — Warmte-ontwerp: avatar, naam + status, subtitel, kerncijfers. */}
        <Card>
          <CardContent className="space-y-4 p-6 sm:p-8">
            <div className="flex flex-wrap items-start gap-5">
              <div
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary sm:size-20 sm:text-2xl"
              >
                {initials(profile.user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {profile.user.name}
                  </h1>
                  <Badge variant={availability.variant}>{availability.label}</Badge>
                  <TrustBadge level={trust.level} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  {[profile.headline, profile.location, `op het platform sinds ${memberSince}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {profile.hourlyRate != null && (
                    <span>
                      <span className="font-mono text-lg font-semibold tracking-tight">
                        € {profile.hourlyRate}
                      </span>
                      <span className="text-sm text-muted-foreground">/uur</span>
                    </span>
                  )}
                  {hoursPerWeek != null && (
                    <span className="text-sm text-muted-foreground">{hoursPerWeek} u/wk</span>
                  )}
                  {completed > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {plural(completed, "afgeronde samenwerking", "afgeronde samenwerkingen")}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {WORK_MODE[profile.workMode as WorkMode]}
                  </span>
                </div>
                <div className="mt-3">
                  <VerificationMarks
                    credentials={verifiedActive.map((c) => ({
                      type: c.type,
                      status: "VERIFIED",
                      expiresAt: c.expiresAt,
                    }))}
                  />
                </div>
              </div>
              {/* Eigen profiel: direct door naar bewerken — "Mijn profiel" landt hier. */}
              {viewer?.id === profile.userId && (
                <Link
                  href="/profiel/bewerken"
                  className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Bewerk jouw profiel
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs — server-gerenderd via ?tab=, geen client-JS nodig. */}
        <nav
          aria-label="Profielsecties"
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

        {tab === "profiel" && (
          <div className="grid gap-6 md:grid-cols-[3fr_2fr] lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardContent className="py-4">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Stamgegevens
                  </h2>
                  <dl className="mt-2 divide-y divide-border">
                    {profile.headline && <Stat label="Functie" value={profile.headline} />}
                    {profile.skills.length > 0 && (
                      <Stat
                        label="Specialisaties"
                        value={profile.skills.map((s) => s.skill.name).join(", ")}
                      />
                    )}
                    {profile.industries.length > 0 && (
                      <Stat
                        label="Branches"
                        value={profile.industries.map((i) => i.industry.name).join(", ")}
                      />
                    )}
                    {profile.location && (
                      <Stat
                        label="Locatie"
                        value={
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                            {profile.location}
                            {profile.maxTravelMinutes != null &&
                              ` · ${profile.maxTravelMinutes} min reistijd`}
                          </span>
                        }
                      />
                    )}
                    {profile.hourlyRate != null && (
                      <Stat label="Uurtarief" value={`€ ${profile.hourlyRate}`} />
                    )}
                    {profile.kvkNumber && <Stat label="KvK-nummer" value={profile.kvkNumber} />}
                    {languages.length > 0 && <Stat label="Talen" value={languages.join(", ")} />}
                    <Stat label="Op het platform sinds" value={memberSince} />
                  </dl>
                </CardContent>
              </Card>

              {profile.bio && (
                <Card>
                  <CardContent className="py-4">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Over
                    </h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                      {profile.bio}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="py-4">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Profielkracht
                  </h2>
                  <div className="mt-3 flex justify-center">
                    <ScoreRing value={completeness.score} label="Profielkracht" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <SignalBar
                      label="Identiteit"
                      value={profile.user.identityVerifiedAt ? 100 : 0}
                    />
                    <SignalBar
                      label="Verplichte documenten"
                      value={mandatory.allSatisfied ? 100 : 0}
                    />
                    <SignalBar
                      label="Certificaten geldig"
                      value={
                        publicCredentials.length > 0
                          ? (publicValid.length / publicCredentials.length) * 100
                          : 0
                      }
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Server-side berekend uit verifieerbare signalen — eerlijk vermeld, geen black
                    box.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Vertrouwen
                  </h2>
                  <dl className="mt-2 divide-y divide-border">
                    <Stat
                      label="Identiteit"
                      value={
                        profile.user.identityVerifiedAt ? (
                          <span className="text-success">Geverifieerd via iDIN</span>
                        ) : (
                          <span className="text-muted-foreground">Niet geverifieerd</span>
                        )
                      }
                    />
                    <Stat
                      label="Verplichte documenten"
                      value={
                        mandatory.allSatisfied ? (
                          <span className="text-success">Volledig ✓</span>
                        ) : (
                          <span className="text-muted-foreground">Onvolledig</span>
                        )
                      }
                    />
                    <Stat
                      label="Geverifieerde certificaten"
                      value={String(verifiedActive.length)}
                    />
                  </dl>
                </CardContent>
              </Card>

              {profile.collaborations.length > 0 && (
                <Card>
                  <CardContent className="py-4">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recente samenwerkingen
                    </h2>
                    <ul className="mt-2 divide-y divide-border">
                      {profile.collaborations.slice(0, 3).map((c) => {
                        const st = COLLAB_STATUS[c.status] ?? COLLAB_STATUS.PROPOSED!;
                        return (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-3 py-2 text-sm"
                          >
                            <span className="min-w-0 truncate">{c.job.title}</span>
                            <Badge variant={st.variant} className="shrink-0">
                              {st.label}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === "certificaten" && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Certificaten — servergeverifieerd
                </h2>
                {publicCredentials.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {publicValid.length} van {publicCredentials.length} geldig
                  </span>
                )}
              </div>
              {publicCredentials.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Deze ZZP&apos;er heeft (nog) geen certificaten openbaar gedeeld.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {publicCredentials.map((c) => {
                    const expired = c.expiresAt != null && c.expiresAt.getTime() <= now;
                    const daysLeft = c.expiresAt
                      ? Math.ceil((c.expiresAt.getTime() - now) / DAY)
                      : null;
                    const expiringSoon = !expired && daysLeft != null && daysLeft <= 30;
                    const detail = expired
                      ? `Verlopen op ${formatDateShortNl(c.expiresAt!)}`
                      : [
                          c.verifiedAt ? `Geverifieerd ${formatDateShortNl(c.verifiedAt)}` : null,
                          expiringSoon
                            ? `verloopt over ${plural(daysLeft!, "dag", "dagen")}`
                            : c.expiresAt
                              ? `geldig t/m ${formatDateShortNl(c.expiresAt)}`
                              : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[c.issuer, detail].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                            {SOURCE_TAG[c.type as CredentialType] ?? "ADMIN"}
                          </span>
                          {expired ? (
                            <Badge variant="danger">Verlopen</Badge>
                          ) : expiringSoon ? (
                            <Badge variant="warning">Verloopt</Badge>
                          ) : (
                            <Badge variant="success">Geverifieerd</Badge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "beschikbaarheid" && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Beschikbaarheid
                </h2>
                <Badge variant={availability.variant}>{availability.label}</Badge>
              </div>
              {availabilitySummary && <p className="mt-2 text-sm">{availabilitySummary}</p>}
              {profile.availabilityWindows.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Geen beschikbaarheidsvensters gedeeld.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {profile.availabilityWindows
                    .filter((w) => w.endDate.getTime() > now)
                    .map((w, i) => {
                      const wt = WINDOW_TYPE[w.type as AvailabilityWindowType];
                      return (
                        <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="inline-flex min-w-0 items-center gap-2 text-sm">
                            <Calendar
                              className="size-3.5 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                            <span className="truncate">
                              {formatDateShortNl(w.startDate)} – {formatDateShortNl(w.endDate)}
                              {w.hoursPerWeek != null && ` · ${w.hoursPerWeek} u/wk`}
                            </span>
                          </span>
                          <Badge variant={wt.variant} className="shrink-0">
                            {wt.label}
                          </Badge>
                        </li>
                      );
                    })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "samenwerkingen" && (
          <Card>
            <CardContent className="py-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Samenwerkingen via het platform
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Om privacyredenen tonen we de opdracht, niet de opdrachtgever.
              </p>
              {profile.collaborations.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nog geen samenwerkingen via het platform.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {profile.collaborations.map((c) => {
                    const st = COLLAB_STATUS[c.status] ?? COLLAB_STATUS.PROPOSED!;
                    return (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {st.label === "Afgerond"
                              ? `Afgerond · ${formatDateShortNl(c.updatedAt)}`
                              : st.label}
                          </p>
                        </div>
                        <Badge variant={st.variant} className="shrink-0">
                          {st.label}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "beoordelingen" && (
          <Card>
            <CardContent className="py-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Beoordelingen
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Het beoordelingssysteem is in voorbereiding. Tot die tijd is het dossier het bewijs:{" "}
                {plural(completed, "afgeronde samenwerking", "afgeronde samenwerkingen")},{" "}
                {plural(
                  verifiedActive.length,
                  "geverifieerd certificaat",
                  "geverifieerde certificaten",
                )}
                {profile.user.identityVerifiedAt ? " en een geverifieerde identiteit" : ""} — geen
                sterren, wel feiten.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Vertrouwens-uitleg onder elke tab: welke signalen het niveau dragen. */}
        {trust.level !== "BASIS" && <TrustExplanation trust={trust} />}
      </main>
    </div>
  );
}
