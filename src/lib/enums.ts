// Bron van waarheid voor alle "enums" (CLAUDE.md regel 6: strings + Zod, geen native
// db-enums). Elke waarde is een string-array `as const` + een afgeleid type + een Zod
// schema. Importeer hieruit; definieer status-strings nergens anders los.

import { z } from "zod";

export const USER_ROLES = ["FREELANCER", "CLIENT", "ADMIN", "FRANCHISER"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const userRoleSchema = z.enum(USER_ROLES);

export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export const userStatusSchema = z.enum(USER_STATUSES);

export const WORK_MODES = ["REMOTE", "ONSITE", "HYBRID"] as const;
export type WorkMode = (typeof WORK_MODES)[number];
export const workModeSchema = z.enum(WORK_MODES);

export const AVAILABILITIES = ["AVAILABLE", "LIMITED", "UNAVAILABLE", "UNKNOWN"] as const;
export type Availability = (typeof AVAILABILITIES)[number];
export const availabilitySchema = z.enum(AVAILABILITIES);

export const VISIBILITIES = ["PUBLIC", "PRIVATE"] as const;
export type Visibility = (typeof VISIBILITIES)[number];
export const visibilitySchema = z.enum(VISIBILITIES);

export const JOB_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
export const jobStatusSchema = z.enum(JOB_STATUSES);

export const APPLICATION_STATUSES = ["NEW", "VIEWED", "SHORTLIST", "REJECTED", "ACCEPTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const CREDENTIAL_TYPES = [
  "VOG",
  "DIPLOMA",
  "CERTIFICATE",
  "INSURANCE",
  "LICENSE",
  "OTHER",
] as const;
export type CredentialType = (typeof CREDENTIAL_TYPES)[number];
export const credentialTypeSchema = z.enum(CREDENTIAL_TYPES);

export const CREDENTIAL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
] as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];
export const credentialStatusSchema = z.enum(CREDENTIAL_STATUSES);

export const VERIFICATION_DECISIONS = ["VERIFIED", "REJECTED"] as const;
export type VerificationDecision = (typeof VERIFICATION_DECISIONS)[number];
export const verificationDecisionSchema = z.enum(VERIFICATION_DECISIONS);

export const AVAILABILITY_WINDOW_TYPES = ["AVAILABLE", "LIMITED", "UNAVAILABLE"] as const;
export type AvailabilityWindowType = (typeof AVAILABILITY_WINDOW_TYPES)[number];
export const availabilityWindowTypeSchema = z.enum(AVAILABILITY_WINDOW_TYPES);

export const DOCUMENT_KINDS = ["CREDENTIAL", "VOG", "INSURANCE", "CONTRACT", "OTHER"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export const documentKindSchema = z.enum(DOCUMENT_KINDS);

export const COLLABORATION_STATUSES = ["PROPOSED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type CollaborationStatus = (typeof COLLABORATION_STATUSES)[number];
export const collaborationStatusSchema = z.enum(COLLABORATION_STATUSES);

// Weekdagen voor het optionele per-dag-weekrooster op een samenwerking (ADR-0004). Maandag eerst
// (ISO-volgorde); opgeslagen als JSON-array van deze codes in Collaboration.weekdays.
export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const weekdaySchema = z.enum(WEEKDAYS);

// Ideeënbox: levenscyclus van een ingediend idee. OPEN = nieuw, PLANNED = opgepakt,
// DONE = uitgevoerd, DECLINED = niet gehonoreerd.
export const IDEA_STATUSES = ["OPEN", "PLANNED", "DONE", "DECLINED"] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];
export const ideaStatusSchema = z.enum(IDEA_STATUSES);

// Expliciete overgangsmap (CLAUDE.md regel 3). Een open idee wordt getrieerd; een afgehandeld
// idee (uitgevoerd/afgewezen) kan alleen heropend worden — niet rechtstreeks van DONE naar
// DECLINED springen. Een gelijke-naar-gelijke overgang is geen overgang (no-op).
export const IDEA_TRANSITIONS: Record<IdeaStatus, readonly IdeaStatus[]> = {
  OPEN: ["PLANNED", "DONE", "DECLINED"],
  PLANNED: ["OPEN", "DONE", "DECLINED"],
  DONE: ["OPEN"],
  DECLINED: ["OPEN"],
};

// Academie — cursusstatus + doelgroep. DRAFT = concept (alleen beheer), PUBLISHED = zichtbaar voor
// de doelgroep, ARCHIVED = uit de lijst (voltooiingen blijven bestaan).
export const COURSE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];
export const courseStatusSchema = z.enum(COURSE_STATUSES);

export const COURSE_TRANSITIONS: Record<CourseStatus, readonly CourseStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["PUBLISHED"],
};

// Doelgroep van een cursus. ALL = iedereen; anders rolgericht.
export const COURSE_AUDIENCES = ["ALL", "FREELANCER", "CLIENT"] as const;
export type CourseAudience = (typeof COURSE_AUDIENCES)[number];
export const courseAudienceSchema = z.enum(COURSE_AUDIENCES);

// Lead (franchise-acquisitie). KOUD = nog niet benaderd; WARM = in gesprek; KLANT = binnengehaald
// (terminaal — verder via de onboarding-wizard naar een echte opdrachtgever); NO_DEAL = afgevallen.
export const LEAD_STATUSES = ["KOUD", "WARM", "KLANT", "NO_DEAL"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const leadStatusSchema = z.enum(LEAD_STATUSES);

// Expliciete overgangsmap (CLAUDE.md regel 3). KLANT is terminaal; een afgevallen lead (NO_DEAL)
// kan heropend worden. Een gelijke-naar-gelijke overgang is geen overgang (no-op).
export const LEAD_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  KOUD: ["WARM", "NO_DEAL"],
  WARM: ["KOUD", "KLANT", "NO_DEAL"],
  KLANT: [],
  NO_DEAL: ["KOUD", "WARM"],
};

// Categorisering van een idee, in twee onafhankelijke assen zodat de box beheersbaar blijft bij
// honderden ideeën. Doelgroep (audience) = wie het raakt; PLATFORM is de catch-all/default.
export const IDEA_AUDIENCES = ["PLATFORM", "BROKER", "FREELANCER", "CLIENT"] as const;
export type IdeaAudience = (typeof IDEA_AUDIENCES)[number];
export const ideaAudienceSchema = z.enum(IDEA_AUDIENCES);

// Thema (theme) = waar het idee inhoudelijk over gaat. Optioneel: niet elk idee heeft een thema.
export const IDEA_THEMES = ["COMPLIANCE", "BILLING"] as const;
export type IdeaTheme = (typeof IDEA_THEMES)[number];
export const ideaThemeSchema = z.enum(IDEA_THEMES);

export const CONTRACT_STATUSES = ["DRAFT", "SENT", "SIGNED"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export const contractStatusSchema = z.enum(CONTRACT_STATUSES);

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);

export const PLAN_KEYS = ["FREE", "PRO", "BUSINESS"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];
export const planKeySchema = z.enum(PLAN_KEYS);

export const SUBSCRIPTION_STATUSES = ["PENDING", "ACTIVE", "PAST_DUE", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);

// Expliciete overgangsmap (CLAUDE.md regel 3). PAST_DUE → ACTIVE = betaling hersteld,
// PAST_DUE → CANCELLED = na de herinneringsladder teruggezet naar Gratis (geen actief plan).
export const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  PENDING: ["ACTIVE", "PAST_DUE", "CANCELLED"],
  ACTIVE: ["PAST_DUE", "CANCELLED"],
  PAST_DUE: ["ACTIVE", "CANCELLED"],
  CANCELLED: [],
};

// --- Tenant-billing (franchise-monetisatie, 3+1 hybride: abonnement per vestiging + transactie-fee
// per gevulde samenwerking). De prijzen/percentages zijn mensenwerk (zie MENSENWERK.md); hier staan
// alleen de sleutels + statussen. Standaard staat de facturatie UIT (zie config TENANT_BILLING).
export const TENANT_PLAN_KEYS = ["FREE", "GROEI", "PRO"] as const;
export type TenantPlanKey = (typeof TENANT_PLAN_KEYS)[number];
export const tenantPlanKeySchema = z.enum(TENANT_PLAN_KEYS);

export const TENANT_SUBSCRIPTION_STATUSES = ["ACTIVE", "PAST_DUE", "SUSPENDED"] as const;
export type TenantSubscriptionStatus = (typeof TENANT_SUBSCRIPTION_STATUSES)[number];
export const tenantSubscriptionStatusSchema = z.enum(TENANT_SUBSCRIPTION_STATUSES);

// PAST_DUE → ACTIVE = betaling hersteld; PAST_DUE → SUSPENDED = na de aanmaningsladder stilgezet;
// SUSPENDED → ACTIVE = heractiveren na betaling.
export const TENANT_SUBSCRIPTION_TRANSITIONS: Record<
  TenantSubscriptionStatus,
  readonly TenantSubscriptionStatus[]
> = {
  ACTIVE: ["PAST_DUE", "SUSPENDED"],
  PAST_DUE: ["ACTIVE", "SUSPENDED"],
  SUSPENDED: ["ACTIVE"],
};

// Transactie-fee per samenwerking: PENDING = geregistreerd, nog niet gefactureerd; INVOICED = op
// een fee-factuur gezet. Append-only (een fee verdwijnt nooit; CLAUDE.md audit-principe).
export const COLLABORATION_FEE_STATUSES = ["PENDING", "INVOICED"] as const;
export type CollaborationFeeStatus = (typeof COLLABORATION_FEE_STATUSES)[number];
export const collaborationFeeStatusSchema = z.enum(COLLABORATION_FEE_STATUSES);

// ZZP-platformabonnement: een maandbijdrage per ZZP'er (alleen in maanden met werk). PENDING =
// geregistreerd, nog niet gefactureerd; INVOICED = op een abonnementsfactuur gezet. Append-only.
export const MEMBERSHIP_CHARGE_STATUSES = ["PENDING", "INVOICED"] as const;
export type MembershipChargeStatus = (typeof MEMBERSHIP_CHARGE_STATUSES)[number];
export const membershipChargeStatusSchema = z.enum(MEMBERSHIP_CHARGE_STATUSES);

// Platform-facturatie (incasso van de eigen verdienste): de PENDING-bijdragen worden gebundeld tot
// een factuur van het platform aan de betaler — TENANT_FEE (aan de franchise) of ZZP_MEMBERSHIP
// (aan de ZZP'er). Status DRAFT → SENT → PAID (of CANCELLED); transities in platform-billing/billing.ts.
export const PLATFORM_BILLING_KINDS = ["TENANT_FEE", "ZZP_MEMBERSHIP"] as const;
export type PlatformBillingKind = (typeof PLATFORM_BILLING_KINDS)[number];
export const platformBillingKindSchema = z.enum(PLATFORM_BILLING_KINDS);

export const PLATFORM_BILLING_STATUSES = ["DRAFT", "SENT", "PAID", "CANCELLED"] as const;
export type PlatformBillingStatus = (typeof PLATFORM_BILLING_STATUSES)[number];
export const platformBillingStatusSchema = z.enum(PLATFORM_BILLING_STATUSES);

// ---------------------------------------------------------------------------
// Support / Helpdesk (klantondersteuning). Geen "AI" in UI/teksten — de
// geautomatiseerde beantwoorder heet "Support-assistent" / "Helpdesk".
// Statusovergangen via SUPPORT_TICKET_TRANSITIONS (assertTransition).
// ---------------------------------------------------------------------------

export const SUPPORT_CATEGORIES = [
  "ACCOUNT",
  "INVOICE",
  "CREDENTIAL",
  "JOB",
  "TECHNICAL",
  "PRIVACY",
  "OTHER",
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export const supportCategorySchema = z.enum(SUPPORT_CATEGORIES);

export const SUPPORT_TICKET_STATUSES = [
  "NEW",
  "TRIAGED",
  "AUTO_ANSWERED",
  "ESCALATED",
  "AWAITING_USER", // helpdesk heeft gereageerd; de bal ligt bij de aanvrager (uit de wachtrij)
  "RESOLVED",
  "REOPENED",
] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];
export const supportTicketStatusSchema = z.enum(SUPPORT_TICKET_STATUSES);

/** Enige toegestane overgangsmap voor support-tickets (CLAUDE.md regel 3). */
export const SUPPORT_TICKET_TRANSITIONS: Record<
  SupportTicketStatus,
  readonly SupportTicketStatus[]
> = {
  NEW: ["TRIAGED", "AWAITING_USER"],
  TRIAGED: ["AUTO_ANSWERED", "ESCALATED", "RESOLVED", "AWAITING_USER"],
  AUTO_ANSWERED: ["RESOLVED", "ESCALATED", "REOPENED"],
  ESCALATED: ["RESOLVED", "REOPENED", "AWAITING_USER"],
  // Helpdesk reageerde → wacht op de aanvrager. Diens reactie zet 'm terug in de wachtrij (ESCALATED).
  AWAITING_USER: ["ESCALATED", "RESOLVED", "REOPENED"],
  RESOLVED: ["REOPENED"],
  REOPENED: ["TRIAGED", "ESCALATED", "RESOLVED", "AWAITING_USER"],
};

export const SUPPORT_PRIORITIES = ["LOW", "NORMAL", "HIGH"] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export const supportPrioritySchema = z.enum(SUPPORT_PRIORITIES);

/** Wie schreef een bericht: gebruiker, menselijke support-medewerker, of de assistent. */
export const SUPPORT_AUTHOR_KINDS = ["USER", "AGENT", "ASSISTANT"] as const;
export type SupportAuthorKind = (typeof SUPPORT_AUTHOR_KINDS)[number];
export const supportAuthorKindSchema = z.enum(SUPPORT_AUTHOR_KINDS);

// ---------------------------------------------------------------------------
// Platform-bewaking (health + security monitor). Systeem-eigenaarschap.
// Geen "AI" in UI — dit heet "Platform-bewaking" / "Bewaking".
// ---------------------------------------------------------------------------

export const INCIDENT_SOURCES = ["UPTIME", "ERROR", "CVE", "AUTH"] as const;
export type IncidentSource = (typeof INCIDENT_SOURCES)[number];
export const incidentSourceSchema = z.enum(INCIDENT_SOURCES);

export const INCIDENT_SEVERITIES = ["INFO", "WARN", "CRITICAL"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
export const incidentSeveritySchema = z.enum(INCIDENT_SEVERITIES);

export const INCIDENT_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export const incidentStatusSchema = z.enum(INCIDENT_STATUSES);

export const INCIDENT_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "RESOLVED"],
  ACKNOWLEDGED: ["RESOLVED", "OPEN"],
  RESOLVED: ["OPEN"], // heropenen kan, bv. bij herhaling
};

// ---------------------------------------------------------------------------
// Belastingaangifte-delegatie ("Wij doen je aangifte"). Het platform orchestreert en
// vraagt akkoord; een aangesloten partner-belastingkantoor is de feitelijke gemachtigde
// indiener (becon/SBR/PKIoverheid). De ZZP'er blijft zelf verantwoordelijk. Geen "AI" in UI.
// ---------------------------------------------------------------------------

export const TAX_FILING_KINDS = ["IB", "BTW"] as const;
export type TaxFilingKind = (typeof TAX_FILING_KINDS)[number];
export const taxFilingKindSchema = z.enum(TAX_FILING_KINDS);

/** Machtigingsvorm bij de Belastingdienst (zzp/eenmanszaak: DigiD-machtiging; anders eHerkenning-ketenmachtiging). */
export const MANDATE_KINDS = ["DIGID", "EHERKENNING"] as const;
export type MandateKind = (typeof MANDATE_KINDS)[number];
export const mandateKindSchema = z.enum(MANDATE_KINDS);

export const TAX_FILING_STATUSES = [
  "AKKOORD", //            consent + machtiging gegeven, klaar voor het kantoor
  "IN_BEHANDELING", //     partner-belastingkantoor werkt aan de aangifte
  "VRAGEN", //             kantoor heeft een vraag aan de klant (round-trip)
  "CONCEPT_KLAAR", //      concept klaar — wacht op review-then-submit door de klant
  "INGEDIEND", //          door het kantoor ingediend bij de Belastingdienst
  "AANSLAG_ONTVANGEN", //  (voorlopige/definitieve) aanslag terug
  "INGETROKKEN", //        machtiging ingetrokken door de klant
] as const;
export type TaxFilingStatus = (typeof TAX_FILING_STATUSES)[number];
export const taxFilingStatusSchema = z.enum(TAX_FILING_STATUSES);

/** Enige toegestane overgangsmap (CLAUDE.md regel 3). */
export const TAX_FILING_TRANSITIONS: Record<TaxFilingStatus, readonly TaxFilingStatus[]> = {
  AKKOORD: ["IN_BEHANDELING", "INGETROKKEN"],
  IN_BEHANDELING: ["VRAGEN", "CONCEPT_KLAAR", "INGETROKKEN"],
  VRAGEN: ["IN_BEHANDELING", "INGETROKKEN"],
  CONCEPT_KLAAR: ["INGEDIEND", "VRAGEN", "INGETROKKEN"],
  INGEDIEND: ["AANSLAG_ONTVANGEN"],
  AANSLAG_ONTVANGEN: [],
  INGETROKKEN: [],
};

// ---------------------------------------------------------------------------
// Credential-statusovergangen (CLAUDE.md regel 3)
//
// Dit is de enige toegestane overgangsmap. `assertTransition` in
// src/lib/credentials.ts weigert alles wat hier niet in staat (bv. DRAFT->VERIFIED).
// ---------------------------------------------------------------------------

export const CREDENTIAL_TRANSITIONS: Record<CredentialStatus, readonly CredentialStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["VERIFIED", "REJECTED"],
  VERIFIED: ["EXPIRED", "SUBMITTED"], // SUBMITTED = opnieuw beoordelen na vervangen document
  REJECTED: ["SUBMITTED", "DRAFT"], //  herstelactie: opnieuw indienen of terug naar concept
  EXPIRED: ["SUBMITTED"], //            vernieuwen -> opnieuw ter beoordeling
};
