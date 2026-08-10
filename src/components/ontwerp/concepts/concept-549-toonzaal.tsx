"use client";

// Concept 549 — "Toonzaal" · PREMIUM SHOWROOM / GALLERY.
// Opdrachten en profiel als een luxe etalage: grote showcase-blokken, ruime beeldvlakken
// (puur met CSS-gradients/patterns, geen externe afbeeldingen) en presentatie op productniveau.
// 2026-trends: editorial serif-display naast strakke sans, warm ivoor met goud-accent, veel
// witruimte, tactiele hover-lift en curatie-boven-catalogus. Puur frontend, mock-data.

import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MapPin,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Star,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  Award,
  Gem,
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

// ── Palet: warm ivoor, diepe inkt, één ingetogen goud ────────────────────────────────────────
const C = {
  bg: "#f4efe6",
  surface: "#fffdf8",
  surfaceSoft: "#f7f2e9",
  ink: "#1d1810",
  inkSoft: "#6d6555",
  inkFaint: "#a49a86",
  gold: "#a67c3d",
  goldSoft: "#f2e7d3",
  green: "#4a7a52",
  greenSoft: "#e6efe4",
  amber: "#b07d28",
  amberSoft: "#f6ecd6",
  red: "#a8443c",
  redSoft: "#f5e2df",
  line: "#e7ddca",
  lineStrong: "#dccdb2",
};

const serif = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const sans = { fontFamily: "var(--font-lab-inter), system-ui" };

// Deterministische, verzorgde beeldvlakken (galerij-hero) per opdracht — puur CSS.
const HERO_GRADIENTS = [
  "radial-gradient(120% 120% at 20% 10%, #d9c39a 0%, #b79364 40%, #6f5636 100%)",
  "radial-gradient(120% 120% at 80% 15%, #a9b7a1 0%, #7a8f72 45%, #3f4d3a 100%)",
  "radial-gradient(120% 120% at 30% 85%, #cbb4c4 0%, #9c7f96 45%, #5b475a 100%)",
  "radial-gradient(120% 120% at 70% 20%, #c9a8a0 0%, #a67a6f 45%, #5f3f38 100%)",
];

function heroFor(i: number): string {
  return HERO_GRADIENTS[i % HERO_GRADIENTS.length] as string;
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green, soft: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.gold, soft: C.goldSoft };
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

// ── Bouwstenen ────────────────────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: CredStatus }) {
  const m = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...sans, background: m.soft, color: m.tone }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Hairline() {
  return <span className="block h-px w-full" style={{ background: C.line }} aria-hidden="true" />;
}

function MatchBadge({ value, dark }: { value: number; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={
        dark
          ? { ...sans, background: "rgba(255,255,255,0.9)", color: C.ink }
          : { ...sans, background: C.goldSoft, color: C.gold }
      }
    >
      <Star size={11} strokeWidth={2.6} fill="currentColor" aria-hidden="true" />
      {value}% match
    </span>
  );
}

// ── Hoofdcomponent ──────────────────────────────────────────────────────────────────────────
export function Concept549() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selectedId, setSelectedId] = useState<string>(OPDRACHTEN[0]?.id ?? "");

  const openOpdracht = (id: string) => {
    setSelectedId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, background: C.bg, color: C.ink }}
    >
      <style>{`
        @keyframes toonzaal-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tz-rise { animation: toonzaal-rise 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .tz-lift { transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease; }
        .tz-lift:hover { transform: translateY(-6px); box-shadow: 0 22px 46px rgba(60,45,20,0.16); }
        @media (prefers-reduced-motion: reduce) {
          .tz-rise { animation-duration: 0.01ms !important; }
          .tz-lift { transition: none; }
          .tz-lift:hover { transform: none; }
        }
      `}</style>

      {/* Kop */}
      <header
        className="flex items-center justify-between gap-4 px-5 py-4 md:px-8"
        style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: C.ink }}
          >
            <Gem size={16} strokeWidth={2} style={{ color: C.goldSoft }} aria-hidden="true" />
          </span>
          <div className="leading-none">
            <div className="text-[19px] font-semibold tracking-[-0.01em]" style={serif}>
              Toonzaal
            </div>
            <div
              className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em]"
              style={{ color: C.inkFaint }}
            >
              Etalage voor zelfstandigen
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.goldSoft, color: C.gold }}
          >
            <Award size={13} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: C.ink, color: C.goldSoft }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Nav */}
      <nav
        className="flex items-center gap-6 overflow-x-auto px-5 md:px-8"
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
              className="relative shrink-0 py-3.5 text-[12.5px] font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                { color: on ? C.ink : C.inkSoft, "--tw-ring-color": C.gold } as React.CSSProperties
              }
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5"
                  style={{ background: C.gold }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-10">
        {screen === "dashboard" && (
          <Dashboard onOpen={openOpdracht} onMarkt={() => setScreen("marktplaats")} />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
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
function Dashboard({ onOpen, onMarkt }: { onOpen: (id: string) => void; onMarkt: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="tz-rise space-y-10">
      {/* Etalage-hero */}
      <section>
        <div
          className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          <Sparkles size={13} style={{ color: C.gold }} aria-hidden="true" />
          Uitgelicht voor jou
        </div>
        <button
          type="button"
          onClick={() => onOpen(top.id)}
          className="group relative block w-full overflow-hidden rounded-3xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
          style={{ "--tw-ring-color": C.gold } as React.CSSProperties}
        >
          <div className="relative h-64 w-full md:h-80" style={{ background: heroFor(0) }}>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(20,16,8,0.78) 0%, rgba(20,16,8,0.05) 60%)",
              }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
              aria-hidden="true"
            />
            <div className="absolute right-5 top-5">
              <MatchBadge value={top.match} dark />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <div
                className="text-[11px] font-medium uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {top.opdrachtgever} · {top.plaats}
              </div>
              <h1
                className="mt-2 max-w-xl text-[28px] font-semibold leading-tight tracking-[-0.02em] text-white md:text-[36px]"
                style={serif}
              >
                {top.titel}
              </h1>
              <div className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-white">
                {top.tarief} · {top.uren}
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </button>
      </section>

      {/* KPI-strip als verzorgde meters */}
      <section
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl lg:grid-cols-4"
        style={{ background: C.line }}
      >
        {KPIS.map((k) => (
          <div key={k.label} className="p-5" style={{ background: C.surface }}>
            <div
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: C.inkFaint }}
            >
              {k.label}
            </div>
            <div className="mt-2 text-[26px] font-semibold tracking-[-0.02em]" style={serif}>
              {k.value}
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold"
              style={{ color: k.up ? C.green : C.amber }}
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
      </section>

      {/* Collectie */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em]" style={serif}>
              De collectie
            </h2>
            <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
              Zorgvuldig geselecteerde opdrachten die bij je passen.
            </p>
          </div>
          <button
            type="button"
            onClick={onMarkt}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.gold, "--tw-ring-color": C.gold } as React.CSSProperties}
          >
            Naar de etalage
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OPDRACHTEN.map((o, i) => (
            <GalleryCard key={o.id} o={o} i={i} onOpen={() => onOpen(o.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function GalleryCard({ o, i, onOpen }: { o: Opdracht; i: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tz-lift group block overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={
        {
          background: C.surface,
          border: `1px solid ${C.line}`,
          "--tw-ring-color": C.gold,
        } as React.CSSProperties
      }
    >
      <div className="relative h-36 w-full" style={{ background: heroFor(i) }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 1px, transparent 1px 10px)",
          }}
          aria-hidden="true"
        />
        <div className="absolute left-3 top-3">
          <MatchBadge value={o.match} dark />
        </div>
      </div>
      <div className="p-4">
        <div
          className="text-[11px] font-medium uppercase tracking-wide"
          style={{ color: C.inkFaint }}
        >
          {o.opdrachtgever}
        </div>
        <h3
          className="mt-1 text-[16px] font-semibold leading-snug tracking-[-0.01em]"
          style={serif}
        >
          {o.titel}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color: C.inkSoft }}>
          <MapPin size={13} aria-hidden="true" />
          {o.plaats}
          <span style={{ color: C.inkFaint }}>·</span>
          <span className="font-semibold" style={{ color: C.ink }}>
            {o.tarief}
          </span>
        </div>
        <div className="mt-3">
          <Hairline />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {o.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
              style={{ background: C.surfaceSoft, color: C.inkSoft }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ── Marktplaats: galerij met zoek/filter + leeg/laad/fout ─────────────────────────────────────
type FeedState = "data" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string>("Alles");
  const [feed, setFeed] = useState<FeedState>("data");

  const alleTags = useMemo(() => {
    const set = new Set<string>();
    OPDRACHTEN.forEach((o) => o.tags.forEach((t) => set.add(t)));
    return ["Alles", ...Array.from(set)];
  }, []);

  const filtered = OPDRACHTEN.filter((o) => {
    const matchQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase());
    const matchTag = tag === "Alles" || o.tags.includes(tag);
    return matchQ && matchTag;
  });

  return (
    <div className="tz-rise space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]" style={serif}>
          De etalage
        </h1>
        <p className="text-[13px]" style={{ color: C.inkSoft }}>
          Blader door alle opdrachten, gepresenteerd als een galerij.
        </p>
      </div>

      {/* Filterbalk */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-1 items-center gap-2 rounded-xl px-3.5 py-2.5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <Search size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek in de collectie…"
              aria-label="Zoek opdrachten"
              className="w-full bg-transparent text-[13px] outline-none"
              style={{ color: C.ink }}
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
                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  {
                    background: feed === f ? C.ink : "transparent",
                    color: feed === f ? C.goldSoft : C.inkSoft,
                    "--tw-ring-color": C.gold,
                  } as React.CSSProperties
                }
              >
                {f === "data" ? "Data" : f === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {alleTags.map((t) => {
            const on = tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                aria-pressed={on}
                className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  {
                    background: on ? C.gold : C.surface,
                    color: on ? "#fff" : C.inkSoft,
                    border: `1px solid ${on ? C.gold : C.line}`,
                    "--tw-ring-color": C.gold,
                  } as React.CSSProperties
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {feed === "loading" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="h-36 w-full" style={{ background: C.surfaceSoft }} />
              <div className="space-y-2 p-4">
                <div className="h-3 w-1/2 rounded" style={{ background: C.line }} />
                <div className="h-4 w-3/4 rounded" style={{ background: C.surfaceSoft }} />
              </div>
            </div>
          ))}
        </div>
      ) : feed === "error" ? (
        <div
          className="flex flex-col items-center rounded-2xl py-16 text-center"
          style={{ background: C.redSoft, border: `1px solid ${C.line}` }}
          role="alert"
        >
          <XCircle size={28} style={{ color: C.red }} aria-hidden="true" />
          <h2 className="mt-3 text-[18px] font-semibold" style={serif}>
            De collectie is tijdelijk niet beschikbaar
          </h2>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
            Er ging iets mis bij het laden. Probeer het opnieuw.
          </p>
          <button
            type="button"
            onClick={() => setFeed("data")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.red, "--tw-ring-color": C.red } as React.CSSProperties}
          >
            Opnieuw laden
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-2xl py-16 text-center"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={26} style={{ color: C.inkFaint }} aria-hidden="true" />
          <h2 className="mt-3 text-[18px] font-semibold" style={serif}>
            Niets in de vitrine
          </h2>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
            Geen opdrachten voor deze selectie. Verruim je zoekopdracht of filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setTag("Alles");
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              {
                background: C.surfaceSoft,
                color: C.ink,
                border: `1px solid ${C.line}`,
                "--tw-ring-color": C.gold,
              } as React.CSSProperties
            }
          >
            Wis filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o, i) => (
            <GalleryCard key={o.id} o={o} i={i} onOpen={() => onOpen(o.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────────────────
function OpdrachtDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const idx = Math.max(
    0,
    OPDRACHTEN.findIndex((x) => x.id === id),
  );
  const o = OPDRACHTEN[idx] ?? (OPDRACHTEN[0] as Opdracht);
  const [applied, setApplied] = useState(false);
  return (
    <div className="tz-rise space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft, "--tw-ring-color": C.gold } as React.CSSProperties}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
        Terug naar de etalage
      </button>

      {/* Groot beeldvlak */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="relative h-56 w-full md:h-72" style={{ background: heroFor(idx) }}>
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(20,16,8,0.8), rgba(20,16,8,0.05) 60%)",
            }}
            aria-hidden="true"
          />
          <div className="absolute right-5 top-5">
            <MatchBadge value={o.match} dark />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <div
              className="text-[11px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              {o.id} · {o.opdrachtgever}
            </div>
            <h1
              className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white md:text-[34px]"
              style={serif}
            >
              {o.titel}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <div
            className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4"
            style={{ background: C.line }}
          >
            {[
              { k: "Tarief", v: o.tarief },
              { k: "Inzet", v: o.uren },
              { k: "Start", v: o.start },
              { k: "Plaats", v: o.plaats },
            ].map((m) => (
              <div key={m.k} className="p-4" style={{ background: C.surface }}>
                <div
                  className="text-[10.5px] font-semibold uppercase tracking-wide"
                  style={{ color: C.inkFaint }}
                >
                  {m.k}
                </div>
                <div className="mt-1 text-[15px] font-semibold" style={serif}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <h2 className="text-[16px] font-semibold" style={serif}>
              Waarom deze opdracht bij je past
            </h2>
            <ul className="mt-3 space-y-2">
              {o.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.ink }}>
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.greenSoft }}
                  >
                    <Plus size={11} strokeWidth={3} style={{ color: C.green }} aria-hidden="true" />
                  </span>
                  {r}
                </li>
              ))}
              {o.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberSoft }}
                  >
                    <Minus
                      size={11}
                      strokeWidth={3}
                      style={{ color: C.amber }}
                      aria-hidden="true"
                    />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: C.ink, color: C.surface }}>
            <div
              className="text-[11px] font-medium uppercase tracking-[0.18em]"
              style={{ color: C.goldSoft }}
            >
              Reageren
            </div>
            <div className="mt-2 text-[15px] font-semibold" style={serif}>
              Presenteer jezelf van je beste kant
            </div>
            <button
              type="button"
              onClick={() => setApplied(true)}
              disabled={applied}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-80 motion-reduce:hover:translate-y-0"
              style={
                {
                  background: applied ? C.green : C.gold,
                  color: "#fff",
                  "--tw-ring-color": C.goldSoft,
                } as React.CSSProperties
              }
            >
              {applied ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <ArrowUpRight size={16} aria-hidden="true" />
              )}
              {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
            </button>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="flex flex-wrap gap-1.5">
              {o.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                  style={{ background: C.surfaceSoft, color: C.inkSoft }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────────────────
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="tz-rise space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]" style={serif}>
            Vertrouwenskabinet
          </h1>
          <p className="text-[13px]" style={{ color: C.inkSoft }}>
            Je geverifieerde bewijsstukken, verzorgd gepresenteerd.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{ background: C.greenSoft, color: C.green }}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          {verified}/{CREDENTIALS.length} geverifieerd
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <div
              key={c.naam}
              className="overflow-hidden rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="h-1.5 w-full" style={{ background: m.tone }} aria-hidden="true" />
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="w-full p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ "--tw-ring-color": C.gold } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: m.soft }}
                    >
                      <m.Icon
                        size={18}
                        strokeWidth={2.2}
                        style={{ color: m.tone }}
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <div className="text-[14.5px] font-semibold" style={serif}>
                        {c.naam}
                      </div>
                      <div className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                        {c.detail}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="transition-transform"
                    style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : undefined }}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4">
                  <StatusPill status={c.status} />
                </div>
                {isOpen && (
                  <p className="mt-4 text-[12.5px]" style={{ color: C.inkSoft }}>
                    Server-side geverifieerd bewijsstuk. Opdrachtgevers zien alleen de
                    vertrouwensstatus, nooit het document zelf — jouw privacy blijft geborgd.
                  </p>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ─────────────────────────────────────────────────────────────────────────────────
function Acties() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="tz-rise space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]" style={serif}>
          Aanbevolen acties
        </h1>
        <p className="text-[13px]" style={{ color: C.inkSoft }}>
          De volgende beste stappen om je etalage te laten schitteren.
        </p>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isOpen = open === i;
          return (
            <div
              key={a.titel}
              className="overflow-hidden rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ "--tw-ring-color": C.gold } as React.CSSProperties}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: warn ? C.amberSoft : C.goldSoft }}
                >
                  {warn ? (
                    <AlertTriangle size={18} style={{ color: C.amber }} aria-hidden="true" />
                  ) : (
                    <Sparkles size={18} style={{ color: C.gold }} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold" style={serif}>
                    {a.titel}
                  </div>
                  {!isOpen && (
                    <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.inkSoft }}>
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
                <div className="px-5 pb-5 pl-[76px]">
                  <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                    style={
                      {
                        background: warn ? C.amber : C.gold,
                        "--tw-ring-color": C.gold,
                      } as React.CSSProperties
                    }
                  >
                    {a.cta}
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────────────────
function Facturen() {
  const toneFor = (s: string) =>
    s === "Betaald" ? C.green : s === "Openstaand" ? C.amber : C.inkFaint;
  const softFor = (s: string) =>
    s === "Betaald" ? C.greenSoft : s === "Openstaand" ? C.amberSoft : C.surfaceSoft;
  return (
    <div className="tz-rise space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]" style={serif}>
          Facturen
        </h1>
        <p className="text-[13px]" style={{ color: C.inkSoft }}>
          {FACTUREN.filter((f) => f.status === "Openstaand").length} openstaand van{" "}
          {FACTUREN.length}.
        </p>
      </div>
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {FACTUREN.map((f, i) => (
          <div
            key={f.nr}
            className="flex items-center gap-4 p-5"
            style={{ borderTop: i ? `1px solid ${C.line}` : undefined }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold" style={serif}>
                {f.nr}
              </div>
              <div className="mt-0.5 truncate text-[12px]" style={{ color: C.inkSoft }}>
                {f.klant} · {f.datum}
              </div>
            </div>
            <div className="text-[15px] font-semibold tabular-nums" style={serif}>
              {f.bedrag}
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
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
