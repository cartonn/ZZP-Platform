"use client";

// Concept 307 — "Veiling" · veilinghuis. Elegant, premium-editorial. Opdrachten worden kavels met
// lot-nummers en paddle-nummers; een hamer/afslag-motief draagt de ceremonie. Warme perkament- en
// antraciet-palette met één messing/goud-accent. Vertrouwen ontstaat via een ceremonieel-premium
// sfeer: serif lot-nummers, dunne filets, wax-zegel-medaillons voor de match.
// Fonts: display --font-lab-cormorant · tekst --font-lab-newsreader · cijfers --font-lab-mono.

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Search,
  MapPin,
  Coins,
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
  Gavel,
  Stamp,
  ScrollText,
  Landmark,
  Plus,
  Minus,
  ShieldCheck,
  Star,
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

// Parchment & anthracite with a single brass/gold accent — an auction-house palette.
const C = {
  paper: "#f3ecdd",
  paperSoft: "#eae1cd",
  card: "#faf5ea",
  cardSoft: "#f5eedd",
  ink: "#211d16",
  fg: "#3b352a",
  fgSoft: "#6c6350",
  muted: "#8d8368",
  faint: "#b6ac91",
  night: "#211d16",
  nightSoft: "#2c271d",
  brass: "#a67c2e",
  brassSoft: "#c69a4c",
  brassDeep: "#7d5c1c",
  gold: "#d8b35e",
  line: "#ddd2ba",
  lineSoft: "#e7ddc8",
  green: "#5b7c3f",
  amber: "#b3841f",
  rust: "#a2472a",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const serif = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a67c2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ecdd]";

const LOT: Record<ScreenKey, string> = {
  dashboard: "I",
  marktplaats: "II",
  opdracht: "III",
  verificatie: "IV",
  acties: "V",
  facturen: "VI",
  documenten: "VII",
  berichten: "VIII",
};

// ---- Premium primitives -----------------------------------------------------

// A thin double-rule — the editorial filet that frames auction-house typography.
function Filet({ tone = C.line }: { tone?: string }) {
  return (
    <div aria-hidden="true">
      <div style={{ height: 1.5, background: tone }} />
      <div style={{ height: 1, marginTop: 2, background: tone, opacity: 0.55 }} />
    </div>
  );
}

// A serif lot-number plate — the load-bearing motif on every kavel.
function LotPlate({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`Kavelnummer ${n}`}
      style={{
        ...mono,
        color: C.brassDeep,
        border: `1.5px solid ${C.brass}`,
        borderRadius: 2,
        background: C.cardSoft,
        padding: "3px 8px",
      }}
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Kavel</span>
      <span className="text-[12px] font-bold tabular-nums">{String(n).padStart(3, "0")}</span>
    </span>
  );
}

// A wax-seal medallion — the match value struck as an auction hallmark with tick ring.
function MatchSeal({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rTick = rOuter - 8;
  const ticks = 40;
  const active = Math.round((value / 100) * ticks);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx={cx} cy={cy} r={rOuter} fill={C.cardSoft} stroke={C.brass} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={rTick - 3} fill="none" stroke={C.line} strokeWidth={1} />
      {Array.from({ length: ticks }).map((_, i) => {
        const a = (i / ticks) * 2 * Math.PI - Math.PI / 2;
        const on = i < active;
        const sx = cx + (rTick - 4) * Math.cos(a);
        const sy = cy + (rTick - 4) * Math.sin(a);
        const ex = cx + rTick * Math.cos(a);
        const ey = cy + rTick * Math.sin(a);
        return (
          <line
            key={i}
            x1={sx}
            y1={sy}
            x2={ex}
            y2={ey}
            stroke={on ? C.brass : C.faint}
            strokeWidth={on ? 2 : 1}
            strokeLinecap="round"
            opacity={on ? 0.95 : 0.5}
          />
        );
      })}
      <text
        x={cx}
        y={cy + (label ? -2 : 5)}
        textAnchor="middle"
        style={display}
        fontSize={size > 88 ? 30 : 22}
        fill={C.ink}
        fontWeight={600}
      >
        {value}
      </text>
      {label && (
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          style={mono}
          fontSize={7}
          fill={C.muted}
          letterSpacing={2}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

function Kicker({ children, tone = "brass" }: { children: ReactNode; tone?: "brass" | "muted" }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.28em]"
      style={{ ...mono, color: tone === "brass" ? C.brass : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Getaxeerd", Icon: BadgeCheck, color: C.green };
    case "SUBMITTED":
      return { label: "In taxatie", Icon: Hourglass, color: C.amber };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.rust };
    case "REJECTED":
      return { label: "Afgekeurd", Icon: XCircle, color: C.rust };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{
        ...serif,
        color,
        background: `${color}14`,
        border: `1px solid ${color}`,
        borderRadius: 2,
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// Filled brass primary — a struck plate that lifts on hover.
function BrassButton({
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...serif,
        color: C.paper,
        background: hot
          ? `linear-gradient(180deg, ${C.brassSoft}, ${C.brass})`
          : `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
        border: `1px solid ${C.brassDeep}`,
        borderRadius: 3,
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: hot ? `0 6px 16px ${C.brass}44` : `0 2px 6px ${C.brass}22`,
      }}
    >
      {children}
    </button>
  );
}

// Outlined ink secondary — inverts to ink fill.
function InkButton({
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...serif,
        color: on ? C.paper : C.ink,
        background: on ? C.ink : "transparent",
        border: `1px solid ${C.ink}`,
        borderRadius: 3,
      }}
    >
      {children}
    </button>
  );
}

// A parchment kavel-card with subtle warm surface and hairline rule.
function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 4,
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
    <div className="mb-7">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-flex h-7 items-center gap-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ ...mono, color: C.paper, background: C.ink, borderRadius: 2 }}
          aria-hidden="true"
        >
          <Landmark size={12} strokeWidth={2} />
          Lot {LOT[screenKey]}
        </span>
        <div className="flex-1">
          <Filet />
        </div>
      </div>
      <h1
        className="text-[34px] font-semibold leading-[0.98] tracking-tight sm:text-[46px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[14px] leading-relaxed"
          style={{ ...serif, color: C.fgSoft }}
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
  return (
    <div>
      {/* Hero — the catalogue frontispiece with the top kavel struck as a seal. */}
      <div
        className="mb-8 overflow-hidden"
        style={{ borderRadius: 6, border: `1px solid ${C.brass}`, background: C.card }}
      >
        <div className="flex items-center justify-between px-6 py-2" style={{ background: C.ink }}>
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em]"
            style={{ ...mono, color: C.gold }}
          >
            <Gavel size={12} strokeWidth={2} aria-hidden="true" />
            Veilingcatalogus · zomer
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.faint }}
          >
            Editie MMXXVI
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[40px] font-semibold leading-[0.95] tracking-tight sm:text-[54px]"
              style={{ ...display, color: C.ink }}
            >
              Welkom in de zaal,
              <br />
              <span style={{ fontStyle: "italic", color: C.brassDeep }}>{voornaam}</span>.
            </h1>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...serif, color: C.fgSoft }}
            >
              Elke opdracht is een kavel, met de reden waarom ze past onder de hamer. We tonen
              alleen wat telt — helder gecureerd, met de zorg van een veilinghuis.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 px-3 py-2"
                style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: C.cardSoft }}
              >
                <ShieldCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                <span className="text-[12px] font-semibold" style={{ ...serif, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-2"
                style={{ border: `1px solid ${C.line}`, borderRadius: 3, background: C.cardSoft }}
              >
                <Stamp size={15} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
                <span className="text-[12px] font-semibold" style={{ ...serif, color: C.ink }}>
                  Paddle {PROFIEL.initialen} · 042
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ borderRadius: 8 }}
            aria-label={`Open topkavel: ${top.titel}`}
          >
            <MatchSeal value={top.match} size={150} label="TOPKAVEL" />
            <span
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.brass }}
            >
              <Gavel
                size={11}
                strokeWidth={2.4}
                className="transition-transform group-hover:-rotate-12"
                aria-hidden="true"
              />
              Onder de hamer
            </span>
          </button>
        </div>
        <Filet tone={C.brass} />
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="p-4"
              style={{
                borderRight: i < KPIS.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <div
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className="text-[26px] font-semibold tabular-nums leading-none"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.rust }}
                >
                  {k.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <Kicker>Kavels in aanbod</Kicker>
            <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
              {String(OPDRACHTEN.length).padStart(2, "0")} kavels
            </span>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING}`}
                style={{ borderRadius: 4 }}
              >
                <Card
                  className="flex items-center gap-4 p-4 transition-colors group-hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.brass }}
                >
                  <MatchSeal value={o.match} size={70} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <LotPlate n={i + 1} />
                    </div>
                    <div
                      className="truncate text-[18px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[13px]" style={{ ...serif, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · <span style={mono}>{o.tarief}</span>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.brass }}
                    aria-hidden="true"
                  />
                </Card>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Op de afslag</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <Card key={a.titel} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        color: C.paper,
                        background: warn ? C.rust : C.ink,
                        borderRadius: 2,
                      }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13.5px] font-semibold leading-snug"
                        style={{ ...serif, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.04em]"
                        style={{ ...serif, color: warn ? C.rust : C.brass }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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
        title="De veilingzaal"
        sub="Elke opdracht is een kavel — met richtprijs, provenance en de redenen die de hamer laten vallen."
      />

      <Card className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.brass }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek kavels"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...serif, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...serif, color: C.brass }}
          >
            Wis
          </button>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <ScrollText size={30} strokeWidth={1.6} style={{ color: C.brass }} aria-hidden="true" />
          <h3
            className="text-[24px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen kavel gevonden
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...serif, color: C.fgSoft }}>
            De catalogus bevat niets voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <InkButton onClick={() => setQuery("")}>Catalogus tonen</InkButton>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const lotNr = OPDRACHTEN.indexOf(o) + 1;
            const isSaved = saved.has(o.id);
            return (
              <Card
                key={o.id}
                className="p-5 transition-colors hover:border-[color:var(--acc)]"
                style={{ ["--acc" as string]: C.brass }}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex flex-col items-center gap-2">
                    <MatchSeal value={o.match} size={92} label="MATCH" />
                    <LotPlate n={lotNr} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[21px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...serif, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]"
                      style={{ ...serif, color: C.fgSoft }}
                    >
                      {[
                        { Icon: MapPin, v: o.plaats, mono: false },
                        { Icon: Coins, v: `${o.tarief} · richtprijs`, mono: true },
                        { Icon: Clock, v: o.uren, mono: false },
                        { Icon: Calendar, v: o.start, mono: false },
                      ].map((m, mi) => (
                        <div key={mi} className="flex items-center gap-1.5">
                          <m.Icon
                            size={13}
                            strokeWidth={2}
                            style={{ color: C.muted }}
                            aria-hidden="true"
                          />
                          <span style={m.mono ? mono : undefined}>{m.v}</span>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            ...serif,
                            color: C.fg,
                            border: `1px solid ${C.line}`,
                            borderRadius: 2,
                            background: C.cardSoft,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <button
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit favorieten" : "Zet op je paddle"}
                      className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.paper : C.ink,
                        background: isSaved ? C.ink : "transparent",
                        border: `1px solid ${C.ink}`,
                        borderRadius: 3,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <BrassButton onClick={() => onOpen(o)}>
                      Bekijk kavel
                      <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                    </BrassButton>
                  </div>
                </div>
              </Card>
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
  const lotNr = OPDRACHTEN.indexOf(opdracht) + 1;
  return (
    <div>
      <div className="mb-5">
        <InkButton onClick={onBack} ariaLabel="Terug naar de veilingzaal">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </InkButton>
      </div>

      <div
        className="mb-6 overflow-hidden"
        style={{ borderRadius: 6, border: `1px solid ${C.brass}`, background: C.card }}
      >
        <div className="flex items-center justify-between px-6 py-2" style={{ background: C.ink }}>
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.gold }}
          >
            <Gavel size={12} strokeWidth={2} aria-hidden="true" />
            Kavelbeschrijving
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ ...mono, color: C.faint }}
          >
            {opdracht.id}
          </span>
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <LotPlate n={lotNr} />
              </div>
              <h2
                className="text-[32px] font-semibold leading-[1.02] tracking-tight sm:text-[44px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-2 text-[14px]" style={{ ...serif, color: C.fgSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <MatchSeal value={opdracht.match} size={120} label="MATCH" />
              <InkButton
                onClick={() => toggleSave(opdracht.id)}
                active={isSaved}
                ariaPressed={isSaved}
                ariaLabel={isSaved ? "Verwijder uit favorieten" : "Zet op je paddle"}
              >
                {isSaved ? (
                  <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
                )}
                {isSaved ? "Op je paddle" : "Op paddle zetten"}
              </InkButton>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { Icon: Coins, label: "Richtprijs", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Aanvang", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="p-3"
                style={{ background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 3 }}
              >
                <m.Icon size={15} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
                <div
                  className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div
                  className="mt-0.5 text-[14px] font-semibold"
                  style={{ ...serif, color: C.ink }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Filet tone={C.brass} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.green, borderRadius: 2 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.paper }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...serif, color: C.ink }}
            >
              Provenance — waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px]"
                style={{ ...serif, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-1 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.rust, borderRadius: 2 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.paper }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...serif, color: C.ink }}
            >
              Kanttekeningen bij het kavel
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px]"
                style={{ ...serif, color: C.fg }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  className="mt-1 shrink-0"
                  style={{ color: C.rust }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <BrassButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Gavel size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Bod uitgebracht" : "Breng je bod uit"}
        </BrassButton>
        {applied && (
          <span className="text-[13px]" style={{ ...serif, color: C.fgSoft }}>
            De opdrachtgever slaat gemiddeld binnen 6 uur toe.
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
        title="Taxatie & echtheid"
        sub="Elk certificaat een getaxeerd stuk — status met label én zegel, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: `${color}12`, border: `1px solid ${color}`, borderRadius: 3 }}
            >
              <Icon size={16} strokeWidth={2.2} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ ...serif, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="mb-6 flex items-start gap-4 p-5" style={{ borderColor: C.brass }}>
        <Stamp
          size={24}
          strokeWidth={2}
          style={{ color: C.brass }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust} · gezegeld dossier
          </div>
          <p className="mt-1 text-[13.5px]" style={{ ...serif, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen met jouw toestemming aan een
            opdrachtgever getoond — als een verzegelde kavelmap.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <Card key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${C.ink}`,
                      background: done ? C.ink : "transparent",
                      color: C.paper,
                      borderRadius: 2,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold" style={{ ...serif, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...serif, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Kavelmap</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.ink, border: `1px solid ${C.ink}`, borderRadius: 3 }}
              aria-label="Vernieuw kavelmap"
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
                className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...serif,
                  color: feedState === s ? C.paper : C.ink,
                  background: feedState === s ? C.ink : "transparent",
                  border: `1px solid ${C.ink}`,
                  borderRadius: 3,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Kavelmap laden">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </Card>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Card
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: C.rust }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.rust }} aria-hidden="true" />
              <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
                Kavelmap niet bereikbaar
              </div>
              <p className="text-[12.5px]" style={{ ...serif, color: C.fgSoft }}>
                We konden je verzegelde kluis niet openen. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <BrassButton onClick={() => setFeedState("ok")}>Opnieuw proberen</BrassButton>
              </div>
            </Card>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Card key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.paper, background: C.ink, borderRadius: 2 }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...serif, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </Card>
              ))}
            </div>
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
        title="Op de afslag"
        sub="Wat vandaag onder de hamer moet — kavel voor kavel afgehandeld."
      />

      {openCount === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Star size={30} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
          <h3
            className="text-[24px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Alles toegewezen
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...serif, color: C.fgSoft }}>
            Geen open kavels meer vandaag. De hamer is gevallen.
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[42px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.brassDeep }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "kavel open" : "kavels open"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Card key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${C.ink}`,
                      background: isDone ? C.ink : "transparent",
                      color: C.paper,
                      borderRadius: 2,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : C.paper,
                      background: isDone ? "transparent" : warn ? C.rust : C.ink,
                      border: isDone ? `1px solid ${C.line}` : "none",
                      borderRadius: 2,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15.5px] font-semibold leading-snug"
                      style={{
                        ...serif,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.5 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[13px]"
                      style={{ ...serif, color: C.fgSoft, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.04em]"
                        style={{ ...serif, color: warn ? C.rust : C.brass }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Card>
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
    status === "Openstaand" ? C.rust : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Afrekening"
        sub="De veilingafrekening — overzichtelijk, gezegeld en zonder gedoe."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Toegewezen (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.rust },
          { label: "Concept", value: "€ 880", color: C.ink },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div
              className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[28px] font-semibold tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                {["Kwitantie", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.muted, textAlign: i >= 3 ? "right" : "left" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.cardSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.brassDeep }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-4 text-[13.5px]" style={{ ...serif, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-4 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[13.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
                      style={{ ...serif, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-2 w-2"
                        style={{ background: statusColor(f.status), borderRadius: 4 }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1.5px solid ${C.ink}` }}>
                <td
                  className="px-4 py-4 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal onder de hamer
                </td>
                <td
                  className="px-4 py-4 text-right text-[16px] font-semibold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept307() {
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
      className="min-h-[680px] w-full antialiased"
      style={{ ...serif, color: C.fg, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.ink, borderRadius: 4 }}
              aria-hidden="true"
            >
              <Gavel size={20} strokeWidth={2} style={{ color: C.gold }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[21px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Veiling
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.28em]"
                style={{ ...mono, color: C.muted }}
              >
                Veilinghuis · ZZP
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-semibold" style={{ ...serif, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...serif, color: C.fgSoft }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[13px] font-semibold"
              style={{ ...display, color: C.paper, background: C.brass, borderRadius: 3 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Catalogue nav — a row of lot-tabs on an ink rail. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1 p-1"
            style={{ background: C.ink, borderRadius: 5 }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition-colors ${RING}`}
                  style={{
                    ...serif,
                    color: on ? C.ink : C.faint,
                    background: on ? C.paper : "transparent",
                    borderRadius: 3,
                  }}
                >
                  <span
                    className="text-[9px] font-bold"
                    style={{ ...mono, color: on ? C.brass : C.muted }}
                  >
                    {LOT[s.key]}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
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

        <div className="mt-9">
          <Filet />
        </div>
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2"
              style={{ background: C.brass, borderRadius: 4 }}
              aria-hidden="true"
            />
            {SCREENS.length} kavels · veiling v307
          </span>
          <span className="uppercase tracking-[0.14em]">Hamer · paddle · provenance</span>
        </footer>
      </div>
    </div>
  );
}
