import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { passwordBreachDeliveryStatusItem } from "@/lib/observability/password-breach-delivery-freshness";
import type { PasswordBreachDeliveryFreshness } from "@/lib/observability/password-breach-delivery-freshness";
import type { StatusLevel } from "@/lib/system-status";

// Presentationele weergave van de gelekt-wachtwoord-controle-aflever-heartbeat (dead-man's-switch):
// accepteert de externe HIBP-controle (PASSWORD_BREACH_CHECK=hibp) onze range-verzoeken nog, of zet een
// systematisch falende controle — die de check fail-open door laat gaan — de credential-stuffing-
// bescherming stil uit op registratie/wachtwoordherstel/wijzigen? Server-component, geen client-state.
// Admin-only scherm (de pagina dwingt requireRole("ADMIN") af). Hergebruikt dezelfde badge-taal als het
// systeemstatus-paneel en de overige heartbeat-kaarten.

const LEVEL_BADGE: Record<
  StatusLevel,
  { variant: "success" | "warning" | "muted"; label: string }
> = {
  ok: { variant: "success", label: "Actueel" },
  fallback: { variant: "muted", label: "Fallback" },
  attention: { variant: "warning", label: "Aandacht" },
};

export function PasswordBreachDeliveryHeartbeatCard({
  freshness,
}: {
  freshness: PasswordBreachDeliveryFreshness;
}) {
  const item = passwordBreachDeliveryStatusItem(freshness);
  const badge = LEVEL_BADGE[item.level];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gelekt-wachtwoord-controle</CardTitle>
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
