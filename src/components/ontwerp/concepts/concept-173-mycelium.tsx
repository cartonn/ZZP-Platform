"use client";

// Concept 173 — "Mycelium" · biofiel organisch netwerk. 2026-trend: human-centered/biophilic warmth.
// Aardse, levende palet (mos-groen, klei, champignon-taupe, warm off-white). Organische connectieve
// lijnen — SVG-paden als schimmeldraden (hyphen/mycelium) — verbinden matches en samenwerkingen;
// zachte, vloeiende blob-vormen, geen harde hoeken. Warm, menselijk, groeiend. Onderscheidt zich van
// botanie (planten) en knooppunt (geometrisch): dit is organisch-vloeiend en levend. Status nooit
// kleur-alleen: altijd label + icoon. Deterministisch — geen random/Date. UI-taal Nederlands.
// Fonts: Bricolage Grotesque (display) + Plus Jakarta Sans (tekst) + Spline Sans Mono (data).

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
  Coins,
  CalendarDays,
  Star,
  FileText,
  Sprout,
  Network,
  Leaf,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  Zap,
  Circle,
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

// ── Palet — aards & levend (mos, klei, champignon-taupe, warm off-white) ───────────
const C = {
  bg: "#f6f1e6", // warm off-white (mycelium-substraat)
  bgDeep: "#ece4d2", // secundair aards vlak
  card: "#fdfbf3", // roomwit
  ink: "#2d2a21", // donkere humus-inkt
  inkSoft: "#5f5849", // secundaire tekst
  inkFaint: "#968c79", // labels
  line: "#e3dac6", // zachte rand
  moss: "#5a7046", // mos-groen (primair)
  mossDeep: "#3f5232",
  mossSoft: "#e6ecda",
  clay: "#b06a44", // klei / terracotta
  claySoft: "#f2e2d5",
  taupe: "#9a8a71", // champignon-taupe
  spore: "#c99b3f", // warme spore-oker
  sporeSoft: "#f3e8cd",
  ok: "#5a7046",
  okSoft: "#e6ecda",
  warn: "#b07a2c",
  warnSoft: "#f3e8cd",
  info: "#4a786d",
  infoSoft: "#dfeae5",
  danger: "#a8503f",
  dangerSoft: "#f0ddd4",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Organische blob-radius (zachte, ongelijke hoeken → levende vorm).
const BLOB = "42% 58% 60% 40% / 45% 42% 58% 55%";
const BLOB2 = "58% 42% 45% 55% / 55% 58% 42% 45%";

// ── Mycelium-draden — organische bezier-hyphen die knopen verbinden ────────────────
function MyceliumWeb({
  width = 320,
  height = 200,
  color = C.moss,
  opacity = 1,
}: {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
}) {
  // Deterministische knopen en kromme draden (geen random).
  const cx = width * 0.5;
  const cy = height * 0.5;
  const nodes: [number, number, number][] = [
    [width * 0.16, height * 0.24, 4],
    [width * 0.82, height * 0.2, 5],
    [width * 0.86, height * 0.7, 4],
    [width * 0.2, height * 0.78, 5],
    [width * 0.5, height * 0.14, 3],
    [width * 0.12, height * 0.52, 3],
    [width * 0.9, height * 0.46, 3],
  ];
  const threads = nodes.map(([nx, ny], i) => {
    const mx = (cx + nx) / 2 + (i % 2 === 0 ? 14 : -14);
    const my = (cy + ny) / 2 + (i % 2 === 0 ? -12 : 16);
    return `M ${cx} ${cy} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
  });
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      {threads.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeDasharray={i % 2 === 0 ? "1 5" : "1 4"}
          opacity={0.5}
        />
      ))}
      {threads.map((d, i) => (
        <path key={`s${i}`} d={d} fill="none" stroke={color} strokeWidth={0.7} opacity={0.22} />
      ))}
      {nodes.map(([nx, ny, r], i) => (
        <circle key={`n${i}`} cx={nx} cy={ny} r={r} fill={color} opacity={0.45} />
      ))}
      <circle cx={cx} cy={cy} r={7} fill={color} opacity={0.85} />
      <circle cx={cx} cy={cy} r={12} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
    </svg>
  );
}

// Spore-knoop — organische blob met icoon (levende icoon-drager).
function Spore({
  size = 40,
  Icon,
  tone = C.moss,
  soft = C.mossSoft,
}: {
  size?: number;
  Icon: LucideIcon;
  tone?: string;
  soft?: string;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, background: soft, borderRadius: BLOB }}
      aria-hidden="true"
    >
      <Icon size={size * 0.46} strokeWidth={2} style={{ color: tone }} />
    </span>
  );
}

// Match-groeimeter — organische ring met groeiende boog en zacht cijfer.
function MatchGrowth({ value, size = 56 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.moss}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(2)} ${circ.toFixed(2)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[15px] font-extrabold tabular-nums leading-none"
          style={{ ...display, color: C.mossDeep }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          groei
        </span>
      </span>
    </span>
  );
}

// ── Status — nooit kleur-alleen (icoon + label + tint) ─────────────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Organische kaart — zachte, ongelijke afronding; warme rand.
function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-[26px] transition-all duration-200 ${interactive ? "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-18px_rgba(90,112,70,0.4)]" : ""} ${className}`}
      style={{ background: C.card, boxShadow: `0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <Spore size={36} Icon={Icon} />
      <div className="min-w-0">
        <h2
          className="text-[19px] font-extrabold leading-none tracking-[-0.02em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.moss }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Mini staaf-spark — laatste balk in levend mos-groen.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(16, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.moss : `${C.taupe}44`,
            borderRadius: "4px 4px 2px 2px",
          }}
        />
      ))}
    </div>
  );
}

// Skeleton-rij (loading-state).
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4" aria-hidden="true">
      <span
        className="h-9 w-9 shrink-0 animate-pulse"
        style={{ background: C.bgDeep, borderRadius: BLOB }}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <span
          className="block h-3 w-2/5 animate-pulse rounded-full"
          style={{ background: C.bgDeep }}
        />
        <span
          className="block h-2.5 w-3/4 animate-pulse rounded-full"
          style={{ background: C.bgDeep }}
        />
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept173() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Kop — merk op een aards vlak met mycelium-web als achtergrond */}
      <header className="relative overflow-hidden" style={{ background: C.mossDeep }}>
        <div
          className="pointer-events-none absolute -right-4 top-0 hidden opacity-60 md:block"
          aria-hidden="true"
        >
          <MyceliumWeb width={340} height={180} color="#cdd8b8" opacity={0.5} />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-12 w-12 items-center justify-center"
              style={{ background: C.spore, borderRadius: BLOB }}
              aria-hidden="true"
            >
              <Sprout size={24} strokeWidth={2} style={{ color: C.mossDeep }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ ...mono, color: C.sporeSoft }}
              >
                Mycelium
              </div>
              <div
                className="text-[23px] font-extrabold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.white }}
              >
                Wortelnet
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: "rgba(255,255,255,0.6)" }}
              >
                Groei · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{ ...bodyF, background: "rgba(255,255,255,0.14)", color: C.white }}
            >
              <ShieldCheck
                size={12}
                strokeWidth={2}
                style={{ color: C.sporeSoft }}
                aria-hidden="true"
              />{" "}
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{ ...display, background: C.spore, color: C.mossDeep, borderRadius: BLOB2 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — organische pil-tabs */}
        <nav
          className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3f5232]"
                style={
                  on
                    ? {
                        ...bodyF,
                        background: C.spore,
                        color: C.mossDeep,
                        ["--tw-ring-color" as string]: C.sporeSoft,
                      }
                    : {
                        ...bodyF,
                        background: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.75)",
                        ["--tw-ring-color" as string]: C.sporeSoft,
                      }
                }
              >
                {on && (
                  <Circle
                    size={7}
                    fill={C.mossDeep}
                    strokeWidth={0}
                    className="mr-1 inline-block align-[0px]"
                    aria-hidden="true"
                  />
                )}
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const [grow, setGrow] = useState<string | null>(null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — organische vorm met mycelium-web */}
      <Card className="relative overflow-hidden" style={{ background: C.mossSoft }}>
        <div
          className="pointer-events-none absolute -right-6 -top-6 hidden md:block"
          aria-hidden="true"
        >
          <MyceliumWeb width={360} height={240} color={C.moss} opacity={0.55} />
        </div>
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.white, color: C.moss }}
          >
            <Leaf size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches ontkiemen boven 85%. Je netwerk groeit mee.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén draad vraagt voeding: je VOG verloopt binnenkort. Vernieuw hem en houd je wortelnet
            gezond verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.moss,
                ["--tw-ring-color" as string]: C.moss,
                ["--tw-ring-offset-color" as string]: C.mossSoft,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.white,
                color: C.ink,
                boxShadow: `0 0 0 1px ${C.line}`,
                ["--tw-ring-color" as string]: C.moss,
                ["--tw-ring-offset-color" as string]: C.mossSoft,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches — hover laat de draad "groeien" */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op groei-percentage gerangschikt"
            Icon={Network}
          />
          <div className="space-y-3" onMouseLeave={() => setGrow(null)}>
            {OPDRACHTEN.map((o) => {
              const on = grow === o.id;
              return (
                <Card key={o.id} interactive className="overflow-hidden">
                  <button
                    onMouseEnter={() => setGrow(o.id)}
                    onFocus={() => setGrow(o.id)}
                    onBlur={() => setGrow(null)}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.moss }}
                  >
                    <MatchGrowth value={o.match} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[15.5px] font-extrabold tracking-[-0.01em]"
                            style={{ ...display, color: C.ink }}
                          >
                            {o.titel}
                          </div>
                          <div
                            className="mt-0.5 truncate text-[12.5px]"
                            style={{ ...bodyF, color: C.inkSoft }}
                          >
                            {o.opdrachtgever} · {o.plaats} · {o.tarief}
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="mt-0.5 shrink-0 transition-transform"
                          style={{ color: C.inkFaint, transform: on ? "translateX(2px)" : "none" }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ ...bodyF, background: C.bgDeep, color: C.inkSoft }}
                          >
                            <Circle size={7} fill={C.moss} strokeWidth={0} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <MatchGrowth value={dek} size={92} />
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Netwerk-web-panel */}
          <Card className="relative overflow-hidden p-5" style={{ background: C.bgDeep }}>
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70"
              aria-hidden="true"
            >
              <MyceliumWeb width={280} height={160} color={C.taupe} opacity={0.7} />
            </div>
            <div className="relative">
              <div
                className="text-[12px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Netwerk
              </div>
              <div className="mt-1 text-[15px] font-extrabold" style={{ ...display, color: C.ink }}>
                7 actieve verbindingen
              </div>
              <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                Opdrachtgevers en samenwerkingen verweven in je wortelnet.
              </p>
            </div>
          </Card>

          {/* Live activiteit — loading-state (skeleton) */}
          <Card className="overflow-hidden">
            <div
              className="flex items-center gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint, borderBottom: `1px solid ${C.line}` }}
            >
              <RefreshCw size={12} className="animate-spin" aria-hidden="true" /> Activiteit laden…
            </div>
            <SkeletonRow />
            <SkeletonRow />
          </Card>

          {/* Prioriteit */}
          <Card className="relative overflow-hidden" style={{ background: C.claySoft }}>
            <span
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ background: C.clay }}
              aria-hidden="true"
            />
            <div className="p-5 pl-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.white, color: C.clay }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[17px] font-extrabold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
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
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.clay,
                  ["--tw-ring-color" as string]: C.clay,
                  ["--tw-ring-offset-color" as string]: C.claySoft,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Card>
        </section>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} />
        <Card className="flex items-center gap-2 rounded-full px-3.5 py-2">
          <Search size={15} style={{ color: C.moss }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.mossSoft, borderRadius: BLOB }}
            aria-hidden="true"
          >
            <Sprout size={30} strokeWidth={1.6} style={{ color: C.moss }} />
          </span>
          <p className="text-[19px] font-extrabold" style={{ ...display, color: C.ink }}>
            Nog niets ontkiemd
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen match voor &ldquo;{q}&rdquo;. Zaai een andere zoekterm en laat het netwerk groeien.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.moss,
              ["--tw-ring-color" as string]: C.moss,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <MatchGrowth value={o.match} size={50} />
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
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
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.bgDeep, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#f1ead9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.moss,
                  ["--tw-ring-color" as string]: C.moss,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
          ))}
        </div>
      )}
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
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f1ead9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.moss,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative overflow-hidden" style={{ background: C.mossSoft }}>
        <div
          className="pointer-events-none absolute -right-4 -top-4 hidden sm:block"
          aria-hidden="true"
        >
          <MyceliumWeb width={300} height={200} color={C.moss} opacity={0.5} />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.white, color: C.moss }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchGrowth value={opdracht.match} size={86} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <Spore size={30} Icon={f.Icon} tone={C.moss} soft={C.mossSoft} />
            <div
              className="mt-3 text-[16px] font-extrabold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.okSoft, borderRadius: BLOB }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.warnSoft, borderRadius: BLOB }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.moss,
            ["--tw-ring-color" as string]: C.moss,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#f1ead9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            boxShadow: `0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.moss,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.spore }} aria-hidden="true" /> Bewaar
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Verificatie" sub="Certificaten & documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.moss,
            ["--tw-ring-color" as string]: C.moss,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative overflow-hidden" style={{ background: C.mossSoft }}>
        <div
          className="pointer-events-none absolute -bottom-4 -right-2 hidden sm:block"
          aria-hidden="true"
        >
          <MyceliumWeb width={240} height={170} color={C.moss} opacity={0.5} />
        </div>
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <MatchGrowth value={dek} size={108} />
          <div className="max-w-sm">
            <div className="text-[16px] font-extrabold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd document voedt je wortelnet: meer vertrouwen, sterker netwerk bij
              opdrachtgevers. Houd je dekking zo hoog mogelijk.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.white, color: C.ok }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: m.bg, borderRadius: BLOB }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-extrabold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#f1ead9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.bgDeep,
                        color: C.moss,
                        ["--tw-ring-color" as string]: C.moss,
                        ["--tw-ring-offset-color" as string]: C.card,
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Zap}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.clay : C.moss }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-extrabold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.claySoft : C.mossSoft,
                      color: warn ? C.clay : C.moss,
                      borderRadius: BLOB,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.claySoft : C.infoSoft,
                          color: warn ? C.clay : C.info,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Sprout size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-extrabold tracking-[-0.01em]"
                        style={{ ...display, color: C.ink }}
                      >
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        ...bodyF,
                        background: warn ? C.clay : C.moss,
                        ["--tw-ring-color" as string]: warn ? C.clay : C.moss,
                        ["--tw-ring-offset-color" as string]: C.card,
                      }}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold"
                style={{ ...display, background: C.bgDeep, color: C.moss, borderRadius: BLOB2 }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-extrabold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.clay }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.info, bg: C.infoSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet & openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.moss,
            ["--tw-ring-color" as string]: C.moss,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {/* Error-strook — synchronisatie mislukt (error-state) */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-[22px] p-4"
        style={{ background: C.dangerSoft, boxShadow: `0 0 0 1px ${C.danger}` }}
        role="alert"
      >
        <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
            Bankkoppeling niet ververst
          </div>
          <div className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
            De laatste synchronisatie is mislukt. Betaalstatussen kunnen verouderd zijn.
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            boxShadow: `0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.danger,
            ["--tw-ring-offset-color" as string]: C.dangerSoft,
          }}
        >
          <RefreshCw size={13} aria-hidden="true" /> Opnieuw
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="h-1.5 w-10 rounded-full"
              style={{ background: C.moss }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
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
                    className="transition-colors hover:bg-[#f1ead9]"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-extrabold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.mossDeep }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.65)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-extrabold tabular-nums"
                  style={{ ...display, color: C.sporeSoft }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
