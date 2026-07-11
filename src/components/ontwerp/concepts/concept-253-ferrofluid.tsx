"use client";

// Concept 253 — "Ferrofluid" · Magnetische vloeistof op bijna-zwart glans.
// Signatuur: zwarte glanzende, licht-stekelige magnetische-vloeistof blobs als accent-vormen
// en scheidingen. Gemaakt met een SVG "goo"-filter (feGaussianBlur + feColorMatrix) plus een
// radiale rim-light zodat de blobs als glossy metaal lezen — scherp en spiegelend, niet zacht
// pastel. Iriserend violet/cyaan rim-light (#8b5cf6 / #22d3ee) reageert subtiel op hover. Alle
// blobs zijn puur decoratief (aria-hidden). Tekst haalt WCAG AA op de donkere ondergrond.
// Fonts: Space Grotesk (koppen) + JetBrains Mono (cijfers/labels).

import { useState, useId, type CSSProperties } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  TrendingUp,
  TrendingDown,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileText,
  RefreshCw,
  CircleAlert,
  Inbox,
  Plus,
  Minus,
  Droplet,
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

// Near-black glossy palette with iridescent violet/cyan rim-light.
const C = {
  bg: "#050507",
  panel: "#0d0d12",
  panelSoft: "#131319",
  line: "rgba(139,92,246,0.16)",
  lineSoft: "rgba(255,255,255,0.06)",
  ink: "#f2f0fb",
  inkSoft: "#c3c0d6",
  muted: "#8e8ba6",
  faint: "#605d78",
  violet: "#8b5cf6",
  violetSoft: "rgba(139,92,246,0.16)",
  cyan: "#22d3ee",
  cyanSoft: "rgba(34,211,238,0.14)",
  green: "#34d399",
  greenSoft: "rgba(52,211,153,0.14)",
  warn: "#fbbf24",
  warnSoft: "rgba(251,191,36,0.14)",
  red: "#fb7185",
  redSoft: "rgba(251,113,133,0.14)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const body = { fontFamily: "var(--font-lab-space)" };

const iris = `linear-gradient(120deg, ${C.violet} 0%, ${C.cyan} 100%)`;

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Droplet,
};

// Decorative ferrofluid blob cluster: glossy black spikes fused by a goo filter, with an
// iridescent rim-light. Purely decorative — aria-hidden. Subtly shifts on group hover.
function Blobs({ tone = "violet" }: { tone?: "violet" | "cyan" | "duo" }) {
  const id = useId().replace(/:/g, "");
  const rim = tone === "cyan" ? C.cyan : C.violet;
  const rim2 = tone === "duo" ? C.cyan : rim;
  return (
    <svg
      className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 opacity-90 transition-transform duration-700 ease-out group-hover:-translate-y-1 group-hover:translate-x-1.5"
      viewBox="0 0 160 160"
      aria-hidden="true"
    >
      <defs>
        <filter id={`goo-${id}`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
        <radialGradient id={`rim-${id}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#2a2a34" />
          <stop offset="55%" stopColor="#0c0c11" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>
      <g filter={`url(#goo-${id})`}>
        <circle cx="86" cy="66" r="30" fill={`url(#rim-${id})`} />
        <circle cx="112" cy="92" r="20" fill={`url(#rim-${id})`} />
        <circle cx="60" cy="98" r="15" fill={`url(#rim-${id})`} />
        <circle cx="118" cy="52" r="10" fill={`url(#rim-${id})`} />
      </g>
      {/* iridescent rim highlights sit on top of the fused mass */}
      <circle cx="76" cy="52" r="7" fill={rim} opacity="0.85" />
      <circle cx="104" cy="84" r="4.5" fill={rim2} opacity="0.8" />
      <circle cx="90" cy="60" r="24" fill="none" stroke={rim} strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.cyan, bg: C.cyanSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: fg, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function panelStyle(): CSSProperties {
  return {
    background: `radial-gradient(120% 120% at 20% 0%, ${C.panelSoft} 0%, ${C.panel} 60%)`,
    border: `1px solid ${C.lineSoft}`,
    borderRadius: 20,
    boxShadow: "0 20px 50px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
  };
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 76 - 12;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.cyan}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 0 3px rgba(34,211,238,0.5))" }}
      />
    </svg>
  );
}

function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1
        className="text-[27px] font-bold leading-tight tracking-tight sm:text-[31px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...mono, color: C.muted }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div>
      <div className="mb-6">
        <div
          className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.cyan }}
        >
          <Droplet size={12} strokeWidth={2.6} aria-hidden="true" />
          Magnetisch veld
        </div>
        <h1
          className="text-[27px] font-bold leading-tight tracking-tight sm:text-[31px]"
          style={{ ...display, color: C.ink }}
        >
          Alles trekt naar wat telt
        </h1>
        <p className="mt-1.5 text-[13.5px]" style={{ ...mono, color: C.muted }}>
          Eén punt vraagt vandaag aandacht — de rest ligt in balans.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} className="group relative overflow-hidden p-4" style={panelStyle()}>
              {i === 0 && <Blobs tone="duo" />}
              <div className="relative">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium" style={{ ...mono, color: C.muted }}>
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.warn }}
                  >
                    <Trend size={12} strokeWidth={2.6} aria-hidden="true" />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[26px] font-bold tabular-nums leading-none"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-3">
                  <Sparkline data={k.spark} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="h-4 w-1.5 rounded-full"
              style={{ background: iris }}
              aria-hidden="true"
            />
            <h2 className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
              Sterkste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className="group relative flex w-full items-center gap-4 overflow-hidden p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
            style={panelStyle()}
          >
            <Blobs tone="violet" />
            <span
              className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
              style={{ background: iris, boxShadow: "inset 0 2px 6px rgba(255,255,255,0.3)" }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-bold tabular-nums" style={display}>
                {top.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div className="relative min-w-0 flex-1">
              <div
                className="text-[17px] font-bold leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ ...mono, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ ...mono, background: C.violetSoft, color: C.violet }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="relative shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.cyan }}
              aria-hidden="true"
            />
          </button>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPDRACHTEN.slice(1).map((o) => (
              <div key={o.id} className="p-4" style={panelStyle()}>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.cyan }}
                  >
                    {o.match}% match
                  </span>
                  <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
                    {o.plaats}
                  </span>
                </div>
                <div
                  className="mt-2 text-[14px] font-semibold leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {o.titel}
                </div>
                <div className="mt-1 text-[12px]" style={{ ...mono, color: C.muted }}>
                  {o.tarief} · {o.uren}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="h-4 w-1.5 rounded-full"
              style={{ background: iris }}
              aria-hidden="true"
            />
            <h2 className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
              Vandaag
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <li key={a.titel} className="p-4" style={panelStyle()}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: a.urgentie === "warning" ? C.warn : C.cyan,
                      boxShadow: `0 0 8px ${a.urgentie === "warning" ? C.warn : C.cyan}`,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[13px] font-semibold leading-snug"
                    style={{ ...body, color: C.ink }}
                  >
                    {a.titel}
                  </span>
                </div>
                <p
                  className="mt-1.5 pl-4 text-[12px] leading-relaxed"
                  style={{ ...mono, color: C.muted }}
                >
                  {a.detail}
                </p>
              </li>
            ))}
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
        title="Marktplaats"
        sub="Opdrachten trekken samen op relevantie. De verklaarde match laat zien waarom — en waar je op moet letten."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={panelStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.violet }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
            style={{ ...body, color: C.violet, background: C.violetSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="group relative flex flex-col items-center gap-3 overflow-hidden px-6 py-14 text-center"
          style={panelStyle()}
        >
          <Blobs tone="duo" />
          <span
            className="relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.violetSoft, color: C.violet }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={2} />
          </span>
          <h3 className="relative text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Geen resultaten
          </h3>
          <p className="relative max-w-xs text-[13px]" style={{ ...mono, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className="relative mt-1 rounded-full px-5 py-2 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
            style={{ ...body, background: iris }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="group relative flex h-full flex-col overflow-hidden p-5"
                style={panelStyle()}
              >
                {i === 0 && <Blobs tone="violet" />}
                <div className="relative flex items-start justify-between gap-3">
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
                    style={{ background: iris, boxShadow: "inset 0 2px 6px rgba(255,255,255,0.3)" }}
                    aria-hidden="true"
                  >
                    <span className="text-[17px] font-bold tabular-nums" style={display}>
                      {o.match}
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider">match</span>
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    style={{
                      background: isSaved ? C.violetSoft : C.panelSoft,
                      color: isSaved ? C.violet : C.muted,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="relative mt-3 text-[16px] font-bold leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="relative mt-0.5 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...mono, color: C.inkSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <button
                  onClick={() => onOpen(o)}
                  className="relative mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
                  style={{ ...body, background: iris }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={2.4}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </article>
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
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
        style={{
          ...body,
          color: C.inkSoft,
          background: C.panelSoft,
          border: `1px solid ${C.lineSoft}`,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="group relative overflow-hidden p-6" style={panelStyle()}>
        <Blobs tone="duo" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
              style={{ background: iris, boxShadow: "inset 0 2px 6px rgba(255,255,255,0.3)" }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-bold tabular-nums" style={display}>
                {opdracht.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div>
              <h2
                className="text-[23px] font-bold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...mono, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
            style={{
              ...body,
              color: isSaved ? C.violet : C.inkSoft,
              background: isSaved ? C.violetSoft : C.panelSoft,
              border: `1px solid ${C.lineSoft}`,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: C.panelSoft }}>
              <m.Icon size={15} style={{ color: C.violet }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-bold" style={{ ...display, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.inkSoft }}
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
        </div>
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.warnSoft, color: C.warn }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-bold" style={{ ...display, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.inkSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
          style={{
            ...body,
            background: applied ? C.green : "",
            backgroundImage: applied ? "none" : iris,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Je reactie is verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...mono, color: C.muted }}>
            De opdrachtgever reageert gemiddeld binnen 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie({
  feedState,
  setFeedState,
}: {
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  return (
    <div>
      <ScreenHead
        title="Verificatie & documenten"
        sub="Server-side de waarheid. Je gevoelige documenten blijven privé en versleuteld bewaard."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => (
            <div key={c.naam} className="flex items-center gap-3 p-4" style={panelStyle()}>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.violetSoft, color: C.violet }}
                aria-hidden="true"
              >
                <ShieldCheck size={18} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                  {c.naam}
                </div>
                <div className="text-[12px]" style={{ ...mono, color: C.muted }}>
                  {c.detail}
                </div>
              </div>
              <StatusChip status={c.status} />
            </div>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-bold"
              style={{ ...display, color: C.ink }}
            >
              <FileText
                size={17}
                strokeWidth={2.2}
                style={{ color: C.violet }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
              style={{ background: C.panelSoft, color: C.violet }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                style={{
                  ...body,
                  color: feedState === s ? "#0b0b10" : C.muted,
                  background: feedState === s ? C.violet : C.panelSoft,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={panelStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.panelSoft }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.panelSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={panelStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ ...mono, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
                style={{ ...body, background: C.violet }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={panelStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                    style={{ ...mono, background: C.violetSoft, color: C.violet }}
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
                  <StatusChip status={d.status} />
                </li>
              ))}
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
      <ScreenHead title="Acties" sub="Wat vraagt vandaag je aandacht — vink af wat klaar is." />

      {openCount === 0 ? (
        <div
          className="group relative flex flex-col items-center gap-3 overflow-hidden px-6 py-16 text-center"
          style={panelStyle()}
        >
          <Blobs tone="duo" />
          <span
            className="relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.greenSoft, color: C.green }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.4} />
          </span>
          <h3 className="relative text-[20px] font-bold" style={{ ...display, color: C.ink }}>
            Alles afgerond
          </h3>
          <p className="relative max-w-xs text-[13px]" style={{ ...mono, color: C.muted }}>
            Niets meer te doen vandaag.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: C.violetSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ ...mono, background: iris }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[13px] font-semibold" style={{ ...body, color: C.violet }}>
              {openCount} open {openCount === 1 ? "actie" : "acties"}
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <li key={a.titel} className="flex items-start gap-4 p-5" style={panelStyle()}>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.lineSoft}`,
                      background: isDone ? C.green : "transparent",
                      color: "#06110c",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
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
                      style={{ ...mono, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.warn : C.violet,
                          background: a.urgentie === "warning" ? C.warnSoft : C.violetSoft,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.warn, bg: C.warnSoft }
        : { fg: C.muted, bg: C.panelSoft };
  return (
    <div>
      <ScreenHead title="Facturen" sub="Overzicht van je omzet en openstaande posten." />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.warn },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panelStyle()}>
            <div className="text-[11.5px] font-medium" style={{ ...mono, color: C.muted }}>
              {s.label}
            </div>
            <div
              className="mt-1 text-[22px] font-bold tabular-nums"
              style={{ ...display, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden p-2" style={panelStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = badgeTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#131319]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.violet }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ ...body, color: t.fg, background: t.bg }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={3} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={11} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <FileText size={11} strokeWidth={2.6} aria-hidden="true" />
                        )}
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept253() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
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
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{
                background: iris,
                boxShadow:
                  "inset 0 2px 6px rgba(255,255,255,0.35), 0 6px 16px -6px rgba(139,92,246,0.6)",
              }}
              aria-hidden="true"
            >
              <Droplet size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Ferrofluid
              </div>
              <div
                className="text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                Magnetische vloeistof · ZZP platform
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
                style={{ ...mono, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-bold text-white"
              style={{
                ...display,
                background: iris,
                boxShadow: "inset 0 2px 6px rgba(255,255,255,0.3)",
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
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                style={{
                  ...body,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? "" : C.panel,
                  backgroundImage: on ? iris : "none",
                  border: `1px solid ${on ? "transparent" : C.lineSoft}`,
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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
            <Verificatie feedState={feedState} setFeedState={setFeedState} />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
          style={{ ...mono, borderColor: C.lineSoft, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Droplet size={12} strokeWidth={2.2} style={{ color: C.cyan }} aria-hidden="true" />
            Glossy magnetische vloeistof · iriserend violet/cyaan
          </span>
          <span>#8b5cf6 · #22d3ee</span>
        </footer>
      </div>
    </div>
  );
}
