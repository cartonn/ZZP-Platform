"use client";

import { useEffect, useState } from "react";
import { createReplayScheduler } from "@/lib/client/action-replay";

/**
 * Onzichtbaar vangnet voor issue #329: zorgt dat het antwoord van een server action in een
 * productiebuild ook echt op het scherm belandt. Zie `src/lib/client/action-replay.ts` voor de
 * gemeten oorzaak (vastgelopen transitie in de React-build die Next.js 15.5 meelevert) en waarom
 * een state-update elders in de root die transitie alsnog laat committen.
 *
 * Rendert niets. Hoort in de root-layout, zodat elke rol en elke pagina hem heeft.
 */
export function ActionReplay() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const scheduler = createReplayScheduler(() => setTick((tick) => tick + 1));
    // Capture-fase op document: vangt zowel de `<form action={...}>`-submits (useActionState) als
    // de knoppen die een action via useTransition starten, ongeacht waar ze in de boom staan.
    const onInteraction = () => scheduler.trigger();
    document.addEventListener("submit", onInteraction, true);
    document.addEventListener("click", onInteraction, true);
    return () => {
      scheduler.cancel();
      document.removeEventListener("submit", onInteraction, true);
      document.removeEventListener("click", onInteraction, true);
    };
  }, []);

  return null;
}
