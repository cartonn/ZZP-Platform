"use client";

// Concept 159 — "Panorama" · één breed horizontaal canvas. De zes schermen zijn aangrenzende
// panelen die je naast elkaar ziet en waartussen je vloeiend glijdt (filmstrip/carousel-navigatie
// via translateX + transition — deterministisch, GEEN random/Date). Wide-aspect layout met een
// filmstrip onderaan: miniatuur-panelen, actief paneel uitgelicht. Prev/next-knoppen glijden het
// canvas horizontaal. Op mobiel: de filmstrip is een swipe-achtige horizontale snap-scroll.
// Fris licht palet + één accent (helder blauw). Onderscheidend: interactie-gedreven horizontale
// ruimtelijke navigatie i.p.v. verticaal stapelen van schermen. Status nooit kleur-alleen:
// altijd label + icoon. Fonts: Space Grotesk (display) + Inter (tekst).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  ChevronLeft,
  ChevronRight,
  Compass,
  MoveHorizontal,
  Sparkles,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — fris, licht, luchtig; één helder accent ──────────────────────────────
const C = {
  ink: "#141a24",
  inkSoft: "#586172",
  inkFaint: "#8a94a5",
  line: "#e5e9f0",
  lineStrong: "#d3dae4",
  paper: "#ffffff",
  canvas: "#f5f7fb",
  canvasDeep: "#eef2f8",
  accent: "#2b6ef6",
  accentDeep: "#1a53cf",
  accentSoft: "#e9f1ff",
  ok: "#0e9f6e",
  okSoft: "#e3f6ee",
  warn: "#c2760a",
  warnSoft: "#fbf0dd",
  danger: "#dc2b2b",
  dangerSoft: "#fdeaea",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const softShadowSm = { boxShadow: "0 1px 2px rgba(20,26,36,0.05), 0 4px 12px rgba(20,26,36,0.05)" };

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.accent, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Herbruikbare kaart ───────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  interactive = false,
  as = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "li";
  style?: React.CSSProperties;
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl ${interactive ? "transition-all duration-200 hover:-translate-y-0.5" : ""} ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        ...softShadowSm,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// Sectiekop met horizon-lijn (panorama-motief).
function SectionHead({
  eyebrow,
  title,
  Icon,
  action,
}: {
  eyebrow: string;
  title: string;
  Icon: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...body, color: C.accent }}
        >
          <Icon size={13} strokeWidth={2.6} aria-hidden="true" />
          {eyebrow}
        </div>
        <h2
          className="mt-1.5 text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function matchTone(m: number): { fg: string; bg: string } {
  if (m >= 90) return { fg: C.ok, bg: C.okSoft };
  if (m >= 84) return { fg: C.accent, bg: C.accentSoft };
  return { fg: C.warn, bg: C.warnSoft };
}

// Mini sparkline (SVG polyline) — deterministisch.
function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Root — horizontaal panorama-canvas ───────────────────────────────────────────
export function Concept159() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const index = Math.max(
    0,
    SCREENS.findIndex((s) => s.key === screen),
  );
  const count = SCREENS.length;

  const go = (dir: -1 | 1) => {
    const next = Math.min(count - 1, Math.max(0, index + dir));
    const target = SCREENS[next];
    if (target) setScreen(target.key);
  };

  return (
    <div
      className="flex min-h-screen w-full flex-col overflow-x-hidden antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      {/* Kop — merk + horizon-navigatie */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 md:px-8"
        style={{ background: C.paper, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: C.accent, ...softShadowSm }}
            aria-hidden="true"
          >
            <Compass size={20} strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <div className="text-[16px] font-bold tracking-[-0.01em]" style={display}>
              Panorama
            </div>
            <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
              Eén canvas · glijd tussen schermen
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.okSoft, color: C.ok }}
          >
            <ShieldCheck size={13} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          {/* Prev / next — het canvas glijdt horizontaal */}
          <div
            className="flex items-center rounded-full"
            style={{ background: C.canvasDeep, border: `1px solid ${C.line}` }}
          >
            <button
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Vorig scherm"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 enabled:hover:bg-white disabled:opacity-35"
              style={{ ["--tw-ring-color" as string]: C.accent, color: C.ink }}
            >
              <ChevronLeft size={17} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <span
              className="w-10 text-center text-[11px] font-semibold tabular-nums"
              style={{ color: C.inkSoft }}
            >
              {index + 1}/{count}
            </span>
            <button
              onClick={() => go(1)}
              disabled={index === count - 1}
              aria-label="Volgend scherm"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 enabled:hover:bg-white disabled:opacity-35"
              style={{ ["--tw-ring-color" as string]: C.accent, color: C.ink }}
            >
              <ChevronRight size={17} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{ ...display, background: C.ink }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Het brede canvas — panelen naast elkaar, translateX glijdt ertussen */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{ width: `${count * 100}%`, transform: `translateX(-${index * (100 / count)}%)` }}
        >
          {SCREENS.map((s) => (
            <section
              key={s.key}
              aria-hidden={s.key !== screen}
              className="h-full shrink-0 overflow-y-auto"
              style={{ width: `${100 / count}%` }}
            >
              <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
                {s.key === "dashboard" && (
                  <Dashboard
                    onOpen={() => setScreen("opdracht")}
                    onActies={() => setScreen("acties")}
                  />
                )}
                {s.key === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
                {s.key === "opdracht" && (
                  <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
                )}
                {s.key === "verificatie" && <Verificatie />}
                {s.key === "acties" && <Acties />}
                {s.key === "facturen" && <Facturen />}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Filmstrip — miniatuur-panelen, actief uitgelicht. Op mobiel: horizontaal snap-scrollen. */}
      <nav
        aria-label="Panorama-schermen"
        className="flex items-center gap-2 overflow-x-auto px-4 py-3 md:justify-center md:px-8"
        style={{
          background: C.paper,
          borderTop: `1px solid ${C.line}`,
          scrollSnapType: "x mandatory",
        }}
      >
        <span
          className="hidden items-center gap-1.5 pr-1 text-[11px] font-medium md:inline-flex"
          style={{ color: C.inkFaint }}
        >
          <MoveHorizontal size={14} strokeWidth={2.2} aria-hidden="true" /> Glijd
        </span>
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                scrollSnapAlign: "center",
                background: on ? C.accentSoft : C.canvas,
                border: `1.5px solid ${on ? C.accent : C.line}`,
                ["--tw-ring-color" as string]: C.accent,
              }}
            >
              {/* Mini-paneel-preview */}
              <span
                className="flex h-9 w-12 shrink-0 flex-col justify-between overflow-hidden rounded-md p-1"
                style={{ background: on ? C.white : C.canvasDeep, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <span
                  className="h-1 w-6 rounded-full"
                  style={{ background: on ? C.accent : C.lineStrong }}
                />
                <span className="flex gap-0.5">
                  <span
                    className="h-3 flex-1 rounded-sm"
                    style={{ background: on ? C.accentSoft : C.line }}
                  />
                  <span
                    className="h-3 flex-1 rounded-sm"
                    style={{ background: on ? C.accentSoft : C.line }}
                  />
                </span>
              </span>
              <span className="min-w-0">
                <span
                  className="block text-[9px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: on ? C.accentDeep : C.inkFaint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="block text-[12.5px] font-semibold"
                  style={{ ...display, color: on ? C.ink : C.inkSoft }}
                >
                  {s.label}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
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
      {/* Panorama-hero — breed, met horizon-verloop naar het accent */}
      <Card
        className="overflow-hidden"
        style={{
          background: `linear-gradient(110deg, ${C.paper} 0%, ${C.paper} 46%, ${C.accentSoft} 100%)`,
        }}
      >
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ background: C.accentSoft, color: C.accentDeep }}
            >
              <Sparkles size={12} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 text-[28px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              Drie matches boven&nbsp;85%. Je omzet loopt op.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Eén taak vraagt actie: je VOG verloopt binnenkort. Handel het af en blijf
              verifieerbaar voor opdrachtgevers.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.paper,
                  color: C.ink,
                  border: `1px solid ${C.lineStrong}`,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                <AlertTriangle size={15} strokeWidth={2.4} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>

          {/* Dekking-ring */}
          <div
            className="flex items-center gap-4 rounded-2xl p-5"
            style={{ background: C.paper, border: `1px solid ${C.line}`, ...softShadowSm }}
          >
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke={C.canvasDeep} strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={C.accent}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(dek / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-bold leading-none" style={display}>
                  {dek}%
                </span>
              </div>
            </div>
            <div className="max-w-[9rem]">
              <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
                Certificaat-dekking
              </div>
              <div className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <StatusTag status="VERIFIED" />
            </div>
          </div>
        </div>
      </Card>

      {/* KPI-strook — breed, panorama-ritme */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: C.inkSoft }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                <TrendingUp size={11} className={k.up ? "" : "rotate-180"} aria-hidden="true" />
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[24px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <SectionHead eyebrow="Aanbevolen" title="Matches voor jou" Icon={Star} />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const t = matchTone(o.match);
              return (
                <Card key={o.id} interactive className="overflow-hidden">
                  <button
                    onClick={onOpen}
                    className="flex w-full items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.accent }}
                  >
                    <span
                      className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5"
                      style={{ background: t.bg }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[20px] font-bold leading-none"
                        style={{ ...display, color: t.fg }}
                      >
                        {o.match}
                      </span>
                      <span className="text-[9px] font-semibold uppercase" style={{ color: t.fg }}>
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[15px] font-bold tracking-[-0.01em]"
                            style={{ ...display, color: C.ink }}
                          >
                            {o.titel}
                          </div>
                          <div
                            className="mt-0.5 truncate text-[12.5px]"
                            style={{ color: C.inkSoft }}
                          >
                            {o.opdrachtgever} · {o.plaats} · {o.tarief}
                          </div>
                        </div>
                        <ArrowRight
                          size={17}
                          className="mt-1 shrink-0"
                          style={{ color: C.accent }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: C.canvasDeep, color: C.inkSoft }}
                          >
                            <Check
                              size={11}
                              strokeWidth={2.8}
                              style={{ color: C.ok }}
                              aria-hidden="true"
                            />
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Prioriteit */}
        <div className="space-y-4">
          <SectionHead eyebrow="Nu belangrijk" title="Volgende actie" Icon={AlertTriangle} />
          <Card className="overflow-hidden p-5" style={{ background: C.ink }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "rgba(255,255,255,0.12)", color: C.warnSoft }}
            >
              <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
            </span>
            <h3 className="mt-3 text-[17px] font-bold leading-tight text-white" style={display}>
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: C.accent,
                color: C.white,
                ["--tw-ring-color" as string]: C.white,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Card>

          <Card className="p-5">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
              Recente reacties
            </div>
            <ul className="mt-3 space-y-3">
              {ACTIES.slice(1).map((a) => (
                <li key={a.titel} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.accentSoft }}
                    aria-hidden="true"
                  >
                    <Star size={12} strokeWidth={2.6} style={{ color: C.accent }} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                      {a.titel}
                    </div>
                    <div className="text-[11.5px]" style={{ color: C.inkFaint }}>
                      {a.detail}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
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
    <div className="space-y-6">
      <SectionHead
        eyebrow="Open opdrachten"
        title="Marktplaats"
        Icon={Search}
        action={
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.paper, border: `1px solid ${C.lineStrong}`, ...softShadowSm }}
          >
            <Search size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-48 bg-transparent text-[13px] outline-none placeholder:opacity-60 sm:w-64"
              style={{ ...body, color: C.ink }}
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.accentSoft }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.accent }} />
          </span>
          <p className="text-[18px] font-bold" style={{ ...display, color: C.ink }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const t = matchTone(o.match);
            return (
              <Card key={o.id} interactive className="flex flex-col overflow-hidden">
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h3
                      className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                  <span
                    className="flex shrink-0 flex-col items-center rounded-xl px-2.5 py-1.5"
                    style={{ background: t.bg }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[16px] font-bold leading-none"
                      style={{ ...display, color: t.fg }}
                    >
                      {o.match}
                    </span>
                    <span className="text-[8px] font-semibold uppercase" style={{ color: t.fg }}>
                      match
                    </span>
                  </span>
                </div>
                <div className="border-t px-4 py-3" style={{ borderColor: C.line }}>
                  <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ background: C.canvasDeep, color: C.inkSoft }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 border-t py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#e9f1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    borderColor: C.line,
                    color: C.accentDeep,
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
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
  const t = matchTone(opdracht.match);
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{
          background: C.paper,
          color: C.ink,
          border: `1px solid ${C.lineStrong}`,
          ["--tw-ring-color" as string]: C.accent,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: C.accentSoft, color: C.accentDeep }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 text-[26px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center rounded-2xl px-6 py-4"
            style={{ background: t.bg }}
          >
            <span
              className="text-[46px] font-bold leading-none"
              style={{ ...display, color: t.fg }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: t.fg }}
            >
              % match
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <f.Icon size={16} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-bold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div
            className="flex items-center gap-2 text-[13px] font-semibold"
            style={{ color: C.ok }}
          >
            <Check size={15} strokeWidth={2.6} aria-hidden="true" /> Waarom dit past
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ color: C.ink }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.okSoft }}
                  aria-hidden="true"
                >
                  <Check size={12} strokeWidth={3} style={{ color: C.ok }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div
            className="flex items-center gap-2 text-[13px] font-semibold"
            style={{ color: C.warn }}
          >
            <AlertTriangle size={15} strokeWidth={2.6} aria-hidden="true" /> Om te overwegen
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ color: C.ink }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.warnSoft }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={11} strokeWidth={3} style={{ color: C.warn }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.paper,
            color: C.ink,
            border: `1px solid ${C.lineStrong}`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          <Star size={15} strokeWidth={2.4} aria-hidden="true" /> Bewaar
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
      <SectionHead
        eyebrow="Vertrouwen"
        title="Verificatie & certificaten"
        Icon={ShieldCheck}
        action={
          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
          >
            <Plus size={14} aria-hidden="true" /> Toevoegen
          </button>
        }
      />

      <Card
        className="overflow-hidden"
        style={{ background: `linear-gradient(110deg, ${C.paper}, ${C.accentSoft})` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="flex items-center gap-5">
            <div
              className="text-[48px] font-bold leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.ink }}
            >
              {dek}%
            </div>
            <div className="max-w-xs">
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.inkSoft }}>
                Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
                vertrouwen.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold"
            style={{ background: C.paper, color: C.ok, border: `1px solid ${C.line}` }}
          >
            <ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-stretch overflow-hidden">
              <span
                className="flex w-12 shrink-0 items-center justify-center"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={19} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[14.5px] font-bold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#e9f1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        color: C.accentDeep,
                        border: `1px solid ${C.lineStrong}`,
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        eyebrow="Op volgorde van urgentie"
        title="Volgende beste acties"
        Icon={Sparkles}
      />
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card
                interactive
                className="flex items-stretch overflow-hidden"
                style={warn ? { background: C.ink, borderColor: C.ink } : undefined}
              >
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[26px] font-bold"
                  style={{
                    ...display,
                    background: warn ? "rgba(255,255,255,0.10)" : C.accentSoft,
                    color: warn ? C.white : C.accent,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                      style={
                        warn
                          ? { background: "rgba(255,255,255,0.14)", color: C.warnSoft }
                          : { background: C.accentSoft, color: C.accentDeep }
                      }
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.8} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15.5px] font-bold tracking-[-0.01em]"
                      style={{ ...display, color: warn ? C.white : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ color: warn ? "rgba(255,255,255,0.78)" : C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            background: C.accent,
                            color: C.white,
                            ["--tw-ring-color" as string]: C.white,
                          }
                        : {
                            background: C.paper,
                            color: C.ink,
                            border: `1px solid ${C.lineStrong}`,
                            ["--tw-ring-color" as string]: C.accent,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.canvasDeep };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <SectionHead
        eyebrow="Omzet & facturatie"
        title="Facturen"
        Icon={Coins}
        action={
          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, fg: C.ok, bg: C.okSoft },
          { l: "Openstaand", v: `${open}`, fg: C.warn, bg: C.warnSoft },
          { l: "Te factureren", v: "€ 1.350", fg: C.accent, bg: C.accentSoft },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div className="text-[11px] font-medium" style={{ color: C.inkSoft }}>
              {s.l}
            </div>
            <div
              className="mt-2 inline-flex rounded-lg px-2.5 py-1 text-[22px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, background: s.bg, color: s.fg }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#f5f7fb]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: m.bg }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.4} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-bold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ color: C.inkSoft }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: m.bg, color: m.fg }}
                >
                  <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{ background: C.canvas, borderTop: `1px solid ${C.line}` }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.inkSoft }}
          >
            Totaal betaald
          </span>
          <span className="text-[17px] font-bold tabular-nums" style={{ ...display, color: C.ok }}>
            {betaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
