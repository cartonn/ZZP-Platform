"use client";

// Concept 12 — "Glas" · Glasmorfisme 2.0 met echte diepte.
// Translucente panelen (backdrop-blur), laag-op-laag hiërarchie boven een levendig maar
// bewaakt verloop. Legibiliteit gaat vóór effect: elk glasvlak krijgt genoeg opaciteit en een
// subtiele witte binnenrand zodat tekst altijd scherp leesbaar blijft.
// Palet: canvas #eef1fb (met mesh-verloop), glas wit-translucent, ink #191a2e,
// accent violet #6d5cf5, mint #22b8a6, roze #ec5f9b, amber #e0952b.
// Fonts: Bricolage Grotesque (display) + Inter (body) + JetBrains Mono (cijfers).

import { useState } from "react";
import {
  LayoutDashboard,
  Compass,
  FileText,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Sparkles,
  Layers,
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
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  ink: "#191a2e",
  inkSoft: "#41435f",
  muted: "#6a6d8c",
  faint: "#9698b8",
  accent: "#6d5cf5",
  accentDeep: "#5646e0",
  accentSoft: "rgba(109,92,245,0.14)",
  mint: "#159e8d",
  mintSoft: "rgba(34,184,166,0.16)",
  pink: "#d94b87",
  pinkSoft: "rgba(236,95,155,0.16)",
  amber: "#c47d18",
  amberSoft: "rgba(224,149,43,0.18)",
  glassLine: "rgba(255,255,255,0.65)",
  glassLineSoft: "rgba(255,255,255,0.4)",
  divider: "rgba(25,26,46,0.08)",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Gelaagde glas-oppervlakken. Twee dieptes: floating (chrome) en surface (content).
const GLASS = {
  background: "rgba(255,255,255,0.62)",
  border: `1px solid ${C.glassLine}`,
  boxShadow: "0 20px 50px -24px rgba(48,40,120,0.42), inset 0 1px 0 rgba(255,255,255,0.7)",
};
const GLASS_SOFT = {
  background: "rgba(255,255,255,0.44)",
  border: `1px solid ${C.glassLineSoft}`,
  boxShadow: "0 12px 32px -20px rgba(48,40,120,0.34), inset 0 1px 0 rgba(255,255,255,0.55)",
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.mint, bg: C.mintSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accentDeep, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.pink, bg: C.pinkSoft };
  }
}

function Sparkline({ data, color = C.accent }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polygon points={area} fill={color} opacity={0.14} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Kicker({ children, color = C.accentDeep }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
      {children}
    </p>
  );
}

function Glass({
  children,
  className = "",
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div className={`rounded-3xl backdrop-blur-2xl ${className}`} style={soft ? GLASS_SOFT : GLASS}>
      {children}
    </div>
  );
}

export function Concept12() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: "#eef1fb" }}
    >
      {/* Bewaakt mesh-verloop als achtergrondlaag */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(720px 460px at 6% -6%, rgba(109,92,245,0.42), transparent 60%), radial-gradient(680px 520px at 96% 2%, rgba(236,95,155,0.32), transparent 58%), radial-gradient(760px 560px at 78% 106%, rgba(34,184,166,0.30), transparent 58%), radial-gradient(600px 500px at 24% 112%, rgba(224,149,43,0.22), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-[680px] gap-0 p-3 sm:p-4 lg:gap-4 lg:p-5">
        {/* Sidebar — zwevend glaspaneel */}
        <aside
          className="hidden w-[248px] shrink-0 flex-col rounded-[28px] px-4 py-6 backdrop-blur-2xl lg:flex"
          style={GLASS}
        >
          <div className="flex items-center gap-3 px-3 pb-8">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[15px] font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                boxShadow: "0 8px 20px -8px rgba(109,92,245,0.7)",
                ...display,
              }}
            >
              Z
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight" style={display}>
                ZZP Platform
              </div>
              <div className="text-[11px]" style={{ color: C.muted }}>
                Helder & gelaagd
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: on ? C.accentDeep : C.inkSoft,
                    background: on ? "rgba(255,255,255,0.85)" : "transparent",
                    border: `1px solid ${on ? C.glassLine : "transparent"}`,
                    boxShadow: on ? "0 8px 20px -14px rgba(48,40,120,0.5)" : "none",
                  }}
                >
                  <Icon size={17} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 px-2">
            <p
              className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.faint }}
            >
              Snel naar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NAV.slice(2).map((n) => (
                <span
                  key={n}
                  className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    color: C.muted,
                    border: `1px solid ${C.glassLineSoft}`,
                  }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <div
              className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
              style={{
                background: "rgba(255,255,255,0.55)",
                border: `1px solid ${C.glassLineSoft}`,
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-[12px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.mint}, ${C.accent})`, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.muted }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar — glas-chrome */}
          <header
            className="flex h-[64px] shrink-0 items-center gap-3 rounded-[24px] px-5 backdrop-blur-2xl"
            style={GLASS}
          >
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
              <Layers size={15} aria-hidden="true" style={{ color: C.accent }} />
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-bold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-2xl px-4 py-2 text-[12.5px] transition-all hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  color: C.muted,
                  border: `1px solid ${C.glassLineSoft}`,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoeken…</span>
              </button>
              <button
                className="relative rounded-2xl p-2.5 transition-all hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  color: C.muted,
                  border: `1px solid ${C.glassLineSoft}`,
                }}
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                  style={{ background: C.pink }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.accentDeep : C.muted,
                    background: on ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${on ? C.glassLine : C.glassLineSoft}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="mt-3 flex-1 overflow-y-auto lg:mt-4">
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

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-6 pb-2">
      <div>
        <Kicker>Vandaag</Kicker>
        <h1
          className="mt-3 text-[34px] font-extrabold leading-[1.05] tracking-tight"
          style={display}
        >
          Hallo {PROFIEL.naam.split(" ")[0]}, alles ligt helder voor je klaar.
        </h1>
        <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Drie sterke matches, één certificaat dat aandacht vraagt en twee ongelezen berichten. Alle
          lagen op één plek.
        </p>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Glass key={k.label} className="p-5">
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[27px] font-extrabold tabular-nums leading-none tracking-tight"
              style={display}
            >
              {k.value}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{
                  color: k.up ? C.mint : C.pink,
                  background: k.up ? C.mintSoft : C.pinkSoft,
                  ...mono,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.accent : C.pink} />
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-[17px] font-bold tracking-tight" style={display}>
                Beste matches
              </h2>
              <span className="text-[11.5px]" style={{ color: C.muted }}>
                Verklaarbaar gesorteerd
              </span>
            </div>
            <Glass className="p-2.5">
              <div className="flex flex-col gap-1.5">
                {OPDRACHTEN.map((o) => (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold tabular-nums text-white"
                      style={{
                        background: `linear-gradient(140deg, ${C.accent}, ${C.pink})`,
                        ...mono,
                      }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] font-medium tabular-nums sm:block"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                ))}
              </div>
            </Glass>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-[17px] font-bold tracking-tight" style={display}>
                Berichten
              </h2>
              <span className="text-[11.5px] font-semibold" style={{ color: C.accentDeep }}>
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <Glass soft className="p-2.5">
              <div className="flex flex-col gap-1">
                {BERICHTEN.map((b) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 rounded-2xl px-4 py-3 transition-colors hover:bg-white/50"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
                      style={{ background: b.ongelezen ? C.accent : C.faint, ...mono }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-bold">{b.van}</p>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.pink }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="truncate text-[12px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11px] tabular-nums"
                      style={{ color: C.faint, ...mono }}
                    >
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-3 px-1">
              <h2 className="text-[17px] font-bold tracking-tight" style={display}>
                Certificaten
              </h2>
            </div>
            <Glass className="p-5">
              <div className="space-y-4">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: st.bg }}
                        aria-hidden="true"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold">{c.naam}</p>
                        <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Glass>
          </div>

          <Glass className="overflow-hidden p-0">
            <div
              className="px-5 py-4"
              style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.pink})` }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">
                Volgende beste stap
              </p>
              <p
                className="mt-1.5 text-[15px] font-extrabold leading-snug text-white"
                style={display}
              >
                {primair.titel}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-3.5 w-full rounded-2xl px-4 py-2.5 text-[12.5px] font-bold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.accent }}
              >
                {primair.cta}
              </button>
            </div>
          </Glass>
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
    <div className="space-y-6 pb-2">
      <div>
        <Kicker color={C.mint}>Marktplaats</Kicker>
        <h1
          className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight"
          style={display}
        >
          Open opdrachten
        </h1>
      </div>

      <Glass className="flex items-center gap-3 px-5 py-3.5">
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9698b8]"
          style={{ color: C.ink }}
        />
      </Glass>

      {filtered.length === 0 ? (
        <Glass className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-3xl"
            style={{ background: C.accentSoft }}
          >
            <Sparkles size={24} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <p className="mt-4 text-[17px] font-bold" style={display}>
            Geen resultaten
          </p>
          <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekwoorden aan of verbreed je beschikbaarheid. We laten het je weten zodra er
            iets passends binnenkomt.
          </p>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-3xl p-5 text-left backdrop-blur-2xl transition-all hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2"
              style={GLASS}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10.5px] tracking-wide" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
                  style={{ background: C.mintSoft, color: C.mint, ...mono }}
                >
                  {o.match}% match
                </span>
              </div>
              <p className="mt-3 text-[16px] font-bold leading-snug" style={display}>
                {o.titel}
              </p>
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
                    className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.55)",
                      color: C.inkSoft,
                      border: `1px solid ${C.glassLineSoft}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between pt-4 text-[12.5px]"
                style={{ borderTop: `1px solid ${C.divider}` }}
              >
                <span className="font-bold tabular-nums" style={{ color: C.accentDeep, ...mono }}>
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ color: C.muted, ...mono }}>
                  {o.uren}
                </span>
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
    <div className="space-y-6 pb-2">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1
            className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight"
            style={display}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-2xl px-6 py-3 text-[13.5px] font-bold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            boxShadow: "0 12px 26px -12px rgba(109,92,245,0.6)",
          }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Glass key={m.l} className="p-4">
            <p className="text-[11px]" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-bold tabular-nums tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </p>
          </Glass>
        ))}
      </div>

      <Glass className="p-6">
        <h3 className="text-[17px] font-bold" style={display}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel — niets verborgen.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            className="rounded-2xl p-5"
            style={{ background: C.mintSoft, border: `1px solid ${C.glassLineSoft}` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.mint }}
            >
              Pluspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.mint }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: C.amberSoft, border: `1px solid ${C.glassLineSoft}` }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(224,149,43,0.28)" }}
                    aria-hidden="true"
                  >
                    <Minus size={12} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Glass>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6 pb-2">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1
          className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight"
          style={display}
        >
          Verificatie
        </h1>
      </div>

      <Glass className="flex items-center gap-5 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl"
          style={{ background: C.mintSoft }}
        >
          <ShieldCheck size={28} aria-hidden="true" style={{ color: C.mint }} />
        </div>
        <div>
          <p className="text-[19px] font-extrabold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            certificaten volledig geverifieerd · <span style={mono}>1</span> vraagt om actie. Alles
            veilig bewaard.
          </p>
        </div>
      </Glass>

      <Glass className="p-2.5">
        <div className="flex flex-col gap-1.5">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-white/50"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: st.bg }}
                >
                  {c.status === "VERIFIED" ? (
                    <Check size={18} aria-hidden="true" style={{ color: st.fg }} />
                  ) : c.status === "SUBMITTED" ? (
                    <Clock size={18} aria-hidden="true" style={{ color: st.fg }} />
                  ) : (
                    <AlertTriangle size={18} aria-hidden="true" style={{ color: st.fg }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{ color: st.fg, background: st.bg }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Glass>

      {/* Documenten */}
      <div>
        <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight" style={display}>
          Veilig bewaarde documenten
        </h2>
        <Glass soft className="p-2.5">
          <div className="flex flex-col gap-1">
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 rounded-2xl px-4 py-3 transition-colors hover:bg-white/50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.6)",
                      border: `1px solid ${C.glassLineSoft}`,
                    }}
                    aria-hidden="true"
                  >
                    <FileText size={16} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{d.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted, ...mono }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Glass>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.accentDeep, bg: C.accentSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-2">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1
          className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight"
          style={display}
        >
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
          Eén ding tegelijk. Wij houden de rest voor je in de gaten.
        </p>
      </div>
      <div className="space-y-3.5">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Glass key={a.titel} className="flex items-start gap-4 p-5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: t.bg }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-2xl px-4 py-2 text-[12.5px] font-bold transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.accentSoft, color: C.accentDeep }}
              >
                {a.cta}
              </button>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.mint, bg: C.mintSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: "rgba(255,255,255,0.5)" },
  };
  return (
    <div className="space-y-6 pb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1
            className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[12.5px] font-bold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            boxShadow: "0 12px 26px -12px rgba(109,92,245,0.6)",
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] uppercase tracking-[0.1em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.divider}` }}
              >
                <th className="px-5 py-3.5 font-bold">Nummer</th>
                <th className="px-5 py-3.5 font-bold">Klant</th>
                <th className="px-5 py-3.5 font-bold">Datum</th>
                <th className="px-5 py-3.5 text-right font-bold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: "rgba(255,255,255,0.5)" };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-white/45"
                    style={{ borderTop: `1px solid ${C.divider}` }}
                  >
                    <td className="px-5 py-4 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold">{f.klant}</td>
                    <td className="px-5 py-4 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold"
                        style={{ color: t.fg, background: t.bg }}
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
      </Glass>
    </div>
  );
}
