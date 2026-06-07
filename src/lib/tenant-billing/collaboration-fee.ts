// Transactie-fee per gevulde samenwerking (ADR-0006 E). Pure berekening, integer-centen, geen I/O.
// Spiegelt de platform-fee-logica (cascade/platform-fee.ts), maar dan per franchise-tenant. Zolang
// `TENANT_BILLING.enabled` UIT staat of het bedrag 0 is, is de fee niet van toepassing.

import { TENANT_BILLING, type TenantBillingConfig } from "@/lib/config";
import { computeVat } from "@/lib/administration/vat";
import { tenantPlan } from "@/lib/tenant-billing/tenant-plan";

export interface CollaborationFeeResult {
  /** False als billing uit staat of de fee op 0 uitkomt — dan geen registratie. */
  applicable: boolean;
  planKey: string;
  subtotalCents: number; // fee excl. BTW
  vatCents: number;
  totalCents: number; //    fee incl. BTW
}

/** Het fee-subtotaal: een vast bedrag (voorrang), anders een percentage van de samenwerkingswaarde. */
export function collaborationFeeSubtotalCents(
  collaborationValueCents: number,
  planKey: string,
  config: TenantBillingConfig = TENANT_BILLING,
): number {
  const plan = tenantPlan(planKey, config);
  if (plan.feeFixedCents > 0) return plan.feeFixedCents;
  if (plan.feePercentageBps > 0 && collaborationValueCents > 0) {
    return Math.round((collaborationValueCents * plan.feePercentageBps) / 10000);
  }
  return 0;
}

/**
 * Berekent de transactie-fee over de samenwerkingswaarde voor het gegeven plan. Niet van toepassing
 * (applicable=false, alle bedragen 0) als billing uit staat of de fee op 0 uitkomt.
 */
export function calculateCollaborationFee(
  collaborationValueCents: number,
  planKey: string,
  config: TenantBillingConfig = TENANT_BILLING,
): CollaborationFeeResult {
  const resolvedKey = tenantPlan(planKey, config).key;
  const subtotalCents = config.enabled
    ? collaborationFeeSubtotalCents(collaborationValueCents, resolvedKey, config)
    : 0;

  if (!config.enabled || subtotalCents <= 0) {
    return {
      applicable: false,
      planKey: resolvedKey,
      subtotalCents: 0,
      vatCents: 0,
      totalCents: 0,
    };
  }

  const vat = computeVat(subtotalCents, config.vatRegime);
  return {
    applicable: true,
    planKey: resolvedKey,
    subtotalCents: vat.subtotalCents,
    vatCents: vat.vatCents,
    totalCents: vat.totalCents,
  };
}

export interface CollaborationFeeRecord {
  collaborationId: string;
  tenantId: string;
  planKey: string;
  feeCents: number;
  vatCents: number;
  status: "PENDING";
}

/**
 * Het te registreren fee-record voor een gevulde samenwerking, of `null` als er geen fee van
 * toepassing is. De aanroeper (een recorder, mensenwerk-wiring zodra billing live gaat) schrijft het
 * idempotent weg (collaborationId is uniek). Pure: bepaalt alleen het record, doet geen I/O.
 */
export function planCollaborationFeeRecord(
  input: { collaborationId: string; tenantId: string | null; valueCents: number; planKey: string },
  config: TenantBillingConfig = TENANT_BILLING,
): CollaborationFeeRecord | null {
  if (!input.tenantId) return null; // alleen tenant-samenwerkingen dragen een tenant-fee
  const fee = calculateCollaborationFee(input.valueCents, input.planKey, config);
  if (!fee.applicable) return null;
  return {
    collaborationId: input.collaborationId,
    tenantId: input.tenantId,
    planKey: fee.planKey,
    feeCents: fee.subtotalCents,
    vatCents: fee.vatCents,
    status: "PENDING",
  };
}
