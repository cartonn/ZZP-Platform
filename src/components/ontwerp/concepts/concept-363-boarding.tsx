"use client";

// Concept 363 — "Boarding" · Instapkaart / ticket-utility-metafoor.
// Informatie als instapkaarten en tickets: geperforeerde randen (border-dashed + halve-cirkel
// uitsparingen links/rechts van een kaart), barcode/monospace ticket-codes, stub-secties, en
// "gate/seat"-achtige velden hergebruikt voor opdracht-metadata. Palet: crisp papier (#f5f6f8) +
// inkt (#15181d) + één luchtvaart-accent (helder blauw #2563eb). Fonts: IBM Plex Mono + Geist.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plane,
  MapPin,
  CalendarDays,
  Ticket,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: papier + inkt + één blauw accent —
const C = {
  bg: "#eef0f4",
  paper: "#ffffff",
  panel: "#f5f6f8",
  ink: "#15181d",
  inkSoft: "#3a3f47",
  muted: "#6b7280",
  faint: "#9aa1ab",
  accent: "#2563eb",
  accentSoft: "#e4ecff",
  ok: "#0f9d6b",
  warn: "#d97706",
  line: "#e2e5ea",
  lineStrong: "#cdd2da",
};

const mono = { fontFamily: "var(--font-lab-plex-mono), ui-monospace, monospace" };
const display = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.ok, bg: "#e6f6ef" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.accent, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn, bg: "#fdf0dc" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, color: "#dc2626", bg: "#fdeaea" };
  }
}

// — Barcode-strook (deterministisch uit een seed) —
function Barcode({ seed, height = 34 }: { seed: string; height?: number }) {
  const bars = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: 42 }, (_, i) => {
      h = (h * 1103515245 + 12345) >>> 0;
      return 1 + ((h >> (i % 13)) % 3);
    });
  }, [seed]);
  return (
    <div className="flex items-end gap-[2px]" style={{ height }} aria-hidden="true">
      {bars.map((w, i) => (
        <span
          key={i}
          style={{ width: w, height: "100%", background: i % 7 === 0 ? C.faint : C.ink }}
        />
      ))}
    </div>
  );
}

// — Perforatie-notch: halve cirkels links/rechts + stippellijn ertussen (scheurrand) —
function Perforation({ vertical }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="relative hidden w-6 shrink-0 sm:block" aria-hidden="true">
        <span
          className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full"
          style={{ background: C.bg }}
        />
        <span
          className="absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full"
          style={{ background: C.bg }}
        />
        <span
          className="absolute inset-y-2 left-1/2 -translate-x-1/2 border-l-2 border-dashed"
          style={{ borderColor: C.lineStrong }}
        />
      </div>
    );
  }
  return (
    <div className="relative h-6" aria-hidden="true">
      <span
        className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
        style={{ background: C.bg }}
      />
      <span
        className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
        style={{ background: C.bg }}
      />
      <span
        className="absolute inset-x-3 top-1/2 -translate-y-1/2 border-t-2 border-dashed"
        style={{ borderColor: C.lineStrong }}
      />
    </div>
  );
}

// — Kaart-omslag: wit ticket met rand —
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(21,24,29,0.04), 0 8px 24px rgba(21,24,29,0.05)",
      }}
    >
      {children}
    </div>
  );
}

// — Ticket-veld (label boven, waarde in mono) zoals gate/seat —
function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p
        className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: C.faint, ...mono }}
      >
        {label}
      </p>
      <p
        className="mt-1 truncate text-[15px] font-semibold tabular-nums"
        style={{ color: accent ? C.accent : C.ink, ...mono }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusTag({ status }: { status: CredStatus }) {
  const st = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: st.bg, color: st.color, ...mono }}
    >
      <st.Icon size={12} aria-hidden="true" />
      {st.label}
    </span>
  );
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const d = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={up ? C.accent : C.warn}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Concept363() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...display, background: C.bg, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="mt-6">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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

function TopBar() {
  return (
    <header
      className="flex items-center justify-between rounded-2xl px-4 py-3"
      style={{ background: C.ink, color: C.paper }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: C.accent }}
          aria-hidden="true"
        >
          <Plane size={17} color="#fff" />
        </span>
        <div className="leading-none">
          <p className="text-[16px] font-semibold tracking-[-0.01em]">Boarding</p>
          <p
            className="mt-1 text-[10px] uppercase tracking-[0.22em]"
            style={{ color: "rgba(255,255,255,0.55)", ...mono }}
          >
            Jouw werk, ingecheckt
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium sm:inline-flex"
          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", ...mono }}
        >
          <Check size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ background: "rgba(255,255,255,0.14)", ...mono }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      className="mt-3 flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5"
      style={{ background: C.paper, border: `1px solid ${C.line}` }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={on ? { background: C.ink, color: C.paper } : { color: C.muted }}
          >
            <span
              className="mr-1.5 text-[10px] tabular-nums"
              style={{ color: on ? C.accent : C.faint, ...mono }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-6">
      {/* Boarding pass hero */}
      <div
        className="flex flex-col overflow-hidden rounded-2xl sm:flex-row"
        style={{ boxShadow: "0 8px 30px rgba(21,24,29,0.08)" }}
      >
        <div className="relative flex-1 p-6" style={{ background: C.ink, color: C.paper }}>
          <div
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,255,255,0.55)", ...mono }}
          >
            <Ticket size={13} aria-hidden="true" /> Instapkaart · Vandaag
          </div>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[36px]">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <DarkField label="Bestemming" value={PROFIEL.plaats} />
            <DarkField label="Rol" value="Wijkverpl." />
            <DarkField label="Status" value="Actief" accent />
          </div>
          <div className="mt-6">
            <Barcode seed={PROFIEL.naam} />
          </div>
        </div>
        <Perforation vertical />
        <div className="flex flex-col justify-between p-6 sm:w-72" style={{ background: C.panel }}>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.accent, ...mono }}
            >
              Gate · Volgende actie
            </p>
            <h2 className="mt-2 text-[17px] font-semibold leading-snug">{primair.titel}</h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group mt-5 inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-[13.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent }}
          >
            {primair.cta}
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </div>
      </div>

      {/* KPI stubs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div className="mt-1.5 flex items-end justify-between">
              <p
                className="text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={mono}
              >
                {k.value}
              </p>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.ok : C.warn, ...mono }}
              >
                {k.up ? "▲" : "▼"}
                {k.trend.replace(/^[+-]/, "")}
              </span>
            </div>
            <div className="mt-2">
              <Spark data={k.spark} up={k.up} />
            </div>
          </Card>
        ))}
      </div>

      {/* Opdracht-instapkaarten */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            Instapkaarten voor jou
          </p>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.accent }}
          >
            Alle opdrachten <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4">
          {OPDRACHTEN.map((o) => (
            <BoardingPass key={o.id} opdracht={o} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DarkField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p
        className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "rgba(255,255,255,0.5)", ...mono }}
      >
        {label}
      </p>
      <p
        className="mt-1 truncate text-[15px] font-semibold"
        style={{ color: accent ? "#7aa7ff" : C.paper, ...mono }}
      >
        {value}
      </p>
    </div>
  );
}

function BoardingPass({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl sm:flex-row"
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(21,24,29,0.04), 0 8px 22px rgba(21,24,29,0.05)",
      }}
    >
      <div className="min-w-0 flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {opdracht.id}
            </p>
            <h3 className="mt-1 truncate text-[18px] font-semibold leading-snug">
              {opdracht.titel}
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever}
            </p>
          </div>
          <span
            className="flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5"
            style={{ background: strong ? C.accentSoft : C.panel }}
            aria-hidden="true"
          >
            <span
              className="text-[17px] font-semibold tabular-nums leading-none"
              style={{ color: strong ? C.accent : C.ink, ...mono }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              match
            </span>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Plaats" value={opdracht.plaats} />
          <Field label="Tarief" value={opdracht.tarief.replace("€ ", "€")} accent />
          <Field label="Start" value={opdracht.start} />
          <Field label="Uren" value={opdracht.uren} />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: C.panel,
                color: C.inkSoft,
                border: `1px solid ${C.line}`,
                ...mono,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <Perforation vertical />
      <div
        className="flex flex-row items-center justify-between gap-3 p-5 sm:w-52 sm:flex-col sm:items-stretch"
        style={{ background: C.panel }}
      >
        <div className="hidden sm:block">
          <Barcode seed={opdracht.id} height={30} />
          <p className="mt-2 text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
            {opdracht.id} · {opdracht.plaats.toUpperCase().slice(0, 3)}
          </p>
        </div>
        <button
          onClick={onOpen}
          className="group inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-none"
          style={{ background: C.ink }}
        >
          Instappen
          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </button>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.accent, ...mono }}
            >
              Vertrektijden
            </p>
            <h1 className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.02em]">
              Open opdrachten
            </h1>
          </div>
          <span
            className="text-[12px] font-medium tabular-nums"
            style={{ color: C.muted, ...mono }}
          >
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")}
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="flex flex-1 items-center gap-2.5 rounded-xl px-4 py-2.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9aa1ab]"
              style={{ color: C.ink }}
            />
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
            {(["match", "tarief"] as const).map((s) => {
              const on = sort === s;
              return (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  aria-pressed={on}
                  className="rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? { background: C.accent, color: "#fff" }
                      : { background: C.panel, color: C.muted, border: `1px solid ${C.line}` }
                  }
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.accentSoft }}
            aria-hidden="true"
          >
            <Ticket size={24} style={{ color: C.accent }} />
          </span>
          <p className="mt-4 text-[19px] font-semibold">Geen vertrek gevonden</p>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm voor meer
            bestemmingen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <BoardingPass key={o.id} opdracht={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar vertrektijden
      </button>

      {/* Groot ticket */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: C.paper,
          border: `1px solid ${C.line}`,
          boxShadow: "0 10px 30px rgba(21,24,29,0.08)",
        }}
      >
        <div className="p-6" style={{ background: C.ink, color: C.paper }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.55)", ...mono }}
            >
              <Ticket size={13} aria-hidden="true" /> Instapkaart · {opdracht.id}
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "rgba(37,99,235,0.25)", color: "#9dbcff", ...mono }}
            >
              {opdracht.match}% match
            </span>
          </div>
          <h1 className="mt-4 max-w-2xl text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[34px]">
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
            <DarkField label="Tarief" value={opdracht.tarief.replace("€ ", "€")} accent />
            <DarkField label="Omvang" value={opdracht.uren} />
            <DarkField label="Start" value={opdracht.start} />
            <DarkField label="Match" value={`${opdracht.match}%`} />
          </div>
        </div>
        <Perforation />
        <div
          className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: C.panel }}
        >
          <Barcode seed={`${opdracht.id}-detail`} height={38} />
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.accent }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.paper, color: C.ink, border: `1px solid ${C.lineStrong}` }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.faint, ...mono }}
        >
          Waarom deze match
        </p>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenBlok titel="Wat past" items={opdracht.redenen.plus} kind="plus" />
          <RedenBlok titel="Aandacht" items={opdracht.redenen.min} kind="min" />
        </div>
      </Card>
    </div>
  );
}

function RedenBlok({
  titel,
  items,
  kind,
}: {
  titel: string;
  items: string[];
  kind: "plus" | "min";
}) {
  const warn = kind === "min";
  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: warn ? C.warn : C.ok, ...mono }}
      >
        {titel}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px]"
            style={{ background: C.panel, color: warn ? C.muted : C.inkSoft }}
          >
            {warn ? (
              <AlertTriangle
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.warn }}
              />
            ) : (
              <Check
                size={15}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.ok }}
              />
            )}
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.accent, ...mono }}
            >
              Toegangspassen
            </p>
            <h1 className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.02em]">
              Verificatie
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} passen volledig geverifieerd. Eén vraagt
              binnenkort om actie.
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[38px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={mono}
            >
              {ratio}
              <span className="text-[20px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              compleet
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <div
              key={c.naam}
              className="overflow-hidden rounded-2xl"
              style={{ background: C.paper, border: `1px solid ${C.line}` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: st.bg }}
                      aria-hidden="true"
                    >
                      <st.Icon size={18} style={{ color: st.color }} />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold leading-snug">{c.naam}</h3>
                      <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <StatusTag status={c.status} />
                </div>
              </div>
              <Perforation />
              <div
                className="flex items-center justify-between gap-3 px-5 py-3.5"
                style={{ background: C.panel }}
              >
                <Barcode seed={c.naam} height={22} />
                <button
                  className="shrink-0 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: c.status === "EXPIRING" ? C.warn : C.ink }}
                >
                  {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="px-2 text-[12.5px] leading-relaxed" style={{ color: C.faint }}>
        Documenten worden versleuteld bewaard en alleen na jouw expliciete toestemming gedeeld met
        een opdrachtgever.
      </p>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.accent, ...mono }}
        >
          Gate-oproepen
        </p>
        <h1 className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.02em]">
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Loop de gates op volgorde af — de dringende oproep staat bovenaan.
        </p>
      </Card>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tc = warn ? C.warn : C.accent;
          return (
            <div
              key={a.titel}
              className="flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center"
              style={{
                background: C.paper,
                border: `1px solid ${C.line}`,
                borderLeft: `4px solid ${tc}`,
              }}
            >
              <span
                className="flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-xl"
                style={{ background: warn ? "#fdf0dc" : C.accentSoft }}
                aria-hidden="true"
              >
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: tc, ...mono }}
                >
                  Gate
                </span>
                <span
                  className="text-[16px] font-semibold tabular-nums leading-none"
                  style={{ color: tc, ...mono }}
                >
                  {String.fromCharCode(65 + i)}
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {warn ? (
                    <AlertTriangle size={15} aria-hidden="true" style={{ color: tc }} />
                  ) : (
                    <MapPin size={15} aria-hidden="true" style={{ color: tc }} />
                  )}
                  <h2 className="text-[16px] font-semibold leading-snug">{a.titel}</h2>
                </div>
                <p
                  className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                  style={{ color: C.muted }}
                >
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: warn ? C.warn : C.ink }}
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

function factuurMeta(status: string): { color: string; bg: string } {
  if (status === "Betaald") return { color: C.ok, bg: "#e6f6ef" };
  if (status === "Openstaand") return { color: C.warn, bg: "#fdf0dc" };
  return { color: C.muted, bg: C.panel };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.accent, ...mono }}
          >
            Bonnetjes
          </p>
          <h1 className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.02em]">
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", warn: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", warn: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", warn: false },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.warn ? C.warn : C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {FACTUREN.map((f) => {
          const meta = factuurMeta(f.status);
          return (
            <div
              key={f.nr}
              className="flex flex-col overflow-hidden rounded-2xl sm:flex-row sm:items-stretch"
              style={{ background: C.paper, border: `1px solid ${C.line}` }}
            >
              <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center gap-1.5 text-[11px] tabular-nums"
                    style={{ color: C.faint, ...mono }}
                  >
                    <CalendarDays size={13} aria-hidden="true" /> {f.nr}
                  </span>
                  <span className="text-[15px] font-semibold">{f.klant}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] tabular-nums" style={{ color: C.muted, ...mono }}>
                    {f.datum}
                  </span>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                    style={{ background: meta.bg, color: meta.color, ...mono }}
                  >
                    {f.status}
                  </span>
                </div>
              </div>
              <div
                className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:w-40 sm:border-l sm:border-t-0"
                style={{ borderColor: C.line, background: C.panel }}
              >
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.14em] sm:hidden"
                  style={{ color: C.faint, ...mono }}
                >
                  Bedrag
                </span>
                <span
                  className="w-full text-right text-[16px] font-semibold tabular-nums"
                  style={{ color: C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="flex items-baseline justify-between px-6 py-4">
        <span
          className="text-[11.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: C.faint, ...mono }}
        >
          Totaal betaald
        </span>
        <span className="text-[22px] font-semibold tabular-nums" style={mono}>
          {totaalBetaald}
        </span>
      </Card>
    </div>
  );
}
