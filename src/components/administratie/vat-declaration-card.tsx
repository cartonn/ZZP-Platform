import { ClipboardList } from "lucide-react";
import { formatEuro } from "@/lib/invoices";
import { type VatDeclaration } from "@/lib/administration/vat-declaration";
import { TAX_DISCLAIMER } from "@/lib/tax/config";
import { Card, CardContent } from "@/components/ui/card";

const QUARTER_LABEL = ["1e", "2e", "3e", "4e"] as const;

const DEADLINE_FORMAT = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Kant-en-klaar BTW-aangifteoverzicht voor het in te dienen kwartaal: de bedragen per
 * Belastingdienst-rubriek (1a / 5a / 5b / 5g) zodat de ZZP'er ze rechtstreeks in het BTW-portaal
 * overtikt. Read-only; afgeleid uit het grootboek (server-side waarheid).
 */
export function VatDeclarationCard({
  declaration,
  deadline,
}: {
  declaration: VatDeclaration;
  deadline: Date;
}) {
  const balancePositive = declaration.balanceCents >= 0;

  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <ClipboardList className="size-4" aria-hidden /> BTW-aangifte{" "}
        {QUARTER_LABEL[declaration.quarter - 1]} kwartaal {declaration.year}
      </h2>
      <Card>
        <CardContent className="space-y-3 py-3">
          <p className="text-xs text-muted-foreground">
            Neem deze bedragen over in je aangifte op het portaal van de Belastingdienst. Uiterlijk
            indienen én betalen: {DEADLINE_FORMAT.format(deadline)}.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 font-medium">Rubriek</th>
                <th className="py-2 text-right font-medium">Bedrag</th>
                <th className="py-2 text-right font-medium">Omzetbelasting</th>
              </tr>
            </thead>
            <tbody>
              {declaration.rubrieken.map((r) => (
                <tr key={r.code} className="border-t border-border">
                  <td className="py-2">
                    <span className="font-medium">{r.code}</span>{" "}
                    <span className="text-muted-foreground">{r.label}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.baseCents == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatEuro(r.baseCents)
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatEuro(r.vatCents)}</td>
                </tr>
              ))}
              <tr className="border-t border-border font-medium">
                <td className="py-2">
                  <span className="font-medium">5g</span>{" "}
                  <span className="text-muted-foreground">
                    {balancePositive ? "Te betalen" : "Terug te ontvangen"}
                  </span>
                </td>
                <td className="py-2 text-right text-muted-foreground">—</td>
                <td className="py-2 text-right tabular-nums">
                  {formatEuro(Math.abs(declaration.balanceCents))}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Afgeleid uit je platform-facturen (hoog tarief 21%). Heb je omzet of kosten buiten dit
        platform, tel die er dan zelf bij op. {TAX_DISCLAIMER}
      </p>
    </section>
  );
}
