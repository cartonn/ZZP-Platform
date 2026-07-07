import { type Metadata } from "next";
import Link from "next/link";
import { Users, MapPin, Euro, Calendar, Search } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type Availability, type CredentialType } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";
import { computeEngageability } from "@/lib/engageability";
import { outstandingMandatoryTypes } from "@/lib/franchise/credential-reminder";
import { FranchiseCredentialReminderButton } from "@/components/franchise/credential-reminder-button";
import {
  summarizeExpiryAlert,
  expiryAlertLabel,
  expiryAlertTone,
} from "@/lib/franchise/credential-alerts";
import {
  parseRosterFilter,
  filterRoster,
  sortRoster,
  isRosterFilterActive,
  type RosterZzper,
  type RosterSortKey,
} from "@/lib/franchise/zzper-roster-filter";
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
  const [freelancers, skills] = await Promise.all([
    // unbounded-allow: franchise-tenant-scoped freelancers; beheerbaar volume
    prisma.freelancerProfile.findMany({
      where: tenantScopeWhere(actor),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, identityVerifiedAt: true, lastLoginAt: true } },
        credentials: { select: { type: true, status: true, expiresAt: true } },
        skills: { include: { skill: { select: { name: true } } } },
        _count: { select: { credentials: true, collaborations: true, skills: true } },
      },
    }),
    // unbounded-allow: skills-referentielijst voor formulier
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

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
    };
  });

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
