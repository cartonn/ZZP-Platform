"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarIcon } from "@/components/sidebar-nav";
import { type NavItem } from "@/lib/nav";
import { type NavBadges } from "@/lib/signals";
import { mobileDockItems } from "@/lib/mobile-dock";

/** Thumb-reachable shortcuts reuse the role-authorized navigation and signal snapshot. */
export function MobileDock({ items, badges }: { items: NavItem[]; badges?: NavBadges }) {
  const pathname = usePathname();
  return (
    <nav className="hs-mobile-dock print-hide" aria-label="Snelle navigatie">
      {mobileDockItems(items).map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const badge = badges?.[item.href];
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            <span className="relative">
              <SidebarIcon name={item.icon} />
              {badge && badge.count > 0 && (
                <span
                  className="hs-dock-count"
                  aria-label={`${badge.count} ${badge.tone === "attention" ? "vraagt actie" : "open"}`}
                >
                  {badge.count > 9 ? "9+" : badge.count}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
