"use client";

// Concept 133 — "Wegwijzer" · Nederlandse snelweg-bewegwijzering (ANWB/RWS) als navigatie-taal.
// Groene en blauwe verkeersborden met witte signage-typografie (Frutiger-achtig), routeschilden,
// afstand/richting-borden, hectometer-hints en pijl-wegwijzers. De opdracht-reis wordt een
// bewegwijzerde route: reactie → match → contract → factuur als opeenvolgende afritten.
// Onderscheidend van metrokaart (lijndiagram) en pictogram (ISOTYPE): dit is SNELWEG-BEBORDING
// met borden en afritten. Fonts: Libre Franklin (signage) + Plex Mono (hectometer).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Signpost,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  CornerUpRight,
  Milestone,
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

// Wegwijzer-palet — RWS-groen bord, ANWB-blauw bord, geel routeschild, wit signage-schrift.
const C = {
  bg: "#eef1f0", // licht asfalt-grijs canvas
  panel: "#ffffff", // wit paneel
  panelSoft: "#f4f6f5",
  green: "#1f7a45", // RWS autosnelweg-groen (accent)
  greenDeep: "#155e34",
  blue: "#1667b2", // ANWB blauw (autoweg / stad)
  blueDeep: "#0f4d88",
  yellow: "#f2c200", // routeschild geel
  yellowInk: "#3a2f00", // schrift op geel
  white: "#ffffff",
  fg: "#182029", // donker asfalt-schrift
  fgSoft: "#54606c", // gedempt schrift
  fgFaint: "#8a97a3", // fijn schrift
  red: "#c62a25", // afsluiting / urgent
  amber: "#d98317", // omleiding / let-op
  line: "#d9dfdd", // dunne lijn
  lineStrong: "#c1c9c6",
};

const display = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const ui = { fontFamily: "var(--font-lab-franklin)" };

// ── Bebordings-motieven ──────────────────────────────────────────────────────
// Subtiel asfalt-canvas met een gele middenstreep-hint bovenaan.
const asphalt =
  "repeating-linear-gradient(90deg, rgba(24,32,41,0.015) 0 2px, transparent 2px 6px)," +
  "radial-gradient(120% 60% at 50% -20%, rgba(22,103,178,0.06), transparent 60%)";

// Routeschild — geel ANWB-schild met route-code (bv. A12), afgeronde hoeken + rand.
function Routeschild({ code, size = "md" }: { code: string; size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg"
      ? "px-3 py-1.5 text-[16px]"
      : size === "sm"
        ? "px-1.5 py-0.5 text-[11px]"
        : "px-2.5 py-1 text-[13px]";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[5px] font-extrabold tabular-nums leading-none ${dims}`}
      style={{
        background: C.yellow,
        color: C.yellowInk,
        border: `2px solid ${C.yellowInk}`,
        ...display,
      }}
    >
      {code}
    </span>
  );
}

// Bord-tegel — het herbruikbare snelwegbord (groen of blauw) met witte rand.
function Bord({
  children,
  tone = C.green,
  className = "",
  interactive = false,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[10px] ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: tone,
        color: C.white,
        border: `2px solid ${C.white}`,
        boxShadow: `0 0 0 1.5px ${tone}, 0 2px 6px rgba(24,32,41,0.18)`,
      }}
    >
      {/* binnen-witrand, kenmerkend voor NL-borden */}
      <div
        className="pointer-events-none absolute inset-1.5 rounded-[6px]"
        style={{ border: `1.5px solid rgba(255,255,255,0.85)` }}
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// Wit informatie-paneel (voor tabellen/lijsten die geen bord zijn).
function Kaart({
  children,
  className = "",
  interactive = false,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`relative rounded-[10px] ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(24,32,41,0.05)",
        ...(accent ? { borderLeft: `4px solid ${accent}` } : null),
      }}
    >
      {children}
    </div>
  );
}

// Afrit-pijl — schuine pijl rechtsboven op groene borden (afslag).
function AfritPijl({ tone = C.white }: { tone?: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M6 18 L18 6 M18 6 H10 M18 6 V14"
        fill="none"
        stroke={tone}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Hectometerpaaltje-label (mono, klein) — kilometeraanduiding-sfeer.
function Hecto({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tabular-nums tracking-[0.12em]"
      style={{ ...mono, color: C.fgFaint }}
    >
      {children}
    </span>
  );
}

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Doorgang vrij", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "Op de route", Icon: Clock, tone: C.blue };
    case "EXPIRING":
      return { label: "Omleiding nodig", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgesloten", Icon: XCircle, tone: C.red };
  }
}

function Chip({
  children,
  tone,
  onWhite = true,
}: {
  children: React.ReactNode;
  tone: string;
  onWhite?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none"
      style={
        onWhite
          ? { ...display, background: `${tone}15`, color: tone, border: `1.5px solid ${tone}55` }
          : {
              ...display,
              background: "rgba(255,255,255,0.18)",
              color: C.white,
              border: "1.5px solid rgba(255,255,255,0.6)",
            }
      }
    >
      {children}
    </span>
  );
}

// Match als afstandbord-meter (km tot bestemming → % match).
function RouteMeter({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative h-2.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </div>
      <span className="text-[13px] font-extrabold tabular-nums" style={{ ...display, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

function Kop({ children, sub, code }: { children: React.ReactNode; sub?: string; code?: string }) {
  return (
    <div className="flex items-center gap-3">
      {code && <Routeschild code={code} size="lg" />}
      <div>
        {sub && (
          <div
            className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ ...display, color: C.blue }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[25px] font-extrabold leading-none tracking-[-0.02em] sm:text-[30px]"
          style={{ ...display, color: C.fg }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

export function Concept133() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, backgroundImage: asphalt, color: C.fg }}
    >
      {/* Kop — wegwijzer-merk als bord */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <Bord tone={C.green} className="px-3 py-2">
            <div className="flex items-center gap-2">
              <Signpost size={20} strokeWidth={2.4} aria-hidden="true" />
              <span
                className="text-[17px] font-extrabold tracking-[-0.01em]"
                style={{ ...display }}
              >
                Wegwijzer
              </span>
            </div>
          </Bord>
          <div className="hidden leading-none sm:block">
            <Hecto>NL · ZZP-platform</Hecto>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-bold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[10.5px]" style={{ ...mono, color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[12px] font-extrabold"
            style={{
              ...display,
              background: C.blue,
              color: C.white,
              border: `2px solid ${C.white}`,
              boxShadow: `0 0 0 1.5px ${C.blue}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — afritten-strip */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `2px solid ${C.lineStrong}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...display, color: on ? C.green : C.fgSoft, fontWeight: on ? 800 : 600 }}
            >
              <span
                className="mr-1.5 text-[10px] font-bold tabular-nums"
                style={{ color: on ? C.green : C.fgFaint }}
              >
                {i + 1}
              </span>
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[2px] left-2 right-2 h-[3px] rounded-t-full"
                  style={{ background: C.green }}
                  aria-hidden="true"
                />
              )}
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
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const reis = ["Reactie", "Match", "Contract", "Factuur"];
  const tones = [C.green, C.blue, C.greenDeep, C.blueDeep];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ ...display, color: C.blue }}
        >
          <MapPin size={12} strokeWidth={2.6} aria-hidden="true" /> Vertrekpunt · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2.5 text-[34px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[46px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2.5 max-w-md text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
          Je route ligt open. Eén afrit vraagt vandaag om actie — de rest van de reis loopt door.
        </p>
      </section>

      {/* Reis-wegwijzer: de opdracht-reis als bewegwijzerde route */}
      <Bord tone={C.blue} className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Signpost size={16} strokeWidth={2.4} aria-hidden="true" />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ ...display }}
          >
            Jouw route
          </span>
        </div>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {reis.map((r, i) => (
            <li key={r} className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-[13px] font-bold"
                style={{
                  ...display,
                  background: "rgba(255,255,255,0.16)",
                  border: "1.5px solid rgba(255,255,255,0.65)",
                }}
              >
                <span className="text-[10px] tabular-nums opacity-80">{i + 1}</span>
                {r}
              </span>
              {i < reis.length - 1 && (
                <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" className="opacity-80" />
              )}
            </li>
          ))}
        </ol>
      </Bord>

      {/* Primaire actie — als omleidingsbord */}
      <Bord tone={C.amber} className="p-0">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px]"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.7)",
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={22} strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ ...display }}
              >
                Omleiding · vraagt actie
              </span>
              <h2
                className="mt-1.5 text-[23px] font-extrabold leading-tight tracking-[-0.01em] sm:text-[27px]"
                style={{ ...display }}
              >
                {primair.titel}
              </h2>
              <p
                className="mt-1.5 max-w-md text-[13px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                {primair.detail}
              </p>
            </div>
          </div>
          <button
            onClick={onActies}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[8px] px-6 py-3 text-[13px] font-extrabold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ ...display, background: C.white, color: C.amber }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Bord>

      {/* KPI-tegels — als afstandborden */}
      <section>
        <Kop sub="Kilometerstand" code="A1">
          Prestatie
        </Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Bord key={k.label} tone={tone} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <Milestone size={16} strokeWidth={2.4} aria-hidden="true" />
                  <span
                    className="text-[10.5px] font-bold tabular-nums"
                    style={{ ...display, color: "rgba(255,255,255,0.95)" }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...display }}
                >
                  {k.value}
                </div>
                <div
                  className="mt-1 text-[11px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} />
                </div>
              </Bord>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Kop sub="Beste bestemming" code="E30">
          Voor jou
        </Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Bord tone={C.green} interactive className="p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[8px]"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "2px solid rgba(255,255,255,0.7)",
                }}
                aria-hidden="true"
              >
                <span
                  className="text-[22px] font-extrabold tabular-nums leading-none"
                  style={{ ...display }}
                >
                  {top.match}
                </span>
                <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] opacity-85">
                  match
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-[20px] font-extrabold leading-tight tracking-[-0.01em]"
                  style={{ ...display }}
                >
                  {top.titel}
                </h3>
                <div
                  className="mt-1 text-[12.5px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <Chip key={t} tone={C.white} onWhite={false}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
              <AfritPijl />
            </div>
          </Bord>
        </button>
      </section>
    </div>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
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
  const routes = ["A2", "A6", "A28"];
  return (
    <div className="space-y-7">
      <Kop sub="Bestemmingen" code="A12">
        Marktplaats
      </Kop>

      <Kaart className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.fgFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.fg }}
        />
        <Hecto>{filtered.length} borden</Hecto>
      </Kaart>

      {filtered.length === 0 ? (
        <Kaart className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: `${C.red}12`, border: `2px solid ${C.red}` }}
            aria-hidden="true"
          >
            <XCircle size={26} strokeWidth={2.2} style={{ color: C.red }} />
          </span>
          <p className="text-[20px] font-extrabold" style={{ ...display, color: C.fg }}>
            Weg afgesloten
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Geen bestemming voor “{q}”. Verruim je zoekopdracht of je beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[8px] px-4 py-2 text-[12px] font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...display, background: C.green, color: C.white }}
          >
            Zoekopdracht wissen
          </button>
        </Kaart>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, idx) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Kaart interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex shrink-0 items-center gap-2">
                    <Routeschild code={routes[idx % routes.length] as string} />
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[13px] font-extrabold tabular-nums"
                      style={{
                        ...display,
                        background: o.match >= 90 ? C.green : C.blue,
                        color: C.white,
                      }}
                      aria-hidden="true"
                    >
                      {o.match}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-extrabold leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.fg }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Chip key={t} tone={C.fgSoft}>
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <RouteMeter value={o.match} tone={o.match >= 90 ? C.green : C.blue} />
                    <CornerUpRight
                      size={20}
                      strokeWidth={2.4}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.green }}
                      aria-hidden="true"
                    />
                  </div>
                </Kaart>
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
        className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ ...display, color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      {/* Bestemmingsbord */}
      <Bord tone={C.green} className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[8px]"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.7)",
            }}
            aria-hidden="true"
          >
            <span
              className="text-[22px] font-extrabold tabular-nums leading-none"
              style={{ ...display }}
            >
              {opdracht.match}
            </span>
            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] opacity-85">
              match
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Routeschild code={opdracht.id.replace("OPD-", "N")} />
              <Chip tone={C.white} onWhite={false}>
                {opdracht.match}% op route
              </Chip>
            </div>
            <h1
              className="mt-2 text-[28px] font-extrabold leading-[1.06] tracking-[-0.02em] sm:text-[36px]"
              style={{ ...display }}
            >
              {opdracht.titel}
            </h1>
            <p
              className="mt-1.5 text-[13px] font-semibold"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
      </Bord>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Kaart key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.blue }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-extrabold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
              style={{ ...display, color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Kaart>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Kaart className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ ...display, color: C.green }}
          >
            <Check size={14} strokeWidth={3} aria-hidden="true" /> Doorgaande weg
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
              >
                <Check
                  size={16}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Kaart>
        <Kaart className="p-5" accent={C.amber}>
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ ...display, color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={3} aria-hidden="true" /> Let op onderweg
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Kaart>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-[8px] px-7 py-3.5 text-[14px] font-extrabold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ ...display, background: C.green, color: C.white }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[8px] px-6 py-3.5 text-[14px] font-extrabold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...display, border: `2px solid ${C.lineStrong}`, color: C.fg }}
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
      <Kop sub="Doorgang" code="A50">
        Verificatie
      </Kop>

      <Bord tone={C.blue} className="p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "3px solid rgba(255,255,255,0.7)",
            }}
            aria-hidden="true"
          >
            <div className="text-center leading-none">
              <span
                className="block text-[28px] font-extrabold tabular-nums"
                style={{ ...display }}
              >
                {pct}%
              </span>
              <span className="mt-1 block text-[8.5px] font-bold uppercase tracking-[0.16em] opacity-85">
                vrij
              </span>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold"
              style={{
                ...display,
                background: "rgba(255,255,255,0.18)",
                border: "1.5px solid rgba(255,255,255,0.65)",
              }}
            >
              <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <p
              className="mt-3 max-w-md text-[14px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              {verified} van {CREDENTIALS.length} bewijsstukken geven vrije doorgang. Elk
              goedgekeurd bord opent de route — één rijstrook vraagt binnenkort om een omleiding.
            </p>
          </div>
        </div>
      </Bord>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Kaart className="flex items-center gap-4 p-4" accent={st.tone}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]"
                  style={{
                    background: st.tone,
                    color: C.white,
                    border: `2px solid ${C.white}`,
                    boxShadow: `0 0 0 1.5px ${st.tone}`,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.fg }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Chip tone={st.tone}>
                  <st.Icon size={12} strokeWidth={3} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Chip>
              </Kaart>
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
      <Kop sub="Volgende afrit" code="A4">
        Volgende acties
      </Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          return (
            <li key={a.titel}>
              <Kaart className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center" accent={tone}>
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] text-[16px] font-extrabold tabular-nums"
                  style={{
                    ...display,
                    background: tone,
                    color: C.white,
                    border: `2px solid ${C.white}`,
                    boxShadow: `0 0 0 1.5px ${tone}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.8}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Signpost
                        size={14}
                        strokeWidth={2.8}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[17px] font-extrabold leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.fg }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-[8px] px-5 py-2.5 text-[12.5px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ ...display, background: tone, color: C.white }}
                >
                  {a.cta}
                </button>
              </Kaart>
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
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.fgFaint;
    return C.blue;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Tolpoort" code="A16">
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-[8px] px-4 py-2.5 text-[12.5px] font-extrabold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ ...display, background: C.green, color: C.white }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Kaart className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...display, color: C.fgFaint }}
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
                  className="transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] font-semibold" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Chip tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Chip>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-extrabold tabular-nums"
                    style={{ ...display, color: C.fg }}
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
                className="px-4 py-4 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ ...display, color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-extrabold tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Kaart>
    </div>
  );
}
