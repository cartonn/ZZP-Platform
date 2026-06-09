"use client";

import { useActionState, useRef } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { importDienstenAction, type ImportResult } from "./actions";

export function ImportForm({
  collaborationOptions,
}: {
  collaborationOptions: Array<{ id: string; label: string }>;
}) {
  const [result, formAction, isPending] = useActionState<ImportResult | null, FormData>(
    importDienstenAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const hasErrors = result && result.errors.length > 0;
  const hasSuccess = result && result.imported > 0;

  return (
    <Card>
      <CardContent className="py-4">
        <form ref={formRef} action={formAction} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Samenwerking</span>
            <select
              name="collaborationId"
              required
              className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Kies een samenwerking…</option>
              {collaborationOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">CSV-inhoud (plak of typ)</span>
            <textarea
              name="csv"
              required
              rows={10}
              placeholder={`start;eind;omschrijving\n2024-01-15T22:00;2024-01-16T06:00;Nachtdienst`}
              className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed"
            />
          </label>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Importeren…" : "Importeren"}
            </Button>
            {result && (
              <p className="text-sm text-muted-foreground">
                {result.imported} dienst{result.imported !== 1 ? "en" : ""} geïmporteerd
                {result.skipped > 0 && `, ${result.skipped} overgeslagen`}.
              </p>
            )}
          </div>

          {hasSuccess && (
            <div className="flex items-start gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {result!.imported} dienst{result!.imported !== 1 ? "en zijn" : " is"} succesvol
                ingediend ter goedkeuring.
              </span>
            </div>
          )}

          {hasErrors && (
            <div className="space-y-1 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="size-4 shrink-0" aria-hidden />
                <span>
                  {result!.errors.length} fout{result!.errors.length !== 1 ? "en" : ""}:
                </span>
              </div>
              <ul className="list-inside list-disc space-y-0.5 pl-2 text-xs">
                {result!.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
