// Server-side validatieschema's (CLAUDE.md regel 2: Zod is de bron van waarheid).
// Eén plek voor alle invoervalidatie van onboarding & profielen.

import { z } from "zod";
import {
  availabilitySchema,
  visibilitySchema,
  workModeSchema,
} from "@/lib/enums";

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
