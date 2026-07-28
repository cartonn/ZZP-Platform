"use client";

// Concept 503 — "Ontwricht" · Deconstructed editorial grid. Bewust asymmetrische, gebroken
// kolommen met overlappende lagen en oversized display-serif die uit het raster breekt — maar
// functioneel leesbaar en navigeerbaar. Warm papier-crème, diepe inkt, één print-rood accent.
// Redactionele persoonlijkheid: kolomlijnen, indexnummers als achtergrondlaag, lichte rotaties.
// Status altijd met label + icoon. Alle beweging respecteert prefers-reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Asterisk,
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

// — Palet: warm papier, diepe inkt, één print-rood —
const C = {
  ink: "#1b1712",
  ink2: "#4a4238",
  mute: "#7c7466",
  faint: "#a89f8e",
  line: "#ded6c4",
  lineSoft: "#e9e2d3",
  paper: "#f5f0e4",
  paper2: "#efe8d8",
  red: "#cf2b1c",
  redDeep: "#a81f13",
  redSoft: "rgba(207,43,28,0.08)",
};

const serif = {
  fontFamily:
    "'Playfair Display', 'Freight Display', Georgia, 'Times New Roman', 'Iowan Old Style', serif",
};
const sans = {
  fontFamily:
    "'Inter', 'Neue Haas', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = { ...sans, fontVariantNumeric: "tabular-nums" as const };

type Tone = {
  base: string;
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
        base: C.ink,
        fill: C.ink,
        text: C.paper,
        border: C.ink,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.ink,
        fill: "transparent",
        text: C.ink,
        border: C.ink,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.red,
        fill: C.red,
        text: "#fff",
        border: C.red,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.red,
        fill: "transparent",
        text: C.red,
        border: C.red,
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
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
  variant?: "solid" | "red" | "line" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-4 py-2 text-[12px]" : "px-5 py-2.5 text-[13px]";
  const base =
    "on-btn group/btn inline-flex items-center justify-center gap-2 rounded-none font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#cf2b1c] focus-visible:ring-offset-[#f5f0e4]";
  const styles: Record<string, React.CSSProperties> = {
    solid: { background: C.ink, color: C.paper, border: `1px solid ${C.ink}` },
    red: { background: C.red, color: "#fff", border: `1px solid ${C.red}` },
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
      style={{ ...styles[variant], ...sans }}
    >
      {children}
    </button>
  );
}

function StatusPill({ fill, text, border, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: fill, color: text, border: `1px solid ${border}`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" strokeWidth={2.25} />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Kolom-label met redactionele kadratuur —
function Kicker({ children, tone = C.red }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...sans }}
    >
      <Asterisk size={13} aria-hidden="true" strokeWidth={2.5} />
      {children}
    </span>
  );
}

// — Match als redactioneel getal met onderstreping —
function MatchMark({ value, size = 40 }: { value: number; size?: number }) {
  const strong = value >= 90;
  return (
    <span
      className="inline-flex flex-col items-start leading-none"
      aria-label={`Match ${value} procent`}
    >
      <span className="flex items-baseline">
        <span
          className="font-bold"
          style={{
            fontSize: size,
            color: strong ? C.red : C.ink,
            letterSpacing: "-0.03em",
            ...serif,
          }}
        >
          {value}
        </span>
        <span
          className="ml-0.5 text-[0.5em] font-bold"
          style={{ fontSize: size, color: C.faint, ...serif }}
        >
          %
        </span>
      </span>
      <span
        className="mt-1 h-[3px] w-full"
        style={{ background: strong ? C.red : C.ink }}
        aria-hidden="true"
      />
      <span
        className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: C.mute, ...sans }}
      >
        match
      </span>
    </span>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 26;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={C.ink}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={C.red} />
    </svg>
  );
}

// — Grote decoratieve index-cijfer als achtergrondlaag (overlappende laag) —
function GhostNumber({ n, className = "" }: { n: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute select-none font-bold leading-none ${className}`}
      style={{ color: "transparent", WebkitTextStroke: `1px ${C.line}`, ...serif }}
    >
      {n}
    </span>
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept503() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.ink, background: C.paper }}
    >
      {/* Redactionele kolomlijnen op de achtergrond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mx-auto hidden max-w-6xl md:block"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent calc(16.666% - 1px), ${C.lineSoft} calc(16.666% - 1px), ${C.lineSoft} 16.666%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-10">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="on-fade pt-8">
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
        .on-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .on-btn:active { transform: translateY(0); }
        .on-arrow { transition: transform .25s cubic-bezier(.22,1,.36,1); }
        .group\\/btn:hover .on-arrow { transform: translateX(3px); }
        .on-row { transition: background .2s ease, transform .25s cubic-bezier(.22,1,.36,1); }
        .on-row:hover { background: ${C.paper2}; }
        .on-tilt { transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .on-tilt:hover { transform: rotate(-0.6deg); }
        @keyframes onFade { from { opacity: 0; transform: translateY(12px) rotate(-0.3deg); } to { opacity: 1; transform: translateY(0) rotate(0); } }
        .on-fade { animation: onFade .5s cubic-bezier(.22,1,.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .on-btn, .on-arrow, .on-row, .on-tilt, .on-fade { transition: none !important; animation: none !important; transform: none !important; }
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
      style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 14 }}
    >
      <div className="flex items-baseline gap-3">
        <span
          className="text-[26px] font-bold leading-none"
          style={{ color: C.ink, letterSpacing: "-0.02em", ...serif }}
        >
          Ontwricht
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.red }}
        >
          Editie 503
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
          style={{ color: C.paper, background: C.ink }}
        >
          <ShieldCheck size={13} aria-hidden="true" strokeWidth={2.25} /> {PROFIEL.trust}
        </span>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center transition-colors hover:bg-[#efe8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf2b1c]"
          style={{ border: `1px solid ${C.ink}`, color: C.ink }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ background: C.red }}
            >
              {ongelezen}
            </span>
          )}
        </button>
        <span
          className="flex h-9 w-9 items-center justify-center text-[12px] font-bold"
          style={{ background: C.ink, color: C.paper, ...serif }}
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
      className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1"
      style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 10 }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="group/nav relative shrink-0 py-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf2b1c]"
            style={{ color: on ? C.ink : C.mute }}
          >
            <span
              className="mr-1.5 text-[10px] font-bold"
              style={{ color: on ? C.red : C.faint, ...num }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            <span
              className="absolute -bottom-[11px] left-0 h-[3px] transition-all duration-300 motion-reduce:transition-none"
              style={{ width: on ? "100%" : "0%", background: C.red }}
              aria-hidden="true"
            />
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
    <div className="space-y-14">
      {/* Gebroken hero: oversized serif breekt uit het raster, KPI-kolom overlapt */}
      <section className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div className="relative">
          <Kicker>Overzicht — {PROFIEL.plaats}</Kicker>
          <h1
            className="relative mt-4 font-bold"
            style={{
              color: C.ink,
              fontSize: "clamp(2.8rem, 9vw, 6.4rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.035em",
              ...serif,
            }}
          >
            <span className="block" style={{ marginLeft: "-0.04em" }}>
              Goede-
            </span>
            <span className="block italic" style={{ color: C.red }}>
              morgen,
            </span>
            <span className="block" style={{ marginLeft: "0.6em" }}>
              {voornaam}.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: C.ink2 }}>
            Je register is geverifieerd en op orde. Verse opdrachten sluiten aan op je profiel, en
            één document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Btn variant="red" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" className="on-arrow" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>
        </div>

        <aside className="relative lg:mt-10">
          <div
            className="relative overflow-hidden p-6"
            style={{ background: C.ink, color: C.paper }}
          >
            <GhostNumber n={`${ratio}`} className="text-[180px]" />
            <div className="relative">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "#c8bfa8" }}
              >
                Dossier op orde
              </span>
              <p
                className="mt-2 font-bold leading-none"
                style={{ fontSize: 72, letterSpacing: "-0.04em", ...serif }}
              >
                {ratio}%
              </p>
              <div className="mt-5 flex gap-1.5" aria-hidden="true">
                {CREDENTIALS.map((c) => (
                  <span
                    key={c.naam}
                    className="h-2 flex-1 rounded-full"
                    style={{ background: c.status === "VERIFIED" ? C.red : "#3a342b" }}
                  />
                ))}
              </div>
              <p className="mt-3 text-[12px]" style={{ color: "#c8bfa8" }}>
                {verified} van {CREDENTIALS.length} certificaten geverifieerd.
              </p>
            </div>
          </div>
        </aside>
      </section>

      {/* KPI-strook — ongelijke kolommen, redactionele scheidingslijnen */}
      <section>
        <div
          className="mb-5 flex items-end justify-between gap-4"
          style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}
        >
          <Kicker>Kerncijfers</Kicker>
          <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.mute }}>
            Deze maand
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className={i % 2 === 1 ? "lg:mt-6" : ""}
              style={{ borderLeft: `2px solid ${i === 3 ? C.red : C.ink}`, paddingLeft: 14 }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.mute }}
              >
                {k.label}
              </p>
              <p
                className="mt-2 font-bold leading-none"
                style={{ color: C.ink, fontSize: 34, letterSpacing: "-0.03em", ...serif }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className="text-[11.5px] font-semibold"
                  style={{ color: k.up ? C.redDeep : C.ink2, ...num }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
                <Spark data={k.spark} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aanbevolen + termijn — overlappende, asymmetrische compositie */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div
            className="mb-5 flex items-end justify-between gap-4"
            style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}
          >
            <Kicker>Aanbevolen</Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className="text-[12px] font-semibold uppercase tracking-[0.08em] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf2b1c]"
              style={{ color: C.ink }}
            >
              Volledige lijst →
            </button>
          </div>
          <ul className="space-y-0">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <OpdrachtRow opdracht={o} index={i} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <aside className="relative">
          <div
            className="on-tilt relative p-6"
            style={{ border: `2px solid ${C.red}`, background: C.paper }}
          >
            <span
              className="absolute -top-3 left-5 px-2 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ background: C.paper, color: C.red }}
            >
              Termijn nadert
            </span>
            <div className="flex items-center gap-2" style={{ color: C.red }}>
              <AlertTriangle size={16} aria-hidden="true" strokeWidth={2.25} />
            </div>
            <h3
              className="mt-2 text-[21px] font-bold leading-tight"
              style={{ color: C.ink, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
              {primair.detail}
            </p>
            <Btn variant="red" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" className="on-arrow" />
            </Btn>
          </div>
        </aside>
      </section>
    </div>
  );
}

function OpdrachtRow({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="on-row group/btn flex w-full items-center gap-5 py-5 pl-2 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#cf2b1c]"
    >
      <span
        className="hidden shrink-0 text-[13px] font-bold sm:block"
        style={{ color: C.faint, ...num }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <MatchMark value={opdracht.match} size={38} />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[19px] font-bold leading-snug"
          style={{ color: C.ink, letterSpacing: "-0.01em", ...serif }}
        >
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
          style={{ color: C.mute }}
        >
          <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[17px] font-bold" style={{ color: C.ink, ...serif }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: C.faint }}
        >
          per uur
        </span>
      </span>
      <ChevronRight
        size={18}
        aria-hidden="true"
        className="on-arrow shrink-0"
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
    <div className="space-y-8">
      <div className="relative">
        <GhostNumber n="M" className="-top-6 right-0 hidden text-[140px] md:block" />
        <Kicker>Marktplaats</Kicker>
        <h1
          className="mt-3 max-w-2xl font-bold"
          style={{
            color: C.ink,
            fontSize: "clamp(2.2rem, 6vw, 4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            ...serif,
          }}
        >
          Opdrachten die{" "}
          <span className="italic" style={{ color: C.red }}>
            bij je passen
          </span>
        </h1>
        <p className="mt-3 text-[13px] uppercase tracking-[0.08em]" style={{ color: C.mute }}>
          {filtered.length} van {OPDRACHTEN.length} sluiten aan op je profiel
        </p>
      </div>

      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{
          borderTop: `2px solid ${C.ink}`,
          borderBottom: `1px solid ${C.line}`,
          paddingTop: 14,
          paddingBottom: 14,
        }}
      >
        <div className="flex flex-1 items-center gap-2.5">
          <Search size={16} aria-hidden="true" style={{ color: C.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a89f8e]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#efe8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf2b1c]"
              style={{ color: C.mute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "ghost"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-6" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="p-6" style={{ border: `1px solid ${C.line}` }}>
              <div className="space-y-3">
                <div
                  className="h-6 w-2/3 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
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
        <ul className="space-y-8">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-6 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="text-[10px] uppercase tracking-[0.14em] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf2b1c]"
            style={{ color: C.faint }}
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
    <div
      className="flex flex-col items-center px-6 py-20 text-center"
      style={{ border: `1px solid ${C.line}` }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ border: `2px solid ${C.ink}`, color: C.ink }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[24px] font-bold" style={{ color: C.ink, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-6" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
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
  // Bewust asymmetrisch: even/oneven kaarten spiegelen de kolomindeling.
  const flip = index % 2 === 1;
  return (
    <article className="relative" style={{ borderTop: `2px solid ${C.ink}` }}>
      <GhostNumber
        n={String(index + 1).padStart(2, "0")}
        className={`-top-4 text-[110px] ${flip ? "left-2" : "right-2"} hidden md:block`}
      />
      <div
        className={`relative flex flex-col gap-5 pt-6 md:flex-row md:items-start ${flip ? "md:flex-row-reverse" : ""}`}
      >
        <div className="shrink-0">
          <MatchMark value={opdracht.match} size={54} />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: strong ? C.redDeep : C.mute }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.id}
          </span>
          <h3
            className="mt-1.5 text-[24px] font-bold leading-tight"
            style={{ color: C.ink, letterSpacing: "-0.015em", ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.mute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 text-[11.5px] font-medium"
                style={{ color: C.ink2, border: `1px solid ${C.line}`, background: C.paper2 }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-left md:text-right">
          <span className="block text-[22px] font-bold" style={{ color: C.ink, ...serif }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.faint }}
          >
            per uur
          </span>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-3 pb-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-[#cf2b1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf2b1c]"
          style={{ color: C.ink }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" className="on-arrow" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-8 pt-5 sm:grid-cols-2">
            <RedenKolom
              titel="In je voordeel"
              Icon={Check}
              tone={C.ink}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              Icon={AlertTriangle}
              tone={C.red}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function RedenKolom({
  titel,
  Icon,
  tone,
  items,
}: {
  titel: string;
  Icon: LucideIcon;
  tone: string;
  items: string[];
}) {
  return (
    <div style={{ borderTop: `1px solid ${tone}`, paddingTop: 12 }}>
      <p
        className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" strokeWidth={2.25} /> {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[14px] leading-snug"
            style={{ color: C.ink2 }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
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
    <div className="space-y-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-[#cf2b1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf2b1c]"
        style={{ color: C.mute }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <header className="relative">
        <GhostNumber
          n={`${opdracht.match}`}
          className="-top-10 right-0 hidden text-[200px] lg:block"
        />
        <div className="relative flex flex-wrap items-center gap-3">
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.mute, ...num }}
          >
            {opdracht.id}
          </span>
          <span className="h-3.5 w-px" style={{ background: C.line }} aria-hidden="true" />
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: strong ? C.redDeep : C.ink }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-3xl font-bold"
          style={{
            color: C.ink,
            fontSize: "clamp(2.2rem, 6vw, 4.4rem)",
            lineHeight: 0.96,
            letterSpacing: "-0.03em",
            ...serif,
          }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="relative mt-4 flex items-center gap-1.5 text-[14.5px]"
          style={{ color: C.mute }}
        >
          <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <Btn variant="red">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" className="on-arrow" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            style={{ borderTop: `2px solid ${i === 3 ? C.red : C.ink}`, paddingTop: 10 }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.mute }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-bold leading-none"
              style={{ color: C.ink, letterSpacing: "-0.02em", ...serif }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-5" style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}>
          <Kicker>Motivering</Kicker>
          <h2
            className="mt-2 text-[26px] font-bold"
            style={{ color: C.ink, letterSpacing: "-0.02em", ...serif }}
          >
            Waarom deze match bij je past
          </h2>
        </div>
        <p className="mb-6 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.ink2 }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div style={{ borderLeft: `2px solid ${C.ink}`, paddingLeft: 20 }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.ink }}
            >
              <Check size={14} aria-hidden="true" strokeWidth={2.25} /> In je voordeel
            </p>
            <ul className="mt-4 space-y-4">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[15px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.25}
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ borderLeft: `2px solid ${C.red}`, paddingLeft: 20 }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.red }}
            >
              <AlertTriangle size={14} aria-hidden="true" strokeWidth={2.25} /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-4">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[15px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <AlertTriangle
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.25}
                    style={{ color: C.red }}
                  />
                  {r}
                </li>
              ))}
            </ul>
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
    <div className="space-y-10">
      <section className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div style={{ borderTop: `2px solid ${C.ink}`, paddingTop: 20 }}>
          <Kicker>Vertrouwensregister</Kicker>
          <h1
            className="mt-3 font-bold"
            style={{
              color: C.ink,
              fontSize: "clamp(2rem, 5.5vw, 3.6rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              ...serif,
            }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.ink2 }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Al je documenten worden versleuteld
            bewaard en uitsluitend met jouw toestemming gedeeld.
          </p>
        </div>
        <div className="relative overflow-hidden p-7" style={{ background: C.ink, color: C.paper }}>
          <GhostNumber n={`${ratio}`} className="text-[190px]" />
          <div className="relative">
            <p
              className="font-bold leading-none"
              style={{ fontSize: 72, letterSpacing: "-0.04em", ...serif }}
            >
              {ratio}%
            </p>
            <p
              className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#c8bfa8" }}
            >
              dossier op orde
            </p>
            <div className="mt-5 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="h-2 flex-1 rounded-full"
                  style={{ background: c.status === "VERIFIED" ? C.red : "#3a342b" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5" style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}>
          <Kicker>Certificaten</Kicker>
        </div>
        <ul style={{ borderTop: `1px solid ${C.line}` }}>
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderBottom: `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="on-row flex w-full items-center gap-4 py-5 pl-2 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#cf2b1c]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center"
                    style={{ background: t.fill, color: t.text, border: `1px solid ${t.border}` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[18px] font-bold"
                      style={{ color: C.ink, ...serif }}
                    >
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.mute }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusPill {...t} />
                  </span>
                  <span
                    className="text-[18px] font-bold transition-transform motion-reduce:transition-none"
                    style={{ color: C.ink, transform: isOpen ? "rotate(45deg)" : "none" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="pb-6 sm:pl-[60px]" style={{ paddingTop: 4 }}>
                      <span className="mb-3 inline-flex sm:hidden">
                        <StatusPill {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.ink2 }}
                      >
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
                        <Btn size="sm" variant="ghost">
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-5" style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}>
          <Kicker>Documentenkast</Kicker>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <div
                key={d.naam}
                className="on-row flex items-center gap-3 p-2"
                style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ border: `1px solid ${C.line}`, color: C.ink2 }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14px] font-bold"
                    style={{ color: C.ink, ...serif }}
                  >
                    {d.naam}
                  </span>
                  <span
                    className="block text-[11px] uppercase tracking-[0.05em]"
                    style={{ color: C.mute, ...num }}
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
    <div className="space-y-8">
      <div className="relative">
        <GhostNumber n="!" className="-top-8 right-0 hidden text-[150px] md:block" />
        <Kicker>Agenda</Kicker>
        <h1
          className="mt-3 max-w-2xl font-bold"
          style={{
            color: C.ink,
            fontSize: "clamp(2.2rem, 6vw, 4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            ...serif,
          }}
        >
          Wat vandaag je{" "}
          <span className="italic" style={{ color: C.red }}>
            aandacht
          </span>{" "}
          vraagt
        </h1>
        <p className="mt-3 text-[13px] uppercase tracking-[0.08em]" style={{ color: C.mute }}>
          Op volgorde van urgentie — werk van boven naar beneden
        </p>
      </div>

      <ol className="space-y-0">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.red : C.ink;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel} className="on-row" style={{ borderTop: `2px solid ${tone}` }}>
              <div className="flex items-start gap-5 py-6 pl-2 pr-2">
                <span
                  className="text-[40px] font-bold leading-none"
                  style={{ color: tone, ...serif }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: warn ? C.red : C.mute }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" strokeWidth={2.25} />
                    ) : (
                      <Clock size={12} aria-hidden="true" strokeWidth={2.25} />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[21px] font-bold leading-snug"
                    style={{ color: C.ink, ...serif }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.ink2 }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant={warn ? "red" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" className="on-arrow" />
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
  if (status === "Betaald") return { fill: C.ink, text: C.paper, border: C.ink };
  if (status === "Openstaand") return { fill: C.red, text: "#fff", border: C.red };
  if (status === "Concept") return { fill: "transparent", text: C.ink, border: C.ink };
  return { fill: "transparent", text: C.red, border: C.red };
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Grootboek</Kicker>
          <h1
            className="mt-3 font-bold"
            style={{
              color: C.ink,
              fontSize: "clamp(2.2rem, 6vw, 4rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              ...serif,
            }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="red">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", red: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", red: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", red: false },
        ].map((s) => (
          <div
            key={s.l}
            style={{ borderTop: `2px solid ${s.red ? C.red : C.ink}`, paddingTop: 12 }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.mute }}
            >
              {s.l}
            </p>
            <p
              className="mt-1.5 text-[30px] font-bold leading-none"
              style={{ color: s.red ? C.red : C.ink, letterSpacing: "-0.03em", ...serif }}
            >
              {s.v}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: C.mute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "ghost"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <div className="overflow-x-auto" style={{ borderTop: `2px solid ${C.ink}` }}>
        <table className="w-full text-left" style={{ minWidth: 560 }}>
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.ink}` }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.mute }}
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
                  className="on-row"
                  style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none" }}
                >
                  <td className="px-4 py-4 text-[12.5px]" style={{ color: C.ink2, ...num }}>
                    {f.nr}
                  </td>
                  <td
                    className="px-4 py-4 text-[15px] font-bold"
                    style={{ color: C.ink, ...serif }}
                  >
                    {f.klant}
                  </td>
                  <td className="px-4 py-4 text-[12.5px]" style={{ color: C.mute, ...num }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-4 text-[15px] font-bold" style={{ color: C.ink, ...num }}>
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
                      style={{ background: t.fill, color: t.text, border: `1px solid ${t.border}` }}
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
