// Unified, deterministic "next best action" engine. Pure logic: no Prisma, no I/O.
// Takes plain typed inputs of primitive counts/flags (server computes these upstream)
// and produces a ranked list of actions. Thresholds mirror the dashboard exactly so a
// later swap is behaviour-preserving. Higher priority = more urgent = shown first.
//
// NB: de freelancer-/client-/admin-aggregators zijn bewust NIET in dit bestand — de levende
// actie-engine op item-niveau is `src/lib/actions/tasks.ts` + `pending-tasks.ts` (één bron van
// waarheid, gevoed door de gedeelde `P`-banden hieronder). Alleen de begeleidende franchise-
// opzet leeft nog als aggregator (`franchiserNextActions`), gewired via `franchiseGuidedSetupTasks`.

import { plural } from "@/lib/plural";

export type NextActionTone = "attention" | "info" | "success";

export interface NextAction {
  id: string;
  title: string;
  href: string;
  tone: NextActionTone;
  /** Higher = more urgent. Equal priority preserves input order (stable). */
  priority: number;
}

/**
 * Stable sort by priority descending: equal priorities keep their input order.
 * `Array.prototype.sort` is stable in modern engines, but we guard order
 * explicitly via the original index so the contract holds regardless.
 */
export function rankNextActions(actions: NextAction[]): NextAction[] {
  return actions
    .map((action, index) => ({ action, index }))
    .sort((a, b) => b.action.priority - a.action.priority || a.index - b.index)
    .map(({ action }) => action);
}

/**
 * Vat de ontbrekende onderdelen samen voor in een actie-titel: maximaal `max` namen,
 * de rest als "+N meer". Zo weet de gebruiker concreet wát te doen om 100% te halen.
 */
export function formatMissing(items: readonly string[], max = 3): string {
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} +${items.length - max} meer`;
}

// Priority bands. Compliance/blocking items outrank cosmetic ones. Gaps leave
// room for future items without renumbering. Geëxporteerd zodat het item-niveau
// Actiecentrum (src/lib/actions/tasks.ts) exact dezelfde rangschikking gebruikt.
export const P = {
  blocking: 100, // profiel privé, AVG-verwijderverzoek
  identity: 90, // identiteit niet geverifieerd
  complianceRipple: 85, // lopende samenwerking met certificaat-alert
  mandatoryDoc: 84, // verplicht document (VOG/verzekering) ontbreekt of verlopen — blokkeert inzetbaarheid
  credentialRejected: 80, // afgewezen certificaat — opnieuw indienen
  disputeOpen: 76, // open dispuut — werkproces bevroren (admin)
  contractSign: 72, // contract ter ondertekening — deblokkeert de samenwerking
  proposeCollaboration: 68, // geaccepteerde kandidaat wacht nog op een samenwerkingsvoorstel — rond de hire af
  proposeCollaborationStalled: 69, // idem, maar de acceptatie ligt al ≥ PROPOSAL_STALL_DAYS zonder voorstel — de geaccepteerde ZZP'er hangt in limbo; net boven de verse "rond de hire af" (68) zodat de langst-wachtende hire binnen het cluster voorop komt, onder contractSign (72)
  credentialExpiredForCollab: 82, // vereist certificaat van een lopende samenwerking is REEDS verlopen — blokkeert de inzet nu (freelancer-spiegel van complianceRipple); urgenter dan afgewezen of binnenkort-verlopend
  credentialMissingForCollab: 81, // vereist (niet-verplicht) certificaat van een lopende samenwerking ONTBREEKT volledig (nooit aangeleverd/alleen concept) — acuut compliance-gat, freelancer-spiegel van complianceRipple "missing"; net onder REEDS-verlopen (dat leunde al op een bestaand exemplaar), boven afgewezen
  credentialExpiringForCollab: 73, // vereist certificaat van een lopende samenwerking verloopt binnenkort (nog geldig, pre-due; COLLAB_CREDENTIAL_EXPIRY_WINDOW_DAYS) — urgenter dan een los verlopend certificaat (credentialExpiring 70) en boven contractSign (72), maar ONDER een reeds-verstreken BTW-aangifte (vatDeadlineOverdue 74): post-due, boete-dragende schuld weegt zwaarder dan een naderende (nog-niet-verstreken) certificaat-verval. Zelfde post-due>pre-due-principe als clientCascadeOverduePayment (59) > vatDeadlineDueSoon (58)
  credentialExpiring: 70, // certificaat verloopt binnenkort
  credentialExpired: 69, // niet-verplicht certificaat is verlopen — vernieuwen (onder "verloopt binnenkort": daar is de vervaldatum nog te redden)
  verificationQueue: 70, // wacht op verificatie (admin)
  supportOpen: 66, // openstaande supporttickets — onbeantwoord/nieuw (admin)
  vatDeadlineOverdue: 74, // BTW-aangifte over de uiterste indieningsdatum (fiscale boete-risico)
  overdueInvoice: 60, // factuur over de vervaldatum
  clientCascadeOverduePayment: 59, // cascade-factuur van de opdrachtgever staat OVER de vervaldatum — betaal 'm of laat de ZZP'er de betaling bevestigen (opdrachtgever-spiegel van paymentConfirmTask(overdue)). Post-due = een reeds-verstreken, echte betaalverplichting; moet daarom BOVEN elke pre-due nudge staan, incl. de naderende (nog-niet-verstreken) BTW-deadline (vatDeadlineDueSoon 58). Blijft onder overdueInvoice (60).
  paymentDueSoon: 56, // factuur vervalt binnenkort — betaal op tijd (opdrachtgever, pre-due; onder de al-verstreken roll-up)
  conceptInvoiceAging: 59, // eigen concept-factuur blijft ≥ UNBILLED_AGING_DAYS (7) liggen — de ZZP'er zit op zijn eigen, nog-niet-verzonden geld voorbij het herinner-/escalatievenster. Boven een verse concept (messagesAwaiting 55) en de pre-due nudges (paymentDueSoon 56 / vatDeadlineDueSoon 58), maar onder een reeds-verstreken factuur (overdueInvoice 60) en een afgekeurde factuur (62 = credentialExpiring-8). Deelt de waarde met de rol-geïsoleerde clientCascadeOverduePayment (59); ze worden nooit samen gerangschikt.
  vatDeadlineDueSoon: 58, // BTW-aangifte-deadline nadert (binnen 14 dagen) — pre-due signaal (nog geen boeterisico; dat is vatDeadlineOverdue 74), dus onder een reeds-verstreken cascade-betaling
  incomeTaxDeadlineDueSoon: 57, // jaarlijkse aangifte-inkomstenbelasting-deadline nadert (binnen INCOME_TAX_DEADLINE_SOON_DAYS 30) — pre-due signaal (forward-looking; nooit "te laat"). Onder de kwartaal-BTW-deadline (vatDeadlineDueSoon 58: nabijere cadans, concreet af te dragen saldo), boven een enkele naderende factuurbetaling (paymentDueSoon 56: een jaarlijkse fiscale aangifteplicht weegt zwaarder dan één binnenkomende betaling)
  hoursCriterionDueSoon: 51, // urencriterium (1.225 uur → zelfstandigenaftrek) dreigt dit jaar niet gehaald te worden, maar is nog bij te sturen (seizoen H2/Q4). Hoge financiële inzet, maar een zachte, seizoensgebonden gedragsnudge ("boek meer uren / registreer indirecte uren") — geen harde, dit-jaar-verstrijkende filing-deadline zoals de BTW/IB-aangifte, en niet week-op-week urgent (je hebt tot 31 dec). Daarom ONDER de concrete fiscale deadlines (incomeTaxDeadlineDueSoon 57 / vatDeadlineDueSoon 58) en het tijdgevoelige inbound-cluster (messagesAwaiting 55 … staleApplications 52 — daar wachten concrete mensen/kansen), maar BOVEN een generieke nieuwe reactie (applications 50): een staande, hoog-renderende fiscale doelstelling weegt zwaarder dan één losse binnenkomende reactie
  pendingUsers: 60, // gebruikers met PENDING-status (admin)
  credentialExpiryBatch: 58, // verlopen/verlopende certificaten — draai de expiry-check (admin)
  messagesAwaiting: 55, // berichten van de andere partij wachten op antwoord
  respondInvitation: 54, // directe uitnodiging van een opdrachtgever wacht op reactie (ZZP'er) — hoogst-intente inbound lead, net onder een lopend gesprek
  firstLookOverdue: 53, // NEW-reactie wacht al ≥ ghosting-drempel op een EERSTE blik — nooit bekeken weegt zwaarder dan een reeds-bekeken kandidaat die op een beslissing wacht
  staleApplications: 52, // kandidaten (VIEWED/SHORTLIST) wachten al langer dan gebruikelijk op een beslissing
  applications: 50, // nieuwe reacties
  jobStaffingOverdue: 51, // gepubliceerde opdracht waarvan de startdatum is verstreken terwijl er nog niemand is vastgelegd (`summarizeStaffingRisk` phase "overdue"). Een verstreken, onbezette planning-deadline is urgenter dan een verse reactie (applications 50), een koud lopende opdracht (jobNeedsAttention 44) of een aflopende relatie (collaborationRenewal 46) — de opdracht start al leeg — maar staat ONDER de kandidaten die al te lang op een beslissing/eerste blik wachten (staleApplications 52 / firstLookOverdue 53): daar wachten concrete mensen én is de opdracht mogelijk nog met een bestaande reactie te redden. Rol-geïsoleerd van hoursCriterionDueSoon (51, FREELANCER) — nooit samen gerangschikt.
  collaborationRenewal: 46, // lopende samenwerking nadert/passeert haar einddatum — plan tijdig een vervolg (beide partijen)
  jobNeedsAttention: 44, // gepubliceerde opdracht loopt koud (geen/weinig kandidaten) — stuur bij (tarief/eisen/omschrijving). Een ongevulde behoefte is actueler dan een passieve concept-opdracht (drafts 20) of een cosmetische compleetheid-nudge (completeness 30), maar staat ONDER het inkomende-kandidaten-cluster (applications 50 / firstLookOverdue 53 / staleApplications 52 — daar wachten concrete mensen), onder een verstreken-onbezette opdracht (jobStaffingOverdue 51) en onder een lopende relatie (collaborationRenewal 46); boven de findability-nudge (availabilityStale 40)
  availabilityStale: 40, // gedeelde beschikbaarheidsagenda verlopen — findability-nudge (ZZP'er)
  reviewPromptClosing: 48, // beoordelingsvenster sluit bijna (≤3 dagen) — daarna nooit meer te doen (anti-vergeldingsslot), dus urgenter dan cosmetische nudges
  completeness: 30, // profiel/bedrijf onvolledig (cosmetisch)
  reviewPrompt: 24, // afgeronde samenwerking nog te beoordelen (blind venster open) — reputatie-nudge
  drafts: 20, // concept-opdrachten
  // Franchiser-activatie: geleide opzet van een nieuwe tenant (begeleidend, niet alarmerend).
  // De banden zijn rol-geïsoleerd (alleen franchiser-acties), dus overlap met bovenstaande
  // semantische waarden is bewust en onschadelijk — ze worden nooit samen gerangschikt.
  franchiserFirstClient: 90, // nog geen opdrachtgever — de enige zinvolle eerste stap
  franchiserFirstService: 80, // opdrachtgever(s), maar nog geen enkele dienst uitgezet
  franchiserRoster: 70, // nog geen ZZP'ers in het roster
  franchiserClientsWithoutService: 40, // opdrachtgever(s) zonder diensten (doorlopende nudge)
  // Franchiser-operationeel: doorlopende tenant-taken zodra de franchise draait (item-niveau).
  franchiserRosterNotEngageable: 84, // roster-ZZP'er niet inzetbaar (ontbrekend doc/verificatie) — blokkeert plaatsing
  franchiserServiceAcute: 78, // open dienst dreigt onbezet (start deze week/verstreken/geen datum) — vullen kan niet wachten
  franchiserCredentialExpired: 72, // roster-certificaat van een tenant-ZZP'er is REEDS verlopen — urgenter dan "verloopt binnenkort" (de compliance-gap is nu actief), maar onder een acuut onbezette dienst
  franchiserCredentialExpiring: 70, // roster-certificaat van een tenant-ZZP'er verloopt binnenkort
  franchiserServiceStale: 65, // gepubliceerde dienst staat lang open zonder plaatsing
  franchiserServiceStaleRollup: 64, // rollup van de resterende lang-open diensten — strikt onder de per-dienst-taak zodat de specifieke, oudste diensten voorop blijven (niet meer afhankelijk van de push-volgorde bij een gelijke prioriteit)
  franchiserCollaborationRenewal: 62, // lopende plaatsing nadert/passeert haar einddatum — de bemiddelaar plant tijdig een vervolg (revenue-behoud). Onder de open-dienst-taken (die laten een opdrachtgever NU zonder bezetting), boven een koude lead: een lopende relatie verlengen is warmer dan nieuwe acquisitie
  franchiserClientReengagement: 55, // opdrachtgever stilgevallen (geen open dienst/lopende plaatsing, ≥30 dagen rustig) — re-engagement van een warme, bestaande relatie. Onder een aflopende plaatsing (daar loopt nog omzet), boven een koude lead (bestaande relatie = hogere kans op een vervolgopdracht)
  franchiserLeadFollowup: 50, // lead met verstreken geplande opvolgdatum
} as const;

export interface FranchiserActionInput {
  /** Opdrachtgevers (Company) in de tenant. */
  companies: number;
  /** Gepubliceerde diensten (Job PUBLISHED) in de tenant. */
  publishedDiensten: number;
  /** ZZP'ers in het eigen roster (FreelancerProfile). */
  rosterFreelancers: number;
  /** Opdrachtgevers zonder ook maar één gepubliceerde dienst. */
  companiesWithoutDiensten: number;
}

/**
 * Geleide opzet van een franchise: toont de eerstvolgende, concrete stap(pen) om de tenant
 * werkend te krijgen — opdrachtgever → dienst → roster. Begeleidend (tone "info"), niet alarmerend.
 * De operationele attentiepunten (roster-ZZP'ers die niet inzetbaar zijn, diensten die te lang open
 * staan) leven op item-niveau in `pending-tasks.ts` (`franchiserTasks`) — niet hier: deze aggregator
 * is alleen gewired voor de guided-setup-tak (`franchiseGuidedSetupTasks`).
 */
export function franchiserNextActions(input: FranchiserActionInput): NextAction[] {
  const actions: NextAction[] = [];

  // De opdrachtgever→dienst-tak: zonder opdrachtgever kan er nog niets uitgezet worden, dus toon dán
  // alleen "eerste opdrachtgever" (de dienst-stap zou zinloos zijn). Daarna de eerste/ontbrekende dienst.
  if (input.companies === 0) {
    actions.push({
      id: "franchiser-first-client",
      title: "Voeg je eerste opdrachtgever toe — met afdelingen en diensten in één doorloop",
      href: "/franchise/opdrachtgevers/nieuw",
      tone: "info",
      priority: P.franchiserFirstClient,
    });
  } else if (input.publishedDiensten === 0) {
    actions.push({
      id: "franchiser-first-service",
      title: "Zet je eerste dienst uit bij een opdrachtgever",
      href: "/franchise/opdrachtgevers",
      tone: "info",
      priority: P.franchiserFirstService,
    });
  } else if (input.companiesWithoutDiensten > 0) {
    actions.push({
      id: "franchiser-clients-without-service",
      title: `${plural(input.companiesWithoutDiensten, "opdrachtgever", "opdrachtgevers")} zonder diensten — zet diensten uit`,
      href: "/franchise/opdrachtgevers",
      tone: "info",
      priority: P.franchiserClientsWithoutService,
    });
  }

  // Het roster is een parallelle opzet-tak: ZZP'ers kun je los van opdrachtgevers al toevoegen.
  if (input.rosterFreelancers === 0) {
    actions.push({
      id: "franchiser-roster-empty",
      title: "Breng ZZP'ers in je roster om diensten te kunnen vervullen",
      href: "/franchise/zzpers",
      tone: "info",
      priority: P.franchiserRoster,
    });
  }

  return rankNextActions(actions);
}
