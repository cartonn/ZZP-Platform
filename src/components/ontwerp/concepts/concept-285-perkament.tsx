"use client";

// Concept 285 — "Perkament" · Middeleeuws manuscript / vellum (warm light).
// Signature: een verouderd perkament/vellum-oppervlak (warme sepia met subtiele vlek-textuur via
// gradients), een geïllumineerde initiaal (grote sierletter) op het dashboard, een wax-seal /
// lakzegel-motief als vertrouwens- en verificatie-symbool (geverifieerde credential = zegel), rode
// rubricering voor koppen en een ganzenveer-elegante serif. Vertrouwen via de autoriteit van een
// eeuwenoud document — historisch manuscript, geen modern-editoriaal.
// Fonts: --font-lab-cormorant (sier-serif / display) + --font-lab-newsreader (leesbare serif).

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
  ScrollText,
  RefreshCw,
  CircleAlert,
  Plus,
  Minus,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Hourglass,
  Feather,
  Stamp,
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

// Vellum palette. Warm sepia parchment, rubrication red, iron-gall ink brown, wax-seal crimson.
const C = {
  vellum: "#f0e6d2",
  vellum2: "#e9dcc2",
  page: "#f6efdd",
  pageDeep: "#efe4cc",
  line: "#d8c6a2",
  lineSoft: "#e3d6b8",
  ink: "#3a2c1a",
  fg: "#4a3a26",
  fgSoft: "#6b5940",
  muted: "#8f7c5f",
  faint: "#ab9878",
  rubric: "#a12f26",
  rubricSoft: "#ecd4c9",
  wax: "#8f2b2b",
  waxDeep: "#6f1f1f",
  waxSoft: "#ecccc4",
  gilt: "#a9822f",
  giltSoft: "#eeddb8",
  giltPale: "#f2e6c4",
  forest: "#4f6b3a",
  forestSoft: "#dbe1c6",
  azure: "#2f5878",
  azureSoft: "#cdd9e2",
};

const serif = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: ScrollText,
  berichten: Search,
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a12f26] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0e6d2]";

// The aged vellum surface — layered warm stains and a faint foxing wash, no gloss.
function vellumStains(): string {
  return [
    `radial-gradient(60% 45% at 14% 10%, ${C.vellum2} 0%, transparent 60%)`,
    `radial-gradient(50% 40% at 88% 20%, #e6d7ba 0%, transparent 55%)`,
    `radial-gradient(70% 55% at 78% 92%, ${C.vellum2} 0%, transparent 60%)`,
    `radial-gradient(40% 30% at 30% 80%, #e8dabb 0%, transparent 55%)`,
  ].join(", ");
}

// ---- Primitives -------------------------------------------------------------

function panelStyle(): CSSProperties {
  return {
    background: C.page,
    border: `1px solid ${C.line}`,
    borderRadius: 6,
  };
}

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
    <div className={className} style={{ ...panelStyle(), ...style }}>
      {children}
    </div>
  );
}

// A wax seal — the trust/verification motif. A crimson disc with an emblem pressed into it.
function WaxSeal({
  size = 44,
  tone = C.wax,
  children,
}: {
  size?: number;
  tone?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${tone} 0%, ${C.waxDeep} 90%)`,
        border: `1px solid ${C.waxDeep}`,
        color: C.giltPale,
        boxShadow: `inset 0 0 0 3px rgba(255,255,255,0.08)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[3px] rounded-full"
        style={{ border: `1px dashed rgba(242,230,196,0.4)` }}
      />
      {children}
    </span>
  );
}

// Verification status vocabulary — label + icon + a manuscript tone.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Bezegeld", Icon: BadgeCheck, tone: C.forest, soft: C.forestSoft };
    case "SUBMITTED":
      return { label: "Ter inzage", Icon: Hourglass, tone: C.azure, soft: C.azureSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.gilt, soft: C.giltSoft };
    case "REJECTED":
      return { label: "Verworpen", Icon: XCircle, tone: C.wax, soft: C.waxSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ ...serif, color: tone, background: soft, borderColor: tone }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.forest : value >= 82 ? C.gilt : C.wax;
  const soft = value >= 90 ? C.forestSoft : value >= 82 ? C.giltSoft : C.waxSoft;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
      style={{ background: soft, borderColor: tone }}
      aria-label={`Overeenkomst ${value} procent`}
    >
      <span
        className={`font-semibold tabular-nums leading-none ${size === "sm" ? "text-[17px]" : "text-[22px]"}`}
        style={{ ...display, color: tone }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.16em]"
        style={{ ...serif, color: tone }}
      >
        overeen
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
    const y = 100 - ((v - min) / span) * 64 - 18;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Filled button — an ink-stamped plate. Deepens on hover.
function InkButton({
  children,
  onClick,
  tone = C.wax,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
      style={{ ...serif, color: C.giltPale, background: hot ? C.ink : tone }}
    >
      {children}
    </button>
  );
}

// Outline "quill line" secondary button — washes a soft tone on hover.
function QuillButton({
  children,
  onClick,
  tone = C.gilt,
  soft = C.giltSoft,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  soft?: string;
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
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
      style={{
        ...serif,
        color: tone,
        background: on ? soft : "transparent",
        borderColor: on ? tone : C.line,
      }}
    >
      {children}
    </button>
  );
}

// A rubricated heading — a small red mark and small-caps label, like a manuscript rubric.
function Rubric({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="text-[15px] leading-none"
        style={{ ...display, color: C.rubric }}
        aria-hidden="true"
      >
        ❧
      </span>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.28em]"
        style={{ ...serif, color: C.rubric }}
      >
        {children}
      </span>
    </span>
  );
}

function ScreenHead({ rubric, title, sub }: { rubric: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <div className="mb-3">
        <Rubric>{rubric}</Rubric>
      </div>
      <h1
        className="text-[34px] font-medium leading-tight tracking-tight sm:text-[42px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-2xl text-[15px] leading-relaxed"
          style={{ ...serif, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// The illuminated initial — a large decorated drop-cap in a gilt frame.
function IlluminatedInitial({ letter }: { letter: string }) {
  return (
    <span
      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-md sm:h-24 sm:w-24"
      style={{
        background: `linear-gradient(135deg, ${C.giltPale} 0%, ${C.giltSoft} 100%)`,
        border: `2px solid ${C.gilt}`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-1.5 rounded-sm"
        style={{ border: `1px solid ${C.gilt}`, opacity: 0.55 }}
      />
      <span
        className="text-[52px] leading-none sm:text-[64px]"
        style={{ ...display, color: C.wax }}
      >
        {letter}
      </span>
    </span>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0] ?? PROFIEL.naam;
  const kpiTones = [C.wax, C.forest, C.gilt, C.azure];
  return (
    <div>
      <div
        className="mb-10 overflow-hidden rounded-lg px-7 py-8 sm:px-9 sm:py-10"
        style={{
          border: `1px solid ${C.line}`,
          background: C.pageDeep,
          backgroundImage: vellumStains(),
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <IlluminatedInitial letter={voornaam.charAt(0)} />
            <div className="min-w-0">
              <div className="mb-2">
                <Rubric>Codex · overzicht</Rubric>
              </div>
              <h1
                className="text-[34px] font-medium leading-none tracking-tight sm:text-[44px]"
                style={{ ...display, color: C.ink }}
              >
                Goedendag, {voornaam}
              </h1>
              <p
                className="mt-3 max-w-md text-[15px] leading-relaxed"
                style={{ ...serif, color: C.fgSoft }}
              >
                Uw werk als handschrift — met zorg opgetekend, bezegeld en bewaard.
              </p>
              <div className="mt-3 text-[13px]" style={{ ...serif, color: C.muted }}>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-full border px-4 py-2.5"
            style={{ borderColor: C.forest, background: C.forestSoft }}
          >
            <WaxSeal size={26} tone={C.forest}>
              <ShieldCheck size={13} strokeWidth={2.2} />
            </WaxSeal>
            <span className="text-[12.5px] font-semibold" style={{ ...serif, color: C.forest }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = kpiTones[i % kpiTones.length] ?? C.wax;
          return (
            <Panel key={k.label} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...serif, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...serif, color: k.up ? C.forest : C.wax }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[27px] font-medium tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Sparkline data={k.spark} tone={tone} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <Rubric>Beste overeenkomst</Rubric>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full overflow-hidden rounded-lg p-0 text-left transition-colors duration-300 ${RING}`}
            style={{ ...panelStyle(), backgroundImage: vellumStains() }}
          >
            <span className="flex items-start gap-5 p-6">
              <MatchTag value={top.match} />
              <span className="min-w-0 flex-1">
                <span
                  className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                  style={{ ...serif, color: C.faint }}
                >
                  {top.id}
                </span>
                <span
                  className="mt-1 block text-[20px] font-medium leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {top.titel}
                </span>
                <span className="mt-0.5 block text-[13px]" style={{ ...serif, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3.5 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border px-2.5 py-0.5 text-[11px]"
                      style={{
                        ...serif,
                        color: C.fgSoft,
                        borderColor: C.line,
                        background: C.giltPale,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: C.wax }}
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel
            className="mt-5 flex items-start gap-4 p-6"
            style={{ backgroundImage: vellumStains() }}
          >
            <WaxSeal size={48}>
              <Stamp size={20} strokeWidth={2} />
            </WaxSeal>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.forest }}
                  aria-hidden="true"
                />
              </span>
              <span
                className="mt-1 block text-[13.5px] leading-relaxed"
                style={{ ...serif, color: C.fgSoft }}
              >
                Uw documenten dragen het zegel — opdrachtgevers zien meteen dat uw geloofsbrieven
                echt en bezegeld zijn.
              </span>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-4">
            <Rubric>Vraagt aandacht</Rubric>
          </div>
          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.wax : C.gilt;
              const soft = a.urgentie === "warning" ? C.waxSoft : C.giltSoft;
              return (
                <Panel key={a.titel} className="overflow-hidden p-0">
                  <span className="block h-1.5" style={{ background: soft }} aria-hidden="true" />
                  <div className="p-4">
                    <div
                      className="text-[14px] font-semibold leading-snug"
                      style={{ ...serif, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                      style={{ ...serif, color: tone }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                    </div>
                  </div>
                </Panel>
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
        rubric="Register der opdrachten"
        title="Opdrachten, met de hand geordend"
        sub="Wij tekenen eerlijk op waarom een opdracht bij u past — en waar het wringt."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-full border px-5 py-3"
        style={{ borderColor: C.line, background: C.page }}
      >
        <Feather size={16} className="shrink-0" style={{ color: C.rubric }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of bekwaamheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14.5px] outline-none placeholder:opacity-55"
          style={{ ...serif, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...serif, color: C.rubric, borderColor: C.rubric }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: vellumStains() }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full border"
            style={{ borderColor: C.gilt, background: C.giltSoft, color: C.gilt }}
            aria-hidden="true"
          >
            <ScrollText size={28} strokeWidth={1.6} />
          </span>
          <h3 className="text-[24px] font-medium" style={{ ...display, color: C.ink }}>
            Een leeg blad
          </h3>
          <p className="max-w-xs text-[14px]" style={{ ...serif, color: C.muted }}>
            Geen vermelding voor &ldquo;{query}&rdquo;. Beproef een andere zoekterm.
          </p>
          <div className="mt-1">
            <QuillButton onClick={() => setQuery("")} tone={C.gilt} soft={C.giltSoft}>
              Wis het register
            </QuillButton>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const p =
              o.match >= 90
                ? { tone: C.forest, soft: C.forestSoft }
                : o.match >= 82
                  ? { tone: C.gilt, soft: C.giltSoft }
                  : { tone: C.wax, soft: C.waxSoft };
            return (
              <div
                key={o.id}
                className="group flex h-full flex-col overflow-hidden rounded-lg border p-6 transition-colors duration-300"
                style={{
                  borderColor: C.lineSoft,
                  background: C.page,
                  backgroundImage: vellumStains(),
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.tone)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.lineSoft)}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchTag value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${RING}`}
                    style={{
                      color: isSaved ? p.tone : C.muted,
                      background: isSaved ? p.soft : "transparent",
                      borderColor: isSaved ? p.tone : C.line,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <span
                  className="mt-4 text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                  style={{ ...serif, color: C.faint }}
                >
                  {o.id}
                </span>
                <h3
                  className="mt-1 text-[19px] font-medium leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[13px]" style={{ ...serif, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12.5px]"
                  style={{ ...serif, color: C.fgSoft }}
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
                  <InkButton onClick={() => onOpen(o)} tone={p.tone} className="w-full">
                    Lees de opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </InkButton>
                </div>
              </div>
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
        <QuillButton
          onClick={onBack}
          tone={C.gilt}
          soft={C.giltSoft}
          ariaLabel="Terug naar register"
        >
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </QuillButton>
      </div>

      <Panel className="overflow-hidden p-7" style={{ backgroundImage: vellumStains() }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <MatchTag value={opdracht.match} />
            <div>
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...serif, color: C.faint }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-1 text-[28px] font-medium leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...serif, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <QuillButton
            onClick={() => toggleSave(opdracht.id)}
            tone={C.wax}
            soft={C.waxSoft}
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
          </QuillButton>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Vergoeding", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Aanvang", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-md border p-4"
              style={{ borderColor: C.lineSoft, background: C.page }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.gilt }} aria-hidden="true" />
              <div
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...serif, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...serif, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-6" style={{ backgroundImage: vellumStains() }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border"
              style={{ borderColor: C.forest, background: C.forestSoft, color: C.forest }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...serif, color: C.forest }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px]"
                style={{ ...serif, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.forest }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-6" style={{ backgroundImage: vellumStains() }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border"
              style={{ borderColor: C.gilt, background: C.giltSoft, color: C.gilt }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...serif, color: C.gilt }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px]"
                style={{ ...serif, color: C.fg }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.gilt }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <InkButton
          onClick={() => setApplied((v) => !v)}
          tone={applied ? C.forest : C.wax}
          ariaPressed={applied}
          className="px-6 py-3 text-[14.5px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Feather size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Brief verzonden" : "Schrijf een reactie"}
        </InkButton>
        {applied && (
          <span className="text-[13px]" style={{ ...serif, color: C.muted }}>
            De opdrachtgever antwoordt doorgaans binnen zes uren.
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
        rubric="Zegelkamer"
        title="Uw geloofsbrieven, bezegeld"
        sub="Elke status draagt een eigen label én zegel — nooit slechts een kleur — als waarborg van echtheid."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tone, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-md border px-4 py-3.5"
              style={{ borderColor: tone, background: soft }}
            >
              <WaxSeal size={30} tone={tone}>
                <Icon size={14} strokeWidth={2.2} />
              </WaxSeal>
              <span className="text-[12.5px] font-semibold" style={{ ...serif, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel
        className="mb-7 flex items-center gap-4 p-6"
        style={{ backgroundImage: vellumStains() }}
      >
        <WaxSeal size={52}>
          <ShieldCheck size={22} strokeWidth={2} />
        </WaxSeal>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13.5px]" style={{ ...serif, color: C.fgSoft }}>
            Uw documenten worden verzegeld bewaard en enkel met uw toestemming getoond.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tone } = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${RING}`}
                  style={{
                    borderColor: done ? C.forest : C.line,
                    background: done ? C.forest : "transparent",
                    color: C.giltPale,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <WaxSeal size={38} tone={tone}>
                  <ScrollText size={16} strokeWidth={2} />
                </WaxSeal>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold" style={{ ...serif, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12.5px]" style={{ ...serif, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <ScrollText size={16} strokeWidth={2} style={{ color: C.wax }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${RING}`}
              style={{ borderColor: C.line, color: C.wax }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3.5 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-full border px-3.5 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...serif,
                  color: feedState === s ? C.giltPale : C.muted,
                  background: feedState === s ? C.wax : "transparent",
                  borderColor: feedState === s ? C.wax : C.line,
                }}
              >
                {s === "ok" ? "Getoond" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.vellum2 }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.vellum2 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ borderColor: C.wax }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full border"
                style={{ borderColor: C.wax, background: C.waxSoft, color: C.wax }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[16px] font-medium" style={{ ...display, color: C.ink }}>
                Een gescheurd blad
              </div>
              <p className="text-[12.5px]" style={{ ...serif, color: C.muted }}>
                Wij konden uw documentenkist niet bereiken. Beproef het zo nogmaals.
              </p>
              <div className="mt-1">
                <QuillButton onClick={() => setFeedState("ok")} tone={C.wax} soft={C.waxSoft}>
                  Nogmaals beproeven
                </QuillButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => {
                const { tone, soft } = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-[9px] font-bold"
                      style={{ ...serif, borderColor: tone, background: soft, color: tone }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13px] font-semibold"
                        style={{ ...serif, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div
                        className="text-[11.5px] tabular-nums"
                        style={{ ...serif, color: C.muted }}
                      >
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusPill status={d.status} />
                  </Panel>
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
      <ScreenHead rubric="Takenlijst" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: vellumStains() }}
        >
          <WaxSeal size={64} tone={C.forest}>
            <Check size={28} strokeWidth={2.2} />
          </WaxSeal>
          <h3 className="text-[24px] font-medium" style={{ ...display, color: C.ink }}>
            Alles bezegeld
          </h3>
          <p className="max-w-xs text-[14px]" style={{ ...serif, color: C.muted }}>
            Er rest niets meer voor vandaag. Het perkament is voltooid.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-full border px-4 py-2"
            style={{ borderColor: C.gilt, background: C.giltSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...serif, background: C.gilt, color: C.giltPale }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...serif, color: C.gilt }}>
              {openCount} {openCount === 1 ? "taak" : "taken"} open
            </span>
          </div>

          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tone = isDone ? C.forest : a.urgentie === "warning" ? C.wax : C.gilt;
              const soft = isDone
                ? C.forestSoft
                : a.urgentie === "warning"
                  ? C.waxSoft
                  : C.giltSoft;
              return (
                <Panel key={a.titel} className="overflow-hidden p-0">
                  <span className="block h-1.5" style={{ background: soft }} aria-hidden="true" />
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${RING}`}
                      style={{
                        borderColor: isDone ? C.forest : C.line,
                        background: isDone ? C.forest : "transparent",
                        color: C.giltPale,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15.5px] font-semibold leading-snug"
                        style={{
                          ...serif,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[13px]"
                        style={{ ...serif, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold"
                          style={{ ...serif, color: tone, borderColor: tone }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </Panel>
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
  const statusMap = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.forest, soft: C.forestSoft, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.wax, soft: C.waxSoft, Icon: Clock }
        : { tone: C.muted, soft: C.giltPale, Icon: ScrollText };
  return (
    <div>
      <ScreenHead
        rubric="Rekeningboek"
        title="Uw rekeningen"
        sub="Overzichtelijk opgetekend en met de hand bijgehouden — zodat u weet waar u aan toe bent."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Voldaan (mnd)", value: "€ 5.552", tone: C.forest },
            { label: "Openstaand", value: "€ 1.350", tone: C.wax },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Panel key={s.label} className="p-5">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...serif, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[25px] font-medium tabular-nums"
                style={{ ...display, color: s.tone }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-5">
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...serif, color: C.muted }}
          >
            Bedrag per rekening
          </div>
          <Sparkline data={trend} tone={C.wax} height={48} />
        </Panel>
      </div>

      <Panel className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Rekening", "Cliënt", "Datum", "Bedrag", "Staat"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...serif, color: C.muted }}
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.pageDeep)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3.5 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...serif, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...serif, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...serif, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...serif, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          ...serif,
                          color: sm.tone,
                          background: sm.soft,
                          borderColor: sm.tone,
                        }}
                      >
                        <sm.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
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
                  className="px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...serif, color: C.muted }}
                >
                  Totaal
                </td>
                <td />
                <td />
                <td
                  className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                  style={{ ...serif, color: C.wax }}
                >
                  € 7.782
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept285() {
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
      style={{ ...serif, color: C.fg, background: C.vellum, backgroundImage: vellumStains() }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WaxSeal size={44}>
              <Feather size={19} strokeWidth={2} />
            </WaxSeal>
            <div className="leading-tight">
              <div
                className="text-[22px] font-medium tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Perkament
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...serif, color: C.muted }}
              >
                ZZP platform
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
                style={{ ...serif, color: C.forest }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full border text-[13px] font-bold"
              style={{ ...display, borderColor: C.gilt, background: C.giltSoft, color: C.wax }}
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
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${RING}`}
                style={{
                  ...serif,
                  color: on ? C.giltPale : C.fgSoft,
                  background: on ? C.wax : "transparent",
                  borderColor: on ? C.wax : C.line,
                }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
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
          style={{ ...serif, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Feather size={12} strokeWidth={2} style={{ color: C.rubric }} aria-hidden="true" />
            {SCREENS.length} bladen · perkament v285
          </span>
          <span>Bezegeld · met de hand · vertrouwd</span>
        </footer>
      </div>
    </div>
  );
}
