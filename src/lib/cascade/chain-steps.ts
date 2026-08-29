// Cascade-keten stappen — puur, geen React. Bouwt de visuele voortgangsstappen (contract →
// prestatie → factuur → betaling) op basis van de HUIDIGE cyclus van een samenwerking.
//
// Belangrijk (spiegelt src/lib/cascade/stage.ts): `performances` en `invoices` komen `createdAt desc`
// binnen (zie de query in samenwerkingen/[id]/page.tsx), dus index 0 is telkens het MEEST RECENTE
// record. We evalueren daarom de nieuwste prestatie/factuur — niet `.some()` over de volledige
// historie. Anders zou op een multi-cyclus ACTIVE-samenwerking (cyclus 1 betaald, cyclus 2 verse
// uren) de stepper "Prestatie: Goedgekeurd" + "Factuur: Betaald" tonen terwijl de status-line op
// hetzelfde scherm de cyclus-2-actie toont — een zichzelf tegensprekend scherm.

export type ChainStepStatus = "done" | "active" | "waiting" | "error";

export interface ChainStep {
  label: string;
  status: ChainStepStatus;
  detail?: string;
}

export function buildChainSteps(col: {
  status: string;
  /** `createdAt desc`: index 0 is de meest recente prestatie. */
  performances: Array<{ status: string }>;
  /** `createdAt desc`: index 0 is de meest recente factuur. */
  invoices: Array<{ lifecycleStatus: string | null }>;
  /**
   * Is de meest recente prestatie nieuwer dan de meest recente factuur? Zo ja, dan hoort die factuur
   * bij een vorige cyclus en telt ze niet voor de huidige fase: de ZZP'er heeft na een betaalde
   * cyclus nieuwe uren ingediend. Zonder deze vlag zou een PAID-factuur van cyclus 1 de verse
   * cyclus-2-uren maskeren met "Factuur betaald · niets te doen". Default false (single-cyclus).
   * Berekend via `isPerformanceNewerThanInvoice` in stage.ts — dezelfde bron als de status-line.
   */
  performanceNewerThanInvoice?: boolean;
}): ChainStep[] {
  const steps: ChainStep[] = [];

  // Stap 1: Contract
  const contractDone = col.status !== "PROPOSED";
  steps.push({
    label: "Contract",
    status: contractDone ? "done" : col.status === "CANCELLED" ? "waiting" : "active",
    detail: contractDone ? "Getekend" : "Wachten op ondertekening",
  });

  // Stap 2: Prestatie (uren / oplevering) — volgt de NIEUWSTE prestatie (huidige cyclus).
  const latestPerf = col.performances[0]?.status ?? null;
  let perfStatus: ChainStepStatus = "waiting";
  let perfDetail = "Nog geen uren of oplevering ingediend";
  if (!contractDone) {
    perfStatus = "waiting";
    perfDetail = "Volgt na contract";
  } else if (latestPerf === "APPROVED") {
    perfStatus = "done";
    perfDetail = "Goedgekeurd";
  } else if (latestPerf === "SUBMITTED") {
    perfStatus = "active";
    perfDetail = "Ter goedkeuring";
  } else if (latestPerf === "REJECTED") {
    perfStatus = "error";
    perfDetail = "Afgekeurd — nieuw indienen";
  } else if (latestPerf !== null) {
    // DRAFT (of elke andere niet-terminale concept-status)
    perfStatus = "active";
    perfDetail = "Concept aangemaakt";
  }
  steps.push({ label: "Prestatie", status: perfStatus, detail: perfDetail });

  // Stap 3: Factuur — beoordeel de factuur van de HUIDIGE cyclus. Een vorige-cyclus-factuur wordt
  // genuld zodra de nieuwste prestatie nieuwer is (spiegelt `inv` in stage.ts); zo maskeert een
  // betaalde cyclus-1-factuur nooit de verse, nog te factureren cyclus-2-uren.
  const inv = col.performanceNewerThanInvoice ? null : (col.invoices[0]?.lifecycleStatus ?? null);
  let invStatus: ChainStepStatus = "waiting";
  let invDetail = "Volgt na goedkeuring prestatie";
  if (inv === "PAID" || inv === "PROCESSED") {
    invStatus = "done";
    invDetail = "Betaald";
  } else if (inv === "CREDITED") {
    // Gecrediteerd is een afgewikkelde eindtoestand (spiegelt stage.ts): de factuur is
    // teruggedraaid, niemand hoeft nog te betalen. Zonder deze tak viel CREDITED door naar de
    // "Volgt na goedkeuring prestatie"-default en sprak de stepper de status-line ("Factuur
    // gecrediteerd") op hetzelfde scherm tegen.
    invStatus = "done";
    invDetail = "Gecrediteerd";
  } else if (inv === "WITHDRAWN") {
    // Ingetrokken is net als gecrediteerd een afgewikkelde eindtoestand (spiegelt stage.ts): de
    // factuur is definitief teruggetrokken, niemand hoeft nog te betalen. Zonder deze tak viel
    // WITHDRAWN door naar de "Volgt na goedkeuring prestatie"-default en sprak de stepper de
    // terminale status ("Factuur ingetrokken") op hetzelfde scherm tegen.
    invStatus = "done";
    invDetail = "Ingetrokken";
  } else if (inv === "APPROVED") {
    invStatus = "active";
    invDetail = "Goedgekeurd — wachten op betaling";
  } else if (inv === "SUBMITTED") {
    invStatus = "active";
    invDetail = "Ter goedkeuring";
  } else if (inv === "REJECTED") {
    invStatus = "error";
    invDetail = "Afgekeurd";
  } else if (inv === "OVERDUE") {
    invStatus = "error";
    invDetail = "Vervallen — betaling te laat";
  } else if (inv === "DRAFT") {
    invStatus = "active";
    invDetail = "Concept — nog niet ingediend";
  }
  steps.push({ label: "Factuur", status: invStatus, detail: invDetail });

  // Stap 4: Betaling — op dezelfde huidige-cyclus-factuur (`inv`).
  const paid = inv === "PAID" || inv === "PROCESSED";
  // OVERDUE hoort net als APPROVED bij de betalingsfase (spiegelt stage.ts: `APPROVED || OVERDUE`):
  // de factuur ís goedgekeurd, alleen te laat. Zonder OVERDUE hier toonde de Betaling-stap "waiting ·
  // Volgt na factuurgoedkeuring" terwijl de status-line "markeer de betaling" vroeg — tegenstrijdig.
  const invApproved = inv === "APPROVED" || inv === "OVERDUE";
  const overdue = inv === "OVERDUE";
  const credited = inv === "CREDITED";
  const withdrawn = inv === "WITHDRAWN";
  steps.push({
    label: "Betaling",
    // Gecrediteerd/ingetrokken: afgewikkeld zonder betaling — geen openstaande actie (spiegelt stage.ts).
    status: paid || credited || withdrawn ? "done" : invApproved ? "active" : "waiting",
    detail: paid
      ? "Ontvangen"
      : credited
        ? "Niet verschuldigd (gecrediteerd)"
        : withdrawn
          ? "Niet verschuldigd (ingetrokken)"
          : overdue
            ? "Wachten op betaling — te laat"
            : invApproved
              ? "Wachten op betaling"
              : "Volgt na factuurgoedkeuring",
  });

  return steps;
}
