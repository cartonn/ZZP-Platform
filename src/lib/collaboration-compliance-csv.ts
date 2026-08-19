// CSV-export van de certificaat-compliance van een opdrachtgever: per lopende samenwerking die
// aandacht vraagt één rij met de ZZP'er, de opdracht, de compliance-status en welke vereiste
// certificaten ontbreken/verlopen/binnenkort-verlopen/in-beoordeling zijn. Dit is het
// compliance-dossier dat een zorg-/kwaliteitsverantwoordelijke naast de dashboard-momentopname
// ("Certificaten van je ZZP'ers") vraagt.
//
// Pure functie: bouwt de CSV-tekst; de route levert hem als download. De rijen komen uit exact
// dezelfde bron als de dashboard-momentopname (`clientCredentialAlertsFromRows`) → geen
// scherm↔export-drift. Vrije tekst van derden (ZZP'er-naam, opdrachttitel) loopt via de gedeelde
// CSV-primitieven, inclusief de formule-injectie-beveiliging (CWE-1236).

import { toCsv } from "@/lib/administration/csv";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { type ClientCredentialAlert } from "@/lib/collaboration-alerts";
import { type ComplianceStatus } from "@/lib/matching";

/**
 * Menselijke status-tekst per compliance-status. `clientCredentialAlertsFromRows` levert nooit
 * COMPLIANT-rijen (die vragen geen actie), maar de defensieve val houdt de map totaal.
 */
const STATUS_LABEL: Record<ComplianceStatus, string> = {
  NON_COMPLIANT: "Actie vereist",
  WARNING: "Let op",
  COMPLIANT: "In orde",
};

/**
 * Certificaattypes → leesbare, gescheiden lijst (leeg = lege cel). Scheidt met ", " (níet ";",
 * dat is het CSV-scheidingsteken en zou de cel onnodig doen quoten) — gelijk aan de scherm-tekst
 * (`shortCredentialAlert`).
 */
function types(list: readonly CredentialType[]): string {
  return list.map((t) => CREDENTIAL_TYPE_LABEL[t]).join(", ");
}

/**
 * Compliance-meldingen → CSV met een vaste kop. Behoudt de aangeleverde volgorde (de route sorteert
 * op status + naam) zodat de export de triage-vololgorde van het scherm volgt. Muteert de invoer niet.
 */
export function complianceCsv(alerts: readonly ClientCredentialAlert[]): string {
  const header = [
    "ZZP'er",
    "Opdracht",
    "Status",
    "Ontbrekend",
    "Verlopen",
    "Verloopt binnenkort",
    "In beoordeling",
  ];
  const body = alerts.map((a) => [
    a.freelancerName,
    a.jobTitle,
    STATUS_LABEL[a.alert.status],
    types(a.alert.missing),
    types(a.alert.expired),
    types(a.alert.expiringSoon),
    types(a.alert.inReview),
  ]);
  return toCsv([header, ...body]);
}
