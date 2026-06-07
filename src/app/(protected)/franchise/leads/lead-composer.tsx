"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadForm } from "./lead-form";

/**
 * Toont standaard alleen een "Nieuwe lead"-knop; het formulier ontvouwt pas na een klik. Zo blijft
 * de lijst het rustige beginscherm en verschijnt de invoer alleen wanneer de franchiser erom vraagt.
 */
export function LeadComposer() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex sm:justify-end">
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden />
          Nieuwe lead
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Nieuwe lead</h2>
        </div>
        <LeadForm onCancel={() => setOpen(false)} />
      </CardContent>
    </Card>
  );
}
