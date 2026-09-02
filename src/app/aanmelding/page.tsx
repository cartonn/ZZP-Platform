import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, ShieldAlert } from "lucide-react";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { logoutRedirect } from "@/lib/security/clear-site-data";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Aanmelding in behandeling · Handslag" };

// Wachtpagina voor een bemiddelaar van wie de aanmelding nog loopt (tenant PENDING) of is afgewezen
// (REJECTED). Bewust BUITEN de (protected)-groep: die layout stuurt zo'n gebruiker juist hierheen,
// en de app-shell zou een werkplek suggereren die er nog niet is. De pagina toont uitsluitend de
// status van de eigen aanmelding — geen platformdata. De status wordt LIVE uit de database gelezen,
// zodat een activatie meteen doorwerkt (geen wachten op een nieuwe sessie).
export default async function AanmeldingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenant: { select: { name: true, status: true, activationNote: true } } },
  });
  const tenant = me?.tenant;

  // Geen tenant, of een tenant die niet (meer) op de poort wacht: hier valt niets te tonen.
  if (!tenant || (tenant.status !== "PENDING" && tenant.status !== "REJECTED")) {
    redirect("/dashboard");
  }

  const rejected = tenant.status === "REJECTED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div
          className={`mx-auto mb-3 flex size-10 items-center justify-center rounded-full ${
            rejected ? "bg-danger/10" : "bg-muted"
          }`}
        >
          {rejected ? (
            <ShieldAlert className="size-5 text-danger" aria-hidden />
          ) : (
            <Clock className="size-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          {rejected ? "Je aanmelding is afgewezen" : "Je aanmelding wordt beoordeeld"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected ? (
            <>
              We hebben de aanmelding van {tenant.name} beoordeeld en kunnen deze niet goedkeuren.
            </>
          ) : (
            <>
              We controleren de aanmelding van {tenant.name}. We nemen binnen 2 werkdagen contact
              met je op; daarna staat je werkplek klaar.
            </>
          )}
        </p>
        {rejected && tenant.activationNote && (
          <p className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-left text-sm">
            <span className="font-medium">Reden: </span>
            {tenant.activationNote}
          </p>
        )}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: logoutRedirect() });
          }}
          className="mt-5"
        >
          <Button type="submit" variant="secondary" className="w-full">
            Uitloggen
          </Button>
        </form>
      </div>
    </div>
  );
}
