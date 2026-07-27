"use client";

// Concept 488 — "Zeewier" · Biofiel, onderwater-kalm. Zachte kelp-groenen en diep aqua-verlopen,
// vloeiende organische scheidingslijnen, licht dat van boven filtert, veel lucht en een zachte
// diffuse gloed. Laag-prikkelend en geruststellend rond gevoelige documenten, maar data-compleet.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Leaf,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Wallet,
  Waves,
  Wind,
  X,
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

// — Kelp-groen & diep-aqua onderwaterpalet, zacht en laag-prikkelend —
const C = {
  bg: "#eef6f2",
  bgDeep: "#e2f0ec",
  card: "#ffffff",
  ink: "#123a34",
  inkSoft: "#33574f",
  inkMute: "#5e7d76",
  inkFaint: "#93aca5",
  line: "#dbeae4",
  lineSoft: "#e8f1ed",

  kelp: "#2f8f6b",
  kelpDeep: "#1f6b50",
  kelpText: "#1e6a4f",
  kelpSoft: "#d5ede2",

  aqua: "#2aa5a0",
  aquaDeep: "#177b77",
  aquaText: "#16716d",
  aquaSoft: "#d1ece9",
  deep: "#0f4f57",

  amber: "#c08a2e",
  amberText: "#8f6216",
  amberSoft: "#f4e8cf",

  clay: "#c65f45",
  clayText: "#a24730",
  claySoft: "#f6ddd4",
};

const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
  letterSpacing: "-0.01em",
};

type Palette = { base: string; deep: string; text: string; soft: string };
const P = {
  kelp: { base: C.kelp, deep: C.kelpDeep, text: C.kelpText, soft: C.kelpSoft } as Palette,
  aqua: { base: C.aqua, deep: C.aquaDeep, text: C.aquaText, soft: C.aquaSoft } as Palette,
  amber: { base: C.amber, deep: C.amber, text: C.amberText, soft: C.amberSoft } as Palette,
  clay: { base: C.clay, deep: C.clay, text: C.clayText, soft: C.claySoft } as Palette,
};

const SCREEN_META: Record<ScreenKey, { pal: Palette; Icon: LucideIcon }> = {
  dashboard: { pal: P.kelp, Icon: Waves },
  marktplaats: { pal: P.aqua, Icon: Search },
  opdracht: { pal: P.kelp, Icon: Sprout },
  verificatie: { pal: P.aqua, Icon: ShieldCheck },
  acties: { pal: P.clay, Icon: Wind },
  facturen: { pal: P.amber, Icon: Wallet },
  documenten: { pal: P.kelp, Icon: FileText },
  berichten: { pal: P.aqua, Icon: Sparkles },
};

function credMeta(s: CredStatus): {
  pal: Palette;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { pal: P.kelp, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { pal: P.aqua, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { pal: P.amber, label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { pal: P.clay, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// —————————————————————————————— Golvende scheidingslijn (organisch) ——————————————————————————————
function WaveDivider({ tone, flip = false }: { tone: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className="block h-8 w-full"
      aria-hidden="true"
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <path
        d="M0,20 C150,4 300,36 450,22 C600,8 750,34 900,22 C1050,10 1150,26 1200,20 L1200,40 L0,40 Z"
        fill={tone}
        opacity="0.5"
      />
      <path
        d="M0,26 C180,12 320,38 480,26 C640,14 800,36 960,26 C1080,18 1160,28 1200,26 L1200,40 L0,40 Z"
        fill={tone}
      />
    </svg>
  );
}

// — Zachte, ronde voortgangsmeter (kelp-blad) —
function Bubble({ value, pal, size = 56 }: { value: number; pal: Palette; size?: number }) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const c = size / 2;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill={pal.soft} opacity="0.5" />
        <circle cx={c} cy={c} r={r} fill="none" stroke={C.line} strokeWidth="3.5" />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={pal.base}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <span className="absolute text-[13px] font-semibold" style={{ color: pal.text, ...num }}>
        {value}
      </span>
    </span>
  );
}

// — Vloeiende sparkline met zachte gloed —
function Flow({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 30;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 4 - ((d - min) / span) * (h - 8)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={area} fill={tone} opacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#fff" stroke={tone} strokeWidth="2" />
    </svg>
  );
}

// —————————————————————————————— Primitieven ——————————————————————————————
function Chip({
  children,
  pal,
  Icon,
}: {
  children: React.ReactNode;
  pal: Palette;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ color: pal.text, background: pal.soft, ...body }}
    >
      {Icon && <Icon size={11} aria-hidden="true" />}
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  pal = P.kelp,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  pal?: Palette;
  variant?: "solid" | "quiet" | "outline";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12px]" : "px-5 py-2.5 text-[13px]";
  const styles: React.CSSProperties =
    variant === "solid"
      ? { background: pal.base, color: "#fff", boxShadow: `0 6px 18px -8px ${pal.base}` }
      : variant === "quiet"
        ? { background: pal.soft, color: pal.text }
        : { background: C.card, color: C.inkSoft, border: `1px solid ${C.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef6f2] ${pad} ${className}`}
      style={{ ...styles, ...body }}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = "",
  as: Tag = "div",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  glow?: boolean;
}) {
  return (
    <Tag
      className={`rounded-3xl ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: glow
          ? "0 1px 2px rgba(18,58,52,0.03), 0 24px 48px -30px rgba(42,165,160,0.45)"
          : "0 1px 2px rgba(18,58,52,0.03), 0 16px 34px -26px rgba(18,58,52,0.22)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function SectionHead({
  children,
  pal,
  Icon,
  sub,
}: {
  children: React.ReactNode;
  pal: Palette;
  Icon: LucideIcon;
  sub?: string;
}) {
  return (
    <div className="mb-3">
      <h2
        className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.01em]"
        style={{ color: C.ink }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: pal.soft, color: pal.text }}
          aria-hidden="true"
        >
          <Icon size={13} />
        </span>
        {children}
      </h2>
      {sub && (
        <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// —————————————————————————————— Hoofdcomponent ——————————————————————————————
export function Concept488() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        backgroundColor: C.bg,
        backgroundImage: [
          // licht dat van boven filtert
          "radial-gradient(70% 40% at 50% -6%, rgba(42,165,160,0.16) 0%, rgba(42,165,160,0) 60%)",
          "radial-gradient(40% 30% at 14% 6%, rgba(47,143,107,0.12) 0%, rgba(47,143,107,0) 70%)",
          "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(226,240,236,0.2) 40%, rgba(226,240,236,0) 100%)",
        ].join(","),
      }}
    >
      {/* zachte licht-schachten van boven */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          backgroundImage:
            "linear-gradient(105deg, transparent 12%, rgba(255,255,255,0.5) 16%, transparent 22%), linear-gradient(100deg, transparent 44%, rgba(255,255,255,0.4) 48%, transparent 55%), linear-gradient(96deg, transparent 72%, rgba(255,255,255,0.45) 76%, transparent 82%)",
          maskImage: "linear-gradient(180deg, #000 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3">
        <span
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(150deg, ${C.aqua} 0%, ${C.kelpDeep} 100%)`,
            color: "#fff",
            boxShadow: `0 10px 22px -10px ${C.aqua}`,
          }}
          aria-hidden="true"
        >
          <Leaf size={20} strokeWidth={1.8} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Zeewier
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            Rustig werken, {PROFIEL.naam.split(" ")[0]} · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{ color: C.kelpText, background: C.kelpSoft }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} nieuwe berichten`}
        >
          <Sparkles size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold"
              style={{ background: C.clay, color: "#fff", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{ background: C.aquaSoft, color: C.aquaText, ...num }}
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
    <nav aria-label="Hoofdnavigatie">
      <div
        className="flex items-stretch gap-1 overflow-x-auto rounded-full p-1.5"
        style={{
          background: "rgba(255,255,255,0.6)",
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(4px)",
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const { pal, Icon } = SCREEN_META[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef6f2]"
              style={
                on
                  ? {
                      background: pal.base,
                      color: "#fff",
                      boxShadow: `0 8px 18px -8px ${pal.base}`,
                    }
                  : { background: "transparent", color: C.inkSoft }
              }
            >
              <Icon size={14} aria-hidden="true" style={{ color: on ? "#fff" : pal.text }} />
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Rustige onderwater-hero */}
        <div
          className="relative overflow-hidden rounded-[32px] p-7 md:p-8"
          style={{
            background: `linear-gradient(150deg, ${C.deep} 0%, ${C.aquaDeep} 55%, ${C.kelpDeep} 100%)`,
            color: "#eafaf5",
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full"
            style={{ background: "rgba(234,250,245,0.10)", filter: "blur(6px)" }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-16 top-8 h-3 w-3 rounded-full"
            style={{ background: "rgba(234,250,245,0.5)" }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-28 top-20 h-2 w-2 rounded-full"
            style={{ background: "rgba(234,250,245,0.35)" }}
          />
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "rgba(234,250,245,0.82)" }}
          >
            <Waves size={13} aria-hidden="true" /> Rustig overzicht
          </p>
          <h1 className="mt-3 max-w-md text-[26px] font-semibold leading-[1.16] tracking-[-0.01em] md:text-[32px]">
            Alles in balans, {PROFIEL.naam.split(" ")[0]}. Je certificaten drijven mee, drie kansen
            dobberen langs.
          </h1>
          <p
            className="mt-3 max-w-md text-[13.5px] leading-relaxed"
            style={{ color: "rgba(234,250,245,0.82)" }}
          >
            Geen ruis, geen haast — alleen wat telt. Eén ding vraagt zachtjes je aandacht om
            verifieerbaar te blijven.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f4f57]"
              style={{ color: C.aquaText }}
            >
              <Wind size={14} aria-hidden="true" /> Volgende stap
            </button>
            <button
              type="button"
              onClick={onMarkt}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f4f57]"
              style={{
                background: "rgba(234,250,245,0.16)",
                border: "1px solid rgba(234,250,245,0.28)",
              }}
            >
              Naar marktplaats <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <WaveDivider tone="rgba(234,250,245,0.10)" />
          </div>
        </div>

        {/* Zachte next-action */}
        <Card glow className="flex flex-col p-6">
          <div className="flex items-center justify-between">
            <Chip pal={P.clay} Icon={AlertTriangle}>
              Vraagt aandacht
            </Chip>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: C.claySoft, color: C.clayText }}
              aria-hidden="true"
            >
              <AlertTriangle size={16} />
            </span>
          </div>
          <h2 className="mt-3 text-[18px] font-semibold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-4">
            <Button pal={P.clay} onClick={onActies} className="w-full">
              {primair.cta} <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
          <p
            className="mt-4 flex items-center gap-2 border-t pt-3 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.lineSoft }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: C.kelpText }} />
            {verified}/{CREDENTIALS.length} certificaten in orde · {ratio}% compleet
          </p>
        </Card>
      </section>

      <section>
        <SectionHead pal={P.aqua} Icon={TrendingUp} sub="Rustig meebewegend met je maand">
          Jouw stromingen
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const pal = [P.kelp, P.aqua, P.amber, P.clay][i % 4] as Palette;
            return (
              <Card key={k.label} className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-medium" style={{ color: C.inkMute }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold"
                    style={{ color: pal.text, background: pal.soft, ...num }}
                  >
                    <TrendingUp
                      size={10}
                      aria-hidden="true"
                      style={{ transform: k.up ? "none" : "scaleY(-1)" }}
                    />
                    {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[25px] font-semibold leading-none"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <Flow data={k.spark} tone={pal.base} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHead pal={P.kelp} Icon={Sprout}>
              Kansen die langs dobberen
            </SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="rounded text-[12px] font-medium underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f6b]"
              style={{ color: C.kelpText }}
            >
              Alles bekijken →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead pal={P.aqua} Icon={ShieldCheck}>
            Jouw certificaten
          </SectionHead>
          <Card className="p-2">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const cm = credMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-2.5 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ background: cm.pal.soft, color: cm.pal.text }}
                      aria-hidden="true"
                    >
                      <cm.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-medium"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: cm.alarm ? cm.pal.text : C.inkMute }}
                      >
                        {cm.label}
                      </span>
                    </span>
                    {cm.alarm && (
                      <AlertTriangle size={14} aria-hidden="true" style={{ color: cm.pal.text }} />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
          <div
            className="mt-4 flex items-center gap-3 rounded-3xl p-4"
            style={{ background: C.kelpSoft }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: C.kelp, color: "#fff" }}
              aria-hidden="true"
            >
              <Leaf size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: C.kelpText }}>
                Veilig en privé bewaard
              </p>
              <p className="text-[11.5px]" style={{ color: C.inkSoft }}>
                Je documenten liggen versleuteld — jij bepaalt wie ze mag zien.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  const pal = strong ? P.kelp : P.aqua;
  return (
    <Card as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#f4fbf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f8f6b]"
      >
        <Bubble value={opdracht.match} pal={pal} size={54} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold" style={{ color: C.ink }}>
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium"
            style={{ color: C.kelpText }}
          >
            <Check size={12} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
        </span>
      </button>
    </Card>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <p
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: C.aquaText }}
        >
          <Search size={12} aria-hidden="true" /> Marktplaats
        </p>
        <h1
          className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Kansen die bij je stroom passen
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#93aca5]"
            style={{ color: C.ink, ...body }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[#e8f1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f6b]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
              pal={P.aqua}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Button>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.lineSoft }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          pal={P.clay}
          Icon={AlertTriangle}
          titel="Even geen verbinding"
          tekst="De opdrachten laden nu niet. Haal rustig adem en probeer het zo opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          pal={P.aqua}
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm — er drijft vast iets langs.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8f6b]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "Laadstaat tonen" : "Foutstaat tonen"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  pal,
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  pal: Palette;
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: pal.soft, color: pal.text }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[19px] font-semibold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Button pal={pal} onClick={onCta} className="mt-6">
        {cta} <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </Card>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const pal = strong ? P.kelp : P.aqua;
  return (
    <Card as="article" className="p-5">
      <div className="flex items-start gap-4">
        <Bubble value={opdracht.match} pal={pal} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip pal={pal} Icon={strong ? Sprout : Leaf}>
              {strong ? "Sterke match" : "Goede match"}
            </Chip>
            <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[17px] font-semibold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.bgDeep, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2aa5a0]"
          style={{ color: C.aquaText, background: C.aquaSoft }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Button pal={pal} onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              pal={P.kelp}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              pal={P.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenBlok({
  titel,
  pal,
  Icon,
  items,
}: {
  titel: string;
  pal: Palette;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: pal.soft }}>
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: pal.text }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: pal.base }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const pal = strong ? P.kelp : P.aqua;
  return (
    <div className="space-y-5">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </Button>

      <div
        className="relative overflow-hidden rounded-[32px] p-7 md:p-8"
        style={{
          background: `linear-gradient(150deg, ${C.deep} 0%, ${C.aquaDeep} 55%, ${C.kelpDeep} 100%)`,
          color: "#eafaf5",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-14 h-52 w-52 rounded-full"
          style={{ background: "rgba(234,250,245,0.09)", filter: "blur(8px)" }}
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: "rgba(234,250,245,0.16)", ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: "rgba(234,250,245,0.16)" }}
          >
            <Sprout size={12} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1 className="relative mt-4 max-w-2xl text-[26px] font-semibold leading-[1.16] tracking-[-0.01em] md:text-[32px]">
          {opdracht.titel}
        </h1>
        <p
          className="relative mt-2 flex items-center gap-1.5 text-[13.5px]"
          style={{ color: "rgba(234,250,245,0.85)" }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f4f57]"
            style={{ color: C.kelpText }}
          >
            <Check size={14} aria-hidden="true" /> Reageer op opdracht
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f4f57]"
            style={{
              background: "rgba(234,250,245,0.16)",
              border: "1px solid rgba(234,250,245,0.28)",
            }}
          >
            Bewaren
          </button>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <WaveDivider tone="rgba(234,250,245,0.10)" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, p: P.kelp, Icon: Wallet },
          { l: "Omvang", v: opdracht.uren, p: P.aqua, Icon: Clock },
          { l: "Start", v: opdracht.start, p: P.amber, Icon: Sprout },
          { l: "Match", v: `${opdracht.match}%`, p: P.kelp, Icon: Sparkles },
        ].map((m) => (
          <Card key={m.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: m.p.soft, color: m.p.text }}
              aria-hidden="true"
            >
              <m.Icon size={16} />
            </span>
            <p
              className="mt-3 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <section>
        <SectionHead
          pal={P.aqua}
          Icon={Sparkles}
          sub="Afgezet tegen je geverifieerde profiel — open, zonder verborgen score."
        >
          Waarom deze match bij je past
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.kelpText }}
            >
              <Check size={14} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.kelp, color: "#fff" }}
                    aria-hidden="true"
                  >
                    <Check size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.amberText }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amber, color: "#fff" }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div
          className="mt-4 flex items-center gap-3 rounded-2xl p-4"
          style={{ background: pal.soft }}
        >
          <Sparkles size={17} aria-hidden="true" style={{ color: pal.text }} />
          <p className="text-[12.5px] font-medium" style={{ color: pal.text }}>
            Match {opdracht.match}% —{" "}
            {strong
              ? "dit sluit rustig en volledig op je aan."
              : "een fijne kans die goed aansluit."}
          </p>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-[32px] p-7 md:p-8"
        style={{
          background: `linear-gradient(150deg, ${C.kelpDeep} 0%, ${C.aquaDeep} 100%)`,
          color: "#eafaf5",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full"
          style={{ background: "rgba(234,250,245,0.10)", filter: "blur(6px)" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
              style={{ color: "rgba(234,250,245,0.85)" }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwensniveau
            </p>
            <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.01em]">
              {PROFIEL.trust}
            </h1>
            <p
              className="mt-2 text-[14px] leading-relaxed"
              style={{ color: "rgba(234,250,245,0.9)" }}
            >
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — dat pakken we rustig op tijd op. Je documenten blijven veilig en privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: "rgba(234,250,245,0.18)" }}
            aria-hidden="true"
          >
            <span className="text-[30px] font-semibold leading-none" style={{ ...num }}>
              {ratio}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em]">
              % in orde
            </span>
          </span>
        </div>
        <div
          className="relative mt-5 h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(234,250,245,0.25)" }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: "#eafaf5",
              transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </div>

      <div>
        <SectionHead pal={P.kelp} Icon={ShieldCheck}>
          Jouw certificaten
        </SectionHead>
        <Card className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const cm = credMeta(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f4fbf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2aa5a0]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ background: cm.pal.soft, color: cm.pal.text }}
                      aria-hidden="true"
                    >
                      <cm.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex">
                        <Chip pal={cm.pal} Icon={cm.Icon}>
                          {cm.label}
                          {cm.alarm && <span className="sr-only"> (let op)</span>}
                        </Chip>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 sm:pl-[76px]">
                        <div
                          className="rounded-2xl p-4"
                          style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                            toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              pal={
                                c.status === "EXPIRING"
                                  ? P.amber
                                  : c.status === "REJECTED"
                                    ? P.clay
                                    : P.kelp
                              }
                            >
                              {c.status === "EXPIRING"
                                ? "Vernieuwen"
                                : c.status === "REJECTED"
                                  ? "Opnieuw indienen"
                                  : "Bekijken"}
                            </Button>
                            <Button size="sm" variant="outline">
                              Historie
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div>
        <SectionHead pal={P.aqua} Icon={FileText}>
          Documentenkast
        </SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const cm = credMeta(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.bgDeep, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Chip pal={cm.pal} Icon={cm.Icon}>
                  {cm.label}
                </Chip>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: C.clayText }}
        >
          <Wind size={12} aria-hidden="true" /> Acties
        </p>
        <h1
          className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Rustig afhandelen, op volgorde
        </h1>
        <p className="mt-1 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Eén ding tegelijk, van boven naar beneden — geen ruis, alleen wat telt.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const pal = warn ? P.clay : P.aqua;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Card className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold"
                    style={{ background: pal.soft, color: pal.text, ...num }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip pal={pal} Icon={warn ? AlertTriangle : Sprout}>
                      {warn ? "Urgent" : "Aanbevolen"}
                    </Chip>
                    <h2
                      className="mt-2 text-[17px] font-semibold leading-snug"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <Button pal={pal} onClick={goMarkt ? onMarkt : undefined}>
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 rounded-3xl p-5" style={{ background: C.kelpSoft }}>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: C.kelp, color: "#fff" }}
          aria-hidden="true"
        >
          <Leaf size={20} />
        </span>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: C.kelpText }}>
            Nog {ACTIES.length} rustige stappen en je bent helemaal bij.
          </p>
          <p className="text-[12px]" style={{ color: C.inkSoft }}>
            Elke afgeronde actie maakt je profiel sterker en beter zichtbaar.
          </p>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurPalette(status: string): Palette {
  if (status === "Betaald") return P.kelp;
  if (status === "Openstaand") return P.clay;
  return P.aqua;
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ color: C.amberText }}
          >
            <Wallet size={12} aria-hidden="true" /> Facturen
          </p>
          <h1
            className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Jouw facturen
          </h1>
        </div>
        <Button pal={P.kelp}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", p: P.kelp, Icon: Check },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", p: P.clay, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", p: P.aqua, Icon: FileText },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: s.p.soft, color: s.p.text }}
                aria-hidden="true"
              >
                <s.Icon size={16} />
              </span>
              <Chip pal={s.p}>{s.l}</Chip>
            </div>
            <p className="mt-3 text-[23px] font-semibold" style={{ color: C.ink, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            pal={P.aqua}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div
          className="hidden grid-cols-[1.6fr_1fr_1fr_auto] gap-4 border-b px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] sm:grid"
          style={{ color: C.inkMute, borderColor: C.lineSoft }}
        >
          <span>Klant · nummer</span>
          <span>Datum</span>
          <span className="text-right">Bedrag</span>
          <span className="text-right">Status</span>
        </div>
        <ul>
          {rows.map((f, i) => {
            const pal = factuurPalette(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span className="min-w-0">
                  <span
                    className="block truncate text-[13.5px] font-medium"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr}
                  </span>
                </span>
                <span
                  className="hidden text-[12.5px] sm:block"
                  style={{ color: C.inkSoft, ...num }}
                >
                  {f.datum}
                </span>
                <span
                  className="hidden text-right text-[14px] font-semibold sm:block"
                  style={{ color: C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
                <span className="flex items-center justify-end gap-3">
                  <span
                    className="text-[14px] font-semibold sm:hidden"
                    style={{ color: C.ink, ...num }}
                  >
                    {f.bedrag}
                  </span>
                  <Chip pal={pal}>{f.status}</Chip>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
