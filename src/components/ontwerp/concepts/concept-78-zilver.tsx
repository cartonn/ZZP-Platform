"use client";

// Concept 78 — "Zilver" · zilver-gelatine zwart-wit fotografie / contactvel.
// Neutraal lichtgrijs (#ededea), bijna-zwart (#17171a) en warm sepia accent (#9a7b52). Editorial
// fotografie-esthetiek: contactvel-raster (film-frames met sprocket-gaatjes langs de rand), grote
// grafische koppen, hoog-contrast grijswaarden, filmkorrel (SVG feTurbulence), "frame 12A"-annotaties
// in mono. Rustig, chic, tijdloos-redactioneel.
// Fonts: --font-lab-fraunces (display, serif) + --font-lab-inter (body). Mono voor annotaties via --font-lab-mono.

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
  Camera,
  Aperture,
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

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#ededea",
  paperAlt: "#e3e2dd",
  card: "#f6f5f2",
  ink: "#17171a",
  inkSoft: "#4b4b50",
  faint: "#83837f",
  sepia: "#9a7b52",
  sepiaSoft: "#e9e0d2",
  line: "#17171a",
  lineSoft: "rgba(23,23,26,0.14)",
  hair: "rgba(23,23,26,0.08)",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-inter)" };
const anno = { fontFamily: "var(--font-lab-mono)" };

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ink, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.inkSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.sepia, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.ink, Icon: XCircle };
  }
}

/* ---------- Filmkorrel (SVG feTurbulence, deterministisch) ---------- */

function FilmGrain() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="zilver-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed="11"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#zilver-grain)" opacity="0.05" />
    </svg>
  );
}

// Sprocket-gaatjes langs een rand (film-perforatie).
function Sprockets({ vertical = false, count = 8 }: { vertical?: boolean; count?: number }) {
  return (
    <div
      className={`flex ${vertical ? "flex-col" : "flex-row"} items-center justify-around`}
      aria-hidden="true"
      style={{ gap: "3px" }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="block rounded-[1px]"
          style={{
            width: "8px",
            height: "6px",
            background: C.paper,
            border: `1px solid ${C.lineSoft}`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Kleine bouwstenen ---------- */

// Contactvel-frame: film-frame met randlijn en frame-annotatie.
function Frame({
  children,
  frameNo,
  className = "",
  active = false,
}: {
  children: React.ReactNode;
  frameNo?: string;
  className?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: C.card,
        border: `1.5px solid ${active ? C.ink : C.lineSoft}`,
        boxShadow: active ? "0 8px 24px -16px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {frameNo && (
        <span
          className="absolute right-2 top-2 z-10 text-[9px] tracking-[0.14em]"
          style={{ ...anno, color: active ? C.sepia : C.faint }}
        >
          {frameNo}
        </span>
      )}
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-[10px] font-semibold uppercase tracking-[0.3em]"
      style={{ ...body, color: C.sepia }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-1.5 text-[30px] leading-[0.98] sm:text-[40px]"
      style={{ ...display, color: C.ink, letterSpacing: "-0.02em", fontWeight: 500 }}
    >
      {children}
    </h1>
  );
}

// Frame-annotatie in mono, zoals "FRAME 12A".
function FrameTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9.5px] tracking-[0.12em]"
      style={{ ...anno, color: C.faint }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ ...body, color: m.color, background: C.paper, border: `1px solid ${m.color}` }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Grijswaarde-sparkline.
function Spark({ data, color = C.ink }: { data: number[]; color?: string }) {
  const w = 92;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={line} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}

// Score als belichtings-cijfer op een frame-hoek.
function ScoreCoin({ value, size = 46 }: { value: number; size?: number }) {
  const strong = value >= 90;
  return (
    <span
      className="relative flex shrink-0 flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        background: strong ? C.ink : C.paper,
        border: `1.5px solid ${C.ink}`,
      }}
      aria-hidden="true"
    >
      <span
        className="text-[16px] leading-none"
        style={{ ...display, color: strong ? C.paper : C.ink, fontWeight: 500 }}
      >
        {value}
      </span>
      <span
        className="text-[7px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...body, color: strong ? C.sepia : C.faint }}
      >
        match
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept78() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      <FilmGrain />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — filmstrip met sprocket-rand */}
        <aside
          className="shrink-0 md:w-[240px]"
          style={{ borderRight: `1.5px solid ${C.line}`, background: C.paperAlt }}
        >
          <div className="flex h-full flex-col">
            <div className="p-4" style={{ borderBottom: `1.5px solid ${C.line}` }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{ background: C.ink }}
                  aria-hidden="true"
                >
                  <Aperture size={20} strokeWidth={1.8} color={C.paper} />
                </span>
                <div className="leading-tight">
                  <div
                    className="text-[18px]"
                    style={{ ...display, color: C.ink, fontWeight: 500 }}
                  >
                    Zilver
                  </div>
                  <div
                    className="text-[8.5px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: C.sepia }}
                  >
                    ZZP · contactvel
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <FrameTag>ROLL 07 · 36 EXP · ISO 400</FrameTag>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s, idx) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a] md:w-full"
                    style={{
                      color: on ? C.paper : C.inkSoft,
                      background: on ? C.ink : "transparent",
                      fontWeight: on ? 600 : 500,
                    }}
                  >
                    <span
                      className="text-[9px] tabular-nums"
                      style={{ ...anno, color: on ? C.sepia : C.faint }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-2.5 p-4 md:flex"
              style={{ borderTop: `1.5px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[12px]"
                style={{ ...display, color: C.paper, background: C.ink, fontWeight: 500 }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.sepia }}
                >
                  <ShieldCheck size={11} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Contactvel · overzicht</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <FrameTag>
          <Camera size={12} strokeWidth={2} aria-hidden="true" /> 04·07·2026
        </FrameTag>
      </header>

      {warn && (
        <Frame className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" active>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start"
            style={{ background: C.ink }}
          >
            <AlertTriangle size={18} strokeWidth={2} color={C.paper} aria-hidden="true" />
          </span>
          <p className="text-[12.5px] leading-snug" role="alert">
            <span className="font-semibold" style={{ color: C.ink }}>
              {warn.titel}.
            </span>{" "}
            <span style={{ color: C.inkSoft }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a]"
            style={{ color: C.paper, background: C.ink }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </Frame>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Frame key={k.label} frameNo={`${String(i + 1).padStart(2, "0")}A`} className="p-3.5">
            <p
              className="pr-8 text-[9.5px] font-semibold uppercase leading-tight tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[24px] leading-none"
              style={{ ...display, color: C.ink, fontWeight: 500 }}
            >
              {k.value}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <Spark data={k.spark} color={k.up ? C.ink : C.sepia} />
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums"
                style={{ color: k.up ? C.ink : C.sepia }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} strokeWidth={2.4} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
          </Frame>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Frame>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.hair}` }}
            >
              <h3 className="text-[19px]" style={{ ...display, color: C.ink, fontWeight: 500 }}>
                Beste matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a]"
                style={{ color: C.sepia }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-2 p-3" role="status" aria-live="polite">
                <span className="sr-only">Matches worden geladen…</span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3"
                    style={{ background: C.paperAlt }}
                  >
                    <span
                      className="h-11 w-11 shrink-0 animate-pulse"
                      style={{ background: C.hair }}
                    />
                    <div className="flex-1 space-y-2">
                      <span
                        className="block h-3 w-2/3 animate-pulse"
                        style={{ background: C.hair }}
                      />
                      <span
                        className="block h-2.5 w-1/2 animate-pulse"
                        style={{ background: C.hair }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul>
                {OPDRACHTEN.map((o, i) => (
                  <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                    <button
                      onClick={() => onOpen(o.id)}
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#e3e2dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#17171a]"
                    >
                      <ScoreCoin value={o.match} />
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-semibold"
                          style={{ color: C.ink }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11px]" style={{ color: C.inkSoft }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ArrowUpRight size={15} strokeWidth={2} color={C.faint} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Frame>
        </div>

        <Frame>
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.hair}` }}
          >
            <h3 className="text-[19px]" style={{ ...display, color: C.ink, fontWeight: 500 }}>
              Certificaten
            </h3>
          </div>
          <div>
            {CREDENTIALS.map((c, i) => {
              const m = credMeta(c.status);
              const Icon = m.Icon;
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
                >
                  <Icon size={15} strokeWidth={2} color={m.color} aria-hidden="true" />
                  <span
                    className="min-w-0 flex-1 truncate text-[12px] font-medium"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: m.color }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Kicker>Contactvel · selectie</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ border: `1.5px solid ${C.line}`, background: C.card }}
      >
        <Search size={16} strokeWidth={2} color={C.sepia} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#83837f]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[10.5px] tabular-nums" style={{ ...anno, color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Frame className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center"
            style={{ border: `1.5px solid ${C.line}`, background: C.paperAlt }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={1.8} color={C.sepia} />
          </span>
          <p className="mt-4 text-[22px]" style={{ ...display, color: C.ink, fontWeight: 500 }}>
            Niets op deze rol
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.inkSoft }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a]"
            style={{ color: C.paper, background: C.ink }}
          >
            Zoekopdracht wissen
          </button>
        </Frame>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* Contactvel-raster: film-frames met sprocket-rand, hover licht een frame op */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filtered.map((o, idx) => {
              const on = sel?.id === o.id;
              const hot = hovered === o.id || on;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  onMouseEnter={() => setHovered(o.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(o.id)}
                  onBlur={() => setHovered(null)}
                  aria-pressed={on}
                  className="text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a]"
                  style={{ background: C.ink, padding: "6px" }}
                >
                  <div className="px-1 pb-1">
                    <Sprockets count={7} />
                  </div>
                  <div
                    className="p-3 transition-all"
                    style={{
                      background: hot ? C.card : C.paperAlt,
                      filter: hot ? "none" : "grayscale(1) contrast(1.05) brightness(0.98)",
                      border: `1px solid ${hot ? C.sepia : "transparent"}`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="text-[9px] tracking-[0.12em]"
                        style={{ ...anno, color: C.faint }}
                      >
                        FRAME {String(idx + 1).padStart(2, "0")}
                        {on ? "·SEL" : "A"}
                      </span>
                      <ScoreCoin value={o.match} size={38} />
                    </div>
                    <p
                      className="mt-2 text-[14px] font-semibold leading-tight"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </p>
                    <p
                      className="mt-1 flex items-center gap-1 truncate text-[11px]"
                      style={{ color: C.inkSoft }}
                    >
                      <MapPin size={11} strokeWidth={2} aria-hidden="true" /> {o.plaats} ·{" "}
                      {o.tarief}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em]"
                          style={{
                            color: C.inkSoft,
                            background: C.paper,
                            border: `1px solid ${C.lineSoft}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="px-1 pt-1">
                    <Sprockets count={7} />
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Frame active frameNo="MASTER">
                <div className="p-4">
                  <FrameTag>{sel.id} · GESELECTEERD</FrameTag>
                  <p
                    className="mt-2 text-[19px] leading-snug"
                    style={{ ...display, color: C.ink, fontWeight: 500 }}
                  >
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[11.5px]" style={{ color: C.inkSoft }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl
                    className="mt-4 grid grid-cols-2 gap-px"
                    style={{ background: C.hair, border: `1px solid ${C.hair}` }}
                  >
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div key={m.l} className="p-2.5" style={{ background: C.card }}>
                        <dt
                          className="text-[8.5px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 text-[14px] font-semibold tabular-nums"
                          style={{ color: C.ink }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a]"
                    style={{ color: C.paper, background: C.ink }}
                  >
                    Vergroot frame <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              </Frame>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Frame active frameNo="ENLARGEMENT">
        <div className="px-1 pt-1">
          <Sprockets count={16} />
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.opdrachtgever}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[11.5px]" style={{ color: C.inkSoft }}>
              {opdracht.plaats} · {opdracht.uren}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em]"
                  style={{
                    color: C.inkSoft,
                    background: C.paper,
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreCoin value={opdracht.match} size={68} />
        </div>
        <div className="px-1 pb-1">
          <Sprockets count={16} />
        </div>
        <div className="p-4" style={{ borderTop: `1px solid ${C.hair}` }}>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a] disabled:opacity-90"
            style={{ color: C.paper, background: state === "sent" ? C.sepia : C.ink }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Ontwikkelen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={2.8} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </Frame>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Frame key={m.l} frameNo={`${String(i + 1).padStart(2, "0")}B`} className="p-4">
            <p
              className="text-[8.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[18px] tabular-nums"
              style={{ ...display, color: C.ink, fontWeight: 500 }}
            >
              {m.v}
            </p>
          </Frame>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Frame>
          <div
            className="flex items-center gap-2 p-4"
            style={{ borderBottom: `1px solid ${C.hair}` }}
          >
            <Check size={14} strokeWidth={2.6} color={C.ink} aria-hidden="true" />
            <h3
              className="text-[12px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.ink }}
            >
              Belicht · pluspunten
            </h3>
          </div>
          <ul className="p-4">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 py-1.5 text-[12.5px]"
                style={{ color: C.ink }}
              >
                <Check
                  size={15}
                  strokeWidth={2.4}
                  color={C.ink}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Frame>
        <Frame>
          <div
            className="flex items-center gap-2 p-4"
            style={{ borderBottom: `1px solid ${C.hair}` }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} color={C.sepia} aria-hidden="true" />
            <h3
              className="text-[12px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.sepia }}
            >
              Schaduw · aandacht
            </h3>
          </div>
          <ul className="p-4">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 py-1.5 text-[12.5px]"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={2.2}
                  color={C.sepia}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Frame>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.ink, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.sepia, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.inkSoft, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Kicker>Archief · controle</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
          Je bewijsstukken worden veilig en privé bewaard — als negatieven in het archief.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s, i) => {
          const Icon = s.Icon;
          return (
            <Frame
              key={s.l}
              frameNo={`${String(i + 1).padStart(2, "0")}A`}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p
                  className="text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[24px] tabular-nums"
                  style={{ ...display, color: C.ink, fontWeight: 500 }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{ border: `1.5px solid ${s.color}`, background: C.card }}
              >
                <Icon size={20} strokeWidth={1.8} color={s.color} aria-hidden="true" />
              </span>
            </Frame>
          );
        })}
      </div>

      <Frame>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ border: `1.5px solid ${m.color}`, background: C.paperAlt }}
              >
                <Icon size={20} strokeWidth={1.8} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <FrameTag>NEG-{String(i + 1).padStart(2, "0")}</FrameTag>
                </div>
                <p className="mt-0.5 text-[11px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Frame>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Kicker>Bijschriften</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.sepia : C.ink;
          return (
            <Frame key={a.titel} className="flex items-stretch" active={warn}>
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-1.5"
                style={{
                  background: warn ? C.ink : C.paperAlt,
                  borderRight: `1.5px solid ${C.lineSoft}`,
                }}
              >
                <span
                  className="text-[16px] tabular-nums"
                  style={{ ...display, color: warn ? C.paper : C.ink, fontWeight: 500 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.2} color={C.sepia} aria-hidden="true" />
                ) : (
                  <Check size={15} strokeWidth={2.4} color={C.ink} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a]"
                style={{
                  color: warn ? C.paper : C.ink,
                  background: warn ? C.ink : "transparent",
                  border: `1.5px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Frame>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 p-4"
        style={{ border: `1.5px solid ${C.line}`, background: C.card }}
      >
        <Check size={18} strokeWidth={2.2} color={C.ink} aria-hidden="true" />
        <p className="text-[12px]" style={{ color: C.inkSoft }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { label: string; color: string }> = {
    Betaald: { label: "Betaald", color: C.ink },
    Openstaand: { label: "Openstaand", color: C.sepia },
    Concept: { label: "Concept", color: C.faint },
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
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Grootboek</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17171a]"
          style={{ color: C.paper, background: C.ink }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Frame frameNo="ONTV" className="p-4">
          <p
            className="text-[9.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-2 text-[22px] tabular-nums"
            style={{ ...display, color: C.ink, fontWeight: 500 }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Frame>
        <Frame frameNo="OPEN" className="p-4">
          <p
            className="text-[9.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[22px] tabular-nums"
            style={{ ...display, color: C.sepia, fontWeight: 500 }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Frame>
      </div>

      <Frame className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{
                color: C.faint,
                borderBottom: `1.5px solid ${C.line}`,
                background: C.paperAlt,
              }}
            >
              <th className="p-3.5">Nummer</th>
              <th className="p-3.5">Klant</th>
              <th className="hidden p-3.5 sm:table-cell">Datum</th>
              <th className="p-3.5 text-right">Bedrag</th>
              <th className="p-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = statusMeta[f.status] ?? { label: f.status, color: C.faint };
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                  <td
                    className="p-3.5 text-[11.5px] tabular-nums"
                    style={{ ...anno, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-3.5 text-[12.5px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-3.5 text-[11.5px] tabular-nums sm:table-cell"
                    style={{ ...anno, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-3.5 text-right text-[13px] tabular-nums"
                    style={{ ...display, color: C.ink, fontWeight: 500 }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: m.color }}
                        aria-hidden="true"
                      />
                      <span className="text-[11px] font-semibold" style={{ color: m.color }}>
                        {m.label}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Frame>
    </div>
  );
}
