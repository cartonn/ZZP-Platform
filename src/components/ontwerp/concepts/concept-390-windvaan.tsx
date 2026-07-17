"use client";

// Concept 390 — "Windvaan" · Mobiel-first wayfinding met kompas/windroos.
// Ontworpen vanaf de smalle telefoon-viewport omhoog: één compacte kolom in een telefoon-frame,
// grote raakvlakken en een tab-bar onderaan (op mobiel). Op desktop verschuift de navigatie naar
// een verticale kompas-rail náást de kolom, met context eromheen. Het windroos-motief wijst de weg:
// de "volgende actie" is letterlijk een richtingwijzer. Duimvriendelijk, helder en snel.
// Palet: fris licht (#fbfbfd) op een koel veld (#eef1f6), diep marine accent (#123a5c) en een warme
// signaalkleur voor acties (#e0703a). Fonts: Bricolage Grotesque (koppen) + Inter (body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Navigation,
  Compass,
  Home,
  Store,
  BadgeCheck,
  ListChecks,
  Receipt,
  ChevronRight,
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

// — Palet: fris licht op koel veld, diep marine + warme signaalkleur —
const C = {
  field: "#eef1f6",
  fieldAlt: "#e6ebf2",
  paper: "#fbfbfd",
  paperAlt: "#f3f6fa",
  ink: "#10233a",
  inkSoft: "#25384f",
  muted: "#5f7085",
  faint: "#93a0b2",
  line: "#e4e9f0",
  lineSoft: "#eef2f7",
  marine: "#123a5c",
  marineSoft: "#2f6191",
  marineWash: "#e7eef5",
  signal: "#e0703a",
  signalDark: "#c25a28",
  signalWash: "#fbeade",
  ok: "#2f8f6b",
  okWash: "#e2f3ec",
  danger: "#c0413a",
};

const head = { fontFamily: "var(--font-lab-bricolage), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Home,
  marktplaats: Store,
  opdracht: Compass,
  verificatie: BadgeCheck,
  acties: ListChecks,
  facturen: Receipt,
  // niet in SCREENS gebruikt, maar type-volledig:
  documenten: Receipt,
  berichten: Receipt,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, tone: C.ok, wash: C.okWash };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.marineSoft,
        wash: C.marineWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.signalDark,
        wash: C.signalWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.danger,
        wash: "#f7e4e3",
      };
  }
}

// — Windroos: kompas met vier hoofdrichtingen en een draaibare naald —
function WindRose({
  size = 40,
  needle = 45,
  tone = C.marine,
  accent = C.signal,
}: {
  size?: number;
  needle?: number;
  tone?: string;
  accent?: string;
}) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke={tone} strokeWidth="1.3" opacity="0.45" />
      <circle cx="20" cy="20" r="13" fill="none" stroke={tone} strokeWidth="0.8" opacity="0.25" />
      {/* Windroos-punten (N/O/Z/W) */}
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1="20"
          y1="20"
          x2="20"
          y2="3"
          stroke={tone}
          strokeWidth="0.9"
          opacity="0.3"
          transform={`rotate(${a} 20 20)`}
        />
      ))}
      {/* Naald wijst richting */}
      <g transform={`rotate(${needle} ${c} ${c})`}>
        <polygon points="20,4 23,20 20,17 17,20" fill={accent} />
        <polygon points="20,36 23,20 20,23 17,20" fill={tone} opacity="0.55" />
      </g>
      <circle cx="20" cy="20" r="2.1" fill={tone} />
    </svg>
  );
}

// — Zachte sparkline met verloop-vulling —
function Spark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 104;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
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
        <linearGradient id={`wv-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#wv-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.3" fill={tone} />}
    </svg>
  );
}

function Overline({ children, tone = C.signalDark }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ color: tone, ...body }}
    >
      {children}
    </p>
  );
}

function Tag({
  children,
  tone = C.marine,
  wash = C.marineWash,
}: {
  children: React.ReactNode;
  tone?: string;
  wash?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: tone, background: wash, ...body }}
    >
      {children}
    </span>
  );
}

function Card({
  children,
  className = "",
  as: Tag2 = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag2
      className={`rounded-2xl border ${className}`}
      style={{ background: C.paper, borderColor: C.line }}
    >
      {children}
    </Tag2>
  );
}

// — Grote, duimvriendelijke primaire knop met richtingwijzer —
function ActionButton({
  children,
  onClick,
  className = "",
  full = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold text-white transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0703a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${full ? "w-full" : ""} ${className}`}
      style={{
        background: C.signal,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function QuietButton({
  children,
  onClick,
  active = false,
  ariaPressed,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaPressed?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123a5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd] ${className}`}
      style={{
        color: active ? "#fff" : C.inkSoft,
        background: active ? C.marine : C.paper,
        borderColor: active ? C.marine : C.line,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

export function Concept390() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.field }}
    >
      {/* Desktop-veld: subtiele windroos-watermerken als context rond het frame */}
      <div
        className="pointer-events-none absolute inset-0 hidden items-center justify-between px-10 lg:flex"
        aria-hidden="true"
      >
        <div style={{ opacity: 0.5 }}>
          <WindRose size={220} needle={30} tone="#cdd6e2" accent="#dbe2ec" />
        </div>
        <div style={{ opacity: 0.5 }}>
          <WindRose size={160} needle={210} tone="#cdd6e2" accent="#dbe2ec" />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-4xl items-stretch justify-center gap-6 px-3 py-6 sm:px-5">
        {/* Desktop: kompas-rail náást de kolom (op mobiel verborgen; daar staat de tab-bar onderaan) */}
        <SideRail screen={screen} setScreen={setScreen} />

        {/* Telefoon-frame: de mobiel-eerst kolom */}
        <div className="relative w-full max-w-[440px]">
          <div
            className="relative flex min-h-[688px] flex-col overflow-hidden rounded-[30px] border shadow-[0_24px_60px_-30px_rgba(16,35,58,0.4)]"
            style={{ background: C.paper, borderColor: C.line }}
          >
            <TopBar />
            <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
              {screen === "dashboard" && (
                <Dashboard
                  onOpen={() => setScreen("opdracht")}
                  onActies={() => setScreen("acties")}
                  onMarkt={() => setScreen("marktplaats")}
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
            <BottomBar screen={screen} setScreen={setScreen} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="flex items-center justify-between gap-3 border-b px-4 py-3.5"
      style={{ borderColor: C.line, background: C.paper }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: C.marine }}
          aria-hidden="true"
        >
          <WindRose size={26} needle={38} tone="#fff" accent={C.signal} />
        </span>
        <div>
          <p className="text-[16px] font-extrabold leading-none tracking-[-0.01em]" style={head}>
            Windvaan
          </p>
          <p
            className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold leading-none"
            style={{ color: C.ok }}
          >
            <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border"
          style={{ borderColor: C.line, color: C.muted }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Navigation size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full text-[8px] font-bold leading-[14px] text-white"
              style={{ background: C.signal }}
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ background: C.marineSoft }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

// — Desktop kompas-rail (verticale navigatie náást het frame) —
function SideRail({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="hidden w-[68px] shrink-0 flex-col items-center gap-1 self-center rounded-[26px] border p-2 md:flex"
      style={{ background: C.paper, borderColor: C.line }}
    >
      <span
        className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ background: C.marineWash }}
        aria-hidden="true"
      >
        <Compass size={20} style={{ color: C.marine }} />
      </span>
      {SCREENS.map((s) => {
        const on = s.key === screen;
        const Icon = NAV_ICONS[s.key];
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            aria-label={s.label}
            title={s.label}
            className="group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123a5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd] motion-reduce:transition-none"
            style={{
              color: on ? "#fff" : C.muted,
              background: on ? C.marine : "transparent",
            }}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="text-[8.5px] font-bold leading-none">{s.label.slice(0, 6)}</span>
          </button>
        );
      })}
    </nav>
  );
}

// — Mobiele tab-bar onderaan het frame (duimzone) —
function BottomBar({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="absolute inset-x-0 bottom-0 border-t px-1.5 py-1.5 md:hidden"
      style={{
        borderColor: C.line,
        background: "rgba(251,251,253,0.92)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-stretch justify-between">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const Icon = NAV_ICONS[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123a5c] focus-visible:ring-offset-1 focus-visible:ring-offset-[#fbfbfd] motion-reduce:transition-none"
              style={{
                color: on ? C.marine : C.faint,
              }}
            >
              <span className="flex h-6 items-center justify-center">
                <Icon size={on ? 20 : 18} aria-hidden="true" strokeWidth={on ? 2.4 : 2} />
              </span>
              <span className="text-[9px] font-bold leading-none">{s.label}</span>
              {on && (
                <span
                  className="absolute -top-0.5 h-1 w-6 rounded-full"
                  style={{ background: C.signal }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: () => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-5">
      <div>
        <Overline>Vandaag · {PROFIEL.plaats}</Overline>
        <h1
          className="mt-2 text-[26px] font-extrabold leading-[1.05] tracking-[-0.02em]"
          style={head}
        >
          Hoi {PROFIEL.naam.split(" ")[0]}, hier ligt je koers.
        </h1>
      </div>

      {/* Volgende actie = richtingwijzer */}
      <Card className="relative overflow-hidden p-4">
        <div className="pointer-events-none absolute -right-6 -top-6 opacity-90" aria-hidden="true">
          <WindRose size={96} needle={52} tone={C.signalWash} accent={C.signal} />
        </div>
        <div className="relative flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.signalWash, color: C.signalDark }}
            aria-hidden="true"
          >
            <Navigation size={15} />
          </span>
          <Overline>Volg deze richting</Overline>
        </div>
        <h2
          className="relative mt-3 text-[18px] font-extrabold leading-snug tracking-[-0.01em]"
          style={head}
        >
          {primair.titel}
        </h2>
        <p className="relative mt-1.5 text-[13px] leading-relaxed" style={{ color: C.muted }}>
          {primair.detail}
        </p>
        <div className="relative mt-4">
          <ActionButton onClick={onActies} full>
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </ActionButton>
        </div>
      </Card>

      {/* KPI-tegels */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <Overline tone={C.marine}>Deze maand</Overline>
          <span className="text-[11px] font-semibold" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {KPIS.map((k, i) => (
            <Card key={k.label} className="p-3.5">
              <div className="flex items-start justify-between gap-1">
                <p className="text-[11px] font-bold leading-tight" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.ok : C.signalDark,
                    background: k.up ? C.okWash : C.signalWash,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-1.5 text-[22px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
                style={head}
              >
                {k.value}
              </p>
              <div className="mt-2">
                <Spark data={k.spark} tone={k.up ? C.marineSoft : C.signal} id={`k${i}`} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Open opdrachten */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <Overline tone={C.marine}>Open opdrachten</Overline>
          <button
            onClick={onMarkt}
            className="text-[11.5px] font-bold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.signalDark }}
          >
            Alles
          </button>
        </div>
        <ul className="space-y-2.5">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 hover:border-[#123a5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123a5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd] motion-reduce:transition-none"
                style={{ background: C.paper, borderColor: C.line }}
              >
                <MatchDial value={o.match} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className="block text-[13px] font-bold tabular-nums"
                    style={{ color: C.ink }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="ml-auto transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.faint }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MatchDial({ value }: { value: number }) {
  const R = 15;
  const circ = 2 * Math.PI * R;
  const strong = value >= 90;
  const tone = strong ? C.marine : C.marineSoft;
  return (
    <span
      className="relative inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <svg width={42} height={42} viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={R} fill="none" stroke={C.lineSoft} strokeWidth="4" />
        <circle
          cx="21"
          cy="21"
          r={R}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          transform="rotate(-90 21 21)"
        />
      </svg>
      <span className="absolute text-[11px] font-extrabold tabular-nums" style={{ color: tone }}>
        {value}
      </span>
    </span>
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
    <div className="space-y-4">
      <div>
        <Overline>Marktplaats</Overline>
        <h1
          className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.02em]"
          style={head}
        >
          Open opdrachten
        </h1>
        <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} zichtbaar
        </p>
      </div>

      <div
        className="flex items-center gap-2 rounded-full border px-4 py-2.5"
        style={{ borderColor: C.line, background: C.paperAlt }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#93a0b2]"
          style={{ color: C.ink, ...body }}
        />
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
        {(["match", "tarief"] as const).map((s) => (
          <QuietButton
            key={s}
            onClick={() => setSort(s)}
            active={sort === s}
            ariaPressed={sort === s}
            className="flex-1"
          >
            {s === "match" ? "Beste match" : "Hoogste tarief"}
          </QuietButton>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-0">
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.marineWash }}
              aria-hidden="true"
            >
              <Compass size={28} style={{ color: C.marineSoft }} />
            </span>
            <p className="mt-4 text-[18px] font-extrabold" style={head}>
              Geen koers gevonden
            </p>
            <p className="mx-auto mt-1.5 max-w-[15rem] text-[12.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om verder
              te varen.
            </p>
            <div className="mt-5">
              <ActionButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </ActionButton>
            </div>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
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
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <MatchDial value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Tag tone={C.faint} wash={C.paperAlt}>
              #{String(index + 1).padStart(2, "0")}
            </Tag>
            <span className="truncate text-[11.5px] font-semibold" style={{ color: C.faint }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[16px] font-extrabold leading-snug tracking-[-0.01em]"
            style={head}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <span className="shrink-0 text-[13.5px] font-bold tabular-nums" style={{ color: C.ink }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div
        className="mt-3 flex items-center gap-2 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.marine, background: C.marineWash }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <ActionButton onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </ActionButton>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-3">
            <RedenBlok
              titel="Pluspunten"
              tone={C.ok}
              wash={C.okWash}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Aandachtspunten"
              tone={C.signalDark}
              wash={C.signalWash}
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
  tone,
  wash,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  wash: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: wash }}>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: tone }}>
        {titel}
      </p>
      <ul className="mt-2 space-y-1.5">
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
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft, borderColor: C.line, background: C.paper }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <div
        className="relative overflow-hidden rounded-2xl p-5 text-white"
        style={{ background: C.marine }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-30" aria-hidden="true">
          <WindRose size={140} needle={62} tone="#ffffff" accent={C.signal} />
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ background: C.signal }}
          >
            <Navigation size={11} aria-hidden="true" /> {opdracht.match}% match
          </span>
        </div>
        <h1
          className="relative mt-3 text-[24px] font-extrabold leading-[1.08] tracking-[-0.02em]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-1.5 text-[13px] font-semibold text-white/80">
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <ActionButton>
            Reageer <ArrowRight size={15} aria-hidden="true" />
          </ActionButton>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123a5c]">
            Bewaar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-3.5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1 text-[17px] font-extrabold tabular-nums tracking-[-0.01em]"
              style={head}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <div>
        <Overline>Waarom deze match</Overline>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten.
        </p>
        <div className="mt-3 space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: C.okWash, color: C.ok }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.ok }}
              >
                Pluspunten
              </p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: C.signalWash, color: C.signalDark }}
                aria-hidden="true"
              >
                <AlertTriangle size={15} />
              </span>
              <p
                className="text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.signalDark }}
              >
                Aandachtspunten
              </p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.signalDark }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const R = 26;
  const circ = 2 * Math.PI * R;

  return (
    <div className="space-y-4">
      <div>
        <Overline>Certificaten</Overline>
        <h1
          className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.02em]"
          style={head}
        >
          Verificatie
        </h1>
      </div>

      <Card className="flex items-center gap-4 p-4">
        <div className="relative shrink-0" style={{ width: 68, height: 68 }}>
          <svg width={68} height={68} viewBox="0 0 68 68" aria-hidden="true">
            <circle cx="34" cy="34" r={R} fill="none" stroke={C.lineSoft} strokeWidth="7" />
            <circle
              cx="34"
              cy="34"
              r={R}
              fill="none"
              stroke={C.marine}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - ratio / 100)}
              transform="rotate(-90 34 34)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[19px] font-extrabold tabular-nums leading-none" style={head}>
              {ratio}
            </span>
            <span
              className="text-[8px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              klaar
            </span>
          </div>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: C.ok }}>
            <ShieldCheck size={14} aria-hidden="true" /> {PROFIEL.trust}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
            {verified} van {CREDENTIALS.length} geverifieerd. Eén verloopt binnenkort en vraagt om
            vernieuwing.
          </p>
        </div>
      </Card>

      <ul className="space-y-2.5">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card className="p-4">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123a5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: st.wash, color: st.tone }}
                    aria-hidden="true"
                  >
                    <st.Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ color: st.tone, background: st.wash }}
                    >
                      <st.Icon size={10} aria-hidden="true" /> {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.faint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 rounded-xl p-3" style={{ background: C.paperAlt }}>
                      <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActionButton>
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </ActionButton>
                        <QuietButton>Historie</QuietButton>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-4">
      <div>
        <Overline>Volgende acties</Overline>
        <h1
          className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.02em]"
          style={head}
        >
          Acties
        </h1>
        <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
          Van boven naar beneden — houd je koers zuiver.
        </p>
      </div>

      <ol className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.signalDark : C.marine;
          const wash = warn ? C.signalWash : C.marineWash;
          return (
            <li key={a.titel}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold tabular-nums"
                    style={{ background: wash, color: tone }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: tone, background: wash }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Navigation size={10} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </span>
                    <h2 className="mt-1.5 text-[15px] font-extrabold leading-snug" style={head}>
                      {a.titel}
                    </h2>
                    <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                      {a.detail}
                    </p>
                    <div className="mt-3">
                      <ActionButton onClick={undefined}>
                        {a.cta} <ArrowRight size={14} aria-hidden="true" />
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.02em]"
            style={head}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123a5c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd]"
          style={{ background: C.marine }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuw
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { l: "Betaald", v: totaalBetaald, tone: C.ok, wash: C.okWash, alarm: false },
          { l: "Open", v: "€ 1.350", tone: C.signalDark, wash: C.signalWash, alarm: true },
          { l: "Concept", v: "€ 880", tone: C.marineSoft, wash: C.marineWash, alarm: false },
        ].map((s) => (
          <Card key={s.l} className="p-3">
            <div className="flex items-center gap-1">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.muted }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={11} aria-hidden="true" style={{ color: s.tone }} />}
            </div>
            <p
              className="mt-1.5 text-[16px] font-extrabold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? s.tone : C.ink, ...head }}
            >
              {s.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-3">
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const paid = f.status === "Betaald";
            return (
              <li
                key={f.nr}
                className="flex items-center gap-3 border-b py-3 last:border-0"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: acc ? C.signalWash : paid ? C.okWash : C.paperAlt,
                    color: acc ? C.signalDark : paid ? C.ok : C.muted,
                  }}
                  aria-hidden="true"
                >
                  {acc ? (
                    <AlertTriangle size={15} />
                  ) : paid ? (
                    <Check size={15} />
                  ) : (
                    <Receipt size={15} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold" style={head}>
                    {f.klant}
                  </span>
                  <span
                    className="mt-0.5 flex items-center gap-1.5 text-[11px]"
                    style={{ color: C.faint }}
                  >
                    <span className="tabular-nums">{f.nr}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{f.datum}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className="block text-[14px] font-bold tabular-nums"
                    style={{ color: acc ? C.signalDark : C.ink }}
                  >
                    {f.bedrag}
                  </span>
                  <span
                    className="mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                    style={{
                      color: acc ? C.signalDark : paid ? C.ok : C.muted,
                      background: acc ? C.signalWash : paid ? C.okWash : C.paperAlt,
                    }}
                  >
                    {f.status}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span className="text-[19px] font-extrabold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
