import { type Metadata } from "next";
import Link from "next/link";
import {
  Users,
  MapPin,
  Euro,
  Calendar,
  CalendarClock,
  Search,
  Briefcase,
  BellRing,
} from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type Availability, type CredentialType } from "@/lib/enums";
import {
  type FreelancerCredential,
  type JobMatchSource,
  type FreelancerMatchSource,
} from "@/lib/matching";
import { computeEngageability } from "@/lib/engageability";
import { outstandingMandatoryTypes } from "@/lib/franchise/credential-reminder";
import { FranchiseCredentialReminderButton } from "@/components/franchise/credential-reminder-button";
import {
  summarizeExpiryAlert,
  expiryAlertLabel,
  expiryAlertTone,
  type ExpiryWindow,
} from "@/lib/franchise/credential-alerts";
import { summarizeCredentialCompliance } from "@/lib/franchise/credential-compliance";
import { CredentialComplianceStrip } from "@/components/franchise/credential-compliance-strip";
import {
  classifyRosterDormancy,
  summarizeRosterDormancy,
  type DormancyTier,
  type RosterDormancy,
} from "@/lib/franchise/roster-dormancy";
import { RosterDormancyStrip } from "@/components/franchise/roster-dormancy-strip";
import {
  parseRosterFilter,
  filterRoster,
  sortRoster,
  isRosterFilterActive,
  type RosterZzper,
  type RosterSortKey,
} from "@/lib/franchise/zzper-roster-filter";
import { summarizeRosterCapacity, isIdleReady } from "@/lib/franchise/roster-capacity";
import { RosterCapacityStrip } from "@/components/franchise/roster-capacity-strip";
import {
  countPlaceableDiensten,
  placeableChipLabel,
  placeableHeadline,
} from "@/lib/franchise/roster-placement";
import {
  freeDateFromActiveCollaborations,
  forecastChipLabel,
  summarizeRosterForecast,
  rosterForecastHeadline,
} from "@/lib/franchise/roster-availability-forecast";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { avatarAccent } from "@/lib/avatar-accent";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { EngageabilityBadge } from "@/components/engageability-badge";
import { plural } from "@/lib/plural";
import { ZzperForm } from "./zzper-form";

export const metadata: Metadata = { title: "ZZP'ers · Bemiddeling" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const WORK_MODE_LABEL: Record<string, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: "Beschikbaar",
  LIMITED: "Beperkt beschikbaar",
  UNAVAILABLE: "Niet beschikbaar",
};

const SORT_LABEL: Record<RosterSortKey, string> = {
  recent: "Nieuwste eerst",
  name: "Naam (A–Z)",
  "rate-asc": "Tarief (laag → hoog)",
  "rate-desc": "Tarief (hoog → laag)",
};

// Render-velden bovenop de filter-/sorteervorm (RosterZzper).
interface RosterCard extends RosterZzper {
  email: string;
  workMode: string;
  completeness: number;
  credentialCount: number;
  blockers: string[];
  /** Verplichte documenten die openstaan (ontbrekend/verlopen) — waar een herinnering zin heeft. */
  outstandingTypes: CredentialType[];
  alertLabel: string | null;
  alertTone: ReturnType<typeof expiryAlertTone>;
  /** Meest urgente vervalvenster — voedt het aggregate compliance-overzicht. */
  alertWindow: ExpiryWindow | null;
  /** Aantal open tenant-diensten waarop deze (vrij-inzetbare) ZZP'er plaatsbaar is; 0 voor wie al
   *  is ingezet of (nog) niet inzetbaar — daar heeft een plaatsingssuggestie geen zin. */
  placeableDiensten: number;
  /** Vrijkomdatum (laatste ACTIVE-samenwerking-einde) voor de vooruitblik; null als onbekend/niet
   *  ingezet of open einde. */
  freeDate: Date | null;
  /** Re-engagement-tier (bench-inactiviteit); voedt het `?dormant=1`-filter + de kaart-chip. */
  dormancyTier: DormancyTier;
  /** Presentatie van het re-engagement-signaal (chip-label + toon); active → geen chip. */
  dormancy: RosterDormancy;
}

export default async function FranchiseZzpersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireRole("FRANCHISER");
  const sp = await searchParams;
  const filter = parseRosterFilter(sp);
  const now = new Date();
  const [freelancers, skills, openDiensten] = await Promise.all([
    // unbounded-allow: franchise-tenant-scoped freelancers; beheerbaar volume
    prisma.freelancerProfile.findMany({
      where: tenantScopeWhere(actor),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, identityVerifiedAt: true, lastLoginAt: true } },
        credentials: { select: { type: true, status: true, expiresAt: true } },
        skills: { include: { skill: { select: { name: true } } } },
        // Matchbron-relaties voor het plaatsbaarheids-signaal (welke open diensten passen bij deze
        // ZZP'er) — de scalaire profielvelden (tarief/werkmodus/locatie/…) komen al mee via include.
        industries: { select: { industryId: true } },
        availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
        // Einddata van lopende samenwerkingen — voedt de vooruitblik "wie komt binnenkort vrij?".
        // Tenant-gescopet via de freelancer zelf; per ZZP'er een klein aantal (geen N+1).
        collaborations: { where: { status: "ACTIVE" }, select: { endDate: true } },
        _count: {
          select: {
            credentials: true,
            // Alleen lopende inzet telt als "nu ingezet" voor het capaciteitsoverzicht.
            collaborations: { where: { status: "ACTIVE" } },
            skills: true,
          },
        },
      },
    }),
    // unbounded-allow: skills-referentielijst voor formulier
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // Open (gepubliceerde) diensten binnen dezelfde tenant — de plaatsbare set voor het roster;
    // tenant-gescopet + take-begrensd. Zelfde bron én zelfde deterministische venster als de
    // detail-suggestiekaart (`orderBy: publishedAt desc, take: 100`): boven de 100 diensten pakken
    // beide surfaces zo dezelfde nieuwste-100, zodat de chip-telling niet afwijkt van het detail.
    prisma.job.findMany({
      where: { status: "PUBLISHED", ...tenantScopeWhere(actor) },
      orderBy: { publishedAt: "desc" },
      take: 100,
      select: {
        title: true,
        description: true,
        rateMin: true,
        rateMax: true,
        workMode: true,
        location: true,
        industryId: true,
        skills: { select: { skillId: true, required: true } },
        credentialRequirements: { select: { credentialType: true, required: true } },
      },
    }),
  ]);

  // Één keer naar de matchbron-vorm mappen; elke vrij-inzetbare ZZP'er scoort hiertegen (geen N+1).
  const dienstSources: JobMatchSource[] = openDiensten.map((j) => ({
    title: j.title,
    description: j.description,
    rateMin: j.rateMin,
    rateMax: j.rateMax,
    workMode: j.workMode,
    location: j.location,
    industryId: j.industryId,
    skills: j.skills,
    credentialRequirements: j.credentialRequirements,
  }));

  const cards: RosterCard[] = freelancers.map((f) => {
    const credentials = f.credentials.map(
      (c): FreelancerCredential => ({
        type: c.type as FreelancerCredential["type"],
        status: c.status as FreelancerCredential["status"],
        expiresAt: c.expiresAt,
      }),
    );
    const alert = summarizeExpiryAlert(
      f.credentials.map((c) => ({
        id: `${f.id}:${c.type}`,
        title: CREDENTIAL_TYPE_LABEL[c.type as keyof typeof CREDENTIAL_TYPE_LABEL] ?? c.type,
        type: c.type as FreelancerCredential["type"],
        status: c.status as FreelancerCredential["status"],
        expiresAt: c.expiresAt,
      })),
      now,
    );
    const eng = computeEngageability(
      {
        credentials,
        completeness: f.completeness,
        availability: f.availability as Availability,
        identityVerified: f.user.identityVerifiedAt != null,
        lastActiveAt: f.user.lastLoginAt,
      },
      now,
    );
    const alertLabel = expiryAlertLabel(alert);
    const alertTone = expiryAlertTone(alert);
    // Alleen vrij-inzetbare ZZP'ers scoren tegen de open diensten: wie werkt of nog niet inzetbaar is,
    // hoeft niet geplaatst te worden. Zelfde `isIdleReady`-definitie als het capaciteitsoverzicht →
    // de chip verschijnt precies bij de bench die de tegel telt.
    const idleReady = isIdleReady({
      engageabilityStatus: eng.status,
      availability: f.availability as Availability,
      activeCollaborations: f._count.collaborations,
    });
    const placeableDiensten =
      idleReady && dienstSources.length > 0
        ? countPlaceableDiensten(
            {
              skills: f.skills.map((s) => ({ skillId: s.skillId })),
              credentials: f.credentials.map((c) => ({
                type: c.type,
                status: c.status,
                expiresAt: c.expiresAt,
              })),
              hourlyRate: f.hourlyRate,
              workMode: f.workMode,
              location: f.location,
              maxTravelMinutes: f.maxTravelMinutes,
              headline: f.headline,
              bio: f.bio,
              availability: f.availability,
              availabilityWindows: f.availabilityWindows,
              industries: f.industries,
            } satisfies FreelancerMatchSource,
            dienstSources,
            now,
          )
        : 0;
    // Re-engagement: koelt deze bench-vakmens af (lang niet ingelogd én niet ingezet)? Zelfde
    // `activeCollaborations`-telling als het capaciteitsoverzicht → een ingezette vakmens telt nooit
    // als stilgevallen. Read-only afleiding op de al-geladen `lastLoginAt`.
    const dormancy = classifyRosterDormancy(
      { lastActiveAt: f.user.lastLoginAt, activeCollaborations: f._count.collaborations },
      now,
    );
    return {
      id: f.id,
      name: f.user.name ?? "—",
      email: f.user.email,
      headline: f.headline ?? null,
      location: f.location ?? null,
      workMode: f.workMode,
      skillLabels: f.skills.map((s) => s.skill.name),
      availability: f.availability,
      hourlyRate: f.hourlyRate,
      completeness: f.completeness,
      credentialCount: f._count.credentials,
      engageabilityStatus: eng.status,
      blockers: eng.blockers,
      outstandingTypes: outstandingMandatoryTypes(credentials, now),
      hasAlert: alertLabel != null && alertTone != null,
      alertLabel,
      alertTone,
      alertWindow: alert.window,
      activeCollaborations: f._count.collaborations,
      placeableDiensten,
      freeDate: freeDateFromActiveCollaborations(f.collaborations.map((c) => c.endDate)),
      dormancyTier: dormancy.tier,
      dormancy,
    };
  });

  const capacity = summarizeRosterCapacity(cards);
  // Vooruitblik: welke nu-ingezette vakmensen komen binnenkort weer vrij (herplaatsing plannen).
  const forecast = summarizeRosterForecast(
    cards.map((c) => ({ freeDate: c.freeDate })),
    now,
  );
  const forecastHeadlineText = rosterForecastHeadline(forecast);
  const compliance = summarizeCredentialCompliance(cards.map((c) => ({ window: c.alertWindow })));
  // Re-engagement: welke bench-vakmensen koelen af (lang niet ingelogd, niet ingezet)? Over het hele
  // roster geteld (niet het filter), zodat de strip het volledige beeld toont. Telt de reeds per kaart
  // geclassificeerde tiers (één bron van waarheid met de kaart-chip, geen herberekening).
  const dormancy = summarizeRosterDormancy(cards);
  // Kop over de hele roster (niet het filter): hoeveel vrije vakmensen zijn nu direct plaatsbaar.
  const placeableHeadlineText = placeableHeadline(
    cards.filter((c) => c.placeableDiensten > 0).length,
  );
  const visible = sortRoster(filterRoster(cards, filter), filter.sort);
  const filterActive = isRosterFilterActive(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ZZP'ers"
        description="De ZZP'ers in je roster — degenen die je in je bemiddeling hebt gebracht."
      />

      {/* Toevoegen ingeklapt zodat de roster (het primaire werk) bovenaan dominant blijft; open zodra
          er nog geen ZZP'ers zijn (eerste onboarding). */}
      <details open={freelancers.length === 0} className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer p-4 text-sm font-semibold tracking-tight">
          Nieuwe ZZP&apos;er toevoegen
        </summary>
        <div className="space-y-4 border-t border-border p-5 pt-4">
          <ZzperForm skills={skills} />
        </div>
      </details>

      {freelancers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nog geen ZZP'ers"
            description="Voeg hierboven je eerste ZZP'er toe — daarna vult hij zelf zijn profiel en certificaten aan."
          />
        </Card>
      ) : (
        <>
          {/* Capaciteitsoverzicht: "wie kan ik nu aan het werk zetten?" — vrije capaciteit als
              hoofdmaat, klikbaar naar het idle-filter. */}
          <RosterCapacityStrip summary={capacity} />

          {/* Compliance-overzicht: "houd ik mijn pool compliant?" — verlopen/aflopende certificaten
              als aggregaat, klikbaar naar het alerts-filter. Rendert alleen bij een signaal. */}
          <CredentialComplianceStrip summary={compliance} />

          {/* Re-engagement: "wie van mijn bench koelt af?" — vakmensen die lang niet inlogden en niet
              zijn ingezet, klikbaar naar het `?dormant=1`-filter. Rendert alleen bij een signaal. */}
          <RosterDormancyStrip summary={dormancy} />

          {/* Plaatsbaarheid: "wie van mijn bench kan ik nú op een open dienst zetten?" — telt de vrije
              vakmensen met minstens één passende open dienst. Rendert alleen bij een plaatsingskans. */}
          {placeableHeadlineText && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="size-4 shrink-0 text-success" aria-hidden />
              {placeableHeadlineText}
            </p>
          )}

          {/* Vooruitblik: "wie komt binnenkort vrij?" — nu-ingezette vakmensen wier opdracht
              afloopt, zodat de bemiddelaar herplaatsing vooruit plant. Rendert alleen bij aankomende
              vrijval. */}
          {forecastHeadlineText && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {forecastHeadlineText}
            </p>
          )}

          {/* Zoeken + filteren + sorteren (GET → server-side waarheid; deelbaar/herlaadbaar). */}
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="q" className="mb-1 block text-xs font-medium text-muted-foreground">
                Zoeken
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="q"
                  name="q"
                  defaultValue={filter.q}
                  placeholder="Naam, functie, plaats of vaardigheid"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-44">
              <label
                htmlFor="availability"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Beschikbaarheid
              </label>
              <Select
                id="availability"
                name="availability"
                defaultValue={filter.availability ?? ""}
              >
                <option value="">Alle</option>
                <option value="AVAILABLE">Beschikbaar</option>
                <option value="LIMITED">Beperkt beschikbaar</option>
                <option value="UNAVAILABLE">Niet beschikbaar</option>
              </Select>
            </div>
            <div className="w-44">
              <label
                htmlFor="status"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Inzetbaarheid
              </label>
              <Select id="status" name="status" defaultValue={filter.status ?? ""}>
                <option value="">Alle</option>
                <option value="ACTIEF">Inzetbaar</option>
                <option value="AANDACHT">Aandacht nodig</option>
                <option value="INACTIEF">Nog niet inzetbaar</option>
              </Select>
            </div>
            <div className="w-48">
              <label
                htmlFor="sort"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Sorteren
              </label>
              <Select id="sort" name="sort" defaultValue={filter.sort}>
                {(Object.keys(SORT_LABEL) as RosterSortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABEL[key]}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="alerts"
                value="1"
                defaultChecked={filter.onlyAlerts}
                className="size-4 rounded border-input"
              />
              Alleen certificaat-waarschuwing
            </label>
            <label className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="idle"
                value="1"
                defaultChecked={filter.onlyIdle}
                className="size-4 rounded border-input"
              />
              Alleen vrij inzetbaar
            </label>
            <label className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="dormant"
                value="1"
                defaultChecked={filter.onlyDormant}
                className="size-4 rounded border-input"
              />
              Alleen stilgevallen
            </label>
            <Button type="submit">Filteren</Button>
            {filterActive && (
              <Button asChild variant="ghost">
                <Link href="/franchise/zzpers">Wissen</Link>
              </Button>
            )}
          </form>

          <p className="text-xs text-muted-foreground">
            {visible.length === cards.length
              ? plural(cards.length, "ZZP'er", "ZZP'ers")
              : `${visible.length} van ${plural(cards.length, "ZZP'er", "ZZP'ers")}`}
          </p>

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={Search}
                title="Geen ZZP'ers in dit filter"
                description="Pas je zoekopdracht of filters aan om meer ZZP'ers te zien."
              />
            </Card>
          ) : (
            // Zelfde kaartweergave als de opdrachtgever (/freelancers): avatar + naam + status,
            // meta, skills en een profielknop — hier rol-passend met inzetbaarheid + detail-link.
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((f) => {
                const initials = f.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <Card key={f.id} className="flex flex-col gap-3 p-4">
                    {/* Kop: avatar + naam + inzetbaarheid */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarAccent(f.name)}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{f.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {f.headline ?? f.email}
                        </p>
                      </div>
                      <span className="shrink-0">
                        <EngageabilityBadge status={f.engageabilityStatus} />
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {f.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                          {f.location} · {WORK_MODE_LABEL[f.workMode] ?? f.workMode}
                        </span>
                      )}
                      {f.hourlyRate != null && (
                        <span className="flex items-center gap-1">
                          <Euro className="h-3 w-3 shrink-0" aria-hidden />€ {f.hourlyRate} / uur
                        </span>
                      )}
                      {AVAILABILITY_LABEL[f.availability] && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                          {AVAILABILITY_LABEL[f.availability]}
                        </span>
                      )}
                    </div>

                    {/* Plaatsbaarheid: hoeveel open diensten passen bij deze vrije vakmens. Klikt door
                        naar het profiel waar de suggestie-kaart de diensten toont mét voordracht-actie
                        — geen dood signaal, direct handelingsperspectief. */}
                    {placeableChipLabel(f.placeableDiensten) && (
                      <Link
                        href={`/franchise/zzpers/${f.id}`}
                        className="self-start rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Badge variant="success" className="gap-1">
                          <Briefcase className="size-3 shrink-0" aria-hidden />
                          {placeableChipLabel(f.placeableDiensten)}
                        </Badge>
                      </Link>
                    )}

                    {/* Vooruitblik: nu-ingezette vakmens die binnenkort vrij komt — plan
                        herplaatsing vast in. Read-only signaal (geen actie op de kaart zelf). */}
                    {forecastChipLabel(f.freeDate, now) && (
                      <Badge variant="muted" className="gap-1 self-start">
                        <CalendarClock className="size-3 shrink-0" aria-hidden />
                        {forecastChipLabel(f.freeDate, now)}
                      </Badge>
                    )}

                    {/* Re-engagement: bench-vakmens die afkoelt (lang niet ingelogd, niet ingezet).
                        Read-only signaal met concrete benader-stap; rendert alleen bij cooling/dormant. */}
                    {f.dormancy.label && (
                      <Badge
                        variant={f.dormancy.tone === "warning" ? "warning" : "muted"}
                        className="gap-1 self-start"
                      >
                        <BellRing className="size-3 shrink-0" aria-hidden />
                        {f.dormancy.label}
                      </Badge>
                    )}

                    {/* Certificaat-waarschuwing + blokkade */}
                    {f.alertLabel && f.alertTone && (
                      <Badge variant={f.alertTone} className="self-start">
                        {f.alertLabel}
                      </Badge>
                    )}
                    {f.blockers.length > 0 && (
                      <p className="truncate text-xs text-danger">
                        {f.blockers[0]}
                        {f.blockers.length > 1 ? ` +${f.blockers.length - 1}` : ""}
                      </p>
                    )}
                    {/* Eén-klik herinnering per openstaand verplicht document — geeft de blokkade
                        handelingsperspectief (zelfde patroon als de opdrachtgever bij samenwerkingen). */}
                    {f.outstandingTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {f.outstandingTypes.map((t) => (
                          <FranchiseCredentialReminderButton
                            key={t}
                            freelancerId={f.id}
                            type={t}
                            size="xs"
                            label={CREDENTIAL_TYPE_LABEL[t] ?? t}
                          />
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {f.skillLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {f.skillLabels.slice(0, 4).map((s) => (
                          <Badge key={s} variant="muted" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {f.skillLabels.length > 4 && (
                          <Badge variant="muted" className="text-xs">
                            +{f.skillLabels.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {plural(f.credentialCount, "certificaat", "certificaten")} · profiel{" "}
                      {f.completeness}%
                    </p>

                    {/* Actie */}
                    <div className="mt-auto pt-1">
                      <Button asChild variant="secondary" size="sm" className="w-full">
                        <Link href={`/franchise/zzpers/${f.id}`}>Bekijk profiel</Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
