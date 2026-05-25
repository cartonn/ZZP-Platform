"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  FileCheck2,
  Files,
  LayoutDashboard,
  MessagesSquare,
  Receipt,
  ShieldCheck,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type NavIcon, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  briefcase: Briefcase,
  users: Users,
  fileCheck: FileCheck2,
  files: Files,
  messages: MessagesSquare,
  receipt: Receipt,
  shield: ShieldCheck,
  user: User,
  building: Building2,
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Hoofdnavigatie">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        if (!item.enabled) {
          return (
            <span
              key={item.href}
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
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-ring",
              isActive
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
