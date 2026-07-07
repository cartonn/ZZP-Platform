"use client";

// Concept 155 — "Cel" · spreadsheet-native UI. De hele interface is een levende, strakke datagrid:
// dunne cel-randen, tabulaire cijfers overal, frozen header-rijen/kolommen, kolomsorteer-pijltjes,
// selectie-highlight op hover/focus en een zichtbare geselecteerde-cel-outline (keyboard-cel-navigatie-
// gevoel). Compacte, hoge dichtheid. Kalm neutraal palet + één blauw accent. Onderscheidend van een
// handelsterminal/ledger: dit is een échte spreadsheet-grid als UI-metafoor. Status nooit kleur-alleen:
// altijd label + icoon. Deterministisch — geen random/Date. Fonts: Geist (tekst) + JetBrains Mono (data).

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  ChevronUp,
  ChevronDown,
  Table2,
  CornerDownLeft,
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

// ── Palet — kalm neutraal + één blauw accent ─────────────────────────────────────
const C = {
  bg: "#f7f8fa", // canvas
  surface: "#ffffff", // grid-oppervlak
  headerBg: "#eef1f5", // frozen header
  rowAlt: "#fbfcfd", // zebra
  hover: "#f0f6ff", // cel-hover (licht blauw)
  selBg: "#e7f0ff", // geselecteerde cel
  grid: "#e4e7ec", // cel-rand
  gridStrong: "#d5d9e0", // sterkere rand (frozen split)
  ink: "#1f2430", // primaire tekst
  inkSoft: "#5a6270", // secundaire tekst
  inkMute: "#8b93a1", // gedempt
  accent: "#2563eb", // blauw accent
  accentSoft: "#dbe7ff",
  green: "#0f9d58",
  greenBg: "#e4f5ec",
  amber: "#b7791f",
  amberBg: "#fbf1dc",
  red: "#d64545",
  redBg: "#fbe6e6",
};

const uiFont = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.green, bg: C.greenBg };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.accent, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, fg: C.amber, bg: C.amberBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redBg };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ ...uiFont, background: m.bg, color: m.fg }}
    >
      <m.Icon size={11} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Geselecteerde-cel-outline (spreadsheet-signatuur) — 2px blauw kader zoals een actieve cel.
const selOutline: React.CSSProperties = { boxShadow: `inset 0 0 0 2px ${C.accent}` };

type SortDir = "asc" | "desc" | null;

// Kolomkop met sorteer-pijltjes.
function HeaderCell({
  label,
  align = "left",
  sortable = false,
  dir = null,
  onSort,
  width,
}: {
  label: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  dir?: SortDir;
  onSort?: () => void;
  width?: string;
}) {
  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  const inner = (
    <span className={`flex items-center gap-1 ${justify}`}>
      {label}
      {sortable && (
        <span className="flex flex-col -space-y-1" aria-hidden="true">
          <ChevronUp
            size={9}
            strokeWidth={3}
            style={{ color: dir === "asc" ? C.accent : C.inkMute }}
          />
          <ChevronDown
            size={9}
            strokeWidth={3}
            style={{ color: dir === "desc" ? C.accent : C.inkMute }}
          />
        </span>
      )}
    </span>
  );
  return (
    <th
      scope="col"
      className="sticky top-0 z-10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.04em]"
      style={{
        ...uiFont,
        width,
        background: C.headerBg,
        color: C.inkSoft,
        borderBottom: `1px solid ${C.gridStrong}`,
        borderRight: `1px solid ${C.grid}`,
        textAlign: align,
      }}
      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
    >
      {sortable ? (
        <button
          onClick={onSort}
          className="flex w-full items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
          style={{
            ["--tw-ring-color" as string]: C.accent,
            justifyContent:
              align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
          }}
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </th>
  );
}

// Rij-index-cel (frozen linkerkolom, zoals 1/2/3 in een spreadsheet).
function RowIndex({ n }: { n: number }) {
  return (
    <td
      className="sticky left-0 z-[1] w-9 px-0 text-center text-[11px] tabular-nums"
      style={{
        ...mono,
        background: C.headerBg,
        color: C.inkMute,
        borderRight: `1px solid ${C.gridStrong}`,
        borderBottom: `1px solid ${C.grid}`,
      }}
      aria-hidden="true"
    >
      {n}
    </td>
  );
}

function Cell({
  children,
  align = "left",
  selected = false,
  mono: useMono = false,
  strong = false,
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  selected?: boolean;
  mono?: boolean;
  strong?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`relative px-3 py-2 text-[12.5px] ${className}`}
      style={{
        ...(useMono ? mono : uiFont),
        textAlign: align,
        color: strong ? C.ink : C.inkSoft,
        fontWeight: strong ? 600 : 400,
        borderRight: `1px solid ${C.grid}`,
        borderBottom: `1px solid ${C.grid}`,
        ...(selected ? selOutline : {}),
      }}
    >
      {children}
    </td>
  );
}

// Cel-vulbalk voor mini-metingen (blijft binnen de cel).
function CellBar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ background: C.grid }}
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: C.accent }}
        />
      </span>
      <span className="w-9 text-right text-[11px] tabular-nums" style={{ ...mono, color: C.ink }}>
        {value}%
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept155() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...uiFont, background: C.bg, color: C.ink }}
    >
      {/* Kop */}
      <header
        className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6"
        style={{ background: C.surface, borderBottom: `1px solid ${C.gridStrong}` }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: C.accent, color: "#fff" }}
            aria-hidden="true"
          >
            <Table2 size={18} strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-[-0.01em]">ZZP&nbsp;Cel</div>
            <div className="text-[11px]" style={{ ...mono, color: C.inkMute }}>
              werkblad · {PROFIEL.rol}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium sm:inline-flex"
            style={{ background: C.greenBg, color: C.green }}
          >
            <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Werkblad-tabs (zoals sheet-tabs onderin een spreadsheet, hier bovenaan) */}
      <nav
        className="flex items-center gap-0 overflow-x-auto px-4 md:px-6"
        aria-label="Schermen"
        style={{ background: C.headerBg, borderBottom: `1px solid ${C.gridStrong}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-4 py-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                ...uiFont,
                color: on ? C.accent : C.inkSoft,
                background: on ? C.surface : "transparent",
                borderRight: `1px solid ${C.grid}`,
                borderLeft: i === 0 ? `1px solid ${C.grid}` : "none",
                borderTop: on ? `2px solid ${C.accent}` : "2px solid transparent",
                ["--tw-ring-color" as string]: C.accent,
              }}
            >
              <span
                className="mr-1.5 text-[10px] tabular-nums"
                style={{ ...mono, color: C.inkMute }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      {/* Formula-bar-strook (spreadsheet-signatuur) */}
      <div
        className="flex items-center gap-2 px-4 py-1.5 md:px-6"
        style={{ background: C.surface, borderBottom: `1px solid ${C.grid}` }}
      >
        <span
          className="flex h-5 w-9 items-center justify-center rounded text-[10px] font-semibold tabular-nums"
          style={{
            ...mono,
            background: C.headerBg,
            color: C.inkSoft,
            border: `1px solid ${C.grid}`,
          }}
          aria-hidden="true"
        >
          A1
        </span>
        <span className="text-[11px]" style={{ ...mono, color: C.inkMute }}>
          ƒ
        </span>
        <span className="truncate text-[11.5px]" style={{ ...mono, color: C.inkSoft }}>
          ={SCREENS.find((s) => s.key === screen)?.label ?? "Dashboard"}(werkblad)
        </span>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-6">
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
  );
}

// Grid-container met dubbele buitenrand (het "blad").
function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-x-auto rounded-lg ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.gridStrong}` }}
    >
      {children}
    </div>
  );
}

function SheetTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2
        className="text-[13px] font-semibold uppercase tracking-[0.05em]"
        style={{ color: C.inkSoft }}
      >
        {children}
      </h2>
      {hint && (
        <span className="text-[11px]" style={{ ...mono, color: C.inkMute }}>
          {hint}
        </span>
      )}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const [sel, setSel] = useState("B2");
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      {/* KPI-strip als grid-rij */}
      <section>
        <SheetTitle hint="rij 1 · vastgezet">Kerncijfers</SheetTitle>
        <Sheet>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                {KPIS.map((k, i) => {
                  const id = `B${i + 1}`;
                  const on = sel === id;
                  return (
                    <td
                      key={k.label}
                      onClick={() => setSel(id)}
                      className="relative cursor-cell px-3 py-3 align-top transition-colors"
                      style={{
                        borderRight: i < KPIS.length - 1 ? `1px solid ${C.grid}` : "none",
                        background: on ? C.selBg : "transparent",
                        ...(on ? selOutline : {}),
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10.5px] font-medium uppercase tracking-[0.05em]"
                          style={{ color: C.inkMute }}
                        >
                          {k.label}
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums"
                          style={{ ...mono, color: k.up ? C.green : C.amber }}
                        >
                          {k.up ? (
                            <ArrowUpRight size={11} aria-hidden="true" />
                          ) : (
                            <ArrowDownRight size={11} aria-hidden="true" />
                          )}
                          {k.trend}
                        </span>
                      </div>
                      <div
                        className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                        style={{ ...mono, color: C.ink }}
                      >
                        {k.value}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </Sheet>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: C.inkMute }}>
          <CornerDownLeft size={11} aria-hidden="true" /> Klik een cel om te selecteren · actief:{" "}
          {sel}
        </p>
      </section>

      {/* Matches-grid */}
      <section>
        <SheetTitle hint={`${OPDRACHTEN.length} rijen`}>Aanbevolen matches</SheetTitle>
        <Sheet>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 top-0 z-20 w-9 px-0 text-center text-[11px] font-semibold"
                  style={{
                    ...mono,
                    background: C.headerBg,
                    color: C.inkMute,
                    borderBottom: `1px solid ${C.gridStrong}`,
                    borderRight: `1px solid ${C.gridStrong}`,
                  }}
                  aria-hidden="true"
                >
                  #
                </th>
                <HeaderCell label="Opdracht" sortable />
                <HeaderCell label="Opdrachtgever" />
                <HeaderCell label="Plaats" />
                <HeaderCell label="Tarief" align="right" sortable />
                <HeaderCell label="Match" align="right" sortable dir="desc" />
                <HeaderCell label="" align="center" width="44px" />
              </tr>
            </thead>
            <tbody>
              {OPDRACHTEN.map((o, i) => (
                <tr
                  key={o.id}
                  className="group cursor-pointer transition-colors hover:bg-[#f0f6ff]"
                  style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}
                  onClick={onOpen}
                >
                  <RowIndex n={i + 1} />
                  <Cell strong>{o.titel}</Cell>
                  <Cell>{o.opdrachtgever}</Cell>
                  <Cell>{o.plaats}</Cell>
                  <Cell align="right" mono>
                    {o.tarief}
                  </Cell>
                  <Cell align="right">
                    <CellBar value={o.match} />
                  </Cell>
                  <Cell align="center">
                    <ArrowRight size={14} style={{ color: C.accent }} aria-hidden="true" />
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>
      </section>

      {/* Twee sub-grids naast elkaar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <SheetTitle hint={`${dek}% dekking`}>Certificaatdekking</SheetTitle>
          <Sheet>
            <table className="w-full border-collapse">
              <tbody>
                {CREDENTIALS.map((c, i) => (
                  <tr key={c.naam} style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}>
                    <RowIndex n={i + 1} />
                    <Cell strong>{c.naam}</Cell>
                    <Cell align="right">
                      <StatusTag status={c.status} />
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sheet>
        </section>

        <section>
          <SheetTitle hint="prioriteit ↓">Volgende acties</SheetTitle>
          <Sheet>
            <table className="w-full border-collapse">
              <tbody>
                {ACTIES.map((a, i) => (
                  <tr
                    key={a.titel}
                    className="cursor-pointer transition-colors hover:bg-[#f0f6ff]"
                    style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}
                    onClick={onActies}
                  >
                    <RowIndex n={i + 1} />
                    <Cell>
                      <span className="flex items-center gap-2">
                        {a.urgentie === "warning" ? (
                          <AlertTriangle
                            size={13}
                            strokeWidth={2.4}
                            style={{ color: C.amber }}
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUpRight
                            size={13}
                            strokeWidth={2.4}
                            style={{ color: C.accent }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate font-medium" style={{ color: C.ink }}>
                          {a.titel}
                        </span>
                      </span>
                    </Cell>
                    <Cell align="right">
                      <span className="text-[11px]" style={{ color: C.accent }}>
                        {a.cta}
                      </span>
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sheet>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [dir, setDir] = useState<SortDir>("desc");
  const base = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const rows = [...base].sort((a, b) =>
    dir === "asc" ? a.match - b.match : dir === "desc" ? b.match - a.match : 0,
  );
  const cycleSort = () => setDir((d) => (d === "desc" ? "asc" : d === "asc" ? null : "desc"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SheetTitle hint={`${rows.length} van ${OPDRACHTEN.length}`}>
          Marktplaats · open opdrachten
        </SheetTitle>
        <div
          className="flex items-center gap-2 rounded px-2.5 py-1.5"
          style={{ background: C.surface, border: `1px solid ${C.gridStrong}` }}
        >
          <Search size={14} style={{ color: C.inkMute }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter rijen…"
            aria-label="Opdrachten filteren"
            className="w-48 bg-transparent text-[12px] outline-none placeholder:opacity-60"
            style={{ ...uiFont, color: C.ink }}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <Sheet className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            <Search size={22} />
          </span>
          <p className="text-[15px] font-semibold" style={{ color: C.ink }}>
            Geen rijen
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.inkMute }}>
            Geen enkele rij voldoet aan filter “{q}”.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
          >
            Filter wissen
          </button>
        </Sheet>
      ) : (
        <Sheet>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 top-0 z-20 w-9 px-0 text-center text-[11px] font-semibold"
                  style={{
                    ...mono,
                    background: C.headerBg,
                    color: C.inkMute,
                    borderBottom: `1px solid ${C.gridStrong}`,
                    borderRight: `1px solid ${C.gridStrong}`,
                  }}
                  aria-hidden="true"
                >
                  #
                </th>
                <HeaderCell label="Opdracht" sortable />
                <HeaderCell label="Opdrachtgever" />
                <HeaderCell label="Plaats" />
                <HeaderCell label="Uren" align="right" />
                <HeaderCell label="Start" />
                <HeaderCell label="Tarief" align="right" />
                <HeaderCell label="Match" align="right" sortable dir={dir} onSort={cycleSort} />
              </tr>
            </thead>
            <tbody>
              {rows.map((o, i) => (
                <tr
                  key={o.id}
                  className="cursor-pointer transition-colors focus-within:bg-[#f0f6ff] hover:bg-[#f0f6ff]"
                  style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}
                >
                  <RowIndex n={i + 1} />
                  <td
                    className="px-3 py-2"
                    style={{
                      borderRight: `1px solid ${C.grid}`,
                      borderBottom: `1px solid ${C.grid}`,
                    }}
                  >
                    <button
                      onClick={onOpen}
                      className="text-left text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      style={{ ...uiFont, color: C.ink, ["--tw-ring-color" as string]: C.accent }}
                    >
                      {o.titel}
                    </button>
                  </td>
                  <Cell>{o.opdrachtgever}</Cell>
                  <Cell>{o.plaats}</Cell>
                  <Cell align="right" mono>
                    {o.uren}
                  </Cell>
                  <Cell mono>{o.start}</Cell>
                  <Cell align="right" mono strong>
                    {o.tarief}
                  </Cell>
                  <Cell align="right">
                    <CellBar value={o.match} />
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string }[] = [
    { l: "ID", v: opdracht.id },
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Plaats", v: opdracht.plaats },
    { l: "Match", v: `${opdracht.match}%` },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#eef1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{
          background: C.surface,
          color: C.inkSoft,
          border: `1px solid ${C.gridStrong}`,
          ["--tw-ring-color" as string]: C.accent,
        }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> Terug naar blad
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px]" style={{ ...mono, color: C.inkMute }}>
            {opdracht.id} · {opdracht.opdrachtgever}
          </div>
          <h1
            className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
        </div>
        <span
          className="flex h-14 w-14 flex-col items-center justify-center rounded-lg"
          style={{ background: C.accentSoft, color: C.accent }}
          aria-hidden="true"
        >
          <span className="text-[20px] font-semibold tabular-nums leading-none" style={mono}>
            {opdracht.match}
          </span>
          <span className="text-[9px] font-medium uppercase">match</span>
        </span>
      </div>

      {/* Feiten als key/value-grid */}
      <Sheet>
        <table className="w-full border-collapse">
          <tbody>
            {feiten.map((f, i) => (
              <tr key={f.l} style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}>
                <th
                  scope="row"
                  className="sticky left-0 z-[1] w-40 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.04em]"
                  style={{
                    ...uiFont,
                    background: C.headerBg,
                    color: C.inkSoft,
                    borderRight: `1px solid ${C.gridStrong}`,
                    borderBottom: `1px solid ${C.grid}`,
                  }}
                >
                  {f.l}
                </th>
                <Cell mono strong>
                  {f.v}
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </Sheet>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <SheetTitle>Waarom dit past</SheetTitle>
          <Sheet>
            <table className="w-full border-collapse">
              <tbody>
                {opdracht.redenen.plus.map((r, i) => (
                  <tr key={r} style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}>
                    <td
                      className="w-9 px-0 text-center"
                      style={{
                        borderRight: `1px solid ${C.grid}`,
                        borderBottom: `1px solid ${C.grid}`,
                        background: C.greenBg,
                      }}
                      aria-hidden="true"
                    >
                      <Check
                        size={13}
                        strokeWidth={2.8}
                        style={{ color: C.green, display: "inline" }}
                      />
                    </td>
                    <Cell>{r}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sheet>
        </div>
        <div>
          <SheetTitle>Om te overwegen</SheetTitle>
          <Sheet>
            <table className="w-full border-collapse">
              <tbody>
                {opdracht.redenen.min.map((r, i) => (
                  <tr key={r} style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}>
                    <td
                      className="w-9 px-0 text-center"
                      style={{
                        borderRight: `1px solid ${C.grid}`,
                        borderBottom: `1px solid ${C.grid}`,
                        background: C.amberBg,
                      }}
                      aria-hidden="true"
                    >
                      <AlertTriangle
                        size={12}
                        strokeWidth={2.8}
                        style={{ color: C.amber, display: "inline" }}
                      />
                    </td>
                    <Cell>{r}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
        >
          Reageer op deze opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded px-5 py-3 text-[13px] font-semibold transition-colors hover:bg-[#eef1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.surface,
            color: C.ink,
            border: `1px solid ${C.gridStrong}`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          Bewaar rij
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SheetTitle hint={`${verified}/${CREDENTIALS.length} geverifieerd`}>
          Verificatie &amp; certificaten
        </SheetTitle>
        <button
          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
        >
          <Plus size={13} aria-hidden="true" /> Rij toevoegen
        </button>
      </div>

      <div
        className="flex items-center gap-4 rounded-lg px-4 py-3"
        style={{ background: C.surface, border: `1px solid ${C.gridStrong}` }}
      >
        <div
          className="text-[28px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.accent }}
        >
          {dek}%
        </div>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full"
          style={{ background: C.grid }}
          aria-hidden="true"
        >
          <div className="h-full rounded-full" style={{ width: `${dek}%`, background: C.accent }} />
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium"
          style={{ background: C.greenBg, color: C.green }}
        >
          <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </div>

      <Sheet>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-20 w-9 px-0 text-center text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: C.headerBg,
                  color: C.inkMute,
                  borderBottom: `1px solid ${C.gridStrong}`,
                  borderRight: `1px solid ${C.gridStrong}`,
                }}
                aria-hidden="true"
              >
                #
              </th>
              <HeaderCell label="Certificaat" sortable />
              <HeaderCell label="Detail" />
              <HeaderCell label="Status" />
              <HeaderCell label="Actie" align="right" />
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((c, i) => {
              const actionable = c.status !== "VERIFIED";
              return (
                <tr
                  key={c.naam}
                  style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}
                  className="transition-colors hover:bg-[#f0f6ff]"
                >
                  <RowIndex n={i + 1} />
                  <Cell strong>{c.naam}</Cell>
                  <Cell>{c.detail}</Cell>
                  <Cell>
                    <StatusTag status={c.status} />
                  </Cell>
                  <Cell align="right">
                    {actionable ? (
                      <button
                        className="rounded px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          background: C.accentSoft,
                          color: C.accent,
                          ["--tw-ring-color" as string]: C.accent,
                        }}
                      >
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw indienen"
                            : "Bekijk"}
                      </button>
                    ) : (
                      <span className="text-[11px]" style={{ color: C.inkMute }}>
                        —
                      </span>
                    )}
                  </Cell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Sheet>
    </div>
  );
}

// ── Acties ─────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div>
        <SheetTitle hint="gesorteerd op urgentie">Volgende beste acties</SheetTitle>
        <p className="-mt-1 text-[12px]" style={{ color: C.inkMute }}>
          Elke rij is een actie — pak de bovenste eerst.
        </p>
      </div>
      <Sheet>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-20 w-9 px-0 text-center text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: C.headerBg,
                  color: C.inkMute,
                  borderBottom: `1px solid ${C.gridStrong}`,
                  borderRight: `1px solid ${C.gridStrong}`,
                }}
                aria-hidden="true"
              >
                #
              </th>
              <HeaderCell label="Prioriteit" width="120px" />
              <HeaderCell label="Actie" />
              <HeaderCell label="Toelichting" />
              <HeaderCell label="" align="right" width="150px" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <tr
                  key={a.titel}
                  style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}
                  className="transition-colors hover:bg-[#f0f6ff]"
                >
                  <RowIndex n={i + 1} />
                  <Cell>
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
                      style={{
                        background: warn ? C.amberBg : C.accentSoft,
                        color: warn ? C.amber : C.accent,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                  </Cell>
                  <Cell strong>{a.titel}</Cell>
                  <Cell>{a.detail}</Cell>
                  <Cell align="right">
                    <button
                      className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        background: warn ? C.amber : C.accent,
                        ["--tw-ring-color" as string]: warn ? C.amber : C.accent,
                      }}
                    >
                      {a.cta} <ArrowRight size={12} aria-hidden="true" />
                    </button>
                  </Cell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Sheet>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  type FStatus = { label: string; Icon: LucideIcon; fg: string; bg: string };
  const factMeta = (status: string): FStatus => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.green, bg: C.greenBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.amber, bg: C.amberBg };
    return { label: "Concept", Icon: AlertTriangle, fg: C.inkMute, bg: C.headerBg };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SheetTitle hint={`${FACTUREN.length} rijen · ${open} open`}>Facturen</SheetTitle>
        <button
          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
        >
          <Plus size={13} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Sheet>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-20 w-9 px-0 text-center text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: C.headerBg,
                  color: C.inkMute,
                  borderBottom: `1px solid ${C.gridStrong}`,
                  borderRight: `1px solid ${C.gridStrong}`,
                }}
                aria-hidden="true"
              >
                #
              </th>
              <HeaderCell label="Nummer" sortable />
              <HeaderCell label="Klant" />
              <HeaderCell label="Datum" />
              <HeaderCell label="Status" />
              <HeaderCell label="Bedrag" align="right" sortable />
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = factMeta(f.status);
              return (
                <tr
                  key={f.nr}
                  style={{ background: i % 2 === 1 ? C.rowAlt : C.surface }}
                  className="transition-colors hover:bg-[#f0f6ff]"
                >
                  <RowIndex n={i + 1} />
                  <Cell mono strong>
                    {f.nr}
                  </Cell>
                  <Cell>{f.klant}</Cell>
                  <Cell mono>{f.datum}</Cell>
                  <Cell>
                    <span
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
                      style={{ background: m.bg, color: m.fg }}
                    >
                      <m.Icon size={11} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                    </span>
                  </Cell>
                  <Cell align="right" mono strong>
                    {f.bedrag}
                  </Cell>
                </tr>
              );
            })}
            {/* Totaalrij (frozen-gevoel onderaan) */}
            <tr style={{ background: C.headerBg }}>
              <td
                className="sticky left-0 z-[1] w-9 px-0 text-center text-[11px]"
                style={{
                  ...mono,
                  background: C.headerBg,
                  color: C.inkMute,
                  borderRight: `1px solid ${C.gridStrong}`,
                  borderTop: `1px solid ${C.gridStrong}`,
                }}
                aria-hidden="true"
              >
                Σ
              </td>
              <td
                colSpan={4}
                className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em]"
                style={{
                  ...uiFont,
                  color: C.inkSoft,
                  borderTop: `1px solid ${C.gridStrong}`,
                  borderRight: `1px solid ${C.grid}`,
                }}
              >
                Totaal betaald
              </td>
              <td
                className="px-3 py-2 text-right text-[14px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink, borderTop: `1px solid ${C.gridStrong}` }}
              >
                {betaald}
              </td>
            </tr>
          </tbody>
        </table>
      </Sheet>
    </div>
  );
}
