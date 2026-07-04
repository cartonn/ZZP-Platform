"use client";

// Concept 60 — "Schetsboek" · hand-getekend / marker & wireframe-als-kunst.
// De interface alsof ze met de hand is geschetst: losse wiebelige randen (via een set
// vaste, asymmetrische border-radius-waarden — géén Math.random, dus hydration-stabiel),
// marker-highlights (schuine gele/roze arceerbanden achter koppen), handschrift-achtige
// annotaties in de kantlijn (pijltjes, cirkels om cijfers), potlood-grijs op schetspapier-crème
// en plakband-hoekjes op de kaarten. Charmant-menselijk, low-fi als stijl maar high-fi
// uitgevoerd en volledig functioneel. Onderscheidend van Blauwdruk (23, technische drafting)
// en Courant (27): dit is een losse hand-schets, geen precisie-tekening.
// Palet: papier #f5f0e4, kaart #fdfaf1, potlood #33302a, marker-geel #ffe27a, marker-roze #ffc4d4,
// rood-potlood #c0563f, blauw-potlood #4a6b8a.
// Fonts: --font-lab-newsreader (body/serif) + --font-lab-space (koppen).

import { useState } from "react";
import {
  Home,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  FileText,
  Send,
  Loader2,
  ChevronRight,
  CornerDownRight,
  Pencil,
  RotateCw,
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

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#f5f0e4",
  paperDeep: "#ece5d3",
  card: "#fdfaf1",
  ink: "#33302a",
  inkSoft: "#5a544a",
  muted: "#847c6e",
  faint: "#a89f8c",
  pencil: "#33302a",
  markerYellow: "#ffe27a",
  markerPink: "#ffc4d4",
  markerMint: "#bfead0",
  red: "#c0563f",
  redSoft: "#f6e2db",
  blue: "#4a6b8a",
  blueSoft: "#dfe8f0",
  green: "#4f7a52",
  greenSoft: "#e0ecdc",
  amber: "#a9741f",
  amberSoft: "#f4e7cc",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const heading = { fontFamily: "var(--font-lab-space)" };
// Handschrift-simulatie: cursieve serif met lichte helling.
const hand = { fontFamily: "var(--font-lab-newsreader)", fontStyle: "italic" as const };

type Tone = "green" | "amber" | "red" | "blue";

const TONE: Record<Tone, { fg: string; soft: string }> = {
  green: { fg: C.green, soft: C.greenSoft },
  amber: { fg: C.amber, soft: C.amberSoft },
  red: { fg: C.red, soft: C.redSoft },
  blue: { fg: C.blue, soft: C.blueSoft },
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Home,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): { label: string; tone: Tone; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "blue", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", Icon: AlertTriangle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Hand-getekende bouwstenen (vaste seeds, hydration-stabiel) ---------- */

// Set wiebelige border-radius-waarden — de bekende "hand-drawn box"-truc. Deterministisch
// gekozen op index, zodat server en client identiek renderen.
const ROUGH_RADII = [
  "255px 12px 225px 15px / 15px 225px 12px 255px",
  "18px 235px 15px 220px / 220px 18px 235px 15px",
  "130px 14px 160px 22px / 22px 160px 14px 130px",
  "225px 15px 18px 240px / 18px 235px 220px 15px",
  "15px 220px 235px 16px / 235px 15px 16px 220px",
];

function roughRadius(seed: number): string {
  return ROUGH_RADII[seed % ROUGH_RADII.length] as string;
}

// Kaart met wiebelige rand + zachte potlood-schaduw. `tape` plakt een bandje in een hoek.
function Sketch({
  children,
  className = "",
  seed = 0,
  color = C.card,
  tape = false,
  tapeColor = C.markerYellow,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  seed?: number;
  color?: string;
  tape?: boolean;
  tapeColor?: string;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: color,
        border: `2px solid ${C.pencil}`,
        borderRadius: roughRadius(seed),
        boxShadow: `2px 3px 0 -1px rgba(51,48,42,0.14), 0 1px 0 rgba(51,48,42,0.3)`,
      }}
    >
      {tape && <Tape color={tapeColor} />}
      {children}
    </Tag>
  );
}

// Plakband-hoekje (decoratief).
function Tape({ color = C.markerYellow }: { color?: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-2"
      style={{
        background: color,
        opacity: 0.72,
        borderLeft: "1px dashed rgba(51,48,42,0.25)",
        borderRight: "1px dashed rgba(51,48,42,0.25)",
        boxShadow: "0 1px 2px rgba(51,48,42,0.12)",
      }}
    />
  );
}

// Marker-highlight achter tekst: schuine gearceerde band.
function Marker({
  children,
  color = C.markerYellow,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span className="relative inline-block">
      <span
        aria-hidden="true"
        className="absolute inset-x-[-4px] bottom-[2px] top-[42%] -skew-x-6"
        style={{ background: color, opacity: 0.75, zIndex: 0 }}
      />
      <span className="relative" style={{ zIndex: 1 }}>
        {children}
      </span>
    </span>
  );
}

// Hand-getekende onderstreep-krabbel (vaste seed).
function Underline({ color = C.red, width = 180 }: { color?: string; width?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height="10"
      viewBox={`0 0 ${width} 10`}
      fill="none"
      className="mt-1 block"
      preserveAspectRatio="none"
    >
      <path
        d={`M2 6 C ${width * 0.2} 2, ${width * 0.35} 9, ${width * 0.55} 5 S ${width * 0.85} 3, ${width - 2} 6`}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Hand-getekende cirkel om een belangrijk cijfer (vaste seed via path).
function CircleScribble({ color = C.red }: { color?: string }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -inset-2"
      viewBox="0 0 100 60"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M50 4 C82 2, 98 16, 96 32 C94 50, 68 58, 44 57 C18 56, 3 44, 5 26 C7 10, 26 4, 52 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Kantlijn-annotatie: handschrift-notitie met pijl.
function Annotation({
  children,
  color = C.blue,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`pointer-events-none inline-flex items-center gap-1 text-[13px] ${className}`}
      style={{ ...hand, color }}
      aria-hidden="true"
    >
      <CornerDownRight size={14} />
      {children}
    </span>
  );
}

/* ---------- Chips & koppen ---------- */

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold"
      style={{
        color: TONE[tone].fg,
        background: TONE[tone].soft,
        border: `1.5px solid ${TONE[tone].fg}`,
        borderRadius: "12px 5px 12px 5px / 5px 12px 5px 12px",
        ...serif,
      }}
    >
      {children}
    </span>
  );
}

function SectionHead({
  kicker,
  title,
  note,
  markerColor = C.markerYellow,
}: {
  kicker: string;
  title: string;
  note?: string;
  markerColor?: string;
}) {
  return (
    <div>
      <p
        className="text-[12px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: C.muted, ...heading }}
      >
        {kicker}
      </p>
      <h1
        className="mt-1.5 text-[27px] font-bold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...heading, color: C.ink }}
      >
        <Marker color={markerColor}>{title}</Marker>
      </h1>
      <Underline color={C.red} width={160} />
      {note && (
        <p
          className="mt-2.5 max-w-2xl text-[14px] leading-relaxed"
          style={{ ...serif, color: C.inkSoft }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept60() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ color: C.ink, background: C.paper, ...serif }}
    >
      {/* Schetspapier-textuur: fijne ruitjes/lijntjes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `linear-gradient(${C.paperDeep} 1px, transparent 1px), linear-gradient(90deg, ${C.paperDeep} 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside
          className="hidden w-[240px] shrink-0 flex-col p-4 md:flex"
          style={{ borderRight: `2px dashed ${C.faint}` }}
        >
          <div className="flex items-center gap-3 px-1 pb-6 pt-1">
            <Sketch
              className="flex h-11 w-11 items-center justify-center"
              seed={2}
              color={C.markerYellow}
            >
              <Pencil size={19} style={{ color: C.ink }} aria-hidden="true" />
            </Sketch>
            <div className="leading-tight">
              <div className="text-[18px] font-bold tracking-tight" style={heading}>
                Schetsboek
              </div>
              <div className="text-[12px]" style={{ color: C.muted, ...hand }}>
                ZZP · werkschrift
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Hoofdnavigatie">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 px-3 py-2.5 text-[14.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.card : "transparent",
                    border: `2px solid ${on ? C.pencil : "transparent"}`,
                    borderRadius: roughRadius(i + 1),
                    ...serif,
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.red : C.faint }} />
                  <span className="flex-1 font-semibold">{s.label}</span>
                  {on && (
                    <span aria-hidden="true" style={{ color: C.red }}>
                      ✎
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Sketch className="p-3.5" seed={4} color={C.card} tape tapeColor={C.markerPink}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center text-[13px] font-bold"
                  style={{
                    background: C.markerMint,
                    border: `2px solid ${C.pencil}`,
                    borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                    ...heading,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold">{PROFIEL.naam}</div>
                  <div
                    className="flex items-center gap-1 text-[12px]"
                    style={{ color: C.green, ...hand }}
                  >
                    <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Sketch>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `2px dashed ${C.faint}` }}
          >
            <h2 className="truncate text-[17px] font-bold tracking-tight" style={heading}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2 px-3.5 py-2 text-[13px] transition-colors hover:bg-[#fdfaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a] sm:flex"
                style={{
                  border: `2px solid ${C.pencil}`,
                  borderRadius: roughRadius(1),
                  color: C.muted,
                  background: C.card,
                  ...serif,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoeken…</span>
              </button>
              <button
                className="relative p-2.5 transition-colors hover:bg-[#fdfaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
                style={{
                  border: `2px solid ${C.pencil}`,
                  borderRadius: "50% 45% 55% 48%",
                  color: C.ink,
                  background: C.card,
                }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: C.red, color: C.card, ...heading }}
                  aria-hidden="true"
                >
                  2
                </span>
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5 md:hidden">
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.markerYellow : C.card,
                    border: `2px solid ${C.pencil}`,
                    borderRadius: roughRadius(i),
                    ...serif,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- KPI-tegel (schets) ---------- */

function KpiTile({
  label,
  value,
  trend,
  up,
  spark,
  seed,
  circled = false,
}: {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  spark: number[];
  seed: number;
  circled?: boolean;
}) {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const range = max - min || 1;
  const pts = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 24 - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <Sketch className="p-4" seed={seed}>
      <p
        className="text-[12px] font-semibold uppercase tracking-wide"
        style={{ color: C.muted, ...heading }}
      >
        {label}
      </p>
      <div className="relative mt-1.5 inline-block">
        {circled && <CircleScribble color={C.red} />}
        <p
          className="relative text-[26px] font-bold leading-none"
          style={{ ...heading, color: C.ink }}
        >
          {value}
        </p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span
          className="text-[12.5px] font-semibold"
          style={{ color: up ? C.green : C.amber, ...hand }}
        >
          {up ? "↗" : "↘"} {trend}
        </span>
        <svg
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          className="h-8 w-[88px]"
          aria-hidden="true"
        >
          <polyline
            points={pts}
            fill="none"
            stroke={C.blue}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Sketch>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Schetsblad · overzicht"
          title={`Dag ${PROFIEL.naam.split(" ")[0]}`}
          note="Je losse aantekeningen van vandaag: cijfers, matches en één punt dat aandacht vraagt."
        />
        <Chip tone="green">
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <KpiTile key={k.label} {...k} seed={i} circled={i === 0} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Sketch as="section" className="overflow-hidden" seed={1}>
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `2px dashed ${C.faint}` }}
            >
              <h3 className="flex items-center gap-2 text-[16px] font-bold" style={heading}>
                <Store size={17} aria-hidden="true" />{" "}
                <Marker color={C.markerYellow}>Beste matches</Marker>
              </h3>
              <span className="text-[12.5px]" style={{ color: C.muted, ...hand }}>
                waarom? zie detail →
              </span>
            </div>
            <div>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f5f0e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#33302a]"
                  style={{ borderTop: i === 0 ? "none" : `1.5px dashed ${C.faint}` }}
                >
                  <MatchDot value={o.match} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[13px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block text-[14.5px] font-bold" style={heading}>
                      {o.tarief}
                    </span>
                    <span className="text-[12px]" style={{ color: C.muted, ...hand }}>
                      {o.uren}
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Sketch>

          <Sketch as="section" className="overflow-hidden" seed={3}>
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `2px dashed ${C.faint}` }}
            >
              <h3 className="text-[16px] font-bold" style={heading}>
                Berichten
              </h3>
              <Chip tone="red">{ongelezen} ongelezen</Chip>
            </div>
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1.5px dashed ${C.faint}` }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-[12px] font-bold"
                  style={{
                    background: b.ongelezen ? C.markerPink : C.paperDeep,
                    border: `2px solid ${C.pencil}`,
                    borderRadius: "55% 45% 50% 50% / 50% 50% 45% 55%",
                    ...heading,
                  }}
                >
                  {b.initialen}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13.5px] font-semibold">{b.van}</p>
                    {b.ongelezen && (
                      <span className="text-[11px] font-semibold" style={{ color: C.red, ...hand }}>
                        nieuw!
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[12.5px]" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span className="shrink-0 text-[12px]" style={{ color: C.faint, ...hand }}>
                  {b.tijd}
                </span>
              </div>
            ))}
          </Sketch>
        </div>

        <div className="space-y-6">
          {/* Waarschuwing */}
          <Sketch
            className="relative p-5"
            seed={2}
            color={C.amberSoft}
            tape
            tapeColor={C.markerYellow}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} aria-hidden="true" style={{ color: C.amber }} />
              <span
                className="text-[12px] font-semibold uppercase tracking-wide"
                style={{ color: C.amber, ...heading }}
              >
                Let op · nu
              </span>
            </div>
            <p className="mt-2 text-[18px] font-bold leading-snug" style={heading}>
              {ACTIES[0]?.titel}
            </p>
            <p
              className="mt-1.5 text-[13.5px] leading-relaxed"
              style={{ color: C.inkSoft, ...serif }}
            >
              {ACTIES[0]?.detail}
            </p>
            <button
              onClick={() => onOpen()}
              className="mt-4 w-full py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
              style={{
                background: C.ink,
                color: C.paper,
                border: `2px solid ${C.pencil}`,
                borderRadius: roughRadius(0),
                ...serif,
              }}
            >
              {ACTIES[0]?.cta}
            </button>
            <Annotation color={C.red} className="mt-2">
              binnen 3 weken regelen
            </Annotation>
          </Sketch>

          <Sketch className="overflow-hidden" seed={4}>
            <div className="px-5 py-3.5" style={{ borderBottom: `2px dashed ${C.faint}` }}>
              <h3 className="flex items-center gap-2 text-[16px] font-bold" style={heading}>
                <ShieldCheck size={17} aria-hidden="true" /> Certificaten
              </h3>
            </div>
            {CREDENTIALS.map((c, i) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1.5px dashed ${C.faint}` }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center"
                    style={{
                      background: TONE[st.tone].soft,
                      border: `2px solid ${C.pencil}`,
                      borderRadius: "48% 52% 50% 50%",
                    }}
                  >
                    <st.Icon size={14} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">{c.naam}</p>
                  <Chip tone={st.tone}>{st.label}</Chip>
                </div>
              );
            })}
          </Sketch>
        </div>
      </div>
    </div>
  );
}

// Match-cijfer met hand-getekende cirkel eromheen.
function MatchDot({ value }: { value: number }) {
  const tone: Tone = value >= 90 ? "green" : value >= 80 ? "amber" : "blue";
  return (
    <span
      className="relative flex h-12 w-12 shrink-0 items-center justify-center"
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <CircleScribble color={TONE[tone].fg} />
      <span className="flex flex-col items-center leading-none">
        <span className="text-[16px] font-bold" style={{ ...heading, color: C.ink }}>
          {value}
        </span>
        <span className="text-[8px] uppercase tracking-wide" style={{ color: C.muted, ...heading }}>
          match
        </span>
      </span>
    </span>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  const refresh = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Prikbord · opdrachten"
          title="Open opdrachten"
          markerColor={C.markerPink}
          note="Verklaarbaar gesorteerd op je geverifieerde profiel. Kies links om de kladnotities te lezen."
        />
        <button
          onClick={refresh}
          className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
          style={{
            background: C.markerMint,
            color: C.ink,
            border: `2px solid ${C.pencil}`,
            borderRadius: roughRadius(2),
            ...serif,
          }}
        >
          <RotateCw size={14} aria-hidden="true" className={loading ? "animate-spin" : ""} />{" "}
          Vernieuwen
        </button>
      </div>

      <Sketch className="flex items-center gap-3 px-4 py-2.5" seed={0}>
        <Search size={16} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a89f8c]"
          style={{ color: C.ink, ...serif }}
        />
        <span className="shrink-0 text-[12.5px]" style={{ color: C.muted, ...hand }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Sketch>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Sketch key={i} className="flex items-center gap-4 p-4" seed={i}>
              <div
                className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                style={{ background: C.paperDeep }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full"
                  style={{ background: C.paperDeep }}
                />
                <div
                  className="h-3 w-1/3 animate-pulse rounded-full"
                  style={{ background: C.paperDeep }}
                />
              </div>
            </Sketch>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Sketch className="px-6 py-16 text-center" seed={1} tape tapeColor={C.markerPink}>
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center"
            style={{
              background: C.markerYellow,
              border: `2px solid ${C.pencil}`,
              borderRadius: "52% 48% 46% 54%",
            }}
            aria-hidden="true"
          >
            <Search size={26} />
          </div>
          <p className="mt-4 text-[18px] font-bold" style={heading}>
            Niks gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13.5px]" style={{ color: C.muted, ...serif }}>
            We vinden geen opdracht voor &quot;{q}&quot;. Probeer een bredere zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
            style={{
              background: C.ink,
              color: C.paper,
              border: `2px solid ${C.pencil}`,
              borderRadius: roughRadius(3),
              ...serif,
            }}
          >
            Zoekopdracht wissen
          </button>
        </Sketch>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o, i) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none"
                  aria-pressed={on}
                >
                  <div
                    className="relative flex items-center gap-4 p-4"
                    style={{
                      background: on ? C.markerYellow + "44" : C.card,
                      border: `2px solid ${C.pencil}`,
                      borderRadius: roughRadius(i),
                      boxShadow: on
                        ? `3px 4px 0 -1px ${C.red}55`
                        : `2px 3px 0 -1px rgba(51,48,42,0.14)`,
                    }}
                  >
                    <MatchDot value={o.match} />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11.5px]" style={{ color: C.faint, ...hand }}>
                        {o.id}
                      </span>
                      <p className="truncate text-[15.5px] font-bold leading-snug">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[13px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <span className="block text-[15px] font-bold" style={heading}>
                        {o.tarief}
                      </span>
                      <span className="text-[12px]" style={{ color: C.muted, ...hand }}>
                        {o.uren}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Sketch
              className="sticky top-4 h-fit overflow-hidden"
              seed={2}
              tape
              tapeColor={C.markerMint}
            >
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: `2px dashed ${C.faint}` }}
              >
                <span className="text-[13px] font-bold" style={heading}>
                  Kladblok
                </span>
                <span className="text-[12px]" style={{ color: C.muted, ...hand }}>
                  {sel.id}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <MatchDot value={sel.match} />
                  <h3 className="text-[18px] font-bold leading-tight" style={heading}>
                    {sel.titel}
                  </h3>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                  ].map((m, idx) => (
                    <div
                      key={m.l}
                      className="p-2 text-center"
                      style={{
                        background: C.paper,
                        border: `1.5px solid ${C.pencil}`,
                        borderRadius: roughRadius(idx + 1),
                      }}
                    >
                      <div className="text-[10px] uppercase" style={{ color: C.muted, ...heading }}>
                        {m.l}
                      </div>
                      <div className="mt-0.5 text-[13px] font-bold leading-tight" style={heading}>
                        {m.v}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sel.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 text-[12px]"
                      style={{
                        background: C.paperDeep,
                        border: `1.5px solid ${C.pencil}`,
                        borderRadius: "10px 4px 10px 4px",
                        ...serif,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="mt-5 flex w-full items-center justify-center gap-2 py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
                  style={{
                    background: C.ink,
                    color: C.paper,
                    border: `2px solid ${C.pencil}`,
                    borderRadius: roughRadius(0),
                    ...serif,
                  }}
                >
                  Opdracht openen <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </Sketch>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Sketch className="p-5 sm:p-7" seed={1} tape tapeColor={C.markerYellow}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <MatchDot value={opdracht.match} />
            <div>
              <p
                className="text-[12px] uppercase tracking-[0.18em]"
                style={{ color: C.muted, ...heading }}
              >
                {opdracht.id}
              </p>
              <h1
                className="mt-1 text-[25px] font-bold leading-tight tracking-tight"
                style={heading}
              >
                <Marker color={C.markerYellow}>{opdracht.titel}</Marker>
              </h1>
              <p
                className="mt-2 flex items-center gap-1.5 text-[13.5px]"
                style={{ color: C.muted }}
              >
                <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-[12px]"
                    style={{
                      background: C.paperDeep,
                      border: `1.5px solid ${C.pencil}`,
                      borderRadius: "10px 4px 10px 4px",
                      ...serif,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 px-6 py-2.5 text-[14px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a] disabled:translate-y-0"
            style={{
              background: state === "sent" ? C.greenSoft : C.ink,
              color: state === "sent" ? C.green : C.paper,
              border: `2px solid ${C.pencil}`,
              borderRadius: roughRadius(2),
              ...serif,
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={16} aria-hidden="true" />}
            {state === "idle" && <Send size={15} aria-hidden="true" />}
            {state === "idle" ? "Reageer nu" : state === "sending" ? "Versturen…" : "Verstuurd!"}
          </button>
        </div>
      </Sketch>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Sketch key={m.l} className="p-4" seed={i}>
            <p
              className="text-[11px] uppercase tracking-wide"
              style={{ color: C.muted, ...heading }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] font-bold leading-tight" style={heading}>
              {m.v}
            </p>
          </Sketch>
        ))}
      </div>

      <Sketch className="p-6" seed={3}>
        <h3 className="flex items-center gap-2 text-[17px] font-bold" style={heading}>
          <Pencil size={17} aria-hidden="true" />{" "}
          <Marker color={C.markerMint}>Waarom deze match?</Marker>
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: C.muted, ...serif }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div
            className="p-4"
            style={{
              background: C.greenSoft,
              border: `2px solid ${C.pencil}`,
              borderRadius: roughRadius(1),
            }}
          >
            <p
              className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide"
              style={{ color: C.green, ...heading }}
            >
              <Check size={14} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13.5px]" style={serif}>
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="p-4"
            style={{
              background: C.amberSoft,
              border: `2px solid ${C.pencil}`,
              borderRadius: roughRadius(2),
            }}
          >
            <p
              className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide"
              style={{ color: C.amber, ...heading }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13.5px]"
                  style={{ color: C.inkSoft, ...serif }}
                >
                  <Minus
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Sketch>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  const pct = Math.round((verified / total) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Werkschrift · verificatie"
        title="Certificaten & documenten"
        markerColor={C.markerMint}
        note="Groen is geverifieerd, geel vraagt aandacht, rood is actie nodig. De status staat er altijd als tekst bij."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
        <Sketch
          className="relative p-5 text-center"
          seed={2}
          color={C.greenSoft}
          tape
          tapeColor={C.markerMint}
        >
          <p
            className="text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: C.green, ...heading }}
          >
            Gereedheid
          </p>
          <div className="relative mx-auto mt-3 inline-block">
            <CircleScribble color={C.red} />
            <p className="relative text-[44px] font-bold leading-none" style={heading}>
              {pct}%
            </p>
          </div>
          <p className="mt-2 text-[13px]" style={{ color: C.inkSoft, ...serif }}>
            {verified} van {total} geverifieerd
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Chip tone="green">{verified} veilig</Chip>
            <Chip tone="amber">{attention} actie</Chip>
          </div>
        </Sketch>

        <Sketch className="overflow-hidden" seed={1}>
          <div className="px-5 py-3.5" style={{ borderBottom: `2px dashed ${C.faint}` }}>
            <h3 className="text-[16px] font-bold" style={heading}>
              Jouw certificaten
            </h3>
          </div>
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#f5f0e4]"
                style={{ borderTop: i === 0 ? "none" : `1.5px dashed ${C.faint}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{
                    background: TONE[st.tone].soft,
                    border: `2px solid ${C.pencil}`,
                    borderRadius: "50% 50% 48% 52% / 52% 48% 50% 50%",
                  }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                      style={{ color: TONE[st.tone].fg }}
                      aria-hidden="true"
                    />
                  ) : (
                    <st.Icon size={18} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold">{c.naam}</p>
                  <p className="text-[12.5px]" style={{ color: C.muted, ...serif }}>
                    {c.detail}
                  </p>
                </div>
                <Chip tone={st.tone}>{st.label}</Chip>
              </div>
            );
          })}
        </Sketch>
      </div>

      <Sketch className="overflow-hidden" seed={3}>
        <div className="px-5 py-3.5" style={{ borderBottom: `2px dashed ${C.faint}` }}>
          <h3 className="flex items-center gap-2 text-[16px] font-bold" style={heading}>
            <FileText size={17} aria-hidden="true" /> Documenten
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => {
          const st = statusStyle(d.status);
          return (
            <div
              key={d.naam}
              className="flex items-center gap-3.5 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : `1.5px dashed ${C.faint}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center"
                style={{
                  background: C.paperDeep,
                  border: `2px solid ${C.pencil}`,
                  borderRadius: "48% 52% 50% 50%",
                }}
                aria-hidden="true"
              >
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{d.naam}</p>
                <p className="truncate text-[12px]" style={{ color: C.muted, ...hand }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
              <Chip tone={st.tone}>{st.label}</Chip>
            </div>
          );
        })}
      </Sketch>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const meta: Record<"warning" | "info", { tone: Tone; Icon: LucideIcon; label: string }> = {
    warning: { tone: "amber", Icon: AlertTriangle, label: "Waarschuwing" },
    info: { tone: "blue", Icon: Bell, label: "Melding" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="To-do · kantlijn"
        title="Wat je nu kunt doen"
        markerColor={C.markerPink}
        note="Op volgorde van urgentie — afgevinkt betekent je profiel weer helemaal op orde."
      />
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const m = meta[a.urgentie];
          return (
            <Sketch key={a.titel} className="relative flex items-start gap-4 p-5" seed={i}>
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center text-[17px] font-bold"
                style={{
                  background: TONE[m.tone].soft,
                  border: `2px solid ${C.pencil}`,
                  borderRadius: "52% 48% 50% 50% / 50% 52% 48% 50%",
                  ...heading,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <Chip tone={m.tone}>
                  <m.Icon size={12} aria-hidden="true" /> {m.label}
                </Chip>
                <p className="mt-2 text-[15px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[13px]" style={{ color: C.muted, ...serif }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center px-4 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
                style={{
                  background: C.ink,
                  color: C.paper,
                  border: `2px solid ${C.pencil}`,
                  borderRadius: roughRadius(i + 2),
                  ...serif,
                }}
              >
                {a.cta}
              </button>
            </Sketch>
          );
        })}
      </div>
      <Sketch
        className="flex items-center gap-4 p-5"
        seed={4}
        color={C.greenSoft}
        tape
        tapeColor={C.markerMint}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          style={{
            background: C.card,
            border: `2px solid ${C.pencil}`,
            borderRadius: "50% 50% 48% 52%",
          }}
        >
          <Check size={20} aria-hidden="true" style={{ color: C.green }} />
        </span>
        <p className="text-[13.5px] leading-relaxed" style={{ color: C.inkSoft, ...serif }}>
          Zodra je deze acties afvinkt staat je profiel weer helemaal op orde. Nieuwe notities
          verschijnen hier vanzelf.
        </p>
      </Sketch>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { tone: Tone; Icon: LucideIcon; label: string }> = {
    Betaald: { tone: "green", Icon: Check, label: "Betaald" },
    Openstaand: { tone: "amber", Icon: Clock, label: "Openstaand" },
    Concept: { tone: "blue", Icon: FileText, label: "Concept" },
  };
  const totaalBetaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const totaalOpen = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Kasboek"
          title="Kasstroom"
          markerColor={C.markerYellow}
          note="Betaald, openstaand en concept in één blik."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33302a]"
          style={{
            background: C.markerYellow,
            color: C.ink,
            border: `2px solid ${C.pencil}`,
            borderRadius: roughRadius(1),
            ...serif,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Sketch className="relative p-5" seed={2} color={C.greenSoft}>
          <p
            className="text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: C.green, ...heading }}
          >
            Ontvangen
          </p>
          <p className="mt-1.5 text-[26px] font-bold leading-none" style={heading}>
            € {totaalBetaald.toLocaleString("nl-NL")}
          </p>
        </Sketch>
        <Sketch className="relative p-5" seed={3} color={C.amberSoft}>
          <p
            className="text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: C.amber, ...heading }}
          >
            Openstaand
          </p>
          <div className="relative mt-1.5 inline-block">
            <CircleScribble color={C.red} />
            <p className="relative text-[26px] font-bold leading-none" style={heading}>
              € {totaalOpen.toLocaleString("nl-NL")}
            </p>
          </div>
        </Sketch>
      </div>

      <Sketch className="overflow-hidden" seed={1}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[12px] font-bold uppercase tracking-wide"
                style={{
                  color: C.ink,
                  borderBottom: `2px dashed ${C.faint}`,
                  background: C.paperDeep,
                  ...heading,
                }}
              >
                <th className="px-5 py-3.5">Nummer</th>
                <th className="px-5 py-3.5">Klant</th>
                <th className="hidden px-5 py-3.5 sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right">Bedrag</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = statusMeta[f.status] ?? statusMeta.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f5f0e4]"
                    style={{ borderTop: i === 0 ? "none" : `1.5px dashed ${C.faint}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft, ...hand }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13.5px] font-semibold">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...hand }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13.5px] font-bold tabular-nums"
                      style={heading}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Chip tone={m.tone}>
                          <m.Icon size={12} aria-hidden="true" /> {m.label}
                        </Chip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Sketch>
    </div>
  );
}
