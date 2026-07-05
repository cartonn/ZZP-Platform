"use client";

// Concept 97 — "Groef" · vinyl & hifi-warmte. Muziek-speler-esthetiek toegepast op werk.
// Warm crème canvas (#f3e7d0) met diep-bruine inkt, oranje-rood accent (#cf4324) en mosterd-amber.
// Draaitafel-motief: concentrische groeven als SVG-plaat, album-hoes-tegels voor elke opdracht
// (een opdracht = een "track"), een VU-meter-accent en een "nu speelt"-balk onderaan. Nostalgisch-
// premium, tactiel (Teenage Engineering × Braun × hifi). De plaat draait alleen wanneer je 'm
// afspeelt — subtiel, deterministisch, geen data-afhankelijke willekeur. Status wordt altijd met
// label + icoon getoond, nooit alleen met kleur. Fonts: Space Grotesk (display) + Spline Mono (meta).

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Plus,
  MapPin,
  Disc3,
  Play,
  Pause,
  Radio,
  Volume2,
  ListMusic,
  RotateCw,
  SkipForward,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;
void DOCUMENTEN;

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#f3e7d0",
  paperAlt: "#ece0c4",
  card: "#fbf4e6",
  cardAlt: "#f7eede",
  ink: "#241a10",
  inkSoft: "#5b4a36",
  faint: "#93805f",
  rust: "#cf4324",
  amber: "#c8892b",
  forest: "#4f7a3f",
  slate: "#2f5d6a",
  vinyl: "#1a130c",
  line: "rgba(36,26,16,0.14)",
  lineSoft: "rgba(36,26,16,0.08)",
  wash: "rgba(207,67,36,0.08)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const meta = { fontFamily: "var(--font-lab-spline-mono)" };

const SHADOW = "0 20px 44px -30px rgba(36,26,16,0.5), inset 0 0 0 1px rgba(36,26,16,0.04)";
const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const ringStyle = {
  "--tw-ring-color": C.rust,
  "--tw-ring-offset-color": C.paper,
} as React.CSSProperties;

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.forest, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.slate, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.amber, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.rust, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Album-hoes (deterministische geometrie per track) ---------- */

const COVERS = [
  { bg: C.rust, fg: "#f3e7d0", ink: C.vinyl },
  { bg: "#2f5d4a", fg: "#f0dcae", ink: C.amber },
  { bg: "#243447", fg: "#e8c98f", ink: C.rust },
];

function AlbumArt({
  index,
  size = 56,
  rounded = 10,
}: {
  index: number;
  size?: number;
  rounded?: number;
}) {
  const c = COVERS[index % COVERS.length]!;
  const shape = index % 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ borderRadius: rounded }}
      className="shrink-0"
      role="img"
      aria-label="Albumhoes"
    >
      <rect x="0" y="0" width="100" height="100" fill={c.bg} />
      {shape === 0 && (
        <>
          {[38, 28, 18].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={c.fg}
              strokeWidth="4"
              opacity={0.9}
            />
          ))}
          <circle cx="50" cy="50" r="6" fill={c.ink} />
        </>
      )}
      {shape === 1 && (
        <>
          {[20, 40, 60, 80].map((x, i) => (
            <rect
              key={x}
              x={x - 7}
              y={12 + i * 4}
              width="14"
              height={76 - i * 8}
              fill={i % 2 ? c.ink : c.fg}
              opacity={0.92}
            />
          ))}
        </>
      )}
      {shape === 2 && (
        <>
          <path d="M10 78 Q50 8 90 78" fill="none" stroke={c.fg} strokeWidth="6" />
          <path d="M10 90 Q50 26 90 90" fill="none" stroke={c.ink} strokeWidth="6" opacity={0.8} />
          <circle cx="50" cy="70" r="9" fill={c.ink} />
        </>
      )}
    </svg>
  );
}

/* ---------- Draaitafel / plaat (het handtekening-element) ---------- */

function Vinyl({
  size = 168,
  label,
  spinning = false,
  index = 0,
}: {
  size?: number;
  label?: string;
  spinning?: boolean;
  index?: number;
}) {
  const c = COVERS[index % COVERS.length]!;
  const grooves = [46, 42, 38, 34, 30, 26];
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={label ? `Plaat: ${label}` : "Plaat"}
        style={{ animation: spinning ? "groef-spin 4s linear infinite" : "none" }}
      >
        <circle cx="50" cy="50" r="49" fill={C.vinyl} />
        {grooves.map((r, i) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={i % 2 ? 0.6 : 0.35}
          />
        ))}
        {/* sheen-arc, geeft de plaat glans */}
        <path
          d="M22 24 A40 40 0 0 1 78 24"
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* midden-label */}
        <circle cx="50" cy="50" r="19" fill={c.bg} />
        <circle
          cx="50"
          cy="50"
          r="19"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.6"
        />
        <circle cx="50" cy="50" r="2.4" fill={C.paper} />
      </svg>
      {label && (
        <span
          className="pointer-events-none absolute text-center text-[8px] font-semibold uppercase leading-tight tracking-[0.08em]"
          style={{ ...meta, color: c.fg, maxWidth: size * 0.34 }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

// VU-meter accent — deterministische balkjes uit sparkline-data.
function VuMeter({ data, color = C.rust }: { data: number[]; color?: string }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const h = Math.max(12, Math.round((v / max) * 100));
        const hot = h > 78;
        return (
          <span
            key={i}
            className="w-[5px] rounded-sm"
            style={{
              height: `${h}%`,
              background: hot ? C.rust : color,
              opacity: 0.4 + (h / 100) * 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children, color = C.rust }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...meta, color }}
    >
      <Radio size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[32px]"
      style={{ ...display, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...meta,
        color: m.color,
        background: `${m.color}14`,
        border: `1px solid ${m.color}44`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept97() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [nowId, setNowId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);

  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);
  const now = OPDRACHTEN.find((o) => o.id === nowId) ?? (OPDRACHTEN[0] as Opdracht);
  const nowIndex = OPDRACHTEN.findIndex((o) => o.id === now.id);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };
  const playTrack = (id: string) => {
    setNowId(id);
    setPlaying(true);
  };
  const nextTrack = () => {
    const i = OPDRACHTEN.findIndex((o) => o.id === nowId);
    const next = OPDRACHTEN[(i + 1) % OPDRACHTEN.length]!;
    setNowId(next.id);
    setPlaying(true);
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...display,
        color: C.ink,
        background: `radial-gradient(120% 90% at 15% -10%, ${C.card}, ${C.paper} 55%, ${C.paperAlt})`,
      }}
    >
      <style>{`@keyframes groef-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[238px]"
          style={{ borderRight: `1px solid ${C.line}`, background: C.cardAlt }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <Vinyl size={40} spinning={playing} index={nowIndex} />
              <div className="leading-tight">
                <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
                  Groef
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ ...meta, color: C.faint }}
                >
                  ZZP · hifi
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    style={{
                      ...ringStyle,
                      background: on ? C.wash : "transparent",
                      border: on ? `1px solid ${C.rust}44` : "1px solid transparent",
                    }}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors md:w-full ${RING}`}
                  >
                    {on && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.rust }}
                        aria-hidden="true"
                      />
                    )}
                    <span style={{ color: on ? C.ink : C.inkSoft }}>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.card }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ ...meta, color: C.paper, background: C.rust }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.forest }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 pb-24 sm:p-8 sm:pb-24">
            {screen === "dashboard" && (
              <Dashboard onOpen={open} onGo={setScreen} onPlay={playTrack} />
            )}
            {screen === "marktplaats" && (
              <Marktplaats
                activeId={activeId}
                onSelect={setActiveId}
                onOpen={open}
                onPlay={playTrack}
              />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} onPlay={playTrack} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>

          {/* Nu speelt-balk */}
          <NowPlaying
            now={now}
            index={nowIndex}
            playing={playing}
            onToggle={() => setPlaying((p) => !p)}
            onNext={nextTrack}
            onOpen={() => open(now.id)}
          />
        </main>
      </div>
    </div>
  );
}

/* ---------- Nu speelt-balk ---------- */

function NowPlaying({
  now,
  index,
  playing,
  onToggle,
  onNext,
  onOpen,
}: {
  now: Opdracht;
  index: number;
  playing: boolean;
  onToggle: () => void;
  onNext: () => void;
  onOpen: () => void;
}) {
  // Deterministische "voortgang" op de track — vaste waarde, geen timer.
  const progress = playing ? 42 : 12;
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 px-4 py-3 backdrop-blur-sm sm:gap-4 sm:px-6"
      style={{
        background: "rgba(251,244,230,0.94)",
        borderTop: `1px solid ${C.line}`,
        boxShadow: "0 -12px 30px -24px rgba(36,26,16,0.5)",
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        style={ringStyle}
        className={`flex min-w-0 items-center gap-3 rounded-lg text-left ${RING}`}
      >
        <AlbumArt index={index} size={44} rounded={8} />
        <span className="min-w-0">
          <span
            className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...meta, color: C.rust }}
          >
            <Volume2 size={11} strokeWidth={2.4} aria-hidden="true" /> Nu speelt
          </span>
          <span className="block truncate text-[13px] font-semibold" style={{ color: C.ink }}>
            {now.titel}
          </span>
          <span className="block truncate text-[11px]" style={{ ...meta, color: C.faint }}>
            {now.opdrachtgever} · {now.tarief}
          </span>
        </span>
      </button>

      <div className="hidden flex-1 items-center gap-3 md:flex">
        <span
          className="text-[10px] tabular-nums"
          style={{ ...meta, color: C.faint }}
          aria-hidden="true"
        >
          {playing ? "1:24" : "0:22"}
        </span>
        <span
          className="relative h-1.5 flex-1 overflow-hidden rounded-full"
          style={{ background: C.paperAlt }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Voortgang track"
        >
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: C.rust }}
          />
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{ ...meta, color: C.faint }}
          aria-hidden="true"
        >
          3:12
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "Pauzeer" : "Speel af"}
          style={ringStyle}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105 ${RING}`}
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: C.rust, color: C.paper }}
          >
            {playing ? (
              <Pause size={18} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Play size={18} strokeWidth={2.4} className="ml-0.5" aria-hidden="true" />
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Volgende track"
          style={ringStyle}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 ${RING}`}
        >
          <SkipForward size={17} strokeWidth={2.2} color={C.inkSoft} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
  onPlay,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  onPlay: (id: string) => void;
}) {
  const warn = ACTIES[0];
  const top = OPDRACHTEN[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Op de draaitafel</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold"
          style={{ ...meta, color: C.rust, background: C.wash, border: `1px solid ${C.rust}33` }}
        >
          <ListMusic size={13} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN.length} tracks in
          je kast
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.amber}55`,
            background: `${C.amber}12`,
            boxShadow: SHADOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: `${C.amber}20`, border: `1px solid ${C.amber}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.inkSoft }}>{warn.detail}</span>
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            style={ringStyle}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
          >
            <span
              style={{ color: C.paper, background: C.amber }}
              className="-mx-3.5 -my-2 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2"
            >
              {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </span>
          </button>
        </div>
      )}

      {/* Now-playing hero met plaat */}
      {top && (
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
            <Vinyl size={148} label={top.opdrachtgever} index={0} />
            <div className="min-w-0 flex-1">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...meta, color: C.rust }}
              >
                Beste match · A-kant
              </span>
              <p
                className="mt-1.5 text-[20px] font-semibold leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </p>
              <p
                className="mt-1 flex items-center gap-1.5 text-[12.5px]"
                style={{ ...meta, color: C.inkSoft }}
              >
                <MapPin size={13} strokeWidth={2.2} aria-hidden="true" /> {top.opdrachtgever} ·{" "}
                {top.plaats} · {top.tarief}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ ...meta, color: C.paper, background: C.vinyl }}
                >
                  <Disc3 size={12} strokeWidth={2.4} aria-hidden="true" /> {top.match}% match
                </span>
                {top.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      ...meta,
                      color: C.inkSoft,
                      background: C.cardAlt,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onPlay(top.id)}
                  style={ringStyle}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
                >
                  <span
                    style={{ color: C.paper, background: C.rust }}
                    className="-mx-4 -my-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2"
                  >
                    <Play size={14} strokeWidth={2.6} aria-hidden="true" /> Afspelen
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpen(top.id)}
                  style={ringStyle}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                >
                  <span
                    style={{ color: C.ink, background: C.card, border: `1px solid ${C.line}` }}
                    className="-mx-4 -my-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2"
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* KPI's met VU-meter */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.06em]"
                style={{ ...meta, color: C.faint }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...meta, color: k.up ? C.forest : C.amber }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.6} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[24px] tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <VuMeter data={k.spark} color={k.up ? C.amber : C.faint} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* Platenkast — tracklijst */}
        <Panel>
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: C.ink }}
            >
              <ListMusic size={16} strokeWidth={2} color={C.rust} aria-hidden="true" /> Jouw
              platenkast
            </h3>
            <button
              type="button"
              onClick={() => onGo("marktplaats")}
              style={ringStyle}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${RING}`}
            >
              <span style={{ ...meta, color: C.rust }} className="inline-flex items-center gap-1">
                Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </span>
            </button>
          </div>
          <ul className="p-2">
            {OPDRACHTEN.map((o, i) => (
              <li
                key={o.id}
                className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-black/[0.03]"
              >
                <span
                  className="w-5 shrink-0 text-center text-[11px] tabular-nums"
                  style={{ ...meta, color: C.faint }}
                >
                  {i + 1}
                </span>
                <AlbumArt index={i} size={44} rounded={8} />
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  style={ringStyle}
                  className={`min-w-0 flex-1 rounded-md text-left ${RING}`}
                >
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {o.titel}
                  </span>
                  <span className="block truncate text-[11px]" style={{ ...meta, color: C.faint }}>
                    {o.plaats} · {o.tarief} · {o.match}% match
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onPlay(o.id)}
                  aria-label={`Speel ${o.titel}`}
                  style={ringStyle}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full opacity-70 transition-opacity group-hover:opacity-100"
                    style={{ background: C.vinyl, color: C.paper }}
                  >
                    <Play size={14} strokeWidth={2.4} className="ml-0.5" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          {/* Live feed loading + error */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.ink }}
            >
              <Radio size={14} strokeWidth={2.2} color={C.rust} aria-hidden="true" /> Op de radio
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Radio wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-full"
                    style={{ background: C.paperAlt, width: i === 0 ? "80%" : "60%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: C.wash, border: `1px solid ${C.rust}44` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.rust} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.ink }}>
                  Signaal weg — kon de radio niet ophalen.
                </p>
                <button
                  type="button"
                  onClick={() => setFeed("ok")}
                  style={ringStyle}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${RING}`}
                >
                  <span
                    style={{ color: C.paper, background: C.rust }}
                    className="-mx-3 -my-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  >
                    <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                  </span>
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.inkSoft }}>
                <Check size={14} strokeWidth={2.6} color={C.forest} aria-hidden="true" /> Verbinding
                hersteld — de zender speelt weer.
              </p>
            )}
          </Panel>

          {/* Berichten */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.ink }}
            >
              <Volume2 size={14} strokeWidth={2.2} color={C.rust} aria-hidden="true" /> Berichten
            </h3>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <li key={b.van} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      ...meta,
                      color: C.rust,
                      background: C.wash,
                      border: `1px solid ${C.rust}33`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold" style={{ color: C.ink }}>
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.rust }}
                          aria-label="ongelezen"
                        />
                      )}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.inkSoft }}>
                      {b.preview}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-[10px] tabular-nums"
                    style={{ ...meta, color: C.faint }}
                  >
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
  onPlay,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
  onPlay: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];
  const selIndex = OPDRACHTEN.findIndex((o) => o.id === sel?.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Platenzaak</Kicker>
        <Title>Nieuwe releases</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
      >
        <Search size={16} strokeWidth={2.2} color={C.rust} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#93805f]"
          style={{ ...meta, color: C.ink }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...meta, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Disc3 size={24} strokeWidth={2} color={C.rust} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.ink }}>
            Geen plaat gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.inkSoft }}>
            Geen release past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            style={ringStyle}
            className={`mt-5 rounded-full px-4 py-2 text-[12.5px] font-semibold ${RING}`}
          >
            <span
              style={{ color: C.paper, background: C.rust }}
              className="-mx-4 -my-2 inline-block rounded-full px-4 py-2"
            >
              Zoekopdracht wissen
            </span>
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filtered.map((o) => {
              const idx = OPDRACHTEN.findIndex((x) => x.id === o.id);
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  style={{
                    ...ringStyle,
                    background: C.card,
                    border: `1px solid ${on ? `${C.rust}88` : C.line}`,
                    boxShadow: on ? `0 12px 30px -18px ${C.rust}` : SHADOW,
                  }}
                  className={`group flex flex-col rounded-2xl p-3.5 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                >
                  <div className="relative">
                    <AlbumArt index={idx} size={128} rounded={12} />
                    <span
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ ...meta, color: C.paper, background: "rgba(26,19,12,0.82)" }}
                    >
                      <Disc3 size={10} strokeWidth={2.6} aria-hidden="true" /> {o.match}%
                    </span>
                  </div>
                  <p className="mt-3 truncate text-[14px] font-semibold" style={{ color: C.ink }}>
                    {o.titel}
                  </p>
                  <p
                    className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                    style={{ ...meta, color: C.faint }}
                  >
                    <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.plaats} ·{" "}
                    {o.tarief}
                  </p>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Panel>
                <div
                  className="flex items-center gap-4 p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <AlbumArt index={selIndex} size={64} rounded={10} />
                  <div className="min-w-0">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ ...meta, color: C.rust }}
                    >
                      {sel.id}
                    </span>
                    <p className="truncate text-[15px] font-semibold" style={{ color: C.ink }}>
                      {sel.titel}
                    </p>
                    <p className="truncate text-[11.5px]" style={{ ...meta, color: C.faint }}>
                      {sel.opdrachtgever} · {sel.plaats}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <dl className="grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div key={m.l} className="rounded-xl p-2.5" style={{ background: C.cardAlt }}>
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ ...meta, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...meta, color: C.ink }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onPlay(sel.id)}
                      style={ringStyle}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
                    >
                      <span
                        style={{ color: C.paper, background: C.rust }}
                        className="-mx-4 -my-2.5 flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5"
                      >
                        <Play size={13} strokeWidth={2.6} aria-hidden="true" /> Afspelen
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpen(sel.id)}
                      style={ringStyle}
                      className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold ${RING}`}
                    >
                      <span
                        style={{ color: C.ink, background: C.card, border: `1px solid ${C.line}` }}
                        className="-mx-4 -my-2.5 flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5"
                      >
                        Open
                      </span>
                    </button>
                  </div>
                </div>
              </Panel>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({
  opdracht,
  onPlay,
}: {
  opdracht: Opdracht;
  onPlay: (id: string) => void;
}) {
  const idx = OPDRACHTEN.findIndex((o) => o.id === opdracht.id);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <Vinyl size={128} label={opdracht.opdrachtgever} index={idx} />
          <div className="min-w-0 flex-1">
            <Kicker>{opdracht.id} · tracklist</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ ...meta, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ ...meta, color: C.paper, background: C.vinyl }}
              >
                <Disc3 size={12} strokeWidth={2.4} aria-hidden="true" /> {opdracht.match}% match
              </span>
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    ...meta,
                    color: C.inkSoft,
                    background: C.cardAlt,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 p-5 pt-0 sm:flex-row sm:p-6 sm:pt-0">
          <button
            type="button"
            onClick={() => onPlay(opdracht.id)}
            style={ringStyle}
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
          >
            <span
              style={{ color: C.paper, background: C.vinyl }}
              className="-mx-5 -my-3 flex items-center justify-center gap-2 rounded-full px-5 py-3"
            >
              <Play size={15} strokeWidth={2.6} aria-hidden="true" /> Zet op de draaitafel
            </span>
          </button>
          <button
            type="button"
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            style={ringStyle}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-90 ${RING}`}
          >
            <span
              style={{ color: C.paper, background: state === "sent" ? C.forest : C.rust }}
              className="-mx-5 -my-3 flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3"
            >
              {state === "idle" && (
                <>
                  <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
                </>
              )}
            </span>
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...meta, color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...display, color: C.ink }}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Disc3 size={16} strokeWidth={2} color={C.rust} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ color: C.ink }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...meta, color: C.forest }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> A-kant · pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.forest}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...meta, color: C.amber }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> B-kant ·
              aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.4}
                    color={C.amber}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.forest, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.amber, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.slate, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker color={C.forest}>Masters</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Panel key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...meta, color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...display, color: C.ink }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Panel>
          );
        })}
      </div>

      <Panel>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${m.color}16`, border: `1px solid ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...meta, color: C.inkSoft }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker color={C.amber}>Setlist</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.amber : C.rust;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}14`, borderRight: `1px solid ${color}44` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...meta, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Disc3 size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...meta, color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                style={ringStyle}
                className={`m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold ${RING}`}
              >
                <span
                  style={{
                    color: warn ? C.paper : C.ink,
                    background: warn ? C.amber : C.card,
                    border: warn ? "none" : `1px solid ${C.line}`,
                  }}
                  className="-mx-4 -my-2 inline-block rounded-full px-4 py-2"
                >
                  {a.cta}
                </span>
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: C.wash, border: `1px solid ${C.rust}22` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.forest} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.forest,
    Openstaand: C.amber,
    Concept: C.faint,
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker color={C.forest}>Royalty&apos;s</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          type="button"
          style={ringStyle}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
        >
          <span
            style={{ color: C.paper, background: C.rust }}
            className="-mx-4 -my-2.5 inline-flex items-center gap-2 rounded-full px-4 py-2.5"
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...meta, color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...display, color: C.forest }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...meta, color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...display, color: C.amber }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...meta, color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...meta, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...meta, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...meta, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span className="text-[11.5px] font-semibold" style={{ ...meta, color }}>
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
