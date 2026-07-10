"use client";

// Concept 235 — "Jugendstil" · Art nouveau, organische zweeplijnen.
// Direction: elegance from 1900, digitally refined. Mucha-like whiplash curves as dividers and frames,
// botanical tendrils in the corners of cards/panels (all drawn with inline SVG), ornate serif headings
// (Cormorant), thin double hairline frames with ornament corners, and a muted sage-gold palette.
// Craftsmanship that builds trust around sensitive documents — calm, symmetrical, refined.

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

// Muted sage-gold palette — warm cream, deep pine-slate ink, gold-ochre accent, soft sage.
const C = {
  cream: "#f5f1e6",
  creamDeep: "#efe9d8",
  panel: "#faf7ef",
  ink: "#26302a",
  inkSoft: "#4a564d",
  muted: "#77826f",
  gold: "#9a7b2e",
  goldDeep: "#7c6222",
  goldWash: "rgba(154,123,46,0.12)",
  sage: "#cdd6c4",
  sageDeep: "#8ea283",
  line: "rgba(38,48,42,0.20)",
  lineSoft: "rgba(38,48,42,0.10)",
  ok: "#3f6b48",
  okWash: "rgba(63,107,72,0.12)",
  warn: "#8a5a1c",
  warnWash: "rgba(138,90,28,0.12)",
  danger: "#8a2f2f",
  dangerWash: "rgba(138,47,47,0.10)",
};

const serif: CSSProperties = { fontFamily: "var(--font-lab-cormorant)" };
const body: CSSProperties = { fontFamily: "var(--font-lab-inter)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; wash: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, wash: C.okWash };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.gold, wash: C.goldWash };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, wash: C.warnWash };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, wash: C.dangerWash };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, wash } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{ ...body, color: fg, background: wash, border: `1px solid ${fg}22` }}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

// A flowing whiplash divider — the signature art-nouveau curve, drawn with beziers.
function WhiplashDivider() {
  return (
    <div className="my-6 flex items-center justify-center" aria-hidden="true">
      <svg
        width="100%"
        height="26"
        viewBox="0 0 480 26"
        preserveAspectRatio="none"
        className="max-w-[520px]"
      >
        <path
          d="M2 13 C 90 13, 120 4, 180 13 S 300 22, 360 13 S 460 4, 478 13"
          fill="none"
          stroke={C.gold}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="240" cy="13" r="3.2" fill={C.gold} />
        <circle cx="120" cy="8.5" r="1.6" fill={C.sageDeep} />
        <circle cx="360" cy="17.5" r="1.6" fill={C.sageDeep} />
      </svg>
    </div>
  );
}

// A botanical tendril for the corner of an ornate frame — mirrored via transform.
function CornerRank({ className, flip }: { className?: string; flip?: string }) {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      className={className}
      style={{ transform: flip }}
      aria-hidden="true"
    >
      <path
        d="M2 2 C 2 16, 8 22, 20 24 C 30 26, 33 32, 30 42"
        fill="none"
        stroke={C.gold}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M20 24 C 24 18, 32 16, 40 18"
        fill="none"
        stroke={C.sageDeep}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M40 18 c 4 -1 4 5 0 6 c -4 -1 -4 -5 0 -6 z"
        fill={C.goldWash}
        stroke={C.gold}
        strokeWidth="0.9"
      />
      <circle cx="30" cy="42" r="2" fill={C.gold} />
    </svg>
  );
}

// An ornate framed panel: double hairline + tendrils in the corners.
function Frame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`relative rounded-[6px] p-5 md:p-6 ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: `inset 0 0 0 3px ${C.cream}, inset 0 0 0 4px ${C.lineSoft}`,
      }}
    >
      <CornerRank className="pointer-events-none absolute left-1 top-1" />
      <CornerRank className="pointer-events-none absolute right-1 top-1" flip="scaleX(-1)" />
      <CornerRank className="pointer-events-none absolute bottom-1 left-1" flip="scaleY(-1)" />
      <CornerRank className="pointer-events-none absolute bottom-1 right-1" flip="scale(-1,-1)" />
      <div className="relative">{children}</div>
    </section>
  );
}

// A decorative drop-cap initial for headings.
function Initial({ letter }: { letter: string }) {
  return (
    <span
      className="mr-2 inline-flex h-[38px] w-[38px] items-center justify-center rounded-[4px] align-middle text-[30px] leading-none"
      style={{
        ...serif,
        color: C.gold,
        background: C.goldWash,
        border: `1px solid ${C.gold}44`,
        fontWeight: 600,
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

function Overline({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em]"
      style={{ ...body, color: C.gold }}
    >
      <span className="h-px w-6" style={{ background: C.gold }} aria-hidden="true" />
      {children}
    </span>
  );
}

function SectionTitle({ initial, children }: { initial: string; children: ReactNode }) {
  return (
    <h2
      className="flex items-center text-[28px] font-semibold leading-none tracking-[-0.01em]"
      style={{ ...serif, color: C.ink }}
    >
      <Initial letter={initial} />
      {children}
    </h2>
  );
}

function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 104;
  const h = 30;
  const last = points[points.length - 1] ?? min;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - 3 - ((p - min) / span) * (h - 6);
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
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={h - 3 - ((last - min) / span) * (h - 6)} r={2.4} fill={stroke} />
    </svg>
  );
}

type LoadState = "loaded" | "loading" | "empty" | "error";

export function Concept235() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `
          radial-gradient(120% 90% at 10% 4%, rgba(255,255,250,0.7) 0%, rgba(255,255,250,0) 46%),
          radial-gradient(90% 80% at 92% 8%, ${C.goldWash} 0%, rgba(0,0,0,0) 44%),
          ${C.cream}`,
      }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: C.goldWash, border: `1px solid ${C.gold}55` }}
            aria-hidden="true"
          >
            <ShieldCheck size={20} style={{ color: C.gold }} />
          </span>
          <div className="leading-tight">
            <span className="block text-[22px] font-semibold tracking-[-0.01em]" style={serif}>
              Jugendstil
            </span>
            <span
              className="block text-[10.5px] uppercase tracking-[0.3em]"
              style={{ color: C.muted }}
            >
              Atelier voor vakmensen
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium sm:inline-flex"
            style={{ background: C.okWash, color: C.ok }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              ...serif,
              background: C.creamDeep,
              border: `1px solid ${C.gold}55`,
              color: C.gold,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
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
              className="relative shrink-0 px-3.5 py-3.5 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...serif, color: on ? C.ink : C.muted, fontWeight: on ? 600 : 500 }}
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
        <WhiplashDivider />
        <p
          className="text-center text-[13px] tracking-[0.16em]"
          style={{ ...serif, color: C.muted }}
        >
          — Met zorg vervaardigd te {PROFIEL.plaats} —
        </p>
      </footer>
    </div>
  );
}

function KpiRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((k) => (
        <Frame key={k.label}>
          <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
            {k.label}
          </div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="text-[30px] font-semibold tabular-nums leading-none" style={serif}>
              {k.value}
            </span>
            <Sparkline points={k.spark} stroke={k.up ? C.ok : C.warn} />
          </div>
          <div className="mt-1.5 text-[12px]" style={{ color: k.up ? C.ok : C.warn }}>
            {k.up ? "▲" : "▼"} {k.trend}
          </div>
        </Frame>
      ))}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const naam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <Overline>Werkruimte</Overline>
      <h1 className="mt-2 text-[36px] font-semibold leading-tight tracking-[-0.01em]" style={serif}>
        Goedendag, {naam}
      </h1>
      <p className="mt-1 max-w-2xl text-[14px]" style={{ color: C.inkSoft }}>
        Uw atelier in één oogopslag — matches, verificaties en facturen, sierlijk geordend.
      </p>

      <WhiplashDivider />
      <KpiRow />

      <WhiplashDivider />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Frame>
          <SectionTitle initial="B">este volgende acties</SectionTitle>
          <ul className="mt-4 space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <li key={a.titel} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: warn ? C.warnWash : C.goldWash,
                      color: warn ? C.warn : C.gold,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={15} /> : <Bell size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15.5px] font-semibold" style={serif}>
                      {a.titel}
                    </p>
                    <p className="text-[13px]" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </p>
                    <button
                      onClick={onOpen}
                      className="mt-1 text-[13px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ color: C.gold }}
                    >
                      {a.cta} →
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Frame>
        <BerichtenPaneel />
      </div>

      <WhiplashDivider />
      <Frame>
        <SectionTitle initial="D">ocumentenkluis</SectionTitle>
        <div className="mt-4 space-y-2">
          {DOCUMENTEN.map((d) => (
            <div
              key={d.naam}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] px-3 py-2.5"
              style={{ background: C.cream, border: `1px solid ${C.lineSoft}` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText size={18} style={{ color: C.gold }} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium" style={serif}>
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
      </Frame>
    </div>
  );
}

function BerichtenPaneel() {
  const [state, setState] = useState<LoadState>("loaded");
  return (
    <Frame>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle initial="B">erichten</SectionTitle>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Weergavestaat">
        {(["loaded", "loading", "empty", "error"] as LoadState[]).map((st) => (
          <button
            key={st}
            onClick={() => setState(st)}
            aria-pressed={state === st}
            className="rounded-full px-2.5 py-1 text-[11.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...body,
              background: state === st ? C.gold : C.goldWash,
              color: state === st ? C.cream : C.goldDeep,
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
                  className="h-9 w-9 shrink-0 rounded-full"
                  style={{ background: C.creamDeep }}
                  aria-hidden="true"
                />
                <span className="flex-1 space-y-1.5">
                  <span
                    className="block h-3 w-1/3 rounded"
                    style={{ background: C.creamDeep }}
                    aria-hidden="true"
                  />
                  <span
                    className="block h-3 w-3/4 rounded"
                    style={{ background: C.creamDeep }}
                    aria-hidden="true"
                  />
                </span>
              </li>
            ))}
          </ul>
        )}

        {state === "empty" && (
          <div
            className="rounded-[6px] px-4 py-8 text-center"
            style={{ border: `1px dashed ${C.line}` }}
          >
            <Send size={22} style={{ color: C.sageDeep }} aria-hidden="true" className="mx-auto" />
            <p className="mt-2 text-[16px] font-semibold" style={serif}>
              Nog geen berichten
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
              Reageer op een opdracht om een gesprek te openen.
            </p>
          </div>
        )}

        {state === "error" && (
          <div
            className="rounded-[6px] px-4 py-6"
            style={{ background: C.dangerWash, border: `1px solid ${C.danger}33` }}
          >
            <p
              className="flex items-center gap-1.5 text-[15px] font-semibold"
              style={{ ...serif, color: C.danger }}
            >
              <XCircle size={16} aria-hidden="true" /> Berichten laden mislukt
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
              Kon het gesprek niet ophalen. Controleer uw verbinding en probeer opnieuw.
            </p>
            <button
              onClick={() => setState("loaded")}
              className="mt-3 rounded-full px-3 py-1.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.danger, color: C.cream }}
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
                className="flex items-start gap-3 rounded-[4px] px-2 py-2 transition-colors hover:bg-[var(--hov)]"
                style={{ ["--hov" as string]: C.cream }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    ...serif,
                    background: C.goldWash,
                    color: C.gold,
                    border: `1px solid ${C.gold}44`,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold" style={serif}>
                      {b.van}
                    </span>
                    <span className="shrink-0 text-[11.5px]" style={{ color: C.muted }}>
                      {b.tijd}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 flex items-center gap-1.5 truncate text-[13px]"
                    style={{ color: b.ongelezen ? C.ink : C.muted }}
                  >
                    {b.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.gold }}
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
    </Frame>
  );
}

function MatchRing({ value }: { value: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <span
      className="relative inline-flex h-[44px] w-[44px] items-center justify-center"
      aria-hidden="true"
    >
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke={C.lineSoft} strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={C.gold}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="absolute text-[12px] font-semibold tabular-nums" style={serif}>
        {value}
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
      <h1 className="mt-2 text-[32px] font-semibold leading-tight" style={serif}>
        Passende opdrachten
      </h1>

      <div
        className="mt-4 flex items-center gap-2 rounded-[6px] px-3 py-2"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={18} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[color:var(--ph)]"
          style={{ ...body, color: C.ink, ["--ph" as string]: C.muted }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="rounded-full px-2 py-0.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.gold }}
          >
            Wissen
          </button>
        )}
      </div>

      <WhiplashDivider />

      {results.length === 0 ? (
        <div
          className="rounded-[6px] px-6 py-12 text-center"
          style={{ border: `1px dashed ${C.line}` }}
        >
          <Search size={26} style={{ color: C.sageDeep }} aria-hidden="true" className="mx-auto" />
          <p className="mt-2 text-[19px] font-semibold" style={serif}>
            Geen opdrachten voor “{q}”
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Verruim uw zoekterm of wis het filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((o) => (
            <Frame key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={onOpen}
                    className="text-left text-[21px] font-semibold leading-tight tracking-[-0.01em] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ ...serif, color: C.ink }}
                  >
                    {o.titel}
                  </button>
                  <p className="mt-0.5 text-[13.5px]" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                  <div
                    className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} style={{ color: C.gold }} aria-hidden="true" /> {o.plaats}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Banknote size={14} style={{ color: C.gold }} aria-hidden="true" /> {o.tarief}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Timer size={14} style={{ color: C.gold }} aria-hidden="true" /> {o.uren}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} style={{ color: C.gold }} aria-hidden="true" />{" "}
                      {o.start}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                        style={{
                          background: C.sage + "55",
                          color: C.ink,
                          border: `1px solid ${C.sageDeep}55`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <MatchRing value={o.match} />
                  <button
                    onClick={() => setSaved((s) => ({ ...s, [o.id]: !s[o.id] }))}
                    aria-pressed={!!saved[o.id]}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: saved[o.id] ? C.gold : C.goldWash,
                      color: saved[o.id] ? C.cream : C.goldDeep,
                      border: `1px solid ${C.gold}55`,
                    }}
                  >
                    <Bookmark size={13} aria-hidden="true" /> {saved[o.id] ? "Bewaard" : "Bewaar"}
                  </button>
                </div>
              </div>
            </Frame>
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
        style={{ color: C.gold }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.01em]" style={serif}>
        {opdracht.titel}
      </h1>
      <p className="mt-1 text-[14px]" style={{ color: C.inkSoft }}>
        {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.id}
      </p>

      <WhiplashDivider />
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          [Banknote, "Tarief", opdracht.tarief],
          [Timer, "Inzet", opdracht.uren],
          [CalendarDays, "Start", opdracht.start],
          [MapPin, "Plaats", opdracht.plaats],
        ].map(([Icon, k, v]) => {
          const I = Icon as LucideIcon;
          return (
            <Frame key={k as string}>
              <I size={16} style={{ color: C.gold }} aria-hidden="true" />
              <p
                className="mt-2 text-[11px] uppercase tracking-[0.16em]"
                style={{ color: C.muted }}
              >
                {k as string}
              </p>
              <p className="text-[18px] font-semibold" style={serif}>
                {v as string}
              </p>
            </Frame>
          );
        })}
      </div>

      <WhiplashDivider />
      <div className="grid gap-5 md:grid-cols-2">
        <Frame>
          <SectionTitle initial="W">aarom dit past</SectionTitle>
          <ul className="mt-4 space-y-2">
            {opdracht.redenen.plus.map((p) => (
              <li key={p} className="flex items-start gap-2 text-[14px]">
                <BadgeCheck
                  size={16}
                  style={{ color: C.ok }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {p}
              </li>
            ))}
          </ul>
        </Frame>
        <Frame>
          <SectionTitle initial="A">andachtspunten</SectionTitle>
          <ul className="mt-4 space-y-2">
            {opdracht.redenen.min.map((m) => (
              <li key={m} className="flex items-start gap-2 text-[14px]">
                <TriangleAlert
                  size={16}
                  style={{ color: C.warn }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {m}
              </li>
            ))}
          </ul>
        </Frame>
      </div>

      <WhiplashDivider />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setReageer((r) => !r)}
          aria-pressed={reageer}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: reageer ? C.ok : C.gold, color: C.cream }}
        >
          {reageer ? (
            <BadgeCheck size={16} aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          {reageer ? "Reactie verstuurd" : "Reageer op deze opdracht"}
        </button>
        {reageer && (
          <span className="text-[13px]" style={{ color: C.ok }}>
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
      <h1 className="mt-2 text-[32px] font-semibold leading-tight" style={serif}>
        Uw bewijsstukken
      </h1>
      <p className="mt-1 max-w-2xl text-[14px]" style={{ color: C.inkSoft }}>
        Elke beslissing wordt server-side genomen; de status hieronder is de bron van waarheid.
      </p>

      <WhiplashDivider />
      <div className="grid gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => (
          <Frame key={c.naam}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17px] font-semibold" style={serif}>
                  {c.naam}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusChip status={c.status} />
            </div>
          </Frame>
        ))}
      </div>

      <WhiplashDivider />
      <Frame>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle initial="I">ndien-checklist</SectionTitle>
          <span className="text-[13px] font-medium" style={{ color: C.gold }}>
            {gedaan}/{checklist.length} voltooid
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {checklist.map((item, i) => {
            const id = `c235-chk-${i}`;
            const on = !!done[id];
            return (
              <li key={id}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-start gap-3 rounded-[4px] px-2 py-1.5 transition-colors hover:bg-[var(--hov)]"
                  style={{ ["--hov" as string]: C.cream }}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={on}
                    onChange={() => setDone((d) => ({ ...d, [id]: !d[id] }))}
                    className="mt-0.5 h-4 w-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ accentColor: C.gold }}
                  />
                  <span
                    className="text-[14px]"
                    style={{
                      textDecoration: on ? "line-through" : "none",
                      color: on ? C.muted : C.ink,
                    }}
                  >
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </Frame>
    </div>
  );
}

function Acties() {
  return (
    <div>
      <Overline>Acties</Overline>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight" style={serif}>
        Wat vraagt om aandacht
      </h1>
      <WhiplashDivider />
      <div className="space-y-4">
        {ACTIES.map((a) => {
          const warn = a.urgentie === "warning";
          return (
            <Frame key={a.titel}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: warn ? C.warnWash : C.goldWash,
                      color: warn ? C.warn : C.gold,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={16} /> : <Bell size={16} />}
                  </span>
                  <div>
                    <p className="text-[17px] font-semibold" style={serif}>
                      {a.titel}
                    </p>
                    <p className="text-[13.5px]" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </p>
                  </div>
                </div>
                <button
                  className="rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: C.gold, color: C.cream }}
                >
                  {a.cta}
                </button>
              </div>
            </Frame>
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
      <h1 className="mt-2 text-[32px] font-semibold leading-tight" style={serif}>
        Uw facturen
      </h1>
      <WhiplashDivider />
      <Frame>
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
                  <td className="px-3 py-3 font-medium" style={serif}>
                    {f.nr}
                  </td>
                  <td className="px-3 py-3" style={{ color: C.inkSoft }}>
                    {f.klant}
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums" style={serif}>
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                      style={{
                        background:
                          f.status === "Betaald"
                            ? C.okWash
                            : f.status === "Openstaand"
                              ? C.warnWash
                              : C.goldWash,
                        color:
                          f.status === "Betaald"
                            ? C.ok
                            : f.status === "Openstaand"
                              ? C.warn
                              : C.gold,
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
      </Frame>
    </div>
  );
}
