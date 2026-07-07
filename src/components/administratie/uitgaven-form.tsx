"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  createExpense,
  deleteExpense,
  type ExpenseFormState,
} from "@/app/(protected)/uitgaven/actions";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, EXPENSE_DESCRIPTION_MAX } from "@/lib/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Vandaag als `jjjj-mm-dd` (lokaal), zodat het datumveld standaard op de huidige dag staat. */
function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formulier om een zakelijke uitgave toe te voegen. De server-action (`createExpense`) is de bron van
 * waarheid: hij valideert, boekt het grootboek en her-valideert de pagina. Na succes wordt het
 * formulier geleegd via de `key`-remount, zodat de ZZP'er direct de volgende kostenpost kan invoeren.
 */
export function UitgavenForm() {
  const [state, formAction, pending] = useActionState<ExpenseFormState, FormData>(
    createExpense,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Reset na een geslaagde boeking — leeg de velden zodat de volgende invoer schoon begint.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="expense-description" className="block text-xs font-medium text-foreground">
          Omschrijving
        </label>
        <Input
          id="expense-description"
          name="description"
          type="text"
          required
          maxLength={EXPENSE_DESCRIPTION_MAX}
          placeholder="bijv. Treinreis naar opdrachtgever"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="expense-category" className="block text-xs font-medium text-foreground">
            Categorie
          </label>
          <select
            id="expense-category"
            name="category"
            defaultValue="REISKOSTEN"
            className="focus-ring h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="expense-date" className="block text-xs font-medium text-foreground">
            Datum
          </label>
          <Input
            id="expense-date"
            name="occurredAt"
            type="date"
            required
            defaultValue={todayIso()}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="expense-net" className="block text-xs font-medium text-foreground">
            Bedrag excl. btw (€)
          </label>
          <Input
            id="expense-net"
            name="netAmount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="expense-vat" className="block text-xs font-medium text-foreground">
            Btw (€)
          </label>
          <Input
            id="expense-vat"
            name="vatAmount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
          />
          <p className="text-xs text-muted-foreground">Voorbelasting — het btw-deel van de bon.</p>
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-xs font-medium text-success">
          Uitgave toegevoegd.
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bezig…" : "Uitgave toevoegen"}
      </Button>
    </form>
  );
}

/**
 * Verwijderknop voor één uitgave. Eigen mini-formulier met een verborgen `id`-veld, gekoppeld aan de
 * `deleteExpense`-server-action (die opnieuw auth/ownership afdwingt). Vraagt om bevestiging voordat de
 * uitgave — inclusief de bijbehorende grootboekregels — wordt verwijderd.
 */
export function DeleteExpenseButton({ id, description }: { id: string; description: string }) {
  const [state, formAction, pending] = useActionState<ExpenseFormState, FormData>(
    deleteExpense,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`Uitgave "${description}" verwijderen?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="destructive"
        size="xs"
        disabled={pending}
        aria-label={`Uitgave "${description}" verwijderen`}
        title={state?.error ?? "Verwijderen"}
      >
        <Trash2 className="size-3.5" aria-hidden />
        <span className="sr-only sm:not-sr-only">{pending ? "Bezig…" : "Verwijderen"}</span>
      </Button>
    </form>
  );
}
