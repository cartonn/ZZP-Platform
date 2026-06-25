"use client";

// Concept 06 — "Spectra" · Expressieve duotone kleur.
// Energiek maar professioneel: levendige duotone mesh-gradients (CSS conic/radial), rol-gecodeerde
// kleurvlakken, gradient-accentchips en kinetische hover/voortgang-microinteracties die voortgang
// voelbaar maken — nooit schreeuwerig. Witte basis, geen ambient glow.
// Palet: canvas #ffffff, surface #ffffff, ink #1a1430, line #ece9f5, muted #6b6580,
// accent indigo #6366f1, accent2 fuchsia #d6409f, accent3 cyan #06b6d4.
// Fonts: Plus Jakarta Sans + JetBrains Mono.

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
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
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
  canvas: "#ffffff",
  surface: "#ffffff",
  ink: "#1a1430",
  line: "#ece9f5",
  lineSoft: "#f5f3fb",
  muted: "#6b6580",
  faint: "#9b96ad",
  accent: "#6366f1",
  accent2: "#d6409f",
  accent3: "#06b6d4",
  indigoSoft: "#eef0fe",
  fuchsiaSoft: "#fdeaf5",
  cyanSoft: "#e3f7fb",
};

const ui = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const MESH = `radial-gradient(120% 120% at 0% 0%, ${C.accent} 0%, transparent 45%), radial-gradient(120% 120% at 100% 0%, ${C.accent2} 0%, transparent 45%), radial-gradient(140% 140% at 50% 120%, ${C.accent3} 0%, transparent 50%)`;
const GRAD = `linear-gradient(120deg, ${C.accent}, ${C.accent2})`;

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

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; dot: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: "#0e7490", bg: C.cyanSoft, dot: C.accent3 };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: "#4338ca", bg: C.indigoSoft, dot: C.accent };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#a21672", bg: C.fuchsiaSoft, dot: C.accent2 };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#b91c1c", bg: "#fbe9e9", dot: "#dc2626" };
  }
}

// Kinetische voortgangsring met duotone-verloop.
function ProgressRing({ value, size = 88 }: { value: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const id = `spectra-grad-${value}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.accent} />
          <stop offset="100%" stopColor={C.accent2} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 800ms cubic-bezier(.22,1,.36,1)" }}
      />
    </svg>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: C.lineSoft }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: GRAD,
          transition: "width 800ms cubic-bezier(.22,1,.36,1)",
        }}
      />
    </div>
  );
}

export function Concept06() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar */}
        <aside
          className="hidden w-60 shrink-0 flex-col px-3 py-5 lg:flex"
          style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2.5 px-2 pb-6">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]"
              style={{ background: GRAD }}
            >
              <Sparkles size={16} aria-hidden="true" />
            </div>
            <span className="text-[14px] font-bold tracking-tight">ZZP Platform</span>
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
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? "#ffffff" : C.muted,
                    background: on ? GRAD : "transparent",
                    boxShadow: on ? "0 6px 16px rgba(99,102,241,0.28)" : "none",
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? "#ffffff" : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="relative overflow-hidden rounded-2xl p-3.5"
              style={{ border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: GRAD }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-bold">{PROFIEL.naam}</div>
                  <div className="truncate text-[11px]" style={{ color: C.faint }}>
                    {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-6 py-3"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
          >
            <span className="text-[14px] font-bold tracking-tight">
              {SCREENS.find((s) => s.key === screen)?.label}
            </span>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] transition-colors hover:bg-[#f5f3fb] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoeken</span>
                <kbd
                  className="rounded-md px-1.5 py-0.5 text-[10px]"
                  style={{ background: C.lineSoft, ...mono, color: C.faint }}
                >
                  ⌘K
                </kbd>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-colors hover:bg-[#f5f3fb] focus-visible:outline-none focus-visible:ring-2"
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
            className="flex gap-1.5 overflow-x-auto px-4 py-2 lg:hidden"
            style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? "#ffffff" : C.muted,
                    background: on ? GRAD : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
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
      <h2 className="text-[18px] font-bold tracking-tight">{children}</h2>
      {sub && (
        <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Mesh-gradient hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-7 text-white"
        style={{ backgroundColor: C.accent, backgroundImage: MESH }}
      >
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11.5px] font-semibold backdrop-blur">
              <Sparkles size={12} aria-hidden="true" /> Je momentum groeit
            </p>
            <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight">
              92% match-niveau deze week
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-white/85">
              Je profiel presteert boven gemiddeld. Drie nieuwe opdrachten passen uitstekend bij je.
            </p>
            <button
              onClick={onOpen}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ color: C.accent }}
            >
              Bekijk matches <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="relative shrink-0 self-center">
            <ProgressRing value={92} size={104} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold tabular-nums leading-none">92%</span>
              <span className="text-[10px] font-medium text-white/80">match</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI's met gradient-randjes */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const accents = [C.accent, C.accent2, C.accent3, C.accent];
          const a = accents[i % accents.length];
          return (
            <div
              key={k.label}
              className="group relative overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)]"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${a}, ${C.accent2})` }}
                aria-hidden="true"
              />
              <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                {k.label}
              </p>
              <p className="mt-2 text-[24px] font-bold tabular-nums leading-none">{k.value}</p>
              <span
                className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-bold"
                style={{ color: k.up ? a : C.muted }}
              >
                <TrendingUp size={12} aria-hidden="true" /> {k.trend}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Heading sub="Verklaarbaar gesorteerd op match-score">Beste matches</Heading>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(99,102,241,0.1)] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="relative shrink-0">
                  <ProgressRing value={o.match} size={48} />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums">
                    {o.match}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="hidden text-[13px] font-bold tabular-nums sm:block">
                  {o.tarief}
                </span>
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                  style={{ color: C.accent }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Heading sub="Je verifieerbare bewijs">Certificaten</Heading>
          <div
            className="space-y-3.5 rounded-2xl p-4"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: st.dot }}
                      aria-hidden="true"
                    />
                    <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{c.naam}</p>
                  </div>
                  <p className="mt-0.5 pl-[18px] text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
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
  const chip = [C.accent, C.accent2, C.accent3];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Heading sub="Open opdrachten in de zorg, afgestemd op jouw profiel">Marktplaats</Heading>

      <div
        className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel of plaats…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9b96ad]"
        />
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-3xl px-6 py-16 text-center"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: GRAD }}
          >
            <Store size={24} aria-hidden="true" />
          </div>
          <p className="mt-4 text-[15px] font-bold">Geen opdrachten gevonden</p>
          <p className="mt-1.5 max-w-sm text-[13px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o, idx) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(99,102,241,0.13)] focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(90deg, ${chip[idx % chip.length]}, ${C.accent2})`,
                }}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold text-white"
                  style={{ background: GRAD }}
                >
                  {o.match}% match
                </span>
                <span className="text-[11px] font-medium" style={{ color: C.faint }}>
                  {o.start}
                </span>
              </div>
              <p className="mt-3 text-[15px] font-bold leading-snug">{o.titel}</p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                style={{ color: C.muted }}
              >
                <MapPin size={13} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: C.indigoSoft, color: C.accent }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3.5">
                <Bar value={o.match} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[13px]">
                <span className="font-bold tabular-nums">{o.tarief}</span>
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
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <span
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: MESH, backgroundColor: C.accent }}
          aria-hidden="true"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold text-white"
              style={{ background: GRAD }}
            >
              {opdracht.match}% match
            </span>
            <h2 className="mt-3 text-[24px] font-bold tracking-tight">{opdracht.titel}</h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            className="shrink-0 rounded-full px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2"
            style={{ background: GRAD }}
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
              <p className="mt-1 text-[16px] font-bold tabular-nums">{m.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
            style={{ background: GRAD }}
          >
            <Sparkles size={14} aria-hidden="true" />
          </span>
          <h3 className="text-[15px] font-bold">Waarom deze match</h3>
        </div>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div
            className="rounded-2xl p-4"
            style={{ background: C.cyanSoft, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[11.5px] font-bold uppercase tracking-wide"
              style={{ color: "#0e7490" }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: C.accent3 }}
                  >
                    <Check size={12} aria-hidden="true" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: C.fuchsiaSoft, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[11.5px] font-bold uppercase tracking-wide"
              style={{ color: "#a21672" }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: C.accent2 }}
                  >
                    <X size={12} aria-hidden="true" />
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
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Heading sub="Server-side bepaald — de bron van je vertrouwensniveau">Verificatie</Heading>

      <div
        className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl p-7 text-white sm:flex-row"
        style={{ backgroundColor: C.accent, backgroundImage: MESH }}
      >
        <div className="relative shrink-0">
          <ProgressRing value={pct} size={104} />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck size={30} aria-hidden="true" />
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[18px] font-bold">{PROFIEL.trust}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-white/85">
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
              className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(99,102,241,0.08)]"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
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
                <p className="text-[14px] font-bold">{c.naam}</p>
                <p className="text-[12.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="hidden shrink-0 rounded-full px-3 py-1 text-[11.5px] font-bold sm:inline-flex"
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
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; grad: string; Icon: LucideIcon }
  > = {
    warning: {
      fg: "#a21672",
      bg: C.fuchsiaSoft,
      grad: `linear-gradient(120deg, ${C.accent2}, ${C.accent})`,
      Icon: AlertTriangle,
    },
    info: {
      fg: C.accent,
      bg: C.indigoSoft,
      grad: GRAD,
      Icon: Sparkles,
    },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Heading sub="Wat vraagt nu jouw aandacht — op prioriteit gesorteerd">
        Volgende acties
      </Heading>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(99,102,241,0.1)]"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: t.grad }}
              >
                <t.Icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold text-white transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: t.grad }}
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
    Betaald: { fg: "#0e7490", bg: C.cyanSoft },
    Openstaand: { fg: "#a21672", bg: C.fuchsiaSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  const fallback = { fg: C.muted, bg: C.lineSoft };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Heading sub="Overzicht van je verstuurde en openstaande facturen">Facturen</Heading>
        <button
          className="shrink-0 rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_6px_16px_rgba(99,102,241,0.28)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: GRAD }}
        >
          Nieuwe factuur
        </button>
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[11px] uppercase tracking-wide"
              style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
            >
              <th className="px-4 py-3 font-semibold">Nummer</th>
              <th className="px-4 py-3 font-semibold">Klant</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Datum</th>
              <th className="px-4 py-3 text-right font-semibold">Bedrag</th>
              <th className="px-4 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = statusTone[f.status] ?? fallback;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors last:border-0 hover:bg-[#f5f3fb]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-4 py-3 text-[12.5px] font-semibold" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium">{f.klant}</td>
                  <td
                    className="hidden px-4 py-3 text-[12.5px] sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                      style={{ background: t.bg, color: t.fg }}
                    >
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
