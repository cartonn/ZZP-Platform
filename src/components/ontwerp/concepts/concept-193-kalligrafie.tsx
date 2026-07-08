"use client";

// Concept 193 — "Kalligrafie" · copperplate-inkt, formeel-vertrouwen, editorial. Warm crème/perkament met
// diepe inkt-zwart en aubergine; grote elegante swash-koppen (serif display + italic), dunne inkt-hairlines
// als scheiding en flourish, en ledger-cijfers voor bedragen. Vertrouwen komt uit de rust en formaliteit
// van geschreven inkt — passend bij verificatie en notariële betrouwbaarheid. Onderscheidt zich van
// "notariaat" (zakelijke ledger-serif), "letterpers" (deboss/reliëf) en "typemachine" (mechanisch): dit is
// vloeiend, handgeschreven-elegant, met swashes en haarlijnen. Status nooit kleur-alleen: label + icoon +
// vorm. UI Nederlands. Fonts: Instrument Serif (swash-display + koppen) + Newsreader (tekst) +
// IBM Plex Mono (ledger-cijfers).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  Feather,
  BadgeCheck,
  PenLine,
  Stamp,
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

// ── Palet — perkament & inkt. Warm crème grond, diepe inkt-zwart met aubergine-ondertoon, één goud-
//    haarlijn als flourish. Geen felle kleuren; vertrouwen komt uit de rust van de inkt. ──
const C = {
  paper: "#f2e8d3", // perkament (grond)
  paperCard: "#faf3e2", // lichter kaart-oppervlak
  paperDeep: "#ece0c6", // dieper vlak / hover
  ink: "#221a20", // diepe inkt (tekst + hairlines) met aubergine-ondertoon
  aubergine: "#5a2a4c", // aubergine-inkt (accent / zegel)
  aubergineDeep: "#3c1a33",
  inkSoft: "#5b4f54", // secundaire tekst
  inkFaint: "#8b7d78", // labels
  gold: "#9c7a37", // goud-haarlijn / flourish
  goldSoft: "#bfa062",
  ochre: "#b07d2a", // waarschuwing (verloopt) — warme inkt
  crimson: "#8f2f38", // afgewezen — donkerrode inkt
  onInk: "#f6efdd", // crème-tekst op inkt-vlak
};

const swash = { fontFamily: "var(--font-lab-instrument-serif)" };
const bodyF = { fontFamily: "var(--font-lab-newsreader)" };
const ledger = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Status-model — inkt-taal. Onderscheid via icoon + label + vorm (zegel / hairline-omlijnd / gestreept /
//    dubbele regel). Kleur ondersteunt binnen het inkt/aubergine-palet, draagt nooit alleen. ──
type Variant = "seal" | "hairline" | "dashed" | "double";
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  border: string;
  variant: Variant;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      // Aubergine zegel — bezegeld, formeel bekrachtigd
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.onInk,
        bg: C.aubergine,
        border: C.aubergine,
        variant: "seal",
      };
    case "SUBMITTED":
      // Fijne inkt-hairline — ingediend, in behandeling
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.inkSoft,
        bg: "transparent",
        border: C.ink,
        variant: "hairline",
      };
    case "EXPIRING":
      // Gestreepte ochre-lijn — verloopt binnenkort
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.ochre,
        bg: "rgba(176,125,42,0.10)",
        border: C.ochre,
        variant: "dashed",
      };
    case "REJECTED":
      // Dubbele crimson-regel — doorgehaald, afgewezen
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.crimson,
        bg: "rgba(143,47,56,0.08)",
        border: C.crimson,
        variant: "double",
      };
  }
}

function borderFor(m: StatusStyle): React.CSSProperties {
  if (m.variant === "seal") return { border: `1px solid ${m.border}` };
  if (m.variant === "dashed") return { border: `1px dashed ${m.border}` };
  if (m.variant === "double") return { border: `2.5px double ${m.border}` };
  return { border: `1px solid ${m.border}` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium italic"
      style={{ ...bodyF, background: m.bg, color: m.fg, ...borderFor(m) }}
    >
      <m.Icon size={12} strokeWidth={2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Flourish — dunne inkt-haarlijn met een klein diamant-ornament in het midden (kalligrafische regel). ──
function Flourish({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, transparent, ${C.gold})` }}
      />
      <span className="h-1.5 w-1.5 rotate-45" style={{ background: C.gold }} />
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, ${C.gold}, transparent)` }}
      />
    </div>
  );
}

// ── Kaart — perkament-vel met fijne inkt-rand; bij hover licht opgetild als een blad papier. ──
function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[10px] ${interactive ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-22px_rgba(34,26,32,0.5)]" : ""} ${className}`}
      style={{ background: C.paperCard, boxShadow: `inset 0 0 0 1px ${C.ink}22`, ...style }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — inkt-glyph + swash-titel + gouden hairline.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: "transparent", boxShadow: `inset 0 0 0 1px ${C.ink}44` }}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={1.7} style={{ color: C.aubergine }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[26px] font-normal italic leading-none tracking-[0]"
          style={{ ...swash, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12.5px] italic" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span className="ml-2 hidden flex-1 items-center gap-2 sm:flex" aria-hidden="true">
        <span
          className="h-px flex-1"
          style={{ background: `linear-gradient(90deg, ${C.gold}88, transparent)` }}
        />
        <span className="h-1 w-1 rotate-45" style={{ background: C.gold }} />
      </span>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.7} style={{ color: C.aubergine }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — aubergine-boog op inkt-lichte rest, ledger-cijfer in het hart.
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.aubergine} 0deg, ${C.aubergine} ${deg}deg, ${C.paperDeep} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.paperCard }}
      >
        <span
          className="text-[15px] font-medium tabular-nums leading-none"
          style={{ ...ledger, color: C.aubergine }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-medium uppercase italic tracking-[0.16em]"
          style={{ ...bodyF, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Spark — een vloeiende inkt-penstreek (curve) i.p.v. staven.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 30;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h / 2] as const);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-8 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke={C.aubergine}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={C.gold} />
    </svg>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept193() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.paper, color: C.ink }}
    >
      {/* Perkament-vignet — subtiele warme verdonkering aan de randen */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, rgba(255,250,235,0.5), transparent 55%), radial-gradient(100% 60% at 50% 120%, rgba(60,26,51,0.06), transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — masthead als briefhoofd met swash-titel en gouden hairline */}
        <header className="relative" style={{ background: C.paper }}>
          <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.aubergine, boxShadow: `inset 0 0 0 1px ${C.gold}` }}
                  aria-hidden="true"
                >
                  <Feather size={22} strokeWidth={1.6} style={{ color: C.onInk }} />
                </span>
                <div className="leading-tight">
                  <div
                    className="text-[10px] font-medium uppercase tracking-[0.34em]"
                    style={{ ...ledger, color: C.aubergine }}
                  >
                    Kalligrafie
                  </div>
                  <div
                    className="text-[34px] font-normal italic leading-none"
                    style={{ ...swash, color: C.ink }}
                  >
                    Inkt &amp; Perkament
                  </div>
                  <div
                    className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                    style={{ ...ledger, color: C.inkFaint }}
                  >
                    Match · Verificatie · Omzet
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium italic sm:inline-flex"
                  style={{
                    ...bodyF,
                    background: "transparent",
                    color: C.aubergine,
                    boxShadow: `inset 0 0 0 1px ${C.aubergine}66`,
                  }}
                >
                  <ShieldCheck size={12} strokeWidth={1.8} aria-hidden="true" /> {PROFIEL.trust}
                </span>
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-medium italic"
                  style={{
                    ...swash,
                    background: C.aubergine,
                    color: C.onInk,
                    boxShadow: `inset 0 0 0 1px ${C.gold}`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
              </div>
            </div>
            <Flourish className="mt-5" />
          </div>

          {/* Scherm-switcher — inkt-onderstreepte tabs */}
          <nav
            className="mx-auto mt-1 flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-3 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-md px-3.5 py-2 text-[14px] font-normal italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
                  style={{
                    ...bodyF,
                    color: on ? C.ink : C.inkFaint,
                    ["--tw-ring-color" as string]: C.aubergine,
                  }}
                >
                  {s.label}
                  {on && (
                    <span
                      className="absolute inset-x-2 -bottom-0.5 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="h-px w-full" style={{ background: C.aubergine }} />
                      <span className="absolute h-1 w-1 rotate-45" style={{ background: C.gold }} />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div
            className="h-px w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${C.ink}33, transparent)` }}
            aria-hidden="true"
          />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-9">
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

        <footer className="mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <Flourish className="mb-4" />
          <div
            className="flex items-center justify-center gap-2 text-[12px] italic"
            style={{ ...bodyF, color: C.inkFaint }}
          >
            <PenLine size={13} strokeWidth={1.6} aria-hidden="true" /> Bezegeld met inkt —
            vertrouwen dat je op papier kunt lezen.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — briefkop op perkament met grote swash-titel */}
      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(90% 130% at 0% 0%, rgba(90,42,76,0.06), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl p-6 sm:p-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium italic"
            style={{
              ...bodyF,
              background: "transparent",
              color: C.aubergine,
              boxShadow: `inset 0 0 0 1px ${C.aubergine}66`,
            }}
          >
            <Star size={12} strokeWidth={1.8} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[38px] font-normal italic leading-[1.02] sm:text-[54px]"
            style={{ ...swash, color: C.ink }}
          >
            Drie matches boven vijfentachtig procent — geschreven in jouw voordeel.
          </h1>
          <p
            className="mt-4 max-w-lg text-[15px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén zaak vraagt uw aandacht: uw VOG verloopt binnenkort. Vernieuw hem, en uw profiel
            blijft onberispelijk bezegeld.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium italic transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf3e2]"
              style={{
                ...bodyF,
                background: C.aubergine,
                color: C.onInk,
                boxShadow: `inset 0 0 0 1px ${C.gold}`,
                ["--tw-ring-color" as string]: C.aubergine,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf3e2]"
              style={{
                ...bodyF,
                background: "transparent",
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.ink}55`,
                ["--tw-ring-color" as string]: C.aubergine,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={1.9}
                style={{ color: C.ochre }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten met ledger-cijfers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] italic" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  ...ledger,
                  background: "transparent",
                  color: k.up ? C.aubergine : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? C.aubergine + "66" : C.ink + "33"}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[27px] font-medium tabular-nums leading-none"
              style={{ ...ledger, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Feather}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.aubergine }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[19px] font-normal italic leading-tight"
                          style={{ ...swash, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[13px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] italic"
                          style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2}
                            style={{ color: C.aubergine }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.aubergine} 0deg, ${C.aubergine} ${dek * 3.6}deg, ${C.paperDeep} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.paperCard }}
                >
                  <span
                    className="text-[26px] font-medium tabular-nums leading-none"
                    style={{ ...ledger, color: C.aubergine }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — aubergine inkt-vlak */}
          <Card
            className="relative"
            style={{ background: C.aubergine, boxShadow: `inset 0 0 0 1px ${C.gold}` }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(80% 120% at 100% 0%, rgba(246,239,221,0.12), transparent 55%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]"
                style={{ ...ledger, background: "rgba(246,239,221,0.16)", color: C.onInk }}
              >
                <TriangleAlert size={11} strokeWidth={2} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[26px] font-normal italic leading-tight"
                style={{ ...swash, color: C.onInk }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(246,239,221,0.82)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium italic transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5a2a4c]"
                style={{
                  ...bodyF,
                  background: C.onInk,
                  color: C.aubergine,
                  ["--tw-ring-color" as string]: C.onInk,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek-empty-state, skeleton-loading én foutstrook ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.paperCard, boxShadow: `inset 0 0 0 1px ${C.ink}33` }}
          >
            <Search size={15} style={{ color: C.aubergine }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[14px] italic outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
            style={{
              background: C.paperCard,
              boxShadow: `inset 0 0 0 1px ${C.ink}33`,
              ["--tw-ring-color" as string]: C.aubergine,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.aubergine }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dubbele crimson-regel + kruis */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[10px] p-4"
          role="alert"
          style={{ background: "rgba(143,47,56,0.07)", border: `2px double ${C.crimson}` }}
        >
          <XCircle size={18} strokeWidth={2} style={{ color: C.crimson }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-normal italic" style={{ ...swash, color: C.ink }}>
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium italic transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.crimson, ["--tw-ring-color" as string]: C.crimson }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.paperDeep }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.paperDeep }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.paperDeep }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.paperDeep }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.paperDeep }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "transparent", boxShadow: `inset 0 0 0 1px ${C.ink}44` }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.5} style={{ color: C.aubergine }} />
          </span>
          <p className="text-[26px] font-normal italic" style={{ ...swash, color: C.ink }}>
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[14px] italic" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas uw zoekterm aan om het register opnieuw te
            vullen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[13px] font-medium italic transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
            style={{
              ...bodyF,
              background: C.aubergine,
              color: C.onInk,
              boxShadow: `inset 0 0 0 1px ${C.gold}`,
              ["--tw-ring-color" as string]: C.aubergine,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div className="flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[19px] font-normal italic leading-tight"
                    style={{ ...swash, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4">
                <Flourish />
              </div>
              <div className="px-4 pb-4 pt-3">
                <dl className="grid grid-cols-2 gap-y-2 text-[13px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[11px] italic"
                      style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[13px] font-medium italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.ink}22`,
                  color: C.aubergine,
                  ["--tw-ring-color" as string]: C.aubergine,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
        style={{
          ...bodyF,
          background: C.paperCard,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.ink}33`,
          ["--tw-ring-color" as string]: C.aubergine,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 130% at 100% 0%, rgba(90,42,76,0.07), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-9">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                ...ledger,
                background: "transparent",
                color: C.aubergine,
                boxShadow: `inset 0 0 0 1px ${C.aubergine}66`,
              }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[34px] font-normal italic leading-[1.02] sm:text-[46px]"
              style={{ ...swash, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={82} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ boxShadow: `inset 0 0 0 1px ${C.ink}33` }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.7} style={{ color: C.aubergine }} />
            </span>
            <div
              className="mt-3 text-[18px] font-medium tabular-nums leading-none"
              style={{ ...ledger, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[11px] uppercase italic tracking-[0.08em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(90,42,76,0.12)" }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.2} style={{ color: C.aubergine }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.paperDeep, boxShadow: `inset 0 0 0 1px ${C.ochre}66` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2} style={{ color: C.ochre }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium italic transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
          style={{
            ...bodyF,
            background: C.aubergine,
            color: C.onInk,
            boxShadow: `inset 0 0 0 1px ${C.gold}`,
            ["--tw-ring-color" as string]: C.aubergine,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
          style={{
            ...bodyF,
            background: C.paperCard,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.ink}33`,
            ["--tw-ring-color" as string]: C.aubergine,
          }}
        >
          <Star size={15} strokeWidth={1.8} style={{ color: C.aubergine }} aria-hidden="true" />{" "}
          Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium italic transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
          style={{
            ...bodyF,
            background: C.aubergine,
            color: C.onInk,
            boxShadow: `inset 0 0 0 1px ${C.gold}`,
            ["--tw-ring-color" as string]: C.aubergine,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 130% at 0% 0%, rgba(90,42,76,0.06), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.aubergine} 0deg, ${C.aubergine} ${dek * 3.6}deg, ${C.paperDeep} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.paperCard }}
            >
              <span
                className="text-[30px] font-medium tabular-nums leading-none"
                style={{ ...ledger, color: C.aubergine }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[24px] font-normal italic" style={{ ...swash, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[14px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk bezegeld certificaat versterkt het geheel. Houd uw dekking hoog, dan blijft uw
              profiel onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium italic"
              style={{
                ...bodyF,
                background: C.aubergine,
                color: C.onInk,
                boxShadow: `inset 0 0 0 1px ${C.gold}`,
              }}
            >
              <Stamp size={12} strokeWidth={1.8} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: m.variant === "seal" ? C.aubergine : "transparent",
                  ...(m.variant === "seal"
                    ? { boxShadow: `inset 0 0 0 1px ${C.gold}` }
                    : borderFor(m)),
                }}
                aria-hidden="true"
              >
                <m.Icon
                  size={20}
                  strokeWidth={1.9}
                  style={{ color: m.variant === "seal" ? C.onInk : m.fg }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[18px] font-normal italic leading-tight"
                  style={{ ...swash, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[12px] font-medium italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#faf3e2]"
                      style={{
                        ...bodyF,
                        background: C.paperDeep,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.ink}22`,
                        ["--tw-ring-color" as string]: C.aubergine,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Documenten-register — verrijking */}
      <section className="space-y-3">
        <SectionHead
          title="Documentenregister"
          sub="Privé — alleen geverifieerd zichtbaar voor opdrachtgevers"
          Icon={FileText}
        />
        <Card>
          {DOCUMENTEN.map((d, i) => {
            const m = credMeta(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={i === 0 ? undefined : { borderTop: `1px solid ${C.ink}18` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-medium"
                  style={{
                    ...ledger,
                    background: C.paperDeep,
                    color: C.aubergine,
                    boxShadow: `inset 0 0 0 1px ${C.ink}22`,
                  }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[15px] font-normal italic"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    {d.naam}
                  </div>
                  <div className="text-[11px]" style={{ ...ledger, color: C.inkFaint }}>
                    {d.grootte} · bijgewerkt {d.bijgewerkt}
                  </div>
                </div>
                <span
                  className="hidden items-center gap-1 text-[12px] font-medium italic sm:inline-flex"
                  style={{ ...bodyF, color: m.fg === C.onInk ? C.aubergine : m.fg }}
                >
                  <m.Icon size={12} strokeWidth={1.9} aria-hidden="true" /> {m.label}
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Feather}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.ochre : C.aubergine }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[18px] font-medium italic tabular-nums"
                    style={
                      warn
                        ? {
                            ...swash,
                            background: "rgba(176,125,42,0.12)",
                            color: C.ochre,
                            boxShadow: `inset 0 0 0 1px ${C.ochre}55`,
                          }
                        : {
                            ...swash,
                            background: C.paperDeep,
                            color: C.aubergine,
                            boxShadow: `inset 0 0 0 1px ${C.ink}22`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? {
                                ...ledger,
                                background: "rgba(176,125,42,0.12)",
                                color: C.ochre,
                                boxShadow: `inset 0 0 0 1px ${C.ochre}55`,
                              }
                            : {
                                ...ledger,
                                background: "rgba(90,42,76,0.10)",
                                color: C.aubergine,
                                boxShadow: `inset 0 0 0 1px ${C.aubergine}55`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.2} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[22px] font-normal italic"
                        style={{ ...swash, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium italic transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf3e2]"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.ochre,
                              color: C.onInk,
                              ["--tw-ring-color" as string]: C.ochre,
                            }
                          : {
                              ...bodyF,
                              background: C.aubergine,
                              color: C.onInk,
                              boxShadow: `inset 0 0 0 1px ${C.gold}`,
                              ["--tw-ring-color" as string]: C.aubergine,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Correspondentie" sub="Recente gesprekken" Icon={PenLine} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.ink}18` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-normal italic"
                style={{
                  ...swash,
                  background: "rgba(90,42,76,0.10)",
                  color: C.aubergine,
                  boxShadow: `inset 0 0 0 1px ${C.aubergine}44`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[17px] font-normal italic"
                    style={{ ...swash, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rotate-45"
                      style={{ background: C.aubergine }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...ledger, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; seal: boolean; dashed: boolean } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, seal: true, dashed: false };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, seal: false, dashed: true };
    return { label: "Concept", Icon: FileText, seal: false, dashed: false };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium italic transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2e8d3]"
          style={{
            ...bodyF,
            background: C.aubergine,
            color: C.onInk,
            boxShadow: `inset 0 0 0 1px ${C.gold}`,
            ["--tw-ring-color" as string]: C.aubergine,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-px w-8" style={{ background: C.gold }} />
              <span className="h-1 w-1 rotate-45" style={{ background: C.gold }} />
            </div>
            <div className="mt-3 text-[12px] italic" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[27px] font-medium tabular-nums leading-none"
              style={{ ...ledger, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.paperDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...ledger, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.ink}18` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-medium tabular-nums"
                      style={{ ...ledger, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="px-4 py-3 text-[14px] italic"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...ledger, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium italic"
                        style={{
                          ...bodyF,
                          background: m.seal ? C.aubergine : "transparent",
                          color: m.seal ? C.onInk : m.dashed ? C.ochre : C.inkSoft,
                          border: m.seal
                            ? `1px solid ${C.aubergine}`
                            : m.dashed
                              ? `1px dashed ${C.ochre}`
                              : `1px solid ${C.ink}33`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-medium tabular-nums"
                      style={{ ...ledger, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.aubergine }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...ledger, color: "rgba(246,239,221,0.72)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-medium tabular-nums"
                  style={{ ...ledger, color: C.onInk }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
