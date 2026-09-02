import "server-only";
import { prisma } from "@/lib/db";
import { assessBillingReadiness, type BillingReadiness } from "@/lib/billing-readiness";

/**
 * Laadt de facturatie-gereedheid van een ZZP'er: bewijst uit zijn dáádwerkelijk uitgeschreven
 * facturen of er wordt gefactureerd (en of er btw wordt geheven), en toetst dat tegen de harde
 * profielgegevens (btw-id, IBAN). Evidence-based: een ZZP'er die nooit factureert of enkel
 * vrijgesteld (KOR/EXEMPT) factureert krijgt géén valse melding.
 *
 * Eén begrensde, eigenaar-gescopete query. Scoping via de altijd-gevulde relatie
 * (`collaboration.freelancer.userId`) én de kolom `issuerUserId`: die kolom wordt alleen door de
 * cascade-handler gezet (`null` = platform-fee/legacy), dus een legacy loose-factuur van deze ZZP'er
 * (issuerUserId null, samenwerking wel van hem) zou onder een kolom-only scope onzichtbaar blijven en
 * de art. 35a-melding ten onrechte onderdrukken. Zelfde patroon als `freelancer-stats.ts` (run 79).
 * Een platform-fee-factuur (issuerUserId null én geen samenwerking van deze ZZP'er) valt buiten beide
 * takken. We hebben alleen "bestaat er een uitgeschreven factuur" + "bestaat er een btw-heffende" nodig.
 */
export async function getBillingReadiness(input: {
  userId: string;
  btwNumber?: string | null;
  iban?: string | null;
}): Promise<BillingReadiness> {
  const issued = await prisma.invoice.findMany({
    where: {
      issuedAt: { not: null },
      OR: [
        { issuerUserId: input.userId },
        { collaboration: { freelancer: { userId: input.userId } } },
      ],
    },
    select: { vatRegime: true },
    // Begrensd; existence-check, geen aggregatie over de volledige historie nodig. Deterministische
    // orderBy zodat het venster bij >1000 facturen stabiel is (Prisma garandeert geen rij-volgorde).
    orderBy: { issuedAt: "desc" },
    take: 1000,
  });

  const hasIssuedInvoice = issued.length > 0;
  // Alleen een expliciet, niet-EXEMPT regime telt als btw-heffend. Een leeg/legacy regime (null/"")
  // behandelen we als niet-heffend → nooit een valse art. 35a-melding op onbekende grond.
  const hasVatChargingInvoice = issued.some((i) => {
    const regime = (i.vatRegime ?? "").trim().toUpperCase();
    return regime.length > 0 && regime !== "EXEMPT";
  });

  return assessBillingReadiness({
    hasIssuedInvoice,
    hasVatChargingInvoice,
    btwNumber: input.btwNumber,
    iban: input.iban,
  });
}
