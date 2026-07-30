import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { ShiftHandoffGovernanceScreen } from "@/components/shift-overname/governance-screen";

export const metadata: Metadata = { title: "Dienst-overnames · Handslag" };

export default async function AdminShiftHandoffsPage() {
  // auth + rol: ADMIN ziet alle openstaande overname-aanvragen platform-breed.
  const actor = await requireRole("ADMIN");
  return <ShiftHandoffGovernanceScreen actor={actor} />;
}
