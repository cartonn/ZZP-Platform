# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## NU: Sessie 7 — Facturatie + billing

### Doel
Vanuit een samenwerking kan een ZZP'er facturen opstellen en versturen; opdrachtgever ziet
ze en kan ze als betaald markeren. Plannen/abonnementen (FREE/PRO/BUSINESS) worden zichtbaar
en de bestaande feature-gating (reactielimiet) krijgt een upgrade-pad.

### Context uit Sessie 0-6 (staat al)
- Modellen `Invoice`, `InvoiceLine`, `Plan`, `Subscription` (zie prisma/schema.prisma).
  Enums: `INVOICE_STATUSES` (DRAFT/SENT/PAID/OVERDUE/CANCELLED), `CONTRACT_STATUSES`,
  `PLAN_KEYS` (FREE/PRO/BUSINESS), `SUBSCRIPTION_STATUSES` (ACTIVE/PAST_DUE/CANCELLED).
- Plannen zijn geseed; gating zit al in `createApplication` (alleen ACTIVE-abonnement telt,
  anders FREE). `Collaboration` koppelt job/company/freelancer + heeft `invoices`.
- Maak `INVOICE_TRANSITIONS` + assert (vgl. de andere transitie-maps). Bedragen server-side
  herberekenen (regels → subtotaal/btw/totaal); nooit client-side bedragen vertrouwen.
- Mutatieketen via authz + audit; nav-item "Facturen" (beide rollen) staat op enabled:false.
- GEEN echte betaalprovider/Stripe — dit is mensenwerk/infra. Alleen status + (mock) flow.

### Stappen
1. **Facturen (FREELANCER):** factuur opstellen vanuit een samenwerking (regels: omschrijving,
   aantal, tarief; btw-percentage). Server berekent subtotaal/btw/totaal. Concept → versturen.
   Invoice-statusflow via expliciete map. Factuurnummer server-side (uniek, oplopend).
2. **Facturen (CLIENT):** ontvangen facturen zien, als betaald markeren; OVERDUE-afleiding
   (server-side, op vervaldatum). PDF/print-vriendelijke detailweergave (geen externe lib nodig).
3. **Plannen/abonnementen:** plan-overzicht + huidige plan; (mock) upgraden/downgraden zonder
   echte betaling (Subscription ACTIVE). Gating-melding linkt naar de upgrade-pagina.
4. **Tests:** invoice-statusovergangen, bedrag-/btw-berekening (pure functie), nummer-generatie,
   ownership op factuurtoegang; e2e: ZZP'er stuurt factuur, client markeert betaald.

### Definition of Done (deze sessie)
- [ ] Factuur opstellen/versturen (server-berekende bedragen) + statusflow via assert
- [ ] CLIENT ziet facturen + markeert betaald; OVERDUE server-afgeleid
- [ ] Plan-overzicht + (mock) abonnement; gating verwijst naar upgrade
- [ ] typecheck + lint + test + build groen; e2e uitgebreid + screenshots gecontroleerd
- [ ] Commit, PROGRESS.md bij, CURRENT_TASK.md naar Sessie 8

### Niet nu doen
Geen echte betaalintegratie (Stripe/Mollie) — mensenwerk/infra. Geen admin-paneel (Sessie 8).
Geen e-mailverzending van facturen — alleen in-app + (later) download.

---

## QUALITY_CHECKLIST (gebruik elke sessie vóór commit)
```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
# Start dev, klik de gebouwde flow door, check browserconsole op errors
```
Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken.
