"use client";

// Concept 297 — "Aquaduct" · Romeinse ingenieurskunst / travertijn-arcades (warm steen, light).
// Signature: warm travertijn/kalksteen palet (#efe7d6 achtergrond, steen #e4d8c0, inkt #33291c),
// rondboog-arcade-motieven (via SVG-bogen + CSS border-radius), gebeitelde kapitaal-typografie en
// één terracotta accent (#b5532e). Solide, klassiek, betrouwbaar — kolom-arcades als layout-principe,
// rustige monumentale ritmes. Fonts: kop --font-lab-cormorant (klassiek), tekst --font-lab-franklin,
// cijfers --font-lab-mono.

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
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Landmark,
  Columns3,
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

// Travertine palette — warm limestone, chiselled ink, one terracotta accent.
const C = {
  bg: "#efe7d6",
  bgSoft: "#e9dfca",
  stone: "#e4d8c0",
  stoneSoft: "#ece3d1",
  card: "#f6f0e2",
  cardWarm: "#f1e9d7",
  line: "#d8c9aa",
  lineSoft: "#e2d5ba",
  ink: "#33291c",
  fg: "#463a28",
  fgSoft: "#6f6047",
  muted: "#948263",
  faint: "#b3a483",
  terra: "#b5532e",
  terraDim: "#8f3f22",
  terraSoft: "#eddac9",
  gold: "#9c7a2f",
  moss: "#5f6b3a",
  clay: "#a85a3c",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-franklin), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5532e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe7d6]";

const SCREEN_META: Record<ScreenKey, { num: string; latijn: string }> = {
  dashboard: { num: "I", latijn: "FORUM" },
  marktplaats: { num: "II", latijn: "MERCATUS" },
  opdracht: { num: "III", latijn: "OPUS" },
  verificatie: { num: "IV", latijn: "FIDES" },
  acties: { num: "V", latijn: "AGENDA" },
  facturen: { num: "VI", latijn: "RATIO" },
  documenten: { num: "VII", latijn: "TABULARIUM" },
  berichten: { num: "VIII", latijn: "NUNTIUS" },
};

// ---- Arcade motif ----------------------------------------------------------
// A repeating round-arch colonnade drawn as SVG — the load-bearing decorative rhythm.

function Arcade({
  arches = 6,
  color = C.line,
  height = 120,
  className,
  opacity = 1,
}: {
  arches?: number;
  color?: string;
  height?: number;
  className?: string;
  opacity?: number;
}) {
  const span = 100 / arches;
  const pierW = span * 0.22;
  const arch: string[] = [];
  for (let i = 0; i < arches; i++) {
    const x0 = i * span + pierW / 2;
    const x1 = (i + 1) * span - pierW / 2;
    const r = (x1 - x0) / 2;
    // Pier up, semicircular arch, pier down.
    arch.push(
      `M ${x0.toFixed(2)} 100 L ${x0.toFixed(2)} ${(60 - r * 0.9).toFixed(2)} A ${r.toFixed(2)} ${(r * 0.9).toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${(60 - r * 0.9).toFixed(2)} L ${x1.toFixed(2)} 100`,
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height, width: "100%", opacity }}
      aria-hidden="true"
    >
      {arch.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={0.7}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <line
        x1="0"
        y1="100"
        x2="100"
        y2="100"
        stroke={color}
        strokeWidth={0.9}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Travertine grain — a faint speckled stone texture via layered radial gradients.
function StoneTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, rgba(180,160,120,0.10) 0 1px, transparent 2px),
          radial-gradient(circle at 70% 60%, rgba(160,140,100,0.08) 0 1px, transparent 2px),
          radial-gradient(circle at 45% 80%, rgba(190,170,130,0.09) 0 1px, transparent 2px)`,
        backgroundSize: "90px 90px, 130px 130px, 70px 70px",
      }}
    />
  );
}

// ---- Status ----------------------------------------------------------------

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.moss };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.gold };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.clay };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.terraDim };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        ...body,
        color,
        background: `${color}16`,
        border: `1px solid ${color}44`,
        borderRadius: 999,
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// A carved match seal — number set inside a small arch.
function MatchSeal({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  const col = high ? C.terra : value >= 85 ? C.clay : C.gold;
  const w = size === "sm" ? 52 : 66;
  return (
    <span
      className="relative inline-flex shrink-0 flex-col items-center justify-end"
      style={{ width: w, height: w * 0.92, ...mono }}
      aria-label={`Match ${value} procent`}
    >
      <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M8 90 L8 46 A42 42 0 0 1 92 46 L92 90 Z"
          fill={`${col}12`}
          stroke={col}
          strokeWidth={2}
        />
      </svg>
      <span
        className={`relative font-semibold tabular-nums leading-none ${size === "sm" ? "text-[18px]" : "text-[23px]"}`}
        style={{ color: col }}
      >
        {value}
      </span>
      <span
        className="relative mb-1.5 mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: col }}
      >
        match
      </span>
    </span>
  );
}

// ---- Buttons ---------------------------------------------------------------

function PrimaryButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 hover:brightness-105 active:scale-[0.98] ${RING} ${className ?? ""}`}
      style={{
        ...body,
        color: C.bg,
        background: C.terra,
        borderRadius: 999,
        boxShadow: `0 6px 16px -8px ${C.terraDim}`,
      }}
    >
      {children}
    </button>
  );
}

function StoneButton({
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
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...body,
        color: active ? C.terra : C.fg,
        background: active ? C.terraSoft : C.card,
        border: `1px solid ${active ? `${C.terra}66` : C.line}`,
        borderRadius: 999,
      }}
    >
      {children}
    </button>
  );
}

// A stone block — card with an arched crown along the top edge.
function Block({
  children,
  className,
  arched = false,
  warm = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  arched?: boolean;
  warm?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        background: warm ? C.cardWarm : C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset",
        ...style,
      }}
    >
      {arched && (
        <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
          <Arcade arches={7} color={C.lineSoft} height={40} opacity={0.7} />
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Kicker({ children, color = C.muted }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color }}
    >
      {children}
    </span>
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
  const m = SCREEN_META[screenKey];
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 min-w-9 items-center justify-center rounded-t-full px-2 text-[13px] font-semibold tabular-nums"
          style={{
            ...mono,
            color: C.terra,
            background: C.terraSoft,
            border: `1px solid ${C.terra}44`,
            borderBottom: "none",
          }}
        >
          {m.num}
        </span>
        <Kicker color={C.terraDim}>{m.latijn}</Kicker>
        <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="mt-4 text-[34px] font-semibold leading-[1.0] tracking-[-0.01em] sm:text-[44px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[14px] leading-relaxed"
          style={{ ...body, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div className="space-y-8">
      {/* Hero — a monumental arcade crowns the greeting. */}
      <Block warm className="px-6 py-8 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
          <Arcade arches={9} color={C.line} height={64} opacity={0.55} />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Landmark size={14} style={{ color: C.terra }} aria-hidden="true" />
              <Kicker color={C.terraDim}>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[38px] font-semibold leading-[0.98] tracking-[-0.01em] sm:text-[54px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen, {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...body, color: C.fgSoft }}
            >
              Gebouwd om te blijven staan. Alleen wat draagt — je beste match, je cijfers en wat
              vandaag onderhoud vraagt.
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 px-4 py-2.5"
            style={{ background: C.terraSoft, border: `1px solid ${C.terra}44`, borderRadius: 999 }}
          >
            <BadgeCheck size={16} strokeWidth={2.2} style={{ color: C.terra }} aria-hidden="true" />
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...body, color: C.terraDim }}
            >
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Block>

      {/* KPI colonnade — four piers under one entablature. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Block key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-medium tabular-nums"
                style={{ ...mono, color: C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.moss : C.clay,
                  background: k.up ? `${C.moss}18` : `${C.clay}18`,
                  borderRadius: 999,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[27px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-1 text-[11px]" style={{ ...body, color: C.fgSoft }}>
              {k.label}
            </div>
            <div className="mt-3 opacity-80">
              <Arcade arches={k.spark.length - 1} color={C.line} height={26} />
            </div>
          </Block>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Kicker>Beste match</Kicker>
            <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
              {top.id}
            </span>
          </div>
          <Block warm className="p-0">
            <button
              onClick={() => onOpen(top)}
              className={`group block w-full p-6 text-left transition-colors hover:bg-black/[0.015] ${RING}`}
              style={{ borderRadius: 18 }}
            >
              <span className="flex items-start justify-between gap-5">
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[24px] font-semibold leading-tight tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {top.titel}
                  </span>
                  <span className="mt-1 block text-[13px]" style={{ ...body, color: C.fgSoft }}>
                    {top.opdrachtgever} · {top.plaats} · {top.tarief}
                  </span>
                  <span className="mt-4 flex flex-wrap gap-1.5">
                    {top.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 text-[11px] font-medium"
                        style={{
                          ...body,
                          color: C.fgSoft,
                          background: C.stone,
                          border: `1px solid ${C.line}`,
                          borderRadius: 999,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-3">
                  <MatchSeal value={top.match} />
                  <ArrowRight
                    size={20}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: C.terra }}
                    aria-hidden="true"
                  />
                </span>
              </span>
            </button>
          </Block>

          <Block className="flex items-start gap-4 p-5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.terraSoft, border: `1px solid ${C.terra}44` }}
              aria-hidden="true"
            >
              <Landmark size={18} strokeWidth={2} style={{ color: C.terra }} />
            </span>
            <div>
              <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.trust}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...body, color: C.fgSoft }}>
                Je documenten zijn geverifieerd en staan als in steen — opdrachtgevers zien direct
                dat je betrouwbaar bent.
              </p>
            </div>
          </Block>
        </div>

        <div className="space-y-4">
          <Kicker>Vraagt onderhoud</Kicker>
          <Block className="p-2">
            <ul>
              {ACTIES.map((a, i) => {
                const warn = a.urgentie === "warning";
                const col = warn ? C.clay : C.terra;
                return (
                  <li
                    key={a.titel}
                    className="px-3 py-3.5"
                    style={{
                      borderBottom: i < ACTIES.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${col}16`, border: `1px solid ${col}44` }}
                        aria-hidden="true"
                      >
                        {warn ? (
                          <TriangleAlert size={12} strokeWidth={2.2} style={{ color: col }} />
                        ) : (
                          <ArrowRight size={12} strokeWidth={2.4} style={{ color: col }} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13px] font-semibold leading-snug"
                          style={{ ...body, color: C.ink }}
                        >
                          {a.titel}
                        </div>
                        <div
                          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ ...body, color: col }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Block>
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
        screenKey="marktplaats"
        title="Mercatus"
        sub="De markt in arcaden geordend: waarom een opdracht draagt — en waar een scheur zit."
      />

      <Block className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...body, color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...body, color: C.terra }}
          >
            Wis
          </button>
        )}
      </Block>

      {filtered.length === 0 ? (
        <Block className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Search size={30} strokeWidth={1.6} style={{ color: C.muted }} aria-hidden="true" />
          <h3
            className="text-[24px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Lege arcade
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Verruim je zoekterm om de bogen te vullen.
          </p>
          <div className="mt-1">
            <StoneButton onClick={() => setQuery("")}>Filter wissen</StoneButton>
          </div>
        </Block>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Block key={o.id} className="p-0">
                <div className="group grid grid-cols-1 gap-4 p-5 transition-colors hover:bg-black/[0.012] sm:grid-cols-[auto,1fr,auto] sm:items-start">
                  <div className="hidden sm:flex sm:items-center sm:justify-center sm:pr-1">
                    <MatchSeal value={o.match} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2 sm:hidden">
                      <MatchSeal value={o.match} size="sm" />
                    </div>
                    <div className="mb-1.5">
                      <Kicker>{o.id}</Kicker>
                    </div>
                    <button
                      onClick={() => onOpen(o)}
                      className={`block text-left ${RING}`}
                      aria-label={`Open ${o.titel}`}
                    >
                      <h3
                        className="text-[20px] font-semibold leading-tight tracking-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                    </button>
                    <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px]"
                      style={{ ...body, color: C.fgSoft }}
                    >
                      {[
                        { Icon: MapPin, v: o.plaats },
                        { Icon: Wallet, v: o.tarief },
                        { Icon: Clock, v: o.uren },
                        { Icon: Calendar, v: o.start },
                      ].map((mm, mi) => (
                        <div key={mi} className="flex items-center gap-1.5">
                          <mm.Icon
                            size={13}
                            strokeWidth={2}
                            style={{ color: C.muted }}
                            aria-hidden="true"
                          />
                          {mm.v}
                        </div>
                      ))}
                    </dl>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <li
                          key={r}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px]"
                          style={{
                            ...body,
                            color: C.moss,
                            background: `${C.moss}14`,
                            border: `1px solid ${C.moss}33`,
                            borderRadius: 999,
                          }}
                        >
                          <Check size={11} strokeWidth={2.6} aria-hidden="true" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.terra : C.fgSoft,
                        background: isSaved ? C.terraSoft : C.card,
                        border: `1px solid ${isSaved ? `${C.terra}66` : C.line}`,
                        borderRadius: 999,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <PrimaryButton onClick={() => onOpen(o)}>
                      Bekijk
                      <ArrowRight
                        size={13}
                        strokeWidth={2.4}
                        className="transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </PrimaryButton>
                  </div>
                </div>
              </Block>
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
        <StoneButton onClick={onBack} ariaLabel="Terug naar markt">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug naar markt
        </StoneButton>
      </div>

      <Block warm className="mb-6 px-6 py-7 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
          <Arcade arches={8} color={C.line} height={54} opacity={0.5} />
        </div>
        <div className="relative">
          <div className="mb-2">
            <Kicker color={C.terraDim}>{opdracht.id}</Kicker>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <h2
                className="text-[30px] font-semibold leading-[1.02] tracking-[-0.01em] sm:text-[40px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...body, color: C.fgSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <MatchSeal value={opdracht.match} />
              <StoneButton
                onClick={() => toggleSave(opdracht.id)}
                active={isSaved}
                ariaPressed={isSaved}
                ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
              >
                {isSaved ? (
                  <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
                )}
                {isSaved ? "Bewaard" : "Bewaar"}
              </StoneButton>
            </div>
          </div>
        </div>
      </Block>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <Block key={m.label} className="p-4">
            <m.Icon size={15} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
            <div
              className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.label}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
              {m.value}
            </div>
          </Block>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Block className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: `${C.moss}18`, border: `1px solid ${C.moss}44` }}
              aria-hidden="true"
            >
              <Check size={12} strokeWidth={2.6} style={{ color: C.moss }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...body, color: C.ink }}
            >
              Draagvlak · waarom deze past
            </span>
          </div>
          <ul>
            {opdracht.redenen.plus.map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-3 py-2.5 text-[13.5px]"
                style={{
                  ...body,
                  color: C.fg,
                  borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none",
                }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.moss }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Block>
        <Block className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: `${C.clay}18`, border: `1px solid ${C.clay}44` }}
              aria-hidden="true"
            >
              <TriangleAlert size={12} strokeWidth={2.2} style={{ color: C.clay }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...body, color: C.ink }}
            >
              Scheur · even op letten
            </span>
          </div>
          <ul>
            {opdracht.redenen.min.map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-3 py-2.5 text-[13.5px]"
                style={{
                  ...body,
                  color: C.fg,
                  borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none",
                }}
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.clay }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <PrimaryButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </PrimaryButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...body, color: C.muted }}>
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
        screenKey="verificatie"
        title="Fides"
        sub="Elke status draagt een eigen label én icoon — nooit alleen kleur. Vertrouwen dat je kunt lezen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: `${color}12`, border: `1px solid ${color}3a`, borderRadius: 14 }}
            >
              <Icon size={16} strokeWidth={2.2} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ ...body, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Block className="mb-6 flex items-start gap-4 p-5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.terraSoft, border: `1px solid ${C.terra}44` }}
          aria-hidden="true"
        >
          <BadgeCheck size={20} strokeWidth={2} style={{ color: C.terra }} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...body, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Block>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <Block className="p-2">
            {CREDENTIALS.map((c, i) => {
              const done = checked.has(c.naam);
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-4 px-3 py-3.5"
                  style={{
                    borderBottom: i < CREDENTIALS.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                  }}
                >
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${done ? C.terra : C.line}`,
                      background: done ? C.terra : "transparent",
                      color: C.bg,
                      borderRadius: 7,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...body, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              );
            })}
          </Block>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker>Tabularium</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.fgSoft, border: `1px solid ${C.line}`, borderRadius: 999 }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={{
                  ...body,
                  color: feedState === s ? C.terra : C.fgSoft,
                  background: feedState === s ? C.terraSoft : C.card,
                  border: `1px solid ${feedState === s ? `${C.terra}66` : C.line}`,
                  borderRadius: 999,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <Block className="p-2">
              <ul aria-busy="true" aria-label="Documenten laden">
                {[0, 1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="px-3 py-3.5"
                    style={{ borderBottom: i < 3 ? `1px solid ${C.lineSoft}` : "none" }}
                  >
                    <div
                      className="h-3 w-2/3 animate-pulse rounded"
                      style={{ background: C.stone }}
                    />
                    <div
                      className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                      style={{ background: C.stone }}
                    />
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {feedState === "error" && (
            <Block
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: `${C.terra}55` }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
              <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
                Kluis onbereikbaar
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.muted }}>
                We konden je tabularium niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <PrimaryButton onClick={() => setFeedState("ok")}>Opnieuw proberen</PrimaryButton>
              </div>
            </Block>
          )}

          {feedState === "ok" && (
            <Block className="p-2">
              <ul>
                {DOCUMENTEN.map((d, i) => (
                  <li
                    key={d.naam}
                    className="flex items-center gap-3 px-3 py-3"
                    style={{
                      borderBottom: i < DOCUMENTEN.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                      style={{
                        ...mono,
                        color: C.fgSoft,
                        background: C.stone,
                        border: `1px solid ${C.line}`,
                        borderRadius: 8,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...body, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusPill status={d.status} />
                  </li>
                ))}
              </ul>
            </Block>
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
      <ScreenHead
        screenKey="acties"
        title="Agenda"
        sub="Wat vandaag onderhoud vraagt om het bouwwerk overeind te houden — vink af zodra het staat."
      />

      {openCount === 0 ? (
        <Block warm className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
            <Arcade arches={8} color={C.line} height={44} opacity={0.5} />
          </div>
          <Check
            size={30}
            strokeWidth={2.2}
            style={{ color: C.moss }}
            aria-hidden="true"
            className="relative"
          />
          <h3
            className="relative text-[24px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Alles staat als een huis
          </h3>
          <p className="relative max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen onderhoud meer nodig vandaag. Het bouwwerk draagt.
          </p>
        </Block>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[40px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.terra }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "punt open" : "punten open"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const col = warn ? C.clay : C.terra;
              return (
                <Block key={a.titel} className="p-5">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.moss : C.line}`,
                        background: isDone ? C.moss : "transparent",
                        color: C.bg,
                        borderRadius: 7,
                      }}
                    >
                      {isDone && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
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
                        className="mt-1 text-[12.5px]"
                        style={{ ...body, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ ...body, color: col }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </Block>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const statusColor = (status: string): string =>
    status === "Openstaand" ? C.clay : status === "Concept" ? C.muted : C.moss;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Ratio"
        sub="De rekening in steen: betaald, openstaand en concept — helder en ordelijk."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.moss },
          { label: "Openstaand", value: "€ 1.350", color: C.clay },
          { label: "Concept", value: "€ 880", color: C.gold },
        ].map((s) => (
          <Block key={s.label} className="p-5">
            <div
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[30px] font-semibold tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </Block>
        ))}
      </div>

      <Block className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}`, background: C.cardWarm }}>
                {["Nr.", "Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.muted, textAlign: i >= 4 ? "right" : "left" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13px]" style={{ ...body, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...body, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        ...body,
                        color: statusColor(f.status),
                        background: `${statusColor(f.status)}16`,
                        border: `1px solid ${statusColor(f.status)}3a`,
                        borderRadius: 999,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: statusColor(f.status) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${C.line}`, background: C.cardWarm }}>
                <td className="px-4 py-4" />
                <td
                  className="px-4 py-4 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[16px] font-semibold tabular-nums"
                  style={{ ...display, color: C.terra }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Block>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept297() {
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

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.fg, background: C.bg }}
    >
      <StoneTexture />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.35]"
        aria-hidden="true"
      >
        <Arcade arches={12} color={C.line} height={90} />
      </div>
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center"
              style={{ background: C.terra, color: C.bg, borderRadius: "12px 12px 12px 12px" }}
              aria-hidden="true"
            >
              <Columns3 size={18} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Aquaduct
              </div>
              <div
                className="text-[9.5px] font-medium uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...body, color: C.terraDim }}
              >
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{
                ...body,
                color: C.terra,
                background: C.card,
                border: `1px solid ${C.terra}44`,
                borderRadius: 999,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav
          className="mb-8 flex flex-wrap gap-1 overflow-x-auto p-1.5"
          aria-label="Hoofdnavigatie"
          style={{ background: C.stoneSoft, border: `1px solid ${C.line}`, borderRadius: 999 }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12.5px] font-semibold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...body,
                  color: on ? C.bg : C.fgSoft,
                  background: on ? C.terra : "transparent",
                  borderRadius: 999,
                }}
              >
                <span
                  className="text-[9px] font-bold tabular-nums"
                  style={{ ...mono, color: on ? C.bg : C.faint }}
                >
                  {SCREEN_META[s.key].num}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted, borderColor: C.line }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: C.terra }}
              aria-hidden="true"
            />
            {SCREENS.length} bogen · aquaduct v297
          </span>
          <span className="uppercase tracking-[0.14em]">Travertijn · arcade · terracotta</span>
        </footer>
      </div>
    </div>
  );
}
