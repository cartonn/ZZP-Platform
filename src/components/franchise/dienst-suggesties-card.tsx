"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Minus, UserPlus } from "lucide-react";
import { type DienstSuggestie } from "@/lib/franchise/dienst-suggesties";
import { proposeFreelancer, type ProposeState } from "@/app/(protected)/franchise/diensten/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function SubmitButton({ disabled, blocker }: { disabled: boolean; blocker: string | null }) {
  const { pending } = useFormStatus();
  const button = (
    <Button type="submit" size="sm" variant="secondary" disabled={disabled || pending}>
      <UserPlus className="size-3.5" aria-hidden />
      {pending ? "Bezig…" : "Voordragen"}
    </Button>
  );
  // Disabled mét reden zodat de blokkade van déze ZZP'er ("Eerst VOG regelen") zichtbaar is naast de
  // dossier-header, i.p.v. een actieve knop naast een rode inzetbaarheidsblokkade.
  if (disabled && blocker) {
    return (
      <span title={`Eerst ${blocker.toLowerCase()}`} className="inline-flex">
        {button}
      </span>
    );
  }
  return button;
}

/**
 * Eén passende open dienst met een directe voordracht-actie. Roept dezelfde server action aan als de
 * dienst-detailpagina (`proposeFreelancer` — met dezelfde inzetbaarheids-gate + idempotentie), zodat
 * de bemiddelaar niet meer hoeft door te klikken. Na succes toont de rij stil "Voorgedragen".
 */
function SuggestieRow({
  freelancerId,
  suggestie,
  blocked,
  blocker,
}: {
  freelancerId: string;
  suggestie: DienstSuggestie;
  blocked: boolean;
  blocker: string | null;
}) {
  const [state, formAction] = useActionState<ProposeState, FormData>(proposeFreelancer, undefined);
  const [done, setDone] = useState(suggestie.proposed);

  useEffect(() => {
    if (state && "ok" in state && state.ok) setDone(true);
  }, [state]);

  const proposed = done || suggestie.proposed;
  const error = state && "error" in state ? state.error : null;

  return (
    <li className="-mx-1 flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{suggestie.title}</p>
        <p className="truncate text-xs text-muted-foreground">{suggestie.companyName}</p>
        {(suggestie.topReason || suggestie.topGap) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {suggestie.topReason && (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{suggestie.topReason}</span>
              </span>
            )}
            {suggestie.topGap && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Minus className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{suggestie.topGap}</span>
              </span>
            )}
          </p>
        )}
        {error && <p className="truncate text-xs text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="muted" className="tabular-nums">
          Match {suggestie.matchScore}
        </Badge>
        {proposed ? (
          <Badge variant="accent" className="inline-flex items-center gap-1">
            <Check className="size-3.5" aria-hidden />
            Voorgedragen
          </Badge>
        ) : suggestie.hasApplied ? (
          <Badge variant="muted">Gereageerd</Badge>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="jobId" value={suggestie.jobId} />
            <input type="hidden" name="freelancerId" value={freelancerId} />
            <SubmitButton disabled={blocked} blocker={blocker} />
          </form>
        )}
      </div>
    </li>
  );
}

/**
 * Passende open diensten voor deze ZZP'er — de bemiddelaar ziet meteen "waar kan ik deze persoon op
 * plaatsen?" én draagt direct voor zonder eerst naar het dienst-detail te klikken. Server-side is de
 * waarheid: `blocked` (uit de inzetbaarheid van déze ZZP'er) schakelt de knop uit; de server weigert
 * hoe dan ook. Dezelfde uitlegbare troef/minpunt-redenen als de voordracht-lijst.
 */
export function DienstSuggestiesCard({
  suggesties,
  freelancerId,
  blocked = false,
  blocker = null,
}: {
  suggesties: DienstSuggestie[];
  freelancerId: string;
  /** Inzetbaarheid van déze ZZP'er is INACTIEF ⇒ voordragen geblokkeerd. */
  blocked?: boolean;
  /** Eerste harde blokkade van déze ZZP'er (bv. "VOG ontbreekt"), voor de tooltip. */
  blocker?: string | null;
}) {
  if (suggesties.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <div className="mb-2">
          <h2 className="text-sm font-semibold tracking-tight">Passende open diensten</h2>
          <p className="text-xs text-muted-foreground">
            Open diensten binnen je bemiddeling die bij deze ZZP&apos;er passen — gerangschikt op
            matchkwaliteit. Draag direct voor.
          </p>
          {blocked && blocker && (
            <p className="mt-1 text-xs text-danger">
              Nog niet voordraagbaar — eerst {blocker.toLowerCase()}.
            </p>
          )}
        </div>
        <ul className="divide-y divide-border">
          {suggesties.map((s) => (
            <SuggestieRow
              key={s.jobId}
              freelancerId={freelancerId}
              suggestie={s}
              blocked={blocked}
              blocker={blocker}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
