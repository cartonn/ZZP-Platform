export const meta = {
  name: "competitor-deepdive",
  description:
    "Ronde 2 concurrentie-onderzoek: verdiep PIDZ/Bendy + adjacente zorg-ZZP-platformen, synthetiseer principes naar een build/park-backlog",
  phases: [
    { title: "Verdieping", detail: "deep-dive per concurrent (web, openbare bronnen)" },
    { title: "Synthese", detail: "principes → concrete schermen → build/park-backlog" },
  ],
};

const DEEPDIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    competitor: { type: "string" },
    verifiedUrl: { type: "string" },
    whatItIs: {
      type: "string",
      description: "1 zin: wat is het platform echt (na verificatie van de naam tegen de site)",
    },
    teardown: {
      type: "object",
      additionalProperties: false,
      properties: {
        homepage: { type: "string" },
        registratie: { type: "string" },
        zoeken: { type: "string" },
        profiel: { type: "string" },
        opdrachtDetail: { type: "string" },
        applyFlow: { type: "string" },
      },
      required: ["homepage", "registratie", "zoeken", "profiel", "opdrachtDetail", "applyFlow"],
    },
    businessModel: {
      type: "object",
      additionalProperties: false,
      properties: {
        verdienmodel: { type: "string" },
        takeRateFees: {
          type: "string",
          description: "take-rate/fees/abonnementen — bedragen MET bron of expliciet 'schatting'",
        },
        payrollCompliance: { type: "string" },
        franchiseRegioRooster: {
          type: "string",
          description: "franchise/regio/rooster/dossier-kant — de focus van deze ronde",
        },
      },
      required: ["verdienmodel", "takeRateFees", "payrollCompliance", "franchiseRegioRooster"],
    },
    doetBeter: {
      type: "array",
      items: { type: "string" },
      description: "wat zij beter doen dan een generiek zorg-ZZP-platform",
    },
    doetSlechter: { type: "array", items: { type: "string" } },
    bronnen: {
      type: "array",
      items: { type: "string" },
      description: "URLs van geraadpleegde openbare bronnen",
    },
  },
  required: [
    "competitor",
    "verifiedUrl",
    "whatItIs",
    "teardown",
    "businessModel",
    "doetBeter",
    "doetSlechter",
    "bronnen",
  ],
};

const WEB_INSTR =
  "GEREEDSCHAP: je hebt geen web-tools standaard geladen. Laad ze met ToolSearch: roep ToolSearch aan met query 'select:WebSearch,WebFetch' en gebruik daarna WebSearch (zoeken) + WebFetch (pagina's lezen). " +
  "REGELS: alleen OPENBARE bronnen; verifieer de naam EERST tegen de juiste officiële site voordat je conclusies trekt; verzin NOOIT omzet/funding/gebruikersaantallen of fee-bedragen — elk getal krijgt een bron of het label 'schatting'; peildatum = vandaag (juni 2026). Wees concreet en kort.";

phase("Verdieping");
const targets = [
  {
    label: "pidz",
    prompt:
      "Deep-dive concurrent: PIDZ (verifieer eerst https://www.pidz.nl). " +
      WEB_INSTR +
      " Het is een Nederlands zorg-flexwerk/ZZP-bemiddelings- + roosterplatform (VVT/GGZ/GHZ/jeugd), NIET IT. " +
      "FOCUS DEZE RONDE: de franchiser/regio/rooster/dossier-kant — hoe regelt PIDZ regionale bemiddeling, planning/roostering, het ZZP-dossier (BIG/VOG/diploma-verificatie), en de opdrachtgever-kant (zorginstelling). " +
      "Doe de teardown (homepage, registratie/onboarding, zoeken/matching, profiel/dossier, opdracht-/dienst-detail, reageren/inschrijven-flow) en het businessmodel (verdienmodel, take-rate/fees/abonnement, payroll/compliance/Wet-DBA, franchise/regio/rooster). " +
      "Vergelijk expliciet met een platform dat al heeft: verklaarbare matching, trust/verificatie-niveaus, ORT-berekening, DBA-modelovereenkomst, een franchiser-rol met Leads-CRM + opdrachtgevers/afdelingen + alleen-lezen roster-dossier + tenant-facturatie-overzicht.",
  },
  {
    label: "bendy",
    prompt:
      "Deep-dive concurrent: Bendy (verifieer eerst https://www.bendy.nl of de juiste officiële site — het is white-label staffing-/flex-SaaS voor uitzend-/flexbureaus, GEEN eigen marktplaats). " +
      WEB_INSTR +
      " FOCUS DEZE RONDE: de white-label/franchise-/tenant-kant — planning/roostering, urenregistratie, facturatie, documentverificatie, en hoe een bureau zijn eigen merk/portaal voert. " +
      "Doe de teardown (homepage/positionering, hoe een bureau onboardt, plannings-/rooster-UI voor zover publiek zichtbaar, uren/facturatie, document-/compliance-verificatie) en het businessmodel (SaaS-abonnement/seat-pricing/modules, payroll/compliance, white-label/tenant). " +
      "Vergelijk expliciet met onze franchiser-kant (Leads-CRM, opdrachtgevers+afdelingen, alleen-lezen roster-dossier, tenant-facturatie-overzicht, per-tenant data-isolatie).",
  },
  {
    label: "ontdekking-zorg",
    prompt:
      "Ontdek en verdiep TWEE Nederlandse zorg-ZZP-bemiddelings-/rooster-platformen die in ronde 1 NIET zijn gedekt. " +
      "Ronde 1 dekte al: Temper, YoungOnes, Freelance.nl, Hoofdkraan, Upwork, Fiverr, LinkedIn Services, Malt, Toptal, Jellow, Planet Interim, PIDZ, HeadFirst/Striive, Maqqie, Bendy. " +
      "Kandidaten om te verifiëren (kies de 2 meest relevant voor een zorg-ZZP-rooster-platform): Zorgwerk (zorgwerk.nl), ClickWorkr (clickworkr.com), Nedflex, Norah Zorg, Florys, HelloFlex, Floor, Zin in Zorg, Validion. " +
      WEB_INSTR +
      " Verifieer elke naam tegen de echte site; kies er 2; doe per platform de teardown (homepage, registratie, zoeken/matching, profiel/dossier, opdracht-detail, apply/inschrijf-flow) + businessmodel (verdienmodel, take-rate/fees/abonnement, payroll/compliance, franchise/regio/rooster). " +
      "Geef het resultaat voor de MEEST relevante van de twee in het schema; noem de tweede kort in doetBeter/doetSlechter + bronnen.",
  },
];

const deepdives = (
  await parallel(
    targets.map(
      (t) => () =>
        agent(t.prompt, {
          label: "deepdive:" + t.label,
          phase: "Verdieping",
          schema: DEEPDIVE_SCHEMA,
        }),
    ),
  )
).filter(Boolean);
log(deepdives.length + " concurrenten verdiept");

phase("Synthese");
const SYNTH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    perConcurrent: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          competitor: { type: "string" },
          beter: { type: "string" },
          slechter: { type: "string" },
        },
        required: ["competitor", "beter", "slechter"],
      },
    },
    backlog: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          principe: {
            type: "string",
            description: "het PRINCIPE (niet het letterlijke design) dat we leren",
          },
          vanConcurrent: { type: "string" },
          onzeSchermen: {
            type: "array",
            items: { type: "string" },
            description: "concrete ZZP-Platform-routes/schermen die beter kunnen",
          },
          omvang: { type: "string", enum: ["S", "M", "L"] },
          klasse: {
            type: "string",
            enum: ["BOUWEN", "PARKEREN"],
            description:
              "BOUWEN = duidelijke UX/principe-winst; PARKEREN = strategie/positionering/prijs (eigenaar)",
          },
          waarom: { type: "string" },
        },
        required: ["principe", "vanConcurrent", "onzeSchermen", "omvang", "klasse", "waarom"],
      },
    },
    feitcheck: {
      type: "array",
      items: { type: "string" },
      description: "gecorrigeerde/te-labelen claims uit de deep-dives",
    },
    verdict: { type: "string" },
  },
  required: ["perConcurrent", "backlog", "feitcheck", "verdict"],
};

const PRODUCT_CONTEXT =
  "ZZP-Platform (Nederlands zorg-ZZP/freelance-staffing-SaaS; rollen FREELANCER/CLIENT/ADMIN/FRANCHISER). BESTAAT AL: verklaarbare matching met redenen, trust/verificatie-niveaus (VOG/BIG/diploma), ORT-toeslagberekening, DBA-modelovereenkomst + DBA-risicomonitor, no-cure-no-fee-abonnement, de cascade uren→prestatie→factuur, een franchiser-rol met Leads-CRM + opdrachtgevers/afdelingen + alleen-lezen roster-dossier + tenant-facturatie-overzicht (billing staat UIT), academie, ideeënbox, support-helpdesk, week-rooster per samenwerking (weekdays). " +
  "RONDE 1 BOUWDE AL (NIET opnieuw voorstellen): vertrouwens-strip op login/register, beste-match-banner met redenen, no-cure-no-fee-communicatie, verificatie-keurmerk-rij, ORT-foutpreventie-indicator, risk-reversal-blok op opdracht-detail, facet-discovery + resultaattelling + locatie-facet op /opdrachten, acceptatie/grace-venster met auto-akkoord, live activiteits-/liquiditeitssignaal op dashboard. " +
  "HARDE REGELS: geld blijft PENDING (geen echte incasso); geen white-label/tenant-branding zonder eigenaar; geen payroll-tak; geen 'AI' in UI; NL-UI; design-principes vertalen, nooit letterlijk kopiëren. " +
  "Classificeer prijs/positionering/payroll/white-label/factoring/verzekering als PARKEREN.";

const synth = await agent(
  "Je bent de synthese-strateeg van de concurrentie-loop voor ZZP-Platform. Hieronder de deep-dives van ronde 2 (PIDZ, Bendy, + adjacente zorg-ZZP-platformen) als JSON. " +
    "PRODUCTCONTEXT: " +
    PRODUCT_CONTEXT +
    "\n\n" +
    "Lever: (1) per concurrent één zin beter / één zin slechter; (2) een BACKLOG van principes — voor elk: het PRINCIPE (vertaald, niet het design), van welke concurrent, welke CONCRETE ZZP-Platform-schermen/routes beter kunnen, omvang S/M/L, en klasse BOUWEN vs PARKEREN met reden. Focus op NIEUWE inzichten t.o.v. ronde 1 (vooral de franchiser/rooster/dossier-kant). Wees streng: alleen echte, concrete winst; geen vaag advies. " +
    "(3) feitcheck-correcties (claims die je moest labelen/corrigeren). (4) een kort verdict. \n\nDEEP-DIVES:\n" +
    JSON.stringify(deepdives, null, 2),
  { label: "synthese", phase: "Synthese", schema: SYNTH_SCHEMA },
);

return { deepdiveCount: deepdives.length, synth };
