"use client";

// Concept 216 — "Cassette" · retro hi-fi analoog paneel. 2026-trend: analoge/mechanische nostalgie,
// skeuomorf-refined, segment/VU-meter datavisualisatie. Een tastbaar audio-apparaat: donker geborsteld
// paneel, cassette-label-stroken, VU-meter-balkjes (horizontale segment-meters voor KPI's/matchpercentage),
// geribbelde knoppen-esthetiek, warm amber displaylicht. Analoge nostalgie als datataal (VU-meters =
// voortgang/score). Onderscheidt zich van split-flap/console door de hi-fi/tape-taal. Segment-meters via
// flex-rijtjes van gekleurde blokjes, deterministisch afgeleid van de mock-waarden — geen animatie/random.
// Fonts: Space Grotesk + IBM Plex Mono. UI Nederlands. Deterministisch (geen random/Date).

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
  Radio,
  Disc3,
  AudioLines,
  MessageSquare,
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

// ── Palet — donker geborsteld paneel, amber displaylicht, VU-groen/rood. ──
const C = {
  bg: "#1c1a17", // apparaat-behuizing
  bgDeep: "#171512", // diepste schaduw
  panel: "#26231e", // geborsteld frontpaneel
  panelHi: "#2f2b25", // opgetild paneel
  panelSoft: "#221f1a", // ingezonken vlak
  ink: "#ece4d6", // warm ivoor label
  inkSoft: "#b3a892", // secundair
  inkFaint: "#7d7565", // gegraveerde tekst
  line: "#3a352d", // paneelnaad
  lineStrong: "#4a443a", // sterkere naad
  amber: "#e8a13c", // amber-display
  amberDeep: "#c07e21",
  amberBg: "#3a2c18", // amber displayvlak
  vuGreen: "#6fbf73", // VU-groen
  vuGreenDim: "#2f4a33",
  vuAmber: "#e8a13c",
  vuAmberDim: "#4a3a1f",
  vuRed: "#d9553b", // VU-rood
  vuRedDim: "#4a281f",
  // status — op donker, altijd label + icoon
  ok: "#6fbf73",
  okBg: "#233127",
  wait: "#69a7d6",
  waitBg: "#22303c",
  warn: "#e8a13c",
  warnBg: "#3a2c18",
  bad: "#e06a52",
  badBg: "#3a231d",
};

const headF = { fontFamily: "var(--font-lab-space)" }; // Space Grotesk — apparaat-koppen
const monoF = { fontFamily: "var(--font-lab-plex-mono)" }; // IBM Plex Mono — displays/labels

// Geborsteld-metaal achtergrond — fijne verticale lijntjes, subtiel. Puur inline gradient.
const brushed = {
  backgroundImage: `repeating-linear-gradient(90deg, #ffffff05 0 1px, transparent 1px 3px)`,
};

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
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
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[11px] font-medium uppercase tracking-[0.04em]"
      style={{ ...monoF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
    >
      <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// VU-meter — horizontale rij segment-blokjes. Deterministisch: aantal opgelicht = round(pct/100*total).
// Laatste segmenten kleuren amber→rood, zoals een echte VU-meter. Puur presentationeel (aria-hidden;
// het cijfer staat als leesbare tekst ernaast).
function VuMeter({
  pct,
  total = 16,
  className = "",
}: {
  pct: number;
  total?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const lit = Math.round((clamped / 100) * total);
  const seg = (i: number) => {
    const isRed = i >= total - 3;
    const isAmber = i >= total - 6 && i < total - 3;
    const on = i < lit;
    if (!on) return isRed ? C.vuRedDim : isAmber ? C.vuAmberDim : C.vuGreenDim;
    return isRed ? C.vuRed : isAmber ? C.vuAmber : C.vuGreen;
  };
  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-3 flex-1 rounded-[1px]"
          style={{
            background: seg(i),
            boxShadow: i < lit ? `0 0 5px ${seg(i)}88` : "none",
          }}
        />
      ))}
    </div>
  );
}

// Vertikale VU-kolom — voor sparklines/KPI's. Deterministisch uit mock-spark.
function VuColumns({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  return (
    <div className="mt-3 flex items-end gap-[3px]" style={{ height: 26 }} aria-hidden="true">
      {data.map((d, i) => {
        const hpct = 20 + ((d - min) / span) * 80;
        const hot = i === data.length - 1;
        return (
          <span
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${hpct}%`,
              background: hot ? C.amber : C.vuGreen,
              boxShadow: hot ? `0 0 6px ${C.amber}77` : "none",
              opacity: hot ? 1 : 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

// Frontpaneel — geborsteld donker vlak met naad-rand en zachte binnenschaduw.
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
      className={`rounded-[8px] ${className}`}
      style={{
        background: C.panel,
        ...brushed,
        boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 1px 0 ${C.lineStrong}, 0 2px 6px ${C.bgDeep}88`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Cassette-labelstrook — ivoren strook met twee lijnen, zoals een tape-inlay.
function TapeLabel({ a, b }: { a: string; b: string }) {
  return (
    <div
      className="rounded-[4px] px-3 py-2"
      style={{ background: C.ink, boxShadow: `inset 0 0 0 2px ${C.amberDeep}` }}
    >
      <div
        className="text-[9px] font-semibold uppercase tracking-[0.24em]"
        style={{ ...monoF, color: C.amberDeep }}
      >
        {a}
      </div>
      <div className="text-[13px] font-semibold leading-tight" style={{ ...headF, color: C.bg }}>
        {b}
      </div>
    </div>
  );
}

// Amber-display cijfer — gloeiend, mono, zoals een LED-uitlezing.
function Display({ value, big = false }: { value: string; big?: boolean }) {
  return (
    <span
      className={`${big ? "text-[30px]" : "text-[22px]"} font-semibold tabular-nums leading-none`}
      style={{ ...monoF, color: C.amber, textShadow: `0 0 12px ${C.amber}55` }}
    >
      {value}
    </span>
  );
}

// Sectie-kop — apparaat-glyph in ingezonken vlak + gegraveerde titel.
function SectionHead({ kicker, title, Icon }: { kicker: string; title: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[7px]"
        style={{
          background: C.panelSoft,
          boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 1px 2px ${C.bgDeep}`,
        }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={1.9} style={{ color: C.amber }} />
      </span>
      <div className="min-w-0">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...monoF, color: C.inkFaint }}
        >
          {kicker}
        </div>
        <h2 className="text-[19px] font-semibold leading-tight" style={{ ...headF, color: C.ink }}>
          {title}
        </h2>
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.amber }} aria-hidden="true" />
      <span className="truncate" style={monoF}>
        {value}
      </span>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept216() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...headF, background: C.bg, color: C.ink }}
    >
      {/* apparaat-vignet — zachte donkere hoeken */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 90% at 50% 0%, transparent 55%, ${C.bgDeep} 100%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <header
          className="relative"
          style={{ background: C.bgDeep, boxShadow: `inset 0 -1px 0 ${C.line}` }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px]"
                style={{ background: C.amberBg, boxShadow: `inset 0 0 0 1.5px ${C.amberDeep}` }}
                aria-hidden="true"
              >
                <Disc3 size={22} strokeWidth={1.9} style={{ color: C.amber }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ ...monoF, color: C.amberDeep }}
                >
                  Hi-Fi Deck
                </div>
                <div
                  className="text-[23px] font-semibold leading-none"
                  style={{ ...headF, color: C.ink }}
                >
                  Cassette
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  Opdrachten · Verificatie · Facturen
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.04em] sm:inline-flex"
                style={{
                  ...monoF,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1px ${C.ok}44`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[7px] text-[12px] font-semibold"
                style={{
                  ...monoF,
                  background: C.amberBg,
                  color: C.amber,
                  boxShadow: `inset 0 0 0 1.5px ${C.amberDeep}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Transport-knoppen als tabs (geribbeld-esthetiek) */}
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
                  className="flex shrink-0 items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...monoF,
                    background: on ? C.amberBg : C.panel,
                    color: on ? C.amber : C.inkSoft,
                    boxShadow: on
                      ? `inset 0 0 0 1.5px ${C.amberDeep}`
                      : `inset 0 0 0 1px ${C.line}`,
                    ["--tw-ring-color" as string]: C.amber,
                    ["--tw-ring-offset-color" as string]: C.bgDeep,
                  }}
                >
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.amber, boxShadow: `0 0 6px ${C.amber}` }}
                      aria-hidden="true"
                    />
                  )}
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
            className="flex items-center justify-center gap-2 border-t pt-6 text-[12px] uppercase tracking-[0.08em]"
            style={{ ...monoF, borderColor: C.line, color: C.inkFaint }}
          >
            <AudioLines size={13} aria-hidden="true" /> Analoge uitlezing — VU-meters tonen de
            stand, elke status draagt een label en een icoon.
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
      <Panel className="relative overflow-hidden">
        <div className="relative grid gap-6 p-6 sm:p-9 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em]"
                style={{
                  ...monoF,
                  background: C.amberBg,
                  color: C.amber,
                  boxShadow: `inset 0 0 0 1px ${C.amberDeep}`,
                }}
              >
                <Radio size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.rol}
              </span>
              <span className="text-[12px]" style={{ ...monoF, color: C.inkFaint }}>
                {PROFIEL.plaats}
              </span>
            </div>
            <h1
              className="mt-5 text-[32px] font-semibold leading-[1.08] sm:text-[42px]"
              style={{ ...headF, color: C.ink }}
            >
              Drie sterke matches op de band.
            </h1>
            <p
              className="mt-4 max-w-lg text-[15px] leading-relaxed"
              style={{ ...monoF, color: C.inkSoft }}
            >
              Eén kanaal piekt in het rood: je VOG verloopt binnenkort. Stem bij en houd je profiel
              op volle sterkte.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-[7px] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.amber,
                  color: C.bgDeep,
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-[7px] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.panelHi,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Stem bij
              </button>
            </div>
          </div>

          {/* VU-panel — dekking als grote meter */}
          <div
            className="rounded-[8px] p-5"
            style={{
              background: C.panelSoft,
              boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 2px 6px ${C.bgDeep}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                Dekking
              </span>
              <Display value={`${dek}%`} />
            </div>
            <VuMeter pct={dek} total={20} className="mt-3" />
            <div
              className="mt-3 flex items-center justify-between text-[11px]"
              style={{ ...monoF, color: C.inkSoft }}
            >
              <span>
                {verified}/{CREDENTIALS.length} geverifieerd
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: C.vuGreen }}
                  aria-hidden="true"
                />{" "}
                in balans
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* KPI-meters */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  ...monoF,
                  background: k.up ? C.okBg : C.panelSoft,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div className="mt-3">
              <Display value={k.value} />
            </div>
            <VuColumns data={k.spark} />
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <SectionHead kicker="Afspeellijst" title="Aanbevolen opdrachten" Icon={AudioLines} />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 rounded-[8px] p-4 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.amber }}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[7px]"
                    style={{ background: C.amberBg, boxShadow: `inset 0 0 0 1.5px ${C.amberDeep}` }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[18px] font-semibold tabular-nums leading-none"
                      style={{ ...monoF, color: C.amber }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[8px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...monoF, color: C.amberDeep }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-semibold"
                      style={{ ...headF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[13px]"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <VuMeter pct={o.match} total={18} className="mt-2.5" />
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Panel>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead kicker="Kanaal rood" title="Vraagt bijstellen" Icon={TriangleAlert} />
          <Panel className="relative overflow-hidden p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.04em]"
              style={{
                ...monoF,
                background: C.warnBg,
                color: C.warn,
                boxShadow: `inset 0 0 0 1px ${C.warn}44`,
              }}
            >
              <TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" /> Piek
            </span>
            <h3
              className="mt-3 text-[19px] font-semibold leading-tight"
              style={{ ...headF, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-2 text-[13.5px] leading-relaxed"
              style={{ ...monoF, color: C.inkSoft }}
            >
              {warn.detail}
            </p>
            <VuMeter pct={88} total={18} className="mt-4" />
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-[7px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...headF,
                background: C.amber,
                color: C.bgDeep,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px]"
                style={{ background: C.okBg, boxShadow: `inset 0 0 0 1px ${C.ok}44` }}
                aria-hidden="true"
              >
                <BadgeCheck size={22} strokeWidth={1.9} style={{ color: C.ok }} />
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[13px]" style={{ ...monoF, color: C.inkSoft }}>
                  Opdrachtgevers zien uitsluitend geverifieerde documenten. Signaal helder, ruis
                  laag.
                </p>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats ─────────────
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
        <SectionHead kicker="Bibliotheek" title="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[7px] px-3.5 py-2"
            style={{
              background: C.panelSoft,
              boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 1px 2px ${C.bgDeep}`,
            }}
          >
            <Search size={15} style={{ color: C.amber }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[13px] outline-none placeholder:opacity-50"
              style={{ ...monoF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-[7px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
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

      {error && (
        <div
          className="flex items-start gap-3 rounded-[8px] p-4"
          role="alert"
          style={{ background: C.badBg, boxShadow: `inset 0 0 0 1px ${C.bad}55` }}
        >
          <XCircle size={18} strokeWidth={2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ ...headF, color: C.ink }}>
              Signaal onderbroken
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...monoF, color: C.inkSoft }}>
              Een deel van de band ontbreekt. Laad opnieuw om het volledige aanbod te horen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[3px] px-2.5 py-1 text-[11px] font-medium uppercase focus-visible:outline-none focus-visible:ring-2"
            style={{ ...monoF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
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
                  className="h-14 w-14 shrink-0 animate-pulse rounded-[7px]"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.line }}
                />
              </div>
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[9px]"
            style={{ background: C.amberBg, boxShadow: `inset 0 0 0 1.5px ${C.amberDeep}` }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.8} style={{ color: C.amber }} />
          </span>
          <p className="text-[20px] font-semibold" style={{ ...headF, color: C.ink }}>
            Geen opname gevonden
          </p>
          <p className="max-w-xs text-[13.5px]" style={{ ...monoF, color: C.inkSoft }}>
            Geen opdracht voor &ldquo;{q}&rdquo;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[7px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
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
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: `1px solid ${C.line}`, background: C.panelSoft }}
              >
                <span
                  className="text-[11px] font-medium tracking-[0.06em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{
                    ...monoF,
                    background: C.amberBg,
                    color: C.amber,
                    boxShadow: `inset 0 0 0 1px ${C.amberDeep}`,
                  }}
                >
                  {o.match} match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[17px] font-semibold leading-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...monoF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <VuMeter pct={o.match} total={16} className="mt-3" />
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[3px] px-2 py-0.5 text-[11px]"
                      style={{
                        ...monoF,
                        background: C.panelSoft,
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
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
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
        className="inline-flex items-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...headF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
          ["--tw-ring-color" as string]: C.amber,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar bibliotheek
      </button>

      <Panel className="relative overflow-hidden">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3 max-w-xs">
              <TapeLabel a={opdracht.id} b={`Start ${opdracht.start}`} />
            </div>
            <h1
              className="max-w-2xl text-[26px] font-semibold leading-[1.12] sm:text-[34px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...monoF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="w-full max-w-xs rounded-[8px] p-4 sm:w-56"
            style={{
              background: C.panelSoft,
              boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 2px 6px ${C.bgDeep}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                Match
              </span>
              <Display value={`${opdracht.match}%`} big />
            </div>
            <VuMeter pct={opdracht.match} total={20} className="mt-3" />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[6px]"
              style={{ background: C.panelSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.amber }} />
            </span>
            <div
              className="mt-3 text-[16px] font-semibold tabular-nums"
              style={{ ...monoF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead kicker="Voorgrond" title="Waarom dit past" Icon={Check} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...monoF, color: C.ink }}
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
          <SectionHead kicker="Ruis" title="Om te overwegen" Icon={TriangleAlert} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...monoF, color: C.ink }}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-[8px] px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.amber,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[8px] px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
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
        <SectionHead kicker="Opnames" title="Verificatie & documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-[7px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.amber,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Panel className="relative overflow-hidden">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <div
            className="w-full max-w-sm rounded-[8px] p-5 sm:w-72"
            style={{
              background: C.panelSoft,
              boxShadow: `inset 0 0 0 1px ${C.line}, inset 0 2px 6px ${C.bgDeep}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                Dekking
              </span>
              <Display value={`${dek}%`} big />
            </div>
            <VuMeter pct={dek} total={22} className="mt-3" />
          </div>
          <div className="max-w-sm">
            <div className="text-[19px] font-semibold" style={{ ...headF, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1 text-[13.5px] leading-relaxed"
              style={{ ...monoF, color: C.inkSoft }}
            >
              Elk geverifieerd certificaat brengt je signaal omhoog. Houd de meter uit het rood en
              je blijft betrouwbaar zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.04em]"
              style={{
                ...monoF,
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px]"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15.5px] font-semibold"
                  style={{ ...headF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...monoF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-[4px] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...monoF,
                        background: C.panelHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
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
            </Panel>
          );
        })}
      </div>

      <section className="space-y-3">
        <SectionHead kicker="Kluis" title="Documenten" Icon={FileText} />
        <Panel className="overflow-hidden">
          {DOCUMENTEN.map((d, i) => (
            <div
              key={d.naam}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]"
                style={{ background: C.panelSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                aria-hidden="true"
              >
                <FileText size={16} strokeWidth={1.9} style={{ color: C.inkSoft }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-semibold"
                  style={{ ...headF, color: C.ink }}
                >
                  {d.naam}
                </div>
                <div className="text-[11.5px]" style={{ ...monoF, color: C.inkFaint }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusTag status={d.status} />
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

// ── Acties ─────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead kicker="Draaiboek" title="Wat nu te doen" Icon={AudioLines} />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.vuRed : C.amber }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px] text-[16px] font-semibold tabular-nums"
                    style={{
                      ...monoF,
                      background: warn ? C.warnBg : C.panelSoft,
                      color: warn ? C.warn : C.inkSoft,
                      boxShadow: `inset 0 0 0 1px ${warn ? C.warn + "44" : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                        style={{
                          ...monoF,
                          background: warn ? C.warnBg : C.waitBg,
                          color: warn ? C.warn : C.wait,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Piek" : "Kans"}
                      </span>
                      <h3
                        className="text-[16.5px] font-semibold"
                        style={{ ...headF, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-[7px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...headF,
                              background: C.amber,
                              color: C.bgDeep,
                              ["--tw-ring-color" as string]: C.amber,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                          : {
                              ...headF,
                              background: C.panelHi,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
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

      <section className="space-y-3">
        <SectionHead kicker="Kanaal" title="Recente gesprekken" Icon={MessageSquare} />
        <Panel className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-semibold"
                style={{
                  ...monoF,
                  background: C.amberBg,
                  color: C.amber,
                  boxShadow: `inset 0 0 0 1px ${C.amberDeep}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold"
                    style={{ ...headF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.amber, boxShadow: `0 0 6px ${C.amber}` }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ ...monoF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span className="shrink-0 text-[11px]" style={{ ...monoF, color: C.inkFaint }}>
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
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.panelSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead kicker="Mengpaneel" title="Omzet & openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-[7px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
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
          { l: "Betaald (mnd)", v: betaald, meter: 86 },
          { l: "Openstaand", v: `${open}`, meter: 40 },
          { l: "Te factureren", v: "€ 1.350", meter: 55 },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div className="mt-3">
              <Display value={s.v} />
            </div>
            <VuMeter pct={s.meter} total={16} className="mt-3" />
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelSoft }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...monoF, color: C.inkFaint }}
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
                      className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px]" style={{ ...headF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.03em]"
                        style={{
                          ...monoF,
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
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.amberBg }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...monoF, color: C.amber }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...monoF, color: C.amber, textShadow: `0 0 12px ${C.amber}55` }}
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
