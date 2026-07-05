"use client";

// Concept 107 — "Perkament" · Verlucht manuscript / geregistreerd document.
// Metafoor: een oud, warm perkament-oppervlak (crème/ivoor) met subtiele vlek-textuur,
// kalligrafische serif-koppen, sier-initialen (drop-cap), een dun bruin-inkt hairline-raster
// en één diep bladgoud/oker-accent voor zegels & verificatie. Vertrouwen ontstaat door
// herkomst, ambacht en het gevoel van een "geregistreerd document" — ideaal voor het
// verifiëren van certificaten en diploma's.
// Fonts: Fraunces (display/serif, kalligrafisch) + Libre Franklin (UI). Geen koele grijzen:
// alles leeft in warme inkt-, perkament- en goudtinten.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Feather,
  ScrollText,
  Stamp,
  MapPin,
  CalendarDays,
  Banknote,
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

// Warme perkament- en inkt-tinten. Eén accent: bladgoud/oker voor zegels.
const C = {
  parch: "#f4ecd8", // perkament-basis
  parchDeep: "#ece1c6", // diepere perkament (panelen)
  parchEdge: "#e4d6b4", // rand/verkleuring
  ink: "#3a2f1c", // sepia-inkt (hoofdtekst)
  inkSoft: "#5c4d33", // zachtere inkt
  muted: "#8a7856", // vervaagde inkt
  faint: "#a99a75", // zeer licht
  hair: "rgba(90,66,32,0.18)", // dun bruin-inkt raster
  hairSoft: "rgba(90,66,32,0.10)",
  gold: "#9a6b1f", // bladgoud/oker-accent
  goldDeep: "#7d5312",
  goldSoft: "#c79a4a",
  goldWash: "rgba(154,107,31,0.10)",
  seal: "#8a2f22", // wax-zegel rood (spaarzaam)
  sealSoft: "rgba(138,47,34,0.10)",
  ok: "#4f6b34", // verificatie-groen (mos)
  okWash: "rgba(79,107,52,0.12)",
};

const ui = { fontFamily: "var(--font-lab-franklin)" };
const serif = { fontFamily: "var(--font-lab-fraunces)" };

// Perkament-oppervlak: warme radiale vlekken + korrel, puur via gradients (geen assets).
const parchmentSurface: React.CSSProperties = {
  background: `
    radial-gradient(120% 90% at 12% 8%, rgba(255,250,235,0.6) 0%, rgba(255,250,235,0) 42%),
    radial-gradient(90% 80% at 88% 12%, rgba(196,168,110,0.16) 0%, rgba(196,168,110,0) 46%),
    radial-gradient(120% 100% at 82% 96%, rgba(150,110,50,0.14) 0%, rgba(150,110,50,0) 48%),
    radial-gradient(70% 60% at 30% 88%, rgba(140,100,45,0.10) 0%, rgba(140,100,45,0) 50%),
    ${C.parch}`,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  fg: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Bezegeld", Icon: ShieldCheck, fg: C.ok, wash: C.okWash };
    case "SUBMITTED":
      return { label: "In beraad", Icon: Clock, fg: C.gold, wash: C.goldWash };
    case "EXPIRING":
      return { label: "Vervalt spoedig", Icon: AlertTriangle, fg: C.goldDeep, wash: C.goldWash };
    case "REJECTED":
      return { label: "Verworpen", Icon: AlertTriangle, fg: C.seal, wash: C.sealSoft };
  }
}

// Kleine kapiteel-overline in de stijl van een manuscript-kop.
function Rubric({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.34em]"
      style={{ color: C.gold }}
    >
      <span className="h-px w-5" style={{ background: C.gold }} aria-hidden="true" />
      {children}
    </span>
  );
}

// Wax-zegel / verificatiezegel — puur CSS. Toont goud voor "geregistreerd".
function Seal({ size = 56, label }: { size?: number; label: string }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 34% 30%, ${C.goldSoft} 0%, ${C.gold} 46%, ${C.goldDeep} 100%)`,
        boxShadow: `inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.28), 0 2px 5px rgba(90,66,32,0.3)`,
        border: `1px solid ${C.goldDeep}`,
      }}
      role="img"
      aria-label={label}
    >
      <span
        className="absolute inset-[5px] rounded-full"
        style={{ border: `1px dashed rgba(255,247,225,0.55)` }}
        aria-hidden="true"
      />
      <Stamp size={size * 0.42} aria-hidden="true" style={{ color: "#fdf6e3" }} />
    </span>
  );
}

// Sier-initiaal (drop-cap) voor het manuscript-gevoel.
function DropCap({ letter }: { letter: string }) {
  return (
    <span
      className="float-left mr-3 mt-1 flex h-[54px] w-[54px] items-center justify-center rounded-[4px] text-[40px] leading-none"
      style={{
        ...serif,
        color: C.gold,
        background: C.goldWash,
        border: `1px solid ${C.hair}`,
        fontWeight: 600,
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 96;
  const h = 30;
  const last = points[points.length - 1] ?? min;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={w} cy={h - ((last - min) / span) * h} r={2.4} fill={stroke} />
    </svg>
  );
}

export function Concept107() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, ...parchmentSurface, color: C.ink }}
    >
      {/* Kop — als de titelpagina van een codex */}
      <header
        className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5 md:px-8"
        style={{ borderColor: C.hair }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[6px]"
            style={{
              background: `radial-gradient(circle at 34% 28%, ${C.goldSoft} 0%, ${C.gold} 55%, ${C.goldDeep} 100%)`,
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.25)",
            }}
            aria-hidden="true"
          >
            <Feather size={20} style={{ color: "#fdf6e3" }} />
          </span>
          <div className="leading-tight">
            <span className="block text-[20px] font-semibold tracking-[-0.01em]" style={serif}>
              Perkament
            </span>
            <span
              className="block text-[10.5px] uppercase tracking-[0.3em]"
              style={{ color: C.muted }}
            >
              Register van vakmanschap
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
            style={{ background: C.okWash, color: C.ok }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: C.parchDeep, border: `1px solid ${C.hair}`, color: C.inkSoft }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — inkt-tabs met goud-onderstreping */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-b px-3 md:px-6"
        style={{ borderColor: C.hair }}
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.ink : C.muted, fontWeight: on ? 600 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-3 -bottom-px h-[2px] rounded-full"
                  style={{ background: C.gold }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      <footer
        className="mx-auto max-w-5xl px-5 pb-10 pt-2 text-center md:px-8"
        style={{ color: C.faint }}
      >
        <p className="text-[11px] tracking-[0.16em]" style={serif}>
          — Opgemaakt en bezegeld te {PROFIEL.plaats} —
        </p>
      </footer>
    </div>
  );
}

// Herbruikbaar perkament-paneel met dubbele inkt-rand (als een omkaderd document).
function Leaf({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`relative rounded-[10px] p-5 md:p-6 ${className}`}
      style={{
        background: C.parchDeep,
        border: `1px solid ${C.hair}`,
        boxShadow: "inset 0 0 0 3px rgba(244,236,216,0.6), 0 1px 2px rgba(90,66,32,0.06)",
      }}
    >
      {children}
    </section>
  );
}

function MatchBadge({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums"
      style={{ background: C.goldWash, color: C.goldDeep, border: `1px solid ${C.hair}` }}
    >
      <Sparkles size={12} aria-hidden="true" /> {value}% verwant
    </span>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const naam = PROFIEL.naam.split(" ")[0];
  return (
    <div className="space-y-8">
      {/* Titelblad */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Leaf className="overflow-hidden">
          <Rubric>Folio primus · vandaag</Rubric>
          <h1
            className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.015em] sm:text-[42px]"
            style={serif}
          >
            Welkom terug, {naam}.
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            <DropCap letter="U" />w register is bij. Vier bekwaamheden zijn vastgelegd, één vraagt
            binnenkort om vernieuwing. Hieronder staat wat vandaag uw hand behoeft.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={{ background: C.parch, border: `1px solid ${C.hair}`, color: C.inkSoft }}
            >
              <MapPin size={13} aria-hidden="true" /> {PROFIEL.plaats}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={{ background: C.parch, border: `1px solid ${C.hair}`, color: C.inkSoft }}
            >
              <ScrollText size={13} aria-hidden="true" /> {PROFIEL.rol}
            </span>
          </div>
        </Leaf>

        {/* Voornaamste handeling met wax-zegel */}
        <Leaf className="flex flex-col justify-between">
          <div>
            <Rubric>De voornaamste handeling</Rubric>
            <div className="mt-4 flex items-start gap-4">
              <Seal label="Zegel: dringende handeling" />
              <div className="min-w-0">
                <h2 className="text-[19px] font-semibold leading-snug" style={serif}>
                  {primair.titel}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  {primair.detail}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onOpen}
            className="group mt-5 inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-transform hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.gold, color: "#fdf6e3" }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </Leaf>
      </div>

      {/* Cijfers als register-regels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Leaf key={k.label}>
            <p
              className="text-[11px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.muted }}
            >
              {k.label}
            </p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p
                className="text-[28px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={serif}
              >
                {k.value}
              </p>
              <Sparkline points={k.spark} stroke={C.gold} />
            </div>
            <p
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium tabular-nums"
              style={{ color: k.up ? C.ok : C.goldDeep }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </p>
          </Leaf>
        ))}
      </div>

      {/* Top-match als geïllumineerd item */}
      <Leaf>
        <div className="flex items-center justify-between">
          <Rubric>Uitgelezen opdracht</Rubric>
          <MatchBadge value={top.match} />
        </div>
        <button
          onClick={onOpen}
          className="group mt-4 flex w-full flex-col gap-4 rounded-[8px] p-4 text-left transition-colors hover:bg-[var(--hoverbg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between"
          style={{ border: `1px solid ${C.hairSoft}`, ["--hoverbg" as string]: C.goldWash }}
        >
          <div className="min-w-0">
            <h3 className="text-[20px] font-semibold leading-snug" style={serif}>
              {top.titel}
            </h3>
            <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
              {top.opdrachtgever} · {top.plaats} · {top.tarief}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {top.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: C.parch, border: `1px solid ${C.hair}`, color: C.inkSoft }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-2 text-[13px] font-semibold transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
            style={{ color: C.gold }}
          >
            Openslaan <ArrowRight size={15} aria-hidden="true" />
          </span>
        </button>
      </Leaf>
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Rubric>Marktplaats · te vergeven</Rubric>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.015em]"
            style={serif}
          >
            Open opdrachten
          </h1>
        </div>
        <span className="text-[13px] tabular-nums" style={{ color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length} vermeld
        </span>
      </div>

      <div
        className="flex items-center gap-3 rounded-full px-4 py-2.5"
        style={{ background: C.parchDeep, border: `1px solid ${C.hair}` }}
      >
        <Feather size={16} aria-hidden="true" style={{ color: C.gold }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a99a75]"
          style={{ color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <Leaf className="py-16 text-center">
          <ScrollText size={30} aria-hidden="true" style={{ color: C.faint }} className="mx-auto" />
          <p className="mt-4 text-[22px] font-semibold" style={serif}>
            Geen vermelding gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Er staat niets in het register dat past bij “{q}”. Verruim uw zoektocht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
            style={{ color: C.gold }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </Leaf>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <Leaf>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Manuscript-nummering */}
                  <span
                    className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums sm:flex"
                    style={{
                      ...serif,
                      background: C.goldWash,
                      color: C.gold,
                      border: `1px solid ${C.hair}`,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[20px] font-semibold leading-snug" style={serif}>
                        {o.titel}
                      </h2>
                      <MatchBadge value={o.match} />
                    </div>
                    <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div
                      className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]"
                      style={{ color: C.inkSoft }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Banknote size={14} aria-hidden="true" style={{ color: C.gold }} />{" "}
                        {o.tarief}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} aria-hidden="true" style={{ color: C.gold }} /> {o.uren}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} aria-hidden="true" style={{ color: C.gold }} />{" "}
                        {o.start}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: C.parch,
                            border: `1px solid ${C.hair}`,
                            color: C.inkSoft,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onOpen}
                    className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                    style={{ background: C.gold, color: "#fdf6e3" }}
                    aria-label={`Bekijk ${o.titel}`}
                  >
                    Openslaan <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </Leaf>
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
    { l: "Aanvang", v: opdracht.start, Icon: CalendarDays },
    { l: "Verwantschap", v: `${opdracht.match}%`, Icon: Sparkles },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-medium transition-colors hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ["--ink" as string]: C.ink }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar de marktplaats
      </button>

      <Leaf>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Rubric>{opdracht.id}</Rubric>
              <MatchBadge value={opdracht.match} />
            </div>
            <h1
              className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.015em] sm:text-[38px]"
              style={serif}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <Seal label="Zegel: geregistreerde opdracht" size={62} />
        </div>

        <button
          className="mt-6 inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[14px] font-semibold transition-transform hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.gold, color: "#fdf6e3" }}
        >
          Uw hand tekenen <Feather size={16} aria-hidden="true" />
        </button>
      </Leaf>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {meta.map((m) => (
          <Leaf key={m.l}>
            <m.Icon size={16} aria-hidden="true" style={{ color: C.gold }} />
            <p
              className="mt-3 text-[22px] font-semibold tabular-nums tracking-[-0.01em]"
              style={serif}
            >
              {m.v}
            </p>
            <p
              className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
          </Leaf>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Leaf>
          <p
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.ok }}
          >
            <Check size={15} aria-hidden="true" /> Wat verwant is
          </p>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.inkSoft }}
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
        </Leaf>
        <Leaf>
          <p
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.goldDeep }}
          >
            <AlertTriangle size={15} aria-hidden="true" /> Ter overweging
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
                  style={{ background: C.goldWash }}
                  aria-hidden="true"
                >
                  <Minus size={12} style={{ color: C.goldDeep }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Leaf>
      </div>

      <Leaf>
        <Rubric>Colofon van de match</Rubric>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Deze verwantschap is opgesteld op grond van uw bezegelde bekwaamheden — nooit op een
          verborgen getal. Elke reden is naspeurbaar tot een geverifieerd document in uw register.
        </p>
      </Leaf>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[2]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Leaf className="text-center sm:text-left">
          <Rubric>Zegelkamer</Rubric>
          <h1
            className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.015em]"
            style={serif}
          >
            Verificatie & herkomst
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            <span className="font-semibold" style={{ color: C.ok }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} bekwaamheden zijn bezegeld en naspeurbaar. Eén
            vraagt binnenkort om vernieuwing van het zegel.
          </p>
        </Leaf>

        {/* Vertrouwens-meter met zegels */}
        <Leaf>
          <div className="flex items-center gap-4">
            <Seal label="Register-zegel" size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span
                  className="text-[12px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: C.muted }}
                >
                  Bezegeld
                </span>
                <span className="text-[15px] font-semibold tabular-nums" style={serif}>
                  {verified}/{CREDENTIALS.length}
                </span>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full"
                style={{ background: C.parch }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(verified / CREDENTIALS.length) * 100}%`,
                    background: `linear-gradient(90deg, ${C.goldDeep}, ${C.goldSoft})`,
                  }}
                />
              </div>
              <p className="mt-2 text-[12px]" style={{ color: C.muted }}>
                Een bezegeld register vergroot uw kans op een uitnodiging aanzienlijk.
              </p>
            </div>
          </div>
        </Leaf>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Leaf className="overflow-hidden !p-0">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[var(--hoverbg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--hoverbg" as string]: C.goldWash }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: st.wash }}
                    aria-hidden="true"
                  >
                    <st.Icon size={18} style={{ color: st.fg }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold leading-snug" style={serif}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-medium"
                      style={{ color: st.fg }}
                    >
                      <st.Icon size={12} aria-hidden="true" /> {st.label}
                    </span>
                  </span>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none"
                    style={{
                      border: `1px solid ${C.hair}`,
                      color: C.inkSoft,
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
                      className="mx-4 mb-4 rounded-[8px] p-4"
                      style={{ background: C.parch, border: `1px solid ${C.hairSoft}` }}
                    >
                      <p className="text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                        {c.detail}
                      </p>
                      {c.status === "EXPIRING" && (
                        <button
                          className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                          style={{ background: C.gold, color: "#fdf6e3" }}
                        >
                          Zegel vernieuwen <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      )}
                      {c.status === "SUBMITTED" && (
                        <p
                          className="mt-2 inline-flex items-center gap-1.5 text-[12px]"
                          style={{ color: C.gold }}
                        >
                          <Clock size={13} aria-hidden="true" /> Een beoordelaar bekijkt uw stuk.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Leaf>
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
    <div className="space-y-6">
      <div>
        <Rubric>Marginalia · vereist uw hand</Rubric>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.015em]"
          style={serif}
        >
          Volgende handelingen
        </h1>
      </div>
      <ol className="space-y-3">
        {ordered.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Leaf>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                    style={{
                      ...serif,
                      background: warn ? C.sealSoft : C.goldWash,
                      color: warn ? C.seal : C.gold,
                      border: `1px solid ${C.hair}`,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[18px] font-semibold leading-snug" style={serif}>
                        {a.titel}
                      </h2>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: warn ? C.sealSoft : C.goldWash,
                          color: warn ? C.seal : C.goldDeep,
                        }}
                      >
                        {warn ? (
                          <AlertTriangle size={12} aria-hidden="true" />
                        ) : (
                          <Sparkles size={12} aria-hidden="true" />
                        )}
                        {warn ? "Met spoed" : "Ter kennisname"}
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
                    className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                    style={
                      warn
                        ? { background: C.gold, color: "#fdf6e3" }
                        : { background: C.parch, color: C.ink, border: `1px solid ${C.hair}` }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Leaf>
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
    if (s === "Openstaand") return { fg: C.goldDeep, wash: C.goldWash, Icon: Clock };
    return { fg: C.muted, wash: C.hairSoft, Icon: ScrollText };
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Rubric>Grootboek</Rubric>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.015em]"
            style={serif}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.gold, color: "#fdf6e3" }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur opmaken
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Leaf>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.muted }}
          >
            Betaald
          </p>
          <p
            className="mt-2 text-[24px] font-semibold tabular-nums"
            style={{ ...serif, color: C.ok }}
          >
            {totaal}
          </p>
        </Leaf>
        <Leaf>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.muted }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[24px] font-semibold tabular-nums"
            style={{ ...serif, color: C.goldDeep }}
          >
            € 1.350
          </p>
        </Leaf>
        <Leaf className="col-span-2 sm:col-span-1">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.muted }}
          >
            Bezegeld & betaald
          </p>
          <p className="mt-2 text-[24px] font-semibold tabular-nums" style={serif}>
            {betaald.length}/{FACTUREN.length}
          </p>
        </Leaf>
      </div>

      <Leaf className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
                {["Nummer", "Klant", "Datum", "Staat", "Bedrag"].map((h, i) => (
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
                const ss = statusStyle(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[var(--hoverbg)]"
                    style={{
                      borderBottom: `1px solid ${C.hairSoft}`,
                      ["--hoverbg" as string]: C.goldWash,
                    }}
                  >
                    <td className="px-4 py-3.5 tabular-nums" style={{ color: C.muted }}>
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 font-semibold" style={{ ...serif, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums" style={{ color: C.muted }}>
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
                      className="px-4 py-3.5 text-right text-[15px] font-semibold tabular-nums"
                      style={serif}
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
                  className="px-4 py-4 text-[12px] uppercase tracking-[0.16em]"
                  style={{ color: C.faint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-4 text-right text-[19px] font-semibold tabular-nums"
                  style={{ ...serif, color: C.ink }}
                >
                  {totaal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Leaf>
    </div>
  );
}
