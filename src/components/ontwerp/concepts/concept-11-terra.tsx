"use client";

// Concept 11 — "Terra" · Warm-humanist / organisch & menselijk.
// Zorg is mensenwerk: warme aarde- en salietinten, organische vormen (blobs), zachte ronde
// hoeken en een humanistische serif (Newsreader) naast een rustige grotesk (Libre Franklin).
// Rustgevend en vertrouwd rond gevoelige documenten, zonder in te leveren op datadichtheid.
// Palet: canvas cream #f5efe6, surface #fffdf9, ink #2a2620, accent terracotta #b4552d,
// salie #6f8a6a, amber #c08a2e, klei #a8654a. Geen pastel-glow (04), geen clay-3D (06).
// Fonts: Newsreader (display/serif) + Libre Franklin (UI/body) + JetBrains Mono (cijfers).

import { useState } from "react";
import {
  LayoutDashboard,
  Sprout,
  Leaf,
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
  Sun,
  FileText,
  MessageCircle,
  Send,
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
  ink: "#2a2620",
  inkSoft: "#5c554a",
  muted: "#8a8172",
  faint: "#b3a999",
  surface: "#fffdf9",
  surfaceSoft: "#faf4ea",
  cream: "#f5efe6",
  line: "#e7ded0",
  lineSoft: "#f0e8db",
  accent: "#b4552d",
  accentDeep: "#98431f",
  accentSoft: "rgba(180,85,45,0.10)",
  sage: "#6f8a6a",
  sageDeep: "#597455",
  sageSoft: "rgba(111,138,106,0.14)",
  amber: "#c08a2e",
  amberSoft: "rgba(192,138,46,0.14)",
  clay: "#a8654a",
  claySoft: "rgba(168,101,74,0.12)",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const SHADOW = "0 18px 44px -22px rgba(90,70,45,0.28)";
const SHADOW_SM = "0 10px 26px -16px rgba(90,70,45,0.24)";

// Organische blob-radii — zachte, asymmetrische ronding voor een natuurlijk gevoel.
const BLOB_A = "58% 42% 47% 53% / 55% 47% 53% 45%";
const BLOB_B = "42% 58% 63% 37% / 47% 42% 58% 53%";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Sprout,
  opdracht: Leaf,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageCircle,
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.sageDeep, bg: C.sageSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.clay, bg: C.claySoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.accentDeep, bg: C.accentSoft };
  }
}

function Sparkline({ data, color = C.accent }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
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
      <polygon points={area} fill={color} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}

function Kicker({ children, color = C.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color }}>
      {children}
    </p>
  );
}

function Panel({
  children,
  className = "",
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div
      className={`rounded-[26px] ${className}`}
      style={{
        background: soft ? C.surfaceSoft : C.surface,
        boxShadow: SHADOW,
        border: `1px solid ${C.line}`,
      }}
    >
      {children}
    </div>
  );
}

export function Concept11() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background:
          "radial-gradient(1100px 560px at 8% -10%, rgba(180,85,45,0.10), transparent 58%), radial-gradient(900px 520px at 98% 4%, rgba(111,138,106,0.14), transparent 55%), radial-gradient(1000px 640px at 74% 112%, rgba(192,138,46,0.10), transparent 55%), " +
          C.cream,
      }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside className="hidden w-[252px] shrink-0 flex-col px-4 py-6 lg:flex">
          <div className="flex items-center gap-3 px-3 pb-8">
            <div
              className="flex h-11 w-11 items-center justify-center text-[17px] font-semibold text-white"
              style={{ background: C.accent, borderRadius: BLOB_A, boxShadow: SHADOW_SM, ...serif }}
            >
              Z
            </div>
            <div>
              <div className="text-[16px] font-semibold leading-tight" style={serif}>
                ZZP Platform
              </div>
              <div className="text-[11px]" style={{ color: C.muted }}>
                Menselijk overzicht
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
                  className="group flex items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-[13.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: on ? C.ink : C.inkSoft,
                    background: on ? C.surface : "transparent",
                    boxShadow: on ? SHADOW_SM : "none",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center transition-colors"
                    style={{
                      background: on ? C.accentSoft : C.lineSoft,
                      borderRadius: on ? BLOB_B : "12px",
                    }}
                  >
                    <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.muted }} />
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 px-1">
            <p
              className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.faint }}
            >
              Meer
            </p>
            <div className="flex flex-wrap gap-1.5 px-2">
              {NAV.slice(2).map((n) => (
                <span
                  key={n}
                  className="rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                  style={{ background: C.lineSoft, color: C.muted }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <div
              className="flex items-center gap-3 rounded-[22px] px-4 py-3.5"
              style={{ background: C.surface, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center text-[13px] font-semibold text-white"
                style={{ background: C.sage, borderRadius: BLOB_B, ...serif }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{PROFIEL.naam}</div>
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
          <header className="flex h-[76px] shrink-0 items-center gap-3 px-6 lg:px-10">
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
              <Sun size={15} aria-hidden="true" style={{ color: C.amber }} />
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-semibold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[12.5px] transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.surface,
                  color: C.muted,
                  boxShadow: SHADOW_SM,
                  border: `1px solid ${C.line}`,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek rustig…</span>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.surface,
                  color: C.muted,
                  boxShadow: SHADOW_SM,
                  border: `1px solid ${C.line}`,
                }}
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.accent : C.muted,
                    background: on ? C.surface : "transparent",
                    boxShadow: on ? SHADOW_SM : "none",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-10 lg:py-9">
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Vandaag</Kicker>
          <h1
            className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-tight"
            style={serif}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Drie warme matches staan klaar en één certificaat vraagt zachtjes om aandacht. Neem het
            in je eigen tempo — wij houden de rest voor je bij.
          </p>
        </div>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-5">
            <p className="text-[12px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2.5 text-[28px] font-semibold leading-none tracking-tight"
              style={{ ...serif, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
                style={{
                  color: k.up ? C.sageDeep : C.clay,
                  background: k.up ? C.sageSoft : C.claySoft,
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
              <Sparkline data={k.spark} color={k.up ? C.sage : C.clay} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3.5 flex items-baseline justify-between px-1">
              <h2 className="text-[19px] font-semibold tracking-tight" style={serif}>
                Beste matches voor jou
              </h2>
              <span className="text-[11.5px]" style={{ color: C.muted }}>
                Verklaarbaar gesorteerd
              </span>
            </div>
            <Panel className="p-2.5">
              <div className="flex flex-col gap-1.5">
                {OPDRACHTEN.map((o) => (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 rounded-[18px] px-4 py-3.5 text-left transition-colors hover:bg-[#faf4ea] focus-visible:outline-none focus-visible:ring-2"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-[13px] font-semibold tabular-nums"
                      style={{
                        background: C.accentSoft,
                        color: C.accent,
                        borderRadius: BLOB_A,
                        ...mono,
                      }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] tabular-nums sm:block"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3.5 flex items-baseline justify-between px-1">
              <h2 className="text-[19px] font-semibold tracking-tight" style={serif}>
                Recente berichten
              </h2>
              <span className="text-[11.5px]" style={{ color: C.accent }}>
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <Panel className="p-2.5">
              <div className="flex flex-col gap-1">
                {BERICHTEN.map((b) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 rounded-[18px] px-4 py-3 transition-colors hover:bg-[#faf4ea]"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center text-[11px] font-semibold text-white"
                      style={{
                        background: b.ongelezen ? C.clay : C.faint,
                        borderRadius: BLOB_B,
                        ...serif,
                      }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold">{b.van}</p>
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
                    <span
                      className="shrink-0 text-[11px] tabular-nums"
                      style={{ color: C.faint, ...mono }}
                    >
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3.5 px-1">
              <h2 className="text-[19px] font-semibold tracking-tight" style={serif}>
                Jouw certificaten
              </h2>
            </div>
            <Panel className="p-5">
              <div className="space-y-4">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center"
                        style={{ background: st.bg, borderRadius: BLOB_A }}
                        aria-hidden="true"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold">{c.naam}</p>
                        <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Volgende actie — highlight */}
          <Panel className="overflow-hidden p-0">
            <div className="px-5 py-4" style={{ background: C.accent }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                Volgende beste stap
              </p>
              <p className="mt-1.5 text-[16px] font-semibold leading-snug text-white" style={serif}>
                {primair.titel}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-3.5 w-full rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.accent }}
              >
                {primair.cta}
              </button>
            </div>
          </Panel>
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
        <Kicker color={C.sageDeep}>Marktplaats</Kicker>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight" style={serif}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-full px-5 py-3.5"
        style={{ background: C.surface, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#b3a999]"
          style={{ color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.sageSoft, borderRadius: BLOB_A }}
          >
            <Leaf size={26} aria-hidden="true" style={{ color: C.sage }} />
          </div>
          <p className="mt-4 text-[18px] font-semibold" style={serif}>
            Even niets gevonden — dat is oké
          </p>
          <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekwoorden aan of verbreed rustig je beschikbaarheid. We laten het je weten
            zodra er iets passends binnenkomt.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-[26px] p-5 text-left transition-all hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.surface, boxShadow: SHADOW, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10.5px] tracking-wide" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                  style={{ background: C.sageSoft, color: C.sageDeep, ...mono }}
                >
                  {o.match}% match
                </span>
              </div>
              <p className="mt-3 text-[18px] font-semibold leading-snug" style={serif}>
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
                    className="rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                    style={{ background: C.lineSoft, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-4 text-[12.5px]"
                style={{ borderColor: C.line }}
              >
                <span className="font-semibold tabular-nums" style={{ color: C.accent, ...mono }}>
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
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight" style={serif}>
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-full px-6 py-3 text-[13.5px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent, boxShadow: SHADOW_SM }}
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
          <Panel key={m.l} className="p-4">
            <p className="text-[11px]" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[17px] font-semibold tabular-nums tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6">
        <h3 className="text-[19px] font-semibold" style={serif}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel — niets verborgen.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-[22px] p-5" style={{ background: C.sageSoft }}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.sageDeep }}
            >
              Pluspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.sage }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[22px] p-5" style={{ background: C.amberSoft }}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
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
                    style={{ background: "rgba(192,138,46,0.22)" }}
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
      </Panel>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight" style={serif}>
          Verificatie
        </h1>
      </div>

      <Panel className="flex items-center gap-5 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center"
          style={{ background: C.sageSoft, borderRadius: BLOB_A }}
        >
          <ShieldCheck size={28} aria-hidden="true" style={{ color: C.sageDeep }} />
        </div>
        <div>
          <p className="text-[22px] font-semibold" style={serif}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            certificaten volledig geverifieerd · <span style={mono}>1</span> vraagt zacht om actie.
            Alles veilig bewaard.
          </p>
        </div>
      </Panel>

      <Panel className="p-2.5">
        <div className="flex flex-col gap-1.5">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 rounded-[18px] px-4 py-4 transition-colors hover:bg-[#faf4ea]"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ background: st.bg, borderRadius: BLOB_B }}
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
                  <p className="text-[14px] font-semibold">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold"
                  style={{ color: st.fg, background: st.bg }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Documenten */}
      <div>
        <h2 className="mb-3.5 px-1 text-[19px] font-semibold tracking-tight" style={serif}>
          Veilig bewaarde documenten
        </h2>
        <Panel className="p-2.5">
          <div className="flex flex-col gap-1">
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 rounded-[18px] px-4 py-3 transition-colors hover:bg-[#faf4ea]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{ background: C.lineSoft, borderRadius: "12px" }}
                    aria-hidden="true"
                  >
                    <FileText size={16} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted, ...mono }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.accent, bg: C.accentSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight" style={serif}>
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
            <Panel key={a.titel} className="flex items-start gap-4 p-5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center"
                style={{ background: t.bg, borderRadius: BLOB_A }}
              >
                <t.Icon size={20} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold" style={serif}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.accentSoft, color: C.accent }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <Panel soft className="flex items-center gap-4 p-5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          style={{ background: C.sageSoft, borderRadius: BLOB_B }}
        >
          <Send size={18} aria-hidden="true" style={{ color: C.sageDeep }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Klaar met deze lijst? Mooi. Nieuwe acties verschijnen hier zodra ze relevant worden — je
          hoeft niets in de gaten te houden.
        </p>
      </Panel>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.sageDeep, bg: C.sageSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight" style={serif}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent, boxShadow: SHADOW_SM }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.muted }}>
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="px-5 py-3.5 font-semibold">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.lineSoft };
                return (
                  <tr
                    key={f.nr}
                    className="border-t transition-colors hover:bg-[#faf4ea]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-5 py-4 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td className="px-5 py-4 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
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
      </Panel>
    </div>
  );
}
