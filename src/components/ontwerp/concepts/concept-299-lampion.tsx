"use client";

// Concept 299 — "Lampion" · papieren lantaarn / warme gloed (van donker naar gloed).
// Signature: warme diep-aubergine nacht met zachte lampion-gloed-cirkels (amber → koraal) als
// sfeerlicht; ronde, papierachtige kaarten die "oplichten" bij aandacht via zachte radial-gradients.
// Rustgevend en menselijk rond gevoelige documenten — geen neon, echte gloeilicht-bronnen. Leesbare,
// warme tekst met bewaakt contrast.
// Fonts: kop --font-lab-baloo (rond/warm) · tekst --font-lab-manrope · cijfers --font-lab-mono.

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
  Heart,
  Sparkle,
  ThumbsUp,
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

// Warm lantern palette. Deep aubergine night lifting into amber and coral glow.
const C = {
  night: "#1a1013",
  nightSoft: "#22161a",
  card: "#2a1b20",
  cardSoft: "#33212700",
  ink: "#fbeee0",
  fg: "#eddac6",
  fgSoft: "#c6a894",
  muted: "#9c7d6e",
  faint: "#6f564c",
  amber: "#f5a623",
  amberSoft: "#ffc766",
  coral: "#f0714a",
  coralSoft: "#ff9a72",
  glow: "rgba(245,166,35,0.20)",
  line: "rgba(245,166,35,0.16)",
  lineStrong: "rgba(245,166,35,0.34)",
  green: "#8fce9b",
};

const round = { fontFamily: "var(--font-lab-baloo), 'Comic Sans MS', system-ui, sans-serif" };
const sans = { fontFamily: "var(--font-lab-manrope), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc766] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1013]";

const SCREEN_ICON: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

// ---- Glow primitives --------------------------------------------------------

// A soft lantern glow-orb — the atmospheric light source. Pure CSS radial gradient, no neon.
function GlowOrb({
  size = 260,
  from = "rgba(245,166,35,0.30)",
  to = "rgba(240,113,74,0)",
  className,
  style,
}: {
  size?: number;
  from?: string;
  to?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`pointer-events-none absolute ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 50% 50%, ${from}, ${to} 70%)`,
        filter: "blur(6px)",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// A rounded paper lantern card that softly lights from within.
function Lantern({
  children,
  className,
  style,
  lit = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  lit?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: 20,
        background: lit
          ? `radial-gradient(120% 120% at 50% 0%, rgba(245,166,35,0.16), ${C.card} 60%)`
          : `linear-gradient(180deg, ${C.card}, ${C.nightSoft})`,
        border: `1px solid ${lit ? C.lineStrong : C.line}`,
        boxShadow: lit
          ? `0 0 0 1px rgba(245,166,35,0.12), 0 18px 44px -22px rgba(245,166,35,0.35)`
          : `inset 0 1px 0 rgba(255,199,102,0.05)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "muted" }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...mono, color: tone === "amber" ? C.amber : C.muted }}
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
      return { label: "In beoordeling", Icon: Hourglass, color: C.amberSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.coral };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold"
      style={{
        ...sans,
        color,
        background: `${color}1f`,
        border: `1px solid ${color}44`,
        borderRadius: 999,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// A glowing match ring — warm radial fill.
function MatchGlow({ value, size = 64 }: { value: number; size?: number }) {
  const high = value >= 90;
  const deg = (value / 100) * 360;
  const color = high ? C.amberSoft : C.amber;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${color} ${deg}deg, rgba(245,166,35,0.10) ${deg}deg)`,
          filter: high ? "drop-shadow(0 0 6px rgba(245,166,35,0.5))" : "none",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute rounded-full"
        style={{
          inset: 5,
          background: `radial-gradient(circle at 50% 35%, ${C.nightSoft}, ${C.night})`,
        }}
        aria-hidden="true"
      />
      <span
        className="relative text-[15px] font-semibold tabular-nums leading-none"
        style={{ ...mono, color: high ? C.amberSoft : C.ink }}
      >
        {value}
      </span>
    </div>
  );
}

// Warm filled primary — glowing amber pill.
function GlowButton({
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.night,
        borderRadius: 999,
        background: `linear-gradient(180deg, ${C.amberSoft}, ${C.amber})`,
        boxShadow: hot
          ? `0 0 0 1px ${C.amberSoft}, 0 10px 26px -10px rgba(245,166,35,0.7)`
          : `0 4px 14px -8px rgba(245,166,35,0.5)`,
      }}
    >
      {children}
    </button>
  );
}

// Soft secondary — warm outlined pill.
function SoftButton({
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-semibold transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.amberSoft : C.fg,
        background: on ? "rgba(245,166,35,0.12)" : "transparent",
        border: `1px solid ${on ? C.lineStrong : C.line}`,
        borderRadius: 999,
      }}
    >
      {children}
    </button>
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
          className="flex h-9 items-center gap-2 rounded-full px-3 text-[11px] font-semibold tabular-nums"
          style={{
            ...mono,
            color: C.amber,
            background: "rgba(245,166,35,0.12)",
            border: `1px solid ${C.line}`,
          }}
          aria-hidden="true"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.amber }} />
          {SCREEN_ICON[screenKey]}
        </span>
      </div>
      <h1
        className="mt-3 text-[30px] font-semibold leading-none tracking-tight sm:text-[38px]"
        style={{ ...round, color: C.ink }}
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
      <Lantern lit className="relative mb-8 overflow-hidden p-6 sm:p-8">
        <GlowOrb size={320} className="-right-24 -top-28" />
        <GlowOrb
          size={200}
          from="rgba(240,113,74,0.22)"
          to="rgba(240,113,74,0)"
          className="-bottom-24 left-10"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[36px] font-semibold leading-[1.0] tracking-tight sm:text-[46px]"
              style={{ ...round, color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fg }}
            >
              Alles wat telt licht zachtjes op. We houden je documenten warm bewaard en wijzen je
              rustig naar wat nu je aandacht vraagt.
            </p>
            <div
              className="mt-5 inline-flex items-center gap-2.5 rounded-full px-3.5 py-2"
              style={{
                background: "rgba(143,206,155,0.12)",
                border: `1px solid rgba(143,206,155,0.3)`,
              }}
            >
              <ShieldCheck
                size={15}
                strokeWidth={2.2}
                style={{ color: C.green }}
                aria-hidden="true"
              />
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.trust}
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center rounded-2xl p-3 transition-transform hover:-translate-y-0.5 ${RING}`}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <MatchGlow value={top.match} size={112} />
            <span
              className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.amber }}
            >
              Beste match
            </span>
            <span
              className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ ...sans, color: C.amberSoft }}
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
      </Lantern>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Lantern key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.coral }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...round, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3 flex h-1.5 gap-0.5" aria-hidden="true">
              {k.spark.map((v, si) => {
                const max = Math.max(...k.spark);
                return (
                  <div
                    key={si}
                    className="flex-1 self-end rounded-full"
                    style={{
                      height: `${Math.max(20, (v / max) * 100)}%`,
                      background: si === k.spark.length - 1 ? C.amber : "rgba(245,166,35,0.3)",
                    }}
                  />
                );
              })}
            </div>
          </Lantern>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Matches die oplichten</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING} rounded-[20px]`}
              >
                <Lantern className="flex items-center gap-4 p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-[rgba(245,166,35,0.34)]">
                  <MatchGlow value={o.match} size={58} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-semibold leading-tight"
                      style={{ ...round, color: C.ink }}
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
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  />
                </Lantern>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Vraagt aandacht</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <Lantern key={a.titel} className="p-4">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: warn ? C.coral : C.amber,
                        boxShadow: `0 0 6px ${warn ? C.coral : C.amber}`,
                      }}
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
                        style={{ ...sans, color: warn ? C.coral : C.amber }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Lantern>
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
        sub="Opdrachten die bij je passen lichten op — mét de redenen waarom, warm en eerlijk."
      />

      <Lantern className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.amber }} aria-hidden="true" />
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
            className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...sans, color: C.coral }}
          >
            Wis
          </button>
        )}
      </Lantern>

      {filtered.length === 0 ? (
        <Lantern className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Sparkle size={30} strokeWidth={1.6} style={{ color: C.amber }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...round, color: C.ink }}
          >
            Nog even donker
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <SoftButton onClick={() => setQuery("")}>Filter wissen</SoftButton>
          </div>
        </Lantern>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Lantern
                key={o.id}
                className="p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(245,166,35,0.34)]"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <MatchGlow value={o.match} size={76} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <Kicker>{o.id}</Kicker>
                    </div>
                    <h3
                      className="text-[19px] font-semibold leading-tight"
                      style={{ ...round, color: C.ink }}
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
                          className="rounded-full px-3 py-0.5 text-[11px] font-semibold"
                          style={{
                            ...sans,
                            color: C.fg,
                            background: "rgba(245,166,35,0.10)",
                            border: `1px solid ${C.line}`,
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
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.night : C.amber,
                        background: isSaved ? C.amber : "transparent",
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <GlowButton onClick={() => onOpen(o)}>
                      Bekijk
                      <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                    </GlowButton>
                  </div>
                </div>
              </Lantern>
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
        <SoftButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </SoftButton>
      </div>

      <Lantern lit className="relative mb-6 overflow-hidden p-6 sm:p-7">
        <GlowOrb size={260} className="-right-20 -top-24" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <Kicker>{opdracht.id}</Kicker>
            </div>
            <h2
              className="text-[30px] font-semibold leading-[1.05] tracking-tight sm:text-[38px]"
              style={{ ...round, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <MatchGlow value={opdracht.match} size={96} />
            <SoftButton
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
            </SoftButton>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl p-3"
              style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${C.line}` }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="mt-0.5 text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Lantern>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Lantern className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <ThumbsUp size={15} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
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
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Lantern>
        <Lantern className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <TriangleAlert
              size={15}
              strokeWidth={2.4}
              style={{ color: C.coral }}
              aria-hidden="true"
            />
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
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
                  style={{ color: C.coral }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Lantern>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <GlowButton
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
        </GlowButton>
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
        sub="Je certificaten, warm bewaard. Elke status heeft een eigen label én icoon — nooit kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
              style={{ background: `${color}14`, border: `1px solid ${color}40` }}
            >
              <Icon size={16} strokeWidth={2.4} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Lantern lit className="relative mb-6 overflow-hidden p-5">
        <GlowOrb
          size={200}
          from="rgba(143,206,155,0.18)"
          to="rgba(143,206,155,0)"
          className="-right-16 -top-16"
        />
        <div className="relative flex items-start gap-4">
          <ShieldCheck
            size={24}
            strokeWidth={2.2}
            style={{ color: C.green }}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          <div>
            <div className="text-[15px] font-semibold" style={{ ...round, color: C.ink }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fg }}>
              Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </Lantern>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <Lantern key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.lineStrong}`,
                      background: done ? C.amber : "transparent",
                      color: C.night,
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
                </Lantern>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${RING}`}
              style={{ color: C.amber, border: `1px solid ${C.line}` }}
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.night : C.fg,
                  background: feedState === s ? C.amber : "transparent",
                  border: `1px solid ${C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Lantern key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: "rgba(245,166,35,0.12)" }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: "rgba(245,166,35,0.12)" }}
                  />
                </Lantern>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Lantern
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: `${C.coral}55` }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.coral }} aria-hidden="true" />
              <div className="text-[15px] font-semibold" style={{ ...round, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <GlowButton onClick={() => setFeedState("ok")}>Opnieuw proberen</GlowButton>
              </div>
            </Lantern>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Lantern key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                    style={{
                      ...mono,
                      color: C.amber,
                      background: "rgba(245,166,35,0.10)",
                      border: `1px solid ${C.line}`,
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
                </Lantern>
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
        sub="Wat vandaag om aandacht vraagt — rustig en overzichtelijk."
      />

      {openCount === 0 ? (
        <Lantern lit className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Heart size={30} strokeWidth={2.2} style={{ color: C.amber }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...round, color: C.ink }}
          >
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer te doen vandaag. Doe rustig aan.
          </p>
        </Lantern>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...round, color: C.amber }}
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
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Lantern key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.lineStrong}`,
                      background: isDone ? C.amber : "transparent",
                      color: C.night,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: isDone ? C.faint : warn ? C.coral : C.amber,
                      boxShadow: isDone ? "none" : `0 0 6px ${warn ? C.coral : C.amber}`,
                    }}
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
                        style={{ ...sans, color: warn ? C.coral : C.amber }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Lantern>
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
    status === "Openstaand" ? C.coral : status === "Concept" ? C.muted : C.green;
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
          { label: "Openstaand", value: "€ 1.350", color: C.coral },
          { label: "Concept", value: "€ 880", color: C.amber },
        ].map((s) => (
          <Lantern key={s.label} className="p-5">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums"
              style={{ ...round, color: s.color }}
            >
              {s.value}
            </div>
          </Lantern>
        ))}
      </div>

      <Lantern className="overflow-hidden">
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
                  style={{ borderBottom: `1px solid rgba(245,166,35,0.08)` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,166,35,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.amber }}
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
                  style={{ ...round, color: C.amberSoft }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Lantern>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept299() {
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
      style={{ ...sans, color: C.fg, background: C.night }}
    >
      <GlowOrb size={420} className="-left-40 -top-40" style={{ opacity: 0.5 }} />
      <GlowOrb
        size={360}
        from="rgba(240,113,74,0.14)"
        to="rgba(240,113,74,0)"
        className="-bottom-40 right-0"
        style={{ opacity: 0.6 }}
      />
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${C.amberSoft}, ${C.coral})`,
                boxShadow: `0 0 18px -2px rgba(245,166,35,0.6)`,
              }}
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: C.night }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...round, color: C.ink }}
              >
                Lampion
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
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
              style={{
                ...round,
                color: C.amber,
                background: "rgba(245,166,35,0.12)",
                border: `1px solid ${C.lineStrong}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.night : C.fgSoft,
                  background: on
                    ? `linear-gradient(180deg, ${C.amberSoft}, ${C.amber})`
                    : "transparent",
                  border: `1px solid ${on ? "transparent" : C.line}`,
                  boxShadow: on ? `0 4px 14px -8px rgba(245,166,35,0.6)` : "none",
                }}
              >
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

        <div
          className="mt-9 h-px w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${C.line}, transparent)` }}
          aria-hidden="true"
        />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: C.amber, boxShadow: `0 0 6px ${C.amber}` }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · lampion v299
          </span>
          <span className="uppercase tracking-[0.14em]">Warm licht · papier · rust</span>
        </footer>
      </div>
    </div>
  );
}
