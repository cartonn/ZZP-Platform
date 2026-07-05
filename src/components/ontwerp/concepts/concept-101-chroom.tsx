"use client";

// Concept 101 — "Chroom" · Retrofuturisme / liquid-metal (LIGHT, hardware-premium).
// Geborsteld en gepolijst chroom als hoofdmateriaal: koele zilver/staal-verlopen, glossy bevels,
// dunne reflectie-lijnen en chrome pill-knoppen met licht-highlight. ÉÉN elektrisch neon-accent
// (cyaan) snijdt door het metaal. Y2K-optimisme, gepolijst aluminium hardware-gevoel.
// Fonts: Space Grotesk (UI/display) + Spline Sans Mono (cijfers/labels).

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Sparkles,
  MapPin,
  Zap,
  ChevronRight,
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
  bg: "#e7eaee",
  panel: "linear-gradient(145deg,#fdfdfe 0%,#eef1f5 42%,#dfe4ea 100%)",
  chrome: "linear-gradient(180deg,#ffffff 0%,#e9edf2 46%,#c4ccd6 100%)",
  chromeDeep: "linear-gradient(180deg,#c9d0da 0%,#aeb8c6 100%)",
  brushed:
    "repeating-linear-gradient(90deg,rgba(255,255,255,0.55) 0px,rgba(255,255,255,0) 1px,rgba(120,132,148,0.06) 2px,rgba(255,255,255,0) 3px)",
  ink: "#1b2430",
  inkSoft: "#43505f",
  muted: "#6b7684",
  faint: "#93a0af",
  edge: "rgba(120,134,152,0.35)",
  edgeSoft: "rgba(120,134,152,0.18)",
  hi: "rgba(255,255,255,0.9)",
  neon: "#00c2d6",
  neonDeep: "#0090a3",
  ok: "#2f7d6b",
  warn: "#9a6b1f",
  bad: "#a4443a",
};

const ui = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.neonDeep };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.bad };
  }
}

const bevel: React.CSSProperties = {
  background: C.panel,
  border: `1px solid ${C.edge}`,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(120,134,152,0.25), 0 8px 24px -14px rgba(27,36,48,0.4)",
};

function ChromePill({
  children,
  onClick,
  primary,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[13px] font-semibold tracking-tight transition-all duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
      style={
        primary
          ? {
              ...ui,
              color: "#052a30",
              background: `linear-gradient(180deg,#5ff0ff 0%,${C.neon} 55%,${C.neonDeep} 100%)`,
              border: `1px solid ${C.neonDeep}`,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 20px -10px rgba(0,144,163,0.7)",
            }
          : {
              ...ui,
              color: C.ink,
              background: C.chrome,
              border: `1px solid ${C.edge}`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 12px -8px rgba(27,36,48,0.5)",
            }
      }
    >
      <span
        className="pointer-events-none absolute inset-x-2 top-0 h-1/2 rounded-full opacity-70"
        style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.75),transparent)" }}
        aria-hidden="true"
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={bevel}>
      <span
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: C.brushed }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-medium uppercase tracking-[0.34em]"
      style={{ ...mono, color: C.faint }}
    >
      {children}
    </p>
  );
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / span) * 24 - 2}`)
    .join(" ");
  const col = up ? C.neonDeep : C.warn;
  return (
    <svg viewBox="0 0 100 28" className="h-7 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={col}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Concept101() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-7 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: C.chromeDeep,
              border: `1px solid ${C.edge}`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -6px rgba(27,36,48,0.6)",
            }}
            aria-hidden="true"
          >
            <Zap size={18} style={{ color: C.neonDeep }} />
          </span>
          <div>
            <p className="text-[16px] font-bold leading-none tracking-tight">Chroom</p>
            <p
              className="mt-1 text-[10px] uppercase tracking-[0.3em]"
              style={{ ...mono, color: C.faint }}
            >
              ZZP · Zorg
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.chrome, border: `1px solid ${C.edge}`, color: C.ok }}
          >
            <Sparkles size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
            style={{
              background: C.chrome,
              border: `1px solid ${C.edge}`,
              color: C.ink,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav className="mx-auto mt-6 max-w-6xl px-5 md:px-8" aria-label="Hoofdnavigatie">
        <div className="flex gap-1 overflow-x-auto rounded-full p-1.5" style={bevel}>
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        color: "#052a30",
                        background: `linear-gradient(180deg,#5ff0ff,${C.neon})`,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px -6px rgba(0,144,163,0.6)",
                      }
                    : { color: C.muted }
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
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
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Overline>Prioriteit · nu</Overline>
              <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight">
                {primair.titel}
              </h1>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
                {primair.detail}
              </p>
              <div className="mt-5">
                <ChromePill primary onClick={onOpen}>
                  {primair.cta} <ArrowRight size={15} aria-hidden="true" />
                </ChromePill>
              </div>
            </div>
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: C.chromeDeep, border: `1px solid ${C.edge}` }}
              aria-hidden="true"
            >
              <AlertTriangle size={26} style={{ color: C.warn }} />
            </div>
          </div>
        </Panel>

        <Panel>
          <button
            onClick={onOpen}
            className="w-full p-6 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
          >
            <Overline>Beste match</Overline>
            <p className="mt-3 text-[17px] font-bold leading-snug tracking-tight">{top.titel}</p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
              {top.opdrachtgever} · {top.plaats}
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span
                className="text-[34px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.neonDeep }}
              >
                {top.match}
              </span>
              <span className="text-[14px] font-semibold" style={{ color: C.neonDeep }}>
                % match
              </span>
            </div>
            <span
              className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold"
              style={{ color: C.ink }}
            >
              Bekijk opdracht <ChevronRight size={14} aria-hidden="true" />
            </span>
          </button>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label}>
            <div className="p-4">
              <p className="text-[11px] leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <p
                className="mt-2 text-[24px] font-bold tabular-nums leading-none tracking-tight"
                style={mono}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} up={k.up} />
              </div>
              <p
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.ok : C.warn }}
              >
                <ArrowUpRight size={12} aria-hidden="true" className={k.up ? "" : "rotate-90"} />
                {k.trend}
              </p>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function MatchBar({ value }: { value: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.chromeDeep, border: `1px solid ${C.edgeSoft}` }}
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg,${C.neonDeep},${C.neon})`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      />
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Overline>Marktplaats</Overline>
          <h1 className="mt-2 text-[24px] font-bold tracking-tight">Open opdrachten</h1>
        </div>
        <span className="text-[12px]" style={{ ...mono, color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length}
        </span>
      </div>

      <Panel>
        <div className="flex items-center gap-3 p-3">
          <MapPin size={16} style={{ color: C.faint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#93a0af]"
            style={{ color: C.ink }}
          />
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <div className="p-12 text-center">
            <p className="text-[16px] font-bold">Niets gevonden</p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen opdracht past bij “{q}”. Verruim je zoekopdracht.
            </p>
            <div className="mt-5 inline-flex">
              <ChromePill onClick={() => setQ("")}>Zoekopdracht wissen</ChromePill>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4">
          {filtered.map((o) => (
            <Panel key={o.id}>
              <button
                onClick={onOpen}
                className="flex w-full flex-col gap-4 p-5 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
                      {o.id}
                    </span>
                  </div>
                  <p className="mt-1 text-[17px] font-bold leading-snug tracking-tight">
                    {o.titel}
                  </p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                        style={{
                          background: C.chrome,
                          border: `1px solid ${C.edgeSoft}`,
                          color: C.inkSoft,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-full shrink-0 sm:w-40">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px]" style={{ color: C.muted }}>
                      Match
                    </span>
                    <span
                      className="text-[16px] font-bold tabular-nums"
                      style={{ ...mono, color: C.neonDeep }}
                    >
                      {o.match}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <MatchBar value={o.match} />
                  </div>
                  <span
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    Open <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
                {opdracht.id}
              </span>
              <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-tight">
                {opdracht.titel}
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-[36px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.neonDeep }}
              >
                {opdracht.match}%
              </p>
              <p
                className="text-[11px] uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.faint }}
              >
                match
              </p>
            </div>
          </div>
          <div className="mt-5">
            <MatchBar value={opdracht.match} />
          </div>
          <div className="mt-5">
            <ChromePill primary>
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </ChromePill>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Locatie", v: opdracht.plaats },
        ].map((m) => (
          <Panel key={m.l}>
            <div className="p-4">
              <p
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.faint }}
              >
                {m.l}
              </p>
              <p className="mt-2 text-[15px] font-bold tabular-nums tracking-tight">{m.v}</p>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <div className="p-5">
            <p
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.ok }}
            >
              <Check size={14} aria-hidden="true" /> Wat past
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13.5px]">
                  <Check size={15} style={{ color: C.ok, marginTop: 2 }} aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel>
          <div className="p-5">
            <p
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Aandacht
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    style={{ color: C.warn, marginTop: 2 }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Overline>Vertrouwen</Overline>
          <h1 className="mt-2 text-[24px] font-bold tracking-tight">Verificatie</h1>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, background: C.chrome, border: `1px solid ${C.edge}`, color: C.ok }}
        >
          {verified}/{CREDENTIALS.length} geverifieerd
        </span>
      </div>

      <div className="grid gap-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <Panel key={c.naam}>
              <div className="flex items-center gap-4 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: C.chrome, border: `1px solid ${C.edge}` }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} style={{ color: st.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-snug tracking-tight">{c.naam}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                  style={{
                    background: C.chrome,
                    border: `1px solid ${C.edgeSoft}`,
                    color: st.color,
                  }}
                >
                  <st.Icon size={12} aria-hidden="true" /> {st.label}
                </span>
              </div>
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
        <Overline>Next-action-engine</Overline>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight">Volgende acties</h1>
      </div>
      <div className="grid gap-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <Panel key={a.titel}>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: warn ? `linear-gradient(180deg,#5ff0ff,${C.neon})` : C.chrome,
                    color: warn ? "#052a30" : C.inkSoft,
                    border: `1px solid ${warn ? C.neonDeep : C.edge}`,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={14} style={{ color: C.warn }} aria-hidden="true" />
                    ) : (
                      <Clock size={14} style={{ color: C.neonDeep }} aria-hidden="true" />
                    )}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: warn ? C.warn : C.muted }}
                    >
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[15px] font-bold leading-snug tracking-tight">
                    {a.titel}
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <div className="shrink-0">
                  <ChromePill primary={warn}>{a.cta}</ChromePill>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Overline>Omzet</Overline>
          <h1 className="mt-2 text-[24px] font-bold tracking-tight">Facturen</h1>
        </div>
        <ChromePill>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </ChromePill>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.edge}` }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.faint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const betaald = f.status === "Betaald";
                const open = f.status === "Openstaand";
                const col = betaald ? C.ok : open ? C.warn : C.muted;
                return (
                  <tr key={f.nr} style={{ borderBottom: `1px solid ${C.edgeSoft}` }}>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-semibold">{f.klant}</td>
                    <td className="px-4 py-3 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                        style={{ color: col }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: col }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          className="flex items-baseline justify-between px-4 py-4"
          style={{ borderTop: `1px solid ${C.edge}` }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.faint }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[20px] font-bold tabular-nums"
            style={{ ...mono, color: C.neonDeep }}
          >
            {total}
          </span>
        </div>
      </Panel>
    </div>
  );
}
