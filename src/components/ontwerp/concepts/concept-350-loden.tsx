"use client";

// Concept 350 — "Loden" · loodgrijs industrieel-verfijnd, machine-precisie.
// Rationale: de bemiddelaar wil grip — dichtheid, precisie en betrouwbaarheid, geen speelsheid.
// Loden kiest een gunmetal/graphiet-palet: koele grijstinten met een geborsteld-metaal gevoel via
// subtiele gradient-hints (geen textuurplaatjes), afgezet tegen één fel signaal-accent — elektrisch
// oranje — dat uitsluitend opduikt waar actie of alarm telt. Alles is strak, robuust en compact:
// tabulaire mono-cijfers, dunne scheidslijnen, meetlat-koppen en een pro-data-dichtheid die aan een
// controlepaneel doet denken. Verificatie en compliance zijn hier meetbare toestanden met heldere
// statuschips (label + icoon), en matching wordt cijfermatig verklaard. Machinaal precies, kil
// betrouwbaar — het dashboard voor wie de hele keten wil overzien.
// Fonts: --font-lab-geist (koppen, technisch-neutraal) + --font-lab-mono (cijfers/labels) +
// --font-lab-plex (tekst, ingenieurstoon).

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Store,
  SquareStack,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Gauge,
  Cpu,
  Check,
  Clock,
  TriangleAlert,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCw,
  CircleSlash,
  Zap,
  SlidersHorizontal,
  Terminal,
  Radio,
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

/* ---------- Palet — gunmetal/graphiet + één elektrisch-oranje signaal ---------- */

const C = {
  bg: "#14171b", // diep graphiet
  bgSoft: "#181c21",
  panel: "#1d2228", // paneel-oppervlak
  panelHi: "#232931", // opgetild paneel
  ridge: "#2b323b", // geborsteld-metaal richel
  line: "#2a3038", // scheidslijn
  lineSoft: "#242a31",
  ink: "#eef2f6", // koud wit
  sub: "#9aa5b1", // grijze subtekst
  faint: "#6b7580", // fluister
  steel: "#c3ccd6", // helder staal
  // Eén signaal-accent — elektrisch oranje
  signal: "#ff6a1a",
  signalDim: "#c74f10",
  signalSoft: "rgba(255,106,26,0.12)",
  signalLine: "rgba(255,106,26,0.34)",
  // Status
  ok: "#3ecf8e",
  okSoft: "rgba(62,207,142,0.13)",
  warn: "#f2b134",
  warnSoft: "rgba(242,177,52,0.13)",
  alert: "#ff5a52",
  alertSoft: "rgba(255,90,82,0.13)",
  info: "#54a8ff",
  infoSoft: "rgba(84,168,255,0.13)",
};

const head = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-plex), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a1a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14171b]";

// Geborsteld-metaal gradient — puur kleur/gradient, geen afbeelding.
const BRUSHED = `linear-gradient(180deg, ${C.panelHi} 0%, ${C.panel} 60%, ${C.bgSoft} 100%)`;
const RIDGE_SHADOW = "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.5)";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: TriangleAlert };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.lineSoft };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: SquareStack,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Bouwstenen ---------- */

function StatusPill({ status, size = "md" }: { status: CredStatus; size?: "sm" | "md" }) {
  const t = credTone(status);
  const Icon = t.Icon;
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[10.5px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold uppercase tracking-wide ${pad}`}
      style={{ ...mono, color: t.fg, background: t.soft, border: `1px solid ${t.fg}33` }}
    >
      <Icon size={size === "sm" ? 10 : 11} strokeWidth={2.6} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Technische stapgrafiek — als een oscilloscoop-uitlezing, hoekig en precies.
function StepChart({
  data,
  color,
  height = 40,
  width = 108,
}: {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}) {
  const w = width;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / data.length;
  let d = "";
  data.forEach((v, i) => {
    const y = h - ((v - min) / span) * (h - 6) - 3;
    const x0 = i * step;
    const x1 = (i + 1) * step;
    d += `${i === 0 ? `M${x0.toFixed(1)} ${y.toFixed(1)}` : `L${x0.toFixed(1)} ${y.toFixed(1)}`} L${x1.toFixed(1)} ${y.toFixed(1)} `;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="miter" />
    </svg>
  );
}

// Barcode-achtige balkjes — machinale dichtheidsuitlezing.
function BarStrip({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 34 }} aria-hidden="true">
      {data.map((v, i) => {
        const on = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-[6px]"
            style={{
              height: `${Math.max(12, (v / max) * 100)}%`,
              background: on ? color : `${color}44`,
            }}
          />
        );
      })}
    </div>
  );
}

// Lineaire meter met tick-schaal — een instrumentpaneel-uitlezing.
function LinearGauge({ value, color = C.signal }: { value: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div
        className="relative h-2 w-full overflow-hidden rounded-sm"
        style={{ background: C.bg, border: `1px solid ${C.line}` }}
      >
        <div className="h-full" style={{ width: `${clamped}%`, background: color }} />
      </div>
      <div className="mt-1 flex justify-between" aria-hidden="true">
        {[0, 25, 50, 75, 100].map((t) => (
          <span key={t} className="h-1 w-px" style={{ background: C.line }} />
        ))}
      </div>
    </div>
  );
}

function Panel({
  children,
  className = "",
  hi = false,
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  hi?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-md ${className}`}
      style={{
        background: hi ? BRUSHED : C.panel,
        border: `1px solid ${accent ? C.signalLine : C.line}`,
        boxShadow: RIDGE_SHADOW,
      }}
    >
      {children}
    </div>
  );
}

function PageHead({
  code,
  title,
  sub,
  right,
}: {
  code: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-end justify-between gap-4 border-b px-6 py-4"
      style={{ borderColor: C.line }}
    >
      <div className="min-w-0">
        <p
          className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.signal }}
        >
          <span
            className="inline-block h-1.5 w-1.5"
            style={{ background: C.signal }}
            aria-hidden="true"
          />
          {code}
        </p>
        <h1
          className="mt-1.5 text-[24px] font-semibold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-xl text-[12.5px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept350() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      <style>{`@keyframes lo-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes lo-scan{0%,100%{opacity:.35}50%{opacity:.85}}
      @keyframes lo-blink{0%,49%{opacity:1}50%,100%{opacity:.25}}`}</style>

      <div className="lg:flex">
        {/* Rail-navigatie — als een instrumentrek */}
        <aside
          className="hidden shrink-0 border-r lg:flex lg:w-[220px] lg:flex-col"
          style={{ borderColor: C.line, background: C.bgSoft }}
        >
          <div
            className="flex items-center gap-2.5 border-b px-4 py-4"
            style={{ borderColor: C.line }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{ background: BRUSHED, border: `1px solid ${C.ridge}` }}
              aria-hidden="true"
            >
              <Cpu size={17} style={{ color: C.signal }} />
            </span>
            <div className="leading-none">
              <p className="text-[14px] font-semibold tracking-tight" style={head}>
                LODEN
              </p>
              <p
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.22em]"
                style={{ ...mono, color: C.faint }}
              >
                Control Deck
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 p-2" aria-label="Hoofdnavigatie">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded px-3 py-2.5 text-[12.5px] transition-colors ${RING}`}
                  style={{
                    color: on ? C.ink : C.sub,
                    background: on ? C.panelHi : "transparent",
                    borderLeft: `2px solid ${on ? C.signal : "transparent"}`,
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.9}
                    style={{ color: on ? C.signal : C.faint }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-left">{s.label}</span>
                  <span
                    className="text-[9px] font-bold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Systeemstatus-uitlezing */}
          <div className="mt-auto border-t p-3" style={{ borderColor: C.line }}>
            <div
              className="rounded-md p-3"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.faint }}
                >
                  Systeem
                </p>
                <span
                  className="flex items-center gap-1 text-[9.5px] font-bold uppercase"
                  style={{ ...mono, color: C.ok }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: C.ok, animation: "lo-blink 1.6s infinite" }}
                    aria-hidden="true"
                  />
                  Online
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5 text-[10.5px]" style={mono}>
                <div className="flex items-center justify-between">
                  <span style={{ color: C.faint }}>Matching</span>
                  <span style={{ color: C.steel }}>OK</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: C.faint }}>Verificatie</span>
                  <span style={{ color: C.warn }}>1 verloopt</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Topbalk */}
          <header
            className="sticky top-0 z-10 border-b"
            style={{ borderColor: C.line, background: C.bgSoft }}
          >
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
              <span className="flex items-center gap-2 lg:hidden">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ background: BRUSHED, border: `1px solid ${C.ridge}` }}
                  aria-hidden="true"
                >
                  <Cpu size={15} style={{ color: C.signal }} />
                </span>
                <span className="text-[13.5px] font-semibold" style={head}>
                  LODEN
                </span>
              </span>

              <div
                className="ml-auto hidden items-center gap-2 rounded-md px-3 py-1.5 sm:flex"
                style={{ background: C.panel, border: `1px solid ${C.line}`, minWidth: 240 }}
              >
                <Terminal size={14} style={{ color: C.faint }} aria-hidden="true" />
                <span className="text-[12px]" style={{ ...mono, color: C.faint }}>
                  zoek · commando · id…
                </span>
                <kbd
                  className="ml-auto rounded px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{ ...mono, background: C.ridge, color: C.sub }}
                >
                  ⌘K
                </kbd>
              </div>

              <button
                aria-label="Zoeken"
                className={`rounded-md p-2 transition-colors hover:bg-[#232931] sm:hidden ${RING}`}
                style={{ border: `1px solid ${C.line}`, color: C.sub }}
              >
                <Search size={15} aria-hidden="true" />
              </button>
              <button
                aria-label="Meldingen"
                className={`relative rounded-md p-2 transition-colors hover:bg-[#232931] ${RING}`}
                style={{ border: `1px solid ${C.line}`, color: C.sub }}
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.signal }}
                  aria-hidden="true"
                />
              </button>
              <div className="ml-1 flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-bold"
                  style={{
                    ...mono,
                    background: C.ridge,
                    color: C.signal,
                    border: `1px solid ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="text-[12.5px] font-semibold">{PROFIEL.naam}</p>
                  <p
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"
                    style={{ ...mono, color: C.ok }}
                  >
                    <ShieldCheck size={10} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobiele tabs */}
            <nav
              className="flex gap-1 overflow-x-auto border-t px-3 py-1.5 lg:hidden"
              style={{ borderColor: C.line }}
              aria-label="Schermen"
            >
              {SCREENS.map((s) => {
                const Icon = NAV_ICONS[s.key];
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-[12px] transition-colors ${RING}`}
                    style={{
                      color: on ? C.ink : C.sub,
                      background: on ? C.panelHi : "transparent",
                      borderBottom: `2px solid ${on ? C.signal : "transparent"}`,
                      fontWeight: on ? 600 : 500,
                    }}
                  >
                    <Icon size={14} strokeWidth={2} aria-hidden="true" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </header>

          {/* Content */}
          <main
            key={screen}
            className="mx-auto max-w-6xl pb-12"
            style={{ animation: "lo-fade 0.3s ease" }}
          >
            {!ready ? (
              <ScreenSkeleton />
            ) : (
              <>
                {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
                {screen === "marktplaats" && <Marktplaats onOpen={open} />}
                {screen === "opdracht" && (
                  <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
                )}
                {screen === "verificatie" && <Verificatie onGo={setScreen} />}
                {screen === "acties" && <Acties onGo={setScreen} />}
                {screen === "facturen" && <Facturen />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-6" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-6 w-48 rounded"
        style={{ background: C.panel, animation: "lo-scan 1.2s infinite" }}
      />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-md"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              animation: "lo-scan 1.2s infinite",
            }}
          />
        ))}
      </div>
      <div
        className="mt-4 h-52 rounded-md"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          animation: "lo-scan 1.2s infinite",
        }}
      />
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 680);
  };

  return (
    <div>
      <PageHead
        code="DECK · 00 · OVERZICHT"
        title="Controlepaneel"
        sub="Alle signalen in één uitlezing — matching, omzet, verificatie en wat directe actie vraagt."
        right={
          <div
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide"
            style={{ ...mono, color: C.faint }}
          >
            <span className="flex items-center gap-1.5" style={{ color: C.ok }}>
              <Radio size={12} aria-hidden="true" /> Live
            </span>
          </div>
        }
      />

      <div className="space-y-4 px-6 py-5">
        {/* KPI-rek */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k, idx) => (
            <Panel key={k.label} hi className="p-4">
              <div className="flex items-start justify-between">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.signal }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                {idx % 2 === 0 ? (
                  <StepChart data={k.spark} color={k.up ? C.ok : C.signal} />
                ) : (
                  <BarStrip data={k.spark} color={k.up ? C.steel : C.signal} />
                )}
              </div>
            </Panel>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Groot uitlees-paneel: matching */}
          <Panel hi className="p-5 lg:col-span-2">
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: C.line }}
            >
              <h2
                className="flex items-center gap-2 text-[13px] font-semibold"
                style={{ ...head, color: C.ink }}
              >
                <Gauge size={15} style={{ color: C.signal }} aria-hidden="true" /> Matching-index
              </h2>
              <span
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ ...mono, color: C.faint }}
              >
                Gemiddeld over {OPDRACHTEN.length} opdrachten
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div>
                <p
                  className="text-[52px] font-semibold tabular-nums leading-none"
                  style={{ ...mono, color: C.ink }}
                >
                  {matchAvg}
                  <span className="text-[22px]" style={{ color: C.faint }}>
                    %
                  </span>
                </p>
                <p
                  className="mt-1 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide"
                  style={{ ...mono, color: C.ok }}
                >
                  <ArrowUpRight size={13} aria-hidden="true" /> +4 t.o.v. vorige cyclus
                </p>
              </div>
              <div className="min-w-[160px] flex-1">
                <p
                  className="mb-2 text-[10.5px] font-bold uppercase tracking-wide"
                  style={{ ...mono, color: C.faint }}
                >
                  Belasting per opdracht
                </p>
                <div className="space-y-2.5">
                  {OPDRACHTEN.map((o) => (
                    <div key={o.id} className="flex items-center gap-3">
                      <span
                        className="w-16 shrink-0 truncate text-[10px]"
                        style={{ ...mono, color: C.sub }}
                      >
                        {o.id}
                      </span>
                      <LinearGauge
                        value={o.match}
                        color={o.match >= 90 ? C.ok : o.match >= 85 ? C.signal : C.warn}
                      />
                      <span
                        className="w-8 shrink-0 text-right text-[11px] font-bold tabular-nums"
                        style={{ ...mono, color: C.steel }}
                      >
                        {o.match}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Signaal-paneel: eerste actie (accent) */}
          {warn && (
            <Panel accent className="flex flex-col p-5">
              <p
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.signal }}
              >
                <Zap size={12} aria-hidden="true" /> Prioriteitssignaal
              </p>
              <h3
                className="mt-2 text-[16px] font-semibold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p className="mt-1.5 flex-1 text-[12px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wide transition-transform active:scale-[0.98] ${RING}`}
                style={{ ...mono, background: C.signal, color: "#14171b" }}
              >
                {warn.cta} <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Panel>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Verificatie-uitlezing */}
          <Panel className="p-5">
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: C.line }}
            >
              <h3
                className="flex items-center gap-2 text-[12.5px] font-semibold"
                style={{ ...head, color: C.ink }}
              >
                <ShieldCheck size={14} style={{ color: C.signal }} aria-hidden="true" /> Verificatie
              </h3>
              <button
                onClick={() => onGo("verificatie")}
                className={`text-[11px] font-bold uppercase ${RING}`}
                style={{ ...mono, color: C.signal }}
              >
                Open
              </button>
            </div>
            <p
              className="mt-3 text-[30px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {verified}
              <span className="text-[15px]" style={{ color: C.faint }}>
                /{CREDENTIALS.length}
              </span>
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.sub }}>
              bewijsstukken geverifieerd
            </p>
            <div className="mt-3">
              <LinearGauge value={Math.round((verified / CREDENTIALS.length) * 100)} color={C.ok} />
            </div>
          </Panel>

          {/* Log-feed met error→loading→ok */}
          <Panel className="p-5 lg:col-span-2">
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: C.line }}
            >
              <h3
                className="flex items-center gap-2 text-[12.5px] font-semibold"
                style={{ ...head, color: C.ink }}
              >
                <Activity size={14} style={{ color: C.signal }} aria-hidden="true" />{" "}
                Activiteiten-log
              </h3>
              <span className="text-[10px] font-bold uppercase" style={{ ...mono, color: C.faint }}>
                Laatste events
              </span>
            </div>
            <div className="mt-3">
              {feed === "error" && (
                <div className="flex flex-col items-center py-6 text-center" role="alert">
                  <CircleSlash size={22} style={{ color: C.alert }} aria-hidden="true" />
                  <p className="mt-2 text-[12px] font-semibold" style={{ color: C.ink }}>
                    Log-stream onderbroken
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ ...mono, color: C.faint }}>
                    ERR · verbinding met feed verbroken
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-wide transition-colors hover:bg-[#232931] ${RING}`}
                    style={{ ...mono, border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCw size={12} aria-hidden="true" /> Herverbinden
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2 py-2" role="status" aria-live="polite">
                  <span className="sr-only">Log laden…</span>
                  {[85, 65, 74].map((w, i) => (
                    <span
                      key={i}
                      className="block h-3 rounded-sm"
                      style={{
                        background: C.lineSoft,
                        width: `${w}%`,
                        animation: "lo-scan 1.2s infinite",
                      }}
                    />
                  ))}
                </div>
              )}
              {feed === "ok" && (
                <ul className="space-y-2 text-[11.5px]" style={mono}>
                  {[
                    { t: "09:24", c: C.ok, m: "MATCH  OPD-2041 · score 94% berekend" },
                    { t: "08:50", c: C.warn, m: "CRED   VOG verloopt over 23 dagen" },
                    { t: "08:12", c: C.info, m: "MSG    Thuiszorg De Linde · nieuw bericht" },
                    { t: "07:40", c: C.signal, m: "INVC   FAC-2025-118 · 9 dagen openstaand" },
                  ].map((row) => (
                    <li
                      key={row.t}
                      className="flex items-center gap-3 border-b py-1.5 last:border-0"
                      style={{ borderColor: C.lineSoft }}
                    >
                      <span style={{ color: C.faint }}>{row.t}</span>
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: row.c }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate" style={{ color: C.steel }}>
                        {row.m}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        {/* Beste matches — compacte rij */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide"
              style={{ ...mono, color: C.sub }}
            >
              <SquareStack size={15} style={{ color: C.signal }} aria-hidden="true" /> Top-matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 text-[11.5px] font-bold uppercase ${RING}`}
              style={{ ...mono, color: C.signal }}
            >
              Alles <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`text-left transition-colors ${RING}`}
              >
                <Panel className="h-full p-4 transition-colors hover:border-[#ff6a1a55]">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: o.match >= 90 ? C.okSoft : C.signalSoft,
                        color: o.match >= 90 ? C.ok : C.signal,
                      }}
                    >
                      {o.match}%
                    </span>
                  </div>
                  <p
                    className="mt-2 text-[13.5px] font-semibold leading-snug"
                    style={{ ...head, color: C.ink }}
                  >
                    {o.titel}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1 truncate text-[11.5px]"
                    style={{ color: C.sub }}
                  >
                    <MapPin size={11} aria-hidden="true" /> {o.plaats}
                  </p>
                  <div
                    className="mt-3 flex items-center justify-between border-t pt-2.5"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <span
                      className="text-[12.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.signal }}
                    >
                      {o.tarief}
                    </span>
                    <span className="text-[10.5px]" style={{ color: C.faint }}>
                      {o.uren}
                    </span>
                  </div>
                </Panel>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief)));

  return (
    <div>
      <PageHead
        code="DECK · 01 · MARKT"
        title="Marktplaats"
        sub="Opdrachten-register, gesorteerd op meetbare match. Pro-uitlezing met volledige dataset per regel."
        right={
          <div
            className="inline-flex items-center gap-1 rounded-md p-0.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
            role="tablist"
            aria-label="Sorteren"
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${RING}`}
                  style={{
                    ...mono,
                    background: on ? C.panelHi : "transparent",
                    color: on ? C.ink : C.sub,
                    borderBottom: `2px solid ${on ? C.signal : "transparent"}`,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-5">
        <div
          className="mb-4 flex items-center gap-2.5 rounded-md px-3.5 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={15} style={{ color: C.faint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter register op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[#6b7580]"
            style={{ ...mono, color: C.ink }}
          />
          <SlidersHorizontal size={15} style={{ color: C.faint }} aria-hidden="true" />
        </div>

        {filtered.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-md"
              style={{ background: C.bg, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <CircleSlash size={22} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
              Geen resultaten in register
            </p>
            <p className="mt-1 max-w-xs text-[11.5px]" style={{ ...mono, color: C.sub }}>
              Filter “{q}” levert 0 records. Pas de zoekterm aan.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-md px-4 py-2 text-[11.5px] font-bold uppercase tracking-wide transition-colors hover:bg-[#232931] ${RING}`}
              style={{ ...mono, border: `1px solid ${C.line}`, color: C.ink }}
            >
              Filter wissen
            </button>
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            {/* Tabelkop (desktop) */}
            <div
              className="hidden grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide sm:grid"
              style={{ ...mono, borderColor: C.line, color: C.faint, background: C.bgSoft }}
            >
              <span className="w-10">Match</span>
              <span>Opdracht</span>
              <span className="w-24 text-right">Tarief</span>
              <span className="w-20 text-right">Omvang</span>
              <span className="w-20 text-right">Actie</span>
            </div>
            <ul>
              {filtered.map((o, i) => (
                <li
                  key={o.id}
                  className="border-b last:border-0"
                  style={{ borderColor: C.lineSoft }}
                >
                  <div className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2 sm:w-10 sm:flex-col sm:items-start sm:gap-0.5">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                        style={{
                          ...mono,
                          background: i === 0 ? C.signalSoft : C.lineSoft,
                          color: i === 0 ? C.signal : C.steel,
                        }}
                      >
                        {o.match}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-[10px] font-bold tabular-nums"
                          style={{ ...mono, color: C.faint }}
                        >
                          {o.id}
                        </span>
                        {o.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase"
                            style={{ ...mono, background: C.lineSoft, color: C.sub }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p
                        className="mt-1 text-[13.5px] font-semibold"
                        style={{ ...head, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[11.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats} ·{" "}
                        {o.start}
                      </p>
                    </div>
                    <span
                      className="text-[13px] font-bold tabular-nums sm:w-24 sm:text-right"
                      style={{ ...mono, color: C.signal }}
                    >
                      {o.tarief}
                    </span>
                    <span
                      className="text-[11.5px] tabular-nums sm:w-20 sm:text-right"
                      style={{ ...mono, color: C.sub }}
                    >
                      {o.uren}
                    </span>
                    <div className="sm:w-20 sm:text-right">
                      <button
                        onClick={() => onOpen(o.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-wide transition-transform active:scale-[0.98] ${RING}`}
                        style={{
                          ...mono,
                          background: C.ridge,
                          color: C.ink,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        Open <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 820);
  };

  return (
    <div>
      <PageHead
        code={`DECK · 02 · ${opdracht.id}`}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[11.5px] font-bold uppercase tracking-wide transition-colors hover:bg-[#232931] ${RING}`}
              style={{ ...mono, border: `1px solid ${C.line}`, color: C.sub }}
            >
              <ChevronLeft size={13} aria-hidden="true" /> Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ ...mono, background: state === "sent" ? C.ok : C.signal, color: "#14171b" }}
            >
              {state === "idle" && (
                <>
                  <Send size={14} strokeWidth={2.4} aria-hidden="true" /> Reageer
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={14} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Meetwaarden */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <Panel key={m.l} hi className="p-3.5">
                <p
                  className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[16px] font-bold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </Panel>
            ))}
          </div>

          {/* Verklaarbare match */}
          <Panel className="p-5">
            <h3
              className="flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Gauge size={16} style={{ color: C.signal }} aria-hidden="true" /> Match-analyse
            </h3>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
              Cijfermatige onderbouwing op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden="true" /> Positief
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.steel }}
                    >
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0"
                        style={{ background: C.ok }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <TriangleAlert size={12} strokeWidth={2.6} aria-hidden="true" /> Aandacht
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0"
                        style={{ background: C.warn }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          {/* Match-score paneel (accent) */}
          <Panel accent hi className="p-5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.signal }}
            >
              Match-score
            </p>
            <p
              className="mt-2 text-[44px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {opdracht.match}
              <span className="text-[20px]" style={{ color: C.faint }}>
                %
              </span>
            </p>
            <div className="mt-3">
              <LinearGauge value={opdracht.match} color={C.signal} />
            </div>
            <p className="mt-3 text-[11.5px]" style={{ color: C.sub }}>
              Sterke koppeling met je profiel. Reageer voor de beste positie in de wachtrij.
            </p>
          </Panel>

          {/* Compliance-eisen */}
          <Panel className="p-5">
            <p
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.signal }}
            >
              <ShieldCheck size={12} aria-hidden="true" /> Compliance-eisen
            </p>
            <p className="mt-2 text-[11.5px]" style={{ color: C.sub }}>
              Vereiste bewijsstukken voor deze opdracht — je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
                      style={{ background: t.soft, border: `1px solid ${t.fg}33` }}
                    >
                      <Icon size={13} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12px]"
                      style={{ color: C.steel }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} size="sm" />
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        code="DECK · 03 · COMPLIANCE"
        title="Verificatie"
        sub="Meetbare compliance-status. Elk bewijsstuk is een toestand met een expliciete overgang en tijdlijn."
      />
      <div className="space-y-4 px-6 py-5">
        {/* Uitlees-strook */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Geverifieerd", v: `${verified}`, c: C.ok },
            {
              l: "In beoordeling",
              v: `${CREDENTIALS.filter((c) => c.status === "SUBMITTED").length}`,
              c: C.info,
            },
            {
              l: "Verloopt",
              v: `${CREDENTIALS.filter((c) => c.status === "EXPIRING").length}`,
              c: C.warn,
            },
            { l: "Score", v: `${pct}%`, c: C.signal },
          ].map((s) => (
            <Panel key={s.l} hi className="p-4">
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.faint }}
              >
                {s.l}
              </p>
              <p
                className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: s.c }}
              >
                {s.v}
              </p>
            </Panel>
          ))}
        </div>

        {/* Verloop-signaal */}
        {expiring && (
          <Panel accent className="flex flex-wrap items-center gap-4 p-4">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
              style={{ background: C.warnSoft, border: `1px solid ${C.warn}44` }}
              aria-hidden="true"
            >
              <TriangleAlert size={18} style={{ color: C.warn }} />
            </span>
            <div className="min-w-[180px] flex-1">
              <p className="text-[13px] font-semibold" style={{ ...head, color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.sub }}>
                {expiring.detail} · vernieuw om verifieerbaar te blijven.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-wide transition-transform active:scale-[0.98] ${RING}`}
              style={{ ...mono, background: C.signal, color: "#14171b" }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </Panel>
        )}

        {/* Register */}
        <Panel className="overflow-hidden">
          <div
            className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide sm:grid"
            style={{ ...mono, borderColor: C.line, color: C.faint, background: C.bgSoft }}
          >
            <span>Bewijsstuk</span>
            <span className="w-40">Detail</span>
            <span className="w-32 text-right">Status</span>
          </div>
          <ul>
            {CREDENTIALS.map((c) => {
              const t = credTone(c.status);
              const Icon = t.Icon;
              return (
                <li
                  key={c.naam}
                  className="border-b last:border-0"
                  style={{ borderColor: C.lineSoft }}
                >
                  <div className="grid grid-cols-1 items-center gap-2 px-4 py-3.5 sm:grid-cols-[1fr_auto_auto] sm:gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded"
                        style={{ background: t.soft, border: `1px solid ${t.fg}33` }}
                      >
                        <Icon size={16} style={{ color: t.fg }} aria-hidden="true" />
                      </span>
                      <p className="text-[13px] font-semibold" style={{ ...head, color: C.ink }}>
                        {c.naam}
                      </p>
                    </div>
                    <p className="text-[11px] sm:w-40" style={{ ...mono, color: C.sub }}>
                      {c.detail}
                    </p>
                    <div className="sm:w-32 sm:text-right">
                      <StatusPill status={c.status} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div
          className="flex items-center gap-3 rounded-md p-4"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={16} style={{ color: C.signal }} aria-hidden="true" />
          <p className="text-[11.5px]" style={{ ...mono, color: C.sub }}>
            Documenten zijn versleuteld opgeslagen · toegang wordt gelogd · privé tenzij expliciet
            gedeeld.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        code="DECK · 04 · ACTIEWACHTRIJ"
        title="Volgende acties"
        sub="Wachtrij op urgentie. Werk van boven naar beneden af — signaal-items eerst."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.signal : C.info;
          const soft = warn ? C.signalSoft : C.infoSoft;
          return (
            <Panel key={a.titel} accent={warn} className="flex flex-wrap items-start gap-4 p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-[14px] font-bold tabular-nums"
                style={{ ...mono, background: soft, color: fg, border: `1px solid ${fg}33` }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? (
                    <>
                      <Zap size={11} aria-hidden="true" /> Signaal
                    </>
                  ) : (
                    <>
                      <Radio size={11} aria-hidden="true" /> Kans
                    </>
                  )}
                </p>
                <p className="mt-1 text-[14px] font-semibold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 self-center rounded-md px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-wide transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  ...mono,
                  background: warn ? C.signal : C.ridge,
                  color: warn ? "#14171b" : C.ink,
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta} <ChevronRight size={13} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Panel>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-md p-4"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.ok }}
            aria-hidden="true"
          />
          <p className="text-[11.5px]" style={{ ...mono, color: C.sub }}>
            EOF · geen verdere acties in wachtrij. Nieuwe signalen verschijnen hier automatisch.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const totaal = betaald + open;
  const pct = totaal ? Math.round((betaald / totaal) * 100) : 0;

  return (
    <div>
      <PageHead
        code="DECK · 05 · FINANCIËN"
        title="Facturen"
        sub="Omzet-uitlezing. Ontvangen, openstaand en concept in één register met tabulaire bedragen."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-wide transition-transform active:scale-[0.98] ${RING}`}
            style={{ ...mono, background: C.signal, color: "#14171b" }}
          >
            <Plus size={13} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Panel hi className="p-5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.faint }}
            >
              Ontvangen
            </p>
            <p
              className="mt-1.5 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ok }}
            >
              € {betaald.toLocaleString("nl-NL")}
            </p>
            <div className="mt-3">
              <LinearGauge value={pct} color={C.ok} />
            </div>
            <p className="mt-2 text-[10.5px]" style={{ ...mono, color: C.faint }}>
              {pct}% van totaal geïnd
            </p>
          </Panel>
          <Panel hi className="p-5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.faint }}
            >
              Openstaand
            </p>
            <p
              className="mt-1.5 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.warn }}
            >
              € {open.toLocaleString("nl-NL")}
            </p>
            <p
              className="mt-3 flex items-center gap-1.5 text-[11px]"
              style={{ ...mono, color: C.sub }}
            >
              <Clock size={12} aria-hidden="true" /> 2 records wachten op betaling
            </p>
          </Panel>
          <Panel accent hi className="p-5">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.signal }}
            >
              Totaal periode
            </p>
            <p
              className="mt-1.5 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              € {totaal.toLocaleString("nl-NL")}
            </p>
            <p
              className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase"
              style={{ ...mono, color: C.ok }}
            >
              <ArrowUpRight size={12} aria-hidden="true" /> +12% t.o.v. vorige periode
            </p>
          </Panel>
        </div>

        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ ...mono, background: C.bgSoft, color: C.faint }}
                >
                  <th className="px-4 py-3">Nummer</th>
                  <th className="px-4 py-3">Klant</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                  <th className="px-4 py-3 text-right">Bedrag</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {FACTUREN.map((f, i) => {
                  const t = factuurTone(f.status);
                  return (
                    <tr
                      key={f.nr}
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                    >
                      <td
                        className="px-4 py-3.5 text-[11.5px] font-bold tabular-nums"
                        style={{ ...mono, color: C.sub }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px]" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td
                        className="hidden px-4 py-3.5 text-[11.5px] tabular-nums sm:table-cell"
                        style={{ ...mono, color: C.faint }}
                      >
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3.5 text-right text-[12.5px] font-bold tabular-nums"
                        style={{ ...mono, color: C.ink }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            ...mono,
                            color: t.fg,
                            background: t.soft,
                            border: `1px solid ${t.fg}33`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: t.fg }}
                            aria-hidden="true"
                          />
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
