"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Zet `data-hydrated="<pathname>"` op <html> zodra de huidige route is gehydrateerd/gecommit.
 * Onzichtbaar, geen UI.
 *
 * Reden: server-action-formulieren (de `<form action={...}>`-knoppen) reageren pas zodra React
 * de route heeft gecommit. In e2e wordt zo'n knop soms aangeklikt vóór dat moment, waardoor de
 * klik verloren gaat (een echte gebruiker klikt nooit binnen die milliseconden). Door de vlag
 * op de huidige pathname te zetten — en bij elke navigatie te verversen — kan een test
 * deterministisch wachten tot de juiste pagina interactief is (betrouwbaarder dan `networkidle`,
 * dat netwerkverkeer meet, en dan een vlag die maar één keer bij mount wordt gezet).
 */
export function HydrationFlag() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.setAttribute("data-hydrated", pathname);
  }, [pathname]);
  return null;
}
