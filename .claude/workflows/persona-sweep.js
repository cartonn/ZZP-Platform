export const meta = {
  name: "persona-sweep",
  description:
    "Kritische persona-agents beoordelen de echte schermen (screenshots) per rol en bouwen een gaten-backlog",
  phases: [
    { title: "Kritiek", detail: "een vision-criticus per persona leest de screenshots" },
    { title: "Rechter", detail: "dedup, vals-positieven eruit, bug vs productkeuze, ranking" },
  ],
};

// Vereist: persona-screenshots in e2e/personas/shots/<persona>/ (zie LOOP.md, draai eerst de
// persona-reizen tegen een productie-build via playwright.personas.config.ts).

const PERSONAS = [
  {
    key: "zzper",
    rol: "ZZP'er (zelfstandige zorgprofessional, Sanne)",
    missie:
      "inloggen, dashboard, acties, opdracht zoeken en reageren, reacties, samenwerking + modelovereenkomst, facturen, certificaten, profiel, inzicht/abonnement, berichten",
  },
  {
    key: "opdrachtgever",
    rol: "Opdrachtgever (zorginstelling, Jansen)",
    missie:
      "inloggen, dashboard, opdracht plaatsen en publiceren, kandidaten, samenwerking, prestaties, facturen, inzicht, bedrijfsprofiel",
  },
  {
    key: "franchiser",
    rol: "Franchisenemer (regionale staffing-ondernemer)",
    missie:
      "inloggen, dashboard, opdrachtgevers (+detail), roster (+detail), diensten, samenwerkingen, inzicht (BI), leads, facturatie, instellingen",
  },
  {
    key: "admin",
    rol: "Platformbeheerder (admin)",
    missie:
      "inloggen, dashboard, verificaties, DBA-monitor, helpdesk, franchises, facturatie genereren, statistieken, audit, gebruikers, bewaking",
  },
];

const FINDINGS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    persona: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          screen: { type: "string" },
          severity: { type: "string", enum: ["KRITIEK", "HOOG", "MIDDEN", "LAAG"] },
          kind: { type: "string", enum: ["BUG", "UX", "COPY", "DOODLOPER", "PRODUCTKEUZE"] },
          observation: { type: "string" },
          suggestedFix: { type: "string" },
          confidence: { type: "string", enum: ["hoog", "midden", "laag"] },
        },
        required: [
          "title",
          "screen",
          "severity",
          "kind",
          "observation",
          "suggestedFix",
          "confidence",
        ],
      },
    },
    summary: { type: "string" },
  },
  required: ["persona", "findings", "summary"],
};

phase("Kritiek");
const critiques = await parallel(
  PERSONAS.map(
    (p) => () =>
      agent(
        "Je bent een KRITISCHE gebruiker in de rol: " +
          p.rol +
          ". Je test een Nederlands zorg-ZZP-platform door je echte werk te doen. Je missie: " +
          p.missie +
          ".\n\n" +
          "BEWIJS: map /Users/builder/ZZP-Platform/e2e/personas/shots/" +
          p.key +
          "/ bevat genummerde screenshots (NN-label.png) van elke stap + _log.json (volgorde, url, of de stap lukte). Lees EERST _log.json, daarna elke screenshot in numerieke volgorde (Read kan beelden zien).\n\n" +
          'Beoordeel per scherm: (1) status meteen duidelijk? (2) volgende actie duidelijk/bereikbaar of DOODLOPER? (3) copy correct (NL, geen Engels/jargon/placeholders, nergens "AI")? (4) lege/laad/foutstaten netjes? (5) ontbrekende vertrouwens-/compliance-/match-signalen? (6) logische VOLGORDE? (7) iets kapot/half (afgekapt, overlap, lege kaart)?\n\n' +
          "Meld alleen wat je ECHT ziet. Markeer BUG/UX/COPY/DOODLOPER/PRODUCTKEUZE. Concrete kleine fix per item. Verzin niets; bij twijfel confidence=laag.",
        { label: "kritiek:" + p.key, phase: "Kritiek", schema: FINDINGS_SCHEMA },
      ),
  ),
);
const all = critiques.filter(Boolean);
const flat = all.flatMap((c) =>
  c.findings.map((f) => Object.assign({}, f, { persona: c.persona })),
);
log(flat.length + " ruwe bevindingen over " + all.length + " personas");

phase("Rechter");
const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    confirmed: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          personas: { type: "array", items: { type: "string" } },
          severity: { type: "string", enum: ["KRITIEK", "HOOG", "MIDDEN", "LAAG"] },
          kind: { type: "string", enum: ["BUG", "UX", "COPY", "DOODLOPER"] },
          observation: { type: "string" },
          suggestedFix: { type: "string" },
          rank: { type: "number" },
        },
        required: ["title", "personas", "severity", "kind", "observation", "suggestedFix", "rank"],
      },
    },
    productChoices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { title: { type: "string" }, why: { type: "string" } },
        required: ["title", "why"],
      },
    },
    dropped: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { title: { type: "string" }, reason: { type: "string" } },
        required: ["title", "reason"],
      },
    },
    verdict: { type: "string" },
  },
  required: ["confirmed", "productChoices", "dropped", "verdict"],
};

const judged = await agent(
  "Je bent de kritische RECHTER van een zelf-test-lus op een productie-codebase. Ruwe bevindingen van vier persona-critici hieronder. " +
    "(1) ONTDUBBEL (zelfde gat bij meerdere personas = een item). (2) Gooi vals-positieven/zwakke meldingen weg (naar dropped met reden). " +
    "(3) Scheid ECHTE gaten (confirmed) van bewuste PRODUCTKEUZES (productChoices, niet fixen). (4) Rangschik confirmed op ernst maal centraalheid (rank, lager=eerst). " +
    'LET OP: de sweep hoort tegen een productie-build te draaien; een los "N"-bolletje over de nav is de Next.js dev-indicator (vals-positief) als toch dev is gebruikt.\n\n' +
    "RUWE BEVINDINGEN:\n" +
    JSON.stringify(flat, null, 2),
  { label: "rechter", phase: "Rechter", schema: JUDGE_SCHEMA },
);

return { critiqueCount: flat.length, judged };
