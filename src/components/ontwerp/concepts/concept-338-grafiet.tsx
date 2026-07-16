"use client";

// Concept 338 — "Grafiet" · handgetekend potlood-schets, technisch-editorial (mono).
// Wireframe-als-esthetiek: grafietlijnen, licht-schetsmatige kaders (dubbele/verspringende randen),
// grid-papier-achtergrond en handgeschreven annotaties naast strakke technische data. Monochroom
// grafiet op off-white, met één potlood-blauw accent. Verfijnd, niet slordig — de schets-lijn is
// bewust en consistent. Statuschips altijd label + icoon; verklaarbare matching en verificatie als
// vertrouwenslaag. Grid via CSS linear-gradients (geen assets).
// Fonts: --font-lab-architects (handgeschreven annotaties) + --font-lab-plex-mono (technische data)
// + --font-lab-inter (leestekst).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  CircleAlert,
  PenLine,
  Ruler,
  CornerDownRight,
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

/* ---------- Palet (grafiet op off-white papier, één potlood-blauw) ---------- */

const C = {
  paper: "#f4f2ec", // off-white schetspapier
  paperAlt: "#eeece4",
  card: "#faf9f4",
  graphite: "#2b2a28", // grafiet-inkt (tekst/lijnen)
  graphiteSoft: "#4a4844",
  sub: "#6c6961",
  faint: "#9c988c",
  line: "#c9c5b8", // lichte potloodlijn
  lineSoft: "#ddd9cd",
  blue: "#33568f", // potlood-blauw accent
  blueSoft: "#dde5f0",
  blueFaint: "#e9eef6",
  ok: "#3f6b45",
  okSoft: "#dde9df",
  warn: "#8a6a2c",
  warnSoft: "#efe6d0",
  alert: "#9a3b3b",
  alertSoft: "#eddadb",
  info: "#33568f",
  infoSoft: "#dde5f0",
};

const hand = { fontFamily: "var(--font-lab-architects), ui-sans-serif, sans-serif" };
const mono = { fontFamily: "var(--font-lab-plex-mono), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33568f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f2ec]";

// Schets-kader: dunne grafietrand met lichte offset-schaduw (dubbel-getekende lijn).
const sketch = (border = C.graphite): React.CSSProperties => ({
  border: `1.5px solid ${border}`,
  boxShadow: `2px 2px 0 -1px ${border}55, 1px 1px 0 ${C.paperAlt}`,
  borderRadius: "2px 8px 3px 7px / 7px 3px 8px 2px", // onregelmatige, hand-getekende hoeken
});

const gridPaper: React.CSSProperties = {
  backgroundImage: `linear-gradient(${C.line}44 1px, transparent 1px), linear-gradient(90deg, ${C.line}44 1px, transparent 1px)`,
  backgroundSize: "22px 22px",
};

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.blue, soft: C.blueSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
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
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Bouwstenen ---------- */

// Handgeschreven annotatie met wijs-pijltje — het editorial-schets-signatuur.
function Annotatie({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[13px] ${className}`}
      style={{ ...hand, color: C.blue }}
    >
      <CornerDownRight size={13} strokeWidth={1.6} aria-hidden="true" />
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
      style={{
        ...mono,
        color: t.fg,
        background: t.soft,
        border: `1.5px solid ${t.fg}66`,
        borderRadius: "2px 6px 3px 6px",
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Technische meet-sparkline met stippellijn-basis (blueprint-gevoel).
function TechSpark({ data, color }: { data: number[]; color: string }) {
  const w = 96;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line
        x1="0"
        y1={h - 3}
        x2={w}
        y2={h - 3}
        stroke={C.line}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.4" fill={color} />
      ))}
      {last && (
        <circle cx={last[0]} cy={last[1]} r="3" fill="none" stroke={color} strokeWidth="1.2" />
      )}
    </svg>
  );
}

// Hand-geschetste voortgangsmeter (blueprint-balk met maatstreepjes).
function GaugeBar({ value, color = C.blue }: { value: number; color?: string }) {
  return (
    <div className="w-full" aria-hidden="true">
      <div
        className="relative h-4 w-full overflow-hidden"
        style={{
          border: `1.5px solid ${C.graphite}`,
          borderRadius: "3px 7px 3px 7px",
          background: C.card,
        }}
      >
        <span
          className="absolute inset-y-0 left-0"
          style={{
            width: `${value}%`,
            background: `repeating-linear-gradient(45deg, ${color}, ${color} 4px, ${color}bb 4px, ${color}bb 8px)`,
          }}
        />
        <div className="absolute inset-0 flex justify-between px-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="w-px" style={{ background: `${C.graphite}33` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Match-cirkel als potlood-schets (dun getekende ring + getal).
function MatchDial({ value, size = 56 }: { value: number; size?: number }) {
  const stroke = 3;
  const r = size / 2 - stroke - 1;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.line}
          strokeWidth={stroke}
          strokeDasharray="1.5 2.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.blue}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span
        className="tabular-nums leading-none"
        style={{ ...mono, color: C.graphite, fontSize: size >= 56 ? 15 : 13, fontWeight: 600 }}
      >
        {value}
      </span>
    </span>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
  note,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-2 pt-6">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.blue }}
        >
          <Ruler size={12} strokeWidth={1.8} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-1.5 text-[27px] font-semibold leading-none tracking-tight"
          style={{ ...body, color: C.graphite }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px]" style={{ ...body, color: C.sub }}>
            {sub}
          </p>
        )}
        {note && <Annotatie className="mt-2">{note}</Annotatie>}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept338() {
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
      style={{ ...body, background: C.paper, color: C.graphite, ...gridPaper }}
    >
      <style>{`@keyframes gf-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes gf-pulse{0%,100%{opacity:.45}50%{opacity:.8}}
      @keyframes gf-draw{from{stroke-dashoffset:120}to{stroke-dashoffset:0}}`}</style>

      {/* Top-nav — technische titelbalk */}
      <header className="border-b-2" style={{ borderColor: C.graphite, background: `${C.card}ee` }}>
        <div className="flex h-16 items-center gap-3 px-5">
          <div
            className="flex h-9 w-9 items-center justify-center"
            style={{ ...sketch(C.graphite), background: C.card }}
            aria-hidden="true"
          >
            <span className="text-[17px] font-semibold" style={{ ...hand, color: C.graphite }}>
              Z
            </span>
          </div>
          <div className="leading-none">
            <span
              className="text-[16px] font-semibold tracking-tight"
              style={{ ...body, color: C.graphite }}
            >
              Grafiet
            </span>
            <span className="ml-2 text-[11px]" style={{ ...hand, color: C.blue }}>
              — schets
            </span>
          </div>
          <span
            className="ml-1 hidden px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] sm:inline"
            style={{
              ...mono,
              background: C.blueSoft,
              color: C.blue,
              border: `1px solid ${C.blue}55`,
              borderRadius: "2px 5px 2px 5px",
            }}
          >
            ZZP
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`p-2 transition-colors hover:bg-[#eeece4] ${RING}`}
              style={{ ...sketch(C.line), color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative p-2 transition-colors hover:bg-[#eeece4] ${RING}`}
              style={{ ...sketch(C.line), color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full"
                style={{ background: C.blue }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center text-[12px] font-semibold"
                style={{ ...hand, ...sketch(C.graphite), background: C.blueFaint, color: C.blue }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold" style={{ color: C.graphite }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[10.5px] font-medium"
                  style={{ ...mono, color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scherm-tabs */}
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 px-3 py-2 text-[12.5px] transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? C.graphite : C.sub,
                  background: on ? C.card : "transparent",
                  border: `1.5px solid ${on ? C.graphite : "transparent"}`,
                  borderRadius: on ? "3px 8px 3px 8px" : "0",
                  boxShadow: on ? `2px 2px 0 -1px ${C.blue}55` : "none",
                  fontWeight: on ? 600 : 400,
                }}
              >
                <Icon size={14} aria-hidden="true" style={{ color: on ? C.blue : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "gf-fade 0.3s ease" }}>
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
        className="h-7 w-52"
        style={{ ...sketch(C.line), background: C.card, animation: "gf-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-44"
        style={{ ...sketch(C.line), background: C.card, animation: "gf-pulse 1.3s infinite" }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24"
            style={{ ...sketch(C.line), background: C.card, animation: "gf-pulse 1.3s infinite" }}
          />
        ))}
      </div>
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

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Blad 01 · Overzicht"
        title={`Werkblad — ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je praktijk als technische schets: gemeten cijfers, geannoteerde matches en acties."
        note="alles server-geverifieerd, niets geschat"
      />

      <div className="space-y-5 px-6 py-5">
        {/* Hero — blueprint-paneel */}
        <div className="relative p-6" style={{ ...sketch(C.graphite), background: C.card }}>
          <span
            className="absolute right-4 top-3 text-[12px]"
            style={{ ...hand, color: C.blue }}
            aria-hidden="true"
          >
            ← gem. over 3 opdrachten
          </span>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.sub }}
              >
                Gemiddelde match
              </p>
              <p className="mt-1 flex items-end gap-2 leading-none">
                <span
                  className="tabular-nums"
                  style={{ ...mono, color: C.graphite, fontSize: 56, fontWeight: 600 }}
                >
                  {matchAvg}
                </span>
                <span className="text-[22px]" style={{ ...hand, color: C.blue }}>
                  %
                </span>
              </p>
              <div className="mt-3 max-w-xs">
                <GaugeBar value={matchAvg} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {KPIS.slice(0, 2).map((k) => (
                <div
                  key={k.label}
                  className="p-3"
                  style={{ ...sketch(C.line), background: C.paper }}
                >
                  <p
                    className="text-[10px] font-medium uppercase tracking-wide"
                    style={{ ...mono, color: C.sub }}
                  >
                    {k.label}
                  </p>
                  <p
                    className="mt-0.5 text-[19px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.graphite }}
                  >
                    {k.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI-strook */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="p-4"
              style={{ ...sketch(C.graphite), background: C.card }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[10.5px] font-medium uppercase tracking-wide"
                  style={{ ...mono, color: C.sub }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-medium tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.graphite }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <TechSpark data={k.spark} color={k.up ? C.blue : C.warn} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <div
              className="relative p-5 lg:col-span-2"
              style={{ ...sketch(C.graphite), background: C.blueFaint }}
              role="alert"
            >
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.blue }}
              >
                <PenLine size={12} strokeWidth={1.8} aria-hidden="true" /> Volgende actie
              </p>
              <h2
                className="mt-2 text-[19px] font-semibold leading-snug"
                style={{ ...body, color: C.graphite }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px]" style={{ ...body, color: C.sub }}>
                {warn.detail}
              </p>
              <Annotatie className="mt-2">plan dit deze week in</Annotatie>
              <div>
                <button
                  onClick={() => onGo("verificatie")}
                  className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-transform active:scale-[0.98] ${RING}`}
                  style={{ ...mono, ...sketch(C.graphite), background: C.graphite, color: C.paper }}
                >
                  {warn.cta} <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Inbox met error→loading→ok */}
          <div className="p-5" style={{ ...sketch(C.graphite), background: C.card }}>
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ ...body, color: C.graphite }}
              >
                <Bell size={15} style={{ color: C.blue }} aria-hidden="true" /> Inbox
              </h3>
              <span className="text-[11px]" style={{ ...hand, color: C.blue }}>
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <div className="mt-4 border-t pt-3" style={{ borderColor: C.lineSoft }}>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <CircleAlert
                    size={20}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12px]" style={{ color: C.sub }}>
                    Kon niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#eeece4] ${RING}`}
                    style={{ ...mono, ...sketch(C.line), color: C.graphite }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  {[60, 85].map((w) => (
                    <span
                      key={w}
                      className="block h-3 rounded-full"
                      style={{
                        background: C.lineSoft,
                        width: `${w}%`,
                        animation: "gf-pulse 1.3s infinite",
                      }}
                    />
                  ))}
                </div>
              )}
              {feed === "ok" && (
                <ul className="space-y-3">
                  {BERICHTEN.slice(0, 2).map((b) => (
                    <li key={b.van} className="flex items-start gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-medium"
                        style={{
                          ...mono,
                          ...sketch(C.line),
                          background: C.blueFaint,
                          color: C.blue,
                        }}
                        aria-hidden="true"
                      >
                        {b.initialen}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="truncate text-[12.5px] font-semibold"
                          style={{ color: C.graphite }}
                        >
                          {b.van}
                        </p>
                        <p
                          className="mt-0.5 line-clamp-2 text-[11.5px]"
                          style={{ ...body, color: C.sub }}
                        >
                          {b.preview}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[16px] font-semibold"
              style={{ ...body, color: C.graphite }}
            >
              <Briefcase size={16} style={{ color: C.blue }} aria-hidden="true" /> Top-matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[12.5px] font-medium ${RING}`}
              style={{ ...mono, color: C.blue }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`p-4 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
                style={{ ...sketch(C.graphite), background: C.card }}
              >
                <div className="flex items-start justify-between">
                  <MatchDial value={o.match} size={54} />
                  <span
                    className="text-[10px] font-medium tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[14.5px] font-semibold leading-snug"
                  style={{ ...body, color: C.graphite }}
                >
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1 truncate text-[12px]"
                  style={{ ...body, color: C.sub }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div
                  className="mt-3 flex items-center justify-between border-t pt-2"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.blue }}
                  >
                    {o.tarief}
                  </span>
                  <span className="text-[11.5px]" style={{ ...mono, color: C.faint }}>
                    {o.uren}
                  </span>
                </div>
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
        kicker="Blad 02 · Opdrachten"
        title="Marktplaats"
        sub="Opdrachten gerangschikt op match — sterkste kansen bovenaan, met de redenen erbij geschetst."
        right={
          <div
            className="inline-flex items-center gap-0.5 p-0.5"
            style={{ ...sketch(C.line), background: C.paper }}
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
                  className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${RING}`}
                  style={{
                    ...mono,
                    background: on ? C.card : "transparent",
                    color: on ? C.graphite : C.sub,
                    border: `1.5px solid ${on ? C.graphite : "transparent"}`,
                    borderRadius: on ? "3px 6px 3px 6px" : "0",
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
          className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5"
          style={{ ...sketch(C.graphite), background: C.card }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.blue }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ ...body, color: C.graphite }}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
            style={{ ...sketch(C.line), background: C.card }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center"
              style={{ ...sketch(C.graphite), background: C.blueFaint }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.blue }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold" style={{ ...body, color: C.graphite }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ ...body, color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#eeece4] ${RING}`}
              style={{ ...mono, ...sketch(C.line), color: C.graphite }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li key={o.id} className="p-4" style={{ ...sketch(C.graphite), background: C.card }}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center text-[12px] font-semibold tabular-nums"
                      style={{
                        ...mono,
                        ...sketch(C.line),
                        background: i === 0 ? C.blueFaint : C.paper,
                        color: i === 0 ? C.blue : C.faint,
                      }}
                    >
                      {i + 1}
                    </span>
                    <MatchDial value={o.match} size={54} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-medium tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10.5px] font-medium"
                          style={{
                            ...mono,
                            background: C.paperAlt,
                            color: C.sub,
                            border: `1px solid ${C.line}`,
                            borderRadius: "2px 5px 2px 5px",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p
                      className="mt-1 text-[15px] font-semibold"
                      style={{ ...body, color: C.graphite }}
                    >
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span
                        className="font-semibold tabular-nums"
                        style={{ ...mono, color: C.blue }}
                      >
                        {o.tarief}
                      </span>
                      <span style={{ ...mono, color: C.sub }}>{o.uren}</span>
                      <span style={{ ...mono, color: C.sub }}>{o.start}</span>
                    </div>
                    {i === 0 && <Annotatie className="mt-1.5">beste keuze vandaag</Annotatie>}
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center px-3.5 py-2 text-[12.5px] font-medium transition-transform active:scale-[0.98] ${RING}`}
                    style={{
                      ...mono,
                      ...sketch(C.graphite),
                      background: C.graphite,
                      color: C.paper,
                    }}
                  >
                    Bekijk <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div>
      <PageHead
        kicker={opdracht.id}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#eeece4] ${RING}`}
              style={{ ...mono, ...sketch(C.line), color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{
                ...mono,
                ...sketch(C.graphite),
                background: state === "sent" ? C.ok : C.graphite,
                color: C.paper,
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={14} strokeWidth={2.2} aria-hidden="true" /> Reageer nu
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Kerncijfers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div key={m.l} className="p-4" style={{ ...sketch(C.graphite), background: C.card }}>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.sub }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.graphite }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div className="p-5" style={{ ...sketch(C.graphite), background: C.card }}>
            <h3
              className="flex items-center gap-2 text-[16px] font-semibold"
              style={{ ...body, color: C.graphite }}
            >
              Waarom deze match
              <span className="text-[12px]" style={{ ...hand, color: C.blue }}>
                — handmatig na te lopen
              </span>
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ ...body, color: C.graphite }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.okSoft }}
                      >
                        <Check
                          size={11}
                          strokeWidth={2.6}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.warnSoft }}
                      >
                        <AlertTriangle
                          size={10}
                          strokeWidth={2.2}
                          style={{ color: C.warn }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5" style={{ ...sketch(C.graphite), background: C.blueFaint }}>
            <div className="flex items-center gap-4">
              <MatchDial value={opdracht.match} size={68} />
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.blue }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ ...body, color: C.graphiteSoft }}>
                  Sterke koppeling met je profiel — reageer nu voor het beste resultaat.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <GaugeBar value={opdracht.match} />
            </div>
          </div>
          <div className="p-5" style={{ ...sketch(C.graphite), background: C.card }}>
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.blue }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ ...body, color: C.sub }}>
              Vereiste credentials. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center"
                      style={{ ...sketch(C.line), background: t.soft }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ ...body, color: C.graphite }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </div>
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
        kicker="Blad 03 · Vertrouwen"
        title="Verificatie"
        sub="Je vertrouwens-score — elk geverifieerd bewijsstuk maakt je zichtbaarder."
        note="server bepaalt de status, niet de weergave"
      />
      <div className="space-y-5 px-6 py-5">
        {/* Score-paneel */}
        <div className="p-6" style={{ ...sketch(C.graphite), background: C.card }}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <span
                className="text-[52px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.graphite }}
              >
                {pct}
                <span className="text-[24px]" style={{ ...hand, color: C.blue }}>
                  %
                </span>
              </span>
            </div>
            <div className="min-w-[200px] flex-1">
              <p
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.blue }}
              >
                <BadgeCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
              </p>
              <p
                className="mt-1 text-[19px] font-semibold tabular-nums"
                style={{ ...body, color: C.graphite }}
              >
                {verified}/{total} geverifieerd
              </p>
              <p className="mt-1 text-[12.5px]" style={{ ...body, color: C.sub }}>
                Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
                een volledige score.
              </p>
              <div className="mt-3 max-w-xs">
                <GaugeBar value={pct} color={C.ok} />
              </div>
            </div>
          </div>
        </div>

        {/* Verloop-waarschuwing */}
        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 p-4"
            style={{ ...sketch(C.warn), background: C.warnSoft }}
            role="alert"
          >
            <AlertTriangle
              size={20}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-semibold" style={{ color: C.graphite }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om je score te behouden.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium transition-transform active:scale-[0.98] ${RING}`}
              style={{ ...mono, ...sketch(C.warn), background: C.warn, color: C.paper }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Credential-lijst */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 p-4"
                style={{ ...sketch(C.graphite), background: C.card }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ ...sketch(C.line), background: t.soft }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.graphite }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ ...body, color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </div>
            );
          })}
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
        kicker="Blad 04 · Werklijst"
        title="Volgende acties"
        sub="Je actielijst op urgentie — vink af en hou je werkblad op schema."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.blue;
          const soft = warn ? C.warnSoft : C.blueSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 p-4"
              style={{ ...sketch(warn ? C.warn : C.graphite), background: C.card }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-semibold tabular-nums"
                style={{ ...mono, ...sketch(fg), background: soft, color: fg }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p
                  className="mt-0.5 text-[14px] font-semibold"
                  style={{ ...body, color: C.graphite }}
                >
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  ...mono,
                  ...sketch(warn ? C.warn : C.graphite),
                  background: warn ? C.warn : C.graphite,
                  color: C.paper,
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 p-4"
          style={{ ...sketch(C.line), background: C.blueFaint }}
        >
          <PenLine size={16} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ ...body, color: C.graphiteSoft }}>
            Verder is alles op schema. Nieuwe kansen verschijnen hier vanzelf.
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
        kicker="Blad 05 · Kasboek"
        title="Facturen"
        sub="Je omzet als gemeten data — wat binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-medium transition-transform active:scale-[0.98] ${RING}`}
            style={{ ...mono, ...sketch(C.graphite), background: C.graphite, color: C.paper }}
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <div className="p-5" style={{ ...sketch(C.graphite), background: C.card }}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-[160px] flex-1">
              <p
                className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.sub }}
              >
                Betaald van totaal
              </p>
              <p
                className="mt-0.5 text-[15px] font-semibold tabular-nums"
                style={{ ...mono, color: C.graphite }}
              >
                {pct}%
              </p>
              <div className="mt-2">
                <GaugeBar value={pct} color={C.ok} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="p-3" style={{ ...sketch(C.line), background: C.paper }}>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  Ontvangen
                </p>
                <p
                  className="mt-1 text-[22px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.graphite }}
                >
                  € {betaald.toLocaleString("nl-NL")}
                </p>
              </div>
              <div className="p-3" style={{ ...sketch(C.line), background: C.paper }}>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  Openstaand
                </p>
                <p
                  className="mt-1 text-[22px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.graphite }}
                >
                  € {open.toLocaleString("nl-NL")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ ...sketch(C.graphite), background: C.card }}>
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.paperAlt, color: C.sub }}
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
                    style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3.5 text-[12px] font-medium tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ ...body, color: C.graphite }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ ...mono, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.graphite }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          ...mono,
                          color: t.fg,
                          background: t.soft,
                          border: `1px solid ${t.fg}55`,
                          borderRadius: "2px 6px 2px 6px",
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
      </div>
    </div>
  );
}
