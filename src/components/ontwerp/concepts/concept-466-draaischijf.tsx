"use client";

// Concept 466 — "Draaischijf" · Radiaal / rotary dashboard. Cirkelvormige composities: radiale
// voortgangsringen (SVG-arcs) voor match% en KPI's, een dial-achtige navigatie en ronde
// segment-indelingen. Motion via CSS-transitions op de arcs bij hover. Palet: donker leisteen
// + levendig koraal-accent.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Minus,
  Plus,
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

// — Palet: donker leisteen met levendig koraal —
const C = {
  bg: "#161b26", // diepe leisteen
  surface: "#1e2532", // paneel
  surfaceAlt: "#252d3c", // hover / wisselrij
  ink: "#eef1f7",
  inkSoft: "#c4ccdb",
  inkMute: "#8a94a8",
  inkFaint: "#5f6a80",
  line: "#2c3547",
  lineSoft: "#232b39",
  coral: "#ff6f52", // levendig koraal-accent
  coralSoft: "#3a2620",
  green: "#4ec98a",
  greenSoft: "#1e3a2c",
  amber: "#e6b84b",
  amberSoft: "#3a3016",
  sky: "#5aa9e6",
  skySoft: "#1c3348",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        wash: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.sky, wash: C.skySoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.coral,
        wash: C.coralSoft,
      };
  }
}

// — Radiale voortgangsring: SVG-arc met transitie —
function Ring({
  value,
  size = 92,
  stroke = 8,
  tone = C.coral,
  children,
  track = C.line,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  tone?: string;
  children?: React.ReactNode;
  track?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamped / 100) * circ;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      {children && (
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </span>
      )}
    </span>
  );
}

function PillButton({
  children,
  onClick,
  tone = C.coral,
  filled = true,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b26] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={
        filled
          ? { color: "#1a120f", background: tone, ...bodyFont, boxShadow: `0 0 0 1px ${tone}` }
          : { color: C.ink, background: "transparent", border: `1px solid ${C.line}`, ...bodyFont }
      }
    >
      {children}
    </button>
  );
}

export function Concept466() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, background: C.bg }}
    >
      <style>{`
        @keyframes draaiIn { from { opacity: 0; transform: translateY(8px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .draai-in { animation: draaiIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .draai-in { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavDial screen={screen} setScreen={setScreen} />
        <main key={screen} className="draai-in pt-6">
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
          className="relative inline-flex h-11 w-11 items-center justify-center"
          aria-hidden="true"
        >
          <Ring value={72} size={44} stroke={4} tone={C.coral} track={C.line}>
            <span className="h-2 w-2 rounded-full" style={{ background: C.coral }} />
          </Ring>
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: C.ink }}>
            Draaischijf
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...num }}>
            {PROFIEL.plaats} · cyclus 2026
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.green, background: C.greenSoft, ...bodyFont }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.coral, color: "#1a120f", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-semibold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-bold"
          style={{ background: C.surface, border: `1px solid ${C.coral}`, color: C.coral, ...num }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

// — Dial-navigatie: ronde segment-selector —
function NavDial({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-2">
      <div
        className="flex items-center gap-1.5 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b26] motion-reduce:transition-none"
              style={{
                color: on ? "#1a120f" : C.inkMute,
                background: on ? C.coral : "transparent",
                ...bodyFont,
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

function sparkPct(spark: number[]): number {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const span = max - min || 1;
  const last = spark[spark.length - 1] ?? max;
  return Math.round(((last - min) / span) * 100);
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6 pt-4">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
                style={{ color: C.coral }}
              >
                Vandaag
              </p>
              <h1
                className="mt-4 text-[30px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[38px]"
                style={{ color: C.ink }}
              >
                Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <p
                className="mt-3 max-w-md text-[13.5px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                Je cyclus draait rond: verificatie op orde, matches binnen bereik. Draai door naar
                wat vandaag telt.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <PillButton onClick={onActies}>
                  Volgende actie
                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </PillButton>
                <PillButton onClick={onOpen} filled={false}>
                  Marktplaats
                </PillButton>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Ring value={ratio} size={116} stroke={10} tone={C.green}>
                <span
                  className="text-[26px] font-bold leading-none"
                  style={{ color: C.ink, ...num }}
                >
                  {ratio}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.inkMute }}
                >
                  op orde
                </span>
              </Ring>
              <span className="text-[11px] font-medium" style={{ color: C.inkMute }}>
                {verified}/{CREDENTIALS.length} certificaten
              </span>
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
              style={{ color: C.amber }}
            >
              Vraagt aandacht
            </p>
            <AlertTriangle size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2 className="mt-3 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PillButton onClick={onActies} tone={C.amber} className="w-full">
              {primair.cta}
              <ArrowUpRight size={14} aria-hidden="true" />
            </PillButton>
          </div>
        </Panel>
      </section>

      <section>
        <p
          className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.inkMute }}
        >
          Meters · deze maand
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? C.green : C.coral;
            const Trend = k.up ? TrendingUp : TrendingDown;
            const pct = sparkPct(k.spark);
            return (
              <Panel key={k.label} className="p-5">
                <div className="flex items-center gap-4">
                  <Ring value={pct} size={64} stroke={7} tone={tone}>
                    <span
                      className="text-[13px] font-bold leading-none"
                      style={{ color: C.ink, ...num }}
                    >
                      {pct}
                    </span>
                  </Ring>
                  <div className="min-w-0">
                    <p
                      className="truncate text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: C.inkMute }}
                    >
                      {k.label}
                    </p>
                    <p
                      className="mt-1 text-[22px] font-bold leading-none tracking-[-0.01em]"
                      style={{ color: C.ink, ...num }}
                    >
                      {k.value}
                    </p>
                    <p
                      className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold"
                      style={{ color: tone, ...num }}
                    >
                      <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                    </p>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
              style={{ color: C.inkMute }}
            >
              Beste matches
            </p>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b26]"
              style={{ color: C.coral, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const tone = o.match >= 90 ? C.green : C.sky;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-[#252d3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f52] motion-reduce:transition-none"
                    style={{ background: C.surface, border: `1px solid ${C.line}` }}
                  >
                    <Ring value={o.match} size={52} stroke={6} tone={tone}>
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: C.ink, ...num }}
                      >
                        {o.match}
                      </span>
                    </Ring>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[12px]" style={{ color: C.inkMute }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.inkFaint }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p
            className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.inkMute }}
          >
            Certificaten
          </p>
          <Panel className="p-4">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: st.wash, color: st.ink }}
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
                      <span className="block truncate text-[10.5px]" style={{ color: st.ink }}>
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
    <div className="space-y-6 pt-4">
      <div>
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
          style={{ color: C.coral }}
        >
          Marktplaats
        </p>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5f6a80]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <PillButton key={s} onClick={() => setSort(s)} filled={sort === s} tone={C.coral}>
              {s === "match" ? "Beste match" : "Tarief"}
            </PillButton>
          ))}
          <PillButton onClick={() => setLoading((v) => !v)} filled={loading} tone={C.coral}>
            {loading ? "Stop" : "Verversen"}
          </PillButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.surfaceAlt }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.surfaceAlt }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.surfaceAlt }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.surfaceAlt, color: C.inkMute }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[21px] font-bold" style={{ color: C.ink }}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkMute }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <PillButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowUpRight size={14} aria-hidden="true" />
              </PillButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.sky;
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start gap-5">
        <Ring value={opdracht.match} size={84} stroke={9} tone={tone}>
          <span className="text-[20px] font-bold leading-none" style={{ color: C.ink, ...num }}>
            {opdracht.match}
          </span>
          <span
            className="text-[8px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.inkMute }}
          >
            match
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
            <span className="text-[13px] font-bold" style={{ color: C.coral, ...num }}>
              {opdracht.tarief}
            </span>
          </div>
          <h3 className="mt-1.5 text-[18px] font-bold leading-snug" style={{ color: C.ink }}>
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
                style={{ color: C.inkSoft, background: C.surfaceAlt, ...bodyFont }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2532]"
          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PillButton onClick={onOpen}>
            Reageer <ArrowUpRight size={13} aria-hidden="true" />
          </PillButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.green} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
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
    <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
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
  const tone = strong ? C.green : C.sky;
  return (
    <div className="space-y-5 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b26]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.surface,
          ...bodyFont,
        }}
      >
        <ArrowUpRight size={13} aria-hidden="true" style={{ transform: "rotate(225deg)" }} /> Terug
        naar marktplaats
      </button>

      <Panel className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ color: "#1a120f", background: tone, ...bodyFont }}
              >
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[28px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[36px]"
              style={{ color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ color: C.inkMute }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <PillButton>
                Reageer op opdracht <ArrowUpRight size={14} aria-hidden="true" />
              </PillButton>
              <PillButton filled={false}>Bewaren</PillButton>
            </div>
          </div>
          <Ring value={opdracht.match} size={132} stroke={12} tone={tone}>
            <span className="text-[34px] font-bold leading-none" style={{ color: C.ink, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute }}
            >
              match
            </span>
          </Ring>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-5">
            <p
              className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <section>
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.coral }}
        >
          Verklaarbare matching
        </p>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgestemd op je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green }}
            >
              <Check size={13} aria-hidden="true" /> Voor jou
            </p>
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
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Let op
            </p>
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
                    style={{ color: C.amber }}
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
    <div className="space-y-5 pt-4">
      <Panel className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
              style={{ color: C.coral }}
            >
              Verificatie
            </p>
            <h1
              className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <Ring value={ratio} size={124} stroke={11} tone={C.green}>
            <span className="text-[30px] font-bold leading-none" style={{ color: C.ink, ...num }}>
              {ratio}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute }}
            >
              % op orde
            </span>
          </Ring>
        </div>
      </Panel>

      <Panel>
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
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#252d3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff6f52] motion-reduce:transition-none sm:px-6"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: st.wash, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span
                    className="hidden w-max shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex"
                    style={{ color: st.ink, background: st.wash, ...bodyFont }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                    {st.alarm && <span className="sr-only"> (let op)</span>}
                  </span>
                  <span
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={16} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[70px] sm:pr-6">
                      <div
                        className="rounded-xl p-4"
                        style={{ background: C.bg, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PillButton tone={c.status === "EXPIRING" ? C.amber : C.coral}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PillButton>
                          <PillButton filled={false}>Historie</PillButton>
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
        <p
          className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.sky }}
        >
          Documentenkast
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: st.wash, color: st.ink }}
                  aria-hidden="true"
                >
                  <st.Icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash }}
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
    <div className="space-y-5 pt-4">
      <div>
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
          style={{ color: C.coral }}
        >
          Acties · op volgorde van urgentie
        </p>
        <h1
          className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Draai de cyclus rond — van boven naar beneden afwerken houdt je profiel op orde en
          betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.sky;
          return (
            <li key={a.titel}>
              <Panel className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <Ring value={warn ? 32 : 68} size={48} stroke={5} tone={tone}>
                    <span
                      className="text-[12px] font-bold leading-none"
                      style={{ color: C.ink, ...num }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Ring>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: warn ? C.amberSoft : C.skySoft,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Check size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold leading-snug"
                      style={{ color: C.ink }}
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
                    <PillButton tone={warn ? C.amber : C.coral}>
                      {a.cta}
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </PillButton>
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

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.coral, wash: C.coralSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, wash: C.surfaceAlt, Icon: null };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  const betaaldRatio = 78;
  return (
    <div className="space-y-5 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
            style={{ color: C.coral }}
          >
            Facturen
          </p>
          <h1
            className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Overzicht
          </h1>
        </div>
        <PillButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PillButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        {[
          { l: "Voldaan", v: totaalBetaald, sub: "3 facturen", alarm: false, tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.coral },
          { l: "Concept", v: "€ 880", sub: "klaar om te sturen", alarm: false, tone: C.inkMute },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.coral }} />}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
        <Panel className="flex items-center justify-center p-5">
          <Ring value={betaaldRatio} size={92} stroke={9} tone={C.green}>
            <span className="text-[20px] font-bold leading-none" style={{ color: C.ink, ...num }}>
              {betaaldRatio}%
            </span>
            <span
              className="text-[8px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.inkMute }}
            >
              betaald
            </span>
          </Ring>
        </Panel>
      </section>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
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
                    className={`px-5 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const ft = factuurTone(f.status);
                const openst = f.status === "Openstaand";
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#252d3c]"
                    style={{
                      background: i % 2 === 1 ? C.lineSoft : "transparent",
                      borderBottom: `1px solid ${C.lineSoft}`,
                    }}
                  >
                    <td
                      className="px-5 py-3.5 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{ color: ft.ink, background: ft.wash, ...bodyFont }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-bold"
                      style={{ color: openst ? C.coral : C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.line}` }}>
                <td
                  className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em]"
                  colSpan={4}
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  Voldaan dit kwartaal
                </td>
                <td
                  className="px-5 py-4 text-right text-[15px] font-bold"
                  style={{ color: C.green, ...num }}
                >
                  {totaalBetaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
