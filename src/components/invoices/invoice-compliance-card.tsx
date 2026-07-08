import Link from "next/link";
import { AlertTriangle, Check, CircleCheck, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type InvoiceCompliance } from "@/lib/invoice-legal";

/**
 * Toont de ZZP'er (crediteur) of zijn factuur aan de wettelijke factuureisen voldoet (art. 35a
 * Wet OB). Rustig informatief bij "compleet"; een gerichte, herstelbare melding zodra een verplicht
 * of aanbevolen punt ontbreekt (typisch een ontbrekend btw-id of KvK-nummer op het profiel).
 * Presentationeel — de server berekent `compliance`.
 */
export function InvoiceComplianceCard({ compliance }: { compliance: InvoiceCompliance }) {
  const { level, missing, profileFixNeeded } = compliance;
  const allGood = missing.length === 0;

  return (
    <Card className="print-hide">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-2">
          {level === "complete" ? (
            <CircleCheck className="size-4 text-success" aria-hidden />
          ) : (
            <AlertTriangle className="size-4 text-danger" aria-hidden />
          )}
          <p className="text-sm font-medium">
            {level === "complete"
              ? "Voldoet aan de wettelijke factuureisen"
              : "Deze factuur mist een wettelijk verplicht gegeven"}
          </p>
        </div>

        {allGood ? (
          <p className="text-xs text-muted-foreground">
            Alle verplichte gegevens staan op deze factuur — factuurnummer, datum, opdrachtgever,
            omschrijving, bedragen en jouw btw-identificatienummer.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {level === "incomplete"
                ? "Vul de onderstaande punten aan zodat je factuur rechtsgeldig is; anders kan de opdrachtgever of de Belastingdienst haar weigeren."
                : "De factuur is rechtsgeldig. Deze aanvulling wordt door opdrachtgevers en boekhouders verwacht:"}
            </p>
            <ul className="space-y-1.5">
              {missing.map((r) => (
                <li key={r.key} className="flex items-start gap-2 text-xs">
                  {r.severity === "required" ? (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
                  ) : (
                    <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span>
                    <span className="font-medium text-foreground">{r.label}</span>
                    {r.hint ? <span className="text-muted-foreground"> — {r.hint}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            {profileFixNeeded && (
              <Link
                href="/profiel/bewerken"
                className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
              >
                Vul je factuurgegevens aan op je profiel →
              </Link>
            )}
          </>
        )}

        {/* Rustige, volledige checklist van de al-voldane punten (alleen als er iets ontbreekt). */}
        {!allGood && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Wat staat er al goed op ({compliance.metCount}/{compliance.totalCount})
            </summary>
            <ul className="mt-2 space-y-1">
              {compliance.requirements
                .filter((r) => r.met)
                .map((r) => (
                  <li key={r.key} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-success" aria-hidden />
                    {r.label}
                  </li>
                ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
