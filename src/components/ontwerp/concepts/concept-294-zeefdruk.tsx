"use client";

// Concept 294 — "Zeefdruk" · pop-art silkscreen / CMYK-misregistratie (licht).
// Signature: platte, verzadigde inktvlakken met opzettelijke registratie-verschuiving — magenta en
// cyaan die net naast de zwarte sleutellijn valt (zoals een verlopen zeefdruk), grove halftoon-
// rasters, dikke zwarte omtreklijnen en harde offset-slagschaduwen. Poster-gevoel: speels maar
// streng geordend op een 8pt-ritme, contrast strikt bewaakt zodat tekst altijd leesbaar blijft.
// Fonts: --font-lab-anton (vet display-kop) + --font-lab-space (Space Grotesk, tekst) +
// --font-lab-mono (cijfer- en codelabels).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
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
  Hourglass,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ShieldCheck,
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

// Zeefdruk-palet: gebroken-wit papier, diepzwarte inkt en drie proceskleuren (CMY).
const C = {
  paper: "#f6f2e9",
  paperDeep: "#efe8d8",
  ink: "#17140f",
  fg: "#241f16",
  fgSoft: "#5c554a",
  muted: "#8a8272",
  magenta: "#e5266d",
  cyan: "#1aa6c4",
  yellow: "#f4c518",
  paperWhite: "#fffdf7",
};

const display = { fontFamily: "var(--font-lab-anton), Impact, sans-serif" };
const body = { fontFamily: "var(--font-lab-space), 'Space Grotesk', sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17140f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f2e9]";

const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

// ---- Primitives -------------------------------------------------------------

// Halftoon-raster: grove drukpuntjes als vlak-vulling. Puur decoratief.
function Halftone({
  color,
  size = 7,
  className,
  style,
  opacity = 1,
}: {
  color: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `radial-gradient(${color} 34%, transparent 36%)`,
        backgroundSize: `${size}px ${size}px`,
        opacity,
        ...style,
      }}
    />
  );
}

// Misregistratie-kop: dezelfde tekst in magenta + cyaan, licht verschoven achter de zwarte
// sleutellaag. De ghost-lagen zijn aria-hidden; de zwarte laag bovenop blijft leidend & leesbaar.
function MisReg({
  children,
  className,
  style,
  ink = C.ink,
}: {
  children: string;
  className?: string;
  style?: CSSProperties;
  ink?: string;
}) {
  return (
    <span className={`relative inline-block ${className ?? ""}`} style={{ ...display, ...style }}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{ color: C.magenta, transform: "translate(-2.5px, 2px)" }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{ color: C.cyan, transform: "translate(2px, -1.5px)" }}
      >
        {children}
      </span>
      <span className="relative" style={{ color: ink }}>
        {children}
      </span>
    </span>
  );
}

// Mono kicker-label — de bijschrift-stem.
function Kicker({ children, color = C.muted }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...mono, color }}
    >
      {children}
    </span>
  );
}

type StatusVisual = { label: string; Icon: LucideIcon; fill: string; text: string };

function statusVisual(s: CredStatus): StatusVisual {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fill: C.cyan, text: C.ink };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, fill: C.paperWhite, text: C.ink };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fill: C.yellow, text: C.ink };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fill: C.magenta, text: C.paperWhite };
  }
}

// Statusbadge: platte inktvlak + dikke zwarte omtrek, altijd label + icoon (nooit kleur-alleen).
function StatusChip({ status, big = false }: { status: CredStatus; big?: boolean }) {
  const { label, Icon, fill, text } = statusVisual(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.04em] ${
        big ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]"
      }`}
      style={{
        ...body,
        color: text,
        background: fill,
        border: `2px solid ${C.ink}`,
        boxShadow: `2px 2px 0 ${C.ink}`,
      }}
    >
      <Icon size={big ? 14 : 12} strokeWidth={2.6} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchBadge({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  return (
    <span
      className="inline-flex items-center gap-2"
      aria-label={`Match ${value} procent`}
      style={{
        background: high ? C.magenta : C.yellow,
        border: `2.5px solid ${C.ink}`,
        boxShadow: `3px 3px 0 ${C.ink}`,
      }}
    >
      <span
        className={`px-2.5 leading-none ${size === "sm" ? "py-1.5 text-[22px]" : "py-2 text-[30px]"}`}
        style={{ ...display, color: high ? C.paperWhite : C.ink }}
      >
        {value}
      </span>
      <span
        className="self-stretch border-l-2 px-2 py-1 text-[8px] font-bold uppercase leading-tight tracking-[0.14em]"
        style={{
          ...mono,
          borderColor: C.ink,
          color: high ? C.paperWhite : C.ink,
          display: "flex",
          alignItems: "center",
        }}
      >
        %<br />
        match
      </span>
    </span>
  );
}

// Poster-staafgrafiek: platte gekleurde staafjes met zwarte omtrek.
function PosterBars({
  data,
  color,
  height = 34,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden="true">
      {data.map((v, i) => {
        const h = Math.max(12, (v / max) * 100);
        const last = i === data.length - 1;
        return (
          <div
            key={i}
            className="flex-1"
            style={{
              height: `${h}%`,
              background: last ? color : C.ink,
              border: `1.5px solid ${C.ink}`,
            }}
          />
        );
      })}
    </div>
  );
}

// Zwart poster-primair — harde offset-schaduw, verschuift bij hover (indruk-effect).
function InkButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
  tone = "ink",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  tone?: "ink" | "magenta" | "cyan";
}) {
  const [hot, setHot] = useState(false);
  const bg = tone === "magenta" ? C.magenta : tone === "cyan" ? C.cyan : C.ink;
  const fg = tone === "cyan" ? C.ink : C.paperWhite;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all duration-100 ${RING} ${className ?? ""}`}
      style={{
        ...body,
        color: fg,
        background: bg,
        border: `2.5px solid ${C.ink}`,
        boxShadow: hot ? `1px 1px 0 ${C.ink}` : `4px 4px 0 ${C.ink}`,
        transform: hot ? "translate(3px, 3px)" : "translate(0, 0)",
      }}
    >
      {children}
    </button>
  );
}

// Outline secundair — papier met zwarte omtrek, vult inkt bij hover/actief.
function GhostButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors duration-100 ${RING} ${className ?? ""}`}
      style={{
        ...body,
        color: on ? C.paperWhite : C.ink,
        background: on ? C.ink : C.paperWhite,
        border: `2.5px solid ${C.ink}`,
        boxShadow: `2px 2px 0 ${C.ink}`,
      }}
    >
      {children}
    </button>
  );
}

// Poster-kaart: papiervlak met dikke omtrek + harde slagschaduw.
function Poster({
  children,
  className,
  style,
  bg = C.paperWhite,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bg?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: bg,
        border: `2.5px solid ${C.ink}`,
        boxShadow: `5px 5px 0 ${C.ink}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ScreenHead({
  screenKey,
  title,
  sub,
}: {
  screenKey: ScreenKey;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center gap-3">
        <span
          className="inline-flex h-7 items-center px-2 text-[12px] font-bold tabular-nums"
          style={{ ...mono, color: C.paperWhite, background: C.ink }}
        >
          {SCREEN_INDEX[screenKey]}
        </span>
        <Kicker color={C.magenta}>ZZP-werkbank</Kicker>
      </div>
      <h1 className="text-[34px] leading-[0.94] sm:text-[46px]">
        <MisReg>{title}</MisReg>
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[14px] leading-relaxed"
          style={{ ...body, color: C.fgSoft }}
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
  const voornaam = PROFIEL.naam.split(" ")[0] ?? PROFIEL.naam;
  const tints = [C.magenta, C.cyan, C.yellow, C.magenta];
  return (
    <div>
      {/* Hero-poster */}
      <Poster className="relative mb-10 overflow-hidden" bg={C.paperWhite}>
        <Halftone color={C.magenta} className="absolute inset-0" opacity={0.14} />
        <div className="relative grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-[1.4fr,1fr] md:items-center">
          <div>
            <Kicker color={C.cyan}>
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Kicker>
            <h1 className="mt-3 text-[42px] leading-[0.9] sm:text-[60px]">
              <MisReg>Hallo,</MisReg>
              <br />
              <MisReg>{`${voornaam}.`}</MisReg>
            </h1>
            <p
              className="mt-5 max-w-md text-[14px] leading-relaxed"
              style={{ ...body, color: C.fgSoft }}
            >
              Eén werkbank, felle vlakken, geen ruis. Alleen wat telt — en wat nu jouw aandacht
              vraagt — staat vooraan gedrukt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <InkButton tone="magenta" onClick={() => onOpen(top)}>
                <Sparkles size={15} strokeWidth={2.6} aria-hidden="true" />
                Beste match openen
              </InkButton>
              <div
                className="inline-flex items-center gap-2 px-3 py-2"
                style={{
                  background: C.cyan,
                  border: `2.5px solid ${C.ink}`,
                  boxShadow: `3px 3px 0 ${C.ink}`,
                }}
              >
                <ShieldCheck
                  size={15}
                  strokeWidth={2.6}
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
                <span
                  className="text-[12px] font-bold uppercase tracking-[0.04em]"
                  style={{ ...body, color: C.ink }}
                >
                  {PROFIEL.trust}
                </span>
              </div>
            </div>
          </div>
          <div className="relative">
            <Poster bg={C.yellow} className="p-5">
              <Kicker>Vandaag</Kicker>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { n: "7", l: "reacties" },
                  { n: "3", l: "matches" },
                  { n: "2", l: "open fact." },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="py-2"
                    style={{ background: C.paperWhite, border: `2px solid ${C.ink}` }}
                  >
                    <div className="text-[26px] leading-none" style={{ ...display, color: C.ink }}>
                      {s.n}
                    </div>
                    <div
                      className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em]"
                      style={{ ...mono, color: C.fgSoft }}
                    >
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </Poster>
          </div>
        </div>
      </Poster>

      {/* KPI-strook */}
      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Poster key={k.label} className="p-4" bg={C.paperWhite}>
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[9px] font-bold tabular-nums"
                style={{ ...mono, color: C.muted }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.ink : C.paperWhite,
                  background: k.up ? C.yellow : C.magenta,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div className="mt-3 text-[30px] leading-none" style={{ ...display, color: C.ink }}>
              {k.value}
            </div>
            <div className="mt-2 text-[11px] font-semibold" style={{ ...body, color: C.fgSoft }}>
              {k.label}
            </div>
            <div className="mt-3">
              <PosterBars data={k.spark} color={tints[i % tints.length] as string} />
            </div>
          </Poster>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Beste match */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <Kicker color={C.magenta}>Beste match</Kicker>
            <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
              {top.id}
            </span>
          </div>
          <Poster bg={C.paperWhite} className="relative overflow-hidden">
            <Halftone color={C.cyan} className="absolute right-0 top-0 h-24 w-24" opacity={0.18} />
            <button
              onClick={() => onOpen(top)}
              className={`group relative block w-full p-5 text-left transition-colors ${RING}`}
            >
              <span className="flex items-start justify-between gap-4">
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[22px] leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {top.titel}
                  </span>
                  <span
                    className="mt-1.5 block text-[13px] font-semibold"
                    style={{ ...body, color: C.fgSoft }}
                  >
                    {top.opdrachtgever} · {top.plaats} · {top.tarief}
                  </span>
                  <span className="mt-4 flex flex-wrap gap-2">
                    {top.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          ...body,
                          color: C.ink,
                          background: C.paperDeep,
                          border: `2px solid ${C.ink}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-3">
                  <MatchBadge value={top.match} />
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center transition-transform duration-100 group-hover:translate-x-1"
                    style={{ background: C.magenta, border: `2.5px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <ArrowRight size={18} strokeWidth={2.8} style={{ color: C.paperWhite }} />
                  </span>
                </span>
              </span>
            </button>
          </Poster>

          <Poster bg={C.cyan} className="mt-5 flex items-start gap-4 p-5">
            <span
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center"
              style={{ background: C.paperWhite, border: `2.5px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <BadgeCheck size={18} strokeWidth={2.6} style={{ color: C.ink }} />
            </span>
            <div>
              <div className="text-[15px] font-bold" style={{ ...body, color: C.ink }}>
                {PROFIEL.trust}
              </div>
              <p
                className="mt-1 text-[13px] font-medium leading-relaxed"
                style={{ ...body, color: C.ink }}
              >
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat je te vertrouwen
                bent.
              </p>
            </div>
          </Poster>
        </div>

        {/* Acties */}
        <div>
          <div className="mb-3">
            <Kicker color={C.magenta}>Vraagt aandacht</Kicker>
          </div>
          <Poster bg={C.paperWhite} className="p-2">
            <ul>
              {ACTIES.map((a, i) => {
                const warn = a.urgentie === "warning";
                return (
                  <li
                    key={a.titel}
                    className="flex items-start gap-3 p-3"
                    style={{
                      borderBottom: i < ACTIES.length - 1 ? `2px dashed ${C.paperDeep}` : "none",
                    }}
                  >
                    <span
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        color: warn ? C.paperWhite : C.ink,
                        background: warn ? C.magenta : C.yellow,
                        border: `2px solid ${C.ink}`,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[13px] font-bold leading-snug"
                        style={{ ...body, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.04em]"
                        style={{ ...body, color: warn ? C.magenta : C.cyan }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.8} aria-hidden="true" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Poster>
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
  const tints = [C.magenta, C.cyan, C.yellow];
  return (
    <div>
      <ScreenHead
        screenKey="marktplaats"
        title="Marktplaats"
        sub="Eerlijk gedrukt: waarom een opdracht past — en waar het schuurt. Geen verborgen kleine lettertjes."
      />

      <Poster bg={C.paperWhite} className="mb-8 flex items-center gap-3 px-4 py-3">
        <Search
          size={17}
          strokeWidth={2.6}
          className="shrink-0"
          style={{ color: C.ink }}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] font-semibold outline-none placeholder:opacity-50"
          style={{ ...body, color: C.ink }}
        />
        <span
          className="px-2 py-0.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, color: C.ink, background: C.yellow, border: `2px solid ${C.ink}` }}
        >
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...body, color: C.magenta }}
          >
            Wis
          </button>
        )}
      </Poster>

      {filtered.length === 0 ? (
        <Poster
          bg={C.paperWhite}
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
        >
          <span
            className="inline-flex h-14 w-14 items-center justify-center"
            style={{ background: C.yellow, border: `2.5px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={2.4} style={{ color: C.ink }} />
          </span>
          <h3 className="text-[24px]" style={{ ...display, color: C.ink }}>
            Niets gevonden
          </h3>
          <p className="max-w-xs text-[13px] font-medium" style={{ ...body, color: C.fgSoft }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm of wis het filter.
          </p>
          <div className="mt-1">
            <GhostButton onClick={() => setQuery("")}>Filter wissen</GhostButton>
          </div>
        </Poster>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            const tint = tints[i % tints.length] as string;
            return (
              <Poster key={o.id} bg={C.paperWhite} className="group relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full w-2"
                  style={{ background: tint, borderRight: `2px solid ${C.ink}` }}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-1 gap-4 p-5 pl-6 sm:grid-cols-[1fr,auto] sm:items-start">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                        style={{ ...mono, color: C.paperWhite, background: C.ink }}
                      >
                        {o.id}
                      </span>
                    </div>
                    <h3 className="text-[21px] leading-tight" style={{ ...display, color: C.ink }}>
                      {o.titel}
                    </h3>
                    <div
                      className="mt-1 text-[13px] font-semibold"
                      style={{ ...body, color: C.fgSoft }}
                    >
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-semibold"
                      style={{ ...body, color: C.fg }}
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
                            strokeWidth={2.6}
                            style={{ color: C.muted }}
                            aria-hidden="true"
                          />
                          {m.v}
                        </div>
                      ))}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-[10.5px] font-bold"
                          style={{
                            ...body,
                            color: C.ink,
                            background: C.paperDeep,
                            border: `1.5px solid ${C.ink}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <MatchBadge value={o.match} size="sm" />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                        style={{
                          color: isSaved ? C.paperWhite : C.ink,
                          background: isSaved ? C.ink : C.paperWhite,
                          border: `2.5px solid ${C.ink}`,
                          boxShadow: `2px 2px 0 ${C.ink}`,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={16} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <Bookmark size={16} strokeWidth={2.6} aria-hidden="true" />
                        )}
                      </button>
                      <InkButton onClick={() => onOpen(o)}>
                        Bekijk
                        <ArrowRight size={14} strokeWidth={2.8} aria-hidden="true" />
                      </InkButton>
                    </div>
                  </div>
                </div>
              </Poster>
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
        <GhostButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.8} aria-hidden="true" />
          Terug
        </GhostButton>
      </div>

      <Poster bg={C.paperWhite} className="relative mb-6 overflow-hidden p-6 sm:p-7">
        <Halftone color={C.yellow} className="absolute right-0 top-0 h-28 w-28" opacity={0.22} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <span
              className="inline-block px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
              style={{ ...mono, color: C.paperWhite, background: C.ink }}
            >
              {opdracht.id}
            </span>
            <h2 className="mt-3 text-[30px] leading-[0.96] sm:text-[40px]">
              <MisReg>{opdracht.titel}</MisReg>
            </h2>
            <div className="mt-3 text-[14px] font-semibold" style={{ ...body, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <MatchBadge value={opdracht.match} />
            <GhostButton
              onClick={() => toggleSave(opdracht.id)}
              active={isSaved}
              ariaPressed={isSaved}
              ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2.8} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2.8} aria-hidden="true" />
              )}
              {isSaved ? "Bewaard" : "Bewaar"}
            </GhostButton>
          </div>
        </div>
      </Poster>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief, tint: C.yellow },
          { Icon: Clock, label: "Inzet", value: opdracht.uren, tint: C.cyan },
          { Icon: Calendar, label: "Start", value: opdracht.start, tint: C.magenta },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats, tint: C.yellow },
        ].map((m) => (
          <Poster key={m.label} bg={C.paperWhite} className="p-4">
            <span
              className="inline-flex h-8 w-8 items-center justify-center"
              style={{ background: m.tint, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <m.Icon size={15} strokeWidth={2.6} style={{ color: C.ink }} />
            </span>
            <div
              className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.label}
            </div>
            <div className="mt-0.5 text-[15px] font-bold" style={{ ...body, color: C.ink }}>
              {m.value}
            </div>
          </Poster>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Poster bg={C.paperWhite} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center"
              style={{ background: C.cyan, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <Check size={14} strokeWidth={3} style={{ color: C.ink }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...body, color: C.ink }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 p-2.5 text-[13.5px] font-medium"
                style={{
                  ...body,
                  color: C.fg,
                  background: C.paperDeep,
                  border: `2px solid ${C.ink}`,
                }}
              >
                <Check
                  size={16}
                  strokeWidth={3}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.cyan }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Poster>
        <Poster bg={C.paperWhite} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center"
              style={{ background: C.magenta, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <TriangleAlert size={13} strokeWidth={2.8} style={{ color: C.paperWhite }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...body, color: C.ink }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 p-2.5 text-[13.5px] font-medium"
                style={{
                  ...body,
                  color: C.fg,
                  background: C.paperDeep,
                  border: `2px solid ${C.ink}`,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.magenta }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Poster>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <InkButton
          tone={applied ? "cyan" : "magenta"}
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={3} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </InkButton>
        {applied && (
          <span className="text-[12.5px] font-semibold" style={{ ...body, color: C.fgSoft }}>
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
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
}) {
  return (
    <div>
      <ScreenHead
        screenKey="verificatie"
        title="Verificatie"
        sub="Elke status krijgt een eigen inktvlak, label én icoon — nooit alleen kleur. Zo lees je in één oogopslag wat klopt."
      />

      {/* Legenda alle 4 statussen */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => (
          <StatusChip key={s} status={s} big />
        ))}
      </div>

      <Poster bg={C.cyan} className="mb-8 flex items-start gap-4 p-5">
        <span
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center"
          style={{ background: C.paperWhite, border: `2.5px solid ${C.ink}` }}
          aria-hidden="true"
        >
          <ShieldCheck size={18} strokeWidth={2.6} style={{ color: C.ink }} />
        </span>
        <div>
          <div className="text-[15px] font-bold" style={{ ...body, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p
            className="mt-1 text-[13px] font-medium leading-relaxed"
            style={{ ...body, color: C.ink }}
          >
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Poster>

      <div className="mb-3">
        <Kicker color={C.magenta}>Certificaten</Kicker>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {CREDENTIALS.map((c, i) => {
          const done = checked.has(c.naam);
          return (
            <Poster key={c.naam} bg={C.paperWhite} className="flex items-center gap-4 p-4">
              <button
                onClick={() => toggleCheck(c.naam)}
                aria-pressed={done}
                aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                style={{
                  border: `2.5px solid ${C.ink}`,
                  background: done ? C.cyan : C.paperWhite,
                  color: C.ink,
                }}
              >
                {done && <Check size={16} strokeWidth={3} aria-hidden="true" />}
              </button>
              <span
                className="hidden text-[13px] font-bold tabular-nums sm:inline"
                style={{ ...mono, color: C.muted }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[15px] font-bold leading-tight"
                  style={{ ...body, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div
                  className="mt-0.5 text-[12px] font-medium"
                  style={{ ...body, color: C.fgSoft }}
                >
                  {c.detail}
                </div>
              </div>
              <StatusChip status={c.status} />
            </Poster>
          );
        })}
      </div>
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div>
      <ScreenHead
        screenKey="acties"
        title="Acties"
        sub="Wat vandaag om aandacht vraagt — vers van de pers, op volgorde van urgentie."
      />

      {openCount === 0 ? (
        <Poster
          bg={C.paperWhite}
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
        >
          <span
            className="inline-flex h-14 w-14 items-center justify-center"
            style={{ background: C.cyan, border: `2.5px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={3} style={{ color: C.ink }} />
          </span>
          <h3 className="text-[24px]" style={{ ...display, color: C.ink }}>
            Alles afgedrukt
          </h3>
          <p className="max-w-xs text-[13px] font-medium" style={{ ...body, color: C.fgSoft }}>
            Niets meer te doen vandaag. Het vel is schoon.
          </p>
        </Poster>
      ) : (
        <>
          <div className="mb-6 inline-flex items-center gap-3">
            <span
              className="inline-flex h-14 items-center px-4 text-[38px] leading-none"
              style={{
                ...display,
                color: C.paperWhite,
                background: C.magenta,
                border: `2.5px solid ${C.ink}`,
                boxShadow: `4px 4px 0 ${C.ink}`,
              }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Poster key={a.titel} bg={C.paperWhite} className="flex items-start gap-4 p-4">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `2.5px solid ${C.ink}`,
                      background: isDone ? C.ink : C.paperWhite,
                      color: C.paperWhite,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center text-[12px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.paperWhite : warn ? C.paperWhite : C.ink,
                      background: isDone ? C.muted : warn ? C.magenta : C.yellow,
                      border: `2px solid ${C.ink}`,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-bold leading-snug"
                      style={{
                        ...body,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.5 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px] font-medium"
                      style={{ ...body, color: C.fgSoft, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.04em]"
                        style={{ ...body, color: warn ? C.magenta : C.cyan }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.8} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Poster>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusTint = (status: string): { bg: string; fg: string } => {
    if (status === "Betaald") return { bg: C.cyan, fg: C.ink };
    if (status === "Openstaand") return { bg: C.magenta, fg: C.paperWhite };
    return { bg: C.paperWhite, fg: C.ink };
  };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je altijd weet waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", tint: C.cyan, fg: C.ink },
          { label: "Openstaand", value: "€ 1.350", tint: C.magenta, fg: C.paperWhite },
          { label: "Concept", value: "€ 880", tint: C.yellow, fg: C.ink },
        ].map((s) => (
          <Poster key={s.label} bg={s.tint} className="p-4">
            <div
              className="text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: s.fg }}
            >
              {s.label}
            </div>
            <div className="mt-2 text-[28px] leading-none" style={{ ...display, color: s.fg }}>
              {s.value}
            </div>
          </Poster>
        ))}
        <Poster bg={C.paperWhite} className="flex flex-col justify-between p-4">
          <div
            className="text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.muted }}
          >
            Per factuur
          </div>
          <PosterBars data={trend} color={C.magenta} height={40} />
        </Poster>
      </div>

      <Poster bg={C.paperWhite} className="overflow-x-auto p-2">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ background: C.ink }}>
              {["Nr.", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.paperWhite, textAlign: i >= 3 ? "right" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const st = statusTint(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors"
                  style={{ borderBottom: `2px dashed ${C.paperDeep}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.paperDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-3 py-3.5 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td
                    className="px-3 py-3.5 text-[13px] font-semibold"
                    style={{ ...body, color: C.ink }}
                  >
                    {f.klant}
                  </td>
                  <td
                    className="px-3 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-3 py-3.5 text-right text-[14px] leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
                      style={{
                        ...body,
                        color: st.fg,
                        background: st.bg,
                        border: `2px solid ${C.ink}`,
                      }}
                    >
                      {f.status === "Betaald" ? (
                        <Check size={11} strokeWidth={3} aria-hidden="true" />
                      ) : f.status === "Openstaand" ? (
                        <Clock size={11} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Hourglass size={11} strokeWidth={2.8} aria-hidden="true" />
                      )}
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: C.yellow }}>
              <td
                className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.ink }}
                colSpan={3}
              >
                Totaal
              </td>
              <td
                className="px-3 py-3 text-right text-[16px] leading-none"
                style={{ ...display, color: C.ink }}
              >
                € 7.782
              </td>
              <td className="px-3 py-3" />
            </tr>
          </tbody>
        </table>
      </Poster>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept294() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, color: C.fg, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-11 w-11 items-center justify-center overflow-hidden"
              style={{
                background: C.yellow,
                border: `2.5px solid ${C.ink}`,
                boxShadow: `3px 3px 0 ${C.ink}`,
              }}
              aria-hidden="true"
            >
              <span className="text-[20px] leading-none" style={{ ...display, color: C.ink }}>
                Z
              </span>
            </span>
            <div className="leading-tight">
              <div className="text-[18px]" style={{ ...display, color: C.ink }}>
                Zeefdruk
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-bold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px] font-semibold"
                style={{ ...body, color: C.fgSoft }}
              >
                <BadgeCheck size={12} strokeWidth={2.6} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[12px] font-bold"
              style={{
                ...body,
                color: C.paperWhite,
                background: C.magenta,
                border: `2.5px solid ${C.ink}`,
                boxShadow: `3px 3px 0 ${C.ink}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-9 flex flex-wrap gap-2 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-all duration-100 ${RING}`}
                style={{
                  ...body,
                  color: on ? C.paperWhite : C.ink,
                  background: on ? C.ink : C.paperWhite,
                  border: `2.5px solid ${C.ink}`,
                  boxShadow: on ? `1px 1px 0 ${C.ink}` : `3px 3px 0 ${C.ink}`,
                  transform: on ? "translate(2px, 2px)" : "translate(0,0)",
                }}
              >
                <span
                  className="text-[9px] font-bold tabular-nums"
                  style={{ ...mono, color: on ? C.yellow : C.magenta }}
                >
                  {SCREEN_INDEX[s.key]}
                </span>
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
            />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted, borderTop: `2px solid ${C.ink}` }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex gap-0.5" aria-hidden="true">
              <span
                className="h-2.5 w-2.5"
                style={{ background: C.magenta, border: `1px solid ${C.ink}` }}
              />
              <span
                className="h-2.5 w-2.5"
                style={{ background: C.cyan, border: `1px solid ${C.ink}` }}
              />
              <span
                className="h-2.5 w-2.5"
                style={{ background: C.yellow, border: `1px solid ${C.ink}` }}
              />
            </span>
            {SCREENS.length} schermen · zeefdruk v294
          </span>
          <span className="font-bold uppercase tracking-[0.14em]">
            CMYK · misregistratie · poster
          </span>
        </footer>
      </div>
    </div>
  );
}
