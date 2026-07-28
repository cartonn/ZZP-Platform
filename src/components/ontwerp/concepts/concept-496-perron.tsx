"use client";

// Concept 496 — "Perron" · Transit/bewegwijzering in NS/metro-taal. Vette signage-sans in kapitalen,
// richtingpijlen als wayfinding, opdrachten als een vertrekbord-display met perron-nummers, en hoog
// contrast: signaalgeel op diep perron-blauw. Functioneel, iconisch, Nederlands transit-gevoel —
// alles wijst de weg. Cijfers in split-flap mono.

import { useMemo, useState, type ReactNode, type CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronLeft,
  Clock,
  CornerDownRight,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  TrainFront,
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

// — Palet: diep perron-blauw met signaalgeel en heldere transit-statuskleuren —
const C = {
  bg: "#071a3f",
  bgDeep: "#04122e",
  panel: "#0e2657",
  panelHi: "#143069",
  line: "#21407e",
  lineSoft: "#182f60",
  text: "#eef3fc",
  textMute: "#a7bade",
  textFaint: "#6f85b4",

  yellow: "#ffd400",
  yellowDeep: "#e6bd00",

  green: "#3ad07f",
  greenSoft: "#0f3a2c",
  blue: "#4aa3ff",
  blueSoft: "#0e2c52",
  amber: "#ffb020",
  amberSoft: "#3a2c0e",
  red: "#ff5a4d",
  redSoft: "#3a1512",
};

const sans: CSSProperties = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "ui-monospace, 'Roboto Mono', 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
  fontVariantNumeric: "tabular-nums",
};

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.green,
        soft: C.greenSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.blue, soft: C.blueSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.red, soft: C.redSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// — Signage-label: kapitalen met strakke tracking —
function Sign({ children, tone = C.textMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[11px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

// — Perron-nummer: geel plaatje met richtingpijl, als een spoor-/perronbord —
function PeronNr({ n, arrow = true }: { n: number | string; arrow?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1"
      style={{ background: C.yellow, color: C.bgDeep }}
      aria-hidden="true"
    >
      {arrow && <CornerDownRight size={13} strokeWidth={3} />}
      <span className="text-[15px] font-extrabold leading-none" style={{ ...mono }}>
        {n}
      </span>
    </span>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "line" | "quiet";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[11px]" : "px-5 py-2.5 text-[12.5px]";
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.yellow, color: C.bgDeep, border: `2px solid ${C.yellow}` }
      : variant === "line"
        ? { background: "transparent", color: C.yellow, border: `2px solid ${C.yellow}` }
        : { background: "transparent", color: C.text, border: `2px solid ${C.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] font-bold uppercase tracking-[0.1em] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071a3f] ${pad} ${className}`}
      style={{ ...style, ...sans }}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.1em]"
      style={{ color: base, background: soft, border: `1px solid ${base}`, ...sans }}
    >
      <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  style?: CSSProperties;
}) {
  return (
    <Tag
      className={`rounded-[4px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, ...style }}
    >
      {children}
    </Tag>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 90;
  const h = 22;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={tone} />
    </svg>
  );
}

// — Match als geel signaal-getal in een spoorbord —
function MatchSignal({ value, small = false }: { value: number; small?: boolean }) {
  const strong = value >= 90;
  const tone = strong ? C.green : C.yellow;
  return (
    <span
      className={`inline-flex flex-col items-center rounded-[3px] ${small ? "px-2 py-1" : "px-3 py-1.5"}`}
      style={{ background: C.bgDeep, border: `2px solid ${tone}` }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-extrabold leading-none ${small ? "text-[18px]" : "text-[26px]"}`}
        style={{ color: tone, ...mono }}
      >
        {value}
        <span className="align-super text-[0.5em]" style={{ color: C.textMute }}>
          %
        </span>
      </span>
      <span
        className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.2em]"
        style={{ color: C.textFaint, ...sans }}
      >
        match
      </span>
    </span>
  );
}

function SectionTitle({ over, children }: { over: string; children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <ArrowRight size={18} strokeWidth={3} style={{ color: C.yellow }} aria-hidden="true" />
      <div>
        <Sign tone={C.yellow}>{over}</Sign>
        <h2
          className="text-[20px] font-extrabold uppercase leading-none tracking-[0.02em]"
          style={{ color: C.text, ...sans }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept496() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{ background: C.bg, color: C.text, ...sans }}
    >
      <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8 md:px-10">
        <StationBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="pr-fade pt-6">
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
        @keyframes prFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .pr-fade { animation: prFade 0.36s ease both; }
        @media (prefers-reduced-motion: reduce) { .pr-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function StationBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="pt-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[4px]"
            style={{ background: C.yellow, color: C.bgDeep }}
            aria-hidden="true"
          >
            <TrainFront size={24} strokeWidth={2.5} />
          </span>
          <div>
            <p
              className="text-[22px] font-extrabold uppercase leading-none tracking-[0.06em]"
              style={{ color: C.text, ...sans }}
            >
              Perron
            </p>
            <p
              className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ color: C.textMute, ...sans }}
            >
              Station voor zelfstandigen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-[3px] px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] sm:inline-flex"
            style={{ color: C.green, background: C.greenSoft, ...sans }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="inline-flex h-9 items-center gap-1.5 rounded-[3px] px-2.5 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: C.text, border: `1px solid ${C.line}`, ...sans }}
            aria-label={`${ongelezen} ongelezen berichten`}
          >
            Post
            <span style={{ color: C.yellow, ...mono }}>{ongelezen}</span>
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-extrabold"
            style={{ background: C.panelHi, color: C.text, border: `1px solid ${C.line}`, ...sans }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-[3px] px-3 py-2"
        style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
      >
        <span
          className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: C.textMute, ...sans }}
        >
          <MapPin size={12} aria-hidden="true" style={{ color: C.yellow }} /> {PROFIEL.naam} —{" "}
          {PROFIEL.rol}
        </span>
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: C.textMute, ...sans }}
        >
          Halte {PROFIEL.plaats}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="inline-flex items-center gap-1.5 rounded-[3px] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd400]"
              style={{
                color: on ? C.bgDeep : C.text,
                background: on ? C.yellow : C.panel,
                border: `1px solid ${on ? C.yellowDeep : C.line}`,
                ...sans,
              }}
            >
              {on && <ArrowRight size={13} strokeWidth={3} aria-hidden="true" />}
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
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Sign tone={C.yellow}>Vertrekhal · {new Date().getFullYear()}</Sign>
          <h1
            className="mt-2 text-[34px] font-extrabold uppercase leading-[0.98] tracking-[0.01em] md:text-[44px]"
            style={{ color: C.text, ...sans }}
          >
            Goedemorgen,
            <br />
            <span style={{ color: C.yellow }}>{PROFIEL.naam.split(" ")[0]}.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.textMute }}>
            Uw dossier is geverifieerd en op orde. Er staan verse opdrachten op het bord en één
            document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={13} strokeWidth={3} aria-hidden="true" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar het bord
            </Btn>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {KPIS.map((k) => (
              <Panel key={k.label} className="p-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: C.textMute, ...sans }}
                >
                  {k.label}
                </p>
                <p
                  className="mt-2 text-[26px] font-extrabold leading-none"
                  style={{ color: C.text, ...mono }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: k.up ? C.green : C.amber, ...mono }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <Spark data={k.spark} tone={C.textFaint} />
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <Panel className="p-5">
            <div className="flex items-center gap-2" style={{ color: C.amber }}>
              <AlertTriangle size={15} strokeWidth={2.5} aria-hidden="true" />
              <Sign tone={C.amber}>Vertraging · actie</Sign>
            </div>
            <h3
              className="mt-2.5 text-[18px] font-extrabold uppercase leading-snug tracking-[0.01em]"
              style={{ color: C.text, ...sans }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.textMute }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} strokeWidth={3} aria-hidden="true" />
            </Btn>
          </Panel>

          <Panel className="p-5">
            <Sign>Vertrouwen</Sign>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-extrabold leading-none"
                style={{ color: C.yellow, ...mono }}
              >
                {ratio}%
              </span>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.textMute, ...sans }}
              >
                op orde
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.bgDeep }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: C.green,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p
              className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.textMute, ...sans }}
            >
              {verified} van {CREDENTIALS.length} geverifieerd
            </p>
          </Panel>
        </aside>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <SectionTitle over="Vertrekbord">Opdrachten</SectionTitle>
          <button
            type="button"
            onClick={onMarkt}
            className="mb-4 ml-4 shrink-0 rounded-[3px] text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd400]"
            style={{ color: C.yellow, ...sans }}
          >
            Volledig bord →
          </button>
        </div>
        <DepartureBoard opdrachten={OPDRACHTEN} onOpen={onOpen} />
      </section>

      <section>
        <SectionTitle over="Reisdocumenten">Certificaten</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 p-3.5">
                <t.Icon size={17} strokeWidth={2.5} aria-hidden="true" style={{ color: t.base }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-bold uppercase tracking-[0.02em]"
                    style={{ color: C.text }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: t.alarm ? t.base : C.textMute }}
                  >
                    {c.detail}
                  </span>
                </span>
                <StatusTag {...t} />
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// — Vertrekbord: opdrachten als departure-board rijen —
function DepartureBoard({ opdrachten, onOpen }: { opdrachten: Opdracht[]; onOpen: () => void }) {
  return (
    <Panel className="overflow-hidden">
      <div
        className="hidden grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 sm:grid"
        style={{ background: C.bgDeep, borderBottom: `1px solid ${C.line}` }}
      >
        {["Perron", "Bestemming", "Tarief", "Status"].map((h) => (
          <Sign key={h} tone={C.textFaint}>
            {h}
          </Sign>
        ))}
      </div>
      <ul>
        {opdrachten.map((o, i) => {
          const strong = o.match >= 90;
          return (
            <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
              <button
                type="button"
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#143069] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffd400] sm:grid-cols-[auto_1fr_auto_auto] sm:gap-4"
              >
                <PeronNr n={i + 1} />
                <span className="min-w-0">
                  <span
                    className="block truncate text-[15px] font-bold uppercase tracking-[0.01em]"
                    style={{ color: C.text }}
                  >
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11px] font-medium uppercase tracking-[0.06em]"
                    style={{ color: C.textMute, ...mono }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </span>
                </span>
                <span
                  className="hidden text-right text-[14px] font-bold sm:block"
                  style={{ color: C.yellow, ...mono }}
                >
                  {o.tarief.replace(" / uur", "")}
                </span>
                <span className="hidden items-center gap-2 sm:flex">
                  <span
                    className="text-[13px] font-extrabold"
                    style={{ color: strong ? C.green : C.yellow, ...mono }}
                  >
                    {o.match}%
                  </span>
                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: C.yellow }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

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
    <div className="space-y-6">
      <div>
        <Sign tone={C.yellow}>Vertrekbord</Sign>
        <h1
          className="mt-1.5 text-[30px] font-extrabold uppercase leading-none tracking-[0.01em] md:text-[38px]"
          style={{ color: C.text, ...sans }}
        >
          Opdrachten die passen
        </h1>
        <p
          className="mt-2 text-[12px] font-bold uppercase tracking-[0.1em]"
          style={{ color: C.textMute, ...sans }}
        >
          {filtered.length} van {OPDRACHTEN.length} op het bord
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[3px] px-3.5 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f85b4]"
            style={{ color: C.text, ...sans }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd400]"
              style={{ color: C.textMute }}
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
              variant={sort === s ? "solid" : "quiet"}
              onClick={() => setSort(s)}
            >
              <ArrowLeftRight size={12} strokeWidth={2.5} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ color: C.yellow, border: `2px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p
            className="mt-4 text-[22px] font-extrabold uppercase tracking-[0.02em]"
            style={{ color: C.text, ...sans }}
          >
            Geen vertrek gevonden
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.textMute }}>
            Er staat geen opdracht voor {q ? `“${q}”` : "uw zoekterm"} op het bord. Verruim uw
            zoekopdracht.
          </p>
          <Btn variant="line" className="mt-5" onClick={() => setQ("")}>
            Zoekterm wissen
          </Btn>
        </Panel>
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
  return (
    <Panel as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5">
          <MatchSignal value={opdracht.match} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <PeronNr n={index + 1} arrow={false} />
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: strong ? C.green : C.yellow, ...sans }}
            >
              {strong ? "Sneldienst" : "Stoptrein"}
            </span>
            <span
              className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ color: C.textFaint, ...mono }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[19px] font-extrabold uppercase leading-snug tracking-[0.01em]"
            style={{ color: C.text, ...sans }}
          >
            {opdracht.titel}
          </h3>
          <p
            className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.06em]"
            style={{ color: C.textMute, ...mono }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[3px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                style={{
                  background: C.bgDeep,
                  color: C.textMute,
                  border: `1px solid ${C.line}`,
                  ...sans,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[17px] font-extrabold" style={{ color: C.yellow, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.textFaint, ...sans }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3"
        style={{ borderTop: `1px solid ${C.lineSoft}` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[3px] text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd400]"
          style={{ color: C.yellow, ...sans }}
        >
          <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" />
          {open ? "Verberg redenen" : "Waarom deze match"}
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} strokeWidth={3} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-6 px-5 py-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In uw voordeel"
              tone={C.green}
              Icon={ShieldCheck}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
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
        className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone, ...sans }}
      >
        <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.textMute }}
          >
            <ArrowRight
              size={13}
              strokeWidth={2.5}
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

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-6">
      <Btn variant="quiet" size="sm" onClick={onBack}>
        <ChevronLeft size={14} strokeWidth={3} aria-hidden="true" /> Terug naar het bord
      </Btn>

      <header>
        <div className="flex flex-wrap items-center gap-2.5">
          <PeronNr n={1} />
          <span
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: C.textMute, ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: strong ? C.green : C.yellow, ...sans }}
          >
            {strong ? "Sneldienst" : "Stoptrein"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-3 max-w-2xl text-[30px] font-extrabold uppercase leading-[1.02] tracking-[0.01em] md:text-[38px]"
          style={{ color: C.text, ...sans }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-2 flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.06em]"
          style={{ color: C.textMute, ...mono }}
        >
          <MapPin size={14} aria-hidden="true" style={{ color: C.yellow }} />{" "}
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} strokeWidth={3} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Vertrek", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.textMute, ...sans }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[19px] font-extrabold" style={{ color: C.text, ...mono }}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <section>
        <SectionTitle over="Reisadvies">Waarom deze match past</SectionTitle>
        <p className="mb-5 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.textMute }}>
          Afgezet tegen uw geverifieerde profiel — open en navolgbaar, zonder verborgen score.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <p
              className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.green, ...sans }}
            >
              <ShieldCheck size={13} strokeWidth={2.5} aria-hidden="true" /> In uw voordeel
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.textMute }}
                >
                  <ArrowRight
                    size={15}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <p
              className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.amber, ...sans }}
            >
              <AlertTriangle size={13} strokeWidth={2.5} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.textMute }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Sign tone={C.yellow}>Reisdocumenten</Sign>
          <h1
            className="mt-1.5 text-[28px] font-extrabold uppercase leading-none tracking-[0.01em]"
            style={{ color: C.text, ...sans }}
          >
            {PROFIEL.trust}
          </h1>
          <p
            className="mt-2.5 max-w-lg text-[13.5px] leading-relaxed"
            style={{ color: C.textMute }}
          >
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt uw reis op schema. Documenten worden versleuteld bewaard
            en uitsluitend met uw toestemming gedeeld.
          </p>
        </div>
        <Panel className="p-5">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[44px] font-extrabold leading-none"
              style={{ color: C.yellow, ...mono }}
            >
              {ratio}%
            </span>
          </div>
          <p
            className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.textMute, ...sans }}
          >
            op orde
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ background: C.bgDeep }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: C.green,
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Panel>
      </section>

      <section>
        <SectionTitle over="Loket">Certificaten</SectionTitle>
        <Panel className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const t = credTone(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#143069] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffd400]"
                  >
                    <t.Icon
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      style={{ color: t.base }}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-bold uppercase tracking-[0.02em]"
                        style={{ color: C.text }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.textMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusTag {...t} />
                    </span>
                    <ArrowRight
                      size={16}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.yellow, transform: isOpen ? "rotate(90deg)" : "none" }}
                    />
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 sm:pl-[54px]">
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.textMute }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na uw
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
                          <Btn size="sm" variant="quiet">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>

      <section>
        <SectionTitle over="Bagagekluis">Documentenkast</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                <FileText
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  style={{ color: C.textMute }}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-bold uppercase tracking-[0.02em]"
                    style={{ color: C.text }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.textMute, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusTag {...t} />
              </Panel>
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
        <Sign tone={C.yellow}>Omroepberichten</Sign>
        <h1
          className="mt-1.5 text-[28px] font-extrabold uppercase leading-none tracking-[0.01em]"
          style={{ color: C.text, ...sans }}
        >
          Wat uw aandacht vraagt
        </h1>
        <p
          className="mt-2 text-[12px] font-bold uppercase tracking-[0.1em]"
          style={{ color: C.textMute, ...sans }}
        >
          Op volgorde van urgentie
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Panel
                className="flex items-start gap-4 p-5"
                style={{ borderLeft: `4px solid ${tone}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[15px] font-extrabold"
                  style={{
                    background: C.bgDeep,
                    color: tone,
                    border: `1px solid ${C.line}`,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: tone, ...sans }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <Clock size={12} strokeWidth={2.5} aria-hidden="true" />
                    )}
                    {warn ? "Storing" : "Mededeling"}
                  </span>
                  <h2
                    className="mt-1.5 text-[18px] font-extrabold uppercase leading-snug tracking-[0.01em]"
                    style={{ color: C.text, ...sans }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.textMute }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} strokeWidth={3} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.green, soft: C.greenSoft };
  if (status === "Openstaand") return { base: C.amber, soft: C.amberSoft };
  if (status === "Concept") return { base: C.blue, soft: C.blueSoft };
  return { base: C.red, soft: C.redSoft };
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Sign tone={C.yellow}>Kassa</Sign>
          <h1
            className="mt-1.5 text-[28px] font-extrabold uppercase leading-none tracking-[0.01em]"
            style={{ color: C.text, ...sans }}
          >
            Uw facturen
          </h1>
        </div>
        <Btn variant="solid">Nieuwe factuur</Btn>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.blue },
        ].map((s) => (
          <Panel key={s.l} className="p-4" style={{ borderLeft: `4px solid ${s.tone}` }}>
            <p
              className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.textMute, ...sans }}
            >
              {s.l}
            </p>
            <p className="mt-1 text-[24px] font-extrabold" style={{ color: s.tone, ...mono }}>
              {s.v}
            </p>
            <p
              className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.06em]"
              style={{ color: C.textMute, ...sans }}
            >
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "quiet"}
            onClick={() => setSort(s)}
          >
            <ArrowLeftRight size={12} strokeWidth={2.5} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ background: C.bgDeep, borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.textFaint, ...sans }}
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
                  className="transition-colors hover:bg-[#143069]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.textMute, ...mono }}>
                    {f.nr}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[13.5px] font-bold uppercase tracking-[0.02em]"
                    style={{ color: C.text }}
                  >
                    {f.klant}
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.textMute, ...mono }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[14px] font-extrabold"
                    style={{ color: C.yellow, ...mono }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                      style={{
                        color: t.base,
                        background: t.soft,
                        border: `1px solid ${t.base}`,
                        ...sans,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: t.base }}
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
      </Panel>
    </div>
  );
}
