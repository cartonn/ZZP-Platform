"use client";

// Concept 171 — "Diafragma" · fotografische scherptediepte / aperture. 2026-trend: spatial depth.
// Gelaagde translucente dieptevlakken: achtergrondlagen met bokeh en zachte radiale glows (backdrop-
// blur), voorgrond-content messcherp. Het paneel waar je op focust wordt scherp; secundaire panelen
// krijgen subtiele blur/opacity als "out of focus". Diafragma-lamellen (concentrische iris-bladen)
// vormen het match- en merk-motief. Cinematografisch, premium, clean. Palet: diep nachtblauw met
// een warm goud/amber focus-accent. Status nooit kleur-alleen: altijd label + icoon. Deterministisch
// — geen random/Date. UI-taal Nederlands. Fonts: Sora (display) + Manrope (tekst) + IBM Plex Mono.

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
  Aperture,
  Focus,
  Camera,
  TriangleAlert,
  ChevronRight,
  Zap,
  RefreshCw,
  Sparkles,
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

// ── Palet — diep nachtblauw met warm goud focus-accent (cinematografisch) ──────────
const C = {
  bg: "#090d15", // diepste achtergrondvlak
  bgPlane: "#0f1522", // secundair dieptevlak
  card: "#141c2b", // scherpe voorgrond-kaart
  cardHi: "#1a2438", // opgetilde kaart
  ink: "#f5f1e6", // warm off-white
  inkSoft: "#aab3c3", // secundaire tekst
  inkFaint: "#6d7789", // labels
  line: "rgba(255,255,255,0.09)", // fijne rand
  lineHi: "rgba(255,255,255,0.16)",
  gold: "#e8b465", // warm focus-accent
  amber: "#f3a24d", // dieper amber
  goldSoft: "rgba(232,180,101,0.14)",
  ok: "#54d1a6",
  okSoft: "rgba(84,209,166,0.15)",
  warn: "#f2b24a",
  warnSoft: "rgba(242,178,74,0.15)",
  info: "#77abff",
  infoSoft: "rgba(119,171,255,0.15)",
  danger: "#ff8090",
  dangerSoft: "rgba(255,128,144,0.15)",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const bodyF = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Deterministische bokeh-vlekken (zachte, onscherpe lichtcirkels op de achtergrondlaag).
const BOKEH: { x: string; y: string; r: number; c: string; o: number }[] = [
  { x: "8%", y: "14%", r: 220, c: C.gold, o: 0.1 },
  { x: "82%", y: "8%", r: 300, c: C.info, o: 0.08 },
  { x: "68%", y: "72%", r: 260, c: C.amber, o: 0.09 },
  { x: "22%", y: "82%", r: 200, c: C.ok, o: 0.06 },
  { x: "48%", y: "38%", r: 340, c: C.gold, o: 0.05 },
];

function BokehField() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {BOKEH.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x,
            top: b.y,
            width: b.r,
            height: b.r,
            marginLeft: -b.r / 2,
            marginTop: -b.r / 2,
            background: `radial-gradient(circle, ${b.c}, transparent 70%)`,
            opacity: b.o,
            filter: "blur(28px)",
          }}
        />
      ))}
    </div>
  );
}

// ── Diafragma-iris — concentrische lamellen die een polygonale opening vormen ──────
function point(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

function Iris({
  size = 120,
  blades = 7,
  open = 0.5,
  colors = [C.gold, C.amber],
  opacity = 1,
}: {
  size?: number;
  blades?: number;
  open?: number; // 0..1 — grotere waarde = wijder diafragma
  colors?: [string, string];
  opacity?: number;
}) {
  const c = size / 2;
  const R = c * 0.98;
  const r = c * (0.22 + open * 0.46); // aperture-opening
  const step = 360 / blades;
  const twist = step * 0.62; // overlap tussen bladen → iris-look
  const wedges = [];
  for (let i = 0; i < blades; i++) {
    const a0 = i * step;
    const a1 = (i + 1) * step;
    const [o0x, o0y] = point(c, c, R, a0);
    const [o1x, o1y] = point(c, c, R, a1);
    const [i0x, i0y] = point(c, c, r, a0 + twist);
    const [i1x, i1y] = point(c, c, r, a1 + twist);
    const shade = i % 2 === 0 ? colors[0] : colors[1];
    wedges.push(
      <path
        key={i}
        d={`M ${o0x.toFixed(2)} ${o0y.toFixed(2)} L ${o1x.toFixed(2)} ${o1y.toFixed(2)} L ${i1x.toFixed(2)} ${i1y.toFixed(2)} L ${i0x.toFixed(2)} ${i0y.toFixed(2)} Z`}
        fill={shade}
        opacity={0.9}
        stroke={C.bg}
        strokeWidth={0.7}
      />,
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <defs>
        <clipPath id={`iris-${size}-${blades}`}>
          <circle cx={c} cy={c} r={R} />
        </clipPath>
      </defs>
      <g clipPath={`url(#iris-${size}-${blades})`}>
        <circle cx={c} cy={c} r={R} fill={C.bgPlane} />
        {wedges}
        <circle cx={c} cy={c} r={r * 0.96} fill={C.bg} />
      </g>
      <circle cx={c} cy={c} r={R - 0.4} fill="none" stroke={C.lineHi} strokeWidth={1} />
      <circle cx={c} cy={c} r={R * 0.7} fill="none" stroke={C.line} strokeWidth={0.8} />
    </svg>
  );
}

// Iris-badge met icoon (aperture-motief als icoon-drager).
function IrisBadge({
  size = 40,
  Icon,
  open = 0.5,
}: {
  size?: number;
  Icon: LucideIcon;
  open?: number;
}) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0">
        <Iris size={size} blades={7} open={open} />
      </span>
      <Icon
        size={size * 0.4}
        strokeWidth={2}
        style={{ color: C.ink, position: "relative" }}
        aria-hidden="true"
      />
    </span>
  );
}

// Match-ring — aperture-opening als voortgang, met scherp cijfer in het brandpunt.
function MatchRing({ value, size = 56 }: { value: number; size?: number }) {
  const open = value / 100;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Iris size={size} blades={7} open={open} />
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[15px] font-bold tabular-nums leading-none"
          style={{ ...display, color: C.gold }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          f-match
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

// Voorgrond-kaart — scherp; krijgt "focus"-glow bij hover (out-of-focus → in-focus micro-interactie).
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
      className={`rounded-2xl transition-all duration-300 ${interactive ? "hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.7)]" : ""} ${className}`}
      style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({
  title,
  sub,
  Icon,
  open = 0.6,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  open?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <IrisBadge size={36} Icon={Icon} open={open} />
      <div className="min-w-0">
        <h2
          className="text-[19px] font-bold leading-none tracking-[-0.02em]"
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
      <Icon size={13} strokeWidth={1.9} style={{ color: C.gold }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Mini staaf-spark — laatste balk in goud "brandpunt".
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.gold : "rgba(255,255,255,0.14)",
          }}
        />
      ))}
    </div>
  );
}

// Skeleton-rij (loading-state — deterministische shimmer via CSS-animatie, geen data).
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4" aria-hidden="true">
      <span
        className="h-9 w-9 shrink-0 animate-pulse rounded-full"
        style={{ background: C.bgPlane }}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <span
          className="block h-3 w-2/5 animate-pulse rounded-full"
          style={{ background: C.bgPlane }}
        />
        <span
          className="block h-2.5 w-3/4 animate-pulse rounded-full"
          style={{ background: C.bgPlane }}
        />
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept171() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      <BokehField />

      {/* Kop — merk + diafragma-motief op een onscherp dieptevlak */}
      <header
        className="relative"
        style={{ background: "rgba(9,13,21,0.7)", backdropFilter: "blur(10px)" }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-20 hidden opacity-40 md:block"
          aria-hidden="true"
          style={{ filter: "blur(1px)" }}
        >
          <Iris size={220} blades={9} open={0.72} opacity={0.5} />
        </div>
        <div
          className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3.5">
            <Iris size={46} blades={7} open={0.62} />
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                style={{ ...mono, color: C.gold }}
              >
                Diafragma
              </div>
              <div
                className="text-[23px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                Brandpunt
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Focus · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{ ...bodyF, background: C.goldSoft, color: C.gold }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
              style={{
                ...mono,
                background: C.cardHi,
                color: C.gold,
                boxShadow: `inset 0 0 0 1px ${C.lineHi}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — pil-tabs, actieve tab "in focus" (goud), rest onscherp */}
        <nav
          className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-3 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        ...bodyF,
                        background: C.goldSoft,
                        color: C.gold,
                        boxShadow: `inset 0 0 0 1px ${C.gold}`,
                        ["--tw-ring-color" as string]: C.gold,
                        ["--tw-ring-offset-color" as string]: C.bg,
                      }
                    : {
                        ...bodyF,
                        background: "transparent",
                        color: C.inkFaint,
                        ["--tw-ring-color" as string]: C.gold,
                        ["--tw-ring-offset-color" as string]: C.bg,
                      }
                }
              >
                {on && (
                  <Aperture
                    size={11}
                    strokeWidth={2.4}
                    className="mr-1 inline-block align-[-1px]"
                    aria-hidden="true"
                  />
                )}
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
  // "Scherptediepte" micro-interactie: het gehoverde item is scherp, de rest raakt onscherp.
  const [focus, setFocus] = useState<string | null>(null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — scherpe voorgrond op onscherp dieptevlak */}
      <Card className="relative overflow-hidden" style={{ background: C.bgPlane }}>
        <div
          className="pointer-events-none absolute -right-16 -top-24 hidden md:block"
          aria-hidden="true"
          style={{ filter: "blur(2px)" }}
        >
          <Iris size={340} blades={9} open={0.78} opacity={0.55} />
        </div>
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.goldSoft, color: C.gold }}
          >
            <Camera size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches scherp in beeld. Je omzet trekt mee omhoog.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén ding vraagt scherpstelling: je VOG verloopt binnenkort. Regel het en houd je profiel
            haarscherp verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.gold,
                color: C.bg,
                ["--tw-ring-color" as string]: C.gold,
                ["--tw-ring-offset-color" as string]: C.bgPlane,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.card,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.lineHi}`,
                ["--tw-ring-color" as string]: C.gold,
                ["--tw-ring-offset-color" as string]: C.bgPlane,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />
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
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
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
        {/* Matches — scherptediepte: hover brengt één kaart in focus */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Focus}
            open={0.7}
          />
          <div className="space-y-3" onMouseLeave={() => setFocus(null)}>
            {OPDRACHTEN.map((o) => {
              const blurred = focus !== null && focus !== o.id;
              return (
                <Card
                  key={o.id}
                  interactive
                  className="overflow-hidden"
                  style={{
                    filter: blurred ? "blur(2px)" : "none",
                    opacity: blurred ? 0.55 : 1,
                  }}
                >
                  <button
                    onMouseEnter={() => setFocus(o.id)}
                    onFocus={() => setFocus(o.id)}
                    onBlur={() => setFocus(null)}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.gold }}
                  >
                    <MatchRing value={o.match} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[15.5px] font-bold tracking-[-0.01em]"
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
                          className="mt-0.5 shrink-0"
                          style={{ color: C.inkFaint }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ ...bodyF, background: C.bgPlane, color: C.inkSoft }}
                          >
                            <Circle size={7} fill={C.gold} strokeWidth={0} aria-hidden="true" /> {r}
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
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} open={0.6} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                <Iris size={96} blades={8} open={dek / 100} />
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-[26px] font-bold leading-none"
                    style={{ ...display, color: C.gold }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
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
          <Card className="relative overflow-hidden" style={{ background: C.cardHi }}>
            <span
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: `linear-gradient(${C.warn}, ${C.amber})` }}
              aria-hidden="true"
            />
            <div className="p-5 pl-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[17px] font-bold leading-tight tracking-[-0.01em]"
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
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.gold,
                  color: C.bg,
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.cardHi,
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
  const [focus, setFocus] = useState<string | null>(null);
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} open={0.55} />
        <Card
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.bgPlane }}
        >
          <Search size={15} style={{ color: C.gold }} aria-hidden="true" />
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
          <Iris size={72} blades={7} open={0.14} opacity={0.7} />
          <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Diafragma dicht — niets scherp
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen match voor &ldquo;{q}&rdquo;. Open de zoekopdracht — pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.gold,
              color: C.bg,
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          onMouseLeave={() => setFocus(null)}
        >
          {filtered.map((o) => {
            const blurred = focus !== null && focus !== o.id;
            return (
              <Card
                key={o.id}
                interactive
                className="flex flex-col overflow-hidden"
                style={{
                  filter: blurred ? "blur(2px)" : "none",
                  opacity: blurred ? 0.55 : 1,
                }}
              >
                <div className="flex items-center gap-3 p-4" onMouseEnter={() => setFocus(o.id)}>
                  <MatchRing value={o.match} size={50} />
                  <div className="min-w-0">
                    <h3
                      className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
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
                        style={{ ...bodyF, background: C.bgPlane, color: C.inkSoft }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...bodyF,
                    borderTop: `1px solid ${C.line}`,
                    color: C.gold,
                    ["--tw-ring-color" as string]: C.gold,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Card>
            );
          })}
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.lineHi}`,
          ["--tw-ring-color" as string]: C.gold,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative overflow-hidden" style={{ background: C.bgPlane }}>
        <div
          className="pointer-events-none absolute -right-14 -top-16 hidden sm:block"
          aria-hidden="true"
          style={{ filter: "blur(1.5px)" }}
        >
          <Iris size={260} blades={9} open={0.75} opacity={0.5} />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.goldSoft, color: C.gold }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={86} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f, i) => (
          <Card key={f.l} interactive className="p-4">
            <IrisBadge size={30} Icon={f.Icon} open={0.4 + i * 0.12} />
            <div
              className="mt-3 text-[16px] font-bold leading-none"
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
          <SectionHead title="Waarom dit past" Icon={Check} open={0.75} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
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
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} open={0.35} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.gold,
            color: C.bg,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.lineHi}`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" /> Bewaar
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
        <SectionHead
          title="Verificatie"
          sub="Certificaten & documenten"
          Icon={ShieldCheck}
          open={0.65}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.gold,
            color: C.bg,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative overflow-hidden" style={{ background: C.bgPlane }}>
        <div
          className="pointer-events-none absolute -bottom-14 -right-8 hidden sm:block"
          aria-hidden="true"
          style={{ filter: "blur(1.5px)" }}
        >
          <Iris size={210} blades={8} open={dek / 100} opacity={0.5} />
        </div>
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <Iris size={112} blades={8} open={dek / 100} />
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-[30px] font-bold leading-none"
                style={{ ...display, color: C.gold }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd document opent het diafragma verder: meer vertrouwen, scherper
              profiel bij opdrachtgevers. Houd je dekking zo hoog mogelijk.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok }}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-bold tracking-[-0.01em]"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.bgPlane,
                        color: C.gold,
                        ["--tw-ring-color" as string]: C.gold,
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
        open={0.6}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? `linear-gradient(${C.warn}, ${C.amber})` : C.gold }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.bgPlane,
                      color: warn ? C.warn : C.gold,
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
                          background: warn ? C.warnSoft : C.infoSoft,
                          color: warn ? C.warn : C.info,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-bold tracking-[-0.01em]"
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        ...bodyF,
                        background: warn ? C.warn : C.gold,
                        color: C.bg,
                        ["--tw-ring-color" as string]: warn ? C.warn : C.gold,
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
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} open={0.5} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.bgPlane,
                  color: C.gold,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-bold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.gold }}
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
        <SectionHead title="Facturen" sub="Omzet & openstaand" Icon={Coins} open={0.7} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.gold,
            color: C.bg,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {/* Error-strook — synchronisatie mislukt (error-state) */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl p-4"
        style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.danger}` }}
        role="alert"
      >
        <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold" style={{ ...bodyF, color: C.ink }}>
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
            boxShadow: `inset 0 0 0 1px ${C.lineHi}`,
            ["--tw-ring-color" as string]: C.danger,
            ["--tw-ring-offset-color" as string]: C.bg,
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
              style={{ background: C.gold }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em]"
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
              <tr style={{ background: C.bgPlane }}>
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
                    className="transition-colors hover:bg-white/5"
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
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.bgPlane }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.gold }}
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
