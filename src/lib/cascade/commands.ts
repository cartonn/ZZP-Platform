// Barrel — re-exporteert alle cascade-commands zodat bestaande importpaden werken.
// De implementatie is gesplitst per entiteit in afzonderlijke modules (audit T4):
//   commands-shared.ts      — gedeelde helpers, loaders, persistentie-kern
//   contract-commands.ts    — Event A (contract tekenen)
//   performance-commands.ts — Events B1/B2/B2' (prestaties)
//   invoice-commands.ts     — Events C/D/D' + creditfactuur
//   payment-commands.ts     — Event E (betaling bevestigen)
//   dispute-commands.ts     — zijpad dispuut/escalatie

export { CascadeError, isUniqueDedupeViolation } from "@/lib/cascade/commands-shared";

export { signContract } from "@/lib/cascade/contract-commands";

export type { CreatePerformanceInput } from "@/lib/cascade/performance-commands";
export {
  createPerformance,
  updatePerformance,
  submitPerformance,
  approvePerformance,
  autoApprovePerformance,
  rejectPerformance,
} from "@/lib/cascade/performance-commands";

export {
  submitInvoice,
  approveInvoice,
  rejectInvoice,
  creditInvoice,
  withdrawInvoice,
} from "@/lib/cascade/invoice-commands";

export { confirmPayment } from "@/lib/cascade/payment-commands";

export { openDispute, resolveDispute } from "@/lib/cascade/dispute-commands";
