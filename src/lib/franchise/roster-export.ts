// CSV-export van het bemiddelaar-roster (`/franchise/zzpers`). De opdrachtgever en de ZZP'er hebben
// al diverse CSV-exports (openstaande posten, diensten, prestaties, prognose, fees); de bemiddelaar
// kon zijn eigen pool nergens exporteren. Deze leaf-module bouwt puur (geen DB/IO) de CSV-tekst uit
// de reeds tenant-gescopet opgehaalde + verrijkte roster-rijen, zodat de bemiddelaar zijn pool in een
// spreadsheet kan bewerken, met een opdrachtgever kan delen of zijn capaciteit kan plannen — benchmark:
// staffing-platformen die een exporteerbaar roster bieden. De server bepaalt de waarheid (CLAUDE.md
// regel 1); deze module levert enkel de presentatie. Formule-injectie (CWE-1236) wordt afgevangen door
// `toCsv`/`escapeCsvField`.

import { toCsv } from "@/lib/csv";
import { formatDateShortNl } from "@/lib/format-date";
import { type EngageabilityStatus } from "@/lib/engageability";
import { type DormancyTier } from "@/lib/franchise/roster-dormancy";

/** Kolomkoppen (Nederlands, UI-taal). Eén bron van waarheid voor de export + de tests. */
export const ROSTER_EXPORT_HEADERS = [
  "Naam",
  "Functie",
  "E-mail",
  "Locatie",
  "Werkmodus",
  "Uurtarief (EUR)",
  "Beschikbaarheid",
  "Inzetbaarheid",
  "Actieve inzet",
  "Vrij op",
  "Afwezig t/m",
  "Certificaten",
  "Certificaat-waarschuwing",
  "Profiel compleet (%)",
  "Re-engagement",
] as const;

/** Eén roster-rij in de export-vorm — een superset van de velden die de pagina al per kaart afleidt. */
export interface RosterExportRow {
  name: string;
  headline: string | null;
  email: string;
  location: string | null;
  workMode: string;
  hourlyRate: number | null;
  availability: string;
  engageabilityStatus: EngageabilityStatus;
  /** Aantal lopende (ACTIVE) samenwerkingen; > 0 = nu ingezet. */
  activeCollaborations: number;
  /** Vrijkomdatum (laatste ACTIVE-einde) van een nu-ingezette vakmens; `null` als onbekend/vrij. */
  freeDate: Date | null;
  /** Einddatum van een dekkend afwezigheidsvenster (vakantie/verlof); `null` als nu beschikbaar. */
  awayUntil: Date | null;
  credentialCount: number;
  /** Compacte certificaat-waarschuwing (verlopen/aflopend); `null` als er niets speelt. */
  credentialAlert: string | null;
  completeness: number;
  dormancyTier: DormancyTier;
}

const WORK_MODE_LABEL: Record<string, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: "Beschikbaar",
  LIMITED: "Beperkt beschikbaar",
  UNAVAILABLE: "Niet beschikbaar",
};

const ENGAGEABILITY_LABEL: Record<EngageabilityStatus, string> = {
  ACTIEF: "Inzetbaar",
  AANDACHT: "Aandacht nodig",
  INACTIEF: "Nog niet inzetbaar",
};

const DORMANCY_LABEL: Record<DormancyTier, string> = {
  active: "",
  cooling: "Koelt af",
  dormant: "Stilgevallen",
};

/** Zet één roster-rij om naar het CSV-veldenrijtje (in de volgorde van {@link ROSTER_EXPORT_HEADERS}). */
export function rosterExportRow(row: RosterExportRow): string[] {
  return [
    row.name,
    row.headline ?? "",
    row.email,
    row.location ?? "",
    WORK_MODE_LABEL[row.workMode] ?? row.workMode,
    row.hourlyRate != null ? String(row.hourlyRate) : "",
    AVAILABILITY_LABEL[row.availability] ?? row.availability,
    ENGAGEABILITY_LABEL[row.engageabilityStatus],
    // Alleen een positief aantal is informatief; 0 (op de bench) laten we leeg voor een rustige kolom.
    row.activeCollaborations > 0 ? String(row.activeCollaborations) : "",
    row.freeDate ? formatDateShortNl(row.freeDate) : "",
    row.awayUntil ? formatDateShortNl(row.awayUntil) : "",
    String(row.credentialCount),
    row.credentialAlert ?? "",
    String(row.completeness),
    DORMANCY_LABEL[row.dormancyTier],
  ];
}

/** Bouwt de volledige CSV-tekst (kopregel + rijen) voor het bemiddelaar-roster. */
export function rosterCsv(rows: readonly RosterExportRow[]): string {
  return toCsv([[...ROSTER_EXPORT_HEADERS], ...rows.map(rosterExportRow)]);
}
