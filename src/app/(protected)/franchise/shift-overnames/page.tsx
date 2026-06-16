import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { ShiftHandoffGovernanceScreen } from "@/components/shift-overname/governance-screen";

export const metadata: Metadata = { title: "Shift-overnames · Franchise" };

export default async function FranchiseShiftHandoffsPage() {
  // auth + rol: FRANCHISER ziet alleen de openstaande overname-aanvragen binnen de eigen tenant
  // (de tenant-scope in het gedeelde scherm filtert op job.tenantId).
  const actor = await requireRole("FRANCHISER");
  return <ShiftHandoffGovernanceScreen actor={actor} />;
}
