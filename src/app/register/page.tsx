import { BrandMark } from "@/components/ui/brand-mark";
import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPublicTrustStats } from "@/lib/public-trust";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Registreren · Handslag" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  const trustStats = await getPublicTrustStats();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <BrandMark size={32} />
          <span className="font-display text-base font-semibold">Handslag</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="font-display text-xl font-semibold tracking-tight">Account aanmaken</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maak een account om opdrachten te plaatsen of erop te reageren.
          </p>
          <div className="mt-5">
            <RegisterForm />
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Al een account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Inloggen
          </Link>
        </p>

        <TrustStrip stats={trustStats} />
      </div>
    </div>
  );
}
