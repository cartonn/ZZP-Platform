"use client";

// Concept 112 — "Zellige" · Marokkaans mozaïek met geometrische tessellatie.
// Warme kalk-witte achtergrond met geometrische accenten in traditionele glazuurkleuren:
// majolica-blauw, saffraan, terra, groen, aubergine. Ster-8/rozet-motieven en interlocking
// geometrie als decoratieve randen/dividers (SVG-patronen + CSS conic/repeating-gradients).
// Fijne ge-emailleerde tegel-look met subtiele glazuur-glans. KPI-tegels als vierkante
// glazuurtegels. Onderscheidend van Bauhaus (primaire vormen), Deco (jewel art-deco) en
// Delft (figuratief NL tegel): dit is ISLAMITISCHE GEOMETRISCHE TESSELLATIE, warm & mediterraan.
// Light concept. Fonts: Space Grotesk (display) + Inter (UI).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Star,
  ShieldCheck,
  Plus,
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

// Kalk-wit met glazuur-glazuurkleuren.
const C = {
  lime: "#f5efe4", // kalk-witte achtergrond
  limeDeep: "#ede4d3",
  tile: "#fbf7ee", // tegel-oppervlak (lichter)
  ink: "#2d2519", // donkere zetsel-inkt
  inkSoft: "#5b4f3d",
  muted: "#8f8064",
  majolica: "#2c6e8f", // majolica-blauw
  majolicaDeep: "#1f5570",
  saffron: "#d9a441", // saffraan
  terra: "#b0553a", // terra
  green: "#3f7d5c", // groen
  aubergine: "#5a3b57", // aubergine
  grout: "rgba(45,37,25,0.16)", // voeg (grout)
  groutStrong: "rgba(45,37,25,0.28)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

// Achtergrond-tessellatie: subtiel ster-raster via overlappende conic/lineaire gradients.
const zelligeField =
  "repeating-linear-gradient(45deg, rgba(44,110,143,0.04) 0 14px, transparent 14px 28px)," +
  "repeating-linear-gradient(-45deg, rgba(176,85,58,0.035) 0 14px, transparent 14px 28px)," +
  "radial-gradient(60% 50% at 50% -10%, rgba(217,164,65,0.10), transparent 60%)";

// Achtvoudige ster (khatam) als herbruikbaar SVG-motief.
function StarTile({
  size = 20,
  color,
  className = "",
}: {
  size?: number;
  color: string;
  className?: string;
}) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const r = i % 2 === 0 ? 10 : 4.6;
    return `${(10 + r * Math.cos(a)).toFixed(2)},${(10 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className={className} aria-hidden="true">
      <polygon points={pts} fill={color} />
    </svg>
  );
}

// Zellige-divider: rij van interlocking ruiten/sterren als decoratieve band.
function Band({ colors }: { colors: string[] }) {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden" aria-hidden="true">
      <span className="h-px flex-1" style={{ background: C.grout }} />
      {colors.map((c, i) => (
        <span
          key={i}
          className="h-2 w-2 rotate-45"
          style={{ background: c, outline: `1px solid ${C.grout}` }}
        />
      ))}
      <span className="h-px flex-1" style={{ background: C.grout }} />
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.majolica };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.terra };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.terra };
  }
}

function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-2 text-[11px] uppercase tracking-[0.3em]"
          style={{ ...ui, color: C.terra }}
        >
          {sub}
        </div>
      )}
      <h2
        className="text-[26px] font-semibold leading-none tracking-[-0.01em] sm:text-[32px]"
        style={{ ...display, color: C.ink }}
      >
        {children}
      </h2>
      <div className="mt-3">
        <Band colors={[C.majolica, C.saffron, C.terra, C.green, C.aubergine]} />
      </div>
    </div>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
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

// Glazuurtegel: licht oppervlak met glazuur-glans (radiale highlight) en voeg-rand.
function Tile({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`rounded-[6px] ${className}`}
      style={{
        background: `radial-gradient(130% 90% at 20% 0%, rgba(255,255,255,0.75), transparent 55%), ${C.tile}`,
        border: `1px solid ${C.groutStrong}`,
        boxShadow: accent
          ? `inset 3px 0 0 ${accent}, 0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 10px rgba(45,37,25,0.06)`
          : "0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 10px rgba(45,37,25,0.06)",
      }}
    >
      {children}
    </div>
  );
}

export function Concept112() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.lime, backgroundImage: zelligeField, color: C.ink }}
    >
      {/* Kop — glazuur-embleem met achtvoudige ster */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[6px]"
            style={{
              background: `conic-gradient(from 45deg, ${C.majolica}, ${C.green}, ${C.saffron}, ${C.terra}, ${C.majolica})`,
              border: `1px solid ${C.groutStrong}`,
            }}
            aria-hidden="true"
          >
            <StarTile size={22} color={C.tile} />
          </span>
          <div className="leading-none">
            <div
              className="text-[24px] font-semibold tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Zellige
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-medium" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[6px] text-[13px] font-semibold"
            style={{
              ...display,
              background: C.tile,
              color: C.majolica,
              border: `1px solid ${C.groutStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — tegel-tabs met glazuur-onderlijn */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-5 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.grout}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-t-[5px] px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                color: on ? C.ink : C.muted,
                fontWeight: on ? 600 : 400,
                background: on ? C.tile : "transparent",
              }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[1px] left-2 right-2 h-[3px] rounded-full"
                  style={{ background: C.terra }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
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
  const palette = [C.majolica, C.saffron, C.green, C.aubergine];
  return (
    <div className="space-y-12">
      {/* Groet — mozaïek-fronton */}
      <section className="text-center">
        <div className="text-[11px] uppercase tracking-[0.34em]" style={{ color: C.terra }}>
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[38px] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-[52px]"
          style={{ ...display, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <div className="mx-auto mt-5 flex max-w-xs items-center justify-center">
          <Band
            colors={[C.majolica, C.terra, C.saffron, C.green, C.aubergine, C.terra, C.majolica]}
          />
        </div>
        <p
          className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Je mozaïek ligt strak. Eén tegel vraagt vandaag aandacht — de rest zit vast in de voeg.
        </p>
      </section>

      {/* Primaire actie — terra glazuurtegel */}
      <Tile accent={C.terra} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]"
              style={{ color: C.terra }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.01em] sm:text-[26px]"
              style={{ ...display, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-[6px] px-6 py-3 text-[13px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.terra, color: C.tile }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Tile>

      {/* KPI — vier vierkante glazuurtegels */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = palette[i % palette.length] as string;
            return (
              <Tile
                key={k.label}
                accent={tone}
                className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-start justify-between">
                  <StarTile size={16} color={tone} />
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: k.up ? C.green : C.terra }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[28px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
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
              </Tile>
            );
          })}
        </div>
      </section>

      {/* Top-match als centraal rozet-paneel */}
      <section>
        <Kop sub="Beste match">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-6 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Tile
            accent={C.majolica}
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[6px]"
              style={{ background: C.majolica, color: C.tile }}
              aria-hidden="true"
            >
              <span className="text-[26px] font-semibold tabular-nums leading-none" style={display}>
                {top.match}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em]">match</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[20px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[4px] px-2.5 py-0.5 text-[11px]"
                    style={{
                      background: C.limeDeep,
                      color: C.inkSoft,
                      border: `1px solid ${C.grout}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.majolica }}
              aria-hidden="true"
            />
          </Tile>
        </button>
      </section>
    </div>
  );
}

function MatchBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-24 overflow-hidden rounded-[3px]"
        style={{ background: C.limeDeep, border: `1px solid ${C.grout}` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[3px]"
          style={{ width: `${value}%`, background: C.saffron }}
        />
      </div>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ ...display, color: C.terra }}
      >
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
  const palette = [C.majolica, C.green, C.aubergine];
  return (
    <div className="space-y-8">
      <Kop sub="Open opdrachten">Marktplaats</Kop>

      <Tile className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ color: C.muted }}>
          {filtered.length}
        </span>
      </Tile>

      {filtered.length === 0 ? (
        <Tile className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[22px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen tegels gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.terra, color: C.tile }}
          >
            Zoekopdracht wissen
          </button>
        </Tile>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => {
            const tone = palette[i % palette.length] as string;
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Tile
                    accent={tone}
                    className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[17px] font-semibold leading-tight tracking-[-0.01em]"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-[4px] px-2 py-0.5 text-[10.5px]"
                            style={{
                              background: C.limeDeep,
                              color: C.inkSoft,
                              border: `1px solid ${C.grout}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <MatchBar value={o.match} />
                      <ArrowRight
                        size={19}
                        className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                        style={{ color: C.terra }}
                        aria-hidden="true"
                      />
                    </div>
                  </Tile>
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
  const facts = [
    { l: "Tarief", v: opdracht.tarief, tone: C.green },
    { l: "Omvang", v: opdracht.uren, tone: C.majolica },
    { l: "Start", v: opdracht.start, tone: C.saffron },
    { l: "Match", v: `${opdracht.match}%`, tone: C.terra },
  ];
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            {opdracht.id}
          </span>
          <span
            className="rounded-[5px] px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: C.terra, color: C.tile }}
          >
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mx-auto mt-4 max-w-2xl text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[42px]"
          style={{ ...display, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {facts.map((m) => (
          <Tile key={m.l} accent={m.tone} className="p-4 text-center">
            <div
              className="text-[22px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-2 text-[11px] uppercase tracking-[0.18em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </div>
          </Tile>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Tile accent={C.green} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.green }}
          >
            <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Tile>
        <Tile accent={C.terra} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
            style={{ color: C.terra }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rotate-45"
                  style={{ background: C.terra, outline: `1px solid ${C.grout}` }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Tile>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
        <button
          className="group inline-flex w-full items-center justify-center gap-2.5 rounded-[6px] px-7 py-3.5 text-[14px] font-medium transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5 sm:w-auto"
          style={{ background: C.terra, color: C.tile }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-6 py-3.5 text-[14px] font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
          style={{ border: `1px solid ${C.groutStrong}`, color: C.ink, background: C.tile }}
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
    <div className="space-y-8">
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Vertrouwens-rozet */}
      <Tile
        accent={C.green}
        className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center"
      >
        <div className="relative h-28 w-28 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.limeDeep} strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.green}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {pct}%
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
              gedekt
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.24em]"
            style={{ color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig geverifieerd. Eén tegel vraagt
            binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Tile>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Tile accent={st.tone} className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px]"
                  style={{
                    background: `conic-gradient(from 30deg, ${st.tone}22, ${st.tone}44, ${st.tone}22)`,
                    border: `1px solid ${C.grout}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15.5px] font-semibold leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] px-3 py-1 text-[11px] font-medium"
                  style={{ background: C.tile, color: st.tone, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
              </Tile>
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
    <div className="space-y-8">
      <Kop sub="De volgende beste stap">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.terra : C.majolica;
          return (
            <li key={a.titel}>
              <Tile accent={tone} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] text-[17px] font-semibold tabular-nums"
                  style={{
                    ...display,
                    background: C.limeDeep,
                    color: tone,
                    border: `1px solid ${C.grout}`,
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
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Star
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[16px] font-semibold leading-tight tracking-[-0.01em]"
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
                  className="shrink-0 self-start rounded-[6px] px-5 py-2.5 text-[12.5px] font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={{ background: tone, color: C.tile }}
                >
                  {a.cta}
                </button>
              </Tile>
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
    if (status === "Openstaand") return C.terra;
    return C.muted;
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[12.5px] font-medium transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.terra, color: C.tile }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Tile className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.groutStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.muted, fontWeight: 500 }}
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
                  className="transition-opacity hover:opacity-80"
                  style={{ borderBottom: `1px solid ${C.grout}` }}
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
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ color: tone, border: `1px solid ${tone}` }}
                    >
                      <span
                        className="h-2 w-2 rotate-45"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
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
            <tr style={{ borderTop: `2px solid ${C.groutStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] uppercase tracking-[0.2em]"
                style={{ color: C.muted }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[20px] font-semibold tabular-nums"
                style={{ ...display, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Tile>
    </div>
  );
}
