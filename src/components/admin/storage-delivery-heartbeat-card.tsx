import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageDeliveryStatusItem } from "@/lib/observability/storage-delivery-freshness";
import type { StorageDeliveryFreshness } from "@/lib/observability/storage-delivery-freshness";
import type { StatusLevel } from "@/lib/system-status";

// Presentationele weergave van de opslag-aflever-heartbeat (dead-man's-switch): opereert het
// object-opslagkanaal nog, of wijst een systematisch falende backend élke document-operatie stil af?
// Server-component, geen client-state. Admin-only scherm (de pagina dwingt requireRole("ADMIN") af).
// Hergebruikt dezelfde badge-taal als het systeemstatus-paneel en de mail-/push-heartbeat-kaarten.

const LEVEL_BADGE: Record<
  StatusLevel,
  { variant: "success" | "warning" | "muted"; label: string }
> = {
  ok: { variant: "success", label: "Actueel" },
  fallback: { variant: "muted", label: "Fallback" },
  attention: { variant: "warning", label: "Aandacht" },
};

export function StorageDeliveryHeartbeatCard({
  freshness,
}: {
  freshness: StorageDeliveryFreshness;
}) {
  const item = storageDeliveryStatusItem(freshness);
  const badge = LEVEL_BADGE[item.level];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Object-opslag</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-start gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {item.mode}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
          </div>
          <Badge variant={badge.variant} className="shrink-0">
            {badge.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
