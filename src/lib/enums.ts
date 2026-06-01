// Bron van waarheid voor alle "enums" (CLAUDE.md regel 6: strings + Zod, geen native
// db-enums). Elke waarde is een string-array `as const` + een afgeleid type + een Zod
// schema. Importeer hieruit; definieer status-strings nergens anders los.

import { z } from "zod";

export const USER_ROLES = ["FREELANCER", "CLIENT", "ADMIN"] as const;
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

export const CONTRACT_STATUSES = ["DRAFT", "SENT", "SIGNED"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export const contractStatusSchema = z.enum(CONTRACT_STATUSES);

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);

export const PLAN_KEYS = ["FREE", "PRO", "BUSINESS"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];
export const planKeySchema = z.enum(PLAN_KEYS);

export const SUBSCRIPTION_STATUSES = ["ACTIVE", "PAST_DUE", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);

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
  NEW: ["TRIAGED"],
  TRIAGED: ["AUTO_ANSWERED", "ESCALATED", "RESOLVED"],
  AUTO_ANSWERED: ["RESOLVED", "ESCALATED", "REOPENED"],
  ESCALATED: ["RESOLVED", "REOPENED"],
  RESOLVED: ["REOPENED"],
  REOPENED: ["TRIAGED", "ESCALATED", "RESOLVED"],
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
