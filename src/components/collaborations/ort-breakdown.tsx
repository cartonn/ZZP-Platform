// OrtBreakdown — tabel met de onregelmatigheidstoeslagen per tijdcategorie, berekend
// op basis van de ORT-segmenten van een prestatie. Wordt gerenderd in de werkproces-pagina
// onder elke ureninvoer die segmenten bevat.

import { CheckCircle2 } from "lucide-react";
import { computeOrt, resolveEffectiveOrtRates, type OrtSegment } from "@/lib/ort";
import { ORT_CATEGORY_LABEL, type OrtCategory } from "@/lib/config";
import { formatEuro } from "@/lib/invoices";
import { computeInvoicePreview } from "@/lib/performance-invoice-preview";

interface OrtBreakdownProps {
  ortSegments: OrtSegment[];
  rateCents: number;
  ortProfile?: string | null;
  ortCustomRates?: string | null;
  /** Bij goedkeuring bevroren toeslagen; is deze gezet, dan wint hij van de live samenwerkings-tarieven. */
  ortRatesSnapshot?: string | null;
}

export function OrtBreakdown({
  ortSegments,
  rateCents,
  ortProfile,
  ortCustomRates,
  ortRatesSnapshot,
}: OrtBreakdownProps) {
  const result = computeOrt(
    ortSegments,
    rateCents,
    resolveEffectiveOrtRates({ ortRatesSnapshot, ortProfile, ortCustomRates }),
  );
  if (result.lines.length === 0) return null;
  // Conceptfactuur-uitkomst: dezelfde BTW-berekening als de cascade bij goedkeuring vastlegt,
  // zodat "totaal incl. btw" hier gelijk is aan de latere Invoice.totalCents.
  const preview = computeInvoicePreview(result.subtotalCents);
  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">ORT-uitsplitsing</p>
      <p className="flex items-center gap-1 text-xs text-success">
        <CheckCircle2 className="size-3" aria-hidden />
        Toeslagen automatisch berekend uit de diensttijden — geen handmatige correctie nodig.
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-0.5 font-normal">Categorie</th>
            <th className="py-0.5 text-right font-normal">Uren</th>
            <th className="py-0.5 text-right font-normal">Basis</th>
            <th className="py-0.5 text-right font-normal">Toeslag</th>
            <th className="py-0.5 text-right font-normal">Totaal</th>
          </tr>
        </thead>
        <tbody>
          {result.lines.map((line, i) => (
            <tr key={i} className="border-t border-border/40">
              <td className="py-0.5">
                {line.category === "NORMAL"
                  ? "Regulier"
                  : ORT_CATEGORY_LABEL[line.category as OrtCategory]}
              </td>
              <td className="py-0.5 text-right tabular-nums">{line.hours}</td>
              <td className="py-0.5 text-right tabular-nums">{formatEuro(line.baseCents)}</td>
              <td className="py-0.5 text-right tabular-nums">
                {line.surchargeCents > 0
                  ? `+${formatEuro(line.surchargeCents)} (${Math.round(line.surchargeBps / 100)}%)`
                  : "—"}
              </td>
              <td className="py-0.5 text-right font-medium tabular-nums">
                {formatEuro(line.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td colSpan={4} className="py-0.5 font-medium">
              Subtotaal excl. btw
            </td>
            <td className="py-0.5 text-right font-semibold tabular-nums">
              {formatEuro(result.subtotalCents)}
            </td>
          </tr>
          {preview && (
            <>
              <tr>
                <td colSpan={4} className="py-0.5 text-muted-foreground">
                  Btw ({Math.round(preview.vatRateBps / 100)}%)
                </td>
                <td className="py-0.5 text-right tabular-nums text-muted-foreground">
                  {formatEuro(preview.vatCents)}
                </td>
              </tr>
              <tr className="border-t border-border/40">
                <td colSpan={4} className="py-0.5 font-medium">
                  Totaal incl. btw
                </td>
                <td className="py-0.5 text-right font-semibold tabular-nums">
                  {formatEuro(preview.totalCents)}
                </td>
              </tr>
            </>
          )}
        </tfoot>
      </table>
    </div>
  );
}
