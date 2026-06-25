"use client";

// Concept 02 — "Folio" · Redactioneel luxe (LIGHT, glossy fashion-magazine).
// Glanzende editoriale luxe: crème papier-canvas, bijna-zwarte inkt, OVERGROTE Fraunces-serif
// displaykoppen, haarlijn-regels, asymmetrisch redactioneel kolomraster, mono-kickers, royale
// witruimte en één verfijnd accent (diep claret). High-end print-gevoel, kalm en premium —
// geen krant/riso, maar een glossy modemagazine. Cijfers in mono.
// Palet: paper #faf7f0, paperSoft #f4efe4, ink #1a1714, inkSoft #4b463f, muted #8a8175,
// line rgba(26,23,20,.14), hairline rgba(26,23,20,.10), accent claret #7a1f2b,
// accentSoft #f3e6e8.
// Fonts: Fraunces (display) + Geist (UI body) + JetBrains Mono (kickers/cijfers).

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
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Command,
  ArrowRight,
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
  paper: "#faf7f0",
  ink: "#1a1714",
  inkSoft: "#4b463f",
  muted: "#8a8175",
  faint: "#a89e8f",
  line: "rgba(26,23,20,0.14)",
  hairline: "rgba(26,23,20,0.10)",
  accent: "#7a1f2b",
  accentSoft: "#f3e6e8",
  plus: "#3f6b46",
  warn: "#9a6a1f",
};

const body = { fontFamily: "var(--font-lab-geist)" };
const display = { fontFamily: "var(--font-lab-fraunces)" };
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

function statusStyle(s: CredStatus): { label: string; fg: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.plus, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accent, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.accent, Icon: AlertTriangle };
  }
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-medium uppercase tracking-[0.34em]"
      style={{ color: C.accent, ...mono }}
    >
      {children}
    </p>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 84;
  const h = 22;
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
        stroke={C.accent}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
}

export function Concept02() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[244px] shrink-0 flex-col border-r px-6 py-8 md:flex"
          style={{ borderColor: C.line }}
        >
          <div className="pb-10">
            <div className="text-[22px] leading-none tracking-tight" style={display}>
              ZZP
            </div>
            <div
              className="mt-1.5 text-[9.5px] uppercase tracking-[0.3em]"
              style={{ color: C.muted, ...mono }}
            >
              Folio · Editie 06
            </div>
          </div>

          <nav className="flex flex-col">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 border-t py-3 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: C.hairline,
                    color: on ? C.ink : C.muted,
                    ...(i === SCREENS.length - 1
                      ? { borderBottom: `1px solid ${C.hairline}` }
                      : {}),
                  }}
                >
                  <span
                    className="w-5 text-[10px] tabular-nums"
                    style={{ color: on ? C.accent : C.faint, ...mono }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  <span className={on ? "font-medium" : ""}>{s.label}</span>
                  {on && (
                    <ArrowRight
                      size={13}
                      aria-hidden="true"
                      className="ml-auto"
                      style={{ color: C.accent }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-8">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border text-[11px]"
                style={{ borderColor: C.line, color: C.accent, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium">{PROFIEL.naam}</div>
                <div className="truncate text-[10.5px]" style={{ color: C.muted, ...mono }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-6 md:px-10"
            style={{ borderColor: C.line }}
          >
            <span
              className="text-[10.5px] uppercase tracking-[0.26em]"
              style={{ color: C.muted, ...mono }}
            >
              {SCREENS.find((s) => s.key === screen)?.label}
            </span>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors hover:bg-[#f4efe4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={13} aria-hidden="true" />
                <span>Zoek…</span>
                <kbd
                  className="flex items-center gap-0.5 rounded px-1 text-[10px]"
                  style={{ border: `1px solid ${C.hairline}`, color: C.faint, ...mono }}
                >
                  <Command size={9} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded-full border p-2 transition-colors hover:bg-[#f4efe4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={14} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent }}
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
                  className="shrink-0 rounded-full px-3 py-1.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.paper : C.muted,
                    background: on ? C.accent : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12">
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
  const lead = OPDRACHTEN[0] as Opdracht;
  const actie = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="mx-auto max-w-5xl">
      {/* Masthead */}
      <div className="border-b pb-8" style={{ borderColor: C.line }}>
        <div className="flex items-baseline justify-between">
          <Kicker>Het dossier · Vandaag</Kicker>
          <span className="text-[10.5px]" style={{ color: C.muted, ...mono }}>
            25 juni 2026
          </span>
        </div>
        <h1
          className="mt-4 text-[44px] leading-[1.02] tracking-[-0.01em] sm:text-[58px]"
          style={display}
        >
          Goedemorgen,
          <br />
          <span style={{ color: C.accent }}>{PROFIEL.naam.split(" ")[0]}.</span>
        </h1>
        <p className="mt-5 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Drie matches boven tachtig procent. Eén credential vraagt aandacht. Verder is alles in
          rustige staat — zoals het hoort.
        </p>
      </div>

      {/* KPI-strook */}
      <div className="grid grid-cols-2 border-b lg:grid-cols-4" style={{ borderColor: C.line }}>
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="py-6 pr-6"
            style={i < KPIS.length - 1 ? { borderRight: `1px solid ${C.hairline}` } : undefined}
          >
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {k.label}
            </p>
            <p
              className="mt-3 text-[30px] tabular-nums leading-none tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] tabular-nums"
                style={{ color: k.up ? C.plus : C.warn, ...mono }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      {/* Redactioneel kolomraster */}
      <div className="grid grid-cols-1 gap-10 pt-10 lg:grid-cols-12">
        {/* Hoofdartikel: topmatch */}
        <article className="lg:col-span-7">
          <Kicker>Hoofdmatch</Kicker>
          <h2 className="mt-3 text-[30px] leading-[1.08] tracking-tight" style={display}>
            {lead.titel}
          </h2>
          <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
            {lead.opdrachtgever} · {lead.plaats} ·{" "}
            <span className="tabular-nums" style={mono}>
              {lead.tarief}
            </span>
          </p>
          <p className="mt-5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Een verklaarbare match van {lead.match} procent. Je BIG-registratie is geverifieerd, de
            reistijd is kort en het tarief ligt boven je ondergrens.
          </p>
          <button
            onClick={onOpen}
            className="mt-6 inline-flex items-center gap-2 border-b pb-1 text-[13px] font-medium transition-colors hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: C.accent, color: C.accent }}
          >
            Lees de volledige opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>

          <div className="mt-8 border-t pt-6" style={{ borderColor: C.hairline }}>
            <Kicker>Verder in de marktplaats</Kicker>
            <div className="mt-4 divide-y" style={{ borderColor: C.hairline }}>
              {OPDRACHTEN.slice(1).map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-baseline gap-4 py-3 text-left transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span className="text-[11px] tabular-nums" style={{ color: C.accent, ...mono }}>
                    {o.match}%
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium" style={display}>
                      {o.titel}
                    </span>
                    <span className="text-[11.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <ArrowUpRight size={14} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </div>
        </article>

        {/* Zijkolom */}
        <aside className="lg:col-span-5">
          <div className="border-l pl-8" style={{ borderColor: C.line }}>
            <Kicker>Vertrouwen</Kicker>
            <p className="mt-3 text-[16px] leading-snug" style={display}>
              {PROFIEL.trust}
            </p>
            <div className="mt-4 space-y-3">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <st.Icon size={14} aria-hidden="true" style={{ color: st.fg, marginTop: 2 }} />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="text-[11px]" style={{ color: C.muted }}>
                        {st.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-lg p-5" style={{ background: C.accentSoft }}>
              <Kicker>Eerste actie</Kicker>
              <p className="mt-2 text-[14px] font-medium leading-snug">{actie.titel}</p>
              <p className="mt-1.5 text-[12px]" style={{ color: C.inkSoft }}>
                {actie.detail}
              </p>
              <button
                className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ color: C.accent }}
              >
                {actie.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
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
    <div className="mx-auto max-w-5xl">
      <div className="border-b pb-6" style={{ borderColor: C.line }}>
        <Kicker>De collectie</Kicker>
        <h1 className="mt-3 text-[40px] leading-none tracking-tight" style={display}>
          Open opdrachten
        </h1>
      </div>

      <div className="mt-6 flex items-center gap-3 border-b pb-3" style={{ borderColor: C.line }}>
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#a89e8f]"
          style={{ color: C.ink, ...display }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.muted, ...mono }}>
          {filtered.length} / {OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[24px]" style={display}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-1.5 border-b pb-1 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: C.accent, color: C.accent }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="mt-2 divide-y" style={{ borderColor: C.line }}>
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group grid w-full grid-cols-1 items-baseline gap-3 py-7 text-left transition-colors hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:grid-cols-12"
            >
              <div className="sm:col-span-1">
                <span className="text-[13px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="sm:col-span-7">
                <h2 className="text-[24px] leading-tight tracking-tight" style={display}>
                  {o.titel}
                </h2>
                <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: C.faint, ...mono }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-3 sm:text-right">
                <p className="text-[15px] tabular-nums" style={{ ...display, color: C.ink }}>
                  {o.tarief}
                </p>
                <p className="text-[11.5px] tabular-nums" style={{ color: C.muted, ...mono }}>
                  {o.uren}
                </p>
              </div>
              <div className="sm:col-span-1 sm:text-right">
                <span
                  className="text-[13px] font-medium tabular-nums"
                  style={{ color: C.accent, ...mono }}
                >
                  {o.match}%
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
    <div className="mx-auto max-w-4xl">
      <div className="border-b pb-8" style={{ borderColor: C.line }}>
        <div className="flex items-baseline justify-between">
          <Kicker>{opdracht.id}</Kicker>
          <span
            className="text-[12px] font-medium tabular-nums"
            style={{ color: C.accent, ...mono }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1 className="mt-4 text-[40px] leading-[1.04] tracking-tight" style={display}>
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <button
          className="mt-6 rounded-full px-6 py-2.5 text-[13px] font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, color: C.paper }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 border-b sm:grid-cols-4" style={{ borderColor: C.line }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="py-6 pr-6"
            style={i < 3 ? { borderRight: `1px solid ${C.hairline}` } : undefined}
          >
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {m.l}
            </p>
            <p className="mt-2 text-[18px] tabular-nums tracking-tight" style={display}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-10">
        <Kicker>Waarom deze match</Kicker>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op basis van je geverifieerde profiel. Je ziet altijd de pluspunten
          én de aandachtspunten — geen verborgen score.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: C.plus, ...mono }}
            >
              Pluspunten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-3 text-[14px]">
                  <Check size={16} aria-hidden="true" style={{ color: C.plus, marginTop: 2 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: C.warn, ...mono }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.inkSoft }}
                >
                  <Minus size={16} aria-hidden="true" style={{ color: C.warn, marginTop: 2 }} />
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
    <div className="mx-auto max-w-4xl">
      <div className="border-b pb-8" style={{ borderColor: C.line }}>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-3 text-[40px] leading-none tracking-tight" style={display}>
          Verificatie
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          <span className="font-medium" style={{ color: C.ink }}>
            {PROFIEL.trust}.
          </span>{" "}
          <span className="tabular-nums" style={mono}>
            {verified}
          </span>{" "}
          van{" "}
          <span className="tabular-nums" style={mono}>
            {CREDENTIALS.length}
          </span>{" "}
          credentials volledig geverifieerd, één vraagt actie.
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: C.line }}>
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div key={c.naam} className="flex items-center gap-5 py-6">
              <span className="w-6 text-[12px] tabular-nums" style={{ color: C.faint, ...mono }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <st.Icon size={18} aria-hidden="true" style={{ color: st.fg }} />
              <div className="min-w-0 flex-1">
                <p className="text-[16px] tracking-tight" style={display}>
                  {c.naam}
                </p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="text-[11px] uppercase tracking-[0.12em]"
                style={{ color: st.fg, ...mono }}
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
  const tone: Record<"warning" | "info", { fg: string; Icon: LucideIcon }> = {
    warning: { fg: C.warn, Icon: AlertTriangle },
    info: { fg: C.accent, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="border-b pb-8" style={{ borderColor: C.line }}>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-3 text-[40px] leading-none tracking-tight" style={display}>
          Volgende acties
        </h1>
      </div>
      <div className="divide-y" style={{ borderColor: C.line }}>
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div key={a.titel} className="flex items-start gap-5 py-7">
              <span className="text-[20px] tabular-nums" style={{ color: C.faint, ...display }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <t.Icon size={15} aria-hidden="true" style={{ color: t.fg }} />
                  <p className="text-[17px] leading-snug tracking-tight" style={display}>
                    {a.titel}
                  </p>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#f4efe4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: C.line, color: C.ink }}
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
  const statusTone: Record<string, string> = {
    Betaald: C.plus,
    Openstaand: C.warn,
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between border-b pb-8" style={{ borderColor: C.line }}>
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-3 text-[40px] leading-none tracking-tight" style={display}>
            Facturen
          </h1>
        </div>
        <button
          className="rounded-full px-5 py-2 text-[12.5px] font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, color: C.paper }}
        >
          Nieuwe factuur
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="border-b text-[10px] uppercase tracking-[0.16em]"
              style={{ borderColor: C.line, color: C.muted }}
            >
              <th className="py-4 pr-4 font-medium" style={mono}>
                Nummer
              </th>
              <th className="py-4 pr-4 font-medium" style={mono}>
                Klant
              </th>
              <th className="py-4 pr-4 font-medium" style={mono}>
                Datum
              </th>
              <th className="py-4 pr-4 text-right font-medium" style={mono}>
                Bedrag
              </th>
              <th className="py-4 text-right font-medium" style={mono}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr
                key={f.nr}
                className="border-b transition-colors last:border-0 hover:bg-[#fffdf8]"
                style={{ borderColor: C.hairline }}
              >
                <td className="py-4 pr-4 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                  {f.nr}
                </td>
                <td className="py-4 pr-4 text-[14px]" style={display}>
                  {f.klant}
                </td>
                <td className="py-4 pr-4 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                  {f.datum}
                </td>
                <td className="py-4 pr-4 text-right text-[15px] tabular-nums" style={display}>
                  {f.bedrag}
                </td>
                <td className="py-4 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em]"
                    style={{ color: statusTone[f.status] ?? C.muted, ...mono }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusTone[f.status] ?? C.muted }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
