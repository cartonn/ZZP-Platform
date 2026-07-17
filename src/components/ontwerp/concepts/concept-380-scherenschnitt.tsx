"use client";

// Concept 380 — "Scherenschnitt" · Papierknipsel silhouet.
// Fijn symmetrisch papierknipwerk: ranke zwarte silhouet-vormen uitgesneden tegen warm ivoor,
// spiegelsymmetrie, filigrein-randen, delicate scherpe contouren, één rood zegel-accent. Koppen en
// dividers zijn geknipte silhouet-ornamenten (SVG), kaarten dragen filigrein-hoeken; hoog contrast
// zwart-op-ivoor. Het knipsel is decoratief kader, de content blijft leesbaar en toegankelijk.
// Palet: knip-zwart (#171512), warm ivoor (#f2ecdf), rood zegel (#8f2e28). Fonts: Cormorant, Inter.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Scissors,
  Bird,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: knip-zwart op warm ivoor met één rood zegel —
const C = {
  ivory: "#f2ecdf",
  ivoryAlt: "#e9e1cf",
  card: "#f7f2e8",
  black: "#171512",
  blackSoft: "#33302a",
  muted: "#5d584e",
  faint: "#8c877a",
  line: "rgba(23,21,18,0.22)",
  lineSoft: "rgba(23,21,18,0.11)",
  red: "#8f2e28",
  redSoft: "#b3564f",
};

const head = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Uitgesneden", Icon: Check, alarm: false };
    case "SUBMITTED":
      return { label: "Onder de schaar", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Rafelt binnenkort", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Weggeknipt", Icon: AlertTriangle, alarm: true };
  }
}

// — Symmetrisch geknipt divider-ornament (spiegelsymmetrie) —
function CutDivider({ tone = C.black, width = 260 }: { tone?: string; width?: number }) {
  return (
    <svg width={width} height={26} viewBox="0 0 260 26" aria-hidden="true" className="max-w-full">
      <g fill={tone}>
        {/* Middenmedaillon */}
        <circle cx="130" cy="13" r="4.5" />
        <circle cx="130" cy="13" r="8.5" fill="none" stroke={tone} strokeWidth="1" />
        <path d="M130 1 l3 6 -3 3 -3 -3 z" />
        <path d="M130 25 l3 -6 -3 -3 -3 3 z" />
        {/* Gespiegelde ranken */}
        {[1, -1].map((s) => (
          <g key={s} transform={s === 1 ? "translate(0,0)" : "translate(260,0) scale(-1,1)"}>
            <path
              d="M130 13 C112 13 108 5 96 6 C86 7 88 15 80 15 C72 15 74 8 66 9 C58 10 60 16 52 15"
              fill="none"
              stroke={tone}
              strokeWidth="1.4"
            />
            <circle cx="96" cy="6" r="2" />
            <circle cx="66" cy="9" r="1.6" />
            <path d="M52 15 l-6 -3 0 6 z" />
            <circle cx="40" cy="13" r="2.4" />
            <circle cx="30" cy="13" r="1.4" />
            <circle cx="22" cy="13" r="1" />
          </g>
        ))}
      </g>
    </svg>
  );
}

// — Filigrein-hoekornament voor kaarten —
function FiligreeCorner({ tone = C.line, size = 26 }: { tone?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <g fill="none" stroke={tone} strokeWidth="1">
        <path d="M2 12 C2 6 6 2 12 2" />
        <path d="M2 18 C2 9 9 2 18 2" opacity="0.6" />
        <circle cx="6" cy="6" r="1.4" fill={tone} stroke="none" />
      </g>
    </svg>
  );
}

// — Rood was-zegel silhouet —
function Seal({ size = 40, children }: { size?: number; children?: React.ReactNode }) {
  const c = size / 2;
  const pts = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    const r = c - (i % 2 === 0 ? 1 : 3);
    return `${(c + Math.cos(a) * r).toFixed(1)},${(c + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <polygon points={pts} fill={C.red} />
        <circle
          cx={c}
          cy={c}
          r={c - 6}
          fill="none"
          stroke="rgba(242,236,223,0.5)"
          strokeWidth="1"
        />
      </svg>
      <span className="relative" style={{ color: C.ivory }}>
        {children}
      </span>
    </span>
  );
}

// — Fijne, geknipte sparkline —
function CutLine({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// — Papieren rand-textuur: subtiele vezel —
const fibre: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(23,21,18,0.025) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(23,21,18,0.02) 0 1px, transparent 1px 4px)",
};

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.32em]"
      style={{ color: C.red, ...body }}
    >
      {children}
    </p>
  );
}

function Chip({ children, alarm }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        color: alarm ? C.ivory : C.black,
        background: alarm ? C.red : "transparent",
        border: alarm ? "none" : `1px solid ${C.black}`,
        ...body,
      }}
    >
      {children}
    </span>
  );
}

function Panel({
  children,
  className = "",
  corners = true,
}: {
  children: React.ReactNode;
  className?: string;
  corners?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        border: `1px solid ${C.black}`,
        background: C.card,
        boxShadow: `4px 4px 0 ${C.lineSoft}`,
      }}
    >
      {corners && (
        <>
          <span className="pointer-events-none absolute left-1 top-1" aria-hidden="true">
            <FiligreeCorner />
          </span>
          <span
            className="pointer-events-none absolute right-1 top-1 -scale-x-100"
            aria-hidden="true"
          >
            <FiligreeCorner />
          </span>
          <span
            className="pointer-events-none absolute bottom-1 left-1 -scale-y-100"
            aria-hidden="true"
          >
            <FiligreeCorner />
          </span>
          <span
            className="pointer-events-none absolute bottom-1 right-1 -scale-100"
            aria-hidden="true"
          >
            <FiligreeCorner />
          </span>
        </>
      )}
      {children}
    </div>
  );
}

export function Concept380() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.black, background: C.ivory, ...fibre }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
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
    <header className="pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: C.black }}
            aria-hidden="true"
          >
            <Bird size={20} color={C.ivory} />
          </span>
          <div>
            <p className="text-[26px] font-semibold leading-none tracking-[-0.01em]" style={head}>
              Scherenschnitt
            </p>
            <p
              className="mt-1 text-[10.5px] uppercase leading-none tracking-[0.26em]"
              style={{ color: C.faint, ...body }}
            >
              Uitgesneden vertrouwen · {PROFIEL.plaats}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
            style={{ color: C.black, border: `1px solid ${C.black}`, ...body }}
          >
            <Scissors size={12} aria-hidden="true" style={{ color: C.red }} />
            {PROFIEL.trust}
          </span>
          <span className="hidden text-right sm:block">
            <span className="block text-[13px] font-semibold" style={{ color: C.blackSoft }}>
              {PROFIEL.naam}
            </span>
            <span className="block text-[10.5px]" style={{ color: C.faint }}>
              {PROFIEL.rol}
            </span>
          </span>
          <Seal size={40}>
            <span className="text-[11px] font-semibold" style={body}>
              {PROFIEL.initialen}
            </span>
          </Seal>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <CutDivider width={320} />
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      className="flex items-center justify-center gap-0 overflow-x-auto"
      aria-label="Hoofdnavigatie"
      style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3 text-[12.5px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: on ? C.black : C.faint,
              ...body,
              borderLeft: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
            }}
          >
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-[3px]"
                style={{ background: C.red }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="self-center">
          <Overline>Het blad · Vandaag</Overline>
          <h1
            className="mt-5 text-[46px] font-semibold leading-[0.98] tracking-[-0.01em] md:text-[60px]"
            style={head}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Eén zorgvuldige knip zet de contour voor vandaag. Snijd het belangrijkste vrij en de
            rest van het blad volgt de lijn vanzelf.
          </p>
          <div className="mt-6 flex justify-start">
            <CutDivider width={220} tone={C.line} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className="group inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.black, color: C.ivory, ...body }}
            >
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
            <span
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px]"
              style={{ color: C.blackSoft, border: `1px solid ${C.line}` }}
            >
              <Scissors size={14} aria-hidden="true" style={{ color: C.red }} />
              {ongelezen} nieuwe berichten
            </span>
          </div>
        </div>

        <Panel className="p-6">
          <span className="absolute right-4 top-4" aria-hidden="true">
            <Seal size={34}>
              <Scissors size={13} />
            </Seal>
          </span>
          <Overline>Fijnste snit</Overline>
          <h2 className="mt-3 max-w-[85%] text-[26px] font-semibold leading-snug" style={head}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <button
            onClick={onOpen}
            className="group mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.card, color: C.black, border: `1px solid ${C.black}`, ...body }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Panel>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2.5"
          style={{ borderColor: C.line }}
        >
          <Overline>Vrijgesneden · deze maand</Overline>
          <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.black : C.red }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[32px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={head}
              >
                {k.value}
              </p>
              <div className="mt-4">
                <CutLine data={k.spark} tone={k.up ? C.black : C.red} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2.5"
          style={{ borderColor: C.line }}
        >
          <Overline>Open silhouetten · opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-[#8f2e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.red }}
          >
            Volledig vel
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left transition-all hover:bg-[#e9e1cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: i === 0 ? C.red : C.black }}
                  aria-hidden="true"
                >
                  <Bird size={15} color={C.ivory} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-semibold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchCut value={o.match} />
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.blackSoft }}
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

function MatchCut({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: strong ? C.red : C.blackSoft }}
      >
        {value}%
      </span>
      <span
        className="hidden h-1.5 w-14 overflow-hidden sm:block"
        style={{ background: C.lineSoft }}
      >
        <span
          className="block h-full"
          style={{ width: `${value}%`, background: strong ? C.red : C.black }}
        />
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
        className="flex flex-col items-center border-b pb-6 text-center"
        style={{ borderColor: C.line }}
      >
        <Overline>Het vel</Overline>
        <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]" style={head}>
          Open opdrachten
        </h1>
        <div className="mt-4">
          <CutDivider width={240} />
        </div>
        <span className="mt-3 text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          silhouetten
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
          style={{ border: `1px solid ${C.black}`, background: C.card }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8c877a]"
            style={{ color: C.black, ...body }}
          />
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.black, color: C.ivory, ...body }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...body }
                }
              >
                {s === "match" ? "Op match" : "Op tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-0">
          <div className="flex flex-col items-center py-16 text-center">
            <Scissors size={44} aria-hidden="true" style={{ color: C.faint }} />
            <p className="mt-4 text-[28px] font-semibold" style={head}>
              Geen silhouet gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen vorm past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om het vel
              opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.black, color: C.ivory, ...body }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtSilhouet opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtSilhouet({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${C.black}`, ...body }}
          aria-hidden="true"
        >
          <span className="text-[11px] font-semibold" style={{ color: C.red }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="text-[20px] font-semibold leading-snug" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[22px] font-semibold tabular-nums"
            style={{ color: opdracht.match >= 90 ? C.red : C.black, ...head }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[14px] font-medium" style={{ color: C.blackSoft }}>
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
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.red }}
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
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.black }}>
                Vrijgesneden vóór
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.blackSoft }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.black }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.red }}>
                Rafelrand
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
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
    </Panel>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar het vel
      </button>

      <div
        className="relative overflow-hidden p-6 text-center md:p-10"
        style={{ background: C.black, color: C.ivory }}
      >
        <div className="flex justify-center">
          <CutDivider width={280} tone={C.ivory} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className="text-[11px] tracking-[0.1em]" style={{ color: C.redSoft }}>
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: C.red, color: C.ivory }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[42px] font-semibold leading-[1.02] tracking-[-0.01em] md:text-[54px]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: "rgba(242,236,223,0.78)" }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.red, color: C.ivory, ...body }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ivory, border: "1px solid rgba(242,236,223,0.4)", ...body }}
          >
            Bewaar silhouet
          </button>
        </div>
        <div className="mt-6 flex justify-center">
          <CutDivider width={200} tone={C.ivory} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={head}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Overline>De contour · waarom deze match</Overline>
        </div>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed" style={{ color: C.blackSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de rafelranden,
          zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Panel className="p-5">
            <Overline>Vrijgesneden vóór</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.blackSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.black }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <p className="text-[10.5px] uppercase tracking-[0.3em]" style={{ color: C.red }}>
              Rafelrand
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
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
          </Panel>
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
          <Overline>Uitgesneden bewijs · authenticatie</Overline>
          <h1
            className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]"
            style={head}
          >
            Certificaten
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.black }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten zijn schoon uitgesneden. Eén rafelt
            binnenkort en vraagt om een nieuwe snit.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <Seal size={72}>
            <span className="text-[20px] font-semibold tabular-nums" style={head}>
              {ratio}
            </span>
          </Seal>
          <div>
            <p
              className="text-[48px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={head}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: C.faint }}
            >
              uitgesneden
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${st.alarm ? C.red : C.black}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={15} style={{ color: st.alarm ? C.red : C.black }} />
                  </span>
                  <span className="min-w-0">
                    <span className="truncate text-[17px] font-semibold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
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
                    <div className="mt-3 border-t pl-12 pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.blackSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: C.black, color: C.ivory, ...body }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="px-4 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.blackSoft, border: `1px solid ${C.line}`, ...body }}
                        >
                          Historie
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
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
        <Overline>Het knippatroon · volgende acties</Overline>
        <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]" style={head}>
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Volg deze lijnen op volgorde — elke afgeronde snit houdt de contour zuiver.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <div
                className="grid grid-cols-1 items-center gap-4 border-l-[3px] p-5 sm:grid-cols-[auto_1fr_auto]"
                style={{
                  background: C.card,
                  borderColor: warn ? C.red : C.black,
                  borderTop: `1px solid ${C.line}`,
                  borderRight: `1px solid ${C.line}`,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                  style={
                    warn
                      ? { background: C.red, color: C.ivory, ...body }
                      : { border: `1.5px solid ${C.black}`, color: C.black, ...body }
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
                      <Scissors size={15} aria-hidden="true" style={{ color: C.black }} />
                    )}
                    <h2 className="text-[18px] font-semibold leading-snug" style={head}>
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="justify-self-start px-5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                  style={
                    warn
                      ? { background: C.red, color: C.ivory, ...body }
                      : { border: `1px solid ${C.black}`, color: C.black, ...body }
                  }
                >
                  {a.cta}
                </button>
              </div>
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
          <Overline>Het grootboek</Overline>
          <h1
            className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.01em]"
            style={head}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.black, color: C.ivory, ...body }}
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
          <Panel key={s.l} className="p-5">
            <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[30px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.red : C.black, ...head }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.black }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#e9e1cf] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="order-1 text-[12px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip alarm={acc}>{f.status}</Chip>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.red : C.black }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
            Totaal betaald
          </span>
          <span className="text-[26px] font-semibold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
