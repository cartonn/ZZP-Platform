"use client";

// Concept 349 — "Vensterbank" · huiselijk zacht daglicht, warm en menselijk.
// Rationale: gevoelige documenten (VOG, diploma's, verzekeringen) vragen om vertrouwen én rust.
// Waar de meeste dashboards koud en druk zijn, kiest Vensterbank voor een gastvrije, low-stimulation
// sfeer — alsof ochtendlicht door een raam op een houten vensterbank valt: zacht daglicht-wit,
// warme houtwarmte, plant-groen en een perzik/roze gloed. Ruime radii, zachte schaduwen als van
// licht door glas, en een warme humanist-typografie (instrument voor display, sora voor koppen,
// manrope voor tekst). Verificatie voelt hier als "verzorgd worden", niet als een audit. Elke status
// draagt label + icoon; matching wordt verklaard in menselijke taal. Voor de ZZP'er die zich thuis
// wil voelen op het platform waar haar loopbaan wordt bijgehouden.

import { useEffect, useState } from "react";
import {
  Home,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  ReceiptText,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sprout,
  Sun,
  Heart,
  Check,
  Clock,
  TriangleAlert,
  CircleX,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCw,
  CircleAlert,
  Leaf,
  Coffee,
  MessageCircle,
  CalendarDays,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet — zacht ochtendlicht, houtwarmte, plant-groen ---------- */

const C = {
  canvas: "#f6f0e7", // warm daglicht-linnen
  glow: "#fdf6ee", // ochtendgloed op de vensterbank
  surface: "#fffdf9", // zacht wit oppervlak
  surfaceWarm: "#faf3e9", // houtwarm oppervlak
  ink: "#33291f", // warme donkere inkt
  inkSoft: "#5a4d3f",
  sub: "#7d6f5e", // zachte subtekst
  faint: "#a89880", // fluisterlabel
  line: "#eadfce", // zachte houtlijn
  wood: "#b5814e", // houtwarmte-accent
  woodSoft: "#f6e9d6",
  green: "#5b8c52", // plant-groen (WCAG-veilig op warm wit)
  greenDeep: "#3f6c37",
  greenSoft: "#e7f0e2",
  peach: "#c96b4f", // warme perzik/terracotta
  peachSoft: "#fbe7de",
  rose: "#b8607a", // zachte roze gloed
  roseSoft: "#f8e6ec",
  ok: "#3f8f57",
  okSoft: "#e5f2e6",
  warn: "#b57310",
  warnSoft: "#faedd4",
  alert: "#c0503f",
  alertSoft: "#fbe6e0",
  info: "#4d7ba0",
  infoSoft: "#e6eff5",
};

const display = { fontFamily: "var(--font-lab-instrument), Georgia, serif" };
const head = { fontFamily: "var(--font-lab-sora), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b8c52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf9]";

// Zachte "licht-door-raam" schaduw — de signatuur van dit concept.
const SOFT_SHADOW = "0 1px 2px rgba(83,64,42,0.04), 0 8px 24px -12px rgba(83,64,42,0.14)";
const LIFT_SHADOW = "0 2px 4px rgba(83,64,42,0.05), 0 18px 40px -16px rgba(83,64,42,0.22)";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", fg: C.warn, soft: C.warnSoft, Icon: TriangleAlert };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: CircleX };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.woodSoft };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Home,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: ReceiptText,
  documenten: ReceiptText,
  berichten: MessageCircle,
};

/* ---------- Bouwstenen ---------- */

function StatusPill({ status, size = "md" }: { status: CredStatus; size?: "sm" | "md" }) {
  const t = credTone(status);
  const Icon = t.Icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{ ...body, color: t.fg, background: t.soft }}
    >
      <Icon size={size === "sm" ? 11 : 12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Zachte, afgeronde sparkline die aanvoelt als een heuvellijn in ochtendlicht.
function SoftSpark({
  data,
  color,
  height = 34,
  width = 96,
  fill = true,
}: {
  data: number[];
  color: string;
  height?: number;
  width?: number;
  fill?: boolean;
}) {
  const w = width;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = `vb-${color.replace("#", "")}-${w}-${h}`;
  const pts: readonly [number, number][] = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y];
  });
  const at = (i: number): [number, number] =>
    pts[Math.max(0, Math.min(pts.length - 1, i))] ?? [0, 0];
  // Gladde kromme via Catmull-Rom → Bézier voor een huiselijke, zachte lijn.
  const first = at(0);
  let d = `M${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const area = `${d} L${w} ${h} L0 ${h} Z`;
  const last = at(pts.length - 1);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {fill && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill={color} />}
    </svg>
  );
}

// Een "groeiende plant"-voortgangsmeter — plant-groen dat opklimt.
function GrowthMeter({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: C.greenSoft }}
        aria-hidden="true"
      >
        <Sprout size={22} style={{ color: C.greenDeep }} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        {label && (
          <p className="mb-1 text-[11px] font-semibold" style={{ color: C.sub }}>
            {label}
          </p>
        )}
        <div
          className="h-2.5 w-full overflow-hidden rounded-full"
          style={{ background: C.woodSoft }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${clamped}%`,
              background: `linear-gradient(90deg, ${C.green}, ${C.greenDeep})`,
            }}
          />
        </div>
        <p className="mt-1 text-[12px] font-bold tabular-nums" style={{ color: C.greenDeep }}>
          {clamped}%
        </p>
      </div>
    </div>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-1 pt-7 sm:px-8">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ ...head, color: C.wood }}
        >
          <Sun size={13} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-1.5 text-[30px] font-medium leading-[1.05] tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

function Card({
  children,
  className = "",
  lift = false,
  warm = false,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
  warm?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] ${className}`}
      style={{
        background: warm ? C.surfaceWarm : C.surface,
        border: `1px solid ${C.line}`,
        boxShadow: lift ? LIFT_SHADOW : SOFT_SHADOW,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept349() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `radial-gradient(1200px 380px at 78% -6%, ${C.glow}, transparent 62%), ${C.canvas}`,
      }}
    >
      <style>{`@keyframes vb-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes vb-breathe{0%,100%{opacity:.55}50%{opacity:.9}}
      @keyframes vb-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}`}</style>

      <div className="lg:flex">
        {/* Zij-navigatie — als een boekenplank op de vensterbank */}
        <aside
          className="hidden shrink-0 border-r lg:flex lg:w-[236px] lg:flex-col"
          style={{ borderColor: C.line, background: C.glow }}
        >
          <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{ background: C.greenSoft }}
              aria-hidden="true"
            >
              <Leaf size={18} style={{ color: C.greenDeep }} />
            </span>
            <div className="leading-none">
              <p className="text-[16px] font-medium tracking-tight" style={display}>
                Vensterbank
              </p>
              <p
                className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                Voor ZZP-zorg
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-3" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] transition-colors ${RING}`}
                  style={{
                    color: on ? C.ink : C.sub,
                    background: on ? C.surface : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                    boxShadow: on ? SOFT_SHADOW : "none",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.9}
                    style={{ color: on ? C.green : C.faint }}
                    aria-hidden="true"
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Rust-kaart onderaan */}
          <div className="mt-auto p-4">
            <div
              className="rounded-[20px] p-4"
              style={{
                border: `1px solid ${C.line}`,
                background: `linear-gradient(150deg, ${C.roseSoft}, ${C.surface})`,
              }}
            >
              <Coffee size={18} style={{ color: C.rose }} aria-hidden="true" />
              <p className="mt-2 text-[12.5px] font-bold" style={{ color: C.ink }}>
                Neem even rust
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: C.sub }}>
                Alles wat aandacht vraagt staat op je Acties-plank. De rest regelen we op de
                achtergrond.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Topbalk */}
          <header
            className="sticky top-0 z-10 border-b backdrop-blur"
            style={{ borderColor: C.line, background: "rgba(255,253,249,0.82)" }}
          >
            <div className="flex h-16 items-center gap-3 px-5 sm:px-8">
              <span className="flex items-center gap-2 lg:hidden">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: C.greenSoft }}
                  aria-hidden="true"
                >
                  <Leaf size={16} style={{ color: C.greenDeep }} />
                </span>
                <span className="text-[15px] font-medium" style={display}>
                  Vensterbank
                </span>
              </span>

              <div
                className="ml-auto hidden items-center gap-2.5 rounded-full px-3.5 py-2 sm:flex"
                style={{ background: C.surface, border: `1px solid ${C.line}`, minWidth: 260 }}
              >
                <Search size={15} style={{ color: C.faint }} aria-hidden="true" />
                <span className="text-[12.5px]" style={{ color: C.faint }}>
                  Zoek een opdracht, klant of document…
                </span>
                <kbd
                  className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: C.woodSoft, color: C.sub }}
                >
                  /
                </kbd>
              </div>

              <button
                aria-label="Zoeken"
                className={`rounded-full p-2.5 transition-colors hover:bg-[#faf3e9] sm:hidden ${RING}`}
                style={{ border: `1px solid ${C.line}`, color: C.sub }}
              >
                <Search size={16} aria-hidden="true" />
              </button>
              <button
                aria-label="Meldingen"
                className={`relative rounded-full p-2.5 transition-colors hover:bg-[#faf3e9] ${RING}`}
                style={{ border: `1px solid ${C.line}`, color: C.sub }}
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{ background: C.peach }}
                  aria-hidden="true"
                />
              </button>
              <div className="ml-1 flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: C.wood, color: "#fff" }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="text-[13px] font-bold">{PROFIEL.naam}</p>
                  <p
                    className="flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: C.green }}
                  >
                    <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobiele scherm-tabs */}
            <nav
              className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 lg:hidden"
              aria-label="Schermen"
            >
              {SCREENS.map((s) => {
                const Icon = NAV_ICONS[s.key];
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${RING}`}
                    style={{
                      color: on ? C.ink : C.sub,
                      background: on ? C.greenSoft : C.surface,
                      border: `1px solid ${on ? "transparent" : C.line}`,
                      fontWeight: on ? 700 : 500,
                    }}
                  >
                    <Icon size={14} strokeWidth={2} aria-hidden="true" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </header>

          {/* Content */}
          <main
            key={screen}
            className="mx-auto max-w-6xl pb-12"
            style={{ animation: "vb-fade 0.4s ease" }}
          >
            {!ready ? (
              <ScreenSkeleton />
            ) : (
              <>
                {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
                {screen === "marktplaats" && <Marktplaats onOpen={open} />}
                {screen === "opdracht" && (
                  <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
                )}
                {screen === "verificatie" && <Verificatie onGo={setScreen} />}
                {screen === "acties" && <Acties onGo={setScreen} />}
                {screen === "facturen" && <Facturen />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-8 sm:px-8" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-8 w-56 rounded-2xl"
        style={{ background: C.surface, animation: "vb-breathe 1.4s infinite" }}
      />
      <div
        className="mt-6 h-40 rounded-[22px]"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          animation: "vb-breathe 1.4s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-[22px]"
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              animation: "vb-breathe 1.4s infinite",
            }}
          />
        ))}
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
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const warn = ACTIES[0];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const trustPct = Math.round((verified / CREDENTIALS.length) * 100);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 720);
  };

  return (
    <div>
      <PageHead
        kicker="Goedemorgen"
        title={`Fijn dat je er bent, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Een rustig overzicht van je praktijk. We laten alleen zien wat telt en wat vandaag je aandacht vraagt."
      />

      <div className="space-y-5 px-6 py-5 sm:px-8">
        {/* Ochtend-hero */}
        <Card lift className="overflow-hidden">
          <div
            className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: `linear-gradient(120deg, ${C.woodSoft} 0%, ${C.surface} 46%, ${C.roseSoft} 130%)`,
            }}
          >
            <div className="min-w-0">
              <p
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ ...head, color: C.wood }}
              >
                <Sparkles size={13} aria-hidden="true" /> Je week in één blik
              </p>
              <p
                className="mt-3 text-[34px] font-medium leading-none tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {KPIS[2]?.value}
              </p>
              <p className="mt-2 text-[13.5px]" style={{ color: C.sub }}>
                omzet deze maand ·{" "}
                <span
                  className="inline-flex items-center gap-1 font-bold"
                  style={{ color: C.green }}
                >
                  <ArrowUpRight size={13} aria-hidden="true" /> {KPIS[2]?.trend}
                </span>{" "}
                t.o.v. vorige maand
              </p>
              <div className="mt-4 max-w-[320px]">
                <SoftSpark data={KPIS[2]?.spark ?? []} color={C.green} height={44} width={320} />
              </div>
            </div>
            <div
              className="w-full rounded-[20px] p-4 sm:w-64"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.faint }}
              >
                Vertrouwensniveau
              </p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[15px] font-bold"
                style={{ color: C.greenDeep }}
              >
                <ShieldCheck size={16} aria-hidden="true" /> {PROFIEL.trust}
              </p>
              <div className="mt-3">
                <GrowthMeter
                  value={trustPct}
                  label={`${verified} van ${CREDENTIALS.length} bewijsstukken geverifieerd`}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* KPI-plankje */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-[11.5px] font-semibold" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.green : C.peach,
                    background: k.up ? C.greenSoft : C.peachSoft,
                  }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2 text-[24px] font-medium leading-none tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <SoftSpark data={k.spark} color={k.up ? C.green : C.peach} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Volgende zorg / actie */}
          {warn && (
            <Card className="p-6 lg:col-span-2" lift>
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ background: C.warnSoft, color: C.warn }}
              >
                <Heart size={13} aria-hidden="true" /> Vandaag verzorgen we dit
              </div>
              <h2
                className="text-[22px] font-medium leading-snug"
                style={{ ...display, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onGo("verificatie")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white transition-transform active:scale-[0.98] ${RING}`}
                  style={{ background: C.green, boxShadow: SOFT_SHADOW }}
                >
                  {warn.cta} <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
                </button>
                <button
                  onClick={() => onGo("acties")}
                  className={`rounded-full px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-[#faf3e9] ${RING}`}
                  style={{ border: `1px solid ${C.line}`, color: C.sub }}
                >
                  Alle acties bekijken
                </button>
              </div>
            </Card>
          )}

          {/* Berichten met error→loading→ok */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-2 text-[14px] font-bold"
                style={{ ...head, color: C.ink }}
              >
                <MessageCircle size={16} style={{ color: C.rose }} aria-hidden="true" /> Laatste
                bericht
              </h3>
              <button
                onClick={() => onGo("acties")}
                className={`text-[12px] font-bold ${RING}`}
                style={{ color: C.green }}
              >
                Alles
              </button>
            </div>
            <div className="mt-4">
              {feed === "error" && (
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ background: C.alertSoft }}
                  role="alert"
                >
                  <CircleAlert
                    size={22}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    We konden je berichten niet ophalen.
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                    Geen zorgen — probeer het zo nog eens.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors hover:bg-[#fffdf9] ${RING}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCw size={12} aria-hidden="true" /> Opnieuw laden
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2.5" role="status" aria-live="polite">
                  <span className="sr-only">Berichten laden…</span>
                  {[70, 90, 55].map((w, i) => (
                    <span
                      key={i}
                      className="block h-3.5 rounded-full"
                      style={{
                        background: C.woodSoft,
                        width: `${w}%`,
                        animation: "vb-breathe 1.4s infinite",
                      }}
                    />
                  ))}
                </div>
              )}
              {feed === "ok" &&
                BERICHTEN.slice(0, 2).map((b) => (
                  <div
                    key={b.van}
                    className="flex items-start gap-3 border-b py-3 last:border-0"
                    style={{ borderColor: C.line }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: C.woodSoft, color: C.wood }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12.5px] font-bold" style={{ color: C.ink }}>
                          {b.van}
                        </p>
                        <span className="shrink-0 text-[10.5px]" style={{ color: C.faint }}>
                          {b.tijd}
                        </span>
                      </div>
                      <p
                        className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug"
                        style={{ color: C.sub }}
                      >
                        {b.preview}
                      </p>
                    </div>
                    {b.ongelezen && (
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.green }}
                        aria-label="Ongelezen"
                      />
                    )}
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Warme matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[17px] font-medium"
              style={{ ...display, color: C.ink }}
            >
              <Sprout size={18} style={{ color: C.green }} aria-hidden="true" /> Opdrachten die bij
              je passen
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-bold ${RING}`}
              style={{ color: C.green }}
            >
              Alles bekijken <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`group text-left transition-transform active:scale-[0.99] ${RING}`}
              >
                <Card className="h-full p-5 transition-shadow group-hover:shadow-[0_18px_40px_-16px_rgba(83,64,42,0.28)]">
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                      style={{ background: C.greenSoft, color: C.greenDeep }}
                    >
                      <Heart size={12} strokeWidth={2.2} aria-hidden="true" /> {o.match}% match
                    </span>
                    <span
                      className="text-[10.5px] font-semibold tabular-nums"
                      style={{ color: C.faint }}
                    >
                      {o.id}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[16px] font-medium leading-snug"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1 text-[12.5px]"
                    style={{ color: C.sub }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div
                    className="mt-4 flex items-center justify-between border-t pt-3"
                    style={{ borderColor: C.line }}
                  >
                    <span className="text-[14px] font-bold tabular-nums" style={{ color: C.wood }}>
                      {o.tarief}
                    </span>
                    <span className="text-[11.5px]" style={{ color: C.faint }}>
                      {o.uren}
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief)));

  return (
    <div>
      <PageHead
        kicker="De marktplaats"
        title="Opdrachten met een goed gevoel"
        sub="Rustig gerangschikt op wat bij jou past. We leggen bij elke opdracht uit waarom die goed aansluit."
        right={
          <div
            className="inline-flex items-center gap-1 rounded-full p-1"
            style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SOFT_SHADOW }}
            role="tablist"
            aria-label="Sorteren"
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors ${RING}`}
                  style={{
                    background: on ? C.greenSoft : "transparent",
                    color: on ? C.greenDeep : C.sub,
                  }}
                >
                  {s === "match" ? "Beste match" : "Hoogste tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-5 sm:px-8">
        <div
          className="mb-5 flex items-center gap-3 rounded-full px-4 py-3"
          style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SOFT_SHADOW }}
        >
          <Search size={17} style={{ color: C.faint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a89880]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Zoekopdracht wissen"
              className={`rounded-full p-1 ${RING}`}
              style={{ color: C.faint }}
            >
              <CircleX size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center" warm>
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Sprout size={24} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[18px] font-medium" style={{ ...display, color: C.ink }}>
              Nog niets gevonden
            </p>
            <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed" style={{ color: C.sub }}>
              Er is niets dat overeenkomt met “{q}”. Verbreed je zoekopdracht — er komen doorlopend
              nieuwe opdrachten bij.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-full px-5 py-2 text-[12.5px] font-bold transition-colors hover:bg-[#faf3e9] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </Card>
        ) : (
          <ul className="space-y-4">
            {filtered.map((o, i) => (
              <li key={o.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start gap-5">
                    <span
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl"
                      style={{ background: i === 0 ? C.greenSoft : C.woodSoft }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[15px] font-bold tabular-nums leading-none"
                        style={{ color: i === 0 ? C.greenDeep : C.wood }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="mt-0.5 text-[8px] font-bold uppercase"
                        style={{ color: i === 0 ? C.green : C.faint }}
                      >
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-[10.5px] font-semibold tabular-nums"
                          style={{ color: C.faint }}
                        >
                          {o.id}
                        </span>
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                            style={{ background: C.woodSoft, color: C.sub }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p
                        className="mt-1.5 text-[17px] font-medium leading-snug"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px]">
                        <span className="font-bold tabular-nums" style={{ color: C.wood }}>
                          {o.tarief}
                        </span>
                        <span className="flex items-center gap-1" style={{ color: C.sub }}>
                          <Clock size={12} aria-hidden="true" /> {o.uren}
                        </span>
                        <span className="flex items-center gap-1" style={{ color: C.sub }}>
                          <CalendarDays size={12} aria-hidden="true" /> {o.start}
                        </span>
                      </div>
                      {o.redenen.plus[0] && (
                        <p
                          className="mt-2.5 flex items-start gap-1.5 text-[11.5px]"
                          style={{ color: C.greenDeep }}
                        >
                          <Check
                            size={13}
                            strokeWidth={2.6}
                            className="mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          {o.redenen.plus[0]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onOpen(o.id)}
                      className={`inline-flex items-center gap-1.5 self-center rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform active:scale-[0.98] ${RING}`}
                      style={{ background: C.green, boxShadow: SOFT_SHADOW }}
                    >
                      Bekijk <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };

  return (
    <div>
      <PageHead
        kicker={opdracht.id}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`rounded-full px-4 py-2.5 text-[12.5px] font-bold transition-colors hover:bg-[#faf3e9] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-95 ${RING}`}
              style={{ background: state === "sent" ? C.ok : C.green, boxShadow: SOFT_SHADOW }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.2} aria-hidden="true" /> Reageer op deze opdracht
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:px-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief, Icon: Sun },
              { l: "Omvang", v: opdracht.uren, Icon: Clock },
              { l: "Start", v: opdracht.start, Icon: CalendarDays },
              { l: "Match", v: `${opdracht.match}%`, Icon: Heart },
            ].map((m) => {
              const Icon = m.Icon;
              return (
                <Card key={m.l} className="p-4">
                  <Icon size={15} style={{ color: C.wood }} aria-hidden="true" />
                  <p
                    className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: C.faint }}
                  >
                    {m.l}
                  </p>
                  <p className="mt-1 text-[16px] font-bold tabular-nums" style={{ color: C.ink }}>
                    {m.v}
                  </p>
                </Card>
              );
            })}
          </div>

          <Card className="p-6">
            <h3 className="text-[19px] font-medium" style={{ ...display, color: C.ink }}>
              Waarom deze opdracht bij je past
            </h3>
            <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
              In gewone taal uitgelegd, op basis van je geverifieerde profiel.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.green }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Wat goed aansluit
                </p>
                <ul className="mt-3 space-y-2.5">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2.5 text-[13px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.greenSoft }}
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                          style={{ color: C.green }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.warn }}
                >
                  <TriangleAlert size={13} strokeWidth={2.4} aria-hidden="true" /> Om rekening mee
                  te houden
                </p>
                <ul className="mt-3 space-y-2.5">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2.5 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.warnSoft }}
                      >
                        <TriangleAlert
                          size={11}
                          strokeWidth={2.4}
                          style={{ color: C.warn }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6" warm>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.wood }}
            >
              Over de opdrachtgever
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} werkt met een warm, klein team en hecht aan continuïteit voor
              cliënten. Reacties worden meestal binnen een dag beantwoord — een fijne, menselijke
              samenwerking staat voorop.
            </p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div
              className="p-6"
              style={{ background: `linear-gradient(150deg, ${C.greenSoft}, ${C.surface})` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: C.surface, border: `1px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[18px] font-bold tabular-nums"
                    style={{ color: C.greenDeep }}
                  >
                    {opdracht.match}
                  </span>
                </span>
                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.green }}
                  >
                    Match-score
                  </p>
                  <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.inkSoft }}>
                    Een sterke, natuurlijke aansluiting bij je profiel.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.wood }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Gevraagde bewijsstukken
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Je voldoet aan de kern-eisen. We bewaren je documenten veilig en privé.
            </p>
            <ul className="mt-3.5 space-y-3">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: t.soft }}
                    >
                      <Icon size={16} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} size="sm" />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        kicker="Jouw verzorgde profiel"
        title="Verificatie"
        sub="Je gevoelige documenten worden hier veilig en privé bewaard. Elk geverifieerd bewijsstuk laat opdrachtgevers zien dat ze je kunnen vertrouwen."
      />
      <div className="space-y-5 px-6 py-5 sm:px-8">
        <Card lift className="overflow-hidden">
          <div
            className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center"
            style={{
              background: `linear-gradient(120deg, ${C.greenSoft}, ${C.surface} 60%, ${C.woodSoft})`,
            }}
          >
            <div className="flex-1">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.greenDeep }}
              >
                <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
              </p>
              <p
                className="mt-2 text-[28px] font-medium leading-none tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {verified} van {total} bewijsstukken geverifieerd
              </p>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.sub }}>
                Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
                een volledig verzorgd profiel. Neem er rustig de tijd voor.
              </p>
            </div>
            <div className="w-full sm:w-56">
              <GrowthMeter value={pct} label="Voortgang verificatie" />
            </div>
          </div>
        </Card>

        {expiring && (
          <Card className="flex flex-wrap items-center gap-4 p-5" warm>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: C.warnSoft }}
              aria-hidden="true"
            >
              <TriangleAlert size={20} style={{ color: C.warn }} />
            </span>
            <div className="min-w-[180px] flex-1">
              <p className="text-[14px] font-bold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. We helpen je op tijd te vernieuwen, zodat je zichtbaar blijft.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold text-white transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn }}
            >
              Nu vernieuwen <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <Card key={c.naam} className="flex items-center gap-4 p-5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={22} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </Card>
            );
          })}
        </div>

        <Card className="flex items-center gap-3 p-4">
          <Sprout size={18} style={{ color: C.green }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Je documenten zijn versleuteld opgeslagen en alleen zichtbaar voor de mensen die je zelf
            toestaat. Privacy staat voorop.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        kicker="Je acties-plank"
        title="Wat vandaag je aandacht vraagt"
        sub="Een rustige lijst, op volgorde van urgentie. Vink af wat af is en laat de rest met een gerust hart staan."
      />
      <div className="space-y-4 px-6 py-5 sm:px-8">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.peach : C.info;
          const soft = warn ? C.peachSoft : C.infoSoft;
          return (
            <Card key={a.titel} className="flex flex-wrap items-start gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold tabular-nums"
                style={{ background: soft, color: fg }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: fg }}
                >
                  {warn ? (
                    <>
                      <TriangleAlert size={12} aria-hidden="true" /> Vraagt aandacht
                    </>
                  ) : (
                    <>
                      <Sun size={12} aria-hidden="true" /> Fijne kans
                    </>
                  )}
                </p>
                <p className="mt-1 text-[15.5px] font-medium" style={{ ...display, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 self-center rounded-full px-4 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  background: warn ? C.peach : C.green,
                  color: "#fff",
                  boxShadow: SOFT_SHADOW,
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </Card>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-[22px] p-5"
          style={{
            background: `linear-gradient(120deg, ${C.greenSoft}, ${C.surface})`,
            border: `1px solid ${C.line}`,
          }}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ background: C.surface }}
            aria-hidden="true"
          >
            <Coffee size={18} style={{ color: C.green }} />
          </span>
          <div>
            <p className="text-[13px] font-bold" style={{ color: C.ink }}>
              Verder is alles in orde
            </p>
            <p className="text-[12px]" style={{ color: C.sub }}>
              Nieuwe kansen en herinneringen verschijnen hier vanzelf. Ga gerust even zitten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const totaal = betaald + open;
  const pct = totaal ? Math.round((betaald / totaal) * 100) : 0;

  return (
    <div>
      <PageHead
        kicker="Je huishoudboekje"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe. Wat er binnen is, wat nog onderweg is, en wat nog een klein zetje kan gebruiken."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.green, boxShadow: SOFT_SHADOW }}
          >
            <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              Ontvangen
            </p>
            <p
              className="mt-1.5 text-[26px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.greenDeep }}
            >
              € {betaald.toLocaleString("nl-NL")}
            </p>
            <div className="mt-3">
              <GrowthMeter value={pct} label={`${pct}% van je omzet is binnen`} />
            </div>
          </Card>
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              Openstaand
            </p>
            <p
              className="mt-1.5 text-[26px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.warn }}
            >
              € {open.toLocaleString("nl-NL")}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: C.sub }}>
              <Clock size={13} aria-hidden="true" /> 2 facturen wachten op betaling
            </p>
          </Card>
          <Card className="p-5" warm>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              Totaal deze periode
            </p>
            <p
              className="mt-1.5 text-[26px] font-medium tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              € {totaal.toLocaleString("nl-NL")}
            </p>
            <p
              className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold"
              style={{ color: C.green }}
            >
              <ArrowUpRight size={13} aria-hidden="true" /> Op koers voor een fijne maand
            </p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="text-[10.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ background: C.surfaceWarm, color: C.faint }}
                >
                  <th className="px-5 py-3.5">Nummer</th>
                  <th className="px-5 py-3.5">Klant</th>
                  <th className="hidden px-5 py-3.5 sm:table-cell">Datum</th>
                  <th className="px-5 py-3.5 text-right">Bedrag</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {FACTUREN.map((f, i) => {
                  const t = factuurTone(f.status);
                  return (
                    <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                      <td
                        className="px-5 py-4 text-[12px] font-semibold tabular-nums"
                        style={{ color: C.sub }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td
                        className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                        style={{ color: C.faint }}
                      >
                        {f.datum}
                      </td>
                      <td
                        className="px-5 py-4 text-right text-[13px] font-bold tabular-nums"
                        style={{ color: C.ink }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ color: t.fg, background: t.soft }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: t.fg }}
                            aria-hidden="true"
                          />
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
