"use client";

// Concept 541 — "Vlies" · Spatial Glass / Depth (visionOS "liquid glass", 2026).
// Gelaagde, doorschijnende frosted-glass panelen — vliezen — die als zwevende membranen
// boven een luminueuze, zacht-donkere aurora-achtergrond hangen. Diepte stuurt de hiërarchie:
// wat actie vraagt komt naar voren (hogere laag, sterkere randlicht-refractie, diepere schaduw).
// 2026-trends: liquid glass, depth-hierarchy, aurora-mesh, licht-refractie aan panelranden.
// Status altijd met label + icoon — nooit enkel kleur.

import {
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Layers,
  ListChecks,
  MapPin,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ————————————————————————————— Palet — luminueus, zacht-donker + aurora —————————————————————————————
const C = {
  bg: "#0a0e1a",
  accent: "#7cc4ff",
  accentDeep: "#4f8fe8",
  accentGlow: "rgba(124,196,255,0.42)",
  accentSoft: "rgba(124,196,255,0.14)",

  text: "#f2f6ff",
  textSoft: "rgba(242,246,255,0.76)",
  textMute: "rgba(242,246,255,0.52)",
  textFaint: "rgba(242,246,255,0.34)",

  film: "rgba(255,255,255,0.06)",
  filmRaise: "rgba(255,255,255,0.10)",
  filmDeep: "rgba(10,14,26,0.44)",
  border: "rgba(255,255,255,0.13)",
  borderSoft: "rgba(255,255,255,0.07)",
  rim: "rgba(255,255,255,0.30)",
  rimSoft: "rgba(255,255,255,0.16)",

  pos: "#68e0aa",
  posSoft: "rgba(104,224,170,0.16)",
  info: "#84cbff",
  infoSoft: "rgba(132,203,255,0.16)",
  warn: "#f6cd77",
  warnSoft: "rgba(246,205,119,0.16)",
  neg: "#ff90a4",
  negSoft: "rgba(255,144,164,0.16)",
};

const sans: CSSProperties = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7cc4ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]";

// Vlies-diepte: hoe hoger de laag, hoe sterker de randlicht-refractie en de slagschaduw.
function film(level: 0 | 1 | 2 | 3): CSSProperties {
  const shadow =
    level >= 3
      ? "0 40px 90px -28px rgba(0,0,0,0.78), 0 12px 30px -14px rgba(0,0,0,0.55)"
      : level === 2
        ? "0 28px 66px -24px rgba(0,0,0,0.68), 0 8px 20px -12px rgba(0,0,0,0.5)"
        : level === 1
          ? "0 18px 44px -22px rgba(0,0,0,0.58)"
          : "0 10px 28px -20px rgba(0,0,0,0.48)";
  const bg = level >= 2 ? C.filmRaise : C.film;
  const brd = level >= 2 ? C.rimSoft : C.border;
  return {
    background: bg,
    backdropFilter: "blur(26px) saturate(1.5)",
    WebkitBackdropFilter: "blur(26px) saturate(1.5)",
    border: `1px solid ${brd}`,
    boxShadow: `${shadow}, inset 0 1px 0 ${C.rim}, inset 0 0 0 1px ${C.borderSoft}`,
  };
}

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.pos,
        soft: C.posSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.info, soft: C.infoSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.neg, soft: C.negSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.pos, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  if (status === "Concept")
    return { base: C.info, soft: C.infoSoft, label: "Concept", Icon: FileText };
  return { base: C.neg, soft: C.negSoft, label: status, Icon: AlertTriangle };
}

// ————————————————————————————— Primitives —————————————————————————————
function Film({
  children,
  level = 0,
  className = "",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  level?: 0 | 1 | 2 | 3;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li" | "header";
  style?: CSSProperties;
}) {
  return (
    <Tag className={`rounded-[22px] ${className}`} style={{ ...film(level), ...style }}>
      {Tag === "div" ? <RefractEdge /> : null}
      {children}
    </Tag>
  );
}

// Subtiele licht-refractie langs de bovenrand van een vlies.
function RefractEdge() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[22px]"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), rgba(124,196,255,0.35), transparent)",
      }}
    />
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "glass" | "ghost";
  size?: "sm" | "md";
  full?: boolean;
};
function Btn({
  children,
  variant = "solid",
  size = "md",
  full = false,
  className = "",
  ...rest
}: BtnProps) {
  const base =
    "vl-btn relative inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all";
  const sz = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2 text-[13.5px]";
  const styles: Record<string, CSSProperties> = {
    solid: {
      background: `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`,
      color: "#07101f",
      border: "1px solid rgba(255,255,255,0.35)",
      boxShadow: `0 8px 22px -8px ${C.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.55)`,
    },
    glass: {
      background: C.filmRaise,
      color: C.text,
      border: `1px solid ${C.border}`,
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
    },
    ghost: { background: "transparent", color: C.textSoft, border: "1px solid transparent" },
  };
  return (
    <button
      className={`${base} ${sz} ${full ? "w-full" : ""} ${RING} ${className}`}
      style={styles[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}

function StatusPill({ tone }: { tone: Tone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ background: tone.soft, color: tone.base, border: `1px solid ${tone.base}33` }}
    >
      <tone.Icon size={12} aria-hidden="true" />
      {tone.label}
    </span>
  );
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 76;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const col = up ? C.pos : C.warn;
  const last = pts[pts.length - 1] ?? ([0, 0] as const);
  const gid = useMemo(() => `vl-sp-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.34" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={col}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={col} />
    </svg>
  );
}

function MatchDial({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  const col = value >= 90 ? C.pos : value >= 82 ? C.accent : C.warn;
  return (
    <span className="relative inline-flex h-[42px] w-[42px] items-center justify-center">
      <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r={r} fill="none" stroke={C.borderSoft} strokeWidth="3.5" />
        <circle
          cx="21"
          cy="21"
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          transform="rotate(-90 21 21)"
        />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color: col }}>
        {value}
      </span>
    </span>
  );
}

const ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Layers,
  marktplaats: Compass,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: Bell,
  acties: ListChecks,
};

// ————————————————————————————— Navigatie —————————————————————————————
function Rail({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <Film as="aside" level={2} className="relative hidden w-[228px] shrink-0 flex-col p-3 md:flex">
      <div className="flex items-center gap-2.5 px-2 pb-4 pt-2">
        <span
          className="grid h-9 w-9 place-items-center rounded-[13px]"
          style={{
            background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
            boxShadow: `0 6px 16px -6px ${C.accentGlow}`,
          }}
        >
          <Layers size={17} color="#07101f" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <div className="text-[13.5px] font-bold" style={{ color: C.text }}>
            Vlies
          </div>
          <div className="text-[11px]" style={{ color: C.textMute }}>
            Zorg-ZZP werkplek
          </div>
        </div>
      </div>
      <nav aria-label="Hoofdnavigatie" className="flex flex-col gap-1">
        {SCREENS.map((s) => {
          const Icon = ICONS[s.key];
          const on = screen === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`vl-nav group flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-[13px] font-medium transition-all ${RING}`}
              style={{
                background: on ? C.accentSoft : "transparent",
                color: on ? C.text : C.textMute,
                border: `1px solid ${on ? C.accent + "44" : "transparent"}`,
                boxShadow: on ? `inset 0 1px 0 ${C.rimSoft}` : "none",
              }}
            >
              <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.textMute }} />
              {s.label}
              {on && (
                <ChevronRight
                  size={14}
                  className="ml-auto"
                  aria-hidden="true"
                  style={{ color: C.accent }}
                />
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-1 pt-4">
        <Film level={1} className="relative p-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold"
              style={{
                background: C.accentSoft,
                color: C.accent,
                border: `1px solid ${C.accent}44`,
              }}
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[12.5px] font-semibold" style={{ color: C.text }}>
                {PROFIEL.naam}
              </div>
              <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.pos }}>
                <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
              </div>
            </div>
          </div>
        </Film>
      </div>
    </Film>
  );
}

function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Hoofdnavigatie (mobiel)"
      className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 md:hidden"
    >
      {SCREENS.map((s) => {
        const Icon = ICONS[s.key];
        const on = screen === s.key;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold transition-all ${RING}`}
            style={{
              background: on ? C.accentSoft : C.film,
              color: on ? C.accent : C.textMute,
              border: `1px solid ${on ? C.accent + "44" : C.border}`,
            }}
          >
            <Icon size={14} aria-hidden="true" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ title, setScreen }: { title: string; setScreen: (s: ScreenKey) => void }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <div className="min-w-0">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.textFaint }}
        >
          Werkplek
        </div>
        <h1 className="truncate text-[19px] font-bold" style={{ color: C.text }}>
          {title}
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Meldingen"
          className={`relative grid h-9 w-9 place-items-center rounded-full ${RING}`}
          style={{ background: C.film, border: `1px solid ${C.border}` }}
        >
          <Bell size={16} aria-hidden="true" style={{ color: C.textSoft }} />
          <span
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ background: C.warn }}
            aria-hidden="true"
          />
        </button>
        <Btn variant="solid" size="sm" onClick={() => setScreen("marktplaats")}>
          <Search size={14} aria-hidden="true" /> Opdracht zoeken
        </Btn>
      </div>
    </header>
  );
}

// ————————————————————————————— Scherm: Dashboard —————————————————————————————
function Dashboard({
  onOpen,
  setScreen,
}: {
  onOpen: (id: string) => void;
  setScreen: (s: ScreenKey) => void;
}) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Film key={k.label} level={1} className="relative p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[11.5px] font-medium" style={{ color: C.textMute }}>
                  {k.label}
                </div>
                <div className="mt-1 text-[22px] font-bold leading-none" style={{ color: C.text }}>
                  {k.value}
                </div>
              </div>
              <Spark data={k.spark} up={k.up} />
            </div>
            <div
              className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-semibold"
              style={{ color: k.up ? C.pos : C.warn }}
            >
              {k.up ? (
                <TrendingUp size={12} aria-hidden="true" />
              ) : (
                <TrendingDown size={12} aria-hidden="true" />
              )}
              {k.trend}
            </div>
          </Film>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Film level={2} className="relative overflow-hidden p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={15} aria-hidden="true" style={{ color: C.accent }} />
              <h2 className="text-[14px] font-bold" style={{ color: C.text }}>
                Beste match vandaag
              </h2>
            </div>
            <StatusPill
              tone={{
                base: C.pos,
                soft: C.posSoft,
                label: `${top.match}% match`,
                Icon: Check,
                alarm: false,
              }}
            />
          </div>
          <div className="text-[17px] font-bold" style={{ color: C.text }}>
            {top.titel}
          </div>
          <div
            className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]"
            style={{ color: C.textMute }}
          >
            <span className="inline-flex items-center gap-1">
              <Briefcase size={12} aria-hidden="true" /> {top.opdrachtgever}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" /> {top.plaats}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden="true" /> {top.uren}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {top.redenen.plus.slice(0, 3).map((r) => (
              <div
                key={r}
                className="flex items-start gap-2 rounded-[13px] px-3 py-2 text-[12.5px]"
                style={{ background: C.posSoft, color: C.textSoft }}
              >
                <Check
                  size={13}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                  style={{ color: C.pos }}
                />
                {r}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Btn variant="solid" size="sm" onClick={() => onOpen(top.id)}>
              Bekijk opdracht <ArrowRight size={13} aria-hidden="true" />
            </Btn>
            <Btn variant="glass" size="sm" onClick={() => setScreen("marktplaats")}>
              Meer matches
            </Btn>
          </div>
        </Film>

        <Film level={1} className="relative p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-bold" style={{ color: C.text }}>
              Volgende acties
            </h2>
            <button
              onClick={() => setScreen("acties")}
              className={`text-[12px] font-semibold ${RING} rounded-md px-1`}
              style={{ color: C.accent }}
            >
              Alle
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <div
                  key={a.titel}
                  className="rounded-[15px] p-3"
                  style={{
                    background: warn ? C.warnSoft : C.film,
                    border: `1px solid ${warn ? C.warn + "44" : C.border}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                        style={{ color: C.warn }}
                      />
                    ) : (
                      <Sparkles
                        size={14}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                        style={{ color: C.info }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: C.text }}>
                        {a.titel}
                      </div>
                      <div
                        className="mt-0.5 text-[11.5px] leading-snug"
                        style={{ color: C.textMute }}
                      >
                        {a.detail}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Film>
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Marktplaats —————————————————————————————
type DemoState = "normaal" | "laden" | "leeg" | "fout";

function Marktplaats({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [demo, setDemo] = useState<DemoState>("normaal");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return OPDRACHTEN;
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(term) ||
        o.opdrachtgever.toLowerCase().includes(term) ||
        o.plaats.toLowerCase().includes(term) ||
        o.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [q]);

  const empty = demo === "leeg" || (demo === "normaal" && results.length === 0);

  return (
    <div className="flex flex-col gap-4">
      <Film level={1} className="relative p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2.5"
            style={{ background: C.filmDeep, border: `1px solid ${C.border}` }}
          >
            <Search size={15} aria-hidden="true" style={{ color: C.textMute }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, opdrachtgever, plaats of certificaat…"
              aria-label="Zoek opdrachten"
              className={`w-full bg-transparent text-[13.5px] outline-none placeholder:text-[color:var(--ph)] ${RING} rounded`}
              style={{ color: C.text, ["--ph" as string]: C.textFaint }}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label="Zoekopdracht wissen"
                className={`grid h-6 w-6 place-items-center rounded-full ${RING}`}
                style={{ background: C.film }}
              >
                <X size={13} aria-hidden="true" style={{ color: C.textSoft }} />
              </button>
            )}
          </div>
          <div className="text-[12px]" style={{ color: C.textMute }}>
            {demo === "normaal" && !empty ? `${results.length} resultaten` : "Marktplaats"}
          </div>
        </div>
      </Film>

      {demo === "fout" ? (
        <Film level={1} className="relative grid place-items-center p-10 text-center">
          <AlertTriangle size={28} aria-hidden="true" style={{ color: C.neg }} />
          <div className="mt-3 text-[15px] font-bold" style={{ color: C.text }}>
            Kon opdrachten niet laden
          </div>
          <div className="mt-1 max-w-sm text-[12.5px]" style={{ color: C.textMute }}>
            Er ging iets mis bij het ophalen van de marktplaats. Probeer het opnieuw.
          </div>
          <Btn variant="glass" size="sm" className="mt-4" onClick={() => setDemo("normaal")}>
            <RotateCcw size={13} aria-hidden="true" /> Opnieuw proberen
          </Btn>
        </Film>
      ) : demo === "laden" ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Film key={i} level={1} className="relative p-4">
              <div className="flex items-center gap-4">
                <div className="vl-skel h-[42px] w-[42px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="vl-skel h-3.5 w-2/3 rounded" />
                  <div className="vl-skel h-3 w-1/3 rounded" />
                </div>
                <div className="vl-skel h-8 w-20 rounded-full" />
              </div>
            </Film>
          ))}
        </div>
      ) : empty ? (
        <Film level={1} className="relative grid place-items-center p-10 text-center">
          <span
            className="grid h-14 w-14 place-items-center rounded-full"
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}44` }}
          >
            <Search size={22} aria-hidden="true" style={{ color: C.accent }} />
          </span>
          <div className="mt-3 text-[15px] font-bold" style={{ color: C.text }}>
            Geen opdrachten gevonden
          </div>
          <div className="mt-1 max-w-sm text-[12.5px]" style={{ color: C.textMute }}>
            Er zijn geen opdrachten die passen bij &ldquo;{q}&rdquo;. Pas je zoekopdracht aan of
            verruim je filters.
          </div>
          <Btn variant="glass" size="sm" className="mt-4" onClick={() => setQ("")}>
            Zoekopdracht wissen
          </Btn>
        </Film>
      ) : (
        <div className="grid gap-3">
          {results.map((o) => (
            <OpdrachtKaart key={o.id} o={o} onOpen={onOpen} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: C.textFaint }}
        >
          Demo-staat
        </span>
        {(["normaal", "laden", "leeg", "fout"] as DemoState[]).map((d) => (
          <button
            key={d}
            onClick={() => setDemo(d)}
            aria-pressed={demo === d}
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold capitalize transition-all ${RING}`}
            style={{
              background: demo === d ? C.accentSoft : C.film,
              color: demo === d ? C.accent : C.textMute,
              border: `1px solid ${demo === d ? C.accent + "44" : C.border}`,
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function OpdrachtKaart({ o, onOpen }: { o: Opdracht; onOpen: (id: string) => void }) {
  return (
    <Film as="article" level={1} className="relative p-4">
      <div className="flex items-start gap-4">
        <MatchDial value={o.match} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[14.5px] font-bold" style={{ color: C.text }}>
                {o.titel}
              </h3>
              <div
                className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px]"
                style={{ color: C.textMute }}
              >
                <span className="inline-flex items-center gap-1">
                  <Briefcase size={11} aria-hidden="true" /> {o.opdrachtgever}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} aria-hidden="true" /> {o.plaats}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[14px] font-bold" style={{ color: C.text }}>
                {o.tarief}
              </div>
              <div className="text-[11px]" style={{ color: C.textMute }}>
                {o.uren}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {o.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: C.film,
                  color: C.textSoft,
                  border: `1px solid ${C.borderSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Btn variant="glass" size="sm" onClick={() => onOpen(o.id)}>
              Details <ChevronRight size={13} aria-hidden="true" />
            </Btn>
            <span className="ml-auto text-[11.5px]" style={{ color: C.textFaint }}>
              Start {o.start}
            </span>
          </div>
        </div>
      </div>
    </Film>
  );
}

// ————————————————————————————— Scherm: Opdracht-detail —————————————————————————————
function OpdrachtDetail({ o, onBack }: { o: Opdracht; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${RING}`}
        style={{ background: C.film, color: C.textSoft, border: `1px solid ${C.border}` }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Film level={2} className="relative overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold leading-tight" style={{ color: C.text }}>
              {o.titel}
            </h2>
            <div
              className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]"
              style={{ color: C.textMute }}
            >
              <span className="inline-flex items-center gap-1">
                <Briefcase size={13} aria-hidden="true" /> {o.opdrachtgever}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} aria-hidden="true" /> {o.plaats}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} aria-hidden="true" /> {o.uren}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MatchDial value={o.match} />
            <div className="leading-tight">
              <div className="text-[16px] font-bold" style={{ color: C.text }}>
                {o.tarief}
              </div>
              <div className="text-[11.5px]" style={{ color: C.textMute }}>
                Start {o.start}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Btn variant="solid" size="sm">
            Reageren <ArrowUpRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="glass" size="sm">
            Bewaar
          </Btn>
        </div>
      </Film>

      <div className="grid gap-4 lg:grid-cols-2">
        <Film level={1} className="relative p-5">
          <div className="mb-3 flex items-center gap-2">
            <Check size={15} aria-hidden="true" style={{ color: C.pos }} />
            <h3 className="text-[14px] font-bold" style={{ color: C.text }}>
              Waarom dit past
            </h3>
          </div>
          <ul className="flex flex-col gap-2">
            {o.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 rounded-[13px] px-3 py-2 text-[13px]"
                style={{ background: C.posSoft, color: C.textSoft }}
              >
                <Check
                  size={14}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                  style={{ color: C.pos }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Film>
        <Film level={1} className="relative p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={15} aria-hidden="true" style={{ color: C.warn }} />
            <h3 className="text-[14px] font-bold" style={{ color: C.text }}>
              Let op
            </h3>
          </div>
          <ul className="flex flex-col gap-2">
            {o.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 rounded-[13px] px-3 py-2 text-[13px]"
                style={{ background: C.warnSoft, color: C.textSoft }}
              >
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                  style={{ color: C.warn }}
                />
                {r}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {o.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: C.film,
                  color: C.textSoft,
                  border: `1px solid ${C.borderSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </Film>
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Verificatie —————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="flex flex-col gap-4">
      <Film level={2} className="relative overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} aria-hidden="true" style={{ color: C.pos }} />
              <h2 className="text-[15px] font-bold" style={{ color: C.text }}>
                Vertrouwensniveau: {PROFIEL.trust}
              </h2>
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: C.textMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Houd ze geldig om
              zichtbaar te blijven voor opdrachtgevers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-40 overflow-hidden rounded-full"
              style={{ background: C.filmDeep, border: `1px solid ${C.border}` }}
              role="img"
              aria-label={`${verified} van ${CREDENTIALS.length} geverifieerd`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(verified / CREDENTIALS.length) * 100}%`,
                  background: `linear-gradient(90deg, ${C.accent}, ${C.pos})`,
                }}
              />
            </div>
          </div>
        </div>
      </Film>

      <div className="grid gap-3">
        {CREDENTIALS.map((c) => {
          const tone = credTone(c.status);
          const on = open === c.naam;
          return (
            <Film key={c.naam} level={1} className="relative p-0">
              <button
                onClick={() => setOpen(on ? null : c.naam)}
                aria-expanded={on}
                className={`flex w-full items-center gap-3 p-4 text-left ${RING} rounded-[22px]`}
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px]"
                  style={{ background: tone.soft, border: `1px solid ${tone.base}33` }}
                >
                  <tone.Icon size={17} aria-hidden="true" style={{ color: tone.base }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold" style={{ color: C.text }}>
                    {c.naam}
                  </div>
                  <div className="truncate text-[12px]" style={{ color: C.textMute }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill tone={tone} />
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 transition-transform"
                  style={{ color: C.textMute, transform: on ? "rotate(90deg)" : "none" }}
                />
              </button>
              {on && (
                <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: C.borderSoft }}>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: C.textSoft }}>
                    {tone.alarm
                      ? "Dit certificaat vraagt actie. Werk het bij zodat je vertrouwensniveau hoog blijft en je zichtbaar blijft voor passende opdrachten."
                      : "Dit certificaat is in orde. Je hoeft nu niets te doen; we waarschuwen je ruim voordat het verloopt."}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {tone.alarm ? (
                      <Btn variant="solid" size="sm">
                        {c.status === "REJECTED" ? "Opnieuw indienen" : "Vernieuwen"}
                        <ArrowRight size={13} aria-hidden="true" />
                      </Btn>
                    ) : (
                      <Btn variant="glass" size="sm">
                        Document bekijken
                      </Btn>
                    )}
                    <Btn variant="ghost" size="sm">
                      Geschiedenis
                    </Btn>
                  </div>
                </div>
              )}
            </Film>
          );
        })}
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Acties —————————————————————————————
function Acties({ setScreen }: { setScreen: (s: ScreenKey) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Film level={2} className="relative overflow-hidden p-5">
        <div className="flex items-center gap-2">
          <ListChecks size={17} aria-hidden="true" style={{ color: C.accent }} />
          <h2 className="text-[15px] font-bold" style={{ color: C.text }}>
            Wat vraagt nu je aandacht
          </h2>
        </div>
        <p className="mt-1 text-[12.5px]" style={{ color: C.textMute }}>
          De belangrijkste stappen, op volgorde van urgentie. Eén paneel, één beslissing per keer.
        </p>
      </Film>

      <div className="flex flex-col gap-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn
            ? { base: C.warn, soft: C.warnSoft, Icon: AlertTriangle }
            : { base: C.info, soft: C.infoSoft, Icon: Sparkles };
          return (
            <Film key={a.titel} as="article" level={warn ? 2 : 1} className="relative p-4">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px]"
                  style={{ background: tone.soft, border: `1px solid ${tone.base}33` }}
                >
                  <tone.Icon size={19} aria-hidden="true" style={{ color: tone.base }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                      style={{ background: tone.soft, color: tone.base }}
                    >
                      {warn ? "Urgent" : `Stap ${i + 1}`}
                    </span>
                    <h3 className="text-[14px] font-bold" style={{ color: C.text }}>
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.textMute }}>
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "glass"}
                      size="sm"
                      onClick={() => setScreen(warn ? "verificatie" : "facturen")}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </div>
            </Film>
          );
        })}
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Facturen —————————————————————————————
function Facturen() {
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");
  const active = (FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0]) as (typeof FACTUREN)[number];
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Film level={1} className="relative overflow-hidden p-0">
        <div className="border-b px-5 py-4" style={{ borderColor: C.borderSoft }}>
          <h2 className="text-[14px] font-bold" style={{ color: C.text }}>
            Facturen
          </h2>
          <p className="text-[12px]" style={{ color: C.textMute }}>
            {FACTUREN.length} facturen · selecteer voor details
          </p>
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const tone = factuurTone(f.status);
            const on = f.nr === sel;
            return (
              <li key={f.nr}>
                <button
                  onClick={() => setSel(f.nr)}
                  aria-current={on ? "true" : undefined}
                  className={`flex w-full items-center gap-3 border-b px-5 py-3.5 text-left transition-colors ${RING}`}
                  style={{
                    borderColor: C.borderSoft,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold" style={{ color: C.text }}>
                      {f.nr}
                    </div>
                    <div className="truncate text-[11.5px]" style={{ color: C.textMute }}>
                      {f.klant} · {f.datum}
                    </div>
                  </div>
                  <div className="text-[13.5px] font-bold" style={{ color: C.text }}>
                    {f.bedrag}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ background: tone.soft, color: tone.base }}
                  >
                    <tone.Icon size={11} aria-hidden="true" /> {tone.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Film>

      <Film level={2} className="relative h-fit p-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: C.textFaint }}
        >
          Factuurdetail
        </div>
        <div className="mt-1 text-[20px] font-bold" style={{ color: C.text }}>
          {active.nr}
        </div>
        <div className="mt-4 flex flex-col gap-2.5 text-[13px]">
          <Row label="Klant" value={active.klant} />
          <Row label="Datum" value={active.datum} />
          <Row label="Status">
            {(() => {
              const t = factuurTone(active.status);
              return (
                <span
                  className="inline-flex items-center gap-1.5 font-semibold"
                  style={{ color: t.base }}
                >
                  <t.Icon size={12} aria-hidden="true" /> {t.label}
                </span>
              );
            })()}
          </Row>
        </div>
        <div className="my-4 h-px" style={{ background: C.borderSoft }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.textMute }}
          >
            Totaal
          </span>
          <span className="text-[22px] font-bold" style={{ color: C.text }}>
            {active.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full>
            {active.status === "Concept"
              ? "Versturen"
              : active.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="glass" size="sm">
            PDF
          </Btn>
        </div>
      </Film>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[12.5px]" style={{ color: C.textMute }}>
        {label}
      </span>
      <span className="text-right text-[13px] font-semibold" style={{ color: C.text }}>
        {children ?? value}
      </span>
    </div>
  );
}

// ————————————————————————————— Root —————————————————————————————
export function Concept541() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (id: string) => {
    setSelId(id);
    setScreen("opdracht");
  };

  const title = SCREENS.find((s) => s.key === screen)?.label ?? "Werkplek";

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.text, background: C.bg }}
    >
      {/* Aurora-mesh — luminueuze diepste laag */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -left-40 -top-48 h-[560px] w-[560px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(124,196,255,0.26), transparent 66%)",
            filter: "blur(24px)",
          }}
        />
        <div
          className="absolute -right-32 top-1/4 h-[520px] w-[520px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(150,110,235,0.20), transparent 66%)",
            filter: "blur(24px)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(104,224,170,0.12), transparent 68%)",
            filter: "blur(24px)",
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-6xl gap-4 p-3 sm:p-4 md:p-6">
        <Rail screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar title={title} setScreen={setScreen} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="vl-fade">
            {screen === "dashboard" && <Dashboard onOpen={openOpdracht} setScreen={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
            {screen === "opdracht" && (
              <OpdrachtDetail o={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties setScreen={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        .vl-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .vl-nav:hover { background: ${C.filmRaise}; color: ${C.text}; }
        .vl-fade { animation: vlFade 0.4s cubic-bezier(0.22,0.61,0.36,1); }
        @keyframes vlFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .vl-skel { position: relative; overflow: hidden; background: ${C.film}; }
        .vl-skel::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent);
          animation: vlShine 1.3s infinite;
        }
        @keyframes vlShine { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @media (prefers-reduced-motion: reduce) {
          .vl-btn:hover { transform: none; }
          .vl-fade { animation: none; }
          .vl-skel::after { animation: none; }
          * { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
