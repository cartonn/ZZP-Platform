import Link from "next/link";
import { Bell } from "lucide-react";
import { type Session } from "next-auth";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { navForRole, ROLE_LABEL } from "@/lib/nav";
import { navBadges } from "@/lib/signals";
import { prisma } from "@/lib/db";
import { type UserRole } from "@/lib/enums";

export async function AppShell({
  user,
  children,
}: {
  user: NonNullable<Session["user"]>;
  children: React.ReactNode;
}) {
  const role = user.role as UserRole;
  const [unread, badges] = await Promise.all([
    user.id
      ? prisma.notification.count({ where: { userId: user.id, readAt: null } })
      : Promise.resolve(0),
    user.id ? navBadges(role, user.id) : Promise.resolve({}),
  ]);
  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid min-h-screen grid-cols-[16rem_1fr] max-md:grid-cols-1">
      <aside className="hidden flex-col border-r border-border bg-muted/30 md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            Z
          </div>
          <span className="text-sm font-semibold">ZZP Platform</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={navForRole(role)} badges={badges} />
        </div>
        <div className="border-t border-border p-3">
          <Link href="/account" className="flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted focus-ring" aria-label="Account & privacy">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
            </div>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-2"
          >
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Uitloggen
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav items={navForRole(role)} badges={badges} />
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              Z
            </div>
            <span className="text-sm font-semibold">ZZP Platform</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/notificaties"
              aria-label={`Notificaties${unread > 0 ? ` (${unread} ongelezen)` : ""}`}
              className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-ring"
            >
              <Bell className="size-5" aria-hidden />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-4 text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              {ROLE_LABEL[role]}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
