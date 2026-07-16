"use client";

// Concept 357 — "Prisma" · Kleurrijk-speels spectrum, strak op een 8pt-grid.
// Elk domein/scherm krijgt een eigen heldere kleur uit één samenhangend palet (indigo, teal,
// amber, roze, lime, violet). Vrolijk én disciplinair: ronde vlakken, blije micro-interacties,
// consistente ritmes. Wit canvas met kleuraccenten — Superlist/Family-energie, professioneel.
// Fonts: Baloo (display, rond), Jakarta (koppen), Inter (tekst), JetBrains Mono (cijfers).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Receipt,
  Search,
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  MapPin,
  CalendarDays,
  Wallet,
  Plus,
  Bell,
  TrendingUp,
  X,
  Star,
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

// ---- Palet ---------------------------------------------------------------------------------
type Hue = {
  name: string;
  ink: string; // verzadigde lijn/tekst
  base: string; // vlakvulling voor accenten
  soft: string; // zachte achtergrond
  ring: string; // focus-ring kleur
};

const HUES: Record<ScreenKey, Hue> = {
  dashboard: { name: "Indigo", ink: "#4338ca", base: "#6366f1", soft: "#eef2ff", ring: "#a5b4fc" },
  marktplaats: { name: "Teal", ink: "#0f766e", base: "#14b8a6", soft: "#effcfa", ring: "#5eead4" },
  opdracht: { name: "Amber", ink: "#b45309", base: "#f59e0b", soft: "#fff8eb", ring: "#fcd34d" },
  verificatie: { name: "Roze", ink: "#be185d", base: "#ec4899", soft: "#fdf2f8", ring: "#f9a8d4" },
  acties: { name: "Lime", ink: "#4d7c0f", base: "#84cc16", soft: "#f6fce9", ring: "#bef264" },
  facturen: { name: "Violet", ink: "#6d28d9", base: "#8b5cf6", soft: "#f6f2ff", ring: "#c4b5fd" },
  documenten: { name: "Sky", ink: "#0369a1", base: "#0ea5e9", soft: "#eff9ff", ring: "#7dd3fc" },
  berichten: { name: "Rose", ink: "#be123c", base: "#f43f5e", soft: "#fff1f3", ring: "#fda4af" },
};

const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: Sparkles,
  facturen: Receipt,
  documenten: LayoutGrid,
  berichten: Bell,
};

const INK = "#1a1626";
const MUTED = "#6b6577";
const FAINT = "#9a94a6";
const CARD = "#ffffff";
const CANVAS = "#faf9fc";
const HAIR = "rgba(26,22,38,0.08)";

const display = { fontFamily: "var(--font-lab-baloo)" };
const heading = { fontFamily: "var(--font-lab-jakarta)" };
const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; hue: Hue } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, hue: HUES.acties };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, hue: HUES.dashboard };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, hue: HUES.opdracht };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, hue: HUES.berichten };
  }
}

// ---- Kleine bouwstenen ---------------------------------------------------------------------
function Pill({
  children,
  hue,
  filled,
}: {
  children: React.ReactNode;
  hue: Hue;
  filled?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={
        filled ? { background: hue.base, color: "#fff" } : { background: hue.soft, color: hue.ink }
      }
    >
      {children}
    </span>
  );
}

function SparkBars({ data, hue }: { data: number[]; hue: Hue }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const h = 26 + ((v - min) / span) * 74;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-full rounded-full transition-all duration-300 motion-reduce:transition-none"
            style={{
              height: `${h}%`,
              background: last ? hue.base : hue.ring,
              opacity: last ? 1 : 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

function MatchRing({ value, hue }: { value: number; hue: Hue }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <span className="relative inline-flex h-12 w-12 items-center justify-center" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke={hue.soft} strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={hue.base}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span
        className="absolute text-[12px] font-bold tabular-nums"
        style={{ ...mono, color: hue.ink }}
      >
        {value}
      </span>
    </span>
  );
}

// ============================================================================================
export function Concept357() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const hue = HUES[screen];
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: CANVAS, color: INK }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col md:flex-row">
        {/* Zijnavigatie — kleurgecodeerd */}
        <aside
          className="shrink-0 border-b px-4 py-6 md:w-64 md:border-b-0 md:border-r md:px-5 md:py-8"
          style={{ borderColor: HAIR, background: CARD }}
        >
          <div className="flex items-center gap-3 px-2">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[18px] font-extrabold text-white"
              style={{
                ...display,
                background: `linear-gradient(135deg, ${HUES.dashboard.base}, ${HUES.verificatie.base})`,
              }}
              aria-hidden="true"
            >
              P
            </span>
            <div className="leading-tight">
              <p className="text-[16px] font-extrabold" style={display}>
                Prisma
              </p>
              <p className="text-[11px]" style={{ color: FAINT }}>
                ZZP-werkruimte
              </p>
            </div>
          </div>

          <nav
            className="mt-7 flex gap-1.5 overflow-x-auto md:flex-col md:gap-1"
            aria-label="Hoofdnavigatie"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const h = HUES[s.key];
              const Icon = SCREEN_ICON[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none"
                  style={{
                    ...heading,
                    background: on ? h.soft : "transparent",
                    color: on ? h.ink : MUTED,
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    style={{
                      background: on ? h.base : h.soft,
                      color: on ? "#fff" : h.ink,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div
            className="mt-7 hidden items-center gap-3 rounded-2xl px-3 py-3 md:flex"
            style={{ background: CANVAS }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ background: HUES.dashboard.base }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</p>
              <p className="truncate text-[10.5px]" style={{ color: FAINT }}>
                {PROFIEL.plaats}
              </p>
            </div>
          </div>
        </aside>

        {/* Hoofdvenster */}
        <main className="min-w-0 flex-1 px-5 py-7 md:px-9 md:py-9">
          <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: hue.base }}
                aria-hidden="true"
              />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: hue.ink }}
              >
                {hue.name}
              </span>
            </div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{ ...heading, background: HUES.acties.soft, color: HUES.acties.ink }}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              {PROFIEL.trust}
            </span>
          </header>

          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onGo={setScreen} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

// ---- Dashboard -----------------------------------------------------------------------------
function Dashboard({ onOpen, onGo }: { onOpen: () => void; onGo: (s: ScreenKey) => void }) {
  const hue = HUES.dashboard;
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-[30px] font-extrabold leading-tight sm:text-[36px]" style={display}>
          Hoi {PROFIEL.naam.split(" ")[0]}
          <span style={{ color: hue.base }}>.</span>
        </h1>
        <p className="mt-1.5 max-w-md text-[14px]" style={{ color: MUTED }}>
          Je week ziet er kleurrijk uit. Drie matches wachten en één certificaat vraagt aandacht.
        </p>
      </section>

      {/* KPI-kaarten, elk een eigen kleur */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const h = [HUES.dashboard, HUES.marktplaats, HUES.acties, HUES.opdracht][i] as Hue;
          return (
            <div
              key={k.label}
              className="rounded-3xl border p-4 transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
              style={{ borderColor: HAIR, background: CARD }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold" style={{ color: MUTED }}>
                  {k.label}
                </span>
                <Pill hue={h}>
                  <TrendingUp size={11} aria-hidden="true" />
                  {k.trend}
                </Pill>
              </div>
              <p
                className="mt-2 text-[26px] font-extrabold tabular-nums"
                style={{ ...display, color: INK }}
              >
                {k.value}
              </p>
              <div className="mt-2">
                <SparkBars data={k.spark} hue={h} />
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Beste match */}
        <section
          className="rounded-3xl border p-5 lg:col-span-3"
          style={{ borderColor: HAIR, background: HUES.opdracht.soft }}
        >
          <div className="flex items-center gap-2">
            <Star size={15} style={{ color: HUES.opdracht.ink }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.14em]"
              style={{ color: HUES.opdracht.ink }}
            >
              Beste match vandaag
            </h2>
          </div>
          <OpdrachtRij opdracht={OPDRACHTEN[0] as Opdracht} onOpen={onOpen} big />
          <button
            onClick={() => onGo("marktplaats")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
            style={{ ...heading, background: HUES.opdracht.base }}
          >
            Bekijk alle opdrachten <ArrowRight size={15} aria-hidden="true" />
          </button>
        </section>

        {/* Aandacht */}
        <section
          className="rounded-3xl border p-5 lg:col-span-2"
          style={{ borderColor: HAIR, background: CARD }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: HUES.acties.ink }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.14em]"
              style={{ color: HUES.acties.ink }}
            >
              Vraagt actie
            </h2>
          </div>
          <ul className="mt-3 space-y-2.5">
            {ACTIES.map((a) => {
              const h = a.urgentie === "warning" ? HUES.opdracht : HUES.dashboard;
              return (
                <li
                  key={a.titel}
                  className="flex items-start gap-3 rounded-2xl p-3 transition-colors"
                  style={{ background: h.soft }}
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: h.base }}
                    aria-hidden="true"
                  >
                    {a.urgentie === "warning" ? <AlertTriangle size={14} /> : <Bell size={14} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug" style={heading}>
                      {a.titel}
                    </p>
                    <button
                      onClick={() => onGo("acties")}
                      className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{ color: h.ink }}
                    >
                      {a.cta} <ArrowUpRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function OpdrachtRij({
  opdracht,
  onOpen,
  big,
}: {
  opdracht: Opdracht;
  onOpen: () => void;
  big?: boolean;
}) {
  const hue = HUES.opdracht;
  return (
    <button
      onClick={onOpen}
      className="mt-3 flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
      style={{ borderColor: HAIR }}
    >
      <MatchRing value={opdracht.match} hue={hue} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-bold ${big ? "text-[16px]" : "text-[14.5px]"}`}
          style={heading}
        >
          {opdracht.titel}
        </p>
        <p className="mt-0.5 truncate text-[12.5px]" style={{ color: MUTED }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Pill hue={hue}>{opdracht.tarief}</Pill>
          <Pill hue={HUES.dashboard}>{opdracht.uren}</Pill>
        </div>
      </div>
      <ArrowUpRight size={18} style={{ color: hue.ink }} aria-hidden="true" />
    </button>
  );
}

// ---- Marktplaats ---------------------------------------------------------------------------
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const hue = HUES.marktplaats;
  const [q, setQ] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const filtered = OPDRACHTEN.filter((o) => {
    const hay = `${o.titel} ${o.plaats} ${o.opdrachtgever} ${o.tags.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase()) && o.match >= minMatch;
  });
  const chips = [
    { label: "Alles", v: 0 },
    { label: "80%+", v: 80 },
    { label: "90%+", v: 90 },
  ];
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[28px] font-extrabold" style={display}>
          Marktplaats
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
          {OPDRACHTEN.length} open opdrachten, verklaarbaar gematcht op je geverifieerde profiel.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-2xl border px-4 py-2.5"
          style={{ borderColor: HAIR, background: CARD }}
        >
          <Search size={16} style={{ color: hue.ink }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of vaardigheid…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9a94a6]"
            style={{ color: INK }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Zoekopdracht wissen"
              className="rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{ color: MUTED }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {chips.map((c) => {
            const on = minMatch === c.v;
            return (
              <button
                key={c.label}
                onClick={() => setMinMatch(c.v)}
                aria-pressed={on}
                className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...heading,
                  background: on ? hue.base : hue.soft,
                  color: on ? "#fff" : hue.ink,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-3xl border py-16 text-center"
          style={{ borderColor: HAIR, background: hue.soft }}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: hue.base }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="mt-4 text-[18px] font-bold" style={display}>
            Geen opdracht gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px]" style={{ color: MUTED }}>
            Niets past bij deze zoekopdracht en filters. Verruim je zoektermen of matchdrempel.
          </p>
          <button
            onClick={() => {
              setQ("");
              setMinMatch(0);
            }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
            style={{ ...heading, background: hue.base }}
          >
            Filters wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const hue = HUES.marktplaats;
  return (
    <div
      className="flex h-full flex-col rounded-3xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm motion-reduce:hover:translate-y-0"
      style={{ borderColor: HAIR, background: CARD }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-bold tabular-nums" style={{ ...mono, color: FAINT }}>
            {opdracht.id}
          </span>
          <h3 className="mt-1 text-[15.5px] font-bold leading-snug" style={heading}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px]" style={{ color: MUTED }}>
            <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <MatchRing value={opdracht.match} hue={hue} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <Pill key={t} hue={hue}>
            {t}
          </Pill>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[12.5px]" style={{ color: MUTED }}>
        <span className="inline-flex items-center gap-1.5">
          <Wallet size={13} style={{ color: hue.ink }} aria-hidden="true" /> {opdracht.tarief}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} style={{ color: hue.ink }} aria-hidden="true" /> {opdracht.start}
        </span>
      </div>

      <button
        onClick={onOpen}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
        style={{ ...heading, background: hue.base }}
      >
        Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

// ---- Opdracht-detail -----------------------------------------------------------------------
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const hue = HUES.opdracht;
  const [tab, setTab] = useState<"match" | "details">("match");
  const metrics = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Match", v: `${opdracht.match}%`, Icon: TrendingUp },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ color: hue.ink }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section
        className="rounded-3xl border p-6"
        style={{ borderColor: HAIR, background: hue.soft }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ ...mono, color: hue.ink }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-1.5 max-w-xl text-[26px] font-extrabold leading-tight"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[14px]" style={{ color: MUTED }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} hue={hue} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
            style={{ ...heading, background: hue.base }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border bg-white px-5 py-2.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...heading, borderColor: HAIR, color: INK }}
          >
            Bewaren
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.l}
            className="rounded-2xl border p-4"
            style={{ borderColor: HAIR, background: CARD }}
          >
            <m.Icon size={16} style={{ color: hue.ink }} aria-hidden="true" />
            <p className="mt-2 text-[18px] font-extrabold tabular-nums" style={{ ...heading }}>
              {m.v}
            </p>
            <p
              className="text-[11.5px] font-medium uppercase tracking-[0.1em]"
              style={{ color: FAINT }}
            >
              {m.l}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex gap-1.5" role="tablist" aria-label="Opdrachtdetails">
          {(["match", "details"] as const).map((t) => {
            const on = tab === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t)}
                className="rounded-full px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...heading,
                  background: on ? hue.base : hue.soft,
                  color: on ? "#fff" : hue.ink,
                }}
              >
                {t === "match" ? "Waarom deze match" : "Omschrijving"}
              </button>
            );
          })}
        </div>

        {tab === "match" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              className="rounded-3xl border p-5"
              style={{ borderColor: HAIR, background: HUES.acties.soft }}
            >
              <p
                className="text-[12px] font-bold uppercase tracking-[0.14em]"
                style={{ color: HUES.acties.ink }}
              >
                Wat past
              </p>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[13.5px]">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: HUES.acties.base }}
                      aria-hidden="true"
                    >
                      <Check size={12} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-3xl border p-5"
              style={{ borderColor: HAIR, background: HUES.opdracht.soft }}
            >
              <p
                className="text-[12px] font-bold uppercase tracking-[0.14em]"
                style={{ color: HUES.opdracht.ink }}
              >
                Aandacht
              </p>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px]"
                    style={{ color: MUTED }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: HUES.opdracht.base }}
                      aria-hidden="true"
                    >
                      <AlertTriangle size={11} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div
            className="mt-4 rounded-3xl border p-5 text-[14px] leading-relaxed"
            style={{ borderColor: HAIR, background: CARD, color: MUTED }}
          >
            <p>
              {opdracht.opdrachtgever} zoekt een {opdracht.titel.toLowerCase()} in {opdracht.plaats}
              . De inzet is {opdracht.uren.toLowerCase()}, startdatum {opdracht.start.toLowerCase()}
              . Vereiste vaardigheden en registraties staan hieronder als kleurgecodeerde labels.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <Pill key={t} hue={hue} filled>
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ---- Verificatie ---------------------------------------------------------------------------
function Verificatie() {
  const hue = HUES.verificatie;
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section
        className="rounded-3xl border p-6"
        style={{ borderColor: HAIR, background: hue.soft }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold" style={display}>
              Verificatie
            </h1>
            <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
              {verified} van {CREDENTIALS.length} credentials volledig geverifieerd.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[30px] font-extrabold tabular-nums"
              style={{ ...display, color: hue.ink }}
            >
              {pct}%
            </span>
            <div className="h-16 w-16">
              <MatchRing value={pct} hue={hue} />
            </div>
          </div>
        </div>
        <div
          className="mt-4 h-2.5 w-full overflow-hidden rounded-full"
          style={{ background: "#fff" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${pct}%`, background: hue.base }}
            aria-hidden="true"
          />
        </div>
      </section>

      <ul className="space-y-2.5">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li
              key={c.naam}
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: HAIR, background: CARD }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: st.hue.soft, color: st.hue.ink }}
                  aria-hidden="true"
                >
                  <st.Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold" style={heading}>
                    {c.naam}
                  </span>
                </span>
                <Pill hue={st.hue}>
                  <st.Icon size={11} aria-hidden="true" />
                  {st.label}
                </Pill>
              </button>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 pl-[68px] text-[13px]" style={{ color: MUTED }}>
                    {c.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Acties --------------------------------------------------------------------------------
function Acties() {
  const [done, setDone] = useState<string[]>([]);
  const toggle = (t: string) =>
    setDone((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));
  const openCount = ACTIES.length - done.length;
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[28px] font-extrabold" style={display}>
          Acties
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
          {openCount === 0
            ? "Alles afgevinkt — je bent helemaal bij."
            : `${openCount} open ${openCount === 1 ? "actie" : "acties"} vragen je aandacht.`}
        </p>
      </section>

      {openCount === 0 && (
        <div
          className="rounded-3xl border py-12 text-center"
          style={{ borderColor: HAIR, background: HUES.acties.soft }}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: HUES.acties.base }}
            aria-hidden="true"
          >
            <Check size={26} />
          </span>
          <p className="mt-4 text-[18px] font-bold" style={display}>
            Niks meer te doen
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px]" style={{ color: MUTED }}>
            Alle acties zijn afgehandeld. Zin om nieuwe opdrachten te ontdekken?
          </p>
        </div>
      )}

      <ol className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const hue = a.urgentie === "warning" ? HUES.opdracht : HUES.dashboard;
          const isDone = done.includes(a.titel);
          return (
            <li
              key={a.titel}
              className="flex items-start gap-4 rounded-3xl border p-4 transition-all"
              style={{
                borderColor: HAIR,
                background: isDone ? CANVAS : CARD,
                opacity: isDone ? 0.6 : 1,
              }}
            >
              <button
                onClick={() => toggle(a.titel)}
                aria-pressed={isDone}
                aria-label={isDone ? "Markeer als open" : "Markeer als afgerond"}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  borderColor: isDone ? HUES.acties.base : hue.ring,
                  background: isDone ? HUES.acties.base : "transparent",
                  color: isDone ? "#fff" : hue.ink,
                }}
              >
                {isDone ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <span
                    className="text-[12px] font-bold tabular-nums"
                    style={mono}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2
                    className={`text-[15px] font-bold leading-snug ${isDone ? "line-through" : ""}`}
                    style={heading}
                  >
                    {a.titel}
                  </h2>
                </div>
                <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
                  {a.detail}
                </p>
              </div>
              {!isDone && (
                <button
                  className="shrink-0 self-center rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:scale-100"
                  style={{ ...heading, background: hue.base }}
                >
                  {a.cta}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---- Facturen ------------------------------------------------------------------------------
function Facturen() {
  const hue = HUES.facturen;
  const statusHue = (s: string): Hue => {
    if (s === "Betaald") return HUES.acties;
    if (s === "Openstaand") return HUES.opdracht;
    return HUES.dashboard;
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald");
  const open = FACTUREN.filter((f) => f.status === "Openstaand");
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold" style={display}>
            Facturen
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
            {FACTUREN.length} facturen · {open.length} openstaand
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
          style={{ ...heading, background: hue.base }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", h: HUES.acties },
          { l: "Openstaand", v: "€ 1.350", h: HUES.opdracht },
          { l: "Concept", v: "€ 880", h: HUES.dashboard },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border p-4"
            style={{ borderColor: HAIR, background: s.h.soft }}
          >
            <p className="text-[12px] font-semibold" style={{ color: s.h.ink }}>
              {s.l}
            </p>
            <p
              className="mt-1 text-[20px] font-extrabold tabular-nums"
              style={{ ...display, color: INK }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </section>

      <section
        className="overflow-hidden rounded-3xl border"
        style={{ borderColor: HAIR, background: CARD }}
      >
        <div
          className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] sm:grid-cols-[110px_1fr_auto_110px]"
          style={{ background: CANVAS, color: FAINT }}
        >
          <span className="hidden sm:block">Nummer</span>
          <span>Klant</span>
          <span className="text-right">Bedrag</span>
          <span className="hidden text-right sm:block">Status</span>
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const sh = statusHue(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-t px-5 py-4 transition-colors hover:bg-[#faf9fc] sm:grid-cols-[110px_1fr_auto_110px]"
                style={{ borderColor: HAIR }}
              >
                <span
                  className="hidden text-[12px] font-medium tabular-nums sm:block"
                  style={{ ...mono, color: FAINT }}
                >
                  {f.nr}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold" style={heading}>
                    {f.klant}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: FAINT }}>
                    {f.datum}
                  </span>
                </span>
                <span
                  className="text-right text-[14.5px] font-bold tabular-nums"
                  style={{ ...mono }}
                >
                  {f.bedrag}
                </span>
                <span className="hidden justify-self-end sm:block">
                  <Pill hue={sh}>{f.status}</Pill>
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between border-t px-5 py-4"
          style={{ borderColor: HAIR, background: hue.soft }}
        >
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: hue.ink }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[20px] font-extrabold tabular-nums"
            style={{ ...display, color: hue.ink }}
          >
            € {betaald.length > 0 ? "8.622" : "0"}
          </span>
        </div>
      </section>
    </div>
  );
}
