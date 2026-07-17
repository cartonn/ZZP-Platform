"use client";

// Concept 365 — "Kwartet" · Speelkaart / kwartet-spel-metafoor.
// Informatie als verzamelkaarten: opdrachten en credentials als strakke speelkaarten met
// afgeronde hoeken, kaart-index in de hoek (rangnummer + suit-symbool linksboven én rechtsonder
// gespiegeld). Categorie-gecodeerde suits (harten/ruiten/schoppen/klaveren → vakgebieden), 4-up
// kwartet-grid. Warm crème karton (#f6f1e4) met inkt (#1c1a17), twee suit-accenten (rood/zwart)
// en één subtiel goud. Fonts: Cormorant (kaart-display) + Geist Mono (indices) + Manrope (tekst).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Heart,
  Diamond,
  Club,
  Spade,
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

// — Palet: crème kaartkarton, inkt, rood/zwart suits, subtiel goud —
const C = {
  felt: "#e7ded0",
  card: "#f6f1e4",
  cardHi: "#fbf8f0",
  ink: "#1c1a17",
  inkSoft: "#3a3630",
  muted: "#6b6459",
  faint: "#9a9184",
  line: "rgba(28,26,23,0.14)",
  lineSoft: "rgba(28,26,23,0.08)",
  red: "#b3271e",
  redSoft: "#f3ddd8",
  gold: "#b08d3f",
  goldSoft: "#efe6cd",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };

type SuitKey = "harten" | "ruiten" | "schoppen" | "klaveren";

const SUITS: Record<SuitKey, { Icon: LucideIcon; label: string; red: boolean }> = {
  harten: { Icon: Heart, label: "Zorg", red: true },
  ruiten: { Icon: Diamond, label: "Verpleging", red: true },
  schoppen: { Icon: Spade, label: "GGZ", red: false },
  klaveren: { Icon: Club, label: "Begeleiding", red: false },
};

// Deterministische suit per opdracht (op index) — geen willekeur.
const OPDRACHT_SUITS: SuitKey[] = ["harten", "ruiten", "schoppen"];

// Speelkaart-rang uit een matchwaarde: hoog = plaatje.
function rankLabel(v: number): string {
  if (v >= 94) return "A";
  if (v >= 90) return "K";
  if (v >= 85) return "V";
  if (v >= 80) return "B";
  return String(Math.max(2, Math.round(v / 10)));
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: "ok" | "wait" | "warn";
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: "ok" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: "wait" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: "warn" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, tone: "warn" };
  }
}

// — Kaart-index in de hoek: rang boven suit-symbool —
function CardIndex({ rank, suit, corner }: { rank: string; suit: SuitKey; corner: "tl" | "br" }) {
  const s = SUITS[suit];
  const color = s.red ? C.red : C.ink;
  return (
    <span
      className={`pointer-events-none absolute flex flex-col items-center leading-none ${
        corner === "tl" ? "left-3 top-3" : "bottom-3 right-3 rotate-180"
      }`}
      style={{ color }}
      aria-hidden="true"
    >
      <span className="text-[15px] font-semibold tabular-nums" style={mono}>
        {rank}
      </span>
      <s.Icon size={12} className="mt-0.5" style={{ fill: color }} />
    </span>
  );
}

function SuitBadge({ suit }: { suit: SuitKey }) {
  const s = SUITS[suit];
  const color = s.red ? C.red : C.ink;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: s.red ? C.redSoft : C.goldSoft, color, ...mono }}
    >
      <s.Icon size={11} style={{ fill: color }} aria-hidden="true" />
      {s.label}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ border: `1px solid ${C.line}`, color: C.muted, ...mono }}
    >
      {children}
    </span>
  );
}

function StatusTag({ status }: { status: CredStatus }) {
  const st = statusMeta(status);
  const color = st.tone === "ok" ? C.gold : st.tone === "warn" ? C.red : C.muted;
  const bg = st.tone === "ok" ? C.goldSoft : st.tone === "warn" ? C.redSoft : C.lineSoft;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
      style={{ background: bg, color, ...mono }}
    >
      <st.Icon size={12} aria-hidden="true" />
      {st.label}
    </span>
  );
}

// — Mini sparkline in kaart-inkt —
function InkSpark({ data, warn }: { data: number[]; warn?: boolean }) {
  const w = 150;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stroke = warn ? C.red : C.ink;
  const pts = data
    .map((v, i) => {
      const x = 3 + (i / (data.length - 1)) * (w - 6);
      const y = 3 + (1 - (v - min) / span) * (h - 6);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Concept365() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.felt, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
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

function TopBar() {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <span
          className="relative flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: C.card, border: `1.5px solid ${C.ink}` }}
          aria-hidden="true"
        >
          <Spade
            size={13}
            className="absolute left-1.5 top-1.5"
            style={{ fill: C.ink, color: C.ink }}
          />
          <Heart
            size={13}
            className="absolute bottom-1.5 right-1.5"
            style={{ fill: C.red, color: C.red }}
          />
        </span>
        <div>
          <p className="text-[22px] font-semibold leading-none tracking-[-0.01em]" style={display}>
            Kwartet
          </p>
          <p
            className="mt-1 text-[10.5px] leading-none tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            VERZAMEL JE WERK
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{ background: C.goldSoft, color: C.gold, ...mono }}
        >
          <Diamond size={11} style={{ fill: C.gold }} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[12px] font-semibold"
          style={{ background: C.card, border: `1.5px solid ${C.ink}`, color: C.ink, ...mono }}
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
      className="flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5"
      style={{ background: C.card, border: `1px solid ${C.line}` }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
            style={
              on ? { background: C.ink, color: C.card, ...display } : { color: C.muted, ...display }
            }
          >
            <span
              className="text-[10px] tabular-nums"
              style={{ color: on ? C.gold : C.faint, ...mono }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// — Basis speelkaart-wrapper: hoeken, karton, hover-tilt —
function PlayingCard({
  suit,
  rank,
  children,
  onClick,
  className = "",
}: {
  suit: SuitKey;
  rank: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <>
      <CardIndex rank={rank} suit={suit} corner="tl" />
      <CardIndex rank={rank} suit={suit} corner="br" />
      <div className="px-6 py-5">{children}</div>
    </>
  );
  const style = {
    background: C.card,
    border: `1px solid ${C.line}`,
    boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 18px rgba(28,26,23,0.08)",
  } as const;
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`group relative block w-full overflow-hidden rounded-2xl text-left transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-[-0.6deg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none ${className}`}
        style={style}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={style}>
      {inner}
    </div>
  );
}

function suitFor(index: number): SuitKey {
  return OPDRACHT_SUITS[index % OPDRACHT_SUITS.length] ?? "harten";
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-[1.3fr_1fr]">
        <div
          className="relative overflow-hidden rounded-2xl p-8"
          style={{ background: C.cardHi, border: `1px solid ${C.line}` }}
        >
          <p
            className="text-[10.5px] font-medium tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            VANDAAG · UTRECHT
          </p>
          <h1
            className="mt-4 text-[46px] font-semibold leading-[1.0] tracking-[-0.01em] md:text-[56px]"
            style={display}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Je hand ligt klaar. Speel vandaag één kaart uit — de rest van je set volgt vanzelf.
          </p>
          <div className="mt-6 flex gap-1.5" aria-hidden="true">
            {(Object.keys(SUITS) as SuitKey[]).map((k) => {
              const s = SUITS[k];
              return (
                <span
                  key={k}
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: C.card, border: `1px solid ${C.line}` }}
                >
                  <s.Icon
                    size={13}
                    style={{ fill: s.red ? C.red : C.ink, color: s.red ? C.red : C.ink }}
                  />
                </span>
              );
            })}
          </div>
        </div>

        <div
          className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-7"
          style={{ background: C.ink, color: C.card }}
        >
          <span
            className="pointer-events-none absolute -right-6 -top-6 opacity-[0.08]"
            aria-hidden="true"
          >
            <Heart size={140} style={{ fill: C.card }} />
          </span>
          <div className="relative">
            <p
              className="text-[10.5px] font-medium tracking-[0.16em]"
              style={{ color: C.gold, ...mono }}
            >
              TROEFKAART · NU SPELEN
            </p>
            <h2 className="mt-3 text-[24px] font-semibold leading-snug" style={display}>
              {primair.titel}
            </h2>
            <p
              className="mt-2 text-[13.5px] leading-relaxed"
              style={{ color: "rgba(246,241,228,0.75)" }}
            >
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group relative mt-6 inline-flex items-center justify-between gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1a17]"
            style={{ background: C.gold, color: C.ink, ...display }}
          >
            {primair.cta}
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-[0.02em]" style={display}>
            Je hand in cijfers
          </h2>
          <span className="text-[10.5px] tracking-[0.14em]" style={{ color: C.faint, ...mono }}>
            VIER TROEVEN
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const suit = (Object.keys(SUITS) as SuitKey[])[i % 4] ?? "harten";
            const rank = rankLabel(80 + i * 4);
            return (
              <PlayingCard key={k.label} suit={suit} rank={rank}>
                <div className="pt-4">
                  <p className="text-[11px] font-medium" style={{ color: C.muted, ...body }}>
                    {k.label}
                  </p>
                  <p
                    className="mt-1.5 text-[32px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                    style={display}
                  >
                    {k.value}
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <InkSpark data={k.spark} warn={!k.up} />
                    <span
                      className="text-[11.5px] font-semibold tabular-nums"
                      style={{ color: k.up ? C.gold : C.red, ...mono }}
                    >
                      {k.trend}
                    </span>
                  </div>
                </div>
              </PlayingCard>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold" style={display}>
            Kaarten voor jou
          </h2>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.red, ...display }}
          >
            Volledig kwartet <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OPDRACHTEN.map((o, i) => (
            <OpdrachtKaart key={o.id} opdracht={o} suit={suitFor(i)} onOpen={onOpen} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OpdrachtKaart({
  opdracht,
  suit,
  onOpen,
}: {
  opdracht: Opdracht;
  suit: SuitKey;
  onOpen: () => void;
}) {
  return (
    <PlayingCard suit={suit} rank={rankLabel(opdracht.match)} onClick={onOpen} className="h-full">
      <div className="flex h-full flex-col pt-3">
        <div className="flex items-start justify-between gap-3">
          <SuitBadge suit={suit} />
          <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
            {opdracht.id}
          </span>
        </div>
        <h3
          className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.01em]"
          style={display}
        >
          {opdracht.titel}
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>

        <div className="my-4 flex items-center gap-3">
          <span className="text-[15px] font-semibold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief}
          </span>
          <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
          <span className="text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.uren}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>

        <div
          className="mt-auto flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: C.lineSoft }}
        >
          <span className="flex items-baseline gap-1.5">
            <span
              className="text-[24px] font-semibold tabular-nums leading-none"
              style={{ color: opdracht.match >= 90 ? C.red : C.ink, ...display }}
            >
              {opdracht.match}
            </span>
            <span className="text-[11px] tracking-[0.1em]" style={{ color: C.faint, ...mono }}>
              KAARTWAARDE
            </span>
          </span>
          <ArrowRight
            size={17}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            style={{ color: C.ink }}
          />
        </div>
      </div>
    </PlayingCard>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[10.5px] font-medium tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            MARKTPLAATS
          </p>
          <h1
            className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.01em]"
            style={display}
          >
            Open opdrachten
          </h1>
        </div>
        <span className="text-[12px] font-medium tabular-nums" style={{ color: C.muted, ...mono }}>
          {filtered.length} van {OPDRACHTEN.length} kaarten
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9a9184]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.ink, color: C.card, ...display }
                    : {
                        background: C.card,
                        color: C.muted,
                        border: `1px solid ${C.line}`,
                        ...display,
                      }
                }
              >
                {s === "match" ? "Kaartwaarde" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-2xl py-16 text-center"
          style={{ background: C.card, border: `1px dashed ${C.line}` }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ background: C.cardHi, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Spade size={22} style={{ fill: C.faint, color: C.faint }} />
          </span>
          <p className="mt-4 text-[24px] font-semibold" style={display}>
            Lege hand
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
            Geen kaart past bij {q ? `“${q}”` : "je zoekopdracht"}. Verruim je zoekterm om je hand
            weer te vullen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.card, ...display }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o, i) => (
            <OpdrachtKaart key={o.id} opdracht={o} suit={suitFor(i)} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const suit = suitFor(0);
  const s = SUITS[suit];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...display }}
      >
        <ArrowRight size={15} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <PlayingCard suit={suit} rank={rankLabel(opdracht.match)}>
        <div className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <SuitBadge suit={suit} />
            <span
              className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
              style={{ background: C.ink, color: C.card, ...mono }}
            >
              {opdracht.match}% match
            </span>
            <span className="text-[10.5px] tabular-nums" style={{ color: C.faint, ...mono }}>
              {opdracht.id}
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[40px] font-semibold leading-[1.02] tracking-[-0.01em] md:text-[48px]"
            style={display}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.red, color: C.cardHi, ...display }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.ink, border: `1.5px solid ${C.ink}`, ...display }}
            >
              Bewaar in set
            </button>
          </div>
        </div>
      </PlayingCard>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Kaartwaarde", v: `${opdracht.match}` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-xl p-5"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[10px] font-medium tracking-[0.14em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l.toUpperCase()}
            </p>
            <p
              className="mt-1.5 text-[24px] font-semibold tabular-nums tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <section
        className="rounded-2xl p-7"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <s.Icon
            size={16}
            style={{ fill: s.red ? C.red : C.ink, color: s.red ? C.red : C.ink }}
            aria-hidden="true"
          />
          <h2 className="text-[19px] font-semibold" style={display}>
            Waarom deze kaart past
          </h2>
        </div>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em]"
              style={{ color: C.gold, ...mono }}
            >
              <Check size={13} aria-hidden="true" /> WAT PAST
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 rounded-xl p-3 text-[13.5px]"
                  style={{ background: C.goldSoft, color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.gold }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em]"
              style={{ color: C.red, ...mono }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> AANDACHT
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 rounded-xl p-3 text-[13.5px]"
                  style={{ background: C.redSoft, color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.red }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

const CRED_SUITS: SuitKey[] = ["harten", "ruiten", "schoppen", "klaveren"];

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-8"
        style={{ background: C.cardHi, border: `1px solid ${C.line}` }}
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[10.5px] font-medium tracking-[0.18em]"
              style={{ color: C.faint, ...mono }}
            >
              VERTROUWEN
            </p>
            <h1
              className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.01em]"
              style={display}
            >
              Je kaartset
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} kaarten volledig geverifieerd. Eén vraagt
              binnenkort om actie.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[48px] font-semibold tabular-nums leading-none" style={display}>
              {ratio}
              <span className="text-[24px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p className="mt-1 text-[10.5px] tracking-[0.14em]" style={{ color: C.faint, ...mono }}>
              KWARTET COMPLEET
            </p>
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const suit = CRED_SUITS[i % 4] ?? "harten";
          return (
            <li key={c.naam}>
              <PlayingCard
                suit={suit}
                rank={st.tone === "ok" ? "A" : st.tone === "warn" ? "!" : "?"}
                className="h-full"
              >
                <div className="flex h-full flex-col pt-4">
                  <SuitBadge suit={suit} />
                  <h3 className="mt-3 text-[18px] font-semibold leading-tight" style={display}>
                    {c.naam}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                  <div className="mt-4 border-t pt-4" style={{ borderColor: C.lineSoft }}>
                    <StatusTag status={c.status} />
                    <button
                      className="mt-3 w-full rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        st.tone === "warn"
                          ? { background: C.red, color: C.cardHi, ...display }
                          : {
                              background: C.cardHi,
                              color: C.ink,
                              border: `1px solid ${C.line}`,
                              ...display,
                            }
                      }
                    >
                      {st.tone === "warn"
                        ? "Vernieuwen"
                        : c.status === "SUBMITTED"
                          ? "Volg status"
                          : "Bekijken"}
                    </button>
                  </div>
                </div>
              </PlayingCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <header>
        <p
          className="text-[10.5px] font-medium tracking-[0.18em]"
          style={{ color: C.faint, ...mono }}
        >
          AANDACHT
        </p>
        <h1
          className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.01em]"
          style={display}
        >
          Volgende zetten
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Speel deze kaarten op volgorde uit — elke afgeronde zet houdt je hand sterk.
        </p>
      </header>

      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const suit = CRED_SUITS[i % 4] ?? "harten";
          const su = SUITS[suit];
          return (
            <li
              key={a.titel}
              className="flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center"
              style={{
                background: C.card,
                border: `1px solid ${C.line}`,
                borderLeft: `4px solid ${warn ? C.red : C.ink}`,
              }}
            >
              <span
                className="flex h-14 w-11 shrink-0 flex-col items-center justify-center rounded-lg"
                style={{
                  background: C.cardHi,
                  border: `1px solid ${C.line}`,
                  color: warn ? C.red : C.ink,
                }}
                aria-hidden="true"
              >
                <span className="text-[17px] font-semibold tabular-nums" style={mono}>
                  {i + 1}
                </span>
                <su.Icon
                  size={12}
                  className="mt-0.5"
                  style={{ fill: su.red ? C.red : C.ink, color: su.red ? C.red : C.ink }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {warn && <AlertTriangle size={15} aria-hidden="true" style={{ color: C.red }} />}
                  <h2 className="text-[18px] font-semibold leading-snug" style={display}>
                    {a.titel}
                  </h2>
                </div>
                <p
                  className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                  style={{ color: C.muted }}
                >
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  warn
                    ? { background: C.red, color: C.cardHi, ...display }
                    : { background: C.ink, color: C.card, ...display }
                }
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurRed(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[10.5px] font-medium tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            OMZET
          </p>
          <h1
            className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.01em]"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink, color: C.card, ...display }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", red: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", red: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", red: false },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl p-6"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[11px] font-medium tracking-[0.06em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums tracking-[-0.01em]"
              style={{ color: s.red ? C.red : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 px-6 py-3 text-[10px] font-medium tracking-[0.14em] sm:grid"
          style={{ color: C.faint, background: C.cardHi, ...mono }}
        >
          <span>NUMMER</span>
          <span>KLANT</span>
          <span>DATUM</span>
          <span>STATUS</span>
          <span className="text-right">BEDRAG</span>
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const red = factuurRed(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-t px-6 py-4 transition-colors hover:bg-[#efe9da] sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[16px] font-semibold sm:order-2"
                  style={display}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                    style={
                      red
                        ? { background: C.redSoft, color: C.red, ...mono }
                        : f.status === "Betaald"
                          ? { background: C.goldSoft, color: C.gold, ...mono }
                          : { background: C.lineSoft, color: C.muted, ...mono }
                    }
                  >
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: red ? C.red : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between border-t px-6 py-4"
          style={{ borderColor: C.line }}
        >
          <span className="text-[10.5px] tracking-[0.14em]" style={{ color: C.faint, ...mono }}>
            TOTAAL BETAALD
          </span>
          <span
            className="text-[24px] font-semibold tabular-nums"
            style={{ color: C.ink, ...display }}
          >
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
