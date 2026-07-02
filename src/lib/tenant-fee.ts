// Bemiddelaars-fee: de marge die een franchisenemer (FRANCHISER) verdient over het doorgezette
// volume van zijn bemiddeling. Los van de plan-gebonden transactie-fee (tenant-billing): dit is de
// zelf-ingestelde fee die de bemiddelaar op /inzicht als "Jouw fee" ziet. Deterministisch, in centen.

/** Grenzen van het instelbare fee-percentage: 0–50%, één decimaal (bv. 12.5). */
export const TENANT_FEE_PERCENT_MIN = 0;
export const TENANT_FEE_PERCENT_MAX = 50;

/**
 * Pure fee-berekening: fee in centen = volume × feePercent / 100, rekenkundig afgerond op hele centen.
 * Negatieve of niet-eindige invoer levert 0 (defensief; de bron is server-side gevalideerd).
 */
export function computeTenantFee(volumeCents: number, feePercent: number): number {
  if (!Number.isFinite(volumeCents) || !Number.isFinite(feePercent)) return 0;
  if (volumeCents <= 0 || feePercent <= 0) return 0;
  return Math.round((volumeCents * feePercent) / 100);
}
