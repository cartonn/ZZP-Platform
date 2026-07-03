"use client";

// Concept 39 — "Botanie" · Herbarium — botanisch specimen & inkt (LICHT).
// Biofiele, rustgevende esthetiek: geperst herbarium-papier, fijne inkt-lijnillustraties
// van bladeren/takken (SVG line-art), en handgeschreven-aandoende specimen-labels met
// serif-cursief en een latijnse-naam-gevoel. Elke opdracht/certificaat is een "specimen"
// dat op het papier is gemonteerd met een wandlabel (plaquette + montagehoekjes).
// Natuurlijk, vertrouwd, kalm — past bij zorg. Onderscheidend van Terra (warm-humanist
// aarde) en Vitrine (museaal): dit is specifiek botanisch/herbarium met plant-lijnkunst.
// Palet: papier #f2f1e6, inkt #23271f, botanisch groen #3f6b3a, inktbruin #4a3f2f.
// Fonts: --font-lab-newsreader (serif/labels) + --font-lab-franklin (Libre Franklin, body).

import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Leaf,
  Sprout,
  FileText,
  Send,
  Feather,
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

const C = {
  paper: "#f2f1e6",
  paperDeep: "#eae8d8",
  card: "#f8f7ee",
  ink: "#23271f",
  inkSoft: "#3a3d33",
  brown: "#4a3f2f",
  muted: "#6b6a58",
  faint: "#9a9781",
  line: "#d9d6c2",
  lineSoft: "#e4e1cf",
  green: "#3f6b3a",
  greenSoft: "rgba(63,107,58,0.12)",
  greenLine: "rgba(63,107,58,0.30)",
  sage: "#7d9068",
  amber: "#9a6f2c",
  amberSoft: "rgba(154,111,44,0.14)",
  rust: "#8a4a34",
  rustSoft: "rgba(138,74,52,0.14)",
  brownSoft: "rgba(74,63,47,0.10)",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-franklin)" };

// Herbarium-latijn per scherm — sfeer, geen echte taxonomie.
const LATIN: Record<ScreenKey, string> = {
  dashboard: "Hortus principalis",
  marktplaats: "Flora disponibilis",
  opdracht: "Specimen singulare",
  verificatie: "Probatio radicis",
  acties: "Cura proxima",
  facturen: "Registrum foliorum",
  documenten: "Archivum siccum",
  berichten: "Epistulae horti",
};

const SPECIMEN_NO = ["Fol. 001", "Fol. 002", "Fol. 003", "Fol. 004", "Fol. 005", "Fol. 006"];

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  line: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        fg: C.green,
        bg: C.greenSoft,
        line: C.greenLine,
        Icon: Check,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: C.brown,
        bg: C.brownSoft,
        line: "rgba(74,63,47,0.28)",
        Icon: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        bg: C.amberSoft,
        line: "rgba(154,111,44,0.32)",
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        fg: C.rust,
        bg: C.rustSoft,
        line: "rgba(138,74,52,0.32)",
        Icon: AlertTriangle,
      };
  }
}

/* ---------- Botanische inkt-lijnillustraties (SVG line-art) ---------- */

// Tak met tegenoverstaande blaadjes — fijne inktlijn.
function Sprig({
  className = "",
  color = C.green,
  width = 120,
  height = 160,
  opacity = 1,
}: {
  className?: string;
  color?: string;
  width?: number;
  height?: number;
  opacity?: number;
}) {
  const leaflets = [22, 40, 58, 76, 94, 112];
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 120 160"
      fill="none"
      stroke={color}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Hoofdsteel */}
      <path d="M60 150 C 58 120, 62 90, 60 60 C 59 40, 60 24, 60 10" />
      {leaflets.map((y, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const span = 26 - i * 1.6;
        const x2 = 60 + side * span;
        const yTip = y - 12;
        return (
          <g key={y}>
            <path d={`M60 ${y} Q ${60 + side * span * 0.5} ${y - 4}, ${x2} ${yTip}`} />
            <path
              d={`M60 ${y} Q ${60 + side * span * 0.6} ${y + 3}, ${x2} ${yTip} Q ${
                60 + side * span * 0.5
              } ${y - 9}, 60 ${y}`}
              fill={color}
              fillOpacity={0.06}
            />
          </g>
        );
      })}
      {/* Topknop */}
      <circle cx="60" cy="9" r="2.4" fill={color} fillOpacity={0.16} />
    </svg>
  );
}

// Enkel blad met nerven.
function LeafDrawing({
  className = "",
  color = C.green,
  size = 110,
  opacity = 1,
}: {
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 110 110"
      fill="none"
      stroke={color}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity }}
      aria-hidden="true"
    >
      <path
        d="M20 90 C 30 40, 60 18, 92 20 C 90 52, 68 84, 20 90 Z"
        fill={color}
        fillOpacity={0.05}
      />
      <path d="M20 90 C 44 66, 68 44, 92 20" />
      {[
        [34, 78, 58, 62],
        [42, 70, 68, 52],
        [52, 60, 76, 44],
        [62, 52, 82, 38],
      ].map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1} L ${x2} ${y2}`} strokeWidth={0.8} strokeOpacity={0.6} />
      ))}
    </svg>
  );
}

// Varen-frond — decoratief in hoeken.
function Fern({
  className = "",
  color = C.sage,
  width = 90,
  height = 200,
  opacity = 0.5,
  flip = false,
}: {
  className?: string;
  color?: string;
  width?: number;
  height?: number;
  opacity?: number;
  flip?: boolean;
}) {
  const ys = Array.from({ length: 9 }, (_, i) => 24 + i * 20);
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 90 200"
      fill="none"
      stroke={color}
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity, transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <path d="M45 196 C 40 150, 48 100, 45 56 C 44 40, 45 20, 45 6" />
      {ys.map((y, i) => {
        const span = 30 - i * 2.6;
        return (
          <g key={y}>
            <path d={`M45 ${y} Q ${45 - span * 0.5} ${y - 6}, ${45 - span} ${y - 14}`} />
            <path d={`M45 ${y} Q ${45 + span * 0.5} ${y - 6}, ${45 + span} ${y - 14}`} />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Montage-elementen (herbarium) ---------- */

// Montagehoekje zoals waarmee een geperste plant op papier wordt geplakt.
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute h-4 w-4";
  const map = {
    tl: "left-0 top-0",
    tr: "right-0 top-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  } as const;
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 } as const;
  return (
    <span className={`${base} ${map[pos]}`} aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        style={{ transform: `rotate(${rot[pos]}deg)` }}
      >
        <path d="M0 8 L0 0 L8 0" fill="none" stroke={C.brown} strokeWidth={1.2} opacity={0.5} />
      </svg>
    </span>
  );
}

// Specimen-plaat — papier met dunne rand + montagehoekjes.
function Sheet({
  children,
  className = "",
  corners = true,
  lifted = false,
}: {
  children: React.ReactNode;
  className?: string;
  corners?: boolean;
  lifted?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: lifted ? "0 20px 44px -30px rgba(50,44,28,0.4)" : "none",
      }}
    >
      {corners && (
        <>
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />
        </>
      )}
      {children}
    </div>
  );
}

// Herbarium-wandlabel: klein rechthoekig etiket met serif-cursief.
function SpecimenLabel({
  no,
  latin,
  family,
  right,
}: {
  no: string;
  latin: string;
  family: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{ borderTop: `1px solid ${C.line}`, background: C.paperDeep }}
    >
      <span
        className="shrink-0 text-[10px] uppercase tabular-nums tracking-[0.22em]"
        style={{ color: C.sage, ...body }}
      >
        {no}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[13.5px] italic leading-tight"
          style={{ color: C.ink, ...serif }}
        >
          {latin}
        </p>
        <p
          className="truncate text-[10px] uppercase tracking-[0.14em]"
          style={{ color: C.muted, ...body }}
        >
          {family}
        </p>
      </div>
      {right}
    </div>
  );
}

function SectionHead({ latin, title, note }: { latin: string; title: string; note?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Leaf size={13} aria-hidden="true" style={{ color: C.green }} />
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: C.green, ...body }}
        >
          {latin}
        </p>
      </div>
      <h1 className="mt-3 text-[38px] leading-[1.04]" style={{ ...serif, color: C.ink }}>
        {title}
      </h1>
      {note && (
        <p
          className="mt-2.5 max-w-xl text-[14px] leading-relaxed"
          style={{ color: C.muted, ...body }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <Sprout size={13} aria-hidden="true" style={{ color: C.sage }} />
      <h2
        className="text-[12px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: C.brown, ...body }}
      >
        {children}
      </h2>
      <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
    </div>
  );
}

function Sparkline({ data, color = C.green }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.3} fill={color} />
      ))}
    </svg>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const st = statusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10.5px] font-medium"
      style={{ color: st.fg, background: st.bg, border: `1px solid ${st.line}`, ...body }}
    >
      <st.Icon size={11} aria-hidden="true" />
      {st.label}
    </span>
  );
}

/* ---------- Hoofd-component ---------- */

export function Concept39() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        background: C.paper,
        backgroundImage:
          "radial-gradient(circle at 18% 22%, rgba(63,107,58,0.04), transparent 45%), radial-gradient(circle at 82% 78%, rgba(74,63,47,0.05), transparent 46%)",
      }}
    >
      {/* Decoratieve varens in de marges */}
      <Fern
        className="pointer-events-none absolute -left-4 top-24 hidden lg:block"
        opacity={0.16}
      />
      <Fern
        className="pointer-events-none absolute -right-3 bottom-10 hidden lg:block"
        opacity={0.14}
        flip
        color={C.brown}
      />

      <div className="relative p-3 sm:p-5 lg:p-7">
        <div
          className="min-h-[640px]"
          style={{
            background: C.paper,
            border: `1px solid ${C.line}`,
            boxShadow: "inset 0 0 0 6px #f8f7ee",
          }}
        >
          {/* Kop — herbarium-vignet */}
          <header
            className="relative flex flex-col gap-4 px-6 pb-5 pt-6 sm:flex-row sm:items-center lg:px-10"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="relative flex h-11 w-11 items-center justify-center rounded-sm"
                style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
              >
                <Leaf size={19} aria-hidden="true" style={{ color: C.green }} />
              </div>
              <div>
                <div className="text-[18px] leading-tight" style={serif}>
                  Herbarium ZZP
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.26em]"
                  style={{ color: C.sage, ...body }}
                >
                  Collectie zorgprofessionals
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:ml-auto">
              <button
                className="flex items-center gap-2.5 rounded-sm px-4 py-2 text-[12.5px] transition-colors hover:bg-[#eae8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b3a]"
                style={{ color: C.muted, border: `1px solid ${C.line}` }}
                aria-label="Zoeken in het herbarium"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Doorzoek collectie</span>
              </button>
              <button
                className="relative rounded-sm p-2.5 transition-colors hover:bg-[#eae8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b3a]"
                style={{ color: C.muted, border: `1px solid ${C.line}` }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.green }}
                  aria-hidden="true"
                />
              </button>
              <div
                className="hidden items-center gap-2.5 rounded-sm py-1 pl-1 pr-3.5 sm:flex"
                style={{ border: `1px solid ${C.line}` }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-[11px]"
                  style={{ background: C.green, color: C.paper, ...serif }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="leading-tight">
                  <div className="text-[11.5px] font-semibold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="text-[9.5px] uppercase tracking-[0.12em]"
                    style={{ color: C.green }}
                  >
                    {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Navigatie — herbarium-registers */}
          <nav
            className="flex gap-1 overflow-x-auto px-4 py-3 lg:px-8"
            style={{ borderBottom: `1px solid ${C.line}` }}
            aria-label="Registers"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex shrink-0 items-center gap-2.5 rounded-sm px-4 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b3a]"
                  style={{
                    background: on ? C.ink : "transparent",
                    color: on ? C.paper : C.muted,
                    border: on ? `1px solid ${C.ink}` : `1px solid transparent`,
                  }}
                >
                  <span
                    className="text-[9.5px] tabular-nums tracking-[0.14em]"
                    style={{ color: on ? C.faint : C.sage }}
                  >
                    {SPECIMEN_NO[i]}
                  </span>
                  <span className="text-[12.5px] font-medium" style={body}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="px-6 py-9 lg:px-12 lg:py-11">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>

          {/* Voettekst — herbarium-colofon */}
          <footer
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-4 text-[10px] uppercase tracking-[0.2em] lg:px-10"
            style={{ borderTop: `1px solid ${C.line}`, color: C.faint }}
          >
            <span className="text-[11px] normal-case italic tracking-normal" style={serif}>
              {LATIN[screen]}
            </span>
            <span aria-hidden="true">·</span>
            {NAV.slice(2).map((n) => (
              <span key={n}>{n}</span>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const [loading, setLoading] = useState(true);
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  // Korte, betekenisvolle skeleton bij het "prepareren" van de collectie.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 620);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-11">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <SectionHead
          latin={LATIN.dashboard}
          title={`Welkom terug, ${PROFIEL.naam.split(" ")[0]}.`}
          note="Drie geprepareerde specimens liggen klaar in de vitrine en één bewijsstuk vraagt om aandacht. Neem rustig de tijd — het herbarium wacht."
        />
        <LeafDrawing className="hidden shrink-0 sm:block" size={96} opacity={0.5} />
      </div>

      {/* KPI's als geprepareerde bladeren */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? KPIS.map((k) => (
              <Sheet key={k.label} corners={false}>
                <div className="animate-pulse px-4 py-4">
                  <div className="h-3 w-24 rounded" style={{ background: C.lineSoft }} />
                  <div className="mt-3 h-7 w-20 rounded" style={{ background: C.line }} />
                  <div className="mt-4 h-3 w-full rounded" style={{ background: C.lineSoft }} />
                </div>
              </Sheet>
            ))
          : KPIS.map((k, i) => (
              <Sheet key={k.label}>
                <div className="px-4 py-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[12px]" style={{ color: C.muted }}>
                      {k.label}
                    </p>
                    <span
                      className="text-[9px] uppercase tabular-nums tracking-[0.18em]"
                      style={{ color: C.faint }}
                    >
                      {SPECIMEN_NO[i]}
                    </span>
                  </div>
                  <p
                    className="mt-2.5 text-[30px] tabular-nums leading-none"
                    style={{ ...serif, color: C.ink }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-3.5 flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                      style={{ color: k.up ? C.green : C.rust }}
                    >
                      {k.up ? (
                        <ArrowUpRight size={12} aria-hidden="true" />
                      ) : (
                        <ArrowDownRight size={12} aria-hidden="true" />
                      )}
                      {k.trend}
                    </span>
                    <Sparkline data={k.spark} color={k.up ? C.green : C.brown} />
                  </div>
                </div>
              </Sheet>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {/* Beste matches als specimens */}
          <div>
            <SubHead>Geprepareerde matches</SubHead>
            <div className="space-y-5">
              {OPDRACHTEN.map((o, i) => (
                <Sheet key={o.id} lifted>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f2f1e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b3a]"
                  >
                    <div className="relative shrink-0">
                      <Sprig width={44} height={58} opacity={0.85} />
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[14px] tabular-nums"
                        style={{ ...serif, color: C.green }}
                      >
                        {o.match}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[16px] leading-tight"
                        style={{ ...serif, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] tabular-nums sm:block"
                      style={{ color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                  <SpecimenLabel
                    no={SPECIMEN_NO[i] ?? "Fol."}
                    latin={o.tags[0] ?? "Opdracht"}
                    family={`${o.match}% verwantschap · ${o.uren} · ${o.start}`}
                  />
                </Sheet>
              ))}
            </div>
          </div>

          {/* Correspondentie */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Feather size={13} aria-hidden="true" style={{ color: C.sage }} />
                <h2
                  className="text-[12px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: C.brown, ...body }}
                >
                  Correspondentie
                </h2>
              </div>
              <span className="text-[11px]" style={{ color: C.muted }}>
                {ongelezen} ongelezen
              </span>
            </div>
            <Sheet corners={false}>
              <div className="flex flex-col">
                {BERICHTEN.map((b, i) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 px-4 py-3.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-[11px]"
                      style={{
                        background: b.ongelezen ? C.green : C.paperDeep,
                        color: b.ongelezen ? C.paper : C.muted,
                        ...serif,
                      }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold">{b.van}</p>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.green }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="truncate text-[12px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Sheet>
          </div>
        </div>

        <div className="space-y-10">
          {/* Certificaten */}
          <div>
            <SubHead>Bewijsstukken · radix</SubHead>
            <Sheet>
              <div className="px-4 py-4">
                <div className="space-y-4">
                  {CREDENTIALS.map((c) => {
                    const st = statusStyle(c.status);
                    return (
                      <div key={c.naam} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm"
                          style={{ background: st.bg, border: `1px solid ${st.line}` }}
                          aria-hidden="true"
                        >
                          <st.Icon size={14} style={{ color: st.fg }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold">{c.naam}</p>
                          <p
                            className="truncate text-[11.5px] italic"
                            style={{ color: C.muted, ...serif }}
                          >
                            {c.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Sheet>
          </div>

          {/* Volgende beste stap */}
          <div>
            <SubHead>Aanbevolen · cura</SubHead>
            <div className="relative overflow-hidden" style={{ background: C.ink }}>
              <Sprig
                className="pointer-events-none absolute -right-2 -top-3"
                color="rgba(255,255,255,0.10)"
                width={90}
                height={120}
              />
              <div
                className="relative px-5 py-5"
                style={{ border: `1px solid rgba(255,255,255,0.10)` }}
              >
                <p
                  className="text-[10px] uppercase tracking-[0.26em]"
                  style={{ color: "rgba(242,241,230,0.55)" }}
                >
                  Volgende beste stap
                </p>
                <p
                  className="mt-2.5 text-[21px] leading-tight"
                  style={{ ...serif, color: C.paper }}
                >
                  {primair.titel}
                </p>
                <p
                  className="mt-2 text-[12.5px] leading-relaxed"
                  style={{ color: "rgba(242,241,230,0.72)" }}
                >
                  {primair.detail}
                </p>
                <button
                  className="mt-4 w-full rounded-sm py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-[#eae8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d9068]"
                  style={{ background: C.paper, color: C.ink }}
                >
                  {primair.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHead
        latin={LATIN.marktplaats}
        title="Beschikbare specimens"
        note="Elke opdracht als geprepareerd blad, gemonteerd met wandlabel en verwantschapsmerk."
      />

      <div
        className="flex items-center gap-3 rounded-sm px-5 py-3.5"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.green }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Specimens zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9a9781]"
          style={{ color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Sheet>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <LeafDrawing size={72} opacity={0.6} color={C.sage} />
            <p className="mt-4 text-[22px]" style={{ ...serif, color: C.ink }}>
              Geen specimen gevonden
            </p>
            <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.muted }}>
              Niets in de collectie voldoet aan uw zoekterm. Verruim gerust uw zoekwoorden of
              beschikbaarheid; nieuw werk wordt hier geprepareerd zodra het binnenkomt.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-5 rounded-sm px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#eae8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b3a]"
              style={{ color: C.green, border: `1px solid ${C.greenLine}` }}
            >
              Zoekterm wissen
            </button>
          </div>
        </Sheet>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {filtered.map((o, i) => (
            <Sheet key={o.id} lifted>
              <button
                onClick={onOpen}
                className="w-full text-left transition-colors hover:bg-[#f2f1e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b3a]"
              >
                <div className="px-5 pb-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[10px] uppercase tabular-nums tracking-[0.18em]"
                      style={{ color: C.faint }}
                    >
                      {SPECIMEN_NO[i] ?? "Fol."} · {o.id}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-medium tabular-nums"
                      style={{
                        background: C.greenSoft,
                        color: C.green,
                        border: `1px solid ${C.greenLine}`,
                      }}
                    >
                      <Leaf size={11} aria-hidden="true" />
                      {o.match}% verwant
                    </span>
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <Sprig width={40} height={70} opacity={0.7} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[21px] leading-snug" style={{ ...serif, color: C.ink }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-sm px-2.5 py-1 text-[10.5px]"
                        style={{
                          background: C.paperDeep,
                          color: C.inkSoft,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
              <SpecimenLabel
                no="Tarief"
                latin={o.tarief}
                family={`${o.uren} · start ${o.start.replace("Per ", "").toLowerCase()}`}
              />
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHead latin={`${LATIN.opdracht} · ${opdracht.id}`} title={opdracht.titel} />
        <button
          className="flex shrink-0 items-center gap-2 rounded-sm px-6 py-3 text-[13px] font-semibold transition-colors hover:bg-[#171a13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d9068]"
          style={{ background: C.ink, color: C.paper }}
        >
          <Send size={15} aria-hidden="true" /> Reageer op opdracht
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
        <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Verwant", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Sheet key={m.l}>
            <div className="px-4 py-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                  {m.l}
                </p>
                <span
                  className="text-[9px] uppercase tabular-nums tracking-[0.16em]"
                  style={{ color: C.faint }}
                >
                  {SPECIMEN_NO[i]}
                </span>
              </div>
              <p className="mt-2 text-[19px] tabular-nums" style={{ ...serif, color: C.ink }}>
                {m.v}
              </p>
            </div>
          </Sheet>
        ))}
      </div>

      <Sheet lifted>
        <div className="relative overflow-hidden px-6 py-6">
          <Fern
            className="pointer-events-none absolute -right-4 -top-6"
            opacity={0.12}
            height={180}
          />
          <div className="flex items-center gap-2.5">
            <Leaf size={13} aria-hidden="true" style={{ color: C.green }} />
            <h3
              className="text-[12px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: C.green, ...body }}
            >
              Determinatie
            </h3>
          </div>
          <p className="mt-3 text-[24px] leading-snug" style={{ ...serif, color: C.ink }}>
            Waarom deze match
          </p>
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
            Transparant onderbouwd op basis van uw profiel — niets verborgen.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div
              className="rounded-sm p-5"
              style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
            >
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: C.green }}
              >
                Pluspunten
              </p>
              <ul className="mt-3.5 space-y-3">
                {opdracht.redenen.plus.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[13px]">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
                      style={{ background: C.green }}
                      aria-hidden="true"
                    >
                      <Check size={12} style={{ color: C.paper }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-sm p-5"
              style={{ background: C.amberSoft, border: `1px solid rgba(154,111,44,0.28)` }}
            >
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: C.amber }}
              >
                Aandachtspunten
              </p>
              <ul className="mt-3.5 space-y-3">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
                      style={{ background: C.amberSoft, border: `1px solid rgba(154,111,44,0.4)` }}
                      aria-hidden="true"
                    >
                      <Minus size={12} style={{ color: C.amber }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <SectionHead latin={LATIN.verificatie} title="Verificatie" />

      <Sheet lifted>
        <div className="relative flex items-center gap-5 overflow-hidden px-6 py-6">
          <Sprig
            className="pointer-events-none absolute -right-3 -top-4"
            opacity={0.14}
            width={100}
            height={130}
          />
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm"
            style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
          >
            <Check size={28} aria-hidden="true" style={{ color: C.green }} />
          </div>
          <div>
            <p className="text-[26px]" style={{ ...serif, color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              <span className="tabular-nums">{verified}</span> van{" "}
              <span className="tabular-nums">{CREDENTIALS.length}</span> bewijsstukken volledig
              geverifieerd · <span className="tabular-nums">1</span> vraagt om aandacht. Alles
              veilig geprepareerd en bewaard.
            </p>
          </div>
        </div>
      </Sheet>

      <div className="space-y-5">
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <Sheet key={c.naam}>
              <div className="flex items-center gap-4 px-5 py-4">
                <span
                  className="text-[9px] uppercase tabular-nums tracking-[0.16em]"
                  style={{ color: C.faint }}
                >
                  {SPECIMEN_NO[i]}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm"
                  style={{ background: st.bg, border: `1px solid ${st.line}` }}
                >
                  <st.Icon size={18} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-tight" style={{ ...serif, color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[12px] italic" style={{ color: C.muted, ...serif }}>
                    {c.detail}
                  </p>
                </div>
                <StatusChip status={c.status} />
              </div>
            </Sheet>
          );
        })}
      </div>

      {/* Archief */}
      <div>
        <SubHead>Archief · siccum</SubHead>
        <Sheet corners={false}>
          <div className="flex flex-col">
            {DOCUMENTEN.map((d, i) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm"
                    style={{ background: C.paperDeep }}
                    aria-hidden="true"
                  >
                    <FileText size={15} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-sm px-2.5 py-0.5 text-[10.5px] font-medium"
                    style={{ color: st.fg, background: st.bg, border: `1px solid ${st.line}` }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Sheet>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; line: string; Icon: LucideIcon }
  > = {
    warning: { fg: C.amber, bg: C.amberSoft, line: "rgba(154,111,44,0.3)", Icon: AlertTriangle },
    info: { fg: C.green, bg: C.greenSoft, line: C.greenLine, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-9">
      <SectionHead
        latin={LATIN.acties}
        title="Volgende acties"
        note="Eén specimen tegelijk onder de aandacht. De rest houden wij voor u in de gaten."
      />
      <div className="space-y-5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Sheet key={a.titel}>
              <div className="flex items-start gap-4 px-5 py-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm"
                  style={{ background: t.bg, border: `1px solid ${t.line}` }}
                >
                  <t.Icon size={20} aria-hidden="true" style={{ color: t.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="text-[9.5px] uppercase tabular-nums tracking-[0.18em]"
                      style={{ color: C.faint }}
                    >
                      {SPECIMEN_NO[i]}
                    </span>
                    <p className="text-[16px] leading-tight" style={{ ...serif, color: C.ink }}>
                      {a.titel}
                    </p>
                  </div>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-sm px-4 py-2 text-[12px] font-semibold transition-colors hover:bg-[#eae8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b3a]"
                  style={{ color: t.fg, border: `1px solid ${t.line}` }}
                >
                  {a.cta}
                </button>
              </div>
            </Sheet>
          );
        })}
      </div>

      <div
        className="flex items-center gap-4 rounded-sm px-5 py-4"
        style={{ background: C.paperDeep, border: `1px solid ${C.line}` }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
          style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
        >
          <Sprout size={18} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bekeken? Uitstekend. Nieuwe specimens verschijnen hier zodra ze relevant worden — u
          hoeft niets zelf te bewaken.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string; line: string }> = {
    Betaald: { fg: C.green, bg: C.greenSoft, line: C.greenLine },
    Openstaand: { fg: C.amber, bg: C.amberSoft, line: "rgba(154,111,44,0.3)" },
    Concept: { fg: C.muted, bg: C.brownSoft, line: C.line },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead latin={LATIN.facturen} title="Facturen" />
        <button
          className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-[#171a13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d9068]"
          style={{ background: C.ink, color: C.paper }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Sheet lifted>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="px-5 py-3.5 font-semibold">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.brownSoft, line: C.line };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f2f1e6]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td className="px-5 py-4 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[14px] tabular-nums"
                      style={{ ...serif, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-[11px] font-medium"
                        style={{ color: t.fg, background: t.bg, border: `1px solid ${t.line}` }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Sheet>
    </div>
  );
}
