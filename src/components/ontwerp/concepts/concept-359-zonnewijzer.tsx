"use client";

// Concept 359 — "Zonnewijzer" · Solarpunk / natuurlijk-warm.
// Optimistisch, duurzaam, menselijk. Terracotta (#c96f4a), zand (#e8dcc4) en mosgroen (#4f6f52)
// op warme crème (#f6f1e7). Organische, zachte vormen (grote radii, blob-accenten), zacht licht en
// schaduw, en een terugkerend zonnewijzer-motief: een gnomon die de tijd en de voortgang aftast.
// Fonts: Fraunces (display-serif) + Cormorant (accent-serif) + Jakarta (UI) + Manrope (tekst).

import { useMemo, useState } from "react";
import {
  Sun,
  Sprout,
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  MapPin,
  Leaf,
  ShieldCheck,
  ChevronDown,
  Wallet,
  Send,
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

// — Palet: warme aarde-tinten onder de zon —
const C = {
  bg: "#f6f1e7",
  paper: "#fbf7ee",
  cream: "#f1e9d8",
  sand: "#e8dcc4",
  sandDeep: "#dccdb0",
  terra: "#c96f4a",
  terraDeep: "#a9532f",
  terraSoft: "#f0d3c3",
  moss: "#4f6f52",
  mossDeep: "#3c5740",
  mossSoft: "#d8e2d2",
  ink: "#3a2f26",
  inkSoft: "#5f5142",
  muted: "#8a7a68",
  faint: "#a89178",
  line: "rgba(58,47,38,0.12)",
  lineSoft: "rgba(58,47,38,0.07)",
  sun: "#e8a13c",
};

const display = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const accent = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const ui = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.mossDeep, bg: C.mossSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.inkSoft, bg: C.sand };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        fg: C.terraDeep,
        bg: C.terraSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, fg: C.terraDeep, bg: C.terraSoft };
  }
}

// — Zonnewijzer-motief: een cirkel met uur-streepjes en een gnomon-schaduw die de voortgang aftast —
function SunDial({ value, size = 128 }: { value: number; size?: number }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  // gnomon-hoek: 0% → -135°, 100% → -45° (van links-onder naar rechts-onder, als de zon boog)
  const angle = -135 + (Math.min(100, Math.max(0, value)) / 100) * 90;
  const rad = (angle * Math.PI) / 180;
  const gx = cx + Math.cos(rad) * (r - 14);
  const gy = cy + Math.sin(rad) * (r - 14);
  const ticks = Array.from({ length: 13 }, (_, i) => i);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <radialGradient id={`dial-${size}-${value}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={C.sun} stopOpacity="0.18" />
          <stop offset="70%" stopColor={C.sun} stopOpacity="0.05" />
          <stop offset="100%" stopColor={C.sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r - 4} fill={`url(#dial-${size}-${value})`} />
      <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke={C.line} strokeWidth="1" />
      {ticks.map((i) => {
        const a = (-180 + (i / 12) * 180) * (Math.PI / 180);
        const x1 = cx + Math.cos(a) * (r - 10);
        const y1 = cy + Math.sin(a) * (r - 10);
        const x2 = cx + Math.cos(a) * (r - 4);
        const y2 = cy + Math.sin(a) * (r - 4);
        const major = i % 3 === 0;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={major ? C.terra : C.line}
            strokeWidth={major ? 1.6 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {/* schaduw van de gnomon */}
      <line
        x1={cx}
        y1={cy}
        x2={gx}
        y2={gy}
        stroke={C.terra}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill={C.terra} />
      <circle cx={cx} cy={cy} r="9" fill="none" stroke={C.terra} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

// — Organische blob als warm achtergrond-accent —
function Blob({ tone, className }: { tone: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        fill={tone}
        d="M43.9,-58.7C55.5,-49.3,62.5,-34.6,66.4,-19.1C70.3,-3.6,71.1,12.7,64.9,25.7C58.7,38.7,45.5,48.4,31.2,55.9C16.9,63.4,1.5,68.7,-14.7,67.6C-30.9,66.5,-47.9,59,-58.6,46.2C-69.3,33.4,-73.7,15.3,-71.9,-1.4C-70.1,-18.1,-62.1,-33.4,-50.4,-43.1C-38.7,-52.8,-23.3,-56.9,-7.4,-58.9C8.5,-60.9,17,-68.1,43.9,-58.7Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

function Leaflet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 20C4 12 10 4 20 4C20 14 14 20 4 20Z"
        fill={C.mossSoft}
        stroke={C.moss}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M4 20C7 16 11 12 17 8" stroke={C.moss} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Overline({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.26em]"
      style={{ color: tone ?? C.terra, ...ui }}
    >
      {children}
    </p>
  );
}

function Pill({ children, fg, bg }: { children: React.ReactNode; fg: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
      style={{ color: fg, background: bg, ...ui }}
    >
      {children}
    </span>
  );
}

export function Concept359() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      {/* Warme lucht-gloed bovenin */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          background: `radial-gradient(120% 100% at 78% -10%, rgba(232,161,60,0.20), rgba(232,161,60,0) 60%)`,
        }}
        aria-hidden="true"
      />
      <Blob
        tone={C.terraSoft}
        className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 opacity-60"
      />
      <Blob
        tone={C.mossSoft}
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 opacity-50"
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />

        <main className="pb-20 pt-8">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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
  return (
    <header className="flex items-center justify-between pt-8">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm"
          style={{ background: C.terra }}
          aria-hidden="true"
        >
          <Sun size={22} color={C.paper} strokeWidth={2} />
        </span>
        <div>
          <p className="text-[20px] font-semibold leading-none" style={display}>
            Zonnewijzer
          </p>
          <p className="mt-1 text-[12px] leading-none" style={{ color: C.muted }}>
            Werk dat met je meegroeit
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium sm:inline-flex"
          style={{ background: C.mossSoft, color: C.mossDeep, ...ui }}
        >
          <Leaf size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{ background: C.sand, color: C.ink, border: `1px solid ${C.line}`, ...ui }}
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
    <nav
      className="mt-7 flex items-center gap-1.5 overflow-x-auto rounded-[22px] p-1.5"
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
      }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="shrink-0 rounded-2xl px-4 py-2 text-[13.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              on
                ? {
                    background: C.terra,
                    color: C.paper,
                    boxShadow: "0 6px 16px -8px rgba(201,111,74,0.8)",
                    ...ui,
                  }
                : { color: C.inkSoft, ...ui }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// — Card-schil met organisch-zachte radii —
function Card({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <div
      className={`rounded-[26px] p-6 ${className ?? ""}`}
      style={{
        background: tone ?? C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 18px 40px -32px rgba(58,47,38,0.55)",
      }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const matchKpi = KPIS[0] as (typeof KPIS)[number];
  const matchValue = parseInt(matchKpi.value, 10) || 0;

  return (
    <div className="space-y-6">
      {/* Groet + zonnewijzer */}
      <section
        className="relative overflow-hidden rounded-[30px] p-7 md:p-9"
        style={{
          background: `linear-gradient(135deg, ${C.cream}, ${C.sand})`,
          border: `1px solid ${C.line}`,
        }}
      >
        <Blob
          tone={C.terraSoft}
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 opacity-70"
        />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-md">
            <Overline>Goedemorgen</Overline>
            <h1
              className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.01em] md:text-[46px]"
              style={display}
            >
              Dag {PROFIEL.naam.split(" ")[0]},
              <br />
              de zon staat gunstig.
            </h1>
            <p
              className="mt-2 text-[19px] italic leading-snug"
              style={{ color: C.terra, ...accent }}
            >
              {PROFIEL.rol}
            </p>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je profiel groeit gestaag. Eén ding vraagt vandaag om aandacht — de rest bloeit
              vanzelf verder.
            </p>
            <button
              onClick={onOpen}
              className="group mt-6 inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
              style={{ background: C.terra, color: C.paper, ...ui }}
            >
              Bekijk je beste match
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-3">
            <SunDial value={matchValue} size={148} />
            <div className="text-center">
              <p className="text-[30px] font-semibold tabular-nums leading-none" style={display}>
                {matchKpi.value}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                gemiddelde match
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI-tuin */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label}>
            <div className="flex items-start justify-between">
              <p
                className="text-[12px] font-medium leading-tight"
                style={{ color: C.muted, ...ui }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums"
                style={{
                  color: k.up ? C.mossDeep : C.terraDeep,
                  background: k.up ? C.mossSoft : C.terraSoft,
                  ...ui,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
              style={display}
            >
              {k.value}
            </p>
            <Sparkline data={k.spark} up={k.up} />
          </Card>
        ))}
      </section>

      {/* Twee kolommen: aandacht + opdrachten */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card tone={C.mossSoft} className="h-full">
            <div className="flex items-center gap-2">
              <Sprout size={16} color={C.mossDeep} aria-hidden="true" />
              <Overline tone={C.mossDeep}>Vandaag verzorgen</Overline>
            </div>
            <h2 className="mt-4 text-[21px] font-semibold leading-snug" style={display}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.mossDeep }}>
              {primair.detail}
            </p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
              style={{ background: C.moss, color: C.paper, ...ui }}
            >
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between">
              <Overline>Opdrachten die bij je passen</Overline>
              <button
                onClick={onOpen}
                className="text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ color: C.terra, ...ui }}
              >
                Alle bekijken
              </button>
            </div>
            <ul className="space-y-2.5">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={onOpen}
                    className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#f1e9d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <MatchLeaf value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold" style={display}>
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12.5px]"
                        style={{ color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.terra }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MatchLeaf({ value }: { value: number }) {
  const filled = value >= 90 ? C.moss : value >= 80 ? C.sun : C.terra;
  return (
    <span
      className="relative flex h-12 w-12 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <svg width={48} height={48} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke={C.line} strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={filled}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 125.6} 125.6`}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span
        className="absolute text-[12px] font-semibold tabular-nums"
        style={{ color: C.ink, ...ui }}
      >
        {value}
      </span>
    </span>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 96;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = up ? C.moss : C.terra;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-3" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [only90, setOnly90] = useState(false);
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return OPDRACHTEN.filter((o) => {
      const matchQ =
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle);
      const match90 = only90 ? o.match >= 90 : true;
      return matchQ && match90;
    });
  }, [q, only90]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Marktplaats</Overline>
          <h1
            className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.01em]"
            style={display}
          >
            Open opdrachten
          </h1>
        </div>
        <p className="text-[13px]" style={{ color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten tonen
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-3"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-[#a89178]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <button
          onClick={() => setOnly90((v) => !v)}
          aria-pressed={only90}
          className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={
            only90
              ? { background: C.moss, color: C.paper, ...ui }
              : { background: C.paper, color: C.inkSoft, border: `1px solid ${C.line}`, ...ui }
          }
        >
          <Leaf size={14} aria-hidden="true" /> Alleen 90%+
        </button>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-[26px] px-6 py-16 text-center"
          style={{ background: C.paper, border: `1px dashed ${C.line}` }}
        >
          <Leaflet className="h-12 w-12" />
          <p className="mt-4 text-[24px] font-semibold" style={display}>
            Nog niets in bloei
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[14px]" style={{ color: C.muted }}>
            Geen opdracht past bij {q ? `“${q}”` : "deze filters"}. Verruim je zoekopdracht of zet
            de filter uit.
          </p>
          <button
            onClick={() => {
              setQ("");
              setOnly90(false);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
            style={{ background: C.terra, color: C.paper, ...ui }}
          >
            Filters wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start gap-3">
        <MatchLeaf value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-snug" style={display}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px]" style={{ color: C.muted }}>
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
            style={{ background: C.sand, color: C.inkSoft, ...ui }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        className="mt-4 grid grid-cols-3 gap-2 border-t pt-4"
        style={{ borderColor: C.lineSoft }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
        ].map((m) => (
          <div key={m.l}>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: C.ink }}>
              {m.v}
            </p>
            <p
              className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.terra, ...ui }}
      >
        Waarom deze match
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="transition-transform motion-reduce:transition-none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-1.5">
            {opdracht.redenen.plus.map((r) => (
              <p
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
                style={{ color: C.mossDeep }}
              >
                <Check size={14} aria-hidden="true" className="mt-0.5 shrink-0" /> {r}
              </p>
            ))}
            {opdracht.redenen.min.map((r) => (
              <p
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
                style={{ color: C.muted }}
              >
                <AlertTriangle
                  size={13}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: C.terra }}
                />{" "}
                {r}
              </p>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onOpen}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
        style={{ background: C.cream, color: C.ink, border: `1px solid ${C.line}`, ...ui }}
      >
        Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
      </button>
    </Card>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...ui }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <section
        className="relative overflow-hidden rounded-[30px] p-7 md:p-9"
        style={{
          background: `linear-gradient(135deg, ${C.paper}, ${C.cream})`,
          border: `1px solid ${C.line}`,
        }}
      >
        <Blob
          tone={C.mossSoft}
          className="pointer-events-none absolute -bottom-16 -right-12 h-56 w-56 opacity-70"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-lg">
            <div className="flex items-center gap-3">
              <Overline>{opdracht.id}</Overline>
              <Pill fg={C.mossDeep} bg={C.mossSoft}>
                <ShieldCheck size={12} aria-hidden="true" /> Geverifieerde opdrachtgever
              </Pill>
            </div>
            <h1
              className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[40px]"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p
              className="mt-3 flex items-center gap-1.5 text-[14.5px]"
              style={{ color: C.inkSoft }}
            >
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-3 py-1 text-[12px] font-medium"
                  style={{ background: C.sand, color: C.inkSoft, ...ui }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                style={{ background: C.terra, color: C.paper, ...ui }}
              >
                Reageer op opdracht <Send size={15} aria-hidden="true" />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.paper,
                  color: C.inkSoft,
                  border: `1px solid ${C.line}`,
                  ...ui,
                }}
              >
                Bewaar
              </button>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2">
            <SunDial value={opdracht.match} size={132} />
            <p className="text-[13px] font-semibold" style={{ color: C.terra, ...ui }}>
              {opdracht.match}% match
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l}>
            <p
              className="text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              {m.l}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card tone={C.mossSoft}>
          <div className="flex items-center gap-2">
            <Check size={15} color={C.mossDeep} aria-hidden="true" />
            <Overline tone={C.mossDeep}>Wat past bij je</Overline>
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px]"
                style={{ color: C.mossDeep }}
              >
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.moss }}
                  aria-hidden="true"
                >
                  <Check size={10} color={C.paper} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} color={C.terraDeep} aria-hidden="true" />
            <Overline>Aandachtspunten</Overline>
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px]"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.terraSoft }}
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.terra }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
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
      <section
        className="relative overflow-hidden rounded-[30px] p-7 md:p-9"
        style={{
          background: `linear-gradient(135deg, ${C.cream}, ${C.sand})`,
          border: `1px solid ${C.line}`,
        }}
      >
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-md">
            <Overline>Vertrouwen</Overline>
            <h1
              className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.01em]"
              style={display}
            >
              Jouw verificatie
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.mossDeep }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn volledig geverifieerd. Eén
              vraagt binnenkort om actie.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <SunDial value={ratio} size={116} />
            <div>
              <p className="text-[28px] font-semibold tabular-nums leading-none" style={display}>
                {ratio}%
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                compleet
              </p>
            </div>
          </div>
        </div>
      </section>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card className="!p-0">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 rounded-[26px] px-6 py-5 text-left transition-colors hover:bg-[#f1e9d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: st.bg }}
                    aria-hidden="true"
                  >
                    <st.Icon size={19} style={{ color: st.fg }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold" style={display}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <Pill fg={st.fg} bg={st.bg}>
                    <st.Icon size={12} aria-hidden="true" /> {st.label}
                  </Pill>
                  <ChevronDown
                    size={17}
                    aria-hidden="true"
                    className="ml-1 shrink-0 transition-transform motion-reduce:transition-none"
                    style={{
                      color: C.muted,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="border-t px-6 py-4" style={{ borderColor: C.lineSoft }}>
                      <p className="text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                        {c.detail}. Documenten worden versleuteld bewaard en alleen gedeeld nadat je
                        daar zelf toestemming voor geeft.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: C.terra, color: C.paper, ...ui }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Document bekijken"}
                        </button>
                        <button
                          className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            background: C.cream,
                            color: C.inkSoft,
                            border: `1px solid ${C.line}`,
                            ...ui,
                          }}
                        >
                          Geschiedenis
                        </button>
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

function urgencyMeta(u: "warning" | "info"): { fg: string; bg: string; Icon: LucideIcon } {
  return u === "warning"
    ? { fg: C.terraDeep, bg: C.terraSoft, Icon: AlertTriangle }
    : { fg: C.mossDeep, bg: C.mossSoft, Icon: Sprout };
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Overline>Aandacht</Overline>
        <h1
          className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.01em]"
          style={display}
        >
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Klein onderhoud houdt je profiel in bloei. Handel deze op volgorde af.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const m = urgencyMeta(a.urgentie);
          return (
            <li key={a.titel}>
              <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold tabular-nums"
                  style={{ background: m.bg, color: m.fg, ...display }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <m.Icon size={15} aria-hidden="true" style={{ color: m.fg }} />
                    <h2 className="text-[17px] font-semibold leading-snug" style={display}>
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                  style={
                    a.urgentie === "warning"
                      ? { background: C.terra, color: C.paper, ...ui }
                      : { background: C.cream, color: C.ink, border: `1px solid ${C.line}`, ...ui }
                  }
                >
                  {a.cta}
                </button>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { fg: string; bg: string } {
  if (status === "Betaald") return { fg: C.mossDeep, bg: C.mossSoft };
  if (status === "Openstaand") return { fg: C.terraDeep, bg: C.terraSoft };
  return { fg: C.inkSoft, bg: C.sand };
}

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald");
  const totaalBetaald = "€ 8.622";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Omzet</Overline>
          <h1
            className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.01em]"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
          style={{ background: C.terra, color: C.paper, ...ui }}
        >
          <Wallet size={16} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card tone={C.mossSoft}>
          <p className="text-[12px] font-medium" style={{ color: C.mossDeep, ...ui }}>
            Betaald deze maand
          </p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums" style={display}>
            {totaalBetaald}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: C.mossDeep }}>
            {betaald.length} facturen voldaan
          </p>
        </Card>
        <Card>
          <p className="text-[12px] font-medium" style={{ color: C.muted, ...ui }}>
            Openstaand
          </p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums" style={display}>
            € 1.350
          </p>
          <p className="mt-1 text-[12px]" style={{ color: C.terraDeep }}>
            1 factuur, 9 dagen oud
          </p>
        </Card>
        <Card>
          <p className="text-[12px] font-medium" style={{ color: C.muted, ...ui }}>
            Concept
          </p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums" style={display}>
            € 880
          </p>
          <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
            klaar om te versturen
          </p>
        </Card>
      </div>

      <Card className="!p-0">
        <ul>
          {FACTUREN.map((f, i) => {
            const t = factuurTone(f.status);
            return (
              <li
                key={f.nr}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[#f1e9d8]"
                style={i > 0 ? { borderTop: `1px solid ${C.lineSoft}` } : undefined}
              >
                <span
                  className="hidden font-medium tabular-nums sm:inline-block sm:w-32 sm:text-[12.5px]"
                  style={{ color: C.faint, ...ui }}
                >
                  {f.nr}
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-semibold" style={display}>
                  {f.klant}
                </span>
                <span
                  className="hidden text-[12.5px] tabular-nums sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <Pill fg={t.fg} bg={t.bg}>
                  {f.status}
                </Pill>
                <span
                  className="w-24 text-right text-[15px] font-semibold tabular-nums"
                  style={display}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
