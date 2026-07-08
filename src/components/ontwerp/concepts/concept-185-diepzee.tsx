"use client";

// Concept 185 — "Diepzee" · diepzee-bioluminescentie in een DONKER thema. Basis is inktblauw/zwart-groen
// (de abyssale oceaan); accenten gloeien zacht bioluminescent (cyaan/aqua/lichtgroen). Sonar-ping-ringen
// vormen subtiele decoratie; een verticale "diepte"-schaal loopt langs de rand. Onderscheidt zich van
// neon/CRT-thema's: dit is ORGANISCH oceaanlicht in diep donker — geen stad, geen scherpe neonlijnen.
// KPI's gloeien als kwallen; match-percentage leest als lichtintensiteit. Rustig, mysterieus, premium-
// donker met sterk (WCAG-bewust) tekstcontrast. Micro-interactie: zachte glow-puls bij hover (CSS-keyframes,
// deterministisch). Status nooit kleur-alleen (icoon + label + tint). Geen random/Date. UI-taal Nederlands.
// Fonts: Sora (display) + Manrope (tekst) + Plex Mono (data/diepte-labels).

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
  TriangleAlert,
  ChevronRight,
  Waves,
  RefreshCw,
  Radar,
  Fish,
  Anchor,
  Compass,
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

// ── Palet — abyssaal donker: inktblauw/zwart-groen, met bioluminescent cyaan/aqua/lichtgroen. ──
const C = {
  bg: "#04121c", // abyssaal inktblauw-zwart
  bgDeep: "#020c14", // dieper (bodem)
  panel: "#0a1f2c", // paneel-vlak
  panelSoft: "#0f2735", // iets lichter paneel
  ink: "#eafcff", // helder biolicht-wit (hoofdtekst)
  inkSoft: "#a8cdd6", // secundaire tekst
  inkFaint: "#6f97a3", // labels
  line: "#173442", // fijne rand
  lineSoft: "#0f2833",
  // Bioluminescentie
  aqua: "#2ff0d6", // primair aqua-glow
  cyan: "#33d1ff", // cyaan-glow
  lume: "#7dff9e", // lichtgroen (positief)
  lumeSoft: "#12332a",
  aquaSoft: "#0d2f33",
  cyanSoft: "#0b2a3a",
  // Semantisch
  ok: "#7dff9e",
  okSoft: "#12332a",
  warn: "#ffcf5c",
  warnSoft: "#33290d",
  info: "#33d1ff",
  infoSoft: "#0b2a3a",
  danger: "#ff7a92",
  dangerSoft: "#331018",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const bodyF = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Zachte glow-puls keyframes (deterministisch, CSS) — als bioluminescent leven dat ademt bij hover.
const GLOW_CSS = `
@keyframes dz-pulse {
  0%,100% { opacity: 0.35; transform: scale(1); }
  50%     { opacity: 0.85; transform: scale(1.08); }
}
@keyframes dz-ping {
  0%   { transform: scale(0.6); opacity: 0.55; }
  100% { transform: scale(1.9); opacity: 0; }
}
.dz-hoverglow { transition: box-shadow .35s ease, transform .35s ease; }
.dz-hoverglow:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(47,240,214,0.4), 0 18px 44px -18px rgba(47,240,214,0.5); }
`;

// Sonar-ping-ringen — statische concentrische ringen (decoratie). Deterministisch.
function SonarField({
  id,
  color = C.aqua,
  opacity = 0.14,
  className = "",
  style,
}: {
  id: string;
  color?: string;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width="100%"
      height="100%"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="none" stroke={color} strokeWidth="1" opacity={opacity}>
        {[40, 90, 150, 220, 300].map((r) => (
          <circle key={r} cx="18%" cy="16%" r={r} />
        ))}
        {[40, 90, 150, 220].map((r) => (
          <circle key={`b-${r}`} cx="86%" cy="88%" r={r} />
        ))}
      </g>
    </svg>
  );
}

// Merk-glyph — kwal/lichtbron: kern-bol met zachte glow-ring.
function LumeGlyph({ size = 44 }: { size?: number }) {
  const c = size / 2;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: C.aquaSoft,
        boxShadow: `0 0 0 1px ${C.aqua}44`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute rounded-full"
        style={{
          inset: size * 0.22,
          background: C.aqua,
          boxShadow: `0 0 14px 2px ${C.aqua}`,
          animation: "dz-pulse 3.2s ease-in-out infinite",
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative">
        <circle
          cx={c}
          cy={c}
          r={size * 0.34}
          fill="none"
          stroke={C.cyan}
          strokeWidth="1.2"
          opacity="0.7"
        />
        <circle cx={c} cy={c} r={size * 0.12} fill={C.ink} />
      </svg>
    </span>
  );
}

// ── Status-model — nooit kleur-alleen ──
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
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

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
      className={`relative overflow-hidden rounded-2xl ${interactive ? "dz-hoverglow" : ""} ${className}`}
      style={{ background: C.panel, boxShadow: `0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: C.aquaSoft, boxShadow: `inset 0 0 0 1px ${C.aqua}33` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: C.aqua }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[18px] font-bold leading-none tracking-[-0.02em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p
            className="mt-1 text-[11px] uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.aqua}55, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.aqua }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Lichtintensiteit-meter — match% als bioluminescente gloeikern.
function Lume({ value, size = 56 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.aqua} 0deg ${deg}deg, ${C.lineSoft} ${deg}deg 360deg)`,
        boxShadow: `0 0 16px -2px ${C.aqua}77`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.bgDeep }}
      >
        <span
          className="text-[15px] font-bold tabular-nums leading-none"
          style={{ ...display, color: C.aqua }}
        >
          {value}
        </span>
        <span
          className="text-[6.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          intensiteit
        </span>
      </span>
    </span>
  );
}

// Spark — gloeiende bindingslijn van datapunten.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 30;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return { x, y };
  });
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? { x: w, y: h / 2 };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={C.aqua}
        strokeWidth="1.6"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${C.aqua})` }}
      />
      <circle
        cx={last.x}
        cy={last.y}
        r="2.8"
        fill={C.aqua}
        style={{ filter: `drop-shadow(0 0 4px ${C.aqua})` }}
      />
    </svg>
  );
}

// Diepte-schaal — verticale meting langs de rand (decoratief lab-detail).
function DepthScale({ active }: { active: number }) {
  const marks = [0, 200, 400, 800, 1200];
  return (
    <div className="hidden shrink-0 flex-col items-end gap-3 pr-2 lg:flex" aria-hidden="true">
      {marks.map((m, i) => (
        <div key={m} className="flex items-center gap-2">
          <span
            className="text-[9px] tabular-nums"
            style={{ ...mono, color: i === active ? C.aqua : C.inkFaint }}
          >
            {m}m
          </span>
          <span
            className="h-px"
            style={{ width: i === active ? 22 : 12, background: i === active ? C.aqua : C.line }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Root ──
export function Concept185() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      <style>{GLOW_CSS}</style>
      {/* Abyssaal verloop + sonar-veld onder alles */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 80% at 20% 0%, ${C.panelSoft} 0%, ${C.bg} 45%, ${C.bgDeep} 100%)`,
          }}
        />
        <SonarField id="sonar-page" color={C.aqua} opacity={0.1} />
      </div>

      <div className="relative z-10">
        <header className="relative overflow-hidden" style={{ background: C.bgDeep }}>
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <SonarField id="sonar-head" color={C.cyan} opacity={0.16} />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.aqua}, transparent)` }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <LumeGlyph size={44} />
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.aqua }}
                >
                  Diepzee
                </div>
                <div
                  className="text-[22px] font-bold leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.ink }}
                >
                  Abyssaal
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Intensiteit · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.aquaSoft,
                  color: C.aqua,
                  boxShadow: `inset 0 0 0 1px ${C.aqua}33`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  ...mono,
                  background: C.aquaSoft,
                  color: C.aqua,
                  boxShadow: `0 0 0 1px ${C.aqua}55`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

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
                  className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020c14]"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.aqua,
                          color: C.bgDeep,
                          boxShadow: `0 0 14px -2px ${C.aqua}`,
                          ["--tw-ring-color" as string]: C.aqua,
                        }
                      : {
                          ...bodyF,
                          background: C.panel,
                          color: C.inkSoft,
                          ["--tw-ring-color" as string]: C.aqua,
                        }
                  }
                >
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

        <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Waves size={12} aria-hidden="true" /> Licht in de diepte — alleen wat telt gloeit op.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1 space-y-8">
        <Card className="relative">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <SonarField id="sonar-hero" color={C.aqua} opacity={0.14} />
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(100deg, ${C.panel} 42%, ${C.panel}cc 62%, transparent)`,
            }}
            aria-hidden="true"
          />
          <div className="relative max-w-xl p-6 sm:p-8">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                ...mono,
                background: C.aquaSoft,
                color: C.aqua,
                boxShadow: `inset 0 0 0 1px ${C.aqua}33`,
              }}
            >
              <Fish size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              Drie matches lichten op boven 85% intensiteit.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Eén signaal vraagt aandacht: je VOG verloopt binnenkort. Ververs het en houd je
              profiel helder verifieerbaar in de diepte.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
                style={{
                  ...bodyF,
                  background: C.aqua,
                  color: C.bgDeep,
                  boxShadow: `0 0 18px -3px ${C.aqua}`,
                  ["--tw-ring-color" as string]: C.aqua,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#0f2735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
                style={{
                  ...bodyF,
                  background: C.panelSoft,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.aqua,
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
          <section className="space-y-4">
            <SectionHead
              title="Aanbevolen matches"
              sub="Op lichtintensiteit gerangschikt"
              Icon={Radar}
            />
            <div className="space-y-3">
              {OPDRACHTEN.map((o) => (
                <Card key={o.id} interactive>
                  <button
                    onClick={onOpen}
                    className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.aqua }}
                  >
                    <Lume value={o.match} />
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
                            style={{ ...bodyF, background: C.lumeSoft, color: C.lume }}
                          >
                            <Check size={11} strokeWidth={2.6} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
            <Card className="p-5">
              <div className="flex items-center gap-5">
                <DekRing dek={dek} size={92} />
                <div>
                  <StatusTag status="VERIFIED" />
                  <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                    alleen geverifieerde documenten.
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="relative"
              style={{ background: C.bgDeep, boxShadow: `0 0 0 1px ${C.aqua}33` }}
            >
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <SonarField id="sonar-prio" color={C.warn} opacity={0.12} />
              </div>
              <div className="relative p-5">
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
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020c14]"
                  style={{
                    ...bodyF,
                    background: C.warn,
                    color: C.bgDeep,
                    ["--tw-ring-color" as string]: C.warn,
                  }}
                >
                  {warn.cta} <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </Card>
          </section>
        </div>
      </div>
      <DepthScale active={2} />
    </div>
  );
}

function DekRing({ dek, size }: { dek: number; size: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.lume} 0deg ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
        boxShadow: `0 0 16px -3px ${C.lume}88`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute flex flex-col items-center justify-center rounded-full"
        style={{ inset: size * 0.09, background: C.bgDeep }}
      >
        <span className="text-[24px] font-bold leading-none" style={{ ...display, color: C.lume }}>
          {dek}
          <span className="text-[13px]" style={{ color: C.inkFaint }}>
            %
          </span>
        </span>
      </span>
    </span>
  );
}

// ── Marktplaats — error/loading/empty ──
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Compass} />
        <div className="flex items-center gap-2">
          <Card className="flex items-center gap-2 rounded-full px-3.5 py-2">
            <Search size={15} style={{ color: C.aqua }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </Card>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#0f2735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
            style={{
              background: C.panel,
              boxShadow: `0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.aqua,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.aqua }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: `0 0 0 1px ${C.danger}44` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold" style={{ ...display, color: C.danger }}>
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelSoft }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelSoft }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="relative flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <SonarField id="sonar-empty" color={C.aqua} opacity={0.12} />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <LumeGlyph size={60} />
            <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
              Geen licht gevonden
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om nieuwe signalen op te
              vangen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
              style={{
                ...bodyF,
                background: C.aqua,
                color: C.bgDeep,
                ["--tw-ring-color" as string]: C.aqua,
              }}
            >
              Zoekterm wissen
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${C.aqua}, ${C.cyan})` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <Lume value={o.match} size={48} />
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
              <div className="relative px-4 pb-4">
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
                      style={{ ...bodyF, background: C.panelSoft, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#0f2735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.aqua,
                  ["--tw-ring-color" as string]: C.aqua,
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

// ── Opdracht-detail ──
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#0f2735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.aqua,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <SonarField id="sonar-opd" color={C.aqua} opacity={0.12} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.panel} 40%, ${C.panel}bb 65%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.aquaSoft, color: C.aqua }}
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
          <Lume value={opdracht.match} size={82} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.aquaSoft }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.9} style={{ color: C.aqua }} />
            </span>
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
          <SectionHead title="Waarom dit oplicht" Icon={Check} />
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
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
          style={{
            ...bodyF,
            background: C.aqua,
            color: C.bgDeep,
            boxShadow: `0 0 18px -3px ${C.aqua}`,
            ["--tw-ring-color" as string]: C.aqua,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#0f2735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.aqua,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.aqua }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Verificatie" sub="Certificaten en documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
          style={{
            ...bodyF,
            background: C.aqua,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.aqua,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <SonarField id="sonar-ver" color={C.lume} opacity={0.1} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(100deg, ${C.panel} 45%, ${C.panel}cc 68%, transparent)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <DekRing dek={dek} size={112} />
          <div className="max-w-sm">
            <div className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd signaal versterkt je gloed. Houd je dekking hoog, dan blijft je
              profiel helder zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                ...bodyF,
                background: C.okSoft,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}44`,
              }}
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
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#0f2735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a1f2c]"
                      style={{
                        ...bodyF,
                        background: C.panelSoft,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.aqua,
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

// ── Acties ──
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead title="Volgende beste acties" sub="Op urgentie gerangschikt" Icon={Anchor} />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{
                    background: warn ? C.warn : C.aqua,
                    boxShadow: `0 0 12px 0 ${warn ? C.warn : C.aqua}`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.aquaSoft,
                      color: warn ? C.warn : C.aqua,
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
                          <Radar size={10} strokeWidth={2.4} aria-hidden="true" />
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f2c]"
                      style={{
                        ...bodyF,
                        background: warn ? C.warn : C.aqua,
                        color: C.bgDeep,
                        ["--tw-ring-color" as string]: warn ? C.warn : C.aqua,
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.aquaSoft,
                  color: C.aqua,
                  boxShadow: `0 0 0 1px ${C.aqua}44`,
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
                      style={{ background: C.aqua, boxShadow: `0 0 6px 0 ${C.aqua}` }}
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

// ── Facturen ──
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
        <SectionHead title="Facturen" sub="Omzet en openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04121c]"
          style={{
            ...bodyF,
            background: C.aqua,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.aqua,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
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
              className="h-1 w-10 rounded-full"
              style={{ background: C.aqua, boxShadow: `0 0 8px 0 ${C.aqua}` }}
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelSoft }}>
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
                    className="transition-colors hover:bg-[#0f2735]"
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
              <tr style={{ background: C.bgDeep }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.aqua }}
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
