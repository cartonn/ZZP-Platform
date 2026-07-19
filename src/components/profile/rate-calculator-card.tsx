"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { requiredHourlyRate } from "@/lib/rate-calculator";
import { TAX_DISCLAIMER, URENCRITERIUM_HOURS } from "@/lib/tax/config";
import { formatEuro } from "@/lib/invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Aantal werkweken per jaar dat we aannemen om declarabele uren/week naar een jaartotaal te
 * schalen. Bewust conservatief (52 − vakantie/feestdagen/ziekte/acquisitie ≈ 46) zodat het
 * benodigde tarief niet te laag uitvalt. Puur presentatie — de rekenmotor werkt op jaartotalen.
 */
const WORK_WEEKS_PER_YEAR = 46;

function parsePositive(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseNonNegative(value: string): number {
  if (value.trim() === "") return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Tarief-rekenhulp: de omgekeerde vraag van de marktband — "wat moet ik per uur vragen om
 * netto € X per maand over te houden?". Volledig client-side en indicatief; de berekening loopt
 * via de gedeelde, pure `requiredHourlyRate` (die dezelfde IB/Zvw-motor hergebruikt als de
 * ontzorg-schermen). Geen server-mutatie: dit is een planningshulp met efemere invoer.
 */
export function RateCalculatorCard({ currentRateEuros }: { currentRateEuros: number | null }) {
  const [netPerMonth, setNetPerMonth] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [costsPerMonth, setCostsPerMonth] = useState("");
  const [starter, setStarter] = useState(false);

  const net = parsePositive(netPerMonth);
  const hours = parsePositive(hoursPerWeek);
  const monthlyCosts = parseNonNegative(costsPerMonth);
  const billableHoursPerYear = hours !== null ? hours * WORK_WEEKS_PER_YEAR : null;

  const result = useMemo(() => {
    if (net === null || billableHoursPerYear === null) return null;
    const r = requiredHourlyRate({
      targetNetAnnualCents: Math.round(net * 12 * 100),
      billableHoursPerYear,
      annualCostsCents: Math.round(monthlyCosts * 12 * 100),
      starter,
    });
    return r.ok ? r : null;
  }, [net, billableHoursPerYear, monthlyCosts, starter]);

  const requiredEuros = result !== null ? Math.round(result.requiredHourlyRateCents / 100) : null;
  const belowTarget =
    result !== null && currentRateEuros !== null && currentRateEuros > 0 && requiredEuros !== null
      ? currentRateEuros < requiredEuros
      : null;

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Calculator className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle>Wat moet ik vragen?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Reken terug van je netto-inkomensdoel naar het uurtarief dat je daarvoor nodig hebt —
          inclusief geschatte inkomstenbelasting, Zvw en ondernemersaftrek.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="rate-calc-net" className="block text-xs font-medium text-foreground">
              Gewenst netto per maand (€)
            </label>
            <Input
              id="rate-calc-net"
              type="number"
              min="0"
              step="100"
              inputMode="numeric"
              value={netPerMonth}
              onChange={(e) => setNetPerMonth(e.target.value)}
              placeholder="bijv. 3000"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rate-calc-hours" className="block text-xs font-medium text-foreground">
              Declarabele uren per week
            </label>
            <Input
              id="rate-calc-hours"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
              placeholder="bijv. 32"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rate-calc-costs" className="block text-xs font-medium text-foreground">
              Zakelijke kosten per maand (€)
            </label>
            <Input
              id="rate-calc-costs"
              type="number"
              min="0"
              step="50"
              inputMode="numeric"
              value={costsPerMonth}
              onChange={(e) => setCostsPerMonth(e.target.value)}
              placeholder="optioneel, bijv. 300"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="focus-ring size-4 rounded border-input"
                checked={starter}
                onChange={(e) => setStarter(e.target.checked)}
              />
              Ik heb recht op startersaftrek
            </label>
          </div>
        </div>

        {result !== null && requiredEuros !== null ? (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Benodigd uurtarief (excl. btw)
              </p>
              <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {formatEuro(result.requiredHourlyRateCents)}/u
              </p>
            </div>

            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="min-w-0 text-muted-foreground">Benodigde omzet per jaar</dt>
                <dd className="shrink-0 font-mono tabular-nums">
                  {formatEuro(result.requiredRevenueCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="min-w-0 text-muted-foreground">Geschatte IB + Zvw</dt>
                <dd className="shrink-0 font-mono tabular-nums">
                  {formatEuro(result.incomeTaxCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="min-w-0 text-muted-foreground">Netto per jaar</dt>
                <dd className="shrink-0 font-mono font-semibold tabular-nums">
                  {formatEuro(result.netAnnualCents)}
                </dd>
              </div>
            </dl>

            {belowTarget !== null && (
              <p
                className={
                  belowTarget
                    ? "text-xs font-medium text-warning"
                    : "text-xs font-medium text-success"
                }
              >
                {belowTarget
                  ? `Je huidige tarief (€ ${currentRateEuros}/u) ligt hieronder — overweeg te verhogen.`
                  : `Je huidige tarief (€ ${currentRateEuros}/u) haalt dit doel.`}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Op basis van {WORK_WEEKS_PER_YEAR} werkweken/jaar
              {result.urencriteriumMet
                ? " en het gehaalde urencriterium (ondernemersaftrek meegerekend)."
                : `. Onder ${URENCRITERIUM_HOURS.toLocaleString("nl-NL")} declarabele uren verwacht je nog geen ondernemersaftrek.`}
            </p>
          </div>
        ) : (
          <p className="border-t border-border pt-3 text-sm text-muted-foreground">
            Vul een netto-doel en je declarabele uren per week in om je benodigde tarief te zien.
          </p>
        )}

        <p className="text-xs text-muted-foreground">{TAX_DISCLAIMER}</p>
      </CardContent>
    </Card>
  );
}
