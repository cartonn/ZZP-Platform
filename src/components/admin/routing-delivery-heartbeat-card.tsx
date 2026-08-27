import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routingDeliveryStatusItem } from "@/lib/observability/routing-delivery-freshness";
import type { RoutingDeliveryFreshness } from "@/lib/observability/routing-delivery-freshness";
import type { StatusLevel } from "@/lib/system-status";

// Presentationele weergave van de routing-provider-aflever-heartbeat (dead-man's-switch): levert de
// externe reistijd-routing (Geoapify, ROUTING_PROVIDER=geoapify) nog een geldige lookup, of is de
// provider stil weggevallen (onbereikbaar / weigert het verzoek)? Bij een storing valt élke lookup STIL
// terug op de offline haversine-schatting: match-reistijden worden onnauwkeuriger zonder dat iets dat
// toont. Server-component, geen client-state. Admin-only scherm (de pagina dwingt requireRole("ADMIN")
// af). Hergebruikt dezelfde badge-taal als het systeemstatus-paneel en de overige heartbeat-kaarten.

const LEVEL_BADGE: Record<
  StatusLevel,
  { variant: "success" | "warning" | "muted"; label: string }
> = {
  ok: { variant: "success", label: "Actueel" },
  fallback: { variant: "muted", label: "Fallback" },
  attention: { variant: "warning", label: "Aandacht" },
};

export function RoutingDeliveryHeartbeatCard({
  freshness,
}: {
  freshness: RoutingDeliveryFreshness;
}) {
  const item = routingDeliveryStatusItem(freshness);
  const badge = LEVEL_BADGE[item.level];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routing-provider</CardTitle>
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
