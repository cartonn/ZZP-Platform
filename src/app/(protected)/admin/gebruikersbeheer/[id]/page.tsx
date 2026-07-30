import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Handshake, ScrollText, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { loadUserDossier } from "@/lib/admin-user-detail";
import { ROLE_LABEL } from "@/lib/nav";
import {
  type UserRole,
  type UserStatus,
  type CredentialStatus,
  type CredentialType,
} from "@/lib/enums";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { formatDateNl, formatDateTimeNl } from "@/lib/format-date";
import { formatAuditMetadata } from "@/lib/audit-metadata";
import { auditActionLabel, auditEntityLabel } from "@/lib/audit-labels";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CredentialStatusBadge } from "@/components/credentials/credential-status-badge";
import { setUserStatus } from "@/app/(protected)/admin/gebruikers/actions";

export const metadata: Metadata = { title: "Gebruikersdossier · Handslag" };

const STATUS: Record<UserStatus, { label: string; variant: "success" | "danger" | "warning" }> = {
  ACTIVE: { label: "Actief", variant: "success" },
  SUSPENDED: { label: "Geschorst", variant: "danger" },
  PENDING: { label: "In afwachting", variant: "warning" },
};

type Params = Promise<{ id: string }>;

/**
 * ADMIN-gebruikersdossier (alleen-lezen): rol/status, certificaten + statussen (FREELANCER), actieve
 * samenwerkingen, no-show-teller en de laatste ~20 auditregels van/over deze gebruiker. De inzage
 * wordt geaudit (ACCESS-conventie, vgl. TRUST_DOSSIER_VIEWED). De schors/activeer-actie leeft ook
 * hier, naast de lijst. ADMIN-only (requireRole; /admin/* is ook middleware-gated).
 */
export default async function AdminGebruikerDetailPage({ params }: { params: Params }) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;

  const dossier = await loadUserDossier(id);
  if (!dossier) notFound();

  const { user, credentials, unjustifiedNoShows, collaborations, auditEntries } = dossier;

  // Inzage van een gevoelig dossier wordt geaudit — één ACCESS-regel, net als andere admin-inzagen.
  const meta = await requestMeta();
  await audit({
    actorId: actor.id,
    action: "ADMIN_USER_VIEWED",
    entityType: "User",
    entityId: user.id,
    ...meta,
  });

  const st = STATUS[user.status as UserStatus];
  const isSelf = user.id === actor.id;
  const canModerate = !isSelf && !user.anonymizedAt;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/admin/gebruikersbeheer">
          <ArrowLeft className="size-4" aria-hidden />
          Terug naar gebruikers
        </Link>
      </Button>

      <PageHeader
        title={user.name}
        description={user.email}
        action={
          canModerate ? (
            user.status === "SUSPENDED" ? (
              <form action={setUserStatus.bind(null, user.id, "ACTIVE")}>
                <Button type="submit" variant="secondary" size="sm">
                  Activeren
                </Button>
              </form>
            ) : (
              <form action={setUserStatus.bind(null, user.id, "SUSPENDED")}>
                <Button type="submit" variant="destructive" size="sm">
                  Schorsen
                </Button>
              </form>
            )
          ) : undefined
        }
      />

      {/* Rol- & accountgegevens */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Rol" value={ROLE_LABEL[user.role as UserRole]} />
          <Detail label="Accountstatus" value={<Badge variant={st.variant}>{st.label}</Badge>} />
          <Detail
            label="Identiteit"
            value={
              user.identityVerifiedAt ? (
                <Badge variant="success">Geverifieerd</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Niet geverifieerd</span>
              )
            }
          />
          <Detail label="Lid sinds" value={formatDateNl(user.createdAt)} />
          <Detail label="Laatste login" value={formatDateNl(user.lastLoginAt)} />
          {user.anonymizedAt ? (
            <Detail label="Geanonimiseerd" value={formatDateNl(user.anonymizedAt)} />
          ) : (
            user.deletionRequestedAt && (
              <Detail
                label="Verwijderverzoek"
                value={<Badge variant="danger">{formatDateNl(user.deletionRequestedAt)}</Badge>}
              />
            )
          )}
        </CardContent>
      </Card>

      {/* Signalen: no-show-teller (alleen als er ongegronde no-shows zijn) */}
      {unjustifiedNoShows > 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="size-5 shrink-0 text-danger" aria-hidden />
            <p className="text-sm">
              <span className="font-medium">
                {plural(unjustifiedNoShows, "ongegronde no-show", "ongegronde no-shows")}
              </span>{" "}
              geregistreerd voor deze ZZP&apos;er.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Certificaten (FREELANCER) */}
      {user.role === "FREELANCER" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Certificaten</h2>
          {credentials.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={ScrollText}
                  title="Geen certificaten"
                  description="Deze ZZP'er heeft nog geen certificaten toegevoegd."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {credentials.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {CREDENTIAL_TYPE_LABEL[c.type as CredentialType] ?? c.type}
                      {c.expiresAt ? ` · verloopt ${formatDateNl(c.expiresAt)}` : ""}
                    </p>
                  </div>
                  <CredentialStatusBadge status={c.status as CredentialStatus} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Actieve samenwerkingen */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          {plural(collaborations.length, "actieve samenwerking", "actieve samenwerkingen")}
        </h2>
        {collaborations.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Handshake}
                title="Geen actieve samenwerkingen"
                description="Er lopen op dit moment geen samenwerkingen voor deze gebruiker."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {collaborations.map((col) => (
              <Link
                key={col.id}
                href={`/samenwerkingen/${col.id}`}
                className="focus-ring flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <p className="truncate text-sm font-medium">{col.job.title}</p>
                <span className="text-xs text-muted-foreground">
                  {col.startDate ? `Sinds ${formatDateNl(col.startDate)}` : "Startdatum onbekend"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Auditgeschiedenis van/over deze gebruiker */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recente activiteit</h2>
        {auditEntries.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={ScrollText}
                title="Geen activiteit"
                description="Er zijn nog geen auditregels van of over deze gebruiker."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {auditEntries.map((e) => (
              <div key={e.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                    {auditActionLabel(e.action)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTimeNl(e.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {auditEntityLabel(e.entityType)} · door {e.actor?.name ?? "systeem"}
                </p>
                {e.metadata && (
                  <p className="mt-1 truncate text-xs text-muted-foreground/80">
                    {formatAuditMetadata(e.metadata)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}
