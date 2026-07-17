"use client";

// Concept 385 — "Kwartslag" · Verfijnd neo-brutalisme.
// Hard raster, dikke zwarte randen, blokvormige panelen, harde offset-slagschaduw (geen blur),
// monospace-labels en één fel primair accent (elektrisch geel). Kwartslag-rotaties (90°) in
// badges en decoratie. Rauw maar VERFIJND en volledig leesbaar — geen chaos, strakke schaal.
// Status altijd label + icoon, nooit alleen kleur.
// Palet: knalwit #ffffff / lichtgrijs #f2f2ef / inkt #111111 / elektrisch geel #e6ff00.
// Fonts: Anton (koppen), Space Grotesk (body), Space Mono (labels/data).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Square,
  ShieldCheck,
  Zap,
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

// — Palet: neo-brutalisme —
const C = {
  paper: "#ffffff",
  grey: "#f2f2ef",
  greyDeep: "#e6e6e1",
  ink: "#111111",
  inkSoft: "#3a3a37",
  muted: "#6b6b64",
  accent: "#e6ff00", // elektrisch geel
  accentInk: "#111111",
  alarm: "#ff3b1f",
  line: "#111111",
};

const display = { fontFamily: "var(--font-lab-anton), Impact, sans-serif" };
const body = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-space-mono), ui-monospace, monospace" };

// Harde offset-slagschaduw (geen blur) — het handelsmerk van dit concept
const HARD = "6px 6px 0 #111111";
const HARD_SM = "4px 4px 0 #111111";

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  bg: string;
  fg: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", Icon: ShieldCheck, alarm: false, bg: C.accent, fg: C.ink };
    case "SUBMITTED":
      return { label: "IN BEHANDELING", Icon: Clock, alarm: false, bg: C.grey, fg: C.ink };
    case "EXPIRING":
      return { label: "VERLOOPT", Icon: AlertTriangle, alarm: true, bg: C.alarm, fg: "#ffffff" };
    case "REJECTED":
      return { label: "AFGEWEZEN", Icon: AlertTriangle, alarm: true, bg: C.alarm, fg: "#ffffff" };
  }
}

// — Blok-container met dikke rand + harde slagschaduw —
function Block({
  children,
  className = "",
  shadow = true,
  bg = C.paper,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
  bg?: string;
  as?: "div" | "section" | "li";
}) {
  const Comp = as;
  return (
    <Comp
      className={className}
      style={{
        background: bg,
        border: `2.5px solid ${C.line}`,
        boxShadow: shadow ? HARD : "none",
      }}
    >
      {children}
    </Comp>
  );
}

// — Monospace-label (overline) —
function Label({ children, tone = C.muted }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </p>
  );
}

// — Blokkige, gerasterde sparkline (stappen, geen curve) —
function StepSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 30;
  const step = w / data.length;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const bh = ((d - min) / span) * (h - 4) + 4;
        return (
          <rect key={i} x={i * step + 1} y={h - bh} width={step - 2} height={bh} fill={tone} />
        );
      })}
    </svg>
  );
}

// — Kwartslag-decoratie: 90° geroteerd vierkant —
function QuarterMark({ size = 14, tone = C.ink }: { size?: number; tone?: string }) {
  return (
    <span className="inline-block" style={{ transform: "rotate(45deg)" }} aria-hidden="true">
      <Square size={size} style={{ color: tone }} strokeWidth={2.5} />
    </span>
  );
}

function MatchBar({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="text-[16px] font-bold tabular-nums leading-none"
        style={{ ...mono, color: C.ink }}
      >
        {value}
      </span>
      <span className="flex h-2.5 w-16 border" style={{ borderColor: C.line, background: C.paper }}>
        <span
          className="h-full"
          style={{ width: `${value}%`, background: strong ? C.accent : C.ink }}
        />
      </span>
    </span>
  );
}

export function Concept385() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: C.grey,
        backgroundImage:
          "linear-gradient(rgba(17,17,17,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-7">
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
    <header className="flex items-center justify-between pt-6">
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-12 w-12 items-center justify-center"
          style={{ background: C.accent, border: `2.5px solid ${C.line}`, boxShadow: HARD_SM }}
          aria-hidden="true"
        >
          <QuarterMark size={18} />
        </span>
        <div>
          <p
            className="text-[26px] leading-[0.85] tracking-[0.01em]"
            style={{ ...display, color: C.ink }}
          >
            KWARTSLAG
          </p>
          <p
            className="mt-1 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: C.muted, ...mono }}
          >
            90° VERTROUWEN · {PROFIEL.plaats.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ background: C.accent, border: `2.5px solid ${C.line}`, color: C.ink, ...mono }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] uppercase tracking-[0.06em]"
            style={{ color: C.muted, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
          style={{ background: C.ink, color: C.accent, border: `2.5px solid ${C.line}`, ...mono }}
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
      className="mt-6 flex items-stretch overflow-x-auto"
      aria-label="Hoofdnavigatie"
      style={{ border: `2.5px solid ${C.line}`, background: C.paper, boxShadow: HARD_SM }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 motion-reduce:transition-none"
            style={{
              ...mono,
              color: on ? C.ink : C.muted,
              background: on ? C.accent : "transparent",
              borderLeft: i === 0 ? "none" : `2.5px solid ${C.line}`,
            }}
          >
            {s.label}
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
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Block className="relative overflow-hidden p-7 md:p-9" bg={C.paper}>
          <span className="absolute -right-6 -top-6 opacity-[0.06]" aria-hidden="true">
            <QuarterMark size={140} />
          </span>
          <Label tone={C.ink}>WERKPLAATS · VANDAAG</Label>
          <h1
            className="mt-4 text-[46px] leading-[0.9] tracking-[0.01em] md:text-[60px]"
            style={{ ...display, color: C.ink }}
          >
            GOEDEMORGEN,
            <br />
            <span
              className="inline-block px-2"
              style={{ background: C.accent, boxShadow: `3px 3px 0 ${C.line}` }}
            >
              {(PROFIEL.naam.split(" ")[0] ?? PROFIEL.naam).toUpperCase()}.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Alles staat haaks. Je profiel is geverifieerd, drie matches wachten en één certificaat
            vraagt om actie. Draai de volgende taak een kwartslag verder.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className="group inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
              style={{ background: C.ink, color: C.accent, boxShadow: HARD_SM, ...mono }}
            >
              VOLGENDE ACTIE
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
            <span
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em]"
              style={{ background: C.grey, border: `2.5px solid ${C.line}`, color: C.ink, ...mono }}
            >
              <Zap size={14} aria-hidden="true" />
              {ongelezen} BERICHTEN
            </span>
          </div>
        </Block>

        <Block className="flex flex-col p-6" bg={C.accent}>
          <div className="flex items-center justify-between">
            <Label tone={C.ink}>FIJNSTE MATCH</Label>
            <QuarterMark size={16} />
          </div>
          <h2
            className="mt-3 text-[24px] uppercase leading-[0.95] tracking-[0.01em]"
            style={{ ...display, color: C.ink }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <button
            onClick={onActies}
            className="group mt-5 inline-flex w-fit items-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
            style={{ background: C.ink, color: C.accent, boxShadow: HARD_SM, ...mono }}
          >
            {primair.cta}
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Block>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Label tone={C.ink}>KENGETALLEN · DEZE MAAND</Label>
          <span
            className="text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.muted, ...mono }}
          >
            GEVERIFIEERD PROFIEL
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Block key={k.label} className="p-5">
              <div className="flex items-start justify-between">
                <Label>{k.label}</Label>
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                  style={{
                    background: k.up ? C.accent : C.alarm,
                    color: k.up ? C.ink : "#fff",
                    ...mono,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[34px] tabular-nums leading-[0.85]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-3 border-t-2 pt-2" style={{ borderColor: C.line }}>
                <StepSpark data={k.spark} tone={k.up ? C.ink : C.alarm} />
              </div>
            </Block>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Label tone={C.ink}>OPEN OPDRACHTEN</Label>
          <button
            onClick={onOpen}
            className="text-[11px] font-bold uppercase tracking-[0.1em] underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink, ...mono }}
          >
            ALLE →
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
                style={{ background: C.paper, border: `2.5px solid ${C.line}`, boxShadow: HARD_SM }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center text-[14px] font-bold"
                  style={{
                    background: i === 0 ? C.accent : C.ink,
                    color: i === 0 ? C.ink : C.accent,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[16px] font-bold uppercase leading-tight tracking-[0.01em]"
                    style={{ ...body, color: C.ink }}
                  >
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.04em]"
                    style={{ color: C.muted, ...mono }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchBar value={o.match} />
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
      <div>
        <Label tone={C.ink}>HET RASTER</Label>
        <h1
          className="mt-2 text-[40px] leading-[0.85] tracking-[0.01em]"
          style={{ ...display, color: C.ink }}
        >
          OPEN OPDRACHTEN
        </h1>
        <p
          className="mt-2 text-[12px] uppercase tracking-[0.06em]"
          style={{ color: C.muted, ...mono }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          MATCHES
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
          style={{ background: C.paper, border: `2.5px solid ${C.line}`, boxShadow: HARD_SM }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK OP TITEL, PLAATS OF OPDRACHTGEVER…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[12.5px] uppercase tracking-[0.04em] outline-none placeholder:text-[#6b6b64]"
            style={{ color: C.ink, ...mono }}
          />
        </div>
        <div
          className="flex items-stretch"
          role="group"
          aria-label="Sorteren"
          style={{ border: `2.5px solid ${C.line}`, boxShadow: HARD_SM }}
        >
          {(["match", "tarief"] as const).map((s, i) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset motion-reduce:transition-none"
                style={{
                  ...mono,
                  background: on ? C.accent : C.paper,
                  color: C.ink,
                  borderLeft: i === 0 ? "none" : `2.5px solid ${C.line}`,
                }}
              >
                {s === "match" ? "MATCH" : "TARIEF"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Block className="p-0">
          <div className="flex flex-col items-center py-16 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center"
              style={{ background: C.grey, border: `2.5px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={28} style={{ color: C.ink }} />
            </span>
            <p
              className="mt-5 text-[28px] uppercase leading-[0.9]"
              style={{ ...display, color: C.ink }}
            >
              GEEN MATCH
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[12px] uppercase tracking-[0.04em]"
              style={{ color: C.muted, ...mono }}
            >
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.ink, color: C.accent, boxShadow: HARD_SM, ...mono }}
            >
              WIS ZOEKTERM <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </Block>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
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
    <Block className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span
          className="flex h-11 w-11 items-center justify-center text-[15px] font-bold"
          style={{
            background: index === 0 ? C.accent : C.ink,
            color: index === 0 ? C.ink : C.accent,
            ...mono,
          }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3
            className="text-[18px] font-bold uppercase leading-tight tracking-[0.01em]"
            style={{ ...body, color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p
            className="mt-1 text-[11px] uppercase tracking-[0.04em]"
            style={{ color: C.muted, ...mono }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                style={{ border: `2px solid ${C.line}`, color: C.ink, ...mono }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[26px] tabular-nums leading-[0.8]"
            style={{ ...display, color: opdracht.match >= 90 ? C.ink : C.ink }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.inkSoft, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t-2 pt-3" style={{ borderColor: C.line }}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: open ? C.accent : C.grey,
            border: `2px solid ${C.line}`,
            color: C.ink,
            ...mono,
          }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          WAAROM DEZE MATCH
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.ink, ...mono }}
        >
          REAGEER <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="p-4" style={{ background: C.accent, border: `2.5px solid ${C.line}` }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.ink, ...mono }}
              >
                + PLUSPUNTEN
              </p>
              <ul className="mt-2.5 space-y-2">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px] font-medium"
                    style={{ color: C.ink, ...body }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ink }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4" style={{ background: C.paper, border: `2.5px solid ${C.line}` }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.alarm, ...mono }}
              >
                ! AANDACHTSPUNTEN
              </p>
              <ul className="mt-2.5 space-y-2">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px] font-medium"
                    style={{ color: C.inkSoft, ...body }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.alarm }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Block>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ background: C.paper, border: `2.5px solid ${C.line}`, color: C.ink, ...mono }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> TERUG
      </button>

      <Block className="relative overflow-hidden p-7 md:p-10" bg={C.ink}>
        <span className="absolute -right-8 -top-8 opacity-[0.08]" aria-hidden="true">
          <QuarterMark size={180} tone={C.accent} />
        </span>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.accent, ...mono }}
            >
              {opdracht.id}
            </span>
            <span
              className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold uppercase"
              style={{ background: C.accent, color: C.ink, ...mono }}
            >
              {opdracht.match}% MATCH
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[40px] uppercase leading-[0.88] tracking-[0.01em] md:text-[54px]"
            style={{ ...display, color: "#fff" }}
          >
            {opdracht.titel}
          </h1>
          <p
            className="mt-3 text-[13px] uppercase tracking-[0.06em]"
            style={{ color: "rgba(255,255,255,0.7)", ...mono }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 px-5 py-3 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{
                background: C.accent,
                color: C.ink,
                boxShadow: "5px 5px 0 rgba(230,255,0,0.25)",
                ...mono,
              }}
            >
              REAGEER OP OPDRACHT <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 px-5 py-3 text-[12.5px] font-bold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: "#fff", border: "2.5px solid rgba(255,255,255,0.5)", ...mono }}
            >
              BEWAAR
            </button>
          </div>
        </div>
      </Block>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "TARIEF", v: opdracht.tarief },
          { l: "OMVANG", v: opdracht.uren },
          { l: "START", v: opdracht.start },
          { l: "MATCH", v: `${opdracht.match}%` },
        ].map((m) => (
          <Block key={m.l} className="p-4">
            <Label>{m.l}</Label>
            <p
              className="mt-1.5 text-[22px] tabular-nums leading-[0.9]"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </p>
          </Block>
        ))}
      </section>

      <section>
        <Label tone={C.ink}>DE ONDERBOUWING · WAAROM DEZE MATCH</Label>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant opgebouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Block className="p-5" bg={C.accent}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.ink, ...mono }}
            >
              + PLUSPUNTEN
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t-2 pt-3 text-[13.5px] font-medium"
                  style={{ borderColor: "rgba(17,17,17,0.2)", color: C.ink, ...body }}
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
          </Block>
          <Block className="p-5">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.alarm, ...mono }}
            >
              ! AANDACHTSPUNTEN
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t-2 pt-3 text-[13.5px] font-medium"
                  style={{ borderColor: C.line, color: C.inkSoft, ...body }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.alarm }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Block>
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
      <Block className="p-6 md:p-8" bg={C.paper}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <Label tone={C.ink}>BEWIJS · AUTHENTICATIE</Label>
            <h1
              className="mt-2 text-[36px] uppercase leading-[0.85] tracking-[0.01em]"
              style={{ ...display, color: C.ink }}
            >
              CERTIFICATEN
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om actie.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="flex h-20 w-20 flex-col items-center justify-center"
              style={{ background: C.accent, border: `2.5px solid ${C.line}`, boxShadow: HARD_SM }}
              aria-hidden="true"
            >
              <span
                className="text-[30px] tabular-nums leading-[0.8]"
                style={{ ...display, color: C.ink }}
              >
                {ratio}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.ink, ...mono }}
              >
                PROCENT
              </span>
            </span>
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.muted, ...mono }}
              >
                GEVERIFIEERD
              </p>
              <p className="text-[13px] font-bold" style={{ color: C.ink, ...mono }}>
                {verified}/{CREDENTIALS.length} CERTIFICATEN
              </p>
            </div>
          </div>
        </div>
      </Block>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Block className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center"
                    style={{ background: st.bg, color: st.fg, border: `2.5px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="truncate text-[16px] font-bold uppercase leading-tight tracking-[0.01em]"
                      style={{ ...body, color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block text-[11px] uppercase tracking-[0.04em]"
                      style={{ color: C.muted, ...mono }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{
                        background: st.bg,
                        color: st.fg,
                        border: `2px solid ${C.line}`,
                        ...mono,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{ transform: isOpen ? "rotate(45deg)" : "none", color: C.ink }}
                      aria-hidden="true"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="mt-3 border-t-2 pl-[3.75rem] pt-3"
                      style={{ borderColor: C.line }}
                    >
                      <p
                        className="max-w-xl text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            background: st.alarm ? C.alarm : C.ink,
                            color: st.alarm ? "#fff" : C.accent,
                            boxShadow: HARD_SM,
                            ...mono,
                          }}
                        >
                          {c.status === "EXPIRING" ? "VERNIEUWEN" : "BEKIJKEN"}
                        </button>
                        <button
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            background: C.paper,
                            border: `2.5px solid ${C.line}`,
                            color: C.ink,
                            ...mono,
                          }}
                        >
                          HISTORIE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Block>
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
        <Label tone={C.ink}>VOLGENDE ACTIES</Label>
        <h1
          className="mt-2 text-[36px] uppercase leading-[0.85] tracking-[0.01em]"
          style={{ ...display, color: C.ink }}
        >
          ACTIES
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: C.muted }}>
          Werk af op volgorde — elke afgeronde stap houdt je profiel op scherp.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Block className="p-5" bg={warn ? C.paper : C.paper}>
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center text-[18px] tabular-nums leading-none"
                    style={{
                      background: warn ? C.alarm : C.accent,
                      color: warn ? "#fff" : C.ink,
                      border: `2.5px solid ${C.line}`,
                      ...display,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        background: warn ? C.alarm : C.ink,
                        color: warn ? "#fff" : C.accent,
                        ...mono,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Zap size={11} aria-hidden="true" />
                      )}
                      {warn ? "URGENT" : "AANBEVOLEN"}
                    </span>
                    <h2
                      className="mt-2 text-[18px] font-bold uppercase leading-tight tracking-[0.01em]"
                      style={{ ...body, color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="justify-self-start px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:justify-self-end"
                    style={{
                      background: warn ? C.alarm : C.ink,
                      color: warn ? "#fff" : C.accent,
                      boxShadow: HARD_SM,
                      ...mono,
                    }}
                  >
                    {a.cta}
                  </button>
                </div>
              </Block>
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

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label tone={C.ink}>HET GROOTBOEK</Label>
          <h1
            className="mt-2 text-[36px] uppercase leading-[0.85] tracking-[0.01em]"
            style={{ ...display, color: C.ink }}
          >
            FACTUREN
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          style={{ background: C.ink, color: C.accent, boxShadow: HARD_SM, ...mono }}
        >
          <Plus size={15} aria-hidden="true" /> NIEUWE FACTUUR
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "BETAALD (MND)", v: totaalBetaald, sub: "3 VOLDAAN", alarm: false },
          { l: "OPENSTAAND", v: "€ 1.350", sub: "1 FACTUUR · 9 DAGEN", alarm: true },
          { l: "CONCEPT", v: "€ 880", sub: "KLAAR OM TE VERSTUREN", alarm: false },
        ].map((s) => (
          <Block key={s.l} className="p-5" bg={s.alarm ? C.alarm : C.paper}>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: s.alarm ? "#fff" : C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[30px] tabular-nums leading-[0.85]"
              style={{ ...display, color: s.alarm ? "#fff" : C.ink }}
            >
              {s.v}
            </p>
            <p
              className="mt-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: s.alarm ? "rgba(255,255,255,0.85)" : C.muted, ...mono }}
            >
              {s.alarm && <AlertTriangle size={11} aria-hidden="true" />}
              {s.sub}
            </p>
          </Block>
        ))}
      </section>

      <Block className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 border-b-2 pb-2.5 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["NUMMER", "KLANT", "DATUM", "STATUS", "BEDRAG"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-bold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.muted, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const chipBg = acc ? C.alarm : f.status === "Betaald" ? C.accent : C.grey;
            const chipFg = acc ? "#fff" : C.ink;
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b-2 py-3.5 transition-colors hover:bg-[#f2f2ef] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderColor: "rgba(17,17,17,0.14)" }}
              >
                <span
                  className="order-1 text-[12px] font-bold tabular-nums"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold uppercase sm:order-2"
                  style={{ ...body, color: C.ink }}
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
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                    style={{
                      background: chipBg,
                      color: chipFg,
                      border: `2px solid ${C.line}`,
                      ...mono,
                    }}
                  >
                    {acc && <AlertTriangle size={10} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[16px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.alarm : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-4">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.muted, ...mono }}
          >
            TOTAAL BETAALD
          </span>
          <span
            className="text-[26px] tabular-nums leading-[0.8]"
            style={{ ...display, color: C.ink }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Block>
    </div>
  );
}
