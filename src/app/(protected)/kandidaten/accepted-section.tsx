"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Ingeklapte sectie onderaan voor reeds geaccepteerde kandidaten. Die horen niet meer in de
 * beslis-triage thuis (de samenwerking loopt al), maar blijven bereikbaar. Standaard dicht.
 */
export function AcceptedSection({
  count,
  title,
  hint,
  children,
}: {
  count: number;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardContent className="space-y-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="focus-ring -mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-muted/40"
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="font-medium">{title}</span>
            <span className="ml-1 tabular-nums text-muted-foreground">({count})</span>
            <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
          </span>
        </button>
        {open && <div className="space-y-3 border-t border-border pt-3">{children}</div>}
      </CardContent>
    </Card>
  );
}
