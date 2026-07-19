"use client";

// Concept 415 — "Kwast" · gouache-atelier op warm papier.
// Licht concept: warm papier-wit (#f6f1e7) met geschilderde gouache-accenten. Brede penseelstreken
// als sectie-highlights (via gradients / clip-path / organische border-radius), een schilderspalet
// dat spaarzaam ingezet wordt: oker, pruisisch blauw, terracotta, salie. Handgeschilderd-maar-
// gestructureerd: tactiel, warm, artistiek, met een strakke informatiehiërarchie. Body in een schone
// grotesk, koppen in een karaktervolle serif. Actieve tab draagt een onregelmatige geschilderde streep.
// Donkere inkt (#2c2620) op warm papier voor WCAG AA+ contrast.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Bell,
  FileText,
  Award,
  Palette,
  Paintbrush,
  Brush,
  Feather,
  Sparkles,
  Star,
  TrendingUp,
  TrendingDown,
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

// — Palet: warm papier, donkere inkt en een spaarzaam schilderspalet —
const C = {
  paper: "#f6f1e7",
  paperDeep: "#efe7d6",
  paperSoft: "#faf6ee",
  card: "#fbf8f1",
  cardHi: "#fffdf8",
  ink: "#2c2620",
  inkSoft: "#4f463b",
  inkMute: "#7a6f60",
  inkFaint: "#a3988612",
  muted: "#9a8f7d",
  line: "rgba(44,38,32,0.12)",
  lineSoft: "rgba(44,38,32,0.07)",
  // schilderspalet
  ochre: "#d99a2b",
  ochreDeep: "#b47d18",
  ochreWash: "rgba(217,154,43,0.15)",
  prussian: "#24506b",
  prussianDeep: "#1a3c52",
  prussianWash: "rgba(36,80,107,0.13)",
  terracotta: "#c25c3e",
  terracottaDeep: "#a2492f",
  terracottaWash: "rgba(194,92,62,0.14)",
  sage: "#7d8c5c",
  sageDeep: "#63704699",
  sageWash: "rgba(125,140,92,0.16)",
  // statustonen (voldoende contrast op papier)
  okInk: "#4d6a2a",
  okWash: "rgba(125,140,92,0.18)",
  warnInk: "#9a6a12",
  warnWash: "rgba(217,154,43,0.2)",
  infoInk: "#24506b",
  infoWash: "rgba(36,80,107,0.13)",
  badInk: "#a2492f",
  badWash: "rgba(194,92,62,0.16)",
};

// — Fontstacks: karaktervolle serif voor koppen, schone grotesk voor body —
const display = {
  fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const bodyF = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

type StatusTone = {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
  tone: string;
};

function statusMeta(s: CredStatus): StatusTone {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.okInk,
        wash: C.okWash,
        tone: C.sage,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        ink: C.infoInk,
        wash: C.infoWash,
        tone: C.prussian,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.warnInk,
        wash: C.warnWash,
        tone: C.ochre,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.badInk,
        wash: C.badWash,
        tone: C.terracotta,
      };
  }
}

// — Geschilderde penseelstreek als achtergrond-highlight (SVG met organische vorm) —
function BrushStroke({ tone, className = "" }: { tone: string; className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      viewBox="0 0 240 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M4 34 C 28 18, 62 14, 96 20 C 140 27, 176 42, 214 30 C 226 26, 234 30, 236 36 C 232 46, 208 50, 178 46 C 132 40, 96 30, 58 38 C 34 43, 14 46, 4 34 Z"
        fill={tone}
      />
    </svg>
  );
}

// — Onregelmatige geschilderde onderstreep voor de actieve tab —
function PaintUnderline({ tone }: { tone: string }) {
  return (
    <svg
      className="absolute -bottom-1 left-0 h-2 w-full"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 6 C 16 3, 30 8, 46 5 C 62 2, 76 9, 90 5 C 94 4, 97 5, 98 6"
        fill="none"
        stroke={tone}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// — Kaart met tactiele, licht-onregelmatige "geschilderde" hoeken —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone,
  tactile = true,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  tone?: string;
  tactile?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${tone ?? C.line}`,
        borderRadius: tactile ? "18px 16px 20px 15px" : "14px",
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 26px rgba(60,48,32,0.07)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.terracotta }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone, ...bodyF }}
    >
      <Brush size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function Chip({
  children,
  ink,
  wash,
  tone,
  alarm = false,
}: {
  children: React.ReactNode;
  ink: string;
  wash: string;
  tone: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: ink,
        background: wash,
        border: `1px solid ${tone}`,
        borderRadius: "10px 8px 11px 7px",
        ...bodyF,
      }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24506b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: C.paperSoft,
        background: `linear-gradient(150deg, ${C.terracotta}, ${C.terracottaDeep})`,
        borderRadius: "12px 10px 13px 9px",
        boxShadow: "0 2px 0 rgba(120,54,32,0.35), 0 8px 18px rgba(120,54,32,0.18)",
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24506b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.paperSoft : C.inkSoft,
        background: active ? C.prussian : C.cardHi,
        border: `1px solid ${active ? C.prussian : C.line}`,
        borderRadius: "12px 10px 13px 9px",
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Gouache-sparkline: zachte streek met wash eronder —
function GouacheLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 7) - 3.5;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`gouache-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.26" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#gouache-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={tone} />
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.terracotta : value >= 85 ? C.prussian : C.ochre;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: "rgba(44,38,32,0.1)" }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

// — Ronde "palet-plek" met initialen of getal —
function PaletteDot({
  children,
  tone,
  size = 44,
  filled = false,
}: {
  children: React.ReactNode;
  tone: string;
  size?: number;
  filled?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center font-bold leading-none"
      style={{
        width: size,
        height: size,
        borderRadius: "50% 46% 52% 48%",
        background: filled ? tone : C.cardHi,
        border: `1.5px solid ${tone}`,
        color: filled ? C.paperSoft : tone,
        ...num,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

const screenTone: Record<ScreenKey, string> = {
  dashboard: C.terracotta,
  marktplaats: C.prussian,
  opdracht: C.ochre,
  verificatie: C.sage,
  documenten: C.prussian,
  facturen: C.ochreDeep,
  berichten: C.terracotta,
  acties: C.terracotta,
};

export function Concept415() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...bodyF,
        color: C.ink,
        background: `
          radial-gradient(90% 60% at 12% -6%, ${C.ochreWash} 0%, transparent 55%),
          radial-gradient(80% 55% at 96% 4%, ${C.prussianWash} 0%, transparent 60%),
          ${C.paper}`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-6">
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
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(150deg, ${C.terracotta}, ${C.ochre})`,
            borderRadius: "50% 44% 54% 46%",
            color: C.paperSoft,
          }}
          aria-hidden="true"
        >
          <Paintbrush size={20} />
        </span>
        <div>
          <p
            className="text-[23px] font-semibold leading-none tracking-[0.01em]"
            style={{ color: C.ink, ...display }}
          >
            Kwast
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...bodyF }}>
            {PROFIEL.plaats} · atelier voor zorgprofessionals
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.okInk,
            border: `1px solid ${C.sage}`,
            background: C.sageWash,
            borderRadius: "11px 8px 12px 7px",
            ...bodyF,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{
            background: C.cardHi,
            border: `1px solid ${C.line}`,
            borderRadius: "50% 46% 52% 48%",
            color: C.inkMute,
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.terracotta, color: C.paperSoft, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[15px] font-semibold" style={{ color: C.ink, ...display }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...bodyF }}>
            {PROFIEL.rol}
          </span>
        </span>
        <PaletteDot tone={C.prussian} size={44} filled>
          <span className="text-[13px]">{PROFIEL.initialen}</span>
        </PaletteDot>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto p-1.5"
        style={{
          background: C.cardHi,
          border: `1px solid ${C.line}`,
          borderRadius: "16px 14px 17px 13px",
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const tone = screenTone[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24506b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7] motion-reduce:transition-none"
              style={{
                color: on ? C.ink : C.inkMute,
                background: on ? C.paperDeep : "transparent",
                ...bodyF,
              }}
            >
              {s.label}
              {on && <PaintUnderline tone={tone} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="overflow-hidden p-6 md:p-8" tone={C.line}>
          <BrushStroke tone={C.ochreWash} className="right-[-30px] top-[-14px] h-28 w-64" />
          <div className="relative">
            <Eyebrow>Vandaag · op het doek</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h1
                className="text-[34px] font-semibold leading-[1.03] tracking-[0.005em] md:text-[46px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <Palette
                size={30}
                aria-hidden="true"
                style={{ color: C.ochre }}
                className="hidden shrink-0 sm:block"
              />
            </div>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
              Elke dag een frisse laag. Werk van boven naar beneden: houd je certificaten
              verifieerbaar, je matches warm en je facturen betaald — met een rustige, vaste hand.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <PrimaryButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Naar het atelier</GhostButton>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-6" tone={C.ochre}>
          <BrushStroke tone={C.ochreWash} className="bottom-[-18px] left-[-20px] h-24 w-56" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
              <Feather size={20} aria-hidden="true" style={{ color: C.ochreDeep }} />
            </div>
            <h2
              className="mt-4 text-[22px] font-semibold leading-snug"
              style={{ color: C.ink, ...display }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
              {primair.detail}
            </p>
            <div className="mt-5">
              <PrimaryButton onClick={onActies} className="w-full">
                {primair.cta}
                <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <p className="text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
              </p>
            </div>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.prussian}>Het palet · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.sage : C.ochre;
            return (
              <Panel key={k.label} className="p-4" tone={C.line}>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute, ...bodyF }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={{
                      color: k.up ? C.okInk : C.warnInk,
                      background: k.up ? C.okWash : C.warnWash,
                      ...num,
                    }}
                  >
                    {k.up ? (
                      <TrendingUp size={10} aria-hidden="true" />
                    ) : (
                      <TrendingDown size={10} aria-hidden="true" />
                    )}
                    {k.trend.replace(/^[+-]/, "")}
                    <span className="sr-only">{k.up ? " gestegen" : " gedaald"}</span>
                  </span>
                </div>
                <p
                  className="mt-2.5 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <GouacheLine data={k.spark} tone={tone} id={`kpi-${i}`} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Het atelier · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24506b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7]"
              style={{ color: C.terracotta, ...bodyF }}
            >
              Alle stukken →
            </button>
          </div>
          <Panel tone={C.line}>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#f4eede] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#24506b] motion-reduce:transition-none"
                  >
                    <PaletteDot
                      tone={i === 0 ? C.terracotta : C.prussian}
                      size={40}
                      filled={i === 0}
                    >
                      <span className="text-[12px]">{o.match}</span>
                    </PaletteDot>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...display }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <MatchMeter value={o.match} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.muted }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.sage}>Certificaten</Eyebrow>
          </div>
          <Panel className="p-4" tone={C.line}>
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        borderRadius: "10px 8px 11px 7px",
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

// — Skeleton-plaats voor het laden van de marktplaats —
function MarktSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <Panel className="p-5" tone={C.line}>
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="min-w-0 space-y-3">
                <div className="h-3 w-24 rounded-full" style={{ background: C.paperDeep }} />
                <div className="h-5 w-3/4 rounded-full" style={{ background: C.paperDeep }} />
                <div className="h-3 w-1/2 rounded-full" style={{ background: C.paperDeep }} />
                <div className="flex gap-2 pt-1">
                  {[0, 1, 2].map((t) => (
                    <div
                      key={t}
                      className="h-5 w-16 rounded-full"
                      style={{ background: C.paperDeep }}
                    />
                  ))}
                </div>
              </div>
              <div
                className="h-14 w-14"
                style={{ background: C.paperDeep, borderRadius: "50% 46% 52% 48%" }}
              />
            </div>
            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full motion-safe:animate-pulse"
              style={{ background: C.lineSoft }}
            />
          </Panel>
        </li>
      ))}
      <li className="sr-only" aria-live="polite">
        Opdrachten worden geladen…
      </li>
    </ul>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
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

  // Micro-interactie: korte laad-simulatie bij wisselen van sortering (mock, geen backend).
  function pickSort(s: "match" | "tarief") {
    if (s === sort) return;
    setSort(s);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 520);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <BrushStroke tone={C.prussianWash} className="right-[-40px] top-[-10px] h-24 w-72" />
        <div className="relative">
          <Eyebrow tone={C.prussian}>Het atelier · open opdrachten</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[0.005em]"
            style={{ color: C.ink, ...display }}
          >
            Open opdrachten
          </h1>
          <p className="mt-2 text-[12.5px]" style={{ color: C.inkMute, ...num }}>
            {String(filtered.length).padStart(2, "0")} van{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")} stukken op het doek
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-3"
          style={{
            background: C.cardHi,
            border: `1px solid ${C.line}`,
            borderRadius: "13px 11px 14px 10px",
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a8f7d]"
            style={{ color: C.ink, ...bodyF }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => pickSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {loading ? (
        <MarktSkeleton />
      ) : filtered.length === 0 ? (
        <Panel className="overflow-hidden" tone={C.line}>
          <BrushStroke
            tone={C.terracottaWash}
            className="left-1/2 top-4 h-24 w-56 -translate-x-1/2"
          />
          <div className="relative flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center"
              style={{
                background: C.terracottaWash,
                border: `1px solid ${C.terracotta}`,
                color: C.terracotta,
                borderRadius: "50% 46% 52% 48%",
              }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...display }}>
              Leeg doek
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkMute }}>
              Geen stuk past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer uit de
              collectie te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const tone = strong ? C.terracotta : C.prussian;
  return (
    <Panel className="overflow-hidden p-5" tone={strong ? C.terracotta : C.line}>
      {strong && (
        <BrushStroke tone={C.terracottaWash} className="right-[-24px] top-[-16px] h-24 w-52" />
      )}
      <div className="relative grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{
                color: C.inkMute,
                border: `1px solid ${C.line}`,
                borderRadius: "8px 6px 9px 5px",
                ...num,
              }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkMute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.paperDeep,
                  border: `1px solid ${C.lineSoft}`,
                  borderRadius: "9px 7px 10px 6px",
                  ...bodyF,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center"
            style={{
              background: strong ? tone : C.cardHi,
              border: `1.5px solid ${tone}`,
              borderRadius: "50% 46% 53% 47%",
            }}
          >
            <span
              className="text-[16px] font-bold leading-none"
              style={{ color: strong ? C.paperSoft : tone, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.1em]"
              style={{ color: strong ? C.paperSoft : C.inkMute, ...bodyF }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: tone, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24506b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf8f1] motion-reduce:transition-none"
          style={{
            color: C.prussian,
            border: `1px solid ${C.line}`,
            borderRadius: "10px 8px 11px 7px",
            ...bodyF,
          }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="relative grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In je voordeel"
              tone={C.okInk}
              border={C.sage}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              border={C.ochre}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  tone,
  border,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  border: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="p-4"
      style={{
        background: C.paperSoft,
        border: `1px solid ${C.lineSoft}`,
        borderLeft: `3px solid ${border}`,
        borderRadius: "12px 10px 13px 9px",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyF }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.terracotta : C.prussian;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24506b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: C.cardHi,
          borderRadius: "11px 9px 12px 8px",
          ...bodyF,
        }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar het atelier
      </button>

      <Panel className="overflow-hidden p-6 md:p-8" tone={tone}>
        <BrushStroke
          tone={strong ? C.terracottaWash : C.prussianWash}
          className="right-[-30px] top-[-16px] h-32 w-72"
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{
              color: C.inkMute,
              border: `1px solid ${C.line}`,
              borderRadius: "9px 7px 10px 6px",
              ...num,
            }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold"
            style={{
              color: C.paperSoft,
              background: tone,
              borderRadius: "9px 7px 10px 6px",
              ...bodyF,
            }}
          >
            <Star size={11} aria-hidden="true" /> {strong ? "Meesterstuk" : "Uitgelicht"} ·{" "}
            <span style={{ ...num }}>{opdracht.match}%</span>
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[32px] font-semibold leading-[1.05] tracking-[0.005em] md:text-[46px]"
          style={{ color: C.ink, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[14px]" style={{ color: C.inkMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageren <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel tone={C.line}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...bodyF }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Waarom deze match</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
          Transparant afgelezen van je geverifieerde profiel — wat in je voordeel telt én waar je op
          moet letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5" tone={C.line}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{
                  color: C.okInk,
                  background: C.okWash,
                  border: `1px solid ${C.sage}`,
                  borderRadius: "10px 8px 11px 7px",
                }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.okInk, ...bodyF }}
              >
                In je voordeel
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5" tone={C.line}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{
                  color: C.warnInk,
                  background: C.warnWash,
                  border: `1px solid ${C.ochre}`,
                  borderRadius: "10px 8px 11px 7px",
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.warnInk, ...bodyF }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden p-6 md:p-8" tone={C.sage}>
        <BrushStroke tone={C.sageWash} className="right-[-30px] top-[-14px] h-32 w-72" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.okInk}>Verificatie · zorgvuldig gelakt</Eyebrow>
            <h1
              className="mt-3 text-[30px] font-semibold leading-tight tracking-[0.005em]"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center"
            style={{
              background: C.cardHi,
              border: `2px solid ${C.sage}`,
              borderRadius: "50% 46% 53% 47%",
            }}
          >
            <span className="text-[26px] font-bold leading-none" style={{ color: C.okInk, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute, ...bodyF }}
            >
              % gelakt
            </span>
          </span>
        </div>
      </Panel>

      <Panel tone={C.line}>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...bodyF }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f4eede] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#24506b] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        borderRadius: "11px 8px 12px 7px",
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...display }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip ink={st.ink} wash={st.wash} tone={st.tone} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.muted,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[68px]">
                      <div
                        className="p-4"
                        style={{
                          background: C.paperSoft,
                          border: `1px solid ${C.lineSoft}`,
                          borderLeft: `3px solid ${st.tone}`,
                          borderRadius: "12px 10px 13px 9px",
                        }}
                      >
                        {st.alarm && (
                          <p
                            className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: st.ink, ...bodyF }}
                          >
                            <AlertTriangle size={12} aria-hidden="true" /> {st.label}
                          </p>
                        )}
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <BrushStroke tone={C.terracottaWash} className="right-[-40px] top-[-8px] h-24 w-72" />
        <div className="relative">
          <Eyebrow>Acties · volgende penseelstreek</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[0.005em]"
            style={{ color: C.ink, ...display }}
          >
            Wat nu aandacht vraagt
          </h1>
          <p className="mt-2 max-w-md text-[13px]" style={{ color: C.inkMute }}>
            Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
            blijven.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.ochre : C.prussian;
          const ink = warn ? C.warnInk : C.infoInk;
          const wash = warn ? C.warnWash : C.infoWash;
          return (
            <li key={a.titel}>
              <Panel className="overflow-hidden p-5" tone={warn ? C.ochre : C.line}>
                {warn && (
                  <BrushStroke tone={C.ochreWash} className="right-[-24px] top-[-14px] h-24 w-52" />
                )}
                <div className="relative grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <PaletteDot tone={tone} size={44} filled={warn}>
                    <span className="text-[15px]">{String(i + 1).padStart(2, "0")}</span>
                  </PaletteDot>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}`,
                        borderRadius: "9px 7px 10px 6px",
                        ...bodyF,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sparkles size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.inkMute }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.ochre, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.sage, Icon: Check };
  return { ink: C.inkMute, wash: C.paperDeep, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="relative overflow-hidden">
          <BrushStroke tone={C.ochreWash} className="left-[-30px] top-[-6px] h-20 w-60" />
          <div className="relative">
            <Eyebrow tone={C.ochreDeep}>Facturen · het grootboek</Eyebrow>
            <h1
              className="mt-3 text-[32px] font-semibold leading-none tracking-[0.005em]"
              style={{ color: C.ink, ...display }}
            >
              Facturen
            </h1>
          </div>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5" tone={s.alarm ? C.ochre : C.line}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyF }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel tone={C.line}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...bodyF }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f4eede] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...display }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      borderRadius: "10px 8px 11px 7px",
                      ...bodyF,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-5 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.inkMute, ...bodyF }}
          >
            <Award size={12} aria-hidden="true" style={{ color: C.ochre }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
