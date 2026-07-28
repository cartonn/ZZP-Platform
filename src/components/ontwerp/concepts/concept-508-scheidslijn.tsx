"use client";

// Concept 508 — "Scheidslijn" · Adaptive dual-theme als designtaal. Een licht/donker-dualiteit
// met een zichtbare diagonale naad; een prominente toggle schakelt het héle concept vloeiend tussen
// licht en donker (lokale theme-state, niet de globale app). Hoog contrast in beide modi, scherpe
// architectuur, monospace-labels voor een technische, precieze toon. Status altijd label + icoon.

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Hourglass,
  MapPin,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TriangleAlert,
  Wallet,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

type ThemeName = "light" | "dark";

type Tokens = {
  name: ThemeName;
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceAlt: string;
  inverse: string; // panel dat de tegenovergestelde modus toont (de naad)
  inverseText: string;
  inverseMute: string;
  border: string;
  borderStrong: string;
  text: string;
  textSoft: string;
  textMute: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  ring: string;
  verified: string;
  verifiedSoft: string;
  submitted: string;
  submittedSoft: string;
  expiring: string;
  expiringSoft: string;
  rejected: string;
  rejectedSoft: string;
};

function makeTokens(theme: ThemeName): Tokens {
  if (theme === "dark") {
    return {
      name: "dark",
      bg: "#08080b",
      bgAlt: "#0f0f13",
      surface: "#141419",
      surfaceAlt: "#1b1b22",
      inverse: "#f4f4f6",
      inverseText: "#0a0a0c",
      inverseMute: "#57575f",
      border: "#26262e",
      borderStrong: "#33333d",
      text: "#f4f4f6",
      textSoft: "#b6b6c0",
      textMute: "#77777f",
      accent: "#818cf8",
      accentText: "#0a0a0c",
      accentSoft: "rgba(129,140,248,0.16)",
      ring: "#818cf8",
      verified: "#4ade80",
      verifiedSoft: "rgba(74,222,128,0.14)",
      submitted: "#60a5fa",
      submittedSoft: "rgba(96,165,250,0.14)",
      expiring: "#fbbf24",
      expiringSoft: "rgba(251,191,36,0.15)",
      rejected: "#f87171",
      rejectedSoft: "rgba(248,113,113,0.14)",
    };
  }
  return {
    name: "light",
    bg: "#ffffff",
    bgAlt: "#f5f5f7",
    surface: "#ffffff",
    surfaceAlt: "#f6f6f8",
    inverse: "#0c0c0f",
    inverseText: "#f4f4f6",
    inverseMute: "#8f8f99",
    border: "#e6e6ea",
    borderStrong: "#d4d4da",
    text: "#0a0a0c",
    textSoft: "#4a4a52",
    textMute: "#8a8a93",
    accent: "#4f46e5",
    accentText: "#ffffff",
    accentSoft: "rgba(79,70,229,0.10)",
    ring: "#4f46e5",
    verified: "#15803d",
    verifiedSoft: "rgba(21,128,61,0.10)",
    submitted: "#2563eb",
    submittedSoft: "rgba(37,99,235,0.10)",
    expiring: "#b45309",
    expiringSoft: "rgba(180,83,9,0.10)",
    rejected: "#b91c1c",
    rejectedSoft: "rgba(185,28,28,0.10)",
  };
}

const sans = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono = {
  fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
};
const num = { ...sans, fontVariantNumeric: "tabular-nums" as const };

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus, T: Tokens): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: T.verified,
        soft: T.verifiedSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: T.submitted,
        soft: T.submittedSoft,
        label: "In beoordeling",
        Icon: Hourglass,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: T.expiring,
        soft: T.expiringSoft,
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: T.rejected, soft: T.rejectedSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Scherpe knop; solid = accent, outline = rand, ghost = tekst. —
function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
  T,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  T: Tokens;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  let style: React.CSSProperties;
  let extra = "";
  if (variant === "solid") {
    style = { background: T.accent, color: T.accentText };
    extra = "hover:-translate-y-px";
  } else if (variant === "outline") {
    style = { background: "transparent", color: T.text, border: `1px solid ${T.borderStrong}` };
  } else {
    style = { background: "transparent", color: T.textSoft };
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${extra} ${className}`}
      style={{
        ...style,
        ...sans,
        // focus-ring kleur via CSS var zodat beide thema's kloppen
        ["--tw-ring-color" as string]: T.ring,
        ["--tw-ring-offset-color" as string]: T.bg,
      }}
    >
      {children}
    </button>
  );
}

function StatusChip({ tone }: { tone: Tone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ color: tone.base, background: tone.soft, ...mono }}
    >
      <tone.Icon size={12} aria-hidden="true" />
      {tone.label}
      {tone.alarm && <span className="sr-only"> (vraagt aandacht)</span>}
    </span>
  );
}

function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.14em]" style={{ ...mono, ...style }}>
      {children}
    </span>
  );
}

// — Match als segment-meter: technische, scherpe uitdrukking i.p.v. ring. —
function MatchBar({ value, T, width = 120 }: { value: number; T: Tokens; width?: number }) {
  const strong = value >= 90;
  const tone = strong ? T.verified : T.accent;
  const segs = 10;
  const filled = Math.round((value / 100) * segs);
  return (
    <span className="inline-flex flex-col gap-1.5" aria-label={`Match ${value} procent`}>
      <span className="flex items-center gap-2">
        <span className="text-[15px] font-bold leading-none" style={{ color: tone, ...num }}>
          {value}
        </span>
        <Mono style={{ color: T.textMute }}>match</Mono>
      </span>
      <span className="flex gap-[3px]" style={{ width }} aria-hidden="true">
        {Array.from({ length: segs }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-[1px] transition-colors"
            style={{ background: i < filled ? tone : T.border }}
          />
        ))}
      </span>
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 80;
  const h = 24;
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
        stroke={tone}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={tone} />
    </svg>
  );
}

// — De naad: de handtekening-toggle die licht/donker omschakelt. —
function SeamToggle({ theme, onToggle, T }: { theme: ThemeName; onToggle: () => void; T: Tokens }) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Schakel naar lichte modus" : "Schakel naar donkere modus"}
      className="relative inline-flex h-9 items-center gap-1 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: T.surfaceAlt,
        border: `1px solid ${T.border}`,
        ["--tw-ring-color" as string]: T.ring,
        ["--tw-ring-offset-color" as string]: T.bg,
      }}
    >
      <span
        className="absolute top-1 h-7 w-7 rounded-full transition-all duration-300"
        style={{
          left: dark ? "calc(100% - 1.75rem - 0.25rem)" : "0.25rem",
          background: T.accent,
        }}
        aria-hidden="true"
      />
      <span className="relative z-10 flex h-7 w-7 items-center justify-center" aria-hidden="true">
        <Sun size={15} style={{ color: dark ? T.textMute : T.accentText }} />
      </span>
      <span className="relative z-10 flex h-7 w-7 items-center justify-center" aria-hidden="true">
        <Moon size={15} style={{ color: dark ? T.accentText : T.textMute }} />
      </span>
    </button>
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept508() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [theme, setTheme] = useState<ThemeName>("light");
  const T = useMemo(() => makeTokens(theme), [theme]);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="sl-root min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: T.text,
        background: T.bg,
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
        <TopBar
          theme={theme}
          onToggle={() => setTheme((v) => (v === "light" ? "dark" : "light"))}
          T={T}
        />
        <NavBar screen={screen} setScreen={setScreen} T={T} />
        <main key={screen} className="sl-fade pb-24 pt-8">
          {screen === "dashboard" && (
            <Dashboard
              theme={theme}
              onToggle={() => setTheme((v) => (v === "light" ? "dark" : "light"))}
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
              onVerif={() => setScreen("verificatie")}
              T={T}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} T={T} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} T={T} />
          )}
          {screen === "verificatie" && <Verificatie T={T} />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} T={T} />}
          {screen === "facturen" && <Facturen T={T} />}
        </main>
      </div>

      <style>{`
        @keyframes slFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sl-fade { animation: slFade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .sl-fade { animation: none; } }
      `}</style>
    </div>
  );
}

function TopBar({ theme, onToggle, T }: { theme: ThemeName; onToggle: () => void; T: Tokens }) {
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[11px]"
          style={{ border: `1px solid ${T.border}` }}
          aria-hidden="true"
        >
          {/* mini-naad: helft licht, helft donker, diagonaal gescheiden */}
          <span className="relative block h-full w-full" style={{ background: T.inverse }}>
            <span
              className="absolute inset-0"
              style={{ background: T.accent, clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            />
          </span>
        </span>
        <div>
          <p
            className="text-[15px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: T.text }}
          >
            Scheidslijn
          </p>
          <p
            className="mt-1.5"
            style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em", color: T.textMute }}
          >
            {theme === "dark" ? "DONKERE MODUS" : "LICHTE MODUS"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: T.verified, background: T.verifiedSoft, ...mono }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <SeamToggle theme={theme} onToggle={onToggle} T={T} />
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[12px] font-bold"
          style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({
  screen,
  setScreen,
  T,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  T: Tokens;
}) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6 overflow-x-auto">
      <div className="flex items-center gap-1 border-b" style={{ borderColor: T.border }}>
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-t-[8px] px-4 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                color: on ? T.text : T.textMute,
                ["--tw-ring-color" as string]: T.ring,
              }}
            >
              {s.label}
              <span
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all"
                style={{ background: on ? T.accent : "transparent" }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Panel({
  children,
  T,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  T: Tokens;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "aside";
}) {
  return (
    <Tag
      className={`rounded-[14px] ${className}`}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}
    >
      {children}
    </Tag>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  theme,
  onToggle,
  onOpen,
  onMarkt,
  onActies,
  onVerif,
  T,
}: {
  theme: ThemeName;
  onToggle: () => void;
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onVerif: () => void;
  T: Tokens;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const voornaam = PROFIEL.naam.split(" ")[0];
  const dark = theme === "dark";

  return (
    <div className="space-y-8">
      {/* Signature-naad: één paneel toont beide modi, gescheiden door een diagonale lijn */}
      <section
        className="relative overflow-hidden rounded-[16px]"
        style={{ border: `1px solid ${T.border}` }}
      >
        <div className="relative grid grid-cols-1 md:grid-cols-2">
          {/* linkerhelft — huidige modus */}
          <div className="relative z-10 p-7 sm:p-9" style={{ background: T.surface }}>
            <Mono style={{ color: T.textMute }}>Vandaag · {PROFIEL.plaats}</Mono>
            <h1
              className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[38px]"
              style={{ color: T.text }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed" style={{ color: T.textSoft }}>
              Je werkruimte past zich aan jouw licht aan. Eén ding vraagt vandaag je aandacht.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Btn variant="solid" onClick={onActies} T={T}>
                Volgende actie <ArrowRight size={14} aria-hidden="true" />
              </Btn>
              <Btn variant="outline" onClick={onToggle} T={T}>
                {dark ? (
                  <Sun size={14} aria-hidden="true" />
                ) : (
                  <Moon size={14} aria-hidden="true" />
                )}
                {dark ? "Licht" : "Donker"}
              </Btn>
            </div>
          </div>
          {/* rechterhelft — de tegenovergestelde modus, achter de naad */}
          <div
            className="relative min-h-[180px] overflow-hidden"
            style={{ background: T.inverse }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: T.surface, clipPath: "polygon(0 0, 22% 0, 0 100%)" }}
            />
            <div className="flex h-full flex-col justify-between p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <Mono style={{ color: T.inverseMute }}>{dark ? "Licht" : "Donker"} · preview</Mono>
                <SlidersHorizontal size={16} style={{ color: T.inverseMute }} />
              </div>
              <div>
                <p
                  className="text-[26px] font-bold leading-none"
                  style={{ color: T.inverseText, ...num }}
                >
                  {ratio}%
                </p>
                <p className="mt-2 text-[12.5px]" style={{ color: T.inverseMute }}>
                  dossier op orde · zelfde data, ander licht
                </p>
              </div>
            </div>
          </div>
          {/* de scheidslijn zelf */}
          <span
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px md:block"
            style={{ background: `linear-gradient(${T.border}, ${T.accent}, ${T.border})` }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Primaire actie */}
      <section>
        <Panel T={T} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: T.expiring, ...mono }}
              >
                <TriangleAlert size={13} aria-hidden="true" /> VRAAGT AANDACHT
              </span>
              <h2 className="mt-2.5 text-[19px] font-bold leading-snug" style={{ color: T.text }}>
                {primair.titel}
              </h2>
              <p
                className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                style={{ color: T.textSoft }}
              >
                {primair.detail}
              </p>
            </div>
            <Btn variant="solid" size="sm" onClick={onActies} T={T}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        </Panel>
      </section>

      {/* KPI's */}
      <section aria-labelledby="kpis">
        <h2 id="kpis" className="sr-only">
          Kerncijfers
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? T.accent : T.expiring;
            return (
              <Panel key={k.label} T={T} className="p-4">
                <Mono style={{ color: T.textMute, fontSize: 10 }}>{k.label}</Mono>
                <p
                  className="mt-2 text-[22px] font-bold leading-none"
                  style={{ color: T.text, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-semibold" style={{ color: tone, ...num }}>
                    {k.up ? "↑" : "↓"} {k.trend}
                  </span>
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Matches */}
      <section aria-labelledby="matches">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Mono style={{ color: T.textMute }}>Aanbevolen</Mono>
            <h2
              id="matches"
              className="mt-1 text-[18px] font-bold tracking-[-0.01em]"
              style={{ color: T.text }}
            >
              Opdrachten voor jou
            </h2>
          </div>
          <button
            type="button"
            onClick={onMarkt}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ color: T.accent, ["--tw-ring-color" as string]: T.ring }}
          >
            Marktplaats <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <Row opdracht={o} onOpen={onOpen} T={T} />
            </li>
          ))}
        </ul>
      </section>

      {/* Dossier */}
      <section aria-labelledby="dossier">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Mono style={{ color: T.textMute }}>Register</Mono>
            <h2
              id="dossier"
              className="mt-1 text-[18px] font-bold tracking-[-0.01em]"
              style={{ color: T.text }}
            >
              Je certificaten
            </h2>
          </div>
          <button
            type="button"
            onClick={onVerif}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ color: T.accent, ["--tw-ring-color" as string]: T.ring }}
          >
            Verificatie <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status, T);
            return (
              <Panel key={c.naam} T={T} className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: t.soft, color: t.base }}
                  aria-hidden="true"
                >
                  <t.Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: T.text }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: t.alarm ? t.base : T.textMute }}
                  >
                    {c.detail}
                  </span>
                </span>
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Row({ opdracht, onOpen, T }: { opdracht: Opdracht; onOpen: () => void; T: Tokens }) {
  return (
    <Panel T={T} as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ ["--tw-ring-color" as string]: T.ring }}
      >
        <span className="hidden sm:block">
          <MatchBar value={opdracht.match} T={T} width={96} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold" style={{ color: T.text }}>
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
            style={{ color: T.textMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[14px] font-bold" style={{ color: T.text, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <Mono style={{ color: T.textMute, fontSize: 9.5 }}>per uur</Mono>
        </span>
        <ArrowRight
          size={17}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: T.textMute }}
        />
      </button>
    </Panel>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen, T }: { onOpen: () => void; T: Tokens }) {
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
    <div className="space-y-6">
      <header>
        <Mono style={{ color: T.textMute }}>Marktplaats</Mono>
        <h1
          className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]"
          style={{ color: T.text }}
        >
          Opdrachten die bij je passen
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: T.textMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde
          profiel.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[11px] px-4 py-2.5"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: T.textMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: T.text }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-[7px] transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{ color: T.textMute, ["--tw-ring-color" as string]: T.ring }}
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
              variant={sort === s ? "solid" : "outline"}
              onClick={() => setSort(s)}
              T={T}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel T={T} className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded-[6px] motion-reduce:animate-none"
                    style={{ background: T.surfaceAlt }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded-[6px] motion-reduce:animate-none"
                    style={{ background: T.surfaceAlt }}
                  />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={T.rejected}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
          T={T}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={T.accent}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
          T={T}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} T={T} />
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
            className="rounded-[6px] px-1 text-[10.5px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...mono, color: T.textMute, ["--tw-ring-color" as string]: T.ring }}
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
  tone,
  T,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
  T: Tokens;
}) {
  return (
    <Panel T={T} className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-[14px]"
        style={{ color: tone, background: T.surfaceAlt, border: `1px solid ${T.border}` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-5 text-[19px] font-bold" style={{ color: T.text }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: T.textSoft }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-5" onClick={onCta} T={T}>
        {cta}
      </Btn>
    </Panel>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
  T,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
  T: Tokens;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <Panel T={T} as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="rounded-[6px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{
                color: strong ? T.verified : T.accent,
                background: strong ? T.verifiedSoft : T.accentSoft,
                ...mono,
              }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <Mono style={{ color: T.textMute }}>
              {opdracht.id} · #{String(index + 1).padStart(2, "0")}
            </Mono>
          </div>
          <h2
            className="mt-2.5 text-[18px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: T.text }}
          >
            {opdracht.titel}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: T.textMute }}>
            <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {opdracht.tags.map((tg) => (
              <span
                key={tg}
                className="rounded-[7px] px-2.5 py-1 text-[11.5px] font-medium"
                style={{
                  background: T.surfaceAlt,
                  color: T.textSoft,
                  border: `1px solid ${T.border}`,
                }}
              >
                {tg}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <MatchBar value={opdracht.match} T={T} width={110} />
          <span className="text-right">
            <span className="block text-[16px] font-bold" style={{ color: T.text, ...num }}>
              {opdracht.tarief.replace(" / uur", "")}
            </span>
            <Mono style={{ color: T.textMute, fontSize: 9.5 }}>per uur</Mono>
          </span>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        style={{ borderTop: `1px solid ${T.border}`, background: T.bgAlt }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[7px] px-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{ color: T.accent, ["--tw-ring-color" as string]: T.ring }}
        >
          {open ? "Verberg motivering" : "Waarom deze match"}
        </button>
        <Btn variant="solid" size="sm" onClick={onOpen} T={T}>
          Reageren <ArrowRight size={13} aria-hidden="true" />
        </Btn>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${T.border}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={T.verified}
              Icon={Check}
              items={opdracht.redenen.plus}
              T={T}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={T.expiring}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
              T={T}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenKolom({
  titel,
  tone,
  Icon,
  items,
  T,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
  T: Tokens;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5" style={{ color: tone, ...mono }}>
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: T.textSoft }}
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
function OpdrachtDetail({
  opdracht,
  onBack,
  T,
}: {
  opdracht: Opdracht;
  onBack: () => void;
  T: Tokens;
}) {
  const strong = opdracht.match >= 90;
  const meta: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Aanvang", v: opdracht.start, Icon: CalendarDays },
    { l: "Match", v: `${opdracht.match}%`, Icon: BadgeCheck },
  ];
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[7px] px-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{ color: T.textMute, ["--tw-ring-color" as string]: T.ring }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel T={T} className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="rounded-[6px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{
                  color: strong ? T.verified : T.accent,
                  background: strong ? T.verifiedSoft : T.accentSoft,
                  ...mono,
                }}
              >
                {strong ? "Sterke match" : "Goede match"}
              </span>
              <Mono style={{ color: T.textMute }}>{opdracht.id}</Mono>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[32px]"
              style={{ color: T.text }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: T.textMute }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchBar value={opdracht.match} T={T} width={130} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn variant="solid" onClick={onBack} T={T}>
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" T={T}>
            Bewaren
          </Btn>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {meta.map((m) => (
            <div
              key={m.l}
              className="rounded-[11px] p-3.5"
              style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}
            >
              <p
                className="flex items-center gap-1.5"
                style={{ color: T.textMute, ...mono, fontSize: 10 }}
              >
                <m.Icon size={12} aria-hidden="true" /> {m.l}
              </p>
              <p className="mt-1.5 text-[17px] font-bold" style={{ color: T.text, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel T={T} className="p-6 sm:p-8">
        <Mono style={{ color: T.textMute }}>Motivering</Mono>
        <h2 className="mt-2 text-[20px] font-bold tracking-[-0.01em]" style={{ color: T.text }}>
          Waarom deze match bij je past
        </h2>
        <p className="mb-6 mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: T.textSoft }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={T.verified}
            Icon={Check}
            items={opdracht.redenen.plus}
            T={T}
          />
          <RedenKolom
            titel="Goed om te weten"
            tone={T.expiring}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
            T={T}
          />
        </div>
      </Panel>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie({ T }: { T: Tokens }) {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel T={T} className="p-6">
          <Mono style={{ color: T.verified }}>Vertrouwensregister</Mono>
          <h1
            className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.02em]"
            style={{ color: T.text }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: T.textSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Alles wordt versleuteld bewaard en
            uitsluitend met jouw toestemming gedeeld.
          </p>
        </Panel>
        <Panel T={T} className="flex flex-col justify-center p-6">
          <span className="text-[40px] font-bold leading-none" style={{ color: T.text, ...num }}>
            {ratio}%
          </span>
          <Mono style={{ color: T.textMute, marginTop: 6 }}>dossier op orde</Mono>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ background: T.surfaceAlt }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: T.accent,
                transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Panel>
      </section>

      <section aria-labelledby="certificaten">
        <div className="mb-4">
          <Mono style={{ color: T.textMute }}>Certificaten</Mono>
          <h2
            id="certificaten"
            className="mt-1 text-[18px] font-bold tracking-[-0.01em]"
            style={{ color: T.text }}
          >
            Documentregister
          </h2>
        </div>
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status, T);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <Panel T={T} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3.5 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: T.ring }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: t.soft, color: t.base }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: T.text }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: T.textMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusChip tone={t} />
                    </span>
                    <span
                      className="text-[16px] transition-transform motion-reduce:transition-none"
                      style={{ color: T.textMute, transform: isOpen ? "rotate(45deg)" : "none" }}
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
                      <div
                        className="px-4 pb-4 sm:pl-[70px]"
                        style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}
                      >
                        <span className="mb-2 inline-flex sm:hidden">
                          <StatusChip tone={t} />
                        </span>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: T.textSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm" variant="solid" T={T}>
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="ghost" T={T}>
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="kast">
        <div className="mb-4">
          <Mono style={{ color: T.textMute }}>Dossier</Mono>
          <h2
            id="kast"
            className="mt-1 text-[18px] font-bold tracking-[-0.01em]"
            style={{ color: T.text }}
          >
            Documentenkast
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status, T);
            return (
              <Panel key={d.naam} T={T} className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: T.surfaceAlt, color: T.textSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: T.text }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: T.textMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusChip tone={t} />
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt, T }: { onMarkt: () => void; T: Tokens }) {
  return (
    <div className="space-y-6">
      <header>
        <Mono style={{ color: T.textMute }}>Agenda</Mono>
        <h1
          className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]"
          style={{ color: T.text }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: T.textMute }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </header>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? T.expiring : T.submitted;
          const soft = warn ? T.expiringSoft : T.submittedSoft;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Panel T={T} className="flex items-start gap-4 p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-bold"
                  style={{ background: soft, color: tone, ...num }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: tone, ...mono }}
                  >
                    {warn ? (
                      <TriangleAlert size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[17px] font-bold leading-snug"
                    style={{ color: T.text }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: T.textSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                      T={T}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
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

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string, T: Tokens): { base: string; soft: string } {
  if (status === "Betaald") return { base: T.verified, soft: T.verifiedSoft };
  if (status === "Openstaand") return { base: T.expiring, soft: T.expiringSoft };
  if (status === "Concept") return { base: T.submitted, soft: T.submittedSoft };
  return { base: T.rejected, soft: T.rejectedSoft };
}

function Facturen({ T }: { T: Tokens }) {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  const totalen = [
    { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: T.verified },
    { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: T.expiring },
    { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: T.submitted },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Mono style={{ color: T.textMute }}>Grootboek</Mono>
          <h1
            className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]"
            style={{ color: T.text }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="solid" T={T}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {totalen.map((s) => (
          <Panel key={s.l} T={T} className="p-4">
            <Mono style={{ color: T.textMute, fontSize: 10 }}>{s.l}</Mono>
            <p className="mt-1.5 text-[24px] font-bold" style={{ color: s.tone, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: T.textMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            onClick={() => setSort(s)}
            T={T}
          >
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Panel T={T} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 560 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 font-semibold"
                    style={{ color: T.textMute, ...mono, fontSize: 10.5 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const t = factuurTone(f.status, T);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${T.border}`,
                      background: "transparent",
                    }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: T.textMute, ...num }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-semibold" style={{ color: T.text }}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: T.textMute, ...num }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[14px] font-bold"
                      style={{ color: T.text, ...num }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                        style={{ color: t.base, background: t.soft, ...mono }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.base }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
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
