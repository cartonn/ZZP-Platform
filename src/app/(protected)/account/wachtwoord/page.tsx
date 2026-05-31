import { ShieldCheck } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Wachtwoord wijzigen" };

export default async function ChangePasswordPage() {
  const actor = await requireActor();
  const forced = actor.mustChangePassword;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Wachtwoord wijzigen</h1>
        <p className="text-sm text-muted-foreground">
          Kies een eigen, sterk wachtwoord voor je account.
        </p>
      </header>

      {forced && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Je account is met een tijdelijk wachtwoord aangemaakt. Stel nu je eigen wachtwoord in om
            verder te gaan.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nieuw wachtwoord</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
