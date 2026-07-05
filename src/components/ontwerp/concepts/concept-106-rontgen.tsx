"use client";

// Concept 106 — "Röntgen" · Röntgen/scan-esthetiek (DONKER, lichtgevende lijn-art).
// Diep antraciet/nachtblauwe achtergrond met lichtgevende witte/cyaan contour-illustraties, dunne
// outline-iconografie (medische beeldvorming), meetraster en subtiele scan-glow. Vertrouwen door
// transparantie — het "doorlichten" van certificaten. Past bij zorg + verificatie. Geist + Geist Mono.
// Palet: bg #0a1120, panel rgba(255,255,255,0.03), cyaan #5ee6d0, glow #7fd4ff, ink #e8f2f6.

import { useState } from "react";
import {
  ScanLine,
  Activity,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ShieldCheck,
  Radar,
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
  bg: "#0a1120",
  bgDeep: "#070d18",
  panel: "rgba(255,255,255,0.035)",
  panelHi: "rgba(255,255,255,0.06)",
  ink: "#e8f2f6",
  inkSoft: "#a9c0cc",
  muted: "#6f8794",
  faint: "#4d6472",
  line: "rgba(126,212,255,0.14)",
  lineSoft: "rgba(126,212,255,0.08)",
  cyan: "#5ee6d0",
  glow: "#7fd4ff",
  amber: "#ffcf72",
  red: "#ff8b8b",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// Meetraster-achtergrond zoals op een scanbeeld.
const grid =
  "linear-gradient(rgba(126,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(126,212,255,0.05) 1px, transparent 1px)";

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Doorgelicht", Icon: Check, color: C.cyan };
    case "SUBMITTED":
      return { label: "Onder de scanner", Icon: Clock, color: C.glow };
    case "EXPIRING":
      return { label: "Signaal verzwakt", Icon: AlertTriangle, color: C.amber };
    case "REJECTED":
      return { label: "Afgekeurd", Icon: AlertTriangle, color: C.red };
  }
}

function glowStyle(color: string): React.CSSProperties {
  return { color, filter: `drop-shadow(0 0 6px ${color}88)` };
}

function Panel({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: glow ? `0 0 0 1px ${C.lineSoft}, 0 0 40px -18px ${C.glow}` : "none",
      }}
    >
      {children}
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-medium uppercase tracking-[0.24em]"
      style={{ color: C.faint, ...mono }}
    >
      {children}
    </p>
  );
}

// Lichtgevende contour-ring die het match-percentage laat "oplichten" als een scanwaarde.
function ScanRing({ value, size = 56 }: { value: number; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`${value} procent match`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth="2.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.cyan}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ filter: `drop-shadow(0 0 4px ${C.cyan})` }}
        />
      </svg>
      <span
        className="absolute text-[13px] font-semibold tabular-nums"
        style={{ ...mono, color: C.ink }}
      >
        {value}
      </span>
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * 100},${26 - ((d - min) / range) * 22}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" className="h-7 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.glow}
        strokeWidth="1.6"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${C.glow}aa)` }}
      />
    </svg>
  );
}

export function Concept106() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...ui,
        background: `radial-gradient(120% 80% at 50% -10%, #0e1a2e 0%, ${C.bg} 45%, ${C.bgDeep} 100%)`,
        color: C.ink,
      }}
    >
      <div className="relative" style={{ backgroundImage: grid, backgroundSize: "44px 44px" }}>
        <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-7 md:px-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ border: `1px solid ${C.line}`, ...glowStyle(C.cyan) }}
              aria-hidden="true"
            >
              <ScanLine size={19} />
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-none tracking-[-0.01em]">Röntgen</p>
              <p className="mt-1 text-[11px]" style={{ color: C.muted, ...mono }}>
                Doorlicht wat telt
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] sm:inline-flex"
              style={{ border: `1px solid ${C.line}`, color: C.cyan, ...mono }}
            >
              <Activity size={12} aria-hidden="true" style={glowStyle(C.cyan)} /> Scan actief
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ border: `1px solid ${C.cyan}`, color: C.cyan, ...glowStyle(C.cyan) }}
              aria-label={PROFIEL.naam}
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav
          className="mx-auto mt-6 flex max-w-6xl items-center gap-1 overflow-x-auto px-5 md:px-8"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120]"
                style={{ color: on ? C.ink : C.muted }}
              >
                {s.label}
                {on && (
                  <span
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full"
                    style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="h-px w-full" style={{ background: C.line }} aria-hidden="true" />

        <main className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-9">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-6">
      <Panel glow className="overflow-hidden p-6 md:p-8">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${C.glow}22, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Radar size={14} aria-hidden="true" style={glowStyle(C.cyan)} />
              <Overline>Statusscan · {PROFIEL.plaats}</Overline>
            </div>
            <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">
              Alles doorgelicht, {PROFIEL.naam.split(" ")[0]}. Eén signaal vraagt aandacht.
            </h1>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je profiel is transparant en verifieerbaar. De scanner ziet één document dat
              binnenkort zijn geldigheid verliest.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[12.5px]" style={{ color: C.cyan }}>
              <ShieldCheck size={15} aria-hidden="true" style={glowStyle(C.cyan)} />
              {PROFIEL.trust} · niets te verbergen
            </div>
          </div>
          <div
            className="flex flex-col justify-between rounded-xl p-5"
            style={{ background: C.panelHi, border: `1px solid ${C.line}` }}
          >
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.amber, border: `1px solid ${C.amber}55`, ...mono }}
              >
                <AlertTriangle size={11} aria-hidden="true" /> Signaal
              </span>
              <p className="mt-3 text-[16px] font-semibold leading-snug">{primair.titel}</p>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                {primair.detail}
              </p>
            </div>
            <button
              onClick={onOpen}
              className="group mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120] motion-reduce:hover:gap-2"
              style={{ background: C.cyan, color: C.bgDeep }}
            >
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-[12px]" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="text-[11px] font-medium tabular-nums"
                style={{ ...mono, color: k.up ? C.cyan : C.amber }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <p
              className="mt-2 text-[24px] font-semibold tabular-nums tracking-[-0.01em]"
              style={mono}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Sparkline data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine size={15} aria-hidden="true" style={glowStyle(C.cyan)} />
            <Overline>Sterkste signaal</Overline>
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
            {top.id}
          </span>
        </div>
        <button
          onClick={onOpen}
          className="mt-3 flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120]"
        >
          <ScanRing value={top.match} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{top.titel}</span>
            <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
              {top.opdrachtgever} · {top.plaats} · {top.tarief}
            </span>
          </span>
          <ArrowRight size={17} aria-hidden="true" style={{ color: C.faint }} />
        </button>
      </Panel>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Beeldvorming</Overline>
          <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">Opdrachten in beeld</h1>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <ScanLine size={15} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Scan op titel, plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[13px] outline-none placeholder:text-[#6f8794]"
            style={{ color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <Radar size={26} aria-hidden="true" className="mx-auto" style={{ color: C.faint }} />
          <p className="mt-3 text-[15px] font-semibold">Geen signaal</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px]" style={{ color: C.muted }}>
            De scanner vindt niets bij “{q}”. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120]"
            style={{ background: C.cyan, color: C.bgDeep }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <Panel
              key={o.id}
              className="p-4 transition-colors hover:border-[rgba(126,212,255,0.3)]"
            >
              <div className="flex items-start gap-3">
                <ScanRing value={o.match} size={48} />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {o.id}
                  </span>
                  <h2 className="truncate text-[15px] font-semibold">{o.titel}</h2>
                  <p className="text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{ border: `1px solid ${C.line}`, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between border-t pt-3"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="text-[13px] font-semibold tabular-nums" style={mono}>
                  {o.tarief}
                </span>
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120] motion-reduce:hover:gap-1.5"
                  style={{ color: C.cyan }}
                >
                  Doorlichten <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const facts = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}%` },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#e8f2f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120]"
        style={{ color: C.muted }}
      >
        <ChevronLeft size={15} aria-hidden="true" /> Terug naar beeld
      </button>

      <Panel glow className="overflow-hidden p-6 md:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${C.cyan}18, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <ScanRing value={opdracht.match} size={64} />
          <div>
            <p className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
              {opdracht.id}
            </p>
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em]">
              {opdracht.titel}
            </h1>
            <p className="text-[13px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {facts.map((f) => (
            <div
              key={f.l}
              className="rounded-xl p-3"
              style={{ background: C.panelHi, border: `1px solid ${C.lineSoft}` }}
            >
              <p className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
                {f.l}
              </p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums" style={mono}>
                {f.v}
              </p>
            </div>
          ))}
        </div>
        <button
          className="relative mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120] motion-reduce:hover:gap-2"
          style={{ background: C.cyan, color: C.bgDeep }}
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <Check size={15} aria-hidden="true" style={glowStyle(C.cyan)} />
            <Overline>Helder signaal · past</Overline>
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13.5px]">
                <Check
                  size={16}
                  aria-hidden="true"
                  style={{ ...glowStyle(C.cyan), marginTop: 1 }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} aria-hidden="true" style={glowStyle(C.amber)} />
            <Overline>Ruis · aandacht</Overline>
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={16}
                  aria-hidden="true"
                  style={{ ...glowStyle(C.amber), marginTop: 1 }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <Panel glow className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} aria-hidden="true" style={glowStyle(C.cyan)} />
              <Overline>Doorlichting</Overline>
            </div>
            <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">Verificatie</h1>
            <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
              <span style={{ color: C.ink }}>{PROFIEL.trust}.</span> {verified} van{" "}
              {CREDENTIALS.length} documenten volledig doorgelicht.
            </p>
          </div>
          <span
            className="text-[34px] font-semibold tabular-nums"
            style={{ ...mono, ...glowStyle(C.cyan) }}
          >
            {pct}%
          </span>
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full"
          style={{ background: C.panelHi }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Verificatievoortgang"
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: C.cyan, boxShadow: `0 0 12px ${C.cyan}` }}
          />
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <Panel key={c.naam} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ border: `1px solid ${st.color}55`, ...glowStyle(st.color) }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-snug">{c.naam}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
              </div>
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ border: `1px solid ${st.color}44`, color: st.color }}
              >
                <st.Icon size={12} aria-hidden="true" />
                {st.label}
              </span>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <div>
        <Overline>Signaallijst</Overline>
        <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">Volgende acties</h1>
      </div>
      <div className="space-y-3">
        {sorted.map((a) => {
          const warn = a.urgentie === "warning";
          const col = warn ? C.amber : C.glow;
          return (
            <Panel key={a.titel} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ border: `1px solid ${col}44`, ...glowStyle(col) }}
                  aria-hidden="true"
                >
                  {warn ? <AlertTriangle size={17} /> : <Clock size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[14.5px] font-semibold">{a.titel}</h2>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{ border: `1px solid ${col}44`, color: col }}
                    >
                      {warn ? "Waarschuwing" : "Info"}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-center rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120]"
                  style={
                    warn
                      ? { background: C.amber, color: C.bgDeep }
                      : { border: `1px solid ${C.line}`, color: C.ink }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald");
  const total = "€ 8.622";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Omzetscan</Overline>
          <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">Facturen</h1>
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: C.muted }}>
            Totaal betaald
          </p>
          <p
            className="text-[20px] font-semibold tabular-nums"
            style={{ ...mono, ...glowStyle(C.cyan) }}
          >
            {total}
          </p>
        </div>
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Factuur", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10.5px] font-medium uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.faint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const paid = f.status === "Betaald";
              const open = f.status === "Openstaand";
              const col = paid ? C.cyan : open ? C.amber : C.muted;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td
                    className="px-4 py-3 text-[12.5px] tabular-nums"
                    style={{ color: C.muted, ...mono }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13.5px] font-medium">{f.klant}</td>
                  <td className="px-4 py-3 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ border: `1px solid ${col}44`, color: col }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: col, boxShadow: `0 0 6px ${col}` }}
                      />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13.5px] font-semibold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <p className="text-[12px]" style={{ color: C.muted }}>
        {betaald.length} van {FACTUREN.length} facturen betaald · signaal helder.
      </p>
    </div>
  );
}
