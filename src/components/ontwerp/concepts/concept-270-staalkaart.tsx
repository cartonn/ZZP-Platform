"use client";

// Concept 270 — "Staalkaart" · Kleurstaal-waaier & verfchip-deck (light).
// Signature: een verfstaal/waaier-esthetiek. Elk onderdeel is een verfchip-kaart met een kleurblok
// bovenaan, een code-label (mono) en een naam — hergebruikt voor status, match en rol. Chips liggen
// in een overlappende waaier-stapel die uitwaaiert bij hover. Verificatie-statussen krijgen elk hun
// eigen "kleurstaal" met label + icoon. Strak wit met een systematisch kleurenpalet dat de secties
// codeert. Designerly, tactiel, systematisch. Fonts: Geist (tekst) + Geist Mono (codes/cijfers).

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
  Palette,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Layers,
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

// Crisp white deck with a systematic swatch palette. Each section is colour-coded.
const C = {
  bg: "#fafafa",
  bg2: "#f2f3f4",
  card: "#ffffff",
  line: "#e4e6e9",
  lineSoft: "#eef0f2",
  fg: "#14181f",
  fgSoft: "#3b424c",
  muted: "#6a7280",
  faint: "#9aa2ac",
  accent: "#16a34a",
  accentDeep: "#0f7a37",
  accentSoft: "#e3f4e9",
  // Section swatch codes — the "paint" for each screen.
  ink: "#111827",
  blue: "#2563eb",
  blueSoft: "#e5edfd",
  violet: "#7c3aed",
  violetSoft: "#efe8fd",
  amber: "#b45309",
  amberSoft: "#f9ecd6",
  rose: "#be123c",
  roseSoft: "#fbe0e6",
  teal: "#0d9488",
  tealSoft: "#d9f2ef",
};

const geist = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

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

// Each screen gets a paint-chip identity: colour, hex-style code, swatch name.
const SCREEN_SWATCH: Record<ScreenKey, { tone: string; soft: string; code: string; naam: string }> =
  {
    dashboard: { tone: C.ink, soft: "#e6e8eb", code: "NW-100", naam: "Basis Inkt" },
    marktplaats: { tone: C.blue, soft: C.blueSoft, code: "BL-420", naam: "Marktblauw" },
    opdracht: { tone: C.violet, soft: C.violetSoft, code: "VI-360", naam: "Opdracht Violet" },
    verificatie: { tone: C.accent, soft: C.accentSoft, code: "GR-540", naam: "Vertrouwensgroen" },
    acties: { tone: C.amber, soft: C.amberSoft, code: "AM-280", naam: "Actie Amber" },
    facturen: { tone: C.teal, soft: C.tealSoft, code: "TE-500", naam: "Factuur Teal" },
    documenten: { tone: C.rose, soft: C.roseSoft, code: "RO-320", naam: "Dossier Rose" },
    berichten: { tone: C.blue, soft: C.blueSoft, code: "BL-200", naam: "Bericht Blauw" },
  };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]";

// ---- Swatch primitives ------------------------------------------------------

function cardStyle(): CSSProperties {
  return {
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    boxShadow: "0 1px 2px rgba(20,24,31,0.04)",
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
    <div className={className} style={{ ...cardStyle(), ...style }}>
      {children}
    </div>
  );
}

// The signature element: a paint chip with a colour block + mono code + name.
function Chip({
  tone,
  code,
  naam,
  sub,
  Icon,
  block = 44,
  className,
  style,
}: {
  tone: string;
  code: string;
  naam: string;
  sub?: string;
  Icon?: LucideIcon;
  block?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`} style={{ ...cardStyle(), ...style }}>
      <div
        className="flex items-end justify-between px-3 pb-1.5"
        style={{ background: tone, height: block }}
      >
        {Icon && <Icon size={15} strokeWidth={2.2} color="#fff" aria-hidden="true" />}
        <span
          className="ml-auto text-[9.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: "rgba(255,255,255,0.82)" }}
        >
          {code}
        </span>
      </div>
      <div className="px-3 py-2">
        <div
          className="text-[12.5px] font-semibold leading-tight"
          style={{ ...geist, color: C.fg }}
        >
          {naam}
        </div>
        {sub && (
          <div className="mt-0.5 text-[10.5px] tabular-nums" style={{ ...mono, color: C.muted }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// A status swatch = the paint-chip vocabulary reused for verification state.
function statusSwatch(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
  code: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        tone: C.accent,
        soft: C.accentSoft,
        code: "GR-540",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        tone: C.blue,
        soft: C.blueSoft,
        code: "BL-420",
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        tone: C.amber,
        soft: C.amberSoft,
        code: "AM-280",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rose, soft: C.roseSoft, code: "RO-320" };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft, code } = statusSwatch(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md py-0.5 pl-1 pr-2 text-[11px] font-semibold"
      style={{ ...geist, color: tone, background: soft }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-[3px]"
        style={{ background: tone }}
        aria-hidden="true"
      >
        <Icon size={10} strokeWidth={2.4} color="#fff" />
      </span>
      {label}
      <span className="text-[9px] tabular-nums opacity-70" style={{ ...mono }}>
        {code}
      </span>
    </span>
  );
}

// Match score rendered as a mono "colour code" plus a thin swatch bar.
function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.accent : value >= 82 ? C.blue : C.amber;
  const soft = value >= 90 ? C.accentSoft : value >= 82 ? C.blueSoft : C.amberSoft;
  return (
    <div
      className="inline-flex items-center gap-2 rounded-md px-2 py-1"
      style={{ background: soft }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-semibold tabular-nums ${size === "sm" ? "text-[13px]" : "text-[16px]"}`}
        style={{ ...mono, color: tone }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...mono, color: tone }}
      >
        match
      </span>
    </div>
  );
}

function Sparkline({ data, tone, height = 30 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 68 - 16;
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
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.08} />
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

// A fanning swatch deck — chips overlap in a stack and spread apart on hover.
function FanDeck() {
  const [open, setOpen] = useState(false);
  const cards = [
    { tone: C.ink, code: "NW-100" },
    { tone: C.blue, code: "BL-420" },
    { tone: C.accent, code: "GR-540" },
    { tone: C.amber, code: "AM-280" },
    { tone: C.teal, code: "TE-500" },
  ];
  return (
    <button
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      aria-label="Kleurenwaaier uitklappen"
      aria-expanded={open}
      className={`relative h-16 w-32 shrink-0 ${RING} rounded-md`}
    >
      {cards.map((c, i) => {
        const spread = open ? (i - (cards.length - 1) / 2) * 22 : (i - (cards.length - 1) / 2) * 7;
        const rot = open ? (i - (cards.length - 1) / 2) * 9 : 0;
        return (
          <span
            key={c.code}
            className="absolute left-1/2 top-1/2 flex h-14 w-10 flex-col justify-end overflow-hidden rounded-[6px] pb-1 transition-all duration-300 ease-out"
            style={{
              background: c.tone,
              transform: `translate(-50%,-50%) translateX(${spread}px) rotate(${rot}deg)`,
              boxShadow: "0 2px 6px rgba(20,24,31,0.18)",
              zIndex: i,
            }}
            aria-hidden="true"
          >
            <span
              className="text-center text-[7px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: "rgba(255,255,255,0.85)" }}
            >
              {c.code}
            </span>
          </span>
        );
      })}
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
  const sw = SCREEN_SWATCH[screenKey];
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-5 items-center rounded-[4px] px-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, background: sw.tone, color: "#fff" }}
        >
          {sw.code}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...geist, color: C.muted }}
        >
          {sw.naam}
        </span>
      </div>
      <h1
        className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...geist, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[14px] leading-relaxed"
          style={{ ...geist, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  const kpiTones = [C.accent, C.blue, C.teal, C.amber];
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-5 items-center rounded-[4px] px-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, background: C.ink, color: "#fff" }}
            >
              NW-100
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...geist, color: C.muted }}
            >
              {PROFIEL.plaats}
            </span>
          </div>
          <h1
            className="text-[30px] font-semibold leading-none tracking-tight sm:text-[36px]"
            style={{ ...geist, color: C.fg }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[14px]" style={{ ...geist, color: C.muted }}>
            Je overzicht als staalkaart — elke sectie een eigen kleurstaal.
          </p>
        </div>
        <FanDeck />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = kpiTones[i % kpiTones.length] ?? C.accent;
          return (
            <Panel key={k.label} className="overflow-hidden">
              <div className="h-1.5" style={{ background: tone }} aria-hidden="true" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
                    style={{ ...geist, color: C.muted }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.accent : C.amber }}
                  >
                    <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none"
                  style={{ ...geist, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-2">
                  <Sparkline data={k.spark} tone={tone} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Palette size={16} strokeWidth={2} style={{ color: C.blue }} aria-hidden="true" />
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...geist, color: C.fg }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-stretch gap-4 overflow-hidden p-0 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cardStyle()}
          >
            <span className="flex w-2 shrink-0" style={{ background: C.blue }} aria-hidden="true" />
            <span className="flex flex-1 items-start gap-4 p-5">
              <MatchTag value={top.match} />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[17px] font-semibold leading-tight"
                  style={{ ...geist, color: C.fg }}
                >
                  {top.titel}
                </span>
                <span className="mt-0.5 block text-[13px]" style={{ ...geist, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[11px]"
                      style={{ ...geist, color: C.fgSoft, background: C.bg2 }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.blue }}
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel className="mt-6 flex items-start gap-4 overflow-hidden p-0">
            <span
              className="w-2 self-stretch"
              style={{ background: C.accent }}
              aria-hidden="true"
            />
            <span className="flex items-start gap-4 py-5 pr-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.accentSoft, color: C.accent }}
                aria-hidden="true"
              >
                <ShieldCheck size={22} strokeWidth={2} />
              </span>
              <span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                    {PROFIEL.trust}
                  </span>
                  <BadgeCheck
                    size={15}
                    strokeWidth={2}
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className="mt-1 block text-[13px] leading-relaxed"
                  style={{ ...geist, color: C.fgSoft }}
                >
                  Je documenten zijn geverifieerd — opdrachtgevers zien meteen de juiste kleurstaal.
                </span>
              </span>
            </span>
          </Panel>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...geist, color: C.fg }}
            >
              Volgende stappen
            </h2>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.amber : C.blue;
              return (
                <Panel key={a.titel} className="overflow-hidden">
                  <div className="flex">
                    <span
                      className="w-1.5 shrink-0"
                      style={{ background: tone }}
                      aria-hidden="true"
                    />
                    <div className="p-3.5">
                      <div
                        className="text-[12.5px] font-semibold leading-snug"
                        style={{ ...geist, color: C.fg }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...geist, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
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
        title="Opdrachten, per kleurstaal"
        sub="We tonen eerlijk waarom een opdracht past — en waar de lijn afwijkt."
      />

      <div
        className="mb-5 flex items-center gap-2 rounded-lg px-4 py-2.5"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.blue }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...geist, color: C.fg }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-md px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...geist, color: C.blue, background: C.blueSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="flex gap-1.5" aria-hidden="true">
            {[C.ink, C.blue, C.accent, C.amber].map((t) => (
              <span
                key={t}
                className="h-10 w-7 rounded-[4px]"
                style={{ background: t, opacity: 0.5 }}
              />
            ))}
          </div>
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.fg }}>
            Geen staal gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-md px-5 py-2 text-[13px] font-semibold text-white ${RING}`}
            style={{ ...geist, background: C.accent }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const tone = o.match >= 90 ? C.accent : o.match >= 82 ? C.blue : C.amber;
            return (
              <Panel
                key={o.id}
                className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
              >
                {/* Paint-chip header: colour block + code */}
                <div
                  className="flex items-center justify-between px-4 pb-2 pt-3"
                  style={{ background: tone }}
                >
                  <MatchTag value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${RING}`}
                    style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                  </div>
                  <h3
                    className="mt-1 text-[16px] font-semibold leading-tight"
                    style={{ ...geist, color: C.fg }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[13px]" style={{ ...geist, color: C.muted }}>
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                    style={{ ...geist, color: C.fgSoft }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.plaats}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.tarief}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.uren}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.start}
                    </div>
                  </dl>
                  <button
                    onClick={() => onOpen(o)}
                    className={`group mt-4 inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-[13px] font-semibold text-white transition-colors ${RING}`}
                    style={{ ...geist, background: C.ink }}
                  >
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
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
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{ ...geist, color: C.fgSoft, background: C.card, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug
      </button>

      <Panel className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 pb-3 pt-5"
          style={{ background: C.violet }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: "rgba(255,255,255,0.8)" }}
          >
            {opdracht.id} · VI-360
          </span>
          <MatchTag value={opdracht.match} />
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2
                className="text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...geist, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...geist, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <button
              onClick={() => toggleSave(opdracht.id)}
              aria-pressed={isSaved}
              className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[12px] font-semibold ${RING}`}
              style={{
                ...geist,
                color: isSaved ? C.violet : C.fgSoft,
                background: isSaved ? C.violetSoft : C.card,
                border: `1px solid ${isSaved ? C.violet : C.line}`,
              }}
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
              )}
              {isSaved ? "Bewaard" : "Bewaar"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief, code: "01" },
              { Icon: Clock, label: "Inzet", value: opdracht.uren, code: "02" },
              { Icon: Calendar, label: "Start", value: opdracht.start, code: "03" },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats, code: "04" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg p-3"
                style={{ background: C.bg, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-center justify-between">
                  <m.Icon
                    size={14}
                    strokeWidth={2}
                    style={{ color: C.violet }}
                    aria-hidden="true"
                  />
                  <span className="text-[9px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {m.code}
                  </span>
                </div>
                <div
                  className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...geist, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 pb-2 pt-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: C.accentSoft, color: C.accent }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.accent }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 pb-2 pt-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 rounded-md px-6 py-3 text-[14px] font-semibold text-white transition-colors ${RING}`}
          style={{ ...geist, background: applied ? C.accent : C.violet }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...geist, color: C.muted }}>
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
        title="Documenten, per kleurstaal gecontroleerd"
        sub="Elke status is een eigen staal — herkenbaar aan kleur, label én code."
      />

      {/* Legend: the four verification swatches as a fan of chips */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const sw = statusSwatch(s);
          return (
            <Chip key={s} tone={sw.tone} code={sw.code} naam={sw.label} Icon={sw.Icon} block={40} />
          );
        })}
      </div>

      <Panel className="mb-6 overflow-hidden">
        <span className="block h-1.5" style={{ background: C.accent }} aria-hidden="true" />
        <div className="flex items-center gap-4 p-5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            <ShieldCheck size={24} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ ...geist, color: C.fg }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...geist, color: C.fgSoft }}>
              Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const sw = statusSwatch(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 overflow-hidden">
                <span
                  className="w-1.5 self-stretch"
                  style={{ background: sw.tone }}
                  aria-hidden="true"
                />
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`my-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.accent : C.line}`,
                    background: done ? C.accent : "transparent",
                    color: "#fff",
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1 py-3">
                  <div className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...geist, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <div className="pr-4">
                  <StatusChip status={c.status} />
                </div>
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...geist, color: C.fg }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.rose }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${RING}`}
              style={{ background: C.card, color: C.rose, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...geist,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.rose : C.card,
                  border: `1px solid ${feedState === s ? C.rose : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-3.5">
                  <div className="h-3 w-2/3 animate-pulse rounded" style={{ background: C.bg2 }} />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.bg2 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ background: C.roseSoft, color: C.rose }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...geist, color: C.fg }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...geist, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded-md px-4 py-2 text-[12px] font-semibold text-white ${RING}`}
                style={{ ...geist, background: C.accent }}
              >
                Opnieuw proberen
              </button>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => {
                const sw = statusSwatch(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                      style={{ ...mono, background: sw.tone }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...geist, color: C.fg }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusChip status={d.status} />
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
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex gap-1.5" aria-hidden="true">
            {[C.accent, C.blue, C.teal].map((t) => (
              <span
                key={t}
                className="h-10 w-7 rounded-[4px]"
                style={{ background: t, opacity: 0.6 }}
              />
            ))}
          </div>
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.fg }}>
            Alles op kleur
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.muted }}>
            Niets meer te doen vandaag. De waaier is compleet.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-md px-3.5 py-2"
            style={{ background: C.amberSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold tabular-nums text-white"
              style={{ ...mono, background: C.amber }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...geist, color: C.amber }}>
              {openCount} {openCount === 1 ? "staal" : "stalen"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tone = a.urgentie === "warning" ? C.amber : C.blue;
              return (
                <Panel key={a.titel} className="flex items-stretch gap-0 overflow-hidden">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: isDone ? C.accent : tone }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.accent : C.line}`,
                        background: isDone ? C.accent : "transparent",
                        color: "#fff",
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...geist,
                          color: C.fg,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...geist, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold"
                          style={{
                            ...geist,
                            color: tone,
                            background: a.urgentie === "warning" ? C.amberSoft : C.blueSoft,
                          }}
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
  const statusSw = (status: string): { tone: string; soft: string; code: string } =>
    status === "Betaald"
      ? { tone: C.accent, soft: C.accentSoft, code: "GR-540" }
      : status === "Openstaand"
        ? { tone: C.amber, soft: C.amberSoft, code: "AM-280" }
        : { tone: C.muted, soft: C.bg2, code: "NW-060" };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.accent, code: "GR-540" },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber, code: "AM-280" },
            { label: "Concept", value: "€ 880", tone: C.muted, code: "NW-060" },
          ].map((s) => (
            <Panel key={s.label} className="overflow-hidden">
              <div
                className="flex items-center justify-between px-3 py-1.5"
                style={{ background: s.tone }}
              >
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.85)" }}
                >
                  {s.code}
                </span>
              </div>
              <div className="p-4">
                <div
                  className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
                  style={{ ...geist, color: C.muted }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-1 text-[22px] font-semibold tabular-nums"
                  style={{ ...geist, color: s.tone }}
                >
                  {s.value}
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
            style={{ ...geist, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.teal} height={46} />
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
                    className="px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...geist, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const sw = statusSw(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f7f8f9]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...geist, color: C.fg }}>
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
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md py-0.5 pl-1 pr-2 text-[11px] font-semibold"
                        style={{ ...geist, color: sw.tone, background: sw.soft }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-[3px]"
                          style={{ background: sw.tone }}
                          aria-hidden="true"
                        >
                          {f.status === "Betaald" ? (
                            <Check size={10} strokeWidth={2.6} color="#fff" />
                          ) : f.status === "Openstaand" ? (
                            <Clock size={10} strokeWidth={2.4} color="#fff" />
                          ) : (
                            <FileText size={10} strokeWidth={2.4} color="#fff" />
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

export function Concept270() {
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
      style={{ ...geist, color: C.fg, background: C.bg }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white"
              style={{ background: C.ink }}
              aria-hidden="true"
            >
              <Layers size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...geist, color: C.fg }}
              >
                Staalkaart
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...geist, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...geist, color: C.accent }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold text-white"
              style={{ ...mono, background: C.accent }}
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
            const sw = SCREEN_SWATCH[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...geist,
                  color: on ? "#fff" : C.fgSoft,
                  background: on ? sw.tone : C.card,
                  border: `1px solid ${on ? sw.tone : C.line}`,
                }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Palette size={12} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            {SCREENS.length} kleurstalen · deck v270
          </span>
          <span>Systematisch op kleur</span>
        </footer>
      </div>
    </div>
  );
}
