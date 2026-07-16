"use client";

// Concept 356 — "Halogeen" · Warm nacht-dashboard. Amber gloeilamplicht op houtskool, cozy-pro
// dark, zachte warme gloed rond actieve elementen, kaarslicht-vignet. Behaaglijk maar zakelijk en
// data-scherp — voor de avonddienst-planner. Contrast bewaakt: warm-wit op donker.
// Palet: houtskool #17130e → #221b12, amber #ffb347 / #ff8a3d, warm-wit #f5ece0.
// Fonts: Sora (display) + Jakarta (UI) + Mono (cijfers/labels).

import { useMemo, useState } from "react";
import {
  Flame,
  Search,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Check,
  Minus,
  ArrowRight,
  ArrowLeft,
  Moon,
  LayoutDashboard,
  Store,
  FileText,
  ListChecks,
  Receipt,
  Plus,
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
  bg0: "#17130e",
  bg1: "#221b12",
  panel: "rgba(43,34,23,0.7)",
  panelSolid: "#2a2116",
  raise: "#332818",
  ink: "#f5ece0",
  inkSoft: "#d8c9b4",
  muted: "#b0a08a",
  faint: "#867660",
  line: "rgba(245,236,224,0.09)",
  lineStrong: "rgba(245,236,224,0.16)",
  amber: "#ffb347",
  amberDeep: "#ff8a3d",
  ok: "#8fce8a",
  warn: "#ffb347",
  bad: "#f08a7a",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const ui = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const AMBER_GRAD = `linear-gradient(120deg, ${C.amber}, ${C.amberDeep})`;
const GLOW = "0 0 0 1px rgba(255,179,71,0.35), 0 8px 30px -8px rgba(255,138,61,0.4)";

const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, color: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.inkSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.bad };
  }
}

const ringFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffb347] focus-visible:ring-offset-[#17130e]";

function Panel({
  children,
  className = "",
  warm = false,
}: {
  children: React.ReactNode;
  className?: string;
  warm?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${warm ? "rgba(255,179,71,0.22)" : C.line}`,
        boxShadow: warm
          ? "inset 0 1px 0 rgba(255,179,71,0.1), 0 18px 44px -26px rgba(255,138,61,0.5)"
          : "inset 0 1px 0 rgba(245,236,224,0.05), 0 14px 40px -28px rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)",
      }}
    >
      {children}
    </section>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / range) * 22 - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(" ");
  const area = `0,28 ${line} 100,28`;
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hal-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.amber} stopOpacity="0.35" />
          <stop offset="1" stopColor={C.amber} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#hal-spark)" />
      <polyline
        points={line}
        fill="none"
        stroke={C.amber}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Filament({ value, size = 52 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id={`hal-ring-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.amber} />
          <stop offset="1" stopColor={C.amberDeep} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.lineStrong} strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#hal-ring-${size})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: "drop-shadow(0 0 3px rgba(255,179,71,0.6))" }}
      />
    </svg>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{
        background: "rgba(255,179,71,0.09)",
        color: C.inkSoft,
        border: `1px solid ${C.line}`,
      }}
    >
      {children}
    </span>
  );
}

export function Concept356() {
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
      style={{
        ...ui,
        color: C.ink,
        background: `radial-gradient(120% 80% at 50% -10%, ${C.bg1}, ${C.bg0} 60%)`,
      }}
    >
      {/* Kaarslicht-vignet + warme gloed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 35% at 20% 12%, rgba(255,138,61,0.14), transparent 60%), radial-gradient(40% 40% at 88% 20%, rgba(255,179,71,0.1), transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 220px 40px rgba(0,0,0,0.55)" }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <Topbar screen={screen} setScreen={setScreen} />
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
  );
}

function Topbar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <Panel className="px-3 py-3 md:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 pr-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: AMBER_GRAD, boxShadow: "0 0 18px -2px rgba(255,138,61,0.7)" }}
            aria-hidden="true"
          >
            <Flame size={17} color="#2a1a08" />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight" style={display}>
              Halogeen
            </p>
            <p
              className="flex items-center gap-1 text-[10px] uppercase tracking-[0.28em]"
              style={{ color: C.faint, ...mono }}
            >
              <Moon size={9} aria-hidden="true" /> avonddienst
            </p>
          </div>
        </div>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = SCREEN_ICON[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${ringFocus}`}
                style={{
                  color: on ? "#2a1a08" : C.muted,
                  fontWeight: on ? 700 : 500,
                  background: on ? AMBER_GRAD : "transparent",
                  boxShadow: on ? "0 0 16px -4px rgba(255,138,61,0.65)" : "none",
                }}
              >
                <Icon size={14} aria-hidden="true" style={{ color: on ? "#2a1a08" : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 pl-1">
          <div className="hidden text-right sm:block">
            <p className="text-[12px] font-semibold leading-tight">{PROFIEL.naam}</p>
            <p className="text-[10px] leading-tight" style={{ color: C.faint }}>
              {PROFIEL.trust}
            </p>
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: C.raise, border: `1px solid ${C.lineStrong}`, color: C.amber }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
    </Panel>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: C.amber, ...mono }}>
        {eyebrow}
      </p>
      <h1
        className="mt-1.5 text-[26px] font-semibold tracking-tight md:text-[30px]"
        style={display}
      >
        {title}
      </h1>
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
      <Panel warm className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[11px] uppercase tracking-[0.3em]"
              style={{ color: C.amber, ...mono }}
            >
              Goedenavond · {PROFIEL.trust}
            </p>
            <h1
              className="mt-3 text-[34px] font-semibold leading-[1.06] tracking-tight md:text-[42px]"
              style={display}
            >
              Goedenavond,
              <br />
              {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              De avonddienst staat klaar. Eén ding gloeit nog rood — de rest is warm en op orde.
            </p>
            <button
              onClick={() => goto("acties")}
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${ringFocus}`}
              style={{ background: AMBER_GRAD, color: "#2a1a08", boxShadow: GLOW }}
            >
              Bekijk je acties
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>

          <div
            className="w-full max-w-xs rounded-xl p-4"
            style={{
              background: "rgba(255,138,61,0.1)",
              border: "1px solid rgba(255,179,71,0.28)",
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} aria-hidden="true" style={{ color: C.amber }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.amber }}
              >
                Vraagt aandacht
              </span>
            </div>
            <p className="mt-2.5 text-[15px] font-semibold leading-snug" style={display}>
              {primair.titel}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
            <button
              onClick={() => goto("verificatie")}
              className={`mt-3.5 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition-colors ${ringFocus}`}
              style={{ background: C.raise, border: `1px solid ${C.lineStrong}`, color: C.amber }}
            >
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-[11px] leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.ok : C.amber,
                  background: k.up ? "rgba(143,206,138,0.12)" : "rgba(255,179,71,0.12)",
                }}
              >
                {k.trend}
              </span>
            </div>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums tracking-tight"
              style={display}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5 md:p-6">
        <div className="flex items-center justify-between">
          <SectionTitle eyebrow="Voor jou" title="Opdrachten" />
          <button
            onClick={() => goto("marktplaats")}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[rgba(255,179,71,0.08)] ${ringFocus}`}
            style={{ color: C.amber }}
          >
            Alle opdrachten
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <ul className="mt-5 space-y-3">
          {OPDRACHTEN.map((o) => (
            <OpdrachtRow key={o.id} o={o} onOpen={onOpen} />
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function OpdrachtRow({ o, onOpen }: { o: Opdracht; onOpen: (id: string) => void }) {
  return (
    <li>
      <button
        onClick={() => onOpen(o.id)}
        className={`group flex w-full items-center gap-4 rounded-xl p-3.5 text-left transition-all hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${ringFocus}`}
        style={{ background: "rgba(51,40,24,0.4)", border: `1px solid ${C.line}` }}
      >
        <div className="relative flex shrink-0 items-center justify-center">
          <Filament value={o.match} />
          <span
            className="absolute text-[12px] font-bold tabular-nums"
            style={{ ...mono, color: C.amber }}
          >
            {o.match}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight" style={display}>
            {o.titel}
          </p>
          <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.muted }}>
            {o.opdrachtgever} · {o.plaats}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {o.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[14px] font-bold tabular-nums" style={{ ...mono, color: C.ink }}>
            {o.tarief}
          </p>
          <p className="mt-0.5 text-[11.5px]" style={{ color: C.faint }}>
            {o.uren}
          </p>
        </div>
        <ArrowRight
          size={18}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          style={{ color: C.amber }}
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
      <Panel warm className="p-5 md:p-6">
        <SectionTitle eyebrow="Marktplaats" title="Open opdrachten" />
        <div
          className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: C.panelSolid, border: `1px solid ${C.lineStrong}` }}
        >
          <Search size={18} aria-hidden="true" style={{ color: C.amber }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of vaardigheid…"
            aria-label="Opdrachten zoeken"
            className={`w-full rounded-md bg-transparent text-[15px] outline-none placeholder:text-[#867660] ${ringFocus}`}
            style={{ color: C.ink }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className={`rounded-md px-2 py-1 text-[12px] font-semibold transition-colors hover:bg-[rgba(255,179,71,0.1)] ${ringFocus}`}
              style={{ color: C.muted }}
            >
              Wissen
            </button>
          )}
        </div>
        <p className="mt-3 text-[12px]" style={{ color: C.faint, ...mono }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten
        </p>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(255,138,61,0.12)",
              border: "1px solid rgba(255,179,71,0.3)",
            }}
          >
            <Search size={22} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <p className="mt-4 text-[18px] font-semibold tracking-tight" style={display}>
            Niets gevonden
          </p>
          <p
            className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed"
            style={{ color: C.muted }}
          >
            Geen opdracht past bij “{q}”. Verruim je zoekterm of pas je beschikbaarheid aan.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${ringFocus}`}
            style={{ background: AMBER_GRAD, color: "#2a1a08", boxShadow: GLOW }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <Panel className="p-5 md:p-6">
          <ul className="space-y-3">
            {filtered.map((o) => (
              <OpdrachtRow key={o.id} o={o} onOpen={onOpen} />
            ))}
          </ul>
        </Panel>
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
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[rgba(255,179,71,0.08)] ${ringFocus}`}
        style={{ color: C.muted }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <Panel warm className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-lg">
            <div className="flex items-center gap-2.5">
              <Tag>
                <span style={mono}>{opdracht.id}</span>
              </Tag>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ ...mono, color: C.amber }}
              >
                {opdracht.match}% match
              </span>
            </div>
            <h1
              className="mt-3.5 text-[28px] font-semibold leading-tight tracking-tight md:text-[34px]"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            <button
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${ringFocus}`}
              style={{ background: AMBER_GRAD, color: "#2a1a08", boxShadow: GLOW }}
            >
              Reageer op opdracht
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="relative">
            <Filament value={opdracht.match} size={104} />
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-semibold tabular-nums leading-none" style={display}>
                {opdracht.match}
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: C.faint, ...mono }}
              >
                match
              </span>
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[20px] font-semibold tabular-nums tracking-tight"
              style={display}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6">
        <div className="flex items-center gap-2">
          <Flame size={16} aria-hidden="true" style={{ color: C.amber }} />
          <h2 className="text-[16px] font-semibold tracking-tight" style={display}>
            Waarom deze match
          </h2>
        </div>
        <p className="mt-2 max-w-lg text-[13px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandachtspunten,
          zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(51,40,24,0.4)", border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.ok }}
            >
              Wat past
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
            className="rounded-xl p-4"
            style={{ background: "rgba(51,40,24,0.4)", border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.warn }}
            >
              Aandacht
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.muted }}
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
      </Panel>
    </div>
  );
}

function Verificatie() {
  const [openItem, setOpenItem] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <Panel warm className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <SectionTitle eyebrow="Vertrouwen" title="Verificatie" />
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              <span style={{ color: C.ink, fontWeight: 700 }}>{PROFIEL.trust}.</span> {verified} van{" "}
              {CREDENTIALS.length} credentials volledig geverifieerd. Eén vraagt binnenkort actie.
            </p>
          </div>
          <div className="relative">
            <Filament value={pct} size={88} />
            <span
              className="absolute inset-0 flex items-center justify-center text-[20px] font-semibold tabular-nums"
              style={display}
            >
              {pct}%
            </span>
          </div>
        </div>
      </Panel>

      <Panel className="p-4 md:p-5">
        <ul className="space-y-2.5">
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            const isOpen = openItem === c.naam;
            return (
              <li
                key={c.naam}
                className="rounded-xl"
                style={{ background: "rgba(51,40,24,0.4)", border: `1px solid ${C.line}` }}
              >
                <button
                  onClick={() => setOpenItem(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 rounded-xl p-4 text-left transition-colors hover:bg-[rgba(255,179,71,0.06)] ${ringFocus}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${st.color}1f`, border: `1px solid ${st.color}44` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} style={{ color: st.color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-semibold tracking-tight"
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
                  <Plus
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{ color: C.faint, transform: isOpen ? "rotate(45deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 pl-16 text-[13px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Acties() {
  const tone = (u: "warning" | "info") =>
    u === "warning"
      ? { color: C.amber, Icon: AlertTriangle, bg: "rgba(255,179,71,0.12)" }
      : { color: C.inkSoft, Icon: Flame, bg: "rgba(255,138,61,0.08)" };
  return (
    <div className="space-y-6">
      <Panel warm className="p-6 md:p-8">
        <SectionTitle eyebrow="Aandacht" title="Volgende acties" />
        <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Deze stappen houden je profiel warm en verifieerbaar. Van boven naar beneden op urgentie.
        </p>
      </Panel>
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone(a.urgentie);
          return (
            <li key={a.titel}>
              <Panel className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: t.bg, border: `1px solid ${t.color}33` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} style={{ color: t.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-bold tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-[16px] font-semibold tracking-tight" style={display}>
                        {a.titel}
                      </h2>
                    </div>
                    <p
                      className="mt-1.5 max-w-md text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className={`shrink-0 self-start rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors hover:bg-[rgba(255,179,71,0.1)] ${ringFocus}`}
                    style={{ border: `1px solid ${C.lineStrong}`, color: C.amber }}
                  >
                    {a.cta}
                  </button>
                </div>
              </Panel>
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
      <Panel warm className="flex flex-wrap items-end justify-between gap-4 p-6 md:p-8">
        <SectionTitle eyebrow="Omzet" title="Facturen" />
        <button
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${ringFocus}`}
          style={{ background: AMBER_GRAD, color: "#2a1a08", boxShadow: GLOW }}
        >
          <Plus size={15} aria-hidden="true" />
          Nieuwe factuur
        </button>
      </Panel>

      <Panel className="overflow-hidden">
        <div
          className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.9fr] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.14em] sm:grid"
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
              className="grid grid-cols-2 items-center gap-3 px-5 py-4 transition-colors hover:bg-[rgba(255,179,71,0.05)] sm:grid-cols-[1.4fr_1fr_0.8fr_0.9fr] sm:gap-4"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold tracking-tight" style={display}>
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
                style={{ ...mono, color: C.muted }}
              >
                {f.nr}
              </span>
              <span
                className="hidden text-[12.5px] tabular-nums sm:block"
                style={{ ...mono, color: C.muted }}
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
          style={{ background: "rgba(255,138,61,0.08)" }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ color: C.amber, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[20px] font-semibold tabular-nums" style={display}>
            € {totaal}
          </span>
        </div>
      </Panel>
    </div>
  );
}
