"use client";

// Concept 227 — "Kompres" · hyperdense keyboard-first command-center. Maximale informatiedichtheid:
// een monospace-raster met compacte rijen, een zichtbaar command-palette-motief (⌘K), sneltoets-hints
// (kbd-chips) overal, tabulaire cijfers en een operator-view waarin alles in één blik staat. Onderscheidt
// zich van een handelsterminal door de keyboard-first bediening + het permanente command-palette + het
// dichtere monospace-raster (geen kaart-in-kaart, geen decoratie — alleen dichtheid en snelheid).
// Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen. Status = label + icoon. UI Nederlands.
// Fonts: --font-lab-plex-mono (raster/cijfers) + --font-lab-franklin (labels).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Command,
  CornerDownLeft,
  Terminal,
  Activity,
  Layers,
  Gauge,
  Hash,
  Zap,
  X,
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

// ── Palet — graphite operator-console; één lime-accent, koele cyaan/amber/rood signalen. ──
const C = {
  bg: "#0b0c0e", // near-black console
  bgAlt: "#101216", // gutter/strip
  panel: "#131519", // paneel
  panelHi: "#191c22", // hover
  line: "#1e2228", // fijne rasterlijn
  lineStrong: "#2a2f37", // sterkere scheiding
  ink: "#e7eaef", // hoofdtekst
  inkSoft: "#98a1ad", // secundair
  inkFaint: "#616a76", // labels/gutter
  lime: "#c2f24a", // hoofdaccent
  limeDeep: "#8fbf22", // dieper lime (rand/tekst-op-donker)
  limeBg: "rgba(194,242,74,0.12)",
  cyan: "#5cc8e0", // in behandeling
  cyanBg: "rgba(92,200,224,0.13)",
  amber: "#f2c14e", // aandacht
  amberBg: "rgba(242,193,78,0.14)",
  good: "#57d69f", // geverifieerd/betaald
  goodBg: "rgba(87,214,159,0.13)",
  bad: "#f2647a", // afgewezen
  badBg: "rgba(242,100,122,0.14)",
};

const monoF = { fontFamily: "var(--font-lab-plex-mono)" };
const uiF = { fontFamily: "var(--font-lab-franklin)" };

// ── Status-model — icoon + label + kleur (nooit kleur alleen). ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", Icon: BadgeCheck, fg: C.good, bg: C.goodBg };
    case "SUBMITTED":
      return { label: "IN BEHANDELING", Icon: Clock, fg: C.cyan, bg: C.cyanBg };
    case "EXPIRING":
      return { label: "VERLOOPT", Icon: TriangleAlert, fg: C.amber, bg: C.amberBg };
    case "REJECTED":
      return { label: "AFGEWEZEN", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.04em]"
      style={{ ...monoF, background: m.bg, color: m.fg, border: `1px solid ${m.fg}33` }}
    >
      <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Sneltoets-chip — het signatuurdetail van de keyboard-first bediening.
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex min-w-[18px] items-center justify-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold leading-none"
      style={{
        ...monoF,
        background: C.bgAlt,
        color: C.inkSoft,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: `0 1px 0 ${C.lineStrong}`,
      }}
    >
      {children}
    </kbd>
  );
}

// Rechthoekig, scherp paneel — géén afronding-overdaad, harde rasterranden.
function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[6px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

// Paneel-kop: mono-label + optionele sneltoets rechts.
function PanelHead({
  icon: Icon,
  title,
  hint,
  right,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5"
      style={{ borderColor: C.line }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Icon size={14} strokeWidth={2} style={{ color: C.lime }} aria-hidden="true" />
        <span
          className="truncate text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...monoF, color: C.inkSoft }}
        >
          {title}
        </span>
      </div>
      {right ??
        (hint ? (
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>{hint}</Kbd>
          </span>
        ) : null)}
    </div>
  );
}

// Dichte sparkline — dunne polyline, subtiele grondlijn.
function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 22 - ((v - min) / span) * 18 - 2;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className="h-6 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <line x1="0" y1="22" x2="100" y2="22" stroke={C.line} strokeWidth="1" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Compacte match-indicator — mono cijfer + micro-balk.
function MatchCell({ value }: { value: number }) {
  const tone = value >= 90 ? C.lime : value >= 85 ? C.cyan : C.amber;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...monoF, color: tone }}>
        {value}
      </span>
      <span
        className="relative block h-1 w-10 overflow-hidden rounded-full"
        style={{ background: C.line }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </span>
    </span>
  );
}

// ── Command-palette overlay — het signatuurmotief. ──
function CommandPalette({ onClose, onGo }: { onClose: () => void; onGo: (s: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const rows = SCREENS.map((s, i) => ({
    key: s.key,
    label: `Ga naar ${s.label}`,
    hint: `⌘${i + 1}`,
  })).filter((r) => r.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
      style={{ background: "rgba(4,5,7,0.72)" }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[8px]"
        style={{ background: C.panel, border: `1px solid ${C.lineStrong}` }}
      >
        <div
          className="flex items-center gap-2.5 border-b px-3.5 py-3"
          style={{ borderColor: C.line }}
        >
          <Search size={15} style={{ color: C.lime }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Typ een commando of scherm…"
            aria-label="Commando zoeken"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ ...monoF, color: C.ink }}
          />
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="rounded-[4px] p-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.inkFaint, ["--tw-ring-color" as string]: C.lime }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <ul className="max-h-[46vh] overflow-y-auto py-1.5">
          {rows.length === 0 ? (
            <li
              className="px-3.5 py-6 text-center text-[12px]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              Geen commando gevonden voor &ldquo;{q}&rdquo;.
            </li>
          ) : (
            rows.map((r) => (
              <li key={r.key}>
                <button
                  onClick={() => {
                    onGo(r.key);
                    onClose();
                  }}
                  className="group flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:bg-[color:var(--hov)] focus-visible:outline-none"
                  style={{ ["--hov" as string]: C.panelHi }}
                >
                  <span className="flex items-center gap-2.5">
                    <ChevronRight size={13} style={{ color: C.limeDeep }} aria-hidden="true" />
                    <span className="text-[12.5px]" style={{ ...monoF, color: C.ink }}>
                      {r.label}
                    </span>
                  </span>
                  <Kbd>{r.hint}</Kbd>
                </button>
              </li>
            ))
          )}
        </ul>
        <div
          className="flex items-center justify-between gap-3 border-t px-3.5 py-2"
          style={{ borderColor: C.line, background: C.bgAlt }}
        >
          <span
            className="flex items-center gap-1.5 text-[10.5px]"
            style={{ ...monoF, color: C.inkFaint }}
          >
            <CornerDownLeft size={11} aria-hidden="true" /> selecteren
          </span>
          <span
            className="flex items-center gap-1.5 text-[10.5px]"
            style={{ ...monoF, color: C.inkFaint }}
          >
            <Kbd>Esc</Kbd> sluiten
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept227() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [cmd, setCmd] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...uiF,
        background: C.bg,
        color: C.ink,
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
      }}
    >
      {/* subtiele vignet zodat het raster niet schreeuwt */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: `radial-gradient(900px 500px at 50% -10%, ${C.bgAlt}, ${C.bg} 70%)` }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1180px] px-3 py-4 md:px-5 md:py-5">
        {/* ── Command-bar / topbar ── */}
        <header
          className="sticky top-3 z-30 mb-4 overflow-hidden rounded-[8px]"
          style={{
            background: `${C.panel}f2`,
            border: `1px solid ${C.lineStrong}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[6px]"
                style={{ background: C.limeBg, border: `1px solid ${C.limeDeep}44` }}
                aria-hidden="true"
              >
                <Terminal size={16} strokeWidth={2.2} style={{ color: C.lime }} />
              </span>
              <div className="leading-none">
                <div
                  className="flex items-center gap-1.5 text-[13px] font-semibold tracking-[0.02em]"
                  style={{ ...monoF, color: C.ink }}
                >
                  kompres<span style={{ color: C.limeDeep }}>://</span>console
                </div>
                <div className="mt-1 text-[10.5px]" style={{ ...monoF, color: C.inkFaint }}>
                  {PROFIEL.naam} · {PROFIEL.rol}
                </div>
              </div>
            </div>

            {/* Command-trigger — het permanente ⌘K-motief */}
            <button
              onClick={() => setCmd(true)}
              className="group flex flex-1 items-center gap-2 rounded-[6px] px-3 py-2 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 sm:max-w-xs"
              style={{
                background: C.bgAlt,
                border: `1px solid ${C.line}`,
                ["--hov" as string]: C.panelHi,
                ["--tw-ring-color" as string]: C.lime,
              }}
              aria-label="Command palette openen"
            >
              <Search size={13} style={{ color: C.inkFaint }} aria-hidden="true" />
              <span className="flex-1 text-[12px]" style={{ ...monoF, color: C.inkFaint }}>
                Zoek of voer commando uit…
              </span>
              <span className="flex items-center gap-1">
                <Kbd>
                  <Command size={10} aria-hidden="true" />
                </Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span
                className="hidden items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] md:inline-flex"
                style={{
                  ...monoF,
                  background: C.goodBg,
                  color: C.good,
                  border: `1px solid ${C.good}33`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[10.5px] font-semibold"
                style={{
                  ...monoF,
                  background: C.panelHi,
                  color: C.lime,
                  border: `1px solid ${C.lineStrong}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-navigatie met sneltoets-hints (⌘1..⌘6) */}
          <nav
            className="flex items-center gap-0.5 overflow-x-auto border-t px-2 py-1"
            style={{ borderColor: C.line }}
            aria-label="Schermen"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex shrink-0 items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    ...monoF,
                    background: on ? C.limeBg : "transparent",
                    color: on ? C.lime : C.inkSoft,
                    border: `1px solid ${on ? C.limeDeep + "55" : "transparent"}`,
                    ["--tw-ring-color" as string]: C.lime,
                  }}
                >
                  {s.label}
                  <span className="hidden opacity-70 sm:inline">
                    <Kbd>⌘{i + 1}</Kbd>
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        <main>
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onActies={() => setScreen("acties")}
              onMarkt={() => setScreen("marktplaats")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-[8px] px-3.5 py-2.5"
          style={{
            ...monoF,
            background: C.panel,
            border: `1px solid ${C.line}`,
            color: C.inkFaint,
          }}
        >
          <span className="flex items-center gap-1.5 text-[10.5px]">
            <Command size={11} aria-hidden="true" /> keyboard-first — elke actie heeft een
            sneltoets, elke status een woord én icoon.
          </span>
          <span className="hidden items-center gap-1.5 text-[10.5px] sm:flex">
            <Kbd>⌘K</Kbd> palette · <Kbd>/</Kbd> zoeken · <Kbd>?</Kbd> hulp
          </span>
        </footer>
      </div>

      {cmd && <CommandPalette onClose={() => setCmd(false)} onGo={setScreen} />}
    </div>
  );
}

// ── Dashboard — operator-view: alles in één blik ─────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: () => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const sparkColors = [C.lime, C.cyan, C.good, C.amber];

  return (
    <div className="space-y-4">
      {/* KPI-strip — dicht mono-raster */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className="truncate text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...monoF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{
                  ...monoF,
                  background: k.up ? C.goodBg : C.amberBg,
                  color: k.up ? C.good : C.amber,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[23px] font-semibold tabular-nums leading-none"
              style={{ ...monoF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Spark data={k.spark} color={sparkColors[i % sparkColors.length] ?? C.lime} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* Live matches — dichte tabel */}
        <Panel className="overflow-hidden">
          <PanelHead
            icon={Activity}
            title="Live matches"
            right={
              <button
                onClick={onMarkt}
                className="flex items-center gap-1 rounded-[4px] px-2 py-1 text-[11px] transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...monoF,
                  color: C.lime,
                  ["--hov" as string]: C.panelHi,
                  ["--tw-ring-color" as string]: C.lime,
                }}
              >
                alles <ArrowRight size={12} aria-hidden="true" />
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr style={{ background: C.bgAlt }}>
                  {["#", "OPDRACHT", "TARIEF", "UREN", "MATCH", ""].map((h, i) => (
                    <th
                      key={h + i}
                      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPDRACHTEN.map((o, idx) => (
                  <tr
                    key={o.id}
                    className="group cursor-pointer transition-colors hover:bg-[color:var(--hov)]"
                    style={{ ["--hov" as string]: C.panelHi, borderTop: `1px solid ${C.line}` }}
                    onClick={onOpen}
                  >
                    <td
                      className="px-3 py-2.5 text-[11px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[12.5px] font-medium" style={{ ...monoF, color: C.ink }}>
                        {o.titel}
                      </div>
                      <div className="text-[10.5px]" style={{ ...monoF, color: C.inkFaint }}>
                        {o.opdrachtgever} · {o.plaats}
                      </div>
                    </td>
                    <td
                      className="px-3 py-2.5 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </td>
                    <td
                      className="px-3 py-2.5 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {o.uren}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <MatchCell value={o.match} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ChevronRight
                        size={15}
                        className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: C.lime }}
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Operator-kolom: dekking + acties */}
        <div className="space-y-4">
          <Panel className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <svg viewBox="0 0 80 80" className="h-16 w-16 -rotate-90" aria-hidden="true">
                  <circle cx="40" cy="40" r="33" fill="none" stroke={C.line} strokeWidth="7" />
                  <circle
                    cx="40"
                    cy="40"
                    r="33"
                    fill="none"
                    stroke={C.lime}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${(dek / 100) * 2 * Math.PI * 33} ${2 * Math.PI * 33}`}
                  />
                </svg>
                <span
                  className="absolute text-[15px] font-semibold tabular-nums"
                  style={{ ...monoF, color: C.ink }}
                >
                  {dek}%
                </span>
              </div>
              <div className="min-w-0">
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  Verificatie-dekking
                </div>
                <div className="mt-1 text-[13px]" style={{ ...monoF, color: C.ink }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd
                </div>
                <div className="mt-1.5">
                  <StatusChip status="VERIFIED" />
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHead icon={Gauge} title="Volgende acties" hint="⌘5" />
            <ul>
              {ACTIES.map((a, i) => {
                const warn = a.urgentie === "warning";
                return (
                  <li
                    key={a.titel}
                    className="flex items-start gap-2.5 px-3.5 py-2.5"
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]"
                      style={{ background: warn ? C.amberBg : C.cyanBg }}
                      aria-hidden="true"
                    >
                      {warn ? (
                        <TriangleAlert size={12} strokeWidth={2.2} style={{ color: C.amber }} />
                      ) : (
                        <Zap size={12} strokeWidth={2.2} style={{ color: C.cyan }} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium" style={{ ...monoF, color: C.ink }}>
                        {a.titel}
                      </div>
                      <button
                        onClick={onActies}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          ...monoF,
                          color: warn ? C.amber : C.lime,
                          ["--tw-ring-color" as string]: C.lime,
                        }}
                      >
                        {a.cta} <ArrowRight size={11} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats — dichte tabel met zoek, skeleton, empty- én foutstate ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 620);
  };

  return (
    <div className="space-y-3">
      <Panel className="flex flex-wrap items-center gap-2.5 p-2.5">
        <div
          className="flex flex-1 items-center gap-2 rounded-[5px] px-3 py-2"
          style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}
        >
          <Search size={14} style={{ color: C.lime }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...monoF, color: C.ink }}
          />
          <Kbd>/</Kbd>
        </div>
        {["94+", "€ 50+", "Utrecht"].map((f) => (
          <span
            key={f}
            className="hidden rounded-[5px] px-2.5 py-1.5 text-[11px] sm:inline-flex"
            style={{
              ...monoF,
              background: C.panelHi,
              color: C.inkSoft,
              border: `1px solid ${C.line}`,
            }}
          >
            {f}
          </span>
        ))}
        <button
          onClick={refresh}
          aria-label="Verversen"
          className="flex h-8 w-8 items-center justify-center rounded-[5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: C.panelHi,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.lime,
          }}
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
            style={{ color: C.lime }}
            aria-hidden="true"
          />
        </button>
      </Panel>

      {error && (
        <div
          className="flex items-start gap-2.5 rounded-[6px] p-3"
          role="alert"
          style={{ background: C.badBg, border: `1px solid ${C.bad}44` }}
        >
          <XCircle size={16} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold" style={{ ...monoF, color: C.ink }}>
              Verbinding onderbroken — feed deels geladen
            </div>
            <p className="mt-0.5 text-[11px]" style={{ ...monoF, color: C.inkSoft }}>
              Enkele opdrachten konden niet worden opgehaald. Ververs de feed om opnieuw te
              proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] focus-visible:outline-none focus-visible:ring-2"
            style={{ ...monoF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            sluiten
          </button>
        </div>
      )}

      <Panel className="overflow-hidden">
        <PanelHead
          icon={Layers}
          title={`Marktplaats — ${filtered.length} open`}
          right={
            <span className="text-[10.5px]" style={{ ...monoF, color: C.inkFaint }}>
              gesorteerd op match
            </span>
          }
        />
        {loading ? (
          <div className="divide-y" style={{ borderColor: C.line }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3.5 py-3"
                style={{ borderColor: C.line }}
              >
                <span
                  className="h-4 w-6 animate-pulse rounded-[3px]"
                  style={{ background: C.line }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-1/2 animate-pulse rounded-[3px]"
                    style={{ background: C.lineStrong }}
                  />
                  <span
                    className="block h-3 w-1/3 animate-pulse rounded-[3px]"
                    style={{ background: C.line }}
                  />
                </div>
                <span
                  className="h-3 w-16 animate-pulse rounded-[3px]"
                  style={{ background: C.line }}
                />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-[8px]"
              style={{ background: C.bgAlt, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={22} strokeWidth={1.6} style={{ color: C.inkFaint }} />
            </span>
            <p className="text-[13px] font-semibold" style={{ ...monoF, color: C.ink }}>
              Geen resultaat voor &ldquo;{q}&rdquo;
            </p>
            <p className="max-w-sm text-[11.5px]" style={{ ...monoF, color: C.inkSoft }}>
              Pas de filter aan of wis het veld om de volledige feed te tonen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 rounded-[5px] px-3 py-1.5 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                ...monoF,
                background: C.limeBg,
                color: C.lime,
                border: `1px solid ${C.limeDeep}55`,
                ["--tw-ring-color" as string]: C.lime,
              }}
            >
              Filter wissen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr style={{ background: C.bgAlt }}>
                  {["#", "ID", "OPDRACHT", "PLAATS", "TARIEF", "START", "MATCH", ""].map((h, i) => (
                    <th
                      key={h + i}
                      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 6 ? "text-right" : ""}`}
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => (
                  <tr
                    key={o.id}
                    className="group cursor-pointer transition-colors hover:bg-[color:var(--hov)]"
                    style={{ ["--hov" as string]: C.panelHi, borderTop: `1px solid ${C.line}` }}
                    onClick={onOpen}
                  >
                    <td
                      className="px-3 py-2.5 text-[11px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td
                      className="px-3 py-2.5 text-[11px] tabular-nums"
                      style={{ ...monoF, color: C.limeDeep }}
                    >
                      {o.id}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[12.5px] font-medium" style={{ ...monoF, color: C.ink }}>
                        {o.titel}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {o.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded-[3px] px-1.5 py-0.5 text-[9.5px]"
                            style={{
                              ...monoF,
                              background: C.bgAlt,
                              color: C.inkSoft,
                              border: `1px solid ${C.line}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
                      {o.plaats}
                    </td>
                    <td
                      className="px-3 py-2.5 text-[12px] tabular-nums"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
                      {o.start}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <MatchCell value={o.match} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <ChevronRight
                        size={15}
                        className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: C.lime }}
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ── Opdracht-detail — +/- ledger ─────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [applied, setApplied] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "TARIEF", v: opdracht.tarief, Icon: Coins },
    { l: "OMVANG", v: opdracht.uren, Icon: Clock },
    { l: "START", v: opdracht.start, Icon: CalendarDays },
    { l: "PLAATS", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[12px] transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2"
        style={{
          ...monoF,
          background: C.panel,
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          ["--hov" as string]: C.panelHi,
          ["--tw-ring-color" as string]: C.lime,
        }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> terug <Kbd>Esc</Kbd>
      </button>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="rounded-[4px] px-1.5 py-0.5 text-[11px] tabular-nums"
                style={{
                  ...monoF,
                  background: C.limeBg,
                  color: C.lime,
                  border: `1px solid ${C.limeDeep}44`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[11px]" style={{ ...monoF, color: C.inkFaint }}>
                start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-2 max-w-xl text-[22px] font-semibold leading-tight"
              style={{ ...monoF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[12.5px]" style={{ ...monoF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...monoF, color: C.lime }}
            >
              {opdracht.match}
            </div>
            <div
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              match-score
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t sm:grid-cols-4" style={{ borderColor: C.line }}>
          {feiten.map((f, i) => (
            <div
              key={f.l}
              className="p-3.5"
              style={{
                borderLeft: i % 4 === 0 ? undefined : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : undefined,
              }}
            >
              <div className="flex items-center gap-1.5">
                <f.Icon
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.inkFaint }}
                  aria-hidden="true"
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...monoF, color: C.inkFaint }}
                >
                  {f.l}
                </span>
              </div>
              <div
                className="mt-1.5 text-[14px] font-semibold tabular-nums"
                style={{ ...monoF, color: C.ink }}
              >
                {f.v}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* +/- ledger — verklaarbare matching */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHead icon={Check} title="Waarom dit past" />
          <ul>
            {opdracht.redenen.plus.map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-2.5 px-3.5 py-2.5 text-[12.5px]"
                style={{
                  ...monoF,
                  color: C.ink,
                  borderTop: i === 0 ? undefined : `1px solid ${C.line}`,
                }}
              >
                <span className="mt-0.5 font-semibold" style={{ color: C.good }} aria-hidden="true">
                  +
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHead icon={TriangleAlert} title="Om te wegen" />
          <ul>
            {opdracht.redenen.min.map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-2.5 px-3.5 py-2.5 text-[12.5px]"
                style={{
                  ...monoF,
                  color: C.ink,
                  borderTop: i === 0 ? undefined : `1px solid ${C.line}`,
                }}
              >
                <span
                  className="mt-0.5 font-semibold"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                >
                  −
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="p-3.5">
        <div className="flex items-center gap-1.5">
          <Hash size={13} style={{ color: C.lime }} aria-hidden="true" />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...monoF, color: C.inkSoft }}
          >
            Gevraagde certificaten
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[11px]"
              style={{
                ...monoF,
                background: C.bgAlt,
                color: C.inkSoft,
                border: `1px solid ${C.line}`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2} style={{ color: C.good }} aria-hidden="true" />{" "}
              {t}
            </span>
          ))}
        </div>
      </Panel>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            ...monoF,
            background: applied ? C.goodBg : C.lime,
            color: applied ? C.good : "#0b0c0e",
            border: `1px solid ${applied ? C.good + "55" : C.lime}`,
            ["--tw-ring-color" as string]: C.lime,
          }}
        >
          {applied ? (
            <>
              <Check size={15} strokeWidth={2.6} aria-hidden="true" /> Reactie verstuurd
            </>
          ) : (
            <>
              Reageren <CornerDownLeft size={14} aria-hidden="true" /> <Kbd>⏎</Kbd>
            </>
          )}
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-[13px] transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2"
          style={{
            ...monoF,
            background: C.panel,
            color: C.inkSoft,
            border: `1px solid ${C.line}`,
            ["--hov" as string]: C.panelHi,
            ["--tw-ring-color" as string]: C.lime,
          }}
        >
          Bewaren <Kbd>S</Kbd>
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
      <Panel className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 80 80" className="h-16 w-16 -rotate-90" aria-hidden="true">
              <circle cx="40" cy="40" r="33" fill="none" stroke={C.line} strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r="33"
                fill="none"
                stroke={C.good}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(dek / 100) * 2 * Math.PI * 33} ${2 * Math.PI * 33}`}
              />
            </svg>
            <span
              className="absolute text-[15px] font-semibold tabular-nums"
              style={{ ...monoF, color: C.ink }}
            >
              {dek}%
            </span>
          </div>
          <div>
            <div className="text-[15px] font-semibold" style={{ ...monoF, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 max-w-md text-[11.5px]" style={{ ...monoF, color: C.inkSoft }}>
              Opdrachtgevers zien uitsluitend gecontroleerde documenten. Één verloopt binnenkort.
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-[5px] px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            ...monoF,
            background: C.lime,
            color: "#0b0c0e",
            ["--tw-ring-color" as string]: C.lime,
          }}
        >
          <Plus size={13} aria-hidden="true" /> Document toevoegen <Kbd>N</Kbd>
        </button>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHead icon={ShieldCheck} title="Certificaten" hint="⌘4" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["CERTIFICAAT", "DETAIL", "STATUS", ""].map((h, i) => (
                  <th
                    key={h + i}
                    className={`px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CREDENTIALS.map((c, i) => {
                const actionable = c.status !== "VERIFIED";
                return (
                  <tr
                    key={c.naam}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3.5 py-3 text-[12.5px] font-medium"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {c.naam}
                    </td>
                    <td
                      className="px-3.5 py-3 text-[11.5px]"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {c.detail}
                    </td>
                    <td className="px-3.5 py-3">
                      <StatusChip status={c.status} />
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      {actionable ? (
                        <button
                          className="rounded-[4px] px-2 py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            ...monoF,
                            background: C.panelHi,
                            color: C.lime,
                            border: `1px solid ${C.line}`,
                            ["--tw-ring-color" as string]: C.lime,
                          }}
                        >
                          {c.status === "EXPIRING"
                            ? "vernieuwen"
                            : c.status === "REJECTED"
                              ? "opnieuw"
                              : "bekijken"}
                        </button>
                      ) : (
                        <span className="text-[11px]" style={{ ...monoF, color: C.inkFaint }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHead icon={FileText} title="Documenten — privé" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["DOCUMENT", "TYPE", "GROOTTE", "STATUS", "BIJGEWERKT"].map((h, i) => (
                  <th
                    key={h + i}
                    className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCUMENTEN.map((d, i) => (
                <tr key={d.naam} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                      <span className="text-[12px] font-medium" style={{ ...monoF, color: C.ink }}>
                        {d.naam}
                      </span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-[11.5px]" style={{ ...monoF, color: C.inkSoft }}>
                    {d.type}
                  </td>
                  <td
                    className="px-3.5 py-3 text-[11.5px] tabular-nums"
                    style={{ ...monoF, color: C.inkSoft }}
                  >
                    {d.grootte}
                  </td>
                  <td className="px-3.5 py-3">
                    <StatusChip status={d.status} />
                  </td>
                  <td
                    className="px-3.5 py-3 text-[11.5px] tabular-nums"
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {d.bijgewerkt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ── Acties (next-action-engine) ──────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-3">
      <Panel className="flex items-center justify-between gap-3 p-3.5">
        <div className="flex items-center gap-2">
          <Gauge size={15} style={{ color: C.lime }} aria-hidden="true" />
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...monoF, color: C.inkSoft }}
          >
            Wachtrij — operator
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{
            ...monoF,
            background: openCount === 0 ? C.goodBg : C.amberBg,
            color: openCount === 0 ? C.good : C.amber,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={12} strokeWidth={2.6} aria-hidden="true" /> leeg
            </>
          ) : (
            <>{openCount} open</>
          )}
        </span>
      </Panel>

      <ol className="space-y-2.5">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tone = isDone ? C.good : warn ? C.amber : C.cyan;
          return (
            <li key={a.titel}>
              <Panel style={isDone ? { opacity: 0.6 } : undefined} className="overflow-hidden">
                <div className="flex items-stretch">
                  <span className="w-1 shrink-0" style={{ background: tone }} aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-start gap-3 p-3.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-[12px] font-semibold tabular-nums"
                      style={{
                        ...monoF,
                        background: C.bgAlt,
                        color: tone,
                        border: `1px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={14} strokeWidth={2.6} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                          style={{
                            ...monoF,
                            background: warn ? C.amberBg : C.cyanBg,
                            color: warn ? C.amber : C.cyan,
                          }}
                        >
                          {warn ? (
                            <TriangleAlert size={10} aria-hidden="true" />
                          ) : (
                            <Zap size={10} aria-hidden="true" />
                          )}
                          {warn ? "aandacht" : "kans"}
                        </span>
                        <h3
                          className={`text-[13px] font-semibold ${isDone ? "line-through" : ""}`}
                          style={{ ...monoF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p
                        className="mt-1 text-[11.5px] leading-relaxed"
                        style={{ ...monoF, color: C.inkSoft }}
                      >
                        {a.detail}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            ...monoF,
                            background: warn ? C.lime : C.panelHi,
                            color: warn ? "#0b0c0e" : C.lime,
                            border: `1px solid ${warn ? C.lime : C.line}`,
                            ["--tw-ring-color" as string]: C.lime,
                          }}
                        >
                          {a.cta} <ArrowRight size={12} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                          style={{
                            ...monoF,
                            color: isDone ? C.inkFaint : C.good,
                            ["--tw-ring-color" as string]: C.good,
                          }}
                        >
                          <Check size={13} strokeWidth={2.6} aria-hidden="true" />{" "}
                          {isDone ? "ongedaan" : "afvinken"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Panel className="flex flex-col items-center gap-2 p-8 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[8px]"
            style={{ background: C.goodBg, border: `1px solid ${C.good}44` }}
            aria-hidden="true"
          >
            <Check size={22} strokeWidth={2.2} style={{ color: C.good }} />
          </span>
          <p className="text-[13px] font-semibold" style={{ ...monoF, color: C.ink }}>
            Wachtrij leeg
          </p>
          <p className="max-w-xs text-[11.5px]" style={{ ...monoF, color: C.inkSoft }}>
            Alles afgehandeld. Nieuwe acties verschijnen automatisch bovenaan de wachtrij.
          </p>
        </Panel>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald") return { label: "BETAALD", Icon: Check, fg: C.good, bg: C.goodBg };
    if (status === "Openstaand")
      return { label: "OPENSTAAND", Icon: Clock, fg: C.amber, bg: C.amberBg };
    return { label: "CONCEPT", Icon: FileText, fg: C.inkSoft, bg: C.bgAlt };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "BETAALD / MND", v: betaald, tone: C.good },
          { l: "OPENSTAAND", v: String(open), tone: C.amber },
          { l: "TE FACTUREREN", v: "€ 1.350", tone: C.cyan },
        ].map((s) => (
          <Panel key={s.l} className="p-3">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...monoF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-1.5 text-[20px] font-semibold tabular-nums leading-none"
              style={{ ...monoF, color: s.tone }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <PanelHead
          icon={Coins}
          title="Facturen"
          hint="⌘6"
          right={
            <button
              className="flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                ...monoF,
                background: C.lime,
                color: "#0b0c0e",
                ["--tw-ring-color" as string]: C.lime,
              }}
            >
              <Plus size={12} aria-hidden="true" /> Nieuw
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["NUMMER", "KLANT", "DATUM", "STATUS", "BEDRAG"].map((h, i) => (
                  <th
                    key={h + i}
                    className={`px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...monoF, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                    <td
                      className="px-3.5 py-3 text-[12px] font-medium tabular-nums"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3.5 py-3 text-[12px]" style={{ ...monoF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3.5 py-3 text-[11.5px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.04em]"
                        style={{
                          ...monoF,
                          background: m.bg,
                          color: m.fg,
                          border: `1px solid ${m.fg}33`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-3.5 py-3 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.bgAlt, borderTop: `1px solid ${C.lineStrong}` }}>
                <td
                  colSpan={4}
                  className="px-3.5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...monoF, color: C.inkSoft }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-3.5 py-2.5 text-right text-[14px] font-semibold tabular-nums"
                  style={{ ...monoF, color: C.lime }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
