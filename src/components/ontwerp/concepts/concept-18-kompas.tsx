"use client";

// Concept 18 — "Kompas" · Reis & wayfinding (LIGHT, oriënterend mint-canvas).
// Elke opdracht is een REIS met haltes: Reactie → Match → Verificatie → Contract → Factuur.
// De horizontale tijdlijn/stepper is het hart van dashboard én opdracht-detail: voortgang en de
// volgende beste stap zijn letterlijk zichtbaar. Kalm, licht, geografisch; kompas/route-motieven.
// Palet: bg #f6f8f7, surface #ffffff, fg #132420, muted #5b6b64, accent teal #0d9488.
// Fonts: Bricolage Grotesque (display) + Geist Mono (cijfers/kickers) + Geist (UI body).

import { useState } from "react";
import {
  Compass,
  LayoutDashboard,
  Store,
  Route,
  ShieldCheck,
  Flag,
  Receipt,
  Search,
  Bell,
  Send,
  Target,
  FileSignature,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  MapPin,
  Navigation,
  ArrowRight,
  ChevronRight,
  CircleDot,
  Milestone,
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
  bg: "#f6f8f7",
  bgSoft: "#eef2f0",
  surface: "#ffffff",
  fg: "#132420",
  fgSoft: "#33463f",
  muted: "#5b6b64",
  faint: "#8a9992",
  line: "#dfe6e2",
  lineSoft: "#e9efec",
  accent: "#0d9488",
  accentDeep: "#0b6f66",
  accentSoft: "#e2f1ef",
  accentLine: "rgba(13,148,136,0.30)",
  ok: "#0d9488",
  okSoft: "#e2f1ef",
  warn: "#b26a17",
  warnSoft: "#f6ecdd",
  bad: "#b3453d",
  badSoft: "#f6e3e1",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const display = { fontFamily: "var(--font-lab-bricolage)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Route,
  verificatie: ShieldCheck,
  acties: Flag,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

// De vaste reis-haltes die elke opdracht doorloopt.
type Halte = { key: string; label: string; Icon: LucideIcon };
const HALTES: Halte[] = [
  { key: "reactie", label: "Reactie", Icon: Send },
  { key: "match", label: "Match", Icon: Target },
  { key: "verificatie", label: "Verificatie", Icon: ShieldCheck },
  { key: "contract", label: "Contract", Icon: FileSignature },
  { key: "factuur", label: "Factuur", Icon: Receipt },
];

// Deterministische voortgang per opdracht (geen random): index in HALTES = huidige halte.
const REIS_STAP: Record<string, number> = {
  "OPD-2041": 2,
  "OPD-2038": 1,
  "OPD-2035": 0,
};
const VOLGENDE_STAP: Record<string, string> = {
  "OPD-2041": "Rond je verificatie af — VOG vernieuwen ontgrendelt het contract.",
  "OPD-2038": "Bevestig de match en plan een kennismaking met Zorggroep Almere.",
  "OPD-2035": "Reageer vandaag; de opdrachtgever reageert gemiddeld binnen 6 uur.",
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, bg: C.okSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "Onderweg", fg: C.accent, bg: C.accentSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.bad, bg: C.badSoft, Icon: AlertTriangle };
  }
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.24em]"
      style={{ color: C.accentDeep, ...mono }}
    >
      <Navigation size={11} aria-hidden="true" />
      {children}
    </p>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 78;
  const h = 24;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={line}
        fill="none"
        stroke={C.accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={C.accent} />
    </svg>
  );
}

// ── Reis-tijdlijn: het hart van het concept ──────────────────────────────────
function ReisTijdlijn({ stap, size = "md" }: { stap: number; size?: "sm" | "md" | "lg" }) {
  const dot = size === "lg" ? 40 : size === "sm" ? 26 : 32;
  const icon = size === "lg" ? 18 : size === "sm" ? 12 : 15;
  return (
    <ol className="flex items-start" aria-label="Reisvoortgang">
      {HALTES.map((halte, i) => {
        const done = i < stap;
        const current = i === stap;
        const upcoming = i > stap;
        const H = current ? Navigation : done ? Check : halte.Icon;
        return (
          <li key={halte.key} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* linker connector */}
              <span
                className="h-[2px] flex-1 rounded-full"
                style={{
                  background: i === 0 ? "transparent" : done || current ? C.accent : C.line,
                }}
                aria-hidden="true"
              />
              <span
                className="relative flex shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none"
                style={{
                  width: dot,
                  height: dot,
                  background: done ? C.accent : current ? C.surface : C.surface,
                  border: `2px solid ${done || current ? C.accent : C.line}`,
                  color: done ? C.surface : current ? C.accent : C.faint,
                  boxShadow: current ? `0 0 0 5px ${C.accentSoft}` : "none",
                }}
              >
                <H size={icon} aria-hidden="true" />
                {current && (
                  <span
                    className="absolute inset-0 rounded-full motion-safe:animate-ping"
                    style={{ border: `2px solid ${C.accentLine}` }}
                    aria-hidden="true"
                  />
                )}
              </span>
              {/* rechter connector */}
              <span
                className="h-[2px] flex-1 rounded-full"
                style={{
                  background: i === HALTES.length - 1 ? "transparent" : done ? C.accent : C.line,
                }}
                aria-hidden="true"
              />
            </div>
            <span
              className="mt-2 truncate text-center text-[11px]"
              style={{
                color: current ? C.fg : upcoming ? C.faint : C.fgSoft,
                fontWeight: current ? 600 : 400,
                ...mono,
              }}
            >
              {halte.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Concept18() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.fg }}
    >
      {/* Top-nav: horizontale kompas-balk (onderscheidend van sidebar-concepten) */}
      <header
        className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b px-4 md:px-8"
        style={{
          borderColor: C.line,
          background: "rgba(246,248,247,0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: C.accent, color: C.surface }}
          >
            <Compass size={18} aria-hidden="true" />
          </span>
          <div className="hidden leading-tight sm:block">
            <div className="text-[15px] font-semibold tracking-tight" style={display}>
              Kompas
            </div>
            <div
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: C.faint, ...mono }}
            >
              ZZP Platform
            </div>
          </div>
        </div>

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: on ? C.accentDeep : C.muted,
                  background: on ? C.accentSoft : "transparent",
                  fontWeight: on ? 600 : 400,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="hidden items-center gap-2.5 rounded-full border px-3.5 py-2 text-[12.5px] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex"
            style={{ borderColor: C.line, color: C.muted }}
            aria-label="Zoeken openen"
          >
            <Search size={14} aria-hidden="true" />
            <span>Zoek een route…</span>
          </button>
          <button
            className="relative rounded-full border p-2.5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: C.line, color: C.muted }}
            aria-label="Meldingen"
          >
            <Bell size={15} aria-hidden="true" />
            <span
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
              style={{ background: C.accent }}
              aria-hidden="true"
            />
          </button>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: C.accentSoft, color: C.accentDeep, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Mobiele tab-strip */}
      <div
        className="flex gap-1 overflow-x-auto border-b px-3 py-2 lg:hidden"
        style={{ borderColor: C.line }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                color: on ? C.accentDeep : C.muted,
                background: on ? C.accentSoft : "transparent",
                fontWeight: on ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ border: `1px solid ${C.line}`, background: C.surface }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const lead = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-8">
      {/* Kop */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Jouw kaart · vandaag</Kicker>
          <h1 className="mt-2 text-[34px] leading-[1.05] tracking-tight" style={display}>
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Drie reizen zijn onderweg. Eén halte vraagt om je aandacht — de rest ligt op koers.
          </p>
        </div>
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ border: `1px solid ${C.accentLine}`, background: C.accentSoft }}
        >
          <Milestone size={22} aria-hidden="true" style={{ color: C.accent }} />
          <div>
            <p className="text-[12.5px] font-semibold">{PROFIEL.trust}</p>
            <p className="text-[11px]" style={{ color: C.muted, ...mono }}>
              {PROFIEL.plaats} · {PROFIEL.rol.split(" · ")[0]}
            </p>
          </div>
        </div>
      </div>

      {/* KPI-strook */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none tracking-tight"
              style={display}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="rounded-full px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums"
                style={{
                  color: k.up ? C.accentDeep : C.warn,
                  background: k.up ? C.accentSoft : C.warnSoft,
                  ...mono,
                }}
              >
                {k.trend}
              </span>
              <Sparkline data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      {/* Reizen — de kern: elke opdracht een tijdlijn */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Route size={16} aria-hidden="true" style={{ color: C.accent }} /> Jouw reizen
          </h2>
          <span className="text-[11.5px]" style={{ color: C.faint }}>
            Voortgang per opdracht
          </span>
        </div>
        <div className="space-y-3">
          {OPDRACHTEN.map((o) => {
            const stap = REIS_STAP[o.id] ?? 0;
            const huidige = HALTES[stap]!;
            return (
              <Card key={o.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14.5px] font-semibold">{o.titel}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                        style={{ background: C.accentSoft, color: C.accentDeep, ...mono }}
                      >
                        {o.match}%
                      </span>
                    </div>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 text-[12px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <button
                    onClick={onOpen}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ background: C.accent, color: C.surface }}
                  >
                    Volg reis <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
                <div className="px-6 pb-3 pt-5">
                  <ReisTijdlijn stap={stap} size="sm" />
                </div>
                <div
                  className="flex items-start gap-2.5 border-t px-5 py-3 text-[12.5px]"
                  style={{ borderColor: C.lineSoft, background: C.bgSoft }}
                >
                  <huidige.Icon
                    size={14}
                    aria-hidden="true"
                    style={{ color: C.accent, marginTop: 1 }}
                  />
                  <span style={{ color: C.fgSoft }}>
                    <span className="font-semibold" style={{ color: C.fg }}>
                      Volgende stap:
                    </span>{" "}
                    {VOLGENDE_STAP[o.id]}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Twee kolommen: volgende beste actie + kompas-checkpoints */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Flag size={16} aria-hidden="true" style={{ color: C.accent }} /> Volgende beste actie
          </h2>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.warnSoft, color: C.warn }}
              >
                <AlertTriangle size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold">{ACTIES[0]!.titel}</p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  {ACTIES[0]!.detail}
                </p>
                <button
                  onClick={onOpen}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: C.fg, color: C.surface }}
                >
                  {ACTIES[0]!.cta} <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-5 border-t pt-4" style={{ borderColor: C.lineSoft }}>
              <p
                className="text-[11.5px] font-medium uppercase tracking-[0.14em]"
                style={{ color: C.faint, ...mono }}
              >
                Route van deze topmatch
              </p>
              <p className="mt-2 text-[13.5px] font-semibold" style={display}>
                {lead.titel}
              </p>
              <div className="mt-4">
                <ReisTijdlijn stap={REIS_STAP[lead.id] ?? 0} size="sm" />
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <ShieldCheck size={16} aria-hidden="true" style={{ color: C.accent }} /> Checkpoints
          </h2>
          <Card className="p-4">
            <ul className="space-y-3">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <li key={c.naam} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: st.bg, color: st.fg }}
                    >
                      <st.Icon size={13} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {st.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
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
    <div className="space-y-6">
      <div>
        <Kicker>Verken bestemmingen</Kicker>
        <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={display}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ border: `1px solid ${C.line}`, background: C.surface }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8a9992]"
          style={{ color: C.fg }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.muted, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: C.bgSoft, color: C.faint }}
          >
            <Compass size={22} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">Geen bestemming gevonden</p>
          <p className="mt-1 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Er ligt niets op deze route voor “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ border: `1px solid ${C.line}`, color: C.fg }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => {
            const stap = REIS_STAP[o.id] ?? 0;
            return (
              <button
                key={o.id}
                onClick={onOpen}
                className="group rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(19,36,32,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                style={{ border: `1px solid ${C.line}`, background: C.surface }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10.5px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {o.id}
                  </span>
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ background: C.accentSoft, color: C.accentDeep, ...mono }}
                  >
                    <CircleDot size={10} aria-hidden="true" /> {o.match}%
                  </span>
                </div>
                <p className="mt-2.5 text-[15.5px] font-semibold leading-snug" style={display}>
                  {o.titel}
                </p>
                <p
                  className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px]"
                      style={{ border: `1px solid ${C.line}`, color: C.muted }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 border-t pt-3" style={{ borderColor: C.lineSoft }}>
                  <ReisTijdlijn stap={stap} size="sm" />
                </div>
                <div
                  className="mt-3 flex items-center justify-between text-[12.5px] tabular-nums"
                  style={{ ...mono, color: C.fgSoft }}
                >
                  <span className="font-semibold">{o.tarief}</span>
                  <span className="inline-flex items-center gap-1" style={{ color: C.accentDeep }}>
                    Start reis <ChevronRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const stap = REIS_STAP[opdracht.id] ?? 0;
  const huidige = HALTES[stap]!;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <button
        className="inline-flex items-center gap-1.5 text-[12.5px] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ChevronRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar reizen
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Kicker>{opdracht.id} · reis</Kicker>
          <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={display}>
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, color: C.surface }}
        >
          Zet volgende stap <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      {/* De reis als held */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <p
            className="text-[11.5px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            Route van deze opdracht
          </p>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold tabular-nums"
            style={{ background: C.accentSoft, color: C.accentDeep, ...mono }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <div className="mt-6 px-2">
          <ReisTijdlijn stap={stap} size="lg" />
        </div>
        <div
          className="mt-6 flex items-start gap-3 rounded-xl p-4"
          style={{ background: C.accentSoft }}
        >
          <huidige.Icon size={18} aria-hidden="true" style={{ color: C.accent, marginTop: 1 }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: C.accentDeep }}>
              Je bent bij halte “{huidige.label}”
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
              {VOLGENDE_STAP[opdracht.id]}
            </p>
          </div>
        </div>
      </Card>

      {/* Kerncijfers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[11px] uppercase tracking-[0.12em]"
              style={{ color: C.muted, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[17px] font-semibold tabular-nums tracking-tight"
              style={display}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      {/* Waarom deze match */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Target size={16} aria-hidden="true" style={{ color: C.accent }} />
          <h3 className="text-[14.5px] font-semibold">Waarom deze reis bij je past</h3>
        </div>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel — plus- én aandachtspunten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.accentDeep }}
            >
              Meewind
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.accentSoft }}
                  >
                    <Check size={11} aria-hidden="true" style={{ color: C.accent }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.warn }}
            >
              Tegenwind
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.fgSoft }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
                  >
                    <Minus size={11} aria-hidden="true" style={{ color: C.warn }} />
                  </span>
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

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Onderweg naar volledig vertrouwen</Kicker>
        <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={display}>
          Verificatie
        </h1>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="34" fill="none" stroke={C.lineSoft} strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={C.accent}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                transform="rotate(-90 40 40)"
              />
            </svg>
            <span
              className="text-[16px] font-semibold tabular-nums"
              style={{ ...mono, color: C.accentDeep }}
            >
              {pct}%
            </span>
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-semibold" style={display}>
              {PROFIEL.trust}
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
              <span className="tabular-nums" style={mono}>
                {verified}
              </span>{" "}
              van{" "}
              <span className="tabular-nums" style={mono}>
                {CREDENTIALS.length}
              </span>{" "}
              checkpoints bereikt · één ligt op de route en vraagt actie.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <ul className="divide-y" style={{ borderColor: C.lineSoft }}>
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <li
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#f6f8f7]"
              >
                <span className="w-5 text-[12px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: st.bg, color: st.fg }}
                >
                  <st.Icon size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: st.bg, color: st.fg }}
                >
                  {st.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle },
    info: { fg: C.accent, bg: C.accentSoft, Icon: Flag },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Volgende haltes</Kicker>
        <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={display}>
          Wat nu telt
        </h1>
      </div>
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <li key={a.titel}>
              <Card className="flex items-start gap-4 p-5">
                <div className="flex flex-col items-center">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: t.bg, color: t.fg }}
                  >
                    <t.Icon size={18} aria-hidden="true" />
                  </span>
                  {i < ACTIES.length - 1 && (
                    <span
                      className="mt-1 h-6 w-[2px] rounded-full"
                      style={{ background: C.line }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{a.titel}</p>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-center rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: C.fg, color: C.surface }}
                >
                  {a.cta}
                </button>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.ok, bg: C.okSoft },
    Openstaand: { fg: C.warn, bg: C.warnSoft },
    Concept: { fg: C.muted, bg: C.bgSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Eindhalte</Kicker>
          <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={display}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, color: C.surface }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10.5px] uppercase tracking-[0.1em]"
                style={{ borderColor: C.line, color: C.faint }}
              >
                <th className="px-5 py-3 font-medium" style={mono}>
                  Nummer
                </th>
                <th className="px-5 py-3 font-medium" style={mono}>
                  Klant
                </th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell" style={mono}>
                  Datum
                </th>
                <th className="px-5 py-3 text-right font-medium" style={mono}>
                  Bedrag
                </th>
                <th className="px-5 py-3 text-right font-medium" style={mono}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.bgSoft };
                return (
                  <tr
                    key={f.nr}
                    className="border-b transition-colors last:border-0 hover:bg-[#f6f8f7]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.fgSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-3.5 text-[12.5px] sm:table-cell"
                      style={{ color: C.muted, ...mono }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-semibold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ background: t.bg, color: t.fg }}
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
      </Card>
    </div>
  );
}
