"use client";

// Concept 280 — "Kalkverf" · Limewash matte muren (light).
// Signature: warme, krijtachtige matte kleurvlakken (kalk-wit, klei-roze, salie, oker) met zachte
// wolkige kleurovergangen zoals geschilderde muren. Geen glans, geen slagschaduw — volledig mat.
// Zeer rustige compositie, humanistische sans, veel lucht. De interactie is een zachte "wash":
// bij hover kleurt een mat vlak rustig bij (nooit een gloed of schaduw). Warm-minimalistisch,
// tactiel-mat, premium-rustig. Tekstcontrast blijft toegankelijk.
// Fonts: --font-lab-franklin (humanist sans) + --font-lab-fraunces (rustige display-accenten).

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
  Leaf,
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

// Limewash palette. Warm chalky matte fields. No gloss, no shadows anywhere. Text stays legible.
const C = {
  wall: "#f2ece1",
  wall2: "#ebe3d5",
  paper: "#faf6ee",
  paperDeep: "#f4eee3",
  line: "#ddd1bd",
  lineSoft: "#e6dccb",
  ink: "#3b352b",
  fg: "#463f33",
  fgSoft: "#655c4c",
  muted: "#8a8070",
  faint: "#a99e8a",
  clay: "#bd8067",
  claySoft: "#e7d2c6",
  clayWash: "#efe0d7",
  sage: "#7f8e6d",
  sageSoft: "#d7ddc7",
  sageWash: "#e6e9d8",
  ochre: "#b78f45",
  ochreSoft: "#ecdcb6",
  ochreWash: "#f0e5cc",
  rose: "#b06b5d",
  roseSoft: "#e8ccc4",
};

const sans = { fontFamily: "var(--font-lab-franklin)" };
const display = { fontFamily: "var(--font-lab-fraunces)" };

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

// Each screen is tinted with one of the four limewash pigments.
const SCREEN_PIGMENT: Record<
  ScreenKey,
  { tone: string; soft: string; wash: string; naam: string }
> = {
  dashboard: { tone: C.clay, soft: C.claySoft, wash: C.clayWash, naam: "Klei" },
  marktplaats: { tone: C.sage, soft: C.sageSoft, wash: C.sageWash, naam: "Salie" },
  opdracht: { tone: C.ochre, soft: C.ochreSoft, wash: C.ochreWash, naam: "Oker" },
  verificatie: { tone: C.sage, soft: C.sageSoft, wash: C.sageWash, naam: "Salie" },
  acties: { tone: C.ochre, soft: C.ochreSoft, wash: C.ochreWash, naam: "Oker" },
  facturen: { tone: C.clay, soft: C.claySoft, wash: C.clayWash, naam: "Klei" },
  documenten: { tone: C.clay, soft: C.claySoft, wash: C.clayWash, naam: "Klei" },
  berichten: { tone: C.sage, soft: C.sageSoft, wash: C.sageWash, naam: "Salie" },
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f8e6d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2ece1]";

// A cloudy limewash background — layered soft radial gradients like brushed-on paint. Fully matte.
function limewash(tone: string): string {
  return `radial-gradient(120% 90% at 12% 8%, ${tone} 0%, transparent 55%), radial-gradient(110% 80% at 88% 96%, ${tone} 0%, transparent 50%)`;
}

// ---- Primitives -------------------------------------------------------------

function panelStyle(): CSSProperties {
  return {
    background: C.paper,
    border: `1px solid ${C.lineSoft}`,
    borderRadius: 14,
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

// Verification status vocabulary — label + icon + a matte pigment.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.sage, soft: C.sageSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, tone: C.ochre, soft: C.ochreSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.clay, soft: C.claySoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rose, soft: C.roseSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-[11px] font-semibold"
      style={{ ...sans, color: tone, background: soft }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{ background: tone }}
        aria-hidden="true"
      >
        <Icon size={10} strokeWidth={2.4} color={C.paper} />
      </span>
      {label}
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.sage : value >= 82 ? C.ochre : C.clay;
  const soft = value >= 90 ? C.sageSoft : value >= 82 ? C.ochreSoft : C.claySoft;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1"
      style={{ background: soft }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-semibold tabular-nums leading-none ${size === "sm" ? "text-[14px]" : "text-[18px]"}`}
        style={{ ...display, color: tone }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...sans, color: tone }}
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
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Filled matte button — a painted swatch. No gloss; hover deepens the pigment gently.
function PaintButton({
  children,
  onClick,
  tone = C.clay,
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
      style={{ ...sans, color: C.paper, background: hot ? C.ink : tone }}
    >
      {children}
    </button>
  );
}

// Outline "chalk line" secondary button — washes a soft pigment on hover.
function ChalkButton({
  children,
  onClick,
  tone = C.sage,
  soft = C.sageSoft,
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
  const painted = active || hot;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: tone,
        background: painted ? soft : "transparent",
        border: `1px solid ${painted ? tone : C.line}`,
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
  const p = SCREEN_PIGMENT[screenKey];
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="h-3.5 w-3.5 rounded-full"
          style={{ background: p.tone }}
          aria-hidden="true"
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...sans, color: C.muted }}
        >
          {p.naam}
        </span>
      </div>
      <h1
        className="text-[30px] font-medium leading-tight tracking-tight sm:text-[36px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[14.5px] leading-relaxed"
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
  const kpiTones = [C.clay, C.sage, C.ochre, C.rose];
  return (
    <div>
      <div
        className="mb-10 overflow-hidden rounded-[20px] px-7 py-9 sm:px-9 sm:py-11"
        style={{
          border: `1px solid ${C.line}`,
          background: `${C.paperDeep}`,
          backgroundImage: limewash(C.clayWash),
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ ...sans, color: C.clay }}
            >
              {PROFIEL.plaats} · {PROFIEL.rol}
            </div>
            <h1
              className="text-[34px] font-medium leading-none tracking-tight sm:text-[42px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen, {voornaam}
            </h1>
            <p
              className="mt-4 max-w-md text-[14.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Een rustig overzicht van je werk — zonder ruis, met alles op zijn plek.
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5"
            style={{ background: C.sageSoft }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: C.sage }} aria-hidden="true" />
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.sage }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = kpiTones[i % kpiTones.length] ?? C.clay;
          return (
            <Panel key={k.label} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...sans, color: k.up ? C.sage : C.clay }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[26px] font-medium tabular-nums leading-none"
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
          <div className="mb-4 flex items-center gap-2">
            <Leaf size={16} strokeWidth={2} style={{ color: C.sage }} aria-hidden="true" />
            <h2
              className="text-[16px] font-medium tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full overflow-hidden rounded-[16px] p-0 text-left transition-colors duration-300 ${RING}`}
            style={{ ...panelStyle(), backgroundImage: limewash(C.paperDeep) }}
          >
            <span className="flex items-start gap-5 p-6">
              <MatchTag value={top.match} />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[18px] font-medium leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {top.titel}
                </span>
                <span className="mt-1 block text-[13px]" style={{ ...sans, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3.5 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{ ...sans, color: C.fgSoft, background: C.wall2 }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: C.clay }}
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel
            className="mt-5 flex items-start gap-4 p-6"
            style={{ backgroundImage: limewash(C.sageWash) }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.sageSoft, color: C.sage }}
              aria-hidden="true"
            >
              <ShieldCheck size={21} strokeWidth={2} />
            </span>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.sage }}
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
          </Panel>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2} style={{ color: C.ochre }} aria-hidden="true" />
            <h2
              className="text-[16px] font-medium tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Vraagt aandacht
            </h2>
          </div>
          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.clay : C.ochre;
              const soft = a.urgentie === "warning" ? C.claySoft : C.ochreSoft;
              return (
                <Panel key={a.titel} className="overflow-hidden p-0">
                  <span className="block h-1.5" style={{ background: soft }} aria-hidden="true" />
                  <div className="p-4">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ ...sans, color: tone }}
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
        screenKey="marktplaats"
        title="Opdrachten in rustige lagen"
        sub="We tonen eerlijk waarom een opdracht past — en waar het schuurt."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-full px-5 py-3"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.sage }} aria-hidden="true" />
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
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.sage, background: C.sageSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: limewash(C.sageWash) }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.sageSoft, color: C.sage }}
            aria-hidden="true"
          >
            <Leaf size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[22px] font-medium" style={{ ...display, color: C.ink }}>
            Een lege muur
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <ChalkButton onClick={() => setQuery("")} tone={C.sage} soft={C.sageSoft}>
              Filter wissen
            </ChalkButton>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const p =
              o.match >= 90
                ? { tone: C.sage, wash: C.sageWash }
                : o.match >= 82
                  ? { tone: C.ochre, wash: C.ochreWash }
                  : { tone: C.clay, wash: C.clayWash };
            return (
              <div
                key={o.id}
                className="group flex h-full flex-col overflow-hidden rounded-[16px] p-6 transition-colors duration-300"
                style={{
                  background: C.paper,
                  border: `1px solid ${C.lineSoft}`,
                  backgroundImage: limewash(C.paperDeep),
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundImage = limewash(p.wash))}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundImage = limewash(C.paperDeep))
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchTag value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      color: isSaved ? p.tone : C.muted,
                      background: isSaved ? C.wall2 : "transparent",
                      border: `1px solid ${isSaved ? p.tone : C.line}`,
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
                  style={{ ...sans, color: C.faint }}
                >
                  {o.id}
                </span>
                <h3
                  className="mt-1 text-[17px] font-medium leading-tight"
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
                  <PaintButton onClick={() => onOpen(o)} tone={p.tone} className="w-full">
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </PaintButton>
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
        <ChalkButton
          onClick={onBack}
          tone={C.ochre}
          soft={C.ochreSoft}
          ariaLabel="Terug naar marktplaats"
        >
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </ChalkButton>
      </div>

      <Panel className="overflow-hidden p-7" style={{ backgroundImage: limewash(C.ochreWash) }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <MatchTag value={opdracht.match} />
            <div>
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...sans, color: C.faint }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-1 text-[26px] font-medium leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...sans, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <ChalkButton
            onClick={() => toggleSave(opdracht.id)}
            tone={C.clay}
            soft={C.claySoft}
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
          </ChalkButton>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl p-4"
              style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.ochre }} aria-hidden="true" />
              <div
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-6" style={{ backgroundImage: limewash(C.sageWash) }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.sageSoft, color: C.sage }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.sage }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-6" style={{ backgroundImage: limewash(C.clayWash) }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.claySoft, color: C.clay }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.clay }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <PaintButton
          onClick={() => setApplied((v) => !v)}
          tone={applied ? C.sage : C.clay}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </PaintButton>
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
        title="Documenten, rustig gecontroleerd"
        sub="Elke status heeft een eigen kleur, label én icoon — nooit alleen kleur."
      />

      {/* Legend: the four verification states as matte pigment swatches */}
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tone, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3.5"
              style={{ background: soft }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: tone, color: C.paper }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel
        className="mb-7 flex items-center gap-4 p-6"
        style={{ backgroundImage: limewash(C.sageWash) }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.sageSoft, color: C.sage }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tone, soft } = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.sage : C.line}`,
                    background: done ? C.sage : "transparent",
                    color: C.paper,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: soft, color: tone }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2} />
                </span>
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

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...sans, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.clay }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${RING}`}
              style={{ background: C.paper, color: C.clay, border: `1px solid ${C.line}` }}
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
                className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.paper : C.muted,
                  background: feedState === s ? C.clay : "transparent",
                  border: `1px solid ${feedState === s ? C.clay : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.wall2 }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.wall2 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ backgroundImage: limewash(C.roseSoft) }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.roseSoft, color: C.rose }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <ChalkButton onClick={() => setFeedState("ok")} tone={C.rose} soft={C.roseSoft}>
                  Opnieuw proberen
                </ChalkButton>
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
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold"
                      style={{ ...sans, background: soft, color: tone }}
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
                      <div className="text-[11px] tabular-nums" style={{ ...sans, color: C.muted }}>
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
      <ScreenHead screenKey="acties" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: limewash(C.sageWash) }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.sageSoft, color: C.sage }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.2} />
          </span>
          <h3 className="text-[22px] font-medium" style={{ ...display, color: C.ink }}>
            Alles rustig
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. De muur is af.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{ background: C.ochreSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...sans, background: C.ochre, color: C.paper }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ochre }}>
              {openCount} {openCount === 1 ? "actie" : "acties"} open
            </span>
          </div>

          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tone = isDone ? C.sage : a.urgentie === "warning" ? C.clay : C.ochre;
              const soft = isDone
                ? C.sageSoft
                : a.urgentie === "warning"
                  ? C.claySoft
                  : C.ochreSoft;
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
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.sage : C.line}`,
                        background: isDone ? C.sage : "transparent",
                        color: C.paper,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
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
                          className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{ ...sans, color: tone, background: soft }}
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
  const statusMap = (status: string): { tone: string; soft: string } =>
    status === "Betaald"
      ? { tone: C.sage, soft: C.sageSoft }
      : status === "Openstaand"
        ? { tone: C.clay, soft: C.claySoft }
        : { tone: C.muted, soft: C.wall2 };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.sage },
            { label: "Openstaand", value: "€ 1.350", tone: C.clay },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Panel key={s.label} className="p-5">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[24px] font-medium tabular-nums"
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
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.clay} height={48} />
        </Panel>
      </div>

      <Panel className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
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
                      className="px-3 py-3.5 text-[12.5px] font-semibold tabular-nums"
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
                      className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-[11px] font-semibold"
                        style={{ ...sans, color: sm.tone, background: sm.soft }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full"
                          style={{ background: sm.tone }}
                          aria-hidden="true"
                        >
                          {f.status === "Betaald" ? (
                            <Check size={10} strokeWidth={2.6} color={C.paper} />
                          ) : f.status === "Openstaand" ? (
                            <Clock size={10} strokeWidth={2.4} color={C.paper} />
                          ) : (
                            <FileText size={10} strokeWidth={2.4} color={C.paper} />
                          )}
                        </span>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept280() {
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
      style={{
        ...sans,
        color: C.fg,
        background: C.wall,
        backgroundImage: limewash(C.wall2),
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: C.clay, color: C.paper }}
              aria-hidden="true"
            >
              <Leaf size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-medium tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Kalkverf
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...sans, color: C.muted }}
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
                style={{ ...sans, color: C.sage }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold"
              style={{ ...sans, background: C.sageSoft, color: C.sage }}
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
            const p = SCREEN_PIGMENT[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.paper : C.fgSoft,
                  background: on ? p.tone : "transparent",
                  border: `1px solid ${on ? p.tone : C.line}`,
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
          style={{ ...sans, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Leaf size={12} strokeWidth={2} style={{ color: C.sage }} aria-hidden="true" />
            {SCREENS.length} schermen · limewash v280
          </span>
          <span>Warm, mat en rustig</span>
        </footer>
      </div>
    </div>
  );
}
