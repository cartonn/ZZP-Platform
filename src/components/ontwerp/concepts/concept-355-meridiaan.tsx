"use client";

// Concept 355 — "Meridiaan" · Cartografisch. Hoogtelijnen/contour als subtiele achtergrondtextuur
// (zelf getekende inline SVG-paden), coördinaat-labels, kaart-als-datalaag, één kompas/route-accent.
// Wayfinding: elk scherm beantwoordt “wat is de volgende beste route?”. Aardse inkt op perkament.
// Palet: perkament #efe9dd, inkt #2b3a2e, sepia #6b5b3e, route-accent #b4552d.
// Fonts: Franklin (display) + Manrope (UI) + Mono (coördinaten).

import { useMemo, useState } from "react";
import {
  Compass,
  Search,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  Navigation,
  Check,
  Minus,
  ChevronRight,
  Route,
  FileText,
  LayoutGrid,
  Flag,
  Receipt,
  ArrowLeft,
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

const C = {
  bg: "#efe9dd",
  paper: "#f5f1e8",
  panel: "#f8f5ee",
  ink: "#2b3a2e",
  inkSoft: "#455040",
  sepia: "#6b5b3e",
  faint: "#9a8f78",
  line: "rgba(107,91,62,0.24)",
  lineSoft: "rgba(107,91,62,0.14)",
  route: "#b4552d",
  ok: "#4a7a52",
  warn: "#a9721f",
  bad: "#b04a3f",
};

const display = { fontFamily: "var(--font-lab-franklin)" };
const ui = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Vaste, plausibele coördinaten per scherm — het “wayfinding”-idee.
const COORDS: Record<ScreenKey, string> = {
  dashboard: "52°05′N 5°07′E",
  marktplaats: "52°06′N 5°10′E",
  opdracht: "52°05′N 5°08′E",
  verificatie: "52°04′N 5°06′E",
  acties: "52°07′N 5°11′E",
  facturen: "52°05′N 5°09′E",
  documenten: "52°03′N 5°05′E",
  berichten: "52°08′N 5°12′E",
};

const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Search,
  opdracht: MapPin,
  verificatie: ShieldCheck,
  acties: Flag,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, color: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.sepia };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.bad };
  }
}

// Hoogtelijnen — zelf getekende, geneste contourpaden als achtergrondtextuur.
function Contour({ className }: { className?: string }) {
  const paths = [
    "M-20 90 C 80 40, 180 140, 300 70 S 520 20, 640 90",
    "M-20 130 C 90 80, 200 170, 320 110 S 540 60, 660 120",
    "M-20 170 C 100 120, 220 200, 340 150 S 560 110, 680 160",
    "M-20 210 C 110 170, 240 240, 360 190 S 580 150, 700 200",
    "M-20 50 C 70 10, 170 90, 290 30 S 500 -10, 620 50",
  ];
  return (
    <svg
      className={className}
      viewBox="0 0 640 260"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={C.sepia} strokeWidth="1" strokeOpacity={0.18 - i * 0.02} />
      ))}
    </svg>
  );
}

function CompassRose({ size = 84 }: { size?: number }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <circle cx={c} cy={c} r={c - 3} stroke={C.line} strokeWidth="1" />
      <circle cx={c} cy={c} r={c - 12} stroke={C.lineSoft} strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = c + Math.sin(rad) * (c - 12);
        const y1 = c - Math.cos(rad) * (c - 12);
        const x2 = c + Math.sin(rad) * (c - 5);
        const y2 = c - Math.cos(rad) * (c - 5);
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.sepia}
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        );
      })}
      {/* Noord-naald in route-accent */}
      <path d={`M${c} 12 L${c + 6} ${c} L${c} ${c - 4} L${c - 6} ${c} Z`} fill={C.route} />
      <path
        d={`M${c} ${size - 12} L${c + 6} ${c} L${c} ${c + 4} L${c - 6} ${c} Z`}
        fill={C.sepia}
        fillOpacity="0.55"
      />
      <circle cx={c} cy={c} r="2.5" fill={C.ink} />
    </svg>
  );
}

const ringFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#b4552d] focus-visible:ring-offset-[#efe9dd]";

function Coord({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] tracking-[0.08em]" style={{ ...mono, color: C.faint }}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`relative rounded-lg ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </section>
  );
}

function MatchGauge({ value }: { value: number }) {
  // Halfronde meter — als een kompas-hoek.
  const r = 26;
  const circ = Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <svg width="64" height="40" viewBox="0 0 64 40" fill="none" aria-hidden="true">
      <path
        d="M6 34 A26 26 0 0 1 58 34"
        stroke={C.lineSoft}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M6 34 A26 26 0 0 1 58 34"
        stroke={C.route}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={off}
      />
    </svg>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium"
      style={{
        background: "rgba(107,91,62,0.09)",
        color: C.sepia,
        border: `1px solid ${C.lineSoft}`,
      }}
    >
      {children}
    </span>
  );
}

export function Concept355() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id: string) => {
    setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <Contour className="pointer-events-none absolute inset-x-0 top-0 h-[320px] w-full opacity-70" />
      <Contour className="pointer-events-none absolute inset-x-0 bottom-0 h-[280px] w-full rotate-180 opacity-50" />

      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <Sidebar screen={screen} setScreen={setScreen} />
          <main>
            {screen === "dashboard" && <Dashboard onOpen={open} goto={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} />}
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

function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <aside className="md:sticky md:top-8 md:self-start">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Compass size={20} style={{ color: C.route }} />
          </span>
          <div className="leading-tight">
            <p className="text-[16px] font-bold tracking-tight" style={display}>
              Meridiaan
            </p>
            <Coord>ZZP · ATLAS</Coord>
          </div>
        </div>

        <nav
          className="mt-5 flex gap-1.5 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = SCREEN_ICON[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`group flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] transition-colors ${ringFocus} md:w-full`}
                style={{
                  color: on ? C.ink : C.inkSoft,
                  fontWeight: on ? 700 : 500,
                  background: on ? C.paper : "transparent",
                  border: `1px solid ${on ? C.line : "transparent"}`,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.route : C.faint }} />
                <span className="whitespace-nowrap">{s.label}</span>
                {on && (
                  <span
                    className="ml-auto hidden h-1.5 w-1.5 rounded-full md:block"
                    style={{ background: C.route }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div
          className="mt-5 hidden items-center gap-3 rounded-md p-3 md:flex"
          style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: C.ink, color: C.paper }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</p>
            <Coord>{PROFIEL.plaats}</Coord>
          </div>
        </div>
      </Card>
    </aside>
  );
}

function Header({ eyebrow, title, coord }: { eyebrow: string; title: string; coord: ScreenKey }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Navigation size={12} aria-hidden="true" style={{ color: C.route }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: C.sepia }}
          >
            {eyebrow}
          </span>
        </div>
        <h1 className="mt-1.5 text-[27px] font-bold tracking-tight md:text-[32px]" style={display}>
          {title}
        </h1>
      </div>
      <div className="hidden text-right sm:block">
        <Coord>{COORDS[coord]}</Coord>
      </div>
    </div>
  );
}

function Dashboard({
  onOpen,
  goto,
}: {
  onOpen: (id: string) => void;
  goto: (s: ScreenKey) => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="max-w-md">
            <Coord>
              {COORDS.dashboard} · {PROFIEL.trust}
            </Coord>
            <h1
              className="mt-2 text-[30px] font-bold leading-[1.08] tracking-tight md:text-[38px]"
              style={display}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je koers ligt vast. Eén oriëntatiepunt vraagt vandaag aandacht — de rest van de route
              is helder.
            </p>
            <button
              onClick={() => goto("acties")}
              className={`mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold text-white transition-colors ${ringFocus}`}
              style={{ background: C.ink }}
            >
              <Route size={15} aria-hidden="true" />
              Volgende route
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CompassRose />
            <Coord>koers · {primair.cta}</Coord>
          </div>
        </div>

        <div
          className="flex items-start gap-3 border-t p-4"
          style={{ borderColor: C.line, background: "rgba(180,85,45,0.06)" }}
        >
          <AlertTriangle size={16} aria-hidden="true" style={{ color: C.route, marginTop: 2 }} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">{primair.titel}</p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={() => goto("verificatie")}
            className={`shrink-0 self-center rounded-md px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${ringFocus}`}
            style={{ border: `1px solid ${C.route}`, color: C.route }}
          >
            {primair.cta}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11.5px]" style={{ color: C.sepia }}>
              {k.label}
            </p>
            <p className="mt-2 text-[24px] font-bold tabular-nums tracking-tight" style={display}>
              {k.value}
            </p>
            <p
              className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums"
              style={{ ...mono, color: k.up ? C.ok : C.warn }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-5 md:p-6">
        <Header eyebrow="Verkende opdrachten" title="Op de kaart" coord="dashboard" />
        <ul className="mt-5 space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <OpdrachtRow key={o.id} o={o} index={i} onOpen={onOpen} />
          ))}
        </ul>
        <button
          onClick={() => goto("marktplaats")}
          className={`mt-4 inline-flex items-center gap-1 rounded-md px-3 py-2 text-[12.5px] font-semibold transition-colors ${ringFocus}`}
          style={{ color: C.route }}
        >
          Ontdek alle opdrachten
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </Card>
    </div>
  );
}

function OpdrachtRow({
  o,
  index,
  onOpen,
}: {
  o: Opdracht;
  index: number;
  onOpen: (id: string) => void;
}) {
  return (
    <li>
      <button
        onClick={() => onOpen(o.id)}
        className={`group flex w-full items-center gap-4 rounded-md p-3.5 text-left transition-colors hover:bg-[rgba(107,91,62,0.06)] ${ringFocus}`}
        style={{ border: `1px solid ${C.lineSoft}` }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
          style={{ ...mono, background: C.paper, border: `1px solid ${C.line}`, color: C.sepia }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight" style={display}>
            {o.titel}
          </p>
          <p
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
            style={{ color: C.inkSoft }}
          >
            <MapPin size={12} aria-hidden="true" style={{ color: C.faint }} />
            {o.opdrachtgever} · {o.plaats}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {o.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="hidden flex-col items-center gap-1 sm:flex">
          <MatchGauge value={o.match} />
          <span className="text-[11px] font-bold tabular-nums" style={{ ...mono, color: C.route }}>
            {o.match}%
          </span>
        </div>
        <div className="hidden shrink-0 text-right md:block">
          <p className="text-[13.5px] font-bold tabular-nums" style={{ ...mono, color: C.ink }}>
            {o.tarief}
          </p>
          <Coord>{o.uren}</Coord>
        </div>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          style={{ color: C.route }}
        />
      </button>
    </li>
  );
}

function Marktplaats({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter((o) => {
        const t = q.toLowerCase();
        return (
          o.titel.toLowerCase().includes(t) ||
          o.plaats.toLowerCase().includes(t) ||
          o.opdrachtgever.toLowerCase().includes(t) ||
          o.tags.some((x) => x.toLowerCase().includes(t))
        );
      }),
    [q],
  );

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <Header eyebrow="Marktplaats" title="Verken opdrachten" coord="marktplaats" />
        <div
          className="mt-5 flex items-center gap-3 rounded-md px-4 py-3"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.sepia }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of vaardigheid…"
            aria-label="Opdrachten zoeken"
            className={`w-full rounded-md bg-transparent text-[14.5px] outline-none placeholder:text-[#9a8f78] ${ringFocus}`}
            style={{ color: C.ink }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className={`rounded px-2 py-1 text-[12px] font-semibold transition-colors hover:bg-[rgba(107,91,62,0.08)] ${ringFocus}`}
              style={{ color: C.sepia }}
            >
              Wissen
            </button>
          )}
        </div>
        <Coord>
          {filtered.length} van {OPDRACHTEN.length} bestemmingen in beeld
        </Coord>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
          >
            <MapPin size={24} aria-hidden="true" style={{ color: C.route }} />
          </div>
          <p className="mt-4 text-[18px] font-bold tracking-tight" style={display}>
            Geen bestemming gevonden
          </p>
          <p
            className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            Op deze koers ligt niets dat past bij “{q}”. Verleg je route of verruim je zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold text-white transition-colors ${ringFocus}`}
            style={{ background: C.ink }}
          >
            <Compass size={15} aria-hidden="true" />
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <Card className="p-5 md:p-6">
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <OpdrachtRow key={o.id} o={o} index={i} onOpen={onOpen} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const metrics = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}%` },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[rgba(107,91,62,0.08)] ${ringFocus}`}
        style={{ color: C.sepia }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Terug naar de kaart
      </button>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 p-6">
          <div className="min-w-0 max-w-lg">
            <div className="flex items-center gap-2.5">
              <Tag>
                <span style={mono}>{opdracht.id}</span>
              </Tag>
              <Coord>{COORDS.opdracht}</Coord>
            </div>
            <h1
              className="mt-3 text-[27px] font-bold leading-tight tracking-tight md:text-[33px]"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkSoft }}>
              <MapPin size={14} aria-hidden="true" style={{ color: C.route }} />
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            <button
              className={`mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold text-white transition-colors ${ringFocus}`}
              style={{ background: C.ink }}
            >
              <Flag size={15} aria-hidden="true" />
              Reageer op opdracht
            </button>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative flex items-center justify-center">
              <MatchGauge value={opdracht.match} />
            </div>
            <span className="text-[22px] font-bold tabular-nums leading-none" style={display}>
              {opdracht.match}%
            </span>
            <Coord>match-koers</Coord>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.l} className="p-4">
            <Coord>{m.l.toUpperCase()}</Coord>
            <p className="mt-1.5 text-[19px] font-bold tabular-nums tracking-tight" style={display}>
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Route size={16} aria-hidden="true" style={{ color: C.route }} />
          <h2 className="text-[16px] font-bold tracking-tight" style={display}>
            Waarom deze route past
          </h2>
        </div>
        <p className="mt-2 max-w-lg text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          Onderbouwd op je geverifieerde profiel — de meewind én de tegenwind, zonder verborgen
          score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            className="rounded-md p-4"
            style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.ok }}
            >
              Meewind
            </p>
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
                    style={{ color: C.ok, marginTop: 2, flexShrink: 0 }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-md p-4"
            style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.warn }}
            >
              Tegenwind
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.sepia }}
                >
                  <Minus
                    size={15}
                    aria-hidden="true"
                    style={{ color: C.warn, marginTop: 2, flexShrink: 0 }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Verificatie() {
  const [openItem, setOpenItem] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Header eyebrow="Vertrouwen" title="Verificatie" coord="verificatie" />
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span style={{ color: C.ink, fontWeight: 700 }}>{PROFIEL.trust}.</span> {verified} van{" "}
              {CREDENTIALS.length} bakens volledig geverifieerd. Eén vraagt binnenkort actie.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[28px] font-bold tabular-nums leading-none" style={display}>
                {pct}%
              </p>
              <Coord>geverifieerd</Coord>
            </div>
            <div
              className="h-14 w-14 rounded-full"
              style={{
                background: `conic-gradient(${C.route} ${pct * 3.6}deg, ${C.lineSoft} 0)`,
                mask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
                WebkitMask:
                  "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        <ul className="space-y-2.5">
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            const isOpen = openItem === c.naam;
            return (
              <li
                key={c.naam}
                className="rounded-md"
                style={{ border: `1px solid ${C.lineSoft}`, background: C.paper }}
              >
                <button
                  onClick={() => setOpenItem(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 rounded-md p-4 text-left transition-colors hover:bg-[rgba(107,91,62,0.05)] ${ringFocus}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${st.color}18`, border: `1px solid ${st.color}44` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} style={{ color: st.color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-bold tracking-tight"
                      style={display}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block text-[12px] font-semibold"
                      style={{ color: st.color }}
                    >
                      {st.label}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{ color: C.faint, transform: isOpen ? "rotate(90deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 pl-16 text-[13px]" style={{ color: C.inkSoft }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Acties() {
  const tone = (u: "warning" | "info") =>
    u === "warning" ? { color: C.route, Icon: AlertTriangle } : { color: C.sepia, Icon: Flag };
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Header eyebrow="Aandacht" title="Volgende routepunten" coord="acties" />
        <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Deze bakens houden je koers scherp en verifieerbaar. Van hoog naar laag op urgentie.
        </p>
      </Card>
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone(a.urgentie);
          return (
            <li key={a.titel}>
              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: `${t.color}14`, border: `1px solid ${t.color}33` }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} style={{ color: t.color }} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-bold tracking-tight" style={display}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-md text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className={`shrink-0 self-start rounded-md px-4 py-2 text-[12.5px] font-semibold transition-colors ${ringFocus}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    {a.cta}
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald");
  const totaal = betaald
    .reduce((sum, f) => sum + Number(f.bedrag.replace(/[^0-9]/g, "")), 0)
    .toLocaleString("nl-NL");
  const statusColor = (s: string) =>
    s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.faint;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-end justify-between gap-4 p-6">
        <Header eyebrow="Omzet" title="Facturen" coord="facturen" />
        <button
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold text-white transition-colors ${ringFocus}`}
          style={{ background: C.ink }}
        >
          <Receipt size={15} aria-hidden="true" />
          Nieuwe factuur
        </button>
      </Card>

      <Card className="overflow-hidden">
        <div
          className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.9fr] gap-4 px-5 py-3 text-[10.5px] uppercase tracking-[0.14em] sm:grid"
          style={{ color: C.faint, borderBottom: `1px solid ${C.line}`, ...mono }}
        >
          <span>Klant</span>
          <span>Nummer</span>
          <span>Datum</span>
          <span className="text-right">Bedrag</span>
        </div>
        <ul>
          {FACTUREN.map((f) => (
            <li
              key={f.nr}
              className="grid grid-cols-2 items-center gap-3 px-5 py-4 transition-colors hover:bg-[rgba(107,91,62,0.05)] sm:grid-cols-[1.4fr_1fr_0.7fr_0.9fr] sm:gap-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold tracking-tight" style={display}>
                  {f.klant}
                </p>
                <span
                  className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                  style={{ color: statusColor(f.status) }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: statusColor(f.status) }}
                    aria-hidden="true"
                  />
                  {f.status}
                </span>
              </div>
              <span
                className="hidden text-[12.5px] tabular-nums sm:block"
                style={{ ...mono, color: C.sepia }}
              >
                {f.nr}
              </span>
              <span
                className="hidden text-[12.5px] tabular-nums sm:block"
                style={{ ...mono, color: C.sepia }}
              >
                {f.datum}
              </span>
              <span
                className="text-right text-[15px] font-bold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {f.bedrag}
              </span>
            </li>
          ))}
        </ul>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: C.paper }}
        >
          <span
            className="text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.sepia, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[20px] font-bold tabular-nums" style={display}>
            € {totaal}
          </span>
        </div>
      </Card>
    </div>
  );
}
