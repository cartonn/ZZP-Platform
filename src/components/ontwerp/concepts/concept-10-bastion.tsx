"use client";

// Concept 10 — "Bastion" · Vertrouwen-fintech (DARK, navy + brass).
// Premium financial-trust, Mercury/Stripe-grade, gebouwd voor gevoelige documenten. Diepe navy-canvas
// en oppervlakken, een verfijnd brass/goud-accent, subtiele kluis/schild-veiligheidsmotieven, één
// ingehouden serif-displaymoment over Geist-UI, tabulaire mono-cijfers. De verificatie/trust-laag is
// de held. Serieus, veilig, duur — navy financial.
// Palet: canvas #0c1424, surface #111c30, line #1f2c44, ink #e9eefb, muted #8a98b5, brass #c9a227.
// Fonts: Geist (UI) + Instrument Serif (display) + JetBrains Mono (cijfers).

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  Command,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  MapPin,
  Lock,
  KeyRound,
  FileCheck2,
  Fingerprint,
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
  canvas: "#0c1424",
  surface: "#111c30",
  surfaceHi: "#15233c",
  line: "#1f2c44",
  lineSoft: "#18233a",
  ink: "#e9eefb",
  inkSoft: "#c2cce3",
  muted: "#8a98b5",
  faint: "#5e6c8a",
  brass: "#c9a227",
  brassSoft: "rgba(201,162,39,0.12)",
  brassLine: "rgba(201,162,39,0.32)",
  ok: "#5fc08a",
  okSoft: "rgba(95,192,138,0.12)",
  warn: "#e0b157",
  warnSoft: "rgba(224,177,87,0.12)",
  bad: "#e08585",
  badSoft: "rgba(224,133,133,0.12)",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const serif = { fontFamily: "var(--font-lab-instrument-serif)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

type Tone = { label: string; fg: string; bg: string; line: string };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, bg: C.okSoft, line: "rgba(95,192,138,0.32)" };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.brass, bg: C.brassSoft, line: C.brassLine };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.warn, bg: C.warnSoft, line: "rgba(224,177,87,0.32)" };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.bad, bg: C.badSoft, line: "rgba(224,133,133,0.32)" };
  }
}

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ color: tone.fg, background: tone.bg, border: `1px solid ${tone.line}` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tone.fg }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-medium uppercase tracking-[0.22em]"
      style={{ color: C.brass, ...mono }}
    >
      {children}
    </p>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id="bastionSpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.brass} stopOpacity={0.22} />
          <stop offset="100%" stopColor={C.brass} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#bastionSpark)" />
      <polyline
        points={line}
        fill="none"
        stroke={C.brass}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept10() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[238px] shrink-0 flex-col border-r px-3.5 py-5 md:flex"
          style={{ borderColor: C.line, background: C.canvas }}
        >
          <div className="flex items-center gap-2.5 px-1.5 pb-7">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.brassSoft, border: `1px solid ${C.brassLine}` }}
            >
              <Lock size={15} aria-hidden="true" style={{ color: C.brass }} />
            </div>
            <div className="min-w-0">
              <div
                className="truncate text-[13px] font-semibold leading-tight tracking-[0.04em]"
                style={{ color: C.ink }}
              >
                BASTION
              </div>
              <div className="truncate text-[10.5px]" style={{ color: C.faint }}>
                ZZP Platform
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.surface : "transparent",
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
                      style={{ background: C.brass }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.brass : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-5">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
              style={{
                background: C.brassSoft,
                border: `1px solid ${C.brassLine}`,
                color: C.brass,
              }}
            >
              <Lock size={12} aria-hidden="true" />
              <span style={{ color: C.inkSoft }}>Versleutelde kluis actief</span>
            </div>
            <div
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
              style={{ border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: C.brassSoft, color: C.brass, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.faint }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-6"
            style={{ borderColor: C.line }}
          >
            <nav className="flex items-center gap-2 text-[12.5px]" aria-label="Kruimelpad">
              <span style={{ color: C.muted }}>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-medium" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </nav>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[#15233c] focus-visible:outline-none focus-visible:ring-2 sm:flex"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
                <kbd
                  className="flex items-center gap-0.5 rounded px-1 text-[10px]"
                  style={{ border: `1px solid ${C.line}`, color: C.faint, ...mono }}
                >
                  <Command size={9} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded-lg p-2 transition-colors hover:bg-[#15233c] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.brass }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.brass : C.muted,
                    background: on ? C.brassSoft : "transparent",
                    border: `1px solid ${on ? C.brassLine : "transparent"}`,
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-7">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Card({
  children,
  className = "",
  hi = false,
}: {
  children: React.ReactNode;
  className?: string;
  hi?: boolean;
}) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ border: `1px solid ${C.line}`, background: hi ? C.surfaceHi : C.surface }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero — het serif-moment */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Vertrouwenscentrum</Kicker>
          <h1
            className="mt-2 text-[34px] leading-[1.08] tracking-tight"
            style={{ ...serif, color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.muted }}>
            Je documenten staan veilig in de versleutelde kluis. Drie matches boven 80%, één
            credential vraagt aandacht.
          </p>
        </div>
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ border: `1px solid ${C.brassLine}`, background: C.brassSoft }}
        >
          <ShieldCheck size={22} aria-hidden="true" style={{ color: C.brass }} />
          <div>
            <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="text-[11px] tabular-nums" style={{ color: C.muted, ...mono }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </p>
          </div>
        </div>
      </div>

      {/* KPI's */}
      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl lg:grid-cols-4"
        style={{ background: C.line }}
      >
        {KPIS.map((k) => (
          <div key={k.label} className="p-4" style={{ background: C.surface }}>
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[26px] font-medium tabular-nums leading-none tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] tabular-nums"
                style={{ color: k.up ? C.ok : C.muted, ...mono }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">Beste matches</h2>
            <span className="text-[11.5px]" style={{ color: C.faint }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <Card>
            <div className="divide-y" style={{ borderColor: C.lineSoft }}>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[#15233c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{o.titel}</p>
                    <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[12px] tabular-nums sm:block"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <span
                    className="rounded-md px-2 py-0.5 text-[12px] font-semibold tabular-nums"
                    style={{ color: C.brass, background: C.brassSoft, ...mono }}
                  >
                    {o.match}%
                  </span>
                  <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Kluis-overzicht */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Lock size={13} aria-hidden="true" style={{ color: C.brass }} />
            <h2 className="text-[14px] font-semibold tracking-tight">Documentkluis</h2>
          </div>
          <Card className="p-4">
            <div className="space-y-3">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-2.5">
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: st.fg }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
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
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Kicker>Marktplaats</Kicker>
        <h1 className="mt-2 text-[26px] leading-tight tracking-tight" style={serif}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-2.5"
        style={{ border: `1px solid ${C.line}`, background: C.surface }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none"
          style={{ color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ border: `1px solid ${C.line}`, background: C.surfaceHi }}
          >
            <Search size={20} aria-hidden="true" style={{ color: C.faint }} />
          </div>
          <p className="mt-4 text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor “{q}”. Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#15233c] focus-visible:outline-none focus-visible:ring-2"
            style={{ border: `1px solid ${C.line}`, color: C.ink }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-xl p-5 text-left transition-colors hover:bg-[#15233c] focus-visible:outline-none focus-visible:ring-2"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ background: C.brassSoft, color: C.brass, ...mono }}
                >
                  {o.match}%
                </span>
              </div>
              <p className="mt-3 text-[15px] font-medium leading-snug">{o.titel}</p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
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
              <div
                className="mt-4 flex items-center justify-between border-t pt-4 text-[12.5px] tabular-nums"
                style={{ borderColor: C.lineSoft, ...mono }}
              >
                <span style={{ color: C.inkSoft }}>{o.tarief}</span>
                <span style={{ color: C.muted }}>{o.uren}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1 className="mt-2 text-[26px] leading-tight tracking-tight" style={serif}>
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.brass, color: "#1a1408" }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:grid-cols-4"
        style={{ background: C.line }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.surface }}>
            <p className="text-[11px]" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[16px] font-medium tabular-nums tracking-tight" style={mono}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Fingerprint size={15} aria-hidden="true" style={{ color: C.brass }} />
          <h3 className="text-[14px] font-semibold">Waarom deze match</h3>
        </div>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.ok }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
                  >
                    <Check size={11} aria-hidden="true" style={{ color: C.ok }} />
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
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
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
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Vertrouwenslaag</Kicker>
        <h1 className="mt-2 text-[26px] leading-tight tracking-tight" style={serif}>
          Verificatie & kluis
        </h1>
      </div>

      {/* Trust summary — de held */}
      <Card hi className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-6 p-6">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="34" fill="none" stroke={C.line} strokeWidth="5" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={C.brass}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                transform="rotate(-90 40 40)"
              />
            </svg>
            <ShieldCheck size={26} aria-hidden="true" style={{ color: C.brass }} />
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
              <span className="tabular-nums" style={mono}>
                {verified}
              </span>{" "}
              van{" "}
              <span className="tabular-nums" style={mono}>
                {CREDENTIALS.length}
              </span>{" "}
              credentials geverifieerd ·{" "}
              <span className="tabular-nums" style={mono}>
                {attention}
              </span>{" "}
              vraagt actie
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <span
                className="inline-flex items-center gap-1.5 text-[11.5px]"
                style={{ color: C.muted }}
              >
                <Lock size={12} aria-hidden="true" style={{ color: C.brass }} /> Versleuteld
                opgeslagen
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[11.5px]"
                style={{ color: C.muted }}
              >
                <KeyRound size={12} aria-hidden="true" style={{ color: C.brass }} /> Alleen jij
                &amp; geautoriseerden
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Credential list */}
      <Card>
        <div className="divide-y" style={{ borderColor: C.lineSoft }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            const Icon =
              c.status === "VERIFIED"
                ? FileCheck2
                : c.status === "SUBMITTED"
                  ? Clock
                  : AlertTriangle;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#15233c]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: st.bg, border: `1px solid ${st.line}` }}
                >
                  <Icon size={17} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Badge tone={st}>{st.label}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", Tone & { Icon: LucideIcon }> = {
    warning: {
      label: "",
      fg: C.warn,
      bg: C.warnSoft,
      line: "rgba(224,177,87,0.32)",
      Icon: AlertTriangle,
    },
    info: { label: "", fg: C.brass, bg: C.brassSoft, line: C.brassLine, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-2 text-[26px] leading-tight tracking-tight" style={serif}>
          Volgende acties
        </h1>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Card key={a.titel} className="flex items-start gap-4 p-5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: t.bg, border: `1px solid ${t.line}` }}
              >
                <t.Icon size={17} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#1c2c48] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.ink }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const fallbackTone: Tone = { label: "Concept", fg: C.muted, bg: C.lineSoft, line: C.line };
  const statusTone: Record<string, Tone> = {
    Betaald: { label: "Betaald", fg: C.ok, bg: C.okSoft, line: "rgba(95,192,138,0.32)" },
    Openstaand: { label: "Openstaand", fg: C.warn, bg: C.warnSoft, line: "rgba(224,177,87,0.32)" },
    Concept: fallbackTone,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-2 text-[26px] leading-tight tracking-tight" style={serif}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.brass, color: "#1a1408" }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr
              className="border-b text-[10.5px] uppercase tracking-[0.1em]"
              style={{ borderColor: C.line, color: C.faint }}
            >
              <th className="px-5 py-3 font-medium">Nummer</th>
              <th className="px-5 py-3 font-medium">Klant</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Datum</th>
              <th className="px-5 py-3 text-right font-medium">Bedrag</th>
              <th className="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const st = statusTone[f.status] ?? fallbackTone;
              return (
                <tr
                  key={f.nr}
                  className="border-b transition-colors last:border-0 hover:bg-[#15233c]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                    {f.nr}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                  <td
                    className="hidden px-5 py-3.5 text-[12.5px] sm:table-cell"
                    style={{ color: C.muted, ...mono }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-medium tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Badge tone={st}>{st.label}</Badge>
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
