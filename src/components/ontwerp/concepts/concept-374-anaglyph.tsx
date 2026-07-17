"use client";

// Concept 374 — "Anaglyph" · Rood-cyaan stereo-3D.
// Retro stereoscopische 3D: rood (#e8352f) en cyaan (#22c7d6) kanaal-offsets die diepte suggereren,
// dubbele randcontouren (chromatic split), donkere basis (#101318) met stereo-glow. Fonts: Anton
// (display), Geist Mono (body). Motief: kaarten/koppen met subtiele rood/cyaan-versprongen
// dubbelrand; matching-diepte als "in reliëf". Speels-technisch, retro-futuristisch.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Layers,
  Glasses,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: donkere basis met rood/cyaan stereo-kanalen —
const C = {
  base: "#101318",
  panel: "#161a21",
  panelHi: "#1b2029",
  ink: "#eef2f6",
  inkSoft: "#c3ccd6",
  muted: "#8b96a3",
  faint: "#5c6673",
  line: "rgba(238,242,246,0.12)",
  lineSoft: "rgba(238,242,246,0.06)",
  red: "#e8352f",
  cyan: "#22c7d6",
};

const head = { fontFamily: "var(--font-lab-anton), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true };
  }
}

// Stereo-tekst: rood/cyaan versprongen kopieën achter de scherpe laag — het anaglyph-effect.
function Stereo({
  children,
  className = "",
  depth = 3,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`relative inline-block ${className}`} style={style}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{ color: C.red, transform: `translate(-${depth}px, 0)`, opacity: 0.75 }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{ color: C.cyan, transform: `translate(${depth}px, 0)`, opacity: 0.75 }}
      >
        {children}
      </span>
      <span className="relative" style={{ color: C.ink }}>
        {children}
      </span>
    </span>
  );
}

// Stereo-glow achtergrond: twee versprongen kleurwolken.
const stereoField: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 22% 18%, rgba(232,53,47,0.10) 0 22%, transparent 55%), radial-gradient(circle at 78% 24%, rgba(34,199,214,0.10) 0 22%, transparent 55%), radial-gradient(circle at 60% 90%, rgba(34,199,214,0.06) 0 30%, transparent 60%)",
};

// — Depth-panel: dubbele chromatische rand rood links / cyaan rechts —
function DepthPanel({
  children,
  className = "",
  lift = 4,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{
          border: `1px solid ${C.red}`,
          transform: `translate(-${lift}px, 0)`,
          opacity: 0.35,
        }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{
          border: `1px solid ${C.cyan}`,
          transform: `translate(${lift}px, 0)`,
          opacity: 0.35,
        }}
        aria-hidden="true"
      />
      <div
        className={`relative rounded-md ${className}`}
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        {children}
      </div>
    </div>
  );
}

// — Sparkline als stereo-thermogram: rood + cyaan versprongen lijn —
function Spark({ data }: { data: number[] }) {
  const w = 78;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * (h - 5) - 2.5;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.red}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-1.5,0)"
        opacity="0.85"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={C.cyan}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(1.5,0)"
        opacity="0.85"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={C.ink}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// — Diepte-meter: match-score als reliëf-balk met chromatische split —
function DepthBar({ value }: { value: number }) {
  return (
    <span
      className="relative block h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.lineSoft }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${value}%`,
          background: C.red,
          transform: "translateX(-1.5px)",
          opacity: 0.8,
        }}
      />
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${value}%`,
          background: C.cyan,
          transform: "translateX(1.5px)",
          opacity: 0.8,
        }}
      />
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${value}%`, background: "rgba(238,242,246,0.55)" }}
      />
    </span>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] uppercase tracking-[0.32em]" style={{ color: C.cyan, ...body }}>
      {children}
    </p>
  );
}

function Chip({ children, alarm }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] uppercase tracking-[0.08em]"
      style={{
        color: alarm ? C.red : C.cyan,
        border: `1px solid ${alarm ? "rgba(232,53,47,0.45)" : "rgba(34,199,214,0.4)"}`,
        background: alarm ? "rgba(232,53,47,0.08)" : "rgba(34,199,214,0.07)",
        ...body,
      }}
    >
      {children}
    </span>
  );
}

export function Concept374() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.base, color: C.ink, ...stereoField }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-md"
          style={{ border: `1px solid ${C.line}`, background: C.panelHi }}
          aria-hidden="true"
        >
          <Glasses size={20} color={C.cyan} />
        </span>
        <div>
          <Stereo className="text-[24px] leading-none tracking-[0.02em]" style={head} depth={2}>
            ANAGLYPH
          </Stereo>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.26em]"
            style={{ color: C.faint }}
          >
            Werk in reliëf · stereo-matching
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.cyan, border: `1px solid rgba(34,199,214,0.4)` }}
        >
          <Layers size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-medium leading-none" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="mt-1 block text-[10.5px] leading-none" style={{ color: C.faint }}>
            {PROFIEL.plaats}
          </span>
        </span>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-[12px]"
          style={{ border: `1px solid ${C.line}`, background: C.panelHi, color: C.ink }}
          aria-hidden="true"
        >
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: C.red, transform: "translateX(-1px)", opacity: 0.7 }}
          >
            {PROFIEL.initialen}
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: C.cyan, transform: "translateX(1px)", opacity: 0.7 }}
          >
            {PROFIEL.initialen}
          </span>
          <span className="relative">{PROFIEL.initialen}</span>
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3.5 text-[12.5px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted }}
          >
            <span className="mr-2 text-[10px] tabular-nums" style={{ color: on ? C.red : C.faint }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <>
                <span
                  className="absolute inset-x-3 -bottom-px h-0.5"
                  style={{ background: C.red, transform: "translateX(-1.5px)", opacity: 0.8 }}
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-x-3 -bottom-px h-0.5"
                  style={{ background: C.cyan, transform: "translateX(1.5px)", opacity: 0.8 }}
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="self-center">
          <Overline>Laag 01 · Vandaag</Overline>
          <h1
            className="mt-5 text-[44px] leading-[0.98] tracking-[0.01em] md:text-[58px]"
            style={head}
          >
            <Stereo depth={3}>GOEDEMORGEN,</Stereo>
            <br />
            <Stereo depth={3}>{(PROFIEL.naam.split(" ")[0] ?? "").toUpperCase()}.</Stereo>
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Alles wat telt in reliëf gezet — de dichtstbijzijnde acties springen naar voren. Eén
            handeling nu en de dag ligt scherp voor je.
          </p>
        </div>

        <DepthPanel className="overflow-hidden">
          <div className="p-6">
            <Overline>Voorste laag</Overline>
            <h2 className="mt-3 text-[22px] leading-tight tracking-[0.01em]" style={head}>
              <Stereo depth={2}>{primair.titel}</Stereo>
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
            <button
              onClick={onOpen}
              className="group mt-5 inline-flex items-center gap-2 rounded px-5 py-2.5 text-[12.5px] uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.cyan, color: C.base, ...body }}
            >
              {primair.cta}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </DepthPanel>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Laag 02 · Metingen</Overline>
          <span className="text-[10.5px] uppercase tracking-[0.14em]" style={{ color: C.faint }}>
            deze maand
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <DepthPanel key={k.label} lift={3}>
              <div className="p-5">
                <div className="flex items-baseline justify-between">
                  <p
                    className="text-[10.5px] uppercase tracking-[0.1em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: k.up ? C.cyan : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[30px] tabular-nums leading-none tracking-[0.01em]"
                  style={head}
                >
                  <Stereo depth={2}>{k.value}</Stereo>
                </p>
                <div className="mt-3 flex justify-end">
                  <Spark data={k.spark} />
                </div>
              </div>
            </DepthPanel>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Laag 03 · Opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[10.5px] uppercase tracking-[0.14em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.cyan }}
          >
            Alle opdrachten
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-md p-4 text-left transition-colors hover:bg-[#1b2029] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ border: `1px solid ${C.line}` }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium" style={{ color: C.ink }}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchDepth value={o.match} />
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.ink }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MatchDepth({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span className="text-[16px] tabular-nums leading-none" style={head}>
        <Stereo depth={strong ? 3 : 1.5}>{value}%</Stereo>
      </span>
      <span className="hidden w-16 sm:block">
        <DepthBar value={value} />
      </span>
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Marktplaats</Overline>
          <h1 className="mt-3 text-[36px] leading-none tracking-[0.01em]" style={head}>
            <Stereo depth={3}>OPDRACHTEN</Stereo>
          </h1>
        </div>
        <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.faint }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          in beeld
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded px-3 py-2.5"
          style={{ border: `1px solid ${C.line}`, background: C.panel }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#5c6673]"
            style={{ color: C.ink }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded px-3 py-2 text-[11.5px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.cyan, color: C.base }
                    : { color: C.muted, border: `1px solid ${C.line}` }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <DepthPanel>
          <div className="flex flex-col items-center py-16 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Glasses size={26} style={{ color: C.cyan }} />
            </span>
            <p className="mt-5 text-[24px] tracking-[0.01em]" style={head}>
              <Stereo depth={2}>GEEN BEELD</Stereo>
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om het
              beeld opnieuw scherp te stellen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 rounded px-5 py-2.5 text-[12.5px] uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.cyan, color: C.base }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </DepthPanel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <DepthPanel>
      <div className="p-5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          <div className="min-w-0">
            <span className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.faint }}>
              {opdracht.id}
            </span>
            <h3 className="mt-1 text-[18px] leading-snug tracking-[0.01em]" style={head}>
              <Stereo depth={1.5}>{opdracht.titel}</Stereo>
            </h3>
            <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[22px] tabular-nums leading-none" style={head}>
              <Stereo depth={opdracht.match >= 90 ? 3 : 1.5}>{opdracht.match}%</Stereo>
            </span>
            <span className="text-[13px]" style={{ color: C.inkSoft }}>
              {opdracht.tarief}
            </span>
          </div>
        </div>
        <div
          className="mt-4 flex items-center gap-4 border-t pt-3"
          style={{ borderColor: C.lineSoft }}
        >
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.muted }}
          >
            {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
            Waarom deze match
          </button>
          <button
            onClick={onOpen}
            className="ml-auto inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.06em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.cyan }}
          >
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div
          className="grid transition-all duration-300 motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.cyan }}>
                  Naar voren (pro)
                </p>
                <ul className="mt-2 space-y-1.5">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.inkSoft }}
                    >
                      <Check
                        size={13}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        style={{ color: C.cyan }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.red }}>
                  Naar achter (contra)
                </p>
                <ul className="mt-2 space-y-1.5">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      <AlertTriangle
                        size={12}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        style={{ color: C.red }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DepthPanel>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <DepthPanel lift={5}>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] tracking-[0.1em]" style={{ color: C.cyan }}>
              {opdracht.id}
            </span>
            <Chip>{opdracht.match}% match</Chip>
            <span className="text-[11px] uppercase tracking-[0.1em]" style={{ color: C.faint }}>
              {opdracht.plaats}
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[36px] leading-[1.02] tracking-[0.01em] md:text-[46px]"
            style={head}
          >
            <Stereo depth={3}>{opdracht.titel}</Stereo>
          </h1>
          <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded px-5 py-3 text-[12.5px] uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.red, color: C.ink }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded px-5 py-3 text-[12.5px] uppercase tracking-[0.08em] transition-colors hover:bg-[#1b2029] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.ink, border: `1px solid ${C.line}` }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </DepthPanel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <DepthPanel key={m.l} lift={2}>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
                {m.l}
              </p>
              <p className="mt-1.5 text-[22px] tabular-nums tracking-[0.01em]" style={head}>
                <Stereo depth={1.5}>{m.v}</Stereo>
              </p>
            </div>
          </DepthPanel>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Overline>Diepteanalyse · waarom deze match</Overline>
        </div>
        <p className="mt-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — wat naar voren komt én wat naar
          achter valt, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <DepthPanel lift={3}>
            <div className="p-5">
              <Overline>Naar voren (pro)</Overline>
              <ul className="mt-4 space-y-3">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                    style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                  >
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.cyan }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </DepthPanel>
          <DepthPanel lift={3}>
            <div className="p-5">
              <p className="text-[10.5px] uppercase tracking-[0.28em]" style={{ color: C.red }}>
                Naar achter (contra)
              </p>
              <ul className="mt-4 space-y-3">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                    style={{ borderColor: C.lineSoft, color: C.muted }}
                  >
                    <AlertTriangle
                      size={14}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.red }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </DepthPanel>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-6 border-b pb-8"
        style={{ borderColor: C.line }}
      >
        <div className="max-w-md">
          <Overline>Verificatie</Overline>
          <h1 className="mt-3 text-[36px] leading-none tracking-[0.01em]" style={head}>
            <Stereo depth={3}>CERTIFICATEN</Stereo>
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten scherp in beeld. Eén vraagt binnenkort
            om vernieuwing.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-40">
            <DepthBar value={ratio} />
          </div>
          <p className="text-[44px] tabular-nums leading-none tracking-[0.01em]" style={head}>
            <Stereo depth={3}>{ratio}%</Stereo>
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <DepthPanel lift={st.alarm ? 4 : 2}>
                <div className="p-5">
                  <button
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <st.Icon
                          size={15}
                          aria-hidden="true"
                          style={{ color: st.alarm ? C.red : C.cyan }}
                        />
                        <span className="truncate text-[16px] font-medium" style={{ color: C.ink }}>
                          {c.naam}
                        </span>
                      </span>
                      <span className="mt-1 block text-[12px]" style={{ color: C.muted }}>
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Chip alarm={st.alarm}>{st.label}</Chip>
                      <span
                        className="transition-transform motion-reduce:transition-none"
                        style={{
                          color: C.muted,
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        }}
                        aria-hidden="true"
                      >
                        <Plus size={15} />
                      </span>
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-3 border-t pt-3" style={{ borderColor: C.lineSoft }}>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded px-3.5 py-2 text-[12px] uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            style={{ background: C.cyan, color: C.base }}
                          >
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </button>
                          <button
                            className="rounded px-3.5 py-2 text-[12px] uppercase tracking-[0.06em] transition-colors hover:bg-[#1b2029] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}
                          >
                            Logboek
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DepthPanel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <div className="border-b pb-6" style={{ borderColor: C.line }}>
        <Overline>Volgende stappen</Overline>
        <h1 className="mt-3 text-[36px] leading-none tracking-[0.01em]" style={head}>
          <Stereo depth={3}>ACTIES</Stereo>
        </h1>
        <p className="mt-3 max-w-md text-[14px]" style={{ color: C.muted }}>
          Werk deze punten op volgorde af — het dichtstbij vraagt het eerst om aandacht.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <DepthPanel lift={warn ? 5 : 3}>
                <div
                  className="grid grid-cols-1 items-center gap-4 border-l-[3px] p-5 sm:grid-cols-[auto_1fr_auto]"
                  style={{ borderColor: warn ? C.red : C.cyan }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] tabular-nums"
                    style={
                      warn
                        ? { background: C.red, color: C.ink, ...head }
                        : { border: `1.5px solid ${C.cyan}`, color: C.cyan, ...head }
                    }
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle size={15} aria-hidden="true" style={{ color: C.red }} />
                      ) : (
                        <Layers size={15} aria-hidden="true" style={{ color: C.cyan }} />
                      )}
                      <h2 className="text-[16px] tracking-[0.01em]" style={head}>
                        <Stereo depth={1.5}>{a.titel}</Stereo>
                      </h2>
                    </div>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="justify-self-start rounded px-5 py-2.5 text-[12px] uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                    style={
                      warn
                        ? { background: C.red, color: C.ink }
                        : { border: `1px solid ${C.line}`, color: C.ink }
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </DepthPanel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Register</Overline>
          <h1 className="mt-3 text-[36px] leading-none tracking-[0.01em]" style={head}>
            <Stereo depth={3}>FACTUREN</Stereo>
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded px-5 py-3 text-[12.5px] uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.cyan, color: C.base }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <DepthPanel key={s.l} lift={s.alarm ? 4 : 2}>
            <div className="p-5">
              <p className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
                {s.l}
              </p>
              <p className="mt-2 text-[28px] tabular-nums tracking-[0.01em]" style={head}>
                <Stereo depth={s.alarm ? 3 : 1.5}>{s.v}</Stereo>
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
                {s.sub}
              </p>
            </div>
          </DepthPanel>
        ))}
      </section>

      <DepthPanel>
        <div className="p-5">
          <div
            className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 border-b pb-2 sm:grid"
            style={{ borderColor: C.line }}
          >
            {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
              <span
                key={h}
                className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                style={{ color: C.faint }}
              >
                {h}
              </span>
            ))}
          </div>
          <ul>
            {FACTUREN.map((f) => {
              const acc = factuurAlarm(f.status);
              return (
                <li
                  key={f.nr}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#1b2029] sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span className="order-1 text-[12px] tabular-nums" style={{ color: C.faint }}>
                    {f.nr}
                  </span>
                  <span
                    className="order-3 min-w-0 truncate text-[14px] font-medium sm:order-2"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span
                    className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </span>
                  <span className="order-5 sm:order-4">
                    <Chip alarm={acc}>{f.status}</Chip>
                  </span>
                  <span
                    className="order-2 text-right text-[14px] tabular-nums sm:order-5"
                    style={head}
                  >
                    <Stereo depth={acc ? 2.5 : 1}>{f.bedrag}</Stereo>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-baseline justify-between pt-5">
            <span className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
              Totaal betaald
            </span>
            <span className="text-[24px] tabular-nums" style={head}>
              <Stereo depth={2}>{totaalBetaald}</Stereo>
            </span>
          </div>
        </div>
      </DepthPanel>
    </div>
  );
}
