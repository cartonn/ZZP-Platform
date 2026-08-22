import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { plural } from "@/lib/plural";

export interface PaymentForecastCardProps {
  /** Verwachte betaaldatum, kort NL-geformatteerd. */
  expectedAtFormatted: string;
  /** Aantal dagen dat de verwachting na de contractuele vervaldag valt (>0), of null. */
  daysAfterDue: number | null;
}

/**
 * Verwachte-betaaldatum op het factuurdetail (ZZP'er). Antwoord op de #1 cashflow-vraag "wanneer krijg
 * ik mijn geld?": een realistische datum afgeleid uit hoe déze opdrachtgever eerder betaalde, naast de
 * contractuele vervaldag. Alleen tonen, nooit beslissen — de verwachting stuurt geen status of geldstroom.
 * De kaart verschijnt alleen bij een betrouwbare projectie die later valt dan de vervaldag (zie
 * `forecastForOpenInvoice`); de parent rendert hem anders niet.
 */
export function PaymentForecastCard({
  expectedAtFormatted,
  daysAfterDue,
}: PaymentForecastCardProps) {
  return (
    <Card className="print-hide">
      <CardContent className="space-y-1 py-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
          Verwacht betaald rond <span className="tabular-nums">{expectedAtFormatted}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Op basis van hoe deze opdrachtgever je eerder betaalde
          {daysAfterDue != null && daysAfterDue > 0
            ? ` · doorgaans ${plural(daysAfterDue, "dag", "dagen")} na de vervaldag`
            : ""}
          . Een verwachting voor je cashflow, geen toezegging.
        </p>
      </CardContent>
    </Card>
  );
}
