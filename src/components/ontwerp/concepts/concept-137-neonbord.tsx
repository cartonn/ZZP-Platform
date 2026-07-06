"use client";

// Concept 137 — "Neonbord" · hand-gebogen neon-uithangbord op een donkere bakstenen muur.
// Een nachtelijk canvas (#0b0710) met AMBACHTELIJKE neon-signage: gloeiende, hand-gebogen
// neonbuis-letters en -vormen, opgebouwd uit meerlaagse CSS text-shadow/box-shadow glow. Elke
// buis heeft een kern-highlight (lichte binnenlijn) plus wijde, warme gloed die op de muur
// reflecteert. Statisch en deterministisch — geen flikker-animatie, geen random. Status en rollen
// zijn oplichtende neon-badges: groen "OPEN", amber "verloopt", rood "afgewezen". Onderscheidend
// van neonzon (synthwave-verloop) en chroom (liquid metal): dit is NEON-SIGNAGE als ambacht —
// glasbuizen die op een muur woorden vormen. Fonts: Space Grotesk (display) + JetBrains Mono (UI).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Zap,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  ChevronLeft,
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

// Neon-palet — diep nachtdonker met elektrische buiskleuren.
const C = {
  bg: "#0b0710", // diepe nacht
  brick: "#160f1c", // donkere baksteen
  brickLo: "#0e0913",
  panel: "rgba(28,20,38,0.72)", // glas-paneel over muur
  panelSolid: "#1a1322",
  fg: "#f4ecff", // koel-warm wit
  fgSoft: "#b7a9cc", // gedempt lila-grijs
  fgFaint: "#7d6f92",
  magenta: "#ff3ea5", // elektrisch magenta/roze (primair)
  magentaLo: "#c71f7d",
  cyan: "#31e6ff", // cyaan (secundair)
  cyanLo: "#1fb3cc",
  green: "#3dff9a", // neon-groen (open/geverifieerd)
  greenLo: "#22c979",
  amber: "#ffc24b", // warm amber (verloopt/aandacht)
  amberLo: "#e59b1f",
  red: "#ff5470", // neon-rood (afgewezen/urgent)
  redLo: "#d43354",
  line: "rgba(255,62,165,0.16)",
  lineSoft: "rgba(180,150,220,0.12)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const ui = { fontFamily: "var(--font-lab-mono)" };

// Meerlaagse neon-gloed als text-shadow. `tube` is de warme wijde gloed, plus een strakke
// kern-highlight zodat de "glasbuis" een lichte binnenkern lijkt te hebben.
function neonText(color: string, strength = 1): React.CSSProperties {
  const s = strength;
  return {
    color: "#fff",
    textShadow: [
      `0 0 ${2 * s}px #fff`,
      `0 0 ${5 * s}px ${color}`,
      `0 0 ${10 * s}px ${color}`,
      `0 0 ${20 * s}px ${color}`,
      `0 0 ${38 * s}px ${color}`,
    ].join(", "),
  };
}

// Neon-gloed als box-shadow voor omtrekken/buizen (chips, ringen, lijnen).
function neonBox(color: string, strength = 1, inset = true): string {
  const s = strength;
  return [
    `0 0 ${3 * s}px ${color}`,
    `0 0 ${9 * s}px ${color}`,
    `0 0 ${18 * s}px rgba(0,0,0,0)`,
    inset ? `inset 0 0 ${5 * s}px rgba(255,255,255,0.35)` : `0 0 ${2 * s}px ${color}`,
  ].join(", ");
}

// Bakstenen muur met warme reflectie — statische gradients, geen animatie.
const brickWall =
  // baksteen-voegen horizontaal
  "repeating-linear-gradient(0deg, rgba(255,255,255,0.028) 0 1px, transparent 1px 26px)," +
  // baksteen-voegen verticaal, verspringend gevoel via twee lagen
  "repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 62px)," +
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 124px)," +
  // warme neon-reflectie op de muur (magenta linksboven, cyaan rechtsonder)
  "radial-gradient(120% 90% at 14% 6%, rgba(255,62,165,0.16), transparent 52%)," +
  "radial-gradient(120% 90% at 88% 96%, rgba(49,230,255,0.12), transparent 55%)," +
  "radial-gradient(140% 120% at 50% 120%, rgba(61,255,154,0.06), transparent 60%)," +
  "linear-gradient(160deg, #160f1c 0%, #0e0913 60%, #0b0710 100%)";

// ── Neon-glasbuis-lijn ────────────────────────────────────────────────────────
// Een dunne "buis" (hairline met kern-highlight) die als scheiding of onderstreping dient.
function NeonTube({ color, className = "" }: { color: string; className?: string }) {
  return (
    <span
      className={`block rounded-full ${className}`}
      style={{
        height: 2,
        background: `linear-gradient(90deg, ${color}, #fff, ${color})`,
        boxShadow: neonBox(color, 0.9, false),
      }}
      aria-hidden="true"
    />
  );
}

// Klein neon-buis-icoonveld (ronde "gasbuis"-lus achter een icoon).
function NeonBadgeRing({
  color,
  children,
  size = 44,
}: {
  color: string;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        border: `1.5px solid ${color}`,
        color: "#fff",
        boxShadow: neonBox(color, 1),
        background: "rgba(255,255,255,0.02)",
      }}
      aria-hidden="true"
    >
      <span style={{ filter: `drop-shadow(0 0 4px ${color})`, color }}>{children}</span>
    </span>
  );
}

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.cyan };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// ── Herbruikbare bouwstenen ──────────────────────────────────────────────────
function Panel({
  children,
  className = "",
  interactive = false,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glow?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl ${
        interactive
          ? "transition-all duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        backdropFilter: "blur(2px)",
        border: `1px solid ${glow ? `${glow}55` : C.lineSoft}`,
        boxShadow: glow
          ? `0 0 0 1px ${glow}22, 0 0 22px ${glow}22, inset 0 1px 0 rgba(255,255,255,0.05)`
          : "0 8px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {children}
    </div>
  );
}

// Neon-badge/chip: kleur + icoon + label (status nooit alléén op kleur).
function NeonChip({
  children,
  tone,
  solid = false,
}: {
  children: React.ReactNode;
  tone: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.08em]"
      style={
        solid
          ? {
              background: tone,
              color: "#12060d",
              boxShadow: neonBox(tone, 0.85, false),
            }
          : {
              color: "#fff",
              border: `1px solid ${tone}`,
              background: `${tone}12`,
              boxShadow: neonBox(tone, 0.6),
              textShadow: `0 0 6px ${tone}`,
            }
      }
    >
      {children}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-8 w-full overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 4px ${tone}) drop-shadow(0 0 9px ${tone})` }}
      />
    </svg>
  );
}

// Neon-tekst-heading — de "buis-letters".
function NeonHeading({
  children,
  tone,
  className = "",
  strength = 0.85,
}: {
  children: React.ReactNode;
  tone: string;
  className?: string;
  strength?: number;
}) {
  return (
    <span className={className} style={{ ...display, ...neonText(tone, strength) }}>
      {children}
    </span>
  );
}

function SectionKop({
  children,
  sub,
  tone = C.cyan,
}: {
  children: React.ReactNode;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <NeonBadgeRing color={tone} size={34}>
        <Zap size={15} strokeWidth={2.4} />
      </NeonBadgeRing>
      <div>
        {sub && (
          <div
            className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em]"
            style={{ color: tone, textShadow: `0 0 8px ${tone}` }}
          >
            {sub}
          </div>
        )}
        <h2 className="text-[24px] font-semibold leading-none tracking-[0.01em] sm:text-[28px]">
          <NeonHeading tone={tone}>{children}</NeonHeading>
        </h2>
      </div>
    </div>
  );
}

export function Concept137() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: brickWall, color: C.fg }}
    >
      {/* Kop — het uithangbord */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 pt-9 md:px-10">
        <div className="flex items-center gap-4">
          <NeonBadgeRing color={C.magenta} size={50}>
            <Zap size={22} strokeWidth={2.2} />
          </NeonBadgeRing>
          <div className="leading-none">
            <div className="text-[26px] font-bold tracking-[0.02em]">
              <NeonHeading tone={C.magenta} strength={1}>
                NEON
              </NeonHeading>
              <NeonHeading tone={C.cyan} strength={1} className="ml-1.5">
                BORD
              </NeonHeading>
            </div>
            <div
              className="mt-2 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.34em]"
              style={{ color: C.fgFaint }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: C.green, boxShadow: neonBox(C.green, 0.7, false) }}
                aria-hidden="true"
              />
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold"
            style={{
              border: `1.5px solid ${C.cyan}`,
              color: "#fff",
              boxShadow: neonBox(C.cyan, 0.9),
              textShadow: `0 0 6px ${C.cyan}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <div className="mx-auto mt-6 max-w-5xl px-5 md:px-10">
        <NeonTube color={C.magenta} />
      </div>

      {/* Navigatie — neon tab-strip */}
      <nav
        className="mx-auto mt-4 flex max-w-5xl items-center gap-1.5 overflow-x-auto px-5 pb-1 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={
                on
                  ? {
                      color: "#fff",
                      border: `1px solid ${C.magenta}`,
                      boxShadow: neonBox(C.magenta, 0.7),
                      textShadow: `0 0 6px ${C.magenta}`,
                    }
                  : {
                      color: C.fgSoft,
                      border: `1px solid ${C.lineSoft}`,
                    }
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
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

      <footer className="mx-auto max-w-5xl px-5 pb-10 md:px-10">
        <NeonTube color={C.cyan} className="opacity-60" />
        <p
          className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: C.fgFaint }}
        >
          Hand-gebogen · sinds vanavond open
        </p>
      </footer>
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.magenta, C.cyan, C.green, C.amber];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: C.cyan, textShadow: `0 0 8px ${C.cyan}` }}
        >
          <Zap size={12} strokeWidth={2.6} aria-hidden="true" /> Vanavond · {PROFIEL.plaats}
        </div>
        <h1 className="mt-3 text-[36px] font-bold leading-[1.05] tracking-[0.01em] sm:text-[48px]">
          <NeonHeading tone={C.magenta} strength={1}>
            Goedenavond,
          </NeonHeading>
          <br />
          <NeonHeading tone={C.cyan} strength={1}>
            {PROFIEL.naam.split(" ")[0]}
          </NeonHeading>
        </h1>
        <p className="mt-4 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Het bord staat aan. Eén buis knippert om aandacht — de rest gloeit rustig door.
        </p>
      </section>

      {/* Primaire actie — het grote uithangbord */}
      <Panel glow={C.red} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <NeonBadgeRing color={C.red} size={46}>
              <AlertTriangle size={20} strokeWidth={2.2} />
            </NeonBadgeRing>
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em]"
                style={{ color: C.red, textShadow: `0 0 8px ${C.red}` }}
              >
                Vraagt aandacht
              </span>
              <h2 className="mt-2 text-[22px] font-semibold leading-tight sm:text-[25px]">
                <NeonHeading tone={C.red} strength={0.7}>
                  {primair.titel}
                </NeonHeading>
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[12px] font-bold uppercase tracking-[0.1em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
            style={{ background: C.red, color: "#12060d", boxShadow: neonBox(C.red, 0.9, false) }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-tegels als kleine neon-borden */}
      <section>
        <SectionKop sub="In lichtcijfers" tone={C.cyan}>
          Prestatie
        </SectionKop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel key={k.label} interactive glow={tone} className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${tone}`, boxShadow: neonBox(tone, 0.5) }}
                    aria-hidden="true"
                  >
                    <Star size={12} strokeWidth={2.2} style={{ color: tone }} />
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums"
                    style={{ color: k.up ? C.green : C.amber }}
                  >
                    <span aria-hidden="true">{k.up ? "▲" : "▼"}</span>
                    <span className="sr-only">{k.up ? "stijgt" : "daalt"}</span>
                    {k.trend}
                  </span>
                </div>
                <div className="mt-3 text-[26px] font-bold tabular-nums leading-none">
                  <NeonHeading tone={tone} strength={0.6}>
                    {k.value}
                  </NeonHeading>
                </div>
                <div className="mt-1.5 text-[11px]" style={{ color: C.fgSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <SectionKop sub="Beste match" tone={C.green}>
          Voor jou vanavond
        </SectionKop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <Panel
            interactive
            glow={C.green}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
              style={{ border: `2px solid ${C.green}`, boxShadow: neonBox(C.green, 1) }}
              aria-hidden="true"
            >
              <span className="text-[24px] font-bold tabular-nums leading-none">
                <NeonHeading tone={C.green} strength={0.7}>
                  {top.match}
                </NeonHeading>
              </span>
              <span
                className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.green }}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[19px] font-semibold leading-tight">
                <NeonHeading tone={C.fg} strength={0.35}>
                  {top.titel}
                </NeonHeading>
              </h3>
              <div className="mt-1 text-[12px]" style={{ color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <NeonChip key={t} tone={C.magenta}>
                    {t}
                  </NeonChip>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.green, filter: `drop-shadow(0 0 5px ${C.green})` }}
              aria-hidden="true"
            />
          </Panel>
        </button>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.green : value >= 84 ? C.cyan : C.amber;
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${tone}33` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone, boxShadow: neonBox(tone, 0.7, false) }}
        />
      </div>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color: tone, textShadow: `0 0 7px ${tone}` }}
      >
        {value}%
      </span>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  return (
    <div className="space-y-7">
      <SectionKop sub="Open opdrachten" tone={C.magenta}>
        Marktplaats
      </SectionKop>

      <Panel className="flex items-center gap-3 px-4">
        <Search
          size={17}
          style={{ color: C.cyan, filter: `drop-shadow(0 0 4px ${C.cyan})` }}
          aria-hidden="true"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-40"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums"
          style={{ color: C.cyan, border: `1px solid ${C.cyan}44` }}
        >
          {filtered.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <NeonBadgeRing color={C.magenta} size={54}>
            <Search size={22} strokeWidth={2} />
          </NeonBadgeRing>
          <p className="text-[20px] font-semibold">
            <NeonHeading tone={C.magenta} strength={0.5}>
              Bord is donker
            </NeonHeading>
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Niets licht op voor “{q}”. Verruim je zoekopdracht of je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              background: C.magenta,
              color: "#12060d",
              boxShadow: neonBox(C.magenta, 0.8, false),
            }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const tone = o.match >= 90 ? C.green : o.match >= 84 ? C.cyan : C.amber;
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <Panel
                    interactive
                    glow={tone}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <NeonBadgeRing color={tone} size={44}>
                      <span className="text-[13px] font-bold tabular-nums" style={{ color: tone }}>
                        {o.match}
                      </span>
                    </NeonBadgeRing>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[17px] font-semibold leading-tight">
                        <NeonHeading tone={C.fg} strength={0.3}>
                          {o.titel}
                        </NeonHeading>
                      </h3>
                      <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <NeonChip key={t} tone={C.fgFaint}>
                            {t}
                          </NeonChip>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <MatchMeter value={o.match} />
                      <ArrowRight
                        size={19}
                        className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                        style={{ color: tone, filter: `drop-shadow(0 0 4px ${tone})` }}
                        aria-hidden="true"
                      />
                    </div>
                  </Panel>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon; tone: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tone: C.green },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tone: C.cyan },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tone: C.amber },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tone: C.magenta },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ color: C.cyan }}
      >
        <ChevronLeft size={16} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="flex items-start gap-4">
        <NeonBadgeRing color={C.green} size={50}>
          <span className="text-[15px] font-bold tabular-nums" style={{ color: C.green }}>
            {opdracht.match}
          </span>
        </NeonBadgeRing>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <NeonChip tone={C.green} solid>
              <Zap size={11} strokeWidth={2.6} aria-hidden="true" /> {opdracht.match}% match
            </NeonChip>
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.1] tracking-[0.01em] sm:text-[36px]">
            <NeonHeading tone={C.magenta} strength={0.75}>
              {opdracht.titel}
            </NeonHeading>
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: C.fgSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} glow={m.tone} className="p-4">
            <m.Icon
              size={16}
              style={{ color: m.tone, filter: `drop-shadow(0 0 4px ${m.tone})` }}
              aria-hidden="true"
            />
            <div className="mt-2 text-[17px] font-bold tabular-nums leading-none">
              <NeonHeading tone={C.fg} strength={0.3}>
                {m.v}
              </NeonHeading>
            </div>
            <div
              className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel glow={C.green} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.green, textShadow: `0 0 8px ${C.green}` }}
          >
            <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.fg }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green, filter: `drop-shadow(0 0 4px ${C.green})` }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel glow={C.amber} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.amber, textShadow: `0 0 8px ${C.amber}` }}
          >
            <AlertTriangle size={14} strokeWidth={2.8} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.fg }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.amber, boxShadow: neonBox(C.amber, 0.6, false) }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
          style={{
            background: C.magenta,
            color: "#12060d",
            boxShadow: neonBox(C.magenta, 0.9, false),
          }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ border: `1px solid ${C.cyan}`, color: "#fff", boxShadow: neonBox(C.cyan, 0.5) }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <SectionKop sub="Vertrouwen" tone={C.green}>
        Verificatie
      </SectionKop>

      {/* Vertrouwens-overzicht als groot OPEN-bord */}
      <Panel glow={C.green} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div
          className="relative flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full"
          style={{ border: `2.5px solid ${C.green}`, boxShadow: neonBox(C.green, 1.1) }}
          aria-hidden="true"
        >
          <span className="text-[30px] font-bold tabular-nums leading-none">
            <NeonHeading tone={C.green} strength={0.8}>
              {pct}%
            </NeonHeading>
          </span>
          <span
            className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.green }}
          >
            gedekt
          </span>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{
              color: "#fff",
              border: `1px solid ${C.green}`,
              boxShadow: neonBox(C.green, 0.6),
              textShadow: `0 0 6px ${C.green}`,
            }}
          >
            <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Elke
            geverifieerde buis licht je bord sterker op — één dossier vraagt binnenkort om
            vernieuwing.
          </p>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel glow={st.tone} className="flex items-center gap-4 p-4">
                <NeonBadgeRing color={st.tone} size={44}>
                  <st.Icon size={18} strokeWidth={2.4} />
                </NeonBadgeRing>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14.5px] font-semibold leading-tight"
                    style={{ color: C.fg }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <NeonChip tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </NeonChip>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <SectionKop sub="De volgende beste stap" tone={C.amber}>
        Volgende acties
      </SectionKop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.red : C.cyan;
          return (
            <li key={a.titel}>
              <Panel glow={tone} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <NeonBadgeRing color={tone} size={44}>
                  <span
                    className="text-[16px] font-bold tabular-nums"
                    style={{ ...display, color: tone }}
                  >
                    {i + 1}
                  </span>
                </NeonBadgeRing>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone, filter: `drop-shadow(0 0 4px ${tone})` }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Zap
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone, filter: `drop-shadow(0 0 4px ${tone})` }}
                        aria-hidden="true"
                      />
                    )}
                    <h3 className="text-[16px] font-semibold leading-tight" style={{ color: C.fg }}>
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{
                    background: tone,
                    color: "#12060d",
                    boxShadow: neonBox(tone, 0.8, false),
                  }}
                >
                  {a.cta}
                </button>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.red;
    if (status === "Concept") return C.fgFaint;
    return C.amber;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionKop sub="Omzet" tone={C.magenta}>
          Facturen
        </SectionKop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
          style={{
            background: C.magenta,
            color: "#12060d",
            boxShadow: neonBox(C.magenta, 0.85, false),
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.fgFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-4 py-3.5 text-[12px] tabular-nums" style={{ color: C.fgSoft }}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13.5px]" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3.5 text-[12px] tabular-nums" style={{ color: C.fgSoft }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <NeonChip tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone, boxShadow: neonBox(tone, 0.5, false) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </NeonChip>
                  </td>
                  <td className="px-4 py-3.5 text-right text-[14px] font-bold tabular-nums">
                    <NeonHeading tone={C.fg} strength={0.25}>
                      {f.bedrag}
                    </NeonHeading>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.line}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td className="px-4 py-4 text-right text-[18px] font-bold tabular-nums">
                <NeonHeading tone={C.green} strength={0.6}>
                  {total}
                </NeonHeading>
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>
    </div>
  );
}
