"use client";

import { useState, useTransition } from "react";
import { CheckCheck, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEuro } from "@/lib/invoices";
import type { BulkApproveGroup } from "@/lib/prestaties-bulk";
import { approveSubmittedPerformancesAction } from "./actions";

type RowState = { pending: boolean; message?: string; tone?: "success" | "danger" };

/**
 * "Snel goedkeuren"-paneel: keurt per samenwerking alle nog-ingediende urenstaten in één klik goed.
 * De knop toont de teller en het somtotaal zodat de opdrachtgever weet hoeveel facturatie hij
 * vrijgeeft. De server-actie is de waarheid (auth→rol→ownership→transitie→audit per prestatie);
 * dit component toont alleen de uitkomst en vertrouwt op revalidate om de lijst te verversen.
 */
export function BulkApprovePanel({ groups }: { groups: BulkApproveGroup[] }) {
  const [state, setState] = useState<Record<string, RowState>>({});
  const [isPending, startTransition] = useTransition();

  function approve(g: BulkApproveGroup) {
    setState((s) => ({ ...s, [g.collaborationId]: { pending: true } }));
    startTransition(async () => {
      const result = await approveSubmittedPerformancesAction(g.collaborationId);
      const message =
        result.failed > 0
          ? `${result.approved} goedgekeurd, ${result.failed} niet gelukt${
              result.error ? ` — ${result.error}` : ""
            }`
          : `${result.approved} ${result.approved === 1 ? "urenstaat" : "urenstaten"} goedgekeurd`;
      setState((s) => ({
        ...s,
        [g.collaborationId]: {
          pending: false,
          message,
          tone: result.failed > 0 ? "danger" : "success",
        },
      }));
    });
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Snel goedkeuren</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Keur in één keer alle ingediende urenstaten van een ZZP&apos;er goed — dat geeft de
          facturatie direct vrij.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {groups.map((g) => {
          const row = state[g.collaborationId];
          const busy = row?.pending && isPending;
          return (
            <li
              key={g.collaborationId}
              className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{g.freelancerName}</span>
                  <span className="truncate text-xs text-muted-foreground">{g.jobTitle}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  <span>
                    {g.count} urenstaten
                    {g.totalCents > 0 && (
                      <span className="ml-1 font-medium text-foreground">
                        · {formatEuro(g.totalCents)}
                      </span>
                    )}
                  </span>
                  {g.hasStale && (
                    <span className="inline-flex items-center gap-1 font-medium text-warning">
                      <TriangleAlert className="size-3" aria-hidden />
                      wacht al lang
                    </span>
                  )}
                  {g.hasAnomaly && (
                    <span className="inline-flex items-center gap-1 font-medium text-warning">
                      <TriangleAlert className="size-3" aria-hidden />
                      controleer uren
                    </span>
                  )}
                </div>
                {row?.message && (
                  <p
                    className={
                      row.tone === "danger"
                        ? "mt-1 text-xs font-medium text-danger"
                        : "mt-1 text-xs font-medium text-success"
                    }
                  >
                    {row.message}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => approve(g)}
                aria-label={`Keur alle ${g.count} urenstaten van ${g.freelancerName} goed`}
              >
                {busy ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="mr-1.5 size-4" aria-hidden />
                )}
                Keur alle {g.count} goed
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
