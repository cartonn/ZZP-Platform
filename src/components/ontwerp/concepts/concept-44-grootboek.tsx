"use client";

// Concept 44 — "Grootboek" · Groene-baan-boekhoudvel, opnieuw bedacht (LICHT, warm).
// Het klassieke computer-printout grootboek — zebra-strepen (crème / bleek grootboek-groen),
// verticale kolomlijnen, tabulaire cijfers overal, doorlopende totalen en saldo-kolommen, en een
// perforatie-marge (hole-punch) links. Rustig gedrukt vel, geen live terminal. Facturen/omzet
// schitteren hier met debet/credit/saldo-kolommen.
// Palet: bg crème #f5f3e7, grootboek-groen #2f6b3f, inkt #1c2417, rood (negatief) #b3261e.
// Fonts: IBM Plex Mono voor cijfers (--font-lab-plex-mono) + Newsreader voor koppen
// (--font-lab-newsreader).

import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  ChevronRight,
  Send,
  Loader2,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
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

const C = {
  paper: "#f5f3e7",
  paperRow: "#eef1df", // bleek grootboek-groen (zebra)
  paperCard: "#faf8ee",
  margin: "#e9e6d4",
  green: "#2f6b3f",
  greenDeep: "#245231",
  greenSoft: "rgba(47,107,63,0.10)",
  greenLine: "rgba(47,107,63,0.30)",
  ink: "#1c2417",
  inkSoft: "#43503a",
  muted: "#6f7a63",
  faint: "#9aa38c",
  rule: "#cfd3ba", // kolomlijnen
  ruleSoft: "#dcdfc8",
  red: "#b3261e",
  redSoft: "rgba(179,38,30,0.10)",
  amber: "#a86a15",
  amberSoft: "rgba(168,106,21,0.12)",
};

const heading = { fontFamily: "var(--font-lab-newsreader)" };
const figure = { fontFamily: "var(--font-lab-plex-mono)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: BookOpen,
};

type Tone = { label: string; fg: string; bg: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, bg: C.greenSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.amber, bg: C.amberSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.red, bg: C.redSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.red, bg: C.redSoft, Icon: X };
  }
}

// Parse "€ 2.480" → 2480 (number). Voor doorlopend saldo.
function parseAmount(s: string): number {
  const digits = s.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function euro(n: number): string {
  return "€ " + n.toLocaleString("nl-NL");
}

/* ---------- Bouwstenen ---------- */

// Perforatie-marge (hole-punch) links op elk vel.
function PunchMargin({ rows = 9 }: { rows?: number }) {
  return (
    <div
      className="hidden w-9 shrink-0 flex-col items-center gap-[18px] py-6 sm:flex"
      style={{ background: C.margin, borderRight: `1px solid ${C.rule}` }}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <span
          key={i}
          className="h-3.5 w-3.5 rounded-full"
          style={{
            background: C.paper,
            border: `1px solid ${C.rule}`,
            boxShadow: "inset 0 1px 2px rgba(28,36,23,0.18)",
          }}
        />
      ))}
    </div>
  );
}

// Grootboek-vel: perforatie + inhoud, dunne dubbele rand.
function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex overflow-hidden rounded-[4px] ${className}`}
      style={{
        background: C.paperCard,
        border: `1px solid ${C.rule}`,
        boxShadow: "0 1px 0 rgba(28,36,23,0.04), 0 18px 40px -30px rgba(28,36,23,0.4)",
      }}
    >
      <PunchMargin />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function LedgerHead({ refNo, title, note }: { refNo: string; title: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 border-b px-5 py-4 sm:px-7" style={{ borderColor: C.rule }}>
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: C.green, ...figure }}
        >
          {refNo}
        </span>
        <span className="h-px flex-1" style={{ background: C.ruleSoft }} aria-hidden="true" />
      </div>
      <h1
        className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...heading, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="max-w-2xl text-[13px] leading-relaxed"
          style={{ color: C.inkSoft, ...heading }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// Kleine sparkline in ledger-groen.
function LedgerSpark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 5) - 2.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={C.green}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Match als tabulaire percentage-cel.
function MatchCell({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2" style={figure}>
      <span
        className="relative block h-1.5 w-14 overflow-hidden rounded-full"
        style={{ background: C.ruleSoft }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: C.green }}
        />
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.ink }}>
        {value}%
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept44() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [openId, setOpenId] = useState<string>(OPDRACHTEN[0]!.id);
  const active = OPDRACHTEN.find((o) => o.id === openId) ?? OPDRACHTEN[0]!;

  const open = (o: Opdracht) => {
    setOpenId(o.id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full antialiased"
      style={{ background: C.paper, color: C.ink, ...figure }}
    >
      <div className="flex min-h-[680px]">
        {/* Ordner-tab zijbalk */}
        <aside
          className="hidden w-[214px] shrink-0 flex-col p-4 md:flex"
          style={{ borderRight: `1px solid ${C.rule}`, background: C.margin }}
        >
          <div className="flex items-center gap-3 px-1 pb-6 pt-1">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[5px] text-[15px] font-bold text-white"
              style={{ background: C.green, ...heading }}
            >
              G
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight" style={heading}>
                Grootboek
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                ZZP Platform
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 rounded-[4px] px-3 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b3f]"
                  style={{
                    color: on ? C.ink : C.inkSoft,
                    background: on ? C.paperCard : "transparent",
                    border: `1px solid ${on ? C.rule : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: on ? C.green : C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.green : C.faint }} />
                  <span className="flex-1 font-medium" style={heading}>
                    {s.label}
                  </span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.green }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div
            className="mt-auto rounded-[4px] p-3"
            style={{ background: C.paperCard, border: `1px solid ${C.rule}` }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: C.green, ...heading }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold" style={heading}>
                  {PROFIEL.naam}
                </div>
                <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.green }}>
                  <Check size={10} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Titelbalk als grootboek-header */}
          <header
            className="flex h-14 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `1px solid ${C.rule}`, background: C.paperCard }}
          >
            <div className="flex items-baseline gap-2.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: C.muted }}
              >
                Boekjaar 2025
              </span>
              <span className="hidden text-[11px] sm:inline" style={{ color: C.faint }}>
                ·
              </span>
              <h2
                className="text-[15px] font-semibold tracking-tight"
                style={{ ...heading, color: C.ink }}
              >
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div
                className="hidden items-center gap-2 rounded-[4px] px-3 py-1.5 text-[11px] sm:flex"
                style={{ border: `1px solid ${C.rule}`, color: C.muted, background: C.paper }}
              >
                <Search size={13} aria-hidden="true" />
                <span>Zoek in grootboek…</span>
              </div>
              <span
                className="rounded-[4px] px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider"
                style={{
                  color: C.green,
                  background: C.greenSoft,
                  border: `1px solid ${C.greenLine}`,
                }}
              >
                Bijgewerkt
              </span>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden"
            style={{ borderBottom: `1px solid ${C.rule}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b3f]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.paperCard : "transparent",
                    border: `1px solid ${on ? C.rule : "transparent"}`,
                    ...heading,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} />}
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

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Openingsbalans-strook */}
      <Sheet>
        <div className="px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: C.green }}
              >
                Grootboek · {PROFIEL.plaats}
              </p>
              <h1
                className="mt-2 text-[28px] font-semibold leading-tight tracking-tight"
                style={{ ...heading, color: C.ink }}
              >
                Balans van {PROFIEL.naam.split(" ")[0]}
              </h1>
              <p
                className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                style={{ color: C.inkSoft, ...heading }}
              >
                Alle posten netjes op één regel: matches, omzet en openstaande posten — met een
                doorlopend saldo dat altijd klopt.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
                Saldo (mnd)
              </p>
              <p className="text-[30px] font-semibold tabular-nums" style={{ color: C.green }}>
                € 8.240
              </p>
            </div>
          </div>
        </div>

        {/* KPI-regels als grootboek-posten */}
        <div style={{ borderTop: `1px solid ${C.rule}` }}>
          <div
            className="grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-0 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:px-7"
            style={{ color: C.muted, borderBottom: `1px solid ${C.ruleSoft}` }}
          >
            <span>Post</span>
            <span className="text-right">Waarde</span>
            <span className="text-right">Verloop</span>
          </div>
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center gap-0 px-5 py-3 sm:px-7"
              style={{
                background: i % 2 === 1 ? C.paperRow : "transparent",
                borderBottom: `1px solid ${C.ruleSoft}`,
              }}
            >
              <div className="flex items-center gap-2 pr-3">
                <span className="text-[11px] tabular-nums" style={{ color: C.faint }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px]" style={{ color: C.ink, ...heading }}>
                  {k.label}
                </span>
              </div>
              <div
                className="text-right text-[15px] font-semibold tabular-nums"
                style={{ color: C.ink }}
              >
                {k.value}
              </div>
              <div className="flex items-center justify-end gap-2">
                <LedgerSpark data={k.spark} />
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.red }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches-grootboek */}
        <div className="lg:col-span-2">
          <Sheet>
            <LedgerHead refNo="Blad A · Openstaande matches" title="Beste matches" />
            <div>
              <div
                className="grid grid-cols-[2fr_1fr_0.8fr] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:px-7"
                style={{ color: C.muted, borderBottom: `1px solid ${C.ruleSoft}` }}
              >
                <span>Omschrijving</span>
                <span>Match</span>
                <span className="text-right">Tarief</span>
              </div>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o)}
                  className="grid w-full grid-cols-[2fr_1fr_0.8fr] items-center gap-2 px-5 py-3.5 text-left transition-colors hover:bg-[#e4e9d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6b3f] sm:px-7"
                  style={{
                    background: i % 2 === 1 ? C.paperRow : "transparent",
                    borderBottom: `1px solid ${C.ruleSoft}`,
                  }}
                >
                  <div className="min-w-0 pr-3">
                    <p
                      className="truncate text-[13.5px] font-medium"
                      style={{ color: C.ink, ...heading }}
                    >
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <MatchCell value={o.match} />
                  <span
                    className="text-right text-[12.5px] font-semibold tabular-nums"
                    style={{ color: C.ink }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                </button>
              ))}
            </div>
          </Sheet>
        </div>

        {/* Certificaten-grootboek */}
        <div>
          <Sheet>
            <LedgerHead refNo="Blad B · Register" title="Certificaten" />
            <div>
              {CREDENTIALS.map((c, i) => {
                const st = statusStyle(c.status);
                return (
                  <div
                    key={c.naam}
                    className="flex items-start gap-3 px-5 py-3.5 sm:px-7"
                    style={{
                      background: i % 2 === 1 ? C.paperRow : "transparent",
                      borderBottom: `1px solid ${C.ruleSoft}`,
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ background: st.bg }}
                      aria-hidden="true"
                    >
                      <st.Icon size={12} style={{ color: st.fg }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink, ...heading }}
                      >
                        {c.naam}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: st.fg }}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Sheet>
        <LedgerHead
          refNo="Grootboek · Marktjournaal"
          title="Open opdrachten"
          note="Geboekt op relevantie. Elke regel toont match, tarief en omvang in tabulaire cijfers."
        />
        <div className="px-5 py-3 sm:px-7" style={{ borderBottom: `1px solid ${C.rule}` }}>
          <div
            className="flex items-center gap-2.5 rounded-[4px] px-3 py-2"
            style={{ background: C.paper, border: `1px solid ${C.rule}` }}
          >
            <Search size={15} aria-hidden="true" style={{ color: C.green }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa38c]"
              style={{ color: C.ink }}
            />
            <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
              {filtered.length}/{OPDRACHTEN.length}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.green }} />
            </div>
            <p className="mt-4 text-[16px] font-semibold" style={{ ...heading, color: C.ink }}>
              Geen post gevonden
            </p>
            <p
              className="mx-auto mt-1 max-w-xs text-[12.5px]"
              style={{ color: C.muted, ...heading }}
            >
              Niets geboekt voor &quot;{q}&quot;. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-4 inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b3f]"
              style={{ background: C.green }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.muted, borderBottom: `1px solid ${C.rule}` }}
                >
                  <th
                    className="px-5 py-2.5 sm:px-7"
                    style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                  >
                    Ref.
                  </th>
                  <th className="px-4 py-2.5" style={{ borderRight: `1px solid ${C.ruleSoft}` }}>
                    Omschrijving
                  </th>
                  <th className="px-4 py-2.5" style={{ borderRight: `1px solid ${C.ruleSoft}` }}>
                    Match
                  </th>
                  <th
                    className="hidden px-4 py-2.5 sm:table-cell"
                    style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                  >
                    Omvang
                  </th>
                  <th className="px-4 py-2.5 text-right sm:px-7">Tarief</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr
                    key={o.id}
                    onClick={() => onOpen(o)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpen(o);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-[#e4e9d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f6b3f]"
                    style={{
                      background: i % 2 === 1 ? C.paperRow : "transparent",
                      borderBottom: `1px solid ${C.ruleSoft}`,
                    }}
                  >
                    <td
                      className="px-5 py-3.5 text-[11px] tabular-nums sm:px-7"
                      style={{ color: C.green, borderRight: `1px solid ${C.ruleSoft}` }}
                    >
                      {o.id}
                    </td>
                    <td className="px-4 py-3.5" style={{ borderRight: `1px solid ${C.ruleSoft}` }}>
                      <p className="text-[13px] font-medium" style={{ color: C.ink, ...heading }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[11px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={10} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </td>
                    <td className="px-4 py-3.5" style={{ borderRight: `1px solid ${C.ruleSoft}` }}>
                      <MatchCell value={o.match} />
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.inkSoft, borderRight: `1px solid ${C.ruleSoft}` }}
                    >
                      {o.uren}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums sm:px-7"
                      style={{ color: C.green }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Sheet>
        <div className="px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: C.green }}
              >
                {opdracht.id}
              </span>
              <h1
                className="mt-1.5 text-[25px] font-semibold leading-tight tracking-tight"
                style={{ ...heading, color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[13px]"
                style={{ color: C.inkSoft, ...heading }}
              >
                <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b3f] disabled:opacity-90"
              style={{ background: state === "sent" ? C.greenDeep : C.green, ...heading }}
            >
              {state === "sending" && (
                <Loader2 size={15} aria-hidden="true" className="animate-spin" />
              )}
              {state === "sent" && <Check size={15} aria-hidden="true" />}
              {state === "idle" && <Send size={14} aria-hidden="true" />}
              {state === "idle"
                ? "Boek reactie"
                : state === "sending"
                  ? "Boeken…"
                  : "Reactie geboekt"}
            </button>
          </div>
        </div>

        {/* Post-regels */}
        <div style={{ borderTop: `1px solid ${C.rule}` }}>
          {[
            { l: "Tarief", v: opdracht.tarief, mono: true },
            { l: "Omvang", v: opdracht.uren, mono: true },
            { l: "Startdatum", v: opdracht.start, mono: false },
            { l: "Match-percentage", v: `${opdracht.match}%`, mono: true },
          ].map((m, i) => (
            <div
              key={m.l}
              className="flex items-center justify-between px-5 py-3 sm:px-7"
              style={{
                background: i % 2 === 1 ? C.paperRow : "transparent",
                borderBottom: `1px solid ${C.ruleSoft}`,
              }}
            >
              <span className="text-[12.5px]" style={{ color: C.inkSoft, ...heading }}>
                {m.l}
              </span>
              <span
                className="text-[13.5px] font-semibold tabular-nums"
                style={{ color: C.ink, ...(m.mono ? figure : heading) }}
              >
                {m.v}
              </span>
            </div>
          ))}
        </div>
      </Sheet>

      {/* Toelichting: debet/credit-kolommen */}
      <Sheet>
        <LedgerHead
          refNo="Toelichting"
          title="Waarom deze match"
          note="Pluspunten en aandachtspunten in twee kolommen."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div style={{ borderRight: `1px solid ${C.rule}` }}>
            <p
              className="px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] sm:px-7"
              style={{ color: C.green, borderBottom: `1px solid ${C.ruleSoft}` }}
            >
              Debet · pluspunten
            </p>
            {opdracht.redenen.plus.map((r, i) => (
              <div
                key={r}
                className="flex items-start gap-2.5 px-5 py-3 text-[13px] sm:px-7"
                style={{
                  background: i % 2 === 1 ? C.paperRow : "transparent",
                  borderBottom: `1px solid ${C.ruleSoft}`,
                  color: C.ink,
                  ...heading,
                }}
              >
                <Check size={15} aria-hidden="true" style={{ color: C.green, marginTop: 1 }} /> {r}
              </div>
            ))}
          </div>
          <div>
            <p
              className="px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] sm:px-7"
              style={{ color: C.amber, borderBottom: `1px solid ${C.ruleSoft}` }}
            >
              Credit · aandachtspunten
            </p>
            {opdracht.redenen.min.map((r, i) => (
              <div
                key={r}
                className="flex items-start gap-2.5 px-5 py-3 text-[13px] sm:px-7"
                style={{
                  background: i % 2 === 1 ? C.paperRow : "transparent",
                  borderBottom: `1px solid ${C.ruleSoft}`,
                  color: C.inkSoft,
                  ...heading,
                }}
              >
                <Minus size={15} aria-hidden="true" style={{ color: C.amber, marginTop: 1 }} /> {r}
              </div>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Sheet>
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px]"
            style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
          >
            <ShieldCheck size={26} aria-hidden="true" style={{ color: C.green }} />
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-semibold" style={{ ...heading, color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft, ...heading }}>
              <span className="font-semibold tabular-nums" style={figure}>
                {verified}
              </span>{" "}
              van{" "}
              <span className="font-semibold tabular-nums" style={figure}>
                {total}
              </span>{" "}
              geverifieerd · <span style={{ color: C.red }}>{attention} vraagt actie</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
              Score
            </p>
            <p className="text-[26px] font-semibold tabular-nums" style={{ color: C.green }}>
              {Math.round((verified / total) * 100)}%
            </p>
          </div>
        </div>
      </Sheet>

      <Sheet>
        <LedgerHead refNo="Register · Certificaten" title="Verificatiestaat" />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.rule}` }}
              >
                <th
                  className="px-5 py-2.5 sm:px-7"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  Certificaat
                </th>
                <th
                  className="hidden px-4 py-2.5 sm:table-cell"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  Toelichting
                </th>
                <th className="px-4 py-2.5 text-right sm:px-7">Status</th>
              </tr>
            </thead>
            <tbody>
              {CREDENTIALS.map((c, i) => {
                const st = statusStyle(c.status);
                return (
                  <tr
                    key={c.naam}
                    style={{
                      background: i % 2 === 1 ? C.paperRow : "transparent",
                      borderBottom: `1px solid ${C.ruleSoft}`,
                    }}
                  >
                    <td
                      className="px-5 py-3.5 sm:px-7"
                      style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]"
                          style={{ background: st.bg }}
                          aria-hidden="true"
                        >
                          {c.status === "SUBMITTED" ? (
                            <Loader2
                              size={13}
                              className="motion-safe:animate-spin"
                              style={{ color: st.fg }}
                            />
                          ) : (
                            <st.Icon size={13} style={{ color: st.fg }} />
                          )}
                        </span>
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: C.ink, ...heading }}
                        >
                          {c.naam}
                        </span>
                      </div>
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] sm:table-cell"
                      style={{ color: C.muted, borderRight: `1px solid ${C.ruleSoft}` }}
                    >
                      {c.detail}
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-7">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: st.fg, background: st.bg }}
                      >
                        <st.Icon size={11} aria-hidden="true" /> {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; Icon: LucideIcon; label: string }
  > = {
    warning: { fg: C.red, bg: C.redSoft, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.green, bg: C.greenSoft, Icon: Clock, label: "Ter info" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Sheet>
        <LedgerHead
          refNo="Memoriaal · Openstaande posten"
          title="Volgende acties"
          note="Wat nu telt, geboekt op urgentie — met een doorlopende regelnummering."
        />
        <div>
          {ACTIES.map((a, i) => {
            const t = tone[a.urgentie];
            return (
              <div
                key={a.titel}
                className="flex items-start gap-4 px-5 py-4 sm:px-7"
                style={{
                  background: i % 2 === 1 ? C.paperRow : "transparent",
                  borderBottom: `1px solid ${C.ruleSoft}`,
                }}
              >
                <span
                  className="mt-0.5 text-[13px] font-semibold tabular-nums"
                  style={{ color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
                  style={{ background: t.bg }}
                  aria-hidden="true"
                >
                  <t.Icon size={17} style={{ color: t.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: t.fg }}
                    >
                      {t.label}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 text-[13.5px] font-semibold"
                    style={{ color: C.ink, ...heading }}
                  >
                    {a.titel}
                  </p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted, ...heading }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-center rounded-[4px] px-3.5 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b3f]"
                  style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}33` }}
                >
                  {a.cta}
                </button>
              </div>
            );
          })}
        </div>
        <div
          className="flex items-center gap-3 px-5 py-4 sm:px-7"
          style={{ background: C.paperCard }}
        >
          <ChevronRight size={14} aria-hidden="true" style={{ color: C.green }} />
          <p className="text-[12px]" style={{ color: C.inkSoft, ...heading }}>
            Einde memoriaal. Nieuwe posten verschijnen hier zodra ze relevant worden.
          </p>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------- Facturen (het paradepaardje) ---------- */

function Facturen() {
  const rows = useMemo(() => {
    let saldo = 0;
    return FACTUREN.map((f) => {
      const amount = parseAmount(f.bedrag);
      const isDebet = f.status !== "Concept";
      const debet = f.status === "Openstaand" ? amount : 0; // nog te ontvangen
      const credit = f.status === "Betaald" ? amount : 0; // ontvangen
      saldo += credit - 0; // ontvangen omzet loopt op
      return { ...f, amount, isDebet, debet, credit, saldo };
    });
  }, []);

  const totaalBetaald = rows.reduce((s, r) => s + r.credit, 0);
  const totaalOpen = rows.reduce((s, r) => s + r.debet, 0);

  const statusTone: Record<string, { fg: string; bg: string; Icon: LucideIcon }> = {
    Betaald: { fg: C.green, bg: C.greenSoft, Icon: Check },
    Openstaand: { fg: C.amber, bg: C.amberSoft, Icon: Clock },
    Concept: { fg: C.muted, bg: C.ruleSoft, Icon: FileText },
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Balans-samenvatting */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Ontvangen (credit)", v: euro(totaalBetaald), c: C.green },
          { l: "Openstaand (debet)", v: euro(totaalOpen), c: C.red },
          { l: "Saldo boekjaar", v: euro(totaalBetaald - totaalOpen), c: C.ink },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-[4px] px-4 py-3.5"
            style={{ background: C.paperCard, border: `1px solid ${C.rule}` }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[22px] font-semibold tabular-nums" style={{ color: m.c }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <Sheet>
        <div
          className="flex items-center justify-between px-5 py-4 sm:px-7"
          style={{ borderBottom: `1px solid ${C.rule}` }}
        >
          <div>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: C.green }}
            >
              Grootboek · Verkoopjournaal
            </span>
            <h1
              className="mt-1 text-[24px] font-semibold tracking-tight"
              style={{ ...heading, color: C.ink }}
            >
              Facturen
            </h1>
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-[4px] px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b3f]"
            style={{ background: C.green, ...heading }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe post
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.rule}` }}
              >
                <th
                  className="px-5 py-2.5 sm:px-7"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  Nummer
                </th>
                <th className="px-4 py-2.5" style={{ borderRight: `1px solid ${C.ruleSoft}` }}>
                  Klant
                </th>
                <th
                  className="hidden px-4 py-2.5 sm:table-cell"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  Datum
                </th>
                <th
                  className="px-4 py-2.5 text-right"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  Debet
                </th>
                <th
                  className="px-4 py-2.5 text-right"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  Credit
                </th>
                <th className="px-4 py-2.5 text-right sm:px-7">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const t = statusTone[r.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={r.nr}
                    className="transition-colors hover:bg-[#e4e9d0]"
                    style={{
                      background: i % 2 === 1 ? C.paperRow : "transparent",
                      borderBottom: `1px solid ${C.ruleSoft}`,
                    }}
                  >
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums sm:px-7"
                      style={{ color: C.green, borderRight: `1px solid ${C.ruleSoft}` }}
                    >
                      {r.nr}
                    </td>
                    <td className="px-4 py-3.5" style={{ borderRight: `1px solid ${C.ruleSoft}` }}>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px]"
                          style={{ background: t.bg }}
                          aria-hidden="true"
                        >
                          <t.Icon size={12} style={{ color: t.fg }} />
                        </span>
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: C.ink, ...heading }}
                        >
                          {r.klant}
                        </span>
                      </div>
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, borderRight: `1px solid ${C.ruleSoft}` }}
                    >
                      {r.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[12.5px] tabular-nums"
                      style={{
                        color: r.debet ? C.red : C.faint,
                        borderRight: `1px solid ${C.ruleSoft}`,
                      }}
                    >
                      {r.debet ? euro(r.debet) : "—"}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[12.5px] tabular-nums"
                      style={{
                        color: r.credit ? C.green : C.faint,
                        borderRight: `1px solid ${C.ruleSoft}`,
                      }}
                    >
                      {r.credit ? euro(r.credit) : "—"}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums sm:px-7"
                      style={{ color: C.ink }}
                    >
                      {euro(r.saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.green}` }}>
                <td
                  className="px-5 py-3.5 sm:px-7"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: C.green }}
                  >
                    Totaal
                  </span>
                </td>
                <td style={{ borderRight: `1px solid ${C.ruleSoft}` }} />
                <td
                  className="hidden sm:table-cell"
                  style={{ borderRight: `1px solid ${C.ruleSoft}` }}
                />
                <td
                  className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                  style={{ color: C.red, borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  {euro(totaalOpen)}
                </td>
                <td
                  className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                  style={{ color: C.green, borderRight: `1px solid ${C.ruleSoft}` }}
                >
                  {euro(totaalBetaald)}
                </td>
                <td
                  className="px-4 py-3.5 text-right text-[14px] font-bold tabular-nums sm:px-7"
                  style={{ color: C.ink }}
                >
                  {euro(totaalBetaald)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Sheet>
    </div>
  );
}
