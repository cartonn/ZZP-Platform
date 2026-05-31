import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Registreren · ZZP Platform" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            Z
          </div>
          <span className="text-base font-semibold">ZZP Platform</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">Account aanmaken</h1>
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
      </div>
    </div>
  );
}
