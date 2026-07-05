"use client";

// Concept 100 — "Boekband" · Penguin-klassieker boekomslagreeks als redactioneel systeem.
// Iconische tri-band paperback: gekleurde kop- en voetband + wit/crème middenveld met serif-
// titel, reeks-nummer en uitgevers-plek. Elk kernscherm is een "deel" in de reeks; de bandkleur
// codeert de categorie — oranje = werk, groen = verificatie, blauw = financieel. Bibliotheek /
// plank-gevoel: tijdloos, herkenbaar, papier-warm. Redactioneel minimalisme, geen ruis.
// Fonts: --font-lab-fraunces (serif titels) + --font-lab-franklin (labels/body).

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Plus,
  BookOpen,
  Library,
  RotateCw,
  Mail,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;
void DOCUMENTEN;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f2ebdd",
  paper: "#faf6ec",
  paperAlt: "#f0e9d9",
  ink: "#221d15",
  muted: "#6b6154",
  faint: "#9a8f7c",
  // categorie-banden
  werk: "#d1502e", // oranje — opdrachten
  verificatie: "#2f6b4f", // groen — certificaten
  financieel: "#2b4a7a", // blauw — facturen
  warn: "#b45309",
  alert: "#a3372b",
  line: "rgba(34,29,21,0.16)",
  lineSoft: "rgba(34,29,21,0.09)",
};

const serif = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-franklin)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221d15] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2ebdd]";

// Bandkleur per scherm/categorie.
const SCREEN_BAND: Record<ScreenKey, string> = {
  dashboard: C.ink,
  marktplaats: C.werk,
  opdracht: C.werk,
  verificatie: C.verificatie,
  documenten: C.verificatie,
  facturen: C.financieel,
  berichten: C.financieel,
  acties: C.warn,
};

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.verificatie, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.financieel, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Tri-band omslag (het handtekening-element) ---------- */

// Klassieke paperback-omslag: kop-band (uitgever + reeks) · wit middenveld (titel) · voet-band.
function BookCover({
  band,
  serie,
  kop,
  titel,
  ondertitel,
  meta,
  active = false,
  compact = false,
}: {
  band: string;
  serie: string;
  kop: string;
  titel: string;
  ondertitel?: string;
  meta?: string;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[3px]"
      style={{
        background: C.paper,
        border: `1px solid ${active ? C.ink : C.line}`,
        boxShadow: active
          ? "0 18px 34px -22px rgba(34,29,21,0.55), inset 3px 0 0 rgba(34,29,21,0.08)"
          : "0 8px 20px -18px rgba(34,29,21,0.5), inset 3px 0 0 rgba(34,29,21,0.05)",
      }}
    >
      {/* kop-band */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: band, color: C.paper }}
      >
        <span
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ ...body }}
        >
          <BookOpen size={11} strokeWidth={2.4} aria-hidden="true" /> {kop}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ ...body }}>
          {serie}
        </span>
      </div>
      {/* middenveld */}
      <div
        className={`flex flex-1 flex-col justify-center ${compact ? "px-3 py-3" : "px-4 py-6"}`}
        style={{ borderTop: `2px solid ${band}`, borderBottom: `2px solid ${band}` }}
      >
        <p
          className={`${compact ? "text-[14px]" : "text-[19px]"} font-semibold leading-tight`}
          style={{ ...serif, color: C.ink }}
        >
          {titel}
        </p>
        {ondertitel && (
          <p className="mt-1.5 text-[11px] italic" style={{ ...serif, color: C.muted }}>
            {ondertitel}
          </p>
        )}
      </div>
      {/* voet-band */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: band, color: C.paper }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ border: `1.5px solid ${C.paper}` }}
          aria-hidden="true"
        />
        <span className="truncate text-[9px] font-semibold uppercase tracking-[0.1em]" style={body}>
          {meta ?? "ZZP Uitgevers"}
        </span>
      </div>
    </div>
  );
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children, color = C.werk }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em]"
      style={{ ...body, color }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[27px] leading-[1.05] tracking-[-0.01em] sm:text-[33px]"
      style={{ ...serif, color: C.ink, fontWeight: 600 }}
    >
      {children}
    </h1>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[5px] ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 6px 18px -16px rgba(34,29,21,0.5)",
      }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}12`,
        border: `1px solid ${m.color}44`,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.werk }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="1.9" fill={color} />}
    </svg>
  );
}

// Match als "editie-cijfer" in een reeks-medaillon.
function ScoreSeal({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.lineSoft} strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strong ? C.werk : "#c67a54"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...serif, color: C.ink }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- De plank (het handtekening-element) ---------- */

// Boekenplank: elke opdracht als een staand paperback-deel; klik om te openen. De ruggenhoogte
// codeert de match. Bibliotheek-gevoel — de reeks staat op de plank.
function Boekenplank({
  onSelect,
  activeId,
}: {
  onSelect: (id: string) => void;
  activeId?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[5px]"
      style={{ background: C.paperAlt, border: `1px solid ${C.line}` }}
    >
      <div className="relative flex items-end justify-center gap-3 px-5 pb-0 pt-7 sm:gap-5">
        {OPDRACHTEN.map((o, idx) => {
          const on = activeId === o.id;
          const height = 150 + (o.match / 100) * 60;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id)}
              aria-label={`${o.titel} — match ${o.match}%`}
              aria-pressed={on}
              className={`group flex flex-col items-center ${RING}`}
            >
              <span
                className="mb-2 text-[12px] font-bold tabular-nums"
                style={{ ...serif, color: on ? C.werk : C.ink }}
              >
                {o.match}%
              </span>
              {/* boekrug */}
              <span
                className="relative flex w-11 flex-col items-center justify-between overflow-hidden rounded-t-[2px] transition-all sm:w-14"
                style={{
                  height,
                  background: C.paper,
                  border: `1px solid ${on ? C.ink : C.line}`,
                  transform: on ? "translateY(-6px)" : "none",
                  boxShadow: on ? "0 16px 26px -18px rgba(34,29,21,0.6)" : "none",
                }}
              >
                {/* kop-band */}
                <span
                  className="w-full py-1 text-center text-[7px] font-bold uppercase tracking-[0.1em]"
                  style={{ background: C.werk, color: C.paper }}
                >
                  Deel {idx + 1}
                </span>
                {/* verticale titel */}
                <span
                  className="flex-1 py-2 text-[10px] font-semibold leading-tight"
                  style={{
                    ...serif,
                    color: C.ink,
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {o.titel}
                </span>
                {/* voet-band */}
                <span
                  className="w-full py-1 text-center text-[7px] font-bold uppercase tracking-[0.08em]"
                  style={{ background: C.werk, color: C.paper }}
                >
                  {o.plaats}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {/* plank */}
      <div
        className="relative mt-0 h-3 w-full"
        style={{
          background: "linear-gradient(180deg, #d8cdb5, #c9bda2)",
          borderTop: `2px solid ${C.ink}`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept100() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      {/* warme papier-textuur */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(34,29,21,0.03) 0, rgba(34,29,21,0.03) 1px, transparent 1px, transparent 3px)",
          opacity: 0.6,
        }}
      />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[244px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(250,246,236,0.86)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px]"
                style={{ background: C.werk, color: C.paper }}
                aria-hidden="true"
              >
                <Library size={20} strokeWidth={1.9} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[18px] tracking-[-0.01em]"
                  style={{ ...serif, color: C.ink, fontWeight: 600 }}
                >
                  Boekband
                </div>
                <div
                  className="text-[9px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: C.faint }}
                >
                  ZZP · de reeks
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2.5 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                const band = SCREEN_BAND[s.key];
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-[4px] px-3.5 py-2.5 text-left text-[12.5px] font-semibold tracking-[0.01em] transition-colors md:w-full ${RING}`}
                    style={{
                      color: on ? C.ink : C.muted,
                      background: on ? `${band}12` : "transparent",
                      borderLeft: `3px solid ${on ? band : "transparent"}`,
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: on ? band : C.lineSoft }}
                      aria-hidden="true"
                    />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.line}`, background: "rgba(240,233,217,0.7)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[12px] font-semibold"
                style={{ ...serif, color: C.paper, background: C.ink }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-bold"
                  style={{ color: C.verificatie }}
                >
                  <ShieldCheck size={11} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={open}
                onGo={setScreen}
                activeId={activeId}
                onSelect={setActiveId}
              />
            )}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
  activeId,
  onSelect,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const warn = ACTIES[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Nieuwe editie</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-[4px] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ color: C.paper, background: C.werk }}
        >
          <Library size={13} strokeWidth={2} aria-hidden="true" /> {OPDRACHTEN.length} delen
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-[5px] p-4 sm:flex-row sm:items-center"
          style={{ border: `1px solid ${C.warn}55`, background: `${C.warn}0e` }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[4px]"
            style={{ background: C.paper, border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-[12px] font-bold transition-colors ${RING}`}
            style={{ color: C.paper, background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10px] font-bold uppercase leading-tight tracking-[0.08em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                style={{ color: k.up ? C.verificatie : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.4} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[24px] tabular-nums leading-none"
              style={{ ...serif, color: C.ink, fontWeight: 600 }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.werk : C.warn} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.05fr]">
        {/* De plank */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <Library size={16} strokeWidth={1.9} color={C.werk} aria-hidden="true" /> Op de plank
            </h3>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.faint }}
            >
              hoogte = match
            </span>
          </div>
          <Boekenplank activeId={activeId} onSelect={onSelect} />
          <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
            Elk deel is een match; de ruggenhoogte toont de sterkte. Kies een deel om te openen.
          </p>
        </Card>

        <div className="space-y-5">
          {/* Beste matches lijst */}
          <Card>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
                De reeks
              </h3>
              <button
                type="button"
                onClick={() => onGo("marktplaats")}
                className={`inline-flex items-center gap-1 rounded-[3px] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={{ color: C.werk }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(o.id)}
                    className={`flex w-full items-center gap-3 rounded-[4px] p-3 text-left transition-colors hover:bg-[#f0e9d9] focus-visible:ring-inset ${RING}`}
                  >
                    <ScoreSeal value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                        {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={15} strokeWidth={2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Live feed — loading + error-state */}
          <Card className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <BookOpen size={14} strokeWidth={2} color={C.werk} aria-hidden="true" /> Colofon
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Colofon wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-[2px]"
                    style={{ background: C.lineSoft, width: i === 0 ? "80%" : "60%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-[4px] p-3 sm:flex-row sm:items-center"
                style={{ background: `${C.alert}0d`, border: `1px solid ${C.alert}44` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.ink }}>
                  Register onbereikbaar. Kon de laatste mutaties niet ophalen.
                </p>
                <button
                  type="button"
                  onClick={() => setFeed("ok")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[11.5px] font-bold transition-colors ${RING}`}
                  style={{ color: C.paper, background: C.werk }}
                >
                  <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.4} color={C.verificatie} aria-hidden="true" />{" "}
                Colofon bijgewerkt — alle mutaties geladen.
              </p>
            )}
          </Card>

          {/* Berichten-preview */}
          <Card className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <Mail size={14} strokeWidth={2} color={C.werk} aria-hidden="true" /> Correspondentie
            </h3>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <li key={b.van} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-semibold"
                    style={{
                      ...serif,
                      color: C.werk,
                      background: `${C.werk}12`,
                      border: `1px solid ${C.werk}33`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold" style={{ color: C.ink }}>
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.werk }}
                          aria-label="ongelezen"
                        />
                      )}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                      {b.preview}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>De catalogus</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-[5px] px-4 py-3"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <Search size={16} strokeWidth={2} color={C.werk} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a8f7c]"
          style={{ ...body, color: C.ink }}
        />
        <span className="shrink-0 text-[11px] font-bold tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px]"
            style={{ background: `${C.werk}12`, border: `1px solid ${C.werk}33` }}
            aria-hidden="true"
          >
            <Library size={24} strokeWidth={1.9} color={C.werk} />
          </span>
          <p className="mt-4 text-[19px]" style={{ ...serif, color: C.ink, fontWeight: 600 }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen deel past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            className={`mt-5 rounded-[4px] px-4 py-2 text-[12.5px] font-bold transition-colors ${RING}`}
            style={{ color: C.paper, background: C.werk }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filtered.map((o, idx) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className={`text-left transition-all hover:-translate-y-1 ${RING}`}
                >
                  <BookCover
                    band={C.werk}
                    serie={`Deel ${idx + 1}`}
                    kop={o.id}
                    titel={o.titel}
                    ondertitel={`${o.plaats} · ${o.tarief}`}
                    meta={`Match ${o.match}%`}
                    active={on}
                    compact
                  />
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Card>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.werk }}
                  >
                    {sel.id}
                  </span>
                  <BookOpen size={15} strokeWidth={2} color={C.werk} aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p
                    className="text-[16px] font-semibold leading-snug"
                    style={{ ...serif, color: C.ink }}
                  >
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-[4px] p-2.5"
                        style={{ background: C.paperAlt }}
                      >
                        <dt
                          className="text-[10px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...serif, color: C.ink }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={() => onOpen(sel.id)}
                    className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-[4px] px-4 py-2.5 text-[12.5px] font-bold transition-colors ${RING}`}
                    style={{ color: C.paper, background: C.werk }}
                  >
                    Open deel <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[200px_1fr]">
        {/* de omslag */}
        <div className="mx-auto w-full max-w-[220px]">
          <BookCover
            band={C.werk}
            serie="Werk"
            kop={opdracht.id}
            titel={opdracht.titel}
            ondertitel={`${opdracht.opdrachtgever}, ${opdracht.plaats}`}
            meta={`Match ${opdracht.match}%`}
          />
        </div>

        <Card className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[3px] px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.muted,
                    background: C.paperAlt,
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-[13px] font-bold transition-colors disabled:opacity-90 ${RING}`}
            style={{ color: C.paper, background: state === "sent" ? C.ink : C.werk }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[18px] tabular-nums"
              style={{ ...serif, color: C.ink, fontWeight: 600 }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <BookOpen size={16} strokeWidth={2} color={C.werk} aria-hidden="true" />
          <h3 className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.verificatie }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.4}
                    color={C.verificatie}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.2}
                    color={C.warn}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
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

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.verificatie, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In behandeling", v: "1", color: C.financieel, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker color={C.verificatie}>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard — de groene reeks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Card key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[24px] tabular-nums"
                  style={{ ...serif, color: C.ink, fontWeight: 600 }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[5px]"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}44` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Card>
          );
        })}
      </div>

      <Card>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px]"
                style={{ background: `${m.color}12`, border: `1px solid ${m.color}44` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker color={C.warn}>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.werk;
          return (
            <Card key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: color, color: C.paper }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...serif, fontWeight: 600 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <BookOpen size={15} strokeWidth={2} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.11em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`m-3 shrink-0 self-center rounded-[4px] px-4 py-2 text-[12px] font-bold transition-colors ${RING}`}
                style={{
                  color: warn ? C.paper : C.ink,
                  background: warn ? C.warn : C.paperAlt,
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-[5px] p-4"
        style={{ background: `${C.verificatie}0d`, border: `1px solid ${C.verificatie}33` }}
      >
        <Check size={18} strokeWidth={2.2} color={C.verificatie} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe delen verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.verificatie,
    Openstaand: C.warn,
    Concept: C.faint,
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker color={C.financieel}>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          type="button"
          className={`inline-flex shrink-0 items-center gap-2 rounded-[4px] px-4 py-2.5 text-[12.5px] font-bold transition-colors ${RING}`}
          style={{ color: C.paper, background: C.financieel }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Card className="p-5">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.11em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-2 text-[22px] tabular-nums"
            style={{ ...serif, color: C.verificatie, fontWeight: 600 }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Card>
        <Card className="p-5">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.11em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[22px] tabular-nums"
            style={{ ...serif, color: C.warn, fontWeight: 600 }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...serif, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...serif, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.06em]"
                        style={{ color }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
