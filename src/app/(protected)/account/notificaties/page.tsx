import { type Metadata } from "next";
import { requireActor } from "@/lib/authz";
import { loadEmailPreferences } from "@/lib/notification-preferences-data";
import { PreferencesForm } from "./preferences-form";
import { PushToggle } from "./push-toggle";

export const metadata: Metadata = { title: "Notificaties · Handslag" };

export default async function NotificatiesPage() {
  const actor = await requireActor();
  const prefs = await loadEmailPreferences(actor.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-primary">
          Account
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Notificatie-voorkeuren
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          In-app meldingen blijven altijd staan. Hier bepaal je welke herinnerings-e-mails je
          ontvangt.
        </p>
      </header>

      <PushToggle />

      <PreferencesForm prefs={prefs} />
    </div>
  );
}
