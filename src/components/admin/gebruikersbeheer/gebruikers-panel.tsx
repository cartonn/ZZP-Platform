import Link from "next/link";
import { AlertTriangle, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { ciContains } from "@/lib/db/text-search";
import { ROLE_LABEL } from "@/lib/nav";
import { type UserRole, type UserStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { withParams } from "@/components/admin/base-path";
import { anonymizeUser, setUserStatus } from "@/app/(protected)/admin/gebruikers/actions";
import { AnonymizeButton } from "@/app/(protected)/admin/gebruikers/anonymize-button";
import { plural } from "@/lib/plural";

const STATUS: Record<UserStatus, { label: string; variant: "success" | "danger" | "warning" }> = {
  ACTIVE: { label: "Actief", variant: "success" },
  SUSPENDED: { label: "Geschorst", variant: "danger" },
  PENDING: { label: "In afwachting", variant: "warning" },
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Gebruikers-paneel: accountbeheer (status, schorsing, anonimisering) met zoek-/filter-form. Laadt
 * zelf zijn data (admin-view, begrensd op 100). Het filter-form en de alert-links wijzen naar
 * `basePath` (mag al een query bevatten, bv. ?tab=gebruikers) zodat het paneel zowel op
 * /admin/gebruikers als binnen de Gebruikers-hub werkt. Rendert geen eigen paginakop.
 *
 * @param actor        de ingelogde beheerder (om "jij" te markeren en self-acties te blokkeren).
 * @param searchParams genormaliseerde searchParams uit de host (q/role/status/deletion).
 * @param basePath     pad waarheen filter- en alert-links wijzen; mag al een query bevatten.
 */
export async function GebruikersPanel({
  actor,
  searchParams,
  basePath,
}: {
  actor: Actor;
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
}) {
  const q = first(searchParams.q).trim();
  const role = first(searchParams.role);
  const status = first(searchParams.status);
  const deletion = first(searchParams.deletion);

  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: ciContains(q) }, { email: ciContains(q) }];
  if (role) where.role = role;
  if (status) where.status = status;
  if (deletion === "1") where.deletionRequestedAt = { not: null };

  const [users, deletionRequests, pendingUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        deletionRequestedAt: true,
        anonymizedAt: true,
      },
    }),
    prisma.user.count({ where: { deletionRequestedAt: { not: null } } }),
    prisma.user.count({ where: { status: "PENDING" } }),
  ]);

  // Verborgen velden voor het GET-form: de query die al in basePath zit (bv. tab=gebruikers) moet
  // behouden blijven na het filteren, anders verlaat het form de hub-tab.
  const [formAction, formQuery] = basePath.split("?");
  const carryParams = formQuery ? Array.from(new URLSearchParams(formQuery).entries()) : [];

  return (
    <div className="space-y-6">
      {(deletionRequests > 0 || pendingUsers > 0) && (
        <div className="flex flex-wrap gap-2">
          {deletionRequests > 0 && (
            <Link
              href={withParams(basePath, { deletion: 1 })}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm text-danger"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {plural(deletionRequests, "AVG-verwijderverzoek", "AVG-verwijderverzoeken")} —
              beoordeel
            </Link>
          )}
          {pendingUsers > 0 && (
            <Link
              href={withParams(basePath, { status: "PENDING" })}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm text-warning"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {pendingUsers} in afwachting — activeer
            </Link>
          )}
        </div>
      )}

      <form
        method="get"
        action={formAction}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        {carryParams.map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Zoek op naam of e-mail…"
          aria-label="Zoeken"
        />
        <Select name="role" defaultValue={role} aria-label="Rol">
          <option value="">Alle rollen</option>
          <option value="FREELANCER">ZZP&apos;er</option>
          <option value="CLIENT">Opdrachtgever</option>
          <option value="FRANCHISER">Bemiddelaar</option>
          <option value="ADMIN">Beheerder</option>
        </Select>
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">Alle statussen</option>
          <option value="ACTIVE">Actief</option>
          <option value="SUSPENDED">Geschorst</option>
          <option value="PENDING">In afwachting</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filteren
        </Button>
      </form>

      {users.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Users}
              title="Geen gebruikers gevonden"
              description="Er zijn geen accounts die overeenkomen met de huidige filters."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {users.map((u) => {
            const st = STATUS[u.status as UserStatus];
            const isSelf = u.id === actor.id;
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <Link
                  href={`/admin/gebruikersbeheer/${u.id}`}
                  className="focus-ring -m-1 min-w-0 rounded-md p-1 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    {isSelf && <span className="text-xs text-muted-foreground">(jij)</span>}
                    <Badge variant="muted">{ROLE_LABEL[u.role as UserRole]}</Badge>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    {u.anonymizedAt ? (
                      <Badge variant="muted">Geanonimiseerd</Badge>
                    ) : (
                      u.deletionRequestedAt && <Badge variant="danger">Verwijderverzoek</Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </Link>
                {!isSelf && !u.anonymizedAt && (
                  <div className="flex items-center gap-2">
                    {u.deletionRequestedAt && u.role !== "ADMIN" && (
                      <AnonymizeButton action={anonymizeUser.bind(null, u.id)} />
                    )}
                    {/* PENDING goedkeuren = activeren (PENDING -> ACTIVE). */}
                    {u.status === "PENDING" && (
                      <form action={setUserStatus.bind(null, u.id, "ACTIVE")}>
                        <Button type="submit" variant="primary" size="sm">
                          Goedkeuren
                        </Button>
                      </form>
                    )}
                    {u.status === "SUSPENDED" ? (
                      <form action={setUserStatus.bind(null, u.id, "ACTIVE")}>
                        <Button type="submit" variant="secondary" size="sm">
                          Activeren
                        </Button>
                      </form>
                    ) : (
                      <form action={setUserStatus.bind(null, u.id, "SUSPENDED")}>
                        <Button type="submit" variant="destructive" size="sm">
                          Schorsen
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
