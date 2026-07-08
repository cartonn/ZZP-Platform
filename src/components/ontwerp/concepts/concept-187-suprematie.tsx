"use client";

// Concept 187 — "Suprematie" · Suprematisme (Malevich / El Lissitzky). Vrij-zwevende geometrische
// vlakken, dynamische diagonalen en een gedurfd rood/zwart op warm-wit met blauw als extra primair.
// Géén raster (dat is De Stijl/Bauhaus) — hier zweven diagonaal-gebalanceerde vormen met veel witruimte
// en spanning. KPI's en kaarten zijn compositie-elementen; navigatie is een typografische diagonale
// banier. Museaal, avant-garde, maar volledig functioneel en leesbaar. Alle vlakken deterministisch via
// CSS/SVG — geen random/Date. Status nooit kleur-alleen (label + icoon + vorm). UI-taal Nederlands.
// Fonts: Space Grotesk (display) + Manrope (tekst) + Geist Mono (data/labels).

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
  Zap,
  RefreshCw,
  Square,
  Triangle,
  Circle,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — suprematistisch: warm-wit doek, zuiver zwart, gedurfd rood, één blauw als extra primair,
//    plus een geel-oker vonk. Vlakken botsen kleur tegen kleur; de witruimte draagt de spanning. ──
const C = {
  paper: "#f4f0e6", // warm-wit doek
  paperDeep: "#ece6d6", // secundair vlak
  card: "#faf7ef", // schone kaart
  ink: "#141210", // zuiver bijna-zwart
  inkSoft: "#4a453d", // secundaire tekst
  inkFaint: "#8b8577", // labels
  line: "#ddd6c4", // fijne rand
  red: "#d8352a", // suprematistisch rood
  redDeep: "#a51f18",
  redSoft: "#f6ddd8",
  blue: "#1b4f8f", // extra primair blauw
  blueSoft: "#dde6f1",
  gold: "#e0a51f", // geel-oker vonk
  goldSoft: "#f6ebca",
  // Semantisch (status)
  ok: "#2f7d4f",
  okSoft: "#dcecdf",
  warn: "#b0762a",
  warnSoft: "#f6e9d2",
  info: "#1b4f8f",
  infoSoft: "#dde6f1",
  danger: "#d8352a",
  dangerSoft: "#f6ddd8",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Zwevende suprematistische compositie — vaste, deterministische vlakken achter de content.
//    Diagonalen, een rood kwadraat, een blauwe balk, een zwarte cirkel, een gele driehoek. ──
function SuprematistField() {
  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Lange dynamische diagonaal — de ruggengraat van de compositie */}
      <line x1="-40" y1="120" x2="900" y2="760" stroke={C.ink} strokeWidth="2.5" opacity="0.28" />
      <line x1="300" y1="-40" x2="1260" y2="520" stroke={C.blue} strokeWidth="9" opacity="0.14" />
      {/* Rood kwadraat, licht gekanteld */}
      <rect
        x="120"
        y="90"
        width="150"
        height="150"
        fill={C.red}
        opacity="0.12"
        transform="rotate(-12 195 165)"
      />
      {/* Zwarte balk, diagonaal */}
      <rect
        x="760"
        y="140"
        width="360"
        height="34"
        fill={C.ink}
        opacity="0.16"
        transform="rotate(28 940 157)"
      />
      {/* Blauwe cirkel */}
      <circle cx="980" cy="560" r="120" fill={C.blue} opacity="0.1" />
      {/* Gele driehoek */}
      <path d="M180 620 L320 560 L300 720 Z" fill={C.gold} opacity="0.16" />
      {/* Zwart schijffragment */}
      <circle cx="150" cy="440" r="52" fill={C.ink} opacity="0.14" />
      {/* Fijne diagonale streep */}
      <line x1="620" y1="800" x2="1200" y2="360" stroke={C.red} strokeWidth="3" opacity="0.18" />
    </svg>
  );
}

// Merk-mark — een suprematistische compositie in het klein: kwadraat + cirkel + diagonaal.
function SuprematistMark({ size = 44 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size, background: C.ink }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 44 44">
        <rect x="8" y="10" width="18" height="18" fill={C.red} transform="rotate(-10 17 19)" />
        <circle cx="30" cy="30" r="8" fill={C.gold} />
        <line x1="4" y1="40" x2="40" y2="6" stroke={C.white} strokeWidth="1.6" opacity="0.7" />
      </svg>
    </span>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint + vorm) ─────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{ ...mono, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kaart — hard-kantig compositie-vlak met een gedurfde accentbalk en subtiele schaduw ──
function Card({
  children,
  className = "",
  style,
  interactive = false,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`relative ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 hover:translate-x-0.5"
          : ""
      } ${className}`}
      style={{
        background: C.card,
        boxShadow: `0 0 0 1.5px ${C.ink}, 6px 6px 0 -1px ${C.ink}14`,
        ...style,
      }}
    >
      {accent && (
        <span
          className="absolute left-0 top-0 h-full w-1.5"
          style={{ background: accent }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Sectie-kop — geometrische mark + titel + diagonale accentstreep.
function SectionHead({
  title,
  sub,
  shape = "square",
}: {
  title: string;
  sub?: string;
  shape?: "square" | "circle" | "triangle";
}) {
  const Shape = shape === "circle" ? Circle : shape === "triangle" ? Triangle : Square;
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center"
        style={{ background: C.red }}
        aria-hidden="true"
      >
        <Shape size={15} strokeWidth={2.4} fill={C.white} style={{ color: C.white }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[20px] font-bold uppercase leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-1 hidden h-[3px] flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.ink}, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2.2} style={{ color: C.red }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-badge — een gekanteld rood kwadraat met het cijfer, suprematistisch.
function MatchBadge({ value, size = 54 }: { value: number; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute inset-0" style={{ background: C.ink, transform: "rotate(6deg)" }} />
      <span
        className="absolute inset-[3px] flex flex-col items-center justify-center"
        style={{ background: value >= 90 ? C.red : value >= 85 ? C.blue : C.paperDeep }}
      >
        <span
          className="text-[16px] font-bold tabular-nums leading-none"
          style={{ ...display, color: value >= 85 ? C.white : C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-[0.14em]"
          style={{ ...mono, color: value >= 85 ? "rgba(255,255,255,0.75)" : C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — harde kolommen, laatste in rood.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.red : `${C.ink}26`,
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept187() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.paper, color: C.ink }}
    >
      {/* Zwevende suprematistische compositie onder alles */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <SuprematistField />
      </div>

      <div className="relative z-10">
        {/* Kop — zwarte banier met diagonale typografie */}
        <header className="relative overflow-hidden" style={{ background: C.ink }}>
          <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
            <svg
              className="h-full w-full"
              viewBox="0 0 1200 200"
              preserveAspectRatio="xMidYMid slice"
            >
              <line
                x1="-20"
                y1="200"
                x2="700"
                y2="-20"
                stroke={C.red}
                strokeWidth="40"
                opacity="0.22"
              />
              <rect
                x="940"
                y="30"
                width="80"
                height="80"
                fill={C.blue}
                opacity="0.5"
                transform="rotate(14 980 70)"
              />
              <circle cx="1120" cy="150" r="50" fill={C.gold} opacity="0.4" />
            </svg>
          </div>
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <SuprematistMark size={46} />
              <div className="leading-tight">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.red }}
                >
                  Suprematie
                </div>
                <div
                  className="text-[24px] font-bold uppercase leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.white }}
                >
                  Compositie
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.5)" }}
                >
                  Match · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] sm:inline-flex"
                style={{ ...mono, background: "rgba(255,255,255,0.1)", color: C.white }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2.4}
                  style={{ color: C.gold }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
                style={{ ...mono, background: C.red, color: C.white }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — diagonale typografische banier */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-3.5 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141210]"
                  style={
                    on
                      ? {
                          ...mono,
                          background: C.red,
                          color: C.white,
                          ["--tw-ring-color" as string]: C.red,
                        }
                      : {
                          ...mono,
                          background: "rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.72)",
                          ["--tw-ring-color" as string]: C.red,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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

        <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t-2 pt-6 text-[11px] uppercase tracking-[0.1em]"
            style={{ ...mono, borderColor: C.ink, color: C.inkFaint }}
          >
            <Square size={11} fill={C.red} style={{ color: C.red }} aria-hidden="true" /> Vlakken
            zweven — de content houdt de vorm.
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
      {/* Hero — grote compositie met zwevend rood vlak en diagonale typografie */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid slice">
            <rect
              x="640"
              y="-30"
              width="220"
              height="220"
              fill={C.red}
              opacity="0.1"
              transform="rotate(-14 750 80)"
            />
            <circle cx="820" cy="270" r="90" fill={C.blue} opacity="0.1" />
            <line x1="500" y1="340" x2="900" y2="20" stroke={C.ink} strokeWidth="2" opacity="0.2" />
          </svg>
        </div>
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ ...mono, background: C.red, color: C.white }}
          >
            <Zap size={12} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-bold uppercase leading-[0.98] tracking-[-0.03em] sm:text-[42px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Je profiel vindt zijn vorm.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén vlak vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd de compositie in
            balans — onberispelijk verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.03em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, background: C.ink, ["--tw-ring-color" as string]: C.red }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                background: C.paperDeep,
                color: C.ink,
                boxShadow: `0 0 0 1.5px ${C.ink}`,
                ["--tw-ring-color" as string]: C.red,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.4}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten — elk een compositie-element met eigen accentkleur */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const accents = [C.red, C.blue, C.gold, C.ink];
          const accent = accents[i % accents.length];
          return (
            <Card key={k.label} interactive accent={accent} className="p-4 pl-5">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.04em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    ...mono,
                    background: k.up ? C.okSoft : C.warnSoft,
                    color: k.up ? C.ok : C.warn,
                  }}
                >
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            shape="square"
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.red }}
                >
                  <MatchBadge value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-bold uppercase tracking-[-0.01em]"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.red }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold"
                          style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.8}
                            style={{ color: C.ok }}
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
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" shape="circle" />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <DekBlock dek={dek} size={92} />
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — zwart compositie-vlak */}
          <Card className="relative overflow-hidden" style={{ background: C.ink }}>
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <svg
                className="h-full w-full"
                viewBox="0 0 400 240"
                preserveAspectRatio="xMidYMid slice"
              >
                <rect
                  x="300"
                  y="-20"
                  width="140"
                  height="140"
                  fill={C.red}
                  opacity="0.3"
                  transform="rotate(18 370 50)"
                />
                <circle cx="60" cy="220" r="60" fill={C.blue} opacity="0.35" />
              </svg>
            </div>
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warn, color: C.ink }}
              >
                <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[17px] font-bold uppercase leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.white }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(255,255,255,0.72)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141210]"
                style={{
                  ...mono,
                  background: C.red,
                  color: C.white,
                  ["--tw-ring-color" as string]: C.red,
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

// Dekking als suprematistisch blok — een verticaal opvullend rood vlak met percentage.
function DekBlock({ dek, size = 92 }: { dek: number; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-end justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        background: C.paperDeep,
        boxShadow: `0 0 0 1.5px ${C.ink}`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-x-0 bottom-0"
        style={{ height: `${dek}%`, background: C.red, opacity: 0.9 }}
      />
      <span className="relative mb-2 flex flex-col items-center">
        <span
          className="text-[24px] font-bold leading-none"
          style={{ ...display, color: dek > 55 ? C.white : C.ink }}
        >
          {dek}
          <span className="text-[13px]">%</span>
        </span>
      </span>
    </span>
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
        <SectionHead title="Marktplaats" sub="Open opdrachten" shape="triangle" />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.card, boxShadow: `0 0 0 1.5px ${C.ink}` }}
          >
            <Search size={15} style={{ color: C.red }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.card,
              boxShadow: `0 0 0 1.5px ${C.ink}`,
              ["--tw-ring-color" as string]: C.red,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.ink }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible, echte error-state */}
      {error && (
        <div
          className="flex items-start gap-3 p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: `0 0 0 1.5px ${C.danger}` }}
        >
          <XCircle size={18} strokeWidth={2.4} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div
              className="text-[13px] font-bold uppercase tracking-[0.02em]"
              style={{ ...display, color: C.danger }}
            >
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 px-2.5 py-1 text-[11px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...mono, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
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
                  className="h-12 w-12 shrink-0 animate-pulse"
                  style={{ background: C.paperDeep }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse"
                    style={{ background: C.paperDeep }}
                  />
                  <span className="block h-3 w-1/2 animate-pulse" style={{ background: C.line }} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span className="block h-3 w-full animate-pulse" style={{ background: C.line }} />
                <span className="block h-3 w-5/6 animate-pulse" style={{ background: C.line }} />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="relative flex flex-col items-center justify-center gap-3 overflow-hidden p-16 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
            <SuprematistField />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <SuprematistMark size={60} />
            <p className="text-[19px] font-bold uppercase" style={{ ...display, color: C.ink }}>
              Geen match gevonden
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om de compositie opnieuw te
              vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...mono, background: C.ink, ["--tw-ring-color" as string]: C.red }}
            >
              Zoekterm wissen
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const accents = [C.red, C.blue, C.gold];
            const accent = accents[i % accents.length];
            return (
              <Card key={o.id} interactive className="flex flex-col" accent={accent}>
                <div className="relative flex items-center gap-3 p-4 pl-5">
                  <MatchBadge value={o.match} size={48} />
                  <div className="min-w-0">
                    <h3
                      className="text-[15px] font-bold uppercase leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                </div>
                <div className="relative px-4 pb-4 pl-5">
                  <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...mono,
                    borderTop: `1.5px solid ${C.ink}`,
                    color: C.ink,
                    ["--tw-ring-color" as string]: C.red,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Card>
            );
          })}
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
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          background: C.card,
          color: C.ink,
          boxShadow: `0 0 0 1.5px ${C.ink}`,
          ["--tw-ring-color" as string]: C.red,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice">
            <rect
              x="660"
              y="-20"
              width="200"
              height="200"
              fill={C.red}
              opacity="0.1"
              transform="rotate(-12 760 80)"
            />
            <circle cx="840" cy="220" r="80" fill={C.blue} opacity="0.1" />
            <line x1="480" y1="260" x2="900" y2="0" stroke={C.ink} strokeWidth="2" opacity="0.18" />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
              style={{ ...mono, background: C.ink, color: C.white }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-bold uppercase leading-[1.02] tracking-[-0.02em] sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchBadge value={opdracht.match} size={82} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f, i) => {
          const accents = [C.red, C.blue, C.gold, C.ink];
          return (
            <Card key={f.l} interactive accent={accents[i % accents.length]} className="p-4 pl-5">
              <span
                className="flex h-8 w-8 items-center justify-center"
                style={{ background: C.paperDeep }}
                aria-hidden="true"
              >
                <f.Icon size={15} strokeWidth={2.2} style={{ color: C.red }} />
              </span>
              <div
                className="mt-3 text-[16px] font-bold leading-none"
                style={{ ...display, color: C.ink }}
              >
                {f.v}
              </div>
              <div
                className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                {f.l}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" shape="square" />
          <Card className="p-5" accent={C.ok}>
            <ul className="space-y-3 pl-1">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.okSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.8} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" shape="triangle" />
          <Card className="p-5" accent={C.warn}>
            <ul className="space-y-3 pl-1">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.warnSoft }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.6} style={{ color: C.warn }} />
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
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.03em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, background: C.red, ["--tw-ring-color" as string]: C.red }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.card,
            color: C.ink,
            boxShadow: `0 0 0 1.5px ${C.ink}`,
            ["--tw-ring-color" as string]: C.red,
          }}
        >
          <Star size={15} strokeWidth={2.2} style={{ color: C.gold }} aria-hidden="true" /> Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten & documenten" shape="circle" />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, background: C.ink, ["--tw-ring-color" as string]: C.red }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 900 220" preserveAspectRatio="xMidYMid slice">
            <rect
              x="680"
              y="-10"
              width="160"
              height="160"
              fill={C.blue}
              opacity="0.1"
              transform="rotate(14 760 70)"
            />
            <circle cx="200" cy="200" r="70" fill={C.gold} opacity="0.12" />
          </svg>
        </div>
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <DekBlock dek={dek} size={112} />
          <div className="max-w-sm">
            <div className="text-[16px] font-bold uppercase" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd vlak versterkt de compositie. Houd je dekking hoog, dan blijft je
              profiel onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.03em]"
              style={{ ...mono, background: C.okSoft, color: C.ok }}
            >
              <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card
              key={c.naam}
              interactive
              accent={m.fg}
              className="flex items-center gap-3.5 p-4 pl-5"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-bold uppercase tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="px-2.5 py-1 text-[11px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...mono,
                        background: C.paperDeep,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.red,
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
        shape="triangle"
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive accent={warn ? C.warn : C.blue} className="flex items-stretch">
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5 pl-6">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.blueSoft,
                      color: warn ? C.warn : C.blue,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.4} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ ...mono, background: warn ? C.warn : C.blue, color: C.white }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <Zap size={10} strokeWidth={2.6} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-bold uppercase tracking-[-0.01em]"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...mono,
                              background: C.warn,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.warn,
                            }
                          : {
                              ...mono,
                              background: C.ink,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.red,
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
        <SectionHead title="Berichten" sub="Recente gesprekken" shape="square" />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1.5px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold"
                style={{ ...mono, background: C.ink, color: C.white }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-bold uppercase tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-2 w-2"
                      style={{ background: C.red }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
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
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.info, bg: C.infoSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet & openstaand" shape="circle" />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...mono, background: C.ink, ["--tw-ring-color" as string]: C.red }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, accent: C.ok },
          { l: "Openstaand", v: `${open}`, accent: C.warn },
          { l: "Te factureren", v: "€ 1.350", accent: C.blue },
        ].map((s) => (
          <Card key={s.l} interactive accent={s.accent} className="p-4 pl-5">
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.04em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
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
              <tr style={{ background: C.ink }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: "rgba(255,255,255,0.7)" }}
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
                    className="transition-colors hover:bg-[#ece6d6]"
                    style={i === 0 ? undefined : { borderTop: `1.5px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase"
                        style={{ ...mono, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.red }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.85)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.white }}
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
