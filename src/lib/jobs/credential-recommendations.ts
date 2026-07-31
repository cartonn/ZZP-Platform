// Branche-gedreven certificaat-aanbeveling voor het opdrachtformulier (opdrachtgever).
//
// Een opdrachtgever die een opdracht plaatst weet niet altijd wélke bewijsstukken in zijn branche
// gebruikelijk of wettelijk vereist zijn — een zorginstelling die een dienst uitzet vergeet
// makkelijk de VOG of de BIG-registratie, een aannemer het VCA-certificaat. Concurrenten in de
// zorg (Pidz/Zorgwerk) vullen die compliance-eisen voor de klant in. Wij tonen een rustige,
// read-only hint zodra de branche gekozen is: "vaak vereist in <branche>: …". De opdrachtgever
// beslist zelf welke chips hij aanvinkt — dit is guidance, geen automatische eis (server-side
// waarheid blijft de expliciete selectie in het formulier).
//
// Puur en deterministisch: geen I/O, geen DB, geen schemawijziging. De aanbeveling degradeert
// veilig naar `null` voor een onbekende/lege branche (dan verschijnt geen hint).

import { type CredentialType } from "@/lib/enums";

export interface CredentialRecommendation {
  /** Aanbevolen certificaattypes, in weergavevolgorde (meest kenmerkend eerst). */
  types: CredentialType[];
  /** Korte NL-onderbouwing waarom deze in de branche gebruikelijk zijn. */
  reason: string;
}

// Regels op kenmerkende trefwoorden in de branchenaam. Substring-match zodat varianten
// ("Zorg & Welzijn", "Bouw & Techniek") ook raken; de trefwoorden zijn bewust distinctief
// gekozen om vals-positieven te vermijden (geen losse "it"/"ict"-ambiguïteit).
const RULES: ReadonlyArray<{
  keywords: readonly string[];
  recommendation: CredentialRecommendation;
}> = [
  {
    keywords: ["zorg", "welzijn", "vvt", "ggz", "verpleeg", "verzorg"],
    recommendation: {
      types: ["VOG", "DIPLOMA", "LICENSE"],
      reason:
        "Zorgdiensten vragen doorgaans een VOG en een erkend diploma; voor voorbehouden handelingen ook een BIG-registratie (Licentie).",
    },
  },
  {
    keywords: ["bouw", "installa", "techniek", "montage", "elektro"],
    recommendation: {
      types: ["VOG", "CERTIFICATE", "INSURANCE"],
      reason:
        "In de bouw en techniek is vaak een VCA-certificaat en een aansprakelijkheidsverzekering nodig, naast een VOG.",
    },
  },
  {
    keywords: ["logist", "transport", "vervoer", "chauffeur", "koerier"],
    recommendation: {
      types: ["LICENSE", "INSURANCE", "VOG"],
      reason:
        "Transport en logistiek vragen doorgaans een geldig rijbewijs (Licentie) en een verzekering, plus een VOG.",
    },
  },
  {
    keywords: ["ict", "software", "data", "cloud", "developer", "informatica"],
    recommendation: {
      types: ["VOG"],
      reason: "In ICT volstaat meestal een VOG; diploma's en certificaten zijn optioneel bewijs.",
    },
  },
];

/**
 * Geeft de gebruikelijke certificaat-eisen voor een branche terug op basis van de branchenaam, of
 * `null` als de branche leeg/onbekend is (dan wordt geen hint getoond). De match is trefwoord-
 * gebaseerd en case-insensitief; de eerste passende regel wint. De invoer wordt niet gemuteerd.
 */
export function recommendedCredentialsForIndustry(
  industryName: string | null | undefined,
): CredentialRecommendation | null {
  if (!industryName) return null;
  const normalized = industryName.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.recommendation;
    }
  }
  return null;
}
