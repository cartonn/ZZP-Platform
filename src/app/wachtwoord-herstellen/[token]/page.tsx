import { BrandMark } from "@/components/ui/brand-mark";
import { type Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Wachtwoord herstellen · Handslag" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <BrandMark size={32} />
          <span className="font-display text-base font-semibold">Handslag</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">Nieuw wachtwoord instellen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kies een sterk wachtwoord van minstens 8 tekens.
          </p>
          <div className="mt-5">
            <ResetPasswordForm token={token} />
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
