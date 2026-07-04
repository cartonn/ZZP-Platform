import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CONCEPTS, BUILT } from "@/components/ontwerp/concepts/registry";
import { Concept01 } from "@/components/ontwerp/concepts/concept-01-veld";
import { Concept02 } from "@/components/ontwerp/concepts/concept-02-folio";
import { Concept03 } from "@/components/ontwerp/concepts/concept-03-helder";
import { Concept04 } from "@/components/ontwerp/concepts/concept-04-tij";
import { Concept05 } from "@/components/ontwerp/concepts/concept-05-beurs";
import { Concept06 } from "@/components/ontwerp/concepts/concept-06-klei";
import { Concept07 } from "@/components/ontwerp/concepts/concept-07-puls";
import { Concept08 } from "@/components/ontwerp/concepts/concept-08-nebula";
import { Concept09 } from "@/components/ontwerp/concepts/concept-09-index";
import { Concept10 } from "@/components/ontwerp/concepts/concept-10-bastion";
import { Concept11 } from "@/components/ontwerp/concepts/concept-11-terra";
import { Concept12 } from "@/components/ontwerp/concepts/concept-12-glas";
import { Concept13 } from "@/components/ontwerp/concepts/concept-13-prisma";
import { Concept14 } from "@/components/ontwerp/concepts/concept-14-raster";
import { Concept15 } from "@/components/ontwerp/concepts/concept-15-zenit";
import { Concept16 } from "@/components/ontwerp/concepts/concept-16-aurora";
import { Concept17 } from "@/components/ontwerp/concepts/concept-17-kanaal";
import { Concept18 } from "@/components/ontwerp/concepts/concept-18-kompas";
import { Concept19 } from "@/components/ontwerp/concepts/concept-19-puur";
import { Concept20 } from "@/components/ontwerp/concepts/concept-20-karbon";
import { Concept21 } from "@/components/ontwerp/concepts/concept-21-atlas";
import { Concept22 } from "@/components/ontwerp/concepts/concept-22-dossier";
import { Concept23 } from "@/components/ontwerp/concepts/concept-23-blauwdruk";
import { Concept24 } from "@/components/ontwerp/concepts/concept-24-console";
import { Concept25 } from "@/components/ontwerp/concepts/concept-25-relief";
import { Concept26 } from "@/components/ontwerp/concepts/concept-26-perforatie";
import { Concept27 } from "@/components/ontwerp/concepts/concept-27-courant";
import { Concept28 } from "@/components/ontwerp/concepts/concept-28-riso";
import { Concept29 } from "@/components/ontwerp/concepts/concept-29-signaal";
import { Concept30 } from "@/components/ontwerp/concepts/concept-30-vitrine";
import { Concept31 } from "@/components/ontwerp/concepts/concept-31-perron";
import { Concept32 } from "@/components/ontwerp/concepts/concept-32-parel";
import { Concept33 } from "@/components/ontwerp/concepts/concept-33-zegel";
import { Concept34 } from "@/components/ontwerp/concepts/concept-34-redactie";
import { Concept35 } from "@/components/ontwerp/concepts/concept-35-deco";
import { Concept36 } from "@/components/ontwerp/concepts/concept-36-schemer";
import { Concept37 } from "@/components/ontwerp/concepts/concept-37-isometrie";
import { Concept38 } from "@/components/ontwerp/concepts/concept-38-spectrum";
import { Concept39 } from "@/components/ontwerp/concepts/concept-39-botanie";
import { Concept40 } from "@/components/ontwerp/concepts/concept-40-kwadrant";
import { Concept41 } from "@/components/ontwerp/concepts/concept-41-beton";
import { Concept42 } from "@/components/ontwerp/concepts/concept-42-helvetia";
import { Concept43 } from "@/components/ontwerp/concepts/concept-43-aqua";
import { Concept44 } from "@/components/ontwerp/concepts/concept-44-grootboek";
import { Concept45 } from "@/components/ontwerp/concepts/concept-45-duim";
import { Concept46 } from "@/components/ontwerp/concepts/concept-46-palet";
import { Concept47 } from "@/components/ontwerp/concepts/concept-47-ruimte";
import { Concept48 } from "@/components/ontwerp/concepts/concept-48-paspoort";
import { Concept49 } from "@/components/ontwerp/concepts/concept-49-meter";
import { Concept50 } from "@/components/ontwerp/concepts/concept-50-handleiding";
import { Concept51 } from "@/components/ontwerp/concepts/concept-51-teletekst";
import { Concept52 } from "@/components/ontwerp/concepts/concept-52-metrokaart";
import { Concept53 } from "@/components/ontwerp/concepts/concept-53-bauhaus";
import { Concept54 } from "@/components/ontwerp/concepts/concept-54-eink";
import { Concept55 } from "@/components/ontwerp/concepts/concept-55-aquarel";
import { Concept56 } from "@/components/ontwerp/concepts/concept-56-kiosk";
import { Concept57 } from "@/components/ontwerp/concepts/concept-57-origami";
import { Concept58 } from "@/components/ontwerp/concepts/concept-58-textiel";
import { Concept59 } from "@/components/ontwerp/concepts/concept-59-memphis";
import { Concept60 } from "@/components/ontwerp/concepts/concept-60-schetsboek";
import { Concept61 } from "@/components/ontwerp/concepts/concept-61-stroom";
import { Concept62 } from "@/components/ontwerp/concepts/concept-62-neonzon";
import { Concept63 } from "@/components/ontwerp/concepts/concept-63-strip";
import { Concept64 } from "@/components/ontwerp/concepts/concept-64-solar";
import { Concept65 } from "@/components/ontwerp/concepts/concept-65-kinetiek";
import { Concept66 } from "@/components/ontwerp/concepts/concept-66-prikbord";
import { Concept67 } from "@/components/ontwerp/concepts/concept-67-parcours";
import { Concept68 } from "@/components/ontwerp/concepts/concept-68-pictogram";
import { Concept69 } from "@/components/ontwerp/concepts/concept-69-haard";
import { Concept70 } from "@/components/ontwerp/concepts/concept-70-krijt";
import { Concept71 } from "@/components/ontwerp/concepts/concept-71-vertrek";
import { Concept72 } from "@/components/ontwerp/concepts/concept-72-bon";
import { Concept73 } from "@/components/ontwerp/concepts/concept-73-printplaat";
import { Concept74 } from "@/components/ontwerp/concepts/concept-74-sterrenbeeld";
import { Concept75 } from "@/components/ontwerp/concepts/concept-75-cinema";
import { Concept76 } from "@/components/ontwerp/concepts/concept-76-etiket";
import { Concept77 } from "@/components/ontwerp/concepts/concept-77-arcade";
import { Concept78 } from "@/components/ontwerp/concepts/concept-78-zilver";
import { Concept79 } from "@/components/ontwerp/concepts/concept-79-radar";
import { Concept80 } from "@/components/ontwerp/concepts/concept-80-terrazzo";

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
  "11": Concept11,
  "12": Concept12,
  "13": Concept13,
  "14": Concept14,
  "15": Concept15,
  "16": Concept16,
  "17": Concept17,
  "18": Concept18,
  "19": Concept19,
  "20": Concept20,
  "21": Concept21,
  "22": Concept22,
  "23": Concept23,
  "24": Concept24,
  "25": Concept25,
  "26": Concept26,
  "27": Concept27,
  "28": Concept28,
  "29": Concept29,
  "30": Concept30,
  "31": Concept31,
  "32": Concept32,
  "33": Concept33,
  "34": Concept34,
  "35": Concept35,
  "36": Concept36,
  "37": Concept37,
  "38": Concept38,
  "39": Concept39,
  "40": Concept40,
  "41": Concept41,
  "42": Concept42,
  "43": Concept43,
  "44": Concept44,
  "45": Concept45,
  "46": Concept46,
  "47": Concept47,
  "48": Concept48,
  "49": Concept49,
  "50": Concept50,
  "51": Concept51,
  "52": Concept52,
  "53": Concept53,
  "54": Concept54,
  "55": Concept55,
  "56": Concept56,
  "57": Concept57,
  "58": Concept58,
  "59": Concept59,
  "60": Concept60,
  "61": Concept61,
  "62": Concept62,
  "63": Concept63,
  "64": Concept64,
  "65": Concept65,
  "66": Concept66,
  "67": Concept67,
  "68": Concept68,
  "69": Concept69,
  "70": Concept70,
  "71": Concept71,
  "72": Concept72,
  "73": Concept73,
  "74": Concept74,
  "75": Concept75,
  "76": Concept76,
  "77": Concept77,
  "78": Concept78,
  "79": Concept79,
  "80": Concept80,
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
