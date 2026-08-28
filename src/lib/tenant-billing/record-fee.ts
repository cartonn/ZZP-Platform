// Registreert (idempotent) de transactie-fee voor een tenant-samenwerking zodra een factuur betaald
// is. Eén fee-record per samenwerking (CollaborationFee.collaborationId @unique), herberekend over de
// cumulatief betaalde waarde, en bevroren zodra de fee is gefactureerd (status != PENDING). No-op als
// billing uit staat, de samenwerking niet bij een tenant hoort, of de fee op 0 uitkomt. De aanroep
// (confirmPayment) is best-effort: deze registratie faalt nooit de betaling zelf.
// (Geen `import "server-only"`: dit bestand wordt via de cascade-commands ook door de seed geladen.)
import { Prisma } from "@prisma/client";
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

  // Eenmaal gefactureerd = bevroren; niet meer herberekenen, overschrijven of intrekken. Een creditnota
  // ná facturatie van de fee vereist een handmatige correctie in de billing-cockpit (buiten scope hier).
  // Deze lezing dient alleen om vroeg te stoppen op een reeds-bevroren fee (bespaart werk); de
  // uiteindelijke delete/update is óók status-gepoort (`status: "PENDING"` in de where-clause) zodat een
  // billing-run die de rij tussen deze lezing en de schrijfactie naar INVOICED flipt, nooit een
  // gefactureerde fee — die een live platformfactuur dekt — kan wissen of overschrijven (TOCTOU-grendel,
  // zelfde compound-guard-patroon als `setBillingStatusAction`/`collaborationCompletableGuard`).
  const existing = await prisma.collaborationFee.findUnique({
    where: { collaborationId },
    select: { status: true },
  });
  if (existing && existing.status !== "PENDING") return;

  const subscription = await prisma.tenantSubscription.findUnique({
    where: { tenantId },
    select: { planKey: true },
  });
  const planKey = subscription?.planKey ?? TENANT_BILLING.defaultPlanKey;

  const record =
    valueCents > 0
      ? planCollaborationFeeRecord({ collaborationId, tenantId, valueCents, planKey })
      : null;

  // Geen fee (meer) van toepassing: grondslag op 0 (bv. alle facturen gecrediteerd) of fee rondt op 0
  // af. Een nog-openstaande (PENDING) fee mag dan niet blijven staan — anders factureert de billing-run
  // straks een fee over teruggedraaide omzet aan de tenant (geld-integriteit). Trek 'm in.
  if (!record) {
    if (existing) {
      // Status-gepoort intrekken: alleen een nog-openstaande (PENDING) fee mag weg. `deleteMany` met de
      // status in de where-clause is atomair — flipt een gelijktijdige billing-run de rij net naar
      // INVOICED, dan matcht dit 0 rijen en blijft de gefactureerde fee (die een live platformfactuur
      // dekt) staan i.p.v. gewist te worden. Audit alleen bij een echte intrekking.
      const removed = await prisma.collaborationFee.deleteMany({
        where: { collaborationId, status: "PENDING" },
      });
      if (removed.count > 0) {
        await audit({
          actorId: null,
          action: "TENANT_FEE_REVERSED",
          entityType: "Collaboration",
          entityId: collaborationId,
          metadata: { tenantId, valueCents },
        });
      }
    }
    return;
  }

  // Status-gepoorte herberekening. Eerst een guarded `updateMany` op de bestaande PENDING-rij: dit
  // raakt nooit een INVOICED-rij (bevroren) en is atomair t.o.v. de billing-run. Matcht dat 0 rijen,
  // dan bestaat er óf nog geen fee (maak er één), óf de fee is net bevroren (laat 'm met rust). We
  // proberen daarom te creëren; botst dat op de unieke `collaborationId` (de bevroren rij bestaat al),
  // dan is dat een no-op — precies de gewenste "laat gefactureerde fee met rust".
  const updated = await prisma.collaborationFee.updateMany({
    where: { collaborationId, status: "PENDING" },
    data: {
      tenantId,
      planKey: record.planKey,
      feeCents: record.feeCents,
      vatCents: record.vatCents,
    },
  });

  if (updated.count === 0) {
    try {
      await prisma.collaborationFee.create({
        data: {
          collaborationId,
          tenantId,
          planKey: record.planKey,
          feeCents: record.feeCents,
          vatCents: record.vatCents,
          status: "PENDING",
        },
      });
    } catch (err) {
      // Unieke `collaborationId`-botsing: er staat al een (inmiddels bevroren of gelijktijdig
      // aangemaakte) rij. Niet overschrijven — dat zou de bevroren-invariant breken. Geen audit.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
      throw err;
    }
  }

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
