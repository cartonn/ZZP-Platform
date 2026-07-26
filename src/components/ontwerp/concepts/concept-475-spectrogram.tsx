"use client";

// Concept 475 — "Spectrogram" · Frequentie-spectrum data-viz taal. De hele UI leent van
// spectrogrammen/equalizers: KPI's en sparklines worden kleurige verticale frequentie-banden,
// match-scores lopen als spectrum-balken van koel naar warm, activiteit is een spectrogram-strook.
// Diepviolet/indigo canvas met levendige spectrum-kleuren (violet → cyaan → amber). Techy, elegant.

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  AudioWaveform,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Radio,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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

// — Palet: diepviolet/indigo canvas, spectrum-accenten violet → cyaan → amber —
const C = {
  bg: "#0e0b1a", // diepviolet canvas
  bgAlt: "#141029",
  panel: "#181233", // paneel-indigo
  panelAlt: "#1f1840",
  panelHi: "#251c4d",
  fg: "#ece9f5", // bijna-wit lavendel
  fgSoft: "#c3bde0",
  fgMute: "#8f88b8",
  fgFaint: "#6b6494",
  line: "#2a2350",
  lineSoft: "#221b45",
  // spectrum-stops (koel → warm)
  violet: "#8b5cf6",
  indigo: "#6366f1",
  blue: "#3b82f6",
  cyan: "#22d3ee",
  teal: "#2dd4bf",
  green: "#34d399",
  lime: "#a3e635",
  amber: "#fbbf24",
  orange: "#fb923c",
  rose: "#fb7185",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Spectrum-verloop: t in [0,1] → koel (violet) naar warm (amber/oranje).
const SPECTRUM = [C.violet, C.indigo, C.blue, C.cyan, C.teal, C.green, C.lime, C.amber, C.orange];
function spectrumAt(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (SPECTRUM.length - 1));
  return SPECTRUM[idx] ?? C.cyan;
}
const SPECTRUM_GRADIENT = `linear-gradient(90deg, ${SPECTRUM.join(", ")})`;

// Canvas-achtergrond: donker met zachte spectrum-gloed.
function canvasBg(): React.CSSProperties {
  return {
    backgroundColor: C.bg,
    backgroundImage: [
      "radial-gradient(80% 55% at 8% -5%, rgba(139,92,246,0.16) 0%, rgba(139,92,246,0) 55%)",
      "radial-gradient(70% 50% at 98% 0%, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0) 55%)",
      "radial-gradient(90% 60% at 60% 108%, rgba(251,146,60,0.08) 0%, rgba(251,146,60,0) 50%)",
    ].join(","),
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, ink: C.teal };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.blue };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, ink: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.rose };
  }
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// — Paneel met glaseffect en fijne rand —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  interactive?: boolean;
  glow?: string;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl ${interactive ? "sg-int" : ""} ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.panelAlt} 0%, ${C.panel} 100%)`,
        border: `1px solid ${C.line}`,
        boxShadow: glow
          ? `0 0 0 1px ${hexA(glow, 0.12)}, 0 18px 40px -24px rgba(0,0,0,0.8)`
          : "0 18px 40px -26px rgba(0,0,0,0.8)",
        color: C.fg,
      }}
    >
      {children}
    </Tag>
  );
}

function Label({ children, tone = C.cyan }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em]"
      style={{ color: tone, ...bodyFont }}
    >
      <AudioWaveform size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function Btn({
  children,
  onClick,
  tone = C.cyan,
  variant = "solid",
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  variant?: "solid" | "ghost";
  className?: string;
  ariaPressed?: boolean;
}) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-bold transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: solid ? C.bg : tone,
        background: solid ? tone : hexA(tone, 0.1),
        border: `1px solid ${solid ? tone : hexA(tone, 0.45)}`,
        boxShadow: solid ? `0 4px 16px -6px ${hexA(tone, 0.7)}` : "none",
        ...bodyFont,
        ["--tw-ring-color" as string]: tone,
        ["--tw-ring-offset-color" as string]: C.bg,
      }}
    >
      {children}
    </button>
  );
}

// — Frequentie-banden: sparkline als kleurige verticale banden (koel → warm op hoogte) —
function FreqBands({
  data,
  height = 40,
  warm = true,
}: {
  data: number[];
  height?: number;
  warm?: boolean;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden="true">
      {data.map((d, i) => {
        const t = (d - min) / span;
        const h = 24 + t * 76;
        const tone = warm ? spectrumAt(t) : spectrumAt(0.15 + t * 0.35);
        return (
          <span
            key={i}
            className="w-full rounded-[2px]"
            style={{
              height: `${h}%`,
              background: `linear-gradient(180deg, ${tone} 0%, ${hexA(tone, 0.35)} 100%)`,
              boxShadow: `0 0 8px -2px ${hexA(tone, 0.7)}`,
              transition: "height 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        );
      })}
    </div>
  );
}

// — Match als spectrum-balk (koel → warm), gevuld tot score —
function SpectrumBar({ value, height = 10 }: { value: number; height?: number }) {
  return (
    <span
      className="relative block w-full overflow-hidden rounded-full"
      style={{ height, background: C.bgAlt }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${value}%`,
          backgroundImage: SPECTRUM_GRADIENT,
          backgroundSize: `${(100 / value) * 100}% 100%`,
          transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </span>
  );
}

// — Spectrogram-strook: raster van cellen met wisselende intensiteit/kleur (activiteit over tijd) —
function SpectrogramStrip({
  rows = 5,
  cols = 28,
  seed = 1,
}: {
  rows?: number;
  cols?: number;
  seed?: number;
}) {
  // deterministische pseudo-ruis (geen Math.random → stabiel bij SSR/hydration)
  const cells: { t: number; a: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: { t: number; a: number }[] = [];
    for (let c = 0; c < cols; c++) {
      const v = Math.abs(
        Math.sin((r + 1) * 1.7 + (c + 1) * 0.55 * seed) * Math.cos((c + 1) * 0.3 + seed),
      );
      row.push({ t: v, a: 0.12 + v * 0.88 });
    }
    cells.push(row);
  }
  return (
    <div className="flex flex-col gap-[3px]" aria-hidden="true">
      {cells.map((row, r) => (
        <div key={r} className="flex gap-[3px]">
          {row.map((cell, c) => (
            <span
              key={c}
              className="h-2 flex-1 rounded-[2px]"
              style={{ background: hexA(spectrumAt(cell.t), cell.a) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatusChip({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const st = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${small ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]"}`}
      style={{
        color: st.ink,
        background: hexA(st.ink, 0.12),
        border: `1px solid ${hexA(st.ink, 0.5)}`,
        ...bodyFont,
      }}
    >
      <st.Icon size={small ? 10 : 11} aria-hidden="true" />
      {st.label}
      {st.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

export function Concept475() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.fg, ...canvasBg() }}
    >
      <style>{`
        @keyframes sgRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .sg-rise { animation: sgRise 0.44s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .sg-int { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s; }
        .sg-int:hover { transform: translateY(-3px); border-color: ${C.violet}; box-shadow: 0 0 0 1px ${hexA(C.violet, 0.25)}, 0 24px 48px -24px rgba(0,0,0,0.85); }
        @media (prefers-reduced-motion: reduce) { .sg-rise { animation: none !important; } .sg-int { transition: none !important; } .sg-int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="sg-rise pt-6">
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
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundImage: SPECTRUM_GRADIENT,
            color: C.bg,
            boxShadow: `0 6px 18px -6px ${hexA(C.violet, 0.8)}`,
          }}
          aria-hidden="true"
        >
          <AudioWaveform size={20} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: C.fg }}>
            Spectrogram
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.fgMute }}>
            Signaal in beeld · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.teal,
            background: hexA(C.teal, 0.12),
            border: `1px solid ${hexA(C.teal, 0.5)}`,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.rose, color: C.bg, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.fg }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.fgMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[12.5px] font-bold"
          style={{
            background: hexA(C.violet, 0.16),
            border: `1px solid ${hexA(C.violet, 0.5)}`,
            color: C.violet,
            ...num,
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
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div
        className="flex items-stretch gap-1 overflow-x-auto rounded-xl p-1.5"
        style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          const tone = spectrumAt(i / (SCREENS.length - 1));
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group relative shrink-0 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none"
              style={{
                color: on ? C.bg : C.fgSoft,
                background: on ? tone : "transparent",
                boxShadow: on ? `0 4px 14px -4px ${hexA(tone, 0.8)}` : "none",
                ...bodyFont,
                ["--tw-ring-color" as string]: tone,
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: on ? C.bg : tone }}
                  aria-hidden="true"
                />
                {s.label}
              </span>
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
    <div className="space-y-5 pt-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="sg-int p-7 md:p-8" glow={C.violet}>
          <Label tone={C.cyan}>Live signaal · overzicht</Label>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
            style={{ color: C.fg }}
          >
            Je profiel zendt sterk, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
            Alle frequenties in het groen: certificaten geverifieerd, verse matches op hoge
            amplitude en één band die vandaag even bijgeregeld moet worden.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Btn onClick={onActies} tone={C.cyan}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Btn>
            <Btn onClick={onOpen} tone={C.violet} variant="ghost">
              Naar de marktplaats
            </Btn>
          </div>
          <div className="mt-7">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.fgMute, ...bodyFont }}
            >
              Activiteit · laatste 4 weken
            </p>
            <SpectrogramStrip rows={4} cols={30} seed={1.3} />
          </div>
        </Panel>

        <Panel className="sg-int p-6" glow={C.amber}>
          <div className="flex items-center justify-between">
            <Label tone={C.amber}>Bandkorrectie · let op</Label>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: hexA(C.amber, 0.14),
                border: `1px solid ${hexA(C.amber, 0.5)}`,
                color: C.amber,
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <Btn onClick={onActies} tone={C.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </Btn>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.fgMute, borderColor: C.line }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.teal }} />
            {verified}/{CREDENTIALS.length} certificaten in orde · 7 open reacties
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Label tone={C.green}>Frequentiebanden · deze maand</Label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const Trend = k.up ? TrendingUp : TrendingDown;
            const trendTone = k.up ? C.green : C.rose;
            return (
              <Panel key={k.label} className="sg-int p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.fgMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: trendTone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[25px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.fg, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-4">
                  <FreqBands data={k.spark} height={40} warm={k.up} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Label tone={C.violet}>Sterkste matches</Label>
            <button
              type="button"
              onClick={onOpen}
              className="rounded px-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.violet, ...bodyFont, ["--tw-ring-color" as string]: C.violet }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const tone = spectrumAt(o.match / 100);
              return (
                <li key={o.id}>
                  <Panel className="sg-int p-4" as="article">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group flex w-full items-center gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2"
                      style={{ ["--tw-ring-color" as string]: tone }}
                    >
                      <span
                        className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                        style={{
                          background: hexA(tone, 0.14),
                          border: `1px solid ${hexA(tone, 0.5)}`,
                        }}
                        aria-hidden="true"
                      >
                        <span
                          className="text-[15px] font-bold leading-none"
                          style={{ color: tone, ...num }}
                        >
                          {o.match}
                        </span>
                        <span
                          className="text-[7.5px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: tone }}
                        >
                          match
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-bold"
                          style={{ color: C.fg }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11.5px]" style={{ color: C.fgMute }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                        <span className="mt-2 block">
                          <SpectrumBar value={o.match} height={6} />
                        </span>
                      </span>
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.fgFaint }}
                      />
                    </button>
                  </Panel>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-3">
            <Label tone={C.teal}>Certificaten</Label>
          </div>
          <Panel className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: hexA(st.ink, 0.14),
                        border: `1px solid ${hexA(st.ink, 0.5)}`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.fgMute }}>
                        {st.label}
                      </span>
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
  const [failed, setFailed] = useState(false);

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
    <div className="space-y-6 pt-6">
      <div>
        <Label tone={C.violet}>Marktplaats · spectrumscan</Label>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.fg }}
        >
          Opdrachten voor jou
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.fgMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jouw profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6b6494]"
            style={{ color: C.fg, ...bodyFont }}
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Sorteren en laden"
        >
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              onClick={() => setSort(s)}
              tone={C.cyan}
              variant={sort === s ? "solid" : "ghost"}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
          <Btn
            onClick={() => {
              setFailed(false);
              setLoading((v) => !v);
            }}
            tone={C.green}
            variant={loading ? "solid" : "ghost"}
            ariaPressed={loading}
          >
            {loading ? "Stop scan" : "Scannen"}
          </Btn>
          <Btn
            onClick={() => setFailed((v) => !v)}
            tone={C.rose}
            variant={failed ? "solid" : "ghost"}
            ariaPressed={failed}
          >
            Fout tonen
          </Btn>
        </div>
      </div>

      {failed ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-12 text-center" role="alert">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-xl"
              style={{
                background: hexA(C.rose, 0.14),
                border: `1px solid ${hexA(C.rose, 0.5)}`,
                color: C.rose,
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={24} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.fg }}>
              Signaal verloren
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              De spectrumscan kon geen verbinding maken. Probeer de scan opnieuw te starten.
            </p>
            <div className="mt-6">
              <Btn onClick={() => setFailed(false)} tone={C.rose}>
                Opnieuw scannen <ArrowRight size={14} aria-hidden="true" />
              </Btn>
            </div>
          </div>
        </Panel>
      ) : loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.panelHi }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.panelHi }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.panelHi }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ background: C.panelHi, border: `1px solid ${C.line}`, color: C.fgMute }}
              aria-hidden="true"
            >
              <Radio size={24} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.fg }}>
              Geen frequentie gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
              Geen opdracht bij {q ? `"${q}"` : "je zoekterm"}. Stem af op een ander trefwoord.
            </p>
            <div className="mt-6">
              <Btn onClick={() => setQ("")} tone={C.cyan}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </Btn>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-3">
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
  const tone = spectrumAt(opdracht.match / 100);
  return (
    <Panel className="sg-int p-5" as="article">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.fgMute, border: `1px solid ${C.line}`, ...num }}
            >
              kanaal {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.fgFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.fgMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.fgSoft,
                  background: C.bgAlt,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-lg px-3 py-1.5"
            style={{ background: hexA(tone, 0.14), border: `1px solid ${hexA(tone, 0.5)}` }}
          >
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.fg, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <SpectrumBar value={opdracht.match} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: C.fg,
            border: `1px solid ${C.line}`,
            background: C.bgAlt,
            ...bodyFont,
            ["--tw-ring-color" as string]: tone,
          }}
        >
          <Activity size={12} aria-hidden="true" />
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn onClick={onOpen} tone={C.cyan}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={C.teal}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={C.amber}
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
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: C.bgAlt,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.fgSoft }}>
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
  const tone = spectrumAt(opdracht.match / 100);
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-5 pt-6">
      <Btn onClick={onBack} tone={C.violet} variant="ghost">
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel className="p-7 md:p-8" glow={tone}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.fgMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: C.bg, background: tone, ...bodyFont }}
          >
            <ShieldCheck size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[36px]"
          style={{ color: C.fg }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.fgSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5">
          <SpectrumBar value={opdracht.match} height={12} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Btn tone={C.cyan}>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn tone={C.violet} variant="ghost">
            Bewaren
          </Btn>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.fgMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.fg, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Label tone={C.cyan}>Waarom deze match bij je past</Label>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Afgezet tegen je geverifieerde profiel — wat in je voordeel spreekt én wat goed is om te
          weten, open en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.teal, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.fgSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.teal }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.amber, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.fgSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-6">
      <Panel className="p-7 md:p-8" glow={C.teal}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Label tone={C.teal}>Verificatie · signaalsterkte</Label>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.fg }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-bold" style={{ color: C.teal }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — die stemmen we op tijd bij. Je documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <SpectrumBar value={ratio} height={10} />
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: hexA(C.teal, 0.12), border: `2px solid ${hexA(C.teal, 0.6)}` }}
            aria-hidden="true"
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.teal, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.teal }}
            >
              % in orde
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1f1840] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: st.ink }}
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background: hexA(st.ink, 0.14),
                      border: `1px solid ${hexA(st.ink, 0.5)}`,
                      color: st.ink,
                    }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.fg }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.fgMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex">
                      <StatusChip status={c.status} />
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.fgFaint,
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[76px]">
                      <div
                        className="rounded-xl p-4"
                        style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn tone={c.status === "EXPIRING" ? C.amber : C.cyan}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </Btn>
                          <Btn tone={C.violet} variant="ghost">
                            Historie
                          </Btn>
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
          <Label tone={C.blue}>Documentenkast</Label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => (
            <Panel key={d.naam} className="flex items-center gap-3 p-4">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: C.bgAlt, border: `1px solid ${C.line}`, color: C.fgSoft }}
                aria-hidden="true"
              >
                <FileText size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold" style={{ color: C.fg }}>
                  {d.naam}
                </span>
                <span className="block text-[10.5px]" style={{ color: C.fgMute, ...num }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </span>
              </span>
              <StatusChip status={d.status} small />
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-6">
      <div>
        <Label tone={C.amber}>Acties · gesorteerd op amplitude</Label>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.fg }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.fgSoft }}>
          De sterkste pieken bovenaan. Werk ze van boven naar beneden af.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          return (
            <li key={a.titel}>
              <Panel className="sg-int p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[14px] font-bold"
                    style={{
                      background: hexA(tone, 0.14),
                      border: `1px solid ${hexA(tone, 0.5)}`,
                      color: tone,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: hexA(tone, 0.14),
                        border: `1px solid ${hexA(tone, 0.5)}`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Clock size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2 className="mt-2 text-[18px] font-bold leading-snug" style={{ color: C.fg }}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.fgSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <Btn tone={warn ? C.amber : C.cyan}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
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

function factuurTone(status: string): { ink: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.rose, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.teal, Icon: Check };
  return { ink: C.fgMute, Icon: FileText };
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
    <div className="space-y-5 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label tone={C.green}>Facturen · uitgaand signaal</Label>
          <h1
            className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] md:text-[34px]"
            style={{ color: C.fg }}
          >
            Jouw facturen
          </h1>
        </div>
        <Btn tone={C.cyan}>Nieuwe factuur</Btn>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: C.teal },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.rose },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.fgMute },
        ].map((s) => (
          <Panel key={s.l} className="sg-int p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.fgMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.rose }} />}
            </div>
            <p
              className="mt-2 text-[25px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.fgMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            onClick={() => setSort(s)}
            tone={C.green}
            variant={sort === s ? "solid" : "ghost"}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.fgMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#1f1840]"
                    style={{
                      background: i % 2 === 1 ? C.bgAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.fgMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-bold" style={{ color: C.fg }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.fgMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{
                          color: ft.ink,
                          background: hexA(ft.ink, 0.12),
                          border: `1px solid ${hexA(ft.ink, 0.5)}`,
                          ...bodyFont,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{ color: C.fg, ...num }}
                    >
                      {f.bedrag}
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
