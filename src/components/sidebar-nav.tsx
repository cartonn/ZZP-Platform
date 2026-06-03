"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  Files,
  Handshake,
  Inbox,
  LayoutDashboard,
  MessagesSquare,
  Receipt,
  Settings,
  ShieldCheck,
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
  settings: Settings,
};

export function SidebarNav({ items, badges }: { items: NavItem[]; badges?: NavBadges }) {
  const pathname = usePathname();

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
            <span className="truncate">{item.label}</span>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground/40">
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
            <span className="truncate">{item.label}</span>
            {badge && (
              <span
                className={cn(
                  "ml-auto flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums leading-5",
                  badge.tone === "attention"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground",
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
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
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
