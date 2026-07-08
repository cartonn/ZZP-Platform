"use client";

// Concept 196 — "Observatorium" · planetarium / orbitale planning. Een donkere sterrenwacht-koepel:
// concentrische baanringen (SVG-cirkels) waarop opdrachten en acties als planeten en manen op hun baan
// staan — afstand tot het centrum = urgentie/tijd. Een fijne meridiaan-graadboog met tick-marks langs
// de rand, coördinaat-labels in mono. Koel astronomisch palet (diep ruimte-navy/indigo, zilvergrijs,
// sterrenwit) met ÉÉN warme accent (goud/amber ster). Verificatie = een uitgelijnd sterrenbeeld.
// Onderscheidt zich radicaal van sterrenbeeld-lijnen, radar-sweep en zonnewijzer: dit is ORBITAAL —
// ringen + hemelbol-gevoel. Deterministisch: planeten via vaste hoeken/radii (Math.sin/cos op vaste
// getallen), nooit random of Date. Status altijd via label + icoon + vorm, nooit kleur-alleen.
// UI Nederlands. Fonts: Newsreader (display-serif) + Plus Jakarta Sans (tekst) + Spline Sans Mono (data).

import { useState } from "react";
import {
  Orbit,
  Telescope,
  Star,
  Sparkles,
  Moon,
  Globe,
  Compass,
  ArrowRight,
  ArrowLeft,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Clock,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  XCircle,
  Check,
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
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — koele astronomische hemel op diep ruimte-navy. Zilvergrijze meridianen, sterrenwit,
//    één warme goud-accent (de poolster). Contrast draagt via lichtheid, betekenis via vorm + label. ──
const C = {
  space: "#070b18", // diep ruimte-navy (achtergrond)
  spaceDeep: "#04060f", // dieper vlak / masthead
  panel: "#0d1426", // koepel-oppervlak (kaart)
  panelHi: "#141d34", // opgetild vlak / hover
  line: "#243050", // fijne meridiaan-rand
  lineSoft: "#1a2440", // zachtere rand
  silver: "#8394bd", // zilvergrijze baanlijn
  indigo: "#5b6ee0", // koele indigo (secundair accent)
  indigoDim: "#38427a", // gedempt indigo
  ink: "#eef2fb", // sterrenwit (primaire tekst)
  inkSoft: "#aab6d4", // secundaire tekst
  inkFaint: "#6b779a", // labels / coördinaten
  gold: "#f2c65a", // poolster — warme accent
  goldHi: "#ffd97e", // helder goud (nadruk)
  goldDeep: "#c39a2f", // dieper goud
  onGold: "#1a1405", // tekst op goud
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const bodyF = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// ── Poolcoördinaten — plaats een punt op een baan. Hoek gemeten vanaf 12-uur, met de klok mee.
//    Volstrekt deterministisch: vaste hoeken in graden → sin/cos. ──
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Status-model — astronomische vormtaal: variant bepaalt de gedaante van de chip/marker.
//    "ster" (uitgelijnd/geverifieerd), "baan" (in beoordeling), "komeet" (verloopt), "eclips" (afgewezen).
//    Nooit kleur-alleen: altijd label + icoon + vorm. ──
type Variant = "ster" | "baan" | "komeet" | "eclips";
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
      // Uitgelijnde ster — warm goud, gevuld: het hoogtepunt van vertrouwen.
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.onGold,
        bg: C.goldHi,
        border: C.goldHi,
        variant: "ster",
      };
    case "SUBMITTED":
      // Baan — koel indigo, omlijnd: nog in omloop, wacht op uitlijning.
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.ink,
        bg: "transparent",
        border: C.indigo,
        variant: "baan",
      };
    case "EXPIRING":
      // Komeet — goud, gestreept: nadert het perihelium, vraagt aandacht.
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.goldHi,
        bg: "rgba(242,198,90,0.10)",
        border: C.gold,
        variant: "komeet",
      };
    case "REJECTED":
      // Eclips — zilver, dubbele rand: verduisterd, opnieuw uitlijnen nodig.
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.ink,
        bg: C.panelHi,
        border: C.silver,
        variant: "eclips",
      };
  }
}

function borderFor(m: StatusStyle): React.CSSProperties {
  if (m.variant === "komeet") return { border: `1px dashed ${m.border}` };
  if (m.variant === "eclips") return { border: `2.5px double ${m.border}` };
  return { border: `1px solid ${m.border}` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, ...borderFor(m) }}
    >
      <m.Icon size={12} strokeWidth={2.3} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kaart — koepel-paneel met fijne meridiaan-rand; bij hover een zachte goud-gloed langs de bovenrand. ──
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
      className={`group/card relative overflow-hidden rounded-2xl ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_rgba(91,110,224,0.5)]"
          : ""
      } ${className}`}
      style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {interactive && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Sectie-kop — indigo-glyph + serif-titel + dunne zilveren meridiaan.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "rgba(91,110,224,0.14)", boxShadow: `inset 0 0 0 1px ${C.indigoDim}` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: C.indigo }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[22px] font-normal leading-none tracking-[0]"
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
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.silver}55, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.indigo }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Coördinaat-badge — mono azimut/radius-label in astronomische stijl.
function Coord({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-[0.08em]"
      style={{
        ...mono,
        background: C.panelHi,
        color: C.inkFaint,
        boxShadow: `inset 0 0 0 1px ${C.lineSoft}`,
      }}
    >
      {children}
    </span>
  );
}

// Match-schijf — gouden baanboog op donkere rest, mono-cijfer in het hart (een klein zonnestelsel).
function MatchDisc({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.goldHi} 0deg, ${C.gold} ${deg}deg, ${C.lineSoft} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.panel }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.goldHi }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — indigo-ladder, laatste staaf helder goud (de recentste meting).
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.goldHi : "rgba(91,110,224,0.35)",
          }}
        />
      ))}
    </div>
  );
}

// ── De signatuur: het planetarium. Concentrische baanringen; opdrachten als planeten en acties als
//    manen op hun baan. Afstand tot het centrum = urgentie/tijd (dichterbij = urgenter). Graadgraticule
//    langs de rand met tick-marks. Alle posities zijn vast en deterministisch. ──
type Hemelobject = {
  key: string;
  soort: "planeet" | "maan";
  label: string;
  sub: string;
  hoek: number; // azimut in graden (vanaf 12-uur, met de klok mee)
  radius: number; // baanstraal in view-eenheden — kleiner = urgenter
  size: number;
  index: number; // index in OPDRACHTEN, of -1 voor manen
};

const CENTER = 200;
const RINGS = [64, 104, 146, 182]; // concentrische baanradii
const RIM = 194; // graticule-rand

// Vaste plaatsing — geen random. Opdrachten: hogere match → dichter bij het centrum (urgenter te
// beantwoorden). Acties: warning zit binnen, info verder naar buiten.
const HEMEL: Hemelobject[] = [
  {
    key: OPDRACHTEN[0]!.id,
    soort: "planeet",
    label: OPDRACHTEN[0]!.titel,
    sub: `${OPDRACHTEN[0]!.opdrachtgever} · ${OPDRACHTEN[0]!.match}% match`,
    hoek: 38,
    radius: RINGS[0]!,
    size: 13,
    index: 0,
  },
  {
    key: OPDRACHTEN[1]!.id,
    soort: "planeet",
    label: OPDRACHTEN[1]!.titel,
    sub: `${OPDRACHTEN[1]!.opdrachtgever} · ${OPDRACHTEN[1]!.match}% match`,
    hoek: 152,
    radius: RINGS[1]!,
    size: 11,
    index: 1,
  },
  {
    key: OPDRACHTEN[2]!.id,
    soort: "planeet",
    label: OPDRACHTEN[2]!.titel,
    sub: `${OPDRACHTEN[2]!.opdrachtgever} · ${OPDRACHTEN[2]!.match}% match`,
    hoek: 262,
    radius: RINGS[2]!,
    size: 10,
    index: 2,
  },
  {
    key: "maan-vog",
    soort: "maan",
    label: ACTIES[0]!.titel,
    sub: "Actie · urgent",
    hoek: 108,
    radius: RINGS[0]! + 22,
    size: 7,
    index: -1,
  },
  {
    key: "maan-match",
    soort: "maan",
    label: ACTIES[1]!.titel,
    sub: "Actie · kans",
    hoek: 214,
    radius: RINGS[1]! + 20,
    size: 6,
    index: -1,
  },
  {
    key: "maan-factuur",
    soort: "maan",
    label: ACTIES[2]!.titel,
    sub: "Actie · opvolging",
    hoek: 328,
    radius: RINGS[2]! + 16,
    size: 6,
    index: -1,
  },
];

function OrbitView({ onOpen }: { onOpen: () => void }) {
  const [actief, setActief] = useState<string>(HEMEL[0]!.key);
  const obj = HEMEL.find((h) => h.key === actief) ?? HEMEL[0]!;
  const gekozen = polar(CENTER, CENTER, obj.radius, obj.hoek);

  // Graticule-ticks — elke 15°, langer op de hoofdrichtingen (elke 90°).
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
  const hoofdrichting = [0, 90, 180, 270];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      {/* De koepel */}
      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 60% at 50% 45%, rgba(91,110,224,0.14), transparent 70%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.silver }}
            >
              <Orbit size={13} strokeWidth={2} aria-hidden="true" /> Baankaart · live
            </span>
            <Coord>
              <Compass size={10} aria-hidden="true" /> AZ {String(obj.hoek).padStart(3, "0")}° · R{" "}
              {obj.radius}
            </Coord>
          </div>

          <svg
            viewBox="0 0 400 400"
            className="mx-auto block h-auto w-full max-w-[440px]"
            role="img"
            aria-label="Orbitale baankaart met opdrachten als planeten en acties als manen; afstand tot het centrum toont urgentie."
          >
            {/* Sterrenveld — vaste, deterministische stippen (geen random) */}
            <g aria-hidden="true">
              {[
                [40, 60],
                [340, 48],
                [72, 300],
                [360, 330],
                [200, 30],
                [30, 210],
                [370, 160],
                [110, 90],
                [290, 350],
                [150, 360],
                [330, 250],
                [60, 150],
              ].map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i % 3 === 0 ? 1.4 : 0.8}
                  fill={C.silver}
                  opacity={i % 2 === 0 ? 0.55 : 0.3}
                />
              ))}
            </g>

            {/* Baanringen */}
            <g aria-hidden="true">
              {RINGS.map((r, i) => (
                <circle
                  key={r}
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill="none"
                  stroke={C.silver}
                  strokeWidth={0.75}
                  opacity={i === 0 ? 0.4 : 0.22}
                  strokeDasharray={i === RINGS.length - 1 ? "3 4" : undefined}
                />
              ))}
            </g>

            {/* Graticule-rand met tick-marks */}
            <g aria-hidden="true">
              <circle cx={CENTER} cy={CENTER} r={RIM} fill="none" stroke={C.line} strokeWidth={1} />
              {ticks.map((deg) => {
                const groot = hoofdrichting.includes(deg);
                const a = polar(CENTER, CENTER, RIM, deg);
                const b = polar(CENTER, CENTER, RIM - (groot ? 12 : 6), deg);
                return (
                  <line
                    key={deg}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={groot ? C.gold : C.silver}
                    strokeWidth={groot ? 1.6 : 0.8}
                    opacity={groot ? 0.9 : 0.5}
                  />
                );
              })}
              {hoofdrichting.map((deg) => {
                const p = polar(CENTER, CENTER, RIM - 22, deg);
                return (
                  <text
                    key={deg}
                    x={p.x}
                    y={p.y + 3}
                    textAnchor="middle"
                    style={mono}
                    fontSize="8"
                    fill={C.inkFaint}
                    letterSpacing="0.08em"
                  >
                    {String(deg).padStart(3, "0")}
                  </text>
                );
              })}
            </g>

            {/* Meridiaan-kruis */}
            <g aria-hidden="true" stroke={C.lineSoft} strokeWidth={0.6}>
              <line x1={CENTER} y1={CENTER - RIM} x2={CENTER} y2={CENTER + RIM} />
              <line x1={CENTER - RIM} y1={CENTER} x2={CENTER + RIM} y2={CENTER} />
            </g>

            {/* Radiaal naar het actieve object */}
            <line
              x1={CENTER}
              y1={CENTER}
              x2={gekozen.x}
              y2={gekozen.y}
              stroke={C.gold}
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.7}
              aria-hidden="true"
            />

            {/* Het centrum — de waarnemer (de ZZP'er/zon) */}
            <g aria-hidden="true">
              <circle cx={CENTER} cy={CENTER} r={16} fill="rgba(242,198,90,0.16)" />
              <circle cx={CENTER} cy={CENTER} r={9} fill={C.gold} />
              <circle cx={CENTER} cy={CENTER} r={9} fill="none" stroke={C.goldHi} strokeWidth={1} />
              <text
                x={CENTER}
                y={CENTER + 3}
                textAnchor="middle"
                style={mono}
                fontSize="9"
                fontWeight="700"
                fill={C.onGold}
              >
                {PROFIEL.initialen}
              </text>
            </g>

            {/* Hemelobjecten — planeten (opdrachten) en manen (acties) */}
            {HEMEL.map((h) => {
              const p = polar(CENTER, CENTER, h.radius, h.hoek);
              const on = h.key === actief;
              const kleur = h.soort === "planeet" ? C.indigo : C.silver;
              const kleurHi = h.soort === "planeet" ? "#8b98ea" : C.ink;
              return (
                <g
                  key={h.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${h.label} — ${h.sub}`}
                  onMouseEnter={() => setActief(h.key)}
                  onFocus={() => setActief(h.key)}
                  onClick={() => h.soort === "planeet" && onOpen()}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && h.soort === "planeet") {
                      e.preventDefault();
                      onOpen();
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:opacity-100"
                >
                  {/* Highlight-halo (zichtbaar bij actief/focus) */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={h.size + 7}
                    fill="none"
                    stroke={C.goldHi}
                    strokeWidth={1.2}
                    className="transition-opacity duration-200"
                    style={{ opacity: on ? 1 : 0 }}
                  />
                  <circle cx={p.x} cy={p.y} r={h.size + 3} fill={`${kleur}22`} />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={h.size}
                    fill={on ? kleurHi : kleur}
                    stroke={on ? C.goldHi : C.line}
                    strokeWidth={1}
                  />
                  {/* Maantje-schaduw voor diepte */}
                  {h.soort === "maan" && (
                    <circle
                      cx={p.x - h.size * 0.35}
                      cy={p.y - h.size * 0.35}
                      r={h.size * 0.5}
                      fill={kleurHi}
                      opacity={0.4}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          <div
            className="mt-3 flex items-center justify-center gap-4 text-[10px]"
            style={{ ...mono, color: C.inkFaint }}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: C.indigo }}
                aria-hidden="true"
              />{" "}
              Opdracht
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: C.silver }}
                aria-hidden="true"
              />{" "}
              Actie
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: C.gold }}
                aria-hidden="true"
              />{" "}
              Jij
            </span>
          </div>
        </div>
      </Card>

      {/* Uitleespaneel — toont het actieve hemelobject (micro-interactie: hover een planeet) */}
      <div className="flex flex-col gap-4">
        <Card interactive className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2">
            {obj.soort === "planeet" ? (
              <Globe size={15} strokeWidth={1.9} style={{ color: C.indigo }} aria-hidden="true" />
            ) : (
              <Moon size={15} strokeWidth={1.9} style={{ color: C.silver }} aria-hidden="true" />
            )}
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.silver }}
            >
              {obj.soort === "planeet" ? "Planeet · opdracht" : "Maan · actie"}
            </span>
          </div>
          <h3
            className="mt-3 text-[20px] font-normal leading-tight"
            style={{ ...display, color: C.ink }}
          >
            {obj.label}
          </h3>
          <p className="mt-1.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            {obj.sub}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Coord>
              <Compass size={10} aria-hidden="true" /> AZ {String(obj.hoek).padStart(3, "0")}°
            </Coord>
            <Coord>R {obj.radius}</Coord>
            <Coord>
              {obj.radius <= RINGS[0]! + 22
                ? "urgent"
                : obj.radius <= RINGS[1]! + 20
                  ? "nabij"
                  : "in baan"}
            </Coord>
          </div>
          {obj.soort === "planeet" ? (
            <button
              onClick={onOpen}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1426]"
              style={{
                ...bodyF,
                background: C.gold,
                color: C.onGold,
                ["--tw-ring-color" as string]: C.gold,
              }}
            >
              Open opdracht <ArrowRight size={14} aria-hidden="true" />
            </button>
          ) : (
            <p className="mt-5 text-[12px] leading-relaxed" style={{ ...bodyF, color: C.inkFaint }}>
              Manen cirkelen om je open acties. Los ze op om je baan schoon te houden.
            </p>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-[11px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
            <span style={{ color: C.goldHi }}>Lezen:</span> hoe dichter een object bij het centrum,
            hoe urgenter. Beweeg over een planeet om haar coördinaten te zien.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept196() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.space, color: C.ink }}
    >
      {/* Diepe hemel-gloed onder alles — deterministische radiale gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 70% at 50% -15%, rgba(91,110,224,0.14), transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Masthead — sterrenwacht-koepel met horizonlijn */}
        <header className="relative overflow-hidden" style={{ background: C.spaceDeep }}>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(91,110,224,0.16)",
                  boxShadow: `inset 0 0 0 1px ${C.indigoDim}`,
                }}
                aria-hidden="true"
              >
                <Telescope size={20} strokeWidth={1.9} style={{ color: C.indigo }} />
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                  style={{ background: C.gold, boxShadow: `0 0 8px ${C.gold}` }}
                />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.indigo }}
                >
                  Observatorium
                </div>
                <div
                  className="text-[26px] font-normal leading-none"
                  style={{ ...display, color: C.ink }}
                >
                  Baankaart
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Planning · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: "rgba(242,198,90,0.12)",
                  color: C.goldHi,
                  boxShadow: `inset 0 0 0 1px ${C.goldDeep}66`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ ...mono, background: C.gold, color: C.onGold }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — koele pil-tabs */}
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
                  className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04060f]"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.gold,
                          color: C.onGold,
                          ["--tw-ring-color" as string]: C.gold,
                        }
                      : {
                          ...bodyF,
                          background: "rgba(91,110,224,0.10)",
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                          ["--tw-ring-color" as string]: C.gold,
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
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Orbit size={12} aria-hidden="true" /> Alles cirkelt om jou — afstand toont urgentie,
            uitlijning toont vertrouwen.
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
      {/* Hero — sterrenwacht-masthead */}
      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(90% 130% at 100% 0%, rgba(91,110,224,0.18), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-9">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              ...bodyF,
              background: "rgba(91,110,224,0.14)",
              color: "#9aa6ee",
              boxShadow: `inset 0 0 0 1px ${C.indigoDim}`,
            }}
          >
            <Star size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[34px] font-normal leading-[1.06] sm:text-[46px]"
            style={{ ...display, color: C.ink }}
          >
            Drie opdrachten in je baan. Twee liggen dichtbij.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén object nadert het perihelium: je VOG verloopt binnenkort. Lijn het uit en houd je
            hemel helder verifieerbaar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1426]"
              style={{
                ...bodyF,
                background: C.gold,
                color: C.onGold,
                ["--tw-ring-color" as string]: C.gold,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1426]"
              style={{
                ...bodyF,
                background: C.panelHi,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
                ["--tw-ring-color" as string]: C.gold,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.goldHi }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? "rgba(242,198,90,0.16)" : C.panelHi,
                  color: k.up ? C.goldHi : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? C.goldDeep + "55" : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[28px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      {/* De signatuur-baankaart */}
      <section className="space-y-4">
        <SectionHead
          title="Jouw baankaart"
          sub="Opdrachten en acties in omloop — afstand toont urgentie"
          Icon={Orbit}
        />
        <OrbitView onOpen={onOpen} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Sparkles}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.gold }}
                >
                  <MatchDisc value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-normal"
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
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.indigo }}
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
                  background: `conic-gradient(${C.goldHi} 0deg, ${C.gold} ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.panel }}
                >
                  <span
                    className="text-[26px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.goldHi }}
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
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten uitgelijnd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — goud-vlak */}
          <Card className="relative" style={{ background: C.gold, boxShadow: "none" }}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(80% 120% at 100% 0%, rgba(255,255,255,0.22), transparent 55%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: "rgba(26,20,5,0.16)", color: C.onGold }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Perihelium
              </span>
              <h3
                className="mt-2.5 text-[22px] font-normal leading-tight"
                style={{ ...display, color: C.onGold }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(26,20,5,0.78)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2c65a]"
                style={{
                  ...bodyF,
                  background: C.onGold,
                  color: C.goldHi,
                  ["--tw-ring-color" as string]: C.onGold,
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
        <SectionHead title="Marktplaats" sub="Open opdrachten in het veld" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.indigo }} aria-hidden="true" />
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
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.gold,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.indigo }}
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
          style={{ background: "rgba(242,198,90,0.08)", border: `1px dashed ${C.gold}` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.goldHi }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-normal" style={{ ...display, color: C.ink }}>
              Sommige objecten konden niet worden waargenomen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Herstel de verbinding en
              laad opnieuw.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.goldHi, ["--tw-ring-color" as string]: C.gold }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: "rgba(91,110,224,0.14)",
              boxShadow: `inset 0 0 0 1px ${C.indigoDim}`,
            }}
            aria-hidden="true"
          >
            <Telescope size={28} strokeWidth={1.6} style={{ color: C.indigo }} />
          </span>
          <p className="text-[22px] font-normal" style={{ ...display, color: C.ink }}>
            Niets in beeld
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen object gevonden voor &ldquo;{q}&rdquo;. Richt de telescoop op een andere zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
            style={{
              ...bodyF,
              background: C.gold,
              color: C.onGold,
              ["--tw-ring-color" as string]: C.gold,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.indigo})` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <MatchDisc value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-normal leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="relative px-4 pb-4">
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
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.goldHi,
                  ["--tw-ring-color" as string]: C.gold,
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.gold,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 130% at 100% 0%, rgba(91,110,224,0.18), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                ...mono,
                background: "rgba(91,110,224,0.14)",
                color: "#9aa6ee",
                boxShadow: `inset 0 0 0 1px ${C.indigoDim}`,
              }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[30px] font-normal leading-[1.06] sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchDisc value={opdracht.match} size={82} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "rgba(91,110,224,0.14)" }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.9} style={{ color: C.indigo }} />
            </span>
            <div
              className="mt-3 text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
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
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(91,110,224,0.18)" }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.indigo }} />
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
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.goldDeep}66` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.goldHi }} />
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
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
          style={{
            ...bodyF,
            background: C.gold,
            color: C.onGold,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — een uitgelijnd sterrenbeeld: geverifieerde certificaten lichten op als sterren ─────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  // Vaste posities voor het sterrenbeeld — geen random. Elke credential is een ster op de hemelkaart;
  // geverifieerde sterren worden met lijnen verbonden tot een constellatie.
  const sterren = [
    { x: 60, y: 60 },
    { x: 210, y: 40 },
    { x: 300, y: 120 },
    { x: 120, y: 150 },
  ];
  const verifiedIdx = CREDENTIALS.map((c, i) => (c.status === "VERIFIED" ? i : -1)).filter(
    (i) => i >= 0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Verificatie"
          sub="Certificaten &amp; documenten als sterrenbeeld"
          Icon={ShieldCheck}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
          style={{
            ...bodyF,
            background: C.gold,
            color: C.onGold,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      {/* Constellatie-panel — verificatie als uitgelijnd sterrenbeeld */}
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 130% at 0% 0%, rgba(242,198,90,0.10), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative grid grid-cols-1 gap-4 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="mx-auto">
            <svg
              viewBox="0 0 360 200"
              className="h-auto w-full max-w-[360px]"
              role="img"
              aria-label={`Sterrenbeeld van vertrouwen: ${verified} van ${CREDENTIALS.length} certificaten geverifieerd.`}
            >
              {/* Verbindingslijnen tussen geverifieerde sterren */}
              {verifiedIdx.map((idx, k) => {
                if (k === 0) return null;
                const a = sterren[verifiedIdx[k - 1]!]!;
                const b = sterren[idx]!;
                return (
                  <line
                    key={idx}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={C.gold}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    opacity={0.7}
                  />
                );
              })}
              {CREDENTIALS.map((c, i) => {
                const s = sterren[i]!;
                const isVer = c.status === "VERIFIED";
                return (
                  <g key={c.naam}>
                    {isVer && <circle cx={s.x} cy={s.y} r={10} fill="rgba(242,198,90,0.18)" />}
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={isVer ? 5 : 3.5}
                      fill={isVer ? C.goldHi : C.silver}
                      stroke={isVer ? C.gold : C.line}
                      strokeWidth={1}
                    />
                    <text
                      x={s.x}
                      y={s.y + 22}
                      textAnchor="middle"
                      style={mono}
                      fontSize="8"
                      fill={isVer ? C.inkSoft : C.inkFaint}
                    >
                      {c.naam.length > 22 ? c.naam.slice(0, 20) + "…" : c.naam}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.goldHi} 0deg, ${C.gold} ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[6px] flex items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                  style={{ ...mono, background: C.panel, color: C.goldHi }}
                >
                  {dek}
                </span>
              </span>
              <div>
                <div className="text-[20px] font-normal" style={{ ...display, color: C.ink }}>
                  {verified}/{CREDENTIALS.length} uitgelijnd
                </div>
                <span
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ ...bodyF, background: C.goldHi, color: C.onGold }}
                >
                  <Sparkles size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
                </span>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd certificaat is een ster in je sterrenbeeld. Hoe voller de
              constellatie, hoe helderder opdrachtgevers jouw vertrouwen zien.
            </p>
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: m.variant === "ster" ? C.goldHi : C.panelHi,
                  ...(m.variant === "ster" ? {} : borderFor(m)),
                }}
                aria-hidden="true"
              >
                <m.Icon
                  size={20}
                  strokeWidth={2.2}
                  style={{ color: m.variant === "ster" ? C.onGold : m.fg }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-normal"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#070b18]"
                      style={{
                        ...bodyF,
                        background: C.panelHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.gold,
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

      {/* Documenten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead
          title="Documenten"
          sub="Privé — alleen geverifieerde zichtbaar voor opdrachtgevers"
          Icon={FileText}
        />
        <Card>
          {DOCUMENTEN.map((d, i) => (
            <div
              key={d.naam}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                aria-hidden="true"
              >
                <FileText size={16} strokeWidth={1.9} style={{ color: C.silver }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-normal"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {d.naam}
                </div>
                <div
                  className="mt-0.5 text-[11px] tabular-nums"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusTag status={d.status} />
            </div>
          ))}
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
        sub="Op urgentie gerangschikt — de dichtstbij eerst"
        Icon={Moon}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.goldHi : C.indigo }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                    style={
                      warn
                        ? { ...mono, background: C.goldHi, color: C.onGold }
                        : {
                            ...mono,
                            background: C.panelHi,
                            color: "#9aa6ee",
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? { ...mono, background: C.goldHi, color: C.onGold }
                            : {
                                ...mono,
                                background: "rgba(91,110,224,0.14)",
                                color: "#9aa6ee",
                                boxShadow: `inset 0 0 0 1px ${C.indigoDim}`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3 className="text-[18px] font-normal" style={{ ...display, color: C.ink }}>
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.gold,
                              color: C.onGold,
                              ["--tw-ring-color" as string]: C.gold,
                            }
                          : {
                              ...bodyF,
                              background: C.panelHi,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
                              ["--tw-ring-color" as string]: C.gold,
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
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: "rgba(91,110,224,0.14)",
                  color: "#9aa6ee",
                  boxShadow: `inset 0 0 0 1px ${C.indigoDim}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-normal"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.gold }}
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

      {/* Navigatie-sterrenkaart — NAV als hemelkaart-index */}
      <section className="space-y-3">
        <SectionHead title="Navigatie" sub="Alle secties op één hemelkaart" Icon={Compass} />
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {NAV.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
                style={{
                  ...bodyF,
                  background: C.panelHi,
                  color: C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: C.silver }}
                  aria-hidden="true"
                />
                {n}
              </span>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; variant: "betaald" | "open" | "concept" } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, variant: "betaald" };
    if (status === "Openstaand") return { label: "Openstaand", Icon: Clock, variant: "open" };
    return { label: "Concept", Icon: FileText, variant: "concept" };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b18]"
          style={{
            ...bodyF,
            background: C.gold,
            color: C.onGold,
            ["--tw-ring-color" as string]: C.gold,
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
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.indigo})` }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[28px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
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
              <tr style={{ background: C.panelHi }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
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
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.variant === "betaald" ? C.goldHi : "transparent",
                          color:
                            m.variant === "betaald"
                              ? C.onGold
                              : m.variant === "open"
                                ? C.goldHi
                                : C.inkSoft,
                          border:
                            m.variant === "betaald"
                              ? `1px solid ${C.goldHi}`
                              : m.variant === "open"
                                ? `1px dashed ${C.gold}`
                                : `1px solid ${C.line}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.gold }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(26,20,5,0.7)" }}
                >
                  Totaal betaald
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
      </Card>
    </div>
  );
}
