import Link from "next/link";
import { Check, Minus, ArrowRight } from "lucide-react";
import { type DienstSuggestie } from "@/lib/franchise/dienst-suggesties";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Passende open diensten voor deze ZZP'er — de bemiddelaar ziet meteen "waar kan ik deze persoon op
 * plaatsen?". Read-only overzicht met de server-berekende matchscore + troef/minpunt (dezelfde motor
 * als de voordracht-lijst) en een doorklik naar de dienst, waar de bestaande voordracht-actie zit.
 */
export function DienstSuggestiesCard({ suggesties }: { suggesties: DienstSuggestie[] }) {
  if (suggesties.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <div className="mb-2">
          <h2 className="text-sm font-semibold tracking-tight">Passende open diensten</h2>
          <p className="text-xs text-muted-foreground">
            Open diensten binnen je bemiddeling die bij deze ZZP&apos;er passen — gerangschikt op
            matchkwaliteit. Klik door om voor te dragen.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {suggesties.map((s) => (
            <li key={s.jobId}>
              <Link
                href={`/franchise/diensten/${s.jobId}`}
                className="group -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-3 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.companyName}</p>
                  {(s.topReason || s.topGap) && (
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {s.topReason && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <Check className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{s.topReason}</span>
                        </span>
                      )}
                      {s.topGap && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Minus className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{s.topGap}</span>
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="muted" className="tabular-nums">
                    Match {s.matchScore}
                  </Badge>
                  {s.proposed ? (
                    <Badge variant="accent">Voorgedragen</Badge>
                  ) : s.hasApplied ? (
                    <Badge variant="muted">Gereageerd</Badge>
                  ) : null}
                  <ArrowRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
