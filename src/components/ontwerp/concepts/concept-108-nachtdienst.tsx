"use client";

// Concept 108 — "Nachtdienst" · Nacht-modus voor avond- en nachtdiensten in de zorg.
// Veel ZZP'ers in de zorg werken 's avonds en 's nachts. Deze interface ontziet de ogen:
// gedimd, blauwlicht-arm, comfortabel in het donker. Warm antraciet/houtskool oppervlak,
// een gedimd amber/perzik-accent op lage lichtsterkte, zachte gloed en extra-hoog leesbaar
// contrast — maar nooit fel. Onderscheidend van koele/neon donkere concepten: dit is WARM.
// Fonts: Manrope (UI) + Spline Sans Mono (cijfers/tabular).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Moon,
  Sunrise,
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  CalendarDays,
  Banknote,
  Bell,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
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

// Warme antraciet/houtskool met gedimd amber/perzik. Lage lichtsterkte, hoog leesbaar.
const C = {
  bg: "#171310", // warm houtskool
  bgUp: "#1f1a15", // iets opgelicht paneel
  bgCard: "#221c16", // kaart
  bgCardUp: "#2a2219", // hover / nested
  line: "rgba(214,180,130,0.14)", // warme hairline
  lineSoft: "rgba(214,180,130,0.08)",
  text: "#f0e6d6", // warm ivoor (hoofdtekst, hoog contrast)
  textSoft: "#cdbfa8", // zachter
  muted: "#9c8f79", // gedempt
  faint: "#6f6555", // zeer gedempt
  amber: "#e0a86a", // gedimd amber-accent (nooit fel)
  amberDeep: "#c98a4a",
  amberSoft: "#f0c48f",
  amberWash: "rgba(224,168,106,0.12)",
  amberGlow: "rgba(224,168,106,0.22)",
  ok: "#8fbf87", // gedimd salie-groen
  okWash: "rgba(143,191,135,0.13)",
  warn: "#e0a86a",
  warnWash: "rgba(224,168,106,0.13)",
  danger: "#d98a76", // gedimd terracotta
  dangerWash: "rgba(217,138,118,0.13)",
};

const ui = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Zachte warme gloed als paneel-achtergrond (blauwlicht-arm).
const nightSurface: React.CSSProperties = {
  background: `
    radial-gradient(80% 60% at 82% -6%, rgba(224,168,106,0.10) 0%, rgba(224,168,106,0) 46%),
    radial-gradient(70% 50% at 8% 104%, rgba(201,138,74,0.08) 0%, rgba(201,138,74,0) 50%),
    ${C.bg}`,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  fg: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, fg: C.ok, wash: C.okWash };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.amber, wash: C.amberWash };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, fg: C.warn, wash: C.warnWash };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, fg: C.danger, wash: C.dangerWash };
  }
}

// Kleine label-kop.
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.26em]"
      style={{ color: C.amber }}
    >
      <Moon size={12} aria-hidden="true" /> {children}
    </span>
  );
}

// Herbruikbaar donker paneel met zachte warme rand.
function Card({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl p-5 md:p-6 ${className}`}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.line}`,
        boxShadow: glow ? `0 0 0 1px ${C.amberWash}, 0 8px 30px -12px ${C.amberGlow}` : "none",
      }}
    >
      {children}
    </section>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `nd-grad-${points.join("-")}`;
  const [lastX, lastY] = pts[pts.length - 1] ?? [w, h];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.amber} stopOpacity={0.28} />
          <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={C.amber}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2.4} fill={C.amberSoft} />
    </svg>
  );
}

function MatchRing({ value, size = 46 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.lineSoft} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.amber}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute text-[11px] font-semibold tabular-nums"
        style={{ ...mono, color: C.amberSoft }}
      >
        {value}
      </span>
    </span>
  );
}

// Herkent avond-/nachtdienst-opdrachten voor de nachtdienst-context.
function isNightShift(o: Opdracht): boolean {
  return (
    o.titel.toLowerCase().includes("avond") ||
    o.titel.toLowerCase().includes("nacht") ||
    o.tags.some((t) => /avond|nacht/i.test(t))
  );
}

function NightTag() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: C.amberWash, color: C.amber, boxShadow: `0 0 12px -4px ${C.amberGlow}` }}
    >
      <Moon size={11} aria-hidden="true" /> Avond/nacht
    </span>
  );
}

export function Concept108() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, ...nightSurface, color: C.text }}
    >
      {/* Kop met nachtdienst-context */}
      <header
        className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 md:px-8"
        style={{ borderColor: C.line }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: C.amberWash, boxShadow: `0 0 18px -6px ${C.amberGlow}` }}
            aria-hidden="true"
          >
            <Moon size={19} style={{ color: C.amber }} />
          </span>
          <div className="leading-tight">
            <span className="block text-[16px] font-bold tracking-[-0.01em]">Nachtdienst</span>
            <span
              className="block text-[10.5px] uppercase tracking-[0.24em]"
              style={{ color: C.muted }}
            >
              Nacht-modus · oogvriendelijk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.okWash, color: C.ok }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              border: `1px solid ${C.line}`,
              color: C.textSoft,
              ["--h" as string]: C.bgCardUp,
            }}
            aria-label="Meldingen"
          >
            <Bell size={16} aria-hidden="true" />
            <span
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
              style={{ background: C.amber }}
              aria-hidden="true"
            />
          </button>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: C.bgCardUp, border: `1px solid ${C.line}`, color: C.amberSoft }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-b px-3 md:px-6"
        style={{ borderColor: C.line }}
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{ color: on ? C.text : C.muted, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-3 -bottom-px h-[2px] rounded-full"
                  style={{ background: C.amber, boxShadow: `0 0 10px 0 ${C.amberGlow}` }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
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
  const nachtOpdrachten = OPDRACHTEN.filter(isNightShift);
  const top = (nachtOpdrachten[0] ?? OPDRACHTEN[0]) as Opdracht;
  const naam = PROFIEL.naam.split(" ")[0];
  return (
    <div className="space-y-6">
      {/* Begroeting afgestemd op de nachtdienst */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card glow>
          <Eyebrow>Goedenavond</Eyebrow>
          <h1 className="mt-3 text-[28px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[34px]">
            Fijne dienst, {naam}.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
            De weergave is gedimd en blauwlicht-arm, afgestemd op werken in het donker. Alles is
            rustig — één ding vraagt vanavond je aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={{ background: C.bgUp, border: `1px solid ${C.line}`, color: C.textSoft }}
            >
              <MapPin size={13} aria-hidden="true" style={{ color: C.amber }} /> {PROFIEL.plaats}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={{ background: C.bgUp, border: `1px solid ${C.line}`, color: C.textSoft }}
            >
              <Moon size={13} aria-hidden="true" style={{ color: C.amber }} />{" "}
              {nachtOpdrachten.length} avonddiensten open
            </span>
          </div>
        </Card>

        {/* Voornaamste actie */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: C.warnWash }}
                aria-hidden="true"
              >
                <AlertTriangle size={16} style={{ color: C.warn }} />
              </span>
              <Eyebrow>Nu belangrijk</Eyebrow>
            </div>
            <h2 className="mt-3 text-[17px] font-bold leading-snug">{primair.titel}</h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-bold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
            style={{
              background: C.amber,
              color: C.bg,
              boxShadow: `0 6px 22px -8px ${C.amberGlow}`,
            }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </Card>
      </div>

      {/* KPI-tegels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label}>
            <p
              className="text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {k.label}
            </p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p
                className="text-[26px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                style={mono}
              >
                {k.value}
              </p>
              <Sparkline points={k.spark} />
            </div>
            <p
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums"
              style={{ ...mono, color: k.up ? C.ok : C.warn }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </p>
          </Card>
        ))}
      </div>

      {/* Top-match avonddienst */}
      <Card glow>
        <div className="flex items-center justify-between">
          <Eyebrow>Uitgelichte avonddienst</Eyebrow>
          {isNightShift(top) && <NightTag />}
        </div>
        <button
          onClick={onOpen}
          className="group mt-4 flex w-full flex-col gap-4 rounded-xl p-4 text-left transition-colors hover:bg-[color:var(--h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:flex-row sm:items-center sm:justify-between"
          style={{ border: `1px solid ${C.lineSoft}`, ["--h" as string]: C.bgCardUp }}
        >
          <div className="flex items-center gap-4">
            <MatchRing value={top.match} size={52} />
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold leading-snug">{top.titel}</h3>
              <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </p>
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
            style={{ color: C.amber }}
          >
            Bekijken <ChevronRight size={16} aria-hidden="true" />
          </span>
        </button>
      </Card>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [nachtOnly, setNachtOnly] = useState(false);
  const filtered = OPDRACHTEN.filter((o) => {
    const match =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    return match && (!nachtOnly || isNightShift(o));
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Marktplaats</Eyebrow>
          <h1 className="mt-3 text-[28px] font-bold leading-none tracking-[-0.02em]">
            Open opdrachten
          </h1>
        </div>
        <span className="text-[13px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-3 rounded-xl px-4 py-2.5"
          style={{ background: C.bgCard, border: `1px solid ${C.line}` }}
        >
          <Moon size={16} aria-hidden="true" style={{ color: C.amber }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#6f6555]"
            style={{ color: C.text }}
          />
        </div>
        <button
          onClick={() => setNachtOnly((v) => !v)}
          aria-pressed={nachtOnly}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={
            nachtOnly
              ? { background: C.amberWash, color: C.amber, border: `1px solid ${C.amber}` }
              : { background: C.bgCard, color: C.textSoft, border: `1px solid ${C.line}` }
          }
        >
          <Moon size={14} aria-hidden="true" /> Alleen avond/nacht
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Moon size={30} aria-hidden="true" style={{ color: C.faint }} className="mx-auto" />
          <p className="mt-4 text-[18px] font-bold">Geen opdrachten gevonden</p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen resultaat voor deze filters. Verruim je zoekopdracht of schakel het avondfilter
            uit.
          </p>
          <button
            onClick={() => {
              setQ("");
              setNachtOnly(false);
            }}
            className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
            style={{ color: C.amber }}
          >
            Filters wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </Card>
      ) : (
        <ul className="space-y-3.5">
          {filtered.map((o) => (
            <li key={o.id}>
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[18px] font-bold leading-snug">{o.titel}</h2>
                      {isNightShift(o) && <NightTag />}
                    </div>
                    <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div
                      className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]"
                      style={{ color: C.textSoft }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Banknote size={14} aria-hidden="true" style={{ color: C.amber }} />{" "}
                        {o.tarief}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} aria-hidden="true" style={{ color: C.amber }} /> {o.uren}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} aria-hidden="true" style={{ color: C.amber }} />{" "}
                        {o.start}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: C.bgUp,
                            border: `1px solid ${C.lineSoft}`,
                            color: C.textSoft,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onOpen}
                    className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
                    style={{ background: C.amber, color: C.bg }}
                    aria-label={`Bekijk ${o.titel}`}
                  >
                    Bekijken <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const meta = [
    { l: "Tarief", v: opdracht.tarief, Icon: Banknote },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Match", v: `${opdracht.match}%`, Icon: Sparkles },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-medium transition-colors hover:text-[color:var(--t)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ color: C.muted, ["--t" as string]: C.text }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar de marktplaats
      </button>

      <Card glow>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Eyebrow>{opdracht.id}</Eyebrow>
              {isNightShift(opdracht) && <NightTag />}
            </div>
            <h1 className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[32px]">
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={60} />
        </div>
        <button
          className="mt-5 inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-[14px] font-bold transition-transform hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
          style={{ background: C.amber, color: C.bg, boxShadow: `0 6px 22px -8px ${C.amberGlow}` }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {meta.map((m) => (
          <Card key={m.l}>
            <m.Icon size={16} aria-hidden="true" style={{ color: C.amber }} />
            <p className="mt-3 text-[21px] font-bold tabular-nums tracking-[-0.01em]" style={mono}>
              {m.v}
            </p>
            <p
              className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p
            className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.ok }}
          >
            <Check size={15} aria-hidden="true" /> Waarom dit past
          </p>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.textSoft }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.okWash }}
                  aria-hidden="true"
                >
                  <Check size={12} style={{ color: C.ok }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p
            className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.warn }}
          >
            <AlertTriangle size={15} aria-hidden="true" /> Om rekening mee te houden
          </p>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.muted }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.warnWash }}
                  aria-hidden="true"
                >
                  <Minus size={12} style={{ color: C.warn }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <Eyebrow>Waarom deze match</Eyebrow>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
          De match is opgebouwd uit je geverifieerde profiel — altijd de pluspunten én de
          aandachtspunten, zonder verborgen score. Elke reden is naspeurbaar.
        </p>
      </Card>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[2]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Card>
          <Eyebrow>Vertrouwen</Eyebrow>
          <h1 className="mt-3 text-[26px] font-bold leading-none tracking-[-0.02em]">
            Verificatie
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.textSoft }}>
            <span className="font-bold" style={{ color: C.ok }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén vraagt
            binnenkort actie.
          </p>
        </Card>
        <Card glow>
          <div className="flex items-center justify-between">
            <span
              className="text-[12px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              Geverifieerd
            </span>
            <span className="text-[15px] font-bold tabular-nums" style={{ ...mono, color: C.text }}>
              {verified}/{CREDENTIALS.length}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: C.bgUp }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(verified / CREDENTIALS.length) * 100}%`,
                background: `linear-gradient(90deg, ${C.amberDeep}, ${C.amberSoft})`,
                boxShadow: `0 0 12px 0 ${C.amberGlow}`,
              }}
            />
          </div>
          <p className="mt-3 text-[12.5px]" style={{ color: C.muted }}>
            Een volledig geverifieerd profiel vergroot je kans op een uitnodiging aanzienlijk.
          </p>
        </Card>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card className="overflow-hidden !p-0">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--h)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--h" as string]: C.bgCardUp }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: st.wash }}
                    aria-hidden="true"
                  >
                    <st.Icon size={18} style={{ color: st.fg }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-snug">{c.naam}</span>
                    <span
                      className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-semibold"
                      style={{ color: st.fg }}
                    >
                      <st.Icon size={12} aria-hidden="true" /> {st.label}
                    </span>
                  </span>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none"
                    style={{
                      border: `1px solid ${C.line}`,
                      color: C.textSoft,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={14} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="mx-4 mb-4 rounded-xl p-4"
                      style={{ background: C.bgUp, border: `1px solid ${C.lineSoft}` }}
                    >
                      <p className="text-[13.5px] leading-relaxed" style={{ color: C.textSoft }}>
                        {c.detail}
                      </p>
                      {c.status === "EXPIRING" && (
                        <button
                          className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
                          style={{ background: C.amber, color: C.bg }}
                        >
                          VOG vernieuwen <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      )}
                      {c.status === "SUBMITTED" && (
                        <p
                          className="mt-2 inline-flex items-center gap-1.5 text-[12px]"
                          style={{ color: C.amber }}
                        >
                          <Clock size={13} aria-hidden="true" /> Een beoordelaar bekijkt je
                          document.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Volgende acties</Eyebrow>
        <h1 className="mt-3 text-[28px] font-bold leading-none tracking-[-0.02em]">Wat nu telt</h1>
      </div>
      <ol className="space-y-3">
        {ordered.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card glow={warn}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      background: warn ? C.warnWash : C.bgUp,
                      color: warn ? C.warn : C.textSoft,
                      border: `1px solid ${warn ? C.amber : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[17px] font-bold leading-snug">{a.titel}</h2>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          background: warn ? C.warnWash : C.okWash,
                          color: warn ? C.warn : C.ok,
                        }}
                      >
                        {warn ? (
                          <AlertTriangle size={12} aria-hidden="true" />
                        ) : (
                          <Check size={12} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Ter info"}
                      </span>
                    </div>
                    <p
                      className="mt-2 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
                    style={
                      warn
                        ? { background: C.amber, color: C.bg }
                        : { background: C.bgUp, color: C.text, border: `1px solid ${C.line}` }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald");
  const totaal = "€ 8.622";
  const statusStyle = (s: string): { fg: string; wash: string; Icon: LucideIcon } => {
    if (s === "Betaald") return { fg: C.ok, wash: C.okWash, Icon: Check };
    if (s === "Openstaand") return { fg: C.warn, wash: C.warnWash, Icon: Clock };
    return { fg: C.muted, wash: C.lineSoft, Icon: Minus };
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Omzet</Eyebrow>
          <h1 className="mt-3 text-[28px] font-bold leading-none tracking-[-0.02em]">Facturen</h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
          style={{ background: C.amber, color: C.bg }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ color: C.muted }}
          >
            Betaald
          </p>
          <p className="mt-2 text-[22px] font-bold tabular-nums" style={{ ...mono, color: C.ok }}>
            {totaal}
          </p>
        </Card>
        <Card>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ color: C.muted }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] font-bold tabular-nums" style={{ ...mono, color: C.warn }}>
            € 1.350
          </p>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ color: C.muted }}
          >
            Betaald / totaal
          </p>
          <p className="mt-2 text-[22px] font-bold tabular-nums" style={mono}>
            {betaald.length}/{FACTUREN.length}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                    style={{ color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const ss = statusStyle(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[color:var(--h)]"
                    style={{
                      borderBottom: `1px solid ${C.lineSoft}`,
                      ["--h" as string]: C.bgCardUp,
                    }}
                  >
                    <td className="px-4 py-3.5 tabular-nums" style={{ ...mono, color: C.muted }}>
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 font-semibold" style={{ color: C.text }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums" style={{ ...mono, color: C.muted }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                        style={{ background: ss.wash, color: ss.fg }}
                      >
                        <ss.Icon size={12} aria-hidden="true" /> {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[14px] font-bold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-[12px] uppercase tracking-[0.14em]"
                  style={{ color: C.faint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-4 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.text }}
                >
                  {totaal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <p
        className="flex items-center justify-center gap-2 pt-1 text-[12px]"
        style={{ color: C.faint }}
      >
        <Sunrise size={14} aria-hidden="true" style={{ color: C.amber }} /> Overzicht bijgewerkt na
        je laatste dienst
      </p>
    </div>
  );
}
