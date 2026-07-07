"use client";

// Concept 160 — "Bouwplaats" · hi-vis werkplaats/PPE-esthetiek. Signaalgeel (#f5d800 / #ffe14d) +
// zwart, hazard-diagonaalstrepen (repeating-linear-gradient) als accentranden, stencil/industriële
// koppen, robuuste blokken en veiligheids-iconografie. Past bij ZZP-veldwerk (zorg/bouw/techniek),
// maar blijft strak en functioneel voor SaaS — niet rommelig. Onderscheidend van neon/scorebord:
// dit is INDUSTRIEEL HI-VIS VEILIGHEID (mat signaalgeel op zwart, geen gloed). Status nooit
// kleur-alleen: altijd label + icoon. Deterministisch — geen random/Date. UI-taal Nederlands.
// Fonts: Space Grotesk (stencil-display) + JetBrains Mono (data/labels).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  HardHat,
  Construction,
  Wrench,
  TriangleAlert,
  Cone,
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

// ── Palet — hi-vis: signaalgeel op zwart, mat (geen gloed) ───────────────────────
const C = {
  hi: "#f5d800",
  hiBright: "#ffe14d",
  hiDeep: "#d9be00",
  ink: "#0d0d0d",
  inkSoft: "#232323",
  steel: "#3c4046",
  steelSoft: "#5c626b",
  concrete: "#f1efe8",
  concreteDeep: "#e5e2d8",
  paper: "#ffffff",
  line: "#0d0d0d",
  ok: "#1f9d55",
  okSoft: "#e2f4e9",
  warn: "#c26a00",
  warnSoft: "#fbeed6",
  danger: "#cf1f26",
  dangerSoft: "#fbe4e5",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Hazard-diagonaalstrepen — het kern-motief (accentranden / waarschuwzones).
const hazard = `repeating-linear-gradient(45deg, ${C.ink} 0 10px, ${C.hi} 10px 20px)`;
const hazardThin = `repeating-linear-gradient(45deg, ${C.ink} 0 6px, ${C.hi} 6px 12px)`;

// Robuuste offset-schaduw (industrieel blok-gevoel).
const blockShadow = { boxShadow: `5px 5px 0 ${C.ink}` };
const blockShadowSm = { boxShadow: `3px 3px 0 ${C.ink}` };

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; border: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.white, bg: C.ok, border: C.ink };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.ink, bg: C.concreteDeep, border: C.ink };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.ink,
        bg: C.hi,
        border: C.ink,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.white, bg: C.danger, border: C.ink };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{ ...mono, background: m.bg, color: m.fg, border: `2px solid ${m.border}` }}
    >
      <m.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Hazard-rand (dunne diagonaalstreep-strip) — accentmarkering.
function HazardStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-2 w-full ${className}`}
      style={{ background: hazardThin }}
      aria-hidden="true"
    />
  );
}

// Robuust blok met dikke zwarte rand + harde schaduw.
function Block({
  children,
  className = "",
  bg = C.paper,
  shadow = blockShadow,
  interactive = false,
  as = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  shadow?: React.CSSProperties;
  interactive?: boolean;
  as?: "div" | "li";
  style?: React.CSSProperties;
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative ${interactive ? "transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5" : ""} ${className}`}
      style={{ background: bg, border: `2.5px solid ${C.ink}`, ...shadow, ...style }}
    >
      {children}
    </Tag>
  );
}

// Stencil-sectiekop — genummerd bordje + industriële titel.
function Sign({
  num,
  children,
  Icon,
}: {
  num: string;
  children: React.ReactNode;
  Icon: LucideIcon;
}) {
  return (
    <div className="flex items-stretch" style={blockShadowSm}>
      <span
        className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold tabular-nums"
        style={{ ...mono, background: C.ink, color: C.hi, borderRight: `2.5px solid ${C.ink}` }}
      >
        <Icon size={15} strokeWidth={2.6} aria-hidden="true" /> {num}
      </span>
      <h2
        className="flex flex-1 items-center px-4 py-2 text-[15px] font-extrabold uppercase tracking-[0.02em]"
        style={{
          ...display,
          background: C.hi,
          color: C.ink,
          border: `2.5px solid ${C.ink}`,
          borderLeft: "none",
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2.4} style={{ color: C.ink }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-badge tint (label+kleur, nooit kleur-alleen; cijfer draagt zelf de betekenis).
function matchBg(m: number): string {
  return m >= 90 ? C.hi : m >= 84 ? C.hiBright : C.concreteDeep;
}

// Mini staaf-diagram — robuuste blokken.
function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.hi : C.ink,
            border: `1.5px solid ${C.ink}`,
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept160() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...display, background: C.concrete, color: C.ink }}
    >
      {/* Bovenrand — hazard-strook als terreinafzetting */}
      <HazardStrip />

      {/* Kop — bouwplaats-bord */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8"
        style={{ background: C.ink }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center"
            style={{ background: C.hi, border: `2.5px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <HardHat size={22} strokeWidth={2.4} style={{ color: C.ink }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[19px] font-extrabold uppercase tracking-[0.04em]"
              style={{ color: C.hi }}
            >
              Bouwplaats
            </div>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.steelSoft }}
            >
              Werk · Verificatie · Omzet
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] sm:inline-flex"
            style={{ ...mono, background: C.hi, color: C.ink, border: `2px solid ${C.ink}` }}
          >
            <ShieldCheck size={13} strokeWidth={2.8} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center text-[12px] font-extrabold"
            style={{ ...mono, background: C.hi, color: C.ink, border: `2.5px solid ${C.hi}` }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher — robuuste keuzeblokken */}
      <nav
        className="flex items-center gap-0 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ background: C.ink, borderTop: `2px solid ${C.steel}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={
                on
                  ? {
                      ...mono,
                      color: C.ink,
                      background: C.hi,
                      border: `2px solid ${C.ink}`,
                      marginLeft: i === 0 ? 0 : -2,
                      ["--tw-ring-color" as string]: C.ink,
                    }
                  : {
                      ...mono,
                      color: C.hi,
                      background: "transparent",
                      border: `2px solid ${C.steel}`,
                      marginLeft: i === 0 ? 0 : -2,
                      ["--tw-ring-color" as string]: C.hi,
                    }
              }
            >
              {String(i + 1).padStart(2, "0")} {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-6">
      {/* Hero — bouwbord met hazard-hoek */}
      <Block bg={C.hi} className="overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <span
            className="pointer-events-none absolute -right-6 -top-6 hidden h-32 w-32 sm:block"
            style={{ background: hazard, opacity: 0.9, transform: "rotate(0deg)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.ink, color: C.hi }}
            >
              <Cone size={12} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 text-[28px] font-extrabold uppercase leading-[1.0] tracking-[-0.01em] sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              Drie matches boven&nbsp;85%. De omzet stijgt.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14px] font-medium leading-relaxed"
              style={{ color: C.inkSoft }}
            >
              Eén taak vraagt actie: je VOG verloopt binnenkort. Handel het af en blijf
              verifieerbaar op de werkvloer.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: C.ink,
                  color: C.hi,
                  ["--tw-ring-color" as string]: C.ink,
                }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: C.white,
                  color: C.ink,
                  border: `2.5px solid ${C.ink}`,
                  ["--tw-ring-color" as string]: C.ink,
                }}
              >
                <TriangleAlert size={15} strokeWidth={2.6} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
        </div>
      </Block>

      {/* KPI-blokken */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Block key={k.label} interactive shadow={blockShadowSm} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.steel }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{ ...mono, background: k.up ? C.ink : C.warn, color: k.up ? C.hi : C.white }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Bars data={k.spark} />
            </div>
          </Block>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <Sign num="A" Icon={Star}>
            Aanbevolen matches
          </Sign>
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => (
              <Block key={o.id} interactive shadow={blockShadowSm} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.ink }}
                >
                  <span
                    className="flex w-16 shrink-0 flex-col items-center justify-center"
                    style={{ background: matchBg(o.match), borderRight: `2.5px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[20px] font-extrabold leading-none"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="mt-0.5 text-[9px] font-bold uppercase"
                      style={{ ...mono, color: C.ink }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15px] font-extrabold uppercase tracking-[-0.01em]"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px] font-medium"
                          style={{ color: C.steel }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ArrowRight
                        size={18}
                        className="mt-1 shrink-0"
                        style={{ color: C.ink }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.02em]"
                          style={{
                            ...mono,
                            background: C.concreteDeep,
                            color: C.ink,
                            border: `1.5px solid ${C.ink}`,
                          }}
                        >
                          <Check size={11} strokeWidth={3} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Block>
            ))}
          </div>
        </div>

        {/* Rechterkolom: dekking + prioriteit */}
        <div className="space-y-4">
          <Sign num="B" Icon={ShieldCheck}>
            Status
          </Sign>
          <Block shadow={blockShadowSm} className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[52px] font-extrabold leading-none tracking-[-0.03em]"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[22px]">%</span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[12.5px] font-medium" style={{ color: C.steel }}>
              Dekking certificaten · {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <div
              className="mt-3 h-4 w-full"
              style={{ background: C.concreteDeep, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <div className="h-full" style={{ width: `${dek}%`, background: hazardThin }} />
            </div>
          </Block>

          <Block
            bg={C.ink}
            shadow={{ boxShadow: `5px 5px 0 ${C.hi}` }}
            className="overflow-hidden p-5"
          >
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, background: C.hi, color: C.ink }}
            >
              <TriangleAlert size={12} strokeWidth={2.8} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[17px] font-extrabold uppercase leading-tight"
              style={{ ...display, color: C.hi }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] font-medium leading-relaxed"
              style={{ color: C.steelSoft }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                background: C.hi,
                color: C.ink,
                ["--tw-ring-color" as string]: C.hi,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Block>
        </div>
      </div>
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
        <Sign num="02" Icon={Construction}>
          Marktplaats · open opdrachten
        </Sign>
        <Block shadow={blockShadowSm} className="flex items-center gap-2 px-3 py-1.5">
          <Search size={16} style={{ color: C.steel }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK…"
            aria-label="Opdrachten zoeken"
            className="w-40 bg-transparent py-1 text-[12px] font-bold uppercase tracking-[0.04em] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.ink }}
          />
        </Block>
      </div>

      {filtered.length === 0 ? (
        <Block className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ background: C.hi, border: `2.5px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.ink }} />
          </span>
          <p className="text-[18px] font-extrabold uppercase" style={{ ...display, color: C.ink }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px] font-medium" style={{ color: C.steel }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              background: C.ink,
              color: C.hi,
              ["--tw-ring-color" as string]: C.ink,
            }}
          >
            Zoekterm wissen
          </button>
        </Block>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Block key={o.id} interactive shadow={blockShadowSm} className="flex flex-col">
              <div className="flex items-stretch">
                <span
                  className="flex w-14 shrink-0 flex-col items-center justify-center"
                  style={{ background: matchBg(o.match), borderRight: `2.5px solid ${C.ink}` }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[17px] font-extrabold leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.match}
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase"
                    style={{ ...mono, color: C.ink }}
                  >
                    match
                  </span>
                </span>
                <div className="min-w-0 flex-1 p-4">
                  <h3
                    className="text-[15px] font-extrabold uppercase leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12px] font-medium" style={{ color: C.steel }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="border-t-[2.5px] p-4" style={{ borderColor: C.ink }}>
                <dl className="grid grid-cols-2 gap-y-2 text-[12px] font-medium">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.02em]"
                      style={{
                        ...mono,
                        background: C.concreteDeep,
                        color: C.ink,
                        border: `1.5px solid ${C.ink}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 border-t-[2.5px] py-3 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors hover:bg-[#d9be00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...mono,
                  background: C.hi,
                  color: C.ink,
                  borderColor: C.ink,
                  ["--tw-ring-color" as string]: C.ink,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Block>
          ))}
        </div>
      )}
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors hover:bg-[#e5e2d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          background: C.paper,
          color: C.ink,
          border: `2.5px solid ${C.ink}`,
          ["--tw-ring-color" as string]: C.ink,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug
      </button>

      <Block bg={C.ink} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.hi, color: C.ink }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-extrabold uppercase leading-[1.0] tracking-[-0.01em] sm:text-[36px]"
              style={{ ...display, color: C.hi }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px] font-medium" style={{ color: C.steelSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center px-4"
            style={{ borderLeft: `3px solid ${C.hi}` }}
          >
            <span
              className="text-[52px] font-extrabold leading-none"
              style={{ ...display, color: C.hi }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.hi }}
            >
              % match
            </span>
          </div>
        </div>
      </Block>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {feiten.map((f) => (
          <Block key={f.l} interactive shadow={blockShadowSm} className="p-4">
            <f.Icon size={16} strokeWidth={2.6} style={{ color: C.ink }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-extrabold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.steel }}
            >
              {f.l}
            </div>
          </Block>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Sign num="+" Icon={Check}>
            Waarom dit past
          </Sign>
          <Block shadow={blockShadowSm} className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.ok, border: `2px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.white }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </div>
        <div className="space-y-4">
          <Sign num="!" Icon={TriangleAlert}>
            Om te overwegen
          </Sign>
          <Block shadow={blockShadowSm} className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.hi, border: `2px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={3} style={{ color: C.ink }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.hi,
            color: C.ink,
            ...blockShadow,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.paper,
            color: C.ink,
            border: `2.5px solid ${C.ink}`,
            ...blockShadowSm,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          <Star size={15} strokeWidth={2.6} aria-hidden="true" /> Bewaar
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
        <Sign num="04" Icon={ShieldCheck}>
          Verificatie &amp; certificaten
        </Sign>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.ink,
            color: C.hi,
            ...blockShadowSm,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Block bg={C.hi} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-5">
            <div
              className="text-[56px] font-extrabold leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.ink }}
            >
              {dek}
              <span className="text-[24px]">%</span>
            </div>
            <div className="max-w-xs">
              <div
                className="text-[16px] font-extrabold uppercase"
                style={{ ...display, color: C.ink }}
              >
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p
                className="mt-1 text-[12.5px] font-medium leading-snug"
                style={{ color: C.inkSoft }}
              >
                Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
                vertrouwen op de werkvloer.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.04em]"
            style={{ ...mono, background: C.ink, color: C.hi }}
          >
            <ShieldCheck size={14} strokeWidth={2.8} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Block>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Block
              key={c.naam}
              interactive
              shadow={blockShadowSm}
              className="flex items-stretch overflow-hidden"
            >
              <span
                className="flex w-12 shrink-0 items-center justify-center"
                style={{ background: m.bg, borderRight: `2.5px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.6} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[14.5px] font-extrabold uppercase tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px] font-medium" style={{ color: C.steel }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] transition-colors hover:bg-[#d9be00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...mono,
                        background: C.hi,
                        color: C.ink,
                        border: `2px solid ${C.ink}`,
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
            </Block>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <div>
        <Sign num="05" Icon={Wrench}>
          Volgende beste acties
        </Sign>
        <p className="mt-2 px-1 text-[13px] font-medium" style={{ color: C.steel }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>
      <ol className="space-y-5">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Block
                interactive
                shadow={blockShadowSm}
                bg={warn ? C.ink : C.paper}
                className="flex items-stretch overflow-hidden"
              >
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[30px] font-extrabold"
                  style={{
                    ...display,
                    background: warn ? hazard : C.concreteDeep,
                    color: C.ink,
                    borderRight: `2.5px solid ${C.ink}`,
                  }}
                  aria-hidden="true"
                >
                  {!warn && i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        background: warn ? C.hi : C.ink,
                        color: warn ? C.ink : C.hi,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.8} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15.5px] font-extrabold uppercase tracking-[-0.01em]"
                      style={{ ...display, color: warn ? C.hi : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] font-medium leading-relaxed"
                    style={{ color: warn ? C.steelSoft : C.steel }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: C.hi,
                            color: C.ink,
                            ["--tw-ring-color" as string]: C.hi,
                          }
                        : {
                            ...mono,
                            background: C.ink,
                            color: C.hi,
                            ["--tw-ring-color" as string]: C.ink,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Block>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.white, bg: C.ok, border: C.ink };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.ink, bg: C.hi, border: C.ink };
    return { label: "Concept", Icon: FileText, fg: C.ink, bg: C.concreteDeep, border: C.ink };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Sign num="06" Icon={FileText}>
          Facturen
        </Sign>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.hi,
            color: C.ink,
            ...blockShadowSm,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, bg: C.ink, fg: C.hi },
          { l: "Openstaand", v: `${open}`, bg: C.hi, fg: C.ink },
          { l: "Te factureren", v: "€ 1.350", bg: C.paper, fg: C.ink },
        ].map((s) => (
          <Block key={s.l} interactive shadow={blockShadowSm} bg={s.bg} className="p-4">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: s.fg, opacity: 0.85 }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: s.fg }}
            >
              {s.v}
            </div>
          </Block>
        ))}
      </div>

      <Block className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#e5e2d8]"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${C.ink}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ background: m.bg, border: `2px solid ${m.border}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.6} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-extrabold uppercase tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: C.steel }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
                  style={{
                    ...mono,
                    background: m.bg,
                    color: m.fg,
                    border: `2px solid ${m.border}`,
                  }}
                >
                  <m.Icon size={12} strokeWidth={2.8} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[16px] font-extrabold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{ background: C.ink, borderTop: `2.5px solid ${C.ink}` }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.steelSoft }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-extrabold tabular-nums"
            style={{ ...display, color: C.hi }}
          >
            {betaald}
          </span>
        </div>
      </Block>
    </div>
  );
}
