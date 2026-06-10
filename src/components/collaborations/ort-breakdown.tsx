// OrtBreakdown — tabel met de onregelmatigheidstoeslagen per tijdcategorie, berekend
// op basis van de ORT-segmenten van een prestatie. Wordt gerenderd in de werkproces-pagina
// onder elke ureninvoer die segmenten bevat.

import { CheckCircle2 } from "lucide-react";
import { computeOrt, resolveOrtRates, type OrtSegment } from "@/lib/ort";
import { ORT_CATEGORY_LABEL, type OrtCategory } from "@/lib/config";
import { formatEuro } from "@/lib/invoices";

interface OrtBreakdownProps {
  ortSegments: OrtSegment[];
  rateCents: number;
  ortProfile?: string | null;
  ortCustomRates?: string | null;
}

export function OrtBreakdown({
  ortSegments,
  rateCents,
  ortProfile,
  ortCustomRates,
}: OrtBreakdownProps) {
  const result = computeOrt(
    ortSegments,
    rateCents,
    resolveOrtRates({ ortProfile, ortCustomRates }),
  );
  if (result.lines.length === 0) return null;
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
        </tfoot>
      </table>
    </div>
  );
}
