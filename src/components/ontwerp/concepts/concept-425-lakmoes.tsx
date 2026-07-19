"use client";

// Concept 425 — "Lakmoes" · pH-indicator-laboratorium.
// Laboratorium-esthetiek: status en voortgang worden afgelezen op een pH-indicator-kleurschaal
// (rood → oranje → geel → groen → cyaan → violet). Match-% verschijnt als een titratie-meter /
// gevulde reageerbuis; credentials zijn reagens-monsters met kleurcode. Schoon, wetenschappelijk-
// precies: dunne meetstreepjes en schaalverdelingen, mono-cijfers. Speels maar geloofwaardig.
// Kleur is nooit de enige drager van betekenis — elke indicator heeft ook een label (WCAG).

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Beaker,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Droplet,
  FileText,
  FlaskConical,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  TestTube,
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

// — Palet: labpapier-wit, inkt-aubergine, magenta reagens-accent — plus de pH-indicatorschaal —
const C = {
  bg: "#faf9f6",
  bgSoft: "#f2f0ec",
  card: "#ffffff",
  ink: "#211d2b",
  inkSoft: "#4a4457",
  inkMute: "#7a7488",
  inkFaint: "#a8a3b4",
  line: "rgba(33,29,43,0.12)",
  lineSoft: "rgba(33,29,43,0.07)",
  hair: "rgba(33,29,43,0.05)",
  accent: "#c026d3",
  accentInk: "#8f1a9c",
  accentWash: "rgba(192,38,211,0.09)",
  // pH-indicatorschaal (zuur → basisch), functioneel gekoppeld aan status
  acid: "#e02424", // rood — laag / afgewezen / urgent
  acidInk: "#a51616",
  acidWash: "rgba(224,36,36,0.10)",
  warm: "#ea6d0a", // oranje — verloopt bijna
  warmInk: "#aa4d05",
  warmWash: "rgba(234,109,10,0.10)",
  amber: "#d9a406", // geel — in behandeling / neutraal
  amberInk: "#8f6c02",
  amberWash: "rgba(217,164,6,0.12)",
  base: "#1f9d57", // groen — geverifieerd / gezond
  baseInk: "#127040",
  baseWash: "rgba(31,157,87,0.10)",
  cyan: "#0e9aa7", // cyaan — informatief
  cyanInk: "#0a6f78",
  cyanWash: "rgba(14,154,167,0.10)",
};

const display = {
  fontFamily: "'Space Grotesk', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  letterSpacing: "-0.01em",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const mono = {
  fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

type Tone = { fill: string; ink: string; wash: string };
const ACID: Tone = { fill: C.acid, ink: C.acidInk, wash: C.acidWash };
const WARM: Tone = { fill: C.warm, ink: C.warmInk, wash: C.warmWash };
const AMBER: Tone = { fill: C.amber, ink: C.amberInk, wash: C.amberWash };
const BASE: Tone = { fill: C.base, ink: C.baseInk, wash: C.baseWash };
const CYAN: Tone = { fill: C.cyan, ink: C.cyanInk, wash: C.cyanWash };

// De volledige indicator-gradient (voor schaalbalken)
const PH_STOPS = ["#e02424", "#ea6d0a", "#d9a406", "#1f9d57", "#0e9aa7", "#7b3ff2"];
const PH_GRADIENT = `linear-gradient(90deg, ${PH_STOPS.join(", ")})`;

// Match-% → indicator-tone (hoger = basischer/gezonder)
function matchTone(m: number): Tone {
  if (m >= 90) return BASE;
  if (m >= 80) return CYAN;
  if (m >= 70) return AMBER;
  return WARM;
}
function matchLabel(m: number): string {
  if (m >= 90) return "sterk basisch";
  if (m >= 80) return "basisch";
  if (m >= 70) return "neutraal";
  return "zwak";
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: Tone;
  ph: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, tone: BASE, ph: "pH 8.4" };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, alarm: false, tone: AMBER, ph: "pH 6.8" };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
        tone: WARM,
        ph: "pH 4.5",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, tone: ACID, ph: "pH 2.1" };
  }
}

// — Paneel: schoon labpapier met haarfijne rand —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  bg = C.card,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  bg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Tag
      className={`relative rounded-2xl ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(33,29,43,0.03), 0 12px 30px rgba(33,29,43,0.04)",
        color: C.ink,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// — Meetlat: fijne schaalverdeling langs de bovenrand, als laboratoriumglaswerk —
function Ticks({ count = 20, tone = C.line }: { count?: number; tone?: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-4 top-0 flex items-start justify-between"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 1,
            height: i % 5 === 0 ? 9 : 5,
            background: tone,
            opacity: i % 5 === 0 ? 0.8 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

function Eyebrow({ children, tone = C.accentInk }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...mono }}
    >
      <Droplet size={11} aria-hidden="true" fill="currentColor" strokeWidth={0} />
      {children}
    </p>
  );
}

function Chip({
  tone,
  children,
  alarm = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: tone.ink, background: tone.wash, border: `1px solid ${tone.fill}`, ...body }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c026d3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: "#ffffff",
        background: `linear-gradient(180deg, ${C.accent}, ${C.accentInk})`,
        boxShadow: "0 6px 18px rgba(192,38,211,0.22)",
        ...body,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c026d3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#ffffff" : C.inkSoft,
        background: active ? C.ink : C.card,
        border: `1px solid ${active ? C.ink : C.line}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Titratie-meter: een gevulde reageerbuis, horizontaal, met indicator-kleur en pH-schaal —
function Titration({ value, tone }: { value: number; tone: Tone }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative block h-3 w-24 overflow-hidden rounded-full"
        style={{ background: C.bgSoft, border: `1px solid ${C.line}` }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone.fill }}
        />
        {[25, 50, 75].map((t) => (
          <span
            key={t}
            className="absolute top-0 h-full"
            style={{ left: `${t}%`, width: 1, background: "rgba(255,255,255,0.6)" }}
          />
        ))}
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: tone.ink, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

// — Reageerbuis: verticale gevulde buis, voor de grote match-weergave —
function TestTubeFill({
  value,
  tone,
  height = 96,
}: {
  value: number;
  tone: Tone;
  height?: number;
}) {
  return (
    <span
      className="relative inline-flex flex-col justify-end overflow-hidden rounded-b-full rounded-t-md"
      style={{ width: 30, height, background: C.bgSoft, border: `1.5px solid ${C.line}` }}
      aria-hidden="true"
    >
      <span
        className="w-full rounded-b-full transition-all duration-500 motion-reduce:transition-none"
        style={{
          height: `${value}%`,
          background: `linear-gradient(180deg, ${tone.fill}, ${tone.ink})`,
        }}
      />
      {[20, 40, 60, 80].map((t) => (
        <span
          key={t}
          className="absolute right-0 h-px"
          style={{ bottom: `${t}%`, width: 7, background: C.line }}
        />
      ))}
    </span>
  );
}

// — Reagens-spark: kleine kolommen die als monsterrij oplopen naar de indicator-tint —
function ReagentSpark({ data, tone }: { data: number[]; tone: Tone }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-9 items-end gap-1" aria-hidden="true">
      {data.map((d, i) => {
        const h = 20 + ((d - min) / span) * 16;
        const last = i === data.length - 1;
        return (
          <span key={i} className="relative flex-1">
            <span
              className="block w-full rounded-b-full rounded-t-sm"
              style={{
                height: `${h}px`,
                background: last ? tone.fill : tone.wash,
                border: `1px solid ${last ? tone.fill : C.line}`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

export function Concept425() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      <style>{`
        @keyframes lakFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .lak-fade { animation: lakFade 0.34s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .lak-fade { animation: none !important; } }
      `}</style>

      {/* subtiel labpapier-raster op de achtergrond */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(${C.hair} 1px, transparent 1px), linear-gradient(90deg, ${C.hair} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="lak-fade pt-6">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: C.accentWash, border: `1px solid ${C.line}`, color: C.accentInk }}
          aria-hidden="true"
        >
          <FlaskConical size={19} />
        </span>
        <div>
          <p
            className="text-[20px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
          >
            Lakmoes
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-none"
            style={{ color: C.inkMute, ...mono }}
          >
            <TestTube size={11} aria-hidden="true" style={{ color: C.accentInk }} />
            {PROFIEL.plaats} · titratie-console
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.baseInk,
            border: `1px solid ${C.base}`,
            background: C.baseWash,
            ...body,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.accent, color: "#ffffff", ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-semibold"
          style={{
            background: C.accentWash,
            border: `1px solid ${C.line}`,
            color: C.accentInk,
            ...body,
          }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c026d3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff] motion-reduce:transition-none"
              style={{
                color: on ? "#ffffff" : C.inkMute,
                background: on ? C.ink : "transparent",
                ...body,
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

// De pH-legenda: de kern van de designtaal — kleur + label samen (WCAG-veilig).
function PhLegend() {
  const items: { label: string; tone: Tone }[] = [
    { label: "Afgewezen", tone: ACID },
    { label: "Verloopt", tone: WARM },
    { label: "In behandeling", tone: AMBER },
    { label: "Geverifieerd", tone: BASE },
    { label: "Informatief", tone: CYAN },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: it.tone.fill, border: `1px solid ${it.tone.ink}` }}
            aria-hidden="true"
          />
          <span className="text-[11px] font-medium" style={{ color: C.inkSoft, ...body }}>
            {it.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden p-7 pt-9 md:p-9 md:pt-11">
          <Ticks count={24} />
          <Eyebrow>Vandaag · monsterrapport</Eyebrow>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h1
              className="text-[32px] font-semibold leading-[1.05] md:text-[42px]"
              style={{ color: C.ink, ...display }}
            >
              Goedemorgen,
              <br />
              {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <Beaker
              size={28}
              aria-hidden="true"
              style={{ color: C.accentInk }}
              className="hidden sm:block"
            />
          </div>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je praktijk kleurt gezond. Loop je acties langs de schaal — houd elk monster
            geverifieerd en elke factuur betaald, meetbaar en zonder ruis.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
          <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <PhLegend />
          </div>
        </Panel>

        <Panel className="flex flex-col p-7">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warmInk}>Vraagt aandacht</Eyebrow>
            <TestTubeFill value={38} tone={WARM} height={40} />
          </div>
          <h2
            className="mt-4 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[12px]"
              style={{ color: C.inkMute, ...mono }}
            >
              <Droplet
                size={13}
                aria-hidden="true"
                style={{ color: C.baseInk }}
                fill="currentColor"
                strokeWidth={0}
              />
              {verified}/{CREDENTIALS.length} monsters geverifieerd · 7 open reacties
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.cyanInk}>Meetwaarden · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? BASE : WARM;
            return (
              <Panel key={k.label} className="overflow-hidden p-5 pt-7">
                <Ticks count={12} />
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: C.inkMute, ...body }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={{ color: tone.ink, background: tone.wash, ...mono }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[27px] font-semibold leading-none"
                  style={{ color: C.ink, ...mono }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <ReagentSpark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Monsterrij · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c026d3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6]"
              style={{ color: C.accentInk, ...body }}
            >
              Alle →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => {
                const tone = matchTone(o.match);
                return (
                  <li
                    key={o.id}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f2f0ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c026d3] motion-reduce:transition-none"
                    >
                      <TestTubeFill value={o.match} tone={tone} height={40} />
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[15px] font-semibold"
                          style={{ color: C.ink, ...body }}
                        >
                          {o.titel}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[12px]"
                          style={{ color: C.inkMute }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Titration value={o.match} tone={tone} />
                        <ChevronRight
                          size={17}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                          style={{ color: C.inkFaint }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.baseInk}>Reagens-monsters</Eyebrow>
          </div>
          <Panel className="p-5">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        color: st.tone.ink,
                        background: st.tone.wash,
                        border: `1px solid ${st.tone.fill}`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: st.tone.ink }}>
                        {st.label}
                      </span>
                    </span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: C.inkFaint, ...mono }}
                    >
                      {st.ph}
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
    <div className="space-y-6">
      <div>
        <Eyebrow>Marktplaats · monsteranalyse</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...mono }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} monsters
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a8a3b4]"
            style={{ color: C.ink, ...body }}
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
              {s === "match" ? "Hoogste pH" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Titreer…"}
          </GhostButton>
        </div>
      </div>

      {/* pH-schaalbalk als contextlegenda boven de resultaten */}
      <div
        className="rounded-full p-1"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <div
          className="relative h-3 overflow-hidden rounded-full"
          style={{ background: PH_GRADIENT }}
          aria-hidden="true"
        >
          <span className="absolute inset-0 flex items-center justify-between px-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="h-2 w-px" style={{ background: "rgba(255,255,255,0.55)" }} />
            ))}
          </span>
        </div>
        <p className="sr-only">pH-indicatorschaal van zuur (laag) naar basisch (hoog)</p>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.bgSoft }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.bgSoft }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.bgSoft }} />
                  <div className="h-2 w-full rounded-full" style={{ background: C.bgSoft }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: C.accentWash,
                border: `1px solid ${C.accent}`,
                color: C.accentInk,
              }}
              aria-hidden="true"
            >
              <TestTube size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...display }}>
              Leeg monster
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen reactie op {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm en titreer
              opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
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
  const tone = matchTone(opdracht.match);
  return (
    <Panel className="overflow-hidden p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
            >
              Monster {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
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
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.bgSoft,
                  border: `1px solid ${C.lineSoft}`,
                  ...body,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <TestTubeFill value={opdracht.match} tone={tone} height={72} />
          <span className="text-[15px] font-bold leading-none" style={{ color: tone.ink, ...mono }}>
            {opdracht.match}%
          </span>
          <span
            className="text-[8.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.inkFaint, ...body }}
          >
            {matchLabel(opdracht.match)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c026d3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{ color: C.accentInk, border: `1px solid ${C.line}`, ...body }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Reactie-analyse
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Positieve reactie"
              tone={BASE}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Neerslag"
              tone={WARM}
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
  tone: Tone;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: C.bgSoft, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone.ink }}
      >
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: tone.fill }}
          aria-hidden="true"
        />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone.ink }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const tone = matchTone(opdracht.match);
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c026d3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f6]"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, background: C.card, ...body }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel className="overflow-hidden p-7 pt-9 md:p-9 md:pt-11">
        <Ticks count={28} />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  color: tone.ink,
                  background: tone.wash,
                  border: `1px solid ${tone.fill}`,
                  ...body,
                }}
              >
                <Droplet size={11} aria-hidden="true" fill="currentColor" strokeWidth={0} />
                {matchLabel(opdracht.match)} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] md:text-[40px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TestTubeFill value={opdracht.match} tone={tone} height={120} />
            <span
              className="text-[20px] font-bold leading-none"
              style={{ color: tone.ink, ...mono }}
            >
              {opdracht.match}%
            </span>
          </div>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-semibold" style={{ color: C.ink, ...mono }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — de positieve reactie én de neerslag, transparant
          en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: BASE.ink, background: BASE.wash, border: `1px solid ${BASE.fill}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: BASE.ink }}
              >
                Positieve reactie
              </p>
            </div>
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
                    style={{ color: BASE.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: WARM.ink, background: WARM.wash, border: `1px solid ${WARM.fill}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: WARM.ink }}
              >
                Neerslag
              </p>
            </div>
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
                    style={{ color: WARM.ink }}
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
    <div className="space-y-6">
      <Panel className="overflow-hidden p-7 pt-9 md:p-9 md:pt-11">
        <Ticks count={28} />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.baseInk}>Verificatie · monsterintegriteit</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.baseInk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} monsters kleuren geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Titration value={ratio} tone={BASE} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TestTubeFill value={ratio} tone={BASE} height={104} />
            <span className="flex flex-col">
              <span
                className="text-[30px] font-semibold leading-none"
                style={{ color: C.baseInk, ...mono }}
              >
                {ratio}%
              </span>
              <span
                className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...body }}
              >
                geverifieerd
              </span>
            </span>
          </div>
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Monster", "Indicator", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f2f0ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c026d3] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{
                        color: st.tone.ink,
                        background: st.tone.wash,
                        border: `1px solid ${st.tone.fill}`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-2 truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail} · <span style={{ ...mono, color: st.tone.ink }}>{st.ph}</span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-xl p-4"
                        style={{ background: C.bgSoft, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Het monster wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
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
          <Eyebrow tone={C.cyanInk}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: C.bgSoft, border: `1px solid ${C.line}`, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{
                    color: st.tone.ink,
                    background: st.tone.wash,
                    border: `1px solid ${st.tone.fill}`,
                  }}
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
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · titratievolgorde</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Van hoog naar laag op de schaal — zo blijf je verifieerbaar en betaald, meetbaar en zonder
          ruis.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? WARM : CYAN;
          return (
            <li key={a.titel}>
              <Panel className="overflow-hidden p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[15px] font-bold"
                    style={{
                      background: tone.wash,
                      border: `1px solid ${tone.fill}`,
                      color: tone.ink,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        color: tone.ink,
                        background: tone.wash,
                        border: `1px solid ${tone.fill}`,
                        ...body,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Droplet size={10} aria-hidden="true" fill="currentColor" strokeWidth={0} />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
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
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
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

function factuurTone(status: string): { tone: Tone; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { tone: WARM, Icon: AlertTriangle };
  if (status === "Betaald") return { tone: BASE, Icon: Check };
  return { tone: AMBER, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · balans</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: BASE, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: WARM, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: AMBER, alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="overflow-hidden p-6 pt-7">
            <Ticks count={14} />
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold"
                style={{
                  color: s.tone.ink,
                  background: s.tone.wash,
                  border: `1px solid ${s.tone.fill}`,
                  ...body,
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: s.tone.fill }}
                  aria-hidden="true"
                />
                {s.alarm ? "let op" : "ok"}
              </span>
            </div>
            <p
              className="mt-2 text-[27px] font-semibold"
              style={{ color: s.alarm ? WARM.ink : C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f2f0ec] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...body }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.tone.ink,
                      background: ft.tone.wash,
                      border: `1px solid ${ft.tone.fill}`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? WARM.ink : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.inkMute, ...body }}
          >
            <Droplet
              size={12}
              aria-hidden="true"
              style={{ color: C.baseInk }}
              fill="currentColor"
              strokeWidth={0}
            />{" "}
            Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...mono }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
