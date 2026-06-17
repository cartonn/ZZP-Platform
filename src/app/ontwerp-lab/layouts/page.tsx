import { type Metadata } from "next";
import "../themes.css";
import OntwerpBento from "@/components/ontwerp/layouts/ontwerp-1";
import OntwerpCommandCenter from "@/components/ontwerp/layouts/ontwerp-2";
import OntwerpDataTable from "@/components/ontwerp/layouts/ontwerp-3";
import OntwerpMasterDetail from "@/components/ontwerp/layouts/ontwerp-4";
import OntwerpTopNav from "@/components/ontwerp/layouts/ontwerp-5";
import OntwerpFeed from "@/components/ontwerp/layouts/ontwerp-6";
import OntwerpAnalytics from "@/components/ontwerp/layouts/ontwerp-7";
import OntwerpKanban from "@/components/ontwerp/layouts/ontwerp-8";
import OntwerpThreeColumn from "@/components/ontwerp/layouts/ontwerp-9";
import OntwerpEditorial from "@/components/ontwerp/layouts/ontwerp-10";

export const metadata: Metadata = { title: "Ontwerp-lab · 10 layouts" };

// 10 structureel verschillende layouts (uit de workflow), elk gekoppeld aan een ander palet
// (data-ontwerp 1-10 uit themes.css) zodat ze in zowel structuur als kleur verschillen.
const LAYOUTS = [
  {
    n: 11,
    theme: 8,
    name: "Bento-grid",
    Comp: OntwerpBento,
    note: "Asymmetrisch tegelmozaïek — hero-metric, mini-stats, grafiek, lijst en donut.",
  },
  {
    n: 12,
    theme: 1,
    name: "Command center",
    Comp: OntwerpCommandCenter,
    note: "Focus-first: 'Wat nu'-actiebanner + geprioriteerde takenlijst.",
  },
  {
    n: 13,
    theme: 3,
    name: "Data-table-first",
    Comp: OntwerpDataTable,
    note: "Linear/Retool-dichte tabel met toolbar, status-pills en inline matchbalken.",
  },
  {
    n: 14,
    theme: 2,
    name: "Master–detail",
    Comp: OntwerpMasterDetail,
    note: "Inbox/CRM-split: lijst links, detailpaneel met werkproces-stepper rechts.",
  },
  {
    n: 15,
    theme: 6,
    name: "Top-nav",
    Comp: OntwerpTopNav,
    note: "Geen zijbalk: horizontale nav + full-bleed hero-band + kaartgrid.",
  },
  {
    n: 16,
    theme: 5,
    name: "Activity-feed",
    Comp: OntwerpFeed,
    note: "Narratieve tijdlijn van gebeurtenissen, per dag gegroepeerd, + week-meta.",
  },
  {
    n: 17,
    theme: 9,
    name: "Analytics-hero",
    Comp: OntwerpAnalytics,
    note: "Enorme headline-KPI + brede grafiek, daaronder KPI-grid en verdeelbalken.",
  },
  {
    n: 18,
    theme: 10,
    name: "Kanban-pipeline",
    Comp: OntwerpKanban,
    note: "Voorgesteld/Actief/Afgerond-kolommen met kandidaatkaarten.",
  },
  {
    n: 19,
    theme: 4,
    name: "Drie-koloms workspace",
    Comp: OntwerpThreeColumn,
    note: "Nav-rail + hoofdkolom + contextuele rechterrail (volgende acties, week, zegel).",
  },
  {
    n: 20,
    theme: 7,
    name: "Spacious editorial",
    Comp: OntwerpEditorial,
    note: "Veel witruimte, grote display-type, weinig grote elementen — premium-kalm.",
  },
];

export default function OntwerpLayoutsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6 dark:bg-neutral-900">
      <div className="mx-auto max-w-[1200px] space-y-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Ontwerp-lab — 10 layouts (andere structuur, niet alleen kleur)
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tien structureel verschillende dashboard-ontwerpen, elk in een eigen palet. Kies een
            nummer.
          </p>
        </header>

        {LAYOUTS.map(({ n, theme, name, Comp, note }) => (
          <section key={n} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white dark:bg-neutral-50 dark:text-neutral-900">
                {n}
              </span>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {name}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{note}</p>
            </div>
            <div data-ontwerp={theme} className="font-sans">
              <Comp />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
