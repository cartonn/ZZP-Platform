import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CONCEPTS, BUILT } from "@/components/ontwerp/concepts/registry";
import { Concept01 } from "@/components/ontwerp/concepts/concept-01-helder";
import { Concept02 } from "@/components/ontwerp/concepts/concept-02-orbit";
import { Concept03 } from "@/components/ontwerp/concepts/concept-03-folio";
import { Concept04 } from "@/components/ontwerp/concepts/concept-04-haven";
import { Concept05 } from "@/components/ontwerp/concepts/concept-05-cockpit";
import { Concept06 } from "@/components/ontwerp/concepts/concept-06-puls";
import { Concept07 } from "@/components/ontwerp/concepts/concept-07-vitre";
import { Concept08 } from "@/components/ontwerp/concepts/concept-08-beton";
import { Concept09 } from "@/components/ontwerp/concepts/concept-09-mobiel";
import { Concept10 } from "@/components/ontwerp/concepts/concept-10-nocturne";

// Koppelt het URL-segment aan de uitgewerkte concept-component. Alleen `available` concepten staan
// hier; de rest valt terug op notFound() (en is in de galerij als "binnenkort" gemarkeerd).
const COMPONENTS: Record<string, () => React.ReactElement> = {
  "01": Concept01,
  "02": Concept02,
  "03": Concept03,
  "04": Concept04,
  "05": Concept05,
  "06": Concept06,
  "07": Concept07,
  "08": Concept08,
  "09": Concept09,
  "10": Concept10,
};

export function generateStaticParams() {
  return BUILT.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meta = CONCEPTS.find((c) => c.id === id);
  return {
    title: meta ? `Ontwerp ${id} — ${meta.name}` : "Ontwerp-lab",
    robots: { index: false, follow: false },
  };
}

export default async function ConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = CONCEPTS.find((c) => c.id === id);
  const Component = COMPONENTS[id];
  if (!meta || !Component) notFound();

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Neutrale chrome-balk boven het concept — niet onderdeel van het ontwerp zelf. */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white/90 px-5 py-2.5 backdrop-blur">
        <Link
          href="/ontwerp"
          className="flex items-center gap-2 rounded-md px-2 py-1 font-mono text-xs text-neutral-500 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <ArrowLeft className="size-3.5" /> alle concepten
        </Link>
        <div className="flex items-center gap-2 text-right">
          <span className="text-sm font-semibold text-neutral-900">
            {id} · {meta.name}
          </span>
          <span className="hidden font-mono text-[11px] text-neutral-400 sm:inline">
            {meta.direction}
          </span>
        </div>
      </div>
      <Component />
    </div>
  );
}
