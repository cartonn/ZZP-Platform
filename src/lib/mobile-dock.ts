import type { NavItem } from "./nav";

/** Keep the role's own workflow order; never invent access to another role's route. */
export function mobileDockItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => item.enabled && !item.overflow).slice(0, 4);
}
