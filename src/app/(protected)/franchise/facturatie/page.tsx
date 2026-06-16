import { type Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getTenantBillingOverview } from "@/lib/franchise/billing";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { type TenantSubscriptionStatus } from "@/lib/enums";
import { BillingPanel, tenantBillingStatusLabel } from "@/components/franchise/billing-panel";

export const metadata: Metadata = { title: "Facturatie · Bemiddeling" };

const STATUS_VARIANT: Record<TenantSubscriptionStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PAST_DUE: "warning",
  SUSPENDED: "danger",
};

export default async function FranchiseFacturatiePage() {
  const actor = await requireRole("FRANCHISER");
  const overview = await getTenantBillingOverview(actor, new Date());

  if (!overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Facturatie"
          description="Het abonnement en de fees van je bemiddeling."
        />
        <Card>
          <EmptyState
            icon={ReceiptText}
            title="Geen bemiddeling gekoppeld"
            description="Dit overzicht is beschikbaar zodra je een bemiddeling beheert."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturatie"
        description="Je abonnement en de transactie-fees per gevulde samenwerking."
        action={
          <Badge variant={STATUS_VARIANT[overview.status]} className="text-sm">
            Abonnement: {tenantBillingStatusLabel(overview.status)}
          </Badge>
        }
      />
      <BillingPanel overview={overview} />
    </div>
  );
}
