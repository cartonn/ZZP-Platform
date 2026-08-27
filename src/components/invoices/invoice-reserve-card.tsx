import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatEuro } from "@/lib/invoices";
import { TAX_DISCLAIMER } from "@/lib/tax/config";
import { type InvoiceReserveHint } from "@/lib/tax/invoice-reserve";

export interface InvoiceReserveCardProps {
  hint: InvoiceReserveHint;
}

/**
 * Reserveringshint op het factuurdetail (ZZP'er): hoeveel van déze factuur opzij te zetten voor de
 * belasting. Btw apart (int je namens de Belastingdienst) + een conservatieve vuistregel voor
 * IB+Zvw over de netto-omzet. Alleen tonen, nooit beslissen — er loopt geen geldstroom via het
 * platform. Voor het precieze, persoonlijke beeld verwijst de kaart naar /ontzorgd. De parent
 * beslist of de kaart hoort (`shouldShowInvoiceReserve`).
 */
export function InvoiceReserveCard({ hint }: InvoiceReserveCardProps) {
  const ratePct = Math.round(hint.incomeRateBps / 100);
  return (
    <Card className="print-hide">
      <CardContent className="space-y-3 py-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <PiggyBank className="size-4 text-muted-foreground" aria-hidden />
          Opzij zetten van deze factuur
        </p>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Btw (apart houden voor de aangifte)</dt>
            <dd className="tabular-nums">{formatEuro(hint.vatReserveCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Inkomstenbelasting <span className="text-xs">(vuistregel {ratePct}%)</span>
            </dt>
            <dd className="tabular-nums">± {formatEuro(hint.incomeReserveCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <dt>Totaal opzij</dt>
            <dd className="tabular-nums">± {formatEuro(hint.totalReserveCents)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Een bewust ruime vuistregel over de netto-omzet; je werkelijke kosten verlagen de heffing.
          Bekijk je precieze stand op{" "}
          <Link href="/ontzorgd" className="font-medium underline underline-offset-4">
            Ontzorgd
          </Link>
          . {TAX_DISCLAIMER}
        </p>
      </CardContent>
    </Card>
  );
}
