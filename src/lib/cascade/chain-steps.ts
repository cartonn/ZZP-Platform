// Cascade-keten stappen — puur, geen React. Bouwt de visuele voortgangsstappen (contract →
// prestatie → factuur → betaling) op basis van de huidige status van een samenwerking.

export type ChainStepStatus = "done" | "active" | "waiting" | "error";

export interface ChainStep {
  label: string;
  status: ChainStepStatus;
  detail?: string;
}

export function buildChainSteps(col: {
  status: string;
  performances: Array<{ status: string }>;
  invoices: Array<{ lifecycleStatus: string | null }>;
}): ChainStep[] {
  const steps: ChainStep[] = [];

  // Stap 1: Contract
  const contractDone = col.status !== "PROPOSED";
  steps.push({
    label: "Contract",
    status: contractDone ? "done" : col.status === "CANCELLED" ? "waiting" : "active",
    detail: contractDone ? "Getekend" : "Wachten op ondertekening",
  });

  // Stap 2: Prestatie (uren / oplevering)
  const perfs = col.performances;
  let perfStatus: ChainStepStatus = "waiting";
  let perfDetail = "Nog geen uren of oplevering ingediend";
  if (!contractDone) {
    perfStatus = "waiting";
    perfDetail = "Volgt na contract";
  } else if (perfs.some((p) => p.status === "APPROVED")) {
    perfStatus = "done";
    perfDetail = "Goedgekeurd";
  } else if (perfs.some((p) => p.status === "SUBMITTED")) {
    perfStatus = "active";
    perfDetail = "Ter goedkeuring";
  } else if (perfs.some((p) => p.status === "REJECTED")) {
    perfStatus = "error";
    perfDetail = "Afgekeurd — nieuw indienen";
  } else if (perfs.length > 0) {
    perfStatus = "active";
    perfDetail = "Concept aangemaakt";
  }
  steps.push({ label: "Prestatie", status: perfStatus, detail: perfDetail });

  // Stap 3: Factuur
  const invs = col.invoices.filter((i) => i.lifecycleStatus);
  let invStatus: ChainStepStatus = "waiting";
  let invDetail = "Volgt na goedkeuring prestatie";
  if (invs.some((i) => ["PAID", "PROCESSED"].includes(i.lifecycleStatus!))) {
    invStatus = "done";
    invDetail = "Betaald";
  } else if (invs.some((i) => i.lifecycleStatus === "APPROVED")) {
    invStatus = "active";
    invDetail = "Goedgekeurd — wachten op betaling";
  } else if (invs.some((i) => i.lifecycleStatus === "SUBMITTED")) {
    invStatus = "active";
    invDetail = "Ter goedkeuring";
  } else if (invs.some((i) => i.lifecycleStatus === "REJECTED")) {
    invStatus = "error";
    invDetail = "Afgekeurd";
  } else if (invs.some((i) => i.lifecycleStatus === "OVERDUE")) {
    invStatus = "error";
    invDetail = "Vervallen — betaling te laat";
  } else if (invs.some((i) => i.lifecycleStatus === "DRAFT")) {
    invStatus = "active";
    invDetail = "Concept — nog niet ingediend";
  }
  steps.push({ label: "Factuur", status: invStatus, detail: invDetail });

  // Stap 4: Betaling
  const paid = invs.some((i) => ["PAID", "PROCESSED"].includes(i.lifecycleStatus!));
  const invApproved = invs.some((i) => i.lifecycleStatus === "APPROVED");
  steps.push({
    label: "Betaling",
    status: paid ? "done" : invApproved ? "active" : "waiting",
    detail: paid
      ? "Ontvangen"
      : invApproved
        ? "Wachten op betaling"
        : "Volgt na factuurgoedkeuring",
  });

  return steps;
}
