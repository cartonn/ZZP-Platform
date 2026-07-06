"use client";

// Concept 119 — "Emaille" · Cloisonné geëmailleerde badges.
// Zachte lichte, koele achtergrond (#f0f1ee) waarop kern-elementen verschijnen als
// glanzende vitreus-emaille badges: afgeronde vormen met een dunne messing CLOISON-rand
// (goud/messing hairline) die kleurvlakken scheidt, felle glazuurkleuren en een subtiele
// witte specular-glans bovenin (= geglazuurd/geëmailleerd oppervlak). Verificatie-status
// als geëmailleerd keurmerk-schildje. Onderscheidend van iriserend (Parel), mat clay (Klei)
// en neumorfisme (Reliëf): dit zijn GLANZENDE VITREUS-EMAILLE badges met MESSING randen.
// Fonts: Sora (display, rond-vriendelijk) + Inter (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Sparkles,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
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

// Vitreus-emaille palet: felle glazuurkleuren + messing cloison-hairline.
const C = {
  bg: "#f0f1ee", // licht koel porselein
  bgDeep: "#e6e8e3",
  panel: "#f8f8f5", // emaille-wit veld
  ink: "#26332f", // diep groen-grijze inkt
  inkSoft: "#4b5a54",
  muted: "#8a978f",
  brass: "#b08d57", // messing cloison
  brassDeep: "#8a6a3a",
  blue: "#1f6f9c", // email-blauw
  red: "#c8322b", // email-rood
  green: "#2f7d54", // email-groen
  yellow: "#e6a417", // email-geel
  line: "rgba(38,51,47,0.10)",
  lineStrong: "rgba(38,51,47,0.18)",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Vitreus specular-glans: witte gradient bovenin = geglazuurd oppervlak.
const gloss =
  "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0) 62%)";

// Zachte porselein-achtergrond met heel subtiele glazuur-vlekken.
const bgSurface =
  "radial-gradient(90% 70% at 8% 0%, rgba(31,111,156,0.05), transparent 55%)," +
  "radial-gradient(80% 70% at 100% 12%, rgba(230,164,23,0.06), transparent 55%)," +
  "radial-gradient(90% 90% at 50% 100%, rgba(47,125,84,0.04), transparent 60%)";

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.blue };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.yellow };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Geëmailleerd veld met messing cloison-rand en glossy specular-glans.
function Enamel({
  children,
  className = "",
  fill = C.panel,
  ink,
  ring = C.brass,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  fill?: string;
  ink?: string;
  ring?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: fill,
        color: ink,
        border: `1px solid ${ring}`,
        boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,0.5), 0 6px 18px -10px rgba(38,51,47,0.35)`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ backgroundImage: gloss }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// Kleine geëmailleerde pil-badge (status/label) met messing hairline.
function Pill({
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
      className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={
        solid
          ? { background: tone, color: "#fff", border: `1px solid ${C.brass}` }
          : { background: "rgba(255,255,255,0.7)", color: tone, border: `1px solid ${tone}` }
      }
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)" }}
      />
      <span className="relative inline-flex items-center gap-1.5">{children}</span>
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline points={`0,100 ${pts.join(" ")} 100,100`} fill={tone} opacity={0.1} stroke="none" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Sectiekop met messing cloison-lijntje.
function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: C.brassDeep }}
        >
          {sub}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h2
          className="text-[24px] font-semibold leading-none tracking-[-0.01em] sm:text-[28px]"
          style={{ ...display, color: C.ink }}
        >
          {children}
        </h2>
        <span
          className="h-px flex-1"
          style={{ background: C.brass, opacity: 0.5 }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function Concept119() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: bgSurface, color: C.ink }}
    >
      {/* Kop — geëmailleerd logo-schildje */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: C.blue, color: "#fff", border: `1px solid ${C.brass}` }}
            aria-hidden="true"
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }}
            />
            <Sparkles size={20} strokeWidth={2} className="relative" />
          </span>
          <div className="leading-none">
            <div
              className="text-[19px] font-semibold tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Emaille
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.26em]"
              style={{ color: C.muted }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl text-[13px] font-semibold"
            style={{ background: C.yellow, color: "#3a2a06", border: `1px solid ${C.brass}` }}
            aria-hidden="true"
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }}
            />
            <span className="relative">{PROFIEL.initialen}</span>
          </span>
        </div>
      </header>

      {/* Navigatie — geëmailleerde tab-strip */}
      <nav className="mx-auto mt-6 max-w-5xl px-5 md:px-10" aria-label="Hoofdnavigatie">
        <div
          className="flex items-center gap-1 overflow-x-auto rounded-full p-1"
          style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 overflow-hidden rounded-full px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.blue, color: "#fff", border: `1px solid ${C.brass}` }
                    : { color: C.inkSoft }
                }
              >
                {on && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-full"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.45), transparent)",
                    }}
                  />
                )}
                <span className="relative">{s.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
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
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.blue, C.green, C.yellow, C.red];
  return (
    <div className="space-y-10">
      {/* Groet */}
      <section>
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: C.brassDeep }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[38px]"
          style={{ ...display, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles glanst. Eén badge vraagt vandaag je aandacht — de rest staat vast ingebrand.
        </p>
      </section>

      {/* Primaire actie — email-rood veld */}
      <Enamel fill={C.red} ink="#fff" ring={C.brass} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[22px] font-semibold leading-tight sm:text-[26px]"
              style={display}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/85">
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group relative inline-flex shrink-0 items-center gap-2.5 overflow-hidden rounded-full px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
            style={{ background: "#fff", color: C.red, border: `1px solid ${C.brass}` }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.7), transparent)" }}
            />
            <span className="relative inline-flex items-center gap-2.5">
              {primair.cta}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </button>
        </div>
      </Enamel>

      {/* KPI-badges */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Enamel key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: tone, border: `1px solid ${C.brass}` }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: k.up ? C.green : C.red }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Enamel>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Kop sub="Beste match">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Enamel interactive className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl"
              style={{ background: C.green, color: "#fff", border: `1px solid ${C.brass}` }}
              aria-hidden="true"
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)",
                }}
              />
              <span
                className="relative text-[26px] font-semibold tabular-nums leading-none"
                style={display}
              >
                {top.match}
              </span>
              <span className="relative text-[9px] font-semibold uppercase tracking-[0.16em]">
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[19px] font-semibold leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t} tone={C.blue}>
                    {t}
                  </Pill>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.green }}
              aria-hidden="true"
            />
          </Enamel>
        </button>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: C.green }}
        />
      </div>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.green }}>
        {value}%
      </span>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-7">
      <Kop sub="Open opdrachten">Marktplaats</Kop>

      <Enamel className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ color: C.muted }}
        >
          {filtered.length}
        </span>
      </Enamel>

      {filtered.length === 0 ? (
        <Enamel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.blue, color: "#fff", border: `1px solid ${C.brass}` }}
          >
            Zoekopdracht wissen
          </button>
        </Enamel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Enamel interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[17px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Pill key={t} tone={C.blue}>
                          {t}
                        </Pill>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MatchMeter value={o.match} />
                    <ArrowRight
                      size={19}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.green }}
                      aria-hidden="true"
                    />
                  </div>
                </Enamel>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-medium transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.muted }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.green} solid>
            {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="mt-3 text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[36px]"
          style={{ ...display, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Enamel key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.brassDeep }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </div>
          </Enamel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Enamel className="p-5" ring={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.green, color: "#fff", border: `1px solid ${C.brass}` }}
                  aria-hidden="true"
                >
                  <Check size={12} strokeWidth={2.8} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Enamel>
        <Enamel className="p-5" ring={C.yellow}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.yellow }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.yellow, color: "#3a2a06", border: `1px solid ${C.brass}` }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={11} strokeWidth={2.8} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Enamel>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group relative inline-flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.blue, color: "#fff", border: `1px solid ${C.brass}` }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)" }}
          />
          <span className="relative inline-flex items-center gap-2.5">
            Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
          </span>
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            border: `1px solid ${C.brass}`,
            color: C.ink,
            background: "rgba(255,255,255,0.5)",
          }}
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
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Geëmailleerd keurmerk-schildje */}
      <Enamel
        fill={C.blue}
        ink="#fff"
        ring={C.brass}
        className="flex flex-col items-center gap-6 p-6 sm:flex-row"
      >
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.yellow}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[24px] font-semibold tabular-nums leading-none" style={display}>
              {pct}%
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80">
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(255,255,255,0.16)" }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/90">
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén dossier
            vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Enamel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Enamel className="flex items-center gap-4 p-4">
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                  style={{ background: st.tone, color: "#fff", border: `1px solid ${C.brass}` }}
                  aria-hidden="true"
                >
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)",
                    }}
                  />
                  <st.Icon size={18} strokeWidth={2.4} className="relative" />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Enamel>
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
      <Kop sub="De volgende beste stap">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.yellow : C.blue;
          return (
            <li key={a.titel}>
              <Enamel
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                ring={warn ? C.yellow : C.brass}
              >
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[16px] font-semibold tabular-nums"
                  style={{
                    background: tone,
                    color: warn ? "#3a2a06" : "#fff",
                    border: `1px solid ${C.brass}`,
                  }}
                  aria-hidden="true"
                >
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)",
                    }}
                  />
                  <span className="relative" style={display}>
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: C.yellow }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: C.blue }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="relative shrink-0 self-start overflow-hidden rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{
                    background: tone,
                    color: warn ? "#3a2a06" : "#fff",
                    border: `1px solid ${C.brass}`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)",
                    }}
                  />
                  <span className="relative">{a.cta}</span>
                </button>
              </Enamel>
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
    if (status === "Openstaand") return C.yellow;
    if (status === "Concept") return C.muted;
    return C.blue;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.blue, color: "#fff", border: `1px solid ${C.brass}` }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)" }}
          />
          <span className="relative inline-flex items-center gap-2">
            <Plus size={15} aria-hidden="true" /> Nieuwe factuur
          </span>
        </button>
      </div>

      <Enamel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.muted }}
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
                  className="transition-colors hover:bg-white/50"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Pill tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Pill>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-semibold tabular-nums"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-semibold tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Enamel>
    </div>
  );
}
