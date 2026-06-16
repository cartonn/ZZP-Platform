import Link from "next/link";
import { Activity } from "lucide-react";
import { formatDateTimeNl } from "@/lib/format-date";
import { fetchRecentDomainEvents, EVENT_STREAM_LIMIT } from "@/lib/data/event-stream";
import {
  EVENT_CATEGORY_LABELS,
  actorRoleLabel,
  eventCategory,
  eventTypeLabel,
  groupByCorrelation,
  summarizeEventStream,
  type EventCategory,
} from "@/lib/event-stream";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { withParams } from "@/components/admin/base-path";

const CATEGORY_BADGE: Record<EventCategory, "accent" | "warning" | "muted"> = {
  core: "accent",
  side: "warning",
  monitoring: "muted",
};

const CATEGORIES: EventCategory[] = ["core", "side", "monitoring"];

function isCategory(value: string): value is EventCategory {
  return (CATEGORIES as string[]).includes(value);
}

/**
 * Cascade-gebeurtenissen: read-only weergave van de domein-event-stream (de backbone van de
 * facturatiecascade), gegroepeerd per correlatie zodat één keten — contract → urenstaat → factuur
 * → betaling — als geheel leesbaar is. Het categoriefilter komt als prop binnen (de host leest
 * searchParams); de filter-pills wijzen naar `basePath` zodat het paneel zowel standalone als binnen
 * de toezicht-hub werkt. Rendert geen eigen paginakop. ADMIN-only (de route gate't via requireRole).
 */
export async function EventStreamPanel({
  categorie,
  basePath,
}: {
  categorie: string;
  basePath: string;
}) {
  const events = await fetchRecentDomainEvents();
  const summary = summarizeEventStream(events);

  if (events.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Activity}
          title="Nog geen gebeurtenissen"
          description="Zodra er een cascade loopt (contract, urenstaat, factuur, betaling) verschijnen de gebeurtenissen hier."
        />
      </Card>
    );
  }

  const active = isCategory(categorie) ? categorie : undefined;
  const filtered = active ? events.filter((e) => eventCategory(e.type) === active) : events;
  const chains = groupByCorrelation(filtered);

  return (
    <div className="space-y-6">
      {/* Filter-pills per categorie. */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={basePath}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !active
              ? "border-border bg-foreground text-background"
              : "border-border bg-card text-foreground hover:bg-accent"
          }`}
        >
          Alle ({summary.total})
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={active === cat ? basePath : withParams(basePath, { categorie: cat })}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active === cat
                ? "border-border bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            {EVENT_CATEGORY_LABELS[cat]} ({summary.byCategory[cat]})
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {summary.cascades === 1 ? "1 cascade" : `${summary.cascades} cascades`} ·{" "}
        {summary.total === EVENT_STREAM_LIMIT
          ? `recentste ${EVENT_STREAM_LIMIT} gebeurtenissen`
          : `${summary.total} gebeurtenissen`}
        . Alleen-lezen, op tijd geordend.
      </p>

      {chains.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen gebeurtenissen in deze categorie.</p>
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => {
            const key = chain.correlationId ?? chain.events[0]?.id ?? "";
            return (
              <Card key={key}>
                <CardContent className="space-y-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {chain.correlationId ? (
                        <>
                          Cascade{" "}
                          <span className="font-mono text-xs text-muted-foreground">
                            {chain.correlationId.slice(0, 12)}
                          </span>
                        </>
                      ) : (
                        "Losse gebeurtenis"
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {chain.events.length === 1 ? "1 stap" : `${chain.events.length} stappen`}
                    </span>
                  </div>
                  <ol className="space-y-2 border-l border-border pl-4">
                    {chain.events.map((event) => (
                      <li key={event.id} className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={CATEGORY_BADGE[eventCategory(event.type)]}>
                            {eventTypeLabel(event.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTimeNl(event.occurredAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {actorRoleLabel(event.actorRole)} · {event.subjectType}
                        </p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
