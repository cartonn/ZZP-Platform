"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  assertInvoiceTransition,
  collaborationBillableForLegacyInvoice,
  DISPUTE_FROZEN_INVOICE_MESSAGE,
  eurosToCents,
  InvoiceTransitionError,
  invoiceCentsWithinInt4,
  invoiceTotalCents,
  LEGACY_INVOICE_NOT_BILLABLE_MESSAGE,
} from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { invoiceLineSchema } from "@/lib/validation";
import { canSendPaymentReminder } from "@/lib/manual-payment-reminder";
import { invoiceCreateRateLimiter } from "@/lib/rate-limit";
import { fiscalYearOf } from "@/lib/administration/fiscal-calendar";
import { allocateInvoiceNumber } from "@/lib/administration/persist";
import { displayInvoiceNumber } from "@/lib/invoice-number";
import { plural } from "@/lib/plural";
import { invalidateSignals } from "@/lib/signals/invalidate";

export type InvoiceState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export type ReminderState = { error?: string; message?: string } | undefined;

interface ParsedLine {
  description: string;
  quantity: number;
  unitCents: number;
  amountCents: number;
}

// Defense-in-depth-plafond op het aantal factuurregels per POST. `formData.getAll` is onbegrensd:
// een geauthenticeerde ZZP'er kan (binnen de 12 MB body-limiet) tienduizenden regeltripels sturen,
// die elk Zod-gevalideerd worden en daarna in één transactie als geneste `create` worden ingevoegd —
// een grote synchrone lus + zeer grote multi-row insert per request. Een echte factuur heeft nooit
// zoveel regels. Spiegelt de bestaande `MAX_SHIFTS_PER_PERFORMANCE`/`MAX_IMPORT_SIZE`-caps (CWE-400).
const MAX_INVOICE_LINES = 200;

function parseLines(formData: FormData): { lines: ParsedLine[]; error?: string } {
  const descriptions = formData.getAll("lineDescription").map(String);
  const quantities = formData.getAll("lineQuantity").map(String);
  const units = formData.getAll("lineUnit").map(String);

  if (descriptions.length > MAX_INVOICE_LINES)
    return { lines: [], error: `Een factuur mag maximaal ${MAX_INVOICE_LINES} regels bevatten.` };

  const lines: ParsedLine[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    if (!descriptions[i]?.trim()) continue; // lege regel overslaan
    const unitEuros = Number(units[i]);
    const parsed = invoiceLineSchema.safeParse({
      description: descriptions[i],
      quantity: quantities[i],
      unitCents: Number.isFinite(unitEuros) ? eurosToCents(unitEuros) : NaN,
    });
    if (!parsed.success) return { lines: [], error: `Controleer regel ${i + 1}.` };
    lines.push({ ...parsed.data, amountCents: parsed.data.quantity * parsed.data.unitCents });
  }
  if (lines.length === 0) return { lines: [], error: "Voeg minstens één factuurregel toe." };
  const total = invoiceTotalCents(lines);
  // Een factuur met een totaal van €0 (alle regels op €0) heeft geen betekenis en mag niet
  // persisteren — server-side waarheid: weiger ≤0 waar een echt bedrag vereist is (zelfde regel
  // als de loonroof-hardening). `unitCents` mag per regel 0 zijn (korting/gratis regel), maar het
  // factuurtotaal moet positief zijn.
  if (total <= 0) return { lines: [], error: "Het factuurbedrag moet groter dan € 0 zijn." };
  // De losse regels blijven binnen int4 (invoiceLineSchema), maar hun som kan het plafond alsnog
  // overschrijden → klem het factuurtotaal vóór de DB-write (server-side waarheid).
  if (!invoiceCentsWithinInt4(total))
    return {
      lines: [],
      error: "Het totaalbedrag van de factuur is te hoog (maximaal € 21.474.836).",
    };
  return { lines };
}

async function loadOwnedCollaboration(actorId: string, collaborationId: string) {
  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: { freelancer: { select: { userId: true } }, company: { select: { userId: true } } },
  });
  if (!collaboration || collaboration.freelancer.userId !== actorId) return null;
  return collaboration;
}

/** Foutmelding van de dubbele-facturatie-gate — één bron, gedeeld door de pre-transactionele lees én
 *  de in-transactie-herverificatie, zodat de bewoording niet drift. */
const CASCADE_FLOW_MESSAGE =
  "Deze samenwerking factureert via de uren- en prestatieflow. Maak de factuur daar aan, niet los.";

/** Sentinel: binnen de create-transactie is alsnog een cascade-flow gedetecteerd (TOCTOU verloren). */
class CascadeFlowRaceError extends Error {}

/** Sentinel: binnen de create-transactie bleek de samenwerking niet (meer) factureerbaar — bv. in het
 *  venster geannuleerd of in dispuut geraakt (TOCTOU verloren). */
class NotBillableRaceError extends Error {}

/**
 * True als deze samenwerking (al) via de uren-/prestatie-cascade factureert — dan mag er geen losse
 * factuur bij. `client` is de prisma-client óf een transactie-client, zodat exact dezelfde telling
 * zowel pre-transactioneel (fast-fail) als bínnen de create-transactie (TOCTOU-grendel) draait.
 */
async function usesCascadeFlow(
  client: {
    performance: { count: (a: { where: { collaborationId: string } }) => Promise<number> };
    invoice: {
      count: (a: {
        where: { collaborationId: string; lifecycleStatus: { not: null } };
      }) => Promise<number>;
    };
  },
  collaborationId: string,
): Promise<boolean> {
  const [performanceCount, cascadeInvoiceCount] = await Promise.all([
    client.performance.count({ where: { collaborationId } }),
    client.invoice.count({ where: { collaborationId, lifecycleStatus: { not: null } } }),
  ]);
  return performanceCount > 0 || cascadeInvoiceCount > 0;
}

export async function createInvoice(
  collaborationId: string,
  _prev: InvoiceState,
  formData: FormData,
): Promise<InvoiceState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  // Spam-/DoS-rem (security-review, defense-in-depth): begrens het aantal losse-factuur-aanmaakacties
  // per ZZP'er per uur vóór de zware DB-reads/-writes (nummer-telling + transactie + multi-row insert +
  // retry-lus). Het regelplafond (`MAX_INVOICE_LINES`) begrenst de kosten binnen één verzoek; deze rem
  // begrenst het aantal verzoeken zodat een scripted loop de server niet CPU-/DB-matig kan belasten
  // (CWE-400). De factureerbaarheids-/ownership-poort blijft de bron van toegang.
  if (!(await invoiceCreateRateLimiter.check(actor.id)).allowed) {
    return {
      error: "Je hebt het maximum aantal facturen per uur bereikt. Probeer het later opnieuw.",
    };
  }

  const collaboration = await loadOwnedCollaboration(actor.id, collaborationId);
  if (!collaboration) return { error: "Samenwerking niet gevonden." };

  // Factureerbaarheids-gate (server-side waarheid, CLAUDE.md regel 1/2): een LOSSE factuur mag alleen
  // op een lopende of afgeronde, niet-gedisputeerde samenwerking. De keuzelijst op /facturen/nieuw
  // filtert hier al op (invoiceableCollaborationsWhere), maar dat is slechts "tonen"; zonder deze
  // server-side check kan een ZZP'er de action rechtstreeks met een PROPOSED (ongetekend contract) of
  // CANCELLED collaborationId aanroepen en tóch factureren (→ sturen → betaald). Zelfde bron als de
  // keuzelijst (`collaborationBillableForLegacyInvoice`), zodat de regel niet drift.
  if (!collaborationBillableForLegacyInvoice(collaboration)) {
    return { error: LEGACY_INVOICE_NOT_BILLABLE_MESSAGE };
  }

  // Dubbele-facturatie-gate (server-side waarheid): als deze samenwerking de uren-/prestatie-cascade
  // gebruikt (een prestatie of een cascade-factuur), mag er geen losse factuur bij — die loopt daar.
  // Dit is de pre-transactionele fast-fail; de in-transactie-herverificatie hieronder sluit het
  // TOCTOU-venster (zie daar).
  if (await usesCascadeFlow(prisma, collaborationId)) {
    return { error: CASCADE_FLOW_MESSAGE };
  }

  const { lines, error } = parseLines(formData);
  if (error) return { error };

  const dueRaw = String(formData.get("dueAt") ?? "");
  // Datum-only veld als einde-van-de-dag interpreteren (voorkomt een dag te vroeg "verlopen").
  const dueAt = dueRaw ? new Date(`${dueRaw}T23:59:59`) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { fieldErrors: { dueAt: "Ongeldige datum." } };

  // Jaarprefix van het factuurnummer in Amsterdamse burgerlijke tijd, niet server-UTC: op de
  // UTC-server (Railway) valt 31 dec 23:15 UTC binnen 1 jan Amsterdam; het nummer moet dan met het
  // nieuwe Amsterdamse jaar meelopen (reeks reset naar 0001), niet het oude jaarprefix voortzetten.
  const year = fiscalYearOf(new Date());
  const lineData = lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitCents: l.unitCents,
    amountCents: l.amountCents,
  }));
  const totalCents = invoiceTotalCents(lines);

  let invoice: { id: string; number: string; partyInvoiceNumber: string | null } | null = null;
  try {
    invoice = await prisma.$transaction(async (tx) => {
      // TOCTOU-grendel (anti-dubbelfacturatie): her-verifieer BÍNNEN de create-transactie dat er
      // sinds de pre-transactionele lees geen cascade-flow is ontstaan. Tussen de fast-fail-check
      // hierboven en deze write zit parse-/validatiewerk; in dat venster kan een (bijna-)gelijktijdige
      // `createPerformance`/cascade-factuur op dezelfde samenwerking committen — beide requests zagen
      // in de pre-check nog "geen cascade" en zouden anders zowel een losse factuur als de cascade-flow
      // laten bestaan (dubbele facturatie van dezelfde opdrachtgever). Zelfde telling (gedeelde
      // `usesCascadeFlow`) → geen drift; bij overlap rolt de transactie terug. Spiegelt de in-transactie
      // overlap-guard van de cascade-laag (commands-shared.ts).
      if (await usesCascadeFlow(tx, collaborationId)) throw new CascadeFlowRaceError();
      // TOCTOU-grendel (factureerbaarheid): her-verifieer BÍNNEN de transactie dat de samenwerking
      // nog lopend/afgerond én niet-gedisputeerd is. In het venster tussen de pre-check en deze write
      // kan de opdrachtgever de samenwerking annuleren of een dispuut openen; zonder deze hercheck
      // zou een losse factuur alsnog op een inmiddels-dode/bevroren deal landen. Zelfde bron
      // (`collaborationBillableForLegacyInvoice`) → geen drift; bij mismatch rolt de transactie terug.
      const fresh = await tx.collaboration.findUnique({
        where: { id: collaborationId },
        select: { status: true, disputedAt: true },
      });
      if (!fresh || !collaborationBillableForLegacyInvoice(fresh)) throw new NotBillableRaceError();
      // Gatenvrije factuurnummering PER UITSCHRIJVENDE PARTIJ (numbering.ts / Wet OB art. 35a): elke
      // ZZP'er heeft één doorlopende, gatenvrije reeks. Vroeger telde deze losse-factuur-actie
      // platform-breed (`invoice.count({ number: { startsWith: `${year}-` } })`) — dan kreeg de reeks
      // van elke individuele ZZP'er gaten zodra een ánder platform-lid een losse factuur aanmaakte, en
      // vochten alle ZZP'ers om dezelfde `number @unique`-teller (P2002-retries onder gelijktijdigheid).
      // Nu deelt de losse factuur exact dezelfde per-partij-allocator als de cascade-flow
      // (`allocateInvoiceNumber`, sleutel = de ZZP'er): atomair, gatenvrij, en de ZZP'er botst alleen
      // met zijn eigen (bijna-)gelijktijdige facturen — niet met de rest van het platform. Het
      // partij-nummer (`2026-0007`) is het getoonde/wettelijke nummer; `number` blijft globaal uniek
      // via de `issuerKey:`-prefix (zelfde conventie als commands-shared.ts).
      const { number: partyInvoiceNumber } = await allocateInvoiceNumber(tx, actor.id, year);
      return tx.invoice.create({
        data: {
          collaborationId,
          number: `${actor.id}:${partyInvoiceNumber}`,
          partyInvoiceNumber,
          issuerKey: actor.id,
          status: "DRAFT",
          dueAt,
          totalCents,
          lines: { create: lineData },
        },
        select: { id: true, number: true, partyInvoiceNumber: true },
      });
    });
  } catch (e) {
    // De in-transactie-grendel sloeg aan: een cascade-flow is intussen ontstaan. Geef exact dezelfde
    // gebruikersmelding als de pre-transactionele gate (geen 500, geen id-lek).
    if (e instanceof CascadeFlowRaceError) return { error: CASCADE_FLOW_MESSAGE };
    // De factureerbaarheids-grendel sloeg aan (intussen geannuleerd/gedisputeerd): zelfde melding als
    // de pre-check, geen 500, geen id-lek.
    if (e instanceof NotBillableRaceError) return { error: LEGACY_INVOICE_NOT_BILLABLE_MESSAGE };
    throw e;
  }
  if (!invoice) return { error: "Kon geen factuurnummer toewijzen. Probeer het opnieuw." };

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "INVOICE_CREATED",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { number: displayInvoiceNumber(invoice) },
    }),
  });

  revalidatePath("/facturen");
  redirect(`/facturen/${invoice.id}`);
}

async function loadInvoiceParty(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      collaboration: {
        include: {
          freelancer: { select: { userId: true } },
          company: { select: { userId: true } },
        },
      },
    },
  });
  return invoice;
}

export async function sendInvoice(invoiceId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.freelancer.userId !== actor.id)
    throw new Error("Factuur niet gevonden.");

  // Dispuut-bevriezing (§4 zijpad): geen geldstroom-actie zolang de samenwerking gedisputeerd is —
  // spiegelt `assertNotDisputed` in de cascade-laag, die elke andere geld-mutatie al blokkeert.
  if (invoice.collaboration?.disputedAt) throw new Error(DISPUTE_FROZEN_INVOICE_MESSAGE);

  // Server-side waarheid (CLAUDE.md regel 1/2): een cascade-factuur (lifecycleStatus != null) loopt via
  // de uren-/prestatieflow en houdt haar legacy `status` bewust op DRAFT. Zonder deze rem kon een legacy-
  // actie (annuleren/versturen/betaald) de legacy-status van een cascade-factuur muteren — met een valse
  // audit-regel en uitsluiting uit de omzet-dashboards (revenue-trend `status != CANCELLED`) als gevolg.
  // De UI verbergt deze knoppen al (page.tsx `cascade`-gate); dit dwingt dezelfde regel server-side af.
  if (invoice.lifecycleStatus != null) throw new Error(CASCADE_FLOW_MESSAGE);

  const from = invoice.status as InvoiceStatus;
  try {
    assertInvoiceTransition(from, "SENT");
  } catch (e) {
    if (e instanceof InvoiceTransitionError) throw new Error(e.message);
    throw e;
  }

  const dueAt = invoice.dueAt ?? new Date(Date.now() + 14 * 86400_000); // standaard 14 dagen
  await prisma.$transaction(async (tx) => {
    // Compound-guard `status: from` binnen de transactie (spiegelt de updateMany-guard in de
    // cascade-laag, commands-shared.ts). De transitie werd gevalideerd tegen de vóór-lees; een
    // gelijktijdige tweede submit (dubbelklik) leest dezelfde `from`, passeert de check en zou
    // met een kaal `update({ where: { id } })` een tweede notificatie + auditregel schrijven.
    // Matcht de status niet meer → count 0 → geen dubbel effect (idempotent, race-proof).
    const res = await tx.invoice.updateMany({
      where: { id: invoiceId, status: from },
      data: { status: "SENT", issuedAt: new Date(), dueAt },
    });
    if (res.count === 0) return;
    await tx.notification.create({
      data: {
        userId: invoice.collaboration!.company.userId,
        type: "INVOICE_SENT",
        title: "Nieuwe factuur ontvangen",
        body: `Factuur ${displayInvoiceNumber(invoice)}.`,
        link: "/facturen",
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_SENT",
        entityType: "Invoice",
        entityId: invoiceId,
      }),
    });
  });
  // Beide partijen zien deze factuur terug in hun tellingen (de ZZP'er als openstaand/te laat, de
  // opdrachtgever als te betalen + een nieuwe melding): snapshot direct laten vervallen in plaats van
  // op de TTL wachten.
  await invalidateSignals([actor.id, invoice.collaboration?.company.userId]);
  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
}

export async function markInvoicePaid(invoiceId: string): Promise<void> {
  const actor = await requireRole("CLIENT");
  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.company.userId !== actor.id)
    throw new Error("Factuur niet gevonden.");

  // Dispuut-bevriezing (§4 zijpad): geen geldstroom-actie zolang de samenwerking gedisputeerd is —
  // spiegelt `assertNotDisputed` in de cascade-laag.
  if (invoice.collaboration?.disputedAt) throw new Error(DISPUTE_FROZEN_INVOICE_MESSAGE);

  // Server-side waarheid (CLAUDE.md regel 1/2): een cascade-factuur (lifecycleStatus != null) loopt via
  // de uren-/prestatieflow en houdt haar legacy `status` bewust op DRAFT. Zonder deze rem kon een legacy-
  // actie (annuleren/versturen/betaald) de legacy-status van een cascade-factuur muteren — met een valse
  // audit-regel en uitsluiting uit de omzet-dashboards (revenue-trend `status != CANCELLED`) als gevolg.
  // De UI verbergt deze knoppen al (page.tsx `cascade`-gate); dit dwingt dezelfde regel server-side af.
  if (invoice.lifecycleStatus != null) throw new Error(CASCADE_FLOW_MESSAGE);

  const from = invoice.status as InvoiceStatus;
  // Een verlopen factuur staat in de DB nog als SENT; PAID is vanuit beide geldig.
  try {
    assertInvoiceTransition(from, "PAID");
  } catch (e) {
    if (e instanceof InvoiceTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.$transaction(async (tx) => {
    // Compound-guard `status: from` (zie sendInvoice): een gelijktijdige tweede "markeer betaald"
    // mag geen dubbele INVOICE_PAID-notificatie/auditregel opleveren. Matcht de status niet meer
    // (bv. al PAID door de eerste submit) → count 0 → idempotent, geen dubbel effect.
    const res = await tx.invoice.updateMany({
      where: { id: invoiceId, status: from },
      data: { status: "PAID" },
    });
    if (res.count === 0) return;
    await tx.notification.create({
      data: {
        userId: invoice.collaboration!.freelancer.userId,
        type: "INVOICE_PAID",
        title: "Factuur betaald",
        body: `Factuur ${displayInvoiceNumber(invoice)} is als betaald gemarkeerd.`,
        link: "/facturen",
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_PAID",
        entityType: "Invoice",
        entityId: invoiceId,
      }),
    });
  });
  // Betaald = bij beide partijen een openstaande/te-late factuur minder (en een melding erbij).
  await invalidateSignals([actor.id, invoice.collaboration?.freelancer.userId]);
  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
}

/**
 * Handmatige betaalherinnering (crediteur → opdrachtgever). De ZZP'er stuurt vanaf een openstaande,
 * verzonden factuur eenmalig per afkoelperiode een in-platform nudge — náást de automatische
 * aanmaningsladder (`payment-reminders.ts`). Keten: auth → rol (FREELANCER) → ownership (uitschrijver)
 * → server-herbevestiging dat de factuur écht op betaling wacht + afkoelperiode (uit het auditlogboek)
 * → notify + audit. Geen geldstroom (Besluit 1): status­registratie + signalering, geen incasso.
 */
export async function sendPaymentReminder(
  invoiceId: string,
  _prev: ReminderState,
  _formData: FormData,
): Promise<ReminderState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.freelancer.userId !== actor.id)
    return { error: "Factuur niet gevonden." };

  // Afkoelperiode: het tijdstip van de laatste handmatige herinnering uit het auditlogboek
  // (de audit is de bron van waarheid, geen extra kolom nodig).
  const last = await prisma.auditLog.findFirst({
    where: { action: "INVOICE_REMINDER_SENT", entityId: invoiceId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const eligibility = canSendPaymentReminder({
    isFreelancerOwner: true,
    status: invoice.status,
    lifecycleStatus: invoice.lifecycleStatus as InvoiceLifecycleState | null,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    lastReminderAt: last?.createdAt ?? null,
  });
  if (!eligibility.eligible) {
    if (eligibility.reason === "cooldown" && eligibility.nextAllowedAt)
      return {
        error: `Je hebt onlangs al herinnerd. Probeer het na ${eligibility.nextAllowedAt.toLocaleDateString("nl-NL")}.`,
      };
    return { error: "Je kunt nu geen herinnering sturen voor deze factuur." };
  }

  const num = invoice.partyInvoiceNumber ?? invoice.number;
  const body =
    eligibility.daysOverdue > 0
      ? `Factuur ${num} is ${plural(eligibility.daysOverdue, "dag", "dagen")} over de vervaldag. Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`
      : `Factuur ${num} staat open. Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`;

  await prisma.$transaction([
    prisma.notification.create({
      data: {
        userId: invoice.collaboration.company.userId,
        type: "PAYMENT_REMINDER",
        title: "Betaalherinnering",
        body,
        link: "/facturen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_REMINDER_SENT",
        entityType: "Invoice",
        entityId: invoiceId,
        metadata: { daysOverdue: eligibility.daysOverdue },
      }),
    }),
  ]);

  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
  return { message: "Herinnering verstuurd." };
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.freelancer.userId !== actor.id)
    throw new Error("Factuur niet gevonden.");

  // Dispuut-bevriezing (§4 zijpad): geen geldstroom-/statusactie zolang de samenwerking gedisputeerd
  // is — spiegelt `sendInvoice`/`markInvoicePaid` en `assertNotDisputed` in de cascade-laag. Zonder
  // deze rem kon één partij een verzonden/openstaande factuur die ónder het dispuut valt eenzijdig
  // annuleren (de gedisputeerde geldregel wissen vóór de admin het dispuut beslecht).
  if (invoice.collaboration?.disputedAt) throw new Error(DISPUTE_FROZEN_INVOICE_MESSAGE);

  // Server-side waarheid (CLAUDE.md regel 1/2): een cascade-factuur (lifecycleStatus != null) loopt via
  // de uren-/prestatieflow en houdt haar legacy `status` bewust op DRAFT. Zonder deze rem kon een legacy-
  // actie (annuleren/versturen/betaald) de legacy-status van een cascade-factuur muteren — met een valse
  // audit-regel en uitsluiting uit de omzet-dashboards (revenue-trend `status != CANCELLED`) als gevolg.
  // De UI verbergt deze knoppen al (page.tsx `cascade`-gate); dit dwingt dezelfde regel server-side af.
  if (invoice.lifecycleStatus != null) throw new Error(CASCADE_FLOW_MESSAGE);

  const from = invoice.status as InvoiceStatus;
  try {
    assertInvoiceTransition(from, "CANCELLED");
  } catch (e) {
    if (e instanceof InvoiceTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.$transaction(async (tx) => {
    // Compound-guard `status: from` (zie sendInvoice): een gelijktijdige tweede annulering mag
    // geen dubbele INVOICE_CANCELLED-auditregel schrijven. Matcht de status niet meer → count 0
    // → idempotent, geen dubbel effect.
    const res = await tx.invoice.updateMany({
      where: { id: invoiceId, status: from },
      data: { status: "CANCELLED" },
    });
    if (res.count === 0) return;
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_CANCELLED",
        entityType: "Invoice",
        entityId: invoiceId,
      }),
    });
  });
  // Geannuleerd = de factuur verdwijnt uit de openstaande/te-late tellingen van beide partijen.
  await invalidateSignals([actor.id, invoice.collaboration?.company.userId]);
  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
}
