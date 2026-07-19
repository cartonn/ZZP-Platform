"use client";

// Concept 417 — "Kelder" · Wijnkelder / archief-kluis, warm-donker.
// Een gewelfde archiefkelder onder de stad: diep espresso-eiken, koperen labels, houtnerf-
// hairlines en gewelf-bogen (afgeronde bovenranden). Documenten en certificaten liggen als
// flessen in een rek en dossiers in een nis — warm, betrouwbaar, tijdloos-premium. Alles wat
// telt rust in het amberlicht van een kaars; de rest ligt in de koele schaduw van het gewelf.
// Palet: espresso #1c140e, crème #eee3d0, cognac/amber #c8842e, diep bordeaux #6e2436.
// Fonts: Fraunces (display, serif) + Inter-gevoel (body), tabulaire cijfers.

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
  Wine,
  Grape,
  Archive,
  Boxes,
  KeyRound,
  Landmark,
  Droplet,
  FileText,
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

// — Palet: espresso-eiken, crème, cognac/amber, koper en diep bordeaux —
const C = {
  bg: "#1c140e",
  bgDeep: "#140e08",
  bgWell: "#221810",
  panel: "#241a11",
  panelHi: "#2c2013",
  raise: "#33261a",
  raiseHi: "#3d2e1e",
  wood: "#3a2a1a",
  cream: "#eee3d0",
  creamSoft: "#dccaa8",
  creamMute: "#b39c78",
  creamFaint: "#8a765a",
  amber: "#c8842e",
  amberHi: "#e3a44e",
  amberDeep: "#9a6320",
  amberWash: "rgba(200,132,46,0.14)",
  copper: "#b87333",
  copperHi: "#d29357",
  line: "rgba(200,132,46,0.22)",
  lineSoft: "rgba(238,227,208,0.09)",
  woodline: "rgba(120,86,52,0.34)",
  ok: "#7f9450",
  okInk: "#c6d698",
  okWash: "rgba(127,148,80,0.16)",
  info: "#7d8494",
  infoInk: "#bcc4d2",
  infoWash: "rgba(125,132,148,0.16)",
  warn: "#d1972f",
  warnInk: "#ecbb64",
  warnWash: "rgba(209,151,47,0.16)",
  bad: "#a33b50",
  badInk: "#e79aa6",
  badWash: "rgba(110,36,54,0.32)",
};

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
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Houtnerf-hairline: fijne koperlijn met warme glans —
function GrainRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${C.woodline} 12%, ${C.line} 50%, ${C.woodline} 88%, transparent)`,
      }}
    />
  );
}

// — Nis: een gewelfde archiefnis met afgeronde bovenrand en koperlijst —
function Niche({
  children,
  className = "",
  as: Tag = "div",
  lit = false,
  arch = true,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  lit?: boolean;
  arch?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden ${arch ? "rounded-[20px] rounded-t-[30px]" : "rounded-[16px]"} ${className}`}
      style={{
        background: lit
          ? `radial-gradient(130% 100% at 26% -6%, ${C.panelHi} 0%, ${C.panel} 52%, ${C.bgWell} 100%)`
          : C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: lit
          ? "inset 0 1px 0 rgba(238,227,208,0.06), 0 24px 54px rgba(0,0,0,0.5)"
          : "inset 0 1px 0 rgba(238,227,208,0.04), 0 16px 36px rgba(0,0,0,0.42)",
        color: C.cream,
      }}
    >
      {children}
    </Tag>
  );
}

// — Kaarslicht: warme amber-gloed die op de kern-content valt —
function CandleGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(58% 66% at 26% -10%, rgba(227,164,78,0.16) 0%, rgba(200,132,46,0.06) 42%, transparent 72%)",
      }}
    />
  );
}

function Eyebrow({ children, tone = C.amber }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.26em]"
      style={{ color: tone, ...bodyF }}
    >
      <span aria-hidden="true" style={{ color: tone }}>
        ⌂
      </span>
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

// — Koperlabel: gegraveerd metalen plaatje zoals op een wijnvak —
function CopperLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{
        color: C.bg,
        background: `linear-gradient(150deg, ${C.copperHi}, ${C.copper})`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 1px 2px rgba(0,0,0,0.4)`,
        ...num,
      }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[11px] px-5 py-2.5 text-[13.5px] font-bold transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3a44e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c140e] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.bgDeep,
        background: `linear-gradient(158deg, ${C.amberHi}, ${C.amber})`,
        boxShadow: `0 2px 0 ${C.amberDeep}, 0 10px 22px rgba(0,0,0,0.46)`,
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
      className={`inline-flex items-center justify-center gap-2 rounded-[11px] px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8842e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c140e] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.bgDeep : C.creamSoft,
        background: active ? C.amber : "transparent",
        border: `1px solid ${active ? C.amber : C.line}`,
        ...bodyF,
      }}
    >
      {children}
    </button>
  );
}

// — Sediment-sparkline: warme amber-curve met bezinklaag —
function SedimentLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
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
        <linearGradient id={`sed-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.32" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#sed-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={tone} />
    </svg>
  );
}

// — Vulniveau-meter: match als vloeistof in een flessenhals —
function FillMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.amber : value >= 85 ? C.copperHi : C.creamMute;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: "rgba(238,227,208,0.12)" }}
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

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Landmark,
  marktplaats: Grape,
  opdracht: Wine,
  verificatie: KeyRound,
  documenten: Archive,
  facturen: Boxes,
  berichten: Bell,
  acties: Droplet,
};

export function Concept417() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const title = SCREENS.find((s) => s.key === screen)?.label ?? "Dashboard";

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        ...bodyF,
        color: C.cream,
        background: `radial-gradient(140% 90% at 20% -12%, ${C.bgWell} 0%, ${C.bg} 52%, ${C.bgDeep} 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-6xl gap-0 px-3 pb-24 sm:px-5 md:gap-6 md:px-8">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar title={title} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main className="pt-6">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onActies={() => setScreen("acties")}
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
        </div>
      </div>
    </div>
  );
}

// — Zijrek: verticale nis-navigatie langs de kelderwand (desktop) —
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <aside
      className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[220px] shrink-0 flex-col py-6 md:flex"
      aria-label="Hoofdnavigatie"
    >
      <div className="flex items-center gap-3 px-2">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] rounded-t-[16px]"
          style={{ background: C.wood, border: `1px solid ${C.amber}`, color: C.amberHi }}
          aria-hidden="true"
        >
          <Landmark size={19} />
        </span>
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[0.01em]"
            style={{ color: C.cream, ...display }}
          >
            Kelder
          </p>
          <p className="mt-1 text-[10.5px] leading-none" style={{ color: C.creamFaint, ...bodyF }}>
            archiefkluis
          </p>
        </div>
      </div>

      <GrainRule className="mx-1 mt-5" />

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const Icon = NAV_ICONS[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[13.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8842e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c140e] motion-reduce:transition-none"
              style={{
                color: on ? C.cream : C.creamMute,
                background: on ? C.raise : "transparent",
                border: `1px solid ${on ? C.line : "transparent"}`,
              }}
            >
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-[8px]"
                style={{
                  color: on ? C.amberHi : C.creamFaint,
                  background: on ? C.amberWash : "transparent",
                }}
                aria-hidden="true"
              >
                <Icon size={15} />
              </span>
              {s.label}
              {on && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <GrainRule className="mx-1 mb-4" />
      <div
        className="flex items-center gap-3 rounded-[13px] px-3 py-2.5"
        style={{ background: C.bgWell, border: `1px solid ${C.woodline}` }}
      >
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[12px] font-semibold"
          style={{ background: C.wood, border: `1px solid ${C.amber}`, color: C.amberHi, ...bodyF }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold" style={{ color: C.cream }}>
            {PROFIEL.naam}
          </span>
          <span className="block truncate text-[10.5px]" style={{ color: C.creamFaint }}>
            {PROFIEL.rol}
          </span>
        </span>
      </div>
    </aside>
  );
}

function TopBar({ title }: { title: string }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="min-w-0">
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.26em]"
          style={{ color: C.amber, ...bodyF }}
        >
          Het gewelf
        </p>
        <h1
          className="mt-1 truncate text-[26px] font-semibold leading-none tracking-[0.01em] sm:text-[30px]"
          style={{ color: C.cream, ...display }}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...bodyF }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.bgWell, border: `1px solid ${C.line}`, color: C.creamMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.amber, color: C.bgDeep, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-[13px] font-semibold md:hidden"
          style={{ background: C.wood, border: `1px solid ${C.amber}`, color: C.amberHi, ...bodyF }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

// — Mobiele nav: horizontale scroll van nis-knoppen (onder md) —
function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav aria-label="Hoofdnavigatie (mobiel)" className="mt-5 md:hidden">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-[13px] p-1.5"
        style={{ background: C.bgWell, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const Icon = NAV_ICONS[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8842e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c140e] motion-reduce:transition-none"
              style={{
                color: on ? C.bgDeep : C.creamMute,
                background: on ? C.amber : "transparent",
                ...bodyF,
              }}
            >
              <Icon size={14} aria-hidden="true" />
              {s.label}
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
  const [laden, setLaden] = useState(false);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Niche className="p-6 md:p-8" lit>
          <CandleGlow />
          <div className="relative">
            <Eyebrow>Vandaag · in het amberlicht</Eyebrow>
            <div className="mt-4 flex items-start justify-between gap-4">
              <h2
                className="text-[34px] font-semibold leading-[1.02] tracking-[0.01em] md:text-[46px]"
                style={{ color: C.cream, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h2>
              <Wine
                size={30}
                aria-hidden="true"
                style={{ color: C.amberDeep }}
                className="hidden sm:block"
              />
            </div>
            <p
              className="mt-3 max-w-md text-[13.5px] leading-relaxed"
              style={{ color: C.creamMute }}
            >
              Wat rijp is staat vooraan in het rek, verifieerbaar en betaald. De rest rust nog in de
              koele schaduw van het gewelf. Werk van boven naar beneden en houd je archief op orde.
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
              <GhostButton onClick={() => setLaden((v) => !v)} ariaPressed={laden}>
                {laden ? "Stop verversen" : "Rek verversen"}
              </GhostButton>
            </div>
          </div>
        </Niche>

        <Niche className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <Droplet size={20} aria-hidden="true" style={{ color: C.amberDeep }} />
          </div>
          <h3
            className="mt-4 text-[22px] font-semibold leading-snug"
            style={{ color: C.cream, ...display }}
          >
            {primair.titel}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.creamMute }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <GrainRule className="mt-4" />
          <p className="mt-3 text-[11.5px]" style={{ color: C.creamFaint, ...num }}>
            {verified}/{CREDENTIALS.length} certificaten verzegeld · 7 open reacties
          </p>
        </Niche>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow>Het grootboek · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {laden
            ? Array.from({ length: 4 }).map((_, i) => (
                <Niche key={`sk-${i}`} className="p-4" arch={false}>
                  <div
                    className="h-3 w-24 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.raise }}
                  />
                  <div
                    className="mt-3 h-7 w-20 animate-pulse rounded-md motion-reduce:animate-none"
                    style={{ background: C.raise }}
                  />
                  <div
                    className="mt-3 h-6 w-full animate-pulse rounded-md motion-reduce:animate-none"
                    style={{ background: C.raise }}
                  />
                  <span className="sr-only">Laden…</span>
                </Niche>
              ))
            : KPIS.map((k, i) => (
                <Niche key={k.label} className="p-4" arch={false}>
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: C.creamMute, ...bodyF }}
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
                      {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                    </span>
                  </div>
                  <p
                    className="mt-2.5 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                    style={{ color: C.cream, ...num }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-3">
                    <SedimentLine data={k.spark} tone={k.up ? C.amber : C.warn} id={`kpi-${i}`} />
                  </div>
                </Niche>
              ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Het rek · open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8842e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c140e]"
              style={{ color: C.amber, ...bodyF }}
            >
              Hele rek →
            </button>
          </div>
          <Niche>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id}>
                  {i > 0 && <GrainRule />}
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#2c2013] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c8842e] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[9px] rounded-t-[12px]"
                      style={{
                        background: C.wood,
                        border: `1px solid ${i === 0 ? C.amber : C.line}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.amberHi : C.creamMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.cream, ...display }}
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
                      <FillMeter value={o.match} />
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
          </Niche>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow>Verzegelde certificaten</Eyebrow>
          </div>
          <Niche className="p-4">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li key={c.naam}>
                    {i > 0 && <GrainRule className="my-1" />}
                    <div className="flex items-center gap-3 py-2">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[9px]"
                        style={{
                          color: st.ink,
                          background: st.wash,
                          border: `1px solid ${st.tone}`,
                        }}
                        aria-hidden="true"
                      >
                        <st.Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[12.5px] font-semibold"
                          style={{ color: C.cream }}
                        >
                          {c.naam}
                        </span>
                        <span
                          className="block truncate text-[10.5px]"
                          style={{ color: C.creamMute }}
                        >
                          {st.label}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Niche>
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
        <Eyebrow>Het rek · open opdrachten</Eyebrow>
        <h2
          className="mt-3 text-[32px] font-semibold leading-none tracking-[0.01em]"
          style={{ color: C.cream, ...display }}
        >
          De collectie
        </h2>
        <p className="mt-2 text-[12.5px]" style={{ color: C.creamMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} flessen in het rek
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[13px] px-4 py-3"
          style={{ background: C.bgWell, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.creamFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8a765a]"
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
        <Niche lit>
          <CandleGlow />
          <div className="relative flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.amberWash, border: `1px solid ${C.amber}`, color: C.amberHi }}
              aria-hidden="true"
            >
              <Grape size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.cream, ...display }}>
              Leeg vak
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.creamMute }}>
              Geen fles past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer uit de
              kelder te halen.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Niche>
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
  const tone = strong ? C.amber : C.copperHi;
  const toneInk = strong ? C.amberHi : C.copperHi;
  const jaar = 2019 + (index % 5);
  return (
    <Niche className="p-5" lit={strong}>
      {strong && <CandleGlow />}
      <div className="relative grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CopperLabel>
              Vak {String(index + 1).padStart(2, "0")} · {jaar}
            </CopperLabel>
            <span className="text-[11px] font-semibold" style={{ color: C.creamMute, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
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
                  border: `1px solid ${C.woodline}`,
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
            className="inline-flex h-14 w-14 flex-col items-center justify-center rounded-[11px] rounded-t-[16px]"
            style={{ background: C.wood, border: `1.5px solid ${tone}` }}
          >
            <span className="text-[16px] font-bold leading-none" style={{ color: toneInk, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.creamFaint, ...bodyF }}
            >
              match
            </span>
          </span>
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
          className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8842e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241a11]"
          style={{ color: C.amberHi, border: `1px solid ${C.line}`, ...bodyF }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Proefnotitie
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
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Niche>
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
      className="rounded-[12px] p-4"
      style={{ background: C.bgWell, border: `1px solid ${C.woodline}` }}
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
  const tone = strong ? C.amber : C.copperHi;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[11px] px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8842e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c140e]"
        style={{ color: C.creamSoft, border: `1px solid ${C.line}`, ...bodyF }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de collectie
      </button>

      <Niche className="p-6 md:p-8" lit>
        <CandleGlow />
        <div className="relative flex flex-wrap items-center gap-2">
          <CopperLabel>{opdracht.id}</CopperLabel>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ color: C.bgDeep, background: tone, ...bodyF }}
          >
            <Wine size={11} aria-hidden="true" /> {strong ? "Grand cru" : "Uitgelicht"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h2
          className="relative mt-4 max-w-2xl text-[32px] font-semibold leading-[1.04] tracking-[0.01em] md:text-[46px]"
          style={{ color: C.cream, ...display }}
        >
          {opdracht.titel}
        </h2>
        <p className="relative mt-2 text-[14px]" style={{ color: C.creamMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Leggen in het rek</GhostButton>
        </div>
      </Niche>

      <Niche arch={false}>
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
      </Niche>

      <section>
        <Eyebrow>Proefnotitie · waarom deze match</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.creamMute }}>
          Transparant afgelezen van je verzegelde profiel — wat in je voordeel telt én waar je op
          moet letten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Niche className="p-5" arch={false}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[9px]"
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
          </Niche>
          <Niche className="p-5" arch={false}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-[9px]"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
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
                  style={{ color: C.creamSoft }}
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
          </Niche>
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
      <Niche className="p-6 md:p-8" lit>
        <CandleGlow />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · de verzegelde kluis</Eyebrow>
            <h2
              className="mt-3 text-[30px] font-semibold leading-tight tracking-[0.01em]"
              style={{ color: C.cream, ...display }}
            >
              Jouw certificaten
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.creamMute }}>
              <span className="font-semibold" style={{ color: C.cream }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten liggen verzegeld in de kluis. Eén
              verloopt binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.wood, border: `1.5px solid ${C.amber}` }}
          >
            <span
              className="text-[26px] font-bold leading-none"
              style={{ color: C.amberHi, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.creamFaint, ...bodyF }}
            >
              % verzegeld
            </span>
          </span>
        </div>
      </Niche>

      <Niche>
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
              <li key={c.naam}>
                {idx > 0 && <GrainRule />}
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#2c2013] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c8842e] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px]"
                      style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.cream, ...display }}
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
                        className="rounded-[12px] p-4"
                        style={{ background: C.bgWell, border: `1px solid ${C.woodline}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.creamSoft }}
                        >
                          {c.detail}. Documenten liggen versleuteld in de kluis en worden alleen na
                          je expliciete toestemming aan een opdrachtgever getoond.
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
      </Niche>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · de volgende handeling</Eyebrow>
        <h2
          className="mt-3 text-[32px] font-semibold leading-none tracking-[0.01em]"
          style={{ color: C.cream, ...display }}
        >
          Wat nu aandacht vraagt
        </h2>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.creamMute }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.amber;
          const ink = warn ? C.warnInk : C.amberHi;
          const wash = warn ? C.warnWash : C.amberWash;
          return (
            <li key={a.titel}>
              <Niche className="p-5" lit={warn}>
                {warn && <CandleGlow />}
                <div className="relative grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[10px] rounded-t-[13px] text-[15px] font-bold"
                    style={{
                      background: C.wood,
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
                        <Wine size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h3
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.cream, ...display }}
                    >
                      {a.titel}
                    </h3>
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
              </Niche>
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
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.creamMute, wash: C.raise, tone: C.woodline, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen · het grootboek</Eyebrow>
          <h2
            className="mt-3 text-[32px] font-semibold leading-none tracking-[0.01em]"
            style={{ color: C.cream, ...display }}
          >
            Facturen
          </h2>
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
          <Niche key={s.l} className="p-5" arch={false}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.creamMute, ...bodyF }}
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
              style={{ color: s.alarm ? C.warnInk : C.cream, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.creamMute }}>
              {s.sub}
            </p>
          </Niche>
        ))}
      </section>

      <Niche>
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#2c2013] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
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
                  style={{ color: C.cream, ...display }}
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
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.cream, ...num }}
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
            <Boxes size={12} aria-hidden="true" style={{ color: C.amber }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.cream, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Niche>
    </div>
  );
}
