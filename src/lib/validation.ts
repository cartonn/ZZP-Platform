// Server-side validatieschema's (CLAUDE.md regel 2: Zod is de bron van waarheid).
// Eén plek voor alle invoervalidatie van onboarding & profielen.

import { z } from "zod";
import {
  availabilitySchema,
  availabilityWindowTypeSchema,
  courseAudienceSchema,
  credentialTypeSchema,
  documentKindSchema,
  visibilitySchema,
  workModeSchema,
} from "@/lib/enums";
import { MODEL_AGREEMENT_TYPES } from "./model-agreement";
import { isValidBtwId, isValidKvk, normalizeBtwId, normalizeKvk } from "@/lib/fiscal";
import { MAX_INVOICE_CENTS } from "@/lib/invoices";

/**
 * URL-veld dat uitsluitend het http(s)-schema toestaat. `z.string().url()` keurt óók
 * `javascript:`- en `data:`-URI's goed; wordt zo'n waarde later als rauwe `href` gerenderd, dan is
 * dat stored XSS (OWASP A03 / CWE-79). Deze refine is de server-side bron van waarheid (regel 2) en
 * blokkeert het schema onafhankelijk van de CSP — defense-in-depth, ook voor oudere browsers.
 */
export function httpUrl(message = "Ongeldige URL.") {
  return z
    .string()
    .trim()
    .refine((v) => {
      let parsed: URL;
      try {
        parsed = new URL(v);
      } catch {
        return false;
      }
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    }, message);
}

// --- Academie -------------------------------------------------------------
const optionalLevel = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.enum(["BEGINNER", "GEVORDERD"]).optional(),
);

export const courseInputSchema = z.object({
  title: z.string().trim().min(4, "Geef een duidelijke titel.").max(140),
  summary: z.string().trim().min(8, "Geef een korte omschrijving.").max(400),
  audience: courseAudienceSchema.default("FREELANCER"),
  level: optionalLevel,
  order: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(999)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? 0 : Number(v))),
});
export type CourseInput = z.infer<typeof courseInputSchema>;

export const lessonInputSchema = z.object({
  title: z.string().trim().min(3, "Geef een lestitel.").max(140),
  body: z.string().trim().min(10, "Schrijf de lesinhoud.").max(20000),
  estimatedMinutes: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(600)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v))),
  // Leeg = onbepaald (de actie kiest dan auto-append achteraan); een expliciete 0 betekent vooraan.
  order: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(999)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v))),
});
export type LessonInput = z.infer<typeof lessonInputSchema>;

const optionalInt = (max: number, min = 0) =>
  z
    .union([z.literal(""), z.coerce.number().int().min(min).max(max)])
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
  maxTravelMinutes: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(999)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v))),
  languages: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  kvkNumber: z
    .union([z.literal(""), z.string().trim()])
    .optional()
    .superRefine((v, ctx) => {
      if (v && !isValidKvk(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ongeldig KvK-nummer (8 cijfers).",
        });
      }
    })
    .transform((v) => (v ? normalizeKvk(v) : undefined)),
  btwNumber: z
    .union([z.literal(""), z.string().trim()])
    .optional()
    .superRefine((v, ctx) => {
      if (v && !isValidBtwId(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ongeldig BTW-id (bijv. NL123456789B01).",
        });
      }
    })
    .transform((v) => (v ? normalizeBtwId(v) : undefined)),
  visibility: visibilitySchema,
  defaultMotivation: optionalText(2000),
  skillIds: z.array(z.string().cuid()).max(50).default([]),
  industryIds: z.array(z.string().cuid()).max(20).default([]),
});
export type FreelancerProfileInput = z.infer<typeof freelancerProfileSchema>;

// --- Bedrijfsprofiel ---
export const companyProfileSchema = z.object({
  name: trimmed(160).min(2, "Bedrijfsnaam is te kort."),
  description: optionalText(2000),
  website: z
    .union([httpUrl("Ongeldige URL."), z.literal("")])
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
    // Een tarief is optioneel (leeg = "geen tarief"), maar als het is ingevuld minstens €1/uur —
    // anders verscheen letterlijk "€ 0/uur" op de opdracht (onlogisch, oogt als bug).
    rateMin: optionalInt(2000, 1),
    rateMax: optionalInt(2000, 1),
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
  // Leeg = "geen voorgesteld tarief"; is het ingevuld dan minstens €1/uur — consistent met
  // `jobSchema.rateMin/rateMax` en `collaborationProposalSchema.rate` (een €0/uur-tarief oogt als
  // een bug/loonroof-vector). Enkel display; wordt nooit als bindend tarief overgenomen.
  proposedRate: optionalInt(2000, 1),
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
    // NL-foutboodschap i.p.v. Zod's Engelse "Invalid date" (UI-taal = Nederlands).
    startDate: z.coerce.date({ invalid_type_error: "Kies een geldige begindatum." }),
    endDate: z.coerce.date({ invalid_type_error: "Kies een geldige einddatum." }),
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
    // Een tarief is optioneel (leeg = "geen tarief"), maar als het is ingevuld minstens €1/uur —
    // identiek aan de opdracht-rate (`rateMin`/`rateMax`). Zonder deze ondergrens kon een
    // opdrachtgever een bindend €0/uur-tarief vastleggen: de ZZP'er tekent, dient uren in en de
    // cascade leidt er stilzwijgend €0-facturen voor écht gewerkte uren uit af (loonroof-vector,
    // strijdig met "geen absurde bedragen persisteren" — CLAUDE.md regel 1).
    rate: optionalInt(2000, 1),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "Einddatum mag niet vóór de startdatum liggen.",
    path: ["endDate"],
  });
export type CollaborationProposalInput = z.infer<typeof collaborationProposalSchema>;

// --- Samenwerking annuleren (reden verplicht, symmetrisch voor beide partijen) ---
export const collaborationCancellationSchema = z.object({
  reason: trimmed(500).min(5, "Geef een reden op (minimaal 5 tekens)."),
});
export type CollaborationCancellationInput = z.infer<typeof collaborationCancellationSchema>;

// --- No-show melden (reden + dag van de gemiste dienst verplicht) ---
export const noShowReportSchema = z.object({
  reason: trimmed(500).min(5, "Geef de reden op zoals de ZZP'er die opgaf (minimaal 5 tekens)."),
  // Een no-show kan niet in de toekomst plaatsvinden. Zonder deze grens kan een opdrachtgever/
  // bemiddelaar een no-show vooruit op een ZZP'er boeken — die telt mee in de schorsingsladder
  // (3 ongegronde → uitschrijf-taak), dus de ZZP'er moet hiertegen beschermd zijn (server-side).
  occurredOn: z.coerce
    .date({ message: "Geef de dag van de gemiste dienst op." })
    .refine((d) => d.getTime() <= Date.now(), {
      message: "De dag van de gemiste dienst kan niet in de toekomst liggen.",
    }),
});
export type NoShowReportInput = z.infer<typeof noShowReportSchema>;

// --- Shift-overname: de huidige ZZP'er biedt een actieve inzet ter overname aan ---
export const shiftHandoffRequestSchema = z.object({
  reason: trimmed(500).min(
    5,
    "Geef aan waarom je deze inzet niet kunt voortzetten (minimaal 5 tekens).",
  ),
  // Optionele voorgestelde overnemer (FreelancerProfile.id); lege string => geen voorstel.
  candidateFreelancerId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});
export type ShiftHandoffRequestInput = z.infer<typeof shiftHandoffRequestSchema>;

// --- Shift-overname: afwijzing vereist een reden (server-side afgedwongen) ---
export const shiftHandoffRejectSchema = z.object({
  note: trimmed(500).min(5, "Geef een reden voor de afwijzing (minimaal 5 tekens)."),
});
export type ShiftHandoffRejectInput = z.infer<typeof shiftHandoffRejectSchema>;

// --- Factuurregel (unitCents wordt server-side uit euro's berekend) ---
// Het regelbedrag (quantity × unitCents) wordt geklemd op het int4-kolomplafond (~€21,4M): de losse
// grenzen laten samen tot 1e13 cents toe, ruim boven de `Int`-kolom → DB-schrijffout i.p.v. weigering.
export const invoiceLineSchema = z
  .object({
    description: trimmed(200).min(1, "Omschrijving is verplicht."),
    quantity: z.coerce.number().int().min(1, "Aantal minstens 1.").max(100000),
    unitCents: z.coerce.number().int().min(0).max(100_000_000),
  })
  .refine((line) => line.quantity * line.unitCents <= MAX_INVOICE_CENTS, {
    message: "Het regelbedrag is te hoog (maximaal € 21.474.836 per regel).",
    path: ["unitCents"],
  });
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;

// --- Performance (urenstaat/oplevering) indienen ---
export interface PerformanceFormData {
  type: "HOURS" | "MILESTONE";
  hours: number;
  ortTotal: number; // total hours across all ORT segments (0 if no ORT)
  hasOrt: boolean;
  amount: number; // in euros
  milestoneTitle: string;
  periodStartRaw: string;
  periodEndRaw: string;
  rateCents: number | null;
}

/**
 * Bovengrenzen voor een enkele prestatie. Server-side waarheid (CLAUDE.md regel 1): het
 * `max`-attribuut op het formulier is geen garantie — een geknutselde POST omzeilt het. Zonder deze
 * grens persisteert een absurd aantal uren/bedrag en overschrijdt het afgeleide factuurbedrag bij
 * goedkeuring de `Int`-kolom (`totalCents`, int4 ≈ €21,4 mln) → 500 i.p.v. een nette weigering.
 * 1.000 uur per urenstaat is meer dan een half jaar voltijd; €1 mln per oplevering ruim zat. Beide
 * houden het factuurbedrag (incl. ORT-toeslag + 21% BTW, max tarief €2.000/u) ruim onder int4.
 */
export const MAX_PERFORMANCE_HOURS = 1000;
export const MAX_MILESTONE_CENTS = 100_000_000; // €1.000.000

/** Pure validatie van performance-invoer. Geeft een foutmelding terug, of null bij geldig. */
export function validatePerformanceForm(data: PerformanceFormData): string | null {
  if (data.type === "HOURS") {
    if (data.rateCents == null)
      return "Er is geen uurtarief ingesteld voor deze samenwerking. Neem contact op met de opdrachtgever.";
    if (data.hasOrt) {
      // `!isFinite` vóór de grensvergelijkingen: NaN (bv. `Number("abc")` uit een geknutselde POST)
      // is noch `<= 0` noch `> MAX` en zou anders als Float persisteren en bij factuurafleiding een
      // NaN-`totalCents` (Int) opleveren → 500. Server-side waarheid (regel 1); DOEL 2 robuustheid.
      if (!Number.isFinite(data.ortTotal) || data.ortTotal <= 0)
        return "Vul minstens één uur in bij de ORT-categorieën.";
      if (data.ortTotal > MAX_PERFORMANCE_HOURS)
        return `Het totaal aantal uren is onrealistisch hoog (maximaal ${MAX_PERFORMANCE_HOURS} uur per urenstaat).`;
    } else {
      if (!Number.isFinite(data.hours) || data.hours <= 0)
        return "Vul het aantal uren in (minimaal 0,25 uur).";
      if (data.hours > MAX_PERFORMANCE_HOURS)
        return `Het aantal uren is onrealistisch hoog (maximaal ${MAX_PERFORMANCE_HOURS} uur per urenstaat).`;
    }
    // Een losse ongeldige datum (bv. `periodStart=onzin` uit een geknutselde POST) moet netjes
    // worden geweigerd vóór persistentie — anders stroomt een `Invalid Date` door naar Prisma en
    // valt de mutatie in een generieke catch-all i.p.v. een leesbare veldfout. De HTML-date-input
    // levert altijd geldige waarden; deze check dekt het scripted-POST-pad (DOEL 2 malicieuze invoer).
    const s = data.periodStartRaw ? new Date(data.periodStartRaw) : null;
    const e = data.periodEndRaw ? new Date(data.periodEndRaw) : null;
    if ((s && isNaN(s.getTime())) || (e && isNaN(e.getTime()))) {
      return "Vul een geldige periode in (begin- en einddatum).";
    }
    if (s && e && s > e) {
      return "De begindatum van de periode mag niet na de einddatum liggen.";
    }
  } else {
    if (!Number.isFinite(data.amount) || data.amount <= 0)
      return "Voer een bedrag in van minimaal €0,01.";
    if (data.amount * 100 > MAX_MILESTONE_CENTS)
      return "Het bedrag is onrealistisch hoog (maximaal € 1.000.000 per oplevering).";
    if (!data.milestoneTitle.trim()) return "Geef de oplevering een titel.";
  }
  return null;
}
