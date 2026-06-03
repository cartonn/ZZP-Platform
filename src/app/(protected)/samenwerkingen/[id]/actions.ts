"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import {
  signContract,
  createPerformance,
  updatePerformance,
  submitPerformance,
  approvePerformance,
  rejectPerformance,
  submitInvoice,
  approveInvoice,
  rejectInvoice,
  confirmPayment,
  creditInvoice,
  openDispute,
  resolveDispute,
  CascadeError,
  type CreatePerformanceInput,
} from "@/lib/cascade/commands";
import { prisma } from "@/lib/db";
import { eurosToCents } from "@/lib/invoices";
import { type OrtSegment, resolveOrtRates } from "@/lib/ort";
import { segmentShifts, dutchHolidays, type Shift } from "@/lib/shift";
import { type OrtCategory, ORT_SECTORS, ORT_CATEGORIES, type OrtSector } from "@/lib/config";
import { validatePerformanceForm, type PerformanceFormData } from "@/lib/validation";

/** Vertaalt een CascadeError/transitiefout naar een leesbare melding; hergooit de rest. */
function toMessage(e: unknown): never {
  if (e instanceof CascadeError) throw new Error(e.message);
  if (e instanceof Error) throw new Error(e.message);
  throw e;
}

function refresh(collaborationId: string) {
  revalidatePath(`/samenwerkingen/${collaborationId}`);
  revalidatePath("/samenwerkingen");
  revalidatePath("/facturen");
  // Het Actiecentrum en het dashboard lezen dezelfde openstaande items: na een cascade-stap
  // hervalideren zodat de afgehandelde taak verdwijnt en de volgende klaarstaat (auto-advance).
  revalidatePath("/acties");
  revalidatePath("/dashboard");
}

export async function signContractAction(collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await signContract(actor, collaborationId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

/**
 * Parseert het prestatie-formulier (dienstmodus of handmatige ORT/uren) tot een createPerformance-
 * input — gedeeld door nieuw indienen én corrigeren-en-opnieuw-indienen. Server-side waarheid:
 * het uurtarief en ORT-profiel komen uit de samenwerking. Geeft een leesbare foutmelding terug
 * bij ongeldige invoer, anders de volledige input (incl. de ruwe diensten voor inline-correctie).
 */
async function parsePerformanceInput(
  collaborationId: string,
  formData: FormData,
): Promise<{ error: string } | { input: CreatePerformanceInput }> {
  const type = formData.get("type") === "MILESTONE" ? "MILESTONE" : "HOURS";
  const description = String(formData.get("description") ?? "").slice(0, 500);

  const periodStartRaw = type === "HOURS" ? String(formData.get("periodStart") ?? "").trim() : "";
  const periodEndRaw = type === "HOURS" ? String(formData.get("periodEnd") ?? "").trim() : "";
  const periodStart = periodStartRaw ? new Date(periodStartRaw) : null;
  const periodEnd = periodEndRaw ? new Date(periodEndRaw) : null;

  // Snapshot het uurtarief én het ORT-profiel uit de samenwerking (server-side waarheid).
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { rate: true, ortProfile: true, ortCustomRates: true },
  });
  const rateCents = col?.rate != null ? col.rate * 100 : null;

  // Dienstmodus: vul één of meer diensten (begin/eind) in, dan leidt de server de ORT-categorieën
  // (avond/nacht/weekend/feestdag) automatisch af en aggregeert ze — geen handmatige urenverdeling.
  const shiftStartsRaw =
    type === "HOURS" ? formData.getAll("shiftStart").map((v) => String(v).trim()) : [];
  const shiftEndsRaw =
    type === "HOURS" ? formData.getAll("shiftEnd").map((v) => String(v).trim()) : [];
  const shifts: Shift[] = [];
  const holidayYears = new Set<number>();
  for (let i = 0; i < Math.max(shiftStartsRaw.length, shiftEndsRaw.length); i++) {
    const s = shiftStartsRaw[i] ?? "";
    const e = shiftEndsRaw[i] ?? "";
    if (!s && !e) continue; // lege rij overslaan
    if (!s || !e) return { error: "Vul bij elke dienst zowel een begin- als eindtijd in." };
    const start = new Date(s);
    const end = new Date(e);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: "Ongeldige diensttijden." };
    if (end.getTime() <= start.getTime())
      return { error: "Het einde van de dienst moet na het begin liggen." };
    shifts.push({ start, end });
    holidayYears.add(start.getFullYear());
    holidayYears.add(end.getFullYear());
  }
  let ortSegments: OrtSegment[] = [];
  if (shifts.length > 0) {
    const holidays = new Set<string>();
    for (const y of holidayYears) for (const k of dutchHolidays(y)) holidays.add(k);
    const rates = resolveOrtRates({
      ortProfile: col?.ortProfile,
      ortCustomRates: col?.ortCustomRates,
    });
    ortSegments = segmentShifts(shifts, { rates, holidays });
  } else {
    const ortFields: Array<["NORMAL" | OrtCategory, string]> = [
      ["NORMAL", "ort_normal"],
      ["EVENING", "ort_evening"],
      ["NIGHT", "ort_night"],
      ["SATURDAY", "ort_saturday"],
      ["SUNDAY", "ort_sunday"],
      ["HOLIDAY", "ort_holiday"],
    ];
    ortSegments = ortFields
      .map(([category, field]) => ({ category, hours: Number(formData.get(field) ?? 0) }))
      .filter((s) => s.hours > 0);
  }
  const useOrt = type === "HOURS" && ortSegments.length > 0;

  const hours =
    type === "HOURS"
      ? useOrt
        ? ortSegments.reduce((s, x) => s + x.hours, 0)
        : Number(formData.get("hours") ?? 0)
      : 0;
  const amount = Number(formData.get("amount") ?? 0);
  const milestoneTitle = String(formData.get("milestoneTitle") ?? "");

  const validationError = validatePerformanceForm({
    type,
    hours,
    ortTotal: useOrt ? ortSegments.reduce((s, x) => s + x.hours, 0) : 0,
    hasOrt: useOrt,
    amount,
    milestoneTitle,
    periodStartRaw,
    periodEndRaw,
    rateCents,
  } satisfies PerformanceFormData);
  if (validationError) return { error: validationError };

  return {
    input: {
      collaborationId,
      type,
      hours: type === "HOURS" ? hours : null,
      rateCents: type === "HOURS" ? rateCents : null,
      ortSegments: useOrt ? ortSegments : null,
      shifts: type === "HOURS" && shifts.length > 0 ? shifts : null,
      periodStart: type === "HOURS" ? periodStart : null,
      periodEnd: type === "HOURS" ? periodEnd : null,
      amountCents: type === "MILESTONE" ? eurosToCents(amount) : null,
      milestoneTitle: type === "MILESTONE" ? milestoneTitle : null,
      description,
    },
  };
}

export async function logAndSubmitPerformanceAction(
  collaborationId: string,
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const actor = await requireActor();
  const parsed = await parsePerformanceInput(collaborationId, formData);
  if ("error" in parsed) return parsed.error;
  try {
    const id = await createPerformance(actor, parsed.input);
    await submitPerformance(actor, id);
  } catch (e) {
    if (e instanceof CascadeError) return e.message;
    if (e instanceof Error) return e.message;
    return "Er is een fout opgetreden. Probeer het opnieuw.";
  }
  refresh(collaborationId);
  return null;
}

/**
 * Corrigeer een afgekeurde (of concept-)prestatie en dien opnieuw in: dezelfde record wordt
 * bijgewerkt met de gecorrigeerde waarden (incl. diensten) en daarna ingediend (REJECTED ->
 * SUBMITTED). Geen losse REJECTED-rij. Zie ADR-0005.
 */
export async function editAndResubmitPerformanceAction(
  performanceId: string,
  collaborationId: string,
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const actor = await requireActor();
  const parsed = await parsePerformanceInput(collaborationId, formData);
  if ("error" in parsed) return parsed.error;
  try {
    const { collaborationId: _cid, ...fields } = parsed.input;
    await updatePerformance(actor, performanceId, fields);
    await submitPerformance(actor, performanceId);
  } catch (e) {
    if (e instanceof CascadeError) return e.message;
    if (e instanceof Error) return e.message;
    return "Er is een fout opgetreden. Probeer het opnieuw.";
  }
  refresh(collaborationId);
  return null;
}

/**
 * Stelt het ORT-sectorprofiel + optioneel maatwerk-toeslagen van de samenwerking in (zorg-CAO).
 * Alleen de opdrachtgever of admin bepaalt de toeslagen (server-side waarheid); de ZZP'er niet.
 * "DEFAULT" wordt als null opgeslagen. Bij sector "MAATWERK" worden de ingevoerde percentages
 * (per categorie) als JSON-bps opgeslagen en gaan vóór het sectorprofiel; anders wordt maatwerk gewist.
 */
export async function setOrtProfileAction(
  collaborationId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireActor();
  const raw = String(formData.get("ortProfile") ?? "DEFAULT");
  const isCustom = raw === "MAATWERK";
  const sector: OrtSector = (ORT_SECTORS as readonly string[]).includes(raw)
    ? (raw as OrtSector)
    : "DEFAULT";

  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { company: { select: { userId: true } } },
  });
  if (!col) throw new Error("Samenwerking niet gevonden.");
  if (actor.role !== "ADMIN" && actor.id !== col.company.userId) {
    throw new Error("Alleen de opdrachtgever kan het ORT-profiel instellen.");
  }

  let customRates: string | null = null;
  if (isCustom) {
    const rates = {} as Record<OrtCategory, number>;
    for (const cat of ORT_CATEGORIES) {
      const pct = Number(formData.get(`custom_${cat}`) ?? 0);
      if (!Number.isFinite(pct) || pct < 0)
        throw new Error("Maatwerkpercentages moeten 0 of hoger zijn.");
      rates[cat] = Math.round(pct * 100); // procent → bps
    }
    customRates = JSON.stringify(rates);
  }

  await prisma.collaboration.update({
    where: { id: collaborationId },
    data: {
      ortProfile: isCustom ? null : sector === "DEFAULT" ? null : sector,
      ortCustomRates: customRates,
    },
  });
  refresh(collaborationId);
}

export async function approvePerformanceAction(
  performanceId: string,
  collaborationId: string,
): Promise<void> {
  const actor = await requireActor();
  try {
    await approvePerformance(actor, performanceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function rejectPerformanceAction(
  performanceId: string,
  collaborationId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireActor();
  try {
    await rejectPerformance(actor, performanceId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function submitInvoiceAction(
  invoiceId: string,
  collaborationId: string,
): Promise<void> {
  const actor = await requireActor();
  try {
    await submitInvoice(actor, invoiceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function approveInvoiceAction(
  invoiceId: string,
  collaborationId: string,
): Promise<void> {
  const actor = await requireActor();
  try {
    await approveInvoice(actor, invoiceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function rejectInvoiceAction(
  invoiceId: string,
  collaborationId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireActor();
  try {
    await rejectInvoice(actor, invoiceId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function confirmPaymentAction(
  invoiceId: string,
  collaborationId: string,
): Promise<void> {
  const actor = await requireActor();
  try {
    await confirmPayment(actor, invoiceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function creditInvoiceAction(
  invoiceId: string,
  collaborationId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireActor();
  try {
    await creditInvoice(actor, invoiceId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function openDisputeAction(
  collaborationId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireActor();
  try {
    await openDispute(actor, collaborationId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function resolveDisputeAction(collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await resolveDispute(actor, collaborationId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}
