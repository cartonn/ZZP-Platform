// Bewaarbeleid voor het bewijsstuk achter een certificaat ("gezien + datum" vs. het bestand bewaren).
//
// Waarom: de Autoriteit Persoonsgegevens houdt voor een VOG de lijn aan dat de opdracht-/werkgever
// vaststelt DÁT de verklaring is gezien en op welke datum. Een kopie bewaren vraagt een eigen
// noodzaak; die is er bij dit platform niet zodra de beoordeling klaar is. Een VOG is bovendien een
// strafrechtelijk gegeven (AVG art. 10) — daar past de striktste minimalisatie bij. Voor de overige
// types (diploma, certificaat, verzekering, licentie) blijft het bestand wél nodig: de opdrachtgever
// en de ZZP'er moeten het bewijsstuk kunnen herzien en het onderbouwt een doorlopende geldigheid.
//
// Pure logica, geen I/O — de aanroeper (verificatiequeue, opruimtaak) doet de opslag/DB-mutatie.

import { type CredentialType } from "@/lib/enums";

/**
 * - `"metadata"` — bewaar alleen dat het bewijsstuk is gezien, door wie en wanneer; het bestand
 *   wordt na de beoordeling verwijderd.
 * - `"file"` — bewaar het bestand zoals nu (bewijsstuk blijft opvraagbaar).
 */
export type EvidenceRetention = "metadata" | "file";

/** Reden bij de auditregel van een verwijderd bewijsstuk — één bron voor logboek en export. */
export const EVIDENCE_REMOVAL_REASON = "retentiebeleid VOG: gezien + datum";

/**
 * Env-override voor het VOG-beleid (`CREDENTIAL_EVIDENCE_RETENTION_VOG`). Alleen de exacte waarde
 * `file` schakelt het bewaren van het bestand terug aan; dat is bedoeld voor een uitzonderlijke
 * contractuele noodzaak (bv. een opdrachtgever met een eigen, aantoonbare bewaargrondslag) en moet
 * bewust worden gezet. Elke andere waarde — leeg, onzin, hoofdletters — valt fail-safe terug op
 * `metadata`: bij twijfel bewaren we het minst.
 */
export function parseEvidenceRetentionOverride(raw: string | undefined): EvidenceRetention {
  return raw?.trim() === "file" ? "file" : "metadata";
}

/**
 * Het bewaarbeleid voor het bewijsstuk van dit certificaattype. Alleen VOG valt onder het
 * metadata-beleid; de override geldt uitsluitend voor VOG (een diploma wordt nooit stilzwijgend
 * gewist door een verkeerd gezette env-var).
 *
 * @param raw Ruwe env-waarde; standaard `CREDENTIAL_EVIDENCE_RETENTION_VOG`. Expliciet meegeven
 *            maakt de functie puur testbaar zonder aan `process.env` te sleutelen.
 */
export function evidenceRetentionFor(
  type: CredentialType,
  raw: string | undefined = process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG,
): EvidenceRetention {
  if (type !== "VOG") return "file";
  return parseEvidenceRetentionOverride(raw);
}

/** Moet het bewijsstuk van dit type na de beoordeling uit de opslag verdwijnen? */
export function shouldRemoveEvidenceAfterReview(
  type: CredentialType,
  raw?: string | undefined,
): boolean {
  return (
    evidenceRetentionFor(type, raw ?? process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG) === "metadata"
  );
}
