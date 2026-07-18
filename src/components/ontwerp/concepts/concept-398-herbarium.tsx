"use client";

// Concept 398 — "Herbarium" · Geperste botanie & archieflabels.
// Wetenschappelijk-warm archief: geperst-plant-esthetiek met handgeschreven-aandoende
// archieflabel-kaartjes (velden voor naam/status/datum), subtiele botanische lijn-illustraties via
// SVG, en een curatorieel, rustig ritme. Gevoelige documenten voelen als zorgvuldig geconserveerde
// exemplaren — vertrouwenwekkend en met de hand geordend. Vergeeld papier, inkt-bruin, botanisch
// groen en zegel-rood. Fonts: serif (Georgia-stack) + mono voor cijfers/codes op de labels.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Leaf,
  Sprout,
  Flower2,
  BookMarked,
  Bell,
  X,
  Feather,
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

// — Palet: vergeeld papier, inkt-bruin, botanisch groen, zegel-rood —
const C = {
  paper: "#f3ecdc",
  paperHi: "#f8f2e6",
  paperSink: "#eae0cb",
  card: "#fbf6ea",
  ink: "#3f3527",
  inkSoft: "#57493a",
  muted: "#7c6c56",
  faint: "#9c8b72",
  line: "rgba(63,53,39,0.16)",
  lineSoft: "rgba(63,53,39,0.09)",
  green: "#4a6741",
  greenSoft: "#6b8459",
  greenWash: "rgba(74,103,65,0.12)",
  red: "#8f3a2e",
  redWash: "rgba(143,58,46,0.11)",
  amber: "#a9762a",
  amberWash: "rgba(169,118,42,0.14)",
  seal: "#8f3a2e",
};

const serif = { fontFamily: 'Georgia, "Times New Roman", "Iowan Old Style", serif' };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
  wash: string;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geconserveerd",
        Icon: ShieldCheck,
        color: C.green,
        wash: C.greenWash,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        color: C.muted,
        wash: C.lineSoft,
        alarm: false,
      };
    case "EXPIRING":
      return {
        label: "Verwelkt binnenkort",
        Icon: AlertTriangle,
        color: C.amber,
        wash: C.amberWash,
        alarm: true,
      };
    case "REJECTED":
      return { label: "Afgekeurd", Icon: X, color: C.red, wash: C.redWash, alarm: true };
  }
}

// — Botanische lijn-illustratie (subtiel getekende twijg) als decoratief accent —
function Twig({ className = "", color = C.greenSoft }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M60 116 C60 88 60 60 60 30" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {(
        [
          [60, 92, -1],
          [60, 74, 1],
          [60, 58, -1],
          [60, 44, 1],
        ] as const
      ).map(([x, y, dir], i) => (
        <path
          key={i}
          d={`M${x} ${y} C${x + dir * 14} ${y - 4} ${x + dir * 22} ${y - 14} ${x + dir * 20} ${y - 24}
              C${x + dir * 10} ${y - 18} ${x + dir * 4} ${y - 8} ${x} ${y}`}
          stroke={color}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      ))}
      <circle cx="60" cy="26" r="3.2" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// — Perkament-blad met dunne inkt-rand —
function Sheet({
  children,
  className = "",
  as: Tag = "div",
  tone = "card",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  tone?: "card" | "paper";
}) {
  return (
    <Tag
      className={`rounded-[6px] ${className}`}
      style={{
        background: tone === "card" ? C.card : C.paperHi,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(63,53,39,0.05), 0 2px 8px rgba(63,53,39,0.05)",
      }}
    >
      {children}
    </Tag>
  );
}

// — Archieflabel: klein kaartje met veldjes (naam / status / datum) —
function ArchiveTag({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <span
      className="relative inline-flex items-center gap-2 rounded-[4px] px-2.5 py-1"
      style={{ background: C.paperHi, border: `1px dashed ${C.line}` }}
    >
      <span
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
        style={{ border: `1px solid ${C.faint}` }}
        aria-hidden="true"
      >
        <span className="block h-1 w-1 rounded-full" style={{ background: C.faint }} />
      </span>
      <span className="text-[10px] font-semibold tabular-nums" style={{ color: C.faint, ...mono }}>
        {code}
      </span>
      <span className="text-[11px] font-semibold" style={{ color: C.inkSoft, ...serif }}>
        {children}
      </span>
    </span>
  );
}

function Overline({ children, color = C.green }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color, ...mono }}>
      {children}
    </p>
  );
}

function Chip({
  children,
  color = C.muted,
  wash,
  strong = false,
}: {
  children: React.ReactNode;
  color?: string;
  wash?: string;
  strong?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: strong ? C.paperHi : color,
        background: strong ? color : (wash ?? C.paperHi),
        border: `1px solid ${strong ? "transparent" : C.line}`,
        ...serif,
      }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
  color = C.green,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-semibold text-[#f8f2e6] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ecdc] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{ background: color, ...serif }}
    >
      {children}
    </button>
  );
}

function GhostButton({
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
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2.5 text-[12.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ecdc] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.green : C.inkSoft,
        background: active ? C.greenWash : C.paperHi,
        border: `1px solid ${active ? C.green : C.line}`,
        ...serif,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline in botanische ranken-stijl —
function VineSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 116;
  const h = 30;
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
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 2.6 : 1.4} fill={color} />
      ))}
      {last && (
        <circle cx={last[0]} cy={last[1]} r="4" fill="none" stroke={color} strokeWidth="1" />
      )}
    </svg>
  );
}

// — Match als "conserveringsgraad" —
function MatchLeaf({ value }: { value: number }) {
  const color = value >= 90 ? C.green : value >= 84 ? C.greenSoft : C.amber;
  return (
    <div className="flex items-center gap-2">
      <span
        className="relative h-2 w-20 overflow-hidden rounded-full"
        style={{ background: C.paperSink }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </span>
      <span className="text-[12.5px] font-bold tabular-nums" style={{ color, ...mono }}>
        {value}%
      </span>
    </div>
  );
}

export function Concept398() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...serif, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-7">
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
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: C.greenWash, border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          <Leaf size={20} color={C.green} />
        </span>
        <div>
          <p className="text-[21px] font-semibold leading-none tracking-[0.01em]" style={serif}>
            Herbarium
          </p>
          <p
            className="mt-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Collectie · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.green, background: C.greenWash, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.paperHi, border: `1px solid ${C.line}`, color: C.muted }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-[#f8f2e6]"
              style={{ background: C.seal }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.inkSoft }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold text-[#f8f2e6]"
          style={{ background: C.green }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-[6px] p-1.5"
        style={{ background: C.paperSink, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[4px] px-4 py-2 text-[12.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eae0cb] motion-reduce:transition-none"
              style={{
                color: on ? C.paperHi : C.inkSoft,
                background: on ? C.green : "transparent",
                ...serif,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Sheet tone="paper" className="relative overflow-hidden p-7 md:p-8">
          <Twig className="pointer-events-none absolute -right-4 -top-4 h-40 w-40 opacity-30" />
          <Overline>Exemplaar-blad · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[33px] font-semibold italic leading-[1.05] tracking-[-0.01em] md:text-[42px]"
            style={serif}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Je collectie zorgvuldig geordend als een herbarium: elk certificaat een geconserveerd
            exemplaar, elk voorstel een nieuw blad om te bekijken.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={onActies}>
              Volgende zorg
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Bekijk de collectie</GhostButton>
          </div>
        </Sheet>

        {/* Volgende zorg — archieflabel-kaart */}
        <Sheet className="relative flex flex-col overflow-hidden p-6" as="section">
          <span
            className="pointer-events-none absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: C.amberWash, color: C.amber }}
            aria-hidden="true"
          >
            <AlertTriangle size={16} />
          </span>
          <Overline color={C.amber}>Vereist verzorging</Overline>
          <h2 className="mt-4 text-[19px] font-semibold leading-snug" style={serif}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ArchiveTag code="No. 087">VOG-zorg</ArchiveTag>
            <ArchiveTag code="23 d.">verwelkt</ArchiveTag>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} color={C.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </Sheet>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Waarnemingen · deze maand</Overline>
          <span className="text-[11px] font-semibold" style={{ color: C.faint, ...mono }}>
            {verified}/{CREDENTIALS.length} geconserveerd
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Sheet key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.green : C.amber,
                    background: k.up ? C.greenWash : C.amberWash,
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[28px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                style={serif}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <VineSpark data={k.spark} color={k.up ? C.green : C.amber} />
              </div>
            </Sheet>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Overline>Nieuwe bladen · open opdrachten</Overline>
            <button
              onClick={onOpen}
              className="rounded-[4px] text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527] focus-visible:ring-offset-2"
              style={{ color: C.green }}
            >
              Volledige collectie
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-[6px] p-4 text-left transition-colors hover:bg-[#f8f2e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ecdc] motion-reduce:transition-none"
                  style={{ background: C.card, border: `1px solid ${C.line}` }}
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                    style={{
                      background: i === 0 ? C.greenWash : C.paperHi,
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <Sprout size={19} color={i === 0 ? C.green : C.muted} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold" style={serif}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.muted, ...mono }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:block">
                      <MatchLeaf value={o.match} />
                    </span>
                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.faint }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Sheet className="p-6">
          <Overline color={C.green}>Geconserveerde exemplaren</Overline>
          <ul className="mt-4 space-y-3">
            {CREDENTIALS.map((c) => {
              const st = statusMeta(c.status);
              return (
                <li key={c.naam} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: st.wash, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={14} color={st.color} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold" style={serif}>
                      {c.naam}
                    </p>
                    <p
                      className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold"
                      style={{ color: st.color }}
                    >
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Sheet>
      </section>
    </div>
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
    <div className="space-y-7">
      <div>
        <Overline>De collectie · opdrachten</Overline>
        <h1
          className="mt-3 text-[32px] font-semibold italic leading-none tracking-[-0.01em]"
          style={serif}
        >
          Marktplaats
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted, ...mono }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          bladen in de lade
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[6px] px-4 py-3"
          style={{ background: C.paperHi, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Doorzoek de lade op soort, plaats of kweker…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9c8b72]"
            style={{ color: C.ink, ...serif }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527]"
              style={{ color: C.faint }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Sheet className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.paperHi, border: `1px dashed ${C.faint}` }}
              aria-hidden="true"
            >
              <Flower2 size={26} style={{ color: C.faint }} />
            </span>
            <p className="mt-5 text-[21px] font-semibold italic" style={serif}>
              Geen exemplaar gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen blad in de lade past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om
              meer exemplaren te tonen.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <X size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Sheet>
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
  const color = opdracht.match >= 90 ? C.green : opdracht.match >= 84 ? C.greenSoft : C.amber;
  return (
    <Sheet className="overflow-hidden">
      <div className="grid grid-cols-[auto_1fr] items-stretch">
        {/* Zij-label: soort-plaat met botanische twijg */}
        <div
          className="relative hidden w-24 shrink-0 flex-col items-center justify-center gap-2 border-r sm:flex"
          style={{ background: C.paperHi, borderColor: C.line }}
        >
          <Twig className="h-16 w-16 opacity-45" color={color} />
          <span
            className="text-[10px] font-semibold tabular-nums"
            style={{ color: C.faint, ...mono }}
          >
            No. {String(index + 1).padStart(3, "0")}
          </span>
        </div>

        <div className="min-w-0 p-5">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ArchiveTag code={opdracht.id.replace("OPD-", "")}>{opdracht.plaats}</ArchiveTag>
              </div>
              <h3 className="mt-2.5 text-[18px] font-semibold leading-snug" style={serif}>
                {opdracht.titel}
              </h3>
              <p className="mt-1 text-[12.5px] italic" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.uren}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <Chip key={t} color={C.green} wash={C.greenWash}>
                    <Leaf size={11} aria-hidden="true" /> {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.card, border: `2px solid ${color}` }}
                aria-hidden="true"
              >
                <span className="text-[14px] font-bold tabular-nums" style={{ color, ...mono }}>
                  {opdracht.match}
                </span>
              </span>
              <span
                className="text-[14px] font-semibold tabular-nums"
                style={{ color: C.inkSoft, ...mono }}
              >
                {opdracht.tarief}
              </span>
            </div>
          </div>

          <div className="mt-4 sm:hidden">
            <MatchLeaf value={opdracht.match} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527] focus-visible:ring-offset-2"
              style={{ color: C.green, background: C.greenWash }}
            >
              {open ? (
                <Minus size={13} aria-hidden="true" />
              ) : (
                <Plus size={13} aria-hidden="true" />
              )}
              Determinatie
            </button>
            <div className="ml-auto">
              <PrimaryButton onClick={onOpen} color={color}>
                Reageer <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>

          <div
            className="grid transition-all duration-300 motion-reduce:transition-none"
            style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <RedenBlok
                  titel="Kenmerken"
                  color={C.green}
                  Icon={Check}
                  items={opdracht.redenen.plus}
                />
                <RedenBlok
                  titel="Voorbehoud"
                  color={C.amber}
                  Icon={AlertTriangle}
                  items={opdracht.redenen.min}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function RedenBlok({
  titel,
  color,
  Icon,
  items,
}: {
  titel: string;
  color: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-[5px] p-4"
      style={{ background: C.paperHi, border: `1px solid ${C.line}` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color, ...mono }}>
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon size={14} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color }} />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const color = opdracht.match >= 90 ? C.green : opdracht.match >= 84 ? C.greenSoft : C.amber;
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f8f2e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f3527] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ecdc] motion-reduce:transition-none"
        style={{ color: C.inkSoft, background: C.paperHi, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar de collectie
      </button>

      <Sheet tone="paper" className="relative overflow-hidden p-7 md:p-9">
        <Twig
          className="pointer-events-none absolute -right-2 -top-2 h-44 w-44 opacity-25"
          color={color}
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <ArchiveTag code={opdracht.id.replace("OPD-", "No. ")}>{opdracht.plaats}</ArchiveTag>
          <Chip color={color} strong>
            <Flower2 size={12} aria-hidden="true" /> {opdracht.match}% match
          </Chip>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[30px] font-semibold italic leading-[1.08] tracking-[-0.01em] md:text-[40px]"
          style={serif}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[15px] font-semibold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <PrimaryButton color={color}>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>
            <BookMarked size={14} aria-hidden="true" /> In de lade bewaren
          </GhostButton>
        </div>
      </Sheet>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Sheet key={m.l} className="p-4">
            <p
              className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[19px] font-semibold tabular-nums" style={serif}>
              {m.v}
            </p>
          </Sheet>
        ))}
      </section>

      <section>
        <Overline>Determinatie · waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geconserveerde, geverifieerde profiel — de kenmerken die
          passen én het voorbehoud, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Sheet className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: C.greenWash, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <Check size={16} color={C.green} />
              </span>
              <p
                className="text-[12px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.green, ...mono }}
              >
                Kenmerken
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
          <Sheet className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: C.amberWash, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={16} color={C.amber} />
              </span>
              <p
                className="text-[12px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.amber, ...mono }}
              >
                Voorbehoud
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-7">
      <Sheet tone="paper" className="relative overflow-hidden p-6 md:p-7">
        <Twig className="pointer-events-none absolute -right-3 -top-3 h-36 w-36 opacity-25" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline color={C.green}>Conservering · authenticatie</Overline>
            <h1 className="mt-3 text-[28px] font-semibold italic leading-tight" style={serif}>
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} exemplaren zijn geconserveerd. Eén verwelkt
              binnenkort en vraagt om verzorging.
            </p>
          </div>
          <div className="relative" style={{ width: 88, height: 88 }}>
            <svg width={88} height={88} viewBox="0 0 88 88" aria-hidden="true">
              <circle cx="44" cy="44" r="34" fill="none" stroke={C.paperSink} strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r="34"
                fill="none"
                stroke={C.green}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - ratio / 100)}
                transform="rotate(-90 44 44)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-semibold tabular-nums leading-none" style={serif}>
                {ratio}
              </span>
              <span
                className="text-[8px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.faint, ...mono }}
              >
                bewaard
              </span>
            </div>
          </div>
        </div>
      </Sheet>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Sheet className="overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f3527]"
                >
                  <span
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ background: st.wash, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={19} color={st.color} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold" style={serif}>
                        {c.naam}
                      </span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <ArchiveTag code={`No. ${String(i + 1).padStart(3, "0")}`}>
                        {st.label}
                      </ArchiveTag>
                      <span className="text-[11.5px]" style={{ color: C.muted, ...mono }}>
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Chip color={st.color} wash={st.wash}>
                      <st.Icon size={12} aria-hidden="true" />
                      <span className="hidden sm:inline">{st.label}</span>
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Chip>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.faint, transform: isOpen ? "rotate(45deg)" : "none" }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-[5px] p-4"
                        style={{ background: C.paperHi, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard als in een gesloten
                          herbarium-lade en alleen na je expliciete toestemming gedeeld met een
                          opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton color={c.status === "EXPIRING" ? C.amber : C.green}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Sheet>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <Overline color={C.amber}>Kweekjournaal · volgende zorg</Overline>
        <h1
          className="mt-3 text-[32px] font-semibold italic leading-none tracking-[-0.01em]"
          style={serif}
        >
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — verzorg van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.amber : C.green;
          const wash = warn ? C.amberWash : C.greenWash;
          return (
            <li key={a.titel}>
              <Sheet className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                    style={{ background: wash, color, border: `1px solid ${C.line}`, ...serif }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color, background: wash, ...mono }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Feather size={11} aria-hidden="true" />
                      )}
                      {warn ? "Verzorging" : "Kans"}
                    </span>
                    <h2 className="mt-2 text-[16px] font-semibold leading-snug" style={serif}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton color={color}>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Sheet>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurStatusMeta(status: string): { color: string; wash: string; Icon: LucideIcon } {
  if (status === "Betaald") return { color: C.green, wash: C.greenWash, Icon: Check };
  if (status === "Openstaand") return { color: C.amber, wash: C.amberWash, Icon: AlertTriangle };
  return { color: C.muted, wash: C.lineSoft, Icon: Clock };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Register · grootboek</Overline>
          <h1
            className="mt-3 text-[32px] font-semibold italic leading-none tracking-[-0.01em]"
            style={serif}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            color: C.green,
            wash: C.greenWash,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            color: C.amber,
            wash: C.amberWash,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            color: C.muted,
            wash: C.lineSoft,
          },
        ].map((s) => (
          <Sheet key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.muted, ...mono }}
              >
                {s.l}
              </p>
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: s.color }}
                aria-hidden="true"
              />
            </div>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums"
              style={{ color: s.color === C.muted ? C.ink : s.color, ...serif }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px] italic" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Sheet>
        ))}
      </section>

      <Sheet className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const st = factuurStatusMeta(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-3.5 transition-colors hover:bg-[#f8f2e6] motion-reduce:transition-none sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 flex items-center gap-2 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: st.color }}
                    aria-hidden="true"
                  />
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={serif}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Chip color={st.color} wash={st.wash}>
                    <st.Icon size={12} aria-hidden="true" />
                    {f.status}
                  </Chip>
                </span>
                <span
                  className="order-2 text-right text-[14.5px] font-semibold tabular-nums sm:order-5"
                  style={{ color: f.status === "Openstaand" ? C.amber : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[22px] font-semibold tabular-nums" style={serif}>
            {totaalBetaald}
          </span>
        </div>
      </Sheet>
    </div>
  );
}
