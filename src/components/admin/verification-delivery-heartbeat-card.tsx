import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  verificationDeliveryStatusItem,
  type VerificationAdapterFreshness,
  type VerificationDeliveryAggregate,
} from "@/lib/observability/verification-delivery-freshness";
import type { StatusLevel } from "@/lib/system-status";

// Presentationele weergave van de verificatie-aflever-heartbeat (dead-man's-switch): antwoorden de
// externe registers (DUO/BIG/iDIN) nog, of wijst een systematisch falende backend élke verificatie stil
// af? Server-component, geen client-state. Admin-only scherm (de pagina dwingt requireRole("ADMIN") af).
// Hergebruikt dezelfde badge-taal als het systeemstatus-paneel en de overige heartbeat-kaarten.

const LEVEL_BADGE: Record<
  StatusLevel,
  { variant: "success" | "warning" | "muted"; label: string }
> = {
  ok: { variant: "success", label: "Actueel" },
  fallback: { variant: "muted", label: "Fallback" },
  attention: { variant: "warning", label: "Aandacht" },
};

const PER_ADAPTER_LABEL: Record<VerificationAdapterFreshness["freshness"]["status"], string> = {
  never: "nog geen operatie",
  ok: "operationeel",
  failing: "wijst af",
};

export function VerificationDeliveryHeartbeatCard({
  overview,
}: {
  overview: { adapters: VerificationAdapterFreshness[]; aggregate: VerificationDeliveryAggregate };
}) {
  const item = verificationDeliveryStatusItem(overview.aggregate);
  const badge = LEVEL_BADGE[item.level];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificatie-registers</CardTitle>
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
            <ul className="mt-2 space-y-0.5">
              {overview.adapters.map((adapter) => (
                <li
                  key={adapter.key}
                  className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                >
                  <span>{adapter.label}</span>
                  <span
                    className={
                      adapter.freshness.status === "failing"
                        ? "font-medium text-warning"
                        : "font-mono"
                    }
                  >
                    {PER_ADAPTER_LABEL[adapter.freshness.status]}
                    {adapter.freshness.status === "failing" &&
                    adapter.freshness.consecutiveFailures > 0
                      ? ` (${adapter.freshness.consecutiveFailures}×)`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Badge variant={badge.variant} className="shrink-0">
            {badge.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
