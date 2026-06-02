import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PaletteSwitcher } from "@/components/ui/palette-switcher";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Inloggen · ZZP Platform" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  const changed = (await searchParams).changed === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            Z
          </div>
          <span className="text-base font-semibold">ZZP Platform</span>
          <div className="ml-auto flex items-center gap-2">
            <PaletteSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">Inloggen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in om verder te gaan naar je dashboard.
          </p>
          {changed && (
            <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.
            </p>
          )}
          <div className="mt-5">
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link
              href="/wachtwoord-vergeten"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Wachtwoord vergeten?
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Nog geen account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Registreren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
