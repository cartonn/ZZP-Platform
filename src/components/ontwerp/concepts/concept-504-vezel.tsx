"use client";

// Concept 504 — "Vezel" · Warm-menselijk tactiel. Warme off-white/papier-achtergrond met een
// subtiele textiel-/gescand-papier textuur (SVG-ruis + fijne grain-gradients), organische vormen
// en zachte handgetekend-aanvoelende accenten in warme aardetinten. Vertrouwen ontstaat door
// warmte rond gevoelige documenten, met bewaakt tekstcontrast: donkere inkt-bruin op papier —
// nooit onleesbaar. Status altijd met label + icoon, niet enkel kleur.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Flower2,
  Leaf,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sprout,
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

// — Palet: warme aardetinten, inkt-bruin op papier, klei/terracotta accent —
const C = {
  ink: "#33291f",
  inkSoft: "#5a4a39",
  inkMute: "#816d56",
  inkFaint: "#a8927a",

  paper: "#f4ecdd",
  paperDeep: "#ece1cd",
  card: "#fbf6ec",
  line: "#ddceb3",

  clay: "#b5643f",
  clayDeep: "#9a4f30",
  ochre: "#c78a2c",
  sage: "#6f8b57",
  sageDeep: "#5a7346",
  teal: "#4f7d7a",
  rust: "#a94b34",
};

const humanist = {
  fontFamily:
    "'Segoe UI', 'Avenir Next', 'Trebuchet MS', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};
const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif",
};
const num = { ...humanist, fontVariantNumeric: "tabular-nums" as const };

// Fijne papiergrain als SVG-ruis (data-URI) — puur decoratief overlay.
const paperNoise =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.sageDeep,
        soft: "rgba(111,139,87,0.16)",
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.teal,
        soft: "rgba(79,125,122,0.16)",
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.ochre,
        soft: "rgba(199,138,44,0.18)",
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.rust,
        soft: "rgba(169,75,52,0.16)",
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
}

// — Papieren kaart: zachte, tactiele schaduw + grain-overlay + warme rand —
function Paper({
  children,
  className = "",
  as: Tag = "div",
  tone = "card",
  interactive = false,
  tilt = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: "card" | "raised";
  interactive?: boolean;
  tilt?: number;
}) {
  const bg = tone === "raised" ? "#fdfaf2" : C.card;
  const shadow =
    tone === "raised"
      ? "0 18px 40px -20px rgba(74,54,34,0.4), 0 2px 5px -2px rgba(74,54,34,0.16)"
      : "0 12px 30px -18px rgba(74,54,34,0.34), 0 1px 3px -1px rgba(74,54,34,0.12)";
  return (
    <Tag
      className={`relative overflow-hidden rounded-[20px] ${interactive ? "vz-lift" : ""} ${className}`}
      style={{
        background: bg,
        border: `1px solid ${C.line}`,
        boxShadow: `${shadow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: paperNoise, opacity: 0.045, mixBlendMode: "multiply" }}
      />
      <span className="relative block">{children}</span>
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "soft" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-4 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5643f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ecdd]";
  if (variant === "solid") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        className={`${base} ${pad} hover:-translate-y-0.5 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${C.clay}, ${C.clayDeep})`,
          color: "#fdf6ec",
          boxShadow: "0 10px 22px -10px rgba(154,79,48,0.7), inset 0 1px 0 rgba(255,255,255,0.28)",
          ...humanist,
        }}
      >
        {children}
      </button>
    );
  }
  const style: React.CSSProperties =
    variant === "soft"
      ? {
          background: C.paperDeep,
          color: C.ink,
          border: `1px solid ${C.line}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
        }
      : { background: "transparent", color: C.inkSoft, border: "1px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} hover:-translate-y-0.5 ${className}`}
      style={{ ...style, ...humanist }}
    >
      {children}
    </button>
  );
}

function StatusPill({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}40` }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Handgetekende squiggle-onderstreping (organisch accent) —
function Squiggle({ color = C.clay, width = 120 }: { color?: string; width?: number }) {
  return (
    <svg
      width={width}
      height="8"
      viewBox={`0 0 ${width} 8`}
      fill="none"
      aria-hidden="true"
      className="mt-1"
      preserveAspectRatio="none"
    >
      <path
        d={`M2 5 Q ${width * 0.2} 1 ${width * 0.4} 5 T ${width * 0.8} 5 T ${width - 2} 4`}
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// — Organische "zegel" match-badge met licht-wobbelige ring —
function MatchSeal({ value, size = 56 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.sageDeep : C.clay;
  const r = (size - 7) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(129,109,86,0.22)"
          strokeWidth="3.5"
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.985} ${circ}`}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none"
          style={{ color: tone, fontSize: size * 0.31, ...num }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 uppercase tracking-[0.12em]"
          style={{ color: C.inkFaint, fontSize: size * 0.13 }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 28;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  const gid = useMemo(() => `vz-spark-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.3" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={tone} />
    </svg>
  );
}

function Eyebrow({ children, tone = C.clay }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: tone }}>
      {children}
    </span>
  );
}

function SectionHead({
  over,
  children,
  right,
}: {
  over: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Eyebrow>{over}</Eyebrow>
        <h2
          className="mt-1 text-[21px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept504() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...humanist,
        color: C.ink,
        background: `radial-gradient(120% 90% at 12% 0%, #f7f0e2 0%, ${C.paper} 46%, ${C.paperDeep} 100%)`,
      }}
    >
      {/* Papiergrain over de gehele achtergrond */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: paperNoise, opacity: 0.06, mixBlendMode: "multiply" }}
      />
      {/* Organische, zachte aardvormen op de achtergrond */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute h-[38vw] w-[38vw]"
          style={{
            top: "-10%",
            right: "-8%",
            borderRadius: "58% 42% 46% 54% / 52% 48% 52% 48%",
            background: "radial-gradient(circle, rgba(199,138,44,0.2), rgba(199,138,44,0) 72%)",
            filter: "blur(10px)",
          }}
        />
        <span
          className="absolute h-[34vw] w-[34vw]"
          style={{
            bottom: "-14%",
            left: "-6%",
            borderRadius: "46% 54% 58% 42% / 48% 52% 48% 52%",
            background: "radial-gradient(circle, rgba(111,139,87,0.18), rgba(111,139,87,0) 72%)",
            filter: "blur(10px)",
          }}
        />
        <span
          className="absolute h-[26vw] w-[26vw]"
          style={{
            top: "34%",
            left: "40%",
            borderRadius: "52% 48% 40% 60% / 56% 44% 56% 44%",
            background: "radial-gradient(circle, rgba(181,100,63,0.12), rgba(181,100,63,0) 72%)",
            filter: "blur(12px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="vz-fade pt-6">
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

      <style>{`
        .vz-lift { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease; }
        .vz-lift:hover { transform: translateY(-3px) rotate(-0.3deg); box-shadow: 0 26px 54px -22px rgba(74,54,34,0.42), inset 0 1px 0 rgba(255,255,255,0.7); }
        @keyframes vzFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .vz-fade { animation: vzFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .vz-lift, .vz-fade { animation: none !important; transition: none !important; }
          .vz-lift:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center gap-4 pt-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[16px]"
          style={{
            background: `linear-gradient(135deg, ${C.clay}, ${C.ochre})`,
            color: "#fdf6ec",
            boxShadow: "0 12px 24px -10px rgba(154,79,48,0.7), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
          aria-hidden="true"
        >
          <Sprout size={20} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Vezel
          </p>
          <p className="mt-1.5 text-[11.5px]" style={{ color: C.inkMute }}>
            {PROFIEL.naam} · {PROFIEL.rol}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold sm:inline-flex"
          style={{
            color: C.sageDeep,
            background: "rgba(111,139,87,0.14)",
            border: `1px solid ${C.sage}55`,
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold"
              style={{ background: C.clay, color: "#fdf6ec" }}
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{ background: C.paperDeep, border: `1px solid ${C.line}`, color: C.ink }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          boxShadow: "0 10px 26px -18px rgba(74,54,34,0.32), inset 0 1px 0 rgba(255,255,255,0.7)",
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
              className="relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5643f]"
              style={
                on
                  ? {
                      color: "#fdf6ec",
                      background: `linear-gradient(135deg, ${C.clay}, ${C.clayDeep})`,
                      boxShadow: "0 8px 18px -8px rgba(154,79,48,0.7)",
                    }
                  : { color: C.inkSoft }
              }
            >
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
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Eyebrow>Overzicht</Eyebrow>
          <h1
            className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[38px]"
            style={{ color: C.ink, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <Squiggle color={C.ochre} width={170} />
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je register staat er warm en verzorgd bij. Er liggen verse opdrachten klaar die bij je
            passen, en één document vraagt binnenkort even je aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="soft" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k, i) => {
              const tone = i === 3 ? C.ochre : i === 2 ? C.sageDeep : C.clay;
              return (
                <Paper key={k.label} interactive className="p-4">
                  <p
                    className="text-[10.5px] uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute }}
                  >
                    {k.label}
                  </p>
                  <p
                    className="mt-1.5 text-[22px] font-semibold leading-none"
                    style={{ color: C.ink, ...num }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                      className="text-[11.5px] font-semibold"
                      style={{ color: k.up ? C.sageDeep : C.ochre, ...num }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend}
                    </span>
                    <Spark data={k.spark} tone={tone} />
                  </div>
                </Paper>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <Paper interactive tone="raised" className="p-5">
            <div className="flex items-center gap-2" style={{ color: C.ochre }}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                Termijn nadert
              </span>
            </div>
            <h3
              className="mt-2.5 text-[16.5px] font-semibold leading-snug"
              style={{ color: C.ink, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Paper>

          <Paper interactive className="p-5">
            <Eyebrow tone={C.sageDeep}>Vertrouwen</Eyebrow>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[34px] font-semibold leading-none"
                style={{ color: C.ink, ...num }}
              >
                {ratio}%
              </span>
              <span className="text-[12.5px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(129,109,86,0.2)" }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: `linear-gradient(90deg, ${C.sageDeep}, ${C.sage})`,
                  transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Paper>
        </aside>
      </section>

      <section>
        <SectionHead
          over="Aanbevolen"
          right={
            <button
              type="button"
              onClick={onMarkt}
              className="rounded-full text-[12.5px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5643f]"
              style={{ color: C.clay }}
            >
              Volledige lijst →
            </button>
          }
        >
          Opdrachten voor jou
        </SectionHead>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHead over="Register">Je certificaten</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <Paper key={c.naam} interactive className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                  style={{ background: t.soft, color: t.base }}
                  aria-hidden="true"
                >
                  <t.Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: t.alarm ? t.base : C.inkMute }}
                  >
                    {c.detail}
                  </span>
                </span>
              </Paper>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Paper interactive as="article">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b5643f]"
      >
        <MatchSeal value={opdracht.match} size={52} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[15.5px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: C.inkFaint }}
        />
      </button>
    </Paper>
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
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Opdrachten die bij je passen
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je profiel.
        </p>
      </div>

      <Paper className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.paperDeep, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a8927a]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[rgba(129,109,86,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5643f]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "ghost"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </Paper>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Paper className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: "rgba(129,109,86,0.18)" }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: "rgba(129,109,86,0.18)" }}
                  />
                </div>
              </Paper>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.rust}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.clay}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-5 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded-full text-[11px] uppercase tracking-[0.12em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5643f]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Paper tone="raised" className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ color: tone, background: `${tone}22` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[20px] font-semibold" style={{ color: C.ink, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="soft" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Paper>
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
  const tone = strong ? C.sageDeep : C.clay;
  return (
    <Paper interactive as="article">
      <div className="flex items-start gap-4 p-5">
        <MatchSeal value={opdracht.match} size={62} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: tone }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[11px]" style={{ color: C.inkFaint, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[18px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                style={{ background: C.paperDeep, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[17px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3"
        style={{ borderTop: `1px solid ${C.line}`, background: "rgba(236,225,205,0.5)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5643f]"
          style={{ color: C.clay }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.line}`, background: "rgba(251,246,236,0.7)" }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.sageDeep}
              Icon={Leaf}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.ochre}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Paper>
  );
}

function RedenKolom({
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
    <div>
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone }}
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
  const tone = strong ? C.sageDeep : C.clay;
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Paper tone="raised" className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <MatchSeal value={opdracht.match} size={76} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                {opdracht.id}
              </span>
              <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
              <span
                className="text-[11.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: tone }}
              >
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-2.5 max-w-2xl text-[27px] font-semibold leading-[1.14] tracking-[-0.015em] md:text-[33px]"
              style={{ color: C.ink, ...serif }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkMute }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="soft">Bewaren</Btn>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Aanvang", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div
              key={m.l}
              className="rounded-[16px] p-3.5"
              style={{ background: C.paperDeep, border: `1px solid ${C.line}` }}
            >
              <p className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-[12px] font-medium"
              style={{
                background: "rgba(199,138,44,0.14)",
                color: C.inkSoft,
                border: `1px solid ${C.ochre}44`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Paper>

      <Paper className="p-6">
        <SectionHead over="Motivering">Waarom deze match bij je past</SectionHead>
        <p className="mb-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.sageDeep }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.sageDeep }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.ochre }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ochre }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Paper>
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
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Paper className="p-6">
          <Eyebrow tone={C.sageDeep}>Vertrouwensregister</Eyebrow>
          <h1
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Al je documenten worden versleuteld
            bewaard en uitsluitend met jouw toestemming gedeeld.
          </p>
        </Paper>
        <Paper tone="raised" className="flex flex-col justify-center p-6">
          <span className="text-[42px] font-semibold leading-none" style={{ color: C.ink, ...num }}>
            {ratio}%
          </span>
          <p
            className="mt-1.5 text-[11.5px] uppercase tracking-[0.12em]"
            style={{ color: C.inkMute }}
          >
            dossier op orde
          </p>
          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(129,109,86,0.2)" }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: `linear-gradient(90deg, ${C.sageDeep}, ${C.sage})`,
                transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Paper>
      </section>

      <section>
        <SectionHead over="Certificaten">Documentregister</SectionHead>
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <Paper interactive>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3.5 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b5643f]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                      style={{ background: t.soft, color: t.base }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
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
                    <span className="hidden sm:inline-flex">
                      <StatusPill {...t} />
                    </span>
                    <span
                      className="text-[16px] transition-transform motion-reduce:transition-none"
                      style={{ color: C.inkFaint, transform: isOpen ? "rotate(45deg)" : "none" }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="px-4 pb-4 sm:pl-[70px]"
                        style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}
                      >
                        <span className="mb-2 inline-flex sm:hidden">
                          <StatusPill {...t} />
                        </span>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm" variant="solid">
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="soft">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </Paper>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionHead over="Dossier">Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Paper key={d.naam} interactive className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                  style={{ background: C.paperDeep, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusPill {...t} />
              </Paper>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Agenda</Eyebrow>
        <h1
          className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.ochre : C.teal;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Paper
                interactive
                tone={warn ? "raised" : "card"}
                className="flex items-start gap-4 p-5"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] text-[15px] font-semibold"
                  style={{ background: `${tone}22`, color: tone, ...num }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: tone }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[17px] font-semibold leading-snug"
                    style={{ color: C.ink, ...serif }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "soft"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Paper>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.sageDeep, soft: "rgba(111,139,87,0.16)" };
  if (status === "Openstaand") return { base: C.ochre, soft: "rgba(199,138,44,0.18)" };
  if (status === "Concept") return { base: C.teal, soft: "rgba(79,125,122,0.16)" };
  return { base: C.rust, soft: "rgba(169,75,52,0.16)" };
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
          <Eyebrow>Grootboek</Eyebrow>
          <h1
            className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.sageDeep, Icon: Flower2 },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.ochre, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.teal, Icon: FileText },
        ].map((s) => (
          <Paper key={s.l} interactive className="p-4">
            <div className="flex items-center gap-2" style={{ color: s.tone }}>
              <s.Icon size={14} aria-hidden="true" />
              <p className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
                {s.l}
              </p>
            </div>
            <p className="mt-1 text-[24px] font-semibold" style={{ color: s.tone, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Paper>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn key={s} size="sm" variant={sort === s ? "solid" : "soft"} onClick={() => setSort(s)}>
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Paper>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 540 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[rgba(236,225,205,0.55)]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...num }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-semibold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[14px] font-semibold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                        style={{
                          color: t.base,
                          background: t.soft,
                          border: `1px solid ${t.base}40`,
                        }}
                      >
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Paper>
    </div>
  );
}
