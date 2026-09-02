import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignShowcase } from "@/components/ontwerp/design-showcase";
import { requireRole } from "@/lib/authz";
import { isDesignLabEnabled } from "@/lib/design-lab";
import "./themes.css";

export const metadata: Metadata = {
  title: "Ontwerp-lab · 10 richtingen",
  robots: { index: false, follow: false },
};

// De omgevingsvlag wordt per request gelezen; prerenderen zou 'm op bouwtijd vastzetten.
export const dynamic = "force-dynamic";

// 10 design-richtingen (uit de workflow). Elke sectie zet data-ontwerp; themes.css overschrijft
// de tokens + fonts voor die subtree, zodat dezelfde mock 10x anders rendert.
const DIRECTIONS = [
  {
    id: 1,
    name: "Linear",
    pitch:
      "Leisteen-grijs raster met een enkele indigo puls: een serieus werktuig, premium door restraint.",
  },
  {
    id: 2,
    name: "Stripe Refined",
    pitch:
      "Luchtig indigo-lavendel met een zachte zwevende laag: betrouwbaar premium dat rustig ademt.",
  },
  {
    id: 3,
    name: "Vercel Mono",
    pitch:
      "Compromisloos zwart-op-wit: elke pixel is functie, kleur verschijnt alleen waar status het eist.",
  },
  {
    id: 4,
    name: "Editorial Warm",
    pitch:
      "Warm redactioneel dossier: inktzwarte Fraunces-koppen op crème met een terracotta zegel.",
  },
  {
    id: 5,
    name: "Zorg Vertrouwen",
    pitch: "Kalme teal op blauwgrijs: het zegel van geverifieerd vertrouwen voor de zorg-ZZP'er.",
  },
  {
    id: 6,
    name: "Bold Product",
    pitch:
      "Zelfverzekerd violet-naar-blauw: expressieve koppen en een glowende CTA die naar de volgende actie sturen.",
  },
  {
    id: 7,
    name: "Dark-first Premium",
    pitch:
      "Nachtelijke cockpit: charcoal-glas waar matchscores en verificatiezegels als enige oplichten.",
  },
  {
    id: 8,
    name: "Pastel Elevated",
    pitch:
      "Diep koningsblauw met zwevende pastel-tegels: vertrouwenwekkend gezag dat hoge dichtheid licht houdt.",
  },
  {
    id: 9,
    name: "Corporate Navy+Amber",
    pitch:
      "Marineblauw gezag met een warme amber accentbalk: de taal van banken en notarissen, modern gehouden.",
  },
  {
    id: 10,
    name: "Fresh Emerald",
    pitch:
      "Frisse emerald met limetint-accent: voorwaartse energie van match en groei, nooit luidruchtig.",
  },
];

export default async function OntwerpLabPage() {
  // Het lab is ADMIN-only en staat in productie standaard dicht (src/lib/design-lab.ts).
  if (!isDesignLabEnabled(process.env.DESIGN_LAB_ENABLED)) notFound();
  await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-neutral-100 p-6 dark:bg-neutral-900">
      <div className="mx-auto max-w-[1200px] space-y-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Ontwerp-lab — 10 richtingen
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Dezelfde dashboard-compositie in 10 design-richtingen. Kies een nummer.
          </p>
        </header>

        {DIRECTIONS.map((d) => (
          <section key={d.id} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white dark:bg-neutral-50 dark:text-neutral-900">
                {d.id}
              </span>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {d.name}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{d.pitch}</p>
            </div>
            <div data-ontwerp={d.id} className="font-sans">
              <DesignShowcase />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
