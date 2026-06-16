import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { AvgPanel } from "@/components/admin/avg-panel";

export const metadata: Metadata = { title: "Verwerkingsregister · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminAvgPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const grond = first(sp.grond);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Verwerkingsregister</h1>
        <p className="text-sm text-muted-foreground">
          Overzicht van verwerkingsactiviteiten conform art. 30 AVG, inclusief bewaartermijnen. Dit
          register is een signalerend en administratief hulpmiddel — geen juridisch advies.
        </p>
      </header>

      <AvgPanel grond={grond} basePath="/admin/avg" />
    </div>
  );
}
