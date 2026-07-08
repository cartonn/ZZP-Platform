"use client";

// Concept 197 — "Speelkaart" · speelkaarten-taal op casino-vilt. Opdrachten en matches worden
// uitgedeeld als speelkaarten: crème kaartvlakken met afgeronde hoeken, hoek-indices (rang + suit),
// en de vier kleursuites (♠ ♥ ♦ ♣) coderen categorie/urgentie. Een 'uitgedeelde hand' waaiert licht;
// hover licht een kaart uit de hand en zet 'm recht; één kaart flipt (voor/achterkant) als micro-
// interactie. Warm casino-groen vilt, gouden bies, premium kaart-typografie (serif-display + sans +
// mono-cijfers). Onderscheidt zich radicaal van "legpuzzel" (puzzelstukken) en "totem" (gestapelde
// blokken): dit is de wereld van kaarten, suits, hand, deal en flip. Status NOOIT alleen op suit-kleur
// — altijd label + icoon + suit-glyph. Deterministisch — geen random/Date; waaier-hoeken zijn vast.
// UI Nederlands. Fonts: Fraunces (display) + Plus Jakarta Sans (tekst) + IBM Plex Mono (cijfers/index).

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
  Spade,
  Heart,
  Diamond,
  Club,
  Sparkles,
  RotateCw,
  Layers,
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

// ── Palet — casino-vilt (warm smaragd-groen) met crème kaartvlakken en gouden bies. De vier suits
//    dragen betekenis via KLEUR (rood/zwart) én GLYPH (♠♥♦♣), nooit kleur-alleen. ──
const C = {
  felt: "#12503d", // casino-vilt (smaragdgroen)
  feltDeep: "#0d3d2f", // dieper vilt
  feltEdge: "#0a3226", // rand / dieper vlak
  feltHi: "#17614a", // opgetild vilt / hover
  card: "#faf5e9", // crème kaartvlak
  cardHi: "#fffdf7", // lichter kaartvlak
  cardEdge: "#ece0c6", // kaartrand
  cardBack: "#8a1d2a", // kaartachterkant (klassiek karmozijn patroon)
  cardBackHi: "#a5273a",
  ink: "#1b2a22", // donkere tekst op kaart
  inkSoft: "#586a5e", // secundaire tekst op kaart
  inkFaint: "#8a998e", // labels op kaart
  red: "#c22636", // ♥ ♦ — harten/ruiten (rood)
  redSoft: "#e8b7bc",
  black: "#22302a", // ♠ ♣ — schoppen/klaveren (zwart)
  gold: "#c99f45", // gouden bies / accent
  goldHi: "#e7c877", // helder goud
  goldDeep: "#a07d2c",
  cream: "#f4ecd6", // primaire tekst op vilt
  creamSoft: "#bcd0c1", // secundaire tekst op vilt
  creamFaint: "#7fa08c", // labels op vilt
  onGold: "#231a06", // tekst op goud
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Suit-model — de vier speelkaartsuites. Elke suit heeft glyph, icoon en kleur. ──
type SuitName = "spade" | "heart" | "diamond" | "club";
type Suit = { name: SuitName; glyph: string; Icon: LucideIcon; color: string; label: string };
const SUITS: Record<SuitName, Suit> = {
  spade: { name: "spade", glyph: "♠", Icon: Spade, color: C.black, label: "Schoppen" },
  heart: { name: "heart", glyph: "♥", Icon: Heart, color: C.red, label: "Harten" },
  diamond: { name: "diamond", glyph: "♦", Icon: Diamond, color: C.red, label: "Ruiten" },
  club: { name: "club", glyph: "♣", Icon: Club, color: C.black, label: "Klaveren" },
};

// ── Status-model — status via LABEL + ICOON + SUIT-GLYPH, nooit kleur-alleen. Elke credential-status
//    krijgt een suit toegewezen (categorie/urgentie) plus een expliciet chip-label en -icoon. ──
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  suit: Suit;
  fg: string;
  bg: string;
  border: string;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      // Schoppen-aas — sterkste kaart. Gevuld gouden chip.
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        suit: SUITS.spade,
        fg: C.onGold,
        bg: C.goldHi,
        border: C.gold,
      };
    case "SUBMITTED":
      // Klaveren — in het spel, wachtend. Rustige omlijnde chip.
      return {
        label: "In beoordeling",
        Icon: Clock,
        suit: SUITS.club,
        fg: C.ink,
        bg: C.card,
        border: C.cardEdge,
      };
    case "EXPIRING":
      // Ruiten — rood, vraagt aandacht. Waarschuwing.
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        suit: SUITS.diamond,
        fg: C.red,
        bg: "rgba(194,38,54,0.10)",
        border: C.red,
      };
    case "REJECTED":
      // Harten — rood, afgewezen. Kruis-icoon + rode rand.
      return {
        label: "Afgewezen",
        Icon: XCircle,
        suit: SUITS.heart,
        fg: C.red,
        bg: "rgba(194,38,54,0.14)",
        border: C.red,
      };
  }
}

// Categorie-suit per opdracht — puur decoratief: koppelt een suit aan de index (deterministisch).
function opdrachtSuit(index: number): Suit {
  const order: SuitName[] = ["spade", "heart", "diamond", "club"];
  return SUITS[order[index % order.length] as SuitName];
}

// Rang-label voor kaart-hoekindex (deterministisch afgeleid van match-percentage).
function rankFor(match: number): string {
  if (match >= 92) return "A";
  if (match >= 88) return "K";
  if (match >= 84) return "Q";
  if (match >= 80) return "J";
  return "10";
}

// ── Suit-glyph — grote decoratieve suit met correcte kleur ──
function SuitGlyph({ suit, size = 16 }: { suit: Suit; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block leading-none"
      style={{ color: suit.color, fontSize: size }}
    >
      {suit.glyph}
    </span>
  );
}

// ── Status-chip — label + icoon + suit-glyph. ──
function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ ...bodyF, background: m.bg, color: m.fg, border: `1px solid ${m.border}` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
      <span aria-hidden="true" style={{ color: m.suit.color, opacity: 0.85 }}>
        {m.suit.glyph}
      </span>
    </span>
  );
}

// ── Speelkaart — crème vlak met afgeronde hoeken, hoek-indices (rang + suit) op beide diagonalen,
//    en een zachte gouden bies. Optioneel 'gedeald' (waaier-rotatie) en hover-lift. ──
function PlayingCard({
  children,
  rank,
  suit,
  rotate = 0,
  lift = false,
  className = "",
  style,
}: {
  children: React.ReactNode;
  rank?: string;
  suit?: Suit;
  rotate?: number;
  lift?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`group/card relative rounded-2xl ${
        lift
          ? "transition-transform duration-300 will-change-transform hover:-translate-y-2 hover:!rotate-0"
          : ""
      } ${className}`}
      style={{
        background: C.card,
        boxShadow: `inset 0 0 0 1px ${C.cardEdge}, inset 0 0 0 4px ${C.card}, inset 0 0 0 5px ${C.gold}44, 0 18px 40px -22px rgba(0,0,0,0.6)`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      {rank && suit && (
        <>
          {/* Hoek-index linksboven */}
          <span
            className="pointer-events-none absolute left-2.5 top-2 flex flex-col items-center leading-none"
            aria-hidden="true"
          >
            <span className="text-[13px] font-bold" style={{ ...mono, color: suit.color }}>
              {rank}
            </span>
            <span className="text-[12px]" style={{ color: suit.color }}>
              {suit.glyph}
            </span>
          </span>
          {/* Hoek-index rechtsonder (180° gedraaid, klassieke kaart) */}
          <span
            className="pointer-events-none absolute bottom-2 right-2.5 flex rotate-180 flex-col items-center leading-none"
            aria-hidden="true"
          >
            <span className="text-[13px] font-bold" style={{ ...mono, color: suit.color }}>
              {rank}
            </span>
            <span className="text-[12px]" style={{ color: suit.color }}>
              {suit.glyph}
            </span>
          </span>
        </>
      )}
      {children}
    </div>
  );
}

// ── Match-pip — het match-percentage als kaart-pip: grote suit-glyph met mono-cijfer ervoor. ──
function MatchPip({ value, suit, size = 56 }: { value: number; suit: Suit; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: C.cardHi,
        boxShadow: `inset 0 0 0 1px ${C.cardEdge}, inset 0 0 0 2px ${C.card}, inset 0 0 0 3px ${suit.color}33`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute right-1 top-0.5 text-[13px] leading-none"
        style={{ color: suit.color }}
      >
        {suit.glyph}
      </span>
      <span className="flex flex-col items-center leading-none">
        <span className="text-[17px] font-bold tabular-nums" style={{ ...mono, color: C.ink }}>
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-[0.16em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// ── Mini-spark — pips-op-een-rij, laatste pip gevuld goud (kaart-esthetiek). ──
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(16, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.gold : `${C.gold}3d`,
          }}
        />
      ))}
    </div>
  );
}

// ── Sectie-kop — gouden suit-glyph + serif-titel + dunne gouden liniaal. ──
function SectionHead({ title, sub, suit }: { title: string; sub?: string; suit: Suit }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[17px] leading-none"
        style={{
          background: C.feltHi,
          boxShadow: `inset 0 0 0 1px ${C.gold}44`,
          color: suit.color,
        }}
        aria-hidden="true"
      >
        {suit.glyph}
      </span>
      <div className="min-w-0">
        <h2
          className="text-[22px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.cream }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.creamFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.gold}88, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.goldDeep }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// ── Primaire knop (goud) ──
function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{
        ...bodyF,
        background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
        color: C.onGold,
        boxShadow: `inset 0 1px 0 ${C.goldHi}, 0 8px 20px -12px ${C.gold}`,
        ["--tw-ring-color" as string]: C.gold,
        ["--tw-ring-offset-color" as string]: C.felt,
      }}
    >
      {children}
    </button>
  );
}

// ── Secundaire knop (vilt) ──
function GhostButton({
  children,
  onClick,
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{
        ...bodyF,
        background: C.feltHi,
        color: C.cream,
        boxShadow: `inset 0 0 0 1px ${C.gold}44`,
        ["--tw-ring-color" as string]: C.gold,
        ["--tw-ring-offset-color" as string]: C.felt,
      }}
    >
      {children}
    </button>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept197() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.felt, color: C.cream }}
    >
      {/* Vilt-textuur — deterministische radiale gloed + fijne diagonale weave */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 80% at 50% -10%, ${C.feltHi}, transparent 55%), radial-gradient(80% 60% at 100% 100%, ${C.feltDeep}, transparent 60%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 7px)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — masthead met gouden bies (als tafelrand) */}
        <header className="relative overflow-hidden" style={{ background: C.feltDeep }}>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${C.gold}, ${C.goldHi}, ${C.gold}, transparent)`,
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              {/* Logo — vier mini-suits als een fanned hand */}
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] leading-none"
                style={{
                  background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
                  boxShadow: `0 0 22px -6px ${C.gold}`,
                  color: C.onGold,
                }}
                aria-hidden="true"
              >
                <span className="flex gap-[1px]">
                  <span style={{ color: C.black }}>♠</span>
                  <span style={{ color: C.red }}>♥</span>
                </span>
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.goldHi }}
                >
                  Speelkaart
                </div>
                <div
                  className="text-[26px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.cream }}
                >
                  Volle Hand
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.creamFaint }}
                >
                  Deal · Match · Verificatie
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.feltHi,
                  color: C.goldHi,
                  boxShadow: `inset 0 0 0 1px ${C.gold}44`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  ...mono,
                  background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
                  color: C.onGold,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — kaart-tabs */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              const suit = opdrachtSuit(i);
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.card,
                          color: C.ink,
                          boxShadow: `inset 0 0 0 1px ${C.gold}, 0 4px 10px -6px rgba(0,0,0,0.5)`,
                          ["--tw-ring-color" as string]: C.gold,
                          ["--tw-ring-offset-color" as string]: C.feltDeep,
                        }
                      : {
                          ...bodyF,
                          background: C.feltHi,
                          color: C.creamSoft,
                          boxShadow: `inset 0 0 0 1px ${C.gold}33`,
                          ["--tw-ring-color" as string]: C.gold,
                          ["--tw-ring-offset-color" as string]: C.feltDeep,
                        }
                  }
                >
                  <span aria-hidden="true" style={{ color: on ? suit.color : C.creamFaint }}>
                    {suit.glyph}
                  </span>
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
            className="flex items-center justify-center gap-2 pt-6 text-[11px]"
            style={{ ...mono, borderTop: `1px solid ${C.gold}33`, color: C.creamFaint }}
          >
            <Layers size={12} aria-hidden="true" /> Een sterke hand: elke kaart een match, elke suit
            een reden. Speel de bovenste eerst.
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
  // Vaste, deterministische waaier-hoeken voor de 'uitgedeelde hand'.
  const fan = [-7, 0, 7];

  return (
    <div className="space-y-8">
      {/* Hero — de tafel: titel + uitgedeelde hand die licht waaiert */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{
              ...bodyF,
              background: C.feltHi,
              color: C.goldHi,
              boxShadow: `inset 0 0 0 1px ${C.gold}44`,
            }}
          >
            <Star size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[36px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[48px]"
            style={{ ...display, color: C.cream }}
          >
            Drie kaarten op tafel, allemaal boven de 85%.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.creamSoft }}
          >
            Je hand is sterk. Eén kaart vraagt aandacht: je VOG verloopt binnenkort — leg &lsquo;m
            recht en houd je hand onberispelijk verifieerbaar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={onOpen}>
              Speel je hand <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
            <GhostButton onClick={onActies}>
              <TriangleAlert
                size={14}
                strokeWidth={2.4}
                style={{ color: C.goldHi }}
                aria-hidden="true"
              />
              Los actie op
            </GhostButton>
          </div>
        </div>

        {/* Uitgedeelde hand — drie kaarten die licht waaieren, hover zet ze recht en licht ze uit */}
        <div className="flex items-end justify-center gap-[-8px] pt-4 lg:justify-end">
          <div className="flex items-end" style={{ perspective: 900 }}>
            {OPDRACHTEN.map((o, i) => {
              const suit = opdrachtSuit(i);
              return (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="group/hand relative -ml-6 first:ml-0 focus-visible:outline-none"
                  style={{ zIndex: i + 1 }}
                  aria-label={`Open opdracht ${o.titel}`}
                >
                  <PlayingCard
                    rank={rankFor(o.match)}
                    suit={suit}
                    rotate={fan[i]}
                    lift
                    className="h-[188px] w-[132px]"
                  >
                    <div className="flex h-full flex-col items-center justify-center px-3 text-center">
                      <span
                        className="text-[34px] leading-none"
                        style={{ color: suit.color }}
                        aria-hidden="true"
                      >
                        {suit.glyph}
                      </span>
                      <span
                        className="mt-2 text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: C.ink }}
                      >
                        {o.match}% match
                      </span>
                      <span
                        className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight"
                        style={{ ...bodyF, color: C.inkSoft }}
                      >
                        {o.titel}
                      </span>
                    </div>
                  </PlayingCard>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const suit = opdrachtSuit(i);
          return (
            <PlayingCard key={k.label} suit={suit} rank="•" className="p-4 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    ...mono,
                    background: k.up ? `${C.gold}22` : C.card,
                    color: k.up ? C.goldDeep : C.inkSoft,
                    boxShadow: `inset 0 0 0 1px ${k.up ? C.gold + "55" : C.cardEdge}`,
                  }}
                >
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[28px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} />
              </div>
            </PlayingCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches als kaartrijen */}
        <section className="space-y-4">
          <SectionHead title="Aanbevolen matches" sub="Op match gerangschikt" suit={SUITS.spade} />
          <div className="space-y-3">
            {OPDRACHTEN.map((o, i) => {
              const suit = opdrachtSuit(i);
              return (
                <PlayingCard
                  key={o.id}
                  suit={suit}
                  rank={rankFor(o.match)}
                  className="overflow-hidden"
                >
                  <button
                    onClick={onOpen}
                    className="relative flex w-full items-center gap-4 rounded-2xl px-8 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.gold }}
                  >
                    <MatchPip value={o.match} suit={suit} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[16px] font-semibold"
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
                          style={{ color: C.inkFaint }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ ...bodyF, background: `${C.gold}18`, color: C.inkSoft }}
                          >
                            <Check
                              size={11}
                              strokeWidth={2.8}
                              style={{ color: C.goldDeep }}
                              aria-hidden="true"
                            />
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </PlayingCard>
              );
            })}
          </div>
        </section>

        {/* Rechterkolom — vertrouwen + prioriteit */}
        <section className="space-y-4">
          <SectionHead title="Je hand van vertrouwen" sub="Certificaat-dekking" suit={SUITS.club} />
          <PlayingCard suit={SUITS.club} rank="A" className="p-6 pt-7">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.goldHi} 0deg, ${C.gold} ${dek * 3.6}deg, ${C.cardEdge} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.card }}
                >
                  <span
                    className="text-[26px] font-bold tabular-nums leading-none"
                    style={{ ...mono, color: C.ink }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusChip status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde kaarten.
                </p>
              </div>
            </div>
          </PlayingCard>

          {/* Prioriteit — kaart op de rug (rood karmozijn) */}
          <div
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: `linear-gradient(135deg, ${C.cardBackHi}, ${C.cardBack})`,
              boxShadow: `inset 0 0 0 4px ${C.cardBack}, inset 0 0 0 5px ${C.goldHi}55, 0 18px 40px -22px rgba(0,0,0,0.6)`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 8px)`,
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, background: "rgba(0,0,0,0.28)", color: C.goldHi }}
              >
                <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[22px] font-semibold leading-tight"
                style={{ ...display, color: C.card }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(250,245,233,0.82)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
                  color: C.onGold,
                  ["--tw-ring-color" as string]: C.goldHi,
                  ["--tw-ring-offset-color" as string]: C.cardBack,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — zoek, empty-state, skeleton-loading én foutstrook ─────────────
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
        <SectionHead title="Marktplaats" sub="Open opdrachten op tafel" suit={SUITS.diamond} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.feltHi, boxShadow: `inset 0 0 0 1px ${C.gold}44` }}
          >
            <Search size={15} style={{ color: C.goldHi }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.cream }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw delen"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.feltHi,
              boxShadow: `inset 0 0 0 1px ${C.gold}44`,
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.felt,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.goldHi }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: "rgba(194,38,54,0.12)", border: `1px solid ${C.red}` }}
        >
          <XCircle size={18} strokeWidth={2.4} style={{ color: C.redSoft }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold" style={{ ...display, color: C.cream }}>
              Sommige kaarten konden niet worden gedeeld
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.creamSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Deel opnieuw.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.redSoft, ["--tw-ring-color" as string]: C.red }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading — kaartvormige placeholders
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.cardEdge}` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse rounded-xl"
                  style={{ background: C.cardEdge }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.cardEdge }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: `${C.cardEdge}99` }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: `${C.cardEdge}99` }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: `${C.cardEdge}99` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl p-16 text-center"
          style={{
            background: C.card,
            boxShadow: `inset 0 0 0 1px ${C.cardEdge}, inset 0 0 0 5px ${C.gold}22`,
          }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-[30px]"
            style={{ background: `${C.gold}18`, color: C.goldDeep }}
            aria-hidden="true"
          >
            ♠
          </span>
          <p className="text-[22px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen kaart in deze hand
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om opnieuw te delen.
          </p>
          <div className="mt-1">
            <PrimaryButton onClick={() => setQ("")}>Zoekterm wissen</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const suit = opdrachtSuit(OPDRACHTEN.indexOf(o));
            return (
              <PlayingCard
                key={o.id}
                suit={suit}
                rank={rankFor(o.match)}
                lift
                className="flex flex-col"
              >
                <div className="relative flex items-center gap-3 px-8 pt-6">
                  <MatchPip value={o.match} suit={suit} size={48} />
                  <div className="min-w-0">
                    <h3
                      className="text-[16px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                </div>
                <div className="relative px-8 pb-4 pt-3">
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
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{ ...bodyF, background: `${C.gold}18`, color: C.inkSoft }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="relative mt-auto flex items-center justify-center gap-2 rounded-b-2xl py-3 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...bodyF,
                    borderTop: `1px solid ${C.cardEdge}`,
                    color: C.goldDeep,
                    ["--tw-ring-color" as string]: C.gold,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
              </PlayingCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail — met verklaarbare matching + kaart-flip micro-interactie ──────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const suit = opdrachtSuit(OPDRACHTEN.indexOf(opdracht));
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      <GhostButton onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </GhostButton>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px] lg:items-start">
        {/* Hero-kaart */}
        <PlayingCard suit={suit} rank={rankFor(opdracht.match)} className="relative">
          <div className="relative flex flex-wrap items-center justify-between gap-5 px-9 py-7">
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{
                  ...mono,
                  background: `${C.gold}18`,
                  color: C.goldDeep,
                  boxShadow: `inset 0 0 0 1px ${C.gold}55`,
                }}
              >
                {opdracht.id} <SuitGlyph suit={suit} size={12} />
              </span>
              <h1
                className="mt-3 max-w-2xl text-[30px] font-semibold leading-[1.05] tracking-[-0.01em] sm:text-[40px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <MatchPip value={opdracht.match} suit={suit} size={82} />
          </div>
        </PlayingCard>

        {/* Flip-kaart — voorkant (troef) / achterkant (opdrachtgever). Micro-interactie: klik = flip. */}
        <div className="mx-auto w-full max-w-[260px]" style={{ perspective: 1200 }}>
          <button
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            aria-label="Draai de troefkaart om"
            className="group/flip relative block h-[300px] w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
            style={{
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.felt,
            }}
          >
            <div
              className="relative h-full w-full transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "none",
              }}
            >
              {/* Voorkant */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-5 text-center"
                style={{
                  backfaceVisibility: "hidden",
                  background: C.card,
                  boxShadow: `inset 0 0 0 1px ${C.cardEdge}, inset 0 0 0 4px ${C.card}, inset 0 0 0 5px ${C.gold}44, 0 18px 40px -22px rgba(0,0,0,0.6)`,
                }}
              >
                <span
                  className="text-[52px] leading-none"
                  style={{ color: suit.color }}
                  aria-hidden="true"
                >
                  {suit.glyph}
                </span>
                <span
                  className="mt-3 text-[13px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Troefkaart
                </span>
                <span
                  className="mt-1 text-[15px] font-semibold"
                  style={{ ...display, color: C.ink }}
                >
                  {rankFor(opdracht.match)} · {suit.label}
                </span>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ ...bodyF, background: `${C.gold}1f`, color: C.goldDeep }}
                >
                  <RotateCw size={11} aria-hidden="true" /> Tik om te draaien
                </span>
              </div>
              {/* Achterkant */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-5 text-center"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: `linear-gradient(135deg, ${C.cardBackHi}, ${C.cardBack})`,
                  boxShadow: `inset 0 0 0 4px ${C.cardBack}, inset 0 0 0 5px ${C.goldHi}55, 0 18px 40px -22px rgba(0,0,0,0.6)`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.14]"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 8px)`,
                  }}
                  aria-hidden="true"
                />
                <span
                  className="relative text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.goldHi }}
                >
                  Opdrachtgever
                </span>
                <span
                  className="relative mt-2 text-[19px] font-semibold"
                  style={{ ...display, color: C.card }}
                >
                  {opdracht.opdrachtgever}
                </span>
                <span
                  className="relative mt-1 text-[12.5px]"
                  style={{ ...bodyF, color: "rgba(250,245,233,0.82)" }}
                >
                  {opdracht.plaats} · {opdracht.start}
                </span>
                <span
                  className="relative mt-4 flex items-center gap-1.5 text-[11px] font-bold"
                  style={{ ...bodyF, color: C.goldHi }}
                >
                  <ShieldCheck size={12} aria-hidden="true" /> Geverifieerde opdrachtgever
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <PlayingCard key={f.l} suit={suit} rank="•" className="p-4 pt-6" lift>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${C.gold}18` }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.goldDeep }} />
            </span>
            <div
              className="mt-3 text-[17px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </PlayingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" suit={SUITS.spade} />
          <PlayingCard suit={SUITS.spade} rank="+" className="p-6">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${C.gold}22` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.8} style={{ color: C.goldDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </PlayingCard>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" suit={SUITS.diamond} />
          <PlayingCard suit={SUITS.diamond} rank="?" className="p-6">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(194,38,54,0.12)" }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.6} style={{ color: C.red }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </PlayingCard>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <PrimaryButton className="flex-1 !py-3.5">
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
        <GhostButton className="!py-3.5">
          <Star size={15} strokeWidth={2.2} style={{ color: C.goldHi }} aria-hidden="true" /> Leg
          opzij
        </GhostButton>
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
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" suit={SUITS.spade} />
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Kaart toevoegen
        </PrimaryButton>
      </div>

      {/* Vertrouwensniveau — hero-kaart */}
      <PlayingCard suit={SUITS.spade} rank="A" className="relative">
        <div className="relative flex flex-wrap items-center gap-6 px-8 py-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.goldHi} 0deg, ${C.gold} ${dek * 3.6}deg, ${C.cardEdge} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.card }}
            >
              <span
                className="text-[30px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elke geverifieerde kaart versterkt je hand. Houd je dekking hoog, dan blijft je
              profiel onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                ...bodyF,
                background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
                color: C.onGold,
              }}
            >
              <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </PlayingCard>

      {/* Verificatie-flow — stappen als gedeelde kaarten */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          { s: "Deal", t: "Bewijs uploaden", Icon: Plus },
          { s: "Speel", t: "Ingediend", Icon: Clock },
          { s: "Beoordeel", t: "Verificatie", Icon: Search },
          { s: "Win", t: "Geverifieerd", Icon: ShieldCheck },
        ].map((step, i, arr) => (
          <div
            key={step.s}
            className="relative flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: C.feltHi, boxShadow: `inset 0 0 0 1px ${C.gold}33` }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: C.card, color: C.ink }}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.goldHi }}
              >
                {step.s}
              </div>
              <div
                className="truncate text-[12.5px] font-semibold"
                style={{ ...bodyF, color: C.cream }}
              >
                {step.t}
              </div>
            </div>
            {i < arr.length - 1 && (
              <ChevronRight
                size={16}
                className="absolute -right-2 top-1/2 hidden -translate-y-1/2 sm:block"
                style={{ color: C.goldDeep }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <PlayingCard
              key={c.naam}
              suit={m.suit}
              rank={m.suit.glyph === "♠" ? "A" : "•"}
              className="flex items-center gap-3.5 px-8 py-4"
              lift
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[19px] leading-none"
                style={{
                  background: `${m.suit.color}14`,
                  color: m.suit.color,
                  boxShadow: `inset 0 0 0 1px ${m.suit.color}33`,
                }}
                aria-hidden="true"
              >
                {m.suit.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: `${C.gold}18`,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.cardEdge}`,
                        ["--tw-ring-color" as string]: C.gold,
                        ["--tw-ring-offset-color" as string]: C.card,
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
            </PlayingCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) + berichten-strook ────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste zetten"
        sub="Op urgentie gerangschikt — speel de bovenste eerst"
        suit={SUITS.club}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const suit = warn ? SUITS.diamond : SUITS.spade;
          return (
            <li key={a.titel}>
              <PlayingCard
                suit={suit}
                rank={warn ? "!" : `${i + 1}`}
                className="flex items-stretch overflow-hidden"
              >
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.red : C.gold }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 px-6 py-5">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[20px] leading-none"
                    style={{
                      background: warn ? "rgba(194,38,54,0.12)" : `${C.gold}18`,
                      color: warn ? C.red : C.goldDeep,
                      boxShadow: `inset 0 0 0 1px ${warn ? C.red + "44" : C.gold + "44"}`,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? "♦" : "♠"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? { ...mono, background: C.red, color: "#fff" }
                            : {
                                ...mono,
                                background: `${C.gold}22`,
                                color: C.goldDeep,
                                boxShadow: `inset 0 0 0 1px ${C.gold}55`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.6} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[18px] font-semibold"
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
                              color: C.onGold,
                              ["--tw-ring-color" as string]: C.gold,
                              ["--tw-ring-offset-color" as string]: C.card,
                            }
                          : {
                              ...bodyF,
                              background: `${C.gold}18`,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.cardEdge}`,
                              ["--tw-ring-color" as string]: C.gold,
                              ["--tw-ring-offset-color" as string]: C.card,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </PlayingCard>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" suit={SUITS.heart} />
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.cardEdge}` }}
        >
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 px-5 py-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.cardEdge}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: `${C.gold}18`,
                  color: C.goldDeep,
                  boxShadow: `inset 0 0 0 1px ${C.gold}44`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
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
        </div>
      </section>

      {/* Documenten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Documenten" sub="Je papieren op tafel" suit={SUITS.club} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => (
            <div
              key={d.naam}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: C.card, boxShadow: `inset 0 0 0 1px ${C.cardEdge}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${C.gold}18` }}
                aria-hidden="true"
              >
                <FileText size={16} strokeWidth={2} style={{ color: C.goldDeep }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[13px] font-semibold"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {d.naam}
                </div>
                <div className="text-[11px]" style={{ ...mono, color: C.inkFaint }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusChip status={d.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; suit: Suit; solid: boolean } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, suit: SUITS.spade, solid: true };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, suit: SUITS.diamond, solid: false };
    return { label: "Concept", Icon: FileText, suit: SUITS.club, solid: false };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand — de pot" suit={SUITS.diamond} />
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, suit: SUITS.spade },
          { l: "Openstaand", v: `${open}`, suit: SUITS.diamond },
          { l: "Te factureren", v: "€ 1.350", suit: SUITS.club },
        ].map((s) => (
          <PlayingCard key={s.l} suit={s.suit} rank="•" className="p-4 pt-6" lift>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[15px] leading-none"
                style={{ color: s.suit.color }}
                aria-hidden="true"
              >
                {s.suit.glyph}
              </span>
              <div className="text-[11px] font-semibold" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
            </div>
            <div
              className="mt-2 text-[28px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </PlayingCard>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: C.card,
          boxShadow: `inset 0 0 0 1px ${C.cardEdge}, inset 0 0 0 5px ${C.gold}22`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left">
            <thead>
              <tr style={{ background: `${C.gold}14` }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
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
                    className="transition-colors"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.cardEdge}` }}
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          ...bodyF,
                          background: m.solid ? C.goldHi : "transparent",
                          color: m.solid ? C.onGold : m.suit.color,
                          border: m.solid ? `1px solid ${C.gold}` : `1px solid ${m.suit.color}55`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                        <span
                          aria-hidden="true"
                          style={{ color: m.solid ? C.onGold : m.suit.color }}
                        >
                          {m.suit.glyph}
                        </span>
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: `linear-gradient(90deg, ${C.goldHi}, ${C.gold})` }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(35,26,6,0.72)" }}
                >
                  Totaal in de pot
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onGold }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p
        className="flex items-center justify-center gap-2 text-[11px]"
        style={{ ...mono, color: C.creamFaint }}
      >
        <Sparkles size={12} aria-hidden="true" /> Betaald = gewonnen, openstaand = nog in het spel.
      </p>
    </div>
  );
}
