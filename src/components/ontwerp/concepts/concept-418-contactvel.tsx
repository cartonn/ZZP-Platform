"use client";

// Concept 418 — "Contactvel" · Fotografie / donkere kamer.
// Een bijna-zwart donkere-kamer canvas onder safelight-rood. De layout leest als een fotografisch
// contactvel: een raster van "frames" met witte kaderranden, mono-labels (framenummers, sluitertijd-
// achtige metadata) en filmstrip-navigatie met perforatie-randen. Certificaten en documenten liggen
// als belichte negatieven op de lichttafel. Analoog-technisch, strak, donker-premium.
// Palet: donkere kamer #111214, safelight-rood #e5484d, neutraal wit #f4f5f6.
// Rood is nooit de enige status-drager — altijd label + icoon. Fonts: JetBrains Mono + Inter.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Bell,
  Aperture,
  Camera,
  Film,
  Image as ImageIcon,
  ScanLine,
  Focus,
  Timer,
  Contrast,
  FileText,
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

// — Palet: donkere kamer, safelight-rood, neutraal wit —
const C = {
  bg: "#111214",
  bgDeep: "#0b0c0d",
  frame: "#17181a",
  frameHi: "#1d1f22",
  raise: "#24272b",
  raiseHi: "#2c3035",
  line: "rgba(244,245,246,0.11)",
  lineSoft: "rgba(244,245,246,0.06)",
  white: "#f4f5f6",
  soft: "#c6cace",
  mute: "#8b9096",
  faint: "#5f646a",
  red: "#e5484d",
  redHi: "#ff7a7e",
  redDeep: "#b3373b",
  redWash: "rgba(229,72,77,0.14)",
  ok: "#35b37f",
  okInk: "#7fe0b0",
  okWash: "rgba(53,179,127,0.14)",
  info: "#7d8894",
  infoInk: "#c6ccd3",
  infoWash: "rgba(125,136,148,0.16)",
  warn: "#e0a02f",
  warnInk: "#f2c46a",
  warnWash: "rgba(224,160,47,0.14)",
};

const sans = {
  fontFamily: "'Inter', 'Geist', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const mono = {
  fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.red,
        ink: C.redHi,
        wash: C.redWash,
      };
  }
}

// — Perforatie-rand: rij filmgaatjes langs een strook —
function Perforation({ count = 12, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-1 px-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-2 shrink-0 rounded-[2px]"
          style={{ background: C.bgDeep, border: `1px solid ${C.lineSoft}` }}
        />
      ))}
    </div>
  );
}

// — Frame: een contactvel-kader met dunne witte rand —
function FrameCard({
  children,
  className = "",
  as: Tag = "div",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  accent?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[6px] ${className}`}
      style={{
        background: C.frame,
        border: `1px solid ${accent ? C.red : C.line}`,
        boxShadow: accent
          ? `0 0 0 1px ${C.redWash}, 0 18px 40px rgba(0,0,0,0.5)`
          : "0 14px 32px rgba(0,0,0,0.4)",
        color: C.white,
      }}
    >
      {children}
    </Tag>
  );
}

// — Mono-metalabel: sluitertijd-achtige technische regel —
function MetaLabel({ children, tone = C.mute }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </span>
  );
}

function FrameNo({ n, accent = false }: { n: number; accent?: boolean }) {
  const suffix = n % 2 === 0 ? "A" : "";
  return (
    <span
      className="inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em]"
      style={{
        color: accent ? C.bgDeep : C.soft,
        background: accent ? C.red : C.raise,
        border: `1px solid ${accent ? C.red : C.line}`,
        ...mono,
      }}
    >
      {String(n).padStart(2, "0")}
      {suffix}
    </span>
  );
}

function Chip({
  children,
  tone,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...mono }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[6px] px-5 py-2.5 text-[13px] font-bold transition-all duration-200 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a7e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111214] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.white,
        background: `linear-gradient(160deg, ${C.red}, ${C.redDeep})`,
        boxShadow: `0 2px 0 rgba(0,0,0,0.4), 0 10px 22px rgba(229,72,77,0.24)`,
        ...sans,
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
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5484d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111214] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.white : C.soft,
        background: active ? C.raiseHi : "transparent",
        border: `1px solid ${active ? C.red : C.line}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Histogram-sparkline: belichtings-curve als staafjes —
function Histogram({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 18 + ((d - min) / span) * 82;
        const lastTwo = i >= data.length - 2;
        return (
          <span
            key={`${id}-${i}`}
            className="flex-1 rounded-[1px]"
            style={{ height: `${h}%`, background: tone, opacity: lastTwo ? 1 : 0.42 }}
          />
        );
      })}
    </div>
  );
}

// — Belichtings-meter: match-score als lichtwaarde —
function ExposureMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.red : value >= 85 ? C.warn : C.mute;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: "rgba(244,245,246,0.12)" }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

const SHUTTER = ["1/125 · f2.8 · ISO400", "1/60 · f4 · ISO800", "1/250 · f1.8 · ISO200"];

export function Concept418() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...sans,
        color: C.white,
        background: `radial-gradient(120% 80% at 82% -6%, rgba(229,72,77,0.08) 0%, transparent 46%), ${C.bg}`,
      }}
    >
      <div className="mx-auto max-w-6xl px-3 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <FilmstripNav screen={screen} setScreen={setScreen} />
        <main className="pt-6">
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
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[8px]"
          style={{ background: C.bgDeep, border: `1px solid ${C.red}`, color: C.red }}
          aria-hidden="true"
        >
          <Aperture size={20} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.white, ...sans }}
          >
            Contactvel
          </p>
          <p
            className="mt-1.5 text-[10.5px] uppercase leading-none tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            donkere kamer · safelight
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...mono }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[8px]"
          style={{ background: C.frame, border: `1px solid ${C.line}`, color: C.mute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.red, color: C.white, ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.white, ...sans }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] uppercase tracking-[0.1em]"
            style={{ color: C.faint, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] text-[12px] font-bold"
          style={{ background: C.bgDeep, border: `1px solid ${C.red}`, color: C.red, ...mono }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

// — Filmstrip-navigatie: perforatie boven en onder, frames als tabs —
function FilmstripNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="overflow-hidden rounded-[8px]"
        style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
      >
        <Perforation count={16} className="py-1.5" />
        <div className="flex items-center gap-1 overflow-x-auto px-1.5 pb-1.5">
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="flex shrink-0 items-center gap-2 rounded-[5px] px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5484d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0d] motion-reduce:transition-none"
                style={{
                  color: on ? C.white : C.mute,
                  background: on ? C.frameHi : "transparent",
                  border: `1px solid ${on ? C.red : "transparent"}`,
                  ...sans,
                }}
              >
                <span
                  className="text-[9.5px] font-bold"
                  style={{ color: on ? C.red : C.faint, ...mono }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
        <Perforation count={16} className="py-1.5" />
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const [laden, setLaden] = useState(false);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <FrameCard className="p-6 md:p-8" accent>
          <div className="flex items-center justify-between">
            <MetaLabel tone={C.red}>
              <Focus size={12} aria-hidden="true" /> Frame 01 · vandaag
            </MetaLabel>
            <MetaLabel>{SHUTTER[0]}</MetaLabel>
          </div>
          <h2
            className="mt-4 text-[34px] font-semibold leading-[1.03] tracking-[-0.02em] md:text-[44px]"
            style={{ color: C.white, ...sans }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h2>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.mute }}>
            Elke belichting scherp: wat telt staat vooraan op het vel, verifieerbaar en betaald. De
            rest blijft in de fixeer. Werk het contactvel van boven naar beneden af.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={() => setLaden((v) => !v)} ariaPressed={laden}>
              {laden ? "Stop ontwikkelen" : "Vel ontwikkelen"}
            </GhostButton>
          </div>
        </FrameCard>

        <FrameCard className="p-6">
          <div className="flex items-center justify-between">
            <MetaLabel tone={C.warnInk}>
              <AlertTriangle size={12} aria-hidden="true" /> Onderbelicht
            </MetaLabel>
            <ScanLine size={18} aria-hidden="true" style={{ color: C.faint }} />
          </div>
          <h3 className="mt-4 text-[21px] font-semibold leading-snug" style={{ color: C.white }}>
            {primair.titel}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.mute }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <MetaLabel>
              {verified}/{CREDENTIALS.length} negatieven gefixeerd · 7 open reacties
            </MetaLabel>
          </div>
        </FrameCard>
      </section>

      <section>
        <div className="mb-3">
          <MetaLabel tone={C.soft}>
            <Contrast size={12} aria-hidden="true" /> Belichtingsmeter · deze maand
          </MetaLabel>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {laden
            ? Array.from({ length: 4 }).map((_, i) => (
                <FrameCard key={`sk-${i}`} className="p-4">
                  <div
                    className="h-3 w-24 animate-pulse rounded-[3px] motion-reduce:animate-none"
                    style={{ background: C.raise }}
                  />
                  <div
                    className="mt-3 h-7 w-20 animate-pulse rounded-[3px] motion-reduce:animate-none"
                    style={{ background: C.raise }}
                  />
                  <div
                    className="mt-3 h-7 w-full animate-pulse rounded-[3px] motion-reduce:animate-none"
                    style={{ background: C.raise }}
                  />
                  <span className="sr-only">Laden…</span>
                </FrameCard>
              ))
            : KPIS.map((k, i) => (
                <FrameCard key={k.label} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[10px] font-medium uppercase tracking-[0.1em]"
                      style={{ color: C.mute, ...mono }}
                    >
                      {k.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[9.5px] font-bold"
                      style={{
                        color: k.up ? C.okInk : C.warnInk,
                        background: k.up ? C.okWash : C.warnWash,
                        ...mono,
                      }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                    </span>
                  </div>
                  <p
                    className="mt-2.5 text-[27px] font-semibold leading-none tracking-[-0.02em]"
                    style={{ color: C.white, ...mono }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-3">
                    <Histogram data={k.spark} tone={k.up ? C.red : C.warn} id={`kpi-${i}`} />
                  </div>
                </FrameCard>
              ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <MetaLabel tone={C.soft}>
              <Film size={12} aria-hidden="true" /> Het vel · open opdrachten
            </MetaLabel>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5484d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111214]"
              style={{ color: C.red, ...mono }}
            >
              Heel vel →
            </button>
          </div>
          <FrameCard>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#1d1f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e5484d] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[5px]"
                      style={{
                        background: C.bgDeep,
                        border: `1px solid ${i === 0 ? C.red : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.redHi : C.mute, ...mono }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.white }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px]"
                        style={{ color: C.mute, ...mono }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <ExposureMeter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.faint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </FrameCard>
        </div>

        <div>
          <div className="mb-3">
            <MetaLabel tone={C.soft}>
              <ImageIcon size={12} aria-hidden="true" /> Negatieven
            </MetaLabel>
          </div>
          <FrameCard className="p-4">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[5px]"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.white }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10.5px]"
                        style={{ color: C.mute, ...mono }}
                      >
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </FrameCard>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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
        <MetaLabel tone={C.red}>
          <Film size={12} aria-hidden="true" /> Het vel · open opdrachten
        </MetaLabel>
        <h2
          className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.white, ...sans }}
        >
          Contactvel
        </h2>
        <p className="mt-2 text-[12px]" style={{ color: C.mute, ...mono }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          frames belicht
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[6px] px-4 py-3"
          style={{ background: C.frame, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5f646a]"
            style={{ color: C.white, ...sans }}
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
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <FrameCard accent>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.redWash, border: `1px solid ${C.red}`, color: C.red }}
              aria-hidden="true"
            >
              <Camera size={26} />
            </span>
            <p className="mt-5 text-[21px] font-semibold" style={{ color: C.white }}>
              Onbelicht frame
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.mute }}>
              Geen frame past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer van
              het vel te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </FrameCard>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
  const tone = strong ? C.red : C.warn;
  const toneInk = strong ? C.redHi : C.warnInk;
  return (
    <FrameCard className="flex h-full flex-col p-5" accent={strong}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FrameNo n={index + 1} accent={strong} />
          <MetaLabel>{opdracht.id}</MetaLabel>
        </div>
        <MetaLabel>{SHUTTER[index % SHUTTER.length]}</MetaLabel>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug" style={{ color: C.white }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[11.5px]" style={{ color: C.mute, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-[6px]"
            style={{ background: C.bgDeep, border: `1.5px solid ${tone}` }}
          >
            <span
              className="text-[16px] font-bold leading-none"
              style={{ color: toneInk, ...mono }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.faint, ...mono }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: toneInk, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[10.5px] font-medium"
            style={{ color: C.soft, background: C.raise, border: `1px solid ${C.line}`, ...mono }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5484d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17181a]"
          style={{ color: C.redHi, border: `1px solid ${C.line}`, ...sans }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Bijschrift
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
          <div className="mt-4 grid grid-cols-1 gap-3">
            <RedenBlok
              titel="In je voordeel"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </FrameCard>
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
      className="rounded-[6px] p-4"
      style={{ background: C.bgDeep, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-medium uppercase tracking-[0.14em]"
        style={{ color: tone, ...mono }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.soft }}>
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
  const tone = strong ? C.red : C.warn;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5484d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111214]"
        style={{ color: C.soft, border: `1px solid ${C.line}`, ...sans }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar het vel
      </button>

      <FrameCard className="p-6 md:p-8" accent>
        <div className="flex flex-wrap items-center gap-2">
          <FrameNo n={1} accent />
          <MetaLabel>{opdracht.id}</MetaLabel>
          <span
            className="inline-flex items-center gap-1 rounded-[4px] px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: C.white, background: tone, ...mono }}
          >
            <Aperture size={11} aria-hidden="true" /> {strong ? "Scherp" : "Uitgelicht"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h2
          className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[42px]"
          style={{ color: C.white, ...sans }}
        >
          {opdracht.titel}
        </h2>
        <p className="mt-2 text-[13px]" style={{ color: C.mute, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Op contactvel bewaren</GhostButton>
        </div>
      </FrameCard>

      <FrameCard>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-medium uppercase tracking-[0.14em]"
                style={{ color: C.mute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.02em]"
                style={{ color: C.white, ...mono }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </FrameCard>

      <section>
        <MetaLabel tone={C.red}>
          <Focus size={12} aria-hidden="true" /> Bijschrift · waarom deze match
        </MetaLabel>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.mute }}>
          Transparant afgelezen van je gefixeerde profiel — wat in je voordeel telt én waar je op
          moet letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FrameCard className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[6px]"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-medium uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...mono }}
              >
                In je voordeel
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.soft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </FrameCard>
          <FrameCard className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[6px]"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-medium uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...mono }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.soft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </FrameCard>
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
      <FrameCard className="p-6 md:p-8" accent>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <MetaLabel tone={C.red}>
              <ImageIcon size={12} aria-hidden="true" /> Verificatie · de lichttafel
            </MetaLabel>
            <h2
              className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: C.white, ...sans }}
            >
              Jouw certificaten
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.mute }}>
              <span className="font-semibold" style={{ color: C.white }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} negatieven zijn gefixeerd en geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.bgDeep, border: `1.5px solid ${C.red}` }}
          >
            <span
              className="text-[26px] font-bold leading-none"
              style={{ color: C.redHi, ...mono }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              % gefixeerd
            </span>
          </span>
        </div>
      </FrameCard>

      <FrameCard>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.mute, ...mono }}
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1d1f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e5484d] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[6px]"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.white }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px]"
                        style={{ color: C.mute, ...mono }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.faint,
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
                    <div className="px-5 pb-5 sm:pl-[68px]">
                      <div
                        className="rounded-[6px] p-4"
                        style={{ background: C.bgDeep, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.soft }}
                        >
                          {c.detail}. Documenten liggen versleuteld op de lichttafel en worden
                          alleen na je expliciete toestemming aan een opdrachtgever getoond.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
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
      </FrameCard>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <MetaLabel tone={C.red}>
          <Timer size={12} aria-hidden="true" /> Acties · de volgende opname
        </MetaLabel>
        <h2
          className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]"
          style={{ color: C.white, ...sans }}
        >
          Wat nu aandacht vraagt
        </h2>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.mute }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.red;
          const ink = warn ? C.warnInk : C.redHi;
          const wash = warn ? C.warnWash : C.redWash;
          return (
            <li key={a.titel}>
              <FrameCard className="p-5" accent={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[6px] text-[15px] font-bold"
                    style={{
                      background: C.bgDeep,
                      border: `1.5px solid ${tone}`,
                      color: ink,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...mono }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Aperture size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h3
                      className="mt-2 text-[18px] font-semibold leading-snug"
                      style={{ color: C.white }}
                    >
                      {a.titel}
                    </h3>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.mute }}
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
              </FrameCard>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.mute, wash: C.raise, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <MetaLabel tone={C.red}>
            <FileText size={12} aria-hidden="true" /> Facturen · het archief
          </MetaLabel>
          <h2
            className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: C.white, ...sans }}
          >
            Facturen
          </h2>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <FrameCard key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-medium uppercase tracking-[0.1em]"
                style={{ color: C.mute, ...mono }}
              >
                {s.l}
              </span>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warnInk : C.white, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.mute }}>
              {s.sub}
            </p>
          </FrameCard>
        ))}
      </section>

      <FrameCard>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-medium uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.mute, ...mono }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#1d1f22] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.mute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.white }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.mute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...mono,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.white, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em]"
            style={{ color: C.mute, ...mono }}
          >
            <FileText size={12} aria-hidden="true" style={{ color: C.red }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.white, ...mono }}>
            {totaalBetaald}
          </span>
        </div>
      </FrameCard>
    </div>
  );
}
