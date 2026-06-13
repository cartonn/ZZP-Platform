"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormStatus } from "@/components/ui/form-status";
import { bulkChangeApplicationStatus, type BulkTriageState } from "./actions";

const FORM_ID = "kandidaten-bulk";

/**
 * Sticky bulk-triage bar voor de kandidatenlijst.
 *
 * Werkt met het HTML `form=` attribuut: de checkboxes in de kaarten refereren
 * via `form="kandidaten-bulk"` aan dit formulier, zodat ze meegestuurd worden
 * zonder geneste forms (wat invalid HTML zou zijn).
 *
 * De bar telt checked inputs via een document-wide change listener en toont
 * zichzelf alleen wanneer er ≥ 1 reactie geselecteerd is.
 */
export function BulkTriageBar() {
  const [state, formAction, isPending] = useActionState<BulkTriageState, FormData>(
    bulkChangeApplicationStatus,
    undefined,
  );

  const [count, setCount] = useState(0);

  // Telt alle aangevinkte checkboxes met name="appId" die horen bij ons form.
  function recountChecked() {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      `input[name="appId"][form="${FORM_ID}"]`,
    );
    let n = 0;
    inputs.forEach((el) => {
      if (el.checked) n++;
    });
    setCount(n);
  }

  useEffect(() => {
    // Initieel tellen (bijv. na server-rerender met bewaard formulier state).
    recountChecked();

    function handleChange(e: Event) {
      const target = e.target as HTMLInputElement;
      if (target.name === "appId") recountChecked();
    }

    document.addEventListener("change", handleChange);
    return () => document.removeEventListener("change", handleChange);
  }, []);

  // Reset de teller na een succesvolle bulk-actie (checkboxes worden unchecked door rerender).
  useEffect(() => {
    if (state?.ok) {
      recountChecked();
    }
  }, [state?.ok]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const select = form.elements.namedItem("target") as HTMLSelectElement | null;
    if (select?.value === "REJECTED") {
      const confirmed = window.confirm(
        "Geselecteerde reacties afwijzen? De ZZP'ers krijgen hiervan bericht.",
      );
      if (!confirmed) {
        e.preventDefault();
      }
    }
  }

  return (
    <>
      {/* Het form-element moet altijd in de DOM aanwezig zijn zodat checkboxes met
          form="kandidaten-bulk" er naar kunnen refereren, ook als de bar visueel verborgen is. */}
      <form
        id={FORM_ID}
        action={formAction}
        onSubmit={handleSubmit}
        aria-label="Bulk statuswijziging"
      />

      {/* Visuele sticky bar — alleen zichtbaar als er ≥1 reactie geselecteerd is */}
      <div
        aria-hidden={count === 0}
        className={
          count === 0
            ? "pointer-events-none opacity-0 transition-opacity duration-200"
            : "pointer-events-auto opacity-100 transition-opacity duration-200"
        }
      >
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-4xl items-center gap-3 rounded-lg border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
          <span className="shrink-0 text-sm text-muted-foreground">{count} geselecteerd</span>

          <Select
            name="target"
            form={FORM_ID}
            defaultValue="SHORTLIST"
            className="w-40"
            aria-label="Nieuwe status"
          >
            <option value="VIEWED">Bekeken</option>
            <option value="SHORTLIST">Shortlist</option>
            <option value="REJECTED">Afwijzen</option>
          </Select>

          <Button
            type="submit"
            form={FORM_ID}
            size="sm"
            variant="primary"
            disabled={count === 0 || isPending}
          >
            {isPending ? "Bezig…" : `Toepassen op ${count}`}
          </Button>

          <FormStatus success={state?.ok} error={state?.error} />
        </div>
      </div>
    </>
  );
}
