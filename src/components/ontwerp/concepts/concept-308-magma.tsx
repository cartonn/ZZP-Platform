"use client";

// Concept 308 — "Magma" · premium-dark met molten energie. Diep obsidiaan/antraciet oppervlak met
// gloeiende lava-oranje/amber accenten uitsluitend op wat actie of urgentie vraagt; koele donkere
// rust waar het kan. Hoge dichtheid, WCAG-AA-contrast op donker. Gloed via boxShadow, nooit als
// decoratie — alleen om de blik naar de volgende beste actie te trekken.
// Fonts: display --font-lab-space · tekst --font-lab-geist · cijfers --font-lab-mono.

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
  Flame,
  Sparkles,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
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

// Obsidian surfaces, cool dark rest, molten lava accent reserved for action/urgency.
const C = {
  base: "#0c0d10",
  surface: "#131519",
  panel: "#181b21",
  panelSoft: "#1d2129",
  elevated: "#20242d",
  line: "#2a2f39",
  lineSoft: "#22262e",
  fg: "#eef0f4",
  fgSoft: "#c3c8d2",
  muted: "#8b93a1",
  faint: "#5b6270",
  lava: "#ff6a2b",
  lavaSoft: "#ff8a4c",
  amber: "#ffab45",
  ember: "#e0491c",
  glow: "rgba(255,106,43,0.55)",
  glowSoft: "rgba(255,106,43,0.22)",
  green: "#5fd08a",
  greenDim: "#3f9c66",
  amberWarn: "#ffc247",
  red: "#ff6b6b",
  steel: "#7fa8c9",
};

const display = { fontFamily: "var(--font-lab-space), ui-sans-serif, system-ui" };
const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a4c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d10]";

const CODE: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

// ---- Molten primitives ------------------------------------------------------

// The magma core — a match gauge whose filled arc glows lava, cooling to steel when it is low.
function MagmaCore({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const hot = value >= 85;
  const arc = hot ? C.lava : value >= 70 ? C.amber : C.steel;
  const gid = `magma-${size}-${value}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
      style={{ filter: hot ? `drop-shadow(0 0 6px ${C.glow})` : "none" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hot ? C.amber : arc} />
          <stop offset="1" stopColor={hot ? C.ember : arc} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.line} strokeWidth={5} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy + (label ? -1 : 6)}
        textAnchor="middle"
        style={display}
        fontSize={size > 88 ? 26 : 19}
        fill={C.fg}
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

// A tiny molten sparkline — bars that heat toward the latest value.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 22 }} aria-hidden="true">
      {data.map((v, i) => {
        const h = 6 + ((v - min) / span) * 16;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            style={{
              width: 4,
              height: h,
              borderRadius: 2,
              background: last ? C.lava : C.line,
              boxShadow: last ? `0 0 6px ${C.glowSoft}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function Kicker({ children, tone = "lava" }: { children: ReactNode; tone?: "lava" | "muted" }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color: tone === "lava" ? C.lavaSoft : C.muted }}
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
      return { label: "In beoordeling", Icon: Hourglass, color: C.amberWarn };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.lava };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
      style={{
        ...sans,
        color,
        background: `${color}1a`,
        border: `1px solid ${color}66`,
        borderRadius: 999,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Molten primary — a glowing lava pill that intensifies on hover.
function LavaButton({
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-semibold tracking-[0.01em] transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: "#180a04",
        background: hot
          ? `linear-gradient(180deg, ${C.amber}, ${C.lava})`
          : `linear-gradient(180deg, ${C.lavaSoft}, ${C.ember})`,
        border: "none",
        borderRadius: 8,
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: hot ? `0 0 22px ${C.glow}` : `0 0 10px ${C.glowSoft}`,
      }}
    >
      {children}
    </button>
  );
}

// Cool secondary — obsidian surface with a hairline, brightens on hover.
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-semibold tracking-[0.01em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.fg : C.fgSoft,
        background: on ? C.elevated : C.panelSoft,
        border: `1px solid ${on ? C.faint : C.line}`,
        borderRadius: 8,
      }}
    >
      {children}
    </button>
  );
}

// An obsidian panel with a faint top sheen.
function Panel({
  children,
  className,
  style,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glow?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: C.panel,
        border: `1px solid ${glow ? "rgba(255,106,43,0.4)" : C.line}`,
        borderRadius: 12,
        boxShadow: glow ? `0 0 24px ${C.glowSoft}` : "none",
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
          style={{
            ...mono,
            color: C.lavaSoft,
            background: C.panelSoft,
            border: `1px solid ${C.line}`,
            borderRadius: 6,
          }}
          aria-hidden="true"
        >
          <Flame size={12} strokeWidth={2.2} />
          {CODE[screenKey]}
        </span>
        <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="text-[30px] font-semibold leading-none tracking-tight sm:text-[40px]"
        style={{ ...display, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: C.muted }}
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
      {/* Hero — cool obsidian slab with the molten core as the single hot focal point. */}
      <div
        className="mb-8 overflow-hidden"
        style={{
          borderRadius: 16,
          border: `1px solid ${C.line}`,
          background: `radial-gradient(120% 140% at 88% 0%, ${C.panelSoft} 0%, ${C.surface} 55%)`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[36px] font-semibold leading-[0.98] tracking-tight sm:text-[48px]"
              style={{ ...display, color: C.fg }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.muted }}
            >
              De rust is donker en stil; alleen wat energie vraagt gloeit op. We tonen je de
              volgende beste actie — de rest houdt zich koel op de achtergrond.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 px-3 py-2"
                style={{ border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel }}
              >
                <ShieldCheck
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                <span className="text-[12px] font-semibold" style={{ ...sans, color: C.fg }}>
                  {PROFIEL.trust}
                </span>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-2"
                style={{
                  border: `1px solid rgba(255,106,43,0.4)`,
                  borderRadius: 8,
                  background: "rgba(255,106,43,0.08)",
                }}
              >
                <Zap size={15} strokeWidth={2.2} style={{ color: C.lava }} aria-hidden="true" />
                <span className="text-[12px] font-semibold" style={{ ...sans, color: C.lavaSoft }}>
                  3 hete matches
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ borderRadius: 12 }}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <MagmaCore value={top.match} size={150} label="BESTE MATCH" />
            <span
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.lavaSoft }}
            >
              <Flame
                size={11}
                strokeWidth={2.4}
                className="transition-transform group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              Ontsteek
            </span>
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.lavaSoft }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Hete matches</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING}`}
                style={{ borderRadius: 12 }}
              >
                <Panel
                  className="flex items-center gap-4 p-4 transition-all group-hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: "rgba(255,106,43,0.5)" }}
                >
                  <MagmaCore value={o.match} size={70} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-semibold leading-tight"
                      style={{ ...display, color: C.fg }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.lavaSoft }}
                    aria-hidden="true"
                  />
                </Panel>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Vraagt energie</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} glow={warn} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        color: warn ? "#180a04" : C.fgSoft,
                        background: warn ? C.lava : C.elevated,
                        borderRadius: 6,
                        boxShadow: warn ? `0 0 10px ${C.glowSoft}` : "none",
                      }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold leading-snug"
                        style={{ ...sans, color: C.fg }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.lavaSoft : C.steel }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Panel>
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
        title="Marktplaats"
        sub="Elke opdracht met haar match-temperatuur — de heetste matches gloeien, de rest blijft koel."
      />

      <Panel className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.lavaSoft }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.fg }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...sans, color: C.lavaSoft }}
          >
            Wis
          </button>
        )}
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Flame size={30} strokeWidth={1.6} style={{ color: C.faint }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...display, color: C.fg }}
          >
            Uitgedoofd
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <GhostButton onClick={() => setQuery("")}>Filter wissen</GhostButton>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const hot = o.match >= 85;
            return (
              <Panel key={o.id} glow={hot} className="p-5 transition-colors">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <MagmaCore value={o.match} size={92} label="MATCH" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Kicker>{o.id}</Kicker>
                      {hot && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                          style={{
                            ...mono,
                            color: C.lava,
                            background: "rgba(255,106,43,0.12)",
                            border: `1px solid rgba(255,106,43,0.4)`,
                            borderRadius: 999,
                          }}
                        >
                          <Flame size={10} strokeWidth={2.6} aria-hidden="true" />
                          Heet
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-[19px] font-semibold leading-tight"
                      style={{ ...display, color: C.fg }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
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
                            style={{ color: C.faint }}
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
                            color: C.fgSoft,
                            border: `1px solid ${C.line}`,
                            borderRadius: 999,
                            background: C.panelSoft,
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
                        color: isSaved ? C.lava : C.fgSoft,
                        background: isSaved ? "rgba(255,106,43,0.12)" : C.panelSoft,
                        border: `1px solid ${isSaved ? "rgba(255,106,43,0.5)" : C.line}`,
                        borderRadius: 8,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <LavaButton onClick={() => onOpen(o)}>
                      Bekijk
                      <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                    </LavaButton>
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
        <GhostButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </GhostButton>
      </div>

      <div
        className="mb-6 overflow-hidden"
        style={{
          borderRadius: 16,
          border: `1px solid ${C.line}`,
          background: `radial-gradient(120% 140% at 90% 0%, ${C.panelSoft} 0%, ${C.surface} 55%)`,
        }}
      >
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <Kicker>{opdracht.id}</Kicker>
              </div>
              <h2
                className="text-[30px] font-semibold leading-[1.02] tracking-tight sm:text-[40px]"
                style={{ ...display, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-2 text-[14px]" style={{ ...sans, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <MagmaCore value={opdracht.match} size={120} label="MATCH" />
              <GhostButton
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
              </GhostButton>
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
                style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10 }}
              >
                <m.Icon
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.lavaSoft }}
                  aria-hidden="true"
                />
                <div
                  className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="mt-0.5 text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: "rgba(95,208,138,0.14)", borderRadius: 7 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.green }} />
            </span>
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.fg }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fgSoft }}
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
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: "rgba(255,106,43,0.14)", borderRadius: 7 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.lava }} />
            </span>
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.fg }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.lava }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <LavaButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <Flame size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </LavaButton>
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
        screenKey="verificatie"
        title="Verificatie"
        sub="Elk certificaat een eigen kern — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: `${color}12`, border: `1px solid ${color}55`, borderRadius: 10 }}
            >
              <Icon size={16} strokeWidth={2.4} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.fg }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: C.green }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-semibold" style={{ ...display, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.muted }}>
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
                      border: `1px solid ${done ? C.lava : C.faint}`,
                      background: done ? C.lava : "transparent",
                      color: "#180a04",
                      borderRadius: 6,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
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
              style={{
                color: C.fgSoft,
                border: `1px solid ${C.line}`,
                borderRadius: 7,
                background: C.panelSoft,
              }}
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
                  color: feedState === s ? C.fg : C.muted,
                  background: feedState === s ? C.elevated : "transparent",
                  border: `1px solid ${feedState === s ? C.faint : C.line}`,
                  borderRadius: 7,
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
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.elevated }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.elevated }}
                  />
                </Panel>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: `${C.red}66` }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[15px] font-semibold" style={{ ...display, color: C.fg }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <LavaButton onClick={() => setFeedState("ok")}>Opnieuw proberen</LavaButton>
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
                      color: C.fgSoft,
                      background: C.elevated,
                      border: `1px solid ${C.line}`,
                      borderRadius: 7,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...sans, color: C.fg }}
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
        sub="Wat energie vraagt gloeit op — vink af en het dooft koel uit."
      />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Sparkles size={30} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...display, color: C.fg }}
          >
            Alles afgekoeld
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. De kern is rustig.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.lava, textShadow: `0 0 20px ${C.glowSoft}` }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} glow={warn && !isDone} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${isDone ? C.lava : C.faint}`,
                      background: isDone ? C.lava : "transparent",
                      color: "#180a04",
                      borderRadius: 6,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : warn ? "#180a04" : C.fgSoft,
                      background: isDone ? "transparent" : warn ? C.lava : C.elevated,
                      border: isDone ? `1px solid ${C.line}` : "none",
                      borderRadius: 6,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
                      style={{
                        ...sans,
                        color: C.fg,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.5 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ ...sans, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.lavaSoft : C.steel }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
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
    status === "Openstaand" ? C.lava : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.lava },
          { label: "Concept", value: "€ 880", color: C.fgSoft },
        ].map((s) => (
          <Panel key={s.label} className="p-5">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums"
              style={{ ...display, color: s.color }}
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
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.panelSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.lavaSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-4 text-[13px]" style={{ ...sans, color: C.fg }}>
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
                    style={{ ...sans, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
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
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...display, color: C.fg }}
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

export function Concept308() {
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
      style={{ ...sans, color: C.fgSoft, background: C.base }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{
                background: `linear-gradient(180deg, ${C.lavaSoft}, ${C.ember})`,
                borderRadius: 12,
                boxShadow: `0 0 16px ${C.glowSoft}`,
              }}
              aria-hidden="true"
            >
              <Flame size={20} strokeWidth={2.2} style={{ color: "#180a04" }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...display, color: C.fg }}
              >
                Magma
              </div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.26em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.muted }}
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
              className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
              style={{
                ...display,
                color: C.fg,
                background: C.elevated,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Nav — obsidian rail; the active tab ignites. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1 p-1"
            style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12 }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3 py-2 text-[12px] font-semibold tracking-[0.01em] transition-colors ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.fg : C.muted,
                    background: on ? C.elevated : "transparent",
                    border: `1px solid ${on ? "rgba(255,106,43,0.4)" : "transparent"}`,
                    borderRadius: 8,
                    boxShadow: on ? `0 0 14px ${C.glowSoft}` : "none",
                  }}
                >
                  <span
                    className="text-[9px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? C.lavaSoft : C.faint }}
                  >
                    {CODE[s.key]}
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
              style={{ background: C.lava, borderRadius: 999, boxShadow: `0 0 8px ${C.glow}` }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · magma v308
          </span>
          <span className="uppercase tracking-[0.14em]">Obsidiaan · gloed · energie</span>
        </footer>
      </div>
    </div>
  );
}
