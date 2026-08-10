"use client";

// Concept 548 — "Schifting" · SWIPE / TRIAGE DECISIONING.
// Mobiel-native, ergonomisch snel beslissen: een kaartstapel met opdrachten die je één voor één
// beoordeelt (bewaren / overslaan / reageren) via grote knop-acties — de bovenste kaart schuift
// weg, de stapel loopt op met een teller en een lege- + reset-staat. 2026-trends: bold-minimal
// mobile-first, tactiele haptische knoppen, spring-micro-interacties, hoge-contrast big-touch
// targets en een "beslis-één-ding-tegelijk" focusmodus. Puur frontend, mock-data.

import { useMemo, useState } from "react";
import {
  Bookmark,
  SkipForward,
  Send,
  RotateCcw,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MapPin,
  Wallet,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Zap,
  Inbox,
  ChevronRight,
  Layers,
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

// ── Palet: licht, energiek, mobiel-native — één elektrische indigo + warm koraal ──────────────
const C = {
  bg: "#eef0f4",
  surface: "#ffffff",
  surfaceSoft: "#f5f6f9",
  ink: "#14131c",
  inkSoft: "#605d6e",
  inkFaint: "#9a97a8",
  accent: "#5b4bff",
  accentSoft: "#efedff",
  save: "#12996a",
  saveSoft: "#e5f6ee",
  skip: "#7c7a89",
  skipSoft: "#eeeef2",
  react: "#5b4bff",
  amber: "#c9821a",
  amberSoft: "#fdf1de",
  red: "#d8433c",
  redSoft: "#fdeceb",
  line: "#e5e6ee",
  lineStrong: "#d6d8e2",
};

const ui = { fontFamily: "var(--font-lab-space), var(--font-lab-inter), system-ui" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.save, soft: C.saveSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.accent, soft: C.accentSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        tone: C.amber,
        soft: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, soft: C.redSoft };
  }
}

function matchTone(v: number): string {
  return v >= 90 ? C.save : v >= 80 ? C.amber : C.accent;
}

// ── Kleine bouwstenen ─────────────────────────────────────────────────────────────────────────
function Spark({ points, tone }: { points: number[]; tone: string }) {
  const w = 72;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * (h - 4) - 2;
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
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const m = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: m.soft, color: m.tone }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function MatchDial({ value }: { value: number }) {
  const tone = matchTone(value);
  const r = 20;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg width={48} height={48} viewBox="0 0 48 48" aria-hidden="true" className="-rotate-90">
        <circle cx={24} cy={24} r={r} fill="none" stroke={C.line} strokeWidth={4} />
        <circle
          cx={24}
          cy={24}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[12px] font-bold"
        style={{ color: tone }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Hoofdcomponent ──────────────────────────────────────────────────────────────────────────
export function Concept548() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selectedId, setSelectedId] = useState<string>(OPDRACHTEN[0]?.id ?? "");

  const openOpdracht = (id: string) => {
    setSelectedId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <style>{`
        @keyframes schifting-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes schifting-out-save {
          to { opacity: 0; transform: translate(120%, -8%) rotate(9deg); }
        }
        @keyframes schifting-out-skip {
          to { opacity: 0; transform: translate(-120%, -8%) rotate(-9deg); }
        }
        @keyframes schifting-out-react {
          to { opacity: 0; transform: translateY(-130%) scale(0.94); }
        }
        .sch-anim-in { animation: schifting-in 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        .sch-out-save { animation: schifting-out-save 0.32s cubic-bezier(0.5,0,0.75,0) both; }
        .sch-out-skip { animation: schifting-out-skip 0.32s cubic-bezier(0.5,0,0.75,0) both; }
        .sch-out-react { animation: schifting-out-react 0.32s cubic-bezier(0.5,0,0.75,0) both; }
        @media (prefers-reduced-motion: reduce) {
          .sch-anim-in, .sch-out-save, .sch-out-skip, .sch-out-react { animation-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Chrome / statusbalk */}
      <header
        className="flex items-center justify-between gap-3 px-4 py-3 md:px-6"
        style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{ background: C.accent }}
          >
            <Layers size={17} strokeWidth={2.6} style={{ color: "#fff" }} aria-hidden="true" />
          </span>
          <div className="leading-none">
            <div className="flex items-center gap-1.5 text-[15px] font-bold tracking-[-0.02em]">
              Schifting
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{ background: C.accentSoft, color: C.accent }}
              >
                triage
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.saveSoft, color: C.save }}
          >
            <ShieldCheck size={13} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Nav */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-3 py-2 md:px-5"
        style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                {
                  background: on ? C.ink : "transparent",
                  color: on ? "#fff" : C.inkSoft,
                  "--tw-ring-color": C.accent,
                } as React.CSSProperties
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-7">
        {screen === "dashboard" && (
          <Dashboard
            onTriage={() => setScreen("marktplaats")}
            onActies={() => setScreen("acties")}
            onOpen={openOpdracht}
          />
        )}
        {screen === "marktplaats" && <Marktplaats onReageer={openOpdracht} />}
        {screen === "opdracht" && (
          <OpdrachtDetail id={selectedId} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────────────────────
function Dashboard({
  onTriage,
  onActies,
  onOpen,
}: {
  onTriage: () => void;
  onActies: () => void;
  onOpen: (id: string) => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[19px] font-bold tracking-[-0.02em]">
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="text-[13px]" style={{ color: C.inkSoft }}>
          {OPDRACHTEN.length} opdrachten wachten op je oordeel · {PROFIEL.plaats}
        </p>
      </div>

      {/* KPI-rij */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-4"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
              {k.label}
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <div className="text-[20px] font-bold tracking-[-0.02em]">{k.value}</div>
              <Spark points={k.spark} tone={k.up ? C.save : C.amber} />
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: k.up ? C.save : C.amber }}
            >
              {k.up ? (
                <TrendingUp size={12} aria-hidden="true" />
              ) : (
                <TrendingDown size={12} aria-hidden="true" />
              )}
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Volgende-actie banner */}
      <button
        type="button"
        onClick={onActies}
        className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
        style={
          { background: C.ink, color: "#fff", "--tw-ring-color": C.accent } as React.CSSProperties
        }
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <Zap size={19} strokeWidth={2.4} style={{ color: "#fff" }} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Volgende beste actie
          </div>
          <div className="truncate text-[14px] font-semibold">{primair.titel}</div>
        </div>
        <ArrowRight
          size={18}
          className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
          aria-hidden="true"
        />
      </button>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Triage-preview */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold">Klaar om te schiften</h2>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: C.accentSoft, color: C.accent }}
            >
              {OPDRACHTEN.length} nieuw
            </span>
          </div>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
            Beoordeel opdrachten één voor één. Bewaar, sla over of reageer direct.
          </p>
          <div className="relative mt-4 h-28">
            {OPDRACHTEN.slice(0, 3).map((o, i) => (
              <div
                key={o.id}
                className="absolute inset-x-0 rounded-xl p-3"
                style={{
                  top: `${i * 8}px`,
                  transform: `scale(${1 - i * 0.04})`,
                  zIndex: 3 - i,
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                  boxShadow: "0 6px 16px rgba(20,19,28,0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  <MatchDial value={o.match} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{o.titel}</div>
                    <div className="truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.tarief}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onTriage}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
            style={{ background: C.accent, "--tw-ring-color": C.accent } as React.CSSProperties}
          >
            Start schiften
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Top match */}
        <div
          className="rounded-2xl p-5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <h2 className="text-[14px] font-bold">Beste match</h2>
          <div className="mt-3 flex items-center gap-3">
            <MatchDial value={top.match} />
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold">{top.titel}</div>
              <div className="text-[11.5px]" style={{ color: C.inkSoft }}>
                {top.opdrachtgever}
              </div>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {top.redenen.plus.slice(0, 3).map((r) => (
              <li
                key={r}
                className="flex items-start gap-1.5 text-[12px]"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={13}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.save }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onOpen(top.id)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              {
                background: C.surfaceSoft,
                color: C.ink,
                border: `1px solid ${C.line}`,
                "--tw-ring-color": C.accent,
              } as React.CSSProperties
            }
          >
            Bekijk opdracht
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats: kaartstapel-triage + lijst met zoek/laad/fout/leeg ─────────────────────────────
type FeedState = "data" | "loading" | "error";

function Marktplaats({ onReageer }: { onReageer: (id: string) => void }) {
  // Deck: de drie opdrachten, herhaald voor een vollere stapel (geen verzonnen content).
  const deck = useMemo<Opdracht[]>(() => [...OPDRACHTEN, ...OPDRACHTEN], []);
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState<null | "save" | "skip" | "react">(null);
  const [counts, setCounts] = useState({ save: 0, skip: 0, react: 0 });

  const [tab, setTab] = useState<"stapel" | "lijst">("stapel");
  const [q, setQ] = useState("");
  const [feed, setFeed] = useState<FeedState>("data");

  const remaining = deck.length - idx;
  const current = deck[idx];

  const decide = (dir: "save" | "skip" | "react") => {
    if (leaving || !current) return;
    if (dir === "react") onReageer(current.id);
    setLeaving(dir);
    window.setTimeout(() => {
      setCounts((c) => ({ ...c, [dir]: c[dir] + 1 }));
      setIdx((i) => i + 1);
      setLeaving(null);
    }, 330);
  };

  const reset = () => {
    setIdx(0);
    setCounts({ save: 0, skip: 0, react: 0 });
    setLeaving(null);
  };

  const filtered = deck.filter(
    (o, i) =>
      i < OPDRACHTEN.length &&
      (o.titel.toLowerCase().includes(q.toLowerCase()) ||
        o.opdrachtgever.toLowerCase().includes(q.toLowerCase()) ||
        o.plaats.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[19px] font-bold tracking-[-0.02em]">Marktplaats</h1>
          <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
            Schift snel of blader door alles.
          </p>
        </div>
        <div
          className="inline-flex rounded-full p-1"
          style={{ background: C.surfaceSoft, border: `1px solid ${C.line}` }}
        >
          {(["stapel", "lijst"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                {
                  background: tab === t ? C.ink : "transparent",
                  color: tab === t ? "#fff" : C.inkSoft,
                  "--tw-ring-color": C.accent,
                } as React.CSSProperties
              }
            >
              {t === "stapel" ? "Stapel" : "Lijst"}
            </button>
          ))}
        </div>
      </div>

      {tab === "stapel" ? (
        <div
          className="rounded-3xl p-5 md:p-6"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          {/* Voortgangsteller */}
          <div className="mb-4 flex items-center justify-between">
            <div
              className="flex items-center gap-2 text-[12.5px] font-semibold"
              style={{ color: C.inkSoft }}
            >
              <Inbox size={15} aria-hidden="true" />
              {remaining > 0 ? `Nog ${remaining} van ${deck.length}` : "Stapel leeg"}
            </div>
            <div className="flex items-center gap-2 text-[11.5px] font-semibold">
              <span style={{ color: C.save }}>{counts.save} bewaard</span>
              <span style={{ color: C.inkFaint }}>·</span>
              <span style={{ color: C.accent }}>{counts.react} reactie</span>
            </div>
          </div>

          {remaining > 0 && current ? (
            <>
              {/* Kaartstapel */}
              <div className="relative mx-auto h-[320px] max-w-sm">
                {deck.slice(idx, idx + 3).map((o, layer) => {
                  const isTop = layer === 0;
                  return (
                    <article
                      key={`${o.id}-${idx + layer}`}
                      className={isTop ? (leaving ? `sch-out-${leaving}` : "sch-anim-in") : ""}
                      style={{
                        position: "absolute",
                        inset: 0,
                        top: `${layer * 12}px`,
                        transform: isTop ? undefined : `scale(${1 - layer * 0.05})`,
                        zIndex: 10 - layer,
                        background: C.surface,
                        border: `1px solid ${C.lineStrong}`,
                        borderRadius: 24,
                        boxShadow: isTop
                          ? "0 18px 40px rgba(20,19,28,0.14)"
                          : "0 8px 20px rgba(20,19,28,0.06)",
                        padding: 20,
                        opacity: layer > 2 ? 0 : 1,
                      }}
                      aria-hidden={!isTop}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <MatchDial value={o.match} />
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: C.accentSoft, color: C.accent }}
                        >
                          {o.match}% match
                        </span>
                      </div>
                      <h2 className="mt-3 text-[17px] font-bold leading-snug tracking-[-0.01em]">
                        {o.titel}
                      </h2>
                      <div className="mt-1 text-[13px] font-medium" style={{ color: C.inkSoft }}>
                        {o.opdrachtgever}
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12px]">
                        <Meta Icon={MapPin} label={o.plaats} />
                        <Meta Icon={Wallet} label={o.tarief} />
                        <Meta Icon={Clock} label={o.uren} />
                        <Meta Icon={CalendarClock} label={o.start} />
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              background: C.surfaceSoft,
                              color: C.inkSoft,
                              border: `1px solid ${C.line}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Actieknoppen */}
              <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-4">
                <TriageBtn
                  onClick={() => decide("skip")}
                  Icon={SkipForward}
                  label="Overslaan"
                  tone={C.skip}
                  soft={C.skipSoft}
                  size="md"
                />
                <TriageBtn
                  onClick={() => decide("react")}
                  Icon={Send}
                  label="Reageren"
                  tone="#fff"
                  soft={C.accent}
                  size="lg"
                  filled
                />
                <TriageBtn
                  onClick={() => decide("save")}
                  Icon={Bookmark}
                  label="Bewaren"
                  tone={C.save}
                  soft={C.saveSoft}
                  size="md"
                />
              </div>
            </>
          ) : (
            // Lege staat + reset
            <div
              className="flex flex-col items-center justify-center rounded-2xl py-14 text-center"
              style={{ background: C.surfaceSoft }}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: C.saveSoft }}
              >
                <Check size={26} strokeWidth={2.6} style={{ color: C.save }} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[16px] font-bold">Alles geschift</h2>
              <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
                Je beoordeelde {deck.length} opdrachten · {counts.save} bewaard, {counts.react}{" "}
                gereageerd, {counts.skip} overgeslagen.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                style={{ background: C.accent, "--tw-ring-color": C.accent } as React.CSSProperties}
              >
                <RotateCcw size={15} aria-hidden="true" />
                Opnieuw schiften
              </button>
            </div>
          )}
        </div>
      ) : (
        // Lijst met zoek + laad/fout/leeg demo
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <Search size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Zoek op titel, plaats of opdrachtgever…"
                aria-label="Zoek opdrachten"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[color:var(--ph)]"
                style={{ ["--ph" as string]: C.inkFaint } as React.CSSProperties}
              />
            </div>
            <div
              className="inline-flex rounded-xl p-1"
              style={{ background: C.surfaceSoft, border: `1px solid ${C.line}` }}
            >
              {(["data", "loading", "error"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeed(f)}
                  aria-pressed={feed === f}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={
                    {
                      background: feed === f ? C.ink : "transparent",
                      color: feed === f ? "#fff" : C.inkSoft,
                      "--tw-ring-color": C.accent,
                    } as React.CSSProperties
                  }
                >
                  {f === "data" ? "Data" : f === "loading" ? "Laden" : "Fout"}
                </button>
              ))}
            </div>
          </div>

          {feed === "loading" ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: C.surface, border: `1px solid ${C.line}` }}
                >
                  <div className="h-3 w-1/3 rounded" style={{ background: C.line }} />
                  <div className="mt-2 h-2.5 w-1/2 rounded" style={{ background: C.surfaceSoft }} />
                </div>
              ))}
            </div>
          ) : feed === "error" ? (
            <div
              className="flex flex-col items-center rounded-2xl py-12 text-center"
              style={{ background: C.redSoft, border: `1px solid ${C.line}` }}
              role="alert"
            >
              <XCircle size={26} style={{ color: C.red }} aria-hidden="true" />
              <h2 className="mt-3 text-[14px] font-bold">Kon opdrachten niet laden</h2>
              <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                Er ging iets mis bij het ophalen. Probeer het opnieuw.
              </p>
              <button
                type="button"
                onClick={() => setFeed("data")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: C.red, "--tw-ring-color": C.red } as React.CSSProperties}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Opnieuw laden
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center rounded-2xl py-12 text-center"
              style={{ background: C.surfaceSoft }}
            >
              <Search size={24} style={{ color: C.inkFaint }} aria-hidden="true" />
              <h2 className="mt-3 text-[14px] font-bold">Geen resultaten</h2>
              <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                Geen opdrachten voor “{q}”. Pas je zoekopdracht aan.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onReageer(o.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-3.5 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={
                      {
                        background: C.surface,
                        border: `1px solid ${C.line}`,
                        ["--hov" as string]: C.surfaceSoft,
                        "--tw-ring-color": C.accent,
                      } as React.CSSProperties
                    }
                  >
                    <MatchDial value={o.match} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">{o.titel}</div>
                      <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={14} className="shrink-0" style={{ color: C.inkFaint }} aria-hidden="true" />
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}

function TriageBtn({
  onClick,
  Icon,
  label,
  tone,
  soft,
  size,
  filled,
}: {
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
  tone: string;
  soft: string;
  size: "md" | "lg";
  filled?: boolean;
}) {
  const style = {
    background: soft,
    color: tone,
    ...(filled ? { boxShadow: "0 10px 24px rgba(91,75,255,0.34)" } : {}),
    ["--tw-ring-color" as string]: filled ? C.accent : tone,
  } as React.CSSProperties;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex ${size === "lg" ? "h-16 w-16" : "h-14 w-14"} items-center justify-center rounded-full transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 motion-reduce:hover:translate-y-0`}
      style={style}
    >
      <Icon size={size === "lg" ? 24 : 20} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────────────────
function OpdrachtDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const o = OPDRACHTEN.find((x) => x.id === id) ?? (OPDRACHTEN[0] as Opdracht);
  const [applied, setApplied] = useState(false);
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft, "--tw-ring-color": C.accent } as React.CSSProperties}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div
        className="rounded-3xl p-6"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint }}
            >
              {o.id}
            </div>
            <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em]">
              {o.titel}
            </h1>
            <div className="mt-1 text-[13.5px] font-medium" style={{ color: C.inkSoft }}>
              {o.opdrachtgever} · {o.plaats}
            </div>
          </div>
          <MatchDial value={o.match} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, k: "Tarief", v: o.tarief },
            { Icon: Clock, k: "Inzet", v: o.uren },
            { Icon: CalendarClock, k: "Start", v: o.start },
            { Icon: MapPin, k: "Plaats", v: o.plaats },
          ].map((m) => (
            <div key={m.k} className="rounded-xl p-3" style={{ background: C.surfaceSoft }}>
              <m.Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
              <dt
                className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-wide"
                style={{ color: C.inkFaint }}
              >
                {m.k}
              </dt>
              <dd className="text-[13px] font-bold">{m.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl p-4" style={{ background: C.saveSoft }}>
            <div
              className="flex items-center gap-1.5 text-[12px] font-bold"
              style={{ color: C.save }}
            >
              <Sparkles size={14} aria-hidden="true" />
              Waarom dit past
            </div>
            <ul className="mt-2 space-y-1.5">
              {o.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-1.5 text-[12.5px]"
                  style={{ color: C.ink }}
                >
                  <Plus
                    size={13}
                    strokeWidth={3}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.save }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-4" style={{ background: C.amberSoft }}>
            <div
              className="flex items-center gap-1.5 text-[12px] font-bold"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={14} aria-hidden="true" />
              Let op
            </div>
            <ul className="mt-2 space-y-1.5">
              {o.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-1.5 text-[12.5px]"
                  style={{ color: C.ink }}
                >
                  <Minus
                    size={13}
                    strokeWidth={3}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {o.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
              style={{ background: C.surfaceSoft, color: C.inkSoft, border: `1px solid ${C.line}` }}
            >
              {t}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setApplied(true)}
          disabled={applied}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 motion-reduce:hover:translate-y-0"
          style={
            {
              background: applied ? C.save : C.accent,
              "--tw-ring-color": C.accent,
            } as React.CSSProperties
          }
        >
          {applied ? <Check size={17} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────────────────
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[19px] font-bold tracking-[-0.02em]">Verificatie</h1>
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          {verified} van {CREDENTIALS.length} bewijsstukken geverifieerd.
        </p>
      </div>
      <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        {CREDENTIALS.map((c, i) => {
          const m = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <div key={c.naam} style={{ borderTop: i ? `1px solid ${C.line}` : undefined }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={
                  {
                    ["--hov" as string]: C.surfaceSoft,
                    "--tw-ring-color": C.accent,
                  } as React.CSSProperties
                }
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.soft }}
                >
                  <m.Icon
                    size={16}
                    strokeWidth={2.4}
                    style={{ color: m.tone }}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{c.naam}</div>
                  <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill status={c.status} />
                <ChevronRight
                  size={16}
                  className="transition-transform"
                  style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : undefined }}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-16 text-[12.5px]" style={{ color: C.inkSoft }}>
                  <p>
                    Dit bewijsstuk wordt server-side gecontroleerd. Bij verlopen of afgewezen status
                    volgt automatisch een herstelactie in je actielijst.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────────────────
function Acties() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[19px] font-bold tracking-[-0.02em]">Acties</h1>
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          Wat je vandaag het meeste oplevert.
        </p>
      </div>
      <ul className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isOpen = open === i;
          return (
            <li
              key={a.titel}
              className="overflow-hidden rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ "--tw-ring-color": C.accent } as React.CSSProperties}
              >
                <span
                  className="w-1 shrink-0 self-stretch rounded-full"
                  style={{ background: warn ? C.amber : C.accent }}
                  aria-hidden="true"
                />
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: warn ? C.amberSoft : C.accentSoft }}
                >
                  {warn ? (
                    <AlertTriangle size={16} style={{ color: C.amber }} aria-hidden="true" />
                  ) : (
                    <Zap size={16} style={{ color: C.accent }} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{a.titel}</div>
                  {!isOpen && (
                    <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </div>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  className="transition-transform"
                  style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : undefined }}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-[68px]">
                  <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                    style={
                      {
                        background: warn ? C.amber : C.accent,
                        "--tw-ring-color": C.accent,
                      } as React.CSSProperties
                    }
                  >
                    {a.cta}
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────────────────
function Facturen() {
  const toneFor = (s: string) =>
    s === "Betaald" ? C.save : s === "Openstaand" ? C.amber : C.inkFaint;
  const softFor = (s: string) =>
    s === "Betaald" ? C.saveSoft : s === "Openstaand" ? C.amberSoft : C.surfaceSoft;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[19px] font-bold tracking-[-0.02em]">Facturen</h1>
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          {FACTUREN.filter((f) => f.status === "Openstaand").length} openstaand.
        </p>
      </div>
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {FACTUREN.map((f, i) => (
          <div
            key={f.nr}
            className="flex items-center gap-3 p-4"
            style={{ borderTop: i ? `1px solid ${C.line}` : undefined }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold">{f.nr}</div>
              <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                {f.klant} · {f.datum}
              </div>
            </div>
            <div className="text-[13.5px] font-bold tabular-nums">{f.bedrag}</div>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: softFor(f.status), color: toneFor(f.status) }}
            >
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
