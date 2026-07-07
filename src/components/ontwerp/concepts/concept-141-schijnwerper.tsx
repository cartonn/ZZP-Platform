"use client";

// Concept 141 — "Schijnwerper" · cinematische spotlight / aandacht-dimming (donker). Een bijna-zwart
// canvas waarop alleen de actieve module wordt verlicht door een warme radiale lichtkegel; al het
// andere zakt weg in de schaduw. Attention-routing als designprincipe: het systeem stuurt de blik
// naar wat NÚ actie vraagt. Hover verplaatst de lichtkegel over het scherm. Verklaarbare matching
// staat in het licht. Zachte vignette, warm amber-licht (#ffca6a) op koele donkere basis (#0a0a0c).
// Onderscheidend: geen wallboard/tegels, maar één belichte focus tegen gedimde context. Deterministisch
// — geen random, geen Date. Fonts: Space Grotesk (display) + Geist Mono (data).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MapPin,
  Coins,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Receipt,
  Zap,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — koele donkere basis, warme lichtkegel ───────────────────────────────
const C = {
  bg: "#0a0a0c",
  stage: "#0c0d10",
  dim: "#111318", // gedimd oppervlak (schaduw)
  lit: "#16181f", // verlicht oppervlak
  litHi: "#1c1f28",
  fg: "#f3efe6",
  fgSoft: "#a7a49c",
  fgFaint: "#6b6a66",
  fgShadow: "#4a4945", // in de schaduw weggezakte tekst
  line: "#22242c",
  lineWarm: "#3a3226",
  amber: "#ffca6a", // lichtkegel-accent
  amberDeep: "#d99b3a",
  green: "#6fd6a3",
  red: "#f08a7a",
  blue: "#8db4f0",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Status-model — nooit kleur-alleen ───────────────────────────────────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.blue };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

function matchTone(m: number): string {
  if (m >= 90) return C.green;
  if (m >= 80) return C.amber;
  return C.red;
}

// Radiale lichtkegel achter een belichte kaart.
function spotlightBg(tone: string): string {
  return `radial-gradient(120% 140% at 50% -10%, ${tone}1f 0%, ${tone}0a 32%, transparent 62%)`;
}

// ── Belichte / gedimde kaart. `lit` bepaalt of de schijnwerper erop staat. ──────
function Panel({
  children,
  lit = false,
  className = "",
  glow = C.amber,
  onFocusMe,
}: {
  children: React.ReactNode;
  lit?: boolean;
  className?: string;
  glow?: string;
  onFocusMe?: () => void;
}) {
  return (
    <div
      onMouseEnter={onFocusMe}
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${className}`}
      style={{
        background: lit ? C.lit : C.dim,
        border: `1px solid ${lit ? C.lineWarm : C.line}`,
        boxShadow: lit
          ? `0 0 0 1px ${glow}22, 0 24px 60px -24px ${glow}55, inset 0 1px 0 ${glow}18`
          : "0 12px 32px -24px rgba(0,0,0,0.8)",
        opacity: lit ? 1 : 0.62,
      }}
    >
      {lit && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: spotlightBg(glow) }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color: C.fgFaint }}
    >
      {children}
    </span>
  );
}

// Statuschip — label + icoon + vorm, nooit kleur alleen.
function Chip({
  tone,
  Icon,
  children,
}: {
  tone: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: `${tone}18`, color: tone, border: `1px solid ${tone}3a` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

// Mini-sparkline die in het licht oplicht.
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.12}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match-ring in de lichtkegel.
function MatchRing({ value, tone, size = 76 }: { value: number; tone: string; size?: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke={C.line} strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[19px] font-semibold tabular-nums" style={{ ...mono, color: C.fg }}>
          {value}
        </span>
        <span
          className="text-[8px] uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.fgFaint }}
        >
          match
        </span>
      </div>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────────
export function Concept141() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden antialiased"
      style={{ ...display, background: C.bg, color: C.fg }}
    >
      {/* Vignette — randen zakken weg in het donker */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(255,202,106,0.05), transparent 55%)," +
            "radial-gradient(100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1180px] px-4 py-5 md:px-8 md:py-8">
        {/* Kop */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: `${C.amber}1a`,
                border: `1px solid ${C.amber}44`,
                boxShadow: `0 0 24px -6px ${C.amber}88`,
              }}
              aria-hidden="true"
            >
              <Zap size={18} strokeWidth={2.2} style={{ color: C.amber }} />
            </span>
            <div className="leading-none">
              <div className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: C.fg }}>
                Schijnwerper
              </div>
              <div className="mt-1.5 text-[11px]" style={{ color: C.fgFaint }}>
                {PROFIEL.naam} · {PROFIEL.rol}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Chip tone={C.green} Icon={ShieldCheck}>
              {PROFIEL.trust}
            </Chip>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ background: C.litHi, border: `1px solid ${C.lineWarm}`, color: C.amber }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Scherm-selector — de "belichtings"-schakelaar */}
        <nav className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Schermen">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: on ? C.bg : C.fgSoft,
                  background: on ? C.amber : "transparent",
                  border: `1px solid ${on ? C.amber : C.line}`,
                  boxShadow: on ? `0 0 22px -6px ${C.amber}` : "none",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="mt-6">
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

// ── Dashboard — één belichte focus, rest gedimd. Hover verplaatst het licht. ────
function Dashboard({ onOpen }: { onOpen: () => void }) {
  // Welke module staat in de schijnwerper. Standaard de urgente actie (#0).
  const [focus, setFocus] = useState(0);
  const urgent = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={14} style={{ color: C.amber }} aria-hidden="true" />
        <Kicker>Aandacht gaat naar wat nu telt · beweeg om te verlichten</Kicker>
      </div>

      {/* Grote focus-actie */}
      <Panel lit={focus === 0} onFocusMe={() => setFocus(0)} className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Chip tone={C.amber} Icon={AlertTriangle}>
                Prioriteit
              </Chip>
              <Kicker>Volgende beste actie</Kicker>
            </div>
            <h2
              className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[26px]"
              style={{ color: focus === 0 ? C.fg : C.fgShadow }}
            >
              {urgent.titel}
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              {urgent.detail}
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.amber, color: C.bg, boxShadow: `0 0 26px -8px ${C.amber}` }}
          >
            {urgent.cta} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Panel>

      {/* KPI-strip — subtiel, licht op bij hover */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const lit = focus === 10 + i;
          const tone = k.up ? C.green : C.amber;
          return (
            <Panel
              key={k.label}
              lit={lit}
              onFocusMe={() => setFocus(10 + i)}
              glow={tone}
              className="p-4"
            >
              <div className="text-[11px]" style={{ color: C.fgFaint }}>
                {k.label}
              </div>
              <div
                className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={{ ...mono, color: lit ? C.fg : C.fgShadow }}
              >
                {k.value}
              </div>
              <div className="mt-2.5">
                <Spark data={k.spark} tone={tone} />
              </div>
              <div
                className="mt-1 text-[11px] font-medium tabular-nums"
                style={{ ...mono, color: tone }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Twee kolommen: top-match + verificatie-dekking */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel lit={focus === 20} onFocusMe={() => setFocus(20)} className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <Kicker>Beste match voor jou</Kicker>
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-1 rounded text-[12px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.amber }}
            >
              Bekijk opdracht <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-5">
            <MatchRing value={top.match} tone={matchTone(top.match)} />
            <div className="min-w-0">
              <h3
                className="truncate text-[17px] font-semibold"
                style={{ color: focus === 20 ? C.fg : C.fgShadow }}
              >
                {top.titel}
              </h3>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </p>
              <ul className="mt-3 space-y-1.5">
                {top.redenen.plus.slice(0, 3).map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.fgSoft }}
                  >
                    <Check
                      size={14}
                      strokeWidth={2.6}
                      className="mt-0.5 shrink-0"
                      style={{ color: C.green }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel
          lit={focus === 21}
          onFocusMe={() => setFocus(21)}
          glow={dek >= 80 ? C.green : C.amber}
          className="p-5"
        >
          <Kicker>Verificatie-dekking</Kicker>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: dek >= 80 ? C.green : C.amber }}
            >
              {dek}%
            </span>
            <span className="text-[12px]" style={{ color: C.fgFaint }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </span>
          </div>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ background: C.line }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${dek}%`, background: dek >= 80 ? C.green : C.amber }}
            />
          </div>
          <ul className="mt-4 space-y-2">
            {CREDENTIALS.slice(0, 3).map((c) => {
              const m = credMeta(c.status);
              return (
                <li key={c.naam} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="truncate" style={{ color: C.fgSoft }}>
                    {c.naam}
                  </span>
                  <m.Icon
                    size={13}
                    strokeWidth={2.4}
                    style={{ color: m.tone }}
                    aria-hidden="true"
                  />
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ── Marktplaats — lijst; de gehoverde rij komt in het licht ─────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(0);
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Marktplaats</h2>
          <Kicker>{filtered.length} opdrachten in beeld</Kicker>
        </div>
        <label
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: C.lit, border: `1px solid ${C.line}` }}
        >
          <Search size={15} style={{ color: C.fgFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-48 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ color: C.fg }}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <Panel lit className="flex flex-col items-center gap-3 p-14 text-center">
          <Search size={22} style={{ color: C.fgFaint }} aria-hidden="true" />
          <p className="text-[15px] font-semibold">Geen opdrachten gevonden</p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Geen resultaat voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-xl px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.amber, color: C.bg }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((o, i) => {
            const lit = focus === i;
            const tone = matchTone(o.match);
            return (
              <Panel
                key={o.id}
                lit={lit}
                onFocusMe={() => setFocus(i)}
                glow={tone}
                className="p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <MatchRing value={o.match} tone={tone} size={64} />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[16px] font-semibold"
                      style={{ color: lit ? C.fg : C.fgShadow }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                          style={{
                            background: C.litHi,
                            color: C.fgSoft,
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {lit && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1.5 text-[11.5px]"
                            style={{ color: C.green }}
                          >
                            <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                          </span>
                        ))}
                        {o.redenen.min.slice(0, 1).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1.5 text-[11.5px]"
                            style={{ color: C.amber }}
                          >
                            <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onOpen}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                    style={
                      lit
                        ? { background: C.amber, color: C.bg }
                        : { background: C.litHi, color: C.fgSoft, border: `1px solid ${C.line}` }
                    }
                  >
                    Bekijk <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  const tone = matchTone(opdracht.match);
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded text-[12px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel lit glow={tone} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Kicker>{opdracht.id}</Kicker>
              <Chip tone={tone} Icon={Sparkles}>
                Match {opdracht.match}%
              </Chip>
            </div>
            <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[13.5px]" style={{ color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} tone={tone} size={92} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} lit className="p-4">
            <m.Icon size={16} style={{ color: C.amber }} aria-hidden="true" />
            <div
              className="mt-2 text-[16px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[10px] uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel lit glow={C.green} className="p-5">
          <div className="flex items-center gap-2">
            <Check size={15} strokeWidth={2.6} style={{ color: C.green }} aria-hidden="true" />
            <Kicker>Waarom dit past</Kicker>
          </div>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel lit={false} glow={C.amber} className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={15}
              strokeWidth={2.6}
              style={{ color: C.amber }}
              aria-hidden="true"
            />
            <Kicker>Aandachtspunten</Kicker>
          </div>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                style={{ color: C.fgSoft }}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[13.5px] font-semibold transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.amber, color: C.bg, boxShadow: `0 0 26px -8px ${C.amber}` }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1px solid ${C.lineWarm}`, color: C.fg, background: C.dim }}
        >
          Bewaren
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────
function Verificatie() {
  const [focus, setFocus] = useState(-1);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: C.amber }} aria-hidden="true" />
        <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
          Verificatie &amp; certificaten
        </h2>
      </div>

      <Panel lit glow={pct >= 80 ? C.green : C.amber} className="mb-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Kicker>Vertrouwensniveau</Kicker>
            <div className="mt-1.5 text-[15px] font-semibold" style={{ color: C.green }}>
              {PROFIEL.trust} · {pct}% dekking
            </div>
          </div>
          <div className="flex gap-4">
            {(["VERIFIED", "SUBMITTED", "EXPIRING"] as CredStatus[]).map((st) => {
              const n = CREDENTIALS.filter((c) => c.status === st).length;
              const m = credMeta(st);
              return (
                <div key={st} className="text-center">
                  <div
                    className="text-[20px] font-semibold tabular-nums"
                    style={{ ...mono, color: m.tone }}
                  >
                    {n}
                  </div>
                  <div className="text-[10px]" style={{ color: C.fgFaint }}>
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <div className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const lit = focus === i;
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel
              key={c.naam}
              lit={lit}
              onFocusMe={() => setFocus(i)}
              glow={m.tone}
              className="p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: `${m.tone}18`,
                    border: `1px solid ${m.tone}3a`,
                    color: m.tone,
                  }}
                  aria-hidden="true"
                >
                  <m.Icon size={17} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14.5px] font-semibold"
                    style={{ color: lit ? C.fg : C.fgShadow }}
                  >
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Chip tone={m.tone} Icon={m.Icon}>
                  {m.label}
                </Chip>
                <button
                  disabled={!actionable}
                  className="rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  style={
                    actionable
                      ? { background: C.amber, color: C.bg }
                      : { background: C.litHi, color: C.fgFaint, border: `1px solid ${C.line}` }
                  }
                >
                  {actionable ? "Behandelen" : "Compleet"}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties — de next-action-engine als spotlight-lijst ──────────────────────────
function Acties() {
  const [focus, setFocus] = useState(0);
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={16} style={{ color: C.amber }} aria-hidden="true" />
        <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Volgende beste acties</h2>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const lit = focus === i;
          const tone = a.urgentie === "warning" ? C.amber : C.blue;
          return (
            <li key={a.titel}>
              <Panel lit={lit} onFocusMe={() => setFocus(i)} glow={tone} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      background: `${tone}18`,
                      border: `1px solid ${tone}3a`,
                      color: tone,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Chip tone={tone} Icon={a.urgentie === "warning" ? AlertTriangle : Sparkles}>
                        {a.urgentie === "warning" ? "Urgent" : "Kans"}
                      </Chip>
                    </div>
                    <h3
                      className="mt-2 text-[15.5px] font-semibold"
                      style={{ color: lit ? C.fg : C.fgShadow }}
                    >
                      {a.titel}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="shrink-0 self-start rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                    style={
                      lit
                        ? { background: tone, color: C.bg }
                        : { background: C.litHi, color: C.fgSoft, border: `1px solid ${C.line}` }
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────
function Facturen() {
  const [focus, setFocus] = useState(-1);
  const meta = (status: string): { tone: string; Icon: LucideIcon } => {
    if (status === "Betaald") return { tone: C.green, Icon: Check };
    if (status === "Openstaand") return { tone: C.amber, Icon: Clock };
    return { tone: C.fgFaint, Icon: Receipt };
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt size={16} style={{ color: C.amber }} aria-hidden="true" />
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Facturen</h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.amber, color: C.bg }}
        >
          Nieuwe factuur
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: "€ 8.622", tone: C.green },
          { l: "Openstaand", v: `${open}`, tone: C.amber },
          { l: "Te factureren", v: "€ 1.350", tone: C.blue },
        ].map((s) => (
          <Panel key={s.l} lit className="p-4">
            <Kicker>{s.l}</Kicker>
            <div
              className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: s.tone }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <div className="space-y-2">
        {FACTUREN.map((f, i) => {
          const m = meta(f.status);
          const lit = focus === i;
          return (
            <Panel
              key={f.nr}
              lit={lit}
              onFocusMe={() => setFocus(i)}
              glow={m.tone}
              className="px-4 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.fgFaint }}>
                  {f.nr}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-[14px] font-medium"
                  style={{ color: lit ? C.fg : C.fgShadow }}
                >
                  {f.klant}
                </span>
                <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.fgSoft }}>
                  {f.datum}
                </span>
                <Chip tone={m.tone} Icon={m.Icon}>
                  {f.status}
                </Chip>
                <span
                  className="w-20 text-right text-[14.5px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.fg }}
                >
                  {f.bedrag}
                </span>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
