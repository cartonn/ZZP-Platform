// Compliance-dossier per samenwerking — pure aggregator over reeds vastgelegde gegevens.
// Bundelt DBA-beoordeling, modelovereenkomst, contractstatus, geverifieerde certificaten,
// goedgekeurde prestaties, facturen en betaalstatus tot één controleerbaar, herleidbaar geheel.
// Geen oordeel/garantie (Besluit 2): toont feiten + signalen; de werkelijke werkwijze is bepalend.

import { plural } from "@/lib/plural";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";
import {
  assessCollaborationCredentials,
  clientHasComplianceAction,
} from "@/lib/collaboration-alerts";

const EXPIRY_WINDOW_DAYS = 30;

export interface DossierCredential {
  type: string;
  title: string;
  status: string; //        CredentialStatus
  verifiedAt: Date | null;
  /** Vervaldatum — nodig om verloop-vóór-einde en binnenkort-verlopend te beoordelen. `null` = doorlopend. */
  expiresAt: Date | null;
}

export interface DossierPerformance {
  description: string;
  status: string;
  approvedAt: Date | null;
}

export interface DossierInvoice {
  number: string;
  lifecycleStatus: string | null;
  totalCents: number;
  submittedAt: Date | null;
}

export interface DossierInput {
  jobTitle: string;
  freelancerName: string;
  companyName: string;
  contractStatus: string; //          DRAFT | SENT | SIGNED
  dbaRisk: string | null; //          LAAG | MIDDEN | HOOG
  dbaReasons: readonly string[];
  modelAgreementType: string | null;
  /**
   * De door de opdracht VERPLICHT gestelde certificaattypes. De verificatiesectie wordt hiertegen
   * beoordeeld — niet tegen álle certificaten van de ZZP'er — zodat ze nooit de hoogste
   * opdrachtgever-next-action (`clientComplianceTask`) tegenspreekt. Leeg = geen vereisten.
   */
  requiredCredentialTypes: readonly CredentialType[];
  credentials: readonly DossierCredential[];
  performances: readonly DossierPerformance[];
  invoices: readonly DossierInvoice[];
  startDate: Date | null;
  /** Einddatum van de plaatsing (open-einde = `null`); verankert "verloopt vóór het einde van de opdracht". */
  endDate: Date | null;
  createdAt: Date;
}

export interface DossierSection {
  key: string;
  title: string;
  /** Statusregel in mensentaal. */
  summary: string;
  /** Aandachtspunt (geel) i.p.v. bevestiging (groen)? */
  attention: boolean;
}

export interface DossierTimelineItem {
  at: Date;
  label: string;
}

export interface ComplianceDossier {
  jobTitle: string;
  freelancerName: string;
  companyName: string;
  sections: DossierSection[];
  timeline: DossierTimelineItem[];
  /** Aantal aandachtspunten over het hele dossier. */
  attentionCount: number;
}

const VERIFIED = "VERIFIED";

/** Bouwt het dossier deterministisch uit de aangeleverde feiten. */
export function buildComplianceDossier(
  input: DossierInput,
  now: Date = new Date(),
): ComplianceDossier {
  const sections: DossierSection[] = [];

  // 1. DBA-beoordeling.
  const dbaHigh = input.dbaRisk === "HOOG";
  sections.push({
    key: "dba",
    title: "Wet DBA-beoordeling",
    summary:
      input.dbaRisk == null
        ? "Nog geen DBA-beoordeling vastgelegd."
        : `Risiconiveau: ${input.dbaRisk}. ${plural(input.dbaReasons.length, "indicator", "indicatoren")} toegelicht.`,
    attention: dbaHigh || input.dbaRisk == null,
  });

  // 2. Modelovereenkomst.
  sections.push({
    key: "model",
    title: "Modelovereenkomst",
    summary: input.modelAgreementType
      ? `Vastgelegd: ${input.modelAgreementType}.`
      : "Geen modelovereenkomst vastgelegd.",
    attention: !input.modelAgreementType && dbaHigh,
  });

  // 3. Contract.
  const signed = input.contractStatus === "SIGNED";
  sections.push({
    key: "contract",
    title: "Contract",
    summary: signed ? "Getekend." : `Status: ${input.contractStatus} — nog niet getekend.`,
    attention: !signed,
  });

  // 4. Verificatie van de ZZP'er — beoordeeld tegen de VERPLICHTE certificaattypes van de opdracht.
  // Zelfde bron (`assessCollaborationCredentials`) als de hoogste opdrachtgever-next-action
  // (`clientComplianceTask`), zodat het dossier die taak nooit tegenspreekt: een ZZP'er die de
  // vereiste VOG mist maar een ongerelateerd VERIFIED certificaat heeft, telt hier niet als "compleet".
  const verified = input.credentials.filter((c) => c.status === VERIFIED);
  const assessmentCredentials: FreelancerCredential[] = input.credentials.map((c) => ({
    type: c.type as CredentialType,
    status: c.status as FreelancerCredential["status"],
    expiresAt: c.expiresAt,
  }));
  const credentialAlert = assessCollaborationCredentials(
    input.requiredCredentialTypes,
    assessmentCredentials,
    now,
    EXPIRY_WINDOW_DAYS,
    input.endDate,
  );
  const labelTypes = (list: readonly CredentialType[]) =>
    list.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ");
  const requiredCount = input.requiredCredentialTypes.length;
  let verificatieSummary: string;
  if (requiredCount === 0) {
    verificatieSummary = "Geen vereiste certificaten voor deze opdracht.";
  } else {
    const gaps: string[] = [];
    if (credentialAlert.missing.length)
      gaps.push(`${labelTypes(credentialAlert.missing)} ontbreekt`);
    if (credentialAlert.expired.length)
      gaps.push(`${labelTypes(credentialAlert.expired)} verlopen`);
    if (credentialAlert.expiringSoon.length)
      gaps.push(`${labelTypes(credentialAlert.expiringSoon)} verloopt binnenkort`);
    if (credentialAlert.expiringDuringPlacement.length)
      gaps.push(
        `${labelTypes(credentialAlert.expiringDuringPlacement)} verloopt vóór het einde van de opdracht`,
      );
    // Geldig geverifieerd = vereiste types zonder gat of nog-in-beoordeling-status.
    const validCount =
      requiredCount -
      credentialAlert.missing.length -
      credentialAlert.expired.length -
      credentialAlert.inReview.length;
    verificatieSummary =
      `${validCount} van ${plural(requiredCount, "vereist certificaat", "vereiste certificaten")} geldig geverifieerd` +
      (gaps.length ? ` · ${gaps.join("; ")}` : "") +
      ".";
  }
  sections.push({
    key: "verificatie",
    title: "Verificatie ZZP'er",
    summary: verificatieSummary,
    // Aandacht precies wanneer de opdrachtgever-next-action zou afvuren (ontbrekend/verlopen/
    // binnenkort/vóór-einde) — nooit los daarvan.
    attention: clientHasComplianceAction(credentialAlert),
  });

  // 5. Prestaties.
  const approved = input.performances.filter((p) => p.status === "APPROVED");
  sections.push({
    key: "prestaties",
    title: "Goedgekeurde prestaties",
    summary: `${approved.length} van ${plural(input.performances.length, "prestatie", "prestaties")} goedgekeurd.`,
    attention: false,
  });

  // 6. Facturen + betaalstatus.
  const paid = input.invoices.filter((i) => i.lifecycleStatus === "PAID");
  const overdue = input.invoices.filter((i) => i.lifecycleStatus === "OVERDUE");
  sections.push({
    key: "facturen",
    title: "Facturen & betaalstatus",
    summary: `${plural(input.invoices.length, "factuur", "facturen")}, ${paid.length} betaald${overdue.length ? `, ${overdue.length} te laat` : ""}.`,
    attention: overdue.length > 0,
  });

  // Tijdlijn (gesorteerd, oudste eerst) uit de gedateerde feiten.
  const timeline: DossierTimelineItem[] = [
    { at: input.createdAt, label: `Samenwerking aangemaakt voor "${input.jobTitle}"` },
    ...(input.startDate ? [{ at: input.startDate, label: "Startdatum opdracht" }] : []),
    ...verified
      .filter((c) => c.verifiedAt)
      .map((c) => ({ at: c.verifiedAt as Date, label: `Certificaat geverifieerd: ${c.title}` })),
    ...approved
      .filter((p) => p.approvedAt)
      .map((p) => ({ at: p.approvedAt as Date, label: `Prestatie goedgekeurd: ${p.description}` })),
    ...input.invoices
      .filter((i) => i.submittedAt)
      .map((i) => ({ at: i.submittedAt as Date, label: `Factuur ingediend: ${i.number}` })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return {
    jobTitle: input.jobTitle,
    freelancerName: input.freelancerName,
    companyName: input.companyName,
    sections,
    timeline,
    attentionCount: sections.filter((s) => s.attention).length,
  };
}
