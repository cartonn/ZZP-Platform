"use client";

// Concept 209 — "Klapbord" · mechanisch split-flap vertrekbord (Solari-bord). 2026-trend: analoge/mechanische
// nostalgie als tegenwicht voor gladde schermen. Statussen, cijfers en labels ogen als omklappende split-flap-
// tegels: donkere tegels met een horizontale scheidingslijn in het midden, condensed mono-letters, een kleine
// schaduw tussen de flaps. Denk luchthaven/station: KPI's, match-percentages en factuurbedragen als flap-displays,
// statusrijen als vertrektabel. Warm amber/wit op antraciet. Flip-animatie via deterministische CSS-keyframe +
// hover — nooit random/Date. Onderscheidt zich van teletekst/scorebord door het echte split-flap-mechaniek: elke
// tegel heeft de middenscheidingslijn en een boven/onder-flap. UI Nederlands; status altijd label + icoon.

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
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Plane,
  Bell,
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

// ── Palet — antraciet-behuizing, warm amber (het klassieke Solari-oranje) + koel wit voor grote cijfers. ──
const C = {
  bg: "#161719", // machinekamer-antraciet
  bgDeep: "#0f1011", // dieper vlak
  rail: "#1e2023", // paneel-rail
  tile: "#232529", // split-flap tegel (bovenkant)
  tileLo: "#1b1d20", // onderkant-flap (iets donkerder → schaduw tussen flaps)
  tileEdge: "#3a3d43", // tegelrand
  panel: "#1c1e21", // kaart-oppervlak
  panelHi: "#26282c",
  line: "#33363b",
  lineSoft: "#26282c",
  ink: "#f4ede0", // warm wit (labeltekst op tegels)
  inkSoft: "#a7a196",
  inkFaint: "#6f6a61",
  amber: "#f2a63b", // Solari-amber accent
  amberDeep: "#c77f1e",
  amberBg: "#3a2a12",
  white: "#f6f4ef", // koel-warm wit voor grote flap-cijfers
  // status
  ok: "#5fd08a",
  okBg: "#16301f",
  wait: "#78b4f0",
  waitBg: "#12253a",
  warn: "#f2a63b",
  warnBg: "#3a2a12",
  bad: "#ef6a5c",
  badBg: "#391917",
};

const displayF = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-geist)" };
const flapF = { fontFamily: "var(--font-lab-plex-mono)" }; // IBM Plex Mono — condensed, mechanisch

// ── Status-model — vorm draagt mee (naast kleur): icoon + label altijd aanwezig. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ ...flapF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Split-flap tegel — één karakter. Donkere tegel met horizontale middenlijn (de flap-naad), boven- en onder-
//    helft met verschillende tint zodat er schaduw "tussen de flaps" ontstaat. Bij hover klapt de bovenflap even
//    om (deterministische CSS transform). Puur decoratief mechaniek; het karakter blijft altijd leesbaar. ──
function Flap({
  ch,
  size = "md",
  tone = "white",
}: {
  ch: string;
  size?: "sm" | "md" | "lg";
  tone?: "white" | "amber";
}) {
  const dim =
    size === "lg"
      ? { w: "clamp(30px,7vw,44px)", h: "clamp(44px,10vw,64px)", fs: "clamp(24px,5.6vw,38px)" }
      : size === "md"
        ? { w: "26px", h: "38px", fs: "24px" }
        : { w: "17px", h: "24px", fs: "15px" };
  const color = tone === "amber" ? C.amber : C.white;
  const isSpace = ch === " ";
  return (
    <span
      className="group/flap relative inline-block shrink-0 overflow-hidden rounded-[4px] align-middle"
      style={{
        width: dim.w,
        height: dim.h,
        background: isSpace ? C.tileLo : C.tile,
        boxShadow: `inset 0 0 0 1px ${C.tileEdge}, 0 1px 0 rgba(0,0,0,0.5)`,
      }}
      aria-hidden="true"
    >
      {/* bovenhelft */}
      <span
        className="absolute inset-x-0 top-0 flex h-1/2 items-end justify-center overflow-hidden"
        style={{ background: C.tile }}
      >
        <span
          className="translate-y-1/2 font-bold tabular-nums leading-none"
          style={{ ...flapF, fontSize: dim.fs, color }}
        >
          {ch}
        </span>
      </span>
      {/* onderhelft (donkerder → schaduw tussen de flaps) */}
      <span
        className="absolute inset-x-0 bottom-0 flex h-1/2 items-start justify-center overflow-hidden"
        style={{ background: C.tileLo }}
      >
        <span
          className="-translate-y-1/2 font-bold tabular-nums leading-none"
          style={{ ...flapF, fontSize: dim.fs, color }}
        >
          {ch}
        </span>
      </span>
      {/* middennaad + zijpennen */}
      <span
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: "rgba(0,0,0,0.65)" }}
      />
      <span
        className="absolute left-0 top-1/2 h-1 w-[3px] -translate-y-1/2 rounded-r-sm"
        style={{ background: C.tileEdge }}
      />
      <span
        className="absolute right-0 top-1/2 h-1 w-[3px] -translate-y-1/2 rounded-l-sm"
        style={{ background: C.tileEdge }}
      />
      {/* omklappende flap bij hover (deterministisch) */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 flex h-1/2 origin-bottom items-end justify-center overflow-hidden opacity-0 transition-[transform,opacity] duration-300 [transform:rotateX(0deg)] group-hover/flap:opacity-100 group-hover/flap:[transform:rotateX(-88deg)]"
        style={{ background: C.tileLo, transformStyle: "preserve-3d" }}
      >
        <span
          className="translate-y-1/2 font-bold tabular-nums leading-none"
          style={{ ...flapF, fontSize: dim.fs, color }}
        >
          {ch}
        </span>
      </span>
    </span>
  );
}

// Rij split-flap tegels uit een string. Splitst per karakter; behoudt spaties als lege tegel.
function FlapRow({
  text,
  size = "md",
  tone = "white",
  className = "",
}: {
  text: string;
  size?: "sm" | "md" | "lg";
  tone?: "white" | "amber";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-[3px] ${className}`}
      style={{ perspective: "260px" }}
      role="text"
    >
      {[...text].map((ch, i) => (
        <Flap key={i} ch={ch === " " ? " " : ch} size={size} tone={tone} />
      ))}
    </span>
  );
}

// Sectie-kop — spoorbord-label: amber-glyph + display-titel + splitlijn.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
        style={{ background: C.amberBg, boxShadow: `inset 0 0 0 1px ${C.amber}44` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} style={{ color: C.amber }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[18px] font-semibold uppercase leading-none tracking-[0.04em]"
          style={{ ...displayF, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.amber}55, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Behuizing-kaart — panelen zitten in een frame met bovenrail.
function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[10px] ${className}`}
      style={{
        background: C.panel,
        boxShadow: `inset 0 0 0 1px ${C.line}, 0 14px 30px -22px rgba(0,0,0,0.8)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept209() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* zachte machinekamer-vignettering */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(90% 60% at 50% 0%, rgba(242,166,59,0.06), transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — als de titelbalk boven een vertrekbord */}
        <header
          className="relative"
          style={{ background: C.bgDeep, boxShadow: `inset 0 -1px 0 ${C.line}` }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px]"
                style={{ background: C.amber, boxShadow: `0 8px 22px -8px ${C.amber}` }}
                aria-hidden="true"
              >
                <Plane size={20} strokeWidth={2.2} style={{ color: C.bgDeep }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...flapF, color: C.amber }}
                >
                  Klapbord
                </div>
                <div
                  className="text-[23px] font-semibold uppercase leading-none tracking-[0.02em]"
                  style={{ ...displayF, color: C.ink }}
                >
                  Vertrekhal
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...flapF, color: C.inkFaint }}
                >
                  Opdrachten · Verificatie · Facturen
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] sm:inline-flex"
                style={{
                  ...flapF,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1px ${C.ok}44`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[6px] text-[12px] font-bold"
                style={{
                  ...flapF,
                  background: C.tile,
                  color: C.amber,
                  boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — spoorlijn-tabs */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-[5px] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...flapF,
                          background: C.amber,
                          color: C.bgDeep,
                          ["--tw-ring-color" as string]: C.amber,
                          ["--tw-ring-offset-color" as string]: C.bgDeep,
                        }
                      : {
                          ...flapF,
                          background: C.tile,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
                          ["--tw-ring-color" as string]: C.amber,
                          ["--tw-ring-offset-color" as string]: C.bgDeep,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

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

        <footer className="relative mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px] uppercase tracking-[0.1em]"
            style={{ ...flapF, borderColor: C.line, color: C.inkFaint }}
          >
            <RefreshCw size={12} aria-hidden="true" /> Elke tegel klapt om als het bord ververst —
            het mechaniek is decor, de status blijft leesbaar.
          </div>
        </footer>
      </div>
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
    <div className="space-y-8">
      {/* Hoofd-vertrekbord — grote flap-titel */}
      <Panel className="relative overflow-hidden" style={{ background: C.bgDeep }}>
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${C.amberDeep}, ${C.amber}, ${C.amberDeep})`,
          }}
          aria-hidden="true"
        />
        <div className="relative p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{
                ...flapF,
                background: C.amberBg,
                color: C.amber,
                boxShadow: `inset 0 0 0 1px ${C.amber}44`,
              }}
            >
              <Star size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <span
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ ...flapF, color: C.inkFaint }}
            >
              Spoor 01 · nu instappen
            </span>
          </div>
          <div className="mt-5">
            <FlapRow text="3 STERKE MATCHES" size="lg" tone="white" />
          </div>
          <p
            className="mt-4 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén tegel knippert amber op het bord: je VOG verloopt binnenkort. Regel het, dan blijft
            je profiel op vertrektijd.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-[6px] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...flapF,
                background: C.amber,
                color: C.bgDeep,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.bgDeep,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-[6px] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...flapF,
                background: C.tile,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.bgDeep,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />
              Los actie op
            </button>
          </div>
        </div>
      </Panel>

      {/* KPI-borden — bedrag/percentage als split-flap display */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...flapF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...flapF,
                  background: k.up ? C.okBg : C.rail,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div className="mt-3">
              <FlapRow text={k.value} size="md" tone={i === 0 ? "amber" : "white"} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Vertrektabel met matches */}
        <section className="space-y-4">
          <SectionHead
            title="Vertrekstaat"
            sub="Aanbevolen opdrachten, op match gerangschikt"
            Icon={Plane}
          />
          <Panel className="overflow-hidden">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  borderTop: i === 0 ? undefined : `1px solid ${C.line}`,
                  ["--tw-ring-color" as string]: C.amber,
                }}
              >
                <FlapRow text={`${o.match}`} size="md" tone="amber" />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[15px] font-semibold"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {o.titel}
                  </div>
                  <div
                    className="mt-0.5 truncate text-[12.5px]"
                    style={{ ...bodyF, color: C.inkSoft }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          ...bodyF,
                          background: C.rail,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                        }}
                      >
                        <Check
                          size={11}
                          strokeWidth={2.6}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />{" "}
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="shrink-0"
                  style={{ color: C.inkFaint }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </Panel>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Panel className="p-5">
            <div className="flex items-center gap-4">
              <FlapRow text={`${dek}%`} size="md" tone="amber" />
              <div className="min-w-0">
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Panel>

          {/* Prioriteit — het knipperende amber-bord */}
          <Panel
            className="relative overflow-hidden"
            style={{ background: C.bgDeep, boxShadow: `inset 0 0 0 1px ${C.amber}66` }}
          >
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...flapF, background: C.amber, color: C.bgDeep }}
              >
                <Bell size={11} strokeWidth={2.4} aria-hidden="true" /> Omroepbericht
              </span>
              <h3
                className="mt-2.5 text-[18px] font-semibold leading-tight"
                style={{ ...displayF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...flapF,
                  background: C.amber,
                  color: C.bgDeep,
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.bgDeep,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek, skeleton-loading, empty- én foutstate ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Aankomsthal" sub="Open opdrachten op het bord" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[6px] px-3.5 py-2"
            style={{ background: C.tile, boxShadow: `inset 0 0 0 1px ${C.tileEdge}` }}
          >
            <Search size={15} style={{ color: C.amber }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Bord verversen"
            className="flex h-10 w-10 items-center justify-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.tile,
              boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
              ["--tw-ring-color" as string]: C.amber,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.amber }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[8px] p-4"
          role="alert"
          style={{ background: C.badBg, boxShadow: `inset 0 0 0 1px ${C.bad}66` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div
              className="text-[14px] font-semibold uppercase tracking-[0.03em]"
              style={{ ...displayF, color: C.ink }}
            >
              Bord kon niet volledig laden
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Sommige vertrektijden ontbreken. Ververs het bord om opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold uppercase focus-visible:outline-none focus-visible:ring-2"
            style={{ ...flapF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-10 w-16 shrink-0 animate-pulse rounded-[4px]"
                  style={{ background: C.rail }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.rail }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[8px]"
            style={{ background: C.amberBg, boxShadow: `inset 0 0 0 1px ${C.amber}44` }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.6} style={{ color: C.amber }} />
          </span>
          <p
            className="text-[18px] font-semibold uppercase tracking-[0.03em]"
            style={{ ...displayF, color: C.ink }}
          >
            Geen vertrek gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets op het bord voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en de tegels klappen
            opnieuw om.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[6px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...flapF,
              background: C.amber,
              color: C.bgDeep,
              ["--tw-ring-color" as string]: C.amber,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 p-4"
                style={{ background: C.bgDeep }}
              >
                <FlapRow text={`${o.match}`} size="sm" tone="amber" />
                <span
                  className="text-[10px] uppercase tracking-[0.1em]"
                  style={{ ...flapF, color: C.inkFaint }}
                >
                  match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[16px] font-semibold leading-tight"
                  style={{ ...displayF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[3px] px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...bodyF,
                        background: C.rail,
                        color: C.inkSoft,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...flapF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.amber,
                  ["--tw-ring-color" as string]: C.amber,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Panel>
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
        className="inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...flapF,
          background: C.tile,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
          ["--tw-ring-color" as string]: C.amber,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar aankomsthal
      </button>

      <Panel className="relative overflow-hidden" style={{ background: C.bgDeep }}>
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${C.amberDeep}, ${C.amber}, ${C.amberDeep})`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-[4px] px-2.5 py-1 text-[11px] font-semibold uppercase"
                style={{
                  ...flapF,
                  background: C.amberBg,
                  color: C.amber,
                  boxShadow: `inset 0 0 0 1px ${C.amber}44`,
                }}
              >
                {opdracht.id}
              </span>
              <span
                className="text-[11px] uppercase tracking-[0.1em]"
                style={{ ...flapF, color: C.inkFaint }}
              >
                Spoor 01 · vertrek {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.06] sm:text-[34px]"
              style={{ ...displayF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="text-center">
            <FlapRow text={`${opdracht.match}%`} size="lg" tone="amber" />
            <div
              className="mt-2 text-[10px] uppercase tracking-[0.14em]"
              style={{ ...flapF, color: C.inkFaint }}
            >
              match-score
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[5px]"
              style={{ background: C.amberBg }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.amber }} />
            </span>
            <div
              className="mt-3 text-[16px] font-semibold tabular-nums leading-none"
              style={{ ...flapF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em]"
              style={{ ...flapF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]"
                    style={{ background: C.okBg }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]"
                    style={{ background: C.warnBg, boxShadow: `inset 0 0 0 1px ${C.warn}44` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-[7px] px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...flapF,
            background: C.amber,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[7px] px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...flapF,
            background: C.tile,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" /> Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...flapF,
            background: C.amber,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Panel className="relative overflow-hidden" style={{ background: C.bgDeep }}>
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <div className="text-center">
            <FlapRow text={`${dek}%`} size="lg" tone="amber" />
            <div
              className="mt-2 text-[10px] uppercase tracking-[0.14em]"
              style={{ ...flapF, color: C.inkFaint }}
            >
              dekking
            </div>
          </div>
          <div className="max-w-sm">
            <div
              className="text-[19px] font-semibold uppercase tracking-[0.02em]"
              style={{ ...displayF, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd certificaat brengt je profiel scherper op het bord. Houd je dekking
              hoog, dan blijf je onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
              style={{
                ...flapF,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}44`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Panel>

      {/* Vertrektabel-stijl statusrijen */}
      <Panel className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr_auto] gap-4 px-4 py-2.5 sm:grid"
          style={{ background: C.bgDeep }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...flapF, color: C.inkFaint }}
          >
            Certificaat
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...flapF, color: C.inkFaint }}
          >
            Status
          </span>
        </div>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <div
              key={c.naam}
              className="flex flex-wrap items-center gap-3.5 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px]"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...displayF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusTag status={c.status} />
                {actionable && (
                  <button
                    className="rounded-[4px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{
                      ...flapF,
                      background: C.tile,
                      color: C.ink,
                      boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
                      ["--tw-ring-color" as string]: C.amber,
                      ["--tw-ring-offset-color" as string]: C.panel,
                    }}
                  >
                    {c.status === "EXPIRING"
                      ? "Vernieuwen"
                      : c.status === "REJECTED"
                        ? "Opnieuw"
                        : "Bekijk"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Panel>
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
      <SectionHead
        title="Omroepberichten"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Bell}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.warn : C.wait }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] text-[16px] font-semibold tabular-nums"
                    style={
                      warn
                        ? {
                            ...flapF,
                            background: C.warnBg,
                            color: C.warn,
                            boxShadow: `inset 0 0 0 1px ${C.warn}55`,
                          }
                        : {
                            ...flapF,
                            background: C.tile,
                            color: C.wait,
                            boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? {
                                ...flapF,
                                background: C.warnBg,
                                color: C.warn,
                                boxShadow: `inset 0 0 0 1px ${C.warn}55`,
                              }
                            : {
                                ...flapF,
                                background: C.waitBg,
                                color: C.wait,
                                boxShadow: `inset 0 0 0 1px ${C.wait}44`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[16px] font-semibold"
                        style={{ ...displayF, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...flapF,
                              background: C.warn,
                              color: C.bgDeep,
                              ["--tw-ring-color" as string]: C.warn,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                          : {
                              ...flapF,
                              background: C.tile,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
                              ["--tw-ring-color" as string]: C.amber,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Panel className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] text-[11px] font-bold"
                style={{
                  ...flapF,
                  background: C.tile,
                  color: C.amber,
                  boxShadow: `inset 0 0 0 1px ${C.tileEdge}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.amber }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...flapF, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.rail };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Kasbord" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...flapF,
            background: C.amber,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, tone: "amber" as const },
          { l: "Openstaand", v: `${open}`, tone: "white" as const },
          { l: "Te factureren", v: "€ 1.350", tone: "white" as const },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.06em]"
              style={{ ...flapF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div className="mt-3">
              <FlapRow text={s.v} size="md" tone={s.tone} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...flapF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...flapF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...flapF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
                        style={{
                          ...flapF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1px ${m.fg}44`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...flapF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.amber }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...flapF, color: C.bgDeep }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...flapF, color: C.bgDeep }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
