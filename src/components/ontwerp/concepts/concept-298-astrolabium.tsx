"use client";

// Concept 298 — "Astrolabium" · messing hemel-instrument, gegraveerd (dark brass).
// Signature: diep nachtblauw/antraciet paneel met messing/goud gegraveerde graadringen als
// dragend layout-motief — concentrische schalen met fijne tick-marks, een roterende alidade-wijzer
// die de beste match aanwijst, en gegraveerde hairlines die secties scheiden. Precisie + vertrouwen
// als klassiek sterrenkaart-instrument: geen "sterretjes-decoratie" maar echte graadschaal-geometrie.
// Fonts: kop --font-lab-cormorant (klassiek serif) · tekst --font-lab-geist · cijfers --font-lab-mono.

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
  Compass,
  Plus,
  Minus,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Brass-on-night palette. Warm engraved gold over deep midnight; nothing decorative-neon.
const C = {
  night: "#0e1118",
  nightSoft: "#141926",
  panel: "#171d2b",
  panelSoft: "#1c2434",
  ink: "#e9e2cf",
  fg: "#d7cfba",
  fgSoft: "#a99f86",
  muted: "#7d7663",
  faint: "#565243",
  brass: "#c9a24b",
  brassSoft: "#e0c079",
  brassDeep: "#8a6d2c",
  line: "#2a3243",
  lineBrass: "rgba(201,162,75,0.28)",
  lineBrassStrong: "rgba(201,162,75,0.55)",
  ember: "#c86a3a",
  emberSoft: "#e2905f",
  verdigris: "#5aa588",
};

const serif = { fontFamily: "var(--font-lab-cormorant), Georgia, 'Times New Roman', serif" };
const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0c079] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1118]";

const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "I",
  marktplaats: "II",
  opdracht: "III",
  verificatie: "IV",
  acties: "V",
  facturen: "VI",
  documenten: "VII",
  berichten: "VIII",
};

// ---- Engraved primitives ----------------------------------------------------

// A graduated brass ring — the load-bearing motif. A concentric degree scale with fine ticks,
// an optional filled arc (the "measured" portion) and a rotating alidade pointer.
function GraadRing({
  size = 132,
  value = 90,
  label,
  sub,
  ticks = 60,
}: {
  size?: number;
  value?: number;
  label?: string;
  sub?: string;
  ticks?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rTickIn = rOuter - 7;
  const rTickMajor = rOuter - 12;
  const rArc = rOuter - 16;
  const angle = (value / 100) * 360;
  const arcRad = ((angle - 90) * Math.PI) / 180;
  const arcX = cx + rArc * Math.cos(arcRad);
  const arcY = cy + rArc * Math.sin(arcRad);
  const largeArc = angle > 180 ? 1 : 0;
  const alidadeRad = ((angle - 90) * Math.PI) / 180;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke={C.lineBrass} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rTickMajor} fill="none" stroke={C.lineBrass} strokeWidth={0.75} />
      {Array.from({ length: ticks }).map((_, i) => {
        const a = (i / ticks) * 2 * Math.PI - Math.PI / 2;
        const major = i % 5 === 0;
        const rin = major ? rTickMajor : rTickIn;
        return (
          <line
            key={i}
            x1={cx + rin * Math.cos(a)}
            y1={cy + rin * Math.sin(a)}
            x2={cx + rOuter * Math.cos(a)}
            y2={cy + rOuter * Math.sin(a)}
            stroke={major ? C.brass : C.brassDeep}
            strokeWidth={major ? 1 : 0.6}
            opacity={major ? 0.9 : 0.5}
          />
        );
      })}
      {/* measured arc */}
      <path
        d={`M ${cx} ${cy - rArc} A ${rArc} ${rArc} 0 ${largeArc} 1 ${arcX} ${arcY}`}
        fill="none"
        stroke={C.brassSoft}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {/* alidade pointer */}
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - rArc + 3}
          stroke={C.brassSoft}
          strokeWidth={1.4}
          opacity={0.85}
        />
        <circle cx={cx} cy={cy - rArc + 3} r={2.4} fill={C.brassSoft} />
      </g>
      <line
        x1={cx}
        y1={cy}
        x2={cx + (rArc - 6) * Math.cos(alidadeRad)}
        y2={cy + (rArc - 6) * Math.sin(alidadeRad)}
        stroke={C.brass}
        strokeWidth={0.6}
        opacity={0.3}
      />
      <circle cx={cx} cy={cy} r={2.2} fill={C.brass} />
      {label && (
        <text
          x={cx}
          y={cy - 1}
          textAnchor="middle"
          style={mono}
          fontSize={size > 120 ? 22 : 17}
          fill={C.brassSoft}
          fontWeight={600}
        >
          {label}
        </text>
      )}
      {sub && (
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          style={mono}
          fontSize={7.5}
          fill={C.muted}
          letterSpacing={1.5}
        >
          {sub}
        </text>
      )}
    </svg>
  );
}

// A fine engraved hairline in brass — section divider.
function Hairline({ strong = false, style }: { strong?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: strong
          ? `linear-gradient(90deg, transparent, ${C.lineBrassStrong} 12%, ${C.lineBrassStrong} 88%, transparent)`
          : `linear-gradient(90deg, transparent, ${C.lineBrass} 8%, ${C.lineBrass} 92%, transparent)`,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

function Kicker({ children, tone = "brass" }: { children: ReactNode; tone?: "brass" | "muted" }) {
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-[0.32em]"
      style={{ ...mono, color: tone === "brass" ? C.brass : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.verdigris };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.brassSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.ember };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.emberSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]"
      style={{
        ...sans,
        color,
        background: `${color}14`,
        border: `1px solid ${color}55`,
        borderRadius: 2,
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// Filled brass primary — engraved gold plate that warms on hover.
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-semibold tracking-[0.02em] transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.night,
        borderRadius: 3,
        background: hot
          ? `linear-gradient(180deg, ${C.brassSoft}, ${C.brass})`
          : `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
        boxShadow: hot
          ? `0 0 0 1px ${C.brassSoft}, 0 6px 20px -8px ${C.brass}`
          : `0 0 0 1px ${C.brassDeep}`,
      }}
    >
      {children}
    </button>
  );
}

// Outlined secondary — engraved brass frame on the panel.
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-semibold tracking-[0.02em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.brassSoft : C.fg,
        background: on ? "rgba(201,162,75,0.10)" : "transparent",
        border: `1px solid ${on ? C.lineBrassStrong : C.lineBrass}`,
        borderRadius: 3,
      }}
    >
      {children}
    </button>
  );
}

// Engraved panel card.
function Panel({
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
        background: `linear-gradient(180deg, ${C.panel}, ${C.nightSoft})`,
        border: `1px solid ${C.line}`,
        borderRadius: 6,
        boxShadow: `inset 0 1px 0 rgba(201,162,75,0.06)`,
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
      <div className="flex items-start gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center text-[15px] font-semibold tabular-nums"
          style={{
            ...mono,
            color: C.brass,
            border: `1px solid ${C.lineBrassStrong}`,
            borderRadius: 999,
          }}
          aria-hidden="true"
        >
          {SCREEN_INDEX[screenKey]}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1
            className="text-[30px] font-semibold leading-none tracking-tight sm:text-[38px]"
            style={{ ...serif, color: C.ink }}
          >
            {title}
          </h1>
          {sub && (
            <p
              className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              {sub}
            </p>
          )}
        </div>
      </div>
      <Hairline strong style={{ marginTop: 18 }} />
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      {/* Hero — the instrument head: title beside a large graduated ring pointing at the top match. */}
      <Panel className="relative mb-8 overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 opacity-[0.10]"
          aria-hidden="true"
        >
          <GraadRing size={280} value={68} ticks={72} />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[38px] font-semibold leading-[0.98] tracking-tight sm:text-[48px]"
              style={{ ...serif, color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Elke graad is gemeten. Het instrument wijst je naar wat past en wat nu je aandacht
              vraagt — niets meer, niets minder.
            </p>
            <div
              className="mt-5 inline-flex items-center gap-2.5 px-3.5 py-2"
              style={{ border: `1px solid ${C.lineBrass}`, borderRadius: 3 }}
            >
              <ShieldCheck
                size={15}
                strokeWidth={2}
                style={{ color: C.verdigris }}
                aria-hidden="true"
              />
              <span
                className="text-[12px] font-semibold tracking-[0.03em]"
                style={{ ...sans, color: C.fg }}
              >
                {PROFIEL.trust}
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center rounded-lg p-2 transition-colors ${RING}`}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <GraadRing
              size={148}
              value={top.match}
              label={`${top.match}°`}
              sub="BESTE MATCH"
              ticks={72}
            />
            <span
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.brass }}
            >
              Openen
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </Panel>

      {/* KPI ring-band. */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="flex items-center gap-3 p-4">
            <GraadRing size={62} value={Math.min(100, 40 + i * 15 + (k.up ? 20 : 0))} ticks={36} />
            <div className="min-w-0">
              <div
                className="text-[10px] font-medium uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </div>
              <div
                className="mt-1 text-[22px] font-semibold tabular-nums leading-none"
                style={{ ...serif, color: C.ink }}
              >
                {k.value}
              </div>
              <div
                className="mt-1 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.verdigris : C.ember }}
              >
                {k.trend}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Gemeten matches</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left transition-colors ${RING}`}
              >
                <Panel className="flex items-center gap-4 p-4 transition-colors group-hover:border-[rgba(201,162,75,0.45)]">
                  <GraadRing size={72} value={o.match} label={`${o.match}`} ticks={48} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-medium uppercase tracking-[0.2em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[17px] font-semibold leading-tight"
                      style={{ ...serif, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: C.brass }}
                    aria-hidden="true"
                  />
                </Panel>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Vraagt aandacht</Kicker>
          </div>
          <Panel className="divide-y p-1" style={{ borderColor: C.line }}>
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <div key={a.titel} className="p-3.5" style={{ borderColor: C.line }}>
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: warn ? C.ember : C.brass }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.ember : C.brass }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Panel>
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
        title="Marktplaats"
        sub="Elke opdracht ingemeten op de graadschaal — mét de redenen waarom ze past of schuurt."
      />

      <Panel className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.brass }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-45"
          style={{ ...sans, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${RING}`}
            style={{ ...sans, color: C.ember }}
          >
            Wis
          </button>
        )}
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Compass size={30} strokeWidth={1.5} style={{ color: C.brass }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...serif, color: C.ink }}
          >
            Geen peiling
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen match voor &ldquo;{query}&rdquo;. Verstel je zoekterm en meet opnieuw.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Panel
                key={o.id}
                className="p-5 transition-colors hover:border-[rgba(201,162,75,0.4)]"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-4 sm:flex-col sm:items-center">
                    <GraadRing
                      size={92}
                      value={o.match}
                      label={`${o.match}°`}
                      sub="MATCH"
                      ticks={60}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <Kicker>{o.id}</Kicker>
                    </div>
                    <h3
                      className="text-[19px] font-semibold leading-tight"
                      style={{ ...serif, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]"
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
                            style={{ color: C.muted }}
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
                          className="px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            ...sans,
                            color: C.fg,
                            border: `1px solid ${C.lineBrass}`,
                            borderRadius: 2,
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
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.night : C.brass,
                        background: isSaved ? C.brass : "transparent",
                        border: `1px solid ${C.lineBrass}`,
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
                      Bekijk
                      <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                    </BrassButton>
                  </div>
                </div>
              </Panel>
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
        <LineButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <Panel className="mb-6 p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <Kicker>{opdracht.id}</Kicker>
            </div>
            <h2
              className="text-[30px] font-semibold leading-[1.04] tracking-tight sm:text-[38px]"
              style={{ ...serif, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <GraadRing
              size={112}
              value={opdracht.match}
              label={`${opdracht.match}°`}
              sub="MATCH"
              ticks={72}
            />
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

        <Hairline strong style={{ marginTop: 20, marginBottom: 20 }} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label}>
              <m.Icon size={15} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="mt-0.5 text-[14.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Plus size={15} strokeWidth={2.6} style={{ color: C.verdigris }} aria-hidden="true" />
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
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
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.verdigris }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Minus size={15} strokeWidth={2.6} style={{ color: C.ember }} aria-hidden="true" />
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.06em]"
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
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ember }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
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
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </BrassButton>
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
        title="Verificatie"
        sub="Elk certificaat gepeild — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: `${color}12`, border: `1px solid ${color}44`, borderRadius: 4 }}
            >
              <Icon size={16} strokeWidth={2.2} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2}
          style={{ color: C.verdigris }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <Panel key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.lineBrassStrong}`,
                      background: done ? C.brass : "transparent",
                      color: C.night,
                      borderRadius: 999,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Panel>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.brass, border: `1px solid ${C.lineBrass}`, borderRadius: 3 }}
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
                className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.night : C.fg,
                  background: feedState === s ? C.brass : "transparent",
                  border: `1px solid ${C.lineBrass}`,
                  borderRadius: 3,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div className="h-3 w-2/3 animate-pulse rounded" style={{ background: C.line }} />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.line }}
                  />
                </Panel>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: `${C.ember}66` }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.ember }} aria-hidden="true" />
              <div className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <BrassButton onClick={() => setFeedState("ok")}>Opnieuw proberen</BrassButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...mono,
                      color: C.brass,
                      border: `1px solid ${C.lineBrass}`,
                      borderRadius: 3,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </Panel>
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
        title="Acties"
        sub="Wat vandaag om aandacht vraagt — gepeild en geordend."
      />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.2} style={{ color: C.verdigris }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...serif, color: C.ink }}
          >
            Alles gepeild
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer te doen vandaag. Het instrument staat op nul.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.brass }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-medium uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.lineBrassStrong}`,
                      background: isDone ? C.brass : "transparent",
                      color: C.night,
                      borderRadius: 999,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: isDone ? C.faint : warn ? C.ember : C.brass }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
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
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.ember : C.brass }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Panel>
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
    status === "Openstaand" ? C.ember : status === "Concept" ? C.muted : C.verdigris;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk ingemeten — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.verdigris },
          { label: "Openstaand", value: "€ 1.350", color: C.ember },
          { label: "Concept", value: "€ 880", color: C.brass },
        ].map((s) => (
          <Panel key={s.label} className="p-5">
            <div
              className="text-[10px] font-medium uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums"
              style={{ ...serif, color: s.color }}
            >
              {s.value}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineBrass}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em]"
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
                  style={{ borderBottom: `1px solid ${C.line}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.panelSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.brass }}
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
                    className="px-4 py-4 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...sans, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
                      style={{ ...sans, color: statusColor(f.status) }}
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
              <tr style={{ borderTop: `1px solid ${C.lineBrass}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...serif, color: C.brassSoft }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept298() {
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
      style={{ ...sans, color: C.fg, background: C.night }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center" aria-hidden="true">
              <GraadRing size={44} value={78} ticks={36} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...serif, color: C.ink }}
              >
                Astrolabium
              </div>
              <div
                className="text-[9px] font-medium uppercase tracking-[0.28em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP instrument
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.verdigris }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{
                ...serif,
                color: C.brass,
                border: `1px solid ${C.lineBrassStrong}`,
                borderRadius: 999,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <Hairline strong />
        <nav className="mb-8 mt-1 flex flex-wrap gap-1 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 px-3 py-2 text-[12.5px] font-semibold tracking-[0.02em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.brassSoft : C.fgSoft,
                  background: on ? "rgba(201,162,75,0.10)" : "transparent",
                  border: `1px solid ${on ? C.lineBrassStrong : "transparent"}`,
                  borderRadius: 3,
                }}
              >
                <span
                  className="text-[9.5px] font-medium tabular-nums"
                  style={{ ...mono, color: on ? C.brass : C.faint }}
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
              feedState={feedState}
              setFeedState={setFeedState}
            />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <Hairline strong style={{ marginTop: 36 }} />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: C.brass }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · astrolabium v298
          </span>
          <span className="uppercase tracking-[0.14em]">Messing · graadschaal · precisie</span>
        </footer>
      </div>
    </div>
  );
}
