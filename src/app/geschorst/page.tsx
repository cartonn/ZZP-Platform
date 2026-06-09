import { type Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account geschorst · ZZP Platform" };

// Bestemming voor een geschorst account met een nog geldige sessie (zie middleware). Voorkomt de
// doodlopende foutpagina-lus: een duidelijke uitleg + uitlogknop. Geen requireActor hier (currentActor
// geeft voor een geschorst account null terug); we tonen enkel een statische melding.
export default function GeschorstPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-danger/10">
          <ShieldAlert className="size-5 text-danger" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Je account is geschorst</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Je hebt op dit moment geen toegang tot het platform. Neem contact op met de beheerder als
          je denkt dat dit onterecht is.
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
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
