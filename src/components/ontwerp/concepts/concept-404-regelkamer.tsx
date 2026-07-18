"use client";

// Concept 404 — "Regelkamer" · Mission-control — ops-dashboard (licht, hoge dichtheid).
// Een lichte operations/control-room: compacte modules, live-status-tegels, tabulaire cijfers
// overal, dichte tabellen, statusstrips en een "alles in één oogopslag"-layout. Kalm licht i.p.v.
// donker terminal. Hoge informatiedichtheid zonder rommel.
// Palet: bg #f4f6f9, fg #0f172a, accent #0ea5e9 (helder ops-blauw), groen/amber/rood statusstrips,
// JetBrains-mono cijfers (systeem-fallback, geen import nodig).

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
  Bell,
  Activity,
  Radio,
  Gauge,
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

// — Palet: koel ops-licht, helder blauw accent, statusstrips —
const C = {
  bg: "#f4f6f9",
  bgDeep: "#eaeef3",
  panel: "#ffffff",
  panelAlt: "#f8fafc",
  fg: "#0f172a",
  fgSoft: "#334155",
  fgMute: "#64748b",
  fgFaint: "#94a3b8",
  accent: "#0ea5e9",
  accentDeep: "#0284c7",
  accentWash: "rgba(14,165,233,0.1)",
  line: "#dbe2ea",
  lineSoft: "#e8edf2",
  ok: "#16a34a",
  okWash: "rgba(22,163,74,0.1)",
  warn: "#d97706",
  warnWash: "rgba(217,119,6,0.11)",
  info: "#0284c7",
  infoWash: "rgba(2,132,199,0.1)",
  bad: "#dc2626",
  badWash: "rgba(220,38,38,0.1)",
};

const sans = {
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
const mono = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

function statusMeta(s: CredStatus): {
  label: string;
  code: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        code: "OK",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        code: "WACHT",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        code: "LET OP",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        code: "FOUT",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        wash: C.badWash,
      };
  }
}

// — Module: compact ops-paneel met kop-strip —
function Module({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      className={`relative rounded-lg ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        color: C.fg,
      }}
    >
      {children}
    </Tag>
  );
}

function ModuleHead({
  title,
  right,
  tone = C.accent,
}: {
  title: string;
  right?: React.ReactNode;
  tone?: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b px-4 py-2.5"
      style={{ borderColor: C.lineSoft }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-1 rounded-full"
          style={{ background: tone }}
        />
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: C.fgSoft }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

// — Statusstip met label (nooit alleen kleur) —
function Dot({ tone, pulse = false }: { tone: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
      {pulse && (
        <span
          className="absolute inset-0 rounded-full motion-safe:animate-ping"
          style={{ background: tone, opacity: 0.5 }}
        />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: tone }} />
    </span>
  );
}

function StatusChip({
  children,
  tone,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em]"
      style={{ color: tone, background: wash, border: `1px solid ${tone}33`, ...sans }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function SolidButton({
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
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f6f9] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{ background: C.accentDeep, ...sans }}
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
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-semibold transition-all duration-150 hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f6f9] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.accentDeep : C.fgSoft,
        background: active ? C.accentWash : C.panel,
        border: `1px solid ${active ? `${C.accent}55` : C.line}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Dichte sparkline in ops-stijl —
function Spark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 5) - 2.5;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
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
        <linearGradient id={`rk-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#rk-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={C.panel} stroke={tone} strokeWidth="1.3" />
    </svg>
  );
}

function Meter({ value, tone }: { value: number; tone: string }) {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="relative h-1.5 w-full min-w-[3rem] overflow-hidden rounded-full"
        style={{ background: C.bgDeep }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
      <span className="text-[11.5px] font-bold tabular-nums" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept404() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-5">
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
    <header className="flex flex-wrap items-center justify-between gap-4 pt-6">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white"
          style={{ background: C.accentDeep }}
          aria-hidden="true"
        >
          <Radio size={19} />
        </span>
        <div>
          <p
            className="text-[16px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.fg }}
          >
            Regelkamer
          </p>
          <p
            className="mt-1 flex items-center gap-1.5 text-[10.5px] leading-none"
            style={{ color: C.fgMute, ...mono }}
          >
            <Dot tone={C.ok} pulse /> systeem operationeel · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.ok, background: C.okWash, border: `1px solid ${C.ok}33` }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.accent, ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[12.5px] font-semibold" style={{ color: C.fg }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.fgMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[12px] font-bold"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.accentDeep }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-lg p-1"
        style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-1 focus-visible:ring-offset-[#eaeef3] motion-reduce:transition-none"
              style={{
                color: on ? C.accentDeep : C.fgMute,
                background: on ? C.panel : "transparent",
                boxShadow: on ? "0 1px 2px rgba(15,23,42,0.08)" : "none",
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
    <div className="space-y-4">
      {/* Live-status-strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Profiel", v: PROFIEL.trust, tone: C.ok, code: "ACTIEF", Icon: ShieldCheck },
          {
            l: "Certificaten",
            v: `${verified}/${CREDENTIALS.length} ok`,
            tone: C.warn,
            code: "1 LET OP",
            Icon: AlertTriangle,
          },
          { l: "Open reacties", v: "7 lopend", tone: C.info, code: "LIVE", Icon: Activity },
          { l: "Openstaand", v: "€ 1.350", tone: C.warn, code: "9 DAGEN", Icon: Clock },
        ].map((s) => (
          <Module key={s.l} className="p-3">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.fgMute }}
              >
                {s.l}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em]"
                style={{ color: s.tone, ...mono }}
              >
                <Dot tone={s.tone} />
                {s.code}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <s.Icon size={15} aria-hidden="true" style={{ color: s.tone }} />
              <span className="text-[15px] font-bold tabular-nums" style={{ color: C.fg, ...mono }}>
                {s.v}
              </span>
            </div>
          </Module>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Module>
          <ModuleHead
            title="Overzicht · vandaag"
            right={
              <span className="text-[10.5px] tabular-nums" style={{ color: C.fgFaint, ...mono }}>
                {PROFIEL.plaats.toUpperCase()}
              </span>
            }
          />
          <div className="p-5">
            <h1
              className="text-[26px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]"
              style={{ color: C.fg }}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-2.5 max-w-md text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
              Alle systemen in beeld. Statusstrips hierboven, urgente acties rechts — werk van links
              naar rechts en niets blijft liggen.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <SolidButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={13}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </SolidButton>
              <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
            </div>
          </div>
        </Module>

        <Module>
          <ModuleHead
            title="Prioriteit"
            tone={C.warn}
            right={
              <StatusChip tone={C.warn} wash={C.warnWash} alarm>
                Urgent
              </StatusChip>
            }
          />
          <div className="p-5">
            <h2 className="text-[16px] font-bold leading-snug" style={{ color: C.fg }}>
              {primair.titel}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              {primair.detail}
            </p>
            <div className="mt-4">
              <SolidButton onClick={onActies} className="w-full">
                {primair.cta}
                <ArrowRight size={13} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Module>
      </section>

      <section>
        <Module>
          <ModuleHead
            title="Kerncijfers · deze maand"
            right={<Gauge size={14} aria-hidden="true" style={{ color: C.fgFaint }} />}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {KPIS.map((k, i) => (
              <div
                key={k.label}
                className="p-4"
                style={{
                  borderLeft: i % 2 === 0 && i !== 0 ? `1px solid ${C.lineSoft}` : "none",
                  borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: C.fgMute }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9.5px] font-bold tabular-nums"
                    style={{
                      color: k.up ? C.ok : C.warn,
                      background: k.up ? C.okWash : C.warnWash,
                      ...mono,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[24px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ color: C.fg, ...mono }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5">
                  <Spark data={k.spark} tone={k.up ? C.accent : C.warn} id={`kpi-${i}`} />
                </div>
              </div>
            ))}
          </div>
        </Module>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Module>
          <ModuleHead
            title="Beste matches"
            right={
              <button
                type="button"
                onClick={onOpen}
                className="rounded text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                style={{ color: C.accentDeep }}
              >
                Alles →
              </button>
            }
          />
          <div
            className="hidden grid-cols-[3rem_1fr_9rem_1.5rem] items-center gap-3 px-4 py-2"
            style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelAlt }}
            role="presentation"
          >
            {["Match", "Opdracht", "Score", ""].map((h, i) => (
              <span
                key={h || i}
                className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.fgFaint }}
              >
                {h}
              </span>
            ))}
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const strong = o.match >= 90;
              const tone = strong ? C.ok : C.accent;
              return (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0284c7] motion-reduce:transition-none sm:grid-cols-[3rem_1fr_9rem_1.5rem]"
                  >
                    <span
                      className="inline-flex h-9 w-11 items-center justify-center rounded-md text-[12px] font-bold tabular-nums"
                      style={{
                        background: strong ? C.okWash : C.accentWash,
                        color: tone,
                        border: `1px solid ${tone}33`,
                        ...mono,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px]"
                        style={{ color: C.fgMute, ...mono }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="hidden w-36 sm:block">
                      <Meter value={o.match} tone={tone} />
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className="hidden transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none sm:block"
                      style={{ color: C.fgFaint }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </Module>

        <Module>
          <ModuleHead title="Certificaten" tone={C.warn} />
          <ul className="p-2">
            {CREDENTIALS.map((c, i) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ color: st.tone, background: st.wash }}
                    aria-hidden="true"
                  >
                    <st.Icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[12px] font-semibold"
                      style={{ color: C.fg }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[10px]"
                      style={{ color: C.fgMute, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <StatusChip tone={st.tone} wash={st.wash} alarm={st.alarm}>
                    {st.code}
                  </StatusChip>
                </li>
              );
            })}
          </ul>
        </Module>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-[22px] font-bold leading-none tracking-[-0.02em]"
            style={{ color: C.fg }}
          >
            Marktplaats
          </h1>
          <p className="mt-1.5 text-[11.5px]" style={{ color: C.fgMute, ...mono }}>
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")} zichtbaar
          </p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Match" : "Tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      <div
        className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.fgFaint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#94a3b8]"
          style={{ color: C.fg }}
        />
      </div>

      {filtered.length === 0 ? (
        <Module className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-lg"
              style={{
                background: C.accentWash,
                color: C.accentDeep,
                border: `1px solid ${C.accent}33`,
              }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-4 text-[17px] font-bold" style={{ color: C.fg }}>
              Geen resultaten
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.fgSoft }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer te
              ontdekken.
            </p>
            <div className="mt-5">
              <SolidButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={13} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Module>
      ) : (
        <ul className="space-y-3">
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
  const tone = strong ? C.ok : C.accent;
  return (
    <Module as="article">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.fgMute, background: C.bgDeep, ...mono }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[10.5px] font-semibold" style={{ color: C.fgMute, ...mono }}>
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.06em]"
              style={{ color: tone, ...mono }}
            >
              <Dot tone={tone} /> {strong ? "sterke match" : "match"}
            </span>
          </div>
          <h3 className="mt-2 text-[16px] font-bold leading-snug" style={{ color: C.fg }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[11.5px]" style={{ color: C.fgMute, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ color: C.fgSoft, background: C.panelAlt, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="inline-flex h-12 w-14 flex-col items-center justify-center rounded-md"
            style={{ background: strong ? C.okWash : C.accentWash, border: `1px solid ${tone}33` }}
          >
            <span
              className="text-[17px] font-bold tabular-nums leading-none"
              style={{ color: tone, ...mono }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.fgMute }}
            >
              match
            </span>
          </span>
          <span className="text-[12.5px] font-bold tabular-nums" style={{ color: C.fg, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
        </div>
      </div>
      <div
        className="flex items-center gap-3 border-t px-4 py-2.5"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          style={{ color: C.accentDeep }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Analyse
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 border-t sm:grid-cols-2"
            style={{ borderColor: C.lineSoft }}
          >
            <RedenBlok
              titel="Sterke punten"
              tone={C.ok}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              border
            />
          </div>
        </div>
      </div>
    </Module>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
  border = false,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
  border?: boolean;
}) {
  return (
    <div
      className="p-4"
      style={{ borderLeft: border ? `1px solid ${C.lineSoft}` : "none", background: C.panelAlt }}
    >
      <p
        className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Dot tone={tone} />
        {titel}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.fgSoft }}>
            <Icon
              size={12}
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
  const tone = strong ? C.ok : C.accent;
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f6f9]"
        style={{ color: C.fgSoft, background: C.panel, border: `1px solid ${C.line}` }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <Module>
        <ModuleHead
          title={`Opdracht ${opdracht.id}`}
          tone={tone}
          right={
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
              style={{ color: tone, ...mono }}
            >
              <Dot tone={tone} pulse /> {opdracht.match}% match
            </span>
          }
        />
        <div className="p-5 md:p-6">
          <h1
            className="max-w-2xl text-[24px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]"
            style={{ color: C.fg }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: C.fgMute, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <SolidButton>
              Reageer op opdracht <ArrowRight size={13} aria-hidden="true" />
            </SolidButton>
            <GhostButton>Bewaren</GhostButton>
          </div>
        </div>
      </Module>

      <Module>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.fgMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[17px] font-bold tabular-nums tracking-[-0.01em]"
                style={{ color: C.fg, ...mono }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Module>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Module>
          <ModuleHead title="Sterke punten" tone={C.ok} />
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ color: C.fgSoft }}
              >
                <Check
                  size={14}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ok }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Module>
        <Module>
          <ModuleHead title="Let op" tone={C.warn} />
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ color: C.fgSoft }}
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
        </Module>
      </div>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-4">
      <Module>
        <ModuleHead
          title="Verificatie · certificaten"
          right={
            <span className="text-[10.5px] tabular-nums" style={{ color: C.fgFaint, ...mono }}>
              {verified}/{CREDENTIALS.length} OK
            </span>
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-6 p-5">
          <div className="max-w-md">
            <h1
              className="text-[22px] font-bold leading-tight tracking-[-0.02em]"
              style={{ color: C.fg }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-semibold" style={{ color: C.fg }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-20 w-20 flex-col items-center justify-center rounded-full"
              style={{ background: C.accentWash, border: `2px solid ${C.accent}44` }}
            >
              <span
                className="text-[24px] font-bold tabular-nums leading-none"
                style={{ color: C.accentDeep, ...mono }}
              >
                {ratio}
              </span>
              <span
                className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.fgMute }}
              >
                % gereed
              </span>
            </span>
          </div>
        </div>
      </Module>

      <Module>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-4 py-2.5"
          style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelAlt }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.fgFaint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0284c7] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                      style={{ color: st.tone, background: st.wash }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px]"
                        style={{ color: C.fgMute, ...mono }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <StatusChip tone={st.tone} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </StatusChip>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.fgFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 sm:pl-[60px]">
                      <div
                        className="rounded-md p-3.5"
                        style={{ background: C.panelAlt, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[12.5px] leading-relaxed"
                          style={{ color: C.fgSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Module>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-4">
      <div>
        <h1
          className="text-[22px] font-bold leading-none tracking-[-0.02em]"
          style={{ color: C.fg }}
        >
          Actiewachtrij
        </h1>
        <p className="mt-1.5 max-w-md text-[12.5px]" style={{ color: C.fgSoft }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <Module>
        <ModuleHead
          title="Openstaande acties"
          right={
            <span className="text-[10.5px] tabular-nums" style={{ color: C.fgFaint, ...mono }}>
              {ACTIES.length} items
            </span>
          }
        />
        <ol>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const tone = warn ? C.warn : C.info;
            const wash = warn ? C.warnWash : C.infoWash;
            return (
              <li
                key={a.titel}
                className="grid grid-cols-[auto_1fr] items-start gap-3.5 px-4 py-4 sm:grid-cols-[auto_1fr_auto]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-md text-[13px] font-bold tabular-nums"
                  style={{ background: wash, color: tone, border: `1px solid ${tone}33`, ...mono }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <StatusChip tone={tone} wash={wash} alarm={warn}>
                    {warn ? (
                      <AlertTriangle size={10} aria-hidden="true" />
                    ) : (
                      <Activity size={10} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Kans"}
                  </StatusChip>
                  <h2 className="mt-1.5 text-[15px] font-bold leading-snug" style={{ color: C.fg }}>
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[12.5px] leading-relaxed"
                    style={{ color: C.fgSoft }}
                  >
                    {a.detail}
                  </p>
                </div>
                <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                  <SolidButton>
                    {a.cta}
                    <ArrowRight size={13} aria-hidden="true" />
                  </SolidButton>
                </div>
              </li>
            );
          })}
        </ol>
      </Module>
    </div>
  );
}

function factuurTone(status: string): {
  tone: string;
  wash: string;
  code: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { tone: C.warn, wash: C.warnWash, code: "OPEN", Icon: AlertTriangle };
  if (status === "Betaald") return { tone: C.ok, wash: C.okWash, code: "OK", Icon: Check };
  return { tone: C.fgMute, wash: C.bgDeep, code: "CONCEPT", Icon: null };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-[22px] font-bold leading-none tracking-[-0.02em]"
            style={{ color: C.fg }}
          >
            Facturen
          </h1>
          <p className="mt-1.5 text-[11.5px]" style={{ color: C.fgMute, ...mono }}>
            grootboek · {FACTUREN.length} regels
          </p>
        </div>
        <SolidButton>
          <Plus size={13} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            tone: C.ok,
            code: "OK",
            alarm: false,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            tone: C.warn,
            code: "OPEN",
            alarm: true,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            tone: C.info,
            code: "CONCEPT",
            alarm: false,
          },
        ].map((s) => (
          <Module key={s.l} className="p-4">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.fgMute }}
              >
                {s.l}
              </p>
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em]"
                style={{ color: s.tone, ...mono }}
              >
                <Dot tone={s.tone} pulse={s.alarm} /> {s.code}
              </span>
            </div>
            <p
              className="mt-2 text-[24px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warn : C.fg, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.fgMute }}>
              {s.sub}
            </p>
          </Module>
        ))}
      </section>

      <Module>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 px-4 py-2.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelAlt }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.fgFaint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f8fafc] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11px] font-semibold tabular-nums"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13px] font-semibold sm:order-2"
                  style={{ color: C.fg }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.fgMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <StatusChip tone={ft.tone} wash={ft.wash} alarm={acc}>
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {ft.code}
                  </StatusChip>
                </span>
                <span
                  className="order-2 text-right text-[13.5px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.fg, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-4 py-3"
          style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.panelAlt }}
        >
          <span
            className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.fgMute }}
          >
            Totaal betaald
          </span>
          <span className="text-[18px] font-bold tabular-nums" style={{ color: C.fg, ...mono }}>
            {totaalBetaald}
          </span>
        </div>
      </Module>
    </div>
  );
}
