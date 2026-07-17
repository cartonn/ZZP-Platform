"use client";

// Concept 377 — "Oscilloscoop" · Fosfor golfvorm / meetinstrument.
// Meetlab-oscilloscoop: gloeiende fosfor-groene golfvormen op een donker raster-scherm, signaal-
// traces, division-grid met fijne rasterlijntjes en meetuitlezingen (V/div, freq, trigger). KPI-
// trends zijn live golfvormen, activiteit is signaal, match is amplitude en verificatie-status
// verschijnt als "signaal vergrendeld". Palet: scherm-donker (#08120d), fosfor-groen (#2bff88),
// dim-fosfor (#159a5b), amber-trigger (#ffb347), signaal-rood (#ff5a4d). Fonts: Geist Mono + Geist.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Minus,
  Activity,
  Radio,
  Waves,
  Gauge,
  ChevronRight,
  Lock,
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

// — Palet: donker scope-scherm met fosfor-groen, dim-fosfor, amber-trigger en signaal-rood —
const C = {
  screen: "#08120d",
  screenDeep: "#050b08",
  panel: "#0c1a13",
  panelSoft: "#0a1610",
  ink: "#daffe8",
  inkSoft: "#9fd9b6",
  muted: "#6fae89",
  faint: "#4a7860",
  phosphor: "#2bff88",
  phosphorDim: "#159a5b",
  amber: "#ffb347",
  red: "#ff5a4d",
  cyan: "#4fd6e0",
  grid: "rgba(43,255,136,0.09)",
  gridFine: "rgba(43,255,136,0.045)",
  line: "rgba(43,255,136,0.2)",
  lineSoft: "rgba(43,255,136,0.1)",
};

const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };

// Status → signaal-conditie op de scope.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  color: string;
  code: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Signaal vergrendeld",
        Icon: Lock,
        alarm: false,
        color: C.phosphor,
        code: "LOCK",
      };
    case "SUBMITTED":
      return { label: "Trigger zoekt", Icon: Clock, alarm: false, color: C.cyan, code: "SYNC" };
    case "EXPIRING":
      return {
        label: "Amplitude zakt",
        Icon: AlertTriangle,
        alarm: true,
        color: C.amber,
        code: "WARN",
      };
    case "REJECTED":
      return { label: "Signaal verloren", Icon: XCircle, alarm: true, color: C.red, code: "LOSS" };
  }
}

// Pseudo freq/kanaal-referentie afgeleid van een string — meetuitlezing-label.
function chan(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) % 9999;
  return `${(n % 48) + 2}.${String(n % 100).padStart(2, "0")} kHz`;
}

// — Golfvorm-trace: gladde sinus-achtige interpolatie van datapunten op het scope-raster —
function Waveform({
  data,
  color = C.phosphor,
  w = 260,
  h = 84,
  live = false,
  glow = true,
}: {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  live?: boolean;
  glow?: boolean;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 8;
  const pts: { x: number; y: number }[] = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((d - min) / range) * (h - pad * 2),
  }));
  const at = (i: number): { x: number; y: number } => {
    const idx = Math.max(0, Math.min(pts.length - 1, i));
    return pts[idx] ?? { x: pad, y: h / 2 };
  };
  // Catmull-Rom → cubic bezier for a smooth analog trace.
  const first = at(0);
  let path = `M ${first.x} ${first.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  const last = at(pts.length - 1);
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block"
    >
      {/* division grid */}
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={(w / 8) * i}
          y1={0}
          x2={(w / 8) * i}
          y2={h}
          stroke={i === 4 ? C.line : C.gridFine}
          strokeWidth={i === 4 ? 0.8 : 0.5}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`hh${i}`}
          x1={0}
          y1={(h / 4) * i}
          x2={w}
          y2={(h / 4) * i}
          stroke={i === 2 ? C.line : C.gridFine}
          strokeWidth={i === 2 ? 0.8 : 0.5}
        />
      ))}
      {glow && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={4}
          opacity={0.28}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "blur(2px)" }}
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill={color}>
        {live && (
          <animate attributeName="opacity" values="1;0.3;1" dur="1.3s" repeatCount="indefinite" />
        )}
      </circle>
    </svg>
  );
}

// — Meetuitlezing-blokje (V/div stijl) —
function Readout({
  label,
  value,
  color = C.phosphor,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-3 px-2 py-1"
      style={{ border: `1px solid ${C.lineSoft}` }}
    >
      <span
        className="text-[9.5px] uppercase tracking-[0.14em]"
        style={{ color: C.faint, ...mono }}
      >
        {label}
      </span>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color, ...mono }}>
        {value}
      </span>
    </div>
  );
}

// — Amplitude-balk (VU-meter stijl) —
function Amplitude({ pct, color = C.phosphor }: { pct: number; color?: string }) {
  const cells = 20;
  const on = Math.round((pct / 100) * cells);
  return (
    <div className="flex items-center gap-[2px]" aria-hidden="true">
      {Array.from({ length: cells }, (_, i) => {
        const active = i < on;
        const c = i > cells - 4 ? C.amber : i > cells - 8 ? C.phosphor : color;
        return (
          <span
            key={i}
            className="h-3.5 w-1 rounded-[1px]"
            style={{ background: active ? c : C.lineSoft }}
          />
        );
      })}
    </div>
  );
}

// Scherm-raster achtergrond (division grid + glow vignette).
const scopeTexture: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(43,255,136,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(43,255,136,0.05) 1px, transparent 1px), radial-gradient(ellipse at 50% 40%, rgba(43,255,136,0.05), transparent 60%)",
  backgroundSize: "40px 40px, 40px 40px, 100% 100%",
};

function Label({ children, color = C.phosphor }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em]"
      style={{ color, ...mono }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

function Chan({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] tabular-nums"
      style={{ color: C.faint, ...mono }}
    >
      <Radio size={11} aria-hidden="true" style={{ color: C.phosphorDim }} />
      {children}
    </span>
  );
}

function Chip({ children, color = C.phosphorDim }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
      style={{ color, border: `1px solid ${color}`, ...mono }}
    >
      {children}
    </span>
  );
}

function Screen({
  children,
  className = "",
  live = false,
}: {
  children: React.ReactNode;
  className?: string;
  live?: boolean;
}) {
  return (
    <div
      className={`rounded-md ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${live ? C.phosphorDim : C.line}`,
        boxShadow: live ? "inset 0 0 24px rgba(43,255,136,0.08)" : "inset 0 0 18px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );
}

export function Concept377() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.screen, color: C.ink, ...scopeTexture }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} goActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
        <FooterRail />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-md"
          style={{ border: `1.5px solid ${C.phosphorDim}`, background: C.panelSoft }}
          aria-hidden="true"
        >
          <Activity size={20} color={C.phosphor} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[0.02em]"
            style={{ ...mono, color: C.phosphor }}
          >
            OSCILLOSCOOP
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.26em]"
            style={{ color: C.muted, ...mono }}
          >
            CH1 · {PROFIEL.plaats} · {chan(PROFIEL.naam)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] sm:inline-flex"
          style={{ color: C.phosphor, border: `1px solid ${C.phosphorDim}`, ...mono }}
        >
          <Lock size={11} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span
            className="block text-[12px] font-medium leading-tight"
            style={{ color: C.ink, ...mono }}
          >
            {PROFIEL.naam}
          </span>
          <span className="block text-[10px] leading-tight" style={{ color: C.faint, ...mono }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-md text-[11px]"
          style={{ border: `1px solid ${C.phosphor}`, color: C.phosphor, ...mono }}
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
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: on ? C.phosphor : C.muted,
              ...mono,
              ["--tw-ring-color" as string]: C.phosphor,
            }}
          >
            <span
              className="mr-2 text-[10px] tabular-nums"
              style={{ color: on ? C.amber : C.faint }}
            >
              CH{i + 1}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: C.phosphor, boxShadow: `0 0 6px ${C.phosphor}` }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, goActies }: { onOpen: () => void; goActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const lock = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="self-center">
          <Label color={C.amber}>Trace 01 · vandaag</Label>
          <h1
            className="mt-5 text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[48px]"
            style={{ ...body, color: C.ink }}
          >
            Goedemorgen,
            <br />
            <span style={{ color: C.phosphor }}>{PROFIEL.naam.split(" ")[0]}</span>.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je signalen lopen stabiel. Eén trace vraagt om afstellen — vergrendel hem en het hele
            meetbeeld staat weer strak.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Amplitude pct={lock} />
            <span className="text-[12px] tabular-nums" style={{ color: C.phosphor, ...mono }}>
              {lock}% vergrendeld
            </span>
          </div>
        </div>

        <Screen className="relative overflow-hidden p-5" live>
          <div className="mb-3 flex items-center justify-between">
            <Label color={C.amber}>Trigger-event</Label>
            <Chan>{chan(primair.titel)}</Chan>
          </div>
          <div className="overflow-hidden rounded" style={{ background: C.screenDeep }}>
            <Waveform data={[4, 7, 3, 9, 5, 11, 6, 8]} color={C.amber} h={72} live />
          </div>
          <h2
            className="mt-4 text-[18px] font-semibold leading-snug"
            style={{ ...body, color: C.ink }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <button
            onClick={goActies}
            className="group mt-4 inline-flex items-center gap-2 rounded px-5 py-2.5 text-[13px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.phosphor,
              color: C.screenDeep,
              ...mono,
              ["--tw-ring-color" as string]: C.amber,
            }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Screen>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Label>Kanalen · telemetrie</Label>
          <Chan>timebase 200ms/div</Chan>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {KPIS.map((k, idx) => {
            const col = k.up ? C.phosphor : C.amber;
            return (
              <Screen key={k.label} className="p-5" live={idx === 0}>
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: C.muted, ...mono }}
                    >
                      CH{idx + 1} · {k.label}
                    </p>
                    <p
                      className="mt-1.5 text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                      style={{ ...body, color: C.ink }}
                    >
                      {k.value}
                    </p>
                  </div>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: k.up ? C.phosphor : C.red, ...mono }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <div className="mt-3 overflow-hidden rounded" style={{ background: C.screenDeep }}>
                  <Waveform data={k.spark} color={col} h={70} live={idx === 0} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <Readout label="V/div" value={`${(idx + 1) * 2}.0`} color={col} />
                  <Readout label="freq" value={chan(k.label).replace(" kHz", "k")} color={col} />
                  <Readout
                    label="pk-pk"
                    value={`${Math.max(...k.spark).toFixed(0)}u`}
                    color={col}
                  />
                </div>
              </Screen>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div
            className="mb-5 flex items-baseline justify-between border-b pb-2"
            style={{ borderColor: C.line }}
          >
            <Label>Gemeten matches</Label>
            <button
              onClick={onOpen}
              className="text-[10px] uppercase tracking-[0.14em] transition-colors hover:text-[#2bff88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.muted, ...mono }}
            >
              Volledig meetbeeld
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => {
              const col = o.match >= 90 ? C.phosphor : C.cyan;
              return (
                <li key={o.id}>
                  <button
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded p-3.5 text-left transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      border: `1px solid ${C.lineSoft}`,
                      background: C.panelSoft,
                      ["--tw-ring-color" as string]: C.phosphor,
                    }}
                  >
                    <span
                      className="h-10 w-24 overflow-hidden rounded"
                      style={{ background: C.screenDeep }}
                    >
                      <Waveform
                        data={o.redenen.plus
                          .map((_, j) => 3 + ((i + j) % 4) * 2)
                          .concat([o.match / 12])}
                        color={col}
                        w={96}
                        h={40}
                        glow={false}
                      />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ ...body, color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.muted, ...mono }}
                      >
                        {o.opdrachtgever} · {chan(o.id)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className="text-[15px] font-semibold tabular-nums"
                        style={{ color: col, ...mono }}
                      >
                        {o.match}%
                      </span>
                      <ChevronRight
                        size={16}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.faint }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div
            className="mb-5 flex items-baseline justify-between border-b pb-2"
            style={{ borderColor: C.line }}
          >
            <Label color={C.cyan}>Signaal-in · berichten</Label>
            <Waves size={13} aria-hidden="true" style={{ color: C.cyan }} />
          </div>
          <ul className="space-y-2">
            {BERICHTEN.map((b) => (
              <li key={b.van}>
                <div
                  className="flex items-start gap-3 rounded p-3"
                  style={{ border: `1px solid ${C.lineSoft}`, background: C.panelSoft }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[10px]"
                    style={{
                      border: `1px solid ${b.ongelezen ? C.cyan : C.faint}`,
                      color: b.ongelezen ? C.cyan : C.muted,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...body, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[10px] tabular-nums"
                        style={{ color: C.faint, ...mono }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  {b.ongelezen && (
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: C.cyan, boxShadow: `0 0 5px ${C.cyan}` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Label>Signaalbron</Label>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.02em]"
            style={{ ...body, color: C.ink }}
          >
            Open opdrachten
          </h1>
        </div>
        <Chan>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          traces
        </Chan>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded px-3 py-2.5"
          style={{ border: `1px solid ${C.line}`, background: C.panelSoft }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#4a7860]"
            style={{ color: C.ink, ...mono }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.phosphor, color: C.screenDeep, ...mono }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
                }
              >
                {s === "match" ? "Amplitude" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Screen className="p-0">
          <div className="flex flex-col items-center py-14 text-center">
            <Activity size={56} color={C.faint} aria-hidden="true" />
            <p className="mt-5 text-[22px] font-semibold" style={{ ...body, color: C.ink }}>
              Geen signaal
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen trace op {q ? `"${q}"` : "je filter"}. Verruim de zoekterm om het meetbeeld
              opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 rounded px-5 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.phosphor, color: C.screenDeep, ...mono }}
            >
              Filter wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Screen>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtCard opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtCard({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const col = opdracht.match >= 90 ? C.phosphor : C.cyan;
  return (
    <Screen className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div
            className="flex items-center gap-2 text-[10.5px] tabular-nums"
            style={{ color: C.faint, ...mono }}
          >
            <span>CH{String(index + 1).padStart(2, "0")}</span>
            <span style={{ color: C.phosphorDim }}>·</span>
            <Chan>{chan(opdracht.id)}</Chan>
          </div>
          <h3
            className="mt-1 text-[17px] font-semibold leading-snug"
            style={{ ...body, color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.muted, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[20px] font-semibold tabular-nums" style={{ color: col, ...mono }}>
            {opdracht.match}%
          </span>
          <span className="text-[13px] font-medium" style={{ color: C.amber, ...mono }}>
            {opdracht.tarief}
          </span>
          <Amplitude pct={opdracht.match} color={col} />
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded" style={{ background: C.screenDeep }}>
        <Waveform data={[3, 6, 4, 8, 5, opdracht.match / 10, 6, 9]} color={col} h={54} />
      </div>
      <div
        className="mt-3 flex items-center gap-4 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors hover:text-[#2bff88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Signaal-analyse
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.phosphor, ...mono }}
        >
          Meet door <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.phosphor, ...mono }}
              >
                Sterk signaal
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.phosphor }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.amber, ...mono }}
              >
                Ruis
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.amber }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] transition-colors hover:text-[#2bff88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar het meetbeeld
      </button>

      <Screen className="relative overflow-hidden p-6 md:p-8" live>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tracking-[0.1em]" style={{ color: C.amber, ...mono }}>
            {opdracht.id}
          </span>
          <Chip color={C.phosphor}>{opdracht.match}% amplitude</Chip>
          <Chan>{chan(opdracht.id)}</Chan>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-semibold leading-[1.06] tracking-[-0.02em] md:text-[42px]"
          style={{ ...body, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: C.muted, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 overflow-hidden rounded" style={{ background: C.screenDeep }}>
          <Waveform
            data={[4, 8, 5, 11, 6, 9, opdracht.match / 9, 7, 10]}
            color={C.phosphor}
            h={96}
            live
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded px-5 py-3 text-[13.5px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.phosphor, color: C.screenDeep, ...mono }}
          >
            Reageer op trace <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded px-5 py-3 text-[13.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.amber, border: `1px solid ${C.amber}`, ...mono }}
          >
            Bewaar meting
          </button>
        </div>
      </Screen>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Amplitude", v: `${opdracht.match}%` },
        ].map((m) => (
          <Screen key={m.l} className="p-4">
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ ...body, color: C.ink }}
            >
              {m.v}
            </p>
          </Screen>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Label>Signaal-analyse · waarom deze meting</Label>
        </div>
        <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant afgeleid van je geverifieerde profiel — het sterke signaal én de ruis, zonder
          verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Screen className="p-5">
            <div className="flex items-center gap-2">
              <Check size={15} aria-hidden="true" style={{ color: C.phosphor }} />
              <Label>Sterk signaal</Label>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: C.phosphor, boxShadow: `0 0 6px ${C.phosphor}` }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Screen>
          <Screen className="p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} aria-hidden="true" style={{ color: C.amber }} />
              <p
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: C.amber, ...mono }}
              >
                Ruis
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[13.5px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: C.amber }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Screen>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-6 border-b pb-8"
        style={{ borderColor: C.line }}
      >
        <div className="max-w-md">
          <Label>Trigger-status</Label>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.02em]"
            style={{ ...body, color: C.ink }}
          >
            Certificaten
          </h1>
          <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.phosphor }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} signalen vergrendeld en doorgemeten. Eén trace zakt
            binnenkort onder de drempel.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <Amplitude pct={ratio} />
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              signaal vergrendeld
            </span>
          </div>
          <p
            className="text-[40px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
            style={{ ...body, color: C.phosphor }}
          >
            {ratio}
            <span className="text-[20px]" style={{ color: C.muted }}>
              %
            </span>
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Screen className="p-5" live={c.status === "VERIFIED"}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="h-10 w-20 overflow-hidden rounded"
                    style={{ background: C.screenDeep }}
                    aria-hidden="true"
                  >
                    <Waveform
                      data={
                        st.alarm
                          ? [5, 3, 6, 2, 5, 3, 6, 2]
                          : c.status === "SUBMITTED"
                            ? [4, 5, 4, 6, 4, 5, 4, 6]
                            : [5, 5, 5, 5, 5, 5, 5, 5]
                      }
                      color={st.color}
                      w={80}
                      h={40}
                      glow={false}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <st.Icon size={15} aria-hidden="true" style={{ color: st.color }} />
                      <span
                        className="truncate text-[15px] font-semibold"
                        style={{ ...body, color: C.ink }}
                      >
                        {c.naam}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12px]" style={{ color: C.muted, ...mono }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] sm:inline-flex"
                      style={{ color: st.color, border: `1px solid ${st.color}`, ...mono }}
                    >
                      <span className="tabular-nums">{st.code}</span> {st.label}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.muted,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 border-t pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en pas na jouw expliciete
                        toestemming doorgemeten voor een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded px-3.5 py-2 text-[12px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            background: st.alarm ? C.amber : C.phosphor,
                            color: C.screenDeep,
                            ...mono,
                          }}
                        >
                          {c.status === "EXPIRING"
                            ? "Signaal herstellen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </button>
                        <button
                          className="rounded px-3.5 py-2 text-[12px] font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }}
                        >
                          Meetlog
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Screen>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <div className="border-b pb-6" style={{ borderColor: C.line }}>
        <Label color={C.amber}>Trigger-wachtrij · volgende taken</Label>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.02em]"
          style={{ ...body, color: C.ink }}
        >
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14px]" style={{ color: C.muted }}>
          Werk de wachtrij op prioriteit af — elke afgehandelde trigger houdt je meetbeeld stabiel.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const col = warn ? C.amber : C.phosphor;
          return (
            <li key={a.titel}>
              <div
                className="grid grid-cols-1 items-center gap-4 rounded p-5 sm:grid-cols-[auto_1fr_auto]"
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderLeft: `3px solid ${col}`,
                }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded text-[13px] font-semibold tabular-nums"
                  style={
                    warn
                      ? { background: C.amber, color: C.screenDeep, ...mono }
                      : { border: `1.5px solid ${C.phosphor}`, color: C.phosphor, ...mono }
                  }
                  aria-hidden="true"
                >
                  T{i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.amber }} />
                    ) : (
                      <Gauge size={15} aria-hidden="true" style={{ color: C.phosphor }} />
                    )}
                    <h2
                      className="text-[16px] font-semibold leading-snug"
                      style={{ ...body, color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="justify-self-start rounded px-5 py-2.5 text-[12.5px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                  style={
                    warn
                      ? { background: C.amber, color: C.screenDeep, ...mono }
                      : { border: `1px solid ${C.phosphor}`, color: C.phosphor, ...mono }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurColor(status: string): string {
  if (status === "Openstaand") return C.red;
  if (status === "Betaald") return C.phosphor;
  return C.amber;
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Label color={C.cyan}>Integratie · omzet</Label>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.02em]"
            style={{ ...body, color: C.ink }}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded px-5 py-3 text-[13px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.phosphor, color: C.screenDeep, ...mono }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", c: C.phosphor },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", c: C.red },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", c: C.amber },
        ].map((s) => (
          <Screen key={s.l} className="p-5">
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.c, ...body }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Screen>
        ))}
      </section>

      <Screen className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const col = factuurColor(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:brightness-110 sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 flex items-center gap-2 text-[11.5px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: col }}
                    aria-hidden="true"
                  />
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ ...body, color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip color={col}>{f.status}</Chip>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-semibold tabular-nums sm:order-5"
                  style={{ color: col, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[22px] font-semibold tabular-nums"
            style={{ ...body, color: C.phosphor }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Screen>
    </div>
  );
}

function FooterRail() {
  return (
    <footer
      className="flex items-center justify-between border-t py-5"
      style={{ borderColor: C.line }}
    >
      <span
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
        style={{ color: C.faint, ...mono }}
      >
        <Activity size={13} aria-hidden="true" style={{ color: C.phosphorDim }} /> Oscilloscoop ·
        CH1–6 · alle metingen versleuteld
      </span>
      <span
        className="hidden text-[10px] tracking-[0.16em] sm:block"
        style={{ color: C.faint, ...mono }}
      >
        trig: auto · {chan("footer")}
      </span>
    </footer>
  );
}
