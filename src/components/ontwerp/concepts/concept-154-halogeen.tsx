"use client";

// Concept 154 — "Halogeen" · WARME donkere modus met halo-gloed. Geen koud grijs-blauw, maar
// houtskool-warm (#181410 / #1f1a15) met amber/perzik accent (#ffb066 / #ff8a5c). Actieve elementen
// dragen een zachte lensbloei/halo (subtiele amber box-shadow-glow), als een gloeiende halogeenlamp
// in een donkere kamer. Premium, warm, sfeervol — onderscheidend van koele/monochrome darks (geen
// noir/schemer). Status nooit kleur-alleen: altijd label + icoon. Deterministisch — geen random/Date.
// Fonts: Space Grotesk (display) + Inter (tekst/data).

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  Flame,
  FileText,
  Inbox,
  ChevronRight,
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

// ── Palet — warm dark: houtskool-warm + amber/perzik halo ────────────────────────
const C = {
  base: "#181410", // diepste houtskool-warm
  panel: "#1f1a15", // paneel
  raised: "#262019", // opgetild oppervlak
  raisedHi: "#2e271e", // hover
  line: "#3a3125", // warme rand
  lineSoft: "#2c2519",
  amber: "#ffb066", // primair amber accent
  peach: "#ff8a5c", // secundair perzik accent
  amberDeep: "#e8934a",
  text: "#f3e9dc", // warm crème tekst
  textSoft: "#cbbba4",
  textMute: "#9a8b78",
  green: "#8fd39a", // geverifieerd-groen (warm)
  greenBg: "rgba(143,211,154,0.12)",
  amberBg: "rgba(255,176,102,0.14)",
  peachBg: "rgba(255,138,92,0.14)",
  redBg: "rgba(255,138,92,0.16)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Halo-gloed rond een actief/gefocust element — de kernsignatuur van dit concept.
const haloSoft = (color: string): React.CSSProperties => ({
  boxShadow: `0 0 20px -6px ${withA(color, 0.35)}`,
});

function withA(hex: string, a: number): string {
  // hex #rrggbb → rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Status-model — nooit kleur-alleen (icoon + label + warme tint) ───────────────
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  glow: string;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.green, bg: C.greenBg, glow: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.amber, bg: C.amberBg, glow: C.amber };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        fg: C.peach,
        bg: C.peachBg,
        glow: C.peach,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: "#ff9a7d", bg: C.redBg, glow: C.peach };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...body,
        background: m.bg,
        color: m.fg,
        boxShadow: `0 0 0 1px ${withA(m.glow, 0.3)}`,
      }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Warm paneel met optionele halo bij actief.
function Panel({
  children,
  className = "",
  bg = C.panel,
  glowColor,
  interactive = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  glowColor?: string;
  interactive?: boolean;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-2xl ${interactive ? "transition-all duration-300" : ""} ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.line}`,
        ...(glowColor ? haloSoft(glowColor) : {}),
      }}
    >
      {children}
    </Tag>
  );
}

// Gloeiende ring-meter (amber halo).
function GlowRing({ value, size = 76 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <div className="relative" style={{ width: size, height: size, ...haloSoft(C.amber) }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.amber}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[18px] font-bold tabular-nums"
        style={{ ...display, color: C.text }}
      >
        {value}
        <span className="text-[11px]" style={{ color: C.textMute }}>
          %
        </span>
      </span>
    </div>
  );
}

// Amber sparkline (gloeiende lijn).
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 26 - ((v - min) / span) * 22 - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.amber}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${withA(C.amber, 0.6)})` }}
      />
    </svg>
  );
}

function matchGlow(m: number): string {
  return m >= 90 ? C.amber : m >= 85 ? C.peach : C.amberDeep;
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept154() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...body,
        background: C.base,
        color: C.text,
        backgroundImage: `radial-gradient(1200px 600px at 78% -8%, ${withA(C.amber, 0.08)}, transparent 60%), radial-gradient(900px 500px at 10% 108%, ${withA(C.peach, 0.06)}, transparent 55%)`,
      }}
    >
      {/* Kop */}
      <header
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8"
        style={{
          background: withA(C.base, 0.82),
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${C.lineSoft}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(140deg, ${C.amber}, ${C.peach})`,
              color: C.base,
              ...haloSoft(C.amber),
            }}
            aria-hidden="true"
          >
            <Flame size={20} strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <div className="text-[17px] font-bold tracking-[-0.01em]" style={display}>
              ZZP&nbsp;Halogeen
            </div>
            <div className="text-[11px]" style={{ color: C.textMute }}>
              Werk · Verificatie · Omzet
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium sm:inline-flex"
            style={{
              background: C.greenBg,
              color: C.green,
              boxShadow: `0 0 0 1px ${withA(C.green, 0.25)}`,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
            style={{
              background: C.raised,
              color: C.amber,
              border: `1px solid ${C.line}`,
              ...haloSoft(C.amber),
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher */}
      <nav
        className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                on
                  ? {
                      background: `linear-gradient(140deg, ${C.amber}, ${C.peach})`,
                      color: C.base,
                      ...haloSoft(C.amber),
                      ["--tw-ring-color" as string]: C.amber,
                      ["--tw-ring-offset-color" as string]: C.base,
                    }
                  : {
                      background: C.raised,
                      color: C.textSoft,
                      border: `1px solid ${C.line}`,
                      ["--tw-ring-color" as string]: C.amber,
                      ["--tw-ring-offset-color" as string]: C.base,
                    }
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onActies={() => setScreen("acties")}
            onBerichten={() => setScreen("berichten")}
          />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
        {screen === "berichten" && <Berichten />}
      </main>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onBerichten,
}: {
  onOpen: () => void;
  onActies: () => void;
  onBerichten: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="space-y-6">
      {/* Hero — gloeiende halo */}
      <Panel bg={C.panel} className="overflow-hidden" glowColor={C.amber}>
        <div
          className="relative p-6 sm:p-8"
          style={{
            backgroundImage: `radial-gradient(600px 300px at 90% -20%, ${withA(C.amber, 0.16)}, transparent 60%)`,
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: C.amberBg, color: C.amber }}
          >
            <Flame size={12} strokeWidth={2.6} aria-hidden="true" /> Bulletin · {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[36px]"
            style={display}
          >
            Drie matches gloeien boven 85%. <span style={{ color: C.amber }}>De omzet stijgt.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
            Eén taak vraagt aandacht: je VOG verloopt binnenkort. Handel het af en blijf
            verifieerbaar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(140deg, ${C.amber}, ${C.peach})`,
                color: C.base,
                ...haloSoft(C.amber),
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              Bekijk matches <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: C.raised,
                color: C.text,
                border: `1px solid ${C.line}`,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              <AlertTriangle
                size={15}
                strokeWidth={2.4}
                style={{ color: C.peach }}
                aria-hidden="true"
              />
              Los actie op
            </button>
          </div>
        </div>
      </Panel>

      {/* KPI-rij */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel
            key={k.label}
            interactive
            className="group p-4 hover:-translate-y-0.5"
            bg={C.panel}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: C.textMute }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: k.up ? C.amberBg : C.peachBg,
                  color: k.up ? C.amber : C.peach,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowRight size={11} className="rotate-90" aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.text }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <SectionHead icon={Star}>Aanbevolen matches</SectionHead>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id} as="li" interactive className="list-none overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-stretch text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.amber }}
                >
                  <span
                    className="flex w-[70px] shrink-0 flex-col items-center justify-center gap-0.5"
                    style={{
                      background: withA(matchGlow(o.match), 0.1),
                      borderRight: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[20px] font-bold leading-none"
                      style={{ ...display, color: matchGlow(o.match) }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[9px] font-medium uppercase tracking-wide"
                      style={{ color: C.textMute }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15px] font-semibold tracking-[-0.01em]"
                          style={{ color: C.text }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ color: C.textMute }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.amber }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            background: C.raised,
                            color: C.textSoft,
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.8}
                            style={{ color: C.green }}
                            aria-hidden="true"
                          />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Panel>
            ))}
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-4">
          <SectionHead icon={ShieldCheck}>Vertrouwen</SectionHead>
          <Panel className="p-5" glowColor={C.amber}>
            <div className="flex items-center gap-4">
              <GlowRing value={dek} />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: C.text }}>
                  Certificaatdekking
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.textMute }}>
                  {verified}/{CREDENTIALS.length} geverifieerd
                </div>
                <div className="mt-2">
                  <StatusTag status="VERIFIED" />
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden p-5" glowColor={C.peach}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10.5px] font-semibold"
              style={{ background: C.peachBg, color: C.peach }}
            >
              <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
            </span>
            <h3 className="mt-2.5 text-[16px] font-semibold leading-snug" style={{ color: C.text }}>
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.textMute }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(140deg, ${C.peach}, ${C.amberDeep})`,
                color: C.base,
                ["--tw-ring-color" as string]: C.peach,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Panel>

          <button
            onClick={onBerichten}
            className="flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-[#262019] focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              ["--tw-ring-color" as string]: C.amber,
            }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: C.amberBg, color: C.amber }}
              aria-hidden="true"
            >
              <Inbox size={18} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold" style={{ color: C.text }}>
                Berichten
              </div>
              <div className="text-[12px]" style={{ color: C.textMute }}>
                {ongelezen} ongelezen
              </div>
            </div>
            <ChevronRight size={18} style={{ color: C.textMute }} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: C.amberBg, color: C.amber }}
        aria-hidden="true"
      >
        <Icon size={15} strokeWidth={2.4} />
      </span>
      <h2
        className="text-[13px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: C.textSoft }}
      >
        {children}
      </h2>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead icon={Search}>Marktplaats · open opdrachten</SectionHead>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={15} style={{ color: C.textMute }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-52 bg-transparent text-[12.5px] outline-none placeholder:opacity-60"
            style={{ color: C.text }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel
          className="flex flex-col items-center justify-center gap-3 p-14 text-center"
          glowColor={C.amber}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.amberBg, color: C.amber, ...haloSoft(C.amber) }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="text-[18px] font-semibold" style={{ ...display, color: C.text }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.textMute }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(140deg, ${C.amber}, ${C.peach})`,
              color: C.base,
              ["--tw-ring-color" as string]: C.amber,
              ["--tw-ring-offset-color" as string]: C.base,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel
              key={o.id}
              interactive
              className="flex flex-col overflow-hidden hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-semibold leading-snug tracking-[-0.01em]"
                    style={{ color: C.text }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.textMute }}>
                    {o.opdrachtgever}
                  </p>
                </div>
                <span
                  className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
                  style={{
                    background: withA(matchGlow(o.match), 0.12),
                    color: matchGlow(o.match),
                    ...haloSoft(matchGlow(o.match)),
                  }}
                  aria-hidden="true"
                >
                  <span className="text-[15px] font-bold leading-none" style={display}>
                    {o.match}
                  </span>
                  <span className="text-[8px] font-medium uppercase">match</span>
                </span>
              </div>
              <div className="px-4 pb-3">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        background: C.raised,
                        color: C.textSoft,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  background: C.raised,
                  color: C.amber,
                  borderTop: `1px solid ${C.line}`,
                  ["--tw-ring-color" as string]: C.amber,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.textSoft }}>
      <Icon size={13} strokeWidth={2.2} style={{ color: C.amber }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#262019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          background: C.panel,
          color: C.textSoft,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.amber,
          ["--tw-ring-offset-color" as string]: C.base,
        }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <Panel className="overflow-hidden" glowColor={C.amber}>
        <div
          className="relative p-6 sm:p-8"
          style={{
            backgroundImage: `radial-gradient(500px 260px at 88% -30%, ${withA(C.amber, 0.15)}, transparent 60%)`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="min-w-0">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: C.amberBg, color: C.amber }}
              >
                {opdracht.id}
              </span>
              <h1
                className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[34px]"
                style={display}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-2 text-[14px]" style={{ color: C.textSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <div
              className="flex flex-col items-center"
              style={{ ...haloSoft(matchGlow(opdracht.match)) }}
            >
              <span
                className="text-[48px] font-bold leading-none"
                style={{ ...display, color: matchGlow(opdracht.match) }}
              >
                {opdracht.match}
              </span>
              <span
                className="text-[11px] font-medium uppercase tracking-wide"
                style={{ color: C.textMute }}
              >
                % match
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} interactive className="p-4 hover:-translate-y-0.5">
            <f.Icon size={16} strokeWidth={2.2} style={{ color: C.amber }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-bold leading-none"
              style={{ ...display, color: C.text }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ color: C.textMute }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <SectionHead icon={Check}>Waarom dit past</SectionHead>
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.textSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.greenBg, color: C.green }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-3">
          <SectionHead icon={AlertTriangle}>Om te overwegen</SectionHead>
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.textSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.peachBg, color: C.peach }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={11} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(140deg, ${C.amber}, ${C.peach})`,
            color: C.base,
            ...haloSoft(C.amber),
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#262019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.panel,
            color: C.text,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          <Star size={15} strokeWidth={2.2} style={{ color: C.amber }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead icon={ShieldCheck}>Verificatie &amp; certificaten</SectionHead>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(140deg, ${C.amber}, ${C.peach})`,
            color: C.base,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Panel className="flex flex-wrap items-center justify-between gap-5 p-6" glowColor={C.amber}>
        <div className="flex items-center gap-5">
          <GlowRing value={dek} size={90} />
          <div className="max-w-xs">
            <div className="text-[16px] font-bold" style={{ ...display, color: C.text }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.textMute }}>
              Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
              vertrouwen.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold"
          style={{
            background: C.greenBg,
            color: C.green,
            boxShadow: `0 0 0 1px ${withA(C.green, 0.25)}`,
          }}
        >
          <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel
              key={c.naam}
              interactive
              className="flex items-stretch overflow-hidden hover:-translate-y-0.5"
            >
              <span
                className="flex w-14 shrink-0 items-center justify-center"
                style={{ background: m.bg, borderRight: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div className="truncate text-[14.5px] font-semibold" style={{ color: C.text }}>
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.textMute }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        background: C.raised,
                        color: C.amber,
                        border: `1px solid ${C.line}`,
                        ["--tw-ring-color" as string]: C.amber,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ─────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <div>
        <SectionHead icon={Flame}>Volgende beste acties</SectionHead>
        <p className="mt-2 text-[13px]" style={{ color: C.textMute }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const glow = warn ? C.peach : C.amber;
          return (
            <li key={a.titel}>
              <Panel
                interactive
                className="flex items-stretch overflow-hidden hover:-translate-y-0.5"
                glowColor={warn ? C.peach : undefined}
              >
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[24px] font-bold"
                  style={{ ...display, background: withA(glow, 0.12), color: glow }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: withA(glow, 0.14), color: glow }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.8} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15px] font-semibold tracking-[-0.01em]"
                      style={{ color: C.text }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.textMute }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: warn
                        ? `linear-gradient(140deg, ${C.peach}, ${C.amberDeep})`
                        : C.raised,
                      color: warn ? C.base : C.amber,
                      border: warn ? "none" : `1px solid ${C.line}`,
                      ["--tw-ring-color" as string]: glow,
                      ["--tw-ring-offset-color" as string]: C.panel,
                    }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  type FStatus = { label: string; Icon: LucideIcon; fg: string; bg: string };
  const factMeta = (status: string): FStatus => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.green, bg: C.greenBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.peach, bg: C.peachBg };
    return { label: "Concept", Icon: FileText, fg: C.textMute, bg: C.raised };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead icon={Coins}>Facturen</SectionHead>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(140deg, ${C.amber}, ${C.peach})`,
            color: C.base,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, glow: C.green },
          { l: "Openstaand", v: `${open}`, glow: C.peach },
          { l: "Te factureren", v: "€ 1.350", glow: C.amber },
        ].map((s) => (
          <Panel key={s.l} interactive className="p-4 hover:-translate-y-0.5">
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ color: C.textMute }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[24px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: s.glow }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#262019]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: m.bg, color: m.fg }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold" style={{ color: C.text }}>
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ color: C.textMute }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: m.bg, color: m.fg }}
                >
                  <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...display, color: C.text }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{ background: C.raised, borderTop: `1px solid ${C.line}` }}
        >
          <span
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: C.textMute }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[17px] font-bold tabular-nums"
            style={{ ...display, color: C.amber }}
          >
            {betaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}

// ── Berichten ────────────────────────────────────────────────────────────────────
function Berichten() {
  return (
    <div className="space-y-6">
      <SectionHead icon={Inbox}>Berichten</SectionHead>
      <Panel className="overflow-hidden">
        <ul>
          {BERICHTEN.map((b, i) => (
            <li
              key={b.van}
              className="flex items-start gap-3 p-4 transition-colors hover:bg-[#262019]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  background: b.ongelezen ? C.amberBg : C.raised,
                  color: b.ongelezen ? C.amber : C.textMute,
                  ...(b.ongelezen ? haloSoft(C.amber) : {}),
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-semibold" style={{ color: C.text }}>
                    {b.van}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.textMute }}>
                    {b.tijd}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.textMute }}>
                  {b.preview}
                </p>
              </div>
              {b.ongelezen && (
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.amber, ...haloSoft(C.amber) }}
                  aria-label="Ongelezen"
                />
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
