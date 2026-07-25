"use client";

// Concept 469 — "Vensterluik" · Tactiel louvre-bento (tactile maximalism 2026). Warm-neutraal
// zand/klei-palet met één diep terracotta-accent. Panelen dragen fijne louvre/jaloezie-lijnen als
// textuur plus een subtiele film-grain-overlay (puur via herhaalde CSS-gradients, geen externe
// assets). Zachte inset-schaduwen laten de luiken "openklappen" op hover. Mat en getextureerd —
// nadrukkelijk géén glans. Bento-raster van tactiele panelen, geordend en leesbaar.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  LayoutGrid,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: warm zand/klei, matte film-grain, één diep terracotta-accent —
const C = {
  sand: "#e7ddc9", // warme zandachtergrond
  sandDeep: "#ddd0b6", // diepere zandschaduw
  panel: "#f2ebda", // paneel-vlak (matte klei)
  panelAlt: "#ece2cd", // wisselvlak
  ink: "#2c2418", // diep sepia-inkt
  inkSoft: "#4a3f2d",
  inkMute: "#7a6b52",
  inkFaint: "#9c8c6f",
  line: "#cdbf9f", // hairline
  lineSoft: "#d8cbac",
  clay: "#a2472a", // diep terracotta-accent
  claySoft: "#ecd7cb",
  moss: "#4d6b3c", // geverifieerd-groen
  mossSoft: "#dbe4cf",
  amber: "#9a6a12", // let-op
  amberSoft: "#efe1c2",
  slate: "#3f5566", // neutrale info
  slateSoft: "#d5dee2",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

// Film-grain + zand-textuur voor de hele achtergrond: gelaagde, zeer subtiele diagonale ruis.
function grainBg(base: string): React.CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage: [
      "radial-gradient(rgba(44,36,24,0.05) 0.6px, transparent 0.6px)",
      "radial-gradient(rgba(44,36,24,0.035) 0.6px, transparent 0.6px)",
    ].join(","),
    backgroundSize: "3px 3px, 5px 5px",
    backgroundPosition: "0 0, 1px 2px",
  };
}

// Louvre/jaloezie: fijne horizontale lamellen als paneel-textuur.
function louvre(strength = 1): React.CSSProperties {
  const a = 0.05 * strength;
  return {
    backgroundImage: `repeating-linear-gradient(180deg, rgba(44,36,24,${a}) 0px, rgba(44,36,24,${a}) 1px, transparent 1px, transparent 6px)`,
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.moss,
        wash: C.mossSoft,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        ink: C.slate,
        wash: C.slateSoft,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.clay,
        wash: C.claySoft,
      };
  }
}

// — Louvre-paneel: matte klei-kaart met lamellen-textuur en zachte inset-diepte die op hover
//   "openklapt" (schaduw ademt, paneel licht op). Tactiel, geen glans. —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  louvred = true,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  interactive?: boolean;
  louvred?: boolean;
}) {
  return (
    <Tag
      className={`vl-panel relative overflow-hidden rounded-[14px] ${interactive ? "vl-panel--int" : ""} ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow:
          "inset 0 1px 0 rgba(255,251,240,0.7), inset 0 -2px 6px rgba(44,36,24,0.07), 0 1px 2px rgba(44,36,24,0.08)",
        color: C.ink,
      }}
    >
      {louvred && (
        <span
          className="pointer-events-none absolute inset-0"
          style={louvre(1)}
          aria-hidden="true"
        />
      )}
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.clay }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyFont }}
    >
      <span
        className="inline-block h-3 w-1 rounded-full"
        style={{ background: tone }}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

function SolidButton({
  children,
  onClick,
  tone = C.clay,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[12.5px] font-bold transition-all duration-150 hover:brightness-[1.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c2418] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7ddc9] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#f7efdd",
        background: tone,
        border: `1px solid rgba(44,36,24,0.25)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(44,36,24,0.18)",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[12px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a2472a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7ddc9] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#f7efdd" : C.inkSoft,
        background: active ? C.ink : C.panel,
        border: `1px solid ${active ? C.ink : C.line}`,
        boxShadow: active
          ? "inset 0 1px 0 rgba(255,255,255,0.12)"
          : "inset 0 1px 0 rgba(255,251,240,0.6)",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline als tactiele lamellen-balkjes —
function SparkBars({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const bw = w / data.length;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const bh = 4 + ((d - min) / span) * (h - 7);
        const x = i * bw + bw * 0.24;
        return (
          <rect
            key={`${id}-${i}`}
            x={x}
            y={h - bh}
            width={bw * 0.52}
            height={bh}
            rx={1.5}
            fill={tone}
            opacity={i === data.length - 1 ? 1 : 0.4}
          />
        );
      })}
    </svg>
  );
}

function Meter({ value, tone = C.moss }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="relative h-2.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.sandDeep, border: `1px solid ${C.line}`, ...louvre(0.6) }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept469() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...grainBg(C.sand) }}
    >
      <style>{`
        @keyframes vlRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .vl-rise { animation: vlRise 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .vl-panel--int { transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s cubic-bezier(0.22,1,0.36,1); }
        .vl-panel--int:hover { transform: translateY(-2px); box-shadow: inset 0 1px 0 rgba(255,251,240,0.85), inset 0 -3px 10px rgba(44,36,24,0.05), 0 8px 20px rgba(44,36,24,0.14); }
        @media (prefers-reduced-motion: reduce) { .vl-rise { animation: none !important; } .vl-panel--int { transition: none !important; } .vl-panel--int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="vl-rise pt-6">
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
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-[12px]"
          style={{
            background: C.clay,
            color: "#f7efdd",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 6px rgba(44,36,24,0.2)",
          }}
          aria-hidden="true"
        >
          <span className="absolute inset-0" style={louvre(2)} />
          <LayoutGrid size={20} strokeWidth={2} className="relative" />
        </span>
        <div>
          <p
            className="text-[19px] font-bold leading-none tracking-tight"
            style={{ color: C.ink, ...serif }}
          >
            Vensterluik
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · werkoverzicht
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.moss,
            background: C.mossSoft,
            border: `1px solid ${C.moss}`,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.clay, color: "#f7efdd", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-[12.5px] font-bold"
          style={{ background: C.panelAlt, border: `1px solid ${C.line}`, color: C.ink, ...num }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div
        className="flex items-stretch gap-1.5 overflow-x-auto rounded-[12px] p-1.5"
        style={{ background: C.sandDeep, border: `1px solid ${C.line}`, ...louvre(0.7) }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[9px] px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a2472a] focus-visible:ring-offset-1 focus-visible:ring-offset-[#ddd0b6] motion-reduce:transition-none"
              style={{
                color: on ? "#f7efdd" : C.inkSoft,
                background: on ? C.ink : "transparent",
                boxShadow: on
                  ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 2px rgba(44,36,24,0.2)"
                  : "none",
                ...bodyFont,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-7 md:p-8" interactive>
          <Eyebrow>Werkoverzicht · vandaag</Eyebrow>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.ink, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Elk luik open: je certificaten staan in het register, je reacties lopen en je facturen
            zijn op orde. Loop rustig langs wat vandaag je aandacht vraagt.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <SolidButton onClick={onActies} tone={C.clay}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </SolidButton>
            <GhostButton onClick={onOpen}>Naar marktplaats</GhostButton>
          </div>
        </Panel>

        <Panel className="p-6" interactive>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2
            className="mt-3 text-[18px] font-bold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <SolidButton onClick={onActies} tone={C.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </SolidButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.line }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.moss }} />
            {verified}/{CREDENTIALS.length} certificaten op orde · 7 open reacties
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.moss}>Kerncijfers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.moss : C.clay;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Panel key={k.label} className="p-5" interactive>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <SparkBars data={k.spark} tone={tone} id={`k469-${i}`} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Beste matches voor jou</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a2472a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7ddc9]"
              style={{ color: C.clay, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const strong = o.match >= 90;
              const tone = strong ? C.moss : C.slate;
              return (
                <li key={o.id}>
                  <Panel className="p-4" interactive as="article">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group flex w-full items-center gap-4 text-left focus-visible:outline-none"
                    >
                      <span
                        className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[11px]"
                        style={{
                          background: strong ? C.mossSoft : C.slateSoft,
                          border: `1px solid ${tone}`,
                        }}
                        aria-hidden="true"
                      >
                        <span
                          className="text-[15px] font-bold leading-none"
                          style={{ color: tone, ...num }}
                        >
                          {o.match}
                        </span>
                        <span
                          className="text-[7.5px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: tone }}
                        >
                          match
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-bold"
                          style={{ color: C.ink }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11.5px]" style={{ color: C.inkMute }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </button>
                  </Panel>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.moss}>Certificaten-register</Eyebrow>
          </div>
          <Panel className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[9px]"
                      style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
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
    <div className="space-y-6 pt-6">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[11px] px-4 py-2.5"
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            boxShadow: "inset 0 1px 3px rgba(44,36,24,0.06)",
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9c8c6f]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded" style={{ background: C.panelAlt }} />
                  <div className="h-5 w-2/3 rounded" style={{ background: C.panelAlt }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: C.panelAlt }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-[13px]"
              style={{ background: C.panelAlt, border: `1px solid ${C.line}`, color: C.inkMute }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.ink, ...serif }}>
              Geen luik gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setQ("")} tone={C.clay}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.moss : C.slate;
  return (
    <Panel className="p-5" interactive as="article">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              Luik {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[18px] font-bold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.panelAlt,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-[10px] px-2.5 py-1.5"
            style={{ background: strong ? C.mossSoft : C.slateSoft, border: `1px solid ${tone}` }}
          >
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a2472a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2ebda]"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen} tone={C.ink}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={C.moss}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.clay}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-[11px] p-4"
      style={{
        background: C.panelAlt,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.moss : C.slate;
  return (
    <div className="space-y-5 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a2472a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7ddc9]"
        style={{ color: C.ink, border: `1px solid ${C.line}`, background: C.panel, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ color: "#f7efdd", background: tone, ...bodyFont }}
          >
            <Sparkles size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <SolidButton tone={C.clay}>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </SolidButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Waarom deze match</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — wat in je voordeel spreekt én waar de aandacht
          ligt, transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.moss, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.moss }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.clay, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Let op
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.clay }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-6">
      <Panel className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · register</Eyebrow>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...serif }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.moss }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.moss} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-[16px]"
            style={{ background: C.mossSoft, border: `1px solid ${C.moss}`, ...louvre(0.8) }}
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.moss, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.moss }}
            >
              % op orde
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#ece2cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a2472a] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[11px]"
                    style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.ink}`,
                        ...bodyFont,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.inkFaint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[76px]">
                      <div
                        className="rounded-[11px] p-4"
                        style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton tone={c.status === "EXPIRING" ? C.amber : C.ink}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.slate}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[10px]"
                  style={{
                    background: C.panelAlt,
                    border: `1px solid ${C.line}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.ink}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden aflopen — zo blijft je profiel op orde en je werk betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.slate;
          return (
            <li key={a.titel}>
              <Panel className="p-5" interactive>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] text-[14px] font-bold"
                    style={{
                      background: warn ? C.amberSoft : C.slateSoft,
                      border: `1px solid ${tone}`,
                      color: tone,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: warn ? C.amberSoft : C.slateSoft,
                        border: `1px solid ${tone}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sparkles size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink, ...serif }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <SolidButton tone={warn ? C.amber : C.ink}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </SolidButton>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.clay, wash: C.claySoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.moss, wash: C.mossSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.panelAlt, Icon: FileText };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");

  const rows = useMemo(() => {
    return [...FACTUREN].sort((a, b) =>
      sort === "bedrag"
        ? parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10)
        : 0,
    );
  }, [sort]);

  return (
    <div className="space-y-5 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · debiteuren</Eyebrow>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Facturenoverzicht
          </h1>
        </div>
        <SolidButton tone={C.clay}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Voldaan", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: C.moss },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.clay },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.inkMute },
        ].map((s) => (
          <Panel key={s.l} className="p-5" interactive>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.clay }} />}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <GhostButton
            key={s}
            onClick={() => setSort(s)}
            active={sort === s}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </GhostButton>
        ))}
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#ece2cd]"
                    style={{
                      background: i % 2 === 1 ? C.panelAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: ft.wash,
                          border: `1px solid ${ft.ink}`,
                          ...bodyFont,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
