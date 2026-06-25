"use client";

// Concept 07 — "Puls" · Dopamine kleurblok (LIGHT/bold, kinetic).
// Bold FLAT color-blocking met een dopamine-palet: grote verzadigde solide kleurvlakken
// (electric blue, magenta, lime als rol-/sectiecodering) op wit, zware bold headings,
// kinetische progress-bars en hover-microinteracties. Zelfverzekerd, modern, Swiss-meets-bold —
// geen gradients, geen mesh: VLAKKE blokken, luide kleur op rustige layout.
// Palet: paper #ffffff, ink #0a0a0f, blue #2547ff, magenta #ff2d8e, lime #c6f24e, amber #ff9d2e.
// Fonts: Space Grotesk (display) + Inter (UI).

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
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Command,
  Zap,
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
  paper: "#ffffff",
  panel: "#f5f5f3",
  ink: "#0a0a0f",
  inkSoft: "#3d3d47",
  muted: "#6b6b76",
  faint: "#9a9aa3",
  line: "#e7e7e3",
  lineHard: "#0a0a0f",
  blue: "#2547ff",
  blueSoft: "#e9edff",
  magenta: "#ff2d8e",
  magentaSoft: "#ffe6f1",
  lime: "#c6f24e",
  limeInk: "#1f2a00",
  amber: "#ff9d2e",
  amberSoft: "#fff0dd",
  green: "#0f9d58",
  greenSoft: "#e2f6ea",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const display = { fontFamily: "var(--font-lab-space)" };

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

// Per-nav accentkleur — kleurcodering als navigatietaal.
const NAV_ACCENT: Record<ScreenKey, string> = {
  dashboard: C.blue,
  marktplaats: C.magenta,
  opdracht: C.blue,
  verificatie: C.green,
  acties: C.amber,
  facturen: C.ink,
  documenten: C.muted,
  berichten: C.muted,
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  dot: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, bg: C.greenSoft, dot: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.blue, bg: C.blueSoft, dot: C.blue };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#b56a00", bg: C.amberSoft, dot: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.magenta, bg: C.magentaSoft, dot: C.magenta };
  }
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.line }}
      role="presentation"
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * h;
    return { x, y };
  });
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1] ?? { x: w, y: h };
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r={2.6} fill={color} />
    </svg>
  );
}

export function Concept07() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.paper, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[236px] shrink-0 flex-col border-r px-4 py-6 md:flex"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-center gap-3 px-2 pb-9">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold text-white"
              style={{ background: C.blue, ...display }}
            >
              Z
            </div>
            <div className="leading-none">
              <div className="text-[14px] font-bold tracking-tight" style={display}>
                ZZP
              </div>
              <div
                className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: C.faint }}
              >
                Platform
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              const ac = NAV_ACCENT[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? "#fff" : C.inkSoft,
                    background: on ? ac : "transparent",
                  }}
                >
                  <Icon
                    size={17}
                    aria-hidden="true"
                    style={{ color: on ? "#fff" : ac }}
                    className="transition-transform group-hover:scale-110"
                  />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ border: `1.5px solid ${C.lineHard}` }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                style={{ background: C.magenta }}
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
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-6"
            style={{ borderColor: C.line }}
          >
            <div className="flex items-baseline gap-2">
              <h2 className="text-[18px] font-bold tracking-tight" style={display}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: NAV_ACCENT[screen] }}
                aria-hidden="true"
              />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#f5f5f3] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1.5px solid ${C.line}`, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
                <kbd
                  className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: C.ink, color: "#fff" }}
                >
                  <Command size={9} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded-xl p-2.5 transition-colors hover:bg-[#f5f5f3] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1.5px solid ${C.line}`, color: C.ink }}
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white"
                  style={{ background: C.magenta }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-2 overflow-x-auto border-b px-4 py-2.5 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const ac = NAV_ACCENT[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? "#fff" : C.inkSoft,
                    background: on ? ac : C.panel,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
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

function Kicker({ children, color = C.blue }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
      {children}
    </p>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.blue, C.magenta, C.green, C.amber];
  return (
    <div className="mx-auto max-w-6xl space-y-9">
      {/* Hero kleurblok */}
      <div
        className="relative overflow-hidden rounded-3xl p-7"
        style={{ background: C.ink, color: "#fff" }}
      >
        <span
          className="absolute -right-10 -top-10 h-44 w-44 rounded-3xl"
          style={{ background: C.blue, opacity: 0.9 }}
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-16 right-24 h-40 w-40 rounded-full"
          style={{ background: C.magenta, opacity: 0.55 }}
          aria-hidden="true"
        />
        <div className="relative">
          <Kicker color={C.lime}>Vandaag</Kicker>
          <h1
            className="mt-3 max-w-xl text-[38px] font-bold leading-[1.02] tracking-tight"
            style={display}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: "#c9c9d1" }}>
            Drie matches boven 80%, één credential vraagt aandacht. Vol vertrouwen verder.
          </p>
          <button
            onClick={onOpen}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: C.lime, color: C.limeInk }}
          >
            <Zap size={15} aria-hidden="true" /> Bekijk beste match
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* KPI's — kleurgecodeerde blokken */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.blue;
          return (
            <div
              key={k.label}
              className="group rounded-2xl p-5 transition-transform hover:-translate-y-1"
              style={{ border: `1.5px solid ${C.line}`, background: C.paper }}
            >
              <div className="flex items-start justify-between">
                <p className="text-[12px] font-semibold" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="h-2.5 w-2.5 rounded-md"
                  style={{ background: col }}
                  aria-hidden="true"
                />
              </div>
              <p
                className="mt-3 text-[30px] font-bold tabular-nums leading-none tracking-tight"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    color: k.up ? C.green : "#b56a00",
                    background: k.up ? C.greenSoft : C.amberSoft,
                  }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Sparkline data={k.spark} color={col} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {/* Beste matches */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[18px] font-bold tracking-tight" style={display}>
              Beste matches
            </h2>
            <span className="text-[12px] font-semibold" style={{ color: C.magenta }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#0a0a0f] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1.5px solid ${C.lineHard}`, background: C.paper }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold text-white"
                  style={{ background: C.blue }}
                  aria-hidden="true"
                >
                  {o.match}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-2 max-w-[180px]">
                    <Bar value={o.match} color={C.blue} />
                  </div>
                </div>
                <span className="text-[13px] font-bold tabular-nums">
                  {o.tarief.replace(" / uur", "")}
                </span>
                <ArrowRight
                  size={17}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                  style={{ color: C.ink }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Credentials */}
        <div>
          <h2 className="mb-4 text-[18px] font-bold tracking-tight" style={display}>
            Credentials
          </h2>
          <div
            className="rounded-2xl p-5"
            style={{ border: `1.5px solid ${C.line}`, background: C.panel }}
          >
            <div className="space-y-4">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{ background: st.bg }}
                      aria-hidden="true"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} />
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
          </div>
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
  const cardColors = [C.blue, C.magenta, C.green];
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Kicker color={C.magenta}>Marktplaats</Kicker>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight" style={display}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ border: `1.5px solid ${C.lineHard}`, background: C.paper }}
      >
        <Search size={17} aria-hidden="true" style={{ color: C.ink }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:font-normal placeholder:text-[#9a9aa3]"
          style={{ color: C.ink }}
        />
        {q && (
          <span
            className="shrink-0 text-[12px] font-bold tabular-nums"
            style={{ color: C.magenta }}
          >
            {filtered.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-3xl px-6 py-20 text-center"
          style={{ border: `2px dashed ${C.line}` }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.magentaSoft }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.magenta }} />
          </div>
          <p className="mt-4 text-[16px] font-bold">Geen opdrachten gevonden</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid voor meer matches.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.ink }}
          >
            Wis filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o, i) => {
            const col = cardColors[i % cardColors.length];
            return (
              <button
                key={o.id}
                onClick={onOpen}
                className="group overflow-hidden rounded-3xl text-left transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1.5px solid ${C.lineHard}`, background: C.paper }}
              >
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ background: col }}
                >
                  <span className="text-[11px] font-bold tracking-wide text-white opacity-90">
                    {o.id}
                  </span>
                  <span
                    className="rounded-full bg-white px-2.5 py-0.5 text-[12px] font-bold tabular-nums"
                    style={{ color: col }}
                  >
                    {o.match}% match
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[16px] font-bold leading-snug">{o.titel}</p>
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={13} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ background: C.panel, color: C.inkSoft }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-5 flex items-center justify-between border-t pt-4 text-[13px] font-bold"
                    style={{ borderColor: C.line }}
                  >
                    <span className="tabular-nums">{o.tarief}</span>
                    <span className="tabular-nums" style={{ color: C.muted }}>
                      {o.uren}
                    </span>
                  </div>
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
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div
        className="relative overflow-hidden rounded-3xl p-7 text-white"
        style={{ background: C.blue }}
      >
        <span
          className="absolute -right-8 -top-8 h-32 w-32 rounded-2xl"
          style={{ background: C.magenta, opacity: 0.7 }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker color={C.lime}>{opdracht.id}</Kicker>
            <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight" style={display}>
              {opdracht.titel}
            </h1>
            <p
              className="mt-2 flex items-center gap-1.5 text-[13.5px]"
              style={{ color: "#dfe4ff" }}
            >
              <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full px-6 py-3 text-[13.5px] font-bold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ background: C.lime, color: C.limeInk }}
          >
            Reageer op opdracht
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.blue },
          { l: "Omvang", v: opdracht.uren, c: C.magenta },
          { l: "Start", v: opdracht.start, c: C.amber },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-2xl p-4"
            style={{ border: `1.5px solid ${C.line}`, background: C.paper }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm" style={{ background: m.c }} aria-hidden="true" />
              <p className="text-[11.5px] font-semibold" style={{ color: C.muted }}>
                {m.l}
              </p>
            </div>
            <p className="mt-2 text-[18px] font-bold tabular-nums tracking-tight" style={display}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ border: `1.5px solid ${C.lineHard}`, background: C.paper }}
      >
        <h3 className="text-[18px] font-bold tracking-tight" style={display}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl p-5" style={{ background: C.greenSoft }}>
            <p
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13.5px] font-medium">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ background: C.green }}
                    aria-hidden="true"
                  >
                    <Check size={13} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-5" style={{ background: C.amberSoft }}>
            <p
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "#b56a00" }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ background: C.amber }}
                    aria-hidden="true"
                  >
                    <Minus size={13} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker color={C.green}>Vertrouwen</Kicker>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight" style={display}>
          Verificatie
        </h1>
      </div>

      <div
        className="flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center"
        style={{ background: C.ink, color: "#fff" }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: C.lime }}
        >
          <ShieldCheck size={30} aria-hidden="true" style={{ color: C.limeInk }} />
        </div>
        <div className="flex-1">
          <p className="text-[19px] font-bold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="text-[13px]" style={{ color: "#c9c9d1" }}>
            <span className="font-bold tabular-nums text-white">{verified}</span> van{" "}
            <span className="font-bold tabular-nums text-white">{CREDENTIALS.length}</span>{" "}
            credentials volledig geverifieerd ·{" "}
            <span className="font-bold" style={{ color: C.lime }}>
              1 vraagt actie
            </span>
          </p>
        </div>
        <div className="w-full sm:w-40">
          <Bar value={(verified / CREDENTIALS.length) * 100} color={C.lime} />
        </div>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          const Icon =
            c.status === "VERIFIED" ? Check : c.status === "SUBMITTED" ? Clock : AlertTriangle;
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-[#f5f5f3]"
              style={{ border: `1.5px solid ${C.line}`, background: C.paper }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: st.bg }}
              >
                <Icon size={19} aria-hidden="true" style={{ color: st.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{c.naam}</p>
                <p className="text-[12.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[11.5px] font-bold"
                style={{ background: st.bg, color: st.fg }}
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
    warning: { fg: "#b56a00", bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.blue, bg: C.blueSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker color={C.amber}>Aandacht</Kicker>
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight" style={display}>
          Volgende acties
        </h1>
      </div>
      <div className="space-y-4">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="group flex items-start gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#0a0a0f]"
              style={{ border: `1.5px solid ${C.lineHard}`, background: C.paper }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.bg }}
              >
                <t.Icon size={20} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 group-hover:scale-105"
                style={{ background: t.fg }}
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
    Betaald: { fg: C.green, bg: C.greenSoft },
    Openstaand: { fg: "#b56a00", bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.panel },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex items-end justify-between">
        <div>
          <Kicker color={C.ink}>Omzet</Kicker>
          <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight" style={display}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.blue }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl" style={{ border: `1.5px solid ${C.lineHard}` }}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-white"
              style={{ background: C.ink }}
            >
              <th className="px-5 py-3">Nummer</th>
              <th className="px-5 py-3">Klant</th>
              <th className="px-5 py-3">Datum</th>
              <th className="px-5 py-3 text-right">Bedrag</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tt = statusTone[f.status] ?? { fg: C.muted, bg: C.panel };
              return (
                <tr
                  key={f.nr}
                  className="border-b transition-colors last:border-0 hover:bg-[#f5f5f3]"
                  style={{ borderColor: C.line }}
                >
                  <td className="px-5 py-4 text-[12.5px] font-bold tabular-nums">{f.nr}</td>
                  <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                  <td className="px-5 py-4 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-5 py-4 text-right text-[13.5px] font-bold tabular-nums">
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                      style={{ color: tt.fg, background: tt.bg }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tt.fg }}
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
    </div>
  );
}
