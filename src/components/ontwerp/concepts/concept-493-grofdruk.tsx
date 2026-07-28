"use client";

// Concept 493 — "Grofdruk" · Verfijnd tactile-brutalism. Scherpe geometrie, harde zwarte 1px/2px
// randen, GEEN schaduwen, stevige grotesk-typografie en één fel acid-accent dat als offset/overprint-
// blok achter koppen schuift (misregistratie-effect). Rauw-maar-strak, hoog contrast, zelfverzekerd.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: papierwit, zwarte inkt, één fel acid-accent —
const C = {
  paper: "#f3f1e9",
  card: "#faf8f1",
  ink: "#0b0b09",
  inkSoft: "#33322c",
  inkMute: "#5c5a50",
  accent: "#dcf72b", // acid-lime overprint
  accentInk: "#0b0b09",
  ok: "#0b0b09",
  warn: "#ff5b1a", // fel overprint-oranje voor waarschuwing
};

const grotesk = {
  fontFamily: "'Archivo', 'Helvetica Neue', 'Arial Black', system-ui, sans-serif",
};
const num = {
  fontFamily: "'Archivo', 'Helvetica Neue', system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
};

const BORD = `2px solid ${C.ink}`;
const HAIR = `1px solid ${C.ink}`;

type Tone = {
  label: string;
  Icon: LucideIcon;
  kind: "solid" | "outline" | "accent" | "warn";
  alarm: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, kind: "solid", alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, kind: "outline", alarm: false };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: AlertTriangle, kind: "accent", alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, kind: "warn", alarm: true };
  }
}

// — Overline: zware kleinkapitaal-tag —
function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block text-[11px] font-extrabold uppercase tracking-[0.14em] ${className}`}
      style={{ color: C.ink }}
    >
      {children}
    </span>
  );
}

// — De handtekening: kop met acid-blok dat er versprongen achter zit (overprint) —
function OffsetTitle({
  children,
  className = "",
  as: Tag = "h1",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <span className="relative inline-block">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 -z-0 h-full w-full"
        style={{ background: C.accent, transform: "translate(6px, 6px)" }}
      />
      <Tag
        className={`relative z-10 font-extrabold leading-[0.98] tracking-[-0.02em] ${className}`}
        style={{ color: C.ink }}
      >
        {children}
      </Tag>
    </span>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "accent" | "line";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const style: React.CSSProperties =
    variant === "accent"
      ? { background: C.accent, color: C.accentInk, border: BORD }
      : variant === "line"
        ? { background: C.card, color: C.ink, border: BORD }
        : { background: C.ink, color: C.card, border: BORD };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-none font-extrabold uppercase tracking-[0.04em] transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0b09] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f1e9] ${pad} ${className}`}
      style={{ ...style, ...grotesk }}
    >
      {children}
    </button>
  );
}

function StatusChip({ tone }: { tone: Tone }) {
  const style: React.CSSProperties =
    tone.kind === "solid"
      ? { background: C.ink, color: C.card, border: HAIR }
      : tone.kind === "accent"
        ? { background: C.accent, color: C.ink, border: HAIR }
        : tone.kind === "warn"
          ? { background: C.warn, color: C.card, border: HAIR }
          : { background: C.card, color: C.ink, border: HAIR };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
      style={{ ...style, ...grotesk }}
    >
      <tone.Icon size={11} aria-hidden="true" />
      {tone.label}
      {tone.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Spark als blok-staafjes, hard zwart —
function Spark({ data, warn = false }: { data: number[]; warn?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 4 + ((d - min) / span) * 18;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-1"
            style={{ height: h, background: last && warn ? C.warn : C.ink }}
          />
        );
      })}
    </span>
  );
}

// — Match: groot cijfer op accentblok + blokbalk —
function MatchBlok({ value, big = false }: { value: number; big?: boolean }) {
  const strong = value >= 90;
  return (
    <div aria-label={`Match ${value} procent`}>
      <span
        className="inline-flex items-baseline gap-0.5"
        style={{
          background: strong ? C.accent : C.card,
          border: BORD,
          padding: big ? "6px 10px" : "3px 7px",
        }}
      >
        <span
          className={`font-extrabold leading-none ${big ? "text-[26px]" : "text-[17px]"}`}
          style={{ color: C.ink, ...num }}
        >
          {value}
        </span>
        <span className="text-[10px] font-extrabold" style={{ color: C.ink }}>
          %
        </span>
      </span>
      <div className="mt-1.5 flex h-2 w-full gap-px" style={{ border: HAIR }} aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="h-full flex-1"
            style={{ background: i < Math.round(value / 10) ? C.ink : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

// — Kaart: hard omlijnd blok zonder schaduw —
function Slab({
  children,
  className = "",
  as: Tag = "div",
  fill = C.card,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  fill?: string;
}) {
  return (
    <Tag className={`rounded-none ${className}`} style={{ background: fill, border: BORD }}>
      {children}
    </Tag>
  );
}

export function Concept493() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{ ...grotesk, color: C.ink, background: C.paper }}
    >
      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <Masthead />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="gd-fade pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      <style>{`
        @keyframes gdFade { from { opacity: 0; transform: translate(-3px, 3px); } to { opacity: 1; transform: translate(0,0); } }
        .gd-fade { animation: gdFade 0.24s cubic-bezier(0.2,0.9,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .gd-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function Masthead() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pt-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center text-[18px] font-extrabold"
          style={{ background: C.accent, color: C.ink, border: BORD }}
          aria-hidden="true"
        >
          GD
        </span>
        <div>
          <p className="text-[19px] font-extrabold uppercase leading-none tracking-[-0.01em]">
            Grofdruk
          </p>
          <Kicker className="mt-1.5 opacity-70">Register voor zelfstandigen</Kicker>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 px-2 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.08em] sm:inline-flex"
          style={{ background: C.card, border: HAIR }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="inline-flex h-9 items-center gap-1.5 px-2.5 text-[11px] font-extrabold"
          style={{ background: C.card, border: HAIR }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          POST
          <span
            className="inline-flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
            style={{ background: C.warn, color: C.card }}
          >
            {ongelezen}
          </span>
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center text-[11px] font-extrabold"
          style={{ background: C.ink, color: C.card, border: HAIR }}
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
      aria-label="Hoofdnavigatie"
      className="mt-4 flex flex-wrap gap-0"
      style={{ borderTop: BORD, borderBottom: BORD }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative px-3.5 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b0b09]"
            style={{
              color: on ? C.ink : C.inkMute,
              background: on ? C.accent : "transparent",
              borderLeft: i === 0 ? "none" : HAIR,
            }}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Slab className="p-5 sm:p-7">
          <Kicker className="opacity-70">Voorpagina</Kicker>
          <OffsetTitle className="mt-3 block text-[30px] md:text-[40px]">
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </OffsetTitle>
          <p
            className="mt-5 max-w-xl text-[14px] font-medium leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            Je register is geverifieerd en op orde. Er staan verse opdrachten klaar die aansluiten
            op je profiel; één document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>
        </Slab>

        <Slab className="flex flex-col" fill={C.warn}>
          <div className="flex items-center gap-2 px-5 pt-5" style={{ color: C.card }}>
            <AlertTriangle size={15} aria-hidden="true" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em]">
              Termijn nadert
            </span>
          </div>
          <div className="flex-1 px-5 pb-5">
            <h3 className="mt-2 text-[18px] font-extrabold leading-tight" style={{ color: C.card }}>
              {primair.titel}
            </h3>
            <p
              className="mt-2 text-[13px] font-medium leading-relaxed"
              style={{ color: "#ffe7d8" }}
            >
              {primair.detail}
            </p>
            <Btn variant="accent" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
          <div className="px-5 py-4" style={{ background: C.card, borderTop: BORD }}>
            <div className="flex items-baseline justify-between">
              <Kicker className="opacity-70">Dossier op orde</Kicker>
              <span className="text-[22px] font-extrabold leading-none" style={{ ...num }}>
                {ratio}%
              </span>
            </div>
            <div
              className="mt-2 flex h-3 w-full gap-px"
              style={{ border: HAIR }}
              aria-hidden="true"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className="h-full flex-1"
                  style={{ background: i < Math.round(ratio / 10) ? C.ink : "transparent" }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] font-semibold" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </div>
        </Slab>
      </section>

      {/* KPI-raster */}
      <section className="grid grid-cols-2 gap-0 sm:grid-cols-4" style={{ border: BORD }}>
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="p-4"
            style={{
              background: C.card,
              borderLeft: i % 4 !== 0 ? HAIR : "none",
              borderTop: i >= 2 ? HAIR : "none",
            }}
          >
            <Kicker className="text-[10px] opacity-70">{k.label}</Kicker>
            <p className="mt-1.5 text-[24px] font-extrabold leading-none" style={{ ...num }}>
              {k.value}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-extrabold"
                style={{ background: k.up ? C.ink : C.warn, color: C.card, ...num }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <Spark data={k.spark} warn={!k.up} />
            </div>
          </div>
        ))}
      </section>

      {/* Aanbevolen opdrachten */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Kicker className="opacity-70">Aanbevolen</Kicker>
            <OffsetTitle as="h2" className="mt-2 block text-[20px]">
              Opdrachten voor jou
            </OffsetTitle>
          </div>
          <Btn variant="line" size="sm" onClick={onMarkt}>
            Alles
          </Btn>
        </div>
        <Slab>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : HAIR }}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </Slab>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#dcf72b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b0b09]"
    >
      <span className="w-20 shrink-0">
        <MatchBlok value={opdracht.match} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold leading-snug">
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] font-semibold"
          style={{ color: C.inkMute }}
        >
          <MapPin size={11} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[14px] font-extrabold" style={{ ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span
          className="text-[9px] font-extrabold uppercase tracking-[0.1em]"
          style={{ color: C.inkMute }}
        >
          /uur
        </span>
      </span>
      <ArrowRight
        size={17}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-1"
      />
    </button>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <Kicker className="opacity-70">Marktplaats</Kicker>
        <OffsetTitle className="mt-2 block text-[26px]">Opdrachten die passen</OffsetTitle>
        <p
          className="mt-3 text-[12.5px] font-bold uppercase tracking-[0.06em]"
          style={{ color: C.inkMute }}
        >
          {filtered.length} / {OPDRACHTEN.length} treffers op je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3 py-2.5"
          style={{ background: C.card, border: BORD }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK OPDRACHTEN…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] font-bold uppercase tracking-[0.04em] outline-none placeholder:text-[#5c5a50]"
            style={{ color: C.ink, ...grotesk }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#0b0b09] hover:text-[#faf8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0b09]"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "accent" : "line"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Slab className="flex flex-col items-center px-6 py-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ background: C.accent, border: BORD }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="mt-4 text-[20px] font-extrabold uppercase">Geen treffers</p>
          <p className="mt-1.5 max-w-sm text-[13px] font-medium" style={{ color: C.inkSoft }}>
            {q ? `“${q}” levert niets op.` : "Je zoekterm levert niets op."} Verruim je
            zoekopdracht.
          </p>
          <Btn variant="solid" size="sm" className="mt-4" onClick={() => setQ("")}>
            Zoekterm wissen
          </Btn>
        </Slab>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <Slab as="article">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <span className="w-full shrink-0 sm:w-28">
          <MatchBlok value={opdracht.match} big />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em]"
              style={{ background: strong ? C.accent : C.ink, color: strong ? C.ink : C.card }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span
              className="text-[11px] font-extrabold uppercase tracking-[0.06em]"
              style={{ color: C.inkMute }}
            >
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-extrabold leading-snug">{opdracht.titel}</h3>
          <p className="mt-0.5 text-[12px] font-semibold" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.04em]"
                style={{ background: C.card, border: HAIR }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-left sm:text-right">
          <span className="block text-[17px] font-extrabold" style={{ ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-extrabold uppercase tracking-[0.1em]"
            style={{ color: C.inkMute }}
          >
            per uur
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ borderTop: BORD }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0b09]"
        >
          <span
            className="inline-flex h-4 w-4 items-center justify-center text-[11px]"
            style={{ background: open ? C.accent : "transparent", border: HAIR }}
            aria-hidden="true"
          >
            {open ? "−" : "+"}
          </span>
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-200 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2" style={{ borderTop: BORD }}>
            <RedenKolom
              titel="In je voordeel"
              Icon={Check}
              items={opdracht.redenen.plus}
              warn={false}
            />
            <RedenKolom
              titel="Goed om te weten"
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              warn
            />
          </div>
        </div>
      </div>
    </Slab>
  );
}

function RedenKolom({
  titel,
  Icon,
  items,
  warn,
}: {
  titel: string;
  Icon: LucideIcon;
  items: string[];
  warn: boolean;
}) {
  return (
    <div>
      <p
        className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
        style={{ background: warn ? C.warn : C.ink, color: C.card }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px] font-medium leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1 h-2 w-2 shrink-0"
              style={{ background: warn ? C.warn : C.ink }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-6">
      <Btn variant="line" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
      </Btn>

      <Slab className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-extrabold uppercase tracking-[0.08em]"
            style={{ color: C.inkMute }}
          >
            {opdracht.id}
          </span>
          <span
            className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em]"
            style={{ background: strong ? C.accent : C.ink, color: strong ? C.ink : C.card }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <OffsetTitle className="mt-3 block max-w-2xl text-[27px] md:text-[36px]">
          {opdracht.titel}
        </OffsetTitle>
        <p
          className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: C.inkSoft }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="accent">Bewaren</Btn>
        </div>
      </Slab>

      <div className="grid grid-cols-2 gap-0 sm:grid-cols-4" style={{ border: BORD }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="p-4"
            style={{
              background: C.card,
              borderLeft: i % 4 !== 0 ? HAIR : "none",
              borderTop: i >= 2 ? HAIR : "none",
            }}
          >
            <Kicker className="text-[10px] opacity-70">{m.l}</Kicker>
            <p className="mt-1.5 text-[18px] font-extrabold" style={{ ...num }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <Kicker className="opacity-70">Motivering</Kicker>
        <OffsetTitle as="h2" className="mt-2 block text-[20px]">
          Waarom deze match past
        </OffsetTitle>
        <p
          className="mb-4 mt-3 max-w-xl text-[13px] font-medium leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Slab className="p-4">
            <p
              className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
              style={{ background: C.ink, color: C.card }}
            >
              <Check size={12} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </Slab>
          <Slab className="p-4">
            <p
              className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
              style={{ background: C.warn, color: C.card }}
            >
              <AlertTriangle size={12} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Slab>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Kicker className="opacity-70">Vertrouwensregister</Kicker>
          <OffsetTitle className="mt-2 block text-[26px]">{PROFIEL.trust}</OffsetTitle>
          <p
            className="mt-4 max-w-lg text-[13px] font-medium leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Documenten worden versleuteld
            bewaard en enkel met jouw toestemming gedeeld.
          </p>
        </div>
        <Slab className="p-4" fill={C.accent}>
          <div className="flex items-baseline justify-between">
            <span className="text-[42px] font-extrabold leading-none" style={{ ...num }}>
              {ratio}%
            </span>
            <Kicker>Op orde</Kicker>
          </div>
          <div className="mt-3 flex h-4 w-full gap-px" style={{ border: BORD }} aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className="h-full flex-1"
                style={{ background: i < Math.round(ratio / 10) ? C.ink : "transparent" }}
              />
            ))}
          </div>
        </Slab>
      </section>

      <section>
        <Kicker className="opacity-70">Certificaten</Kicker>
        <OffsetTitle as="h2" className="mb-3 mt-2 block text-[20px]">
          Documentregister
        </OffsetTitle>
        <Slab>
          <ul>
            {CREDENTIALS.map((c, i) => {
              const t = credTone(c.status);
              const isOpen = open === c.naam;
              return (
                <li key={c.naam} style={{ borderTop: i === 0 ? "none" : BORD }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[#eeece3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b0b09]"
                  >
                    <t.Icon size={17} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-extrabold">{c.naam}</span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px] font-semibold"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusChip tone={t} />
                    </span>
                    <span
                      className="text-[16px] font-extrabold transition-transform motion-reduce:transition-none"
                      style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-200 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 sm:pl-[46px]">
                        <div className="mb-3 sm:hidden">
                          <StatusChip tone={t} />
                        </div>
                        <p
                          className="max-w-xl text-[12.5px] font-medium leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm" variant={t.kind === "accent" ? "accent" : "solid"}>
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="line">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Slab>
      </section>

      <section>
        <Kicker className="opacity-70">Documentenkast</Kicker>
        <OffsetTitle as="h2" className="mb-3 mt-2 block text-[20px]">
          Dossier
        </OffsetTitle>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2" style={{ border: BORD }}>
          {DOCUMENTEN.map((d, i) => {
            const t = credTone(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 p-3"
                style={{
                  background: C.card,
                  borderTop: i >= 2 ? HAIR : "none",
                  borderLeft: i % 2 !== 0 ? HAIR : "none",
                }}
              >
                <FileText size={16} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold">{d.naam}</span>
                  <span className="block text-[10.5px] font-semibold" style={{ color: C.inkMute }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusChip tone={t} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Kicker className="opacity-70">Takenlijst</Kicker>
        <OffsetTitle className="mt-2 block text-[26px]">Wat je aandacht vraagt</OffsetTitle>
        <p
          className="mt-3 max-w-md text-[12.5px] font-bold uppercase tracking-[0.06em]"
          style={{ color: C.inkMute }}
        >
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Slab
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start"
                fill={warn ? C.warn : C.card}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-[16px] font-extrabold"
                  style={{
                    background: warn ? C.card : C.ink,
                    color: warn ? C.ink : C.card,
                    border: HAIR,
                    ...num,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em]"
                    style={{ background: warn ? C.ink : C.accent, color: warn ? C.card : C.ink }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-2 text-[17px] font-extrabold leading-snug"
                    style={{ color: warn ? C.card : C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[12.5px] font-medium leading-relaxed"
                    style={{ color: warn ? "#ffe7d8" : C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "accent" : "solid"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Slab>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurStyle(status: string): React.CSSProperties {
  if (status === "Betaald") return { background: C.ink, color: C.card };
  if (status === "Openstaand") return { background: C.warn, color: C.card };
  return { background: C.card, color: C.ink, border: HAIR };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Kicker className="opacity-70">Grootboek</Kicker>
          <OffsetTitle className="mt-2 block text-[26px]">Je facturen</OffsetTitle>
        </div>
        <Btn variant="accent">+ Nieuwe factuur</Btn>
      </div>

      <section className="grid grid-cols-1 gap-0 sm:grid-cols-3" style={{ border: BORD }}>
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", fill: C.card },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", fill: C.warn, invert: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", fill: C.card },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-4"
            style={{
              background: s.fill,
              borderLeft: i !== 0 ? HAIR : "none",
              color: s.invert ? C.card : C.ink,
            }}
          >
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.12em]"
              style={{ opacity: 0.75 }}
            >
              {s.l}
            </span>
            <p className="mt-1 text-[24px] font-extrabold" style={{ ...num }}>
              {s.v}
            </p>
            <p
              className="mt-0.5 text-[11px] font-semibold"
              style={{ opacity: s.invert ? 0.85 : 0.7 }}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "accent" : "line"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <div className="overflow-x-auto" style={{ border: BORD }}>
        <table className="w-full min-w-[540px] text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ background: C.ink }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em]"
                  style={{ color: C.card }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => (
              <tr
                key={f.nr}
                className="transition-colors hover:bg-[#eeece3]"
                style={{ background: C.card, borderTop: i === 0 ? "none" : HAIR }}
              >
                <td
                  className="px-4 py-3 text-[12px] font-bold"
                  style={{ color: C.inkSoft, ...num }}
                >
                  {f.nr}
                </td>
                <td className="px-4 py-3 text-[13px] font-extrabold">{f.klant}</td>
                <td
                  className="px-4 py-3 text-[12px] font-bold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </td>
                <td className="px-4 py-3 text-[13px] font-extrabold" style={{ ...num }}>
                  {f.bedrag}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.06em]"
                    style={factuurStyle(f.status)}
                  >
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
