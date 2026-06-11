"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EMAIL_PREFERENCE_CATEGORIES } from "@/lib/notification-preferences";
import { type EmailPreferenceMap } from "@/lib/notification-preferences";
import { updateEmailPreferences, type PrefState } from "./actions";

export function PreferencesForm({ prefs }: { prefs: EmailPreferenceMap }) {
  const [state, formAction, isPending] = useActionState<PrefState, FormData>(
    updateEmailPreferences,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        In-app meldingen ontvang je altijd. Zet hier per soort e-mail aan of uit.
      </p>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {EMAIL_PREFERENCE_CATEGORIES.map((category) => {
            const inputId = `pref-${category.key}`;
            return (
              <div key={category.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <label htmlFor={inputId} className="cursor-pointer text-sm font-medium">
                    {category.label}
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{category.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <input
                    id={inputId}
                    type="checkbox"
                    name={category.key}
                    defaultChecked={prefs[category.key]}
                    className="focus-ring size-4 cursor-pointer rounded border-border accent-primary"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-success">
          Voorkeuren opgeslagen.
        </p>
      )}

      <Button type="submit" variant="primary" size="sm" disabled={isPending}>
        {isPending ? "Opslaan…" : "Voorkeuren opslaan"}
      </Button>
    </form>
  );
}
