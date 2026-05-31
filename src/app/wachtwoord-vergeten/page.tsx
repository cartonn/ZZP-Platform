import { type Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Wachtwoord vergeten · ZZP Platform" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            Z
          </div>
          <span className="text-base font-semibold">ZZP Platform</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">Wachtwoord vergeten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vul je e-mailadres in. Als er een account mee is gekoppeld, ontvang je een link om je
            wachtwoord te herstellen.
          </p>
          <div className="mt-5">
            <ForgotPasswordForm />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Terug naar inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
