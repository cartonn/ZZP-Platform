"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface TriageItem {
  id: string;
  /** Optionele leading-slot (bulk-checkbox) — staat BUITEN de toggle-knop (geen geneste knoppen). */
  lead?: ReactNode;
  /** Compacte, altijd zichtbare kop (naam, headline, match, badges, beslis-signaal). */
  header: ReactNode;
  /** Uitgeklapte inhoud (redenen, notitie, acties, voorstel). Alleen gemount als open. */
  body: ReactNode;
}

/**
 * Triage-lijst: één compacte rij per kandidaat die pas uitklapt bij klik (één tegelijk open).
 * De opdrachtgever scant zo een lijst i.p.v. een eindeloze scroll van volledig uitgeklapte blokken.
 * De uitgeklapte inhoud is functioneel identiek aan de oude kaart — puur verplaatst, niet herbouwd.
 */
export function TriageList({
  items,
  defaultOpenId,
  expandLabel,
  collapseLabel,
}: {
  items: TriageItem[];
  /** Vanuit /kandidaten/vergelijk ("Kies X") of een deeplink: open deze rij meteen. */
  defaultOpenId?: string | null;
  expandLabel: string;
  collapseLabel: string;
}) {
  const initial = defaultOpenId && items.some((i) => i.id === defaultOpenId) ? defaultOpenId : null;
  const [openId, setOpenId] = useState<string | null>(initial);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const open = item.id === openId;
        return (
          <Card key={item.id} id={`app-${item.id}`} className={open ? "border-foreground/20" : ""}>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                {item.lead && <div className="pt-1.5">{item.lead}</div>}
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={open ? collapseLabel : expandLabel}
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="focus-ring -mx-2 flex w-[calc(100%+1rem)] items-start gap-2 rounded-lg px-2 py-1 text-left hover:bg-muted/40"
                >
                  {open ? (
                    <ChevronDown
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">{item.header}</div>
                </button>
              </div>
              {open && <div className="space-y-3 border-t border-border pt-3">{item.body}</div>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
