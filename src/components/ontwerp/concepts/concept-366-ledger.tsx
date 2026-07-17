"use client";

// Concept 366 — "Ledger" · Boekhoudkundig grootboek op greenbar-papier.
// Dubbel-boekhouden als designtaal: warm papier-ivoor met ingetogen greenbar-arcering, debet/credit-
// kolommen, tabulaire cijfers overal, dunne dubbele onderstreping bij totalen en een ingedrukt
// "stempel"-motief voor status. Palet: papier-ivoor (#f7f5ed), inkt-zwart (#1b1a15), grootboek-groen
// (#2f6b4f) als structuur en één rood (#a4331f) voor openstaande/negatieve posten. Analoog, warm — geen
// trading-terminal. Fonts: JetBrains Mono / Spline Mono voor cijfers, Newsreader (serif) voor koppen.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Stamp,
  BookOpen,
  ChevronRight,
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

// — Palet: warm grootboekpapier, inkt-zwart, grootboek-groen, één rood —
const C = {
  paper: "#f7f5ed",
  paperDeep: "#efece0",
  bar: "#e7ecdf", // greenbar arcering (ingetogen)
  card: "#fdfcf6",
  ink: "#1b1a15",
  inkSoft: "#3c3a2f",
  muted: "#6b6857",
  faint: "#9a967f",
  green: "#2f6b4f",
  greenSoft: "#dce7de",
  greenFaint: "#e9f0e8",
  red: "#a4331f",
  redSoft: "#f2ddd6",
  rule: "rgba(27,26,21,0.16)",
  ruleSoft: "rgba(27,26,21,0.09)",
  hair: "rgba(47,107,79,0.28)",
};

const serif = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const num = {
  fontFamily: "var(--font-lab-spline-mono), var(--font-lab-mono), ui-monospace, monospace",
};
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.muted, bg: C.paperDeep };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, fg: C.red, bg: C.redSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, fg: C.red, bg: C.redSoft };
  }
}

// — Ingedrukt stempel-motief voor status —
function StatusStamp({ status }: { status: CredStatus }) {
  const m = statusMeta(status);
  return (
    <span
      className="inline-flex -rotate-2 items-center gap-1.5 rounded-[3px] px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.14em]"
      style={{
        color: m.fg,
        border: `1.5px solid ${m.fg}`,
        background: "transparent",
        boxShadow: `inset 0 0 0 2px ${C.paper}`,
        ...mono,
      }}
    >
      <m.Icon size={11} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// — Kolomkop van het grootboek —
function LedgerHead({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <span
      className={`text-[10px] uppercase leading-none tracking-[0.18em] ${right ? "text-right" : ""}`}
      style={{ color: C.faint, ...mono }}
    >
      {children}
    </span>
  );
}

function Overline({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: red ? C.red : C.green, ...mono }}
    >
      {children}
    </p>
  );
}

// — Greenbar-rij: subtiele afwisselende arcering zoals klassiek grootboekprintpapier —
function bar(i: number): React.CSSProperties {
  return i % 2 === 1 ? { background: C.bar } : { background: "transparent" };
}

// — Sparkline als grootboek-inkt penlijn (geen neon) —
function Penline({ data, negative }: { data: number[]; negative?: boolean }) {
  const w = 132;
  const h = 34;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stroke = negative ? C.red : C.green;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line x1="0" y1={h - 0.5} x2={w} y2={h - 0.5} stroke={C.hair} strokeWidth="1" />
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-[2px] px-2 py-0.5 text-[10.5px] tracking-[0.04em]"
      style={{ color: C.inkSoft, border: `1px solid ${C.rule}`, background: C.card, ...mono }}
    >
      {children}
    </span>
  );
}

export function Concept366() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{
        background: C.paper,
        color: C.ink,
        fontFamily: "var(--font-lab-mono), ui-monospace, monospace",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
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
      className="flex items-center justify-between border-b-2 py-5"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[4px]"
          style={{ background: C.green, color: C.paper }}
          aria-hidden="true"
        >
          <BookOpen size={20} />
        </span>
        <div>
          <p className="text-[22px] font-semibold leading-none tracking-[-0.01em]" style={serif}>
            Grootboek
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.26em]"
            style={{ color: C.faint, ...mono }}
          >
            ZZP · boekjaar 2025
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] sm:inline-flex"
          style={{
            color: C.green,
            border: `1px solid ${C.hair}`,
            background: C.greenFaint,
            ...mono,
          }}
        >
          <Stamp size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span className="text-right leading-tight">
          <span className="block text-[13px] font-semibold" style={serif}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            {PROFIEL.plaats}
          </span>
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[12px] font-bold"
          style={{ border: `1.5px solid ${C.ink}`, color: C.ink, ...num }}
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
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.rule }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-3.5 py-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted, ...mono }}
          >
            <span
              className="mr-1.5 text-[10px] tabular-nums"
              style={{ color: on ? C.green : C.faint, ...num }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-2.5 -bottom-px h-[3px]"
                style={{ background: C.green }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// — Herbruikbaar: greenbar-paneel met titelbalk —
function LedgerPanel({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-[6px]"
      style={{ border: `1px solid ${C.rule}`, background: C.card }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: C.rule, background: C.greenFaint }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: C.green, ...mono }}
        >
          {title}
        </span>
        {meta && (
          <span
            className="text-[10.5px] uppercase tracking-[0.12em]"
            style={{ color: C.faint, ...mono }}
          >
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-8">
      {/* Openingspost */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col justify-between">
          <div>
            <Overline>Balans · vandaag</Overline>
            <h1
              className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.01em] md:text-[46px]"
              style={serif}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Je boeken zijn bij. Eén post vraagt aandacht — de rest staat netjes in het zwart.
            </p>
          </div>
          <dl
            className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[6px]"
            style={{ background: C.rule }}
          >
            {[
              { l: "Debet (te ontvangen)", v: "€ 1.350", red: true },
              { l: "Credit (voldaan mnd)", v: "€ 8.622", red: false },
            ].map((r) => (
              <div key={r.l} className="px-4 py-3.5" style={{ background: C.card }}>
                <dt
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: C.faint, ...mono }}
                >
                  {r.l}
                </dt>
                <dd
                  className="mt-1.5 text-[24px] font-semibold tabular-nums tracking-[-0.01em]"
                  style={{ color: r.red ? C.red : C.green, ...num }}
                >
                  {r.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="flex flex-col justify-between rounded-[6px] p-5"
          style={{ background: C.ink, color: C.paper }}
        >
          <div>
            <p
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "#c9b96a", ...mono }}
            >
              <Stamp size={13} aria-hidden="true" /> Openstaande post
            </p>
            <h2 className="mt-3 text-[19px] font-semibold leading-snug" style={serif}>
              {primair.titel}
            </h2>
            <p
              className="mt-2 text-[12.5px] leading-relaxed"
              style={{ color: "rgba(247,245,237,0.72)" }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group mt-6 inline-flex items-center justify-between gap-2 rounded-[4px] px-4 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b96a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1a15]"
            style={{ background: C.green, color: C.paper, ...mono }}
          >
            {primair.cta}
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </div>
      </section>

      {/* Grootboek-KPI's op greenbar */}
      <LedgerPanel title="Kengetallen" meta="7 tellen">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="px-4 py-4"
              style={{
                ...bar(i),
                borderLeft: i % 4 === 0 ? undefined : `1px solid ${C.ruleSoft}`,
              }}
            >
              <div className="flex items-baseline justify-between">
                <p
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="text-[10.5px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.red, ...num }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-1.5 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                style={{ ...num }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <Penline data={k.spark} negative={!k.up} />
              </div>
            </div>
          ))}
        </div>
      </LedgerPanel>

      {/* Opdracht-journaal */}
      <LedgerPanel title="Journaal · opdrachten voor jou" meta={`${OPDRACHTEN.length} posten`}>
        <div
          className="hidden grid-cols-[2.5rem_1fr_5rem_6rem] gap-4 px-4 py-2 sm:grid"
          style={{ borderBottom: `1px solid ${C.rule}` }}
        >
          <LedgerHead>Nr</LedgerHead>
          <LedgerHead>Omschrijving</LedgerHead>
          <LedgerHead right>Match</LedgerHead>
          <LedgerHead right>Tarief</LedgerHead>
        </div>
        <ul>
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-4 py-3.5 text-left transition-colors hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6b4f] sm:grid-cols-[2.5rem_1fr_5rem_6rem]"
                style={bar(i)}
              >
                <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...num }}>
                  {String(i + 1).padStart(3, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold" style={serif}>
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11.5px]"
                    style={{ color: C.muted, ...mono }}
                  >
                    {o.opdrachtgever} · {o.plaats}
                  </span>
                </span>
                <span
                  className="hidden text-right text-[14px] font-semibold tabular-nums sm:inline"
                  style={{ color: o.match >= 90 ? C.green : C.inkSoft, ...num }}
                >
                  {o.match}%
                </span>
                <span className="flex items-center justify-end gap-2">
                  <span className="text-[13px] font-semibold tabular-nums" style={{ ...num }}>
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.green }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </LedgerPanel>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek · marktplaats</Overline>
          <h1
            className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={serif}
          >
            Open opdrachten
          </h1>
        </div>
        <span
          className="text-[11px] uppercase tracking-[0.14em]"
          style={{ color: C.faint, ...num }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          posten
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[4px] px-3 py-2.5"
          style={{ border: `1px solid ${C.rule}`, background: C.card }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op post, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9a967f]"
            style={{ color: C.ink, ...mono }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-[4px] px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.green, color: C.paper, ...mono }
                    : { color: C.muted, border: `1px solid ${C.rule}`, background: C.card, ...mono }
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
          className="flex flex-col items-center rounded-[6px] py-16 text-center"
          style={{ border: `1px dashed ${C.rule}`, background: C.card }}
        >
          <BookOpen size={30} aria-hidden="true" style={{ color: C.faint }} />
          <p className="mt-4 text-[20px] font-semibold" style={serif}>
            Lege grootboekpagina
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen post past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm om de pagina
            weer te vullen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.paper, ...mono }}
          >
            Zoekopdracht wissen <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o, i) => (
            <OpdrachtKaart key={o.id} opdracht={o} index={i} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtKaart({
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
    <article
      className="overflow-hidden rounded-[6px]"
      style={{ border: `1px solid ${C.rule}`, background: C.card }}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 p-4">
        <span
          className="mt-0.5 flex h-9 w-11 items-center justify-center rounded-[3px] text-[11px] tabular-nums"
          style={{
            border: `1px solid ${C.rule}`,
            background: C.greenFaint,
            color: C.green,
            ...num,
          }}
        >
          {String(index + 1).padStart(3, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold leading-snug" style={serif}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[11.5px]" style={{ color: C.muted, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[19px] font-semibold tabular-nums leading-none"
            style={{ color: opdracht.match >= 90 ? C.green : C.ink, ...num }}
          >
            {opdracht.match}%
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.faint, ...mono }}
          >
            match
          </span>
          <span className="mt-1 text-[13px] font-semibold tabular-nums" style={{ ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="flex items-center gap-4 border-t px-4 py-2.5"
        style={{ borderColor: C.ruleSoft, background: C.paper }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          <Plus
            size={13}
            aria-hidden="true"
            className="transition-transform motion-reduce:transition-none"
            style={{ transform: open ? "rotate(45deg)" : "none" }}
          />
          Toelichting match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.green, ...mono }}
        >
          Boeken <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <RedenenLedger opdracht={opdracht} />
        </div>
      </div>
    </article>
  );
}

// — Redenen als debet/credit-tabel (het hart van de designtaal) —
function RedenenLedger({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ borderTop: `1px solid ${C.rule}` }}>
      <div className="p-4" style={{ borderRight: `1px solid ${C.rule}` }}>
        <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.green, ...mono }}>
          Debet · wat past
        </p>
        <ul className="mt-3 space-y-2">
          {opdracht.redenen.plus.map((r, i) => (
            <li
              key={r}
              className="flex items-start gap-2 text-[13px]"
              style={{ ...bar(i), color: C.inkSoft }}
            >
              <Check
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.green }}
              />
              <span className="py-0.5">{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.red, ...mono }}>
          Credit · aandacht
        </p>
        <ul className="mt-3 space-y-2">
          {opdracht.redenen.min.map((r, i) => (
            <li
              key={r}
              className="flex items-start gap-2 text-[13px]"
              style={{ ...bar(i), color: C.muted }}
            >
              <AlertTriangle
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.red }}
              />
              <span className="py-0.5">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar journaal
      </button>

      <header
        className="rounded-[6px] p-6"
        style={{ border: `1px solid ${C.rule}`, background: C.card }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="text-[11px] font-semibold tabular-nums tracking-[0.1em]"
            style={{ color: C.green, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center rounded-[3px] px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              color: C.green,
              border: `1px solid ${C.hair}`,
              background: C.greenFaint,
              ...num,
            }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[42px]"
          style={serif}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.muted, ...mono }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-[4px] px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.green, color: C.paper, ...mono }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-[4px] px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink, border: `1px solid ${C.ink}`, ...mono }}
          >
            Bewaar in map
          </button>
        </div>
      </header>

      <section
        className="grid grid-cols-2 overflow-hidden rounded-[6px] md:grid-cols-4"
        style={{ border: `1px solid ${C.rule}`, background: C.card }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), sub: "per uur" },
          { l: "Omvang", v: opdracht.uren.replace(" u/week", ""), sub: "uur / week" },
          { l: "Start", v: opdracht.start, sub: "ingangsdatum" },
          { l: "Match", v: `${opdracht.match}%`, sub: "geverifieerd" },
        ].map((m, i) => (
          <div
            key={m.l}
            className="px-4 py-4"
            style={{ ...bar(i), borderLeft: i === 0 ? undefined : `1px solid ${C.ruleSoft}` }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ ...num }}
            >
              {m.v}
            </p>
            <p
              className="mt-0.5 text-[10.5px] uppercase tracking-[0.1em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.sub}
            </p>
          </div>
        ))}
      </section>

      <LedgerPanel title="Toelichting match · debet & credit">
        <p
          className="max-w-2xl px-4 pt-4 text-[13.5px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten links, de aandacht
          rechts, zonder verborgen score.
        </p>
        <div className="p-4">
          <RedenenLedger opdracht={opdracht} />
        </div>
      </LedgerPanel>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <header
        className="flex flex-wrap items-end justify-between gap-6 rounded-[6px] p-6"
        style={{ border: `1px solid ${C.rule}`, background: C.card }}
      >
        <div className="max-w-md">
          <Overline>Vertrouwensrekening</Overline>
          <h1
            className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={serif}
          >
            Verificatie
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-semibold" style={{ color: C.green }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten volledig geverifieerd. Eén post vraagt
            binnenkort om actie.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right">
            <p
              className="text-[42px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
              style={{ ...num }}
            >
              {ratio}
              <span className="text-[20px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[10px] uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              saldo compleet
            </p>
          </div>
        </div>
      </header>

      <div
        className="overflow-hidden rounded-[6px]"
        style={{ border: `1px solid ${C.rule}`, background: C.card }}
      >
        <div
          className="hidden grid-cols-[2.5rem_1fr_11rem] gap-4 px-4 py-2 sm:grid"
          style={{ borderBottom: `1px solid ${C.rule}`, background: C.greenFaint }}
        >
          <LedgerHead>Nr</LedgerHead>
          <LedgerHead>Certificaat</LedgerHead>
          <LedgerHead right>Status</LedgerHead>
        </div>
        <ul>
          {CREDENTIALS.map((c, i) => {
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-4 py-3.5 text-left transition-colors hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6b4f]"
                  style={bar(i)}
                >
                  <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...num }}>
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold" style={serif}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block text-[11.5px]"
                      style={{ color: C.muted, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusStamp status={c.status} />
                    <Plus
                      size={14}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.muted, transform: isOpen ? "rotate(45deg)" : "none" }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pl-14" style={{ background: C.paper }}>
                      <p
                        className="max-w-xl pt-3 text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                        expliciete toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-[4px] px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ background: C.green, color: C.paper, ...mono }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className="rounded-[4px] px-3.5 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ color: C.inkSoft, border: `1px solid ${C.rule}` }}
                        >
                          Boekingsregels
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
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <header>
        <Overline red>Openstaande posten</Overline>
        <h1
          className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={serif}
        >
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14px]" style={{ color: C.muted }}>
          Boek deze posten af op volgorde — elke afgeronde regel houdt je grootboek sluitend.
        </p>
      </header>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="grid grid-cols-1 gap-4 rounded-[6px] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              style={{
                border: `1px solid ${warn ? C.hair : C.rule}`,
                background: warn ? C.redSoft : C.card,
              }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[4px] text-[14px] font-bold tabular-nums"
                style={
                  warn
                    ? { background: C.red, color: C.paper, ...num }
                    : { border: `1.5px solid ${C.ink}`, color: C.ink, ...num }
                }
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {warn ? (
                    <AlertTriangle size={15} aria-hidden="true" style={{ color: C.red }} />
                  ) : (
                    <Clock size={14} aria-hidden="true" style={{ color: C.green }} />
                  )}
                  <h2 className="text-[16px] font-semibold leading-snug" style={serif}>
                    {a.titel}
                  </h2>
                </div>
                <p
                  className="mt-1 max-w-lg text-[13px] leading-relaxed"
                  style={{ color: warn ? C.inkSoft : C.muted }}
                >
                  {a.detail}
                </p>
              </div>
              <button
                className="justify-self-start rounded-[4px] px-5 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                style={
                  warn
                    ? { background: C.red, color: C.paper, ...mono }
                    : { border: `1px solid ${C.ink}`, color: C.ink, ...mono }
                }
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTint(status: string): { fg: string; open: boolean } {
  if (status === "Openstaand") return { fg: C.red, open: true };
  if (status === "Concept") return { fg: C.muted, open: false };
  return { fg: C.green, open: false };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek · debiteuren</Overline>
          <h1
            className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={serif}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[4px] px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink, color: C.paper, ...mono }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </header>

      <section
        className="grid grid-cols-1 overflow-hidden rounded-[6px] sm:grid-cols-3"
        style={{ border: `1px solid ${C.rule}`, background: C.card }}
      >
        {[
          { l: "Credit · betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", fg: C.green },
          { l: "Debet · openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", fg: C.red },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", fg: C.muted },
        ].map((s, i) => (
          <div
            key={s.l}
            className="px-5 py-4"
            style={{ ...bar(i), borderLeft: i === 0 ? undefined : `1px solid ${C.ruleSoft}` }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ color: s.fg, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.faint, ...mono }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div
        className="overflow-hidden rounded-[6px]"
        style={{ border: `1px solid ${C.rule}`, background: C.card }}
      >
        <div
          className="hidden grid-cols-[7rem_1fr_4.5rem_8rem_6.5rem] gap-4 px-4 py-2.5 sm:grid"
          style={{ borderBottom: `2px solid ${C.ink}`, background: C.greenFaint }}
        >
          <LedgerHead>Nummer</LedgerHead>
          <LedgerHead>Debiteur</LedgerHead>
          <LedgerHead>Datum</LedgerHead>
          <LedgerHead>Status</LedgerHead>
          <LedgerHead right>Bedrag</LedgerHead>
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const t = factuurTint(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:brightness-[0.98] sm:grid-cols-[7rem_1fr_4.5rem_8rem_6.5rem] sm:gap-4"
                style={bar(i)}
              >
                <span
                  className="order-1 text-[11.5px] tabular-nums"
                  style={{ color: C.faint, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={serif}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: t.fg, ...mono }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: t.fg }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14.5px] font-semibold tabular-nums sm:order-5"
                  style={{ color: t.open ? C.red : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        {/* Dubbele onderstreping bij het totaal — grootboekconventie */}
        <div
          className="flex items-baseline justify-between px-4 py-3.5"
          style={{ background: C.greenFaint }}
        >
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.green, ...mono }}
          >
            Totaal credit (betaald)
          </span>
          <span
            className="pb-1 text-[22px] font-semibold tabular-nums"
            style={{
              ...num,
              borderBottom: `1px solid ${C.ink}`,
              boxShadow: `0 3px 0 -1px ${C.ink}`,
            }}
          >
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
