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
import { markAllNotificationsRead, markNotificationRead } from "./actions";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Notificaties · ZZP Platform" };

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  workflow: Workflow,
  invoice: Receipt,
  payment: Banknote,
  dba: ShieldAlert,
  dispute: AlertTriangle,
  credential: FileCheck,
  collaboration: Handshake,
  idea: Lightbulb,
  system: Bell,
};

const TONE_CLASS: Record<NotificationTone, string> = {
  attention: "text-warning",
  info: "text-muted-foreground",
  success: "text-success",
};

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} uur geleden`;
  return formatDateShortNl(d);
}

type NotificationItem = Awaited<ReturnType<typeof prisma.notification.findMany>>[number];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function NotificationRow({ n }: { n: NotificationItem }) {
  const unread = !n.readAt;
  const meta = notificationMeta(n.type);
  const Icon = CATEGORY_ICON[meta.category];
  const inner = (
    <>
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
          <p className={cn("text-sm", unread ? "font-medium" : "")}>{n.title}</p>
          {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
          <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</p>
        </div>
        {unread && (
          <form action={markNotificationRead.bind(null, n.id)}>
            <Button type="submit" variant="ghost" size="sm">
              Gelezen
            </Button>
          </form>
        )}
      </div>
    </>
  );
  return (
    <div className={cn("px-4 py-3", unread && "bg-muted/30")}>
      {n.link ? (
        <Link href={n.link} className="block hover:opacity-80">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}

function NotificationGroup({ heading, items }: { heading: string; items: NotificationItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {heading}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {items.map((n) => (
          <NotificationRow key={n.id} n={n} />
        ))}
      </div>
    </section>
  );
}

export default async function NotificatiesPage() {
  const actor = await requireActor();
  const notifications = await prisma.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  const now = new Date();
  const today = notifications.filter((n) => isSameDay(n.createdAt, now));
  const earlier = notifications.filter((n) => !isSameDay(n.createdAt, now));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Notificaties"
        description="Updates over je certificaten, reacties en berichten."
        action={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="secondary" size="sm">
                Alles als gelezen markeren
              </Button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="Geen notificaties"
            description="Je hebt op dit moment geen nieuwe meldingen."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <NotificationGroup heading="Vandaag" items={today} />
          <NotificationGroup heading="Eerder" items={earlier} />
        </div>
      )}
    </div>
  );
}
