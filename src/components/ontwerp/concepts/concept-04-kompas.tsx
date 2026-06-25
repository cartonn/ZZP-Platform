"use client";

// Concept 04 — "Kompas" · Warm-menselijk wegwijs.
// Geruststellend, menselijk, begeleid. Een persistente wegwijzer-rail leidt de ZZP'er stap voor stap;
// een kalme vertrouwensmeter en zachte lege/onboarding-staten verlagen de drempel rond gevoelige
// documenten. Menselijk, niet klinisch.
// Palet: canvas #f6f2ec, surface #ffffff, ink #20201c, line #e6ddcf, muted #6f6a5e,
// accent forest #2f6b4f, accent2 clay #c2683f, accentSoft #e8f0ea.
// Fonts: Plus Jakarta Sans (UI) + Sora (koppen).

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
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Compass,
  Sparkles,
  Heart,
  ArrowRight,
  Upload,
  FileText,
  CalendarClock,
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
  canvas: "#f6f2ec",
  surface: "#ffffff",
  ink: "#20201c",
  line: "#e6ddcf",
  lineSoft: "#f0ebe1",
  muted: "#6f6a5e",
  faintInk: "#9b9485",
  accent: "#2f6b4f",
  accent2: "#c2683f",
  accentSoft: "#e8f0ea",
  claySoft: "#f6e6dd",
};

const ui = { fontFamily: "var(--font-lab-jakarta)" };
const head = { fontFamily: "var(--font-lab-sora)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; dot: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: "#2f6b4f", bg: C.accentSoft, dot: "#2f6b4f" };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: "#7a5a23", bg: "#f6efdc", dot: "#b58a3a" };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#9a4a22", bg: C.claySoft, dot: C.accent2 };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#9b1c1c", bg: "#f7e3e0", dot: "#c0392b" };
  }
}

// Kalme vertrouwensmeter — een ring die het vertrouwensniveau menselijk maakt.
function TrustRing({ value, size = 96 }: { value: number; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={C.lineSoft}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={C.accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 700ms cubic-bezier(.22,1,.36,1)" }}
      />
    </svg>
  );
}

export function Concept04() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar — zacht, rond, gastvrij */}
        <aside
          className="hidden w-64 shrink-0 flex-col px-4 py-6 lg:flex"
          style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2.5 px-2 pb-7">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl text-white"
              style={{ background: C.accent }}
            >
              <Compass size={18} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight" style={head}>
                ZZP Platform
              </div>
              <div className="text-[11px]" style={{ color: C.faintInk }}>
                Welkom terug, Sanne
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  <Icon
                    size={17}
                    aria-hidden="true"
                    style={{ color: on ? C.accent : C.faintInk }}
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Wegwijzer — persistente begeleiding */}
          <div
            className="mt-6 rounded-3xl p-4"
            style={{ background: C.accentSoft, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} aria-hidden="true" style={{ color: C.accent }} />
              <span className="text-[12px] font-semibold" style={{ color: C.accent }}>
                Jouw volgende stap
              </span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.ink }}>
              Vernieuw je VOG vóór hij verloopt, zo blijf je vindbaar voor opdrachtgevers.
            </p>
            <button
              onClick={() => setScreen("acties")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.accent }}
            >
              Aan de slag <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-auto flex items-center gap-3 pt-6">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ background: C.claySoft, color: C.accent2 }}
            >
              {PROFIEL.initialen}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
              <div className="truncate text-[11px]" style={{ color: C.faintInk }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-6"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
          >
            <div className="flex items-center gap-2 text-[13px]" style={{ color: C.muted }}>
              <Compass size={15} aria-hidden="true" style={{ color: C.faintInk }} />
              <span className="font-semibold" style={{ color: C.ink, ...head }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] transition-colors hover:bg-[#f0ebe1] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Waar kan ik je mee helpen?</span>
                <kbd
                  className="rounded-md px-1.5 py-0.5 text-[10px]"
                  style={{ background: C.lineSoft, color: C.faintInk }}
                >
                  ⌘K
                </kbd>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-colors hover:bg-[#f0ebe1] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{ background: C.accent2 }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1 overflow-x-auto px-4 py-2 lg:hidden"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.accent : C.muted,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

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

function Heading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[20px] font-semibold tracking-tight" style={head}>
        {children}
      </h2>
      {sub && (
        <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Warme begroeting + vertrouwensmeter */}
      <div
        className="flex flex-col gap-6 rounded-3xl p-6 sm:flex-row sm:items-center"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex-1">
          <p
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
            style={{ background: C.claySoft, color: C.accent2 }}
          >
            <Heart size={12} aria-hidden="true" /> Goedemorgen
          </p>
          <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight" style={head}>
            Je staat er goed voor, Sanne.
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {verified} van je {CREDENTIALS.length} certificaten zijn geverifieerd. Eén punt vraagt
            je aandacht — we wijzen je de weg.
          </p>
          <button
            onClick={onOpen}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.accent }}
          >
            Bekijk je beste match <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        <div
          className="relative flex shrink-0 flex-col items-center rounded-3xl px-7 py-5"
          style={{ background: C.accentSoft }}
        >
          <div className="relative">
            <TrustRing value={88} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-semibold tabular-nums leading-none" style={head}>
                88
              </span>
              <span className="text-[10px] font-medium" style={{ color: C.muted }}>
                / 100
              </span>
            </div>
          </div>
          <span className="mt-2 text-[12.5px] font-semibold" style={{ color: C.accent }}>
            {PROFIEL.trust}
          </span>
        </div>
      </div>

      {/* KPI's — zacht en rond */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-3xl p-4 transition-shadow hover:shadow-[0_2px_12px_rgba(47,107,79,0.08)]"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p className="mt-2 text-[24px] font-semibold tabular-nums leading-none" style={head}>
              {k.value}
            </p>
            <span
              className="mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: k.up ? C.accentSoft : C.claySoft,
                color: k.up ? C.accent : C.accent2,
              }}
            >
              {k.trend}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Heading sub="Met uitleg waarom ze bij je passen">Opdrachten voor jou</Heading>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(47,107,79,0.08)] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[13px] font-semibold tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent }}
                >
                  {o.match}%
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="hidden text-[13px] font-semibold tabular-nums sm:block">
                  {o.tarief}
                </span>
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                  style={{ color: C.faintInk }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Heading sub="Je bewijs van vakmanschap">Certificaten</Heading>
          <div
            className="space-y-3 rounded-3xl p-4"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: st.dot }}
                    aria-hidden="true"
                  />
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
      o.plaats.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Heading sub="Open opdrachten in de zorg, afgestemd op jouw profiel">Marktplaats</Heading>

      <div
        className="flex items-center gap-2.5 rounded-full px-4 py-2.5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faintInk }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel of plaats…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9b9485]"
        />
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-3xl px-6 py-16 text-center"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.accentSoft }}
          >
            <Compass size={24} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold" style={head}>
            Nog niets gevonden — geen zorgen
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid. We blijven voor je zoeken en
            geven een seintje zodra er een passende opdracht is.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-3xl p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(47,107,79,0.09)] focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{ background: C.accentSoft, color: C.accent }}
                >
                  <Heart size={12} aria-hidden="true" /> {o.match}% match
                </span>
                <span className="text-[11px] font-medium" style={{ color: C.faintInk }}>
                  {o.start}
                </span>
              </div>
              <p className="mt-3 text-[15px] font-semibold leading-snug" style={head}>
                {o.titel}
              </p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                style={{ color: C.muted }}
              >
                <MapPin size={13} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: C.lineSoft, color: C.muted }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between pt-3.5 text-[13px]"
                style={{ borderTop: `1px solid ${C.lineSoft}` }}
              >
                <span className="font-semibold tabular-nums">{o.tarief}</span>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div
        className="rounded-3xl p-6"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: C.accentSoft, color: C.accent }}
            >
              <Heart size={12} aria-hidden="true" /> {opdracht.match}% match
            </span>
            <h2 className="mt-3 text-[24px] font-semibold tracking-tight" style={head}>
              {opdracht.titel}
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full px-5 py-3 text-[13px] font-semibold text-white transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.accent }}
          >
            Reageer op opdracht
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="rounded-2xl p-3.5" style={{ background: C.lineSoft }}>
              <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
                {m.l}
              </p>
              <p className="mt-1 text-[16px] font-semibold tabular-nums" style={head}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <Compass size={17} aria-hidden="true" style={{ color: C.accent }} />
          <h3 className="text-[15px] font-semibold" style={head}>
            Waarom we deze opdracht aanraden
          </h3>
        </div>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Eerlijk en transparant onderbouwd op basis van jouw profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p
              className="text-[11.5px] font-semibold uppercase tracking-wide"
              style={{ color: C.accent }}
            >
              Past goed bij je
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.accentSoft }}
                  >
                    <Check size={12} aria-hidden="true" style={{ color: C.accent }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[11.5px] font-semibold uppercase tracking-wide"
              style={{ color: C.accent2 }}
            >
              Om rekening mee te houden
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.claySoft }}
                  >
                    <X size={12} aria-hidden="true" style={{ color: C.accent2 }} />
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
    <div className="mx-auto max-w-4xl space-y-6">
      <Heading sub="We bepalen je vertrouwensniveau zorgvuldig en server-side">
        Jouw vertrouwen
      </Heading>

      <div
        className="flex flex-col items-center gap-5 rounded-3xl p-7 text-center sm:flex-row sm:text-left"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="relative shrink-0">
          <TrustRing value={88} size={104} />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck size={30} aria-hidden="true" style={{ color: C.accent }} />
          </div>
        </div>
        <div>
          <p className="text-[18px] font-semibold" style={head}>
            {PROFIEL.trust}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            <span className="tabular-nums">{verified}</span> van{" "}
            <span className="tabular-nums">{CREDENTIALS.length}</span> certificaten volledig
            geverifieerd. Opdrachtgevers zien direct dat ze je kunnen vertrouwen.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 rounded-3xl p-4 transition-colors hover:bg-[#fbf9f4]"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: st.bg }}
              >
                {c.status === "VERIFIED" ? (
                  <Check size={18} aria-hidden="true" style={{ color: st.dot }} />
                ) : c.status === "SUBMITTED" ? (
                  <Clock size={18} aria-hidden="true" style={{ color: st.dot }} />
                ) : (
                  <AlertTriangle size={18} aria-hidden="true" style={{ color: st.dot }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">{c.naam}</p>
                <p className="text-[12.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="hidden shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold sm:inline-flex"
                style={{ background: st.bg, color: st.fg }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Geruststellende upload-uitnodiging */}
      <div
        className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed p-7 text-center"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: C.accentSoft }}
        >
          <Upload size={20} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <p className="text-[14px] font-semibold" style={head}>
          Nog een certificaat toevoegen?
        </p>
        <p className="max-w-md text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
          Je documenten zijn privé en versleuteld. Alleen jij en onze verificateurs zien ze — nooit
          opdrachtgevers.
        </p>
        <button
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f0ebe1] focus-visible:outline-none focus-visible:ring-2"
          style={{ border: `1px solid ${C.line}`, color: C.ink }}
        >
          <Upload size={14} aria-hidden="true" /> Document uploaden
        </button>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.accent2, bg: C.claySoft, Icon: CalendarClock },
    info: { fg: C.accent, bg: C.accentSoft, Icon: Sparkles },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Heading sub="We zetten ze op volgorde, zodat je rustig stap voor stap verder kunt">
        Jouw wegwijzer
      </Heading>
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <li
              key={a.titel}
              className="flex items-start gap-4 rounded-3xl p-5 transition-shadow hover:shadow-[0_3px_14px_rgba(47,107,79,0.07)]"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="flex flex-col items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums"
                  style={{ background: t.bg, color: t.fg }}
                >
                  {i + 1}
                </span>
                {i < ACTIES.length - 1 && (
                  <span className="h-8 w-px" style={{ background: C.line }} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <t.Icon size={15} aria-hidden="true" style={{ color: t.fg }} />
                  <p className="text-[14px] font-semibold">{a.titel}</p>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
                <button
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2"
                  style={{ background: a.urgentie === "warning" ? C.accent2 : C.accent }}
                >
                  {a.cta} <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.accent, bg: C.accentSoft },
    Openstaand: { fg: C.accent2, bg: C.claySoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  const fallback = { fg: C.muted, bg: C.lineSoft };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Heading sub="Je verstuurde en openstaande facturen, helder op een rij">Facturen</Heading>
        <button
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          Nieuwe factuur
        </button>
      </div>

      <div className="space-y-2.5">
        {FACTUREN.map((f) => {
          const t = statusTone[f.status] ?? fallback;
          return (
            <div
              key={f.nr}
              className="flex items-center gap-4 rounded-3xl p-4 transition-colors hover:bg-[#fbf9f4]"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: C.lineSoft }}
              >
                <Receipt size={18} aria-hidden="true" style={{ color: C.faintInk }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{f.klant}</p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {f.nr} · {f.datum}
                </p>
              </div>
              <span className="text-[14px] font-semibold tabular-nums">{f.bedrag}</span>
              <span
                className="hidden shrink-0 rounded-full px-3 py-1 text-[11.5px] font-semibold sm:inline-flex"
                style={{ background: t.bg, color: t.fg }}
              >
                {f.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
