import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CONCEPTS } from "@/components/ontwerp/concepts/registry";
import { ConceptHost } from "./concept-host";

// Het ontwerp-lab is een INTERN concept-lab. De concepten renderen ON-DEMAND: deze route staat op
// `force-dynamic` (geen generateStaticParams meer) zodat de nachtroutine kan blijven bijschrijven
// zonder dat elke bouw 150 zware "use client"-pagina's prerendert. Het daadwerkelijke concept wordt
// per id lazy geladen in de client-host (concept-host.tsx) — daar levert next/dynamic een echte
// aparte async-chunk op, zodat de browser alleen de bekeken concept-bundel downloadt i.p.v. alle ~150.
export const dynamic = "force-dynamic";

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
  // Alleen volledig uitgewerkte concepten hebben een pagina; de rest valt terug op notFound().
  if (!meta || !meta.available) notFound();

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
      <ConceptHost id={id} />
    </div>
  );
}
