"use client";

// Concept 393 — "Synthwave" · Retro-neon arcade & CRT-grid.
// Diep indigo/paars nachtveld (#0d0b26), neon magenta (#ff2e97) + cyaan (#22d3ee) gloed,
// perspectief-grid-horizon, subtiele scanlines, glow op koppen/knoppen — maar functioneel en
// leesbaar, geen kermis. Premium-speels-dark. Fonts: strak grotesk (systeem-sans) + mono voor cijfers.

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
  Radio,
  Bell,
  Sparkles,
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

// — Palet: nachtveld-indigo met neon magenta + cyaan, en warm-oranje voor waarschuwing —
const C = {
  night: "#0d0b26",
  nightAlt: "#12102e",
  panel: "rgba(30,26,66,0.72)",
  panelSolid: "#1a1640",
  panelHi: "rgba(46,40,92,0.6)",
  ink: "#f2ecff",
  inkSoft: "#cdc4ea",
  muted: "#9d94c4",
  faint: "#6f66a0",
  magenta: "#ff2e97",
  magentaWash: "rgba(255,46,151,0.14)",
  cyan: "#22d3ee",
  cyanWash: "rgba(34,211,238,0.13)",
  violet: "#a855f7",
  line: "rgba(168,139,250,0.22)",
  lineSoft: "rgba(168,139,250,0.12)",
  ok: "#34e6b0",
  okWash: "rgba(52,230,176,0.13)",
  warnWash: "rgba(255,179,71,0.15)",
  reject: "#ff6183",
};

// Warm-oranje waarschuwingsaccent (los gehouden van de neon-hoofdkleuren).
const WARN = "#ffb347";

const head = { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' };
const mono = { fontFamily: 'ui-monospace, "SFMono-Regular", "JetBrains Mono", monospace' };

// — Neon glow-helpers —
function glowText(color: string, strength = 0.6): React.CSSProperties {
  return {
    textShadow: `0 0 8px ${color}${Math.round(strength * 255)
      .toString(16)
      .padStart(2, "0")}`,
  };
}
function glowBox(color: string): React.CSSProperties {
  return { boxShadow: `0 0 0 1px ${color}, 0 0 18px -4px ${color}` };
}

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
      return { label: "In beoordeling", Icon: Clock, alarm: false, tone: C.cyan, wash: C.cyanWash };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: WARN,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.reject,
        wash: "rgba(255,97,131,0.14)",
      };
  }
}

// — Scanline-overlay (CRT) —
function Scanlines() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "multiply",
        opacity: 0.5,
      }}
    />
  );
}

// — Perspectief-grid-horizon achter het dashboard —
function GridHorizon() {
  const verticals = Array.from({ length: 13 });
  const horizontals = Array.from({ length: 7 });
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-72 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 bottom-0 top-1/2"
        style={{ background: `linear-gradient(to top, ${C.magentaWash}, transparent)` }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 h-full w-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
      >
        {verticals.map((_, i) => {
          const x = (i / (verticals.length - 1)) * 400;
          return (
            <line
              key={`v${i}`}
              x1={200}
              y1={0}
              x2={x}
              y2={200}
              stroke={C.violet}
              strokeWidth="0.6"
              opacity="0.35"
            />
          );
        })}
        {horizontals.map((_, i) => {
          const t = i / (horizontals.length - 1);
          const y = 200 - Math.pow(t, 1.8) * 200;
          return (
            <line
              key={`h${i}`}
              x1={0}
              y1={y}
              x2={400}
              y2={y}
              stroke={C.cyan}
              strokeWidth="0.6"
              opacity="0.3"
            />
          );
        })}
      </svg>
    </div>
  );
}

function Panel({
  children,
  className = "",
  neon = "none",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  neon?: "magenta" | "cyan" | "none";
  as?: "div" | "section" | "li";
}) {
  const style: React.CSSProperties = {
    background: C.panel,
    border: `1px solid ${C.line}`,
    backdropFilter: "blur(6px)",
  };
  if (neon === "magenta") Object.assign(style, glowBox(C.magenta));
  if (neon === "cyan") Object.assign(style, glowBox(C.cyan));
  return (
    <Tag className={`relative rounded-xl ${className}`} style={style}>
      {children}
    </Tag>
  );
}

function Overline({ children, tone = C.cyan }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
      style={{ color: tone, ...mono, ...glowText(tone, 0.5) }}
    >
      {children}
    </p>
  );
}

function Chip({
  children,
  tone = C.muted,
  wash,
}: {
  children: React.ReactNode;
  tone?: string;
  wash?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{
        color: tone,
        background: wash ?? "transparent",
        border: `1px solid ${tone}`,
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

function Orb({
  children,
  size = 44,
  tone = C.cyan,
}: {
  children: React.ReactNode;
  size?: number;
  tone?: string;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        color: tone,
        background: C.nightAlt,
        border: `1.5px solid ${tone}`,
        boxShadow: `0 0 14px -3px ${tone}, inset 0 0 10px -6px ${tone}`,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b26] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: "#fff",
        background: `linear-gradient(135deg, ${C.magenta}, ${C.violet})`,
        border: `1px solid ${C.magenta}`,
        boxShadow: `0 0 18px -4px ${C.magenta}`,
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
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
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b26] ${className}`}
      style={{
        color: active ? C.night : C.cyan,
        background: active ? C.cyan : "transparent",
        border: `1px solid ${C.cyan}`,
        boxShadow: active ? `0 0 16px -4px ${C.cyan}` : "none",
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 112;
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
        stroke={tone}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
      />
      {last && (
        <circle
          cx={last[0]}
          cy={last[1]}
          r="2.4"
          fill={tone}
          style={{ filter: `drop-shadow(0 0 4px ${tone})` }}
        />
      )}
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.magenta : C.cyan;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="h-2 w-16 overflow-hidden rounded-full"
        style={{ background: C.nightAlt, border: `1px solid ${C.line}` }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone, boxShadow: `0 0 8px ${tone}` }}
        />
      </span>
      <span className="text-[13px] font-bold tabular-nums" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept393() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{
        ...head,
        color: C.ink,
        background: `radial-gradient(120% 80% at 50% 0%, ${C.nightAlt}, ${C.night})`,
      }}
    >
      <Scanlines />
      {screen === "dashboard" && <GridHorizon />}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
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
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            color: "#fff",
            background: `linear-gradient(135deg, ${C.magenta}, ${C.violet})`,
            boxShadow: `0 0 20px -4px ${C.magenta}`,
          }}
          aria-hidden="true"
        >
          <Radio size={20} />
        </span>
        <div>
          <p
            className="text-[20px] font-bold leading-none tracking-[-0.01em]"
            style={glowText(C.magenta, 0.4)}
          >
            Synthwave
          </p>
          <p
            className="mt-1 text-[10.5px] font-semibold uppercase leading-none tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            Neon · CRT · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] sm:inline-flex"
          style={{ color: C.ok, border: `1px solid ${C.ok}`, background: C.okWash, ...mono }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}` }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ background: C.magenta, boxShadow: `0 0 10px ${C.magenta}` }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.faint }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold"
          style={{
            background: C.nightAlt,
            color: C.cyan,
            border: `1.5px solid ${C.cyan}`,
            boxShadow: `0 0 14px -4px ${C.cyan}`,
            ...mono,
          }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1.5 overflow-x-auto rounded-xl p-1.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-lg px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12102e] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.muted,
                background: on
                  ? `linear-gradient(135deg, ${C.magenta}, ${C.violet})`
                  : "transparent",
                boxShadow: on ? `0 0 16px -5px ${C.magenta}` : "none",
                ...mono,
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
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Overline>Vandaag · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[40px] font-bold leading-[1.0] tracking-[-0.02em] md:text-[52px]"
            style={head}
          >
            <span style={glowText(C.magenta, 0.5)}>Goedemorgen,</span>
            <br />
            <span style={{ color: C.cyan, ...glowText(C.cyan, 0.6) }}>
              {PROFIEL.naam.split(" ")[0]}.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Rijd de horizon in. Alles wat telt licht op in neon; de ruis blijft in het donker. Dit
            vraagt nu je aandacht.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </div>

        <Panel neon="magenta" className="overflow-hidden p-6">
          <div className="flex items-center justify-between">
            <Overline tone={WARN}>Belangrijkste nu</Overline>
            <Orb size={38} tone={WARN}>
              <AlertTriangle size={17} aria-hidden="true" />
            </Orb>
          </div>
          <h2 className="mt-4 text-[22px] font-bold leading-snug tracking-[-0.01em]">
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = i % 2 === 0 ? C.magenta : C.cyan;
            return (
              <Panel key={k.label} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ color: k.up ? C.ok : WARN, background: k.up ? C.okWash : C.warnWash }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[30px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...mono, ...glowText(tone, 0.4) }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Open opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.cyan }}
          >
            Alles bekijken
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b26] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                <Orb size={44} tone={o.match >= 90 ? C.magenta : C.cyan}>
                  <span className="text-[13px] font-bold tabular-nums" style={mono}>
                    {o.match}
                  </span>
                </Orb>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold">{o.titel}</span>
                  <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchMeter value={o.match} />
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
      </section>

      <section>
        <Overline>Certificaten</Overline>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 p-4">
                <Orb size={40} tone={st.tone}>
                  <st.Icon size={18} aria-hidden="true" />
                </Orb>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">{c.naam}</p>
                  <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Chip tone={st.tone} wash={st.wash}>
                  <st.Icon size={11} aria-hidden="true" />
                  {st.label}
                  {st.alarm && <span className="sr-only"> (let op)</span>}
                </Chip>
              </Panel>
            );
          })}
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
        <h1
          className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]"
          style={glowText(C.magenta, 0.4)}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten zichtbaar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.cyan }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#6f66a0]"
            style={{ color: C.ink, ...mono }}
          />
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
        <Panel className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Orb size={64} tone={C.violet}>
              <Search size={26} aria-hidden="true" />
            </Orb>
            <p className="mt-5 text-[22px] font-bold">Niets gevonden</p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              resultaten te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
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
    <Panel neon={strong ? "magenta" : "none"} className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Chip tone={C.faint}>#{String(index + 1).padStart(2, "0")}</Chip>
            <span
              className="truncate text-[11.5px] font-semibold"
              style={{ color: C.faint, ...mono }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-bold leading-snug tracking-[-0.01em]">
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t} tone={C.violet} wash="rgba(168,85,247,0.14)">
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Orb size={54} tone={strong ? C.magenta : C.cyan}>
            <span className="text-[16px] font-bold tabular-nums" style={mono}>
              {opdracht.match}
            </span>
          </Orb>
          <span className="text-[14px] font-bold tabular-nums" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.cyan, background: C.cyanWash, border: `1px solid ${C.cyan}`, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
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
            <RedenBlok titel="Pluspunten" tone={C.ok} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Aandachtspunten"
              tone={WARN}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
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
    <div
      className="rounded-lg p-4"
      style={{ background: C.panelHi, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: tone, ...mono }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
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
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.cyan, background: C.panel, border: `1px solid ${C.line}`, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel neon="magenta" className="overflow-hidden p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-2.5">
          <Chip tone={C.faint}>{opdracht.id}</Chip>
          <Chip tone={strong ? C.magenta : C.cyan} wash={strong ? C.magentaWash : C.cyanWash}>
            <Sparkles size={12} aria-hidden="true" /> {opdracht.match}% match
          </Chip>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[44px]"
          style={glowText(C.magenta, 0.4)}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Opdracht bewaren</GhostButton>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, tone: C.magenta },
          { l: "Omvang", v: opdracht.uren, tone: C.cyan },
          { l: "Start", v: opdracht.start, tone: C.violet },
          { l: "Match", v: `${opdracht.match}%`, tone: C.magenta },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-bold tabular-nums tracking-[-0.01em]"
              style={{ ...mono, ...glowText(m.tone, 0.35) }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel neon="cyan" className="p-5">
            <div className="flex items-center gap-2">
              <Orb size={34} tone={C.ok}>
                <Check size={16} aria-hidden="true" />
              </Orb>
              <p
                className="text-[12.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.ok, ...mono }}
              >
                Pluspunten
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
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Orb size={34} tone={WARN}>
                <AlertTriangle size={16} aria-hidden="true" />
              </Orb>
              <p
                className="text-[12.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: WARN, ...mono }}
              >
                Aandachtspunten
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
                    style={{ color: WARN }}
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

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const R = 34;
  const circ = 2 * Math.PI * R;

  return (
    <div className="space-y-7">
      <Panel neon="cyan" className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Certificaten · authenticatie</Overline>
            <h1
              className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.02em]"
              style={glowText(C.cyan, 0.4)}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing.
            </p>
          </div>
          <div className="relative" style={{ width: 96, height: 96 }}>
            <svg width={96} height={96} viewBox="0 0 96 96" aria-hidden="true">
              <circle cx="48" cy="48" r={R} fill="none" stroke={C.lineSoft} strokeWidth="9" />
              <circle
                cx="48"
                cy="48"
                r={R}
                fill="none"
                stroke={C.cyan}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - ratio / 100)}
                transform="rotate(-90 48 48)"
                style={{ filter: `drop-shadow(0 0 4px ${C.cyan})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-[24px] font-bold tabular-nums leading-none"
                style={{ ...mono, ...glowText(C.cyan, 0.4) }}
              >
                {ratio}
              </span>
              <span
                className="text-[8.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.faint }}
              >
                geverifieerd
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12102e]"
                >
                  <Orb size={44} tone={st.tone}>
                    <st.Icon size={19} aria-hidden="true" />
                  </Orb>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-bold">{c.naam}</span>
                    <span className="mt-0.5 block text-[12px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Chip tone={st.tone} wash={st.wash}>
                      <st.Icon size={11} aria-hidden="true" />
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
                        className="rounded-lg p-4"
                        style={{ background: C.panelHi, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
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
        <h1
          className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]"
          style={glowText(C.magenta, 0.4)}
        >
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? WARN : C.cyan;
          return (
            <li key={a.titel}>
              <Panel neon={warn ? "magenta" : "none"} className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <Orb size={48} tone={tone}>
                    <span className="text-[16px] font-bold tabular-nums" style={mono}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Orb>
                  <div className="min-w-0">
                    <Chip tone={tone} wash={warn ? C.warnWash : C.cyanWash}>
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Sparkles size={11} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </Chip>
                    <h2 className="mt-2 text-[17px] font-bold leading-snug">{a.titel}</h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryButton>
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
          <h1
            className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]"
            style={glowText(C.magenta, 0.4)}
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
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.ok, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: WARN, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.cyan, alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.muted }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: WARN }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[28px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ ...mono, color: s.tone, ...glowText(s.tone, 0.35) }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px] font-semibold" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const betaald = f.status === "Betaald";
            const tone = acc ? WARN : betaald ? C.ok : C.muted;
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md px-1 py-3.5 transition-colors hover:bg-[rgba(46,40,92,0.4)] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span className="order-3 min-w-0 truncate text-[14px] font-bold sm:order-2">
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] font-medium tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
                    style={{
                      color: tone,
                      background: acc ? C.warnWash : betaald ? C.okWash : C.panelHi,
                      border: `1px solid ${tone}`,
                      ...mono,
                    }}
                  >
                    {acc && <AlertTriangle size={12} aria-hidden="true" />}
                    {betaald && <Check size={12} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? WARN : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[24px] font-bold tabular-nums"
            style={{ ...mono, ...glowText(C.ok, 0.35), color: C.ok }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
