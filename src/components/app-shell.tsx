import Link from "next/link";
import { headers, cookies } from "next/headers";
import { Bell, LogOut, Plus } from "lucide-react";
import { type Session } from "next-auth";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarRail } from "@/components/sidebar-rail";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { SIDEBAR_COOKIE, parseSidebarState } from "@/lib/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SkipLink } from "@/components/ui/skip-link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { CommandPalette } from "@/components/search/command-palette";
import { navForRole, ROLE_LABEL } from "@/lib/nav";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getTranslator } from "@/lib/i18n/server";
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
  const [unread, rawBadges, actionCount, branding, { locale, t }] = await Promise.all([
    user.id
      ? prisma.notification.count({ where: { userId: user.id, readAt: null } })
      : Promise.resolve(0),
    user.id ? navBadges(role, user.id) : Promise.resolve({}),
    user.id ? pendingTaskCount(user.id, role) : Promise.resolve(0),
    user.id ? getTenantBranding(user.id) : Promise.resolve(null),
    getTranslator(),
  ]);
  // Navigatie + sectiekoppen vertaald op het render-moment (nav.ts blijft ongemoeid); de client-nav
  // krijgt al-vertaalde labels en blijft taal-onbewust.
  const navItems = navForRole(role).map((item) => ({
    ...item,
    label: t(item.label),
    section: item.section ? t(item.section) : item.section,
  }));
  // De /acties-badge telt exact de openstaande taken (zoals de pagina ze toont).
  const badges = withActionCenterBadge(rawBadges, actionCount);
  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Vervaag-bij-ingeklapt: tekst verschijnt zodra de rail is uitgeklapt (`data-expanded` op de `group`).
  const fadeText =
    "opacity-0 transition-opacity duration-150 group-data-[expanded=true]:opacity-100";

  // Elke pagina vult de breedte; de symmetrische main-padding geeft een kleine, gelijke marge
  // tegen beide schermranden (geen max-w-klem, dus geen grote lege banen op brede schermen). De
  // werkruimte (#19, /dashboard) is "flush": volle hoogte met eigen scroll per kolom, zelfde marges.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const flush = pathname === "/dashboard";

  // Zijbalk-voorkeur (uitgeklapt = labels zichtbaar). Server-side gelezen zodat de eerste render
  // meteen de juiste breedte zet (geen flits). Uitgeklapt duwt de inhoud (pl-64); ingeklapt houdt
  // de smalle icoon-rail (pl-16) die op hover tijdelijk uitklapt over de inhoud.
  const sidebarState = parseSidebarState((await cookies()).get(SIDEBAR_COOKIE)?.value);
  const sidebarExpanded = sidebarState === "expanded";

  // Primaire actie in de bovenbalk (één strip met zoeken + bel + actie, gelijke hoogte — #19).
  // Rolspecifiek en alleen op de werkruimte; elders geen actieknop in de balk.
  const DASH_ACTION: Partial<Record<UserRole, { label: string; href: string }>> = {
    CLIENT: { label: "Nieuwe opdracht", href: "/opdrachten/nieuw" },
    FREELANCER: { label: "Opdrachten zoeken", href: "/opdrachten" },
    FRANCHISER: { label: "Dienst uitzetten", href: "/franchise/opdrachtgevers" },
  };
  const topAction = flush ? DASH_ACTION[role] : undefined;

  return (
    <div className={cn("relative min-h-screen", sidebarExpanded ? "md:pl-64" : "md:pl-16")}>
      {/* Skip-link: eerste focusbare element, springt naar de hoofdinhoud (toetsenbord/screenreader). */}
      <SkipLink />
      {/* Vakwerk-shell: de zijbalk staat standaard uitgeklapt (16rem) met zichtbare labels +
          sectiekoppen en duwt de inhoud opzij. De gebruiker kan inklappen naar een smalle icoon-rail
          (4rem) die bij hover/focus tijdelijk uitklapt over de inhoud en weer inklapt bij muis-weg,
          focusverlies én na navigatie (SidebarRail). De keuze wordt onthouden (cookie). Op mobiel
          verborgen; daar regelt de header-hamburger de navigatie. */}
      <SidebarRail initialState={sidebarState}>
        <div className="flex h-full w-64 flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-border px-4">
            <Brand branding={branding} collapsible />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav items={navItems} badges={badges} collapsible />
          </div>
          <div className="border-t border-border p-3">
            <SidebarToggle state={sidebarState} />
            <Link
              href="/account"
              className="focus-ring flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted"
              aria-label={t("Account & privacy")}
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${avatarAccent(user.name ?? user.email)}`}
              >
                {initials}
              </div>
              <div className={cn("min-w-0 flex-1", fadeText)}>
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t(ROLE_LABEL[role])}</p>
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
                className="w-9 justify-center gap-2 overflow-hidden px-0 transition-all group-data-[expanded=true]:w-full group-data-[expanded=true]:justify-start group-data-[expanded=true]:px-3"
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                <span className={fadeText}>{t("Uitloggen")}</span>
              </Button>
            </form>
          </div>
        </div>
      </SidebarRail>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav items={navItems} badges={badges} />
            <Brand branding={branding} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle current={locale} label={t("Taal")} />
            <SearchTrigger label={t("Zoeken…")} ariaLabel={t("Snelzoeker openen (Ctrl K)")} />
            <ThemeToggle
              toDarkLabel={t("Schakel naar donkere modus")}
              toLightLabel={t("Schakel naar lichte modus")}
              darkTitle={t("Donkere modus")}
              lightTitle={t("Lichte modus")}
            />
            <Link
              href="/notificaties"
              aria-label={t("Notificaties")}
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
                <span className="hidden sm:inline">{t(topAction.label)}</span>
              </Link>
            )}
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground sm:inline">
              {t(ROLE_LABEL[role])}
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
            // Werkruimte: volle hoogte met eigen scroll per kolom. Vult de breedte; de symmetrische
            // main-padding geeft een kleine, gelijke marge links én rechts (geen eigen breedte-klem).
            <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
          ) : (
            // Inhoud vult de breedte; de symmetrische main-padding (p-4/md:p-6) geeft een kleine,
            // gelijke marge tegen beide schermranden — gecentreerd, geen grote lege banen.
            <div className="w-full">{children}</div>
          )}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
