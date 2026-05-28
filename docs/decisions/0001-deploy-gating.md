# ADR-0001: Deploy-model — testfase nu, PR-gate vóór productie

- **Status:** aanvaard
- **Datum:** 2026-05-28

## Context
Railway deployt branch `claude/dazzling-carson-v9Qwk` automatisch bij elke push, zodat de
eigenaar de gebouwde features direct kan bekijken op de test-URL. De "24/7 software-factory"-
referentie adviseert echter: **nooit automatisch deployen** — werk via Issue → Build → Test →
Review → **Draft PR → menselijke goedkeuring → Deploy**. Voor een platform met gevoelige
documenten (AVG) is dat de juiste eindstaat.

## Besluit
- **Nu (testfase, geen echte gevoelige data):** auto-deploy van de werkbranch naar de test-URL
  blijft, zodat de eigenaar kan rondklikken. Snelheid > ceremonie zolang het een demo is.
- **Vóór productie met echte gebruikers/documenten:** overstappen op een **PR-gated** model —
  agents pushen naar `swarm/*`/feature-branches en openen PR's; CI + reviewer + security moeten
  groen zijn; een **mens merget** naar de productiebranch; pas dan deployt productie. Dit blokkeert
  livegang en sluit aan op MENSENWERK.md §5 (security-/AVG-review vóór livegang = mensenwerk).

## Gevolgen
- Lage drempel om nu te testen; geen onbewaakte productie-deploys later.
- Vereist t.z.t. een aparte productie-omgeving + branch en het uitzetten van auto-deploy daarop.

## Alternatieven
- Direct nu al PR-gated: veiliger maar vertraagt de huidige "rondklikken"-feedbackloop; uitgesteld
  tot er een productie-omgeving is.
