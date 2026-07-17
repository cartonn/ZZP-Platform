"use client";

// Concept 364 — "Golfslag" · Kinetisch / motion-forward, vloeiende golven.
// Beweging is de differentiator: organische SVG-golfvormen keren terug als structuur-element
// (voortgang als golven, sparklines als deining), zachte kinetische micro-interacties. Licht,
// fris aqua-palet — helder wit/lichtblauw met teal→aquamarijn accent. Golvende scheidingslijnen
// tussen secties. Rustig, nooit druk; respecteert prefers-reduced-motion.
// Fonts: Sora (display) + Manrope (tekst) + Geist Mono (cijfers/labels).

import { useId, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Waves,
  Sparkles,
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

// — Palet: fris aqua, teal→aquamarijn accent —
const C = {
  bg: "#f0f7fa",
  bgDeep: "#e3f0f4",
  paper: "#ffffff",
  ink: "#0c353a",
  inkSoft: "#2b5257",
  muted: "#5a7c81",
  faint: "#8aa8ac",
  line: "rgba(12,53,58,0.10)",
  lineSoft: "rgba(12,53,58,0.06)",
  teal: "#0ea5a4",
  aqua: "#22d3ee",
  tealDeep: "#0b7c7b",
  warn: "#e0803a",
  warnSoft: "#fdf0e5",
  tealSoft: "#d7f2f1",
};

const display = { fontFamily: "var(--font-lab-sora), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: "ok" | "wait" | "warn";
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: "ok" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: "wait" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: "warn" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, tone: "warn" };
  }
}

// Bouw een vloeiend golf-pad uit een dataserie (cardinal-achtige smoothing).
function wavePath(data: number[], width: number, height: number, pad = 4) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const first = pts[0] ?? ([pad, height / 2] as const);
  let d = `M ${first[0]} ${first[1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (!p0 || !p1) continue;
    const [x0, y0] = p0;
    const [x1, y1] = p1;
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  return { d, pts };
}

// — Golf-sparkline: gevulde deining met lijn erboven —
function WaveSpark({
  data,
  width = 180,
  height = 48,
  warn,
}: {
  data: number[];
  width?: number;
  height?: number;
  warn?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const { d } = wavePath(data, width, height, 5);
  const stroke = warn ? C.warn : C.teal;
  const fillTop = warn ? "rgba(224,128,58,0.22)" : "rgba(34,211,238,0.26)";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${width - 5} ${height} L 5 ${height} Z`} fill={`url(#g${uid})`} />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// — Golvende sectiescheiding —
function WaveDivider({ flip }: { flip?: boolean }) {
  return (
    <div className="my-2 h-6 w-full overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className="h-full w-full"
        style={{ transform: flip ? "scaleY(-1)" : undefined }}
      >
        <path
          d="M0 20 C 200 40 300 0 500 18 C 700 36 800 4 1000 20 C 1100 28 1150 22 1200 20 L 1200 40 L 0 40 Z"
          fill={C.tealSoft}
          opacity="0.7"
        />
        <path
          d="M0 24 C 220 6 320 40 520 22 C 720 6 820 38 1020 22 C 1110 15 1160 20 1200 24"
          fill="none"
          stroke={C.teal}
          strokeOpacity="0.35"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

// — Golf-voortgangsbalk —
function WaveProgress({ value, warn }: { value: number; warn?: boolean }) {
  const color = warn ? C.warn : C.teal;
  return (
    <span
      className="relative block h-2.5 w-full overflow-hidden rounded-full"
      style={{ background: C.bgDeep }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full motion-safe:animate-[gs-shimmer_2.6s_ease-in-out_infinite]"
        style={{
          width: `${value}%`,
          backgroundImage: `linear-gradient(90deg, ${color}, ${warn ? C.warn : C.aqua})`,
          backgroundSize: "200% 100%",
        }}
      />
    </span>
  );
}

function Chip({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "teal" | "warn";
}) {
  const styles =
    tone === "teal"
      ? { color: C.tealDeep, background: C.tealSoft }
      : tone === "warn"
        ? { color: C.warn, background: C.warnSoft }
        : { color: C.muted, background: "rgba(12,53,58,0.05)" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
      style={{ ...styles, ...mono }}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const st = statusMeta(status);
  const tone = st.tone === "ok" ? "teal" : st.tone === "warn" ? "warn" : "muted";
  return (
    <Chip tone={tone}>
      <st.Icon size={12} aria-hidden="true" />
      {st.label}
    </Chip>
  );
}

// Injecteer keyframes één keer; alles zit achter motion-safe.
function KeyFrames() {
  return (
    <style>{`
      @keyframes gs-shimmer { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      @keyframes gs-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      @keyframes gs-drift { from { transform: translateX(0); } to { transform: translateX(-50px); } }
    `}</style>
  );
}

export function Concept364() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      <KeyFrames />
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl motion-safe:animate-[gs-float_5s_ease-in-out_infinite]"
          style={{ backgroundImage: `linear-gradient(135deg, ${C.teal}, ${C.aqua})` }}
          aria-hidden="true"
        >
          <Waves size={20} color="#ffffff" />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-[-0.01em]" style={display}>
            Golfslag
          </p>
          <p
            className="mt-1.5 text-[11px] leading-none tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            MEEBEWEGEN MET JE WERK
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium sm:inline-flex"
          style={{ background: C.tealSoft, color: C.tealDeep, ...mono }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.teal }}
            aria-hidden="true"
          />
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold text-white"
          style={{ backgroundImage: `linear-gradient(135deg, ${C.tealDeep}, ${C.teal})`, ...mono }}
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
      className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
      style={{ background: C.paper, boxShadow: "0 1px 2px rgba(12,53,58,0.06)" }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
            style={
              on
                ? {
                    backgroundImage: `linear-gradient(135deg, ${C.teal}, ${C.aqua})`,
                    color: "#ffffff",
                    ...display,
                  }
                : { color: C.muted, ...display }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-[1.35fr_1fr]">
        <div
          className="relative overflow-hidden rounded-3xl p-8"
          style={{ background: C.paper, boxShadow: "0 2px 24px rgba(12,53,58,0.06)" }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="h-full w-[240%] motion-safe:animate-[gs-drift_16s_linear_infinite]"
            >
              <path
                d="M0 60 C 150 100 300 20 450 60 C 600 100 750 20 900 60 C 1050 100 1150 40 1200 60 L 1200 120 L 0 120 Z"
                fill={C.tealSoft}
                opacity="0.6"
              />
            </svg>
          </div>
          <p
            className="text-[11px] font-medium tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            VANDAAG · UTRECHT
          </p>
          <h1
            className="relative mt-4 text-[38px] font-bold leading-[1.04] tracking-[-0.02em] md:text-[46px]"
            style={display}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p
            className="relative mt-4 max-w-md text-[15px] leading-relaxed"
            style={{ color: C.muted }}
          >
            Je week deint mee. Zet vandaag één actie in beweging — de rest volgt vanzelf op de golf.
          </p>
        </div>

        <div
          className="relative flex flex-col justify-between overflow-hidden rounded-3xl p-7 text-white"
          style={{
            backgroundImage: `linear-gradient(150deg, ${C.tealDeep}, ${C.teal} 70%, ${C.aqua})`,
          }}
        >
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em]"
              style={{ color: "rgba(255,255,255,0.8)", ...mono }}
            >
              <Sparkles size={13} aria-hidden="true" /> NU IN BEWEGING
            </p>
            <h2 className="mt-3 text-[20px] font-bold leading-snug" style={display}>
              {primair.titel}
            </h2>
            <p
              className="mt-2 text-[13.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group mt-6 inline-flex items-center justify-between gap-2 rounded-2xl bg-white px-5 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700 motion-reduce:transition-none"
            style={{ color: C.tealDeep, ...display }}
          >
            {primair.cta}
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-3xl p-5 transition-transform hover:-translate-y-1 motion-reduce:transition-none"
            style={{ background: C.paper, boxShadow: "0 2px 16px rgba(12,53,58,0.05)" }}
          >
            <div className="flex items-baseline justify-between">
              <p
                className="text-[11.5px] font-medium tracking-[0.06em]"
                style={{ color: C.muted, ...mono }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold tabular-nums"
                style={{ color: k.up ? C.tealDeep : C.warn, ...mono }}
              >
                {k.up && <ArrowUpRight size={12} aria-hidden="true" />}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-2 text-[30px] font-bold tabular-nums leading-none tracking-[-0.02em]"
              style={display}
            >
              {k.value}
            </p>
            <div className="mt-3">
              <WaveSpark data={k.spark} width={200} height={44} warn={!k.up} />
            </div>
          </div>
        ))}
      </section>

      <WaveDivider />

      <section
        className="rounded-3xl p-6 md:p-7"
        style={{ background: C.paper, boxShadow: "0 2px 16px rgba(12,53,58,0.05)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold" style={display}>
            Opdrachten die bij je passen
          </h2>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.tealDeep, ...display }}
          >
            Alles <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <ul className="space-y-2.5">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-[#e9f5f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.bg }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold" style={display}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="hidden w-28 shrink-0 sm:block">
                  <WaveProgress value={o.match} />
                </span>
                <span
                  className="w-11 shrink-0 text-right text-[15px] font-bold tabular-nums"
                  style={{ color: C.tealDeep, ...mono }}
                >
                  {o.match}%
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  style={{ color: C.faint }}
                />
              </button>
            </li>
          ))}
        </ul>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-medium tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            MARKTPLAATS
          </p>
          <h1
            className="mt-2 text-[32px] font-bold leading-none tracking-[-0.02em]"
            style={display}
          >
            Open opdrachten
          </h1>
        </div>
        <span className="text-[12px] font-medium tabular-nums" style={{ color: C.muted, ...mono }}>
          {filtered.length} van {OPDRACHTEN.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-3"
          style={{ background: C.paper, boxShadow: "0 1px 3px rgba(12,53,58,0.06)" }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8aa8ac]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${C.teal}, ${C.aqua})`,
                        color: "#fff",
                        ...display,
                      }
                    : { background: C.paper, color: C.muted, ...display }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-3xl py-16 text-center"
          style={{ background: C.paper }}
        >
          <div className="w-44 opacity-60">
            <WaveSpark data={[2, 2, 2, 2, 2, 2, 2]} width={176} height={44} />
          </div>
          <p className="mt-4 text-[20px] font-bold" style={display}>
            Kalme zee
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm om de
            golven weer op gang te brengen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
            style={{ backgroundImage: `linear-gradient(135deg, ${C.teal}, ${C.aqua})`, ...display }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div
      className="flex h-full flex-col rounded-3xl p-6 transition-transform hover:-translate-y-1 motion-reduce:transition-none"
      style={{ background: C.paper, boxShadow: "0 2px 18px rgba(12,53,58,0.06)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-[10.5px] font-medium tracking-[0.12em]"
            style={{ color: C.faint, ...mono }}
          >
            {opdracht.id}
          </p>
          <h3 className="mt-1.5 text-[17px] font-bold leading-snug" style={display}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="text-[22px] font-bold tabular-nums leading-none"
            style={{ color: strong ? C.tealDeep : C.ink, ...mono }}
          >
            {opdracht.match}%
          </p>
          <p className="mt-1 text-[10px] tracking-[0.1em]" style={{ color: C.faint, ...mono }}>
            MATCH
          </p>
        </div>
      </div>

      <div className="mt-4">
        <WaveProgress value={opdracht.match} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <Chip key={t}>{t}</Chip>
        ))}
      </div>

      <ul className="mt-4 space-y-1.5">
        {opdracht.redenen.plus.slice(0, 2).map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Check
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: C.teal }}
            />
            {r}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-[15px] font-bold" style={{ color: C.tealDeep, ...mono }}>
          {opdracht.tarief}
        </span>
        <button
          onClick={onOpen}
          className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
          style={{ backgroundImage: `linear-gradient(135deg, ${C.teal}, ${C.aqua})`, ...display }}
        >
          Bekijk{" "}
          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </button>
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...display }}
      >
        <ArrowRight size={15} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <header
        className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{
          backgroundImage: `linear-gradient(150deg, ${C.tealDeep}, ${C.teal} 65%, ${C.aqua})`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="h-full w-[220%] motion-safe:animate-[gs-drift_18s_linear_infinite]"
          >
            <path
              d="M0 60 C 150 100 300 20 450 60 C 600 100 750 20 900 60 C 1050 100 1150 40 1200 60 L 1200 120 L 0 120 Z"
              fill="rgba(255,255,255,0.14)"
            />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium tracking-[0.1em]"
            style={mono}
          >
            {opdracht.id}
          </span>
          <span
            className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold"
            style={{ color: C.tealDeep, ...mono }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[34px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[42px]"
          style={display}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-3 text-[15px]" style={{ color: "rgba(255,255,255,0.85)" }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700 motion-reduce:transition-none"
            style={{ color: C.tealDeep, ...display }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-[14px] font-semibold transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700"
            style={display}
          >
            Bewaar
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-2xl p-5"
            style={{ background: C.paper, boxShadow: "0 2px 14px rgba(12,53,58,0.05)" }}
          >
            <p
              className="text-[10.5px] font-medium tracking-[0.12em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l.toUpperCase()}
            </p>
            <p
              className="mt-1.5 text-[22px] font-bold tabular-nums tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <section
        className="rounded-3xl p-7"
        style={{ background: C.paper, boxShadow: "0 2px 16px rgba(12,53,58,0.05)" }}
      >
        <h2 className="text-[17px] font-bold" style={display}>
          Waarom deze match
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em]"
              style={{ color: C.tealDeep, ...mono }}
            >
              <Check size={13} aria-hidden="true" /> WAT PAST
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 rounded-2xl p-3 text-[13.5px]"
                  style={{ background: C.tealSoft, color: C.inkSoft }}
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
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em]"
              style={{ color: C.warn, ...mono }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> AANDACHT
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 rounded-2xl p-3 text-[13.5px]"
                  style={{ background: C.warnSoft, color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-3xl p-8"
        style={{ background: C.paper, boxShadow: "0 2px 20px rgba(12,53,58,0.06)" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[11px] font-medium tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              VERTROUWEN
            </p>
            <h1
              className="mt-2 text-[32px] font-bold leading-none tracking-[-0.02em]"
              style={display}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten volledig geverifieerd. Eén vraagt
              binnenkort om actie.
            </p>
          </div>
          <div className="w-full max-w-[220px]">
            <div className="flex items-end justify-between">
              <span className="text-[44px] font-bold tabular-nums leading-none" style={display}>
                {ratio}
                <span className="text-[22px]" style={{ color: C.muted }}>
                  %
                </span>
              </span>
              <span
                className="pb-1 text-[11px] tracking-[0.1em]"
                style={{ color: C.faint, ...mono }}
              >
                COMPLEET
              </span>
            </div>
            <div className="mt-3">
              <WaveProgress value={ratio} />
            </div>
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const warn = st.tone === "warn";
          return (
            <li
              key={c.naam}
              className="rounded-3xl p-6"
              style={{
                background: C.paper,
                boxShadow: "0 2px 14px rgba(12,53,58,0.05)",
                borderLeft: `3px solid ${st.tone === "ok" ? C.teal : warn ? C.warn : C.faint}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold leading-snug" style={display}>
                    {c.naam}
                  </h3>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: st.tone === "ok" ? C.tealSoft : warn ? C.warnSoft : C.bgDeep,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon
                    size={18}
                    style={{ color: st.tone === "ok" ? C.teal : warn ? C.warn : C.muted }}
                  />
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusPill status={c.status} />
                <button
                  className="rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    warn
                      ? {
                          backgroundImage: `linear-gradient(135deg, ${C.warn}, #f0a860)`,
                          color: "#fff",
                          ...display,
                        }
                      : { background: C.bg, color: C.tealDeep, ...display }
                  }
                >
                  {warn ? "Vernieuwen" : c.status === "SUBMITTED" ? "Volg status" : "Bekijken"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <header>
        <p
          className="text-[11px] font-medium tracking-[0.16em]"
          style={{ color: C.faint, ...mono }}
        >
          AANDACHT
        </p>
        <h1 className="mt-2 text-[32px] font-bold leading-none tracking-[-0.02em]" style={display}>
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Breng deze op volgorde in beweging — elke afgeronde actie houdt je golf zuiver.
        </p>
      </header>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center"
              style={{
                background: C.paper,
                boxShadow: "0 2px 14px rgba(12,53,58,0.05)",
                borderLeft: `3px solid ${warn ? C.warn : C.teal}`,
              }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[16px] font-bold tabular-nums text-white"
                style={{
                  backgroundImage: warn
                    ? `linear-gradient(135deg, ${C.warn}, #f0a860)`
                    : `linear-gradient(135deg, ${C.teal}, ${C.aqua})`,
                  ...mono,
                }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {warn ? (
                    <AlertTriangle size={15} aria-hidden="true" style={{ color: C.warn }} />
                  ) : (
                    <Sparkles size={15} aria-hidden="true" style={{ color: C.teal }} />
                  )}
                  <h2 className="text-[16.5px] font-bold leading-snug" style={display}>
                    {a.titel}
                  </h2>
                </div>
                <p
                  className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                  style={{ color: C.muted }}
                >
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
                style={{
                  backgroundImage: warn
                    ? `linear-gradient(135deg, ${C.warn}, #f0a860)`
                    : `linear-gradient(135deg, ${C.teal}, ${C.aqua})`,
                  ...display,
                }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): "ok" | "warn" | "muted" {
  if (status === "Betaald") return "ok";
  if (status === "Openstaand") return "warn";
  return "muted";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-medium tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            OMZET
          </p>
          <h1
            className="mt-2 text-[32px] font-bold leading-none tracking-[-0.02em]"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
          style={{ backgroundImage: `linear-gradient(135deg, ${C.teal}, ${C.aqua})`, ...display }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", warn: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", warn: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", warn: false },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-3xl p-6"
            style={{ background: C.paper, boxShadow: "0 2px 14px rgba(12,53,58,0.05)" }}
          >
            <p
              className="text-[11px] font-medium tracking-[0.08em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[26px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.warn ? C.warn : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div
        className="overflow-hidden rounded-3xl"
        style={{ background: C.paper, boxShadow: "0 2px 16px rgba(12,53,58,0.05)" }}
      >
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 px-6 py-3 text-[10.5px] font-medium tracking-[0.12em] sm:grid"
          style={{ color: C.faint, background: C.bg, ...mono }}
        >
          <span>NUMMER</span>
          <span>KLANT</span>
          <span>DATUM</span>
          <span>STATUS</span>
          <span className="text-right">BEDRAG</span>
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const tone = factuurTone(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-t px-6 py-4 transition-colors hover:bg-[#e9f5f6] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14.5px] font-bold sm:order-2"
                  style={display}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip tone={tone === "ok" ? "teal" : tone === "warn" ? "warn" : "muted"}>
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: tone === "warn" ? C.warn : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between border-t px-6 py-4"
          style={{ borderColor: C.line }}
        >
          <span className="text-[11px] tracking-[0.14em]" style={{ color: C.faint, ...mono }}>
            TOTAAL BETAALD
          </span>
          <span
            className="text-[22px] font-bold tabular-nums"
            style={{ color: C.tealDeep, ...display }}
          >
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
