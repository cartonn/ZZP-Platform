// Registreert (idempotent) de transactie-fee voor een tenant-samenwerking zodra een factuur betaald
// is. Eén fee-record per samenwerking (CollaborationFee.collaborationId @unique), herberekend over de
// cumulatief betaalde waarde, en bevroren zodra de fee is gefactureerd (status != PENDING). No-op als
// billing uit staat, de samenwerking niet bij een tenant hoort, of de fee op 0 uitkomt. De aanroep
// (confirmPayment) is best-effort: deze registratie faalt nooit de betaling zelf.
// (Geen `import "server-only"`: dit bestand wordt via de cascade-commands ook door de seed geladen.)
import { prisma } from "@/lib/db";
import { TENANT_BILLING } from "@/lib/config";
import { planCollaborationFeeRecord } from "@/lib/tenant-billing/collaboration-fee";
import { PAID_REVENUE_LIFECYCLE } from "@/lib/administration/paid-revenue";
import { audit } from "@/lib/audit";

export async function recordTenantFeeForCollaboration(collaborationId: string): Promise<void> {
  if (!TENANT_BILLING.enabled) return;

  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { id: true, job: { select: { tenantId: true } } },
  });
  const tenantId = col?.job?.tenantId ?? null;
  if (!tenantId) return; // platform-samenwerking: geen tenant-fee

  // Cumulatief betaalde waarde excl. btw over alle betaalde cascade-facturen van deze samenwerking.
  // "Betaald" = PAID én PROCESSED (de canonieke regel uit paid-revenue.ts): een PAID-cascadefactuur
  // beweegt na administratieve verwerking door naar PROCESSED (lifecycle-map lifecycles.ts) en de
  // cutover-migratie zet legacy-PAID → PROCESSED. Alleen op "PAID" filteren liet PROCESSED-facturen
  // stil uit de fee-grondslag vallen → structurele onderfacturatie (de fee bevriest bij facturatie en
  // corrigeert daarna nooit meer). Zelfde constante als élke andere "betaalde omzet"-teller → geen drift.
  const paid = await prisma.invoice.aggregate({
    where: { collaborationId, lifecycleStatus: { in: [...PAID_REVENUE_LIFECYCLE] } },
    _sum: { subtotalCents: true },
  });
  const valueCents = paid._sum.subtotalCents ?? 0;
  if (valueCents <= 0) return;

  const subscription = await prisma.tenantSubscription.findUnique({
    where: { tenantId },
    select: { planKey: true },
  });
  const planKey = subscription?.planKey ?? TENANT_BILLING.defaultPlanKey;

  const record = planCollaborationFeeRecord({ collaborationId, tenantId, valueCents, planKey });
  if (!record) return; // billing uit of fee 0

  // Eenmaal gefactureerd = bevroren; niet meer herberekenen of overschrijven.
  const existing = await prisma.collaborationFee.findUnique({
    where: { collaborationId },
    select: { status: true },
  });
  if (existing && existing.status !== "PENDING") return;

  await prisma.collaborationFee.upsert({
    where: { collaborationId },
    create: {
      collaborationId,
      tenantId,
      planKey: record.planKey,
      feeCents: record.feeCents,
      vatCents: record.vatCents,
      status: "PENDING",
    },
    update: {
      tenantId,
      planKey: record.planKey,
      feeCents: record.feeCents,
      vatCents: record.vatCents,
    },
  });

  await audit({
    actorId: null,
    action: "TENANT_FEE_RECORDED",
    entityType: "Collaboration",
    entityId: collaborationId,
    metadata: {
      tenantId,
      planKey: record.planKey,
      feeCents: record.feeCents,
      vatCents: record.vatCents,
    },
  });
}
