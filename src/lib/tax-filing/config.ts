// Configuratie voor de aangifte-delegatie. Het partner-belastingkantoor is de feitelijke
// gemachtigde indiener (becon/SBR/PKIoverheid); het platform orchestreert. Geen "AI" in teksten.

/** Versie van de verwerkersovereenkomst tussen platform en klant (voor de audit-trail). */
export const DPA_VERSION = "2026-06";

/** Naam van het aangesloten partner-belastingkantoor (de gemachtigde). Config — geen hardcode-lock. */
export const PARTNER_NAME = process.env.TAX_PARTNER_NAME ?? "het aangesloten belastingkantoor";

/** Officieel kanaal waar de klant een machtiging kan inzien/intrekken (Logius). */
export const LOGIUS_REVOKE_URL = "https://machtigen.digipoort.logius.nl";

/** Disclaimer: het platform is geen gemachtigde; de klant blijft zelf verantwoordelijk. */
export const FILING_DISCLAIMER =
  "Het platform bereidt je aangifte voor en regelt de overdracht; de feitelijke aangifte wordt " +
  "door een aangesloten belastingkantoor gecontroleerd en namens jou ingediend. Je blijft zelf " +
  "verantwoordelijk voor je belastingzaken en kunt de machtiging op elk moment intrekken.";

/** Korte uitleg van de machtigingsvorm per situatie. */
export const MANDATE_EXPLAINER: Record<"DIGID" | "EHERKENNING", string> = {
  DIGID:
    "Als eenmanszaak/zzp'er machtig je het belastingkantoor via DigiD machtigen om namens jou aangifte te doen.",
  EHERKENNING:
    "Via een eHerkenning-ketenmachtiging machtig je het belastingkantoor om namens jou aangifte te doen.",
};
