"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  Contact,
  GraduationCap,
  CreditCard,
  FileCheck2,
  FileText,
  Files,
  Handshake,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  Receipt,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { type NavIcon, type NavItem } from "@/lib/nav";
import { type NavBadges } from "@/lib/signals";
import { cn } from "@/lib/utils";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  inbox: Inbox,
  briefcase: Briefcase,
  users: Users,
  fileCheck: FileCheck2,
  files: Files,
  messages: MessagesSquare,
  receipt: Receipt,
  fileText: FileText,
  wallet: Wallet,
  shield: ShieldCheck,
  user: User,
  building: Building2,
  handshake: Handshake,
  creditCard: CreditCard,
  calendar: CalendarDays,
  clock: Clock,
  barChart: BarChart,
  trendingUp: TrendingUp,
  lightbulb: Lightbulb,
  contact: Contact,
  graduationCap: GraduationCap,
  settings: Settings,
  bookmark: Bookmark,
  activity: Activity,
};

export function SidebarNav({
  items,
  badges,
  collapsible = false,
}: {
  items: NavItem[];
  badges?: NavBadges;
  /**
   * Inklapbare rail-modus: labels, sectiekoppen en badges vervagen als de rail is ingeklapt en
   * verschijnen bij hover/focus van de rail (de `group`). De iconen blijven altijd zichtbaar.
   * Uit (standaard) in de mobiele lade, waar alles altijd zichtbaar is.
   */
  collapsible?: boolean;
}) {
  const pathname = usePathname();
  // Vervaag-bij-ingeklapt: labels/badges verschijnen zodra de rail is uitgeklapt (`data-expanded`).
  const fade =
    collapsible &&
    "opacity-0 transition-opacity duration-150 group-data-[expanded=true]:opacity-100";

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Hoofdnavigatie">
      {items.map((item, i) => {
        const Icon = ICONS[item.icon];
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const badge = badges?.[item.href];
        // Sectiekop zodra de sectie wisselt — groepeert een lange navigatie in rustige blokken.
        const showHeader = !!item.section && item.section !== items[i - 1]?.section;

        const node = !item.enabled ? (
          <span
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50"
            aria-disabled="true"
            title="Binnenkort beschikbaar"
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className={cn("truncate", fade)}>{item.label}</span>
            <span
              className={cn(
                "ml-auto text-[10px] uppercase tracking-wide text-muted-foreground/40",
                fade,
              )}
            >
              soon
            </span>
          </span>
        ) : (
          <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className={cn("truncate", fade)}>{item.label}</span>
            {badge && (
              <span
                className={cn(
                  "ml-auto flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums leading-5",
                  badge.tone === "attention"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground",
                  fade,
                )}
                aria-label={`${badge.count} ${badge.tone === "attention" ? "vraagt actie" : "open"}`}
              >
                {badge.count > 99 ? "99+" : badge.count}
              </span>
            )}
          </Link>
        );

        return (
          <Fragment key={item.href}>
            {showHeader && (
              <p
                className={cn(
                  "px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60",
                  fade,
                )}
              >
                {item.section}
              </p>
            )}
            {node}
          </Fragment>
        );
      })}
    </nav>
  );
}
