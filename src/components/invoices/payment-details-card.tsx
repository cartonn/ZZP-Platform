"use client";

import { useState } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface PaymentDetailsCardProps {
  ibanFormatted: string;
  accountName: string;
  paymentReference: string;
  amountFormatted: string;
  dueDateFormatted: string | null;
  /** True voor de opdrachtgever (debiteur): tekst spoort aan tot betalen. */
  isPayer: boolean;
}

/**
 * Betaalinstructie op het factuurdetail. Betaling verloopt rechtstreeks (off-platform); dit blok
 * geeft de opdrachtgever de gestructureerde gegevens om correct + op tijd te betalen (met een
 * kopieerbaar betaalkenmerk). De crediteur ziet exact hetzelfde blok.
 */
export function PaymentDetailsCard({
  ibanFormatted,
  accountName,
  paymentReference,
  amountFormatted,
  dueDateFormatted,
  isPayer,
}: PaymentDetailsCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(field: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied((c) => (c === field ? null : c)), 2500);
    } catch {
      // Klembord niet beschikbaar (bijv. onveilige context) — stil falen.
    }
  }

  const rows: { key: string; label: string; value: string; copyValue: string }[] = [
    {
      key: "iban",
      label: "IBAN",
      value: ibanFormatted,
      copyValue: ibanFormatted.replace(/\s/g, ""),
    },
    { key: "name", label: "T.n.v.", value: accountName, copyValue: accountName },
    {
      key: "ref",
      label: "Betaalkenmerk",
      value: paymentReference,
      copyValue: paymentReference,
    },
    { key: "amount", label: "Bedrag", value: amountFormatted, copyValue: amountFormatted },
  ];

  return (
    <Card className="print-hide">
      <CardContent className="space-y-3 py-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Landmark className="size-4 text-muted-foreground" aria-hidden />
          Betaalgegevens
        </p>
        <p className="text-xs text-muted-foreground">
          {isPayer
            ? "Maak het bedrag rechtstreeks over met onderstaand betaalkenmerk. Zo wordt je betaling correct verwerkt."
            : "De opdrachtgever betaalt rechtstreeks op deze gegevens; vermeld het betaalkenmerk voor een vlotte verwerking."}
        </p>
        <dl className="divide-y divide-border/60 rounded-md border border-border">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm tabular-nums text-foreground">{r.value}</span>
                <button
                  type="button"
                  onClick={() => copy(r.key, r.copyValue)}
                  aria-label={`Kopieer ${r.label.toLowerCase()}`}
                  className="focus-ring inline-flex shrink-0 items-center rounded-md border border-border p-1 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground"
                >
                  {copied === r.key ? (
                    <Check className="size-3.5 text-success" aria-hidden />
                  ) : (
                    <Copy className="size-3.5" aria-hidden />
                  )}
                </button>
              </dd>
            </div>
          ))}
          {dueDateFormatted && (
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Uiterlijk betalen</dt>
              <dd className="text-sm tabular-nums text-foreground">{dueDateFormatted}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
