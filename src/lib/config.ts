// Configureerbare bedrijfsregels (PLATFORM_OVERHAUL.md §0B + §6). Drempels en tarieven leven
// hier, niet hardcoded verspreid door de code. Bedragen/tarieven in gehele eenheden (centen,
// basispunten) — nooit floats voor geld.

import { z } from "zod";
import { DEFAULT_REVIEW_BLIND_DAYS } from "@/lib/reviews";

// --- BTW-regimes ------------------------------------------------------------
// Tarieven in basispunten (bps): 2100 = 21%. Zo blijft alles integer-rekenen.
export const VAT_REGIMES = [
  "STANDARD_HIGH", // 21% — standaard B2B-dienst
  "STANDARD_LOW", //  9%  — verlaagd tarief
  "ZERO", //          0%  — nultarief
  "REVERSE_CHARGE", // btw verlegd (acquirer rekent zelf af; uitschrijver 0)
  "EXEMPT", //        vrijgesteld
] as const;
export type VatRegime = (typeof VAT_REGIMES)[number];
export const vatRegimeSchema = z.enum(VAT_REGIMES);

export const VAT_RATE_BPS: Record<VatRegime, number> = {
  STANDARD_HIGH: 2100,
  STANDARD_LOW: 900,
  ZERO: 0,
  REVERSE_CHARGE: 0,
  EXEMPT: 0,
};

/** Of er bij dit regime daadwerkelijk BTW op de factuur wordt berekend. */
export function regimeChargesVat(regime: VatRegime): boolean {
  return VAT_RATE_BPS[regime] > 0;
}

// --- Facturatie-defaults (configureerbaar) ---------------------------------
export const DEFAULT_VAT_REGIME: VatRegime = "STANDARD_HIGH";
export const DEFAULT_PAYMENT_TERM_DAYS = 30;

// --- Platformfee (Besluit 4 — OPEN, default UIT) ---------------------------
export const FEE_PAYERS = ["CLIENT", "FREELANCER"] as const;
export type FeePayer = (typeof FEE_PAYERS)[number];
export const FEE_TRIGGERS = ["AFTER_PAYMENT", "AT_CONTRACT"] as const;
export type FeeTrigger = (typeof FEE_TRIGGERS)[number];

export interface PlatformFeeConfig {
  enabled: boolean;
  percentageBps: number; //  % van de opdrachtwaarde in bps (250 = 2,5%)
  fixedCents: number; //     vast bedrag i.p.v. percentage (0 = uit)
  payer: FeePayer;
  trigger: FeeTrigger;
  vatRegime: VatRegime; //   BTW over de fee
}

/** Default: fee volledig UIT (Besluit 4). Mechaniek staat klaar, wordt niet toegepast. */
export const PLATFORM_FEE: PlatformFeeConfig = {
  enabled: false,
  percentageBps: 0,
  fixedCents: 0,
  payer: "CLIENT",
  trigger: "AFTER_PAYMENT",
  vatRegime: "STANDARD_HIGH",
};

// --- Tenant-billing (franchise-monetisatie, ADR-0006 blok E) ----------------
// 3+1 hybride model: een maandabonnement per vestiging (tenant) + een lichte transactie-fee per
// gevulde samenwerking. AANGEZET met een hybride staffel (lage drempel, fee daalt per plan). De fee
// wordt bij betaling idempotent als PENDING geregistreerd (record-fee.ts) en getoond op
// /franchise/facturatie. Bedragen zijn config-driven en door de eigenaar bij te stellen. Resterend
// MENSENWERK (MENSENWERK.md §3): definitieve prijzen, betaalprovider/incasso, BTW-classificatie door
// de belastingadviseur (bemiddelaar i.p.v. principaal) vóór er daadwerkelijk gefactureerd wordt, en
// het aparte ZZP-abonnement (per gebruiker, vereist provider).
export interface TenantPlanConfig {
  key: string;
  label: string;
  monthlyPriceCents: number; // abonnement per vestiging per maand (0 = nog niet bepaald)
  feePercentageBps: number; //  transactie-fee als % van de samenwerkingswaarde (bps)
  feeFixedCents: number; //     of een vast bedrag per gevulde samenwerking (heeft voorrang als > 0)
}

export interface TenantBillingConfig {
  enabled: boolean;
  vatRegime: VatRegime; //      BTW over abonnement + fee (B2B-dienst, classificatie = mensenwerk)
  defaultPlanKey: string;
  plans: Record<string, TenantPlanConfig>;
}

/**
 * Hybride staffel (excl. btw, 21% komt erbovenop): instap gratis met de hoogste fee, hogere plannen
 * met een vast vestiging-abonnement en een lagere fee — zo blijft de drempel laag en schaalt de
 * verdienste mee met het succes van de franchise. Bedragen door de eigenaar bij te stellen.
 *   FREE  — € 0 /mnd  + 2,5% per samenwerking
 *   GROEI — € 99 /mnd + 1,75%
 *   PRO   — € 199 /mnd + 1,0%
 */
export const TENANT_BILLING: TenantBillingConfig = {
  enabled: true,
  vatRegime: "STANDARD_HIGH",
  defaultPlanKey: "FREE",
  plans: {
    FREE: { key: "FREE", label: "Gratis", monthlyPriceCents: 0, feePercentageBps: 250, feeFixedCents: 0 }, // prettier-ignore
    GROEI: { key: "GROEI", label: "Groei", monthlyPriceCents: 9900, feePercentageBps: 175, feeFixedCents: 0 }, // prettier-ignore
    PRO: { key: "PRO", label: "Pro", monthlyPriceCents: 19900, feePercentageBps: 100, feeFixedCents: 0 }, // prettier-ignore
  },
};

// --- ZZP-platformabonnement (PIDZ-model) ------------------------------------
// Een maandbijdrage per ZZP'er, maar alleen in maanden waarin de ZZP'er werk heeft (≥1 goedgekeurde
// prestatie). De geplande taak (zzp-membership-task) registreert de bijdrage idempotent als PENDING;
// er wordt nog NIETS geïncasseerd (betaalprovider = mensenwerk). Bedrag excl. btw, bij te stellen.
export interface ZzpMembershipConfig {
  enabled: boolean;
  monthlyPriceCents: number; // bijdrage per actieve maand, excl. btw
  vatRegime: VatRegime;
}

export const ZZP_MEMBERSHIP: ZzpMembershipConfig = {
  enabled: true,
  monthlyPriceCents: 4000, // € 40 per actieve maand (excl. btw)
  vatRegime: "STANDARD_HIGH",
};

// --- Reminder-cascade (tijden in dagen, configureerbaar) -------------------
export const REMINDERS = {
  /** Concept-factuur door ZZP'er nog niet ingediend (na Event B2). */
  conceptInvoiceDays: [0, 3, 7] as const,
  /**
   * Ingediende prestatie (urenstaat/oplevering) nog niet door de opdrachtgever gekeurd (na Event B1).
   * Herinneringsdagen ná indienen; na de laatste dag escaleert het platform naar de admins. Zo blijft
   * de cascade niet eindeloos hangen wanneer het grace-venster (auto-goedkeuring) uitstaat.
   */
  performanceApprovalDays: [3, 7] as const,
  /**
   * Open dispuut (zijpad §4): zolang een dispuut openstaat is de facturatiecascade bevroren.
   * Herinneringsdagen ná het openen van het dispuut naar béíde partijen; na de laatste dag
   * escaleert het platform naar de admins voor bemiddeling. Zonder nudge blijft de cascade
   * (en dus de betaling) eindeloos bevroren.
   */
  disputeReminderDays: [3, 7] as const,
  /**
   * Open urenstaat: een lopende uurtarief-samenwerking waarvan de laatst ingediende prestatie al dit
   * aantal dagen geleden is en er niets meer in concept/ter beoordeling staat. Herinnert de ZZP'er om
   * de volgende urenstaat in te dienen zodat de facturatiecascade niet stilvalt (stap vóór Event B1).
   */
  performanceSubmissionDays: [7, 14] as const,
  /** Betaaltermijn opdrachtgever (na Event D): dagen vóór/na vervaldag. */
  paymentBeforeDueDays: [5, 1] as const,
  /**
   * Kandidaat wacht op een beslissing van de opdrachtgever (VIEWED/SHORTLIST). Dit zijn OFFSETS
   * bovenop de per-fase aandachtsdrempel (`WAIT_ATTENTION_DAYS`: VIEWED 14, SHORTLIST 21), zodat de
   * eerste nudge exact samenvalt met het moment waarop de reactie op /kandidaten "wacht al langer dan
   * gebruikelijk" gaat tonen (geen drift). `0` = op de drempel, `7` = een week later als vervolg.
   * NEW-reacties tellen niet mee: die dekt de "nieuwe reacties"-taak al (anders dubbel).
   */
  applicationDecisionDays: [0, 7] as const,
  /**
   * Onbeantwoord bericht: de ontvanger van het laatste bericht heeft nog niet geantwoord en het
   * gesprek ligt stil. Dit zijn OFFSETS bovenop de in-app stiltedrempel `CONVERSATION_STALE_DAYS`
   * (3), zodat de eerste nudge exact samenvalt met het moment waarop /berichten het gesprek als
   * "stil — wacht op antwoord" markeert (geen drift). `0` = op de drempel (dag 3), `4` = een
   * vervolg-nudge (dag 7); daarna stopt het (max 2 nudges per gesprek).
   */
  conversationReplyDays: [0, 4] as const,
  /**
   * E-mail-fallback (digest): ongelezen in-app-notificaties ouder dan dit aantal uren worden
   * gebundeld in één e-mail per gebruiker. De wachttijd geeft de app-route eerst de kans;
   * wie dagelijks inlogt krijgt nooit digest-mail.
   */
  notificationDigestMinAgeHours: 24,
} as const;

// --- Acceptatie-/grace-venster voor ingediende prestaties (§4 Event B/B2) ---
// Een ingediende prestatie die de opdrachtgever niet binnen dit aantal dagen beoordeelt, wordt
// automatisch goedgekeurd (zodat de ZZP'er kan factureren ondanks een stille opdrachtgever).
// Dit is een FINANCIEEL beleid (auto-goedkeuring genereert een concept-factuur) en staat daarom
// standaard UIT: alleen actief wanneer de eigenaar PERFORMANCE_GRACE_DAYS > 0 zet. 0/leeg = uit.
export function parseGraceDays(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** Geconfigureerd grace-venster in dagen; 0 = uitgeschakeld (geen auto-goedkeuring). */
export function performanceGraceDays(): number {
  return parseGraceDays(process.env.PERFORMANCE_GRACE_DAYS);
}

// Blind beoordelingsvenster (double-blind reveal): dagen na afronding waarin beide partijen kunnen
// beoordelen vóór de simultane onthulling. Anders dan het grace-venster staat dit standaard AAN
// (DEFAULT_REVIEW_BLIND_DAYS) — een ongeldige/lege env valt terug op de standaard, nooit op 0.
export function reviewBlindDays(): number {
  const raw = process.env.REVIEW_BLIND_DAYS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_REVIEW_BLIND_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_REVIEW_BLIND_DAYS;
  return Math.floor(n);
}

// --- Auditlog-retentie (AVG dataminimalisatie, art. 5 lid 1e) ---------------
// Het verwerkingsregister (RETENTION_SCHEDULE, key "auditlog-beveiligingslogboeken") stelt de
// bewaartermijn voor auditlog/beveiligingslogboeken op 12 maanden: langer bewaren staat niet in
// verhouding tot het doel (beveiliging/fraudepreventie). Auditregels bevatten IP-adres + user-agent,
// dus onbeperkt bewaren is een dataminimalisatie-risico. Deze taak snoeit regels ouder dan het
// venster. Wissen is ONOMKEERBAAR en staat daarom standaard UIT: alleen actief wanneer de eigenaar
// AUDIT_LOG_RETENTION_DAYS > 0 zet. 0/leeg = uit (huidig gedrag, geen wissen).
export const AUDIT_LOG_RETENTION_MIN_DAYS = 30;
export function parseAuditRetentionDays(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // Veilige minimumvloer: een te korte termijn (bv. een typefout "3" i.p.v. "365") zou vrijwel het
  // hele beveiligingslogboek wissen. Klem naar boven zodat een misconfiguratie nooit recente
  // security-/fraude-logs weggooit; de bovengrens laten we bewust vrij (langer = operator-keuze).
  return Math.max(AUDIT_LOG_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd auditlog-retentievenster in dagen; 0 = uitgeschakeld (geen wissen). */
export function auditLogRetentionDays(): number {
  return parseAuditRetentionDays(process.env.AUDIT_LOG_RETENTION_DAYS);
}

// --- Webhook-event-ledger-retentie (opslag-hygiëne) -------------------------
// De betaal-webhook (`/api/billing/webhook`) legt elk verwerkt provider-event vast in
// ProcessedWebhookEvent (uniek op provider+eventKey) voor exact-één-keer-verwerking. Die ledger groeit
// monotoon zodra recurring billing het eventvolume opvoert. Deze taak snoeit rijen ouder dan het
// venster. De rijen bevatten GEEN persoonsgegevens (alleen een opaque providerreferentie + status), dus
// dit is opslag-hygiëne, niet AVG-minimalisatie. Standaard UIT (leeg/0 = onbeperkt bewaren, huidig
// gedrag) zodat de replay-beschermingsledger nooit ongewild krimpt. Veilige minimumvloer beschermt tegen
// een typefout: het venster moet comfortabel boven het retry-/resend-venster van de provider blijven
// (Stripe/Mollie leveren een event tot enkele dagen opnieuw af) — anders zou een te lage waarde de
// replay-bescherming heropenen.
export const WEBHOOK_EVENT_RETENTION_MIN_DAYS = 30;
export function parseWebhookEventRetentionDays(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(WEBHOOK_EVENT_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd webhook-ledger-retentievenster in dagen; 0 = uitgeschakeld (onbeperkt bewaren). */
export function webhookEventRetentionDays(): number {
  return parseWebhookEventRetentionDays(process.env.WEBHOOK_EVENT_RETENTION_DAYS);
}

// --- Acquisitie-lead-retentie (AVG art. 5(1)(e) opslagbeperking) ------------
// Het verwerkingsregister ("lead-acquisitie-bemiddelaar" / RETENTION_SCHEDULE "acquisitie-leads")
// belooft dat een BESLISTE lead (KLANT of NO_DEAL) na afronding van het verkoopproces + 12 maanden
// wordt gewist, inclusief zijn contactlogboek (prospect-PII: organisatie, contactnaam, e-mail,
// telefoon, notities). Anders dan de webhook-ledger (opslag-hygiëne, standaard UIT) is dít een
// AVG-verplichting: prospect-PII onbeperkt bewaren ís de overtreding. Daarom staat de sweep
// standaard AAN op het beloofde venster (LEAD_RETENTION_DEFAULT_DAYS) wanneer de env leeg is; een
// operator kan tunen of via een expliciete 0/negatieve waarde uitzetten. De minimumvloer voorkomt
// dat een typefout nog-recente acquisitiehistorie te agressief wist.
export const LEAD_RETENTION_MIN_DAYS = 90;
export const LEAD_RETENTION_DEFAULT_DAYS = 365; // 12 maanden — het in het register beloofde venster.
export function parseLeadRetentionDays(raw: string | undefined): number {
  // Leeg/ongeconfigureerd → dwing het beloofde venster af (fail-safe naar wissen, niet naar bewaren).
  if (raw === undefined || raw.trim() === "") return LEAD_RETENTION_DEFAULT_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return LEAD_RETENTION_DEFAULT_DAYS;
  if (n <= 0) return 0; // expliciete operator-override: retentie uit.
  return Math.max(LEAD_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd lead-retentievenster in dagen; 0 = uitgeschakeld (expliciete override). */
export function leadRetentionDays(): number {
  return parseLeadRetentionDays(process.env.LEAD_RETENTION_DAYS);
}

// --- Beveiligingsincident-IP-retentie (AVG art. 5(1)(c)/(e)) ----------------
// De anomaliedetector (monitoring/detectors.ts) legt bij een inlog-burst/reset-flood het bron-IP vast
// in HealthIncident.evidence én in de summary. Een IP-adres is een persoonsgegeven; een incident
// onbeperkt bewaren mét dat IP overtreedt de opslagbeperking/dataminimalisatie. Deze sweep redact het
// IP ná het venster — het incident zelf (type/ernst/aantal) blijft als beveiligingssignaal bewaard,
// alléén de PII verdwijnt. Omdat redactie NIET-destructief is voor de beveiligingswaarde (anders dan
// het onomkeerbaar wissen van hele auditregels) staat deze sweep — net als lead-retentie — standaard
// AAN op een verstandig venster: onbeperkte IP-retentie ís hier de overtreding. Het venster laat het
// IP lang genoeg staan voor incidentonderzoek (default 90 dagen = één kwartaal). Leeg/ongeldig → 90;
// een te lage waarde wordt geklemd naar minstens 30 dagen; een expliciete 0 (of negatief) zet de
// redactie UIT.
export const HEALTH_INCIDENT_IP_RETENTION_MIN_DAYS = 30;
export const HEALTH_INCIDENT_IP_RETENTION_DEFAULT_DAYS = 90;
export function parseHealthIncidentIpRetentionDays(raw: string | undefined): number {
  // Leeg/ongeconfigureerd → dwing het default-venster af (fail-safe naar redigeren, niet naar bewaren).
  if (raw === undefined || raw.trim() === "") return HEALTH_INCIDENT_IP_RETENTION_DEFAULT_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return HEALTH_INCIDENT_IP_RETENTION_DEFAULT_DAYS;
  if (n <= 0) return 0; // expliciete operator-override: redactie uit.
  return Math.max(HEALTH_INCIDENT_IP_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd incident-IP-retentievenster in dagen; 0 = uitgeschakeld (expliciete override). */
export function healthIncidentIpRetentionDays(): number {
  return parseHealthIncidentIpRetentionDays(process.env.HEALTH_INCIDENT_IP_RETENTION_DAYS);
}

// --- Notificatiehistorie-retentie (AVG art. 5(1)(e) opslagbeperking) --------
// Het verwerkingsregister (entry "notificaties-email" / RETENTION_SCHEDULE "notificaties-meldingen")
// belooft "Notificatiehistorie max. 6 maanden". Een Notification-rij draagt PII in title/body
// (bv. "Nieuwe reactie van <naam> op <opdracht>", bedragen, statusupdates); die onbeperkt bewaren ís
// de overtreding. Net als lead-/routing-cache-retentie is dít een AVG-verplichting, geen loutere
// opslag-hygiëne — daarom staat de sweep standaard AAN op het beloofde venster wanneer de env leeg is.
// Een operator kan tunen; een expliciete 0/negatieve waarde zet 'm uit. De minimumvloer voorkomt dat
// een typefout nog-recente notificatiehistorie te agressief wist.
export const NOTIFICATION_RETENTION_MIN_DAYS = 30;
export const NOTIFICATION_RETENTION_DEFAULT_DAYS = 180; // 6 maanden — het in het register beloofde venster.
export function parseNotificationRetentionDays(raw: string | undefined): number {
  // Leeg/ongeconfigureerd → dwing het beloofde venster af (fail-safe naar wissen, niet naar bewaren).
  if (raw === undefined || raw.trim() === "") return NOTIFICATION_RETENTION_DEFAULT_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return NOTIFICATION_RETENTION_DEFAULT_DAYS;
  if (n <= 0) return 0; // expliciete operator-override: retentie uit.
  return Math.max(NOTIFICATION_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd notificatiehistorie-retentievenster in dagen; 0 = uitgeschakeld (expliciete override). */
export function notificationRetentionDays(): number {
  return parseNotificationRetentionDays(process.env.NOTIFICATION_RETENTION_DAYS);
}

// --- Reactie-/sollicitatie-retentie (AVG art. 5(1)(e), opslagbeperking) ------
// Het verwerkingsregister ("opdrachten-reacties-matching") belooft reactie-inhoud "tot 4 weken na
// afronding van de selectieprocedure" te bewaren. Een Application-rij draagt vrije-tekst-PII in
// `motivation` (kan bijzondere-categorie-gegevens bevatten, zie de eigen comment in
// account-anonymization.ts) plus de interne `note`; die onbeperkt bewaren ís de overtreding. Net als
// notificatie-/lead-retentie is dít een AVG-verplichting: de sweep staat standaard AAN op het beloofde
// venster (28 dagen ≈ 4 weken) wanneer de env leeg is. Een operator kan tunen; een expliciete
// 0/negatieve waarde zet 'm uit. De minimumvloer voorkomt dat een typefout nog-recente reacties te
// agressief wist. Alleen terminale, niet-geaccepteerde reacties (REJECTED/WITHDRAWN, zonder
// samenwerking) vallen onder de sweep — de selectieprocedure is voor die reacties aantoonbaar afgerond.
export const APPLICATION_RETENTION_MIN_DAYS = 7;
export const APPLICATION_RETENTION_DEFAULT_DAYS = 28; // 4 weken — het in het register beloofde venster.
export function parseApplicationRetentionDays(raw: string | undefined): number {
  // Leeg/ongeconfigureerd → dwing het beloofde venster af (fail-safe naar wissen, niet naar bewaren).
  if (raw === undefined || raw.trim() === "") return APPLICATION_RETENTION_DEFAULT_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return APPLICATION_RETENTION_DEFAULT_DAYS;
  if (n <= 0) return 0; // expliciete operator-override: retentie uit.
  return Math.max(APPLICATION_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd reactie-/sollicitatie-retentievenster in dagen; 0 = uitgeschakeld (expliciete override). */
export function applicationRetentionDays(): number {
  return parseApplicationRetentionDays(process.env.APPLICATION_RETENTION_DAYS);
}

// --- Berichten-/gespreks-retentie (AVG art. 5(1)(e), opslagbeperking) --------
// Het verwerkingsregister ("berichten-communicatie") belooft berichten "duur van de samenwerking +
// redelijke termijn (max. 12 maanden na beëindiging)" te bewaren. Een Message-rij draagt vrije-tekst-PII
// in `body` (de daadwerkelijke chatinhoud tussen ZZP'er en opdrachtgever); die onbeperkt bewaren ís de
// overtreding. Anders dan reactie-/notificatie-retentie staat deze sweep standaard UIT: berichten hebben
// aantoonbare waarde voor geschillenbeslechting (de eigen rationale in het register) en wissen is
// ONOMKEERBAAR — dezelfde afweging als AUDIT_LOG_RETENTION_DAYS. De taak (message-retention-task.ts)
// snoeit pas berichten ouder dan het venster zodra de eigenaar (na juridisch akkoord) een venster zet, en
// nooit berichten van een lopende samenwerking (PROPOSED/ACTIVE). 0/leeg = uit (huidig gedrag). De
// minimumvloer beschermt tegen een typefout ("3" i.p.v. "365") die vrijwel de hele historie zou wissen.
export const MESSAGE_RETENTION_MIN_DAYS = 30;
export function parseMessageRetentionDays(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(MESSAGE_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd berichten-retentievenster in dagen; 0 = uitgeschakeld (onbeperkt bewaren). */
export function messageRetentionDays(): number {
  return parseMessageRetentionDays(process.env.MESSAGE_RETENTION_DAYS);
}

// --- Support-ticket-retentie (AVG art. 5(1)(e), opslagbeperking) -------------
// Het verwerkingsregister ("support-communicatie") belooft helpdesk-tickets "tot afhandeling + een
// redelijke termijn" te bewaren. Een SupportTicket-rij draagt vrije-tekst-PII in `subject` en elke
// SupportMessage in `body` (de aanvrager beschrijft z'n probleem — kan naam/contact/situatiedetails
// bevatten); die onbeperkt bewaren ís de overtreding, en support was het enige PII-model zónder
// retentie-sweep. Net als notificatie-/reactie-retentie is dít een AVG-verplichting: de sweep staat
// standaard AAN op een ruim venster (365 dagen ≈ 12 maanden na afhandeling) wanneer de env leeg is.
// Anders dan berichten tussen partijen (message-retention, default UIT wegens geschillenwaarde) is
// support-communicatie operationeel platformverkeer; een jaar na afhandeling is er geen grond meer om
// het te bewaren. Alleen RESOLVED-tickets vallen onder de sweep (open/wachtende tickets nooit); de
// verwijdering ankert op `resolvedAt` (het afhandelmoment). Een operator kan tunen; een expliciete
// 0/negatieve waarde zet 'm uit. De minimumvloer voorkomt dat een typefout ("3" i.p.v. "365") nog-verse
// afgehandelde tickets te agressief wist. Verwijderen van een ticket cascadeert naar z'n SupportMessages.
export const SUPPORT_TICKET_RETENTION_MIN_DAYS = 30;
export const SUPPORT_TICKET_RETENTION_DEFAULT_DAYS = 365; // 12 maanden na afhandeling — het beloofde venster.
export function parseSupportTicketRetentionDays(raw: string | undefined): number {
  // Leeg/ongeconfigureerd → dwing het beloofde venster af (fail-safe naar wissen, niet naar bewaren).
  if (raw === undefined || raw.trim() === "") return SUPPORT_TICKET_RETENTION_DEFAULT_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return SUPPORT_TICKET_RETENTION_DEFAULT_DAYS;
  if (n <= 0) return 0; // expliciete operator-override: retentie uit.
  return Math.max(SUPPORT_TICKET_RETENTION_MIN_DAYS, Math.floor(n));
}

/** Geconfigureerd support-ticket-retentievenster in dagen; 0 = uitgeschakeld (expliciete override). */
export function supportTicketRetentionDays(): number {
  return parseSupportTicketRetentionDays(process.env.SUPPORT_TICKET_RETENTION_DAYS);
}

// --- Cron-heartbeat venster (observability, dead-man's-switch) --------------
// Maximale leeftijd (in uren) van de laatste geplande-taken-cron-run vóór 'ie als "stale" geldt op
// /admin/systeemstatus. De cron draait standaard dagelijks (run-all-tasks.yml, 05:00 UTC); de
// default van 36 uur laat één gemiste run + wat speling toe zonder direct alarm.
export const CRON_MAX_AGE_HOURS_DEFAULT = 36;
export const CRON_MAX_AGE_HOURS_MIN = 1;
export const CRON_MAX_AGE_HOURS_MAX = 24 * 30; // 30 dagen bovengrens; ruim genoeg voor elke cadans.
export function parseCronMaxAgeHours(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return CRON_MAX_AGE_HOURS_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return CRON_MAX_AGE_HOURS_DEFAULT;
  // Klem naar een verstandige bandbreedte: een typefout mag de dead-man's-switch niet nutteloos
  // maken (te klein → altijd alarm) of uitschakelen (absurd groot → nooit alarm).
  return Math.min(CRON_MAX_AGE_HOURS_MAX, Math.max(CRON_MAX_AGE_HOURS_MIN, Math.floor(n)));
}

/** Geconfigureerd cron-heartbeat-venster in uren (default 36). */
export function cronMaxAgeHours(): number {
  return parseCronMaxAgeHours(process.env.CRON_MAX_AGE_HOURS);
}

// --- Back-up-heartbeat venster (observability, dead-man's-switch) -----------
// Maximale leeftijd (in uren) van de laatste geslaagde database-back-up vóór 'ie als "stale" geldt op
// /admin/systeemstatus. Back-ups draaien doorgaans dagelijks; de default van 48 uur laat één gemiste
// dagcyclus + speling toe zonder direct alarm (iets ruimer dan de cron: back-up-schema's zijn vaker
// dagelijks en de dump zelf kan een uur lopen).
export const BACKUP_MAX_AGE_HOURS_DEFAULT = 48;
export const BACKUP_MAX_AGE_HOURS_MIN = 1;
export const BACKUP_MAX_AGE_HOURS_MAX = 24 * 30; // 30 dagen bovengrens; ruim genoeg voor elke cadans.
export function parseBackupMaxAgeHours(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return BACKUP_MAX_AGE_HOURS_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return BACKUP_MAX_AGE_HOURS_DEFAULT;
  // Klem naar een verstandige bandbreedte: een typefout mag de dead-man's-switch niet nutteloos
  // maken (te klein → altijd alarm) of uitschakelen (absurd groot → nooit alarm).
  return Math.min(BACKUP_MAX_AGE_HOURS_MAX, Math.max(BACKUP_MAX_AGE_HOURS_MIN, Math.floor(n)));
}

/** Geconfigureerd back-up-heartbeat-venster in uren (default 48). */
export function backupMaxAgeHours(): number {
  return parseBackupMaxAgeHours(process.env.BACKUP_MAX_AGE_HOURS);
}

// --- Vastgelopen-PENDING-abonnement venster (observability, stille-faal-detector) ---------------
// Maximale leeftijd (in uren) dat een abonnement in status PENDING mag verkeren vóór 'ie als
// "vastgelopen" telt. Een betaalde checkout upsert een Subscription naar PENDING; de betaal-webhook
// zet 'm daarna gezaghebbend op ACTIVE (paid) of PAST_DUE (failed). Blijft een rij lang PENDING, dan
// is de checkout verlaten óf — kritischer — de webhook levert stil niet af (verkeerde URL,
// handtekening-mismatch): dan blijft ÉLKE checkout op PENDING staan en wordt niemand geactiveerd,
// zonder dat iets dat toont. De default van 24 uur is een ruime marge voor de instant-methodes
// (iDEAL/kaart/Apple/Google Pay, die binnen minuten afronden). LET OP: schakelt de operator een
// meerdaags-afwikkelende methode in (SEPA-overboeking via Mollie blijft dagen legitiem "open"), zet
// dan een ruimer venster zodat een legitieme trage betaling niet als vastgelopen telt.
export const SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT = 24;
export const SUBSCRIPTION_PENDING_STALE_HOURS_MIN = 1;
export const SUBSCRIPTION_PENDING_STALE_HOURS_MAX = 24 * 30; // 30 dagen bovengrens; ruim voor elke afwikkeling.
export function parseSubscriptionPendingStaleHours(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT;
  // Klem naar een verstandige bandbreedte: een typefout mag de detector niet nutteloos maken (te
  // klein → een legitieme in-flight checkout telt al als vastgelopen) of uitschakelen (absurd groot).
  return Math.min(
    SUBSCRIPTION_PENDING_STALE_HOURS_MAX,
    Math.max(SUBSCRIPTION_PENDING_STALE_HOURS_MIN, Math.floor(n)),
  );
}

/** Geconfigureerd vastgelopen-PENDING-venster in uren (default 24). */
export function subscriptionPendingStaleHours(): number {
  return parseSubscriptionPendingStaleHours(process.env.SUBSCRIPTION_PENDING_STALE_HOURS);
}

// --- Abonnements-reconciliatie (webhook-backstop) --------------------------
// De reconcile-cron (src/lib/subscription-reconcile-task.ts) poll't de betaalprovider voor PENDING-
// abonnementen die langer dan dit venster op een webhook-bevestiging wachten, en past de opgehaalde
// status alsnog toe (self-healing bij een gemiste/stille webhook). Het venster is bewust *korter* dan
// het stale-detectievenster (SUBSCRIPTION_PENDING_STALE_HOURS): de poll heelt een gemiste webhook
// idealiter vóór de stale-gauge ooit afgaat. Ondergrens beschermt een legitiem in-flight checkout
// (instant iDEAL/kaart rondt binnen minuten af; onder de ondergrens zou de poll een normale betaling
// al opvragen); een `open`-status laat de rij hoe dan ook ongemoeid, dus een trage SEPA-betaling wordt
// nooit ten onrechte omgezet. Bovengrens = 24u zodat een typefout de backstop niet uitschakelt.
export const SUBSCRIPTION_RECONCILE_AFTER_MINUTES_DEFAULT = 30;
export const SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MIN = 5;
export const SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MAX = 24 * 60; // 24u bovengrens.
export function parseSubscriptionReconcileAfterMinutes(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return SUBSCRIPTION_RECONCILE_AFTER_MINUTES_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return SUBSCRIPTION_RECONCILE_AFTER_MINUTES_DEFAULT;
  return Math.min(
    SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MAX,
    Math.max(SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MIN, Math.floor(n)),
  );
}

/** Geconfigureerd reconcile-venster in minuten (default 30). */
export function subscriptionReconcileAfterMinutes(): number {
  return parseSubscriptionReconcileAfterMinutes(process.env.SUBSCRIPTION_RECONCILE_AFTER_MINUTES);
}

// Max aantal abonnementen dat één reconcile-tick bij de provider opvraagt. Begrenst de uitgaande
// provider-calls per run (elke rij = één GET) zodat een grote achterstand niet in één tick de provider
// bestookt of de cron-deadline overschrijdt; de resterende rijen komen de volgende tick aan de beurt.
export const SUBSCRIPTION_RECONCILE_MAX_BATCH_DEFAULT = 50;
export const SUBSCRIPTION_RECONCILE_MAX_BATCH_MIN = 1;
export const SUBSCRIPTION_RECONCILE_MAX_BATCH_MAX = 500;
export function parseSubscriptionReconcileMaxBatch(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return SUBSCRIPTION_RECONCILE_MAX_BATCH_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return SUBSCRIPTION_RECONCILE_MAX_BATCH_DEFAULT;
  return Math.min(
    SUBSCRIPTION_RECONCILE_MAX_BATCH_MAX,
    Math.max(SUBSCRIPTION_RECONCILE_MAX_BATCH_MIN, Math.floor(n)),
  );
}

/** Geconfigureerde reconcile-batchgrootte per tick (default 50). */
export function subscriptionReconcileMaxBatch(): number {
  return parseSubscriptionReconcileMaxBatch(process.env.SUBSCRIPTION_RECONCILE_MAX_BATCH);
}

// --- Annuleringstermijn (productbesluit eigenaar 12-6-2026) ----------------
// De opdrachtgever annuleert kosteloos zolang de startdatum nog minstens dit aantal dagen weg is;
// korter op de start (of na de start) ontstaat een betalingsverplichting. Symmetrisch geregistreerd:
// ook de ZZP'er annuleert met verplichte reden, maar zonder kostenregel (dat pad loopt via
// herplaatsing/no-show-registratie).
export const CANCELLATION_FREE_DAYS = 7;

// --- Reiskosten (kilometervergoeding) --------------------------------------
// Belastingvrije kilometervergoeding voor zakelijke ritten: € 0,23 per km (prijspeil 2024–2026,
// art. 15b Wet LB / Belastingdienst). Standaardtarief waarmee de ZZP'er een reiskosten-regel op een
// handmatige factuur voorinvult; hij kan het bedrag altijd overschrijven. Geen fiscaal advies —
// dit is een gemaks-standaard. Bijstellen = mensenwerk zodra het tarief officieel wijzigt.
export const MILEAGE_RATE_CENTS = 23; // € 0,23 per kilometer

// --- Rechtsvermoeden werknemerschap (wetsvoorstel VBAR, aangenomen 21-4-2026) ----------------
// Bij een uurtarief onder €38 (prijspeil 2025) kan de werkende een rechtsvermoeden van loondienst
// inroepen (art. 7:610a BW zoals gewijzigd). Verwachte inwerkingtreding: 1-1-2027.
// Bron: Wet toelating terbeschikkingstelling van arbeidskrachten / VBAR, Staatsblad 2026.
// Geen juridisch advies — dit is een signaaldrempel.
export const RECHTSVERMOEDEN_DREMPEL_CENTS = 3800; // €38 in centen

// --- Marktband (tarief vs. markt) — anonimiseringsdrempel -------------------
// Minimaal dit aantal peer-tarieven vereist voordat we een marktband tonen.
// Voorkomt dat een ZZP'er het tarief van één collega kan herleiden.
// k-anonimiteitsvloer = 10 (security-review 14-6-2026): bij een kleine steekproef zijn de
// individuele tarieven uit p25/mediaan/p75 te herleiden — uurtarief is persoonlijke financiële
// data (AVG). Bij < 10 peers wordt de band niet getoond (scope "none"). Drempel = mensenwerk/
// AVG-keuze; bevestig de waarde vóór livegang met echte gebruikers.
export const MARKET_RATE_MIN_SAMPLE = 10;
// Bovengrens op het aantal peer-tarieven dat we per band ophalen: een ruime
// steekproef voor een representatieve mediaan/spreiding mét harde geheugengrens.
export const MARKET_RATE_SAMPLE_CAP = 5000;

// --- DBA-monitoring drempels & teksten (§6, configureerbaar) ----------------
export const DBA_THRESHOLDS = {
  durationSignalMonths: 6, //        eerste duursignaal
  durationStrongSignalMonths: 12, //  sterker duursignaal
  revenueConcentrationPct: 80, //     >80% omzet bij één opdrachtgever
} as const;

/** Vaste disclaimer bij elk DBA-signaal (Besluit 2 — geen juridisch advies/garantie). */
export const DBA_DISCLAIMER =
  "Dit is een signaal ter informatie en geen juridisch advies; het platform beoordeelt niet of " +
  "aan de wet wordt voldaan. De eindverantwoordelijkheid ligt bij opdrachtgever en ZZP'er.";

// --- Betaalstatus-bevestiging (Besluit 0B punt 2, configureerbaar) ----------
export const PAYMENT_CONFIRMATION = {
  /** Default: ZZP'er bevestigt ontvangst → bevestigd. Beide partijen = strenger. */
  requireBothParties: false,
} as const;

// --- ORT / onregelmatigheidstoeslagen (zorg) — CONFIGUREERBAAR per CAO -------
// Toeslag bovenop het basisuurtarief, per tijdscategorie. Percentages in basispunten (bps):
// 2200 = +22%. Dit zijn VOORBEELDWAARDEN (CAO-achtig); de echte percentages verschillen per CAO
// en worden bij voorkeur per opdrachtgever/contract overschreven. NORMAL = geen toeslag.
export const ORT_CATEGORIES = ["EVENING", "NIGHT", "SATURDAY", "SUNDAY", "HOLIDAY"] as const;
export type OrtCategory = (typeof ORT_CATEGORIES)[number];

/** Nederlandse labels voor de UI. */
export const ORT_CATEGORY_LABEL: Record<OrtCategory, string> = {
  EVENING: "Avond",
  NIGHT: "Nacht",
  SATURDAY: "Zaterdag",
  SUNDAY: "Zondag",
  HOLIDAY: "Feestdag",
};

export const DEFAULT_ORT_RATES_BPS: Record<OrtCategory, number> = {
  EVENING: 2200, //   +22%
  NIGHT: 4900, //     +49%
  SATURDAY: 5200, //  +52%
  SUNDAY: 7200, //    +72%
  HOLIDAY: 10000, //  +100%
};

// Bovengrens voor een maatwerk-ORT-percentage per categorie (in bps). Voorkomt dat een
// opdrachtgever absurde toeslagen instelt die ongemerkt in elke toekomstige prestatie/factuur
// doorwerken (datameintegriteit). 500% ligt ruim boven de hoogste reële CAO-toeslag (feestdag,
// +100%) en houdt het afgeleide factuurbedrag veilig binnen de int4-kolomgrens.
export const MAX_ORT_CUSTOM_BPS = 50000; // +500%

// Tijdvensters voor automatische ORT-categorisatie uit diensttijden (uur, lokale tijd).
// Avond = [eveningStartHour, nightStartHour); Nacht = [nightStartHour, 24) ∪ [0, nightEndHour).
// Configureerbaar per CAO; dit zijn gangbare zorg-grenzen. Weekend/feestdag gaan via de datum.
export const ORT_TIME_WINDOWS = {
  eveningStartHour: 18, // avondtoeslag vanaf 18:00
  nightStartHour: 22, //  nachttoeslag vanaf 22:00
  nightEndHour: 6, //     nacht loopt door tot 06:00
} as const;

// --- Aanmaningsladder (dunning) — dagen NÁ de vervaldag (configureerbaar) ----
// Het platform int niet (Besluit 1): dit zijn herinneringen/signalen, geen incasso. Per niveau
// wordt eenmalig een signaal gevuurd zodra dat niveau is bereikt. Drempels in dagen-na-vervaldag.
export const DUNNING_STAGES = [
  { level: "REMINDER", daysOverdue: 0, label: "Betalingsherinnering" },
  { level: "FIRST_NOTICE", daysOverdue: 14, label: "Eerste aanmaning" },
  { level: "SECOND_NOTICE", daysOverdue: 30, label: "Tweede aanmaning" },
  { level: "FINAL_NOTICE", daysOverdue: 45, label: "Laatste aanmaning" },
] as const;
export type DunningLevel = (typeof DUNNING_STAGES)[number]["level"];
/** Vanaf dit niveau wordt het platform (admins) geïnformeerd. */
export const DUNNING_ESCALATION_LEVEL: DunningLevel = "FINAL_NOTICE";

// --- ORT sector-/klantprofielen (rulesets) ----------------------------------
// ORT verschilt per zorg-CAO: VVT, GGZ, GHZ (gehandicaptenzorg) en Jeugdzorg hanteren elk
// eigen toeslagen. Een samenwerking kiest een profiel (Collaboration.ortProfile); ontbreekt dat,
// dan valt de berekening terug op DEFAULT. Een opdrachtgever kan altijd een MAATWERK-profiel met
// eigen percentages afspreken — dat overschrijft het sectorprofiel op contractniveau.
// LET OP: dit zijn VOORBEELDWAARDEN per CAO-categorie. Vóór livegang valideren met de klant tegen
// de geldende CAO; het platform claimt geen juridische juistheid van deze percentages.
export const ORT_SECTORS = ["DEFAULT", "VVT", "GGZ", "GHZ", "JEUGD"] as const;
export type OrtSector = (typeof ORT_SECTORS)[number];

/** Nederlandse labels voor de UI (sectorkeuze in de samenwerking). */
export const ORT_SECTOR_LABEL: Record<OrtSector, string> = {
  DEFAULT: "Standaard (geen specifieke CAO)",
  VVT: "VVT — Verpleeg-, Verzorgingshuizen & Thuiszorg",
  GGZ: "GGZ — Geestelijke gezondheidszorg",
  GHZ: "GHZ — Gehandicaptenzorg",
  JEUGD: "Jeugdzorg",
};

/**
 * Toeslagpercentages (bps) per sector. VOORBEELDWAARDEN — per CAO valideren met de klant.
 * DEFAULT = DEFAULT_ORT_RATES_BPS, zodat er één bron van waarheid blijft voor de fallback.
 */
export const ORT_SECTOR_PROFILES: Record<OrtSector, Record<OrtCategory, number>> = {
  DEFAULT: DEFAULT_ORT_RATES_BPS,
  VVT: {
    EVENING: 2200, //   +22%
    NIGHT: 4400, //     +44%
    SATURDAY: 4900, //  +49%
    SUNDAY: 6000, //    +60%
    HOLIDAY: 10000, //  +100%
  },
  GGZ: {
    EVENING: 2200,
    NIGHT: 5200, //     +52%
    SATURDAY: 5200,
    SUNDAY: 7500, //    +75%
    HOLIDAY: 10000,
  },
  GHZ: {
    EVENING: 2200,
    NIGHT: 4900, //     +49%
    SATURDAY: 4900,
    SUNDAY: 7200, //    +72%
    HOLIDAY: 10000,
  },
  JEUGD: {
    EVENING: 2500, //   +25%
    NIGHT: 5000, //     +50%
    SATURDAY: 5000,
    SUNDAY: 7500,
    HOLIDAY: 10000,
  },
};
