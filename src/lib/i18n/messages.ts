import { type Locale } from "@/lib/i18n/config";

// Vertaalwoordenboek per bron-string (NL → EN). We vertalen op de Nederlandse brontekst i.p.v.
// op aparte sleutels: dat houdt de bestaande code (nav.ts, app-shell) ongemoeid — we vertalen
// op het render-moment. Ontbreekt een vertaling, dan valt t() terug op de NL-brontekst (nooit
// een lege of kapotte UI). Dit is de fundering; per increment groeit de dekking mee.

const EN: Record<string, string> = {
  // --- Navigatie (zijbalk-labels) ---
  Dashboard: "Dashboard",
  Acties: "Actions",
  Inzicht: "Insights",
  Opdrachten: "Assignments",
  "Mijn opdrachten": "My assignments",
  Rooster: "Schedule",
  "Mijn reacties": "My applications",
  Opgeslagen: "Saved",
  Samenwerkingen: "Collaborations",
  Berichten: "Messages",
  "Mijn profiel": "My profile",
  Diensten: "Shifts",
  Urenstaten: "Timesheets",
  Academie: "Academy",
  Administratie: "Administration",
  Abonnement: "Subscription",
  Ideeën: "Ideas",
  Support: "Support",
  "ZZP'ers": "Freelancers",
  "ZZP'ers vinden": "Find freelancers",
  Kandidaten: "Candidates",
  Reacties: "Applications",
  "Uren goedkeuren": "Approve hours",
  Prestaties: "Deliverables",
  Bedrijfsprofiel: "Company profile",
  Verificaties: "Verifications",
  Disputen: "Disputes",
  "No-shows": "No-shows",
  "Dienst-overnames": "Shift handovers",
  Helpdesk: "Help desk",
  Opdrachtgevers: "Clients",
  Toezicht: "Oversight",
  Gebruikers: "Users",
  Financiën: "Finance",
  Configuratie: "Configuration",
  Leads: "Leads",
  "Mijn bemiddeling": "My agency",

  // --- Sectiekoppen in de zijbalk ---
  Werk: "Work",
  Profiel: "Profile",
  Account: "Account",
  Operatie: "Operations",
  Beheer: "Management",
  Bemiddeling: "Agency",

  // --- Rollabels ---
  "ZZP'er": "Freelancer",
  Opdrachtgever: "Client",
  Beheerder: "Admin",
  Bemiddelaar: "Agent",

  // --- App-schil (bovenbalk + accountblok) ---
  "Zoeken…": "Search…",
  "Snelzoeker openen (Ctrl K)": "Open quick search (Ctrl K)",
  Notificaties: "Notifications",
  Uitloggen: "Sign out",
  "Account & privacy": "Account & privacy",
  "Schakel naar donkere modus": "Switch to dark mode",
  "Schakel naar lichte modus": "Switch to light mode",
  "Donkere modus": "Dark mode",
  "Lichte modus": "Light mode",
  "Hoofdinhoud overslaan": "Skip to main content",
  Taal: "Language",
  Nederlands: "Dutch",
  Engels: "English",

  // --- Primaire actie in de bovenbalk (werkruimte) ---
  "Nieuwe opdracht": "New assignment",
  "Opdrachten zoeken": "Find assignments",
  "Dienst uitzetten": "Post a shift",

  // --- Login / registratie ---
  "E-mail": "Email",
  Wachtwoord: "Password",
  Inloggen: "Sign in",
  "Bezig met inloggen…": "Signing in…",
  "Vind en beheer zorgopdrachten — geverifieerd, Wet-DBA-proof en zonder papierwerk.":
    "Find and manage healthcare assignments — verified, compliant with Dutch labour law and paperwork-free.",
  "Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.":
    "Your password has been changed. Sign in with your new password.",
  "Wachtwoord vergeten?": "Forgot your password?",
  "Nog geen account?": "No account yet?",
  Registreren: "Sign up",

  // --- Werkruimte (#19 dashboard) — gedeelde chrome ---
  "Alles tonen": "View all",
  "Nog niets om te tonen.": "Nothing to show yet.",
  "per uur": "per hour",
  match: "match",
  "Volgende acties": "Next actions",
  "Niets dat nu aandacht vraagt. Goed bezig.": "Nothing needs your attention. Well done.",
  "Rapport openen": "Open report",
  Werkruimte: "Workspace",
  Week: "Week",
  ma: "Mon",
  di: "Tue",
  wo: "Wed",
  do: "Thu",
  vr: "Fri",
  za: "Sat",
  zo: "Sun",
  dienst: "shift",
  diensten: "shifts",

  // --- ZZP'er-dashboard: KPI's, inzetbaarheid, beschikbaarheid ---
  Profielvelden: "Profile fields",
  "Geverifieerde certificaten": "Verified credentials",
  "Opdrachten voor jou": "Assignments for you",
  "Nog geen passende opdrachten — maak je profiel compleet voor betere matches.":
    "No matching assignments yet — complete your profile for better matches.",
  Inzetbaarheid: "Availability status",
  Status: "Status",
  "Open aandachtspunten": "Open attention points",
  // Inzetbaarheidsstatus (engageability)
  Inzetbaar: "Available for work",
  "Aandacht nodig": "Needs attention",
  "Nog niet inzetbaar": "Not yet available",
  // Beschikbaarheid (availability)
  Beschikbaar: "Available",
  Beperkt: "Limited",
  "Niet beschikbaar": "Unavailable",

  // --- Opdrachtgever-dashboard: KPI's, voorgestelde professionals, compliance-zegel ---
  Vervullingsgraad: "Fill rate",
  "Geplaatste opdrachten": "Posted assignments",
  Uitgaven: "Spending",
  "Actieve samenwerkingen": "Active collaborations",
  "Gepubliceerde opdrachten": "Published assignments",
  "Nieuwe reacties": "New applications",
  "Voorgestelde ZZP'ers": "Suggested freelancers",
  "Plaats een opdracht om geschikte ZZP'ers voorgesteld te krijgen.":
    "Post an assignment to get suitable freelancers suggested.",
  "Compliance-zegel": "Compliance seal",
  "Geen lopende diensten": "No active shifts",
  "diensten in orde": "shifts compliant",
  "Ontbrekend/verlopen": "Missing/expired",
  "Verloopt binnenkort": "Expiring soon",
  "In beoordeling": "In review",

  // --- Login: vertrouwens-strip (marketing) ---
  "Waarom ZZP Platform": "Why ZZP Platform",
  "Certificaten één keer uploaden, overal geldig": "Upload credentials once, valid everywhere",
  "VOG, diploma's en BIG-registratie worden handmatig gecontroleerd — daarna staan ze klaar bij elke opdracht.":
    "Police certificates, diplomas and professional registrations are checked manually — then ready for every assignment.",
  "Modelovereenkomst bij elke opdracht": "A model agreement with every assignment",
  "Standaard Wet-DBA-proof, zodat je geen gedoe hebt met schijnzelfstandigheid.":
    "Compliant with Dutch labour law by default, so bogus self-employment is never a worry.",
  "Je ziet waarom een opdracht bij je past": "You see why an assignment fits you",
  "Bij elke opdracht laten we de reden van de match zien — geen giswerk.":
    "For every assignment we show the reason for the match — no guesswork.",
  "Een volledig dossier is je startpunt": "A complete profile is your starting point",
  "Je hebt geen reviews nodig om te beginnen — een geverifieerd dossier spreekt voor zich.":
    "You don't need reviews to start — a verified profile speaks for itself.",
  "Facturen en urenstaten op één plek": "Invoices and timesheets in one place",
  "Elke partij krijgt een eigen doorlopende factuurnummering, zodat je boekhouding altijd aansluit.":
    "Each party gets its own sequential invoice numbering, so your bookkeeping always reconciles.",
  Diploma: "Diploma",
  Verzekering: "Insurance",
  "geverifieerde certificaten": "verified credentials",
  "geverifieerde ZZP'ers": "verified freelancers",
  "afgeronde samenwerkingen": "completed collaborations",

  // --- Opdrachten zoeken (ZZP'er-lijst) ---
  "Vind opdrachten die bij je passen.": "Find assignments that fit you.",
  "Geen opdrachten gevonden": "No assignments found",
  "Pas je filters aan om meer resultaten te zien.": "Adjust your filters to see more results.",
  opdracht: "assignment",
  opdrachten: "assignments",
  gevonden: "found",
  Match: "Match",
  "/uur": "/hr",
  Vorige: "Previous",
  Volgende: "Next",
  "Pagina N van M": "Page N of M",
  Paginering: "Pagination",
  // Start-nabijheid
  "begint vandaag": "starts today",
  "begint morgen": "starts tomorrow",
  "begint over N dagen": "starts in N days",
  // Werkmodus
  Remote: "Remote",
  "Op locatie": "On-site",
  Hybride: "Hybrid",
  // Bewaar-knop
  Bewaren: "Save",
  Bewaard: "Saved",
  // Filters
  Zoeken: "Search",
  "Zoek op titel of omschrijving…": "Search by title or description…",
  Branche: "Industry",
  "Alle branches": "All industries",
  Werkmodus: "Work mode",
  "Alle werkmodi": "All work modes",
  Locatie: "Location",
  "Plaats of regio…": "City or region…",
  Minimumtarief: "Minimum rate",
  "Min. €/uur": "Min. €/hr",
  Maximumtarief: "Maximum rate",
  "Max. €/uur": "Max. €/hr",
  "Vereist certificaat": "Required credential",
  "Alle certificaten": "All credentials",
  Certificaat: "Certificate",
  Licentie: "License",
  Sorteren: "Sort",
  "Nieuwste eerst": "Newest first",
  "Tarief hoog → laag": "Rate high → low",
  "Tarief laag → hoog": "Rate low → high",

  // --- Match-redenen (uitlegbaarheid op opdracht-lijst/detail) ---
  "Direct beschikbaar": "Available now",
  "Beperkt beschikbaar": "Limited availability",
  "Momenteel niet beschikbaar": "Currently unavailable",
  "Alle vereiste skills aanwezig": "All required skills present",
  "Voldoet aan de certificaateisen": "Meets the credential requirements",
  "Certificaat in beoordeling": "Credential under review",
  "Mist vereist certificaat": "Missing a required credential",
  "Vereist certificaat is verlopen": "Required credential has expired",
  "Tarief ligt boven het budget": "Rate is above budget",
  "Tarief past binnen het budget": "Rate fits the budget",
  "Werkmodus komt overeen": "Work mode matches",
  "Werkmodus sluit niet aan": "Work mode doesn't match",

  // --- Opdracht-detail (ZZP'er) ---
  "Terug naar opdrachten": "Back to assignments",
  "Start:": "Starts:",
  "Vereiste skills": "Required skills",
  "Gewenste skills": "Preferred skills",
  "Vereiste certificaten": "Required credentials",
  "Gewenste certificaten": "Preferred credentials",
  "Over de opdrachtgever": "About the client",
  Website: "Website",
  "Je hebt op deze opdracht gereageerd.": "You've applied to this assignment.",
  "Bekijk mijn reacties": "View my applications",
  "Jouw aansluiting": "Your fit",
  "Hoe is deze score opgebouwd?": "How is this score calculated?",
  Toevoegen: "Add",
  "Je kunt nog reageren, maar je voldoet nog niet aan alle vereisten.":
    "You can still apply, but you don't yet meet all the requirements.",
  // Certificaat-status (op detail)
  "in orde": "in order",
  "in beoordeling": "under review",
  verlopen: "expired",
  ontbreekt: "missing",
  // Ook passend bij jouw profiel
  "Ook passend bij jouw profiel": "Also a fit for your profile",
  "Andere open opdrachten die aansluiten op jouw profiel.":
    "Other open assignments that match your profile.",
  // Reageer-formulier
  "Reageren op deze opdracht": "Apply to this assignment",
  Motivatie: "Motivation",
  "Waarom past deze opdracht bij jou?": "Why does this assignment fit you?",
  "Tariefvoorstel (€/uur)": "Proposed rate (€/hr)",
  "bijv. 85": "e.g. 85",
  Beschikbaarheid: "Availability",
  "bijv. per 1 september, 32 uur": "e.g. from 1 September, 32 hours",
  "Versturen…": "Sending…",
  "Reactie versturen": "Send application",

  // --- Profiel (ZZP'er) ---
  Certificaten: "Credentials",
  Beoordelingen: "Reviews",
  Documenten: "Documents",
  "Beschikbaarheid onbekend": "Availability unknown",
  Afgerond: "Completed",
  Lopend: "Active",
  Voorstel: "Proposal",
  "Bewerk jouw profiel": "Edit your profile",
  Over: "About",
  Stamgegevens: "Details",
  Functie: "Role",
  Specialisaties: "Specialisations",
  Branches: "Industries",
  Uurtarief: "Hourly rate",
  "KvK-nummer": "Chamber of Commerce no.",
  Talen: "Languages",
  "Op het platform sinds": "On the platform since",
  Profielkracht: "Profile strength",
  Identiteit: "Identity",
  "Verplichte documenten": "Required documents",
  "Certificaten geldig": "Credentials valid",
  "Geverifieerd via iDIN": "Verified via iDIN",
  "Niet geverifieerd": "Not verified",
  "Volledig ✓": "Complete ✓",
  Onvolledig: "Incomplete",
  Geverifieerd: "Verified",
  Verlopen: "Expired",
  Verloopt: "Expiring",
  Vertrouwen: "Trust",
  "Recente samenwerkingen": "Recent collaborations",
  "Beoordelingen door opdrachtgevers": "Reviews from clients",
  "Samenwerkingen via het platform": "Collaborations via the platform",
  "Certificaten — servergeverifieerd": "Credentials — server-verified",
  "Documenten — privé": "Documents — private",
  "Geen beschikbaarheidsvensters gedeeld.": "No availability windows shared.",
  "Nog geen samenwerkingen via het platform.": "No collaborations via the platform yet.",
  "Alleen jij (en beheer) kunt deze openen.": "Only you (and admins) can open these.",
  "Meer laden": "Load more",
  "op het platform sinds": "on the platform since",
  "afgeronde samenwerking": "completed collaboration",
  "Server-side berekend uit verifieerbare signalen — eerlijk vermeld, geen black box.":
    "Calculated server-side from verifiable signals — honestly stated, no black box.",

  // --- Vertrouwen (trust badge + uitleg) ---
  Basisprofiel: "Basic profile",
  "Deels geverifieerd": "Partly verified",
  "Volledig geverifieerd": "Fully verified",
  Basis: "Basic",
  Deels: "Partly",
  Volledig: "Fully",
  "Vertrouwensniveau:": "Trust level:",
  "Volgende stap": "Next step",
  "Volgende stappen": "Next steps",
  "Identiteit geverifieerd": "Identity verified",
  "Verifieer je identiteit": "Verify your identity",
  "Laat minstens één certificaat verifiëren": "Get at least one credential verified",
  "Lever je verplichte documenten aan (VOG en verzekering)":
    "Submit your required documents (police certificate and insurance)",
  "Je profiel is volledig geverifieerd — het sterkste signaal naar opdrachtgevers.":
    "Your profile is fully verified — the strongest signal to clients.",

  // --- Opdrachtgever-gedrag-blokken (op opdracht-detail) ---
  // Gedeelde toon-labels
  Goed: "Good",
  Gemiddeld: "Average",
  "Let op": "Caution",
  Onbekend: "Unknown",
  "op basis van": "based on",
  // Betaalgedrag
  "Betaalgedrag opdrachtgever": "Client payment behaviour",
  Betaalgedrag: "Payment behaviour",
  "Nog te weinig betalingen om iets te zeggen.": "Too few payments to say anything yet.",
  dagen: "days",
  betaaltijd: "to pay",
  "op tijd": "on time",
  betaling: "payment",
  betalingen: "payments",
  // Annuleringsgedrag
  "Annuleringsbetrouwbaarheid opdrachtgever": "Client cancellation reliability",
  Annuleringsgedrag: "Cancellation behaviour",
  "Nog te weinig afgewikkelde samenwerkingen om iets te zeggen.":
    "Too few settled collaborations to say anything yet.",
  "Geen enkele afspraak geannuleerd over": "Not a single booking cancelled across",
  samenwerking: "collaboration",
  samenwerkingen: "collaborations",
  geannuleerd: "cancelled",
  waarvan: "of which",
  "last-minute": "last-minute",
  // Reactiebereidheid
  "Reactiebereidheid opdrachtgever": "Client responsiveness",
  Reactiebereidheid: "Responsiveness",
  "Nog te weinig reacties ontvangen om iets te zeggen.":
    "Too few applications received to say anything yet.",
  Alle: "All",
  opgepakt: "handled",
  reactie: "application",
  reacties: "applications",
  "nog open": "still open",
  "oudste al": "oldest already",
  "dagen open": "days open",

  // --- Menupagina-koppen (PageHeader-subtitels + lege-staat-titels) ---
  "Jouw geplande diensten en open kansen — per dag.":
    "Your scheduled shifts and open opportunities — by day.",
  "Je reacties op opdrachten en hun status.": "Your applications to assignments and their status.",
  "Opdrachten die je hebt bewaard.": "Assignments you've saved.",
  "Voorgestelde en lopende samenwerkingen.": "Proposed and ongoing collaborations.",
  "Het diensten-overzicht is er voor ZZP'ers.": "The shifts overview is for freelancers.",
  "Korte cursussen over je vak, compliance en administratie — leer in je eigen tempo.":
    "Short courses on your trade, compliance and admin — learn at your own pace.",
  "Stel verbeteringen voor en stem op de ideeën van anderen. De meest gewenste staan bovenaan.":
    "Suggest improvements and vote on others' ideas. The most wanted rise to the top.",
  "Stel je vraag — vaak heb je direct antwoord, anders pakt de helpdesk het op.":
    "Ask your question — often you get an instant answer, otherwise the help desk picks it up.",
  "Niets te doen": "Nothing to do",
  "Geen inzicht beschikbaar": "No insights available",

  // --- Administratie-hub (kop + tabs) ---
  Administratiesecties: "Administration sections",
  openstaand: "outstanding",
  Openstaand: "Outstanding",
  "Betaalde omzet": "Paid revenue",
  "Je facturen, openstaande posten en boekhouding op één plek.":
    "Your invoices, outstanding items and bookkeeping in one place.",
  "Je facturen, openstaande posten en verplichtingen op één plek.":
    "Your invoices, outstanding items and obligations in one place.",
  Facturen: "Invoices",
  Boekhouding: "Bookkeeping",
  Prognose: "Forecast",
  Ontzorgd: "Done-for-you",
  Verplichtingen: "Obligations",

  // --- Facturen-paneel (inhoud) ---
  "Nieuwe factuur": "New invoice",
  Betaald: "Paid",
  "Nog geen facturen": "No invoices yet",
  "Nog geen facturen ontvangen": "No invoices received yet",
  "Stel een factuur op vanuit een actieve samenwerking.":
    "Create an invoice from an active collaboration.",
  "Zodra een opdracht tot een samenwerking leidt, kun je hier factureren.":
    "Once an assignment becomes a collaboration, you can invoice here.",
  "Factuur opstellen": "Create invoice",
  "Bekijk opdrachten": "View assignments",
  "Geen facturen met deze status.": "No invoices with this status.",
  "Concept-factuur": "Draft invoice",
  "via samenwerking": "via collaboration",
  "incl. btw": "incl. VAT",
  // Factuurstatus-filter (pills) — "Alle" staat al in het woordenboek
  Afgehandeld: "Settled",
  // Factuur-lifecycle / statusbadges — "Verlopen" (→ Expired) staat al in het woordenboek
  Concept: "Draft",
  Ingediend: "Submitted",
  Goedgekeurd: "Approved",
  Verwerkt: "Processed",
  Afgekeurd: "Rejected",
  "Te laat": "Overdue",
  Gecrediteerd: "Credited",
  Verzonden: "Sent",
  Geannuleerd: "Cancelled",

  // --- Opgeslagen: bulk-opschonen ---
  Opschonen: "Clean up",

  // --- Documenten (ZZP'er-scherm + gedeeld documentenpaneel) ---
  "Je geüploade documenten. Alleen jij (en beheer) kunt ze openen.":
    "Your uploaded documents. Only you (and admins) can open them.",
  "Nog geen documenten geüpload": "No documents uploaded yet",
  "Gebruik het formulier hierboven om je eerste document toe te voegen.":
    "Use the form above to add your first document.",
  "Geen verdere documenten": "No further documents",
  "Je hebt alle documenten bekeken.": "You've viewed all documents.",
  "gekoppeld aan een credential": "linked to a credential",
  Openen: "Open",
  "Document verwijderen?": "Delete document?",
  "Dit document wordt permanent uit je opslag verwijderd. Dit kan niet ongedaan worden gemaakt.":
    "This document will be permanently removed from your storage. This cannot be undone.",
  Verwijderen: "Delete",
  Verwijder: "Delete",
  // Documenttypes (KIND_LABEL) — "Verzekering" → "Insurance" staat al in het woordenboek
  Overig: "Other",
  // Uploadformulier
  "Document uploaden": "Upload document",
  Type: "Type",
  Bestand: "File",
  "PDF, PNG, JPEG of WEBP, max 10 MB. Privé.": "PDF, PNG, JPEG or WEBP, max 10 MB. Private.",
  "Uploaden…": "Uploading…",
  Uploaden: "Upload",
  "Geüpload.": "Uploaded.",
  // --- Notificaties (/notificaties) ---
  // "Notificaties", "Alle", "Facturen", "Certificaten", "Samenwerkingen", "Disputen" staan al
  // in het woordenboek (nav/factuur-secties) — geen dubbele sleutels.
  "Updates over je certificaten, reacties en berichten.":
    "Updates about your certificates, applications and messages.",
  "Alles als gelezen markeren": "Mark all as read",
  "Geen notificaties": "No notifications",
  "Je hebt op dit moment geen nieuwe meldingen.": "You have no new notifications right now.",
  Gelezen: "Mark read",
  "Ongelezen: ": "Unread: ",
  Vandaag: "Today",
  Eerder: "Earlier",
  "Alle meldingen": "All notifications",
  "Alleen ongelezen": "Unread only",
  "Geen meldingen in deze selectie.": "No notifications in this selection.",
  "Terwijl je weg was:": "While you were away:",
  "ongelezen melding": "unread notification",
  "ongelezen meldingen": "unread notifications",
  "sinds je vorige bezoek op": "since your previous visit on",
  // Relatieve tijd (suffixen achter een getal; NL pluraliseert "uur" niet, EN volgt dezelfde stijl)
  zojuist: "just now",
  "min geleden": "min ago",
  "uur geleden": "hr ago",
  // Notificatiecategorie-labels (filter-pills) — overige labels hergebruiken bestaande sleutels
  Werkproces: "Workflow",
  Betalingen: "Payments",
  "DBA-signalen": "DBA signals",
  Ideeënbox: "Ideas box",
  // Hersteld na merge-resolutie (#499/#500/#501 dict-entries):
  "Nog geen reacties": "No applications yet",
  "Je hebt nog niet gereageerd op een opdracht.": "You haven't applied to any assignment yet.",
  "Geen reacties in dit filter": "No applications in this filter",
  Gereageerd: "Applied",
  "Alle reacties": "All applications",
  "Je mist:": "You're missing:",
  "Verlopen:": "Expired:",
  "In beoordeling:": "Under review:",
  Nieuw: "New",
  Bekeken: "Viewed",
  Shortlist: "Shortlist",
  Afgewezen: "Rejected",
  Ingetrokken: "Withdrawn",
  Geaccepteerd: "Accepted",
  "Voldoet aan eisen": "Meets requirements",
  Aandachtspunt: "Attention point",
  "Voldoet niet": "Does not meet",
  Verstuurd: "Sent",
  "Op shortlist": "Shortlisted",
  "lopen nog": "still open",
  "kans op een voorstel": "chance of a proposal",
  "van je reacties": "of your applications",
  van: "of",
  "van de beoordeelde reacties": "of reviewed applications",
  "samenwerking gestart": "collaboration started",
  "samenwerkingen gestart": "collaborations started",
  "nog niet genoeg beoordeeld": "not enough reviewed yet",
  "De opdrachtgever heeft je reactie bekeken.": "The client has viewed your application.",
  "Je hebt deze reactie ingetrokken.": "You've withdrawn this application.",
  "Samenwerking voorgesteld — bekijk het voorstel.": "Collaboration proposed — view the proposal.",
  "Samenwerking gestart — bekijk de samenwerking.":
    "Collaboration started — view the collaboration.",
  "Samenwerking afgerond — bekijk de samenwerking.":
    "Collaboration completed — view the collaboration.",
  "Reactie intrekken?": "Withdraw application?",
  Intrekken: "Withdraw",
  "Reactie intrekken": "Withdraw application",
  Gepubliceerd: "Published",
  Gesloten: "Closed",
  "Eerst een profiel": "Set up a profile first",
  "Naar profiel": "Go to profile",
  "Nog niets bewaard": "Nothing saved yet",
  "Opdrachten bekijken": "View assignments",
  "Nog open": "Still open",
  "Niet meer beschikbaar": "No longer available",
  "opdracht is": "assignment is",
  "opdrachten zijn": "assignments are",

  // --- CLIENT — kandidatenscherm (/kandidaten) ---
  "Reacties op je opdrachten, met match en compliance.":
    "Responses to your assignments, with match and compliance.",
  "Zodra ZZP'ers reageren op je opdrachten, zie je ze hier.":
    "As soon as freelancers respond to your assignments, you'll see them here.",
  "Filter op status": "Filter by status",
  "Beste match": "Best match",
  "Geen reacties met deze status": "No applications with this status",
  "Er zijn geen reacties in deze categorie. Pas het filter aan.":
    "There are no applications in this category. Adjust the filter.",
  Selecteer: "Select",
  op: "on", // verbindingswoord "{headline} · op {opdracht}"
  "Mist:": "Missing:",
  "Waarom deze match?": "Why this match?",
  Tariefvoorstel: "Rate proposal",
  "Aangegeven bij reactie": "Stated on application",
  Agenda: "Calendar",
  "De ZZP'er heeft deze reactie ingetrokken.": "The freelancer has withdrawn this application.",
  // Actieknoppen op een reactie
  "Terug naar nieuw": "Back to new",
  "Markeer als bekeken": "Mark as viewed",
  Accepteren: "Accept",
  Afwijzen: "Reject",
  "Reactie afwijzen?": "Reject application?",
  "De ZZP'er krijgt bericht dat de reactie is afgewezen. Je kunt dit later nog terugdraaien naar de shortlist.":
    "The freelancer will be notified that the application was rejected. You can still revert this to the shortlist later.",
  "Bericht sturen": "Send message",
  "Bekijk samenwerking": "View collaboration",
  // Interne notitie (client-component)
  "Interne notitie (alleen voor jou)…": "Internal note (for your eyes only)…",
  "Opslaan…": "Saving…",
  "Notitie opslaan": "Save note",
  // Samenwerking voorstellen (client-component)
  "Samenwerking voorstellen": "Propose collaboration",
  "Tarief €/uur": "Rate €/hr",
  Tarief: "Rate",
  Startdatum: "Start date",
  Einddatum: "End date",
  "Voorstel versturen": "Send proposal",
  // Bulk-triage (client-component)
  "Geselecteerde reacties afwijzen? De ZZP'ers krijgen hiervan bericht.":
    "Reject selected applications? The freelancers will be notified.",
  geselecteerd: "selected",
  "Bulk statuswijziging": "Bulk status change",
  "Nieuwe status": "New status",
  "Toepassen op": "Apply to",
  "Bezig…": "Working…",
};

const TABLES: Record<Locale, Record<string, string>> = {
  nl: {},
  en: EN,
};

/**
 * Vertaalt een Nederlandse brontekst naar de gekozen taal. `nl` geeft de brontekst onveranderd
 * terug; `en` geeft de vertaling, of de brontekst als die (nog) niet vertaald is.
 */
export function translate(locale: Locale, source: string): string {
  if (locale === "nl") return source;
  return TABLES[locale][source] ?? source;
}
