"use client";

// Concept 286 — "Origami" · Gevouwen papier / geometrische vouwen (light pastel).
// Signature: een gevouwen-papier-esthetiek — kaarten met scherpe diagonale "vouw"-lijnen en
// subtiele licht/schaduw-facetten (via CSS gradients die een gevouwen vlak suggereren), gelaagde
// papiervlakken met een kleine offset-schaduw langs de vouwrand, en zachte pastel-papierkleuren
// (roze, hemelblauw, mintgroen, crème) met crisp geometrische hoeken. Speels-tactiel maar strak.
// Het gevouwen effect komt uit clip-path/gradients — geen afbeeldingen.
// Fonts: --font-lab-sora (geometrische display) + --font-lab-manrope (heldere tekst).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileText,
  RefreshCw,
  CircleAlert,
  Plus,
  Minus,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Hourglass,
  Origami as OrigamiIcon,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Folded-paper pastel palette. Soft paper planes, crisp facets, gentle fold shadows.
const C = {
  bg: "#f4f1ea",
  bg2: "#ece7dc",
  paper: "#fffdf8",
  paperDeep: "#f7f3ea",
  fold: "#e7e0d2",
  foldDeep: "#d9cfbc",
  line: "#e3dccd",
  lineSoft: "#efe9dc",
  ink: "#2f2a3a",
  fg: "#453f52",
  fgSoft: "#655e73",
  muted: "#8a8298",
  faint: "#aaa2b6",
  // pastel paper tones + their fold shades
  rose: "#e88aa6",
  roseFace: "#fbe0e8",
  roseFold: "#f3c4d3",
  sky: "#7fb4e6",
  skyFace: "#dcecfb",
  skyFold: "#bcd8f2",
  mint: "#6fc9a3",
  mintFace: "#d9f2e7",
  mintFold: "#bce6d3",
  butter: "#e8b968",
  butterFace: "#fbeecd",
  butterFold: "#f2ddab",
  lilac: "#a892d6",
  lilacFace: "#e9e2f6",
  lilacFold: "#d5c9ee",
};

const display = { fontFamily: "var(--font-lab-sora), system-ui, sans-serif" };
const sans = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Search,
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a892d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]";

// The folded corner — a clipped triangular facet in the top-right that reads as a turned-up fold.
const FOLD_CLIP = "polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)";

// A faceted paper surface — two diagonal light planes meeting on a crease, suggesting a fold.
function facetSurface(face: string, fold: string): string {
  return `linear-gradient(135deg, ${face} 0%, ${face} 48%, ${fold} 48%, ${fold} 100%)`;
}

// ---- Primitives -------------------------------------------------------------

// A folded paper card: crisp corners, a clipped fold notch, and a small offset shadow.
function FoldCard({
  children,
  className,
  style,
  tint,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tint?: { face: string; fold: string };
}) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        clipPath: FOLD_CLIP,
        boxShadow: "3px 4px 0 rgba(47,42,58,0.05)",
        ...style,
      }}
    >
      {/* the turned-up fold triangle in the top-right corner */}
      <span
        className="pointer-events-none absolute right-0 top-0 h-[26px] w-[26px]"
        style={{
          background: tint
            ? `linear-gradient(225deg, ${tint.fold} 0%, ${tint.face} 100%)`
            : `linear-gradient(225deg, ${C.foldDeep} 0%, ${C.fold} 100%)`,
          clipPath: "polygon(0 0, 100% 100%, 0 100%)",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

// Verification status vocabulary — label + icon + a pastel tone.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  face: string;
  fold: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        tone: C.mint,
        face: C.mintFace,
        fold: C.mintFold,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Hourglass,
        tone: C.sky,
        face: C.skyFace,
        fold: C.skyFold,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        tone: C.butter,
        face: C.butterFace,
        fold: C.butterFold,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        tone: C.rose,
        face: C.roseFace,
        fold: C.roseFold,
      };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, tone, face } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold"
      style={{ ...sans, color: tone, background: face }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const t =
    value >= 90
      ? { tone: C.mint, face: C.mintFace }
      : value >= 82
        ? { tone: C.sky, face: C.skyFace }
        : { tone: C.butter, face: C.butterFace };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1"
      style={{ background: t.face }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-extrabold tabular-nums leading-none ${size === "sm" ? "text-[15px]" : "text-[19px]"}`}
        style={{ ...display, color: t.tone }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ ...sans, color: t.tone }}
      >
        match
      </span>
    </span>
  );
}

function Sparkline({ data, tone, height = 34 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 62 - 20;
    return [x, y] as const;
  });
  // A zig-zag polyline reads like a folded crease profile.
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Filled button — a solid folded tab that lifts (offset shadow grows) on hover.
function TabButton({
  children,
  onClick,
  tone = C.lilac,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  const [hot, setHot] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-bold transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.paper,
        background: tone,
        boxShadow: hot ? "3px 3px 0 rgba(47,42,58,0.18)" : "1px 2px 0 rgba(47,42,58,0.1)",
        transform: hot ? "translate(-1px,-1px)" : "none",
      }}
    >
      {children}
    </button>
  );
}

// Outline paper-tab secondary button — tints its face on hover.
function GhostTab({
  children,
  onClick,
  tone = C.lilac,
  face = C.lilacFace,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  face?: string;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const on = active || hot;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-[12.5px] font-bold transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: tone,
        background: on ? face : "transparent",
        borderColor: on ? tone : C.line,
      }}
    >
      {children}
    </button>
  );
}

// A little folded-plane marker — a pastel triangle, echoing the origami motif.
function Plane({ tone }: { tone: string }) {
  return (
    <span
      className="inline-block h-3 w-3"
      style={{ background: tone, clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
      aria-hidden="true"
    />
  );
}

function ScreenHead({
  eyebrow,
  tone,
  title,
  sub,
}: {
  eyebrow: string;
  tone: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 inline-flex items-center gap-2">
        <Plane tone={tone} />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ ...sans, color: tone }}
        >
          {eyebrow}
        </span>
      </div>
      <h1
        className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[36px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-2xl text-[14px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  const roseTint = { tone: C.rose, face: C.roseFace, fold: C.roseFold };
  const kpiTints = [
    roseTint,
    { tone: C.sky, face: C.skyFace, fold: C.skyFold },
    { tone: C.mint, face: C.mintFace, fold: C.mintFold },
    { tone: C.butter, face: C.butterFace, fold: C.butterFold },
  ];
  return (
    <div>
      <div
        className="relative mb-10 overflow-hidden px-7 py-8 sm:px-9 sm:py-10"
        style={{
          background: facetSurface(C.lilacFace, C.lilacFold),
          border: `1px solid ${C.line}`,
          clipPath: FOLD_CLIP,
        }}
      >
        <span
          className="pointer-events-none absolute right-0 top-0 h-9 w-9"
          style={{
            background: `linear-gradient(225deg, ${C.lilac} 0%, ${C.lilacFold} 100%)`,
            clipPath: "polygon(0 0, 100% 100%, 0 100%)",
          }}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2">
              <Plane tone={C.lilac} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ ...sans, color: C.lilac }}
              >
                {PROFIEL.plaats} · {PROFIEL.rol}
              </span>
            </div>
            <h1
              className="text-[32px] font-extrabold leading-none tracking-tight sm:text-[42px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen, {voornaam}
            </h1>
            <p
              className="mt-3.5 max-w-md text-[14px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Je werk, laag voor laag gevouwen — alles netjes op zijn plek, niks los.
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-md px-4 py-2.5"
            style={{ background: C.mintFace }}
          >
            <ShieldCheck size={16} strokeWidth={2.2} style={{ color: C.mint }} aria-hidden="true" />
            <span className="text-[12.5px] font-bold" style={{ ...sans, color: C.mint }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const t = kpiTints[i % kpiTints.length] ?? roseTint;
          return (
            <FoldCard key={k.label} className="p-5" tint={t}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...sans, color: k.up ? C.mint : C.rose }}
                >
                  <Trend size={11} strokeWidth={2.4} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[25px] font-extrabold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Sparkline data={k.spark} tone={t.tone} />
              </div>
            </FoldCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 inline-flex items-center gap-2">
            <Plane tone={C.rose} />
            <h2
              className="text-[16px] font-extrabold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full text-left ${RING}`}
            aria-label={`Open opdracht ${top.titel}`}
          >
            <FoldCard
              className="p-6 transition-transform duration-200 group-hover:-translate-y-0.5"
              tint={{ face: C.roseFace, fold: C.roseFold }}
            >
              <span className="flex items-start gap-5">
                <MatchTag value={top.match} />
                <span className="min-w-0 flex-1">
                  <span
                    className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
                    style={{ ...sans, color: C.faint }}
                  >
                    {top.id}
                  </span>
                  <span
                    className="mt-1 block text-[18px] font-extrabold leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {top.titel}
                  </span>
                  <span className="mt-0.5 block text-[13px]" style={{ ...sans, color: C.muted }}>
                    {top.opdrachtgever} · {top.plaats} · {top.tarief}
                  </span>
                  <span className="mt-3.5 flex flex-wrap gap-1.5">
                    {top.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ ...sans, color: C.fgSoft, background: C.paperDeep }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <ArrowRight
                  size={20}
                  className="mt-1 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: C.rose }}
                  aria-hidden="true"
                />
              </span>
            </FoldCard>
          </button>

          <FoldCard
            className="mt-5 flex items-start gap-4 p-6"
            tint={{ face: C.mintFace, fold: C.mintFold }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
              style={{ background: C.mintFace, color: C.mint }}
              aria-hidden="true"
            >
              <ShieldCheck size={21} strokeWidth={2.2} />
            </span>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="text-[14.5px] font-extrabold" style={{ ...display, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.mint }}
                  aria-hidden="true"
                />
              </span>
              <span
                className="mt-1 block text-[13px] leading-relaxed"
                style={{ ...sans, color: C.fgSoft }}
              >
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat je te vertrouwen
                bent.
              </span>
            </div>
          </FoldCard>
        </div>

        <div>
          <div className="mb-4 inline-flex items-center gap-2">
            <Plane tone={C.butter} />
            <h2
              className="text-[16px] font-extrabold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Vraagt aandacht
            </h2>
          </div>
          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const t =
                a.urgentie === "warning"
                  ? { tone: C.rose, face: C.roseFace, fold: C.roseFold }
                  : { tone: C.butter, face: C.butterFace, fold: C.butterFold };
              return (
                <FoldCard
                  key={a.titel}
                  className="overflow-hidden"
                  tint={{ face: t.face, fold: t.fold }}
                >
                  <span className="block h-1.5" style={{ background: t.face }} aria-hidden="true" />
                  <div className="p-4">
                    <div
                      className="text-[13px] font-bold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold"
                      style={{ ...sans, color: t.tone }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                    </div>
                  </div>
                </FoldCard>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({
  query,
  setQuery,
  saved,
  toggleSave,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onOpen: (o: Opdracht) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q) ||
      o.opdrachtgever.toLowerCase().includes(q) ||
      o.plaats.toLowerCase().includes(q) ||
      o.tags.some((t) => t.toLowerCase().includes(q)),
  );
  return (
    <div>
      <ScreenHead
        eyebrow="Marktplaats"
        tone={C.sky}
        title="Opdrachten, netjes gevouwen"
        sub="We tonen eerlijk waarom een opdracht past — en waar het schuurt."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-md px-5 py-3"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.sky }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-55"
          style={{ ...sans, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-md px-3 py-1 text-[11px] font-bold ${RING}`}
            style={{ ...sans, color: C.sky, background: C.skyFace }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <FoldCard
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          tint={{ face: C.skyFace, fold: C.skyFold }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-md"
            style={{ background: C.skyFace, color: C.sky }}
            aria-hidden="true"
          >
            <OrigamiIcon size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[21px] font-extrabold" style={{ ...display, color: C.ink }}>
            Een leeg vel
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <GhostTab onClick={() => setQuery("")} tone={C.sky} face={C.skyFace}>
              Filter wissen
            </GhostTab>
          </div>
        </FoldCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const t =
              o.match >= 90
                ? { tone: C.mint, face: C.mintFace, fold: C.mintFold }
                : o.match >= 82
                  ? { tone: C.sky, face: C.skyFace, fold: C.skyFold }
                  : { tone: C.butter, face: C.butterFace, fold: C.butterFold };
            return (
              <FoldCard
                key={o.id}
                className="group flex h-full flex-col p-6 transition-transform duration-200 hover:-translate-y-0.5"
                tint={{ face: t.face, fold: t.fold }}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchTag value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${RING}`}
                    style={{
                      color: isSaved ? t.tone : C.muted,
                      background: isSaved ? t.face : "transparent",
                      border: `1px solid ${isSaved ? t.tone : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2.4} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <span
                  className="mt-4 text-[9.5px] font-bold uppercase tracking-[0.18em]"
                  style={{ ...sans, color: C.faint }}
                >
                  {o.id}
                </span>
                <h3
                  className="mt-1 text-[17px] font-extrabold leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]"
                  style={{ ...sans, color: C.fgSoft }}
                >
                  {[
                    { Icon: MapPin, v: o.plaats },
                    { Icon: Wallet, v: o.tarief },
                    { Icon: Clock, v: o.uren },
                    { Icon: Calendar, v: o.start },
                  ].map((m, mi) => (
                    <div key={mi} className="flex items-center gap-1.5">
                      <m.Icon
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {m.v}
                    </div>
                  ))}
                </dl>
                <div className="mt-5">
                  <TabButton onClick={() => onOpen(o)} tone={t.tone} className="w-full">
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.4}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </TabButton>
                </div>
              </FoldCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({
  opdracht,
  saved,
  toggleSave,
  onBack,
}: {
  opdracht: Opdracht;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const isSaved = saved.has(opdracht.id);
  return (
    <div>
      <div className="mb-6">
        <GhostTab onClick={onBack} tone={C.sky} face={C.skyFace} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </GhostTab>
      </div>

      <FoldCard className="p-7" tint={{ face: C.lilacFace, fold: C.lilacFold }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <MatchTag value={opdracht.match} />
            <div>
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
                style={{ ...sans, color: C.faint }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...sans, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <GhostTab
            onClick={() => toggleSave(opdracht.id)}
            tone={C.rose}
            face={C.roseFace}
            active={isSaved}
            ariaPressed={isSaved}
            ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2.4} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </GhostTab>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief, tint: C.roseFace },
            { Icon: Clock, label: "Inzet", value: opdracht.uren, tint: C.skyFace },
            { Icon: Calendar, label: "Start", value: opdracht.start, tint: C.mintFace },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats, tint: C.butterFace },
          ].map((m) => (
            <div key={m.label} className="rounded-md p-4" style={{ background: m.tint }}>
              <m.Icon size={15} strokeWidth={2.2} style={{ color: C.ink }} aria-hidden="true" />
              <div
                className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ ...sans, color: C.fgSoft }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-extrabold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </FoldCard>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <FoldCard className="p-6" tint={{ face: C.mintFace, fold: C.mintFold }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: C.mintFace, color: C.mint }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-extrabold" style={{ ...display, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.mint }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </FoldCard>
        <FoldCard className="p-6" tint={{ face: C.butterFace, fold: C.butterFold }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: C.butterFace, color: C.butter }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-extrabold" style={{ ...display, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.butter }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </FoldCard>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <TabButton
          onClick={() => setApplied((v) => !v)}
          tone={applied ? C.mint : C.lilac}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </TabButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
            De opdrachtgever reageert gemiddeld binnen 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie({
  checked,
  toggleCheck,
  feedState,
  setFeedState,
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  return (
    <div>
      <ScreenHead
        eyebrow="Verificatie"
        tone={C.mint}
        title="Documenten, laag voor laag gecheckt"
        sub="Elke status heeft een eigen kleur, label én icoon — nooit alleen kleur."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tone, face } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-md px-4 py-3.5"
              style={{ background: face }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                style={{ background: tone, color: C.paper }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.4} />
              </span>
              <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <FoldCard
        className="mb-7 flex items-center gap-4 p-6"
        tint={{ face: C.mintFace, fold: C.mintFold }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
          style={{ background: C.mintFace, color: C.mint }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2.2} />
        </span>
        <div>
          <div className="text-[15px] font-extrabold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </FoldCard>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tone, face } = statusMeta(c.status);
            return (
              <FoldCard key={c.naam} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${RING}`}
                  style={{
                    borderColor: done ? C.mint : C.line,
                    background: done ? C.mint : "transparent",
                    color: C.paper,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.8} aria-hidden="true" />}
                </button>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{ background: face, color: tone }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </FoldCard>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-extrabold"
              style={{ ...display, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2.2} style={{ color: C.rose }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-md border ${RING}`}
              style={{ background: C.paper, color: C.rose, borderColor: C.line }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3.5 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-md px-3.5 py-1 text-[11px] font-bold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.paper : C.muted,
                  background: feedState === s ? C.rose : "transparent",
                  border: `1px solid ${feedState === s ? C.rose : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <FoldCard key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-md"
                    style={{ background: C.paperDeep }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-md"
                    style={{ background: C.paperDeep }}
                  />
                </FoldCard>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <FoldCard
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              tint={{ face: C.roseFace, fold: C.roseFold }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-md"
                style={{ background: C.roseFace, color: C.rose }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2.2} />
              </span>
              <div className="text-[16px] font-extrabold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <GhostTab onClick={() => setFeedState("ok")} tone={C.rose} face={C.roseFace}>
                  Opnieuw proberen
                </GhostTab>
              </div>
            </FoldCard>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => {
                const { tone, face } = statusMeta(d.status);
                return (
                  <FoldCard key={d.naam} className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold"
                      style={{ ...sans, background: face, color: tone }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-bold"
                        style={{ ...sans, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...sans, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusPill status={d.status} />
                  </FoldCard>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div>
      <ScreenHead eyebrow="Acties" tone={C.butter} title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <FoldCard
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          tint={{ face: C.mintFace, fold: C.mintFold }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-md"
            style={{ background: C.mintFace, color: C.mint }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.4} />
          </span>
          <h3 className="text-[21px] font-extrabold" style={{ ...display, color: C.ink }}>
            Alles opgevouwen
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Alle vellen liggen op hun plek.
          </p>
        </FoldCard>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-md px-4 py-2"
            style={{ background: C.butterFace }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-extrabold tabular-nums"
              style={{ ...sans, background: C.butter, color: C.paper }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-bold" style={{ ...sans, color: C.butter }}>
              {openCount} {openCount === 1 ? "actie" : "acties"} open
            </span>
          </div>

          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const t = isDone
                ? { tone: C.mint, face: C.mintFace, fold: C.mintFold }
                : a.urgentie === "warning"
                  ? { tone: C.rose, face: C.roseFace, fold: C.roseFold }
                  : { tone: C.butter, face: C.butterFace, fold: C.butterFold };
              return (
                <FoldCard
                  key={a.titel}
                  className="overflow-hidden"
                  tint={{ face: t.face, fold: t.fold }}
                >
                  <span className="block h-1.5" style={{ background: t.face }} aria-hidden="true" />
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${RING}`}
                      style={{
                        borderColor: isDone ? C.mint : C.line,
                        background: isDone ? C.mint : "transparent",
                        color: C.paper,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.8} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-bold leading-snug"
                        style={{
                          ...sans,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...sans, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-bold"
                          style={{ ...sans, color: t.tone, background: t.face }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </FoldCard>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusMap = (status: string): { tone: string; face: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.mint, face: C.mintFace, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.rose, face: C.roseFace, Icon: Clock }
        : { tone: C.muted, face: C.paperDeep, Icon: FileText };
  return (
    <div>
      <ScreenHead
        eyebrow="Facturen"
        tone={C.rose}
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.mint },
            { label: "Openstaand", value: "€ 1.350", tone: C.rose },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <FoldCard key={s.label} className="p-5">
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[24px] font-extrabold tabular-nums"
                style={{ ...display, color: s.tone }}
              >
                {s.value}
              </div>
            </FoldCard>
          ))}
        </div>
        <FoldCard className="flex flex-col justify-between p-5">
          <div
            className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.rose} height={48} />
        </FoldCard>
      </div>

      <FoldCard className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...sans, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const sm = statusMap(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.paperDeep)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3.5 text-[12.5px] font-bold tabular-nums"
                      style={{ ...sans, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...sans, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...sans, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[13px] font-bold tabular-nums"
                      style={{ ...sans, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-bold"
                        style={{ ...sans, color: sm.tone, background: sm.face }}
                      >
                        <sm.Icon size={11} strokeWidth={2.6} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
                <td
                  className="px-3 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  Totaal
                </td>
                <td />
                <td />
                <td
                  className="px-3 py-3.5 text-[13px] font-extrabold tabular-nums"
                  style={{ ...sans, color: C.lilac }}
                >
                  € 7.782
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </FoldCard>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept286() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<"ok" | "loading" | "error">("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  const NAV_TINT: Record<ScreenKey, { tone: string; face: string }> = {
    dashboard: { tone: C.lilac, face: C.lilacFace },
    marktplaats: { tone: C.sky, face: C.skyFace },
    opdracht: { tone: C.rose, face: C.roseFace },
    verificatie: { tone: C.mint, face: C.mintFace },
    acties: { tone: C.butter, face: C.butterFace },
    facturen: { tone: C.rose, face: C.roseFace },
    documenten: { tone: C.sky, face: C.skyFace },
    berichten: { tone: C.mint, face: C.mintFace },
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, color: C.fg, background: C.bg, backgroundImage: facetSurface(C.bg, C.bg2) }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-11 w-11 items-center justify-center"
              style={{
                background: C.lilac,
                color: C.paper,
                clipPath: "polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)",
              }}
              aria-hidden="true"
            >
              <OrigamiIcon size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-extrabold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Origami
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.24em]"
                style={{ ...sans, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px] font-semibold"
                style={{ ...sans, color: C.mint }}
              >
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-md text-[13px] font-extrabold"
              style={{ ...display, background: C.mintFace, color: C.mint }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-9 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            const t = NAV_TINT[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-[12.5px] font-bold transition-colors duration-200 ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.paper : C.fgSoft,
                  background: on ? t.tone : "transparent",
                  border: `1px solid ${on ? t.tone : C.line}`,
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "marktplaats" && (
            <Marktplaats
              query={query}
              setQuery={setQuery}
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail
              opdracht={active}
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
              onBack={() => setScreen("marktplaats")}
            />
          )}
          {screen === "verificatie" && (
            <Verificatie
              checked={checked}
              toggleCheck={(naam) => setChecked((s) => toggleSet(s, naam))}
              feedState={feedState}
              setFeedState={setFeedState}
            />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-5 text-[11px]"
          style={{ ...sans, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Plane tone={C.lilac} />
            {SCREENS.length} vellen · origami v286
          </span>
          <span>Gevouwen · pastel · strak</span>
        </footer>
      </div>
    </div>
  );
}
