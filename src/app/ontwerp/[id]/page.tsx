import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CONCEPTS, BUILT } from "@/components/ontwerp/concepts/registry";
import { Concept01 } from "@/components/ontwerp/concepts/concept-01-mono";
import { Concept02 } from "@/components/ontwerp/concepts/concept-02-editorial";

// Koppelt het URL-segment aan de uitgewerkte concept-component. Alleen `available` concepten staan
// hier; de rest valt terug op notFound() (en is in de galerij als "binnenkort" gemarkeerd).
const COMPONENTS: Record<string, () => React.ReactElement> = {
  "01": Concept01,
  "02": Concept02,
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
