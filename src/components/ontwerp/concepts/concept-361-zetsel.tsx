"use client";

// Concept 361 — "Zetsel" · Zwitserse typografische rasterposter (International Typographic Style).
// Streng modulair 12-koloms raster met zichtbare hairline-rasterlijnen als ontwerp-element.
// Monochroom inkt (#111) op warm off-white (#f4f2ec), één fel rood accent (#e4322b).
// Oversized grotesk display-numerieken (Space Grotesk / Anton), Geist Mono voor labels/coördinaten.
// Geroteerde hairline-labels langs de kantlijn, baseline-uitlijning, wiskundig precieze plaatsing.
// Puur plat: geen ronde hoeken (max 2px), geen schaduwen.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
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

// — Palet: inkt op warm papier, één rood —
const C = {
  bg: "#f4f2ec",
  paper: "#faf9f5",
  ink: "#111111",
  inkSoft: "#2c2c2a",
  muted: "#63635d",
  faint: "#93938b",
  line: "rgba(17,17,17,0.16)",
  lineSoft: "rgba(17,17,17,0.08)",
  accent: "#e4322b",
};

const display = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const anton = { fontFamily: "var(--font-lab-anton), var(--font-lab-space), sans-serif" };
const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };
const bodyFont = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; accent: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, accent: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, accent: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, accent: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, accent: true };
  }
}

// — Coördinaat-label (mono, kleine caps) —
function Coord({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.24em]"
      style={{ color: accent ? C.accent : C.faint, ...mono }}
    >
      {children}
    </span>
  );
}

// — Verticaal geroteerd kantlijn-label —
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="pointer-events-none hidden select-none whitespace-nowrap text-[10px] uppercase tracking-[0.34em] lg:inline-block"
      style={{ color: C.faint, ...mono, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

// — Rechthoekige inkt-outline badge (geen ronde hoeken) —
function InkBadge({
  children,
  accent,
  solid,
}: {
  children: React.ReactNode;
  accent?: boolean;
  solid?: boolean;
}) {
  const style = solid
    ? { background: accent ? C.accent : C.ink, color: C.paper, ...mono }
    : {
        color: accent ? C.accent : C.ink,
        border: `1px solid ${accent ? C.accent : C.ink}`,
        ...mono,
      };
  return (
    <span
      className="inline-flex items-center rounded-[1px] px-2 py-[3px] text-[10px] uppercase tracking-[0.12em]"
      style={style}
    >
      {children}
    </span>
  );
}

// — Bar-sparkline, strak rechthoekig —
function BarSpark({ data, accent }: { data: number[]; accent?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const h = 12 + ((v - min) / span) * 24;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-full"
            style={{ height: h, background: last ? (accent ? C.accent : C.ink) : C.line }}
          />
        );
      })}
    </div>
  );
}

// — Sectienummer 01/02/03 groot —
function SectionNo({ n, label, accent }: { n: string; label: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="text-[13px] tabular-nums leading-none"
        style={{ color: accent ? C.accent : C.ink, ...anton }}
      >
        {n}
      </span>
      <Coord accent={accent}>{label}</Coord>
    </div>
  );
}

// — 12-koloms rasterlaag als achtergrond-ornament —
function GridRule() {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden grid-cols-12 md:grid"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="border-l" style={{ borderColor: C.lineSoft }} />
      ))}
    </div>
  );
}

function MatchBlock({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span
      className="flex h-11 w-14 flex-col items-center justify-center rounded-[1px]"
      style={{ border: `1px solid ${strong ? C.accent : C.ink}` }}
      aria-hidden="true"
    >
      <span
        className="text-[16px] font-bold tabular-nums leading-none"
        style={{ color: strong ? C.accent : C.ink, ...display }}
      >
        {value}
      </span>
      <span
        className="mt-0.5 text-[8px] uppercase tracking-[0.16em]"
        style={{ color: C.faint, ...mono }}
      >
        match
      </span>
    </span>
  );
}

export function Concept361() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, background: C.bg, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl border-x" style={{ borderColor: C.line }}>
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <div className="grid grid-cols-1 lg:grid-cols-[28px_1fr_28px]">
          <div className="hidden items-start justify-center pt-10 lg:flex">
            <SideLabel>Zetsel — Grid System</SideLabel>
          </div>
          <main className="min-w-0 px-5 py-8 md:px-8">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </main>
          <div className="hidden items-start justify-center pt-10 lg:flex">
            <SideLabel>ZZP · Utrecht · MMXXVI</SideLabel>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b px-5 py-5 md:px-8"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[1px]"
          style={{ background: C.accent }}
          aria-hidden="true"
        >
          <span className="text-[15px] leading-none" style={{ color: C.paper, ...anton }}>
            Z
          </span>
        </span>
        <div className="leading-none">
          <p className="text-[17px] font-bold tracking-[-0.01em]" style={display}>
            ZETSEL
          </p>
          <p
            className="mt-1 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: C.faint, ...mono }}
          >
            Rooster &amp; ritme
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-2 sm:inline-flex">
          <span
            className="h-2 w-2 rounded-[1px]"
            style={{ background: C.accent }}
            aria-hidden="true"
          />
          <Coord>{PROFIEL.trust}</Coord>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[1px] text-[11px]"
          style={{ border: `1px solid ${C.ink}`, ...mono }}
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
      className="flex items-stretch overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="group relative flex shrink-0 items-center gap-2 border-r px-4 py-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
            style={{
              borderColor: C.line,
              color: on ? C.paper : C.muted,
              background: on ? C.ink : "transparent",
              ...display,
            }}
          >
            <span
              className="text-[10px] tabular-nums"
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
    <div className="space-y-0">
      {/* Kop-module */}
      <section className="relative border-b pb-10" style={{ borderColor: C.ink }}>
        <GridRule />
        <div className="relative grid grid-cols-12 gap-y-6">
          <div className="col-span-12 md:col-span-8">
            <SectionNo n="01" label="Vandaag / Overzicht" />
            <h1
              className="mt-5 text-[52px] font-bold uppercase leading-[0.92] tracking-[-0.03em] md:text-[74px]"
              style={anton}
            >
              Goedemorgen,
              <br />
              <span style={{ color: C.accent }}>{PROFIEL.naam.split(" ")[0]}</span>.
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Eén raster, alles op zijn plek. De belangrijkste actie staat linksboven — de rest
              volgt de kolommen naar beneden.
            </p>
          </div>
          <div
            className="col-span-12 flex flex-col justify-between border-t pt-6 md:col-span-4 md:border-l md:border-t-0 md:pl-6 md:pt-0"
            style={{ borderColor: C.line }}
          >
            <div>
              <Coord accent>Prioriteit</Coord>
              <h2 className="mt-3 text-[19px] font-bold leading-snug" style={display}>
                {primair.titel}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                {primair.detail}
              </p>
            </div>
            <button
              onClick={onOpen}
              className="group mt-5 inline-flex items-center justify-between gap-2 rounded-[1px] px-4 py-3 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.accent, color: C.paper, ...display }}
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
      </section>

      {/* KPI-module */}
      <section className="border-b py-8" style={{ borderColor: C.ink }}>
        <div className="mb-6 flex items-center justify-between">
          <SectionNo n="02" label="Kerncijfers" />
          <Coord>07 tellingen</Coord>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="border-t px-0 py-5 md:px-5"
              style={{
                borderColor: C.line,
                ...(i % 4 !== 0 ? { borderLeft: `1px solid ${C.line}` } : {}),
              }}
            >
              <Coord>{k.label}</Coord>
              <p
                className="mt-3 text-[34px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.ink : C.accent, ...mono }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <div className="mt-3">
                <BarSpark data={k.spark} accent={!k.up} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Opdrachten-module */}
      <section className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <SectionNo n="03" label="Opdrachten voor jou" />
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.accent, ...mono }}
          >
            Alle <ArrowUpRight size={13} aria-hidden="true" />
          </button>
        </div>
        <ul>
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-t py-4 text-left transition-colors last:border-b hover:bg-[#eceae2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderColor: C.line }}
              >
                <span className="text-[12px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-bold" style={display}>
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[12px]"
                    style={{ color: C.muted, ...mono }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchBlock value={o.match} />
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
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
    <div className="space-y-8">
      <header className="border-b pb-6" style={{ borderColor: C.ink }}>
        <SectionNo n="04" label="Marktplaats" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1
            className="text-[42px] font-bold uppercase leading-[0.9] tracking-[-0.03em] md:text-[56px]"
            style={anton}
          >
            Open opdrachten
          </h1>
          <span className="pb-1 text-[13px] tabular-nums" style={{ color: C.muted, ...mono }}>
            {String(filtered.length).padStart(2, "0")} /{" "}
            {String(OPDRACHTEN.length).padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 border px-3 py-2.5"
          style={{ borderColor: C.ink }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#93938b]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-[1px] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.ink, color: C.paper, ...mono }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center border py-16 text-center"
          style={{ borderColor: C.line, borderStyle: "dashed" }}
        >
          <span className="text-[40px] leading-none" style={{ color: C.faint, ...anton }}>
            00
          </span>
          <p className="mt-4 text-[22px] font-bold uppercase tracking-[-0.02em]" style={anton}>
            Leeg raster
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen opdracht past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-[1px] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.paper, ...display }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ul>
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtRegel opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtRegel({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative border-t last:border-b" style={{ borderColor: C.ink }}>
      <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-4 py-5">
        <span className="pt-1 text-[12px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="text-[19px] font-bold leading-snug tracking-[-0.01em]" style={display}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: C.muted, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <InkBadge key={t}>{t}</InkBadge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <span
            className="text-[26px] font-bold tabular-nums leading-none"
            style={{ color: opdracht.match >= 90 ? C.accent : C.ink, ...anton }}
          >
            {opdracht.match}
          </span>
          <span className="text-[13px] font-semibold" style={{ color: C.inkSoft, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 pb-4">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="ml-10 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.accent, ...display }}
        >
          Bekijk <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-6 pb-6 pl-10 sm:grid-cols-2">
            <RedenLijst titel="Wat past" items={opdracht.redenen.plus} kind="plus" />
            <RedenLijst titel="Aandacht" items={opdracht.redenen.min} kind="min" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RedenLijst({
  titel,
  items,
  kind,
}: {
  titel: string;
  items: string[];
  kind: "plus" | "min";
}) {
  const accent = kind === "min";
  return (
    <div>
      <Coord accent={accent}>{titel}</Coord>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px]"
            style={{ color: accent ? C.muted : C.inkSoft }}
          >
            {accent ? (
              <AlertTriangle
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.accent }}
              />
            ) : (
              <Check
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.ink }}
              />
            )}
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-0">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <header className="mt-6 border-b pb-8" style={{ borderColor: C.ink }}>
        <div className="flex flex-wrap items-center gap-3">
          <InkBadge accent solid>
            {opdracht.id}
          </InkBadge>
          <InkBadge accent>{opdracht.match}% match</InkBadge>
        </div>
        <h1
          className="mt-5 max-w-3xl text-[46px] font-bold uppercase leading-[0.9] tracking-[-0.03em] md:text-[62px]"
          style={anton}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-4 text-[14px]" style={{ color: C.muted, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-[1px] px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, color: C.paper, ...display }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-[1px] px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink, border: `1px solid ${C.ink}`, ...display }}
          >
            Bewaar
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 border-b md:grid-cols-4" style={{ borderColor: C.ink }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="py-5 md:px-5"
            style={i % 4 !== 0 ? { borderLeft: `1px solid ${C.line}` } : undefined}
          >
            <Coord>{m.l}</Coord>
            <p
              className="mt-2 text-[24px] font-bold tabular-nums leading-none tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <section className="py-8">
        <SectionNo n="05" label="Waarom deze match" />
        <p className="mt-4 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <RedenLijst titel="Wat past" items={opdracht.redenen.plus} kind="plus" />
          <RedenLijst titel="Aandacht" items={opdracht.redenen.min} kind="min" />
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-8">
      <header className="border-b pb-8" style={{ borderColor: C.ink }}>
        <SectionNo n="06" label="Vertrouwen / Verificatie" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <h1
              className="text-[46px] font-bold uppercase leading-[0.9] tracking-[-0.03em] md:text-[58px]"
              style={anton}
            >
              Verificatie
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten volledig geverifieerd. Eén vraagt
              binnenkort om actie.
            </p>
          </div>
          <div className="flex items-end gap-5">
            <div className="text-right">
              <p
                className="text-[64px] font-bold tabular-nums leading-none tracking-[-0.03em]"
                style={anton}
              >
                {ratio}
                <span className="text-[24px]" style={{ color: C.muted }}>
                  %
                </span>
              </p>
              <Coord>compleet</Coord>
            </div>
          </div>
        </div>
      </header>

      <ul>
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam} className="border-t last:border-b" style={{ borderColor: C.line }}>
              <button
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 text-left transition-colors hover:bg-[#eceae2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              >
                <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <st.Icon
                      size={15}
                      aria-hidden="true"
                      style={{ color: st.accent ? C.accent : C.ink }}
                    />
                    <span className="truncate text-[16px] font-bold" style={display}>
                      {c.naam}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12px]" style={{ color: C.muted, ...mono }}>
                    {c.detail}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <InkBadge accent={st.accent}>{st.label}</InkBadge>
                  <span
                    className="transition-transform motion-reduce:transition-none"
                    style={{ color: C.muted, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </span>
              </button>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="pb-5 pl-10">
                    <p
                      className="max-w-xl text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw expliciete
                      toestemming gedeeld met een opdrachtgever.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-[1px] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ background: C.ink, color: C.paper, ...display }}
                      >
                        {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                      </button>
                      <button
                        className="rounded-[1px] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }}
                      >
                        Logboek
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <header className="border-b pb-6" style={{ borderColor: C.ink }}>
        <SectionNo n="07" label="Aandacht / Volgende acties" accent />
        <h1
          className="mt-4 text-[46px] font-bold uppercase leading-[0.9] tracking-[-0.03em] md:text-[58px]"
          style={anton}
        >
          Volgende acties
        </h1>
        <p className="mt-4 max-w-md text-[14px]" style={{ color: C.muted }}>
          Werk deze van boven naar beneden af — elke afgeronde actie houdt je profiel op orde.
        </p>
      </header>

      <ol>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel} className="border-t last:border-b" style={{ borderColor: C.line }}>
              <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[1px] text-[17px] font-bold tabular-nums"
                  style={
                    warn
                      ? { background: C.accent, color: C.paper, ...display }
                      : { border: `1px solid ${C.ink}`, color: C.ink, ...display }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn && (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.accent }} />
                    )}
                    <h2 className="text-[17px] font-bold leading-snug" style={display}>
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="justify-self-start rounded-[1px] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                  style={
                    warn
                      ? { background: C.accent, color: C.paper, ...display }
                      : { border: `1px solid ${C.ink}`, color: C.ink, ...display }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAccent(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <header
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <SectionNo n="08" label="Omzet / Facturen" />
          <h1
            className="mt-4 text-[46px] font-bold uppercase leading-[0.9] tracking-[-0.03em] md:text-[58px]"
            style={anton}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[1px] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink, color: C.paper, ...display }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </header>

      <section className="grid grid-cols-1 border-b sm:grid-cols-3" style={{ borderColor: C.ink }}>
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", accent: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", accent: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", accent: false },
        ].map((s, i) => (
          <div
            key={s.l}
            className="py-5 sm:px-6"
            style={i > 0 ? { borderLeft: `1px solid ${C.line}` } : undefined}
          >
            <Coord accent={s.accent}>{s.l}</Coord>
            <p
              className="mt-2 text-[32px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.accent ? C.accent : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.faint, ...mono }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAccent(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#eceae2] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-bold sm:order-2"
                  style={display}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <InkBadge accent={acc}>{f.status}</InkBadge>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.accent : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <Coord>Totaal betaald</Coord>
          <span className="text-[26px] font-bold tabular-nums" style={anton}>
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
