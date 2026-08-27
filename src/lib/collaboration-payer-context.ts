// Beslist of de ZZP'er op het samenwerking-detail het betaalgedrag van de opdrachtgever te zien
// krijgt. Het betaalgedrag-signaal (gemiddelde betaaltijd, % op tijd) toont de server al aan de
// ZZP'er op de opdracht-detailpagina (pre-application, `getPaymentBehaviorForCompany`). Op het
// actieve samenwerking-detail — juist het scherm waar de ZZP'er deze opdrachtgever factureert en op
// betaling wacht — ontbrak het nog. Deze pure poort bepaalt wanneer het blok relevant is, zodat de
// UI het nooit als ruis toont op een samenwerking waar nog niets te innen valt.
//
// Server-side is de waarheid (CLAUDE.md regel 1): de client toont het signaal, berekent het nooit
// zelf. Puur en deterministisch — geen I/O.

export interface ClientPaymentContextInput {
  /** Is de kijkende actor de ZZP'er-partij van deze samenwerking? Alleen die partij factureert. */
  isFreelancer: boolean;
  /** CollaborationStatus van de samenwerking. */
  collaborationStatus: string;
  /** Aantal facturen (elke levensfase) op de samenwerking. */
  invoiceCount: number;
}

/**
 * Toon het betaalgedrag van de opdrachtgever aan de ZZP'er zodra er gefactureerd wordt of kan
 * worden: een ACTIVE-inzet (facturen ontstaan uit goedgekeurde prestaties) of ten minste één
 * (concept-)factuur, ongeacht de status — een over de einddatum lopende of afgeronde samenwerking
 * kan nog openstaande facturen hebben waarop de betaalbetrouwbaarheid van de klant er juist toe doet.
 * Op een nog-voorgestelde samenwerking zónder facturen is er nog niets te innen → geen ruis.
 * Nooit voor de opdrachtgever zelf of een meekijkende admin (die factureren niet).
 */
export function showsClientPaymentContext(input: ClientPaymentContextInput): boolean {
  if (!input.isFreelancer) return false;
  return input.collaborationStatus === "ACTIVE" || input.invoiceCount > 0;
}
