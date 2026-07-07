"use client";

// Concept 152 — "Zwerk" · ruimtelijke visionOS-diepte. Gelaagde translucente glaspanelen met écht
// z-diepte-gevoel: parallax-/offset-lagen, depth-of-field-blur (backdrop-blur + opacity) op
// achtergrondlagen, ultra-ronde hoeken (rounded-[28px]+), zacht refracterend licht (subtiele
// gradient-randen), zwevend boven een zachte omgevingsgradient. Licht, luchtig, premium.
// Onderscheidend van plat glas / liquid-distort / gooey: hier telt échte gelaagde diepte en zacht
// omgevingslicht, geen vervorming. Deterministisch — geen random/Date. Fonts: Sora + Inter.
// Status nooit kleur-alleen: altijd label + icoon + patroon (zie credMeta).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  Sparkles,
  Plus,
  ChevronLeft,
  Layers,
  Mail,
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

// ── Palet — luchtig, koel glas met warm-lichte accenten ──────────────────────────
const C = {
  ink: "#1c2430",
  inkSoft: "#4a5568",
  inkFaint: "#7b8698",
  accent: "#4c7dff",
  accentDeep: "#3a63e0",
  mint: "#2bbf9a",
  amber: "#e8a13c",
  rose: "#e8657a",
  glassEdge: "rgba(255,255,255,0.65)",
};

const disp = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Glaslaag — translucent, ultra-rond, zachte refracterende rand + diepte-schaduw.
const glassStyle = (elevation: number): React.CSSProperties => ({
  background: "linear-gradient(155deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42))",
  backdropFilter: "blur(24px) saturate(150%)",
  WebkitBackdropFilter: "blur(24px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: `0 ${6 + elevation * 8}px ${20 + elevation * 22}px -12px rgba(28,36,48,${0.14 + elevation * 0.05}), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.25)`,
});

// ── Status-model — nooit kleur-alleen (icoon + label + zachte tint) ──────────────
type StatusStyle = { label: string; Icon: LucideIcon; color: string; tint: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.mint, tint: "rgba(43,191,154,0.12)" };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        color: C.accent,
        tint: "rgba(76,125,255,0.12)",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        color: C.amber,
        tint: "rgba(232,161,60,0.14)",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.rose, tint: "rgba(232,101,122,0.12)" };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
      style={{ ...body, color: m.color, background: m.tint, border: `1px solid ${m.color}33` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Zwevende glaskaart met optionele diepte-elevatie en hover-lift.
function Glass({
  children,
  className = "",
  elevation = 1,
  interactive = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  elevation?: number;
  interactive?: boolean;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-[28px] ${interactive ? "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl" : ""} ${className}`}
      style={glassStyle(elevation)}
    >
      {children}
    </Tag>
  );
}

// Zachte ring-meter (refracterend licht rondom een waarde).
function RingMeter({ pct, size = 92 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(28,36,48,0.08)"
          strokeWidth={7}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#zwerkRing)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
        <defs>
          <linearGradient id="zwerkRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.accent} />
            <stop offset="100%" stopColor={C.mint} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-semibold leading-none" style={{ ...disp, color: C.ink }}>
          {pct}
          <span className="text-[13px]">%</span>
        </span>
      </div>
    </div>
  );
}

// Zachte sparkline-curve.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 96;
  const h = 30;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (max === min ? 0.5 : (v - min) / (max - min)) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} aria-hidden="true" className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={C.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function matchColor(m: number): string {
  return m >= 90 ? C.mint : m >= 85 ? C.accent : C.amber;
}

// Omgevings-achtergrondlagen — zacht refracterend licht met depth-of-field-blur.
function Ambient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(76,125,255,0.45), transparent 68%)",
          filter: "blur(46px)",
        }}
      />
      <div
        className="absolute right-[-10%] top-[8%] h-[380px] w-[380px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(43,191,154,0.40), transparent 66%)",
          filter: "blur(52px)",
        }}
      />
      <div
        className="absolute bottom-[-14%] left-[26%] h-[440px] w-[440px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(232,161,60,0.30), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept152() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  const tabs: { key: ScreenKey; label: string }[] = [
    ...SCREENS,
    { key: "berichten", label: "Berichten" },
  ];

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        background: "linear-gradient(165deg, #eaf0fb 0%, #eef4f2 46%, #f3eee6 100%)",
      }}
    >
      <Ambient />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
        {/* Zwevende glazen navigatie-bar (bovenlaag) */}
        <header className="mb-6">
          <Glass elevation={2} className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
              style={{
                background: `linear-gradient(150deg, ${C.accent}, ${C.mint})`,
                boxShadow: `0 8px 18px -6px ${C.accent}88`,
              }}
              aria-hidden="true"
            >
              <Layers size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[16px] font-semibold tracking-[-0.01em]"
                style={{ ...disp, color: C.ink }}
              >
                Zwerk
              </div>
              <div className="text-[11.5px]" style={{ color: C.inkFaint }}>
                {PROFIEL.rol}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium sm:inline-flex"
                style={{
                  color: C.mint,
                  background: "rgba(43,191,154,0.12)",
                  border: `1px solid ${C.mint}33`,
                }}
              >
                <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold text-white"
                style={{ background: `linear-gradient(150deg, ${C.inkSoft}, ${C.ink})` }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </Glass>
        </header>

        {/* Scherm-switcher als zwevende glas-segmenten */}
        <nav
          className="mb-7 flex items-center gap-1.5 overflow-x-auto rounded-full p-1.5"
          aria-label="Schermen"
          style={glassStyle(1)}
        >
          {tabs.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        color: "#fff",
                        background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
                        boxShadow: `0 8px 18px -8px ${C.accent}aa`,
                        ["--tw-ring-color" as string]: C.accent,
                      }
                    : { color: C.inkSoft, ["--tw-ring-color" as string]: C.accent }
                }
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main>
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
          {screen === "berichten" && <Berichten />}
        </main>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-6">
      {/* Hero — diepste laag met parallax-glaselement erboven */}
      <Glass elevation={3} className="relative overflow-hidden p-6 sm:p-8">
        <span
          className="pointer-events-none absolute -right-16 -top-20 hidden h-64 w-64 rounded-full sm:block"
          style={{
            background: `radial-gradient(circle, ${C.accent}40, transparent 68%)`,
            filter: "blur(12px)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium"
              style={{ color: C.accentDeep, background: "rgba(76,125,255,0.12)" }}
            >
              <Sparkles size={12} aria-hidden="true" /> Bulletin
            </span>
            <h1
              className="mt-3 text-[27px] font-semibold leading-[1.12] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...disp, color: C.ink }}
            >
              Drie matches boven 85%. De omzet stijgt gestaag.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Eén taak vraagt aandacht: je VOG verloopt binnenkort. Handel het af en blijf
              verifieerbaar voor opdrachtgevers.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
                  boxShadow: `0 10px 22px -8px ${C.accent}aa`,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: C.ink,
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
          {/* Zwevende sub-glaslaag met ring — parallax-diepte */}
          <Glass elevation={1} className="flex items-center gap-4 p-5">
            <RingMeter pct={dek} />
            <div className="max-w-[150px]">
              <div className="text-[13px] font-semibold" style={{ ...disp, color: C.ink }}>
                Dekking certificaten
              </div>
              <div className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <StatusPill status="VERIFIED" />
            </div>
          </Glass>
        </div>
      </Glass>

      {/* KPI-grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Glass key={k.label} interactive elevation={1} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                style={{
                  color: k.up ? C.mint : C.amber,
                  background: k.up ? "rgba(43,191,154,0.12)" : "rgba(232,161,60,0.14)",
                }}
              >
                {k.up ? "↑" : "↓"} {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...disp, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2">
              <Spark data={k.spark} />
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="px-1 text-[15px] font-semibold" style={{ ...disp, color: C.ink }}>
            Aanbevolen matches
          </h2>
          <div className="space-y-3.5">
            {OPDRACHTEN.map((o) => (
              <Glass key={o.id} interactive elevation={1}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none"
                >
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
                    style={{
                      background: `linear-gradient(150deg, ${matchColor(o.match)}, ${matchColor(o.match)}cc)`,
                      boxShadow: `0 8px 16px -8px ${matchColor(o.match)}`,
                    }}
                    aria-hidden="true"
                  >
                    <span className="text-[17px] font-semibold leading-none" style={disp}>
                      {o.match}
                    </span>
                    <span
                      className="text-[8.5px] uppercase tracking-[0.06em]"
                      style={{ opacity: 0.9 }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-semibold"
                      style={{ ...disp, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ color: C.mint, background: "rgba(43,191,154,0.10)" }}
                        >
                          <Check size={11} strokeWidth={2.6} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight
                    size={17}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Glass>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="px-1 text-[15px] font-semibold" style={{ ...disp, color: C.ink }}>
            Prioriteit
          </h2>
          <Glass elevation={2} className="overflow-hidden p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ color: C.amber, background: "rgba(232,161,60,0.14)" }}
            >
              <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" /> Urgent
            </span>
            <h3
              className="mt-3 text-[16px] font-semibold leading-tight"
              style={{ ...disp, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(150deg, ${C.amber}, #d68f2a)`,
                ["--tw-ring-color" as string]: C.amber,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Glass>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[18px] font-semibold tracking-[-0.01em]"
          style={{ ...disp, color: C.ink }}
        >
          Marktplaats
        </h2>
        <Glass elevation={1} className="flex items-center gap-2 rounded-full px-4 py-2">
          <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdrachten…"
            aria-label="Opdrachten zoeken"
            className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-60"
            style={{ color: C.ink }}
          />
        </Glass>
      </div>

      {filtered.length === 0 ? (
        <Glass
          elevation={2}
          className="flex flex-col items-center justify-center gap-3 p-14 text-center"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-white"
            style={{ background: `linear-gradient(150deg, ${C.accent}, ${C.mint})` }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="text-[17px] font-semibold" style={{ ...disp, color: C.ink }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-5 py-2 text-[12.5px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
              ["--tw-ring-color" as string]: C.accent,
            }}
          >
            Zoekterm wissen
          </button>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Glass key={o.id} interactive elevation={1} className="flex flex-col overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
                    {o.id}
                  </div>
                  <h3
                    className="mt-1 text-[15.5px] font-semibold leading-tight"
                    style={{ ...disp, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
                <span
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
                  style={{
                    background: `linear-gradient(150deg, ${matchColor(o.match)}, ${matchColor(o.match)}cc)`,
                  }}
                  aria-hidden="true"
                >
                  <span className="text-[16px] font-semibold leading-none" style={disp}>
                    {o.match}
                  </span>
                  <span className="text-[8px] uppercase">match</span>
                </span>
              </div>
              <div className="px-5 pb-3">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ color: C.inkSoft, background: "rgba(28,36,48,0.06)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  color: C.accentDeep,
                  borderTop: "1px solid rgba(255,255,255,0.6)",
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Glass>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={12.5} strokeWidth={2.2} style={{ color: C.inkFaint }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: C.ink,
          background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.8)",
          ["--tw-ring-color" as string]: C.accent,
        }}
      >
        <ChevronLeft size={15} aria-hidden="true" /> Terug
      </button>

      <Glass elevation={3} className="overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-3 py-1 text-[11.5px] font-medium"
              style={{ color: C.accentDeep, background: "rgba(76,125,255,0.12)" }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[32px]"
              style={{ ...disp, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <RingMeter pct={opdracht.match} size={104} />
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Glass key={f.l} interactive elevation={1} className="p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(76,125,255,0.10)" }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2.2} style={{ color: C.accentDeep }} />
            </span>
            <div
              className="mt-3 text-[16px] font-semibold leading-none"
              style={{ ...disp, color: C.ink }}
            >
              {f.v}
            </div>
            <div className="mt-1 text-[11px] font-medium" style={{ color: C.inkFaint }}>
              {f.l}
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Glass elevation={1} className="p-5">
          <h3 className="text-[14px] font-semibold" style={{ ...disp, color: C.ink }}>
            Waarom dit past
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: C.mint }}
                  aria-hidden="true"
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Glass>
        <Glass elevation={1} className="p-5">
          <h3 className="text-[14px] font-semibold" style={{ ...disp, color: C.ink }}>
            Om te overwegen
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={11} strokeWidth={3} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13.5px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
            boxShadow: `0 12px 26px -10px ${C.accent}aa`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13.5px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            color: C.ink,
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.8)",
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[18px] font-semibold tracking-[-0.01em]"
          style={{ ...disp, color: C.ink }}
        >
          Verificatie &amp; certificaten
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Glass elevation={2} className="flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="flex items-center gap-5">
          <RingMeter pct={dek} size={104} />
          <div className="max-w-xs">
            <div className="text-[15px] font-semibold" style={{ ...disp, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.inkSoft }}>
              Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
              vertrouwen.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium"
          style={{ color: C.mint, background: "rgba(43,191,154,0.12)" }}
        >
          <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </Glass>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Glass key={c.naam} interactive elevation={1} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: m.tint }}
                aria-hidden="true"
              >
                <m.Icon size={19} strokeWidth={2.2} style={{ color: m.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-semibold"
                  style={{ ...disp, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-[rgba(76,125,255,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        color: C.accentDeep,
                        background: "rgba(76,125,255,0.10)",
                        ["--tw-ring-color" as string]: C.accent,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-[18px] font-semibold tracking-[-0.01em]"
          style={{ ...disp, color: C.ink }}
        >
          Volgende beste acties
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Glass
                interactive
                elevation={warn ? 2 : 1}
                className="flex items-stretch overflow-hidden"
              >
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[24px] font-semibold text-white"
                  style={{
                    ...disp,
                    background: warn
                      ? `linear-gradient(160deg, ${C.amber}, #d68f2a)`
                      : `linear-gradient(160deg, ${C.accent}, ${C.accentDeep})`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                      style={{
                        color: warn ? C.amber : C.accentDeep,
                        background: warn ? "rgba(232,161,60,0.14)" : "rgba(76,125,255,0.12)",
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Sparkles size={11} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3 className="text-[15.5px] font-semibold" style={{ ...disp, color: C.ink }}>
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: warn
                        ? `linear-gradient(150deg, ${C.amber}, #d68f2a)`
                        : `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
                      ["--tw-ring-color" as string]: warn ? C.amber : C.accent,
                    }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; color: string; tint: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, color: C.mint, tint: "rgba(43,191,154,0.12)" };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, color: C.amber, tint: "rgba(232,161,60,0.14)" };
    return { label: "Concept", Icon: FileText, color: C.inkFaint, tint: "rgba(28,36,48,0.06)" };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[18px] font-semibold tracking-[-0.01em]"
          style={{ ...disp, color: C.ink }}
        >
          Facturen
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, c: C.mint },
          { l: "Openstaand", v: `${open}`, c: C.amber },
          { l: "Te factureren", v: "€ 1.350", c: C.accent },
        ].map((s) => (
          <Glass key={s.l} interactive elevation={1} className="p-4">
            <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...disp, color: s.c }}
            >
              {s.v}
            </div>
          </Glass>
        ))}
      </div>

      <Glass elevation={1} className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[rgba(255,255,255,0.4)]"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(28,36,48,0.07)" }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.tint }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.2} style={{ color: m.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...disp, color: C.ink }}>
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ color: C.inkSoft }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                  style={{ color: m.color, background: m.tint }}
                >
                  <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...disp, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{
            borderTop: "1px solid rgba(28,36,48,0.08)",
            background: "rgba(76,125,255,0.06)",
          }}
        >
          <span className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>
            Totaal betaald
          </span>
          <span
            className="text-[17px] font-semibold tabular-nums"
            style={{ ...disp, color: C.accentDeep }}
          >
            {betaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}

// ── Berichten ────────────────────────────────────────────────────────────────────
function Berichten() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[18px] font-semibold tracking-[-0.01em]"
          style={{ ...disp, color: C.ink }}
        >
          Berichten
        </h2>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium"
          style={{ color: C.accentDeep, background: "rgba(76,125,255,0.12)" }}
        >
          <Mail size={13} strokeWidth={2.2} aria-hidden="true" /> {ongelezen} ongelezen
        </span>
      </div>
      <Glass elevation={1} className="overflow-hidden">
        <ul>
          {BERICHTEN.map((b, i) => (
            <li
              key={b.van}
              className="flex items-start gap-3.5 p-4 transition-colors hover:bg-[rgba(255,255,255,0.4)]"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(28,36,48,0.07)" }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold text-white"
                style={{ background: `linear-gradient(150deg, ${C.accent}, ${C.mint})` }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-semibold"
                    style={{ ...disp, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ color: C.accentDeep, background: "rgba(76,125,255,0.12)" }}
                    >
                      Nieuw
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: C.inkFaint }}>
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </Glass>
    </div>
  );
}
