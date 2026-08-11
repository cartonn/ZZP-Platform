"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { type AanmaningData, buildAanmaningLetter } from "@/lib/aanmaning";
import { Card, CardContent } from "@/components/ui/card";

export function AanmaningSection({ data }: { data: AanmaningData }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const letter = buildAanmaningLetter(data);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard not available (e.g. insecure context) — fail silently
    }
  }

  return (
    <Card className="print-hide border-warning/40">
      <CardContent className="py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="focus-ring flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            Aanmaning opstellen
          </span>
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          )}
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Onderstaand sjabloon is vooraf ingevuld met de factuurgegevens. Vul de velden tussen{" "}
              <span className="font-mono text-foreground">[haakjes]</span> aan vóór u verstuurt.
              Betaling verloopt rechtstreeks; het platform verstuurt geen brieven.
            </p>

            {data.hasCharges && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                <p className="font-medium text-foreground">Wat u wettelijk mag claimen</p>
                <dl className="mt-2 space-y-1 text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <dt>
                      Wettelijke handelsrente{" "}
                      <span className="text-muted-foreground/70">
                        (indicatief {data.interestRatePctFormatted}%/jaar)
                      </span>
                    </dt>
                    <dd className="tabular-nums text-foreground">{data.interestFormatted}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt>Incassokosten (WIK-staffel)</dt>
                    <dd className="tabular-nums text-foreground">
                      {data.collectionCostsFormatted}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-1 font-medium">
                    <dt className="text-foreground">Totaal verschuldigd</dt>
                    <dd className="tabular-nums text-foreground">
                      {data.totalWithChargesFormatted}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-muted-foreground/80">
                  Indicatie. De handelsrente wijzigt per halfjaar — controleer de actuele rente vóór
                  u deze bedragen definitief in rekening brengt.
                </p>
              </div>
            )}

            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
              {letter}
            </pre>

            <button
              type="button"
              onClick={handleCopy}
              className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-success" aria-hidden />
                  Gekopieerd!
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden />
                  Kopieer naar klembord
                </>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
