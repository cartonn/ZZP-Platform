import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { toggleSuspension } from "@/lib/admin";
import { ROLE_LABEL } from "@/lib/nav";
import { type UserRole, type UserStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { setUserStatus } from "./actions";

export const metadata: Metadata = { title: "Gebruikers · ZZP Platform" };

const STATUS: Record<UserStatus, { label: string; variant: "success" | "danger" | "warning" }> = {
  ACTIVE: { label: "Actief", variant: "success" },
  SUSPENDED: { label: "Geschorst", variant: "danger" },
  PENDING: { label: "In afwachting", variant: "warning" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function GebruikersPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const role = first(sp.role);
  const status = first(sp.status);
  const deletion = first(sp.deletion);

  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
  if (role) where.role = role;
  if (status) where.status = status;
  if (deletion === "1") where.deletionRequestedAt = { not: null };

  const [users, deletionRequests, pendingUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, email: true, role: true, status: true, deletionRequestedAt: true },
    }),
    prisma.user.count({ where: { deletionRequestedAt: { not: null } } }),
    prisma.user.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Gebruikers</h1>
        <p className="text-sm text-muted-foreground">Beheer accounts: rol, status en schorsing.</p>
      </header>

      {(deletionRequests > 0 || pendingUsers > 0) && (
        <div className="flex flex-wrap gap-2">
          {deletionRequests > 0 && (
            <Link
              href="/admin/gebruikers?deletion=1"
              className="inline-flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm text-danger focus-ring"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {deletionRequests} AVG-verwijderverzoek(en) — beoordeel
            </Link>
          )}
          {pendingUsers > 0 && (
            <Link
              href="/admin/gebruikers?status=PENDING"
              className="inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm text-warning focus-ring"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {pendingUsers} in afwachting — activeer
            </Link>
          )}
        </div>
      )}

      <form method="get" className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Zoek op naam of e-mail…" aria-label="Zoeken" />
        <Select name="role" defaultValue={role} aria-label="Rol">
          <option value="">Alle rollen</option>
          <option value="FREELANCER">ZZP&apos;er</option>
          <option value="CLIENT">Opdrachtgever</option>
          <option value="ADMIN">Beheerder</option>
        </Select>
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">Alle statussen</option>
          <option value="ACTIVE">Actief</option>
          <option value="SUSPENDED">Geschorst</option>
          <option value="PENDING">In afwachting</option>
        </Select>
        <Button type="submit" variant="secondary">Filteren</Button>
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
            const target = toggleSuspension(u.status as UserStatus);
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    {isSelf && <span className="text-xs text-muted-foreground">(jij)</span>}
                    <Badge variant="muted">{ROLE_LABEL[u.role as UserRole]}</Badge>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    {u.deletionRequestedAt && <Badge variant="danger">Verwijderverzoek</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                {!isSelf && (
                  <form action={setUserStatus.bind(null, u.id, target)}>
                    <Button type="submit" variant={target === "SUSPENDED" ? "danger" : "secondary"} size="sm">
                      {target === "SUSPENDED" ? "Schorsen" : "Activeren"}
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
