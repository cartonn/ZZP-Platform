// Pure filter-/tellogica voor de notificatielijst (/notificaties). Server-side waarheid: de pagina
// leest de filter uit de URL-searchParams en filtert de al opgehaalde meldingen — geen client-state,
// deterministisch en los van het Prisma-model getest.

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABEL,
  notificationMeta,
  type NotificationCategory,
} from "@/lib/notifications";

/** Minimale vorm die de filter nodig heeft — los van het Prisma-model zodat de helper puur blijft. */
export interface FilterableNotification {
  type: string;
  readAt: Date | null;
}

export interface NotificationFilter {
  category: NotificationCategory | null;
  unreadOnly: boolean;
}

const STATUS_UNREAD = "ongelezen";

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

function isCategory(v: string): v is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(v);
}

/** Leest de filter uit de ruwe searchParams; onbekende/ongeldige waarden vallen terug op "geen filter". */
export function parseNotificationFilter(
  searchParams: Record<string, string | string[] | undefined>,
): NotificationFilter {
  const cat = first(searchParams.categorie);
  return {
    category: isCategory(cat) ? cat : null,
    unreadOnly: first(searchParams.status) === STATUS_UNREAD,
  };
}

/** Past de filter toe; behoudt de invoervolgorde, muteert de invoer niet. */
export function filterNotifications<T extends FilterableNotification>(
  items: T[],
  filter: NotificationFilter,
): T[] {
  return items.filter((n) => {
    if (filter.unreadOnly && n.readAt) return false;
    if (filter.category && notificationMeta(n.type).category !== filter.category) return false;
    return true;
  });
}

export interface CategoryCount {
  category: NotificationCategory;
  label: string;
  total: number;
  unread: number;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  /** Alleen aanwezige categorieën, in de canonieke NOTIFICATION_CATEGORIES-volgorde. */
  categories: CategoryCount[];
}

/** Telt totaal/ongelezen over alles én per aanwezige categorie. Muteert de invoer niet. */
export function summarizeNotifications(items: FilterableNotification[]): NotificationSummary {
  const byCat = new Map<NotificationCategory, { total: number; unread: number }>();
  let unread = 0;
  for (const n of items) {
    const isUnread = !n.readAt;
    if (isUnread) unread += 1;
    const cat = notificationMeta(n.type).category;
    const entry = byCat.get(cat) ?? { total: 0, unread: 0 };
    entry.total += 1;
    if (isUnread) entry.unread += 1;
    byCat.set(cat, entry);
  }
  const categories: CategoryCount[] = [];
  for (const category of NOTIFICATION_CATEGORIES) {
    const entry = byCat.get(category);
    if (!entry) continue;
    categories.push({
      category,
      label: NOTIFICATION_CATEGORY_LABEL[category],
      total: entry.total,
      unread: entry.unread,
    });
  }
  return { total: items.length, unread, categories };
}

/** Aantal ongelezen binnen de huidige filter-scope (categorie of, zonder categorie, alles). */
export function unreadInScope(summary: NotificationSummary, filter: NotificationFilter): number {
  if (!filter.category) return summary.unread;
  return summary.categories.find((c) => c.category === filter.category)?.unread ?? 0;
}

/** Bouwt de query-params voor een filter-link; standaard-waarden (geen categorie, alles) worden weggelaten. */
export function notificationFilterParams(filter: NotificationFilter): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.category) params.categorie = filter.category;
  if (filter.unreadOnly) params.status = STATUS_UNREAD;
  return params;
}
