"use client";

// Concept 25 — "Reliëf" · Neumorphism 2.0 / Soft UI. Zachte, geëxtrudeerde monochrome
// oppervlakken: elk element lijkt uit hetzelfde materiaal geboetseerd met dubbele schaduw
// (licht linksboven, donker rechtsonder) voor outset, inset voor velden/ingedrukt. Verfijnd,
// niet extreem — met een sterk indigo-accent zodat contrast/toegankelijkheid gewaarborgd blijft.
// Palet: bg #e6e9ef, ink #2b3242, muted #7a8296, accent indigo #5b6cf0, succes #3aa676,
// waarschuwing #e08a2e. Schaduw: licht #ffffff, donker rgba(38,50,80,0.18).
// Fonts: Manrope (koppen/UI) + Plus Jakarta Sans (body).

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
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
  FileText,
  MessageSquare,
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
  bg: "#e6e9ef",
  ink: "#2b3242",
  inkSoft: "#4a5468",
  muted: "#7a8296",
  faint: "#9aa2b4",
  accent: "#5b6cf0",
  accentDeep: "#4453d6",
  accentSoft: "rgba(91,108,240,0.12)",
  success: "#3aa676",
  successSoft: "rgba(58,166,118,0.14)",
  warning: "#e08a2e",
  warningSoft: "rgba(224,138,46,0.14)",
  danger: "#d15656",
  dangerSoft: "rgba(209,86,86,0.14)",
};

const head = { fontFamily: "var(--font-lab-manrope)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };

// Neumorfische schaduwen — dubbele bron (licht LB / donker RO).
const OUT = "6px 6px 14px rgba(38,50,80,0.18), -6px -6px 14px #ffffff";
const OUT_SM = "4px 4px 9px rgba(38,50,80,0.16), -4px -4px 9px #ffffff";
const IN = "inset 4px 4px 9px rgba(38,50,80,0.16), inset -4px -4px 9px #ffffff";
const IN_SM = "inset 3px 3px 6px rgba(38,50,80,0.15), inset -3px -3px 6px #ffffff";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageSquare,
};

function statusStyle(s: CredStatus): { label: string; fg: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.success, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accent, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.warning, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.danger, Icon: AlertTriangle };
  }
}

function Sparkline({ data, color = C.accent }: { data: number[]; color?: string }) {
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
  const id = `relief-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
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

// Geëxtrudeerd oppervlak (outset).
function Surface({
  children,
  className = "",
  small = false,
}: {
  children: React.ReactNode;
  className?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] ${className}`}
      style={{ background: C.bg, boxShadow: small ? OUT_SM : OUT }}
    >
      {children}
    </div>
  );
}

// Ingedrukt/ingelaten veld (inset).
function Inset({
  children,
  className = "",
  small = false,
}: {
  children: React.ReactNode;
  className?: string;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] ${className}`}
      style={{ background: C.bg, boxShadow: small ? IN_SM : IN }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.18em]"
      style={{ ...head, color: C.accent }}
    >
      {children}
    </p>
  );
}

export function Concept25() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside className="hidden w-[248px] shrink-0 flex-col px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-1 pb-8">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[16px] text-[17px] font-extrabold text-white"
              style={{ ...head, background: C.accent, boxShadow: OUT_SM }}
            >
              Z
            </div>
            <div>
              <div className="text-[15px] font-extrabold leading-tight" style={head}>
                ZZP Platform
              </div>
              <div className="text-[11px]" style={{ color: C.muted }}>
                Soft workspace
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-3 rounded-[16px] px-3.5 py-2.5 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...head,
                    color: on ? C.accentDeep : C.inkSoft,
                    background: C.bg,
                    boxShadow: on ? IN_SM : OUT_SM,
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-[11px]"
                    style={{
                      background: on ? C.accent : C.bg,
                      boxShadow: on ? "none" : IN_SM,
                    }}
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                      style={{ color: on ? "#ffffff" : C.muted }}
                    />
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6">
            <p
              className="px-1 pb-2 text-[10.5px] font-bold uppercase tracking-[0.16em]"
              style={{ ...head, color: C.faint }}
            >
              Meer
            </p>
            <div className="flex flex-wrap gap-2 px-0.5">
              {NAV.slice(2).map((n) => (
                <span
                  key={n}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ ...head, color: C.muted, boxShadow: OUT_SM }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <Surface small className="flex items-center gap-3 p-3.5">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[13px] font-extrabold text-white"
                style={{ ...head, background: C.accent }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold" style={head}>
                  {PROFIEL.naam}
                </div>
                <div className="truncate text-[11px]" style={{ color: C.muted }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </Surface>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[80px] shrink-0 items-center gap-3 px-6 lg:px-9">
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={14} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-bold" style={{ ...head, color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div
                className="hidden items-center gap-2.5 rounded-full px-4 py-2.5 sm:flex"
                style={{ boxShadow: IN_SM, background: C.bg }}
              >
                <Search size={14} aria-hidden="true" style={{ color: C.faint }} />
                <span className="text-[12.5px]" style={{ color: C.muted }}>
                  Zoeken…
                </span>
              </div>
              <button
                className="relative rounded-full p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 active:shadow-[inset_3px_3px_6px_rgba(38,50,80,0.15),inset_-3px_-3px_6px_#ffffff]"
                style={{ background: C.bg, color: C.muted, boxShadow: OUT_SM }}
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs — segment control (inset) */}
          <div className="px-4 pb-2 lg:hidden">
            <Inset small className="flex gap-1 overflow-x-auto p-1.5">
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    className="shrink-0 rounded-[12px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      ...head,
                      color: on ? C.accentDeep : C.muted,
                      background: on ? C.bg : "transparent",
                      boxShadow: on ? OUT_SM : "none",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </Inset>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-9 lg:py-8">
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
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Kicker>Vandaag</Kicker>
        <h1
          className="mt-2.5 text-[34px] font-extrabold leading-[1.05] tracking-tight"
          style={head}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Drie sterke matches staan klaar en één certificaat vraagt aandacht. Alles rustig geordend
          — jij bepaalt het tempo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Surface key={k.label} className="p-5">
            <p className="text-[12px] font-semibold" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[27px] font-extrabold tabular-nums leading-none tracking-tight"
              style={{ ...head, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
                style={{
                  ...head,
                  color: k.up ? C.success : C.warning,
                  boxShadow: IN_SM,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.accent : C.warning} />
            </div>
          </Surface>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-7 lg:col-span-2">
          <div>
            <div className="mb-4 flex items-baseline justify-between px-1">
              <h2 className="text-[19px] font-extrabold tracking-tight" style={head}>
                Beste matches voor jou
              </h2>
              <span className="text-[11.5px] font-semibold" style={{ color: C.muted }}>
                Verklaarbaar gesorteerd
              </span>
            </div>
            <Surface className="p-3">
              <div className="flex flex-col gap-2.5">
                {OPDRACHTEN.map((o) => (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 rounded-[16px] px-4 py-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2"
                    style={{ boxShadow: OUT_SM, background: C.bg }}
                  >
                    <span
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold tabular-nums"
                      style={{
                        ...head,
                        color: C.accentDeep,
                        boxShadow: IN_SM,
                        backgroundImage: `conic-gradient(${C.accent} ${o.match}%, transparent 0)`,
                      }}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ background: C.bg, boxShadow: OUT_SM }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold" style={head}>
                        {o.titel}
                      </span>
                      <span className="block truncate text-[12px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span
                      className="hidden text-[12.5px] font-bold tabular-nums sm:block"
                      style={{ ...head, color: C.accentDeep }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                ))}
              </div>
            </Surface>
          </div>

          <div>
            <div className="mb-4 flex items-baseline justify-between px-1">
              <h2 className="text-[19px] font-extrabold tracking-tight" style={head}>
                Recente berichten
              </h2>
              <span className="text-[11.5px] font-bold" style={{ ...head, color: C.accent }}>
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <Surface className="p-3">
              <div className="flex flex-col gap-1">
                {BERICHTEN.map((b) => (
                  <div key={b.van} className="flex items-center gap-3.5 rounded-[16px] px-3.5 py-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[11px] font-extrabold"
                      style={{
                        ...head,
                        color: b.ongelezen ? "#ffffff" : C.muted,
                        background: b.ongelezen ? C.accent : C.bg,
                        boxShadow: b.ongelezen ? OUT_SM : IN_SM,
                      }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-bold" style={head}>
                          {b.van}
                        </p>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.accent }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="truncate text-[12px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>

        <div className="space-y-7">
          <div>
            <h2 className="mb-4 px-1 text-[19px] font-extrabold tracking-tight" style={head}>
              Jouw certificaten
            </h2>
            <Surface className="p-5">
              <div className="space-y-4">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                        style={{ boxShadow: IN_SM, background: C.bg }}
                        aria-hidden="true"
                      >
                        <st.Icon size={15} style={{ color: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold" style={head}>
                          {c.naam}
                        </p>
                        <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>
          </div>

          {/* Volgende beste stap */}
          <Surface className="overflow-hidden p-6" small>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...head, color: C.accent }}
            >
              Volgende beste stap
            </p>
            <p className="mt-2.5 text-[16px] font-extrabold leading-snug" style={head}>
              {primair.titel}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <button
              className="mt-4 w-full rounded-full px-4 py-3 text-[13px] font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-2 active:brightness-95"
              style={{ ...head, background: C.accent, boxShadow: OUT_SM }}
            >
              {primair.cta}
            </button>
          </Surface>
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
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={head}>
          Open opdrachten
        </h1>
      </div>

      <Inset className="flex items-center gap-3 px-5 py-4">
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9aa2b4]"
          style={{ color: C.ink }}
        />
      </Inset>

      {filtered.length === 0 ? (
        <Surface className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[20px]"
            style={{ boxShadow: IN, background: C.bg }}
          >
            <Search size={26} aria-hidden="true" style={{ color: C.faint }} />
          </div>
          <p className="mt-4 text-[18px] font-extrabold" style={head}>
            Niets gevonden
          </p>
          <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekwoorden aan of verbreed je beschikbaarheid. We laten het je weten zodra er
            iets passends binnenkomt.
          </p>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-[22px] p-5 text-left transition-all hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.bg, boxShadow: OUT }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[10.5px] font-semibold tracking-wide"
                  style={{ color: C.faint }}
                >
                  {o.id}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold tabular-nums"
                  style={{ ...head, color: C.accentDeep, boxShadow: IN_SM }}
                >
                  {o.match}% match
                </span>
              </div>
              <p className="mt-3 text-[17px] font-extrabold leading-snug" style={head}>
                {o.titel}
              </p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{ color: C.inkSoft, boxShadow: OUT_SM }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-[12.5px]">
                <span
                  className="font-extrabold tabular-nums"
                  style={{ ...head, color: C.accentDeep }}
                >
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ color: C.muted }}>
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
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1
            className="mt-2.5 text-[28px] font-extrabold leading-tight tracking-tight"
            style={head}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-full px-6 py-3 text-[13.5px] font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-2 active:brightness-95"
          style={{ ...head, background: C.accent, boxShadow: OUT }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Surface key={m.l} small className="p-4">
            <p className="text-[11px] font-semibold" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[17px] font-extrabold tabular-nums tracking-tight"
              style={{ ...head, color: C.ink }}
            >
              {m.v}
            </p>
          </Surface>
        ))}
      </div>

      <Surface className="p-6">
        <h3 className="text-[19px] font-extrabold" style={head}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Inset className="p-5">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ ...head, color: C.success }}
            >
              Pluspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.success }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Inset>
          <Inset className="p-5">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ ...head, color: C.warning }}
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
                    style={{ background: C.warningSoft }}
                    aria-hidden="true"
                  >
                    <Minus size={12} style={{ color: C.warning }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Inset>
        </div>
      </Surface>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={head}>
          Verificatie
        </h1>
      </div>

      <Surface className="flex items-center gap-5 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px]"
          style={{ background: C.accent, boxShadow: OUT }}
        >
          <ShieldCheck size={28} aria-hidden="true" className="text-white" />
        </div>
        <div>
          <p className="text-[22px] font-extrabold" style={head}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="font-bold tabular-nums">{verified}</span> van{" "}
            <span className="font-bold tabular-nums">{CREDENTIALS.length}</span> certificaten
            volledig geverifieerd · 1 vraagt actie · alles veilig bewaard.
          </p>
        </div>
      </Surface>

      <Surface className="p-3">
        <div className="flex flex-col gap-2.5">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 rounded-[16px] px-4 py-3.5"
                style={{ boxShadow: OUT_SM, background: C.bg }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
                  style={{ boxShadow: IN_SM, background: C.bg }}
                >
                  <st.Icon size={18} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold" style={head}>
                    {c.naam}
                  </p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold"
                  style={{ ...head, color: st.fg, boxShadow: IN_SM }}
                >
                  <st.Icon size={12} aria-hidden="true" />
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Surface>

      <div>
        <h2 className="mb-4 px-1 text-[19px] font-extrabold tracking-tight" style={head}>
          Veilig bewaarde documenten
        </h2>
        <Surface className="p-3">
          <div className="flex flex-col gap-1">
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div key={d.naam} className="flex items-center gap-3.5 rounded-[16px] px-4 py-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                    style={{ boxShadow: IN_SM, background: C.bg }}
                    aria-hidden="true"
                  >
                    <FileText size={16} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold" style={head}>
                      {d.naam}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                    style={{ ...head, color: st.fg, boxShadow: IN_SM }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; Icon: LucideIcon }> = {
    warning: { fg: C.warning, Icon: AlertTriangle },
    info: { fg: C.accent, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={head}>
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
          Eén ding tegelijk. Wij houden de rest voor je in de gaten.
        </p>
      </div>
      <div className="space-y-4">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Surface key={a.titel} className="flex items-start gap-4 p-5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px]"
                style={{ boxShadow: IN_SM, background: C.bg }}
              >
                <t.Icon size={20} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-extrabold" style={head}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 active:brightness-95"
                style={{ ...head, color: C.accentDeep, boxShadow: OUT_SM }}
              >
                {a.cta}
              </button>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const tone: Record<string, string> = {
    Betaald: C.success,
    Openstaand: C.warning,
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={head}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[12.5px] font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-2 active:brightness-95"
          style={{ ...head, background: C.accent, boxShadow: OUT }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Surface className="p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] uppercase tracking-[0.1em]"
                style={{ ...head, color: C.muted }}
              >
                <th className="px-4 py-3 font-bold">Nummer</th>
                <th className="px-4 py-3 font-bold">Klant</th>
                <th className="px-4 py-3 font-bold">Datum</th>
                <th className="px-4 py-3 text-right font-bold">Bedrag</th>
                <th className="px-4 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const fg = tone[f.status] ?? C.muted;
                return (
                  <tr key={f.nr}>
                    <td
                      className="px-4 py-3.5 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold">{f.klant}</td>
                    <td
                      className="px-4 py-3.5 text-[12.5px] tabular-nums"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-extrabold tabular-nums"
                      style={{ ...head, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold"
                        style={{ ...head, color: fg, boxShadow: IN_SM }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: fg }}
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
      </Surface>
    </div>
  );
}
