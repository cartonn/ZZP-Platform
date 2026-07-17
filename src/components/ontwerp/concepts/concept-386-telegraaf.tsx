"use client";

// Concept 386 — "Telegraaf" · Data-dicht draadbericht / telex-terminal.
// Maximale informatiedichtheid voor de bemiddelaar: monospace overal, compacte rijen, tickerband-
// koppen, inline-sparklines, twee-koloms lijst+detail waar passend, tabulaire cijfers en telex-
// statusregels. Elke pixel werkt. Rustig maar hoog-dicht — geen rommel, strak raster.
// Status altijd label + icoon (glyph), nooit alleen kleur.
// Palet: papier #f7f6f2 / inkt #16150f / amber-signaal #b4770e / groen-ok #2f6b3d / rood-alarm #b23b2e.
// Fonts: IBM Plex Mono (data), Inter (labels).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Circle,
  Radio,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: telex-terminal —
const C = {
  paper: "#f7f6f2",
  paperAlt: "#efeee7",
  panel: "#fbfbf7",
  ink: "#16150f",
  inkSoft: "#3d3a2e",
  muted: "#6f6a58",
  faint: "#98917c",
  line: "rgba(22,21,15,0.16)",
  lineSoft: "rgba(22,21,15,0.08)",
  amber: "#b4770e",
  amberBg: "rgba(180,119,14,0.1)",
  green: "#2f6b3d",
  greenBg: "rgba(47,107,61,0.1)",
  red: "#b23b2e",
  redBg: "rgba(178,59,46,0.1)",
};

const mono = { fontFamily: "var(--font-lab-plex-mono), ui-monospace, monospace" };
const sans = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  bg: string;
  glyph: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "GEVERIFIEERD",
        Icon: Check,
        alarm: false,
        tone: C.green,
        bg: C.greenBg,
        glyph: "[OK]",
      };
    case "SUBMITTED":
      return {
        label: "IN BEHANDELING",
        Icon: Clock,
        alarm: false,
        tone: C.muted,
        bg: C.paperAlt,
        glyph: "[..]",
      };
    case "EXPIRING":
      return {
        label: "VERLOOPT BINNENKORT",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.amber,
        bg: C.amberBg,
        glyph: "[!!]",
      };
    case "REJECTED":
      return {
        label: "AFGEWEZEN",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.red,
        bg: C.redBg,
        glyph: "[XX]",
      };
  }
}

// — Inline telex-sparkline (fijn, tabulair) —
function WireSpark({ data, tone, width = 92 }: { data: number[]; tone: string; width?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const h = 22;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = h - ((d - min) / span) * (h - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// — Tickerband-kop: telex-doorloopregel —
function Ticker({ items, tone = C.ink }: { items: string[]; tone?: string }) {
  return (
    <div
      className="flex items-center gap-0 overflow-hidden whitespace-nowrap border-y text-[11px]"
      style={{ borderColor: C.line, background: C.panel, ...mono }}
      aria-hidden="true"
    >
      <span
        className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 font-semibold uppercase tracking-[0.1em] text-white"
        style={{ background: C.ink }}
      >
        <Radio size={12} /> WIRE
      </span>
      <div className="flex items-center gap-6 px-4 py-1.5" style={{ color: tone }}>
        {items.map((it, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="opacity-40">•</span>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function Panel({
  children,
  className = "",
  title,
  meta,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  meta?: string;
}) {
  return (
    <section className={className} style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      {title && (
        <div
          className="flex items-center justify-between border-b px-3 py-1.5"
          style={{ borderColor: C.line, background: C.paperAlt }}
        >
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.inkSoft, ...mono }}
          >
            {title}
          </span>
          {meta && (
            <span
              className="text-[10px] uppercase tracking-[0.08em]"
              style={{ color: C.faint, ...mono }}
            >
              {meta}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

function MatchCell({ value }: { value: number }) {
  const tone = value >= 90 ? C.green : value >= 85 ? C.amber : C.muted;
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: tone, ...mono }}>
        {String(value).padStart(2, "0")}%
      </span>
      <span className="h-2 w-12 overflow-hidden border" style={{ borderColor: C.line }}>
        <span className="block h-full" style={{ width: `${value}%`, background: tone }} />
      </span>
    </span>
  );
}

export function Concept386() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...mono, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-16 pt-4">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
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

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-3"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center"
          style={{ background: C.ink }}
          aria-hidden="true"
        >
          <Radio size={17} color={C.amber} />
        </span>
        <div>
          <p
            className="text-[17px] font-bold uppercase leading-none tracking-[0.14em]"
            style={{ ...mono, color: C.ink }}
          >
            TELEGRAAF
          </p>
          <p
            className="mt-1 text-[9.5px] uppercase leading-none tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            WIRE-TERMINAL · {PROFIEL.plaats.toUpperCase()} · CH-07
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
          style={{
            background: C.greenBg,
            color: C.green,
            border: `1px solid ${C.green}44`,
            ...mono,
          }}
        >
          <Circle size={7} fill={C.green} strokeWidth={0} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span
            className="block text-[12px] font-semibold leading-tight"
            style={{ color: C.ink, ...mono }}
          >
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[9.5px] uppercase tracking-[0.06em]"
            style={{ color: C.faint, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center text-[11px] font-bold"
          style={{ background: C.amber, color: "#fff", ...mono }}
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
      aria-label="Hoofdnavigatie"
      style={{ borderColor: C.line }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none"
            style={{
              ...mono,
              color: on ? C.ink : C.faint,
              background: on ? C.panel : "transparent",
            }}
          >
            <span className="mr-1.5 opacity-50">{String(i + 1).padStart(2, "0")}</span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-0 -bottom-px h-[2px]"
                style={{ background: C.amber }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-4">
      <Ticker
        items={[
          "MATCH 92% ▲",
          "OPEN REACTIES 07 ▲",
          `${ongelezen} NIEUWE BERICHTEN`,
          "VOG VERLOOPT · 23 DAGEN",
          "FAC-2025-118 OPENSTAAND · €1.350",
        ]}
      />

      <div className="flex items-baseline justify-between pt-1">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            {new Date().toLocaleDateString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            · 09:24
          </p>
          <h1
            className="mt-0.5 text-[22px] font-bold tracking-[0.02em]"
            style={{ ...mono, color: C.ink }}
          >
            GOEDEMORGEN, {(PROFIEL.naam.split(" ")[0] ?? PROFIEL.naam).toUpperCase()}
          </h1>
        </div>
        <button
          onClick={onActies}
          className="group hidden items-center gap-2 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:inline-flex"
          style={{ background: C.ink, ...mono }}
        >
          VOLGENDE ACTIE
          <ArrowRight
            size={13}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </button>
      </div>

      {/* KPI-strook: dichte tabelvorm met inline sparklines */}
      <Panel title="KENGETALLEN · DEZE MAAND" meta="LIVE FEED">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="border-b border-r p-3 last:border-r-0 lg:border-b-0"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="truncate text-[9.5px] uppercase tracking-[0.1em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="ml-2 shrink-0 text-[10px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.amber }}
                >
                  {k.up ? "▲" : "▼"}
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p
                  className="text-[24px] font-bold tabular-nums leading-none"
                  style={{ ...mono, color: C.ink }}
                >
                  {k.value}
                </p>
                <WireSpark
                  data={k.spark}
                  tone={k.up ? C.green : C.amber}
                  width={i % 2 === 0 ? 72 : 64}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Opdrachten-telex */}
        <Panel title="OPEN OPDRACHTEN" meta={`${OPDRACHTEN.length} REGELS`}>
          <div
            className="hidden grid-cols-[2.5rem_1fr_9rem_7rem] gap-2 border-b px-3 py-1.5 sm:grid"
            style={{ borderColor: C.line, background: C.paperAlt }}
          >
            {["ID", "OMSCHRIJVING", "OPDRACHTGEVER", "MATCH"].map((h) => (
              <span
                key={h}
                className="text-[9px] uppercase tracking-[0.12em]"
                style={{ color: C.faint, ...mono }}
              >
                {h}
              </span>
            ))}
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-2 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#efeee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:grid-cols-[2.5rem_1fr_9rem_7rem]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[13px] font-semibold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.04em] sm:hidden"
                      style={{ color: C.muted, ...mono }}
                    >
                      {o.opdrachtgever} · {o.tarief}
                    </span>
                  </span>
                  <span
                    className="hidden truncate text-[11px] sm:block"
                    style={{ color: C.muted, ...mono }}
                  >
                    {o.opdrachtgever}
                  </span>
                  <MatchCell value={o.match} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Signaal-kolom: primaire actie + berichten */}
        <div className="space-y-4">
          <Panel title="SIGNAAL · PRIORITEIT">
            <div className="p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold" style={{ color: C.amber, ...mono }}>
                  [!!]
                </span>
                <span
                  className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.amber, ...mono }}
                >
                  URGENT
                </span>
              </div>
              <h3
                className="mt-1.5 text-[14px] font-semibold leading-snug"
                style={{ ...sans, color: C.ink }}
              >
                {primair.titel}
              </h3>
              <p className="mt-1 text-[11.5px] leading-relaxed" style={{ ...sans, color: C.muted }}>
                {primair.detail}
              </p>
              <button
                onClick={onActies}
                className="group mt-3 inline-flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ background: C.amber, color: "#fff", ...mono }}
              >
                {primair.cta}
                <ArrowRight
                  size={13}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </button>
            </div>
          </Panel>

          <Panel title="INBOX" meta={`${ongelezen} NIEUW`}>
            <ul>
              {BERICHTEN.map((b) => (
                <li
                  key={b.van}
                  className="flex items-start gap-2.5 border-b px-3 py-2 last:border-b-0"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      background: b.ongelezen ? C.ink : C.paperAlt,
                      color: b.ongelezen ? C.amber : C.muted,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[11.5px] font-semibold"
                        style={{ ...sans, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[9.5px] tabular-nums"
                        style={{ color: C.faint, ...mono }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px]" style={{ ...sans, color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  {b.ongelezen && (
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: C.amber }}
                      aria-label="ongelezen"
                    />
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [sel, setSel] = useState<string>(OPDRACHTEN[0]?.id ?? "");

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

  const active = filtered.find((o) => o.id === sel) ?? filtered[0];

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 border px-3 py-2"
          style={{ borderColor: C.line, background: C.panel }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK: TITEL / PLAATS / OPDRACHTGEVER"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[11.5px] uppercase tracking-[0.04em] outline-none placeholder:text-[#98917c]"
            style={{ color: C.ink, ...mono }}
          />
        </div>
        <div
          className="flex items-stretch border"
          role="group"
          aria-label="Sorteren"
          style={{ borderColor: C.line }}
        >
          <span
            className="flex items-center px-2.5 text-[9.5px] uppercase tracking-[0.1em]"
            style={{ color: C.faint, background: C.paperAlt, ...mono }}
          >
            SORT
          </span>
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none"
                style={{ ...mono, background: on ? C.ink : C.panel, color: on ? C.amber : C.muted }}
              >
                {s === "match" ? "MATCH" : "TARIEF"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel title="RESULTAAT" meta="00 REGELS">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="text-[13px] font-bold tracking-[0.1em]"
              style={{ color: C.amber, ...mono }}
            >
              [ GEEN VERBINDING ]
            </span>
            <p className="mt-3 text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
              Geen opdracht op de lijn
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-[12px]" style={{ ...sans, color: C.muted }}>
              Geen regel past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om het
              telex-kanaal opnieuw te openen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ background: C.ink, ...mono }}
            >
              WIS ZOEKTERM <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_22rem]">
          {/* Lijst */}
          <Panel
            title="OPEN OPDRACHTEN"
            meta={`${String(filtered.length).padStart(2, "0")} / ${String(OPDRACHTEN.length).padStart(2, "0")}`}
          >
            <ul>
              {filtered.map((o, i) => {
                const on = active?.id === o.id;
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => setSel(o.id)}
                      aria-pressed={on}
                      className="grid w-full grid-cols-[1.75rem_1fr_auto] items-center gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#efeee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      style={{
                        borderColor: C.lineSoft,
                        background: on ? C.paperAlt : "transparent",
                      }}
                    >
                      <span
                        className="text-[10px] tabular-nums"
                        style={{ color: on ? C.amber : C.faint, ...mono }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[13px] font-semibold"
                          style={{ ...sans, color: C.ink }}
                        >
                          {o.titel}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.04em]"
                          style={{ color: C.muted, ...mono }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <MatchCell value={o.match} />
                        <ChevronRight
                          size={14}
                          aria-hidden="true"
                          style={{ color: on ? C.amber : C.faint }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* Detail-paneel (waarom deze match) */}
          {active && (
            <Panel title="DOSSIER" meta={active.id}>
              <div className="p-3">
                <h3
                  className="text-[15px] font-semibold leading-snug"
                  style={{ ...sans, color: C.ink }}
                >
                  {active.titel}
                </h3>
                <p
                  className="mt-1 text-[11px] uppercase tracking-[0.04em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {active.opdrachtgever} · {active.plaats}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-px" style={{ background: C.line }}>
                  {[
                    { l: "TARIEF", v: active.tarief },
                    { l: "OMVANG", v: active.uren },
                    { l: "START", v: active.start },
                    { l: "MATCH", v: `${active.match}%` },
                  ].map((m) => (
                    <div key={m.l} className="p-2" style={{ background: C.panel }}>
                      <p
                        className="text-[9px] uppercase tracking-[0.1em]"
                        style={{ color: C.faint, ...mono }}
                      >
                        {m.l}
                      </p>
                      <p
                        className="mt-0.5 text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: C.ink }}
                      >
                        {m.v}
                      </p>
                    </div>
                  ))}
                </div>

                <p
                  className="mt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.green, ...mono }}
                >
                  [OK] PLUSPUNTEN
                </p>
                <ul className="mt-1.5 space-y-1">
                  {active.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-1.5 text-[12px]"
                      style={{ ...sans, color: C.inkSoft }}
                    >
                      <Check
                        size={12}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        style={{ color: C.green }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>

                <p
                  className="mt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.amber, ...mono }}
                >
                  [!!] AANDACHTSPUNTEN
                </p>
                <ul className="mt-1.5 space-y-1">
                  {active.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-1.5 text-[12px]"
                      style={{ ...sans, color: C.muted }}
                    >
                      <AlertTriangle
                        size={11}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        style={{ color: C.amber }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onOpen}
                  className="group mt-4 inline-flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ background: C.ink, ...mono }}
                >
                  OPEN VOLLEDIG DOSSIER
                  <ArrowRight
                    size={13}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </button>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-3 pt-1">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ border: `1px solid ${C.line}`, background: C.panel, color: C.muted, ...mono }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> TERUG NAAR LIJST
      </button>

      <Panel title={`DOSSIER · ${opdracht.id}`} meta={`MATCH ${opdracht.match}%`}>
        <div className="border-b p-4" style={{ borderColor: C.line, background: C.paperAlt }}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{
                background: opdracht.match >= 90 ? C.greenBg : C.amberBg,
                color: opdracht.match >= 90 ? C.green : C.amber,
                ...mono,
              }}
            >
              [OK] {opdracht.match}% MATCH
            </span>
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10px] uppercase tracking-[0.04em]"
                style={{ border: `1px solid ${C.line}`, color: C.inkSoft, ...mono }}
              >
                {t}
              </span>
            ))}
          </div>
          <h1
            className="mt-3 text-[24px] font-bold leading-tight tracking-[0.01em] md:text-[30px]"
            style={{ ...sans, color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p
            className="mt-1 text-[11.5px] uppercase tracking-[0.04em]"
            style={{ color: C.muted, ...mono }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ background: C.amber, ...mono }}
            >
              REAGEER OP OPDRACHT <ArrowRight size={13} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ border: `1px solid ${C.ink}`, color: C.ink, ...mono }}
            >
              BEWAAR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: C.line }}>
          {[
            { l: "TARIEF", v: opdracht.tarief },
            { l: "OMVANG", v: opdracht.uren },
            { l: "START", v: opdracht.start },
            { l: "MATCH", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="p-3" style={{ background: C.panel }}>
              <p
                className="text-[9px] uppercase tracking-[0.1em]"
                style={{ color: C.faint, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1 text-[18px] font-bold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel title="[OK] PLUSPUNTEN" meta={`${opdracht.redenen.plus.length}`}>
          <ul>
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 border-b px-3 py-2.5 text-[12.5px] last:border-b-0"
                style={{ borderColor: C.lineSoft, ...sans, color: C.inkSoft }}
              >
                <Check
                  size={13}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="[!!] AANDACHTSPUNTEN" meta={`${opdracht.redenen.min.length}`}>
          <ul>
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 border-b px-3 py-2.5 text-[12.5px] last:border-b-0"
                style={{ borderColor: C.lineSoft, ...sans, color: C.muted }}
              >
                <AlertTriangle
                  size={12}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-3 pt-1">
      <Panel title="BEWIJS · AUTHENTICATIE" meta={`${verified}/${CREDENTIALS.length} GEVERIFIEERD`}>
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="max-w-md">
            <h1
              className="text-[20px] font-bold tracking-[0.02em]"
              style={{ ...mono, color: C.ink }}
            >
              CERTIFICATEN
            </h1>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...sans, color: C.inkSoft }}
            >
              <span className="font-semibold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om actie.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* voortgangsratio als segmentbalk */}
            <div className="flex gap-1" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const st = statusMeta(c.status);
                return <span key={c.naam} className="h-8 w-2.5" style={{ background: st.tone }} />;
              })}
            </div>
            <div>
              <p
                className="text-[26px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {ratio}%
              </p>
              <p
                className="mt-0.5 text-[9px] uppercase tracking-[0.1em]"
                style={{ color: C.faint, ...mono }}
              >
                GEVERIFIEERD
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="CERTIFICATENREGISTER" meta={`${CREDENTIALS.length} REGELS`}>
        <ul>
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                className="border-b last:border-b-0"
                style={{ borderColor: C.lineSoft }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#efeee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                >
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: st.tone, ...mono }}
                    aria-hidden="true"
                  >
                    {st.glyph}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[13px] font-semibold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[10.5px] uppercase tracking-[0.03em]"
                      style={{ color: C.muted, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-2.5">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        background: st.bg,
                        color: st.tone,
                        border: `1px solid ${st.tone}40`,
                        ...mono,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <ChevronRight
                      size={14}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.faint, transform: isOpen ? "rotate(90deg)" : "none" }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="border-t px-3 py-3 pl-[3.25rem]"
                      style={{ borderColor: C.lineSoft, background: C.paperAlt }}
                    >
                      <p
                        className="max-w-xl text-[12px] leading-relaxed"
                        style={{ ...sans, color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                          style={{ background: st.alarm ? C.amber : C.ink, ...mono }}
                        >
                          {c.status === "EXPIRING" ? "VERNIEUWEN" : "BEKIJKEN"}
                        </button>
                        <button
                          className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                          style={{ border: `1px solid ${C.line}`, color: C.inkSoft, ...mono }}
                        >
                          HISTORIE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-3 pt-1">
      <div className="pt-1">
        <h1 className="text-[20px] font-bold tracking-[0.02em]" style={{ ...mono, color: C.ink }}>
          ACTIES
        </h1>
        <p className="mt-1 text-[12px]" style={{ ...sans, color: C.muted }}>
          Werk af op volgorde van prioriteit — telex-regels, hoogste urgentie bovenaan.
        </p>
      </div>

      <Panel title="ACTIEREGISTER" meta={`${ACTIES.length} REGELS`}>
        <ol>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const tone = warn ? C.amber : C.ink;
            return (
              <li
                key={a.titel}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-3 py-3 last:border-b-0"
                style={{
                  borderColor: C.lineSoft,
                  borderLeft: `3px solid ${warn ? C.amber : C.line}`,
                }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center text-[12px] font-bold tabular-nums"
                  style={{ background: warn ? C.amberBg : C.paperAlt, color: tone, ...mono }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: tone, ...mono }}
                      aria-hidden="true"
                    >
                      {warn ? "[!!]" : "[>>]"}
                    </span>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: tone, ...mono }}
                    >
                      {warn ? "URGENT" : "INFO"}
                    </span>
                  </div>
                  <h2
                    className="mt-0.5 truncate text-[14px] font-semibold"
                    style={{ ...sans, color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-0.5 text-[11.5px] leading-relaxed"
                    style={{ ...sans, color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ background: warn ? C.amber : C.ink, color: "#fff", ...mono }}
                >
                  {a.cta}
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <h1 className="text-[20px] font-bold tracking-[0.02em]" style={{ ...mono, color: C.ink }}>
          FACTUREN
        </h1>
        <button
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.ink, ...mono }}
        >
          + NIEUWE FACTUUR
        </button>
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background: C.line }}>
        {[
          { l: "BETAALD (MND)", v: totaalBetaald, sub: "3 VOLDAAN", tone: C.green, alarm: false },
          { l: "OPENSTAAND", v: "€ 1.350", sub: "1 · 9 DAGEN", tone: C.amber, alarm: true },
          { l: "CONCEPT", v: "€ 880", sub: "TE VERSTUREN", tone: C.muted, alarm: false },
        ].map((s) => (
          <div key={s.l} className="p-3" style={{ background: C.panel }}>
            <p
              className="text-[9.5px] uppercase tracking-[0.1em]"
              style={{ color: C.faint, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: s.alarm ? C.amber : C.ink }}
            >
              {s.v}
            </p>
            <p
              className="mt-1 flex items-center gap-1 text-[9.5px] uppercase tracking-[0.06em]"
              style={{ color: s.tone, ...mono }}
            >
              {s.alarm && <AlertTriangle size={10} aria-hidden="true" />}
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <Panel title="FACTUURREGISTER" meta={`${FACTUREN.length} REGELS`}>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-3 border-b px-3 py-1.5 sm:grid"
          style={{ borderColor: C.line, background: C.paperAlt }}
        >
          {["NUMMER", "KLANT", "DATUM", "STATUS", "BEDRAG"].map((h, i) => (
            <span
              key={h}
              className={`text-[9px] uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const tone = acc ? C.amber : f.status === "Betaald" ? C.green : C.muted;
            const bg = acc ? C.amberBg : f.status === "Betaald" ? C.greenBg : C.paperAlt;
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-2 border-b px-3 py-2.5 transition-colors last:border-b-0 hover:bg-[#efeee7] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-3"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[11px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[13px] font-semibold sm:order-2"
                  style={{ ...sans, color: C.ink }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                    style={{ background: bg, color: tone, border: `1px solid ${tone}40`, ...mono }}
                  >
                    {acc && <AlertTriangle size={9} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.amber : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between border-t px-3 py-2.5"
          style={{ borderColor: C.line, background: C.paperAlt }}
        >
          <span
            className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint, ...mono }}
          >
            TOTAAL BETAALD
          </span>
          <span className="text-[18px] font-bold tabular-nums" style={{ ...mono, color: C.ink }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
