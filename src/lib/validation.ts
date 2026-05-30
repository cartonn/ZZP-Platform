// Server-side validatieschema's (CLAUDE.md regel 2: Zod is de bron van waarheid).
// Eén plek voor alle invoervalidatie van onboarding & profielen.

import { z } from "zod";
import {
  availabilitySchema,
  availabilityWindowTypeSchema,
  credentialTypeSchema,
  documentKindSchema,
  visibilitySchema,
  workModeSchema,
} from "@/lib/enums";
import { MODEL_AGREEMENT_TYPES } from "./model-agreement";

const optionalInt = (max: number) =>
  z
    .union([z.literal(""), z.coerce.number().int().min(0).max(max)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v)));

const optionalDate = z
  .union([z.literal(""), z.coerce.date()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : (v as Date)));

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

// --- Registratie (alleen FREELANCER/CLIENT; ADMIN wordt nooit zelf aangemaakt) ---
export const registerSchema = z
  .object({
    name: trimmed(120).min(2, "Naam is te kort."),
    email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres."),
    password: z.string().min(8, "Wachtwoord moet minstens 8 tekens zijn.").max(200),
    role: z.enum(["FREELANCER", "CLIENT"], {
      errorMap: () => ({ message: "Kies een rol." }),
    }),
    companyName: optionalText(160),
  })
  .refine((d) => d.role !== "CLIENT" || !!d.companyName, {
    message: "Bedrijfsnaam is verplicht voor opdrachtgevers.",
    path: ["companyName"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// --- Freelancerprofiel ---
export const freelancerProfileSchema = z.object({
  headline: optionalText(120),
  bio: optionalText(2000),
  hourlyRate: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(2000)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v))),
  location: optionalText(120),
  availability: availabilitySchema,
  workMode: workModeSchema,
  languages: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  kvkNumber: optionalText(20),
  btwNumber: optionalText(30),
  visibility: visibilitySchema,
  skillIds: z.array(z.string().cuid()).max(50).default([]),
  industryIds: z.array(z.string().cuid()).max(20).default([]),
});
export type FreelancerProfileInput = z.infer<typeof freelancerProfileSchema>;

// --- Bedrijfsprofiel ---
export const companyProfileSchema = z.object({
  name: trimmed(160).min(2, "Bedrijfsnaam is te kort."),
  description: optionalText(2000),
  website: z
    .union([z.string().trim().url("Ongeldige URL."), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  location: optionalText(120),
  industryId: z
    .union([z.string().cuid(), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

// --- Opdracht (aanmaken/bewerken) ---
export const jobSchema = z
  .object({
    title: trimmed(160).min(3, "Titel is te kort."),
    description: trimmed(5000).min(10, "Geef een duidelijke omschrijving."),
    industryId: z
      .union([z.string().cuid(), z.literal("")])
      .optional()
      .transform((v) => (v ? v : undefined)),
    rateMin: optionalInt(2000),
    rateMax: optionalInt(2000),
    location: optionalText(120),
    workMode: workModeSchema,
    startDate: z
      .union([z.literal(""), z.coerce.date()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? undefined : (v as Date))),
    requiredSkillIds: z.array(z.string().cuid()).max(50).default([]),
    optionalSkillIds: z.array(z.string().cuid()).max(50).default([]),
    requiredCredentialTypes: z.array(credentialTypeSchema).max(20).default([]),
    optionalCredentialTypes: z.array(credentialTypeSchema).max(20).default([]),
    // Wet DBA-indicatoren (booleans uit checkboxes; durationMonths in maanden).
    dbaDirectSupervision: z.boolean().default(false),
    dbaEmbedded: z.boolean().default(false),
    dbaFixedSchedule: z.boolean().default(false),
    dbaNoSubstitution: z.boolean().default(false),
    dbaExclusive: z.boolean().default(false),
    dbaWeakEntrepreneurship: z.boolean().default(false),
    dbaDurationMonths: optionalInt(240),
    modelAgreementType: z
      .union([z.enum(MODEL_AGREEMENT_TYPES), z.literal(""), z.null(), z.undefined()])
      .transform((v) => (v ? v : null)),
  })
  .refine((d) => d.rateMin == null || d.rateMax == null || d.rateMin <= d.rateMax, {
    message: "Minimumtarief mag niet hoger zijn dan maximumtarief.",
    path: ["rateMax"],
  });
export type JobInput = z.infer<typeof jobSchema>;

// --- Reactie op een opdracht ---
export const applicationSchema = z.object({
  motivation: trimmed(2000).min(10, "Geef een korte motivatie (min. 10 tekens)."),
  proposedRate: optionalInt(2000),
  availability: optionalText(200),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

// --- Credential (metadata; het bewijsdocument wordt los gevalideerd via storage) ---
export const credentialSchema = z
  .object({
    type: credentialTypeSchema,
    title: trimmed(160).min(2, "Titel is te kort."),
    issuer: optionalText(160),
    issuedAt: optionalDate,
    expiresAt: optionalDate,
    visibility: visibilitySchema,
  })
  .refine((d) => !d.issuedAt || !d.expiresAt || d.expiresAt >= d.issuedAt, {
    message: "Vervaldatum mag niet vóór de uitgiftedatum liggen.",
    path: ["expiresAt"],
  });
export type CredentialInput = z.infer<typeof credentialSchema>;

// --- Beschikbaarheidsvenster ---
export const availabilityWindowSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    type: availabilityWindowTypeSchema,
    hoursPerWeek: optionalInt(168),
    note: optionalText(200),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "Einddatum mag niet vóór de startdatum liggen.",
    path: ["endDate"],
  });
export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;

// --- Document (standalone upload) ---
export const documentSchema = z.object({ kind: documentKindSchema });
export type DocumentInput = z.infer<typeof documentSchema>;

// --- Bericht ---
export const messageSchema = z.object({
  body: trimmed(5000).min(1, "Bericht mag niet leeg zijn."),
});
export type MessageInput = z.infer<typeof messageSchema>;

// --- Samenwerking voorstellen ---
export const collaborationProposalSchema = z
  .object({
    rate: optionalInt(2000),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "Einddatum mag niet vóór de startdatum liggen.",
    path: ["endDate"],
  });
export type CollaborationProposalInput = z.infer<typeof collaborationProposalSchema>;

// --- Factuurregel (unitCents wordt server-side uit euro's berekend) ---
export const invoiceLineSchema = z.object({
  description: trimmed(200).min(1, "Omschrijving is verplicht."),
  quantity: z.coerce.number().int().min(1, "Aantal minstens 1.").max(100000),
  unitCents: z.coerce.number().int().min(0).max(100_000_000),
});
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;
