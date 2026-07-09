"use client";

// Concept 213 — "Contour" · monoline outline. 2026-trend: monoline/outline UI, hairline minimalism,
// line-art iconografie. Alles is lijnwerk: hairline randen (1px), outline-iconen, near-zero vlakvulling,
// dunne kaders en verbindingslijnen. Kleur uiterst spaarzaam — één inkt-accent verschijnt alleen bij
// hover/actief. Elegant, technisch, licht; geen fills, geen schaduwen. Fonts: Geist (body) + Geist Mono
// (labels). Palet: bg #fcfcfc, ink #0f172a, lijn #d4d4d8, accent #4338ca. Status altijd label + icoon.
// UI Nederlands, code Engels. Deterministisch (geen random/Date).

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
  CircleDollarSign,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Circle,
  Minus,
  Hexagon,
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

// ── Palet — bijna geen kleur. Eén inkt-accent, alleen bij interactie. ──
const C = {
  bg: "#fcfcfc",
  ink: "#0f172a", // near-black
  inkSoft: "#475569",
  inkFaint: "#94a3b8", // labels / captions
  line: "#d4d4d8", // hairline
  lineSoft: "#e7e7ea", // extra-fijne lijn
  accent: "#4338ca", // indigo — spaarzaam, hover/actief
  accentSoft: "#eef0fb", // zeer zacht accentvlak (spaarzaam)
  // status — uitsluitend via lijn + icoon + label; kleur alleen in de glyph, nooit als vlak.
  ok: "#15803d",
  wait: "#4338ca",
  warn: "#b45309",
  bad: "#b91c1c",
};

const bodyF = { fontFamily: "var(--font-lab-geist)" }; // Geist
const monoF = { fontFamily: "var(--font-lab-geist-mono)" }; // Geist Mono — labels/captions

const hair = `1px solid ${C.line}`; // de universele hairline

// ── Status-model — outline glyph + label, geen vlak. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad };
  }
}

// Statuslabel — outline chip: hairline rand + glyph in statuskleur + mono-label. Geen fill.
function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ ...monoF, color: C.inkSoft, border: `1px solid ${m.fg}55` }}
    >
      <m.Icon size={12} strokeWidth={1.75} style={{ color: m.fg }} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Outline-kaart — enkel een hairline kader, geen fill/schaduw.
function Frame({
  children,
  className = "",
  style,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      role={role}
      style={{ border: hair, background: C.bg, ...style }}
    >
      {children}
    </div>
  );
}

// Sectiekop — mono-index + titel, met een dunne verbindingslijn die uitloopt.
function SectionHead({ index, title, sub }: { index: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium tabular-nums"
        style={{ ...monoF, color: C.inkFaint, border: hair }}
      >
        {index}
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-medium leading-tight" style={{ ...bodyF, color: C.ink }}>
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12px]" style={{ ...monoF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-1 hidden h-px flex-1 sm:block"
        style={{ background: C.lineSoft }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.75} style={{ color: C.inkFaint }} aria-hidden="true" />
      <span className="truncate text-[12.5px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Contour-ring — dunne SVG-ringmeter voor percentages (pure lijn, geen fill).
function Ring({ value, size = 72, label }: { value: number; size?: number; label: string }) {
  const stroke = 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[16px] font-medium tabular-nums leading-none"
          style={{ ...bodyF, color: C.ink }}
        >
          {value}%
        </span>
        <span
          className="mt-0.5 text-[8px] uppercase tracking-[0.08em]"
          style={{ ...monoF, color: C.inkFaint }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept213() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Kop — dunne lijn onder, outline-logo */}
      <header style={{ borderBottom: hair }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ border: hair }}
              aria-hidden="true"
            >
              <Hexagon size={19} strokeWidth={1.5} style={{ color: C.accent }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[9.5px] uppercase tracking-[0.24em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                Contour
              </div>
              <div className="text-[17px] font-medium" style={{ ...bodyF, color: C.ink }}>
                Werkruimte
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
              style={{ ...monoF, color: C.inkSoft, border: hair }}
            >
              <ShieldCheck
                size={13}
                strokeWidth={1.75}
                style={{ color: C.ok }}
                aria-hidden="true"
              />{" "}
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-medium"
              style={{ ...monoF, color: C.ink, border: hair }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Nav — outline tab-lijn */}
        <nav
          className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-3 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  color: on ? C.accent : C.inkSoft,
                  border: `1px solid ${on ? C.accent : C.line}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                <span
                  className="text-[9px] tabular-nums"
                  style={{ ...monoF, color: on ? C.accent : C.inkFaint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-10">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onActies={() => setScreen("acties")}
            onVerif={() => setScreen("verificatie")}
          />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      <footer style={{ borderTop: hair }}>
        <div
          className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-5 text-[11px] md:px-8"
          style={{ ...monoF, color: C.inkFaint }}
        >
          <Minus size={12} aria-hidden="true" /> Contour — puur lijnwerk, elke status draagt label
          en icoon
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onVerif,
}: {
  onOpen: () => void;
  onActies: () => void;
  onVerif: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — outline paneel, geen fill */}
      <Frame className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
          <div className="p-6 sm:p-8">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ ...monoF, color: C.inkSoft, border: hair }}
            >
              <Circle size={9} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />{" "}
              {PROFIEL.rol}
            </span>
            <h1
              className="mt-4 text-[27px] font-medium leading-tight sm:text-[32px]"
              style={{ ...bodyF, color: C.ink }}
            >
              Drie sterke matches
              <br />
              staan voor je klaar.
            </h1>
            <p
              className="mt-3 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Eén aandachtspunt: je VOG verloopt binnenkort. Werk het bij en houd je profiel
              volledig verifieerbaar voor opdrachtgevers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors hover:bg-[#eef0fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  color: C.accent,
                  border: `1px solid ${C.accent}`,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                Bekijk matches <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  color: C.ink,
                  border: hair,
                  ["--tw-ring-color" as string]: C.accent,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Los actie op
              </button>
            </div>
          </div>

          {/* Vertrouwen — contour-ring */}
          <div
            className="flex flex-col justify-center gap-4 p-6 sm:p-8"
            style={{ borderTop: hair }}
          >
            <div className="flex items-center gap-4">
              <Ring value={dek} label="dekking" />
              <div className="min-w-0">
                <div className="text-[14px] font-medium" style={{ ...bodyF, color: C.ink }}>
                  {verified}/{CREDENTIALS.length} geverifieerd
                </div>
                <div className="mt-1.5">
                  <StatusTag status="VERIFIED" />
                </div>
                <button
                  onClick={onVerif}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium transition-colors hover:text-[#4338ca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    color: C.inkSoft,
                    ["--tw-ring-color" as string]: C.accent,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  Naar verificatie <ChevronRight size={13} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Frame>

      {/* KPI's — outline cellen met verbindende hairlines */}
      <div
        className="grid grid-cols-2 overflow-hidden rounded-lg lg:grid-cols-4"
        style={{ border: hair }}
      >
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="p-4"
            style={{
              borderLeft: i % 4 === 0 ? undefined : hair,
              borderTop: i >= 2 ? hair : undefined,
            }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.04em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {k.label}
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span
                className="text-[24px] font-medium tabular-nums leading-none"
                style={{ ...bodyF, color: C.ink }}
              >
                {k.value}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[11px] tabular-nums"
                style={{ ...monoF, color: k.up ? C.ok : C.inkFaint }}
              >
                {k.up ? (
                  <ArrowRight size={11} strokeWidth={2} className="-rotate-45" aria-hidden="true" />
                ) : (
                  <Minus size={11} strokeWidth={2} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            {/* sparkline als pure lijn */}
            <Spark points={k.spark} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead index="01" title="Aanbevolen opdrachten" sub="Gerangschikt op match" />
          <Frame className="overflow-hidden">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#f7f7f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  borderTop: i === 0 ? undefined : hair,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                <span className="relative shrink-0">
                  <Ring value={o.match} size={52} label="match" />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[15px] font-medium"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    {o.titel}
                  </div>
                  <div
                    className="mt-0.5 truncate text-[12.5px]"
                    style={{ ...bodyF, color: C.inkSoft }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                        style={{ ...bodyF, color: C.inkSoft, border: hair }}
                      >
                        <Check
                          size={10}
                          strokeWidth={2}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />{" "}
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  strokeWidth={1.75}
                  className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: C.inkFaint }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </Frame>
        </section>

        {/* Aandachtspunt */}
        <section className="space-y-4">
          <SectionHead index="02" title="Aandacht" sub="Vraagt om actie" />
          <Frame className="p-5" style={{ borderColor: `${C.warn}55` }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ ...monoF, color: C.warn, border: `1px solid ${C.warn}55` }}
            >
              <TriangleAlert size={12} strokeWidth={1.75} aria-hidden="true" /> Actie vereist
            </span>
            <h3
              className="mt-3 text-[16px] font-medium leading-tight"
              style={{ ...bodyF, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-[#eef0fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                color: C.accent,
                border: `1px solid ${C.accent}`,
                ["--tw-ring-color" as string]: C.accent,
                ["--tw-ring-offset-color" as string]: C.bg,
              }}
            >
              {warn.cta} <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </Frame>
        </section>
      </div>
    </div>
  );
}

// Sparkline — pure polyline, geen fill. Deterministisch geschaald.
function Spark({ points }: { points: number[] }) {
  const w = 100;
  const h = 22;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-3 h-6 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke={C.inkFaint}
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
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
        <SectionHead index="00" title="Marktplaats" sub="Open opdrachten die passen" />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ border: hair }}
          >
            <Search size={15} strokeWidth={1.75} style={{ color: C.inkFaint }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Verversen"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:border-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              border: hair,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              strokeWidth={1.75}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.inkSoft }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <Frame
          className="flex items-start gap-3 p-4"
          role="alert"
          style={{ borderColor: `${C.bad}55` }}
        >
          <XCircle size={18} strokeWidth={1.75} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium" style={{ ...bodyF, color: C.ink }}>
              Niet volledig geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een deel van de opdrachten ontbreekt. Ververs om opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{
              ...monoF,
              color: C.bad,
              border: `1px solid ${C.bad}55`,
              ["--tw-ring-color" as string]: C.bad,
            }}
          >
            Sluiten
          </button>
        </Frame>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Frame key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.lineSoft }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Frame>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Frame className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ border: hair }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={1.5} style={{ color: C.inkFaint }} />
          </span>
          <p className="text-[17px] font-medium" style={{ ...bodyF, color: C.ink }}>
            Geen resultaten
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen opdracht gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-[#eef0fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              color: C.accent,
              border: `1px solid ${C.accent}`,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Frame>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Frame
              key={o.id}
              className="flex flex-col overflow-hidden transition-colors hover:border-[#94a3b8]"
            >
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: hair }}
              >
                <span
                  className="text-[11px] uppercase tracking-[0.06em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium tabular-nums"
                  style={{ ...monoF, color: C.accent, border: `1px solid ${C.accent}55` }}
                >
                  {o.match}% match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[15.5px] font-medium leading-tight"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={CircleDollarSign} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px]"
                      style={{ ...monoF, color: C.inkSoft, border: hair }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-medium transition-colors hover:bg-[#f7f7f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: hair,
                  color: C.accent,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </Frame>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ────────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: CircleDollarSign },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:border-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          color: C.inkSoft,
          border: hair,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Frame className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {opdracht.id} · start {opdracht.start}
            </span>
            <h1
              className="mt-2 max-w-2xl text-[24px] font-medium leading-tight sm:text-[30px]"
              style={{ ...bodyF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <Ring value={opdracht.match} size={92} label="match" />
        </div>
      </Frame>

      <dl
        className="grid grid-cols-2 overflow-hidden rounded-lg lg:grid-cols-4"
        style={{ border: hair }}
      >
        {feiten.map((f, i) => (
          <div
            key={f.l}
            className="p-4"
            style={{
              borderLeft: i % 4 === 0 ? undefined : hair,
              borderTop: i >= 2 ? hair : undefined,
            }}
          >
            <dt
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.04em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              <f.Icon size={12} strokeWidth={1.75} aria-hidden="true" /> {f.l}
            </dt>
            <dd
              className="mt-1.5 text-[17px] font-medium tabular-nums"
              style={{ ...bodyF, color: C.ink }}
            >
              {f.v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead index="＋" title="Waarom dit past" />
          <Frame className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={1.75}
                    style={{ color: C.ok, marginTop: 1 }}
                    aria-hidden="true"
                  />{" "}
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
        </section>
        <section className="space-y-3">
          <SectionHead index="－" title="Om te overwegen" />
          <Frame className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <TriangleAlert
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: C.warn, marginTop: 2 }}
                    aria-hidden="true"
                  />{" "}
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13.5px] font-medium transition-colors hover:bg-[#eef0fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            color: C.accent,
            border: `1px solid ${C.accent}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13.5px] font-medium transition-colors hover:border-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            color: C.ink,
            border: hair,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={1.75} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead index="01" title="Verificatie" sub="Certificaten & documenten" />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#eef0fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            color: C.accent,
            border: `1px solid ${C.accent}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} strokeWidth={1.75} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Frame className="p-6">
        <div className="flex flex-wrap items-center gap-6">
          <Ring value={dek} size={92} label="dekking" />
          <div className="min-w-0 max-w-lg">
            <div className="text-[18px] font-medium" style={{ ...bodyF, color: C.ink }}>
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1.5 text-[13px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk geverifieerd certificaat verhoogt je vertrouwensniveau. Opdrachtgevers zien
              uitsluitend geverifieerde documenten; je bestanden blijven standaard privé.
            </p>
            <div className="mt-3">
              <StatusTag status="VERIFIED" />
            </div>
          </div>
        </div>
      </Frame>

      <Frame className="overflow-hidden">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <div
              key={c.naam}
              className="flex flex-wrap items-center gap-4 p-4"
              style={{ borderTop: i === 0 ? undefined : hair }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ border: `1px solid ${m.fg}55` }}
                aria-hidden="true"
              >
                <m.Icon size={19} strokeWidth={1.75} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-medium"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
              </div>
              <StatusTag status={c.status} />
              {actionable && (
                <button
                  className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    color: C.ink,
                    border: hair,
                    ["--tw-ring-color" as string]: C.accent,
                    ["--tw-ring-offset-color" as string]: C.bg,
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
          );
        })}
      </Frame>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead index="01" title="Werklijst" sub="Op urgentie gerangschikt — begin bovenaan" />

      {/* verticale tijdlijn met verbindende hairline */}
      <ol className="relative space-y-4 pl-6">
        <span
          className="absolute bottom-2 left-[10px] top-2 w-px"
          style={{ background: C.lineSoft }}
          aria-hidden="true"
        />
        {sorted.map((a) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel} className="relative">
              <span
                className="absolute -left-6 top-4 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: C.bg, border: `1px solid ${warn ? C.warn : C.line}` }}
                aria-hidden="true"
              >
                {warn ? (
                  <TriangleAlert size={11} strokeWidth={1.75} style={{ color: C.warn }} />
                ) : (
                  <Circle size={7} strokeWidth={2} style={{ color: C.inkFaint }} />
                )}
              </span>
              <Frame className="p-5" style={warn ? { borderColor: `${C.warn}55` } : undefined}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                    style={{
                      ...monoF,
                      color: warn ? C.warn : C.inkSoft,
                      border: `1px solid ${warn ? C.warn + "55" : C.line}`,
                    }}
                  >
                    {warn ? (
                      <TriangleAlert size={10} strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <Star size={10} strokeWidth={1.75} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Kans"}
                  </span>
                  <h3 className="text-[16px] font-medium" style={{ ...bodyF, color: C.ink }}>
                    {a.titel}
                  </h3>
                </div>
                <p
                  className="mt-1.5 text-[13px] leading-relaxed"
                  style={{ ...bodyF, color: C.inkSoft }}
                >
                  {a.detail}
                </p>
                <button
                  className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#eef0fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    color: C.accent,
                    border: `1px solid ${C.accent}`,
                    ["--tw-ring-color" as string]: C.accent,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  {a.cta} <ArrowRight size={13} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </Frame>
            </li>
          );
        })}
      </ol>

      <section className="space-y-3">
        <SectionHead index="02" title="Berichten" sub="Recente gesprekken" />
        <Frame className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : hair }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                style={{ ...monoF, color: C.ink, border: hair }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-medium"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-medium"
                      style={{ ...monoF, color: C.accent, border: `1px solid ${C.accent}55` }}
                    >
                      nieuw
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...monoF, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Frame>
      </section>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): { label: string; Icon: LucideIcon; fg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok };
    if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, fg: C.warn };
    return { label: "Concept", Icon: FileText, fg: C.inkFaint };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead index="01" title="Facturen" sub="Omzet & openstaand" />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#eef0fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            color: C.accent,
            border: `1px solid ${C.accent}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} strokeWidth={1.75} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="grid grid-cols-1 overflow-hidden rounded-lg sm:grid-cols-3"
        style={{ border: hair }}
      >
        {[
          { l: "Ontvangen (mnd)", v: betaald, accent: true },
          { l: "Openstaand", v: String(open), accent: false },
          { l: "Te factureren", v: "€ 1.350", accent: false },
        ].map((s, i) => (
          <div key={s.l} className="p-4" style={{ borderLeft: i === 0 ? undefined : hair }}>
            <div
              className="text-[11px] uppercase tracking-[0.04em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-medium tabular-nums leading-none"
              style={{ ...bodyF, color: s.accent ? C.accent : C.ink }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <Frame className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: hair }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10.5px] uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
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
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f7f7f9]"
                    style={{ borderTop: i === 0 ? undefined : hair }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-medium tabular-nums"
                      style={{ ...bodyF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ ...monoF, color: C.inkSoft, border: `1px solid ${m.fg}55` }}
                      >
                        <m.Icon
                          size={11}
                          strokeWidth={1.75}
                          style={{ color: m.fg }}
                          aria-hidden="true"
                        />{" "}
                        {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[14px] font-medium tabular-nums"
                      style={{ ...bodyF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: hair }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] uppercase tracking-[0.06em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  Totaal ontvangen
                </td>
                <td
                  className="px-4 py-3 text-right text-[16px] font-medium tabular-nums"
                  style={{ ...bodyF, color: C.accent }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Frame>
    </div>
  );
}
