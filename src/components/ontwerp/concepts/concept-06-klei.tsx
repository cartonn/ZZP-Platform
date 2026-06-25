"use client";

// Concept 06 — "Klei" · Zacht 3D / claymorphism (LICHT, tactiel).
// Zachte klei / neumorfe diepte. Warm gebroken-wit canvas, rounded-3xl "puffy" kaarten met
// dubbele zachte schaduw (lichte highlight links-boven + zachte drop rechts-onder) voor
// tactiele diepte, zachte inset invoervelden, stevige vriendelijke pill-knoppen, alles rond.
// Warm speels accent (koraal). Uitnodigend, tactiel, dopamine-adjacent maar smaakvol.
// Palet: canvas #efeae3, surface #f6f2ec, ink #3a3530, accent koraal #ff6b5e, mint #4fb39a.
// Fonts: Plus Jakarta Sans (display/UI) + Manrope (body) + JetBrains Mono (cijfers).

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
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Command,
  Smile,
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
  canvas: "#efeae3",
  surface: "#f6f2ec",
  surfaceWarm: "#f2ece4",
  ink: "#3a3530",
  inkSoft: "#6b635b",
  muted: "#938a80",
  accent: "#ff6b5e",
  accentDeep: "#ee5949",
  accentSoft: "#ffe4df",
  mint: "#3fa088",
  mintSoft: "#dcf0ea",
  amber: "#d99b2e",
  amberSoft: "#fbeed2",
};

// Puffy claymorphism: lichte highlight links-boven + zachte drop rechts-onder.
const CLAY =
  "8px 8px 20px -8px rgba(160,148,134,0.55), -8px -8px 18px -10px rgba(255,255,255,0.95)";
const CLAY_SM =
  "5px 5px 13px -7px rgba(160,148,134,0.5), -5px -5px 12px -8px rgba(255,255,255,0.9)";
// Ingedrukt / inset (invoervelden, actieve nav).
const INSET =
  "inset 4px 4px 10px -6px rgba(160,148,134,0.6), inset -4px -4px 10px -6px rgba(255,255,255,0.9)";

const ui = { fontFamily: "var(--font-lab-jakarta)" };
const body = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

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

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.mint, bg: C.mintSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accentDeep, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.accentDeep, bg: C.accentSoft };
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 26;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept06() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside className="hidden w-[252px] shrink-0 flex-col px-5 py-6 md:flex">
          <div className="flex items-center gap-3 px-1 pb-8">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-[16px] font-extrabold text-white"
              style={{ background: C.accent, boxShadow: CLAY_SM, ...ui }}
            >
              Z
            </div>
            <div>
              <div className="text-[14px] font-extrabold leading-tight" style={ui}>
                ZZP Platform
              </div>
              <div className="text-[11px]" style={{ color: C.muted }}>
                Fijn dat je er bent
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[13px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.accentDeep : C.inkSoft,
                    background: on ? C.surface : "transparent",
                    boxShadow: on ? INSET : "none",
                  }}
                >
                  <Icon size={18} aria-hidden="true" style={{ color: on ? C.accent : C.muted }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="flex items-center gap-3 rounded-3xl px-4 py-3.5"
              style={{ background: C.surface, boxShadow: CLAY_SM }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-extrabold text-white"
                style={{ background: C.mint, ...mono }}
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
          {/* Topbar */}
          <header className="flex h-[76px] shrink-0 items-center gap-3 px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.muted }} />
              <span className="font-bold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 active:scale-95"
                style={{ background: C.surface, color: C.inkSoft, boxShadow: CLAY_SM }}
                aria-label="Zoeken openen"
              >
                <Search size={15} aria-hidden="true" style={{ color: C.muted }} />
                <span>Zoeken…</span>
                <kbd
                  className="flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[10px]"
                  style={{ background: C.surfaceWarm, color: C.muted, boxShadow: INSET, ...mono }}
                >
                  <Command size={9} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded-2xl p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 active:scale-95"
                style={{ background: C.surface, color: C.inkSoft, boxShadow: CLAY_SM }}
                aria-label="Meldingen"
              >
                <Bell size={17} aria-hidden="true" style={{ color: C.muted }} />
                <span
                  className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2"
                  style={{ background: C.accent, borderColor: C.surface }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-2xl px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.accentDeep : C.inkSoft,
                    background: C.surface,
                    boxShadow: on ? INSET : CLAY_SM,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-8 lg:py-9">
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

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-extrabold uppercase tracking-[0.16em]"
      style={{ color: C.accent, ...ui }}
    >
      {children}
    </p>
  );
}

function Clay({
  children,
  className = "",
  inset = false,
}: {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{ background: C.surface, boxShadow: inset ? INSET : CLAY }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Kicker>Vandaag</Kicker>
        <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] tracking-tight" style={ui}>
          Hoi {PROFIEL.naam.split(" ")[0]}, fijn dat je er bent!
        </h1>
        <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Drie sterke matches staan voor je klaar en één certificaat vraagt even je aandacht. Tik
          erop en je bent zo weer bij.
        </p>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Clay key={k.label} className="p-5">
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[27px] font-extrabold tabular-nums leading-none tracking-tight"
              style={{ ...ui, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
                style={{
                  color: k.up ? C.mint : C.accentDeep,
                  background: k.up ? C.mintSoft : C.accentSoft,
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
              <Sparkline data={k.spark} color={k.up ? C.mint : C.accent} />
            </div>
          </Clay>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3.5 px-1 text-[16px] font-extrabold tracking-tight" style={ui}>
            Beste matches voor jou
          </h2>
          <div className="space-y-3.5">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-all hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99]"
                style={{ background: C.surface, boxShadow: CLAY_SM }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[13px] font-extrabold tabular-nums text-white"
                  style={{ background: C.accent, ...mono }}
                >
                  {o.match}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
                <span
                  className="hidden text-[12.5px] font-bold tabular-nums sm:block"
                  style={{ color: C.inkSoft, ...mono }}
                >
                  {o.tarief.replace(" / uur", "")}
                </span>
                <ChevronRight size={18} aria-hidden="true" style={{ color: C.muted }} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3.5 px-1 text-[16px] font-extrabold tracking-tight" style={ui}>
            Jouw certificaten
          </h2>
          <Clay className="p-5">
            <div className="space-y-4">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: st.bg }}
                      aria-hidden="true"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: st.fg }} />
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
          </Clay>
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
        <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight" style={ui}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-3xl px-5 py-3.5"
        style={{ background: C.surfaceWarm, boxShadow: INSET }}
      >
        <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#938a80]"
          style={{ color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <Clay className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{ background: C.accentSoft, boxShadow: CLAY_SM }}
          >
            <Smile size={28} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <p className="mt-4 text-[16px] font-extrabold" style={ui}>
            Niets gevonden — geen zorgen
          </p>
          <p className="mt-1.5 max-w-sm text-[13px]" style={{ color: C.muted }}>
            Pas je zoekwoorden aan of verbreed je beschikbaarheid. We tikken je op de schouder zodra
            er iets passends binnenkomt.
          </p>
        </Clay>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-3xl p-5 text-left transition-all hover:translate-y-[-3px] focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99]"
              style={{ background: C.surface, boxShadow: CLAY }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[10.5px] font-bold tracking-wide"
                  style={{ color: C.muted, ...mono }}
                >
                  {o.id}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-extrabold tabular-nums"
                  style={{ background: C.mintSoft, color: C.mint, ...mono }}
                >
                  {o.match}% match
                </span>
              </div>
              <p className="mt-3 text-[16px] font-extrabold leading-snug" style={ui}>
                {o.titel}
              </p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: C.muted }}
              >
                <MapPin size={13} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-3 py-1 text-[10.5px] font-bold"
                    style={{ background: C.surfaceWarm, color: C.inkSoft, boxShadow: INSET }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between pt-4 text-[12.5px]"
                style={{ borderTop: `1px solid ${C.canvas}` }}
              >
                <span className="font-extrabold tabular-nums" style={{ color: C.ink, ...mono }}>
                  {o.tarief}
                </span>
                <span className="font-bold tabular-nums" style={{ color: C.muted, ...mono }}>
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
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight" style={ui}>
            {opdracht.titel}
          </h1>
          <p
            className="mt-2 flex items-center gap-1.5 text-[13px] font-medium"
            style={{ color: C.muted }}
          >
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-2xl px-6 py-3 text-[13.5px] font-extrabold text-white transition-all hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 active:scale-95"
          style={{ background: C.accent, boxShadow: CLAY_SM }}
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
          <Clay key={m.l} className="p-4">
            <p className="text-[11px] font-medium" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-extrabold tabular-nums tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </p>
          </Clay>
        ))}
      </div>

      <Clay className="p-6">
        <h3 className="text-[16px] font-extrabold" style={ui}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Helder onderbouwd op basis van jouw profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl p-5" style={{ background: C.surfaceWarm, boxShadow: INSET }}>
            <p
              className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: C.mint }}
            >
              Pluspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] font-medium">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: C.mint }}
                    aria-hidden="true"
                  >
                    <Check size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-5" style={{ background: C.surfaceWarm, boxShadow: INSET }}>
            <p
              className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberSoft }}
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
      </Clay>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight" style={ui}>
          Verificatie
        </h1>
      </div>

      <Clay className="flex items-center gap-5 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl"
          style={{ background: C.mintSoft, boxShadow: CLAY_SM }}
        >
          <ShieldCheck size={30} aria-hidden="true" style={{ color: C.mint }} />
        </div>
        <div>
          <p className="text-[18px] font-extrabold" style={ui}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px] font-medium" style={{ color: C.inkSoft }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            certificaten volledig geverifieerd · <span style={mono}>1</span> vraagt je aandacht
          </p>
        </div>
      </Clay>

      <div className="space-y-3.5">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 rounded-3xl p-4"
              style={{ background: C.surface, boxShadow: CLAY_SM }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: st.bg }}
              >
                {c.status === "VERIFIED" ? (
                  <Check size={20} aria-hidden="true" style={{ color: st.fg }} />
                ) : c.status === "SUBMITTED" ? (
                  <Clock size={20} aria-hidden="true" style={{ color: st.fg }} />
                ) : (
                  <AlertTriangle size={20} aria-hidden="true" style={{ color: st.fg }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-extrabold"
                style={{ color: st.fg, background: st.bg }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
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
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight" style={ui}>
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px] font-medium" style={{ color: C.inkSoft }}>
          Klein lijstje, groot effect. Tik er een af en je staat er weer fris voor.
        </p>
      </div>
      <div className="space-y-3.5">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 rounded-3xl p-5"
              style={{ background: C.surface, boxShadow: CLAY_SM }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: t.bg }}
              >
                <t.Icon size={21} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-2xl px-4 py-2 text-[12.5px] font-extrabold transition-all hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 active:scale-95"
                style={{ background: C.accentSoft, color: C.accentDeep }}
              >
                {a.cta}
              </button>
            </div>
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
    Concept: { fg: C.muted, bg: C.surfaceWarm },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight" style={ui}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[12.5px] font-extrabold text-white transition-all hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 active:scale-95"
          style={{ background: C.accent, boxShadow: CLAY_SM }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Clay className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.muted }}
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
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.surfaceWarm };
                return (
                  <tr key={f.nr}>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold">{f.klant}</td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-extrabold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-extrabold"
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
      </Clay>
    </div>
  );
}
