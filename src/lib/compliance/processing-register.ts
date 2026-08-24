// AVG-verwerkingsregister (art. 30 AVG) + bewaarschema voor het ZZP Platform.
// Puur en deterministisch — geen DB, geen I/O, geen Date.now-afhankelijkheid.
// De verwerkingsverantwoordelijke stelt dit register vast en houdt het actueel.
// Geen juridisch advies.

// --- Rechtsgronden (art. 6 AVG) ---------------------------------------------

export type LegalBasis =
  | "TOESTEMMING"
  | "OVEREENKOMST"
  | "WETTELIJKE_VERPLICHTING"
  | "GERECHTVAARDIGD_BELANG";

export const LEGAL_BASES: readonly LegalBasis[] = [
  "TOESTEMMING",
  "OVEREENKOMST",
  "WETTELIJKE_VERPLICHTING",
  "GERECHTVAARDIGD_BELANG",
] as const;

export const LEGAL_BASIS_LABEL: Record<LegalBasis, string> = {
  TOESTEMMING: "Toestemming (art. 6 lid 1a)",
  OVEREENKOMST: "Overeenkomst (art. 6 lid 1b)",
  WETTELIJKE_VERPLICHTING: "Wettelijke verplichting (art. 6 lid 1c)",
  GERECHTVAARDIGD_BELANG: "Gerechtvaardigd belang (art. 6 lid 1f)",
};

// --- Verwerkingsactiviteit ---------------------------------------------------

export interface ProcessingActivity {
  /** Stabiele identificatiesleutel (kebab-case), uniek binnen het register. */
  key: string;
  /** Naam van de verwerking. */
  name: string;
  /** Doel van de verwerking. */
  purpose: string;
  /** Rechtsgrond (art. 6 AVG). */
  legalBasis: LegalBasis;
  /** Categorieën van betrokkenen. */
  dataSubjects: string[];
  /** Categorieën van persoonsgegevens. */
  dataCategories: string[];
  /** Bevat bijzondere (art. 9) of strafrechtelijke (art. 10) persoonsgegevens. */
  sensitive: boolean;
  /** Ontvangers van de persoonsgegevens. */
  recipients: string[];
  /** Bewaartermijn (mensleesbaar). */
  retention: string;
  /** Technische en organisatorische beveiligingsmaatregelen. */
  securityMeasures: string[];
}

export const PROCESSING_REGISTER: readonly ProcessingActivity[] = [
  // 1. Accountbeheer & authenticatie
  {
    key: "accountbeheer-authenticatie",
    name: "Accountbeheer & authenticatie",
    purpose: "Aanmaken, beheren en beveiligen van gebruikersaccounts; inloggen en sessiebeheer.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers", "Beheerders"],
    dataCategories: ["Naam", "E-mailadres", "Wachtwoord-hash", "Rol", "IP-adres", "Sessietokens"],
    sensitive: false,
    recipients: ["Intern platformbeheer"],
    retention: "Tot beëindiging van het account + redelijke afhandeltermijn (max. 30 dagen)",
    securityMeasures: [
      "Wachtwoord-hashing (bcrypt)",
      "Versleutelde opslag",
      "Toegang op rol (RBAC)",
      "Auditlogging",
      "Beperkte bewaartermijn",
    ],
  },

  // 2. ZZP-profiel & vindbaarheid
  {
    key: "zzp-profiel-vindbaarheid",
    name: "ZZP-profiel & vindbaarheid",
    purpose:
      "Opstellen en tonen van het ZZP-profiel zodat opdrachtgevers de ZZP'er kunnen vinden en beoordelen.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["ZZP'ers"],
    dataCategories: [
      "Naam",
      "Profielfoto",
      "Biografie",
      "Vaardigheden",
      "Uurtarief",
      "Zichtbaarheidsinstellingen",
      "Locatie (regio)",
    ],
    sensitive: false,
    recipients: ["Opdrachtgevers (op basis van zichtbaarheidsinstelling)"],
    retention: "Tot beëindiging van het account + redelijke afhandeltermijn (max. 30 dagen)",
    securityMeasures: [
      "Zichtbaarheidscontrole door de ZZP'er zelf",
      "Toegang op rol (RBAC)",
      "Versleutelde opslag",
    ],
  },

  // 3. Bedrijfsprofiel opdrachtgever
  {
    key: "bedrijfsprofiel-opdrachtgever",
    name: "Bedrijfsprofiel opdrachtgever",
    purpose:
      "Beheren van het bedrijfsprofiel van opdrachtgevers voor gebruik op het platform en weergave aan ZZP'ers.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["Opdrachtgevers"],
    dataCategories: [
      "Bedrijfsnaam",
      "Contactpersoon",
      "E-mailadres",
      "KVK-nummer",
      "Branche",
      "Vestigingsadres",
    ],
    sensitive: false,
    recipients: ["ZZP'ers (beperkte weergave)", "Intern platformbeheer"],
    retention: "Tot beëindiging van het account + redelijke afhandeltermijn (max. 30 dagen)",
    securityMeasures: ["Toegang op rol (RBAC)", "Versleutelde opslag", "Auditlogging"],
  },

  // 4. Certificaten & documentverificatie (VOG, diploma's, verzekeringsbewijzen)
  {
    key: "certificaten-documentverificatie",
    name: "Certificaten & documentverificatie",
    purpose:
      "Verifiëren van door ZZP'ers ingediende certificaten, diploma's en screeningen (waaronder VOG) ter borging van betrouwbaarheid en wettelijke eisen.",
    legalBasis: "WETTELIJKE_VERPLICHTING",
    dataSubjects: ["ZZP'ers"],
    dataCategories: [
      "VOG (strafrechtelijke gegevens art. 10 AVG)",
      "Diploma's en certificaten",
      "Verzekeringsbewijzen",
      "Verificatiestatus en -datum",
      "Naam en geboortedatum",
    ],
    sensitive: true,
    recipients: [
      "Bevoegde beheerders (verificatiequeue)",
      "Opdrachtgevers (verificatiestatus — geen ruwe documenten)",
    ],
    retention: "Niet langer dan noodzakelijk voor het verificatiedoel",
    securityMeasures: [
      "Documenten standaard privé",
      "Versleutelde opslag",
      "Toegang op rol (RBAC)",
      "Auditlogging",
      "Beperkte toegang tot bevoegde beheerders",
    ],
  },

  // 5. Externe registerverificatie (DUO-diploma, BIG-register)
  {
    key: "externe-registerverificatie",
    name: "Externe registerverificatie",
    purpose:
      "Verifiëren van diploma's en beroepskwalificaties via externe overheidsregisters (DUO, BIG-register).",
    legalBasis: "WETTELIJKE_VERPLICHTING",
    dataSubjects: ["ZZP'ers"],
    dataCategories: ["Verificatiecode", "Registratienummer", "Naam (voor matchingsdoeleinden)"],
    sensitive: false,
    recipients: ["DUO (Dienst Uitvoering Onderwijs)", "BIG-register"],
    retention: "Verificatieresultaat bewaard zolang het bijbehorende certificaat actief is",
    securityMeasures: [
      "Minimale gegevensoverdracht (dataminimalisatie)",
      "Versleutelde verbinding (TLS)",
      "Auditlogging",
    ],
  },

  // 6. Identiteitsverificatie (iDIN/eIDAS, juridische naam)
  {
    key: "identiteitsverificatie",
    name: "Identiteitsverificatie",
    purpose:
      "Vaststellen van de juridische identiteit van gebruikers ter voorkoming van fraude en naleving van platformeisen.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers"],
    dataCategories: ["Juridische naam", "Geboortedatum", "Verificatiestatus (iDIN/eIDAS)"],
    sensitive: false,
    recipients: ["iDIN-dienstverlener (verwerker)", "Intern platformbeheer"],
    retention:
      "Verificatiestatus bewaard zolang het account actief is; ruwe verificatiegegevens worden niet opgeslagen",
    securityMeasures: [
      "Dataminimalisatie (alleen verificatiestatus bewaard)",
      "Versleutelde opslag",
      "Toegang op rol (RBAC)",
      "Auditlogging",
    ],
  },

  // 7. Opdrachten, reacties & matching
  {
    key: "opdrachten-reacties-matching",
    name: "Opdrachten, reacties & matching",
    purpose:
      "Plaatsen van opdrachten door opdrachtgevers, indienen van reacties door ZZP'ers en ondersteunen van het matchingsproces.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers"],
    dataCategories: [
      "Opdrachtomschrijving",
      "Vereiste vaardigheden en certificaten",
      "Tarief en beschikbaarheid",
      "Reactie-inhoud en motivatie",
      "Matchingsuitslag",
    ],
    sensitive: false,
    recipients: [
      "Opdrachtgevers (reacties van ZZP'ers)",
      "ZZP'ers (opdrachten van opdrachtgevers)",
    ],
    retention:
      "Tot 4 weken na afronding van de selectieprocedure (automatisch afgedwongen door de geplande retentie-sweep run-all → application-retention, die afgewezen/ingetrokken reacties ouder dan het venster hard wist), tenzij toestemming voor langere bewaring",
    securityMeasures: ["Toegang op rol (RBAC)", "Versleutelde opslag", "Auditlogging"],
  },

  // 8. Berichten tussen partijen
  {
    key: "berichten-communicatie",
    name: "Berichten & communicatie",
    purpose:
      "Faciliteren van beveiligde communicatie tussen ZZP'ers en opdrachtgevers via het platformberichtencentrum.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers"],
    dataCategories: ["Berichtinhoud", "Afzender en ontvanger", "Tijdstempel"],
    sensitive: false,
    recipients: ["Betrokken ZZP'er en opdrachtgever"],
    retention:
      "Duur van de samenwerking + redelijke termijn (max. 12 maanden na beëindiging; automatisch afgedwongen door de geplande retentie-sweep run-all → message-retention, die berichten ouder dan het venster hard wist, mits het gesprek niet aan een lopende samenwerking (PROPOSED/ACTIVE) hangt)",
    securityMeasures: [
      "Toegang beperkt tot gespreksdeelnemers",
      "Versleutelde opslag",
      "Toegang op rol (RBAC)",
    ],
  },

  // 8b. Support-communicatie (helpdesk)
  {
    key: "support-communicatie",
    name: "Support-communicatie",
    purpose:
      "Behandelen van helpdesk-/supportverzoeken van gebruikers en het verbeteren van de dienstverlening.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers", "Bemiddelaars", "Beheerders"],
    dataCategories: ["Onderwerp", "Berichtinhoud", "Afzender", "Tijdstempel", "Ticketstatus"],
    sensitive: false,
    recipients: ["Intern platformbeheer (helpdesk)"],
    retention:
      "Tot afhandeling + redelijke termijn (max. 12 maanden na afhandeling; automatisch afgedwongen door de geplande retentie-sweep run-all → support-retention, die afgehandelde (RESOLVED) tickets ouder dan het venster hard wist, geankerd op resolvedAt — een nog-open ticket blijft staan; verwijdering cascadeert naar de gekoppelde berichten)",
    securityMeasures: [
      "Toegang beperkt tot de aanvrager en helpdeskbeheer",
      "Versleutelde opslag",
      "Toegang op rol (RBAC)",
      "Auditlogging",
      "Beperkte bewaartermijn",
    ],
  },

  // 9. Samenwerkingen & Wet-DBA-beoordeling
  {
    key: "samenwerkingen-wet-dba",
    name: "Samenwerkingen & Wet-DBA-beoordeling",
    purpose:
      "Vastleggen en beheren van samenwerkingsovereenkomsten, inclusief beoordeling van Wet DBA-indicatoren ter informatie van partijen.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers"],
    dataCategories: [
      "Contractgegevens en -status",
      "Modelovereenkomsttype",
      "DBA-risiconiveau en indicatoren",
      "Start- en einddatum",
    ],
    sensitive: false,
    recipients: ["Betrokken ZZP'er en opdrachtgever", "Intern platformbeheer"],
    retention: "Duur van de samenwerking + 7 jaar (fiscale bewaarplicht; contractgegevens)",
    securityMeasures: ["Toegang op rol (RBAC)", "Versleutelde opslag", "Auditlogging"],
  },

  // 10. Facturatie & financiële administratie
  {
    key: "facturatie-financiele-administratie",
    name: "Facturatie & financiële administratie",
    purpose:
      "Opstellen, verwerken en archiveren van facturen en financiële administratie ten behoeve van de fiscale en wettelijke bewaarplicht.",
    legalBasis: "WETTELIJKE_VERPLICHTING",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers"],
    dataCategories: [
      "Factuurnummer en -bedrag",
      "BTW-gegevens",
      "Bankgegevens (IBAN)",
      "Naam en adres",
      "KVK- en BTW-nummer",
      "Betalingsstatus",
    ],
    sensitive: false,
    recipients: [
      "Belastingdienst (op verzoek of wettelijke verplichting)",
      "Intern platformbeheer",
    ],
    retention: "7 jaar (fiscale bewaarplicht, art. 52 AWR)",
    securityMeasures: [
      "Versleutelde opslag",
      "Toegang op rol (RBAC)",
      "Auditlogging",
      "Beperkte toegang tot bevoegde beheerders",
    ],
  },

  // 11. Belastingaangifte via gemachtigde (fiscaal dossier)
  {
    key: "belastingaangifte-gemachtigde",
    name: "Belastingaangifte via gemachtigde (IB/BTW)",
    purpose:
      "Het namens de ZZP'er (laten) indienen van inkomsten- en omzetbelastingaangiften bij de Belastingdienst via een aangesloten belastingkantoor (gemachtigde), op basis van uitdrukkelijke, granulaire toestemming en machtiging.",
    legalBasis: "TOESTEMMING",
    dataSubjects: ["ZZP'ers"],
    dataCategories: [
      "Belastingjaar en aangiftesoort (IB/BTW)",
      "Naam gemachtigde belastingkantoor",
      "Machtigingsvorm (DigiD/eHerkenning)",
      "Geaccepteerde verwerkersovereenkomst-versie",
      "Toestemmings- en machtigingsmomenten",
      "Concept-/aanslagbedragen en indieningsreferentie",
    ],
    sensitive: false,
    recipients: [
      "Aangesloten belastingkantoor (gemachtigde, verwerker)",
      "Belastingdienst (via Digipoort/SBR)",
      "Intern platformbeheer",
    ],
    retention: "7 jaar (fiscale bewaarplicht, art. 52 AWR)",
    securityMeasures: [
      "Versleutelde opslag",
      "Toegang op rol (RBAC)",
      "Auditlogging",
      "Granulaire, losse toestemming (niet voorgevinkt)",
      "Verwerkersovereenkomst met de gemachtigde",
    ],
  },

  // 12. Notificaties & e-mail
  {
    key: "notificaties-email",
    name: "Notificaties & e-mail",
    purpose:
      "Versturen van platformmeldingen en transactionele e-mails (verificatieuitslagen, statusupdates, herinneringen) ter ondersteuning van de dienstverlening.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers", "Beheerders"],
    dataCategories: ["E-mailadres", "Naam", "Notificatietype en -inhoud"],
    sensitive: false,
    recipients: [
      "E-maildienstverlener (verwerker) — bij EMAIL_DRIVER=resend: Resend (HTTP-API), of " +
        "EMAIL_DRIVER=postmark: Postmark (HTTP-API), mogelijk buiten de EER; of EMAIL_DRIVER=ses: " +
        "Amazon SES (HTTP-API, EU-datalocatie bij een EU-regio zoals eu-west-1/eu-central-1); " +
        "doorgifte buiten de EER alleen met verwerkersovereenkomst + passende waarborgen (SCC's)",
    ],
    retention:
      "Notificatiehistorie max. 6 maanden (automatisch afgedwongen door de geplande retentie-sweep run-all → notification-retention, die notificaties ouder dan het venster hard wist); e-mailadressen bewaard zolang het account actief is",
    securityMeasures: [
      "Verwerkerovereenkomst met e-maildienstverlener",
      "Bij doorgifte buiten de EER: modelcontractbepalingen (SCC's) en waar mogelijk EU-regio",
      "Versleutelde verbinding (TLS)",
      "Dataminimalisatie in e-mailinhoud",
    ],
  },

  // 12. Beveiliging, auditlog & misbruikpreventie
  {
    key: "beveiliging-auditlog-misbruikpreventie",
    name: "Beveiliging, auditlog & misbruikpreventie",
    purpose:
      "Detecteren en voorkomen van ongeautoriseerde toegang, misbruik en fraude; vastleggen van beveiligingsrelevante handelingen.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers", "Beheerders"],
    dataCategories: [
      "IP-adres",
      "User-agent (browserkenmerk)",
      "Tijdstempel van handelingen",
      "Inlogpogingen (succesvol/mislukt)",
      "Auditgebeurtenissen (wie, wat, wanneer)",
      "Beveiligingsincidenten (afgeleide signalen, bv. inlog-burst/reset-flood, incl. bron-IP)",
    ],
    sensitive: false,
    recipients: ["Intern platformbeheer (beveiligingsteam)"],
    retention:
      "Auditlogboek: 12 maanden. Beveiligingsincidenten: het incident blijft als signaal bewaard, maar het bron-IP wordt na 90 dagen automatisch geredigeerd uit álle kolommen (evidence, samenvatting én de dedupe-sleutel) en uit de afgeleide kopieën (auditregel-entityId, admin-notificatie)",
    securityMeasures: [
      "Auditlogging",
      "Toegang op rol (RBAC)",
      "Versleutelde opslag",
      "Beperkte bewaartermijn",
      "Automatische IP-redactie op oude beveiligingsincidenten incl. afgeleide kopieën (run-all → health-incident-retention)",
    ],
  },

  // 13. Abonnementen & betaling
  {
    key: "abonnementen-betaling",
    name: "Abonnementen & betaling",
    purpose:
      "Beheren van platformabonnementen en verwerken van betalingen voor toegang tot betaalde functionaliteiten.",
    legalBasis: "OVEREENKOMST",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers"],
    dataCategories: ["Abonnementstype en -status", "Betalingsreferentie", "Facturatiegegevens"],
    sensitive: false,
    recipients: ["Betaaldienstverlener (verwerker, toekomstig)", "Intern platformbeheer"],
    retention: "7 jaar (fiscale bewaarplicht, art. 52 AWR)",
    securityMeasures: [
      "Verwerkerovereenkomst met betaaldienstverlener",
      "Geen opslag van volledige betaalkaartgegevens op het platform",
      "Versleutelde opslag",
      "Auditlogging",
    ],
  },

  // 14. Markttarief-indicatie (geanonimiseerd) — grondslag bevestigd door eigenaar 15-6-2026
  {
    key: "markttarief-indicatie",
    name: "Markttarief-indicatie (geanonimiseerd)",
    purpose:
      "Tonen van een geanonimiseerde markttariefband (mediaan en 25e/75e percentiel) ter ondersteuning van eerlijke, marktconforme tariefstelling — aan opdrachtgevers op het opdracht-formulier én als tarief-diagnose op de eigen opdrachtenlijst (de geaggregeerde mediaan bij een koud lopende opdracht die onder de markt biedt), en aan ZZP'ers op het eigen profiel.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["ZZP'ers"],
    dataCategories: [
      "Uurtarief — uitsluitend geaggregeerd (mediaan, 25e/75e percentiel); nooit een individueel tarief",
      "Branche (uitsluitend voor de steekproefselectie)",
    ],
    sensitive: false,
    recipients: [
      "Opdrachtgevers (geaggregeerde band op het opdracht-formulier)",
      "Opdrachtgevers (geaggregeerde mediaan als tarief-diagnose op de eigen opdrachtenlijst bij een koud lopende opdracht)",
      "ZZP'ers (eigen marktpositie op het profiel)",
    ],
    retention:
      "Niet opgeslagen — de band wordt live berekend uit actuele profielen; geen aparte bewaartermijn",
    securityMeasures: [
      "k-anonimiteit: minimaal 10 profielen vereist (MARKET_RATE_MIN_SAMPLE) vóór weergave",
      "Uitsluitend geaggregeerde statistieken verlaten de server — geen individueel tarief, naam of identificator",
      "Verplichte disclaimer bij weergave",
      "Toegang op rol (RBAC)",
    ],
  },

  // 15. Lead-acquisitie (bemiddelaar) — prospect-PII van externe opdrachtgevers zonder platform-account
  {
    key: "lead-acquisitie-bemiddelaar",
    name: "Lead-acquisitie (bemiddelaar)",
    purpose:
      "Vastleggen en opvolgen van acquisitie-leads (potentiële opdrachtgevers) door een bemiddelaar/franchise, inclusief een contactlogboek, zodat de bemiddelaar zijn verkoopproces kan voeren.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["Contactpersonen van potentiële opdrachtgevers (prospects)"],
    dataCategories: [
      "Organisatienaam",
      "Naam contactpersoon",
      "E-mailadres",
      "Telefoonnummer",
      "Vrije notities & contactlogboek",
    ],
    sensitive: false,
    recipients: ["Betreffende bemiddelaar/franchise (tenant-geïsoleerd)", "Intern platformbeheer"],
    retention:
      "Tot de lead klant wordt (dan geldt accountbeheer) of afvalt (KLANT/NO_DEAL) + 12 maanden; daarna automatisch gewist. Op verzoek eerder gewist (art. 17). Ook handmatig wisbaar via de bemiddelaar (deleteLead).",
    securityMeasures: [
      "Strikte tenant-isolatie (assertSameTenant) — geen cross-tenant inzage",
      "Toegang op rol (RBAC): alleen de eigen FRANCHISER",
      "Auditlogging (LEAD_CREATED / LEAD_STATUS_SET / LEAD_DELETED / LEADS_PRUNED)",
      "Definitief wis-pad incl. contactlogboek (cascade) — recht op vergetelheid",
      "Automatische retentie-sweep (run-all → lead-retention) — dwingt het 12-maandenvenster af (art. 5(1)(e))",
    ],
  },

  // 16. Betaalgedrag-reputatie (geaggregeerd) — betaaltiming-signaal per opdrachtgever
  {
    key: "betaalgedrag-reputatie",
    name: "Betaalgedrag-reputatie (geaggregeerd)",
    purpose:
      "Tonen van een geaggregeerd betaalgedrag-signaal per opdrachtgever (gemiddeld aantal dagen tot betaling en het percentage op-tijd betaalde facturen) zodat een ZZP'er weet hoe snel een opdrachtgever doorgaans betaalt vóór hij een reactie plaatst, en zodat de opdrachtgever zijn eigen betaalreputatie kan spiegelen.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["Opdrachtgevers (incl. eenmanszaken die natuurlijke persoon zijn)"],
    dataCategories: [
      "Betaaltiming — uitsluitend geaggregeerd (gemiddeld aantal dagen tot betaling, percentage op-tijd); nooit een individuele factuur of factuurbedrag",
    ],
    sensitive: false,
    recipients: [
      "ZZP'ers (geaggregeerd signaal op de browse-opdrachtenlijst en de opdracht-detailpagina)",
      "De opdrachtgever zelf (eigen reputatie-spiegel op /verplichtingen)",
    ],
    retention:
      "Niet opgeslagen — het signaal wordt live berekend uit de eigen betaalde facturen; geen aparte bewaartermijn",
    securityMeasures: [
      "Minimale steekproefvloer (PAYMENT_MIN_SAMPLE_SIZE) vóór weergave — onder de drempel is de toon 'onbekend'",
      "Uitsluitend geaggregeerde statistieken verlaten de server — geen individuele factuur, bedrag of datum",
      "Query begrensd op de eigen betaalde facturen van de opdrachtgever (geen cross-party factuurdata)",
      "Toegang op rol (RBAC); browse-scope via visibleJobsWhere(actor)",
    ],
  },

  // 17. Opdrachtgever-betrouwbaarheidssignalen (geaggregeerd) — annulerings- en reactiegedrag
  {
    key: "opdrachtgever-betrouwbaarheidssignalen",
    name: "Opdrachtgever-betrouwbaarheidssignalen (geaggregeerd)",
    purpose:
      "Tonen van geaggregeerde betrouwbaarheidssignalen per opdrachtgever (annuleringsgedrag en reactiebereidheid) zodat een ZZP'er vóór het plaatsen van een reactie weet hoe betrouwbaar een opdrachtgever afspraken nakomt en of hij binnengekomen reacties oppakt, en zodat de opdrachtgever zijn eigen betrouwbaarheid kan spiegelen.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["Opdrachtgevers (incl. eenmanszaken die natuurlijke persoon zijn)"],
    dataCategories: [
      "Annulerings- en reactiebereidheid — uitsluitend geaggregeerd (annuleringspercentage, last-minute-telling, percentage opgepakte reacties); nooit een individuele samenwerking of een reactie van een andere partij",
    ],
    sensitive: false,
    recipients: [
      "ZZP'ers (geaggregeerd signaal op de opdracht-detailpagina en de reactiespagina)",
      "De opdrachtgever zelf (eigen betrouwbaarheids-spiegel)",
    ],
    retention:
      "Niet opgeslagen — de signalen worden live berekend uit de eigen afgewikkelde samenwerkingen en binnengekomen reacties; geen aparte bewaartermijn",
    securityMeasures: [
      "Minimale steekproefvloer (MIN_SAMPLE_SIZE) vóór weergave — onder de drempel is de toon 'onbekend' en verschijnt geen signaal",
      "Uitsluitend geaggregeerde statistieken verlaten de server — geen individuele samenwerking, reactie of tegenpartij",
      "Alleen door de opdrachtgever zelf gestarte annuleringen tellen mee (attributie); annuleringen door de ZZP'er blijven buiten teller én noemer",
      "Toegang op rol (RBAC)",
    ],
  },

  // 18. Leverbetrouwbaarheid ZZP'er (geaggregeerd) — first-time-right van goedgekeurde prestaties
  {
    key: "leverbetrouwbaarheid-zzp",
    name: "Leverbetrouwbaarheid ZZP'er (geaggregeerd)",
    purpose:
      "Tonen van een geaggregeerd leverbetrouwbaarheidssignaal per ZZP'er (percentage in één keer goedgekeurde prestaties en de gemiddelde doorlooptijd) zodat een opdrachtgever bij het beoordelen en vergelijken van kandidaten weet hoe betrouwbaar de ZZP'er oplevert, en zodat de ZZP'er zijn eigen prestatie kan spiegelen.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["ZZP'ers (natuurlijke personen)"],
    dataCategories: [
      "Leverbetrouwbaarheid — uitsluitend geaggregeerd (percentage in één keer goedgekeurd, aantal correcties, gemiddelde doorlooptijd indienen→goedkeuren, aantal afgeronde samenwerkingen); nooit de inhoud van een individuele prestatie",
    ],
    sensitive: false,
    recipients: [
      "Opdrachtgevers (geaggregeerd signaal op de kandidaten-, vergelijk- en inzichtpagina)",
      "De ZZP'er zelf (eigen prestatie-spiegel)",
    ],
    retention:
      "Niet opgeslagen — het signaal wordt live berekend uit de goedgekeurde prestaties en afgeronde samenwerkingen; geen aparte bewaartermijn",
    securityMeasures: [
      "Minimale steekproefvloer (DELIVERY_MIN_SAMPLE) vóór weergave — onder de drempel toont het signaal 'te weinig gegevens' en verbergt het zich",
      "Uitsluitend geaggregeerde statistieken verlaten de server — geen individuele prestatie-inhoud of -omschrijving",
      "Toegang op rol (RBAC)",
    ],
  },

  // 19. No-show-melding & governance (opdrachtgever/bemiddelaar meldt een gemiste dienst)
  {
    key: "no-show-melding-governance",
    name: "No-show-melding & governance",
    purpose:
      "Vastleggen en beoordelen van meldingen dat een ZZP'er een geboekte dienst heeft gemist, zodat een beheerder een oordeel kan vellen (gerechtvaardigd/ongerechtvaardigd) en de betrouwbaarheid binnen het platform kan worden geborgd en geschillen kunnen worden beslecht.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["ZZP'ers (natuurlijke personen)", "Melders (opdrachtgever of bemiddelaar)"],
    dataCategories: [
      "Reden van de melding — vrije tekst zoals opgegeven door de melder; kan onbedoeld een gezondheids-/incapaciteitsreden bevatten (bijzondere gegevens art. 9 AVG)",
      "Datum van de gemiste dienst",
      "Oordeel van de beheerder en toelichting",
      "Identiteit van melder en beoordelend beheerder",
    ],
    sensitive: true,
    recipients: [
      "Bevoegde beheerders (no-show-queue en oordeel)",
      "De melder (eigen melding en de uitkomst)",
    ],
    retention:
      "Gekoppeld aan de samenwerking; niet langer dan noodzakelijk voor governance en geschillenbeslechting, daarna verwijderen/anonimiseren",
    securityMeasures: [
      "Toegang op rol (RBAC) — melden beperkt tot de betrokken opdrachtgever/bemiddelaar, oordeel tot bevoegde beheerders",
      "Auditlogging van melding en oordeel",
      "Expliciete statusovergangen (PENDING → JUSTIFIED/UNJUSTIFIED)",
    ],
  },

  // 20. Reistijd-routing & geocoding (externe verwerker Geoapify) — locatie-PII naar derde
  {
    key: "reistijd-routing",
    name: "Reistijd-routing & geocoding (Geoapify)",
    purpose:
      "Berekenen van de reële reistijd/afstand tussen de locatie van een ZZP'er en die van een opdracht, ter ondersteuning van locatiegebaseerde matching. De locatie-omschrijvingen worden naar de externe provider Geoapify gestuurd (geocoding + routing) en het resultaat wordt met een korte TTL gecachet zodat matching niet onnodig API-credits verbruikt.",
    legalBasis: "GERECHTVAARDIGD_BELANG",
    dataSubjects: ["ZZP'ers", "Opdrachtgevers"],
    dataCategories: [
      "Locatie-omschrijving/plaatsnaam (ZZP'er en opdracht) — als platte-tekst zoekterm naar de provider gestuurd en gecachet",
      "Afgeleide geocoördinaten (lat/lon)",
      "Berekende reistijd en -afstand",
    ],
    sensitive: false,
    recipients: [
      "Geoapify (verwerker, routing/geocoding) — HTTP-API, mogelijk buiten de EER; doorgifte alleen met verwerkersovereenkomst + passende waarborgen (SCC's)",
      "Intern platformbeheer",
    ],
    retention:
      "Cache met korte TTL: geocode max. 180 dagen, route max. 30 dagen. Verlopen rijen worden fysiek verwijderd door een geplande retentie-sweep (run-all → routing-cache-retention) die de opslagbeperking (art. 5(1)(e)) afdwingt; staat standaard inert zonder provider/API-key.",
    securityMeasures: [
      "Provider standaard UIT (offline-fallback zonder API-key); geen locatie verlaat de server zonder expliciete configuratie",
      "Versleutelde verbinding (TLS) naar de provider",
      "Bij doorgifte buiten de EER: modelcontractbepalingen (SCC's)",
      "Korte TTL + automatische fysieke verwijdering van verlopen cacherijen (run-all → routing-cache-retention)",
      "Auditlogging van de retentie-sweep (ROUTING_CACHE_PRUNED) zonder PII",
    ],
  },
] as const;

// --- Bewaarschema ------------------------------------------------------------

export interface RetentionRule {
  /** Stabiele identificatiesleutel, uniek binnen het schema. */
  key: string;
  /** Gegevenscategorie waarop de regel van toepassing is. */
  category: string;
  /** Bewaartermijn (mensleesbaar). */
  period: string;
  /** Grondslag of reden voor de bewaartermijn. */
  rationale: string;
}

export const RETENTION_SCHEDULE: readonly RetentionRule[] = [
  {
    key: "financiele-administratie-facturen",
    category: "Financiële administratie & facturen",
    period: "7 jaar",
    rationale: "Fiscale bewaarplicht (art. 52 AWR)",
  },
  {
    key: "accountgegevens",
    category: "Accountgegevens",
    period: "Tot beëindiging van het account + redelijke afhandeltermijn",
    rationale:
      "Noodzakelijk voor uitvoering van de overeenkomst; na beëindiging geen grondslag meer",
  },
  {
    key: "gevoelige-documenten",
    category: "Gevoelige documenten (VOG, diploma's, certificaten)",
    period: "Niet langer dan noodzakelijk voor het verificatiedoel",
    rationale:
      "Dataminimalisatiebeginsel (art. 5 lid 1e AVG); bijzondere en strafrechtelijke gegevens vereisen extra terughoudendheid",
  },
  {
    key: "auditlog-beveiligingslogboeken",
    category: "Auditlog & beveiligingslogboeken",
    period:
      "Auditlog: 12 maanden. Beveiligingsincidenten: bron-IP automatisch geredigeerd na 90 dagen (het incidentsignaal zelf blijft)",
    rationale:
      "Gerechtvaardigd belang (beveiliging en fraudepreventie); langer bewaren staat niet in verhouding tot het doel. Het IP-adres op een beveiligingsincident (persoonsgegeven) wordt na het onderzoeksvenster automatisch geredigeerd uit álle kolommen (incl. de dedupe-sleutel) én de afgeleide auditregel/notificatie door een geplande sweep (run-all → health-incident-retention; art. 5(1)(c)/(e))",
  },
  {
    key: "berichten",
    category: "Berichten tussen partijen",
    period: "Duur van de samenwerking + redelijke termijn (max. 12 maanden na beëindiging)",
    rationale:
      "Noodzakelijk voor de uitvoering van de overeenkomst en mogelijke geschillenbeslechting; het bewaarvenster (art. 5(1)(e)) wordt automatisch afgedwongen door een geplande retentie-sweep (run-all → message-retention) die berichten ouder dan het venster hard wist, mits het gesprek niet aan een lopende samenwerking (PROPOSED/ACTIVE) hangt",
  },
  {
    key: "reacties-sollicitaties",
    category: "Reacties & sollicitaties",
    period: "Tot 4 weken na afronding van de selectieprocedure, tenzij toestemming voor langer",
    rationale:
      "AVG-richtlijn voor sollicitatiegegevens; daarna geen legitiem doel meer. Een reactie draagt vrije-tekst-PII in motivatie/interne notitie; het 4-wekenvenster (art. 5(1)(e)) wordt automatisch afgedwongen door een geplande retentie-sweep (run-all → application-retention) die terminale, niet-geaccepteerde reacties (REJECTED/WITHDRAWN, zonder samenwerking) ouder dan het venster hard wist",
  },
  {
    key: "sessies-tokens",
    category: "Sessies & tokens",
    period: "Kortlevend; verloopt automatisch",
    rationale:
      "Beveiligingsbeginsel: sessies hebben een korte levensduur en verlopen automatisch na inactiviteit of afmelding",
  },
  {
    key: "acquisitie-leads",
    category: "Acquisitie-leads (bemiddelaar) & contactlogboek",
    period:
      "Tot conversie naar klant of afvallen + max. 12 maanden; eerder wisbaar op verzoek van de betrokkene",
    rationale:
      "Gerechtvaardigd belang (acquisitie); na afronding van het verkoopproces vervalt de grondslag. Het 12-maandenvenster (art. 5(1)(e)) wordt automatisch afgedwongen door een geplande retentie-sweep (run-all → lead-retention) die beslíste leads (KLANT/NO_DEAL) mét contactlogboek wist; recht op wissen (art. 17) daarnaast direct via het handmatige wis-pad (deleteLead)",
  },
  {
    key: "no-show-meldingen",
    category: "No-show-meldingen & governance (reden, oordeel)",
    period:
      "Gekoppeld aan de samenwerking; niet langer dan noodzakelijk voor governance en geschillenbeslechting",
    rationale:
      "Gerechtvaardigd belang (betrouwbaarheidsgovernance en geschillenbeslechting). De vrije-tekstreden kan bijzondere gegevens (art. 9) bevatten en vereist daarom extra terughoudendheid en tijdige verwijdering/anonimisering",
  },
  {
    key: "notificaties-meldingen",
    category: "Notificatiehistorie (platformmeldingen)",
    period: "Max. 6 maanden; daarna automatisch gewist",
    rationale:
      "Gerechtvaardigd belang (dienstverlening/attendering); na het venster vervalt de noodzaak. Een notificatie draagt PII in titel/inhoud (bv. naam van de tegenpartij, bedragen, statusupdates); het 6-maandenvenster (art. 5(1)(e)) wordt automatisch afgedwongen door een geplande retentie-sweep (run-all → notification-retention) die notificaties met createdAt vóór de afkapdatum hard wist, ongeacht lees-/digest-/push-status",
  },
  {
    key: "support-communicatie",
    category: "Support-communicatie (helpdesk-tickets)",
    period:
      "Tot afhandeling + redelijke termijn (max. 12 maanden na afhandeling); daarna automatisch gewist",
    rationale:
      "Gerechtvaardigd belang (klantondersteuning en dienstverbetering); na afhandeling vervalt de noodzaak. Een support-ticket draagt vrije-tekst-PII in het onderwerp en elk bericht in de body (de aanvrager beschrijft z'n probleem); het venster (art. 5(1)(e)) wordt automatisch afgedwongen door een geplande retentie-sweep (run-all → support-retention) die afgehandelde (RESOLVED) tickets ouder dan het venster hard wist, geankerd op het afhandelmoment (resolvedAt) — een nog-open ticket blijft staan; verwijdering cascadeert naar de gekoppelde berichten",
  },
] as const;

// --- Samenvatting & filterfuncties ------------------------------------------

export interface RegisterSummary {
  /** Totaal aantal verwerkingsactiviteiten. */
  total: number;
  /** Uitsplitsing per rechtsgrond (alle vier sleutels altijd aanwezig, 0 indien geen activiteit). */
  byLegalBasis: Record<LegalBasis, number>;
  /** Aantal verwerkingen met bijzondere of strafrechtelijke persoonsgegevens. */
  sensitiveCount: number;
}

/**
 * Maakt een samenvatting van het verwerkingsregister.
 * Zonder argument: samenvat over PROCESSING_REGISTER.
 * Met argument: samenvat over de meegegeven lijst.
 */
export function summarizeRegister(activities?: readonly ProcessingActivity[]): RegisterSummary {
  const list = activities ?? PROCESSING_REGISTER;

  const byLegalBasis: Record<LegalBasis, number> = {
    TOESTEMMING: 0,
    OVEREENKOMST: 0,
    WETTELIJKE_VERPLICHTING: 0,
    GERECHTVAARDIGD_BELANG: 0,
  };

  let sensitiveCount = 0;

  for (const activity of list) {
    byLegalBasis[activity.legalBasis] += 1;
    if (activity.sensitive) {
      sensitiveCount += 1;
    }
  }

  return {
    total: list.length,
    byLegalBasis,
    sensitiveCount,
  };
}

/**
 * Filtert verwerkingsactiviteiten op rechtsgrond.
 * basis === null → ongefilterde kopie van de invoer; anders alleen activiteiten met die rechtsgrond.
 * Muteert de inputlijst niet.
 */
export function filterByLegalBasis(
  activities: readonly ProcessingActivity[],
  basis: LegalBasis | null,
): ProcessingActivity[] {
  if (basis === null) {
    return [...activities];
  }
  return activities.filter((a) => a.legalBasis === basis);
}

// --- Disclaimer -------------------------------------------------------------

/**
 * Verplichte disclaimer bij weergave van het verwerkingsregister.
 * Dit register is een hulpmiddel/concept; de verwerkingsverantwoordelijke stelt het vast en
 * houdt het actueel. Het vormt geen juridisch advies.
 */
export const PROCESSING_REGISTER_DISCLAIMER: string =
  "Dit register is een hulpmiddel ter ondersteuning van de naleving van art. 30 AVG. " +
  "De verwerkingsverantwoordelijke stelt het register vast, controleert de juistheid en " +
  "houdt het actueel. Dit document vormt geen juridisch advies.";
