"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  createExpense,
  deleteExpense,
  type ExpenseFormState,
} from "@/app/(protected)/uitgaven/actions";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_DESCRIPTION_MAX,
  EXPENSE_VAT_RATES,
  type ExpenseVatRateKey,
  vatCentsForRate,
  centsToEuroInput,
  parseEurosToCents,
} from "@/lib/expense";
import {
  mileageExpenseNetCents,
  parseExpenseKilometers,
  mileageRateLabel,
} from "@/lib/expense-mileage";
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

  // Btw-tarief + bedragen zijn gecontroleerd zodat het btw-bedrag automatisch uit het netto volgt.
  // De server (`createExpense`) blijft de bron van waarheid en her-valideert netto én btw los.
  const [net, setNet] = useState("");
  const [vat, setVat] = useState("");
  const [rate, setRate] = useState<ExpenseVatRateKey>("21");
  // Categorie is gecontroleerd zodat de km-helper alleen bij reiskosten verschijnt. `km` voedt de
  // rittenregistratie én berekent het nettobedrag tegen het vaste tarief (0% btw).
  const [category, setCategory] = useState("REISKOSTEN");
  const [km, setKm] = useState("");

  // Verwerk een km-invoer: vul het nettobedrag met de wettelijke vergoeding en zet btw op 0% (een
  // kilometervergoeding kent geen voorbelasting). De server (`createExpense`) blijft de bron van
  // waarheid en her-valideert km, netto én btw los.
  function onKmChange(value: string) {
    setKm(value);
    const parsed = parseExpenseKilometers(value);
    if (parsed === null) return;
    setNet(centsToEuroInput(mileageExpenseNetCents(parsed)));
    setRate("0");
    setVat("");
  }

  function onCategoryChange(value: string) {
    setCategory(value);
    // Km hoort alleen bij reiskosten; wissel je weg, dan verdwijnt de rittenregistratie.
    if (value !== "REISKOSTEN") setKm("");
  }

  const kmValue = parseExpenseKilometers(km);
  const kmNetCents = kmValue === null ? 0 : mileageExpenseNetCents(kmValue);
  // Bij een vastgelegde rit is de vaste kilometervergoeding de aftrekpost; het netto/btw wordt daaruit
  // afgeleid (server-side de bron van waarheid). Zet de bedragvelden dan op alleen-lezen zodat het niet
  // lijkt alsof je er náást de km-aftrek nog een werkelijk bedrag bij kunt zetten (dat wordt genegeerd).
  const kmDrivesAmount = kmValue !== null;

  // Herbereken het btw-bedrag uit een netto en een tarief; "custom" laat de ZZP'er het zelf typen.
  function recomputeVat(nextNet: string, nextRate: ExpenseVatRateKey) {
    if (nextRate === "custom") return;
    const bps = EXPENSE_VAT_RATES.find((r) => r.key === nextRate)?.bps ?? 0;
    const netCents = parseEurosToCents(nextNet);
    setVat(netCents === null ? "" : centsToEuroInput(vatCentsForRate(netCents, bps)));
  }

  function onNetChange(value: string) {
    setNet(value);
    recomputeVat(value, rate);
  }

  function onRateChange(value: ExpenseVatRateKey) {
    setRate(value);
    recomputeVat(net, value);
  }

  // Reset na een geslaagde boeking — leeg de velden zodat de volgende invoer schoon begint.
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setNet("");
      setVat("");
      setRate("21");
      setCategory("REISKOSTEN");
      setKm("");
    }
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
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
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

      {category === "REISKOSTEN" && (
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
          <label htmlFor="expense-km" className="block text-xs font-medium text-foreground">
            Zakelijke kilometers <span className="text-muted-foreground">(optioneel)</span>
          </label>
          <Input
            id="expense-km"
            name="kilometers"
            type="text"
            inputMode="numeric"
            placeholder="bijv. 42"
            value={km}
            onChange={(e) => onKmChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leg je rit vast — het bedrag volgt automatisch uit de vaste vergoeding van €{" "}
            {mileageRateLabel()}/km (0% btw).
            {kmValue !== null && (
              <span className="font-medium text-foreground">
                {" "}
                {kmValue} km = {centsToEuroInput(kmNetCents) || "0,00"} euro.
              </span>
            )}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
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
            value={net}
            onChange={(e) => onNetChange(e.target.value)}
            readOnly={kmDrivesAmount}
            aria-readonly={kmDrivesAmount}
            className={kmDrivesAmount ? "bg-muted/50 text-muted-foreground" : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="expense-vat-rate" className="block text-xs font-medium text-foreground">
            Btw-tarief
          </label>
          <select
            id="expense-vat-rate"
            value={rate}
            onChange={(e) => onRateChange(e.target.value as ExpenseVatRateKey)}
            disabled={kmDrivesAmount}
            aria-disabled={kmDrivesAmount}
            className="focus-ring h-10 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {EXPENSE_VAT_RATES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
            <option value="custom">Handmatig</option>
          </select>
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
            value={vat}
            onChange={(e) => {
              // Een handmatige aanpassing zet het tarief op "Handmatig" zodat het niet overschreven wordt.
              setVat(e.target.value);
              setRate("custom");
            }}
            readOnly={kmDrivesAmount}
            aria-readonly={kmDrivesAmount}
            className={kmDrivesAmount ? "bg-muted/50 text-muted-foreground" : undefined}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {kmDrivesAmount ? (
          <>
            Het bedrag volgt uit de kilometervergoeding (0% btw); die vervangt de werkelijke
            autokosten. Laat het km-veld leeg om in plaats daarvan een bonbedrag in te voeren.
          </>
        ) : (
          <>
            Btw (voorbelasting) volgt automatisch uit het tarief. Kies “Handmatig” om het btw-deel
            zelf in te vullen — bv. een bon met gemengde tarieven.
          </>
        )}
      </p>

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
