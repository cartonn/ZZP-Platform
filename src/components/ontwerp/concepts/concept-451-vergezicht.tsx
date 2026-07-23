"use client";

// Concept 451 — "Vergezicht" · Ruimtelijke diepte / spatial computing (trend 2026).
// Gelaagde doorschijnende dieptevlakken (frosted glass met echte z-hiërarchie), parallax bij
// muisbeweging, zachte diepte-schaduwen die afstand suggereren. Belangrijkheid = hoe "dichtbij"
// een element ligt: voorgrond is scherper, groter, met een sterkere schaduw; achtergrond zakt weg
// in zacht mistig glas. Koel neutraal glas over een zacht licht verloop met één koel-blauw accent.
// Diepte als informatie-architectuur. Animaties respecteren prefers-reduced-motion.

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  Minus,
  Plus,
  Search,
  ShieldCheck,
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

// — Palet: koel neutraal glas, zacht licht verloop, één koel-blauw accent —
const C = {
  // achtergrond-atmosfeer (licht, koel)
  sky: "#eef2f9",
  skyDeep: "#e4eaf5",
  // glasvlakken (semi-transparant wit met blauwe zweem)
  glassNear: "rgba(255,255,255,0.82)",
  glassMid: "rgba(255,255,255,0.66)",
  glassFar: "rgba(255,255,255,0.48)",
  glassTint: "rgba(238,243,252,0.7)",
  // randen
  edgeNear: "rgba(255,255,255,0.9)",
  line: "rgba(37,71,140,0.14)",
  lineSoft: "rgba(37,71,140,0.08)",
  hover: "rgba(47,107,255,0.06)",
  // accent koel-blauw
  accent: "#2f6bff",
  accentDeep: "#1e4fd6",
  accentSoft: "#6f9bff",
  accentWash: "rgba(47,107,255,0.1)",
  accentMist: "rgba(47,107,255,0.05)",
  // tekst (donker inkt op licht)
  ink: "#152036",
  inkSoft: "#41506c",
  inkMute: "#6c7a95",
  inkFaint: "#9aa6bd",
  // status
  ok: "#1a9d6e",
  okInk: "#0f7a54",
  okWash: "rgba(26,157,110,0.12)",
  warn: "#c8811a",
  warnInk: "#9a610d",
  warnWash: "rgba(200,129,26,0.14)",
  info: "#2f6bff",
  infoInk: "#1e4fd6",
  infoWash: "rgba(47,107,255,0.12)",
  bad: "#d24b47",
  badInk: "#a8322f",
  badWash: "rgba(210,75,71,0.12)",
};

const display = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  letterSpacing: "-0.02em",
};
const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Zacht licht verloop dat diepte suggereert: koele hemel bovenaan, iets warmer laag, met twee
// wolkachtige gloeden die achter het glas doorschemeren.
function skyBg(): React.CSSProperties {
  return {
    backgroundColor: "#eef2f9",
    backgroundImage:
      "radial-gradient(120% 90% at 12% -10%, rgba(47,107,255,0.12), transparent 52%)," +
      "radial-gradient(90% 70% at 100% 8%, rgba(111,155,255,0.1), transparent 55%)," +
      "radial-gradient(120% 80% at 50% 120%, rgba(255,255,255,0.6), transparent 60%)," +
      "linear-gradient(180deg, #eef2f9, #e4eaf5)",
  };
}

// Diepte-schaluw per niveau: dichterbij = sterkere, wijdere schaduw + scherpere rand.
function depthShadow(depth: 1 | 2 | 3): string {
  switch (depth) {
    case 1:
      return "0 24px 60px -20px rgba(23,44,92,0.4), 0 8px 20px -8px rgba(23,44,92,0.2), inset 0 1px 0 rgba(255,255,255,0.9)";
    case 2:
      return "0 14px 34px -18px rgba(23,44,92,0.3), inset 0 1px 0 rgba(255,255,255,0.8)";
    case 3:
      return "0 6px 16px -12px rgba(23,44,92,0.22), inset 0 1px 0 rgba(255,255,255,0.6)";
  }
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

// — Glasvlak op een dieptelaag. depth 1 = voorgrond (dichtbij), 3 = ver weg (mistig) —
function Glass({
  children,
  className = "",
  as: Tag = "div",
  depth = 2,
  accent = false,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  depth?: 1 | 2 | 3;
  accent?: boolean;
  interactive?: boolean;
}) {
  const fill = accent
    ? "linear-gradient(160deg, rgba(47,107,255,0.16), rgba(255,255,255,0.72) 60%)"
    : depth === 1
      ? C.glassNear
      : depth === 2
        ? C.glassMid
        : C.glassFar;
  const blur = depth === 1 ? 22 : depth === 2 ? 16 : 10;
  return (
    <Tag
      className={`relative overflow-hidden rounded-[20px] ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: fill,
        border: `1px solid ${accent ? "rgba(47,107,255,0.32)" : depth === 1 ? C.edgeNear : C.line}`,
        boxShadow: depthShadow(depth),
        backdropFilter: `blur(${blur}px) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.accent }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: tone, ...bodyFont }}
    >
      <Layers size={11} aria-hidden="true" />
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
      style={{ color: ink, background: wash, border: `1px solid ${tone}44`, ...bodyFont }}
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f9] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.accentSoft}, ${C.accent})`,
        border: `1px solid ${C.accentDeep}`,
        boxShadow: "0 8px 20px -8px rgba(47,107,255,0.6), inset 0 1px 0 rgba(255,255,255,0.4)",
        ...bodyFont,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f9] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.accentDeep : C.inkSoft,
        background: active ? C.accentWash : "rgba(255,255,255,0.66)",
        border: `1px solid ${active ? C.accent + "66" : C.line}`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Diepte-sparkline: koele lijn met een zachte gloed die naar de voorgrond komt —
function Sparkline({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 9) - 4;
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
        <linearGradient id={`vg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#vg-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="#fff" stroke={tone} strokeWidth="1.8" />
    </svg>
  );
}

// — Diepte-meter: voortgangsstreek die dichterbij "vult" —
function Meter({ value, tone = C.accent }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: "rgba(37,71,140,0.1)" }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${tone}99, ${tone})`,
            boxShadow: `0 0 10px ${tone}66`,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

// Ronde diepte-badge met matchscore; ligt "op" het glas als een zwevende schijf.
function DepthOrb({ value, label, size = 128 }: { value: string; label: string; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 flex-col items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 38% 32%, #ffffff, rgba(238,243,252,0.7))",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow:
          "0 20px 40px -14px rgba(23,44,92,0.4), inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -8px 18px rgba(47,107,255,0.14)",
      }}
      aria-hidden="true"
    >
      <span
        className="text-[26px] font-semibold leading-none"
        style={{ color: C.accentDeep, ...num }}
      >
        {value}
      </span>
      <span
        className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: C.inkMute, ...bodyFont }}
      >
        {label}
      </span>
    </span>
  );
}

export function Concept451() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  // Parallax-diepte: muispositie stuurt hoe ver de decoratieve dieptevlakken verschuiven.
  const [par, setPar] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  function onMove(e: React.MouseEvent) {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setPar({ x: nx, y: ny });
  }

  return (
    <div
      ref={stageRef}
      onMouseMove={onMove}
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...bodyFont, color: C.ink, ...skyBg() }}
    >
      <style>{`
        @keyframes vgRise { from { opacity: 0; transform: translateY(14px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .vg-rise { animation: vgRise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes vgFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .vg-float { animation: vgFloat 9s ease-in-out infinite; }
        @keyframes vgFloatSlow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
        .vg-float-slow { animation: vgFloatSlow 13s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .vg-rise, .vg-float, .vg-float-slow { animation: none !important; }
        }
      `}</style>

      {/* Decoratieve dieptevlakken — verschuiven met de muis (parallax). Verste laag beweegt het
          minst, dichtstbijzijnde het meest, zodat afstand voelbaar wordt. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="vg-float-slow absolute -left-24 top-10 h-72 w-72 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(47,107,255,0.16), transparent 68%)",
            filter: "blur(8px)",
            transform: `translate(${par.x * 14}px, ${par.y * 14}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        <div
          className="vg-float absolute -right-16 top-40 h-96 w-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(111,155,255,0.14), transparent 66%)",
            filter: "blur(10px)",
            transform: `translate(${par.x * 28}px, ${par.y * 22}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)",
            filter: "blur(12px)",
            transform: `translate(${par.x * 40}px, ${par.y * 30}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="vg-rise pt-7">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(160deg, #ffffff, rgba(238,243,252,0.7))",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 10px 22px -10px rgba(23,44,92,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
          aria-hidden="true"
        >
          <Layers size={18} style={{ color: C.accent }} />
        </span>
        <div>
          <p
            className="text-[20px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
          >
            Vergezicht
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.plaats} · dichtbij is belangrijk
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{
            color: C.okInk,
            border: `1px solid ${C.ok}44`,
            background: C.okWash,
            ...bodyFont,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: `1px solid ${C.line}`,
            color: C.inkMute,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.accent, boxShadow: "0 0 8px rgba(47,107,255,0.6)", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{
            background: "radial-gradient(circle at 38% 32%, #ffffff, rgba(238,243,252,0.7))",
            border: "1px solid rgba(255,255,255,0.9)",
            color: C.accentDeep,
            boxShadow: "0 10px 22px -10px rgba(23,44,92,0.4)",
            ...bodyFont,
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{
          background: "rgba(255,255,255,0.6)",
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 10px 30px -18px rgba(23,44,92,0.4)",
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f9] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.inkMute,
                background: on
                  ? `linear-gradient(180deg, ${C.accentSoft}, ${C.accent})`
                  : "transparent",
                boxShadow: on ? "0 8px 18px -8px rgba(47,107,255,0.6)" : "none",
                ...bodyFont,
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

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Voorgrond: het dichtstbijzijnde, scherpste, grootste vlak — de belangrijkste zaak. */}
        <Glass className="p-7 md:p-9" depth={1} accent>
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <Eyebrow>Vooraan · vandaag</Eyebrow>
              <h1
                className="mt-4 text-[32px] font-semibold leading-[1.06] md:text-[42px]"
                style={{ color: C.ink, ...display }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                Wat het dichtst bij ligt, telt het zwaarst. Je volgende actie staat vooraan; de rest
                zakt zacht terug in de diepte tot het aan de beurt is.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <PrimaryButton onClick={onActies}>
                  Volgende actie
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </PrimaryButton>
                <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
              </div>
            </div>
            <DepthOrb value={`${ratio}%`} label="op orde" size={140} />
          </div>
        </Glass>

        {/* Middenlaag: vraagt aandacht, iets verder weg dan de hero maar dichterbij dan de rest. */}
        <Glass className="p-7" depth={2}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2
            className="mt-4 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
              <Check size={13} aria-hidden="true" style={{ color: C.ok }} />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Glass>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow>Kerncijfers · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Glass key={k.label} className="p-5" depth={2} interactive>
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...bodyFont }}
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
                className="mt-3 text-[27px] font-semibold leading-none"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Sparkline data={k.spark} tone={k.up ? C.accent : C.warn} id={`k451-${i}`} />
              </div>
            </Glass>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f9]"
              style={{ color: C.accent, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <Glass depth={2}>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[rgba(47,107,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6bff] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                      style={{
                        background:
                          i === 0
                            ? "radial-gradient(circle at 38% 32%, #ffffff, rgba(238,243,252,0.8))"
                            : "rgba(255,255,255,0.6)",
                        border: `1px solid ${i === 0 ? "rgba(255,255,255,0.9)" : C.line}`,
                        boxShadow: i === 0 ? "0 8px 18px -10px rgba(23,44,92,0.4)" : "none",
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.accentDeep : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...bodyFont }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Meter value={o.match} tone={o.match >= 90 ? C.accent : C.warn} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Glass>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <Glass className="p-5" depth={3}>
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        background: st.wash,
                        border: `1px solid ${st.tone}44`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
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
          </Glass>
        </div>
      </section>
    </div>
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

  return (
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{
            background: "rgba(255,255,255,0.72)",
            border: `1px solid ${C.line}`,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa6bd]"
            style={{ color: C.ink, ...bodyFont }}
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
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Glass className="p-6" depth={3}>
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div
                    className="h-3 w-24 rounded-full"
                    style={{ background: "rgba(37,71,140,0.12)" }}
                  />
                  <div
                    className="h-5 w-2/3 rounded-full"
                    style={{ background: "rgba(37,71,140,0.16)" }}
                  />
                  <div
                    className="h-3 w-1/2 rounded-full"
                    style={{ background: "rgba(37,71,140,0.1)" }}
                  />
                  <div
                    className="h-2 w-full rounded-full"
                    style={{ background: "rgba(37,71,140,0.08)" }}
                  />
                </div>
              </Glass>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Glass className="p-6" depth={2}>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "radial-gradient(circle at 38% 32%, #ffffff, rgba(238,243,252,0.7))",
                border: "1px solid rgba(255,255,255,0.9)",
                color: C.accent,
                boxShadow: "0 16px 34px -14px rgba(23,44,92,0.4)",
              }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...display }}>
              Leeg vergezicht
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en de horizon
              vult zich weer.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Glass>
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
  const tone = strong ? C.accent : C.warn;
  // Dichtstbijzijnde kaart (sterkste match) ligt op de voorgrond, de rest iets verder.
  const depth: 1 | 2 | 3 = strong ? 1 : 2;
  return (
    <Glass className="p-6" depth={depth} interactive>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...display }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: "rgba(255,255,255,0.6)",
                  border: `1px solid ${C.lineSoft}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <DepthOrb value={`${opdracht.match}`} label="match" size={68} />
          <span className="text-[13px] font-bold" style={{ color: tone, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f9]"
          style={{ color: C.accentDeep, border: `1px solid ${C.line}`, ...bodyFont }}
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
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.okInk} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Glass>
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
      className="rounded-[14px] p-4"
      style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...bodyFont }}
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
  const tone = strong ? C.accent : C.warn;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef2f9]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          background: "rgba(255,255,255,0.66)",
          ...bodyFont,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Glass className="p-7 md:p-9" depth={1} accent>
        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
              >
                {opdracht.id}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                style={{
                  background: `linear-gradient(180deg, ${C.accentSoft}, ${C.accent})`,
                  boxShadow: "0 6px 14px -6px rgba(47,107,255,0.6)",
                  ...bodyFont,
                }}
              >
                <Check size={11} aria-hidden="true" />
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] md:text-[40px]"
              style={{ color: C.ink, ...display }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <PrimaryButton>
                Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
              <GhostButton>Bewaren</GhostButton>
            </div>
          </div>
          <DepthOrb value={`${opdracht.match}%`} label="match" size={128} />
        </div>
      </Glass>

      <Glass depth={2}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Glass>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt ligt vooraan, waar de aandacht
          ligt schuift een laag naar achter. Transparant, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Glass className="p-6" depth={1}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}44` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...bodyFont }}
              >
                Voor jou
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
          </Glass>
          <Glass className="p-6" depth={3}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  color: C.warnInk,
                  background: C.warnWash,
                  border: `1px solid ${C.warn}44`,
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...bodyFont }}
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
          </Glass>
        </div>
        <div className="mt-4">
          <span className="text-[12px]" style={{ color: tone, ...bodyFont }}>
            Match {opdracht.match}% —{" "}
            {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
          </span>
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
      <Glass className="p-7 md:p-9" depth={1} accent>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight"
              style={{ color: C.ink, ...display }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.accentDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.accent} />
            </div>
          </div>
          <DepthOrb value={`${ratio}%`} label="op orde" size={104} />
        </div>
      </Glass>

      <Glass depth={2}>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...bodyFont }}
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[rgba(47,107,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6bff] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        background: st.wash,
                        border: `1px solid ${st.tone}44`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...bodyFont }}
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
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-[14px] p-4"
                        style={{
                          background: "rgba(255,255,255,0.55)",
                          border: `1px solid ${C.lineSoft}`,
                        }}
                      >
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
      </Glass>

      <div>
        <div className="mb-4">
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Glass key={d.naam} className="flex items-center gap-3 p-4" depth={3} interactive>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: `1px solid ${C.line}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}44` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Glass>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · op volgorde van nabijheid</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none"
          style={{ color: C.ink, ...display }}
        >
          Wat nu vooraan ligt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Bovenaan ligt het dichtstbij — daar begin je. Naar onder toe zakt het rustig de diepte in.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.accent;
          const ink = warn ? C.warnInk : C.accentDeep;
          const wash = warn ? C.warnWash : C.accentWash;
          const depth: 1 | 2 | 3 = i === 0 ? 1 : i === 1 ? 2 : 3;
          return (
            <li key={a.titel}>
              <Glass className="p-6" depth={depth} interactive>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[15px] font-bold"
                    style={{
                      background: wash,
                      border: `1.5px solid ${tone}66`,
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
                        border: `1px solid ${tone}44`,
                        ...bodyFont,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Check size={10} aria-hidden="true" />
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
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
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
              </Glass>
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
  return { ink: C.inkMute, wash: "rgba(37,71,140,0.06)", tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none"
            style={{ color: C.ink, ...display }}
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
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            alarm: false,
            depth: 3 as const,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            depth: 1 as const,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            alarm: false,
            depth: 2 as const,
          },
        ].map((s) => (
          <Glass key={s.l} className="p-6" depth={s.depth} interactive>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
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
              className="mt-2 text-[27px] font-semibold"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass depth={2}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...bodyFont }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[rgba(47,107,255,0.06)] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
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
                  style={{ color: C.ink, ...bodyFont }}
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
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}44`,
                      ...bodyFont,
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
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}
