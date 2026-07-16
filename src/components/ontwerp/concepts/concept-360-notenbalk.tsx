"use client";

// Concept 360 — "Notenbalk" · Ritmisch baseline-grid / muzikaal.
// Compositie, cadans, precisie. Een strak kolom- en lijnraster als notenbalk: hairline horizontale
// notenlijnen keren terug als structuur-element, met maatstrepen, tempo-aanduidingen en noten die
// data ritmisch aftikken. Monochroom — inkt (#1a1a1a) op ivoor (#faf9f5) — met één accent (#b8342f).
// Fonts: Space Grotesk (display) + Space Mono (maatvoering/cijfers) + Geist (tekst).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Circle,
  Plus,
  Minus,
  Music2,
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

// — Palet: inkt op ivoor, één rood accent —
const C = {
  bg: "#faf9f5",
  paper: "#ffffff",
  ivory: "#f2f0e9",
  ink: "#1a1a1a",
  inkSoft: "#3d3d3a",
  muted: "#6f6f68",
  faint: "#9a9a92",
  line: "rgba(26,26,26,0.14)",
  lineSoft: "rgba(26,26,26,0.08)",
  staff: "rgba(26,26,26,0.16)",
  accent: "#b8342f",
  accentSoft: "#f3ddd9",
};

const display = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-space-mono), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };

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

// — De notenbalk: vijf hairline-lijnen; data wordt als noten op de balk geplaatst —
function Staff({
  data,
  width = 220,
  height = 56,
  accent,
}: {
  data: number[];
  width?: number;
  height?: number;
  accent?: boolean;
}) {
  const lines = 5;
  const gap = height / (lines + 1);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stroke = accent ? C.accent : C.ink;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => {
        const y = gap * (i + 1);
        return <line key={i} x1={0} y1={y} x2={width} y2={y} stroke={C.staff} strokeWidth="1" />;
      })}
      {data.map((v, i) => {
        const x = 14 + (i / (data.length - 1)) * (width - 28);
        const y = height - gap - ((v - min) / span) * (height - 2 * gap);
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={y - 16} stroke={stroke} strokeWidth="1.4" />
            <circle cx={x} cy={y} r="3.6" fill={stroke} />
          </g>
        );
      })}
    </svg>
  );
}

// — Maatstreep-rij: dunne verticale strepen als een maat-indeling —
function BarTicks({ count = 24, active = -1 }: { count?: number; active?: number }) {
  return (
    <div className="flex items-end gap-[3px]" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const major = i % 4 === 0;
        const on = i === active;
        return (
          <span
            key={i}
            className="w-px"
            style={{
              height: major ? 14 : 8,
              background: on ? C.accent : major ? C.ink : C.line,
            }}
          />
        );
      })}
    </div>
  );
}

function Overline({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <p
      className="text-[11px] font-medium uppercase tracking-[0.3em]"
      style={{ color: accent ? C.accent : C.faint, ...mono }}
    >
      {children}
    </p>
  );
}

function Tag({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-[3px] px-2 py-0.5 text-[11px] uppercase tracking-[0.08em]"
      style={
        active
          ? { color: C.accent, border: `1px solid ${C.accent}`, ...mono }
          : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
      }
    >
      {children}
    </span>
  );
}

export function Concept360() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
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
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[6px]"
          style={{ background: C.ink }}
          aria-hidden="true"
        >
          <Music2 size={19} color={C.bg} />
        </span>
        <div>
          <p className="text-[19px] font-semibold leading-none tracking-[-0.01em]" style={display}>
            Notenbalk
          </p>
          <p
            className="mt-1 text-[11px] uppercase leading-none tracking-[0.24em]"
            style={{ color: C.faint, ...mono }}
          >
            Ritme in je werk
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] sm:inline-flex"
          style={{ color: C.muted, ...mono }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.accent }}
            aria-hidden="true"
          />
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[6px] text-[12px] font-medium"
          style={{ border: `1px solid ${C.ink}`, color: C.ink, ...mono }}
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
            className="relative shrink-0 px-4 py-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted, ...display }}
          >
            <span
              className="mr-2 text-[10px] tabular-nums"
              style={{ color: on ? C.accent : C.faint, ...mono }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: C.accent }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-10">
      {/* Openingsmaat */}
      <section
        className="grid grid-cols-1 gap-8 border-b pb-10 md:grid-cols-[1.4fr_1fr]"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Maat 01 — Vandaag</Overline>
          <h1
            className="mt-4 text-[40px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[52px]"
            style={display}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Je week loopt op de maat. Eén actie zet de toon voor vandaag — de rest volgt vanzelf in
            cadans.
          </p>
          <div className="mt-6">
            <BarTicks count={28} active={3} />
          </div>
        </div>

        <div
          className="flex flex-col justify-between rounded-[10px] p-6"
          style={{ background: C.ink, color: C.bg }}
        >
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.24em]"
              style={{ color: "rgba(250,249,245,0.6)", ...mono }}
            >
              Nu spelen
            </p>
            <h2 className="mt-3 text-[20px] font-semibold leading-snug" style={display}>
              {primair.titel}
            </h2>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: "rgba(250,249,245,0.72)" }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group mt-6 inline-flex items-center justify-between gap-2 rounded-[6px] px-4 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
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
      </section>

      {/* KPI-partituur */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <Overline>Maat 02 — In cijfers</Overline>
          <span
            className="text-[11px] uppercase tracking-[0.14em]"
            style={{ color: C.faint, ...mono }}
          >
            7 tellen
          </span>
        </div>
        <div
          className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4"
          style={{ borderColor: C.line }}
        >
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="px-0 py-5 sm:px-5"
              style={i > 0 ? { borderLeft: `1px solid ${C.line}` } : undefined}
            >
              <div className="flex items-baseline justify-between">
                <p
                  className="text-[11px] uppercase tracking-[0.14em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{ color: k.up ? C.ink : C.accent, ...mono }}
                >
                  {k.up ? "+" : "−"}
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2 text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Staff data={k.spark} width={180} height={44} accent={!k.up} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Opdrachten-regel */}
      <section className="border-t pt-8" style={{ borderColor: C.line }}>
        <div className="mb-4 flex items-center justify-between">
          <Overline>Maat 03 — Opdrachten voor jou</Overline>
          <button
            onClick={onOpen}
            className="text-[12px] font-medium uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.accent, ...mono }}
          >
            Alle
          </button>
        </div>
        <ul>
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 border-t py-4 text-left transition-colors last:border-b hover:bg-[#f2f0e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="w-8 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15.5px] font-semibold" style={display}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchMeter value={o.match} />
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.ink }}
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

function MatchMeter({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ color: strong ? C.accent : C.ink, ...mono }}
      >
        {value}%
      </span>
      <span
        className="hidden h-1.5 w-16 overflow-hidden rounded-full sm:block"
        style={{ background: C.line }}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: strong ? C.accent : C.ink }}
        />
      </span>
    </span>
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
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Marktplaats</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={display}
          >
            Open opdrachten
          </h1>
        </div>
        <span
          className="text-[11px] uppercase tracking-[0.14em]"
          style={{ color: C.faint, ...mono }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 border-b px-1 py-2.5"
          style={{ borderColor: C.ink }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9a9a92]"
            style={{ color: C.ink, ...body }}
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
                className="rounded-[5px] px-3 py-2 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.ink, color: C.bg, ...mono }
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
          <div className="w-40 opacity-40">
            <Staff data={[1, 1, 1, 1, 1, 1, 1]} width={160} height={44} />
          </div>
          <p className="mt-4 text-[22px] font-semibold" style={display}>
            Stilte op de balk
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm om de
            partituur weer te vullen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.bg, ...display }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ul className="space-y-0">
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
    <div className="border-t last:border-b" style={{ borderColor: C.line }}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5">
        <span className="w-8 text-[12px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug" style={display}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span
            className="text-[19px] font-semibold tabular-nums"
            style={{ color: opdracht.match >= 90 ? C.accent : C.ink, ...mono }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[14px] font-medium" style={{ color: C.inkSoft, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 pb-4">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
          <div className="grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2 sm:pl-12">
            <div>
              <p
                className="text-[10.5px] uppercase tracking-[0.18em]"
                style={{ color: C.faint, ...mono }}
              >
                Wat past
              </p>
              <ul className="mt-3 space-y-2">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={14}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ink }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[10.5px] uppercase tracking-[0.18em]"
                style={{ color: C.accent, ...mono }}
              >
                Aandacht
              </p>
              <ul className="mt-3 space-y-2">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.accent }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug
      </button>

      <header className="border-b pb-8" style={{ borderColor: C.ink }}>
        <div className="flex flex-wrap items-center gap-3">
          <Overline accent>{opdracht.id}</Overline>
          <Tag active>{opdracht.match}% match</Tag>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[38px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[46px]"
          style={display}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-4 text-[15px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-[6px] px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, color: C.paper, ...display }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-[6px] px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink, border: `1px solid ${C.ink}`, ...display }}
          >
            Bewaar
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4" style={{ borderColor: C.line }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="py-2 md:px-5"
            style={i > 0 ? { borderLeft: `1px solid ${C.line}` } : undefined}
          >
            <p
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <section className="border-t pt-8" style={{ borderColor: C.line }}>
        <Overline>Waarom deze match</Overline>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Circle size={9} aria-hidden="true" style={{ color: C.ink, fill: C.ink }} />
              <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: C.faint, ...mono }}
              >
                Wat past
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Circle size={9} aria-hidden="true" style={{ color: C.accent, fill: C.accent }} />
              <p
                className="text-[11px] uppercase tracking-[0.18em]"
                style={{ color: C.accent, ...mono }}
              >
                Aandacht
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.accent }}
                  />
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
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-8">
      <header className="border-b pb-8" style={{ borderColor: C.ink }}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <Overline>Vertrouwen</Overline>
            <h1
              className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
              style={display}
            >
              Verificatie
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-medium" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten volledig geverifieerd. Eén vraagt
              binnenkort om actie.
            </p>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p
                className="text-[44px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={display}
              >
                {ratio}
                <span className="text-[22px]" style={{ color: C.muted }}>
                  %
                </span>
              </p>
              <p
                className="mt-1 text-[11px] uppercase tracking-[0.16em]"
                style={{ color: C.faint, ...mono }}
              >
                compleet
              </p>
            </div>
            <div className="flex items-end gap-1.5 pb-1" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="w-2 rounded-[2px]"
                  style={{
                    height: c.status === "VERIFIED" ? 40 : c.status === "EXPIRING" ? 22 : 30,
                    background:
                      c.status === "VERIFIED" ? C.ink : c.status === "EXPIRING" ? C.accent : C.line,
                  }}
                />
              ))}
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
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-5 text-left transition-colors hover:bg-[#f2f0e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <span className="w-8 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <st.Icon
                      size={15}
                      aria-hidden="true"
                      style={{ color: st.accent ? C.accent : C.ink }}
                    />
                    <span className="truncate text-[16px] font-semibold" style={display}>
                      {c.naam}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Tag active={st.accent}>{st.label}</Tag>
                  <span
                    className="text-[13px] transition-transform motion-reduce:transition-none"
                    style={{
                      color: C.muted,
                      ...mono,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
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
                  <div className="pb-5 pl-12">
                    <p
                      className="max-w-xl text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw expliciete
                      toestemming gedeeld met een opdrachtgever.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-[5px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ background: C.ink, color: C.bg, ...display }}
                      >
                        {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                      </button>
                      <button
                        className="rounded-[5px] px-3.5 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
        <Overline>Aandacht</Overline>
        <h1
          className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
          style={display}
        >
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Speel deze noten op volgorde af — elke afgeronde actie houdt je ritme zuiver.
        </p>
      </header>

      <ol>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel} className="border-t last:border-b" style={{ borderColor: C.line }}>
              <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[15px] font-semibold tabular-nums"
                  style={
                    warn
                      ? { background: C.accent, color: C.paper, ...mono }
                      : { border: `1px solid ${C.ink}`, color: C.ink, ...mono }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.accent }} />
                    ) : (
                      <Circle size={9} aria-hidden="true" style={{ color: C.ink, fill: C.ink }} />
                    )}
                    <h2 className="text-[17px] font-semibold leading-snug" style={display}>
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className="justify-self-start rounded-[6px] px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
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
          <Overline>Omzet</Overline>
          <h1
            className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[6px] px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink, color: C.bg, ...display }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3" style={{ borderColor: C.line }}>
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", accent: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", accent: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", accent: false },
        ].map((s, i) => (
          <div
            key={s.l}
            className="py-4 sm:px-6"
            style={i > 0 ? { borderLeft: `1px solid ${C.line}` } : undefined}
          >
            <p
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.accent ? C.accent : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10.5px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#f2f0e9] sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2"
                  style={display}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag active={acc}>{f.status}</Tag>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.accent : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-semibold tabular-nums" style={display}>
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
