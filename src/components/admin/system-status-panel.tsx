import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusLevel, SystemStatus } from "@/lib/system-status";

// Presentationele weergave van de systeemstatus (server-component, geen client-state). Toont per
// groep de driver-posture met een status-badge, plus de live databank-bereikbaarheid en de
// boot-waarschuwingen. Admin-only scherm (de pagina dwingt requireRole("ADMIN") af).

const LEVEL_BADGE: Record<
  StatusLevel,
  { variant: "success" | "warning" | "muted"; label: string }
> = {
  ok: { variant: "success", label: "Actief" },
  fallback: { variant: "muted", label: "Fallback" },
  attention: { variant: "warning", label: "Aandacht" },
};

export function SystemStatusPanel({
  status,
  dbReachable,
}: {
  status: SystemStatus;
  dbReachable: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={status.production ? "success" : "muted"}>
          {status.production ? "Productie" : "Ontwikkeling"}
        </Badge>
        <Badge variant={dbReachable ? "success" : "danger"}>
          Database {dbReachable ? "bereikbaar" : "onbereikbaar"}
        </Badge>
        <span className="text-muted-foreground">
          {status.counts.ok} actief · {status.counts.fallback} fallback · {status.counts.attention}{" "}
          aandacht
        </span>
      </div>

      {status.groups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {group.items.map((item) => {
                const badge = LEVEL_BADGE[item.level];
                return (
                  <li key={item.key} className="flex flex-wrap items-start gap-3 px-5 py-3">
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
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Boot-waarschuwingen</CardTitle>
        </CardHeader>
        <CardContent>
          {status.warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {status.production
                ? "Geen waarschuwingen — de productie-configuratie is compleet."
                : "Waarschuwingen worden alleen in productie (NODE_ENV=production) gerapporteerd."}
            </p>
          ) : (
            <ul className="space-y-2">
              {status.warnings.map((warning, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span aria-hidden className="mt-0.5 text-warning">
                    ⚠
                  </span>
                  <span className="text-muted-foreground">{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
