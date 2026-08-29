// Toestandsmachines voor de overhaul-cascade (ARCHITECTURE.md §2.2, PLATFORM_OVERHAUL.md §3).
// Code = Engels (CLAUDE.md); de Nederlandse labels leven in de UI-laag. Deze lifecycles zijn de
// DOEL-lifecycles; de bestaande korte enums (Job/Invoice/Collaboration) migreren in Fase 2/3.
//
// Geld loopt NOOIT via het platform (Besluit 1): de betaling-lifecycle is puur statusregistratie.

import { z } from "zod";
import { defineStateMachine } from "@/lib/state-machine";

// --- Opdracht (work order) -------------------------------------------------
export const WORK_ORDER_STATES = [
  "DRAFT", // concept
  "PUBLISHED", // gepubliceerd
  "MATCHED", // gematcht
  "CONTRACTED", // gecontracteerd
  "IN_PROGRESS", // in uitvoering
  "DELIVERED", // opgeleverd
  "COMPLETED", // afgerond
  "ARCHIVED", // gearchiveerd
] as const;
export type WorkOrderState = (typeof WORK_ORDER_STATES)[number];
export const workOrderStateSchema = z.enum(WORK_ORDER_STATES);
export const workOrderMachine = defineStateMachine<WorkOrderState>("WorkOrder", {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["MATCHED", "ARCHIVED"],
  MATCHED: ["CONTRACTED", "PUBLISHED", "ARCHIVED"],
  CONTRACTED: ["IN_PROGRESS", "ARCHIVED"],
  IN_PROGRESS: ["DELIVERED", "ARCHIVED"],
  DELIVERED: ["COMPLETED", "IN_PROGRESS"], // terug naar in_uitvoering bij vervolgwerk
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
});

// --- Contract --------------------------------------------------------------
export const CONTRACT_LIFECYCLE_STATES = [
  "DRAFT", // concept
  "AWAITING_SIGNATURE", // ter ondertekening
  "SIGNED", // getekend (beide partijen)
  "ACTIVE", // actief
  "TERMINATED", // beëindigd
] as const;
export type ContractLifecycleState = (typeof CONTRACT_LIFECYCLE_STATES)[number];
export const contractLifecycleStateSchema = z.enum(CONTRACT_LIFECYCLE_STATES);
export const contractMachine = defineStateMachine<ContractLifecycleState>("Contract", {
  DRAFT: ["AWAITING_SIGNATURE"],
  AWAITING_SIGNATURE: ["SIGNED", "DRAFT"],
  SIGNED: ["ACTIVE"],
  ACTIVE: ["TERMINATED"],
  TERMINATED: [],
});

// --- Urenstaat / Oplevering (performance) ----------------------------------
// Eén machine voor beide tariefvormen (uren én milestone/oplevering) — Besluit 3.
export const PERFORMANCE_STATES = [
  "DRAFT", // concept
  "SUBMITTED", // ingediend ter goedkeuring
  "APPROVED", // goedgekeurd
  "REJECTED", // afgekeurd (zijpad)
] as const;
export type PerformanceState = (typeof PERFORMANCE_STATES)[number];
export const performanceStateSchema = z.enum(PERFORMANCE_STATES);
export const performanceMachine = defineStateMachine<PerformanceState>("Performance", {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: [], // goedgekeurd is definitief; vervolgperiode = nieuwe urenstaat
  REJECTED: ["SUBMITTED", "DRAFT"], // herstel: aanpassen en opnieuw indienen
});

// --- Factuur (overhaul-lifecycle, rijker dan de huidige InvoiceStatus) ------
export const INVOICE_LIFECYCLE_STATES = [
  "DRAFT", // concept (automatisch gegenereerd na goedkeuring prestatie)
  "SUBMITTED", // ingediend (ZZP'er bevestigt -> krijgt factuurnummer)
  "APPROVED", // goedgekeurd door opdrachtgever
  "PAID", // betaald (rechtstreeks; alleen geregistreerd)
  "PROCESSED", // verwerkt (administratie afgerond)
  "REJECTED", // afgekeurd (zijpad)
  "OVERDUE", // te laat (zijpad)
  "CREDITED", // gecrediteerd (zijpad)
  "WITHDRAWN", // ingetrokken (terminaal zijpad: nog-niet-aanvaarde factuur teruggetrokken door uitschrijver/admin)
] as const;
export type InvoiceLifecycleState = (typeof INVOICE_LIFECYCLE_STATES)[number];
export const invoiceLifecycleStateSchema = z.enum(INVOICE_LIFECYCLE_STATES);
export const invoiceLifecycleMachine = defineStateMachine<InvoiceLifecycleState>(
  "InvoiceLifecycle",
  {
    // Een nog-niet-aanvaarde factuur (DRAFT/SUBMITTED/REJECTED) kan terminaal worden INGETROKKEN:
    // de uitschrijver (of admin) trekt zijn eigen vordering terug wanneer die nooit betaald zal worden.
    // Zo blijft een afgekeurde-en-nooit-heraangeboden factuur niet als "openstaand geld" hangen en kan
    // de samenwerking alsnog terminaal worden (WITHDRAWN telt als afgewikkeld). Crediteren is voorbehouden
    // aan een reeds aanvaarde/betaalde factuur (APPROVED+); intrekken aan het voor-aanvaarding-traject.
    DRAFT: ["SUBMITTED", "WITHDRAWN"],
    SUBMITTED: ["APPROVED", "REJECTED", "WITHDRAWN"],
    APPROVED: ["PAID", "OVERDUE", "CREDITED"],
    OVERDUE: ["PAID", "CREDITED"],
    PAID: ["PROCESSED", "CREDITED"],
    PROCESSED: ["CREDITED"],
    REJECTED: ["SUBMITTED", "WITHDRAWN"], // corrigeren en opnieuw indienen (Event C) óf terminaal intrekken
    CREDITED: [],
    WITHDRAWN: [],
  },
);

// --- Betaling (registratie — GEEN geldverwerking, Besluit 1) ----------------
export const PAYMENT_REGISTRATION_STATES = [
  "EXPECTED", // verwacht
  "MARKED_PAID", // gemarkeerd betaald (door één partij)
  "CONFIRMED", // bevestigd (ontvangst bevestigd)
  "OVERDUE", // te laat (zijpad)
] as const;
export type PaymentRegistrationState = (typeof PAYMENT_REGISTRATION_STATES)[number];
export const paymentRegistrationStateSchema = z.enum(PAYMENT_REGISTRATION_STATES);
export const paymentMachine = defineStateMachine<PaymentRegistrationState>("Payment", {
  EXPECTED: ["MARKED_PAID", "OVERDUE"],
  MARKED_PAID: ["CONFIRMED"],
  OVERDUE: ["MARKED_PAID", "CONFIRMED"],
  CONFIRMED: [],
});
