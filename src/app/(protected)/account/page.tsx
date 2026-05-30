import { type Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/nav";
import { type UserRole } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cancelDeletionRequest, requestAccountDeletion } from "./actions";
import { IdentityForm } from "./identity-form";

export const metadata: Metadata = { title: "Account & privacy · ZZP Platform" };

export default async function AccountPage() {
  const actor = await requireActor();
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { email: true, name: true, role: true, createdAt: true, deletionRequestedAt: true, identityVerifiedAt: true, verifiedLegalName: true },
  });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Account & privacy</h1>
        <p className="text-sm text-muted-foreground">Je accountgegevens en je rechten onder de AVG.</p>
      </header>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Naam</p><p>{user.name}</p></div>
          <div><p className="text-xs text-muted-foreground">E-mail</p><p className="truncate">{user.email}</p></div>
          <div><p className="text-xs text-muted-foreground">Rol</p><p>{ROLE_LABEL[user.role as UserRole]}</p></div>
          <div><p className="text-xs text-muted-foreground">Lid sinds</p><p>{user.createdAt.toISOString().slice(0, 10)}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Identiteitsverificatie</h2>
            {user.identityVerifiedAt && <Badge variant="success">Geverifieerd</Badge>}
          </div>
          {user.identityVerifiedAt ? (
            <p className="text-sm text-muted-foreground">
              Geverifieerd op {user.identityVerifiedAt.toISOString().slice(0, 10)}
              {user.verifiedLegalName ? ` · ${user.verifiedLegalName}` : ""}. Dit verhoogt je vertrouwensniveau.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Verifieer je identiteit (iDIN/eIDAS) zodat opdrachtgevers zien dat jij echt de houder van je
                certificaten bent. Verhoogt je vertrouwensniveau.
              </p>
              <IdentityForm />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">Wachtwoord</h2>
              <p className="mt-1 text-sm text-muted-foreground">Wijzig het wachtwoord van je account.</p>
            </div>
            <Link
              href="/account/wachtwoord"
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent focus-ring"
            >
              Wachtwoord wijzigen
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div>
            <h2 className="text-sm font-medium">Inzage (recht op dataportabiliteit)</h2>
            <p className="mt-1 text-sm text-muted-foreground">Download je eigen gegevens als JSON-bestand.</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href="/api/account/export"><Download className="size-3.5" aria-hidden /> Download mijn gegevens</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div>
            <h2 className="text-sm font-medium">Account verwijderen (recht op verwijdering)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Je kunt verwijdering aanvragen. Sommige gegevens (zoals facturen) bewaren we vanwege een
              wettelijke (fiscale) bewaarplicht; beheer handelt je verzoek af en verwijdert of anonimiseert
              de rest. Je kunt het verzoek intrekken zolang het nog niet is uitgevoerd.
            </p>
          </div>
          {user.deletionRequestedAt ? (
            <div className="space-y-2">
              <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
                Verwijdering aangevraagd op {user.deletionRequestedAt.toISOString().slice(0, 10)}. In behandeling bij beheer.
              </p>
              <form action={cancelDeletionRequest}>
                <Button type="submit" variant="secondary" size="sm">Verzoek intrekken</Button>
              </form>
            </div>
          ) : (
            <form action={requestAccountDeletion}>
              <Button type="submit" variant="danger" size="sm">Verwijdering aanvragen</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
