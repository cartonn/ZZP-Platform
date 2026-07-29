"use client";

// Concept 512 — "Grafeen" · Atomair minimalisme. Bijna-onzichtbare chrome: extreem dunne hairlines
// (1px, zeer licht), monochroom neutraal canvas, enorme witruimte. Typografie draagt alles —
// strakke klein-caps labels, tabulaire cijfers, geen kaders waar een lijn volstaat. Eén piepklein
// micro-accent (kobalt) dat uitsluitend verschijnt waar actie nodig is. Clarity tot op het bot.
// Licht thema. Status altijd met label + icoon — nooit enkel kleur.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Minus,
  Plus,
  RotateCcw,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ————————————————————————————— Palet — monochroom grafiet + micro-accent —————————————————————————————
const C = {
  paper: "#fbfbfa",
  ink: "#111112",
  inkSoft: "#3a3a3c",
  inkMute: "#77777b",
  inkFaint: "#a6a6ab",
  hair: "#ededea",
  hairSoft: "#f2f2ef",
  hairStrong: "#e0e0dc",

  accent: "#2f5cff", // micro-accent — alleen waar actie telt
  accentSoft: "rgba(47,92,255,0.08)",

  pos: "#1f7a4d",
  warn: "#9a6a10",
  info: "#2f5cff",
  neg: "#b23140",
};

const sans: CSSProperties = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num: CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: "'tnum' 1" };
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfa]";

// Klein-caps overline — het typografische werkpaard
function Overline({ children, tone = C.inkFaint }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone }}
    >
      {children}
    </span>
  );
}

// ————————————————————————————— Status-taal (label + icoon, geen chip-vlakken) —————————————————————————————
type Tone = { base: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { base: C.pos, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { base: C.info, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { base: C.warn, label: "Verloopt bijna", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { base: C.neg, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): { base: string; label: string; Icon: LucideIcon } {
  if (status === "Betaald") return { base: C.pos, label: "Betaald", Icon: Check };
  if (status === "Openstaand") return { base: C.warn, label: "Openstaand", Icon: Clock };
  if (status === "Concept") return { base: C.info, label: "Concept", Icon: Minus };
  return { base: C.neg, label: status, Icon: AlertTriangle };
}

function parseEUR(s: string): number {
  const d = s.replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
}
const eur0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// Status als tekst + icoon op de baseline — geen achtergrondvlak (hairline-filosofie)
function StatusInline({ base, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
      style={{ color: base }}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function TextBtn({
  children,
  onClick,
  primary = false,
  className = "",
  ariaLabel,
  ariaExpanded,
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`group inline-flex items-center gap-1.5 rounded-[6px] text-[13px] font-semibold transition-colors ${RING} ${className}`}
      style={{ color: primary ? C.accent : C.inkSoft, ...sans }}
    >
      {children}
    </button>
  );
}

// De enige knop met een vlak — alleen voor de primaire actie per scherm (het micro-accent verschijnt hier)
function SolidBtn({
  children,
  onClick,
  size = "md",
  full = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  size?: "sm" | "md";
  full?: boolean;
  className?: string;
}) {
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[12.5px]" : "px-4 py-2 text-[13px]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold tracking-[-0.01em] transition-all ${RING} ${pad} ${full ? "w-full" : ""} ${className}`}
      style={{ background: C.ink, color: C.paper, ...sans }}
    >
      {children}
    </button>
  );
}

// Match als dunne baseline-meter — geen ring, geen vlak, één hairline + accent-segment
function MatchLine({ value }: { value: number }) {
  const tone = value >= 90 ? C.pos : C.accent;
  return (
    <span className="block w-full" aria-label={`Match ${value} procent`}>
      <span className="flex items-baseline justify-between">
        <Overline>match</Overline>
        <span className="text-[13px] font-bold leading-none" style={{ color: C.ink, ...num }}>
          {value}
          <span className="text-[10px] font-medium" style={{ color: C.inkFaint }}>
            %
          </span>
        </span>
      </span>
      <span
        className="mt-1.5 block h-px w-full"
        style={{ background: C.hairStrong }}
        aria-hidden="true"
      >
        <span
          className="block h-px"
          style={{ width: `${value}%`, background: tone, boxShadow: `0 0 0 0.5px ${tone}` }}
        />
      </span>
    </span>
  );
}

function ScreenHead({
  index,
  title,
  sub,
  right,
}: {
  index: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="mb-8 flex flex-wrap items-end justify-between gap-4 pb-5"
      style={{ borderBottom: `1px solid ${C.hair}` }}
    >
      <div className="min-w-0">
        <span className="text-[12px] font-medium" style={{ color: C.inkFaint, ...num }}>
          {index}
        </span>
        <h1
          className="mt-1 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[34px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept512() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);
  const openOpdracht = (id: string) => {
    setSelId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.paper }}
    >
      {/* Hairline-topbalk — de enige horizontale scheiding boven de inhoud */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: `${C.paper}f5`,
          borderBottom: `1px solid ${C.hair}`,
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3.5 md:px-8">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[7px]"
              style={{ border: `1px solid ${C.hairStrong}` }}
              aria-hidden="true"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ink }} />
            </span>
            <span className="text-[14px] font-semibold tracking-[-0.02em]" style={{ color: C.ink }}>
              Grafeen
            </span>
          </div>
          <nav aria-label="Hoofdnavigatie" className="hidden flex-1 items-center gap-1 md:flex">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`relative rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium transition-colors ${RING}`}
                  style={{ color: on ? C.ink : C.inkMute }}
                >
                  {s.label}
                  {on && (
                    <span
                      className="absolute inset-x-2.5 -bottom-[15px] h-px"
                      style={{ background: C.ink }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>
          <span className="ml-auto flex items-center gap-2.5">
            <span className="hidden text-right sm:block">
              <span
                className="block text-[12.5px] font-semibold leading-none"
                style={{ color: C.ink }}
              >
                {PROFIEL.naam}
              </span>
              <span
                className="mt-0.5 inline-flex items-center gap-1 text-[10.5px]"
                style={{ color: C.pos }}
              >
                <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
              </span>
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ border: `1px solid ${C.hairStrong}`, color: C.inkSoft }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </span>
        </div>
        {/* Mobiele nav */}
        <nav aria-label="Schermen" className="flex gap-1 overflow-x-auto px-4 pb-2.5 md:hidden">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`shrink-0 rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium transition-colors ${RING}`}
                style={on ? { background: C.ink, color: C.paper } : { color: C.inkMute }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main key={screen} className="gf-fade mx-auto max-w-5xl px-5 pb-24 pt-10 md:px-8 md:pt-14">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={openOpdracht}
            onMarkt={() => setScreen("marktplaats")}
            onActies={() => setScreen("acties")}
          />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} selId={selId} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && (
          <Acties
            onMarkt={() => setScreen("marktplaats")}
            onFacturen={() => setScreen("facturen")}
          />
        )}
        {screen === "facturen" && <Facturen />}
      </main>

      <style>{`
        @keyframes gfFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .gf-fade { animation: gfFade 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .gf-row { transition: background 0.12s ease; }
        .gf-row:hover { background: ${C.hairSoft}; }
        @media (prefers-reduced-motion: reduce) { .gf-fade { animation: none !important; } .gf-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: (id: string) => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div>
      <ScreenHead
        index="00 · Overzicht"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Je register is op orde. Eén post vraagt binnenkort actie."
        right={
          <SolidBtn size="sm" onClick={onActies}>
            Volgende actie <ArrowRight size={14} aria-hidden="true" />
          </SolidBtn>
        }
      />

      {/* KPI-rij — cijfers dragen alles, gescheiden door hairlines i.p.v. kaders */}
      <section
        className="grid grid-cols-2 gap-px md:grid-cols-4"
        style={{ background: C.hair }}
        aria-label="Kerncijfers"
      >
        {KPIS.map((k) => (
          <div key={k.label} className="px-1 py-1" style={{ background: C.paper }}>
            <div className="pr-4">
              <Overline>{k.label}</Overline>
              <p
                className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.03em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <p
                className="mt-2 text-[12px] font-medium"
                style={{ color: k.up ? C.pos : C.warn, ...num }}
              >
                {k.up ? "↑" : "↓"} {k.trend}
              </p>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-[1.5fr_1fr]">
        {/* Aanbevolen opdrachten — lijst met alleen hairline-scheidingen */}
        <section>
          <div className="flex items-baseline justify-between">
            <Overline tone={C.inkMute}>Aanbevolen matches</Overline>
            <TextBtn primary onClick={onMarkt}>
              Volledige markt <ArrowRight size={13} aria-hidden="true" />
            </TextBtn>
          </div>
          <ul className="mt-4" style={{ borderTop: `1px solid ${C.hair}` }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id} style={{ borderBottom: `1px solid ${C.hair}` }}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className={`gf-row flex w-full items-center gap-5 py-4 text-left ${RING}`}
                >
                  <span className="w-16 shrink-0">
                    <MatchLine value={o.match} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[15px] font-semibold tracking-[-0.01em]"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span
                      className="block text-[14px] font-semibold"
                      style={{ color: C.ink, ...num }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <Overline>per uur</Overline>
                  </span>
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    style={{ color: C.inkFaint }}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Rechterkolom — vertrouwen + actie, tekstueel */}
        <div className="space-y-12">
          <section>
            <Overline tone={C.inkMute}>Vertrouwenssaldo</Overline>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-[44px] font-semibold leading-none tracking-[-0.03em]"
                style={{ color: C.ink, ...num }}
              >
                {ratio}
                <span className="text-[24px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </div>
            <p className="mt-2 text-[12.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd
            </p>
            <ul className="mt-5" style={{ borderTop: `1px solid ${C.hair}` }}>
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: `1px solid ${C.hair}` }}
                  >
                    <t.Icon
                      size={14}
                      aria-hidden="true"
                      style={{ color: t.base }}
                      className="shrink-0"
                    />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.inkSoft }}
                    >
                      {c.naam}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold" style={{ color: t.base }}>
                      {t.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Enige plek waar het micro-accent een vlak krijgt: de urgente actie */}
          <section
            className="rounded-[10px] p-4"
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}22` }}
          >
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle size={13} aria-hidden="true" style={{ color: C.warn }} />
              <Overline tone={C.warn}>Termijn nadert</Overline>
            </span>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <SolidBtn size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </SolidBtn>
          </section>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading";

function Marktplaats({ onOpen, selId }: { onOpen: (id: string) => void; selId: string }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("ok");
  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    ).sort((a, b) => b.match - a.match);
  }, [q]);

  return (
    <div>
      <ScreenHead
        index="01 · Marktplaats"
        title="Opdrachten die bij je passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <div
        className="mb-2 flex items-center gap-3 pb-3"
        style={{ borderBottom: `1px solid ${C.hairStrong}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[15px] outline-none"
          style={{ color: C.ink }}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Zoekterm wissen"
            className={`rounded-[6px] ${RING}`}
            style={{ color: C.inkMute }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
        <TextBtn onClick={() => setMode(mode === "loading" ? "ok" : "loading")}>
          {mode === "loading" ? "Lijst" : "Laadstaat"}
        </TextBtn>
      </div>

      {mode === "loading" ? (
        <ul aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="space-y-3 py-6" style={{ borderBottom: `1px solid ${C.hair}` }}>
              <div
                className="h-4 w-1/2 animate-pulse rounded-[3px] motion-reduce:animate-none"
                style={{ background: C.hair }}
              />
              <div
                className="h-3 w-1/3 animate-pulse rounded-[3px] motion-reduce:animate-none"
                style={{ background: C.hairSoft }}
              />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <Search size={28} aria-hidden="true" style={{ color: C.inkFaint }} />
          <p className="mt-4 text-[18px] font-semibold tracking-[-0.02em]" style={{ color: C.ink }}>
            Niets gevonden
          </p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
            Geen opdracht voor {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.
          </p>
          <TextBtn primary className="mt-5" onClick={() => setQ("")}>
            <RotateCcw size={13} aria-hidden="true" /> Zoekterm wissen
          </TextBtn>
        </div>
      ) : (
        <ul style={{ borderTop: `1px solid ${C.hair}` }}>
          {rows.map((o) => (
            <li key={o.id}>
              <MarktRij opdracht={o} onOpen={onOpen} sel={o.id === selId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktRij({
  opdracht,
  onOpen,
  sel,
}: {
  opdracht: Opdracht;
  onOpen: (id: string) => void;
  sel: boolean;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <article
      className="py-6"
      style={{
        borderBottom: `1px solid ${C.hair}`,
        borderLeft: sel ? `2px solid ${C.accent}` : "2px solid transparent",
        paddingLeft: sel ? 16 : 0,
      }}
    >
      <div className="flex items-start gap-6">
        <div className="w-20 shrink-0 pt-1">
          <MatchLine value={opdracht.match} />
          <span
            className="mt-2 inline-block text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: strong ? C.pos : C.accent }}
          >
            {strong ? "sterk" : "goed"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id}
          </span>
          <h3
            className="mt-1 text-[18px] font-semibold leading-snug tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {opdracht.tags.map((t) => (
              <span key={t} className="text-[12px]" style={{ color: C.inkSoft }}>
                <span aria-hidden="true" style={{ color: C.inkFaint }}>
                  #
                </span>
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <TextBtn onClick={() => setOpen((v) => !v)} ariaExpanded={open}>
              {open ? (
                <Minus size={13} aria-hidden="true" />
              ) : (
                <Plus size={13} aria-hidden="true" />
              )}
              Waarom deze match
            </TextBtn>
            <TextBtn primary onClick={() => onOpen(opdracht.id)}>
              Bekijken <ArrowRight size={13} aria-hidden="true" />
            </TextBtn>
          </div>
          <div
            className="grid transition-all duration-300 motion-reduce:transition-none"
            style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div
                className="mt-4 grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2"
                style={{ borderTop: `1px solid ${C.hair}` }}
              >
                <RedenKolom
                  titel="In je voordeel"
                  tone={C.pos}
                  Icon={Check}
                  items={opdracht.redenen.plus}
                />
                <RedenKolom
                  titel="Goed om te weten"
                  tone={C.warn}
                  Icon={AlertTriangle}
                  items={opdracht.redenen.min}
                />
              </div>
            </div>
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <Overline>per uur</Overline>
        </span>
      </div>
    </article>
  );
}

function RedenKolom({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <span className="inline-flex items-center gap-1.5">
        <Icon size={12} aria-hidden="true" style={{ color: tone }} />
        <Overline tone={tone}>{titel}</Overline>
      </span>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-px w-2 shrink-0"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div>
      <TextBtn onClick={onBack} className="mb-8">
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </TextBtn>

      <span className="text-[12px] font-medium" style={{ color: C.inkFaint, ...num }}>
        {opdracht.id} ·{" "}
        <span style={{ color: strong ? C.pos : C.accent }}>
          {strong ? "sterke match" : "goede match"} {opdracht.match}%
        </span>
      </span>
      <h1
        className="mt-2 max-w-3xl text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[40px]"
        style={{ color: C.ink }}
      >
        {opdracht.titel}
      </h1>
      <p className="mt-3 text-[15px]" style={{ color: C.inkMute }}>
        {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
        {opdracht.tags.map((t) => (
          <span key={t} className="text-[12.5px]" style={{ color: C.inkSoft }}>
            <span aria-hidden="true" style={{ color: C.inkFaint }}>
              #
            </span>
            {t}
          </span>
        ))}
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        <SolidBtn>
          Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
        </SolidBtn>
        <TextBtn>Bewaren</TextBtn>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: C.hair }}>
        {feiten.map((m) => (
          <div key={m.l} className="py-1" style={{ background: C.paper }}>
            <div className="pr-4">
              <Overline>{m.l}</Overline>
              <p
                className="mt-2.5 text-[24px] font-semibold leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
              <p className="mt-1.5 text-[11px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <Overline tone={C.inkMute}>Motivering — navolgbaar, zonder verborgen score</Overline>
        <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={C.pos}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenKolom
            titel="Goed om te weten"
            tone={C.warn}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div>
      <ScreenHead
        index="03 · Verificatie"
        title="Vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <p
              className="text-[40px] font-semibold leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...num }}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.inkFaint }}>
                %
              </span>
            </p>
            <Overline>op orde</Overline>
          </div>
        }
      />

      <ul style={{ borderTop: `1px solid ${C.hair}` }}>
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam} style={{ borderBottom: `1px solid ${C.hair}` }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-4 py-4 text-left ${RING}`}
              >
                <t.Icon
                  size={16}
                  aria-hidden="true"
                  style={{ color: t.base }}
                  className="shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[15px] font-semibold tracking-[-0.01em]"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[12.5px]"
                    style={{ color: t.alarm ? t.base : C.inkMute }}
                  >
                    {c.detail}
                  </span>
                </span>
                <span className="hidden sm:inline-flex">
                  <StatusInline {...t} />
                </span>
                <Plus
                  size={15}
                  aria-hidden="true"
                  style={{
                    color: C.inkFaint,
                    transform: isOpen ? "rotate(45deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                  className="shrink-0"
                />
              </button>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="pb-5 sm:pl-8">
                    <span className="mb-2 inline-flex sm:hidden">
                      <StatusInline {...t} />
                    </span>
                    <p
                      className="max-w-xl text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                      toestemming gedeeld met een opdrachtgever.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <SolidBtn size="sm">
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw indienen"
                            : "Bekijken"}
                      </SolidBtn>
                      <TextBtn>Historie</TextBtn>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div>
      <ScreenHead
        index="04 · Acties"
        title="Wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie — werk van boven naar beneden."
      />
      <ol style={{ borderTop: `1px solid ${C.hair}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li
              key={a.titel}
              className="flex items-start gap-5 py-6"
              style={{ borderBottom: `1px solid ${C.hair}` }}
            >
              <span
                className="w-8 shrink-0 pt-0.5 text-[18px] font-semibold"
                style={{ color: C.inkFaint, ...num }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5">
                  {warn ? (
                    <AlertTriangle size={12} aria-hidden="true" style={{ color: tone }} />
                  ) : (
                    <Clock size={12} aria-hidden="true" style={{ color: tone }} />
                  )}
                  <Overline tone={tone}>{warn ? "Urgent" : "Aanbevolen"}</Overline>
                </span>
                <h2
                  className="mt-2 text-[18px] font-semibold leading-snug tracking-[-0.02em]"
                  style={{ color: C.ink }}
                >
                  {a.titel}
                </h2>
                <p
                  className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                  style={{ color: C.inkSoft }}
                >
                  {a.detail}
                </p>
                <div className="mt-3">
                  {warn ? (
                    <SolidBtn
                      size="sm"
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </SolidBtn>
                  ) : (
                    <TextBtn
                      primary
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </TextBtn>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");
  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand") };
  }, []);
  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div>
      <ScreenHead
        index="05 · Facturen"
        title="Je facturen"
        sub="Selecteer een regel voor de details."
        right={
          <SolidBtn size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </SolidBtn>
        }
      />

      <section
        className="mb-12 grid grid-cols-2 gap-px"
        style={{ background: C.hair }}
        aria-label="Totalen"
      >
        <div className="py-1" style={{ background: C.paper }}>
          <Overline>Betaald</Overline>
          <p
            className="mt-2.5 text-[28px] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: C.ink, ...num }}
          >
            {eur0.format(totals.betaald)}
          </p>
        </div>
        <div className="py-1 pl-4" style={{ background: C.paper }}>
          <Overline tone={C.warn}>Openstaand</Overline>
          <p
            className="mt-2.5 text-[28px] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: C.ink, ...num }}
          >
            {eur0.format(totals.open)}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 420 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.hairStrong}` }}>
                {["Nummer", "Klant", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`pb-2.5 pr-4 text-[10.5px] font-semibold uppercase tracking-[0.16em] ${i === 2 ? "text-right" : ""}`}
                    style={{ color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = factuurTone(f.status);
                const on = f.nr === sel;
                return (
                  <tr
                    key={f.nr}
                    className={`gf-row cursor-pointer ${RING}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={on}
                    onClick={() => setSel(f.nr)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSel(f.nr);
                      }
                    }}
                    style={{
                      borderBottom: `1px solid ${C.hair}`,
                      boxShadow: on ? `inset 2px 0 0 ${C.accent}` : "none",
                    }}
                  >
                    <td
                      className="py-3.5 pr-4 text-[12.5px] font-medium"
                      style={{ color: on ? C.accent : C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="py-3.5 pr-4 text-[13.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {f.klant}
                    </td>
                    <td
                      className="py-3.5 pr-4 text-right text-[13.5px] font-semibold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="py-3.5">
                      <StatusInline {...t} alarm={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside>
            <Overline tone={C.inkMute}>Factuur</Overline>
            <p
              className="mt-2 text-[22px] font-semibold tracking-[-0.02em]"
              style={{ color: C.ink, ...num }}
            >
              {selected.nr}
            </p>
            <dl className="mt-5 space-y-3 text-[13px]">
              <div
                className="flex justify-between py-2"
                style={{ borderBottom: `1px solid ${C.hair}` }}
              >
                <dt style={{ color: C.inkMute }}>Klant</dt>
                <dd className="font-semibold" style={{ color: C.ink }}>
                  {selected.klant}
                </dd>
              </div>
              <div
                className="flex justify-between py-2"
                style={{ borderBottom: `1px solid ${C.hair}` }}
              >
                <dt style={{ color: C.inkMute }}>Datum</dt>
                <dd className="font-semibold" style={{ color: C.ink, ...num }}>
                  {selected.datum}
                </dd>
              </div>
              <div
                className="flex justify-between py-2"
                style={{ borderBottom: `1px solid ${C.hair}` }}
              >
                <dt style={{ color: C.inkMute }}>Status</dt>
                <dd>
                  <StatusInline {...factuurTone(selected.status)} alarm={false} />
                </dd>
              </div>
            </dl>
            <div
              className="mt-5 flex items-baseline justify-between pt-4"
              style={{ borderTop: `1px solid ${C.hairStrong}` }}
            >
              <Overline tone={C.inkMute}>Totaal</Overline>
              <span
                className="text-[26px] font-semibold tracking-[-0.02em]"
                style={{ color: C.ink, ...num }}
              >
                {selected.bedrag}
              </span>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <SolidBtn size="sm">
                {selected.status === "Concept"
                  ? "Versturen"
                  : selected.status === "Openstaand"
                    ? "Herinnering"
                    : "Download"}
                <ArrowRight size={13} aria-hidden="true" />
              </SolidBtn>
              <TextBtn>PDF</TextBtn>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
