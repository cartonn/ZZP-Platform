"use client";

// Concept 310 — "Kruidenier" · verse marktschappen.
// Signature: opdrachten en documenten als producten op nette schappen, met prijskaartjes en
// label-etiketten; verse, appetijtelijke productkleuren (groente-groen, tomaat-rood, citrus) op
// krijtwit; een weegschaal-motief voor de match. Vrolijk-helder retail, hoge orde op een 8pt-raster.
// Fonts: kop --font-lab-bricolage · tekst --font-lab-geist · cijfers --font-lab-mono.

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
  Scale,
  Tag,
  ShoppingBasket,
  Leaf,
  Plus,
  Minus,
  ShieldCheck,
  Apple,
  Carrot,
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

// Fresh-market palette — chalk-white shelves, greengrocer green, tomato red, citrus, aubergine ink.
const C = {
  chalk: "#f7f5ee",
  chalkSoft: "#efece1",
  card: "#ffffff",
  cardSoft: "#faf8f1",
  shelf: "#e9e3d3",
  ink: "#26301f",
  fg: "#3c4633",
  fgSoft: "#606a54",
  muted: "#8a927c",
  faint: "#b4bba6",
  green: "#3f8f4e",
  greenSoft: "#5aa96a",
  greenDeep: "#2c6a39",
  tomato: "#d64b3a",
  tomatoSoft: "#e56a5a",
  citrus: "#e0a11d",
  citrusSoft: "#f0bd4a",
  aubergine: "#4b3a5c",
  line: "#ddd7c6",
  lineSoft: "#eae5d6",
  amber: "#c58a1f",
  red: "#c0392b",
};

const display = { fontFamily: "var(--font-lab-bricolage), Georgia, serif" };
const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f8f4e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5ee]";

const SCREEN_AISLE: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

const SCREEN_SHELF: Record<ScreenKey, string> = {
  dashboard: "Toonbank",
  marktplaats: "Versschap",
  opdracht: "Op de weegschaal",
  verificatie: "Keurmerk",
  acties: "Boodschappenlijst",
  facturen: "Kassabon",
  documenten: "Voorraadkast",
  berichten: "Toonbankpraat",
};

// ---- Grocery primitives -----------------------------------------------------

// The scale dial — a weighing-scale needle sweeping to the match value. The load-bearing motif:
// a half-circle grocery scale with a tomato-red needle and printed value below.
function ScaleDial({ value, size = 132, label }: { value: number; size?: number; label?: string }) {
  const w = size;
  const h = size * 0.78;
  const cx = w / 2;
  const cy = h * 0.86;
  const r = w / 2 - 6;
  // needle angle: 0 → -180deg (left), 100 → 0deg (right), across the top semicircle.
  const ang = Math.PI - (value / 100) * Math.PI;
  const nx = cx + (r - 8) * Math.cos(ang);
  const ny = cy - (r - 8) * Math.sin(ang);
  const ticks = 10;
  return (
    <svg width={size} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      {/* dial face */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`}
        fill={C.cardSoft}
        stroke={C.line}
        strokeWidth={1.5}
      />
      {/* value fill arc */}
      <path
        d={`M ${cx - r + 3} ${cy} A ${r - 3} ${r - 3} 0 0 1 ${cx + (r - 3) * Math.cos(ang)} ${cy - (r - 3) * Math.sin(ang)}`}
        fill="none"
        stroke={C.green}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* ticks */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const a = Math.PI - (i / ticks) * Math.PI;
        const x1 = cx + (r - 2) * Math.cos(a);
        const y1 = cy - (r - 2) * Math.sin(a);
        const x2 = cx + (r - 7) * Math.cos(a);
        const y2 = cy - (r - 7) * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.faint} strokeWidth={1.2} />;
      })}
      {/* needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={C.tomato}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill={C.tomato} />
      <circle cx={cx} cy={cy} r={1.6} fill={C.card} />
      <text
        x={cx}
        y={cy - r * 0.34}
        textAnchor="middle"
        style={mono}
        fontSize={size > 110 ? 24 : size > 80 ? 19 : 15}
        fill={C.ink}
        fontWeight={700}
      >
        {value}
      </text>
      {label && (
        <text
          x={cx}
          y={cy - r * 0.34 + 12}
          textAnchor="middle"
          style={mono}
          fontSize={7}
          fill={C.green}
          letterSpacing={1.6}
          fontWeight={700}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

// A price-tag — the swing-ticket label with a punched hole and string notch.
function PriceTag({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "tomato" | "citrus";
}) {
  const col = tone === "tomato" ? C.tomato : tone === "citrus" ? C.citrus : C.green;
  return (
    <span
      className="relative inline-flex items-center gap-1.5 py-1 pl-4 pr-3 text-[11px] font-bold uppercase tracking-[0.05em]"
      style={{
        ...mono,
        color: C.card,
        background: col,
        borderRadius: "3px 8px 8px 3px",
      }}
    >
      <span
        className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
        style={{ background: C.card, opacity: 0.85 }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

// Sparkline drawn as a produce-stack bar row (fresh-crate levels).
function CrateBars({ spark, height = 22 }: { spark: number[]; height?: number }) {
  const max = Math.max(...spark);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden="true">
      {spark.map((v, i) => {
        const on = i === spark.length - 1;
        return (
          <div
            key={i}
            className="flex-1"
            style={{
              height: `${Math.max(12, (v / max) * 100)}%`,
              background: on ? C.green : `${C.green}44`,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}

function Kicker({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "muted" }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.22em]"
      style={{ ...mono, color: tone === "green" ? C.green : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.amber };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.citrus };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{
        ...sans,
        color,
        background: `${color}15`,
        border: `1.5px solid ${color}`,
        borderRadius: 6,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Green primary — a fresh "in de mand" button.
function FreshButton({
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-all duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.card,
        background: hot ? C.greenSoft : C.green,
        border: `1.5px solid ${C.greenDeep}`,
        borderRadius: 10,
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: hot ? `0 5px 12px ${C.green}44` : `0 2px 6px ${C.green}22`,
      }}
    >
      {children}
    </button>
  );
}

// Outlined secondary — ink frame on chalk, inverts to ink fill.
function LineButton({
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.card : C.ink,
        background: on ? C.ink : "transparent",
        border: `1.5px solid ${C.ink}`,
        borderRadius: 10,
      }}
    >
      {children}
    </button>
  );
}

// A shelf card — a product tile that sits on a wooden-shelf lip at the bottom.
function ShelfCard({
  children,
  className,
  style,
  shelf = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  shelf?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: C.card,
        border: `1.5px solid ${C.line}`,
        borderRadius: 12,
        borderBottom: shelf ? `4px solid ${C.shelf}` : `1.5px solid ${C.line}`,
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
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-7 items-center gap-1.5 px-2.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, color: C.card, background: C.ink, borderRadius: 6 }}
          aria-hidden="true"
        >
          <Leaf size={12} strokeWidth={2.4} />
          {SCREEN_AISLE[screenKey]}
        </span>
        <span
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.green }}
        >
          {SCREEN_SHELF[screenKey]}
        </span>
        <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="mt-3 text-[30px] font-extrabold leading-none tracking-tight sm:text-[40px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed"
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
  return (
    <div>
      {/* Hero — the shop-counter greeting with the "day's best" produce on the scale. */}
      <div
        className="mb-8 overflow-hidden"
        style={{
          borderRadius: 16,
          border: `1.5px solid ${C.line}`,
          background: C.card,
          borderBottom: `5px solid ${C.shelf}`,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-2"
          style={{ background: C.green }}
        >
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.card }}
          >
            <ShoppingBasket size={13} strokeWidth={2.2} aria-hidden="true" />
            Vers vandaag · versschap open
          </span>
          <span
            className="hidden text-[10px] font-bold uppercase tracking-[0.2em] sm:inline"
            style={{ ...mono, color: "#ffffffcc" }}
          >
            {PROFIEL.plaats}
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
              className="text-[38px] font-extrabold leading-[0.95] tracking-tight sm:text-[50px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              De schappen zijn bijgevuld en het beste ligt vooraan. We tonen alleen wat telt en wat
              nu jouw aandacht vraagt — netjes uitgestald, nooit rommelig.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 px-3 py-2"
                style={{
                  border: `1.5px solid ${C.green}`,
                  borderRadius: 10,
                  background: `${C.green}10`,
                }}
              >
                <ShieldCheck
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
              </div>
              <div className="hidden w-28 sm:block">
                <CrateBars spark={KPIS[0]!.spark} />
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center rounded-2xl p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <ScaleDial value={top.match} size={158} label="VERS VANDAAG" />
            <span
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.tomato }}
            >
              <Tag
                size={11}
                strokeWidth={2.6}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
              In de mand
            </span>
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <ShelfCard key={k.label} className="p-4" shelf>
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.13em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.tomato }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[24px] font-extrabold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <CrateBars spark={k.spark} height={18} />
            </div>
          </ShelfCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Beste van de dag</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full rounded-xl text-left ${RING}`}
              >
                <ShelfCard
                  className="flex items-center gap-4 p-4 transition-colors group-hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.green }}
                >
                  <ScaleDial value={o.match} size={80} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-extrabold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.green }}
                    aria-hidden="true"
                  />
                </ShelfCard>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Nog inslaan</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <ShelfCard key={a.titel} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        color: C.card,
                        background: warn ? C.tomato : C.ink,
                        borderRadius: 6,
                      }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-bold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.03em]"
                        style={{ ...sans, color: warn ? C.tomato : C.green }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </ShelfCard>
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
        title="Versschap"
        sub="Elke opdracht netjes uitgestald met een prijskaartje — mét de redenen waarom ze past of schuurt."
      />

      <ShelfCard className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.green }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...sans, color: C.green }}
          >
            Wis
          </button>
        )}
      </ShelfCard>

      {filtered.length === 0 ? (
        <ShelfCard className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <ShoppingBasket
            size={30}
            strokeWidth={1.6}
            style={{ color: C.green }}
            aria-hidden="true"
          />
          <h3
            className="text-[22px] font-extrabold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Schap leeg
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen product voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </ShelfCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            const tone = idx % 3 === 0 ? "green" : idx % 3 === 1 ? "tomato" : "citrus";
            return (
              <ShelfCard
                key={o.id}
                className="flex flex-col p-5 transition-colors hover:border-[color:var(--acc)]"
                style={{ ["--acc" as string]: C.green }}
                shelf
              >
                <div className="flex items-start gap-4">
                  <ScaleDial value={o.match} size={92} label="MATCH" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Kicker>{o.id}</Kicker>
                      <PriceTag tone={tone as "green" | "tomato" | "citrus"}>{o.tarief}</PriceTag>
                    </div>
                    <h3
                      className="text-[18px] font-extrabold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                  </div>
                </div>
                <dl
                  className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]"
                  style={{ ...sans, color: C.fgSoft }}
                >
                  {[
                    { Icon: MapPin, v: o.plaats },
                    { Icon: Clock, v: o.uren },
                    { Icon: Calendar, v: o.start },
                  ].map((m, mi) => (
                    <div key={mi} className="flex items-center gap-1.5">
                      <m.Icon
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.green }}
                        aria-hidden="true"
                      />
                      {m.v}
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 text-[11px] font-bold"
                      style={{
                        ...sans,
                        color: C.green,
                        border: `1.5px solid ${C.green}44`,
                        background: `${C.green}0d`,
                        borderRadius: 6,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      color: isSaved ? C.card : C.ink,
                      background: isSaved ? C.ink : "transparent",
                      border: `1.5px solid ${C.ink}`,
                      borderRadius: 10,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                  <FreshButton onClick={() => onOpen(o)}>
                    Bekijk
                    <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </FreshButton>
                </div>
              </ShelfCard>
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
      <div className="mb-5">
        <LineButton onClick={onBack} ariaLabel="Terug naar versschap">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <div
        className="mb-6 overflow-hidden"
        style={{
          borderRadius: 16,
          border: `1.5px solid ${C.line}`,
          background: C.card,
          borderBottom: `5px solid ${C.shelf}`,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-2"
          style={{ background: C.green }}
        >
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.card }}
          >
            <Scale size={12} strokeWidth={2.2} aria-hidden="true" />
            {SCREEN_SHELF.opdracht}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ ...mono, color: "#ffffffcc" }}
          >
            {opdracht.id}
          </span>
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Kicker>Productkaart</Kicker>
                <PriceTag tone="tomato">{opdracht.tarief}</PriceTag>
              </div>
              <h2
                className="text-[30px] font-extrabold leading-[1.02] tracking-tight sm:text-[40px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ScaleDial value={opdracht.match} size={126} label="MATCH" />
              <LineButton
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
              </LineButton>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="p-3"
                style={{
                  background: C.cardSoft,
                  border: `1.5px solid ${C.line}`,
                  borderRadius: 10,
                }}
              >
                <m.Icon size={15} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
                <div
                  className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="mt-0.5 text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ShelfCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.green, borderRadius: 6 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
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
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </ShelfCard>
        <ShelfCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.citrus, borderRadius: 6 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
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
                  style={{ color: C.citrus }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </ShelfCard>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <FreshButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "In de mand — reactie verstuurd" : "Reageer op opdracht"}
        </FreshButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
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
        title="Keurmerk"
        sub="Elk certificaat gekeurd en verzegeld — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: `${color}12`, border: `1.5px solid ${color}`, borderRadius: 10 }}
            >
              <Icon size={16} strokeWidth={2.4} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <ShelfCard className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: C.green }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-bold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </ShelfCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Keurmerken</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <ShelfCard key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.ink}`,
                      background: done ? C.ink : "transparent",
                      color: C.card,
                      borderRadius: 6,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </ShelfCard>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Voorraadkast</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 8 }}
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
                className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.card : C.ink,
                  background: feedState === s ? C.ink : "transparent",
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <ShelfCard key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </ShelfCard>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <ShelfCard
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: C.red }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[16px] font-extrabold" style={{ ...display, color: C.ink }}>
                Kast op slot
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <FreshButton onClick={() => setFeedState("ok")}>Opnieuw proberen</FreshButton>
              </div>
            </ShelfCard>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <ShelfCard key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.card, background: C.ink, borderRadius: 6 }}
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
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </ShelfCard>
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
        title="Boodschappenlijst"
        sub="Wat vandaag ingeslagen moet worden — item voor item afgevinkt."
      />

      {openCount === 0 ? (
        <ShelfCard className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
          <h3
            className="text-[22px] font-extrabold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Alles ingeslagen
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer op de lijst vandaag. De mand is vol.
          </p>
        </ShelfCard>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-extrabold tabular-nums leading-none"
              style={{ ...display, color: C.tomato }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "item op de lijst" : "items op de lijst"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <ShelfCard key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.ink}`,
                      background: isDone ? C.ink : "transparent",
                      color: C.card,
                      borderRadius: 6,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : C.card,
                      background: isDone ? "transparent" : warn ? C.tomato : C.ink,
                      border: isDone ? `1.5px solid ${C.line}` : "none",
                      borderRadius: 6,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-bold leading-snug"
                      style={{
                        ...sans,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.5 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ ...sans, color: C.fgSoft, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.03em]"
                        style={{ ...sans, color: warn ? C.tomato : C.green }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </ShelfCard>
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
    status === "Openstaand" ? C.tomato : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Kassabon"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.tomato },
          { label: "Concept", value: "€ 880", color: C.ink },
        ].map((s) => (
          <ShelfCard key={s.label} className="p-5" shelf>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-extrabold tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </ShelfCard>
        ))}
      </div>

      <ShelfCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em]"
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
                    className="px-4 py-4 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.green }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-4 text-[13px]" style={{ ...sans, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-4 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[13px] font-bold tabular-nums"
                    style={{ ...sans, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                      style={{ ...sans, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-2 w-2"
                        style={{ background: statusColor(f.status), borderRadius: 999 }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1.5px solid ${C.ink}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-extrabold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </ShelfCard>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept310() {
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
      style={{ ...sans, color: C.fg, background: C.chalk }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.green, borderRadius: 12, border: `2px solid ${C.greenDeep}` }}
              aria-hidden="true"
            >
              <Carrot size={20} strokeWidth={2.2} style={{ color: C.card }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-extrabold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Kruidenier
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.28em]"
                style={{ ...mono, color: C.green }}
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
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
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
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{ ...display, color: C.card, background: C.ink, borderRadius: 12 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Aisle nav — a shelf strip of aisle tabs with produce icon on the active shelf. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1 rounded-2xl p-1.5"
            style={{
              background: C.card,
              border: `1.5px solid ${C.line}`,
              borderBottom: `4px solid ${C.shelf}`,
            }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.card : C.fgSoft,
                    background: on ? C.green : "transparent",
                    borderRadius: 10,
                  }}
                >
                  {on && <Apple size={12} strokeWidth={2.4} aria-hidden="true" />}
                  <span
                    className="text-[9px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? "#ffffffcc" : C.faint }}
                  >
                    {SCREEN_AISLE[s.key]}
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

        <div className="mt-9 h-px w-full" style={{ background: C.line }} aria-hidden="true" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2"
              style={{ background: C.green, borderRadius: 999 }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · kruidenier v310
          </span>
          <span className="uppercase tracking-[0.14em]">Schappen · prijskaartjes · weegschaal</span>
        </footer>
      </div>
    </div>
  );
}
