"use client";

// Concept 502 — "Gietijzer" · Tactiele brutalism. Industrieel monochroom op beton-wit met één
// signaalkleur (gietijzer-oranje). Scherpe geometrie, geen ronde hoeken, 1px hairline-borders
// overal, en een subtiele mathematisch-gegenereerde grain/noise-textuur (inline SVG feTurbulence)
// over het hele oppervlak. Harde contrasten, monospace-labels, tabellenschrift. Status altijd met
// label + icoon. Alle beweging respecteert prefers-reduced-motion.

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
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Square,
  X,
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

// — Palet: beton, gietijzer, één signaal-oranje —
const C = {
  ink: "#131311",
  ink2: "#39392f",
  mute: "#6b6b5f",
  faint: "#9a9a8c",
  line: "#1a1a17",
  hair: "#c9c7bc",
  concrete: "#e9e7dd",
  concrete2: "#e0ded2",
  panel: "#f2f0e8",
  signal: "#ff4d17",
  signalDeep: "#d63c0d",
};

const mono = {
  fontFamily:
    "'IBM Plex Mono', ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, Consolas, monospace",
};
const sans = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const numMono = { ...mono, fontVariantNumeric: "tabular-nums" as const };

// Mathematische film-grain als data-URI (feTurbulence) — geen extern bestand.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Tone = {
  fill: string;
  text: string;
  border: string;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        fill: C.ink,
        text: "#f2f0e8",
        border: C.ink,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        fill: "transparent",
        text: C.ink,
        border: C.ink,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        fill: C.signal,
        text: "#131311",
        border: C.ink,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        fill: C.ink,
        text: C.signal,
        border: C.ink,
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
}

function Grain({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: GRAIN,
        backgroundSize: "180px 180px",
        opacity,
        mixBlendMode: "multiply",
      }}
    />
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "signal" | "line" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[11px]" : "px-5 py-2.5 text-[12px]";
  const base =
    "gi-btn inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.08em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff4d17] focus-visible:ring-offset-[#e9e7dd]";
  const styles: Record<string, React.CSSProperties> = {
    solid: { background: C.ink, color: "#f2f0e8", border: `1px solid ${C.ink}` },
    signal: { background: C.signal, color: "#131311", border: `1px solid ${C.ink}` },
    line: { background: "transparent", color: C.ink, border: `1px solid ${C.ink}` },
    ghost: { background: "transparent", color: C.ink2, border: "1px solid transparent" },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${className}`}
      style={{ ...styles[variant], ...mono }}
    >
      {children}
    </button>
  );
}

function StatusPill({ fill, text, border, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.09em]"
      style={{ background: fill, color: text, border: `1px solid ${border}`, ...mono }}
    >
      <Icon size={11} aria-hidden="true" strokeWidth={2.5} />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Match als segmentbalk: 10 blokken, hard afgetekend —
function MatchBar({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  const strong = value >= 90;
  const blocks = 10;
  const filled = Math.round((value / 100) * blocks);
  const bw = size === "lg" ? 10 : 7;
  const bh = size === "lg" ? 26 : 20;
  return (
    <span className="inline-flex flex-col gap-1.5" aria-label={`Match ${value} procent`}>
      <span className="flex items-baseline gap-1.5">
        <span
          className="font-bold leading-none"
          style={{
            fontSize: size === "lg" ? 30 : 22,
            color: strong ? C.signalDeep : C.ink,
            ...numMono,
          }}
        >
          {value}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.mute, ...mono }}
        >
          % match
        </span>
      </span>
      <span className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: blocks }).map((_, i) => (
          <span
            key={i}
            style={{
              width: bw,
              height: bh,
              background: i < filled ? (strong ? C.signal : C.ink) : "transparent",
              border: `1px solid ${C.ink}`,
            }}
          />
        ))}
      </span>
    </span>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 84;
  const h = 24;
  const bw = w / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {data.map((d, i) => {
        const bh = 3 + ((d - min) / span) * (h - 4);
        const last = i === data.length - 1;
        return (
          <rect
            key={i}
            x={i * bw + 1}
            y={h - bh}
            width={bw - 2}
            height={bh}
            fill={last ? C.signal : C.ink}
            stroke={C.ink}
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}

// — Sectiekop: streepcode-label —
function Head({ index, label, sub }: { index: string; label: string; sub?: string }) {
  return (
    <div
      className="mb-5 flex items-end justify-between gap-4"
      style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 10 }}
    >
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] font-bold" style={{ color: C.signalDeep, ...mono }}>
          {index}
        </span>
        <h2
          className="text-[15px] font-bold uppercase tracking-[0.06em]"
          style={{ color: C.ink, ...sans }}
        >
          {label}
        </h2>
      </div>
      {sub && (
        <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.mute, ...mono }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// — Paneel met hairline-rand + grain —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  bg = C.panel,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "aside";
  bg?: string;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{ border: `1px solid ${C.ink}`, background: bg }}
    >
      <Grain opacity={0.35} />
      <span className="relative block">{children}</span>
    </Tag>
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept502() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.ink, background: C.concrete }}
    >
      <Grain opacity={0.6} />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-10">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="gi-fade pt-8">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      <style>{`
        .gi-btn { position: relative; }
        .gi-btn:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 0 ${C.ink}; }
        .gi-btn:active { transform: translate(0,0); box-shadow: none; }
        .gi-hoverline { transition: background .12s linear; }
        .gi-hoverline:hover { background: ${C.concrete2}; }
        .gi-arrow { transition: transform .18s linear; }
        .gi-btn:hover .gi-arrow { transform: translateX(3px); }
        @keyframes giFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .gi-fade { animation: giFade .3s steps(6,end) both; }
        @media (prefers-reduced-motion: reduce) {
          .gi-btn, .gi-hoverline, .gi-arrow, .gi-fade { transition: none !important; animation: none !important; }
          .gi-btn:hover { transform: none; box-shadow: 3px 3px 0 0 ${C.ink}; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="flex flex-wrap items-center gap-4 pt-8"
      style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 16 }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center"
          style={{ background: C.ink, color: C.signal, border: `1px solid ${C.ink}` }}
          aria-hidden="true"
        >
          <Square size={16} strokeWidth={3} />
        </span>
        <div>
          <p
            className="text-[15px] font-bold uppercase leading-none tracking-[0.06em]"
            style={{ color: C.ink }}
          >
            Gietijzer
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.mute, ...mono }}
          >
            {PROFIEL.naam} — {PROFIEL.rol}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: "#131311", background: C.signal, border: `1px solid ${C.ink}`, ...mono }}
        >
          <ShieldCheck size={12} aria-hidden="true" strokeWidth={2.5} /> {PROFIEL.trust}
        </span>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#e0ded2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d17]"
          style={{ border: `1px solid ${C.ink}`, color: C.ink }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold"
              style={{ background: C.signal, color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
            >
              {ongelezen}
            </span>
          )}
        </button>
        <span
          className="flex h-9 w-9 items-center justify-center text-[11px] font-bold"
          style={{ background: C.ink, color: "#f2f0e8", ...mono }}
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
    <nav
      aria-label="Hoofdnavigatie"
      className="mt-5 flex flex-wrap"
      style={{ border: `1px solid ${C.ink}` }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff4d17]"
            style={{
              color: on ? "#f2f0e8" : C.ink,
              background: on ? C.ink : "transparent",
              borderLeft: i === 0 ? "none" : `1px solid ${C.ink}`,
              ...mono,
            }}
          >
            {on && (
              <span className="mr-1.5" style={{ color: C.signal }}>
                ▍
              </span>
            )}
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const voornaam = PROFIEL.naam.split(" ")[0];

  return (
    <div className="space-y-10">
      <section
        className="grid grid-cols-1 gap-0 lg:grid-cols-[1.6fr_1fr]"
        style={{ border: `1px solid ${C.ink}` }}
      >
        <div className="relative p-7" style={{ borderBottom: `1px solid ${C.ink}` }}>
          <Grain opacity={0.3} />
          <div className="relative">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.signalDeep, ...mono }}
            >
              [ 00 ] Overzicht — {PROFIEL.plaats}
            </span>
            <h1
              className="mt-3 text-[34px] font-bold uppercase leading-[0.95] tracking-[-0.01em] md:text-[46px]"
              style={{ color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed" style={{ color: C.ink2 }}>
              Register geverifieerd en op orde. Verse opdrachten sluiten aan op je profiel; één
              document vraagt binnenkort om aandacht.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Btn variant="signal" onClick={onActies}>
                Volgende actie <ArrowRight size={13} aria-hidden="true" className="gi-arrow" />
              </Btn>
              <Btn variant="line" onClick={onMarkt}>
                Naar marktplaats
              </Btn>
            </div>
          </div>
        </div>
        <div
          className="relative flex flex-col justify-center p-7"
          style={{ background: C.ink, color: "#f2f0e8" }}
        >
          <Grain opacity={0.25} />
          <div className="relative">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.signal, ...mono }}
            >
              Dossier op orde
            </span>
            <p
              className="mt-2 text-[64px] font-bold leading-none"
              style={{ letterSpacing: "-0.03em", ...numMono }}
            >
              {ratio}%
            </p>
            <div className="mt-5 flex gap-1" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="h-4 flex-1"
                  style={{
                    background: c.status === "VERIFIED" ? C.signal : "#2f2f28",
                    border: "1px solid #2f2f28",
                  }}
                />
              ))}
            </div>
            <p
              className="mt-3 text-[11px] uppercase tracking-[0.08em]"
              style={{ color: "#b6b6a6", ...mono }}
            >
              {verified} / {CREDENTIALS.length} certificaten geverifieerd
            </p>
          </div>
        </div>
      </section>

      <section>
        <Head index="[ 01 ]" label="Kerncijfers" sub="Deze maand" />
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ border: `1px solid ${C.ink}` }}
        >
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="gi-hoverline relative p-5"
              style={{ borderRight: i < 3 ? `1px solid ${C.ink}` : "none", background: C.panel }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.mute, ...mono }}
              >
                {k.label}
              </p>
              <p
                className="mt-3 text-[28px] font-bold leading-none"
                style={{ color: C.ink, letterSpacing: "-0.02em", ...numMono }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className="text-[11px] font-bold"
                  style={{ color: k.up ? C.signalDeep : C.ink2, ...numMono }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
                <Spark data={k.spark} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Head index="[ 02 ]" label="Aanbevolen opdrachten" />
          <div style={{ border: `1px solid ${C.ink}` }}>
            {OPDRACHTEN.map((o, i) => (
              <div
                key={o.id}
                style={{ borderBottom: i < OPDRACHTEN.length - 1 ? `1px solid ${C.ink}` : "none" }}
              >
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onMarkt}
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d17]"
            style={{ color: C.ink, ...mono }}
          >
            Volledige lijst <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>

        <aside>
          <Head index="[ 03 ]" label="Termijn" />
          <Panel className="p-6" bg={C.signal}>
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.ink, ...mono }}
            >
              <AlertTriangle size={12} aria-hidden="true" strokeWidth={2.5} /> Termijn nadert
            </span>
            <h3
              className="mt-2.5 text-[18px] font-bold uppercase leading-tight"
              style={{ color: C.ink }}
            >
              {primair.titel}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "#2a1a10" }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={12} aria-hidden="true" className="gi-arrow" />
            </Btn>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="gi-hoverline flex w-full items-center gap-5 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff4d17]"
      style={{ background: C.panel }}
    >
      <MatchBar value={opdracht.match} />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[15px] font-bold uppercase leading-snug"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </span>
        <span
          className="mt-1 flex items-center gap-1.5 truncate text-[11px] uppercase tracking-[0.06em]"
          style={{ color: C.mute, ...mono }}
        >
          <MapPin size={11} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[15px] font-bold" style={{ color: C.ink, ...numMono }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.faint, ...mono }}
        >
          / uur
        </span>
      </span>
      <ChevronRight
        size={18}
        aria-hidden="true"
        className="gi-arrow shrink-0"
        style={{ color: C.ink }}
      />
    </button>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-7">
      <div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: C.signalDeep, ...mono }}
        >
          [ Marktplaats ]
        </span>
        <h1
          className="mt-2 text-[30px] font-bold uppercase leading-none tracking-[-0.01em] md:text-[40px]"
          style={{ color: C.ink }}
        >
          Opdrachten
        </h1>
        <p
          className="mt-2 text-[11px] uppercase tracking-[0.08em]"
          style={{ color: C.mute, ...mono }}
        >
          {filtered.length} / {OPDRACHTEN.length} sluiten aan op je profiel
        </p>
      </div>

      <div className="flex flex-col gap-0 sm:flex-row" style={{ border: `1px solid ${C.ink}` }}>
        <div className="flex flex-1 items-center gap-2.5 px-4 py-3" style={{ background: C.panel }}>
          <Search size={16} aria-hidden="true" style={{ color: C.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK OP TITEL, PLAATS OF OPDRACHTGEVER…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[12px] uppercase tracking-[0.04em] outline-none placeholder:text-[#9a9a8c]"
            style={{ color: C.ink, ...mono }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#e0ded2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d17]"
              style={{ color: C.ink }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div
          className="flex items-stretch"
          role="group"
          aria-label="Sorteren"
          style={{ borderTop: `1px solid ${C.ink}` }}
        >
          {(["match", "tarief"] as const).map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className="flex items-center gap-1.5 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff4d17]"
              style={{
                background: sort === s ? C.ink : "transparent",
                color: sort === s ? "#f2f0e8" : C.ink,
                borderLeft: i === 0 ? "none" : `1px solid ${C.ink}`,
                ...mono,
              }}
            >
              <ArrowUpDown size={11} aria-hidden="true" />
              {s === "match" ? "Match" : "Tarief"}
            </button>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <div aria-hidden="true" style={{ border: `1px solid ${C.ink}` }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-6"
              style={{ borderBottom: i < 2 ? `1px solid ${C.ink}` : "none", background: C.panel }}
            >
              <div className="space-y-3">
                <div
                  className="h-5 w-2/3 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.concrete2 }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.concrete2 }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="Lijst niet geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <div style={{ border: `1px solid ${C.ink}` }}>
          {filtered.map((o, i) => (
            <div
              key={o.id}
              style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.ink}` : "none" }}
            >
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-6 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="text-[10px] uppercase tracking-[0.12em] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d17]"
            style={{ color: C.faint, ...mono }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Panel className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center"
        style={{ border: `1px solid ${C.ink}`, color: C.ink }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[20px] font-bold uppercase" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.ink2 }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-5" onClick={onCta}>
        <RotateCcw size={12} aria-hidden="true" /> {cta}
      </Btn>
    </Panel>
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
  return (
    <article className="relative" style={{ background: C.panel }}>
      <Grain opacity={0.28} />
      <div className="relative">
        <div className="flex items-start gap-5 p-6">
          <span
            className="hidden shrink-0 pt-1 text-[12px] font-bold sm:block"
            style={{ color: C.faint, ...numMono }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <MatchBar value={opdracht.match} size="lg" />
          <div className="min-w-0 flex-1">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: strong ? C.signalDeep : C.mute, ...mono }}
            >
              {strong ? "Sterke match" : "Goede match"} · {opdracht.id}
            </span>
            <h3
              className="mt-1.5 text-[20px] font-bold uppercase leading-tight"
              style={{ color: C.ink }}
            >
              {opdracht.titel}
            </h3>
            <p
              className="mt-1 text-[11px] uppercase tracking-[0.05em]"
              style={{ color: C.mute, ...mono }}
            >
              {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em]"
                  style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span className="hidden shrink-0 text-right md:block">
            <span className="block text-[19px] font-bold" style={{ color: C.ink, ...numMono }}>
              {opdracht.tarief.replace(" / uur", "")}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              / uur
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-[#d63c0d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d17]"
            style={{ color: C.ink, ...mono }}
          >
            {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
            Waarom deze match
          </button>
          <div className="ml-auto">
            <Btn variant="solid" size="sm" onClick={onOpen}>
              Reageren <ArrowRight size={12} aria-hidden="true" className="gi-arrow" />
            </Btn>
          </div>
        </div>

        <div
          className="grid transition-all duration-200 motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div
              className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
              style={{ borderTop: `1px solid ${C.ink}` }}
            >
              <RedenKolom
                titel="In je voordeel"
                Icon={Check}
                items={opdracht.redenen.plus}
                tone={C.ink}
              />
              <RedenKolom
                titel="Goed om te weten"
                Icon={AlertTriangle}
                items={opdracht.redenen.min}
                tone={C.signalDeep}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function RedenKolom({
  titel,
  Icon,
  items,
  tone,
}: {
  titel: string;
  Icon: LucideIcon;
  items: string[];
  tone: string;
}) {
  return (
    <div>
      <p
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone, ...mono }}
      >
        <Icon size={12} aria-hidden="true" strokeWidth={2.5} /> {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13px] leading-snug"
            style={{ color: C.ink2 }}
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors hover:text-[#d63c0d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d17]"
        style={{ color: C.mute, ...mono }}
      >
        <ArrowRight size={12} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="p-7">
        <div className="flex flex-wrap items-start gap-6">
          <MatchBar value={opdracht.match} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.mute, ...mono }}
              >
                {opdracht.id}
              </span>
              <span className="h-3 w-px" style={{ background: C.ink }} aria-hidden="true" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: strong ? C.signalDeep : C.ink, ...mono }}
              >
                {strong ? "Sterke match" : "Goede match"}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-bold uppercase leading-[1.02] tracking-[-0.01em] md:text-[36px]"
              style={{ color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p
              className="mt-2 flex items-center gap-1.5 text-[12px] uppercase tracking-[0.05em]"
              style={{ color: C.mute, ...mono }}
            >
              <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Btn variant="signal">
            Reageren op opdracht <ArrowRight size={13} aria-hidden="true" className="gi-arrow" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </Panel>

      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ border: `1px solid ${C.ink}` }}>
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="relative p-5"
            style={{ borderRight: i < 3 ? `1px solid ${C.ink}` : "none", background: C.panel }}
          >
            <Grain opacity={0.25} />
            <div className="relative">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.mute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-2 text-[19px] font-bold leading-none"
                style={{ color: C.ink, ...numMono }}
              >
                {m.v}
              </p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <Head index="[ >> ]" label="Waarom deze match bij je past" />
        <p className="mb-6 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score.
        </p>
        <div
          className="grid grid-cols-1 gap-0 md:grid-cols-2"
          style={{ border: `1px solid ${C.ink}` }}
        >
          <div
            className="relative p-6"
            style={{ background: C.panel, borderRight: `1px solid ${C.ink}` }}
          >
            <Grain opacity={0.25} />
            <div className="relative">
              <p
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.ink, ...mono }}
              >
                <Check size={13} aria-hidden="true" strokeWidth={2.5} /> In je voordeel
              </p>
              <ul className="mt-4 space-y-3">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 text-[13.5px] leading-snug"
                    style={{ color: C.ink }}
                  >
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      strokeWidth={2.5}
                      style={{ color: C.ink }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative p-6" style={{ background: C.panel }}>
            <Grain opacity={0.25} />
            <div className="relative">
              <p
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.signalDeep, ...mono }}
              >
                <AlertTriangle size={13} aria-hidden="true" strokeWidth={2.5} /> Goed om te weten
              </p>
              <ul className="mt-4 space-y-3">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-3 text-[13.5px] leading-snug"
                    style={{ color: C.ink }}
                  >
                    <AlertTriangle
                      size={15}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      strokeWidth={2.5}
                      style={{ color: C.signalDeep }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-8">
      <section
        className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]"
        style={{ border: `1px solid ${C.ink}` }}
      >
        <div
          className="relative p-7"
          style={{ background: C.panel, borderBottom: `1px solid ${C.ink}` }}
        >
          <Grain opacity={0.3} />
          <div className="relative">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.signalDeep, ...mono }}
            >
              [ Vertrouwensregister ]
            </span>
            <h1
              className="mt-2 text-[30px] font-bold uppercase leading-none md:text-[38px]"
              style={{ color: C.ink }}
            >
              {PROFIEL.trust}
            </h1>
            <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              bijna — tijdig vernieuwen houdt je dossier compleet. Documenten worden versleuteld
              bewaard en uitsluitend met jouw toestemming gedeeld.
            </p>
          </div>
        </div>
        <div
          className="relative flex flex-col justify-center p-7"
          style={{ background: C.ink, color: "#f2f0e8" }}
        >
          <Grain opacity={0.25} />
          <div className="relative">
            <p
              className="text-[64px] font-bold leading-none"
              style={{ letterSpacing: "-0.03em", ...numMono }}
            >
              {ratio}%
            </p>
            <p
              className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.signal, ...mono }}
            >
              dossier op orde
            </p>
            <div className="mt-4 flex gap-1" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="h-4 flex-1"
                  style={{
                    background: c.status === "VERIFIED" ? C.signal : "#2f2f28",
                    border: "1px solid #2f2f28",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <Head index="[ 01 ]" label="Certificaten" />
        <div style={{ border: `1px solid ${C.ink}` }}>
          {CREDENTIALS.map((c, idx) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <div
                key={c.naam}
                style={{
                  borderBottom: idx < CREDENTIALS.length - 1 ? `1px solid ${C.ink}` : "none",
                  background: C.panel,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="gi-hoverline flex w-full items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff4d17]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center"
                    style={{ background: t.fill, color: t.text, border: `1px solid ${t.border}` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[15px] font-bold uppercase"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.05em]"
                      style={{ color: C.mute, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusPill {...t} />
                  </span>
                  <span
                    className="text-[16px] font-bold transition-transform motion-reduce:transition-none"
                    style={{ color: C.ink, transform: isOpen ? "rotate(45deg)" : "none" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  className="grid transition-all duration-200 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 pb-5 sm:pl-[64px]"
                      style={{ borderTop: `1px solid ${C.ink}`, paddingTop: 16 }}
                    >
                      <span className="mb-3 inline-flex sm:hidden">
                        <StatusPill {...t} />
                      </span>
                      <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: C.ink2 }}>
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <Btn size="sm" variant="solid">
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="line">
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <Head index="[ 02 ]" label="Documentenkast" />
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ border: `1px solid ${C.ink}` }}>
          {DOCUMENTEN.map((d, i) => {
            const t = credTone(d.status);
            return (
              <div
                key={d.naam}
                className="gi-hoverline relative flex items-center gap-3 p-4"
                style={{
                  background: C.panel,
                  borderRight: i % 2 === 0 ? `1px solid ${C.ink}` : "none",
                  borderBottom: i < DOCUMENTEN.length - 2 ? `1px solid ${C.ink}` : "none",
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ border: `1px solid ${C.ink}`, color: C.ink }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-bold uppercase"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span
                    className="block text-[10px] uppercase tracking-[0.05em]"
                    style={{ color: C.mute, ...numMono }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusPill {...t} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-7">
      <div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: C.signalDeep, ...mono }}
        >
          [ Agenda ]
        </span>
        <h1
          className="mt-2 text-[30px] font-bold uppercase leading-none md:text-[40px]"
          style={{ color: C.ink }}
        >
          Aandacht vereist
        </h1>
        <p
          className="mt-2 text-[11px] uppercase tracking-[0.08em]"
          style={{ color: C.mute, ...mono }}
        >
          Op volgorde van urgentie — werk van boven naar beneden
        </p>
      </div>

      <ol style={{ border: `1px solid ${C.ink}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li
              key={a.titel}
              className="relative"
              style={{
                borderBottom: i < ACTIES.length - 1 ? `1px solid ${C.ink}` : "none",
                background: warn ? C.signal : C.panel,
              }}
            >
              <Grain opacity={warn ? 0.2 : 0.28} />
              <div className="relative flex items-start gap-5 p-6">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center text-[16px] font-bold"
                  style={{
                    background: warn ? C.ink : "transparent",
                    color: warn ? C.signal : C.ink,
                    border: `1px solid ${C.ink}`,
                    ...numMono,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: warn ? C.ink : C.mute, ...mono }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" strokeWidth={2.5} />
                    ) : (
                      <Clock size={12} aria-hidden="true" strokeWidth={2.5} />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[18px] font-bold uppercase leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: warn ? "#2a1a10" : C.ink2 }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant={warn ? "solid" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={12} aria-hidden="true" className="gi-arrow" />
                    </Btn>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { fill: string; text: string; border: string } {
  if (status === "Betaald") return { fill: C.ink, text: "#f2f0e8", border: C.ink };
  if (status === "Openstaand") return { fill: C.signal, text: C.ink, border: C.ink };
  if (status === "Concept") return { fill: "transparent", text: C.ink, border: C.ink };
  return { fill: C.ink, text: C.signal, border: C.ink };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.signalDeep, ...mono }}
          >
            [ Grootboek ]
          </span>
          <h1
            className="mt-2 text-[30px] font-bold uppercase leading-none md:text-[40px]"
            style={{ color: C.ink }}
          >
            Facturen
          </h1>
        </div>
        <Btn variant="signal">
          <Plus size={13} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ border: `1px solid ${C.ink}` }}>
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", signal: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", signal: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", signal: false },
        ].map((s, i) => (
          <div
            key={s.l}
            className="relative p-5"
            style={{
              borderRight: i < 2 ? `1px solid ${C.ink}` : "none",
              background: s.signal ? C.signal : C.panel,
            }}
          >
            <Grain opacity={0.22} />
            <div className="relative">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: s.signal ? C.ink : C.mute, ...mono }}
              >
                {s.l}
              </p>
              <p
                className="mt-2 text-[24px] font-bold leading-none"
                style={{ color: C.ink, letterSpacing: "-0.02em", ...numMono }}
              >
                {s.v}
              </p>
              <p
                className="mt-1.5 text-[11px]"
                style={{ color: s.signal ? "#2a1a10" : C.mute, ...mono }}
              >
                {s.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex items-stretch"
        role="group"
        aria-label="Facturen sorteren"
        style={{ border: `1px solid ${C.ink}`, width: "fit-content" }}
      >
        {(["datum", "bedrag"] as const).map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            aria-pressed={sort === s}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff4d17]"
            style={{
              background: sort === s ? C.ink : "transparent",
              color: sort === s ? "#f2f0e8" : C.ink,
              borderLeft: i === 0 ? "none" : `1px solid ${C.ink}`,
              ...mono,
            }}
          >
            <ArrowUpDown size={11} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto" style={{ border: `1px solid ${C.ink}` }}>
        <table className="w-full text-left" style={{ minWidth: 560 }}>
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ background: C.ink }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: "#f2f0e8", ...mono }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const t = factuurTone(f.status);
              return (
                <tr
                  key={f.nr}
                  className="gi-hoverline"
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${C.ink}`,
                    background: C.panel,
                  }}
                >
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: C.ink2, ...numMono }}>
                    {f.nr}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[13px] font-bold uppercase"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: C.mute, ...numMono }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[13px] font-bold"
                    style={{ color: C.ink, ...numMono }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{
                        background: t.fill,
                        color: t.text,
                        border: `1px solid ${t.border}`,
                        ...mono,
                      }}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
