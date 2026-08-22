import { type Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  Handshake,
  Receipt,
  Banknote,
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  Workflow,
  Lightbulb,
  MessageSquare,
  Inbox,
  UserCog,
} from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import {
  notificationMeta,
  type NotificationCategory,
  type NotificationTone,
} from "@/lib/notifications";
import {
  filterNotifications,
  notificationFilterParams,
  parseNotificationFilter,
  summarizeNotifications,
  unreadInScope,
  type NotificationFilter,
} from "@/lib/notification-filter";
import { missedWhileAway } from "@/lib/missed-notifications";
import { pendingTaskCount } from "@/lib/actions/pending-tasks";
import { plural } from "@/lib/plural";
import { markAllNotificationsRead, markNotificationRead, openNotification } from "./actions";
import { formatDateShortNl } from "@/lib/format-date";
import { relativeTime } from "@/lib/relative-time";
import { getTranslator, type Translator } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Notificaties · Handslag" };

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  workflow: Workflow,
  invoice: Receipt,
  payment: Banknote,
  dba: ShieldAlert,
  dispute: AlertTriangle,
  credential: FileCheck,
  collaboration: Handshake,
  application: Inbox,
  messages: MessageSquare,
  idea: Lightbulb,
  account: UserCog,
  system: Bell,
};

const TONE_CLASS: Record<NotificationTone, string> = {
  attention: "text-primary",
  info: "text-muted-foreground",
  success: "text-success",
};

type NotificationItem = Awaited<ReturnType<typeof prisma.notification.findMany>>[number];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function NotificationRow({ n, t }: { n: NotificationItem; t: Translator }) {
  const unread = !n.readAt;
  const meta = notificationMeta(n.type);
  const Icon = CATEGORY_ICON[meta.category];
  const content = (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          unread ? "bg-primary" : "bg-transparent",
        )}
        aria-hidden
      />
      <Icon className={cn("mt-0.5 size-4 shrink-0", TONE_CLASS[meta.tone])} aria-hidden />
      <div className="min-w-0 flex-1">
        {unread && <span className="sr-only">{t("Ongelezen: ")}</span>}
        <p className={cn("text-sm", unread ? "font-medium" : "")}>{n.title}</p>
        {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
        <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(n.createdAt, t)}</p>
      </div>
    </div>
  );
  // De klikbare inhoud en de "Gelezen"-knop staan náást elkaar (sibling-forms), nooit genest — een
  // knop/form in een <a> is ongeldige HTML en de klik botste met de navigatie. Klikken op een rij met
  // bestemming markeert nu als gelezen én navigeert (openNotification); de losse knop markeert zonder
  // weg te navigeren.
  return (
    <div className={cn("flex items-start gap-2 px-4 py-3", unread && "bg-muted/30")}>
      {n.link ? (
        <form action={openNotification.bind(null, n.id)} className="min-w-0 flex-1">
          <button type="submit" className="focus-ring block w-full text-left hover:opacity-80">
            {content}
          </button>
        </form>
      ) : (
        <div className="min-w-0 flex-1">{content}</div>
      )}
      {unread && (
        <form action={markNotificationRead.bind(null, n.id)} className="shrink-0">
          <Button type="submit" variant="ghost" size="sm">
            {t("Gelezen")}
          </Button>
        </form>
      )}
    </div>
  );
}

function NotificationGroup({
  heading,
  items,
  t,
}: {
  heading: string;
  items: NotificationItem[];
  t: Translator;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {heading}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {items.map((n) => (
          <NotificationRow key={n.id} n={n} t={t} />
        ))}
      </div>
    </section>
  );
}

function filterHref(filter: NotificationFilter): string {
  const qs = new URLSearchParams(notificationFilterParams(filter)).toString();
  return qs ? `/notificaties?${qs}` : "/notificaties";
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
        active
          ? "border-accent-foreground/20 bg-accent text-accent-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

export default async function NotificatiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const { t } = await getTranslator();
  const filter = parseNotificationFilter(await searchParams);
  const [notifications, me, actionCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findUnique({
      where: { id: actor.id },
      select: { previousLoginAt: true, lastLoginAt: true },
    }),
    // Openstaande acties = exact wat /acties toont (dezelfde helper die de sidebar-badge voedt).
    // Meldingen (deze pagina) en acties zijn semantisch verschillend; de doorklik hieronder scheidt ze.
    pendingTaskCount(actor.id, actor.role),
  ]);
  const hasUnread = notifications.some((n) => !n.readAt);
  // "Terwijl je weg was" — ongelezen meldingen die tussen de vorige en de huidige login
  // binnenkwamen. Verbergt zichzelf zonder vorige login of zonder gemiste meldingen.
  const missed = missedWhileAway({
    previousLoginAt: me?.previousLoginAt ?? null,
    lastLoginAt: me?.lastLoginAt ?? null,
    notifications,
  });

  // Filter server-side op de al opgehaalde set; de tellingen blijven over álle meldingen.
  const summary = summarizeNotifications(notifications);
  const filtered = filterNotifications(notifications, filter);
  const scopeUnread = unreadInScope(summary, filter);
  const filterActive = filter.category !== null || filter.unreadOnly;

  const now = new Date();
  const today = filtered.filter((n) => isSameDay(n.createdAt, now));
  const earlier = filtered.filter((n) => !isSameDay(n.createdAt, now));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De werklijst · meldingen"
        title="Notificaties"
        description="Updates over je certificaten, reacties en berichten."
        action={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="secondary" size="sm">
                {t("Alles als gelezen markeren")}
              </Button>
            </form>
          ) : undefined
        }
      />

      {/* Meldingen ≠ acties: deze pagina toont de gelezen/ongelezen historie; wat nú van je gevraagd
          wordt staat op /acties. Een rustige doorklik scheidt de twee tellers expliciet. */}
      {actionCount > 0 && (
        <Link
          href="/acties"
          className="focus-ring -mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {plural(actionCount, t("actie wacht op je"), t("acties wachten op je"))} —{" "}
          {t("naar Acties")}
        </Link>
      )}

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title={t("Geen notificaties")}
            description={t("Je hebt op dit moment geen nieuwe meldingen.")}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {missed && !filterActive && (
            <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
              <Bell className="size-4 shrink-0" aria-hidden />
              <span>
                {t("Terwijl je weg was:")}{" "}
                <span className="font-medium text-foreground">
                  {plural(missed.count, t("ongelezen melding"), t("ongelezen meldingen"))}
                </span>{" "}
                {t("sinds je vorige bezoek op")} {formatDateShortNl(missed.from)}.
              </span>
            </p>
          )}

          {/* Filter op categorie + alleen-ongelezen — server-side via de URL (deelbaar/herlaadbaar). */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <FilterPill
                href={filterHref({ category: null, unreadOnly: filter.unreadOnly })}
                active={filter.category === null}
              >
                {t("Alle")} ({summary.total})
              </FilterPill>
              {summary.categories.map((c) => (
                <FilterPill
                  key={c.category}
                  href={filterHref({ category: c.category, unreadOnly: filter.unreadOnly })}
                  active={filter.category === c.category}
                >
                  {t(c.label)} ({c.total})
                </FilterPill>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterPill
                href={filterHref({ category: filter.category, unreadOnly: false })}
                active={!filter.unreadOnly}
              >
                {t("Alle meldingen")}
              </FilterPill>
              <FilterPill
                href={filterHref({ category: filter.category, unreadOnly: true })}
                active={filter.unreadOnly}
              >
                {t("Alleen ongelezen")} ({scopeUnread})
              </FilterPill>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t("Geen meldingen in deze selectie.")}
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <NotificationGroup heading={t("Vandaag")} items={today} t={t} />
              <NotificationGroup heading={t("Eerder")} items={earlier} t={t} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
