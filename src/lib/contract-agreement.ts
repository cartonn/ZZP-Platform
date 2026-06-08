// Modelovereenkomst van opdracht (Wet DBA) — deterministische, verklaarbare opbouw van de
// overeenkomsttekst per ModelAgreementType. Eén bron van waarheid voor de PDF én de UI.
//
// HARD: dit is GEEN juridisch advies en GEEN goedgekeurde Belastingdienst-modelovereenkomst.
// Het is een hulpmiddel dat de afspraken vastlegt op basis van de gekozen overeenkomstvorm; de
// bescherming volgt pas als er in de praktijk ook conform wordt gewerkt. De disclaimer (NOTE)
// hoort altijd zichtbaar te zijn (CLAUDE.md regel 1 & 5).

import {
  type ModelAgreementType,
  MODEL_AGREEMENT_LABELS,
  MODEL_AGREEMENT_TYPES,
} from "@/lib/model-agreement";

export interface ModelAgreementArticle {
  heading: string;
  /** Eén of meer alinea's. */
  body: string[];
}

export interface ModelAgreementContentInput {
  agreementType: ModelAgreementType;
  jobTitle: string;
  jobDescription?: string | null;
  freelancerName: string;
  clientName: string;
  /** Reeds opgemaakte weergavestrings (locale-vrij gehouden in deze pure module). */
  rateLabel?: string | null;
  periodLabel: string;
}

export interface ModelAgreementContent {
  title: string;
  type: ModelAgreementType;
  typeLabel: string;
  intro: string;
  articles: ModelAgreementArticle[];
  note: string;
}

export const MODEL_AGREEMENT_DISCLAIMER =
  "Dit document is een hulpmiddel om de afspraken vast te leggen en vormt geen juridisch advies. " +
  "Een modelovereenkomst beschermt alleen tegen schijnzelfstandigheid als er in de praktijk ook " +
  "conform wordt gewerkt. Stem de feitelijke werkwijze af op de gekozen overeenkomstvorm en raadpleeg " +
  "bij twijfel een adviseur.";

/** Het artikel dat specifiek hoort bij de gekozen overeenkomstvorm. */
function typeArticle(type: ModelAgreementType): ModelAgreementArticle {
  switch (type) {
    case "GEEN_WERKGEVERSGEZAG":
      return {
        heading: "Geen werkgeversgezag",
        body: [
          "De opdrachtgever geeft geen leiding aan en houdt geen toezicht op de wijze waarop de " +
            "opdrachtnemer de werkzaamheden uitvoert. De opdrachtnemer bepaalt zelf hoe en wanneer de " +
            "opdracht wordt verricht, voor zover het overeengekomen resultaat dat toelaat.",
          "Aanwijzingen blijven beperkt tot wat noodzakelijk is voor een goede uitvoering van de " +
            "opdracht; zij hebben geen betrekking op de inhoudelijke werkwijze van de opdrachtnemer.",
        ],
      };
    case "VRIJE_VERVANGING":
      return {
        heading: "Vrije vervanging",
        body: [
          "De opdrachtnemer is niet verplicht de werkzaamheden persoonlijk te verrichten en mag zich " +
            "zonder voorafgaande toestemming van de opdrachtgever laten vervangen door een ander die " +
            "voldoet aan de voor de opdracht geldende kwalificatie- en bekwaamheidseisen.",
          "De opdrachtnemer blijft bij vervanging verantwoordelijk voor de nakoming van deze " +
            "overeenkomst en voor het overeengekomen resultaat.",
        ],
      };
    case "TUSSENKOMST":
      return {
        heading: "Tussenkomst",
        body: [
          "De opdracht komt tot stand via tussenkomst van een bemiddelende partij. De opdrachtnemer " +
            "verricht de werkzaamheden als zelfstandig ondernemer en niet in dienstbetrekking, noch tot " +
            "de opdrachtgever noch tot de bemiddelende partij.",
          "De bemiddelende partij oefent geen gezag uit over de inhoudelijke uitvoering van de opdracht.",
        ],
      };
  }
}

/**
 * Bouwt de volledige tekst van de modelovereenkomst op. Deterministisch en verklaarbaar: vaste
 * artikelen plus het artikel dat bij de gekozen overeenkomstvorm hoort.
 */
export function buildModelAgreementContent(
  input: ModelAgreementContentInput,
): ModelAgreementContent {
  const typeLabel = MODEL_AGREEMENT_LABELS[input.agreementType];
  const rateText = input.rateLabel ?? "in onderling overleg vastgesteld";

  const articles: ModelAgreementArticle[] = [
    {
      heading: "Artikel 1 — De opdracht",
      body: [
        `De opdrachtgever verstrekt aan de opdrachtnemer de opdracht "${input.jobTitle}", die de ` +
          "opdrachtnemer als zelfstandige aanvaardt.",
        ...(input.jobDescription && input.jobDescription.trim()
          ? [`Omschrijving van de werkzaamheden: ${input.jobDescription.trim()}`]
          : []),
      ],
    },
    {
      heading: "Artikel 2 — Aard van de overeenkomst",
      body: [
        "Partijen beogen uitdrukkelijk geen arbeidsovereenkomst aan te gaan. De opdrachtnemer verricht " +
          "de werkzaamheden als zelfstandig ondernemer en draagt zelf zorg voor de afdracht van " +
          "verschuldigde belastingen en premies.",
        `Deze overeenkomst is gebaseerd op de overeenkomstvorm "${typeLabel}".`,
      ],
    },
    {
      heading: "Artikel 3 — Duur",
      body: [`De opdracht loopt ${input.periodLabel}.`],
    },
    {
      heading: "Artikel 4 — Vergoeding en facturatie",
      body: [
        `De vergoeding bedraagt ${rateText}. De opdrachtnemer factureert de opdrachtgever rechtstreeks ` +
          "voor de verrichte werkzaamheden, vermeerderd met de wettelijk verschuldigde btw.",
      ],
    },
    typeArticle(input.agreementType),
    {
      heading: "Artikel 6 — Aansprakelijkheid en verzekering",
      body: [
        "De opdrachtnemer is verantwoordelijk voor een deugdelijke uitvoering van de opdracht en draagt " +
          "zelf zorg voor een toereikende beroeps- en bedrijfsaansprakelijkheidsverzekering.",
      ],
    },
    {
      heading: "Artikel 7 — Beëindiging",
      body: [
        "Beide partijen kunnen de overeenkomst tussentijds beëindigen met inachtneming van een redelijke " +
          "opzegtermijn, onverminderd reeds verrichte en te factureren werkzaamheden.",
      ],
    },
    {
      heading: "Artikel 8 — Toepasselijk recht",
      body: ["Op deze overeenkomst is Nederlands recht van toepassing."],
    },
  ];

  return {
    title: "Modelovereenkomst van opdracht",
    type: input.agreementType,
    typeLabel,
    intro:
      `Deze overeenkomst wordt aangegaan tussen ${input.clientName} (opdrachtgever) en ` +
      `${input.freelancerName} (opdrachtnemer), met betrekking tot de hieronder omschreven opdracht.`,
    articles,
    note: MODEL_AGREEMENT_DISCLAIMER,
  };
}

/**
 * Bepaalt het toe te passen overeenkomsttype: de op de samenwerking vastgelegde keuze gaat voor,
 * daarna de op de opdracht vastgelegde keuze, daarna de aanbeveling. Valt altijd terug op een veilig
 * default (GEEN_WERKGEVERSGEZAG) zodat er altijd een ondertekenbare overeenkomst is.
 */
export function resolveAgreementType(
  collaborationType: string | null | undefined,
  jobType: string | null | undefined,
  recommendedType: ModelAgreementType | null | undefined,
): ModelAgreementType {
  const candidates = [collaborationType, jobType, recommendedType];
  for (const c of candidates) {
    if (c && (MODEL_AGREEMENT_TYPES as readonly string[]).includes(c)) {
      return c as ModelAgreementType;
    }
  }
  return "GEEN_WERKGEVERSGEZAG";
}
