# Voordracht server-side weigeren wanneer de ZZP'er al heeft gereageerd (2026-10-02)

**Rol & waarde:** FRANCHISER (bemiddelaar) + roster-ZZP'er. Kern-scope: tenant-cockpit voor
bemiddelaars.

## Probleem (server-side waarheid — CLAUDE §architectuur 1)

`proposeFreelancer` (`src/app/(protected)/franchise/diensten/actions.ts`) dwingt rol
(FRANCHISER), tenant-ownership (dienst + ZZP'er in eigen roster) en inzetbaarheid (INACTIEF
geweigerd) server-side af, maar controleerde **niet** of de ZZP'er zelf al had gereageerd op de
dienst. De voordraag-UI verbergt de actie al bij `candidate.hasApplied`
(`.../diensten/[id]/voordragen.tsx` → badge "Heeft al gereageerd"), maar die beslissing leefde
**alleen in de client**.

Gevolg: een geknutselde of verouderde POST (de knop stond in een eerder geladen pagina, of een
direct request) plaatste alsnog een voordracht-auditrecord **en** een notificatie
_"…draagt je voor … — reageer nu."_ met deeplink `/opdrachten/{jobId}` naar een ZZP'er die al had
gereageerd of al geplaatst was (een reactie leidt via een geaccepteerde `Application` tot een
`Collaboration`). Dat is een misleidende next-action: "reageer nu" terwijl er niets te reageren
valt — precies de ruis die de noord-ster wil vermijden.

## Fix

Server-side poort in `proposeFreelancer`, direct na de roster-ownershipcontrole en vóór de
inzetbaarheidscheck: een bestaande, niet-ingetrokken `Application` voor `(jobId, freelancerId)`
weigert de voordracht met een informatieve melding, zonder audit of notificatie.

```ts
const existingApplication = await prisma.application.findFirst({
  where: { jobId, freelancerId, status: { not: "WITHDRAWN" } },
  select: { id: true },
});
if (existingApplication) {
  return { error: "Deze ZZP'er heeft zelf al gereageerd op deze dienst." };
}
```

Exact dezelfde semantiek als `appliedIds` in `src/lib/franchise/dienst-voordracht.ts`
(`status: { not: "WITHDRAWN" }`), zodat server-poort en UI-badge op dezelfde definitie van "heeft
gereageerd" rusten. Een ingetrokken (`WITHDRAWN`) reactie blokkeert niet — de ZZP'er kan dan
opnieuw worden voorgedragen, consistent met `hasApplied`.

**Geen UI-wijziging nodig:** de bestaande `hasApplied`-badge dekt de happy path en de bestaande
error-rendering in de voordraag-rij toont de melding als de server-poort tóch wordt geraakt.

## Tests

`src/app/(protected)/franchise/diensten/voordragen.test.ts`: een bestaande `Application` weigert de
voordracht met de exacte melding en plaatst geen audit/notificatie. De bestaande dekking
(tenant-isolatie, inzetbaarheid, idempotentie, happy path, niet-gepubliceerde dienst) blijft groen.

## Poorten

Typecheck, lint, gerichte en volledige unit-suite groen; prettier schoon; productiebuild groen.
Onafhankelijke review en de zes CI-poorten volgen op de PR.
