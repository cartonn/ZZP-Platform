"use client";

// Concept 388 — "Lichtorgel" · Bento-grid met luminescent equalizer-motief.
// Modulair bento-raster van asymmetrische tegels, waarbij elk datapunt zijn eigen
// ruimtelijke gewicht krijgt. De unieke visuele taal is de "lichtbalk": segmentmeters
// als een spectrum-equalizer / lichtorgel — consequent doorgevoerd in KPI-meters,
// match-balken, verificatie-voortgang en activiteit. Speels-technisch maar strak.
// Palet: donker-neutrale basis (#0d0d11) met spectrum-accent (cyaan → violet → magenta)
// UITSLUITEND in de lichtbalken/meters; de rest blijft ingetogen.
// Fonts: Geist (koppen), Geist Mono (cijfers).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Minus,
  AudioLines,
  ShieldCheck,
  Bell,
  Activity,
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

// — Palet: donkere neutrale basis, spectrum-accent alleen in de lichtbalken —
const C = {
  bg: "#0d0d11",
  surface: "#15151b",
  surface2: "#1c1c24",
  surfaceHi: "#232330",
  line: "rgba(255,255,255,0.08)",
  lineHi: "rgba(255,255,255,0.16)",
  text: "#f5f5f8",
  muted: "#a3a3b0",
  faint: "#6c6c7a",
  cyan: "#22d3ee",
  violet: "#8b5cf6",
  magenta: "#ec4899",
  amber: "#fbbf24",
};
const SPECTRUM = "linear-gradient(90deg, #22d3ee 0%, #8b5cf6 52%, #ec4899 100%)";

const head = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d11]";

// Spectrum-kleur op positie t (0..1): cyaan → violet → magenta.
function spectrumAt(t: number): string {
  const s0 = [34, 211, 238] as const;
  const s1 = [139, 92, 246] as const;
  const s2 = [236, 72, 153] as const;
  const c = Math.min(1, Math.max(0, t));
  const [a, b, local]: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    number,
  ] = c < 0.5 ? [s0, s1, c / 0.5] : [s1, s2, (c - 0.5) / 0.5];
  const l = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * local);
  return `rgb(${l(0)},${l(1)},${l(2)})`;
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, alarm: false, tone: C.cyan };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, tone: C.violet };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, alarm: true, tone: C.magenta };
  }
}

// — Horizontale segment-lichtbalk (VU-meter). Het signatuur-motief. —
function LevelMeter({
  value,
  segments = 16,
  height = 10,
}: {
  value: number;
  segments?: number;
  height?: number;
}) {
  const lit = Math.round((value / 100) * segments);
  return (
    <span
      className="flex w-full items-end gap-[3px]"
      role="presentation"
      aria-hidden="true"
      style={{ height }}
    >
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < lit;
        const t = i / (segments - 1);
        const col = spectrumAt(t);
        return (
          <span
            key={i}
            className="flex-1 rounded-[1px] transition-all duration-300 motion-reduce:transition-none"
            style={{
              height: "100%",
              background: on ? col : "rgba(255,255,255,0.06)",
              boxShadow: on ? `0 0 8px ${col}66` : "none",
            }}
          />
        );
      })}
    </span>
  );
}

// — Verticale equalizer-balken (activiteit / sparkline). —
function EqualizerBars({
  data,
  height = 44,
  tone,
}: {
  data: number[];
  height?: number;
  tone?: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <span className="flex items-end gap-[4px]" aria-hidden="true" style={{ height }}>
      {data.map((d, i) => {
        const h = 22 + ((d - min) / span) * 78;
        const t = i / (data.length - 1);
        const col = tone ?? spectrumAt(t);
        return (
          <span
            key={i}
            className="w-full flex-1 rounded-[2px] transition-all duration-500 motion-reduce:transition-none"
            style={{
              height: `${h}%`,
              minWidth: 5,
              background: col,
              boxShadow: `0 0 10px ${col}55`,
            }}
          />
        );
      })}
    </span>
  );
}

// — Ring-vrije verticale meter (verticale lichtbalk) —
function VerticalMeter({ value, segments = 12 }: { value: number; segments?: number }) {
  const lit = Math.round((value / 100) * segments);
  return (
    <span className="flex flex-col-reverse gap-[3px]" aria-hidden="true">
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < lit;
        const t = i / (segments - 1);
        const col = spectrumAt(t);
        return (
          <span
            key={i}
            className="h-[7px] w-full rounded-[1px]"
            style={{
              background: on ? col : "rgba(255,255,255,0.06)",
              boxShadow: on ? `0 0 6px ${col}66` : "none",
            }}
          />
        );
      })}
    </span>
  );
}

function Tile({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${glow ? "rgba(139,92,246,0.35)" : C.line}`,
        boxShadow: glow
          ? "0 0 0 1px rgba(139,92,246,0.15), 0 18px 40px -24px rgba(139,92,246,0.5)"
          : "0 18px 40px -30px rgba(0,0,0,0.8)",
      }}
    >
      {children}
    </div>
  );
}

function Overline({ children, tone = C.faint }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </p>
  );
}

function MatchTag({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Match ${value} procent`}>
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: spectrumAt(value / 100), ...mono }}
      >
        {value}%
      </span>
      <span className="hidden w-20 sm:block">
        <LevelMeter value={value} segments={10} height={8} />
      </span>
    </span>
  );
}

export function Concept388() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...head, color: C.text, background: C.bg }}
    >
      <div
        className="min-h-[720px]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 500px at 15% -10%, rgba(139,92,246,0.10), transparent 60%), radial-gradient(900px 400px at 95% 0%, rgba(34,211,238,0.07), transparent 55%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <TopBar />
          <NavBar screen={screen} setScreen={setScreen} />
          <main className="pb-24 pt-7">
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
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: C.surface2, border: `1px solid ${C.lineHi}` }}
          aria-hidden="true"
        >
          <AudioLines size={20} style={{ color: C.violet }} />
        </span>
        <div>
          <p className="text-[22px] font-semibold leading-none tracking-[-0.02em]">Lichtorgel</p>
          <p
            className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Live signaal · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-medium sm:inline-flex"
          style={{ color: C.text, background: C.surface2, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={15} aria-hidden="true" style={{ color: C.cyan }} />
          {PROFIEL.trust}
        </span>
        <div className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-semibold">{PROFIEL.naam}</span>
          <span className="block text-[11.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol}
          </span>
        </div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-semibold"
          style={{ background: SPECTRUM, color: "#0d0d11", ...mono }}
          aria-label={`Profiel van ${PROFIEL.naam}`}
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
      className="mt-6 flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5"
      aria-label="Hoofdnavigatie"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`relative shrink-0 rounded-xl px-4 py-2 text-[13.5px] font-medium transition-colors ${RING}`}
            style={{ color: on ? C.text : C.muted, background: on ? C.surfaceHi : "transparent" }}
          >
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 bottom-1 h-[3px] rounded-full"
                aria-hidden="true"
                style={{ background: SPECTRUM }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: () => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Vandaag</Overline>
          <h1 className="mt-2 text-[38px] font-semibold leading-none tracking-[-0.03em] md:text-[46px]">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Je signaal staat helder. Eén tegel licht op — daar ligt vandaag je aandacht.
          </p>
        </div>
        <button
          onClick={onMarkt}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-medium ${RING}`}
          style={{ background: C.surface2, border: `1px solid ${C.line}`, color: C.text }}
        >
          <Bell size={15} aria-hidden="true" style={{ color: C.violet }} /> {ongelezen} berichten
        </button>
      </div>

      {/* Bento-raster: asymmetrische tegels, elk eigen gewicht */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Grote primaire-actie tegel */}
        <Tile glow className="p-6 sm:col-span-2 lg:row-span-2">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <Overline tone={C.violet}>Belangrijkste actie</Overline>
              <span
                className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ background: "rgba(251,191,36,0.14)", color: C.amber, ...mono }}
              >
                Urgent
              </span>
            </div>
            <h2 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.02em]">
              {primair.titel}
            </h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
            <div className="mt-6">
              <EqualizerBars data={[40, 62, 48, 80, 55, 92, 70, 100, 66, 84]} height={54} />
            </div>
            <div className="mt-auto pt-6">
              <button
                onClick={onActies}
                className={`group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-semibold ${RING}`}
                style={{ background: SPECTRUM, color: "#0d0d11" }}
              >
                {primair.cta}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                />
              </button>
            </div>
          </div>
        </Tile>

        {/* KPI-tegels met lichtbalk-meters */}
        {KPIS.map((k, i) => {
          const pct = [92, 70, 82, 54][i] ?? 60;
          return (
            <Tile key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[12px] font-medium uppercase tracking-[0.08em]"
                  style={{ color: C.muted }}
                >
                  {k.label}
                </p>
                <span
                  className="text-[11.5px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.cyan : C.amber, ...mono }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2.5 text-[28px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={mono}
              >
                {k.value}
              </p>
              <div className="mt-4">
                <LevelMeter value={pct} segments={14} height={12} />
              </div>
            </Tile>
          );
        })}
      </div>

      {/* Activiteit + open opdrachten */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tile className="p-5">
          <div className="flex items-center justify-between">
            <Overline>Activiteit · 7 dagen</Overline>
            <Activity size={15} aria-hidden="true" style={{ color: C.violet }} />
          </div>
          <div className="mt-6 flex h-[120px] items-end">
            <EqualizerBars data={KPIS[0]?.spark ?? [1, 1]} height={120} />
          </div>
          <p className="mt-4 text-[12.5px]" style={{ color: C.muted }}>
            Reacties, matches en omzet gebundeld tot één signaal.
          </p>
        </Tile>

        <Tile className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <Overline>Open opdrachten</Overline>
            <button
              onClick={onMarkt}
              className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${RING}`}
              style={{ color: C.violet }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-2.5">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-[#1c1c24] ${RING}`}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[12.5px] font-semibold tabular-nums"
                    style={{
                      background: i === 0 ? "rgba(139,92,246,0.16)" : C.surface2,
                      color: i === 0 ? C.violet : C.muted,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{o.titel}</span>
                    <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <MatchTag value={o.match} />
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                      style={{ color: C.faint }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
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
      <div>
        <Overline>Marktplaats</Overline>
        <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.03em]">
          Open opdrachten
        </h1>
        <p className="mt-2.5 text-[14px]" style={{ color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten · gesorteerd op{" "}
          {sort === "match" ? "match" : "tarief"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.faint }} />
          <span className="sr-only">Opdrachten zoeken</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-[#6c6c7a]"
            style={{ color: C.text }}
          />
        </label>
        <div
          className="flex items-center gap-1.5 rounded-xl p-1.5"
          role="group"
          aria-label="Sorteren"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${RING}`}
                style={on ? { background: C.surfaceHi, color: C.text } : { color: C.muted }}
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Tile className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: C.surface2, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <AudioLines size={26} style={{ color: C.faint }} />
            </span>
            <p className="mt-5 text-[22px] font-semibold tracking-[-0.02em]">
              Geen opdracht gevonden
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[14px]" style={{ color: C.muted }}>
              Geen resultaat voor {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm om alles weer
              te tonen.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold ${RING}`}
              style={{ background: SPECTRUM, color: "#0d0d11" }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Tile>
      ) : (
        <ul className="space-y-3.5">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtRij opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtRij({
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
    <Tile className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: C.faint, ...mono }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="truncate text-[19px] font-semibold leading-tight tracking-[-0.01em]">
              {opdracht.titel}
            </h3>
          </div>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                style={{ background: C.surface2, color: C.muted, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="text-[24px] font-semibold tabular-nums leading-none"
            style={{ color: spectrumAt(opdracht.match / 100), ...mono }}
          >
            {opdracht.match}%
          </span>
          <span className="w-24">
            <LevelMeter value={opdracht.match} segments={12} height={9} />
          </span>
          <span className="text-[13.5px] font-medium" style={{ color: C.text }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3"
        style={{ borderColor: C.line }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${RING}`}
          style={{ color: C.muted }}
        >
          {open ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold ${RING}`}
          style={{ background: C.surfaceHi, color: C.text }}
        >
          Reageer <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RedenBlok titel="Pluspunten" items={opdracht.redenen.plus} kind="plus" />
            <RedenBlok titel="Aandachtspunten" items={opdracht.redenen.min} kind="min" />
          </div>
        </div>
      </div>
    </Tile>
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
  const plus = kind === "plus";
  const tone = plus ? C.cyan : C.amber;
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: C.surface2, border: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-1 rounded-full"
          style={{ background: tone }}
          aria-hidden="true"
        />
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: tone, ...mono }}
        >
          {titel}
        </p>
      </div>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.text }}
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {plus ? (
                <Check size={15} style={{ color: tone }} />
              ) : (
                <AlertTriangle size={14} style={{ color: tone }} />
              )}
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-[13px] font-medium ${RING}`}
        style={{ color: C.muted }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Tile glow className="p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="text-[12px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.violet, ...mono }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(139,92,246,0.14)", color: C.text }}
          >
            <span style={{ color: spectrumAt(opdracht.match / 100), ...mono }}>
              {opdracht.match}%
            </span>{" "}
            match
          </span>
        </div>
        <h1 className="mt-4 max-w-3xl text-[36px] font-semibold leading-[1.04] tracking-[-0.03em] md:text-[48px]">
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 max-w-md">
          <LevelMeter value={opdracht.match} segments={24} height={12} />
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-semibold ${RING}`}
            style={{ background: SPECTRUM, color: "#0d0d11" }}
          >
            Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-semibold ${RING}`}
            style={{ color: C.text, border: `1px solid ${C.lineHi}` }}
          >
            Bewaar opdracht
          </button>
        </div>
      </Tile>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Tile key={m.l} className="p-4">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[21px] font-semibold tabular-nums tracking-[-0.02em]"
              style={mono}
            >
              {m.v}
            </p>
          </Tile>
        ))}
      </section>

      <section>
        <Overline>Onderbouwing · waarom deze match</Overline>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: C.muted }}>
          Transparant opgebouwd op je geverifieerde profiel — wat ervoor pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Tile className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-1 rounded-full"
                style={{ background: C.cyan }}
                aria-hidden="true"
              />
              <Overline tone={C.cyan}>Pluspunten</Overline>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14.5px]"
                  style={{ borderColor: C.line, color: C.text }}
                >
                  <Check
                    size={17}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.cyan }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Tile>
          <Tile className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-1 rounded-full"
                style={{ background: C.amber }}
                aria-hidden="true"
              />
              <Overline tone={C.amber}>Aandachtspunten</Overline>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14.5px]"
                  style={{ borderColor: C.line, color: C.text }}
                >
                  <AlertTriangle
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Tile>
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
    <div className="space-y-6">
      <Tile glow className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-lg">
            <Overline tone={C.cyan}>Verificatie · authenticatie</Overline>
            <h1 className="mt-2.5 text-[34px] font-semibold leading-none tracking-[-0.03em]">
              Certificaten
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-semibold" style={{ color: C.text }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
              en vraagt actie.
            </p>
            <div className="mt-5 max-w-sm">
              <LevelMeter value={ratio} segments={20} height={12} />
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-end">
              <p
                className="text-[46px] font-semibold tabular-nums leading-none tracking-[-0.03em]"
                style={mono}
              >
                {ratio}
                <span className="text-[20px]" style={{ color: C.muted }}>
                  %
                </span>
              </p>
              <p
                className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ color: C.faint, ...mono }}
              >
                geverifieerd
              </p>
            </div>
            <div className="h-[92px]">
              <VerticalMeter value={ratio} segments={12} />
            </div>
          </div>
        </div>
      </Tile>

      <ul className="space-y-3.5">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Tile className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      background: C.surface2,
                      border: `1px solid ${st.alarm ? "rgba(251,191,36,0.4)" : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <st.Icon size={18} style={{ color: st.tone }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[16.5px] font-semibold">{c.naam}</span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium sm:inline-flex"
                      style={{ background: `${st.tone}1f`, color: st.tone }}
                    >
                      <st.Icon size={12} aria-hidden="true" />
                      {st.label}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.faint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={17} />
                    </span>
                  </span>
                </button>
                <div className="sm:hidden">
                  <span
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                    style={{ background: `${st.tone}1f`, color: st.tone }}
                  >
                    <st.Icon size={12} aria-hidden="true" />
                    {st.label}
                  </span>
                </div>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="mt-4 border-t pt-4 sm:pl-[60px]"
                      style={{ borderColor: C.line }}
                    >
                      <p
                        className="max-w-2xl text-[13.5px] leading-relaxed"
                        style={{ color: C.muted }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className={`rounded-lg px-4 py-2 text-[13px] font-semibold ${RING}`}
                          style={{
                            background: st.alarm ? C.surfaceHi : SPECTRUM,
                            color: st.alarm ? C.text : "#0d0d11",
                          }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className={`rounded-lg px-4 py-2 text-[13px] font-medium ${RING}`}
                          style={{ color: C.muted, border: `1px solid ${C.line}` }}
                        >
                          Historie
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Tile>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Overline>Volgende acties</Overline>
        <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.03em]">Acties</h1>
        <p className="mt-2.5 max-w-lg text-[15px]" style={{ color: C.muted }}>
          Op volgorde van urgentie. Rond ze af en je signaal blijft helder.
        </p>
      </div>

      <ol className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.violet;
          return (
            <li key={a.titel}>
              <Tile className="p-5" glow={warn}>
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-[16px] font-semibold tabular-nums"
                      style={{ background: `${tone}1f`, color: tone, ...mono }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="h-9 sm:hidden">
                      <VerticalMeter value={warn ? 90 : 55} segments={5} />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">
                        {warn ? (
                          <AlertTriangle size={15} style={{ color: tone }} />
                        ) : (
                          <Activity size={15} style={{ color: tone }} />
                        )}
                      </span>
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: tone, ...mono }}
                      >
                        {warn ? "Urgent" : "Kans"}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-[18px] font-semibold leading-tight tracking-[-0.01em]">
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className={`justify-self-start rounded-xl px-5 py-2.5 text-[13.5px] font-semibold sm:justify-self-end ${RING}`}
                    style={
                      warn
                        ? { background: SPECTRUM, color: "#0d0d11" }
                        : { background: C.surfaceHi, color: C.text }
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </Tile>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function statusTone(status: string): string {
  if (status === "Betaald") return C.cyan;
  if (status === "Openstaand") return C.amber;
  return C.faint;
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.03em]">
            Facturen
          </h1>
        </div>
        <button
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold ${RING}`}
          style={{ background: SPECTRUM, color: "#0d0d11" }}
        >
          <Plus size={16} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", pct: 100, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", pct: 45, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", pct: 25, alarm: false },
        ].map((s) => (
          <Tile key={s.l} className="p-5" glow={s.alarm}>
            <p
              className="text-[12px] font-medium uppercase tracking-[0.1em]"
              style={{ color: s.alarm ? C.amber : C.muted }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.amber : C.text, ...mono }}
            >
              {s.v}
            </p>
            <div className="mt-3">
              <LevelMeter value={s.pct} segments={12} height={9} />
            </div>
            <p className="mt-3 text-[12px]" style={{ color: C.muted }}>
              {s.sub}
            </p>
          </Tile>
        ))}
      </section>

      <Tile className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_7rem] gap-4 border-b pb-3 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const tone = statusTone(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors last:border-0 hover:bg-[#1c1c24] sm:grid-cols-[8rem_1fr_5rem_9rem_7rem] sm:gap-4"
                style={{ borderColor: C.line }}
              >
                <span
                  className="order-1 text-[12.5px] font-medium tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span className="order-3 min-w-0 truncate text-[15px] font-semibold sm:order-2">
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[13px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                    style={{ background: `${tone}1f`, color: tone }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: tone }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.amber : C.text, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-semibold tabular-nums" style={mono}>
            {totaalBetaald}
          </span>
        </div>
      </Tile>
    </div>
  );
}
