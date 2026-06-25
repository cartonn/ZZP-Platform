"use client";

// Concept 03 — "Pers" · Riso/krantdruk redactioneel.
// Modern newsprint/riso: warm papier-canvas, twee-kleuren riso-gevoel (kobalt + warm rood als
// secundair), grote grotesk slab-koppen, kicker-labels in mono, halftone/dot-textuur accenten
// (CSS radial-gradient dots), geruled kolommen als een broadsheet.
// Palet: paper #f5f2ea, ink #161410, line #d9d3c4, muted #6e6757, accent kobalt #2440d4,
// accent2 warm-rood #d8431f. Fonts: Space Grotesk (koppen) + JetBrains Mono (kickers).

import { useState } from "react";
import {
  Newspaper,
  Store,
  FileText,
  BadgeCheck,
  ListChecks,
  Receipt,
  Search,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  ArrowRight,
  Plus,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  paper: "#f5f2ea",
  paperDeep: "#efebe0",
  surface: "#fbf9f3",
  ink: "#161410",
  line: "#d9d3c4",
  lineSoft: "#e6e1d5",
  muted: "#6e6757",
  faint: "#9b9484",
  cobalt: "#2440d4",
  red: "#d8431f",
};

const head = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const body = { fontFamily: "var(--font-lab-space)" };

// Halftone dot-textuur — riso/krantdruk accent.
const DOTS_COBALT = "radial-gradient(rgba(36,64,212,0.16) 1px, transparent 1.4px)";
const DOTS_RED = "radial-gradient(rgba(216,67,31,0.18) 1px, transparent 1.4px)";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Newspaper,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: BadgeCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Search,
};

function statusStyle(s: CredStatus): { label: string; color: string; mark: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.cobalt, mark: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.muted, mark: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.red, mark: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.red, mark: X };
  }
}

function Kicker({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-bold uppercase leading-none"
      style={{ ...mono, letterSpacing: "0.16em", color: color ?? C.red }}
    >
      {children}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 90;
  const h = 24;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
    </svg>
  );
}

export function Concept03() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar — masthead column */}
        <aside
          className="hidden w-[232px] shrink-0 flex-col border-r-2 md:flex"
          style={{ borderColor: C.ink, background: C.paperDeep }}
        >
          <div className="border-b-2 px-5 py-5" style={{ borderColor: C.ink }}>
            <Kicker>De Marktkrant · ZZP</Kicker>
            <h1 className="mt-2 text-[26px] font-bold leading-none tracking-tight" style={head}>
              Pers
            </h1>
            <p className="mt-1.5 text-[11px]" style={{ ...mono, color: C.muted }}>
              Editie · Utrecht
            </p>
          </div>

          <nav className="flex flex-col py-2" aria-label="Hoofdnavigatie">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 px-5 py-2.5 text-left text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    color: on ? C.paper : C.ink,
                    background: on ? C.cobalt : "transparent",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.paper : C.red }} />
                  <span style={head}>{s.label}</span>
                  <span
                    className="ml-auto text-[10px]"
                    style={{ ...mono, color: on ? C.paper : C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t-2 px-5 py-4" style={{ borderColor: C.ink }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center text-[12px] font-bold"
                style={{ ...mono, background: C.ink, color: C.paper }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold" style={head}>
                  {PROFIEL.naam}
                </div>
                <div className="truncate text-[10.5px]" style={{ ...mono, color: C.muted }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-14 shrink-0 items-center gap-4 border-b-2 px-6"
            style={{ borderColor: C.ink, background: C.surface }}
          >
            <div className="flex items-baseline gap-2.5">
              <Kicker color={C.cobalt}>Rubriek</Kicker>
              <span className="text-[15px] font-bold tracking-tight" style={head}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                className="flex items-center gap-2 border-2 px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#efebe0] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.ink, color: C.ink }}
                aria-label="Zoeken openen"
              >
                <Search size={13} aria-hidden="true" />
                <span style={head}>Zoeken</span>
                <kbd className="ml-1 text-[10px]" style={{ ...mono, color: C.muted }}>
                  ⌘K
                </kbd>
              </button>
            </div>
          </header>

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

function Masthead({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="border-b-2 pb-4" style={{ borderColor: C.ink }}>
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-2 text-[30px] font-bold leading-[1.02] tracking-tight" style={head}>
        {title}
      </h2>
      <p className="mt-1.5 max-w-xl text-[13px]" style={{ color: C.muted }}>
        {sub}
      </p>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Masthead
        kicker="Voorpagina · Vandaag"
        title="Je werk, vandaag in het kort"
        sub="Wat is de status, wat vraagt actie — en welke opdrachten passen het best bij je profiel."
      />

      {/* Lead story — VOG waarschuwing met halftone */}
      <div
        className="flex items-start gap-4 border-2 p-5"
        style={{
          borderColor: C.red,
          background: C.surface,
          backgroundImage: DOTS_RED,
          backgroundSize: "10px 10px",
        }}
      >
        <AlertTriangle size={20} aria-hidden="true" style={{ color: C.red, marginTop: 2 }} />
        <div className="min-w-0 flex-1">
          <Kicker>Hoofdbericht</Kicker>
          <p className="mt-1 text-[16px] font-bold leading-snug" style={head}>
            Je VOG verloopt over <span style={mono}>23</span> dagen
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
            Vraag tijdig een nieuwe Verklaring Omtrent Gedrag aan om verifieerbaar te blijven.
          </p>
        </div>
        <button
          className="shrink-0 px-4 py-2 text-[12.5px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ ...head, background: C.red }}
        >
          Vernieuwen
        </button>
      </div>

      {/* KPI strip — ruled columns */}
      <div
        className="grid grid-cols-2 border-l-2 border-t-2 lg:grid-cols-4"
        style={{ borderColor: C.ink }}
      >
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="border-b-2 border-r-2 px-4 py-4"
            style={{ borderColor: C.ink, background: C.surface }}
          >
            <Kicker color={C.cobalt}>{k.label}</Kicker>
            <div
              className="mt-2.5 text-[30px] font-bold tabular-nums leading-none tracking-tight"
              style={head}
            >
              {k.value}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.cobalt : C.muted }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <Sparkline data={k.spark} color={i % 2 === 0 ? C.cobalt : C.red} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches column */}
        <section className="lg:col-span-2">
          <div
            className="flex items-center justify-between border-b-2 pb-2"
            style={{ borderColor: C.ink }}
          >
            <Kicker color={C.cobalt}>Beste matches</Kicker>
            <span className="text-[10px]" style={{ ...mono, color: C.faint }}>
              op match-score
            </span>
          </div>
          <div>
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-baseline gap-4 border-b py-4 text-left transition-colors hover:bg-[#efebe0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderColor: C.line }}
              >
                <span
                  className="w-7 shrink-0 text-[13px] font-bold tabular-nums"
                  style={{ ...mono, color: C.red }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold leading-snug" style={head}>
                    {o.titel}
                  </p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span
                  className="hidden text-[13px] font-medium tabular-nums sm:inline"
                  style={mono}
                >
                  {o.tarief}
                </span>
                <span
                  className="text-[18px] font-bold tabular-nums"
                  style={{ ...head, color: o.match >= 90 ? C.cobalt : C.ink }}
                >
                  {o.match}%
                </span>
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: C.red }}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Credentials column */}
        <section>
          <div className="border-b-2 pb-2" style={{ borderColor: C.ink }}>
            <Kicker>Credentials</Kicker>
          </div>
          <div>
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="flex items-start gap-2.5 border-b py-3"
                  style={{ borderColor: C.line }}
                >
                  <st.mark size={14} aria-hidden="true" style={{ color: st.color, marginTop: 2 }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold" style={head}>
                      {c.naam}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
    <div className="mx-auto max-w-5xl space-y-5">
      <Masthead
        kicker="Rubriek · Vacatures"
        title="Marktplaats"
        sub="Open opdrachten in de zorg, gefilterd op jouw profiel en verklaarbaar gesorteerd."
      />

      <div className="flex items-center gap-3">
        <div
          className="flex flex-1 items-center gap-2 border-2 px-3 py-2"
          style={{ borderColor: C.ink, background: C.surface }}
        >
          <Search size={14} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9b9484]"
            style={{ color: C.ink }}
          />
          <span className="text-[10px]" style={{ ...mono, color: C.faint }}>
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="border-2 px-6 py-16 text-center"
          style={{ borderColor: C.ink, background: C.surface }}
        >
          <Kicker>Niets gevonden</Kicker>
          <p className="mt-2 text-[16px] font-bold" style={head}>
            Geen opdrachten gevonden
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group border-2 p-5 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
              style={{
                borderColor: C.ink,
                background: C.surface,
                boxShadow: `4px 4px 0 ${i % 2 === 0 ? C.cobalt : C.red}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <Kicker>{o.id}</Kicker>
                <span
                  className="text-[20px] font-bold tabular-nums"
                  style={{ ...head, color: o.match >= 90 ? C.cobalt : C.red }}
                >
                  {o.match}
                  <span className="text-[12px]">%</span>
                </span>
              </div>
              <p className="mt-2.5 text-[16px] font-bold leading-snug" style={head}>
                {o.titel}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="border px-1.5 py-0.5 text-[10.5px] font-medium"
                    style={{ ...mono, borderColor: C.line, color: C.muted }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3 text-[12.5px] tabular-nums"
                style={{ ...mono, borderColor: C.line }}
              >
                <span className="font-bold">{o.tarief}</span>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b-2 pb-5"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Kicker>{opdracht.id} · Reportage</Kicker>
          <h2 className="mt-2 text-[30px] font-bold leading-[1.02] tracking-tight" style={head}>
            {opdracht.titel}
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ ...head, background: C.cobalt }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div
        className="grid grid-cols-2 border-l-2 border-t-2 sm:grid-cols-4"
        style={{ borderColor: C.ink }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="border-b-2 border-r-2 px-4 py-4"
            style={{ borderColor: C.ink, background: C.surface }}
          >
            <Kicker color={C.cobalt}>{m.l}</Kicker>
            <p className="mt-2 text-[19px] font-bold tabular-nums tracking-tight" style={head}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Verklaarbare matching — twee redactionele kolommen */}
      <section
        className="border-2 p-5"
        style={{
          borderColor: C.ink,
          background: C.surface,
          backgroundImage: DOTS_COBALT,
          backgroundSize: "11px 11px",
        }}
      >
        <Kicker color={C.cobalt}>Analyse</Kicker>
        <h3 className="mt-1.5 text-[18px] font-bold" style={head}>
          Waarom deze match
        </h3>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Kicker color={C.cobalt}>Pluspunten · {opdracht.redenen.plus.length}</Kicker>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13.5px]">
                  <Check size={15} aria-hidden="true" style={{ color: C.cobalt, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Kicker>Aandachtspunten · {opdracht.redenen.min.length}</Kicker>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <X size={15} aria-hidden="true" style={{ color: C.red, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Masthead
        kicker="Dossier · Vertrouwen"
        title="Verificatie"
        sub="Server-side bepaald — de bron van je vertrouwensniveau bij opdrachtgevers."
      />

      {/* Trust seal — broadsheet badge */}
      <div
        className="flex items-center gap-5 border-2 p-5"
        style={{
          borderColor: C.cobalt,
          background: C.surface,
          backgroundImage: DOTS_COBALT,
          backgroundSize: "11px 11px",
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center"
          style={{ background: C.cobalt }}
        >
          <BadgeCheck size={30} aria-hidden="true" style={{ color: C.paper }} />
        </div>
        <div className="flex-1">
          <Kicker color={C.cobalt}>Zegel</Kicker>
          <p className="mt-1 text-[20px] font-bold" style={head}>
            {PROFIEL.trust}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[34px] font-bold tabular-nums leading-none" style={head}>
            {verified}
            <span className="text-[18px]" style={{ color: C.faint }}>
              /{CREDENTIALS.length}
            </span>
          </div>
          <p className="mt-1 text-[10.5px]" style={{ ...mono, color: C.muted }}>
            geverifieerd
          </p>
        </div>
      </div>

      <div className="border-t-2" style={{ borderColor: C.ink }}>
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 border-b py-4 transition-colors hover:bg-[#efebe0]"
              style={{ borderColor: C.line }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center border-2"
                style={{ borderColor: st.color }}
              >
                <st.mark size={17} aria-hidden="true" style={{ color: st.color }} />
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
                className="text-[11px] font-bold uppercase"
                style={{ ...mono, letterSpacing: "0.1em", color: st.color }}
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
  const tone: Record<"warning" | "info", { color: string; dots: string; Icon: LucideIcon }> = {
    warning: { color: C.red, dots: DOTS_RED, Icon: AlertTriangle },
    info: { color: C.cobalt, dots: DOTS_COBALT, Icon: ListChecks },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Masthead
        kicker="Redactie · Prioriteit"
        title="Volgende acties"
        sub="Wat vraagt nu jouw aandacht — op urgentie gesorteerd."
      />
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 border-2 p-4"
              style={{
                borderColor: C.ink,
                background: C.surface,
                boxShadow: `4px 4px 0 ${t.color}`,
              }}
            >
              <span
                className="mt-0.5 text-[16px] font-bold tabular-nums"
                style={{ ...mono, color: t.color }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <t.Icon size={18} aria-hidden="true" style={{ color: t.color, marginTop: 1 }} />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-bold leading-snug" style={head}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 border-2 px-3 py-1.5 text-[12px] font-bold transition-colors hover:bg-[#efebe0] focus-visible:outline-none focus-visible:ring-2"
                style={{ ...head, borderColor: t.color, color: t.color }}
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
  const statusColor: Record<string, string> = {
    Betaald: C.cobalt,
    Openstaand: C.red,
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b-2 pb-4"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Kicker>Administratie · Boekhouding</Kicker>
          <h2 className="mt-2 text-[30px] font-bold leading-[1.02] tracking-tight" style={head}>
            Facturen
          </h2>
          <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
            Verstuurde en openstaande facturen.
          </p>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ ...head, background: C.cobalt }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="border-2" style={{ borderColor: C.ink, background: C.surface }}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2" style={{ borderColor: C.ink }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[10px] font-bold uppercase ${i >= 3 ? "text-right" : ""}`}
                  style={{ ...mono, letterSpacing: "0.12em", color: C.muted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr
                key={f.nr}
                className="border-b transition-colors hover:bg-[#efebe0]"
                style={{ borderColor: C.line }}
              >
                <td className="px-4 py-3 text-[12.5px] font-bold" style={mono}>
                  {f.nr}
                </td>
                <td className="px-4 py-3 text-[13px] font-medium" style={head}>
                  {f.klant}
                </td>
                <td className="px-4 py-3 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                  {f.datum}
                </td>
                <td
                  className="px-4 py-3 text-right text-[13.5px] font-bold tabular-nums"
                  style={mono}
                >
                  {f.bedrag}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="text-[11px] font-bold uppercase"
                    style={{
                      ...mono,
                      letterSpacing: "0.1em",
                      color: statusColor[f.status] ?? C.muted,
                    }}
                  >
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section>
        <div className="border-b-2 pb-2" style={{ borderColor: C.ink }}>
          <Kicker>Recente documenten</Kicker>
        </div>
        <div
          className="grid grid-cols-2 border-l-2 border-t-2 sm:grid-cols-4"
          style={{ borderColor: C.ink }}
        >
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="border-b-2 border-r-2 p-3.5"
                style={{ borderColor: C.ink, background: C.surface }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={13} aria-hidden="true" style={{ color: C.faint }} />
                  <st.mark size={12} aria-hidden="true" style={{ color: st.color }} />
                </div>
                <p className="mt-2 truncate text-[12px] font-bold" style={head}>
                  {d.naam}
                </p>
                <p className="text-[10.5px]" style={{ ...mono, color: C.faint }}>
                  {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
