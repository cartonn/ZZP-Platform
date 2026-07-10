"use client";

// Concept 236 — "Ukiyo-e" · Japanse houtblokdruk.
// Direction: the woodblock print as interface. Flat colour fields (no gradients inside data blocks),
// fine outline lines as if carved from wood, and a recurring wave/mountain motif drawn with inline SVG
// (a stylised Hokusai-like wave and a mountain silhouette used as section bands / background accents).
// Fine key-line borders in deep indigo. Headings in Shippori Mincho, body in Inter. Calm, layered,
// unmistakably Japanese-inspired — but a fully working dashboard.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  Search,
  ArrowLeft,
  MapPin,
  CalendarDays,
  Banknote,
  Timer,
  Bookmark,
  Send,
  ShieldCheck,
  FileText,
  Bell,
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

// Woodblock palette — rice-paper ground, aizuri indigo ink, vermilion, mustard-ochre, sea-green.
const C = {
  paper: "#efe7d6",
  paperDeep: "#e6dcc6",
  panel: "#f6f0e2",
  indigo: "#1f2a3a",
  indigoSoft: "#3c4a5e",
  muted: "#6d6656",
  vermilion: "#c0392b",
  vermWash: "rgba(192,57,43,0.10)",
  mustard: "#d0a24a",
  mustardDeep: "#a97e2c",
  mustardWash: "rgba(208,162,74,0.16)",
  sea: "#6b8f8a",
  seaDeep: "#4f716c",
  seaWash: "rgba(107,143,138,0.16)",
  line: "rgba(31,42,58,0.28)",
  lineSoft: "rgba(31,42,58,0.14)",
};

const mincho: CSSProperties = { fontFamily: "var(--font-lab-shippori)" };
const body: CSSProperties = { fontFamily: "var(--font-lab-inter)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; wash: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.seaDeep, wash: C.seaWash };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.mustardDeep, wash: C.mustardWash };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.vermilion,
        wash: C.vermWash,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.vermilion, wash: C.vermWash };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, wash } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium"
      style={{ ...body, color: fg, background: wash, border: `1px solid ${fg}44` }}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

// The signature wave band — a stylised Hokusai-like seigaiha/wave motif as a section divider.
function WaveBand({ tone = C.indigo }: { tone?: string }) {
  return (
    <div className="my-6 overflow-hidden" aria-hidden="true">
      <svg
        width="100%"
        height="26"
        viewBox="0 0 480 26"
        preserveAspectRatio="none"
        className="block"
      >
        <path
          d="M0 22 C 30 6, 60 6, 90 22 C 120 6, 150 6, 180 22 C 210 6, 240 6, 270 22 C 300 6, 330 6, 360 22 C 390 6, 420 6, 450 22 C 465 14, 475 14, 480 20"
          fill="none"
          stroke={tone}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M0 25 C 30 12, 60 12, 90 25 C 120 12, 150 12, 180 25 C 210 12, 240 12, 270 25 C 300 12, 330 12, 360 25 C 390 12, 420 12, 450 25 C 465 19, 475 19, 480 24"
          fill="none"
          stroke={tone}
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// A layered mountain (Fuji-like) silhouette used as a quiet header accent.
function MountainAccent({ className }: { className?: string }) {
  return (
    <svg width="160" height="72" viewBox="0 0 160 72" className={className} aria-hidden="true">
      <path d="M0 72 L58 14 C 63 9, 71 9, 76 14 L134 72 Z" fill={C.indigo} opacity="0.10" />
      <path d="M40 72 L96 20 C 100 16, 106 16, 110 20 L160 72 Z" fill={C.sea} opacity="0.22" />
      <path
        d="M58 14 C 63 9, 71 9, 76 14 L86 24 L78 22 L72 27 L66 22 L58 24 Z"
        fill={C.paper}
        opacity="0.9"
      />
    </svg>
  );
}

// A woodblock panel: flat fill, fine indigo key-line, subtle offset key-line for the "carved" feel.
function Block({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`relative ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: `2px 2px 0 ${C.lineSoft}`,
      }}
    >
      {children}
    </section>
  );
}

function Overline({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em]"
      style={{ ...body, color: C.vermilion }}
    >
      <span className="h-px w-6" style={{ background: C.vermilion }} aria-hidden="true" />
      {children}
    </span>
  );
}

// Vermilion seal / hanko-style square marker holding a single character.
function Seal({ char }: { char: string }) {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center text-[15px] leading-none"
      style={{ ...mincho, background: C.vermilion, color: C.paper, borderRadius: 3 }}
      aria-hidden="true"
    >
      {char}
    </span>
  );
}

function SectionTitle({ seal, children }: { seal: string; children: ReactNode }) {
  return (
    <h2
      className="flex items-center gap-2.5 text-[22px] font-semibold leading-none tracking-[-0.01em]"
      style={{ ...mincho, color: C.indigo }}
    >
      <Seal char={seal} />
      {children}
    </h2>
  );
}

// Flat-fill bar sparkline — woodblock bars rather than a smooth line.
function BarSpark({ points, tone }: { points: number[]; tone: string }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 104;
  const h = 30;
  const n = points.length;
  const bw = (w / n) * 0.62;
  const gap = (w / n) * 0.38;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {points.map((p, i) => {
        const bh = 4 + ((p - min) / span) * (h - 6);
        const x = i * (bw + gap) + gap / 2;
        return (
          <rect
            key={i}
            x={x}
            y={h - bh}
            width={bw}
            height={bh}
            fill={tone}
            opacity={i === n - 1 ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}

type LoadState = "loaded" | "loading" | "empty" | "error";

export function Concept236() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...body,
        color: C.indigo,
        background: `
          radial-gradient(140% 120% at 100% 0%, rgba(107,143,138,0.10) 0%, rgba(107,143,138,0) 42%),
          ${C.paper}`,
      }}
    >
      <header
        className="relative overflow-hidden px-5 py-5 md:px-8"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <MountainAccent className="pointer-events-none absolute -right-2 bottom-0 opacity-90" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.indigo, borderRadius: 4 }}
              aria-hidden="true"
            >
              <ShieldCheck size={20} style={{ color: C.paper }} />
            </span>
            <div className="leading-tight">
              <span className="block text-[22px] font-semibold tracking-[-0.01em]" style={mincho}>
                浮世 · Ukiyo-e
              </span>
              <span
                className="block text-[10.5px] uppercase tracking-[0.3em]"
                style={{ color: C.muted }}
              >
                Werkboek voor vakmensen
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium sm:inline-flex"
              style={{ background: C.seaWash, color: C.seaDeep, borderRadius: 3 }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
              style={{
                ...mincho,
                background: C.paperDeep,
                border: `1px solid ${C.line}`,
                color: C.indigo,
                borderRadius: 3,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
      </header>

      <nav
        className="flex items-center gap-1 overflow-x-auto px-3 md:px-6"
        style={{ borderBottom: `1px solid ${C.line}` }}
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-3.5 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mincho, color: on ? C.indigo : C.muted, fontWeight: on ? 600 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-3 -bottom-px h-[3px]"
                  style={{ background: C.vermilion }}
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
          <OpdrachtDetail
            opdracht={OPDRACHTEN[0] as Opdracht}
            onBack={() => setScreen("marktplaats")}
          />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      <footer className="mx-auto max-w-5xl px-5 pb-10 md:px-8">
        <WaveBand />
        <p
          className="text-center text-[13px] tracking-[0.14em]"
          style={{ ...mincho, color: C.muted }}
        >
          — Met vakmanschap gedrukt te {PROFIEL.plaats} —
        </p>
      </footer>
    </div>
  );
}

function KpiRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((k, i) => {
        const tone = i === 0 ? C.sea : i === 1 ? C.mustard : i === 2 ? C.seaDeep : C.vermilion;
        return (
          <Block key={k.label} className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              {k.label}
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-[28px] font-semibold tabular-nums leading-none" style={mincho}>
                {k.value}
              </span>
              <BarSpark points={k.spark} tone={tone} />
            </div>
            <div className="mt-1.5 text-[12px]" style={{ color: k.up ? C.seaDeep : C.vermilion }}>
              {k.up ? "▲" : "▼"} {k.trend}
            </div>
          </Block>
        );
      })}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const naam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <Overline>Werkboek</Overline>
      <h1
        className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.01em]"
        style={mincho}
      >
        Welkom terug, {naam}
      </h1>
      <p className="mt-1 max-w-2xl text-[14px]" style={{ color: C.indigoSoft }}>
        Uw werk als een houtdruk in lagen — matches, verificaties en facturen, rustig geordend.
      </p>

      <WaveBand tone={C.sea} />
      <KpiRow />

      <WaveBand />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Block className="p-5 md:p-6">
          <SectionTitle seal="事">Beste volgende acties</SectionTitle>
          <ul className="mt-4 space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <li key={a.titel} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center"
                    style={{
                      background: warn ? C.vermWash : C.seaWash,
                      color: warn ? C.vermilion : C.seaDeep,
                      borderRadius: 3,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={15} /> : <Bell size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold" style={mincho}>
                      {a.titel}
                    </p>
                    <p className="text-[13px]" style={{ color: C.indigoSoft }}>
                      {a.detail}
                    </p>
                    <button
                      onClick={onOpen}
                      className="mt-1 text-[13px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: C.vermilion }}
                    >
                      {a.cta} →
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Block>
        <BerichtenPaneel />
      </div>

      <WaveBand tone={C.mustardDeep} />
      <Block className="p-5 md:p-6">
        <SectionTitle seal="書">Documentenkast</SectionTitle>
        <div className="mt-4 space-y-2">
          {DOCUMENTEN.map((d) => (
            <div
              key={d.naam}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
              style={{ background: C.paper, border: `1px solid ${C.lineSoft}`, borderRadius: 3 }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText size={18} style={{ color: C.seaDeep }} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium" style={mincho}>
                    {d.naam}
                  </p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {d.type} · {d.grootte} · bijgewerkt {d.bijgewerkt}
                  </p>
                </div>
              </div>
              <StatusChip status={d.status} />
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}

function BerichtenPaneel() {
  const [state, setState] = useState<LoadState>("loaded");
  return (
    <Block className="p-5 md:p-6">
      <SectionTitle seal="文">Berichten</SectionTitle>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Weergavestaat">
        {(["loaded", "loading", "empty", "error"] as LoadState[]).map((st) => (
          <button
            key={st}
            onClick={() => setState(st)}
            aria-pressed={state === st}
            className="px-2.5 py-1 text-[11.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: state === st ? C.indigo : C.paperDeep,
              color: state === st ? C.paper : C.indigoSoft,
              borderRadius: 3,
            }}
          >
            {st === "loaded"
              ? "Data"
              : st === "loading"
                ? "Laden"
                : st === "empty"
                  ? "Leeg"
                  : "Fout"}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {state === "loading" && (
          <ul className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="h-9 w-9 shrink-0"
                  style={{ background: C.paperDeep, borderRadius: 3 }}
                  aria-hidden="true"
                />
                <span className="flex-1 space-y-1.5">
                  <span
                    className="block h-3 w-1/3"
                    style={{ background: C.paperDeep }}
                    aria-hidden="true"
                  />
                  <span
                    className="block h-3 w-3/4"
                    style={{ background: C.paperDeep }}
                    aria-hidden="true"
                  />
                </span>
              </li>
            ))}
          </ul>
        )}

        {state === "empty" && (
          <div
            className="px-4 py-8 text-center"
            style={{ border: `1px dashed ${C.line}`, borderRadius: 3 }}
          >
            <Send size={22} style={{ color: C.sea }} aria-hidden="true" className="mx-auto" />
            <p className="mt-2 text-[16px] font-semibold" style={mincho}>
              Nog geen berichten
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
              Reageer op een opdracht om een gesprek te openen.
            </p>
          </div>
        )}

        {state === "error" && (
          <div
            className="px-4 py-6"
            style={{
              background: C.vermWash,
              border: `1px solid ${C.vermilion}44`,
              borderRadius: 3,
            }}
          >
            <p
              className="flex items-center gap-1.5 text-[15px] font-semibold"
              style={{ ...mincho, color: C.vermilion }}
            >
              <XCircle size={16} aria-hidden="true" /> Berichten laden mislukt
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.indigoSoft }}>
              Kon het gesprek niet ophalen. Controleer uw verbinding en probeer opnieuw.
            </p>
            <button
              onClick={() => setState("loaded")}
              className="mt-3 px-3 py-1.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.vermilion, color: C.paper, borderRadius: 3 }}
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        {state === "loaded" && (
          <ul className="space-y-1">
            {BERICHTEN.map((b) => (
              <li
                key={b.van}
                className="flex items-start gap-3 px-2 py-2 transition-colors hover:bg-[var(--hov)]"
                style={{ ["--hov" as string]: C.paper, borderRadius: 3 }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-[12px] font-semibold"
                  style={{
                    ...mincho,
                    background: C.seaWash,
                    color: C.seaDeep,
                    border: `1px solid ${C.sea}55`,
                    borderRadius: 3,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold" style={mincho}>
                      {b.van}
                    </span>
                    <span className="shrink-0 text-[11.5px]" style={{ color: C.muted }}>
                      {b.tijd}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 flex items-center gap-1.5 truncate text-[13px]"
                    style={{ color: b.ongelezen ? C.indigo : C.muted }}
                  >
                    {b.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0"
                        style={{ background: C.vermilion, borderRadius: 3 }}
                        aria-hidden="true"
                      />
                    )}
                    {b.preview}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Block>
  );
}

function MatchMark({ value }: { value: number }) {
  return (
    <span className="inline-flex flex-col items-center" aria-hidden="true">
      <span
        className="flex h-11 w-11 items-center justify-center text-[13px] font-semibold"
        style={{
          ...mincho,
          background: value >= 90 ? C.seaWash : C.mustardWash,
          color: value >= 90 ? C.seaDeep : C.mustardDeep,
          border: `1px solid ${value >= 90 ? C.sea : C.mustard}66`,
          borderRadius: 4,
        }}
      >
        {value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
        match
      </span>
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return OPDRACHTEN;
    return OPDRACHTEN.filter((o) =>
      [o.titel, o.opdrachtgever, o.plaats, ...o.tags].join(" ").toLowerCase().includes(t),
    );
  }, [q]);

  return (
    <div>
      <Overline>Marktplaats</Overline>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight" style={mincho}>
        Passende opdrachten
      </h1>

      <div
        className="mt-4 flex items-center gap-2 px-3 py-2"
        style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 3 }}
      >
        <Search size={18} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[color:var(--ph)]"
          style={{ ...body, color: C.indigo, ["--ph" as string]: C.muted }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="px-2 py-0.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.vermilion }}
          >
            Wissen
          </button>
        )}
      </div>

      <WaveBand />

      {results.length === 0 ? (
        <div
          className="px-6 py-12 text-center"
          style={{ border: `1px dashed ${C.line}`, borderRadius: 3 }}
        >
          <Search size={26} style={{ color: C.sea }} aria-hidden="true" className="mx-auto" />
          <p className="mt-2 text-[19px] font-semibold" style={mincho}>
            Geen opdrachten voor “{q}”
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Verruim uw zoekterm of wis het filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((o) => (
            <Block key={o.id} className="p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={onOpen}
                    className="text-left text-[20px] font-semibold leading-tight tracking-[-0.01em] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ ...mincho, color: C.indigo }}
                  >
                    {o.titel}
                  </button>
                  <p className="mt-0.5 text-[13.5px]" style={{ color: C.indigoSoft }}>
                    {o.opdrachtgever}
                  </p>
                  <div
                    className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]"
                    style={{ color: C.indigoSoft }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} style={{ color: C.seaDeep }} aria-hidden="true" />{" "}
                      {o.plaats}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Banknote size={14} style={{ color: C.seaDeep }} aria-hidden="true" />{" "}
                      {o.tarief}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Timer size={14} style={{ color: C.seaDeep }} aria-hidden="true" /> {o.uren}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} style={{ color: C.seaDeep }} aria-hidden="true" />{" "}
                      {o.start}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 text-[11.5px] font-medium"
                        style={{
                          background: C.paperDeep,
                          color: C.indigo,
                          border: `1px solid ${C.line}`,
                          borderRadius: 3,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <MatchMark value={o.match} />
                  <button
                    onClick={() => setSaved((s) => ({ ...s, [o.id]: !s[o.id] }))}
                    aria-pressed={!!saved[o.id]}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: saved[o.id] ? C.indigo : C.paperDeep,
                      color: saved[o.id] ? C.paper : C.indigoSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: 3,
                    }}
                  >
                    <Bookmark size={13} aria-hidden="true" /> {saved[o.id] ? "Bewaard" : "Bewaar"}
                  </button>
                </div>
              </div>
            </Block>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [reageer, setReageer] = useState(false);
  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.vermilion }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>
      <h1
        className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.01em]"
        style={mincho}
      >
        {opdracht.titel}
      </h1>
      <p className="mt-1 text-[14px]" style={{ color: C.indigoSoft }}>
        {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.id}
      </p>

      <WaveBand tone={C.sea} />
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          [Banknote, "Tarief", opdracht.tarief],
          [Timer, "Inzet", opdracht.uren],
          [CalendarDays, "Start", opdracht.start],
          [MapPin, "Plaats", opdracht.plaats],
        ].map(([Icon, k, v]) => {
          const I = Icon as LucideIcon;
          return (
            <Block key={k as string} className="p-4">
              <I size={16} style={{ color: C.seaDeep }} aria-hidden="true" />
              <p
                className="mt-2 text-[11px] uppercase tracking-[0.16em]"
                style={{ color: C.muted }}
              >
                {k as string}
              </p>
              <p className="text-[17px] font-semibold" style={mincho}>
                {v as string}
              </p>
            </Block>
          );
        })}
      </div>

      <WaveBand />
      <div className="grid gap-5 md:grid-cols-2">
        <Block className="p-5">
          <SectionTitle seal="良">Waarom dit past</SectionTitle>
          <ul className="mt-4 space-y-2">
            {opdracht.redenen.plus.map((p) => (
              <li key={p} className="flex items-start gap-2 text-[14px]">
                <BadgeCheck
                  size={16}
                  style={{ color: C.seaDeep }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {p}
              </li>
            ))}
          </ul>
        </Block>
        <Block className="p-5">
          <SectionTitle seal="注">Aandachtspunten</SectionTitle>
          <ul className="mt-4 space-y-2">
            {opdracht.redenen.min.map((m) => (
              <li key={m} className="flex items-start gap-2 text-[14px]">
                <TriangleAlert
                  size={16}
                  style={{ color: C.vermilion }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {m}
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <WaveBand tone={C.mustardDeep} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setReageer((r) => !r)}
          aria-pressed={reageer}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: reageer ? C.seaDeep : C.vermilion, color: C.paper, borderRadius: 3 }}
        >
          {reageer ? (
            <BadgeCheck size={16} aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          {reageer ? "Reactie verstuurd" : "Reageer op deze opdracht"}
        </button>
        {reageer && (
          <span className="text-[13px]" style={{ color: C.seaDeep }}>
            Uw reactie is genoteerd — gemiddelde reactietijd 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const checklist = [
    "Voeg een leesbare scan (PDF of JPG) toe",
    "Controleer naam en geboortedatum",
    "Vermeld het registratienummer indien van toepassing",
    "Dien in ter beoordeling",
  ];
  const gedaan = Object.values(done).filter(Boolean).length;
  return (
    <div>
      <Overline>Verificatie</Overline>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight" style={mincho}>
        Uw bewijsstukken
      </h1>
      <p className="mt-1 max-w-2xl text-[14px]" style={{ color: C.indigoSoft }}>
        Elke beslissing wordt server-side genomen; de status hieronder is de bron van waarheid.
      </p>

      <WaveBand tone={C.sea} />
      <div className="grid gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => (
          <Block key={c.naam} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold" style={mincho}>
                  {c.naam}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusChip status={c.status} />
            </div>
          </Block>
        ))}
      </div>

      <WaveBand />
      <Block className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle seal="順">Indien-checklist</SectionTitle>
          <span className="text-[13px] font-medium" style={{ color: C.seaDeep }}>
            {gedaan}/{checklist.length} voltooid
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {checklist.map((item, i) => {
            const id = `c236-chk-${i}`;
            const on = !!done[id];
            return (
              <li key={id}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-start gap-3 px-2 py-1.5 transition-colors hover:bg-[var(--hov)]"
                  style={{ ["--hov" as string]: C.paper, borderRadius: 3 }}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={on}
                    onChange={() => setDone((d) => ({ ...d, [id]: !d[id] }))}
                    className="mt-0.5 h-4 w-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ accentColor: C.vermilion }}
                  />
                  <span
                    className="text-[14px]"
                    style={{
                      textDecoration: on ? "line-through" : "none",
                      color: on ? C.muted : C.indigo,
                    }}
                  >
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Block>
    </div>
  );
}

function Acties() {
  return (
    <div>
      <Overline>Acties</Overline>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight" style={mincho}>
        Wat vraagt om aandacht
      </h1>
      <WaveBand />
      <div className="space-y-4">
        {ACTIES.map((a) => {
          const warn = a.urgentie === "warning";
          return (
            <Block key={a.titel} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{
                      background: warn ? C.vermWash : C.seaWash,
                      color: warn ? C.vermilion : C.seaDeep,
                      borderRadius: 3,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={16} /> : <Bell size={16} />}
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold" style={mincho}>
                      {a.titel}
                    </p>
                    <p className="text-[13.5px]" style={{ color: C.indigoSoft }}>
                      {a.detail}
                    </p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: C.vermilion, color: C.paper, borderRadius: 3 }}
                >
                  {a.cta}
                </button>
              </div>
            </Block>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  return (
    <div>
      <Overline>Facturen</Overline>
      <h1 className="mt-2 text-[30px] font-semibold leading-tight" style={mincho}>
        Uw facturen
      </h1>
      <WaveBand tone={C.sea} />
      <Block className="p-5 md:p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Bedrag", "Status", "Datum"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-[11px] uppercase tracking-[0.14em]"
                    style={{ ...body, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <td className="px-3 py-3 font-medium" style={mincho}>
                    {f.nr}
                  </td>
                  <td className="px-3 py-3" style={{ color: C.indigoSoft }}>
                    {f.klant}
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums" style={mincho}>
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium"
                      style={{
                        background:
                          f.status === "Betaald"
                            ? C.seaWash
                            : f.status === "Openstaand"
                              ? C.mustardWash
                              : C.paperDeep,
                        color:
                          f.status === "Betaald"
                            ? C.seaDeep
                            : f.status === "Openstaand"
                              ? C.mustardDeep
                              : C.indigoSoft,
                        borderRadius: 3,
                      }}
                    >
                      {f.status === "Betaald" ? (
                        <BadgeCheck size={13} aria-hidden="true" />
                      ) : f.status === "Openstaand" ? (
                        <Clock size={13} aria-hidden="true" />
                      ) : (
                        <FileText size={13} aria-hidden="true" />
                      )}
                      {f.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>
    </div>
  );
}
