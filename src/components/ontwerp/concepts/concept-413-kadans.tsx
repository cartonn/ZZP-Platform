"use client";

// Concept 413 — "Kadans" · Kinetisch ritme / motion-first.
// Licht-neutrale basis met één elektrische indigo-violet accent. Ritme en beweging zijn de held:
// gestaffelde reveal van rijen/tegels (opklimmende transition-delay), beat/metronoom-motief in
// voortgangsbalken en dividers, cadans-lijnen (verticale maatstrepen). Micro-interacties op tab-wissel
// en hover zijn voelbaar (translate/scale) — met volledig `motion-reduce:` respect.
// Palet: basis #fafafa, ink #101114, accent #5b3df5 (indigo-violet).
// Fonts: geometrische grotesk (Geist/Inter-gevoel) + tabulaire cijfers.

import { useEffect, useMemo, useState } from "react";
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
  FileText,
  Activity,
  Zap,
  Radio,
  Timer,
  Waves,
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

// — Palet: licht-neutraal met één elektrische indigo-violet —
const C = {
  bg: "#fafafa",
  bgAlt: "#f3f3f5",
  card: "#ffffff",
  ink: "#101114",
  inkSoft: "#3d3f47",
  mute: "#71747f",
  faint: "#a3a6b0",
  accent: "#5b3df5",
  accentHi: "#7460f8",
  accentDeep: "#4526d6",
  accentWash: "#ece8ff",
  accentSoft: "#f4f1ff",
  accentLine: "rgba(91,61,245,0.24)",
  line: "rgba(16,17,20,0.1)",
  lineSoft: "rgba(16,17,20,0.06)",
  ok: "#1f9d63",
  okInk: "#12724a",
  okWash: "#dcf3e7",
  warn: "#c67a12",
  warnInk: "#95590a",
  warnWash: "#fbeccd",
  info: "#2f6bd6",
  infoInk: "#1f4e9f",
  infoWash: "#dde8fb",
  bad: "#d0453a",
  badInk: "#a32d24",
  badWash: "#fbdedb",
};

const bodyF = {
  fontFamily: "'Geist', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
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
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

// — Reveal: gestaffelde binnenkomst met opklimmende delay; volledig motion-reduce-respecterend —
function Reveal({
  i = 0,
  children,
  className = "",
  as: Tag = "div",
}: {
  i?: number;
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const on = reduced || shown;
  return (
    <Tag
      className={className}
      style={{
        transition: reduced
          ? undefined
          : "opacity 480ms ease, transform 480ms cubic-bezier(0.2,0.7,0.2,1)",
        transitionDelay: reduced ? undefined : `${i * 55}ms`,
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(14px)",
        willChange: reduced ? undefined : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}

// — Cadans-strook: verticale maatstrepen als een metronoom-ritme —
function BeatBar({
  count = 24,
  active = 0.66,
  tone = C.accent,
}: {
  count?: number;
  active?: number;
  tone?: string;
}) {
  const bars = Array.from({ length: count }, (_, i) => i);
  const activeCount = Math.round(count * active);
  return (
    <div className="flex items-end gap-[3px]" aria-hidden="true">
      {bars.map((b) => {
        const on = b < activeCount;
        const h = 6 + (Math.sin(b * 0.9) + 1) * 7;
        return (
          <span
            key={b}
            className="w-[3px] rounded-full"
            style={{
              height: `${on ? h + 4 : h}px`,
              background: on ? tone : C.lineSoft,
              opacity: on ? 0.55 + (b / count) * 0.45 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

// — Beat-divider: horizontale maatstrepen —
function BeatDivider() {
  return (
    <div className="flex items-center gap-[5px] py-1" aria-hidden="true">
      {Array.from({ length: 32 }, (_, i) => (
        <span
          key={i}
          className="h-[7px] w-px"
          style={{ background: i % 4 === 0 ? C.accentLine : C.lineSoft }}
        />
      ))}
    </div>
  );
}

function Eyebrow({
  children,
  tone = C.accent,
  Icon,
}: {
  children: React.ReactNode;
  tone?: string;
  Icon?: LucideIcon;
}) {
  return (
    <p
      className="flex items-center gap-2 text-[11px] font-semibold uppercase leading-none tracking-[0.18em]"
      style={{ color: tone, ...bodyF }}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </p>
  );
}

function Card({
  children,
  className = "",
  accent = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${accent ? C.accentLine : C.line}`,
        boxShadow: accent
          ? "0 10px 30px rgba(91,61,245,0.12), 0 1px 2px rgba(16,17,20,0.04)"
          : "0 1px 2px rgba(16,17,20,0.05), 0 8px 20px rgba(16,17,20,0.04)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
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
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}33`, ...bodyF }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: "#ffffff",
        background: `linear-gradient(160deg, ${C.accentHi}, ${C.accent})`,
        boxShadow: `0 2px 0 ${C.accentDeep}, 0 10px 22px rgba(91,61,245,0.3)`,
        ...bodyF,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: active ? "#ffffff" : C.inkSoft,
        background: active ? C.accent : C.card,
        border: `1px solid ${active ? C.accent : C.line}`,
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline met puls-eindpunt (ritmische beweging) —
function PulseLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const reduced = usePrefersReducedMotion();
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 7) - 3.5;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`pulse-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#pulse-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!reduced && (
        <circle cx={last[0]} cy={last[1]} r="3.4" fill={tone} opacity="0.3">
          <animate attributeName="r" values="3;7;3" dur="1.8s" repeatCount="indefinite" />
          <animate
            attributeName="opacity"
            values="0.35;0;0.35"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={tone} />
    </svg>
  );
}

// — Match als beat-meter: gevulde maatstrepen —
function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.accent : value >= 85 ? C.info : C.mute;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span className="flex items-center gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{
              height: `${8 + (i % 3) * 3}px`,
              background: i < Math.round(value / 10) ? tone : C.lineSoft,
            }}
          />
        ))}
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept413() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...bodyF,
        color: C.ink,
        background: `radial-gradient(120% 70% at 82% -8%, ${C.accentSoft} 0%, ${C.bg} 42%, ${C.bgAlt} 100%)`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        {/* key op screen: elke tab-wissel her-triggert de gestaffelde reveal */}
        <main className="pt-6" key={screen}>
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: C.accentWash, border: `1px solid ${C.accentLine}`, color: C.accent }}
          aria-hidden="true"
        >
          <Activity size={19} />
        </span>
        <div>
          <p
            className="text-[21px] font-bold leading-none tracking-[-0.02em]"
            style={{ color: C.ink, ...bodyF }}
          >
            Kadans
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.mute, ...bodyF }}>
            {PROFIEL.plaats} · op de maat
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}33`, background: C.okWash, ...bodyF }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.mute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.accent, color: "#ffffff", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...bodyF }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.mute, ...bodyF }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold"
          style={{ background: C.accent, color: "#ffffff", ...bodyF }}
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
        className="flex items-center gap-1 overflow-x-auto rounded-xl p-1.5"
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
              className="relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{
                color: on ? "#ffffff" : C.inkSoft,
                background: on ? C.accent : "transparent",
                ...bodyF,
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
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Reveal i={0}>
          <Card className="p-7 md:p-9" accent>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24"
              aria-hidden="true"
              style={{ background: `linear-gradient(180deg, ${C.accentSoft}, transparent)` }}
            />
            <div className="relative">
              <Eyebrow Icon={Radio}>Vandaag · op tempo</Eyebrow>
              <h1
                className="mt-4 text-[34px] font-bold leading-[1.02] tracking-[-0.03em] md:text-[46px]"
                style={{ color: C.ink, ...bodyF }}
              >
                Goedemorgen, <span style={{ color: C.accent }}>{PROFIEL.naam.split(" ")[0]}</span>.
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                Je week heeft een ritme. Wat telt staat op de maat bovenaan — werk mee met de cadans
                en houd je praktijk verifieerbaar en betaald, zonder gedoe.
              </p>
              <div className="mt-5">
                <BeatBar count={40} active={0.7} />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <PrimaryButton onClick={onActies}>
                  Volgende actie
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </PrimaryButton>
                <GhostButton onClick={onOpen}>Naar de marktplaats</GhostButton>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal i={1}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Eyebrow tone={C.warnInk} Icon={AlertTriangle}>
                Vraagt aandacht
              </Eyebrow>
              <Timer size={20} aria-hidden="true" style={{ color: C.accent }} />
            </div>
            <h2
              className="mt-4 text-[22px] font-bold leading-snug tracking-[-0.02em]"
              style={{ color: C.ink, ...bodyF }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <div className="mt-5">
              <PrimaryButton onClick={onActies} className="w-full">
                {primair.cta}
                <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <p className="text-[12px]" style={{ color: C.mute, ...num }}>
                {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
              </p>
            </div>
          </Card>
        </Reveal>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow Icon={Waves}>Het ritme · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Reveal key={k.label} i={i + 2}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold" style={{ color: C.mute, ...bodyF }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={{
                      color: k.up ? C.okInk : C.warnInk,
                      background: k.up ? C.okWash : C.warnWash,
                      ...num,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-2.5 text-[28px] font-bold leading-none tracking-[-0.02em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <PulseLine data={k.spark} tone={k.up ? C.accent : C.warn} id={`kpi-${i}`} />
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow Icon={Zap}>Op de maat · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[12px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]"
              style={{ color: C.accent, ...bodyF }}
            >
              Alles bekijken →
            </button>
          </div>
          <Card>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <Reveal key={o.id} as="li" i={i + 6} className="block">
                  <div style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-[#f4f1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5b3df5] motion-reduce:transition-none"
                    >
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          background: i === 0 ? C.accentWash : C.bgAlt,
                          border: `1px solid ${i === 0 ? C.accentLine : C.line}`,
                        }}
                      >
                        <span
                          className="text-[12px] font-bold leading-none"
                          style={{ color: i === 0 ? C.accent : C.mute, ...num }}
                        >
                          {o.match}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[15px] font-semibold tracking-[-0.01em]"
                          style={{ color: C.ink }}
                        >
                          {o.titel}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[11.5px]"
                          style={{ color: C.mute }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <MatchMeter value={o.match} />
                        <ChevronRight
                          size={17}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                          style={{ color: C.faint }}
                        />
                      </span>
                    </button>
                  </div>
                </Reveal>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow Icon={ShieldCheck}>Certificaten</Eyebrow>
          </div>
          <Card className="p-5">
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
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}33`,
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
                      <span className="block truncate text-[10.5px]" style={{ color: C.mute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
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
      <Reveal i={0}>
        <div>
          <Eyebrow Icon={Zap}>Op de maat · open opdrachten</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.03em] md:text-[38px]"
            style={{ color: C.ink, ...bodyF }}
          >
            Marktplaats
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: C.mute, ...num }}>
            {String(filtered.length).padStart(2, "0")} van{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten in de maat
          </p>
        </div>
      </Reveal>

      <Reveal i={1}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="flex flex-1 items-center gap-2.5 rounded-lg px-4 py-3"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a6b0]"
              style={{ color: C.ink, ...bodyF }}
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
      </Reveal>

      {filtered.length === 0 ? (
        <Reveal i={2}>
          <Card className="p-6" accent>
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span
                className="inline-flex h-16 w-16 items-center justify-center rounded-xl"
                style={{
                  background: C.accentWash,
                  border: `1px solid ${C.accentLine}`,
                  color: C.accent,
                }}
                aria-hidden="true"
              >
                <Waves size={26} />
              </span>
              <p
                className="mt-5 text-[22px] font-bold tracking-[-0.02em]"
                style={{ color: C.ink, ...bodyF }}
              >
                Stil moment
              </p>
              <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
                Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om de
                cadans weer op gang te brengen.
              </p>
              <div className="mt-6">
                <PrimaryButton onClick={() => setQ("")}>
                  Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
                </PrimaryButton>
              </div>
            </div>
          </Card>
        </Reveal>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <Reveal key={o.id} as="li" i={i + 2} className="block">
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </Reveal>
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
  const tone = strong ? C.accent : C.info;
  return (
    <Card className="p-6" accent={strong}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.mute, border: `1px solid ${C.line}`, ...num }}
            >
              Beat {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.mute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[20px] font-bold leading-snug tracking-[-0.02em]"
            style={{ color: C.ink, ...bodyF }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.mute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-md px-2.5 py-1 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.bgAlt,
                  border: `1px solid ${C.lineSoft}`,
                  ...bodyF,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-xl"
            style={{ background: strong ? C.accentWash : C.bgAlt, border: `1.5px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.faint, ...bodyF }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: tone, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{ color: C.accent, border: `1px solid ${C.line}`, ...bodyF }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
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
              titel="In je voordeel"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
              wash={C.okWash}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              wash={C.warnWash}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
  wash,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
  wash: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: wash, border: `1px solid ${C.lineSoft}` }}>
      <p
        className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone, ...bodyF }}
      >
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
  const tone = strong ? C.accent : C.info;
  return (
    <div className="space-y-6">
      <Reveal i={0}>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-all hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa] motion-reduce:transition-none motion-reduce:hover:translate-x-0"
          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, background: C.card, ...bodyF }}
        >
          <ArrowLeft size={13} aria-hidden="true" /> Terug naar de marktplaats
        </button>
      </Reveal>

      <Reveal i={1}>
        <Card className="p-7 md:p-9" accent>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ color: C.mute, border: `1px solid ${C.line}`, ...num }}
            >
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-bold"
              style={{ color: "#ffffff", background: tone, ...bodyF }}
            >
              <Zap size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Uitgelicht"} ·{" "}
              {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[32px] font-bold leading-[1.06] tracking-[-0.03em] md:text-[44px]"
            style={{ color: C.ink, ...bodyF }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4">
            <BeatBar count={36} active={opdracht.match / 100} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <PrimaryButton>
              Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
            <GhostButton>Bewaren</GhostButton>
          </div>
        </Card>
      </Reveal>

      <Reveal i={2}>
        <Card>
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
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.mute, ...bodyF }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[19px] font-bold tracking-[-0.02em]"
                  style={{ color: C.ink, ...num }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal i={3}>
        <section>
          <Eyebrow Icon={Radio}>Waarom deze match</Eyebrow>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Transparant afgelezen van je geverifieerde profiel — wat in je voordeel telt én waar je
            op moet letten, op de maat, zonder verborgen score.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}33` }}
                  aria-hidden="true"
                >
                  <Check size={15} />
                </span>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.okInk, ...bodyF }}
                >
                  In je voordeel
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
                      style={{ color: C.okInk }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    color: C.warnInk,
                    background: C.warnWash,
                    border: `1px solid ${C.warn}33`,
                  }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={14} />
                </span>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.warnInk, ...bodyF }}
                >
                  Let op
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
                      style={{ color: C.warnInk }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Reveal i={0}>
        <Card className="p-7 md:p-9" accent>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <Eyebrow Icon={ShieldCheck}>Verificatie · in het gareel</Eyebrow>
              <h1
                className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.03em] md:text-[38px]"
                style={{ color: C.ink, ...bodyF }}
              >
                Jouw certificaten
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                <span className="font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.trust}.
                </span>{" "}
                {verified} van {CREDENTIALS.length} certificaten lopen op de maat, geverifieerd. Eén
                verloopt binnenkort en vraagt om vernieuwing.
              </p>
            </div>
            <span
              className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-2xl"
              style={{ background: C.accentWash, border: `1.5px solid ${C.accentLine}` }}
            >
              <span
                className="text-[26px] font-bold leading-none"
                style={{ color: C.accent, ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.mute, ...bodyF }}
              >
                % op maat
              </span>
            </span>
          </div>
        </Card>
      </Reveal>

      <Card>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.mute, ...bodyF }}
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
              <Reveal key={c.naam} as="li" i={idx} className="block">
                <div style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f4f1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5b3df5] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{
                          color: st.ink,
                          background: st.wash,
                          border: `1px solid ${st.tone}33`,
                        }}
                        aria-hidden="true"
                      >
                        <st.Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[15px] font-semibold tracking-[-0.01em]"
                          style={{ color: C.ink }}
                        >
                          {c.naam}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[11.5px]"
                          style={{ color: C.mute }}
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
                      <div className="px-6 pb-5 sm:pl-[76px]">
                        <div
                          className="rounded-xl p-4"
                          style={{ background: C.bgAlt, border: `1px solid ${C.lineSoft}` }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                            expliciete toestemming gedeeld met een opdrachtgever.
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
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <Reveal i={0}>
        <div>
          <Eyebrow Icon={Radio}>Acties · de metronoom</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.03em] md:text-[38px]"
            style={{ color: C.ink, ...bodyF }}
          >
            Wat nu op de maat komt
          </h1>
          <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.mute }}>
            Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
            blijven.
          </p>
        </div>
      </Reveal>

      {/* Cadans-timeline: een verticale maatlijn met beats per actie */}
      <Reveal i={1}>
        <Card className="p-6" accent>
          <div className="flex items-center justify-between">
            <Eyebrow Icon={Timer}>Cadans-tijdlijn · deze week</Eyebrow>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.mute, ...num }}
            >
              {ACTIES.length} beats
            </span>
          </div>
          <div className="relative mt-5 pl-6">
            <span
              className="absolute bottom-1 left-[7px] top-1 w-px"
              style={{ background: C.accentLine }}
              aria-hidden="true"
            />
            <ol className="space-y-4">
              {ACTIES.map((a) => {
                const warn = a.urgentie === "warning";
                const tone = warn ? C.warn : C.accent;
                return (
                  <li key={a.titel} className="relative">
                    <span
                      className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: C.card, border: `2px solid ${tone}` }}
                      aria-hidden="true"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
                    </span>
                    <p
                      className="text-[13.5px] font-semibold tracking-[-0.01em]"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </p>
                    <p className="mt-0.5 text-[11.5px]" style={{ color: C.mute }}>
                      {warn ? "Urgent — deze week" : "Aanbevolen — op tempo"}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="mt-4">
            <BeatDivider />
          </div>
        </Card>
      </Reveal>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.accent;
          const ink = warn ? C.warnInk : C.accent;
          const wash = warn ? C.warnWash : C.accentWash;
          return (
            <Reveal key={a.titel} as="li" i={i + 2} className="block">
              <Card className="p-6" accent={warn}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[15px] font-bold"
                    style={{ background: wash, border: `1.5px solid ${tone}`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}33`,
                        ...bodyF,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Zap size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[20px] font-bold leading-snug tracking-[-0.02em]"
                      style={{ color: C.ink, ...bodyF }}
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
              </Card>
            </Reveal>
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
  return { ink: C.mute, wash: C.bgAlt, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <Reveal i={0}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow Icon={Waves}>Facturen · de baten</Eyebrow>
            <h1
              className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.03em] md:text-[38px]"
              style={{ color: C.ink, ...bodyF }}
            >
              Facturen
            </h1>
          </div>
          <PrimaryButton>
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </PrimaryButton>
        </div>
      </Reveal>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s, i) => (
          <Reveal key={s.l} i={i + 1}>
            <Card className="p-6" accent={s.alarm}>
              <div className="flex items-center justify-between">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.mute, ...bodyF }}
                >
                  {s.l}
                </p>
                {s.alarm && (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ background: C.warnWash, color: C.warnInk }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={13} />
                  </span>
                )}
              </div>
              <p
                className="mt-2 text-[28px] font-bold tracking-[-0.02em]"
                style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
              >
                {s.v}
              </p>
              <p className="mt-1 text-[11.5px]" style={{ color: C.mute }}>
                {s.sub}
              </p>
            </Card>
          </Reveal>
        ))}
      </section>

      <Reveal i={4}>
        <Card>
          <div
            className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
              <span
                key={h}
                className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                style={{ color: C.mute, ...bodyF }}
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
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f4f1ff] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="order-1 text-[11.5px] font-semibold"
                    style={{ color: C.mute, ...num }}
                  >
                    {f.nr}
                  </span>
                  <span
                    className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span
                    className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                    style={{ color: C.mute, ...num }}
                  >
                    {f.datum}
                  </span>
                  <span className="order-5 sm:order-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-semibold"
                      style={{
                        color: ft.ink,
                        background: ft.wash,
                        border: `1px solid ${ft.tone}33`,
                        ...bodyF,
                      }}
                    >
                      {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                      {f.status}
                    </span>
                  </span>
                  <span
                    className="order-2 text-right text-[14px] font-bold sm:order-5"
                    style={{ color: acc ? C.warnInk : C.ink, ...num }}
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
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.mute, ...bodyF }}
            >
              <Waves size={12} aria-hidden="true" style={{ color: C.accent }} /> Totaal betaald
            </span>
            <span className="text-[20px] font-bold" style={{ color: C.ink, ...num }}>
              {totaalBetaald}
            </span>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
