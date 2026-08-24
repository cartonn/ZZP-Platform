"use client";

import { useActionState, useRef, useState } from "react";
import { Target } from "lucide-react";
import { setMonthlyIncomeGoal, type IncomeGoalState } from "@/app/(protected)/prognose/actions";
import {
  incomeGoalHeadline,
  incomeGoalPaceHint,
  type IncomeGoalPace,
  type IncomeGoalSummary,
} from "@/lib/income-goal";
import { formatEuro } from "@/lib/invoices";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

/** Tekstkleur per tempo-toon — refined, geen decoratie: succes/waarschuwing/primair. */
function paceTone(tone: IncomeGoalPace["tone"]): string {
  switch (tone) {
    case "success":
      return "text-success";
    case "warning":
      return "text-warning";
    case "primary":
    default:
      return "text-primary";
  }
}

/** Tekstkleur per doelstatus — refined, geen decoratie: succes/waarschuwing/primair/gedempt. */
function headlineTone(status: IncomeGoalSummary["status"]): string {
  switch (status) {
    case "achieved":
      return "text-success";
    case "behind":
      return "text-warning";
    case "on_track":
      return "text-primary";
    case "none":
    default:
      return "text-muted-foreground";
  }
}

/**
 * Formulier om het maanddoel in te stellen, te wijzigen of te wissen. Deelt via een form-veld
 * `amount` (hele euro's; lege string = doel wissen) met de server-action; de server bepaalt de
 * waarheid en her-valideert de pagina. De "Wis doel"-knop leegt het veld en verstuurt hetzelfde
 * formulier, zodat er geen tweede code-pad nodig is.
 */
function GoalForm({
  defaultEuros,
  showClear,
  submitLabel,
}: {
  defaultEuros: number | null;
  showClear: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<IncomeGoalState, FormData>(
    setMonthlyIncomeGoal,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="income-goal-amount" className="block text-xs font-medium text-foreground">
          Maanddoel (€ per maand)
        </label>
        <Input
          ref={inputRef}
          id="income-goal-amount"
          name="amount"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          defaultValue={defaultEuros ?? ""}
          placeholder="bijv. 6000"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Bezig…" : submitLabel}
        </Button>
        {showClear && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={pending}>
            Wis doel
          </Button>
        )}
      </div>
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
    </form>
  );
}

/**
 * Maanddoel-kaart op /prognose: toont de voortgang naar het maandelijkse inkomensdoel van de
 * ZZP'er en laat het doel instellen, wijzigen of wissen. Ontvangt een al-berekende samenvatting
 * (`IncomeGoalSummary`) — de component bevat geen bedrijfslogica, alleen presentatie.
 */
export function IncomeGoalCard({
  summary,
  pace,
}: {
  summary: IncomeGoalSummary;
  pace?: IncomeGoalPace | null;
}) {
  const [editing, setEditing] = useState(false);
  const headline = incomeGoalHeadline(summary);

  if (summary.status === "none") {
    return (
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle>Maanddoel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{headline}</p>
          <GoalForm defaultEuros={null} showClear={false} submitLabel="Doel instellen" />
        </CardContent>
      </Card>
    );
  }

  const goalEuros = summary.goalCents !== null ? Math.round(summary.goalCents / 100) : null;
  const realizedPct = summary.realizedPct ?? 0;
  const projectedPct = summary.projectedPct ?? 0;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Target className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <CardTitle>Maanddoel</CardTitle>
        </div>
        {summary.goalCents !== null && (
          <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
            {formatEuro(summary.goalCents)}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voortgang: balk toont het gerealiseerde deel; de concept-projectie staat er gedempt onder. */}
        <div className="space-y-1.5">
          <Progress value={realizedPct} />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{realizedPct}% gefactureerd</span>
            {projectedPct > realizedPct && <span>Met concepten: {projectedPct}%</span>}
          </div>
        </div>

        {/* Uitsplitsing */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="min-w-0 text-muted-foreground">Gefactureerd deze maand</dt>
            <dd className="shrink-0 font-mono tabular-nums">{formatEuro(summary.realizedCents)}</dd>
          </div>
          {summary.expectedCents > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="min-w-0 text-muted-foreground">Nog te versturen (concepten)</dt>
              <dd className="shrink-0 font-mono tabular-nums">
                {formatEuro(summary.expectedCents)}
              </dd>
            </div>
          )}
          {summary.status !== "achieved" && summary.remainingCents > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="min-w-0 text-muted-foreground">Nog te gaan</dt>
              <dd className="shrink-0 font-mono font-semibold tabular-nums">
                {formatEuro(summary.remainingCents)}
              </dd>
            </div>
          )}
        </dl>

        {/* Statusregel */}
        <p className={cn("text-sm font-medium", headlineTone(summary.status))}>{headline}</p>

        {/* Kalender-tempo: weegt de dag van de maand mee, zodat "op koers" niet te vroeg geruststelt. */}
        {pace && (
          <p className={cn("text-xs", paceTone(pace.tone))}>
            {incomeGoalPaceHint(pace, formatEuro)}
          </p>
        )}

        {/* Wijzig — onthult het bewerkformulier (voorgevuld) plus "Wis doel". */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
          >
            {editing ? "Sluiten" : "Wijzig"}
          </Button>
          {editing && (
            <div className="mt-3 border-t border-border pt-3">
              <GoalForm defaultEuros={goalEuros} showClear submitLabel="Doel opslaan" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
