import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type DbaDurationForecast } from "@/lib/dba-duration-forecast";

/**
 * Rustige vooruitblik op een naderende DBA-duurdrempel: waarschuwt vóórdat de samenwerking in
 * verhoogd/hoog risico kruist, zodat er tijdig een evaluatie gepland kan worden. Complementair aan
 * de reactieve "Aandachtspunt inzet"-kaart (die pas verschijnt zodra de drempel al gekruist is).
 * Draagt dezelfde disclaimer — signalering ter informatie, geen juridisch oordeel (Besluit 2).
 */
export function DbaDurationForecastNote({
  forecast,
  disclaimer,
}: {
  forecast: DbaDurationForecast;
  disclaimer: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">Vooruitblik inzetduur</span>
          <Badge variant={forecast.level === "HOOG" ? "warning" : "muted"}>Aankomend</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{forecast.message}</p>
        <p className="text-xs text-muted-foreground">{disclaimer}</p>
      </CardContent>
    </Card>
  );
}
