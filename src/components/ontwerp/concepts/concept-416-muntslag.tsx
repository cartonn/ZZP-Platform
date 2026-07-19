"use client";

// Concept 416 — "Muntslag" · Numismatiek & guilloché — securities/muntslag-vertrouwenslaag.
// Diepe flesgroene canvas (#0e2b22) met gegraveerde gouden lijnkunst (#c9a86a): fijne
// guilloché-achtige veiligheidsprint via CSS repeating-gradients, reliëfranden en één
// serif-displaymoment als "gegraveerde" kop. De verificatielaag is de held: certificaten als
// "geslagen" zegels/munten. Premium, veilig, waardevast — tabulaire cijfers overal.
// Palet: flesgroen, crème/ivoor, goud/oker. Subtiel patroon, AA+ contrast (licht op donker).
// Fonts: Cormorant Garamond (display, serif-fallback) + Inter (body) — altijd systeem-fallback.

import { useEffect, useMemo, useState } from "react";
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
  BadgeCheck,
  Stamp,
  Coins,
  Lock,
  Fingerprint,
  ChevronRight,
  Bell,
  FileText,
  Award,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: flesgroen, ivoor/crème, goud/oker en waarschuwingstinten —
const C = {
  green: "#0e2b22",
  greenDeep: "#0a1f18",
  greenInk: "#081712",
  panel: "#123529",
  panelHi: "#16402f",
  raise: "#1b4a37",
  raiseHi: "#215540",
  cream: "#f3ecda",
  creamSoft: "#ddd3ba",
  creamMute: "#a9a184",
  creamFaint: "#7f7960",
  gold: "#c9a86a",
  goldHi: "#e6cf97",
  goldDeep: "#9c8149",
  goldLine: "rgba(201,168,106,0.55)",
  goldWash: "rgba(201,168,106,0.14)",
  line: "rgba(201,168,106,0.22)",
  lineSoft: "rgba(243,236,218,0.08)",
  // status — onderscheidbaar op label + icoon, niet alleen kleur
  ok: "#6faf83",
  okInk: "#b3ddbf",
  okWash: "rgba(111,175,131,0.16)",
  slate: "#7f9fb5",
  slateInk: "#b7cddc",
  slateWash: "rgba(127,159,181,0.16)",
  copper: "#c98a52",
  copperInk: "#e6b57e",
  copperWash: "rgba(201,138,82,0.18)",
  terra: "#c07458",
  terraInk: "#e0a084",
  terraWash: "rgba(192,116,88,0.18)",
};

const display = {
  fontFamily:
    "'Cormorant Garamond', 'Playfair Display', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const bodyF = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// — Guilloché veiligheidsprint: fijne gouden lijnen als op een bankbiljet/munt (subtiel) —
function guillocheLayers(intensity: number): React.CSSProperties {
  const l = intensity;
  return {
    backgroundImage: [
      `repeating-radial-gradient(circle at 30% 18%, rgba(201,168,106,${0.05 * l}) 0px, rgba(201,168,106,${0.05 * l}) 0.6px, transparent 0.6px, transparent 7px)`,
      `repeating-radial-gradient(circle at 82% 88%, rgba(201,168,106,${0.045 * l}) 0px, rgba(201,168,106,${0.045 * l}) 0.6px, transparent 0.6px, transparent 9px)`,
      `repeating-linear-gradient(46deg, rgba(201,168,106,${0.035 * l}) 0px, rgba(201,168,106,${0.035 * l}) 1px, transparent 1px, transparent 11px)`,
      `repeating-linear-gradient(-46deg, rgba(201,168,106,${0.03 * l}) 0px, rgba(201,168,106,${0.03 * l}) 1px, transparent 1px, transparent 11px)`,
    ].join(", "),
  };
}

function GuillochePattern({
  intensity = 1,
  className = "",
}: {
  intensity?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={guillocheLayers(intensity)}
    />
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        alarm: false,
        tone: C.gold,
        ink: C.goldHi,
        wash: C.goldWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.slate,
        ink: C.slateInk,
        wash: C.slateWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.copper,
        ink: C.copperInk,
        wash: C.copperWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.terra,
        ink: C.terraInk,
        wash: C.terraWash,
      };
  }
}

// — Paneel: donkergroen met dunne goud-rand en reliëf, als een geslagen plaat —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  raised = false,
  pattern = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  raised?: boolean;
  pattern?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        background: raised
          ? `radial-gradient(130% 100% at 20% 0%, ${C.panelHi} 0%, ${C.panel} 55%, ${C.greenDeep} 100%)`
          : C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: raised
          ? "inset 0 1px 0 rgba(243,236,218,0.06), inset 0 0 0 1px rgba(201,168,106,0.05), 0 20px 46px rgba(0,0,0,0.42)"
          : "inset 0 1px 0 rgba(243,236,218,0.045), 0 12px 30px rgba(0,0,0,0.32)",
        color: C.cream,
      }}
    >
      {pattern && <GuillochePattern intensity={raised ? 1.15 : 0.85} />}
      {children}
    </Tag>
  );
}

// — Reliëf-hoeklijst: fijne gouden dubbele rand binnen een held-paneel —
function Relief() {
  return (
    <div
      className="pointer-events-none absolute inset-2.5 rounded-lg"
      aria-hidden="true"
      style={{ border: `1px solid ${C.line}`, boxShadow: "inset 0 0 0 1px rgba(243,236,218,0.03)" }}
    />
  );
}

function Eyebrow({ children, tone = C.gold }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.3em]"
      style={{ color: tone, ...bodyF }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ border: `1px solid ${tone}` }}
      />
      {children}
    </p>
  );
}

function Chip({
  children,
  tone,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...bodyF }}
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
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13.5px] font-bold transition-all duration-200 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6cf97] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e2b22] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.greenInk,
        background: `linear-gradient(158deg, ${C.goldHi}, ${C.gold})`,
        boxShadow: `0 2px 0 ${C.goldDeep}, 0 10px 22px rgba(0,0,0,0.4)`,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e2b22] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.greenInk : C.creamSoft,
        background: active ? C.gold : "transparent",
        border: `1px solid ${active ? C.gold : C.line}`,
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Zegel / muntslag: concentrische guilloché-ringen met gekartelde muntrand —
function Seal({
  size = 88,
  Icon,
  tone = C.gold,
  ink = C.goldHi,
  value,
  caption,
}: {
  size?: number;
  Icon: LucideIcon;
  tone?: string;
  ink?: string;
  value?: string;
  caption?: string;
}) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        // gekartelde muntrand (reeded edge)
        background: `repeating-conic-gradient(${tone} 0deg 4deg, ${C.goldDeep} 4deg 8deg)`,
        padding: 3,
        boxShadow: `0 8px 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.25)`,
      }}
      aria-hidden="true"
    >
      <span
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 38%, ${C.panelHi} 0%, ${C.panel} 60%, ${C.greenDeep} 100%)`,
          border: `1.5px solid ${tone}`,
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-radial-gradient(circle at 50% 50%, rgba(201,168,106,0.16) 0px, rgba(201,168,106,0.16) 0.7px, transparent 0.7px, transparent 4.5px)`,
          }}
        />
        <Icon size={Math.round(size * 0.3)} style={{ color: ink }} className="relative" />
        {value && (
          <span
            className="relative mt-0.5 text-[13px] font-bold leading-none"
            style={{ color: ink, ...num }}
          >
            {value}
          </span>
        )}
        {caption && (
          <span
            className="relative mt-1 text-[7.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.creamFaint, ...bodyF }}
          >
            {caption}
          </span>
        )}
      </span>
    </span>
  );
}

// — Muntlijn-sparkline: fijne gouden curve met eindmunt —
function CoinLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
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
        <linearGradient id={`coin-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#coin-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={C.greenInk} stroke={tone} strokeWidth="1.4" />
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.gold : value >= 85 ? C.slate : C.creamMute;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: "rgba(243,236,218,0.12)" }}
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

export function Concept416() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{
        ...bodyF,
        color: C.cream,
        background: `radial-gradient(130% 85% at 22% -10%, ${C.panelHi} 0%, ${C.green} 55%, ${C.greenInk} 100%)`,
      }}
    >
      <GuillochePattern intensity={0.6} />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
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
          className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full"
          style={{
            background: `repeating-conic-gradient(${C.gold} 0deg 5deg, ${C.goldDeep} 5deg 10deg)`,
            padding: 2.5,
          }}
          aria-hidden="true"
        >
          <span
            className="flex h-full w-full items-center justify-center rounded-full"
            style={{ background: C.greenDeep, border: `1px solid ${C.gold}`, color: C.goldHi }}
          >
            <Coins size={18} />
          </span>
        </span>
        <div>
          <p
            className="text-[24px] font-semibold leading-none tracking-[0.01em]"
            style={{ color: C.cream, ...display }}
          >
            Muntslag
          </p>
          <p className="mt-1 text-[11px] leading-none" style={{ color: C.creamFaint, ...bodyF }}>
            {PROFIEL.plaats} · waardevast &amp; verifieerbaar
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.goldHi,
            border: `1px solid ${C.gold}`,
            background: C.goldWash,
            ...bodyF,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.greenDeep, border: `1px solid ${C.line}`, color: C.creamMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.gold, color: C.greenInk, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[15px] font-semibold" style={{ color: C.cream, ...bodyF }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.creamFaint, ...bodyF }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{
            background: C.greenDeep,
            border: `1px solid ${C.gold}`,
            color: C.goldHi,
            ...num,
          }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-lg p-1.5"
        style={{ background: C.greenDeep, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f18] motion-reduce:transition-none"
              style={{
                color: on ? C.greenInk : C.creamMute,
                background: on ? C.gold : "transparent",
                ...bodyF,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// — Skeleton: geslagen-plaat laadstaat voor de KPI-strook —
function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Panel key={i} className="p-4">
          <div className="animate-pulse motion-reduce:animate-none">
            <div className="h-2.5 w-24 rounded-full" style={{ background: C.raise }} />
            <div className="mt-3 h-7 w-20 rounded-md" style={{ background: C.raiseHi }} />
            <div className="mt-4 h-[30px] w-full rounded-md" style={{ background: C.raise }} />
          </div>
        </Panel>
      ))}
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const [loading, setLoading] = useState(true);
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 620);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-6 md:p-8" raised pattern>
          <Relief />
          <div className="relative">
            <Eyebrow>Vandaag · geslagen &amp; gewaarmerkt</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h1
                className="text-[36px] font-semibold leading-[1.02] tracking-[0.01em] md:text-[48px]"
                style={{ color: C.cream, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <Stamp
                size={30}
                aria-hidden="true"
                style={{ color: C.goldDeep }}
                className="hidden sm:block"
              />
            </div>
            <p
              className="mt-3 max-w-md text-[13.5px] leading-relaxed"
              style={{ color: C.creamMute }}
            >
              Jouw praktijk als waardevast bezit: elk certificaat geslagen en gewaarmerkt, elke
              factuur geboekt. Werk van boven naar beneden en houd je vertrouwensmerk hoog.
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
              <GhostButton onClick={onOpen}>Naar de marktplaats</GhostButton>
            </div>
          </div>
        </Panel>

        <Panel className="p-6" pattern>
          <div className="relative flex items-center justify-between">
            <Eyebrow tone={C.copperInk}>Vraagt aandacht</Eyebrow>
            <Fingerprint size={20} aria-hidden="true" style={{ color: C.goldDeep }} />
          </div>
          <h2
            className="relative mt-4 text-[23px] font-semibold leading-snug"
            style={{ color: C.cream, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="relative mt-2 text-[13px] leading-relaxed" style={{ color: C.creamMute }}>
            {primair.detail}
          </p>
          <div className="relative mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="relative mt-4 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p className="text-[11.5px]" style={{ color: C.creamFaint, ...num }}>
              {verified}/{CREDENTIALS.length} certificaten gewaarmerkt · {ongelezen} ongelezen
              berichten
            </p>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Het muntkabinet · deze maand</Eyebrow>
        </div>
        {loading ? (
          <>
            <KpiSkeleton />
            <p className="sr-only" role="status">
              Kerncijfers worden geladen.
            </p>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPIS.map((k, i) => (
              <Panel key={k.label} className="p-4" pattern>
                <div className="relative flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.creamMute, ...bodyF }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={{
                      color: k.up ? C.okInk : C.copperInk,
                      background: k.up ? C.okWash : C.copperWash,
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
                  className="relative mt-2.5 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ color: C.cream, ...num }}
                >
                  {k.value}
                </p>
                <div className="relative mt-3">
                  <CoinLine data={k.spark} tone={k.up ? C.gold : C.copper} id={`kpi-${i}`} />
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Uitgelicht · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e2b22]"
              style={{ color: C.gold, ...bodyF }}
            >
              Alle opdrachten →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#16402f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a86a] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        background: C.greenDeep,
                        border: `1px solid ${i === 0 ? C.gold : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.goldHi : C.creamMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.cream, ...bodyF }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.creamMute }}
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
                        style={{ color: C.creamFaint }}
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
            <Eyebrow>Recente berichten</Eyebrow>
          </div>
          <Panel className="p-4">
            <ul className="space-y-1">
              {BERICHTEN.map((b, i) => (
                <li
                  key={b.van}
                  className="flex items-start gap-3 py-2"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      background: C.greenDeep,
                      border: `1px solid ${b.ongelezen ? C.gold : C.line}`,
                      color: b.ongelezen ? C.goldHi : C.creamMute,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[12.5px] font-semibold"
                        style={{ color: C.cream }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[10.5px]"
                        style={{ color: C.creamFaint, ...num }}
                      >
                        {b.tijd}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.creamMute }}
                    >
                      {b.preview}
                    </span>
                  </span>
                  {b.ongelezen && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: C.gold }}
                    >
                      <span className="sr-only">ongelezen</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Marktplaats · open opdrachten</Eyebrow>
        <h1
          className="mt-3 text-[34px] font-semibold leading-none tracking-[0.01em]"
          style={{ color: C.cream, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ color: C.creamMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten getoond
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-4 py-3"
          style={{ background: C.greenDeep, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.creamFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#7f7960]"
            style={{ color: C.cream, ...bodyF }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel raised pattern>
          <Relief />
          <div className="relative flex flex-col items-center px-6 py-16 text-center">
            <Seal size={80} Icon={Search} caption="leeg" />
            <p className="mt-5 text-[24px] font-semibold" style={{ color: C.cream, ...display }}>
              Geen munt geslagen
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.creamMute }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer uit
              de collectie te zien.
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
  const tone = strong ? C.gold : C.slate;
  const toneInk = strong ? C.goldHi : C.slateInk;
  return (
    <Panel className="p-5" raised={strong} pattern={strong}>
      {strong && <Relief />}
      <div className="relative grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.creamMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.creamMute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[21px] font-semibold leading-snug"
            style={{ color: C.cream, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.creamMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.creamSoft,
                  background: C.raise,
                  border: `1px solid ${C.lineSoft}`,
                  ...bodyF,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Seal
            size={58}
            Icon={Award}
            tone={tone}
            ink={toneInk}
            value={String(opdracht.match)}
            caption="match"
          />
          <span className="text-[13px] font-bold" style={{ color: toneInk, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#123529] motion-reduce:transition-none"
          style={{ color: C.goldHi, border: `1px solid ${C.line}`, ...bodyF }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
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
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.copperInk}
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
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: C.greenDeep, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...bodyF }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px]"
            style={{ color: C.creamSoft }}
          >
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
  const tone = strong ? C.gold : C.slate;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e2b22]"
        style={{ color: C.creamSoft, border: `1px solid ${C.line}`, ...bodyF }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de marktplaats
      </button>

      <Panel className="p-6 md:p-8" raised pattern>
        <Relief />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.creamMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: C.greenInk, background: tone, ...bodyF }}
          >
            <Award size={11} aria-hidden="true" /> {strong ? "Topmatch" : "Uitgelicht"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[34px] font-semibold leading-[1.04] tracking-[0.01em] md:text-[48px]"
          style={{ color: C.cream, ...display }}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[14px]" style={{ color: C.creamMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageren <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel>
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
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.creamMute, ...bodyF }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.cream, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Waarom deze match</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.creamMute }}>
          Transparant afgelezen van je geverifieerde profiel — wat in je voordeel telt én waar je op
          moet letten, zonder verborgen weging.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
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
                  style={{ color: C.creamSoft }}
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
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  color: C.copperInk,
                  background: C.copperWash,
                  border: `1px solid ${C.copper}`,
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.copperInk, ...bodyF }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.creamSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.copperInk }}
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
      <Panel className="p-6 md:p-8" raised pattern>
        <Relief />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · het gewaarmerkte zegel</Eyebrow>
            <h1
              className="mt-3 text-[32px] font-semibold leading-tight tracking-[0.01em]"
              style={{ color: C.cream, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.creamMute }}>
              <span className="font-semibold" style={{ color: C.cream }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geslagen en geverifieerd. Eén
              verloopt binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <Seal size={104} Icon={ShieldCheck} value={`${ratio}%`} caption="gewaarmerkt" />
        </div>
      </Panel>

      <section>
        <div className="mb-3">
          <Eyebrow>Geslagen certificaten</Eyebrow>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex flex-col items-center p-4 text-center">
                <Seal size={64} Icon={st.Icon} tone={st.tone} ink={st.ink} />
                <p
                  className="mt-3 line-clamp-2 text-[12.5px] font-semibold leading-snug"
                  style={{ color: C.cream }}
                >
                  {c.naam}
                </p>
                <span className="mt-2">
                  <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                    <st.Icon size={10} aria-hidden="true" />
                    {st.label}
                  </Chip>
                </span>
              </Panel>
            );
          })}
        </div>
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-5 py-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.creamMute, ...bodyF }}
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#16402f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a86a] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.cream, ...bodyF }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.creamMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.creamFaint,
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
                        className="rounded-lg p-4"
                        style={{ background: C.greenDeep, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="flex items-start gap-2 text-[13px] leading-relaxed"
                          style={{ color: C.creamSoft }}
                        >
                          <Lock
                            size={13}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0"
                            style={{ color: C.gold }}
                          />
                          <span className="max-w-xl">
                            {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                            expliciete toestemming gedeeld met een opdrachtgever.
                          </span>
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

      <section>
        <div className="mb-3">
          <Eyebrow>Gewaarmerkte documenten</Eyebrow>
        </div>
        <Panel>
          <ul>
            {DOCUMENTEN.map((d, i) => {
              const st = statusMeta(d.status);
              return (
                <li
                  key={d.naam}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{
                      background: C.greenDeep,
                      border: `1px solid ${C.line}`,
                      color: C.gold,
                    }}
                    aria-hidden="true"
                  >
                    <FileText size={15} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[13.5px] font-semibold"
                      style={{ color: C.cream }}
                    >
                      {d.naam}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: C.creamMute, ...num }}
                    >
                      {d.type} · {d.grootte} · bijgewerkt {d.bijgewerkt}
                    </span>
                  </span>
                  <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                  </Chip>
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · volgende slag</Eyebrow>
        <h1
          className="mt-3 text-[34px] font-semibold leading-none tracking-[0.01em]"
          style={{ color: C.cream, ...display }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.creamMute }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.copper : C.gold;
          const ink = warn ? C.copperInk : C.goldHi;
          const wash = warn ? C.copperWash : C.goldWash;
          return (
            <li key={a.titel}>
              <Panel className="p-5" raised={warn} pattern={warn}>
                {warn && <Relief />}
                <div className="relative grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold"
                    style={{
                      background: C.greenDeep,
                      border: `1.5px solid ${tone}`,
                      color: ink,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: ink,
                        background: wash,
                        border: `1px solid ${tone}`,
                        ...bodyF,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Award size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[20px] font-semibold leading-snug"
                      style={{ color: C.cream, ...display }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.creamMute }}
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
  Icon: LucideIcon;
} {
  if (status === "Openstaand")
    return { ink: C.copperInk, wash: C.copperWash, tone: C.copper, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.creamMute, wash: C.raise, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · het grootboek</Eyebrow>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[0.01em]"
            style={{ color: C.cream, ...display }}
          >
            Facturen
          </h1>
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
          <Panel key={s.l} className="p-5" pattern>
            <div className="relative flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.creamMute, ...bodyF }}
              >
                {s.l}
              </p>
              {s.alarm ? (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.copperWash, color: C.copperInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              ) : (
                <Coins size={15} aria-hidden="true" style={{ color: C.goldDeep }} />
              )}
            </div>
            <p
              className="relative mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.copperInk : C.cream, ...num }}
            >
              {s.v}
            </p>
            <p className="relative mt-1 text-[11.5px]" style={{ color: C.creamMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-5 pb-3 pt-4 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.creamMute, ...bodyF }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#16402f] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.creamMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.cream, ...bodyF }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.creamMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...bodyF,
                    }}
                  >
                    <ft.Icon size={11} aria-hidden="true" />
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.copperInk : C.cream, ...num }}
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
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.creamMute, ...bodyF }}
          >
            <Coins size={12} aria-hidden="true" style={{ color: C.gold }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.cream, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
