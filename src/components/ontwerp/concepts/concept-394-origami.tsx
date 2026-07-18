"use client";

// Concept 394 — "Origami" · Gevouwen papier & facetten.
// Crisp gevouwen-papier-esthetiek: lichte facet-vlakken met subtiele lineaire gradients die
// vouwlijnen en licht suggereren, scherpe diagonale creases, zachte slagschaduw langs de vouwen.
// Diepte ontstaat puur uit licht en vouw — geen decoratieve gradients, geen kaart-in-kaart.
// Palet: papier-wit #f4f1ea met één inkt-accent #33507a en een warme vouw-schaduw.
// Fonts: humanist sans (systeem) + mono cijfers.

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
  ChevronRight,
  Triangle,
  Sparkle,
  Bell,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: papier-wit basis, warme vouw-schaduwen en één diep inkt-accent —
const C = {
  paper: "#f4f1ea",
  paperHi: "#faf8f2",
  paperLo: "#eae5d9",
  paperEdge: "#e2dccd",
  ink: "#25272b",
  inkSoft: "#3c3f45",
  muted: "#6c6d68",
  faint: "#95917f",
  line: "rgba(37,39,43,0.10)",
  accent: "#33507a",
  accentHi: "#4a6a99",
  accentInk: "#243a5c",
  accentWash: "rgba(51,80,122,0.10)",
  warn: "#a4622a",
  warnWash: "rgba(164,98,42,0.13)",
  ok: "#3f6b4c",
  okWash: "rgba(63,107,76,0.12)",
  bad: "#a2403a",
  badWash: "rgba(162,64,58,0.12)",
  foldShadow: "rgba(120,104,74,0.30)",
};

const sans = { fontFamily: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", sans-serif' };
const mono = {
  fontFamily: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace',
};

// — Vouw-gradients: een lichte facet-helling met een scherpe crease-lijn in het midden —
const CREASE_V = `linear-gradient(101deg, ${C.paperHi} 0%, ${C.paper} 49.4%, ${C.paperLo} 50%, ${C.paper} 50.6%, ${C.paper} 100%)`;
const CREASE_DIAG = `linear-gradient(135deg, ${C.paperHi} 0%, ${C.paper} 46%, ${C.paperLo} 50%, ${C.paper} 54%, ${C.paperHi} 100%)`;
const FACET = `linear-gradient(160deg, ${C.paperHi} 0%, ${C.paper} 62%, ${C.paperLo} 100%)`;

const shadow = {
  fold: `6px 8px 20px -8px ${C.foldShadow}, 0 1px 0 rgba(255,255,255,0.7) inset`,
  foldSm: `3px 4px 12px -6px ${C.foldShadow}, 0 1px 0 rgba(255,255,255,0.6) inset`,
  foldLg: `12px 16px 34px -12px ${C.foldShadow}, 0 1px 0 rgba(255,255,255,0.75) inset`,
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
        tone: C.accent,
        wash: C.accentWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        wash: C.warnWash,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, tone: C.bad, wash: C.badWash };
  }
}

// — Gevouwen papier-paneel: facet-vlak met crease en teruggevouwen hoek —
function Fold({
  children,
  className = "",
  variant = "facet",
  corner = true,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "facet" | "creaseV" | "creaseDiag" | "flat";
  corner?: boolean;
  as?: "div" | "section" | "li" | "article";
}) {
  const bg =
    variant === "creaseV"
      ? CREASE_V
      : variant === "creaseDiag"
        ? CREASE_DIAG
        : variant === "flat"
          ? C.paper
          : FACET;
  return (
    <Tag
      className={`relative overflow-hidden ${className}`}
      style={{
        background: bg,
        boxShadow: shadow.fold,
        border: `1px solid ${C.paperEdge}`,
        borderRadius: 4,
      }}
    >
      {corner && (
        <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0">
          <span
            className="absolute right-0 top-0 block"
            style={{
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: "0 22px 22px 0",
              borderColor: `transparent ${C.paperLo} transparent transparent`,
            }}
          />
          <span
            className="absolute right-0 top-0 block"
            style={{
              width: 0,
              height: 0,
              borderStyle: "solid",
              borderWidth: "22px 0 0 22px",
              borderColor: `${C.paperHi} transparent transparent transparent`,
              filter: "drop-shadow(-1px 1px 1px rgba(120,104,74,0.25))",
            }}
          />
        </span>
      )}
      {children}
    </Tag>
  );
}

// — Decoratieve diagonale crease-lijn over een vlak —
function CreaseLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `linear-gradient(135deg, transparent 0%, transparent 49.6%, rgba(120,104,74,0.10) 50%, transparent 50.4%, transparent 100%)`,
      }}
    />
  );
}

function Overline({ children, tone = C.accent }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.26em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </p>
  );
}

// — Facet-chip: kleine gevouwen label —
function Chip({
  children,
  tone = C.muted,
  wash,
  filled = false,
}: {
  children: React.ReactNode;
  tone?: string;
  wash?: string;
  filled?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold"
      style={{
        color: filled ? "#fff" : tone,
        background: filled ? tone : (wash ?? "transparent"),
        border: `1px solid ${filled ? tone : wash ? "transparent" : C.paperEdge}`,
        borderRadius: 3,
        ...sans,
      }}
    >
      {children}
    </span>
  );
}

// — Gevouwen icoon-tegel met facet-hoek —
function Tile({
  children,
  size = 44,
  tone = C.accent,
  soft = false,
}: {
  children: React.ReactNode;
  size?: number;
  tone?: string;
  soft?: boolean;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: soft
          ? `linear-gradient(150deg, ${C.paperHi}, ${C.paperLo})`
          : `linear-gradient(150deg, ${C.accentHi}, ${tone})`,
        color: soft ? tone : "#fff",
        border: soft ? `1px solid ${C.paperEdge}` : "none",
        boxShadow: shadow.foldSm,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute right-0 top-0"
        style={{
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: `0 ${Math.round(size / 4)}px ${Math.round(size / 4)}px 0`,
          borderColor: `transparent rgba(255,255,255,0.18) transparent transparent`,
        }}
      />
      {children}
    </span>
  );
}

function PrimaryBtn({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: "#fff",
        background: `linear-gradient(150deg, ${C.accentHi}, ${C.accent})`,
        borderRadius: 4,
        boxShadow: shadow.foldSm,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.inkSoft,
        background: active ? C.accent : C.paperHi,
        border: `1px solid ${active ? C.accent : C.paperEdge}`,
        borderRadius: 4,
        boxShadow: active ? "none" : shadow.foldSm,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline met scherpe facet-vulling —
function Spark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 108;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
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
        <linearGradient id={`og-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#og-${id})`} />
      <polyline points={line} fill="none" stroke={tone} strokeWidth="1.75" strokeLinejoin="miter" />
      {last && <rect x={last[0] - 2} y={last[1] - 2} width="4" height="4" fill={tone} />}
    </svg>
  );
}

function MatchBar({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="h-2 w-16 overflow-hidden"
        style={{ background: C.paperLo, borderRadius: 2, border: `1px solid ${C.paperEdge}` }}
      >
        <span
          className="block h-full"
          style={{ width: `${value}%`, background: strong ? C.accent : C.accentHi }}
        />
      </span>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color: strong ? C.accentInk : C.muted, ...mono }}
      >
        {value}%
      </span>
    </span>
  );
}

export function Concept394() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.paper }}
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
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <Tile size={46} tone={C.accent}>
          <Triangle size={20} aria-hidden="true" />
        </Tile>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-[-0.01em]" style={sans}>
            Origami
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-none" style={{ color: C.faint }}>
            Gevouwen · scherp · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.ok,
            background: C.okWash,
            border: `1px solid ${C.paperEdge}`,
            borderRadius: 3,
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{
            background: C.paperHi,
            color: C.muted,
            border: `1px solid ${C.paperEdge}`,
            borderRadius: 4,
            boxShadow: shadow.foldSm,
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center text-[9px] font-bold text-white"
              style={{ background: C.warn, borderRadius: 2 }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.inkSoft }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px] font-semibold" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <Tile size={44} tone={C.accent}>
          <span className="text-[13px] font-bold" style={mono}>
            {PROFIEL.initialen}
          </span>
        </Tile>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto p-1.5"
        style={{ background: C.paperLo, border: `1px solid ${C.paperEdge}`, borderRadius: 6 }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eae5d9] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.muted,
                background: on ? C.accent : "transparent",
                borderRadius: 4,
                boxShadow: on ? shadow.foldSm : "none",
                ...sans,
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
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col justify-center">
          <Overline>Vandaag · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[38px] font-bold leading-[1.02] tracking-[-0.02em] md:text-[46px]"
            style={sans}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
            Elk vlak vouwt open wat telt; de rest blijft plat en rustig op de achtergrond. Dit
            vraagt nu je aandacht.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryBtn onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryBtn>
            <GhostBtn onClick={onOpen}>Bekijk marktplaats</GhostBtn>
          </div>
        </div>

        <Fold variant="creaseDiag" className="p-6">
          <CreaseLine />
          <div className="relative flex items-center justify-between">
            <Overline tone={C.warn}>Belangrijkste nu</Overline>
            <Tile size={38} tone={C.warn}>
              <AlertTriangle size={17} aria-hidden="true" />
            </Tile>
          </div>
          <h2
            className="relative mt-4 text-[22px] font-bold leading-snug tracking-[-0.01em]"
            style={sans}
          >
            {primair.titel}
          </h2>
          <p className="relative mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="relative mt-5">
            <PrimaryBtn onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryBtn>
          </div>
        </Fold>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span className="text-[11.5px] font-semibold" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Fold key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.05em]"
                  style={{ color: C.muted }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.ok : C.warn,
                    background: k.up ? C.okWash : C.warnWash,
                    borderRadius: 2,
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[29px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                style={mono}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} tone={k.up ? C.accent : C.warn} id={`kpi-${i}`} />
              </div>
            </Fold>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Overline>Open opdrachten</Overline>
            <button
              type="button"
              onClick={onOpen}
              className="text-[12px] font-bold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]"
              style={{ color: C.accent }}
            >
              Alles bekijken
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{
                    background: FACET,
                    border: `1px solid ${C.paperEdge}`,
                    borderRadius: 4,
                    boxShadow: shadow.foldSm,
                  }}
                >
                  <Tile size={44} tone={i === 0 ? C.accent : C.accentHi}>
                    <span className="text-[13px] font-bold" style={mono}>
                      {o.match}
                    </span>
                  </Tile>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold" style={sans}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <MatchBar value={o.match} />
                    <ChevronRight
                      size={18}
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

        <div>
          <div className="mb-4">
            <Overline>Certificaten</Overline>
          </div>
          <Fold className="p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[15px] font-bold" style={sans}>
                {verified} van {CREDENTIALS.length} geverifieerd
              </p>
              <span className="text-[12px] font-bold tabular-nums" style={{ color: C.ok, ...mono }}>
                {Math.round((verified / CREDENTIALS.length) * 100)}%
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {CREDENTIALS.map((c) => {
                const st = statusMeta(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-3">
                    <Tile size={34} tone={st.tone} soft>
                      <st.Icon size={15} aria-hidden="true" />
                    </Tile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold" style={sans}>
                        {c.naam}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.faint }}>
                        {c.detail}
                      </span>
                    </span>
                    <Chip tone={st.tone} wash={st.wash}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Chip>
                  </li>
                );
              })}
            </ul>
          </Fold>
        </div>
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
        <Overline>De marktplaats</Overline>
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={sans}>
          Open opdrachten
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten zichtbaar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-3"
          style={{ background: C.paperHi, border: `1px solid ${C.paperEdge}`, borderRadius: 4 }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-[#95917f]"
            style={{ color: C.ink, ...sans }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostBtn
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostBtn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Fold variant="flat" className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Tile size={64} tone={C.accent} soft>
              <Search size={26} aria-hidden="true" />
            </Tile>
            <p className="mt-5 text-[22px] font-bold" style={sans}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              resultaten te zien.
            </p>
            <div className="mt-6">
              <PrimaryBtn onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </PrimaryBtn>
            </div>
          </div>
        </Fold>
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
    <Fold variant={index === 0 ? "creaseDiag" : "facet"} className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Chip tone={C.faint}>#{String(index + 1).padStart(2, "0")}</Chip>
            <span
              className="truncate text-[12px] font-semibold tabular-nums"
              style={{ color: C.faint, ...mono }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18.5px] font-bold leading-snug tracking-[-0.01em]" style={sans}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t} tone={C.accentInk} wash={C.accentWash}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Tile size={54} tone={strong ? C.accent : C.accentHi}>
            <span className="text-[16px] font-bold tabular-nums" style={mono}>
              {opdracht.match}
            </span>
          </Tile>
          <span
            className="text-[14px] font-bold tabular-nums"
            style={{ color: C.inkSoft, ...mono }}
          >
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]"
          style={{ color: C.accentInk, background: C.accentWash, borderRadius: 3 }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryBtn onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </PrimaryBtn>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Pluspunten"
              tone={C.ok}
              wash={C.okWash}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Aandachtspunten"
              tone={C.warn}
              wash={C.warnWash}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Fold>
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
    <div
      className="p-4"
      style={{ background: wash, border: `1px solid ${C.paperEdge}`, borderRadius: 4 }}
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: tone }}>
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <Icon
              size={14}
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
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-bold transition-all hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] motion-reduce:transition-none motion-reduce:hover:translate-x-0"
        style={{
          color: C.inkSoft,
          background: C.paperHi,
          border: `1px solid ${C.paperEdge}`,
          borderRadius: 4,
          boxShadow: shadow.foldSm,
        }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Fold variant="creaseDiag" className="p-7 md:p-9">
        <CreaseLine />
        <div className="relative flex flex-wrap items-center gap-3">
          <Chip tone={C.faint}>{opdracht.id}</Chip>
          <Chip tone={strong ? C.accent : C.accentHi} filled>
            <Sparkle size={12} aria-hidden="true" /> {opdracht.match}% match
          </Chip>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[32px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[42px]"
          style={sans}
        >
          {opdracht.titel}
        </h1>
        <p className="relative mt-2 text-[15px] font-semibold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <PrimaryBtn>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryBtn>
          <GhostBtn>Opdracht bewaren</GhostBtn>
        </div>
      </Fold>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Fold key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-bold tabular-nums tracking-[-0.01em]"
              style={mono}
            >
              {m.v}
            </p>
          </Fold>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Fold className="p-5">
            <div className="flex items-center gap-2">
              <Tile size={34} tone={C.ok}>
                <Check size={16} aria-hidden="true" />
              </Tile>
              <p
                className="text-[13px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.ok }}
              >
                Pluspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
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
          </Fold>
          <Fold className="p-5">
            <div className="flex items-center gap-2">
              <Tile size={34} tone={C.warn}>
                <AlertTriangle size={16} aria-hidden="true" />
              </Tile>
              <p
                className="text-[13px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.warn }}
              >
                Aandachtspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Fold>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const R = 34;
  const circ = 2 * Math.PI * R;

  return (
    <div className="space-y-7">
      <Fold variant="creaseDiag" className="p-6 md:p-7">
        <CreaseLine />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Certificaten · authenticatie</Overline>
            <h1
              className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.02em]"
              style={sans}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <div className="relative" style={{ width: 92, height: 92 }}>
            <svg width={92} height={92} viewBox="0 0 92 92" aria-hidden="true">
              <circle cx="46" cy="46" r={R} fill="none" stroke={C.paperLo} strokeWidth="9" />
              <circle
                cx="46"
                cy="46"
                r={R}
                fill="none"
                stroke={C.accent}
                strokeWidth="9"
                strokeLinecap="butt"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - ratio / 100)}
                transform="rotate(-90 46 46)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold tabular-nums leading-none" style={mono}>
                {ratio}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.faint }}
              >
                geverifieerd
              </span>
            </div>
          </div>
        </div>
      </Fold>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Fold className="p-5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33507a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f2]"
                  style={{ borderRadius: 4 }}
                >
                  <Tile size={44} tone={st.tone} soft>
                    <st.Icon size={19} aria-hidden="true" />
                  </Tile>
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-bold" style={sans}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Chip tone={st.tone} wash={st.wash}>
                      <st.Icon size={12} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Chip>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.faint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
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
                    <div className="mt-4 pl-[60px]">
                      <div
                        className="p-4"
                        style={{
                          background: st.wash,
                          border: `1px solid ${C.paperEdge}`,
                          borderRadius: 4,
                        }}
                      >
                        <p
                          className="max-w-xl text-[13.5px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryBtn>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryBtn>
                          <GhostBtn>Historie</GhostBtn>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Fold>
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
        <Overline>Volgende acties</Overline>
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={sans}>
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[14px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.accent;
          return (
            <li key={a.titel}>
              <Fold variant={warn ? "creaseDiag" : "facet"} className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center text-[16px] font-bold tabular-nums"
                    style={{
                      background: C.paperHi,
                      color: tone,
                      border: `1px solid ${C.paperEdge}`,
                      borderRadius: 4,
                      boxShadow: shadow.foldSm,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{
                        color: tone,
                        background: warn ? C.warnWash : C.accentWash,
                        borderRadius: 2,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Sparkle size={11} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </span>
                    <h2 className="mt-2 text-[17px] font-bold leading-snug" style={sans}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryBtn>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryBtn>
                  </div>
                </div>
              </Fold>
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
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={sans}>
            Facturen
          </h1>
        </div>
        <PrimaryBtn>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryBtn>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.ok, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.warn, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.accent, alarm: false },
        ].map((s) => (
          <Fold key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.05em]"
                style={{ color: C.muted }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center"
                  style={{ background: C.warnWash, color: C.warn, borderRadius: 3 }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warn : C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12.5px] font-semibold" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Fold>
        ))}
      </section>

      <Fold className="overflow-hidden p-5" corner={false}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10.5px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const paid = f.status === "Betaald";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-3.5 transition-colors hover:bg-[#eae5d9] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <span
                  className="order-1 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14.5px] font-bold sm:order-2"
                  style={sans}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] font-medium tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11.5px] font-bold"
                    style={{
                      color: acc ? C.warn : paid ? C.ok : C.muted,
                      background: acc ? C.warnWash : paid ? C.okWash : C.paperLo,
                      borderRadius: 3,
                    }}
                  >
                    {acc && <AlertTriangle size={12} aria-hidden="true" />}
                    {paid && <Check size={12} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-bold tabular-nums" style={mono}>
            {totaalBetaald}
          </span>
        </div>
      </Fold>
    </div>
  );
}
