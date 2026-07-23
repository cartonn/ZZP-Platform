"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { toSafeActionError, throwSafeActionError } from "@/lib/safe-action-error";
import { type ResolveState } from "@/lib/actions/resolve-state";
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
  type CreatePerformanceInput,
} from "@/lib/cascade/commands";
import { prisma } from "@/lib/db";
import { eurosToCents } from "@/lib/invoices";
import { type OrtSegment, resolveOrtRates } from "@/lib/ort";
import {
  segmentShifts,
  dutchHolidays,
  MAX_SHIFT_HOURS,
  MAX_SHIFTS_PER_PERFORMANCE,
  type Shift,
} from "@/lib/shift";
import {
  type OrtCategory,
  ORT_SECTORS,
  ORT_CATEGORIES,
  type OrtSector,
  MAX_ORT_CUSTOM_BPS,
} from "@/lib/config";
import { validatePerformanceForm, type PerformanceFormData } from "@/lib/validation";
import { boundReason, boundText, MAX_TITLE_LEN, MAX_DESCRIPTION_LEN } from "@/lib/text-bounds";
import { weekdaySchema, type Weekday } from "@/lib/enums";
import { serializeWeekdays } from "@/lib/weekdays";
import { MODEL_AGREEMENT_TYPES, type ModelAgreementType } from "@/lib/model-agreement";
import { audit } from "@/lib/audit";

/**
 * Vertaalt een gevangen cascade-fout naar een VEILIGE, opborrelende melding voor deze plain
 * (niet-`useActionState`) geld-/dispuut-acties. Gecureerde fouten (CascadeError, transitiefouten) en
 * hun Nederlandse message passeren; een onverwachte Prisma-/systeemfout wordt server-side gelogd en
 * generiek gemaakt i.p.v. rauw doorgegeven — dezelfde CWE-209/OWASP A05-garantie die `toSafeActionError`
 * al voor de `useActionState`-siblings in dit bestand levert (voorheen lekte deze helper elke
 * `Error.message` woordelijk).
 */
function toMessage(e: unknown): never {
  throwSafeActionError(e);
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
  const description = boundText(formData.get("description"), MAX_DESCRIPTION_LEN);

  const periodStartRaw = type === "HOURS" ? String(formData.get("periodStart") ?? "").trim() : "";
  const periodEndRaw = type === "HOURS" ? String(formData.get("periodEnd") ?? "").trim() : "";
  const periodStart = periodStartRaw ? new Date(periodStartRaw) : null;
  const periodEnd = periodEndRaw ? new Date(periodEndRaw) : null;
  // Weiger een ongeldige datum netjes vóór persistentie. De HTML `<input type=date>` levert altijd
  // een geldige waarde, maar een geknutselde form-POST (`periodStart=onzin`) niet: zonder deze check
  // stroomt een `Invalid Date` door naar `prisma.performance.create` → PrismaClientValidationError →
  // generieke catch-all i.p.v. een leesbare veldfout. Dit gate't vóór de DB-lookup; `validatePerformanceForm`
  // weigert dezelfde ongeldige datum ook (defense-in-depth, en de pure validator is op zichzelf correct).
  if ((periodStart && isNaN(periodStart.getTime())) || (periodEnd && isNaN(periodEnd.getTime()))) {
    return { error: "Vul een geldige periode in (begin- en einddatum)." };
  }

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
  const rowCount = Math.max(shiftStartsRaw.length, shiftEndsRaw.length);
  // Begrens het aantal dienstrijen: segmentatie is O(duur) per dienst, dus zonder deze grens kon een
  // gemanipuleerde POST met duizenden rijen de server-actie synchroon laten dweilen (DoS).
  if (rowCount > MAX_SHIFTS_PER_PERFORMANCE) {
    return { error: `Je kunt maximaal ${MAX_SHIFTS_PER_PERFORMANCE} diensten tegelijk indienen.` };
  }
  for (let i = 0; i < rowCount; i++) {
    const s = shiftStartsRaw[i] ?? "";
    const e = shiftEndsRaw[i] ?? "";
    if (!s && !e) continue; // lege rij overslaan
    if (!s || !e) return { error: "Vul bij elke dienst zowel een begin- als eindtijd in." };
    const start = new Date(s);
    const end = new Date(e);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: "Ongeldige diensttijden." };
    if (end.getTime() <= start.getTime())
      return { error: "Het einde van de dienst moet na het begin liggen." };
    // Weiger een absurde duur netjes vóór segmentatie (server-side waarheid; de datetime-local `max`
    // in het formulier is niet af te dwingen). segmentShift draagt dezelfde grens als vangnet.
    if (end.getTime() - start.getTime() > MAX_SHIFT_HOURS * 3_600_000) {
      return { error: `Een dienst mag niet langer dan ${MAX_SHIFT_HOURS} uur duren.` };
    }
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
  const milestoneTitle = boundText(formData.get("milestoneTitle"), MAX_TITLE_LEN);

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
    return toSafeActionError(e);
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

  // Server-side waarheid + ownership vóór actie (CLAUDE.md regel 1 & 2). De prestatie bepaalt zélf
  // bij welke samenwerking ze hoort; parsePerformanceInput snapshot daaruit het uurtarief/ORT-profiel.
  // Het meegestuurde `collaborationId` is NIET te vertrouwen: zonder deze binding kon een ZZP'er een
  // eigen (afgekeurde) prestatie corrigeren met het — mogelijk hogere — tarief van een ándere
  // samenwerking, en zo zijn eigen (auto-)goedgekeurde factuur opblazen (A01/IDOR — financiële
  // manipulatie + inzage in andermans tarief). Bind de tarief-bron daarom hard aan de eigen
  // samenwerking van de prestatie en weiger een afwijkend id.
  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: {
      collaborationId: true,
      collaboration: { select: { freelancer: { select: { userId: true } } } },
    },
  });
  if (!perf) return "Prestatie niet gevonden.";
  if (actor.role !== "ADMIN" && actor.id !== perf.collaboration.freelancer.userId) {
    return "Je hebt geen toegang tot deze prestatie.";
  }
  if (perf.collaborationId !== collaborationId) {
    return "De samenwerking komt niet overeen met de prestatie.";
  }

  const parsed = await parsePerformanceInput(perf.collaborationId, formData);
  if ("error" in parsed) return parsed.error;
  try {
    const { collaborationId: _cid, ...fields } = parsed.input;
    await updatePerformance(actor, performanceId, fields);
    await submitPerformance(actor, performanceId);
  } catch (e) {
    return toSafeActionError(e);
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
  // Anti-oracle (CWE-203): een niet-opdrachtgever (buitenstaander of de ZZP'er-partij via directe
  // aanroep — de ORT-control wordt in de UI alleen aan de opdrachtgever getoond) mag "bestaat niet"
  // niet kunnen onderscheiden van "geen toegang". Identiek onbekend-id-antwoord; consistent met
  // shift-handoff/setDienstStatus.
  if (!col || (actor.role !== "ADMIN" && actor.id !== col.company.userId)) {
    throw new Error("Samenwerking niet gevonden.");
  }

  let customRates: string | null = null;
  if (isCustom) {
    const rates = {} as Record<OrtCategory, number>;
    for (const cat of ORT_CATEGORIES) {
      const pct = Number(formData.get(`custom_${cat}`) ?? 0);
      if (!Number.isFinite(pct) || pct < 0)
        throw new Error("Maatwerkpercentages moeten 0 of hoger zijn.");
      const bps = Math.round(pct * 100); // procent → bps
      // Bovengrens: een absurde toeslag werkt anders door in elke toekomstige prestatie/factuur.
      if (bps > MAX_ORT_CUSTOM_BPS)
        throw new Error(`Maatwerkpercentages mogen maximaal ${MAX_ORT_CUSTOM_BPS / 100}% zijn.`);
      rates[cat] = bps;
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
  // De ORT-toeslagen bepalen direct het geld op elke toekomstige prestatie/factuur — een geld-
  // bepalende wijziging hoort in het auditspoor (CLAUDE.md regel 5), net als de buur-acties hier.
  await audit({
    actorId: actor.id,
    action: "COLLABORATION_ORT_SET",
    entityType: "Collaboration",
    entityId: collaborationId,
    metadata: { profile: isCustom ? "MAATWERK" : sector, ...(isCustom ? { customRates } : {}) },
  });
  refresh(collaborationId);
}

/**
 * Legt het per-dag-weekrooster van een samenwerking vast (ADR-0004): welke weekdagen de ZZP'er bij
 * deze opdrachtgever werkt. Beide partijen (en admin) mogen het bijwerken — het is een gedeelde
 * planningsafspraak. Lege selectie = "niet vastgelegd" (null). Server-side waarheid + audit.
 */
export async function setWeekdaysAction(
  collaborationId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireActor();

  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { company: { select: { userId: true } }, freelancer: { select: { userId: true } } },
  });
  const isClient = actor.id === col?.company.userId;
  const isFreelancer = actor.id === col?.freelancer.userId;
  // Anti-oracle (CWE-203): een niet-partij mag "bestaat niet" niet kunnen onderscheiden van "geen
  // toegang" → identiek onbekend-id-antwoord.
  if (!col || (!isClient && !isFreelancer && actor.role !== "ADMIN")) {
    throw new Error("Samenwerking niet gevonden.");
  }

  // Alleen geldige weekdag-codes; ontdubbeld + canoniek geordend door serializeWeekdays.
  const selected = formData
    .getAll("weekdays")
    .map(String)
    .filter((v): v is Weekday => weekdaySchema.safeParse(v).success);
  const weekdays = serializeWeekdays(selected);

  await prisma.collaboration.update({ where: { id: collaborationId }, data: { weekdays } });
  await audit({
    actorId: actor.id,
    action: "COLLABORATION_WEEKDAYS_SET",
    entityType: "Collaboration",
    entityId: collaborationId,
    metadata: { weekdays },
  });
  refresh(collaborationId);
}

/**
 * Legt het type modelovereenkomst van een samenwerking vast (Wet DBA). Alleen de opdrachtgever (of
 * admin) kiest de overeenkomstvorm — en alleen zolang geen van beide partijen al akkoord heeft
 * gegeven, want een wijziging na akkoord zou dat akkoord ongeldig maken. Server-side waarheid + audit.
 */
export async function setAgreementTypeAction(
  collaborationId: string,
  formData: FormData,
): Promise<void> {
  const actor = await requireActor();
  const raw = String(formData.get("agreementType") ?? "");
  if (!(MODEL_AGREEMENT_TYPES as readonly string[]).includes(raw)) {
    throw new Error("Ongeldig type modelovereenkomst.");
  }

  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: {
      company: { select: { userId: true } },
      agreementFreelancerSignedAt: true,
      agreementClientSignedAt: true,
    },
  });
  // Anti-oracle (CWE-203): niet-opdrachtgever krijgt het onbekend-id-antwoord (de keuze-control staat
  // in de UI alleen bij de opdrachtgever) → geen onderscheid bestaat/geen-toegang.
  if (!col || (actor.role !== "ADMIN" && actor.id !== col.company.userId)) {
    throw new Error("Samenwerking niet gevonden.");
  }
  if (col.agreementFreelancerSignedAt || col.agreementClientSignedAt) {
    throw new Error("De overeenkomst is al ondertekend; de vorm kan niet meer worden gewijzigd.");
  }

  await prisma.collaboration.update({
    where: { id: collaborationId },
    data: { agreementType: raw as ModelAgreementType },
  });
  await audit({
    actorId: actor.id,
    action: "MODEL_AGREEMENT_TYPE_SET",
    entityType: "Collaboration",
    entityId: collaborationId,
    metadata: { agreementType: raw },
  });
  refresh(collaborationId);
}

/**
 * Legt het digitale akkoord van de inloggende partij op de modelovereenkomst vast. Alleen de
 * betrokken ZZP'er of opdrachtgever tekent (een admin tekent niet namens een partij). Idempotent:
 * een al gezet akkoord wordt niet overschreven. Server-side waarheid + audit.
 */
export async function signModelAgreementAction(collaborationId: string): Promise<void> {
  const actor = await requireActor();
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      agreementFreelancerSignedAt: true,
      agreementClientSignedAt: true,
    },
  });
  const isClient = actor.id === col?.company.userId;
  const isFreelancer = actor.id === col?.freelancer.userId;
  // Anti-oracle (CWE-203): een niet-partij mag "bestaat niet" niet kunnen onderscheiden van "geen
  // toegang" → identiek onbekend-id-antwoord.
  if (!col || (!isClient && !isFreelancer)) {
    throw new Error("Samenwerking niet gevonden.");
  }

  const already = isFreelancer ? col.agreementFreelancerSignedAt : col.agreementClientSignedAt;
  if (already) {
    refresh(collaborationId);
    return; // idempotent: al ondertekend
  }

  await prisma.collaboration.update({
    where: { id: collaborationId },
    data: isFreelancer
      ? { agreementFreelancerSignedAt: new Date() }
      : { agreementClientSignedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "MODEL_AGREEMENT_SIGNED",
    entityType: "Collaboration",
    entityId: collaborationId,
    metadata: { party: isFreelancer ? "FREELANCER" : "CLIENT" },
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
    await rejectPerformance(actor, performanceId, boundReason(formData.get("reason")));
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
    await rejectInvoice(actor, invoiceId, boundReason(formData.get("reason")));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

// --- useActionState-vriendelijke wrappers voor de Actiecentrum-beoordeel-drawer. Ze hergebruiken
// de void-acties hierboven (incl. auth/ownership/audit/revalidate) en zetten alleen de uitkomst om
// naar { ok } / { error } zodat de drawer kan sluiten + doorvloeien en fouten inline kan tonen.

export async function approvePerformanceState(
  performanceId: string,
  collaborationId: string,
  _prev: ResolveState,
  _formData: FormData,
): Promise<ResolveState> {
  try {
    await approvePerformanceAction(performanceId, collaborationId);
  } catch (e) {
    return { error: toSafeActionError(e) };
  }
  return { ok: true };
}

export async function rejectPerformanceState(
  performanceId: string,
  collaborationId: string,
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  try {
    await rejectPerformanceAction(performanceId, collaborationId, formData);
  } catch (e) {
    return { error: toSafeActionError(e) };
  }
  return { ok: true };
}

export async function approveInvoiceState(
  invoiceId: string,
  collaborationId: string,
  _prev: ResolveState,
  _formData: FormData,
): Promise<ResolveState> {
  try {
    await approveInvoiceAction(invoiceId, collaborationId);
  } catch (e) {
    return { error: toSafeActionError(e) };
  }
  return { ok: true };
}

export async function rejectInvoiceState(
  invoiceId: string,
  collaborationId: string,
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  try {
    await rejectInvoiceAction(invoiceId, collaborationId, formData);
  } catch (e) {
    return { error: toSafeActionError(e) };
  }
  return { ok: true };
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
    await creditInvoice(actor, invoiceId, boundReason(formData.get("reason")));
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
    await openDispute(actor, collaborationId, boundReason(formData.get("reason")));
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
