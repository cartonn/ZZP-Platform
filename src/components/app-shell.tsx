import Link from "next/link";
import { headers } from "next/headers";
import { Bell, LogOut, Plus } from "lucide-react";
import { type Session } from "next-auth";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SkipLink } from "@/components/ui/skip-link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { CommandPalette } from "@/components/search/command-palette";
import { navForRole, ROLE_LABEL } from "@/lib/nav";
import { navBadges, withActionCenterBadge } from "@/lib/signals";
import { pendingTaskCount } from "@/lib/actions/pending-tasks";
import { getTenantBranding } from "@/lib/franchise/branding";
import { Brand } from "@/components/franchise/brand";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { avatarAccent } from "@/lib/avatar-accent";
import { type UserRole } from "@/lib/enums";

export async function AppShell({
  user,
  children,
}: {
  user: NonNullable<Session["user"]>;
  children: React.ReactNode;
}) {
  const role = user.role as UserRole;
  const [unread, rawBadges, actionCount, branding] = await Promise.all([
    user.id
      ? prisma.notification.count({ where: { userId: user.id, readAt: null } })
      : Promise.resolve(0),
    user.id ? navBadges(role, user.id) : Promise.resolve({}),
    user.id ? pendingTaskCount(user.id, role) : Promise.resolve(0),
    user.id ? getTenantBranding(user.id) : Promise.resolve(null),
  ]);
  // De /acties-badge telt exact de openstaande taken (zoals de pagina ze toont).
  const badges = withActionCenterBadge(rawBadges, actionCount);
  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Vervaag-bij-ingeklapt: tekst verschijnt bij hover/focus van de rail (de `group`).
  const fadeText =
    "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100";

  // Schermvullende pagina's lopen breed door (geen 6xl-klem); de rest blijft op leesbare breedte.
  // De werkruimte (#19) is bovendien "flush": geen main-padding, zodat de hoofdkolom + contextrail
  // edge-to-edge lopen en de rail tegen de schermrand plakt (volle hoogte, eigen scroll).
  const pathname = (await headers()).get("x-pathname") ?? "";
  // De #19-werkruimte is de dashboardindeling voor álle rollen.
  const flush = pathname === "/dashboard";
  const fullBleed = flush || pathname === "/inzicht" || pathname === "/admin/statistieken";

  // Primaire actie in de bovenbalk (één strip met zoeken + bel + actie, gelijke hoogte — #19).
  // Rolspecifiek en alleen op de werkruimte; elders geen actieknop in de balk.
  const DASH_ACTION: Partial<Record<UserRole, { label: string; href: string }>> = {
    CLIENT: { label: "Nieuwe opdracht", href: "/opdrachten/nieuw" },
    FREELANCER: { label: "Opdrachten zoeken", href: "/opdrachten" },
    FRANCHISER: { label: "Dienst uitzetten", href: "/franchise/opdrachtgevers" },
  };
  const topAction = flush ? DASH_ACTION[role] : undefined;

  return (
    <div className="relative min-h-screen md:pl-16">
      {/* Skip-link: eerste focusbare element, springt naar de hoofdinhoud (toetsenbord/screenreader). */}
      <SkipLink />
      {/* Vakwerk-shell: de zijbalk is een smalle icoon-rail (4rem) die bij hover/focus uitklapt naar
          16rem en over de inhoud zweeft — de inhoud schuift niet mee. Toetsenbord: focus-within klapt
          'm ook uit. Op mobiel verborgen; daar regelt de header-hamburger de navigatie. */}
      <aside className="group fixed inset-y-0 left-0 z-30 hidden w-16 overflow-hidden border-r border-border bg-card transition-[width] duration-200 focus-within:w-64 hover:w-64 md:flex">
        <div className="flex h-full w-64 flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-border px-4">
            <Brand branding={branding} collapsible />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav items={navForRole(role)} badges={badges} collapsible />
          </div>
          <div className="border-t border-border p-3">
            <Link
              href="/account"
              className="focus-ring flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted"
              aria-label="Account & privacy"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${avatarAccent(user.name ?? user.email)}`}
              >
                {initials}
              </div>
              <div className={cn("min-w-0 flex-1", fadeText)}>
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
              </div>
            </Link>
            {/* Ingeklapt: een icoon-knop binnen de rail (klikbaar, behoudt de naam "Uitloggen").
                Uitgeklapt: groeit naar de volle knop met label. */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
              className="mt-2"
            >
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-9 justify-center gap-2 overflow-hidden px-0 transition-all group-focus-within:w-full group-focus-within:justify-start group-focus-within:px-3 group-hover:w-full group-hover:justify-start group-hover:px-3"
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                <span className={fadeText}>Uitloggen</span>
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav items={navForRole(role)} badges={badges} />
            <Brand branding={branding} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <SearchTrigger />
            <ThemeToggle />
            <Link
              href="/notificaties"
              aria-label={`Notificaties${unread > 0 ? ` (${unread} ongelezen)` : ""}`}
              className="focus-ring relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bell className="size-4" aria-hidden />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-4 text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            {topAction && (
              <Link
                href={topAction.href}
                className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" aria-hidden />
                <span className="hidden sm:inline">{topAction.label}</span>
              </Link>
            )}
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground sm:inline">
              {ROLE_LABEL[role]}
            </span>
          </div>
        </header>
        <main
          id="hoofdinhoud"
          tabIndex={-1}
          className={cn(
            "flex-1 outline-none",
            flush ? "flex flex-col overflow-hidden p-4 md:p-6" : "overflow-y-auto p-4 md:p-6",
          )}
        >
          {flush ? (
            // Werkruimte beheert zijn eigen layout (volle hoogte, eigen scroll per kolom).
            children
          ) : (
            // Gecentreerde inhoudskolom — elke pagina krijgt dezelfde breedte/centrering als
            // "Mijn profiel" (max-w-6xl). Pagina's met een eigen smallere max-w blijven smaller.
            <div className={cn("mx-auto w-full", fullBleed ? "max-w-none" : "max-w-6xl")}>
              {children}
            </div>
          )}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
