"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IdeaForm } from "./idea-form";

/**
 * Toont standaard alleen een "Idee indienen"-knop; het formulier ontvouwt pas na een klik.
 * Zo blijft het beginscherm rustig (de ideeënlijst) en verschijnt de invoer alleen wanneer
 * de gebruiker er bewust om vraagt. Na indienen blijft de kaart open met de bevestiging;
 * sluiten kan met "Annuleren".
 */
export function IdeaComposer() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex sm:justify-end">
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Lightbulb className="size-4" aria-hidden />
          Idee indienen
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Nieuw idee</h2>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
        </div>
        <IdeaForm />
      </CardContent>
    </Card>
  );
}
