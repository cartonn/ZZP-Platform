"use client";

// Concept 282 — "Courant" · Kwaliteitskrant / redactioneel broadsheet (light).
// Signature: een Nederlandse kwaliteitskrant als software. Masthead met haarlijnen erboven en
// eronder, dichte meerkolomsopmaak, drop caps op de eerste alinea, verticale kolomscheidingen en
// een datumregel met editienummer. Inkt-op-krantenpapier: warm gebroken wit, inkt-zwart en één
// oxbloed-rode rubrieksaccent. Tabellen als een beurspagina. Dicht en informatief, nooit glossy.
// Fonts: --font-lab-newsreader (serif display/koppen) + --font-lab-franklin (body/labels).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Newspaper,
  Search,
  MapPin,
  Wallet,
  Clock,
  CalendarDays,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileText,
  RotateCw,
  CircleAlert,
  Plus,
  Minus,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  ArrowDownRight,
  Hourglass,
  ShieldCheck,
  Quote,
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

// Newsprint palette. Warm off-white paper, ink-black tekst, één oxbloed-rood rubrieksaccent.
const C = {
  paper: "#f7f4ec",
  paperDeep: "#f1ede1",
  paperEdge: "#efe9db",
  card: "#fbf9f2",
  rule: "#1c1a15",
  ruleSoft: "#cdc6b4",
  ruleHair: "#ddd6c4",
  ink: "#1a1813",
  fg: "#2c281f",
  fgSoft: "#4a4437",
  muted: "#736c5b",
  faint: "#9a927e",
  red: "#8a271f",
  redDeep: "#6f1e18",
  redSoft: "#eaddd6",
  redWash: "#f2e6df",
  green: "#33502f",
  greenSoft: "#dde6d5",
  amber: "#8a5a12",
  amberSoft: "#efe2c6",
  blue: "#26415e",
  blueSoft: "#d9e2ea",
};

const serif = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const sans = { fontFamily: "var(--font-lab-franklin), system-ui, sans-serif" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Newspaper,
  marktplaats: Search,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Check,
  facturen: Wallet,
  documenten: FileText,
  berichten: Quote,
};

// Elk scherm draait onder een eigen krantenkatern met rubrieksnaam + editie-katern.
const KATERN: Record<ScreenKey, { rubriek: string; katern: string }> = {
  dashboard: { rubriek: "Voorpagina", katern: "Katern A" },
  marktplaats: { rubriek: "Vacatures", katern: "Katern B" },
  opdracht: { rubriek: "Hoofdartikel", katern: "Katern B" },
  verificatie: { rubriek: "Dossier", katern: "Katern C" },
  acties: { rubriek: "Agenda", katern: "Katern C" },
  facturen: { rubriek: "Beurs & Financiën", katern: "Katern D" },
  documenten: { rubriek: "Dossier", katern: "Katern C" },
  berichten: { rubriek: "Ingezonden", katern: "Katern C" },
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a271f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec]";

// Editiedatum + oplopend editienummer — vaste redactionele koptekst.
const EDITIE = {
  datum: "Maandag 13 juli 2026",
  nummer: "Nr. 2.041",
  jaargang: "Jaargang XII",
  prijs: "Onafhankelijk sinds 2014",
};

// ---- Primitives -------------------------------------------------------------

// Verticale kolomscheiding — de haarlijn tussen krantenkolommen.
function ColRule() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-3 left-0 hidden w-px lg:block"
      style={{ background: C.ruleHair }}
    />
  );
}

// Rubrieks-kop met dubbele haarlijn — het typische krantenkop-idioom.
function Kicker({ children, tone = C.red }: { children: ReactNode; tone?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="h-2 w-2 rounded-full" style={{ background: tone }} aria-hidden="true" />
      <span
        className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
        style={{ ...sans, color: tone }}
      >
        {children}
      </span>
      <span className="h-px flex-1" style={{ background: C.ruleSoft }} aria-hidden="true" />
    </div>
  );
}

function cardStyle(): CSSProperties {
  return {
    background: C.card,
    border: `1px solid ${C.ruleSoft}`,
  };
}

function Article({
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

// Statusvocabulaire voor verificatie — label + icoon + inkttint (nooit kleur-alleen).
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.green, soft: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, tone: C.blue, soft: C.blueSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.amber, soft: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, soft: C.redSoft };
  }
}

function StatusStamp({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
      style={{ ...sans, color: tone, background: soft, border: `1px solid ${tone}` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Match-notering in beurs-stijl: koers + pijl. Groen op, rood af.
function MatchQuote({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.green : value >= 82 ? C.amber : C.red;
  const big = size === "md";
  return (
    <span
      className="inline-flex items-baseline gap-1"
      aria-label={`Match ${value} procent`}
      style={{ color: tone }}
    >
      <span
        className={`font-semibold tabular-nums leading-none ${big ? "text-[26px]" : "text-[19px]"}`}
        style={{ ...serif }}
      >
        {value}
      </span>
      <span className={`font-semibold ${big ? "text-[14px]" : "text-[12px]"}`} style={{ ...serif }}>
        %
      </span>
    </span>
  );
}

// Krantengrafiek — een strakke lijn-koers op ruitjes, inkt-op-papier.
function InkChart({ data, tone, height = 40 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 62 - 20;
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
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.1} fill={tone} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// Massief inkt-knop (primair) — donkere drukinkt, oplicht naar rood bij hover.
function InkButton({
  children,
  onClick,
  tone = C.rule,
  hoverTone = C.red,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  hoverTone?: string;
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
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{ ...sans, color: C.paper, background: hot ? hoverTone : tone }}
    >
      {children}
    </button>
  );
}

// Lijn-knop (secundair) — omkaderd met inktlijn, vult zich bij hover/actief.
function LineButton({
  children,
  onClick,
  tone = C.ink,
  soft = C.paperDeep,
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
  const filled = active || hot;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: filled ? C.paper : tone,
        background: filled ? tone : soft,
        border: `1px solid ${tone}`,
      }}
    >
      {children}
    </button>
  );
}

function ScreenHead({
  screenKey,
  title,
  lead,
}: {
  screenKey: ScreenKey;
  title: string;
  lead?: string;
}) {
  const k = KATERN[screenKey];
  return (
    <div className="mb-7">
      <div
        className="mb-4 flex flex-wrap items-center justify-between gap-2 pb-2"
        style={{ borderBottom: `2px solid ${C.rule}` }}
      >
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
          style={{ ...sans, color: C.red }}
        >
          {k.rubriek}
        </span>
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...sans, color: C.muted }}
        >
          {k.katern} · {EDITIE.nummer}
        </span>
      </div>
      <h1
        className="text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[40px]"
        style={{ ...serif, color: C.ink }}
      >
        {title}
      </h1>
      {lead && (
        <p
          className="mt-3 max-w-2xl text-[15px] italic leading-relaxed"
          style={{ ...serif, color: C.fgSoft }}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const rest = OPDRACHTEN.slice(1);
  const voornaam = PROFIEL.naam.split(" ")[0];
  const kpiTones = [C.red, C.green, C.blue, C.amber];
  return (
    <div>
      {/* Masthead-lead: het voorpagina-hoofdartikel */}
      <div
        className="mb-8 pb-6"
        style={{ borderTop: `3px solid ${C.rule}`, borderBottom: `1px solid ${C.ruleSoft}` }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 pt-4">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
            style={{ ...sans, color: C.red }}
          >
            Voorpagina · {PROFIEL.plaats}-editie
          </span>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...sans, color: C.muted }}
          >
            {EDITIE.datum}
          </span>
        </div>
        <h1
          className="mt-3 text-[34px] font-semibold leading-[1.03] tracking-tight sm:text-[46px]"
          style={{ ...serif, color: C.ink }}
        >
          Goedemorgen, {voornaam} — uw week in het kort
        </h1>
        <p className="mt-2 text-[14px] font-semibold" style={{ ...sans, color: C.muted }}>
          {PROFIEL.rol} · {PROFIEL.plaats}
        </p>
      </div>

      {/* Beurs-lint: de KPI's als koersnoteringen */}
      <div
        className="mb-9 grid grid-cols-2 gap-0 lg:grid-cols-4"
        style={{ border: `1px solid ${C.ruleSoft}` }}
      >
        {KPIS.map((k, i) => {
          const Trend = k.up ? ArrowUpRight : ArrowDownRight;
          const tone = kpiTones[i % kpiTones.length] ?? C.red;
          const trendTone = k.up ? C.green : C.red;
          return (
            <div
              key={k.label}
              className="relative p-4"
              style={{
                background: C.card,
                borderRight: i % 4 !== 3 ? `1px solid ${C.ruleHair}` : undefined,
                borderBottom: i < 2 ? `1px solid ${C.ruleHair}` : undefined,
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...sans, color: C.muted }}
              >
                {k.label}
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span
                  className="text-[24px] font-semibold tabular-nums leading-none"
                  style={{ ...serif, color: C.ink }}
                >
                  {k.value}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...sans, color: trendTone }}
                >
                  <Trend size={12} strokeWidth={2.4} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div className="mt-2.5">
                <InkChart data={k.spark} tone={tone} height={30} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Drie-koloms voorpagina: hoofdartikel + zijkolom */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Kicker>Beste match van vandaag</Kicker>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full text-left transition-colors duration-200 ${RING}`}
            style={{ ...cardStyle() }}
          >
            <span className="block p-6">
              <span className="flex items-start justify-between gap-4">
                <span
                  className="text-[24px] font-semibold leading-[1.08] tracking-tight"
                  style={{ ...serif, color: C.ink }}
                >
                  {top.titel}
                </span>
                <span className="shrink-0 text-right">
                  <MatchQuote value={top.match} />
                  <span
                    className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em]"
                    style={{ ...sans, color: C.muted }}
                  >
                    match
                  </span>
                </span>
              </span>
              <span
                className="mt-1 block text-[12.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.red }}
              >
                {top.opdrachtgever} · {top.plaats}
              </span>
              {/* Drop cap op de eerste alinea */}
              <span
                className="mt-4 block text-[14px] leading-relaxed"
                style={{ ...serif, color: C.fgSoft }}
              >
                <span
                  className="float-left mr-2 mt-1 font-semibold leading-[0.72]"
                  style={{ ...serif, color: C.red, fontSize: "52px" }}
                  aria-hidden="true"
                >
                  {top.titel.charAt(0)}
                </span>
                Een opdracht bij {top.opdrachtgever} in {top.plaats}, {top.tarief}, voor {top.uren}.
                Aanvang {top.start.toLowerCase()}. De redactie beoordeelt de aansluiting op uw
                profiel als bovengemiddeld — lees het volledige dossier voor de onderbouwing.
              </span>
              <span className="mt-4 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                    style={{ ...sans, color: C.fgSoft, background: C.paperDeep }}
                  >
                    {t}
                  </span>
                ))}
              </span>
              <span
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em]"
                style={{ ...sans, color: C.red }}
              >
                Lees het dossier
                <ArrowRight
                  size={14}
                  strokeWidth={2.4}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>

          {/* Overige noteringen — kort nieuws in twee kolommen */}
          <div className="mt-7">
            <Kicker tone={C.ink}>Verder in de vacatures</Kicker>
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
              {rest.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o)}
                  className={`group relative block p-5 text-left transition-colors duration-200 hover:bg-[#f1ede1] ${RING}`}
                  style={{
                    borderTop: `1px solid ${C.ruleSoft}`,
                    borderLeft: i % 2 === 1 ? `1px solid ${C.ruleHair}` : undefined,
                  }}
                >
                  <span
                    className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...sans, color: C.red }}
                  >
                    {o.opdrachtgever}
                  </span>
                  <span
                    className="mt-1 block text-[17px] font-semibold leading-tight tracking-tight"
                    style={{ ...serif, color: C.ink }}
                  >
                    {o.titel}
                  </span>
                  <span
                    className="mt-1.5 flex items-center gap-2 text-[12px]"
                    style={{ ...sans, color: C.muted }}
                  >
                    <MapPin size={12} strokeWidth={2} aria-hidden="true" />
                    {o.plaats} · {o.tarief}
                  </span>
                  <span className="mt-2 inline-flex items-baseline gap-1">
                    <MatchQuote value={o.match} size="sm" />
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.12em]"
                      style={{ ...sans, color: C.muted }}
                    >
                      match
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zijkolom: agenda + vertrouwensmerk */}
        <div className="relative lg:pl-8">
          <ColRule />
          <Kicker tone={C.red}>Agenda — vraagt aandacht</Kicker>
          <ul className="space-y-0">
            {ACTIES.map((a, i) => {
              const tone = a.urgentie === "warning" ? C.red : C.blue;
              return (
                <li
                  key={a.titel}
                  className="py-3.5"
                  style={{ borderBottom: `1px solid ${C.ruleHair}` }}
                >
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="text-[13px] font-semibold tabular-nums leading-none"
                      style={{ ...serif, color: tone }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13.5px] font-semibold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-[0.06em]"
                        style={{ ...sans, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={11} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Article className="mt-6 p-5" style={{ background: C.paperDeep, borderColor: C.rule }}>
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center"
                style={{ background: C.green, color: C.paper }}
                aria-hidden="true"
              >
                <ShieldCheck size={18} strokeWidth={2} />
              </span>
              <div>
                <div
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.06em]"
                  style={{ ...sans, color: C.green }}
                >
                  {PROFIEL.trust}
                  <BadgeCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                </div>
                <p
                  className="mt-1 text-[12.5px] leading-relaxed"
                  style={{ ...serif, color: C.fgSoft }}
                >
                  Uw documenten zijn geverifieerd. Opdrachtgevers zien direct dat uw dossier klopt.
                </p>
              </div>
            </div>
          </Article>
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
        title="Vacatures & aanbestedingen"
        lead="De redactie rangschikt open opdrachten en licht eerlijk toe waar de aansluiting knelt."
      />

      <div
        className="mb-7 flex items-center gap-2.5 px-4 py-3"
        style={{ background: C.card, border: `1px solid ${C.rule}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.red }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats, opdrachtgever of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-55"
          style={{ ...sans, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] ${RING}`}
            style={{ ...sans, color: C.paper, background: C.red }}
          >
            Wis
          </button>
        )}
      </div>

      <div
        className="mb-5 flex items-center justify-between pb-2"
        style={{ borderBottom: `1px solid ${C.ruleSoft}` }}
      >
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
          style={{ ...sans, color: C.muted }}
        >
          {filtered.length} {filtered.length === 1 ? "notering" : "noteringen"}
        </span>
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ ...sans, color: C.faint }}
        >
          Gesorteerd op aansluiting
        </span>
      </div>

      {filtered.length === 0 ? (
        <Article className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ background: C.paperDeep, color: C.red }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={1.8} />
          </span>
          <h3 className="text-[24px] font-semibold" style={{ ...serif, color: C.ink }}>
            Geen noteringen gevonden
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...serif, color: C.muted }}>
            Geen resultaat voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Article>
      ) : (
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            const tone = o.match >= 90 ? C.green : o.match >= 82 ? C.amber : C.red;
            return (
              <div
                key={o.id}
                className="group flex h-full flex-col p-6 transition-colors duration-200 hover:bg-[#fbf9f2]"
                style={{
                  borderTop: `1px solid ${C.ruleSoft}`,
                  borderLeft: `1px solid ${C.ruleHair}`,
                  borderBottom: `1px solid ${C.ruleHair}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...sans, color: C.faint }}
                  >
                    {o.id} · Positie {idx + 1}
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit knipsels" : "Bewaar als knipsel"}
                    className={`flex h-8 w-8 items-center justify-center transition-colors ${RING}`}
                    style={{
                      color: isSaved ? C.paper : C.muted,
                      background: isSaved ? C.red : "transparent",
                      border: `1px solid ${isSaved ? C.red : C.ruleSoft}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <span
                  className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...sans, color: C.red }}
                >
                  {o.opdrachtgever}
                </span>
                <h3
                  className="mt-1 text-[19px] font-semibold leading-[1.1] tracking-tight"
                  style={{ ...serif, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <MatchQuote value={o.match} size="sm" />
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...sans, color: C.muted }}
                  >
                    aansluiting
                  </span>
                </div>
                <dl
                  className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                  style={{ ...sans, color: C.fgSoft }}
                >
                  {[
                    { Icon: MapPin, v: o.plaats },
                    { Icon: Wallet, v: o.tarief },
                    { Icon: Clock, v: o.uren },
                    { Icon: CalendarDays, v: o.start },
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
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]"
                      style={{ ...sans, color: C.fgSoft, background: C.paperDeep }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-5">
                  <InkButton
                    onClick={() => onOpen(o)}
                    hoverTone={tone}
                    className="w-full"
                    ariaLabel={`Bekijk ${o.titel}`}
                  >
                    Lees het dossier
                    <ArrowRight
                      size={14}
                      strokeWidth={2.4}
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
      <div className="mb-5">
        <LineButton onClick={onBack} ariaLabel="Terug naar vacatures">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug naar vacatures
        </LineButton>
      </div>

      {/* Artikel-kop met byline */}
      <div className="pb-5" style={{ borderBottom: `2px solid ${C.rule}` }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
            style={{ ...sans, color: C.red }}
          >
            Hoofdartikel · {opdracht.id}
          </span>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...sans, color: C.muted }}
          >
            {EDITIE.datum}
          </span>
        </div>
        <h1
          className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[42px]"
          style={{ ...serif, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13.5px] font-semibold" style={{ ...sans, color: C.fgSoft }}>
            Door de redactie · {opdracht.opdrachtgever}, {opdracht.plaats}
          </span>
          <LineButton
            onClick={() => toggleSave(opdracht.id)}
            active={isSaved}
            ariaPressed={isSaved}
            ariaLabel={isSaved ? "Verwijder uit knipsels" : "Bewaar als knipsel"}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Knip uit"}
          </LineButton>
        </div>
      </div>

      {/* Feiten-strook in beurs-stijl */}
      <div
        className="grid grid-cols-2 gap-0 sm:grid-cols-4"
        style={{ borderBottom: `1px solid ${C.ruleSoft}` }}
      >
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: CalendarDays, label: "Aanvang", value: opdracht.start },
          { Icon: MapPin, label: "Standplaats", value: opdracht.plaats },
        ].map((m, i) => (
          <div
            key={m.label}
            className="p-4"
            style={{ borderRight: i !== 3 ? `1px solid ${C.ruleHair}` : undefined }}
          >
            <m.Icon size={15} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
            <div
              className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.muted }}
            >
              {m.label}
            </div>
            <div className="text-[14px] font-semibold" style={{ ...serif, color: C.ink }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Twee-koloms artikelbody met drop cap */}
      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-baseline gap-3">
            <MatchQuote value={opdracht.match} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.muted }}
            >
              beoordeelde aansluiting
            </span>
          </div>
          <p className="mt-4 text-[14.5px] leading-[1.7]" style={{ ...serif, color: C.fg }}>
            <span
              className="float-left mr-2.5 mt-1 font-semibold leading-[0.7]"
              style={{ ...serif, color: C.red, fontSize: "58px" }}
              aria-hidden="true"
            >
              {opdracht.opdrachtgever.charAt(0)}
            </span>
            {opdracht.opdrachtgever} zoekt versterking voor de functie{" "}
            {opdracht.titel.toLowerCase()} in {opdracht.plaats}. Geboden wordt {opdracht.tarief}{" "}
            voor {opdracht.uren}, met aanvang {opdracht.start.toLowerCase()}. De redactie heeft de
            opdracht naast uw geverifieerde profiel gelegd en komt tot een aansluiting van{" "}
            {opdracht.match} procent — ruim boven het gemiddelde van vergelijkbare noteringen op de
            markt.
          </p>
          <p className="mt-3 text-[14.5px] leading-[1.7]" style={{ ...serif, color: C.fg }}>
            Onderstaand leest u de volledige onderbouwing: de punten die in uw voordeel spreken en
            de aandachtspunten die vóór een reactie het overwegen waard zijn.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-0 sm:grid-cols-2">
            <div className="p-5" style={{ borderTop: `2px solid ${C.green}`, background: C.card }}>
              <div
                className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.green }}
              >
                <Plus size={13} strokeWidth={2.6} aria-hidden="true" />
                In uw voordeel
              </div>
              <ul className="space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13.5px] leading-snug"
                    style={{ ...serif, color: C.fg }}
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
            <div
              className="p-5"
              style={{
                borderTop: `2px solid ${C.amber}`,
                borderLeft: `1px solid ${C.ruleHair}`,
                background: C.card,
              }}
            >
              <div
                className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.amber }}
              >
                <Minus size={13} strokeWidth={2.6} aria-hidden="true" />
                Aandachtspunten
              </div>
              <ul className="space-y-2.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13.5px] leading-snug"
                    style={{ ...serif, color: C.muted }}
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
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <InkButton
              onClick={() => setApplied((v) => !v)}
              tone={applied ? C.green : C.rule}
              hoverTone={applied ? C.green : C.red}
              ariaPressed={applied}
              className="px-6 py-3 text-[13px]"
            >
              {applied ? (
                <Check size={16} strokeWidth={2.6} aria-hidden="true" />
              ) : (
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              )}
              {applied ? "Reactie verstuurd" : "Reageer op deze opdracht"}
            </InkButton>
            {applied && (
              <span className="text-[12.5px] italic" style={{ ...serif, color: C.muted }}>
                De opdrachtgever reageert gemiddeld binnen zes uur.
              </span>
            )}
          </div>
        </div>

        {/* Zijkolom: kader met tags en citaat */}
        <div className="relative lg:pl-8">
          <ColRule />
          <Kicker tone={C.ink}>Kerngegevens</Kicker>
          <div className="flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.05em]"
                style={{ ...sans, color: C.fgSoft, background: C.paperDeep }}
              >
                {t}
              </span>
            ))}
          </div>
          <blockquote
            className="mt-6 p-5"
            style={{ borderLeft: `3px solid ${C.red}`, background: C.card }}
          >
            <Quote size={20} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
            <p
              className="mt-2 text-[15px] italic leading-relaxed"
              style={{ ...serif, color: C.ink }}
            >
              &ldquo;Een verifieerbaar profiel weegt bij ons zwaarder dan het uurtarief.&rdquo;
            </p>
            <footer
              className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ ...sans, color: C.muted }}
            >
              — Planning, {opdracht.opdrachtgever}
            </footer>
          </blockquote>
        </div>
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
        title="Het dossier — geverifieerd"
        lead="Elke status draagt een label én een icoon, nooit uitsluitend een kleur."
      />

      {/* Legenda van de vier statussen */}
      <div
        className="mb-7 grid grid-cols-2 gap-0 sm:grid-cols-4"
        style={{ border: `1px solid ${C.ruleSoft}` }}
      >
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s, i) => {
          const { label, Icon, tone } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-4 py-3.5"
              style={{
                background: C.card,
                borderRight: i !== 3 ? `1px solid ${C.ruleHair}` : undefined,
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center"
                style={{ background: tone, color: C.paper }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ ...sans, color: C.ink }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Article
        className="mb-7 flex items-center gap-4 p-5"
        style={{ background: C.paperDeep, borderColor: C.rule }}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          style={{ background: C.green, color: C.paper }}
          aria-hidden="true"
        >
          <ShieldCheck size={22} strokeWidth={2} />
        </span>
        <div>
          <div
            className="text-[14px] font-bold uppercase tracking-[0.06em]"
            style={{ ...sans, color: C.green }}
          >
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px] leading-relaxed" style={{ ...serif, color: C.fgSoft }}>
            Uw documenten worden versleuteld bewaard en uitsluitend met uw toestemming gedeeld.
          </p>
        </div>
      </Article>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Credentials-register */}
        <div className="lg:col-span-2">
          <Kicker>Register van bewijsstukken</Kicker>
          <div style={{ borderTop: `1px solid ${C.ruleSoft}` }}>
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              const { tone, soft } = statusMeta(c.status);
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-3.5 py-3.5"
                  style={{ borderBottom: `1px solid ${C.ruleHair}` }}
                >
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} gemarkeerd` : `Markeer ${c.naam}`}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${done ? C.green : C.ruleSoft}`,
                      background: done ? C.green : "transparent",
                      color: C.paper,
                    }}
                  >
                    {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{ background: soft, color: tone }}
                    aria-hidden="true"
                  >
                    <FileText size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusStamp status={c.status} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Documentenkluis met feed-states */}
        <div className="relative lg:pl-8">
          <ColRule />
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.red }}
            >
              Documentenkluis
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center transition-colors ${RING}`}
              style={{ background: C.card, color: C.red, border: `1px solid ${C.ruleSoft}` }}
              aria-label="Vernieuw documentenkluis"
            >
              <RotateCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div
            className="mb-4 flex gap-0"
            role="tablist"
            aria-label="Weergave documentenkluis"
            style={{ border: `1px solid ${C.ruleSoft}` }}
          >
            {(["ok", "loading", "error"] as const).map((s, i) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`flex-1 px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.paper : C.muted,
                  background: feedState === s ? C.rule : "transparent",
                  borderRight: i !== 2 ? `1px solid ${C.ruleHair}` : undefined,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={{ border: `1px solid ${C.ruleHair}` }}>
                  <div className="h-3 w-2/3 animate-pulse" style={{ background: C.paperDeep }} />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.paperDeep }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ border: `1px solid ${C.red}`, background: C.redWash }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{ background: C.red, color: C.paper }}
                aria-hidden="true"
              >
                <CircleAlert size={22} strokeWidth={2} />
              </span>
              <div className="text-[16px] font-semibold" style={{ ...serif, color: C.ink }}>
                Editie niet ontvangen
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden uw documentenkluis niet bereiken. Probeer het zo opnieuw.
              </p>
              <div className="mt-1">
                <LineButton onClick={() => setFeedState("ok")} tone={C.red}>
                  Opnieuw laden
                </LineButton>
              </div>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-0" style={{ borderTop: `1px solid ${C.ruleSoft}` }}>
              {DOCUMENTEN.map((d) => {
                const { tone, soft } = statusMeta(d.status);
                return (
                  <li
                    key={d.naam}
                    className="flex items-center gap-3 py-3"
                    style={{ borderBottom: `1px solid ${C.ruleHair}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                      style={{ ...sans, background: soft, color: tone }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13px] font-semibold"
                        style={{ ...sans, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...sans, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <span
                      className="flex h-6 w-6 items-center justify-center"
                      style={{ color: tone }}
                      aria-label={statusMeta(d.status).label}
                    >
                      {(() => {
                        const I = statusMeta(d.status).Icon;
                        return <I size={15} strokeWidth={2.2} aria-hidden="true" />;
                      })()}
                    </span>
                  </li>
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
      <ScreenHead
        screenKey="acties"
        title="Redactionele agenda"
        lead="Wat vandaag om aandacht vraagt — afvinken zodra het is afgehandeld."
      />

      {openCount === 0 ? (
        <Article className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ background: C.greenSoft, color: C.green }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.2} />
          </span>
          <h3 className="text-[24px] font-semibold" style={{ ...serif, color: C.ink }}>
            De agenda is leeg
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...serif, color: C.muted }}>
            Alles is afgehandeld. De editie kan naar de pers.
          </p>
        </Article>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 px-4 py-2"
            style={{ background: C.rule }}
          >
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ ...serif, color: C.paper }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.paper }}
            >
              {openCount === 1 ? "punt open" : "punten open"}
            </span>
          </div>

          <ul style={{ borderTop: `2px solid ${C.rule}` }}>
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const tone = isDone ? C.green : a.urgentie === "warning" ? C.red : C.blue;
              return (
                <li
                  key={a.titel}
                  className="flex items-start gap-4 py-4"
                  style={{ borderBottom: `1px solid ${C.ruleHair}` }}
                >
                  <span
                    className="mt-0.5 w-8 shrink-0 text-[18px] font-semibold tabular-nums leading-none"
                    style={{ ...serif, color: isDone ? C.faint : tone }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.ruleSoft}`,
                      background: isDone ? C.green : "transparent",
                      color: C.paper,
                    }}
                  >
                    {isDone && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[17px] font-semibold leading-snug"
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
                      className="mt-1 text-[13px] leading-relaxed"
                      style={{ ...sans, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-[0.06em]"
                        style={{ ...sans, color: tone }}
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
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusMap = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.green, soft: C.greenSoft, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.red, soft: C.redSoft, Icon: Clock }
        : { tone: C.muted, soft: C.paperDeep, Icon: FileText };

  // Totaalregel — som van de betaalde en openstaande bedragen (concept telt niet mee).
  const parseBedrag = (b: string): number =>
    Number(
      b
        .replace(/[^0-9.,]/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    ) || 0;
  const totaal = FACTUREN.reduce((sum, f) => sum + parseBedrag(f.bedrag), 0);
  const totaalStr = `€ ${totaal.toLocaleString("nl-NL")}`;

  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Beurs & Financiën"
        lead="De stand van uw facturen — noteringen, koersen en het slotresultaat."
      />

      {/* Index-strook */}
      <div
        className="mb-7 grid grid-cols-1 gap-0 sm:grid-cols-4"
        style={{ border: `1px solid ${C.rule}` }}
      >
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green, delta: "+12%", up: true },
          { label: "Openstaand", value: "€ 1.350", tone: C.red, delta: "2 open", up: false },
          { label: "Concept", value: "€ 880", tone: C.muted, delta: "1 stuk", up: false },
        ].map((s, i) => (
          <div
            key={s.label}
            className="p-4"
            style={{ borderRight: `1px solid ${C.ruleHair}`, background: C.card }}
          >
            <div
              className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...serif, color: s.tone }}
            >
              {s.value}
            </div>
            <div
              className="mt-1.5 inline-flex items-center gap-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
              style={{ ...sans, color: i === 0 ? C.green : C.muted }}
            >
              {i === 0 && <ArrowUpRight size={11} strokeWidth={2.4} aria-hidden="true" />}
              {s.delta}
            </div>
          </div>
        ))}
        <div className="p-4" style={{ background: C.card }}>
          <div
            className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{ ...sans, color: C.muted }}
          >
            Koersverloop
          </div>
          <div className="mt-1">
            <InkChart data={trend} tone={C.blue} height={40} />
          </div>
        </div>
      </div>

      {/* Beurs-tabel */}
      <div style={{ border: `1px solid ${C.rule}` }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left" style={{ ...sans }}>
            <thead>
              <tr style={{ background: C.rule }}>
                {["Fonds", "Klant", "Datum", "Koers", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                      i === 3 ? "text-right" : ""
                    }`}
                    style={{ color: C.paper }}
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
                    style={{ borderBottom: `1px solid ${C.ruleHair}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.paperDeep)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3 text-[12px] font-bold tabular-nums"
                      style={{ color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ color: C.fg }}>
                      {f.klant}
                    </td>
                    <td className="px-3 py-3 text-[12px] tabular-nums" style={{ color: C.muted }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-[14px] font-semibold tabular-nums"
                      style={{ ...serif, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{
                          color: sm.tone,
                          background: sm.soft,
                          border: `1px solid ${sm.tone}`,
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
              <tr style={{ borderTop: `2px solid ${C.rule}` }}>
                <td
                  className="px-3 py-3 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.muted }}
                  colSpan={3}
                >
                  Slotstand · alle noteringen
                </td>
                <td
                  className="px-3 py-3 text-right text-[16px] font-semibold tabular-nums"
                  style={{ ...serif, color: C.ink }}
                >
                  {totaalStr}
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept282() {
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
      style={{ ...sans, color: C.fg, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Masthead met haarlijnen boven en onder */}
        <header>
          <div
            className="flex items-center justify-between gap-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...sans, color: C.muted, borderBottom: `1px solid ${C.ruleHair}` }}
          >
            <span>{EDITIE.jaargang}</span>
            <span className="hidden sm:inline">{EDITIE.datum}</span>
            <span>{EDITIE.nummer}</span>
          </div>
          <div
            className="flex flex-wrap items-center justify-between gap-3 py-3"
            style={{ borderBottom: `3px double ${C.rule}` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{ background: C.rule, color: C.paper }}
                aria-hidden="true"
              >
                <Newspaper size={22} strokeWidth={1.8} />
              </span>
              <div>
                <div
                  className="text-[30px] font-semibold leading-none tracking-tight sm:text-[38px]"
                  style={{ ...serif, color: C.ink }}
                >
                  De Courant
                </div>
                <div
                  className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.28em]"
                  style={{ ...sans, color: C.red }}
                >
                  ZZP Platform · {EDITIE.prijs}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-[12.5px] font-semibold" style={{ ...serif, color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ ...sans, color: C.green }}
                >
                  <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                  {PROFIEL.trust}
                </div>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
                style={{
                  ...serif,
                  background: C.paperDeep,
                  color: C.ink,
                  border: `1px solid ${C.rule}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>
        </header>

        {/* Katern-navigatie */}
        <nav
          className="mb-8 flex flex-wrap gap-0 overflow-x-auto"
          aria-label="Katernen"
          style={{ borderBottom: `1px solid ${C.ruleSoft}` }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-200 ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.paper : C.fgSoft,
                  background: on ? C.rule : "transparent",
                  borderBottom: on ? `2px solid ${C.red}` : "2px solid transparent",
                }}
              >
                <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
          style={{ ...sans, borderTop: `2px solid ${C.rule}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Newspaper size={12} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
            {SCREENS.length} katernen · Courant editie 282
          </span>
          <span>Onafhankelijk · gedrukt op krantenpapier</span>
        </footer>
      </div>
    </div>
  );
}
