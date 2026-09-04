// DBA-audit export: serialiseerbaar data-object voor het DBA-dossier-PDF per samenwerking.
// Bedoeld als onderbouwingsbundel voor een eventueel bedrijfsbezoek van de Belastingdienst.
// HARD: dit is een hulpmiddel, geen juridisch advies of oordeel van de Belastingdienst.
// Pure functie — geen I/O; getest op inhoud en structuur.

import { assessCollaborationDba, jobDbaIndicators, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import { type DbaSignalLevel } from "@/lib/dba-monitor";
import { assessRateThreshold } from "@/lib/rechtsvermoeden";
import { MODEL_AGREEMENT_LABELS } from "@/lib/model-agreement";
import { type ModelAgreementType } from "@/lib/model-agreement";

/** Vaste voettekst-disclaimer op elke pagina van het dossier. */
export const DBA_AUDIT_FOOTER =
  "Hulpmiddel, geen juridisch advies of oordeel van de Belastingdienst.";

export interface DbaAuditCredential {
  type: string;
  title: string;
  status: string;
  verifiedAt: Date | null;
  expiresAt: Date | null;
}

export interface DbaAuditJobFlags {
  dbaDirectSupervision: boolean;
  dbaEmbedded: boolean;
  dbaFixedSchedule: boolean;
  dbaNoSubstitution: boolean;
  dbaExclusive: boolean;
  dbaWeakEntrepreneurship: boolean;
  dbaDurationMonths: number | null;
}

export interface DbaAuditCollaboration {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  rate: number | null; // EUR (niet centen); null = geen vast tarief
  agreementType: string | null;
  agreementFreelancerSignedAt: Date | null;
  agreementClientSignedAt: Date | null;
}

export interface DbaAuditParties {
  freelancerName: string;
  companyName: string;
  kvkNumber: string | null;
  btwNumber: string | null;
}

export interface DbaAuditIndicator {
  key: string;
  label: string;
  value: boolean | string | number | null;
  level: DbaSignalLevel | null;
  /** Korte toelichting (waarom dit signaal aanwezig of afwezig is). */
  reason: string;
}

export interface DbaAuditRateThreshold {
  belowThreshold: boolean;
  rateCentsSnapshot: number | null;
  thresholdCents: number;
  hint: string;
}

export interface DbaAuditEntrepreneurship {
  trustLevel: string;
  verifiedCredentialCount: number;
  hasKvk: boolean;
  hasBtw: boolean;
}

export interface DbaAuditSection {
  title: string;
  blocks: { label: string; value: string }[];
}

export interface DbaAuditData {
  /** Stabiele referentie (voor bestandsnaam / kop). */
  collaborationId: string;
  generatedAt: Date;
  /** Voettekst op elke pagina — altijd aanwezig. */
  footer: string;

  // --- Blok 1: Samenwerking ---
  header: {
    jobTitle: string;
    freelancerName: string;
    companyName: string;
    periodLabel: string;
    rateLabel: string;
  };

  // --- Blok 2: Modelovereenkomst-status ---
  agreement: {
    typeLabel: string;
    freelancerSigned: string;
    clientSigned: string;
    bothSigned: boolean;
  };

  // --- Blok 3: DBA-indicatoren ---
  dbaAssessment: {
    level: DbaSignalLevel;
    levelLabel: string;
    durationMonths: number | null;
    indicators: DbaAuditIndicator[];
    disclaimer: string;
  };

  // --- Blok 4: Rechtsvermoeden-tarieftoets ---
  rateThreshold: DbaAuditRateThreshold;

  // --- Blok 5: Ondernemerschap-signalen ---
  entrepreneurship: DbaAuditEntrepreneurship;
}

/** Datum → "d-M-yyyy" (nl-NL stijl, geen locale-afhankelijkheid). */
function fmtDate(d: Date | null): string {
  if (!d) return "—";
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/** Tarief in EUR naar label. */
function rateLabel(rateEur: number | null, startDate: Date | null, endDate: Date | null): string {
  const rate = rateEur != null ? `EUR ${rateEur}/uur` : "Geen vast uurtarief vastgelegd";
  const from = fmtDate(startDate);
  const to = fmtDate(endDate);
  const period = endDate ? `${from} t/m ${to}` : from !== "—" ? `vanaf ${from}` : "—";
  return `${rate} · Periode: ${period}`;
}

/**
 * Bouwt een serialiseerbaar DBA-audit data-object uit de samenwerking en aanverwante data.
 * Pure functie: geen I/O. Getest op aanwezigheid van disclaimer, indicatoren en structuur.
 */
export function buildDbaAuditData(
  col: DbaAuditCollaboration & { job: { title: string } & DbaAuditJobFlags },
  parties: DbaAuditParties,
  credentials: DbaAuditCredential[],
  now: Date,
): DbaAuditData {
  // --- DBA-assessment via de bestaande engine ---
  const indicators = jobDbaIndicators(col.job);
  const assessment = assessCollaborationDba(
    { collaborationId: col.id, startDate: col.startDate, ...indicators },
    now,
  );

  // Vertaal de job-DBA-vlaggen naar indicator-objecten voor het dossier.
  const dbaIndicators: DbaAuditIndicator[] = [
    {
      key: "gezag",
      label: "Gezag / directe aansturing",
      value: col.job.dbaDirectSupervision,
      level: col.job.dbaDirectSupervision ? "HOOG" : "LAAG",
      reason: col.job.dbaDirectSupervision
        ? "Directe aansturing wijst op een gezagsverhouding."
        : "Geen directe aansturing vastgelegd.",
    },
    {
      key: "inbedding",
      label: "Structurele inbedding",
      value: col.job.dbaEmbedded,
      level: col.job.dbaEmbedded ? "VERHOOGD" : "LAAG",
      reason: col.job.dbaEmbedded
        ? "Structureel ingebed in de organisatie."
        : "Geen structurele inbedding vastgelegd.",
    },
    {
      key: "vervanging",
      label: "Geen vrije vervanging",
      value: col.job.dbaNoSubstitution,
      level: col.job.dbaNoSubstitution ? "VERHOOGD" : "LAAG",
      reason: col.job.dbaNoSubstitution
        ? "Vrije vervanging niet toegestaan — beperkt zelfstandigheid."
        : "Vrije vervanging toegestaan.",
    },
    {
      key: "uren",
      label: "Vaste uren / rooster",
      value: col.job.dbaFixedSchedule,
      level: col.job.dbaFixedSchedule ? "VERHOOGD" : "LAAG",
      reason: col.job.dbaFixedSchedule
        ? "Vaste uren/rooster gelijkt op een dienstverband."
        : "Geen vaste roostertijden vastgelegd.",
    },
    {
      key: "exclusiviteit",
      label: "Exclusiviteit",
      value: col.job.dbaExclusive,
      level: col.job.dbaExclusive ? "VERHOOGD" : "LAAG",
      reason: col.job.dbaExclusive
        ? "Exclusiviteit vermindert het ondernemersrisico."
        : "Geen exclusiviteit.",
    },
    {
      key: "duur",
      label: "Duur opdracht (maanden)",
      value: col.job.dbaDurationMonths ?? assessment.durationMonths ?? null,
      level:
        assessment.durationMonths != null
          ? assessment.durationMonths >= 12
            ? "HOOG"
            : assessment.durationMonths >= 6
              ? "VERHOOGD"
              : "LAAG"
          : null,
      reason:
        assessment.durationMonths != null
          ? `Opdracht loopt ${assessment.durationMonths} maanden.`
          : "Startdatum niet vastgelegd; duur niet berekend.",
    },
  ];

  // --- Modelovereenkomst ---
  const agrType = col.agreementType as ModelAgreementType | null;
  const typeLabel =
    agrType && MODEL_AGREEMENT_LABELS[agrType]
      ? MODEL_AGREEMENT_LABELS[agrType]
      : "Niet vastgelegd";
  const freelancerSigned = col.agreementFreelancerSignedAt
    ? `Digitaal akkoord op ${fmtDate(col.agreementFreelancerSignedAt)}`
    : "Nog niet ondertekend";
  const clientSigned = col.agreementClientSignedAt
    ? `Digitaal akkoord op ${fmtDate(col.agreementClientSignedAt)}`
    : "Nog niet ondertekend";
  const bothSigned = !!col.agreementFreelancerSignedAt && !!col.agreementClientSignedAt;

  // --- Rechtsvermoeden-tarieftoets ---
  const rateCents = col.rate != null ? col.rate * 100 : null;
  const rateThresholdResult = assessRateThreshold(rateCents);
  const rateThreshold: DbaAuditRateThreshold = {
    belowThreshold: rateThresholdResult.belowThreshold,
    rateCentsSnapshot: rateCents,
    thresholdCents: rateThresholdResult.thresholdCents,
    hint: rateThresholdResult.belowThreshold
      ? `Tarief (EUR ${col.rate}/uur) ligt onder de drempel van EUR ${rateThresholdResult.thresholdCents / 100}/uur. Zie rechtsvermoeden werknemerschap (VBAR, verwacht 1-1-2027).`
      : `Tarief valt boven of op de drempel van EUR ${rateThresholdResult.thresholdCents / 100}/uur.`,
  };

  // --- Ondernemerschap-signalen ---
  // Server-side waarheid (CLAUDE.md regel 1): een VERIFIED-certificaat waarvan `expiresAt` is
  // gepasseerd is verlopen — óók vóór de expiry-cron de status flipt — en telt dus niet mee als
  // geverifieerd bewijs in het dossier. Anders zou het dossier een hoger vertrouwensniveau tonen
  // dan de compliance-/verval-oppervlakken van de app.
  const verifiedCount = credentials.filter(
    (c) =>
      c.status === "VERIFIED" && (c.expiresAt == null || c.expiresAt.getTime() > now.getTime()),
  ).length;
  const trustLevel = verifiedCount > 0 ? "DEELS" : "BASIS";

  return {
    collaborationId: col.id,
    generatedAt: now,
    footer: DBA_AUDIT_FOOTER,

    header: {
      jobTitle: col.job.title,
      freelancerName: parties.freelancerName,
      companyName: parties.companyName,
      periodLabel: col.endDate
        ? `${fmtDate(col.startDate)} t/m ${fmtDate(col.endDate)}`
        : col.startDate
          ? `Vanaf ${fmtDate(col.startDate)}`
          : "—",
      rateLabel: rateLabel(col.rate, col.startDate, col.endDate),
    },

    agreement: {
      typeLabel,
      freelancerSigned,
      clientSigned,
      bothSigned,
    },

    dbaAssessment: {
      level: assessment.level,
      levelLabel: DBA_LEVEL_LABEL[assessment.level],
      durationMonths: assessment.durationMonths,
      indicators: dbaIndicators,
      disclaimer: assessment.disclaimer,
    },

    rateThreshold,

    entrepreneurship: {
      trustLevel,
      verifiedCredentialCount: verifiedCount,
      hasKvk: !!parties.kvkNumber,
      hasBtw: !!parties.btwNumber,
    },
  };
}
