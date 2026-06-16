import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/authz";
import { AdministratieHubScreen } from "@/components/administratie/administratie-hub-screen";

export const metadata: Metadata = { title: "Administratie · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Administratie-hub: ZZP'er en opdrachtgever zien hun financiële overzicht (kopkaart + tabs:
 * facturen, openstaand, boekhouding en — rol-bewust — prognose/ontzorgd of verplichtingen) binnen
 * de app-schil. Alleen FREELANCER/CLIENT (server-side afgedwongen); andere rollen → /dashboard.
 * Alleen het actieve tabpaneel laadt server-side data.
 */
export default async function FinancienPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER" && actor.role !== "CLIENT") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const tab = first(sp.tab);

  return (
    <div className="space-y-6">
      <AdministratieHubScreen actor={actor} tab={tab} />
    </div>
  );
}
