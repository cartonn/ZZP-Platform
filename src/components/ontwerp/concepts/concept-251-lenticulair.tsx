"use client";

// Concept 251 — "Lenticulair" · Kantelbeeld & parallax-reveal.
// Signatuur: optische lenticulaire-lens esthetiek. Panelen dragen een subtiele diagonale
// ribbel-textuur (repeating-linear-gradient) als lens-ridges. Kern-interactie: tegels en
// kaarten onthullen op hover/focus een tweede laag via parallax-verschuiving; op een
// opdracht-kaart "kantelen" de match-redenen (plus/min) in beeld. Twee accenten schuiven
// van hoek: indigo → magenta. Motion-forward maar smaakvol — prefers-reduced-motion wordt
// gerespecteerd en essentiële info staat nooit alléén in de beweging.
// Fonts: Space Grotesk (koppen) + Inter (body). Cijfers tabular-nums.

import { useState, type CSSProperties } from "react";
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
  Layers,
  MoveRight,
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

// Light lenticular palette. Two accents that shift indigo -> magenta across the surface.
const C = {
  bg: "#f4f4fb",
  panel: "#ffffff",
  panelSoft: "#f7f7fd",
  ridge: "rgba(67,56,202,0.05)",
  ridgeMag: "rgba(219,39,119,0.05)",
  line: "rgba(30,27,75,0.1)",
  lineStrong: "rgba(30,27,75,0.18)",
  ink: "#1a1830",
  inkSoft: "#4a4770",
  muted: "#6f6c92",
  faint: "#9c9bb0",
  indigo: "#4338ca",
  indigoSoft: "#e7e5fb",
  magenta: "#db2777",
  magentaSoft: "#fbe3f0",
  green: "#0f7a52",
  greenSoft: "#dcf3e9",
  amber: "#9a6112",
  amberSoft: "#f6ecd6",
  red: "#b3261e",
  redSoft: "#f8dedb",
};

const display = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Layers,
};

const grad = `linear-gradient(115deg, ${C.indigo} 0%, ${C.magenta} 100%)`;

// Scoped CSS: lens ridges, parallax reveal layers, and reduced-motion fallbacks.
const CSS = `
.lent-ridge::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background-image:repeating-linear-gradient(118deg,${C.ridge} 0 1.5px,transparent 1.5px 8px);
  opacity:.9;}
.lent-ridge-mag::before{background-image:repeating-linear-gradient(118deg,${C.ridgeMag} 0 1.5px,transparent 1.5px 8px);}
.lent-lens{position:relative;overflow:hidden;isolation:isolate;}
.lent-front,.lent-back{transition:transform .5s cubic-bezier(.2,.75,.2,1),opacity .5s ease;will-change:transform,opacity;}
.lent-back{position:absolute;inset:0;opacity:0;transform:translateX(14%);}
.lent-lens:hover .lent-front,.lent-lens:focus-within .lent-front{transform:translateX(-9%);opacity:0;}
.lent-lens:hover .lent-back,.lent-lens:focus-within .lent-back{transform:translateX(0);opacity:1;}
.lent-shift{transition:transform .45s cubic-bezier(.2,.75,.2,1);}
.lent-lens:hover .lent-shift,.lent-lens:focus-within .lent-shift{transform:translateX(4px);}
.lent-hint{transition:opacity .4s ease,transform .4s ease;}
.lent-lens:hover .lent-hint,.lent-lens:focus-within .lent-hint{opacity:0;transform:translateY(-6px);}
@media (prefers-reduced-motion: reduce){
  .lent-front,.lent-back,.lent-shift,.lent-hint{transition:none!important;}
  .lent-back{transform:none;}
  .lent-lens:hover .lent-front,.lent-lens:focus-within .lent-front{transform:none;}
}
`;

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.indigo, bg: C.indigoSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: fg, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function panelStyle(): CSSProperties {
  return {
    background: C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 16,
    boxShadow: "0 10px 30px -20px rgba(30,27,75,0.35)",
  };
}

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 78 - 11;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1
        className="text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...body, color: C.muted }}
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
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <div className="mb-6">
        <div
          className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ ...body, color: C.magenta }}
        >
          <Layers size={12} strokeWidth={2.6} aria-hidden="true" />
          Kantelbeeld
        </div>
        <h1
          className="text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]"
          style={{ ...display, color: C.ink }}
        >
          Dag {voornaam} — beweeg over de tegels
        </h1>
        <p className="mt-1.5 text-[13.5px]" style={{ ...body, color: C.muted }}>
          Elke tegel kantelt naar een tweede laag met verdieping. Eén punt vraagt vandaag aandacht.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} className="lent-lens lent-ridge p-4" style={panelStyle()}>
              <div className="lent-front">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium" style={{ ...body, color: C.muted }}>
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...body, color: k.up ? C.green : C.amber }}
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
                <div
                  className="lent-hint mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ ...body, color: C.faint }}
                >
                  <MoveRight size={11} strokeWidth={2.4} aria-hidden="true" />
                  Kantel
                </div>
              </div>
              <div
                className="lent-back flex flex-col justify-between p-4"
                style={{ background: C.panelSoft, borderRadius: 15 }}
                aria-hidden="true"
              >
                <span className="text-[11px] font-semibold" style={{ ...body, color: C.indigo }}>
                  Verloop 7 dagen
                </span>
                <Sparkline data={k.spark} tone={C.magenta} />
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
              style={{ background: grad }}
              aria-hidden="true"
            />
            <h2 className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
              Sterkste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className="lent-lens lent-ridge group flex w-full items-start gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
            style={panelStyle()}
          >
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl leading-none text-white"
              style={{ background: grad }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-bold tabular-nums" style={display}>
                {top.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[18px] font-bold leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ ...body, background: C.indigoSoft, color: C.indigo }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="lent-shift mt-1 shrink-0"
              style={{ color: C.magenta }}
              aria-hidden="true"
            />
          </button>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPDRACHTEN.slice(1).map((o) => (
              <div
                key={o.id}
                className="lent-lens lent-ridge lent-ridge-mag p-4"
                style={panelStyle()}
              >
                <div className="lent-front">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ ...display, color: C.magenta }}
                    >
                      {o.match}% match
                    </span>
                    <span className="text-[11px]" style={{ ...body, color: C.faint }}>
                      {o.plaats}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 text-[14px] font-semibold leading-tight"
                    style={{ ...body, color: C.ink }}
                  >
                    {o.titel}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...body, color: C.muted }}>
                    {o.tarief} · {o.uren}
                  </div>
                </div>
                <div
                  className="lent-back flex flex-col justify-center gap-1.5 p-4"
                  style={{ background: C.magentaSoft, borderRadius: 15 }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ ...body, color: C.magenta }}
                  >
                    Waarom
                  </span>
                  {o.redenen.plus.slice(0, 2).map((r) => (
                    <span
                      key={r}
                      className="flex items-start gap-1.5 text-[11.5px]"
                      style={{ ...body, color: C.inkSoft }}
                    >
                      <Check
                        size={12}
                        strokeWidth={2.8}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.green }}
                      />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="h-4 w-1.5 rounded-full"
              style={{ background: grad }}
              aria-hidden="true"
            />
            <h2 className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
              Vandaag
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <li key={a.titel} className="lent-ridge p-4" style={panelStyle()}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: a.urgentie === "warning" ? C.amber : C.indigo }}
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
                  style={{ ...body, color: C.muted }}
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
        title="Marktplaats met kantelbeeld"
        sub="Elke kaart kantelt naar de match-redenen — plus én aandachtspunten. Beweeg of focus om te onthullen."
      />

      <div className="lent-ridge mb-5 flex items-center gap-2 px-4 py-2.5" style={panelStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.indigo }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-md px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
            style={{ ...body, color: C.indigo, background: C.indigoSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="lent-ridge flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style={{ background: grad }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-lg px-5 py-2 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...body, background: C.indigo }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="lent-lens lent-ridge flex h-full flex-col p-5"
                style={panelStyle()}
              >
                <div className="lent-front flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl leading-none text-white"
                      style={{ background: grad }}
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
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
                      style={{
                        background: isSaved ? C.magentaSoft : C.panelSoft,
                        color: isSaved ? C.magenta : C.muted,
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
                    className="mt-3 text-[16px] font-bold leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.muted }}>
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                    style={{ ...body, color: C.inkSoft }}
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
                  <div
                    className="lent-hint mt-auto inline-flex items-center gap-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ ...body, color: C.faint }}
                  >
                    <MoveRight size={12} strokeWidth={2.4} aria-hidden="true" />
                    Kantel voor redenen
                  </div>
                </div>
                <div
                  className="lent-back flex flex-col p-5"
                  style={{ background: C.panelSoft, borderRadius: 15 }}
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ ...body, color: C.magenta }}
                  >
                    Verklaarde match
                  </span>
                  <ul className="mt-2 space-y-1.5">
                    {o.redenen.plus.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-1.5 text-[12px]"
                        style={{ ...body, color: C.inkSoft }}
                      >
                        <Check
                          size={13}
                          strokeWidth={2.8}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.green }}
                          aria-hidden="true"
                        />
                        {r}
                      </li>
                    ))}
                    {o.redenen.min.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-1.5 text-[12px]"
                        style={{ ...body, color: C.inkSoft }}
                      >
                        <TriangleAlert
                          size={13}
                          strokeWidth={2.4}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.amber }}
                          aria-hidden="true"
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onOpen(o)}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ ...body, background: grad }}
                  >
                    Bekijk opdracht
                    <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
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
        className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
        style={{
          ...body,
          color: C.inkSoft,
          background: C.panelSoft,
          border: `1px solid ${C.line}`,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="lent-ridge p-6" style={panelStyle()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl leading-none text-white"
              style={{ background: grad }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-bold tabular-nums" style={display}>
                {opdracht.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div>
              <h2
                className="text-[24px] font-bold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...body, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
            style={{
              ...body,
              color: isSaved ? C.magenta : C.inkSoft,
              background: isSaved ? C.magentaSoft : C.panelSoft,
              border: `1px solid ${C.line}`,
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

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: C.panelSoft }}>
              <m.Icon size={15} style={{ color: C.indigo }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...body, color: C.muted }}
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
        <div className="lent-ridge p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
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
        <div className="lent-ridge lent-ridge-mag p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: C.amberSoft, color: C.amber }}
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
                  style={{ color: C.amber }}
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
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...body,
            background: applied ? C.green : "",
            backgroundImage: applied ? "none" : grad,
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
          <span className="text-[12.5px]" style={{ ...body, color: C.muted }}>
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
        sub="Server-side de waarheid. Jouw gevoelige documenten blijven privé en versleuteld bewaard."
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => (
            <div key={c.naam} className="lent-lens lent-ridge p-4" style={panelStyle()}>
              <div className="lent-front flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: C.indigoSoft, color: C.indigo }}
                  aria-hidden="true"
                >
                  <ShieldCheck size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...body, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </div>
              <div
                className="lent-back flex items-center gap-3 p-4"
                style={{ background: C.panelSoft, borderRadius: 15 }}
                aria-hidden="true"
              >
                <span className="text-[12px] font-medium" style={{ ...body, color: C.inkSoft }}>
                  Server-side gecontroleerd · alleen zichtbaar met jouw toestemming.
                </span>
              </div>
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
                style={{ color: C.indigo }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
              style={{ background: C.panelSoft, color: C.indigo }}
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
                className="rounded-md px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
                style={{
                  ...body,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.indigo : C.panelSoft,
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
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-lg px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...body, background: C.indigo }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li
                  key={d.naam}
                  className="lent-ridge flex items-center gap-3 p-3"
                  style={panelStyle()}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                    style={{ ...body, background: C.indigoSoft, color: C.indigo }}
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
                    <div className="text-[11px] tabular-nums" style={{ ...body, color: C.muted }}>
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
          className="lent-ridge flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style={{ background: grad }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.4} />
          </span>
          <h3 className="text-[20px] font-bold" style={{ ...display, color: C.ink }}>
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Niets meer te doen vandaag.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-4 py-2"
            style={{ background: C.indigoSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold text-white"
              style={{ ...body, background: C.indigo }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[13px] font-semibold" style={{ ...body, color: C.indigo }}>
              {openCount} open {openCount === 1 ? "actie" : "acties"}
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <li
                  key={a.titel}
                  className="lent-ridge flex items-start gap-4 p-5"
                  style={panelStyle()}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.lineStrong}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
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
                        opacity: isDone ? 0.55 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ ...body, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.amber : C.indigo,
                          background: a.urgentie === "warning" ? C.amberSoft : C.indigoSoft,
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
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.panelSoft };
  return (
    <div>
      <ScreenHead title="Facturen" sub="Overzicht van je omzet en openstaande posten." />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <div key={s.label} className="lent-ridge p-4" style={panelStyle()}>
            <div className="text-[11.5px] font-medium" style={{ ...body, color: C.muted }}>
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

      <div className="lent-ridge overflow-hidden p-2" style={panelStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...body, color: C.muted }}
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
                    className="transition-colors hover:bg-[#f7f7fd]"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...body, color: C.indigo }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...body, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold"
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

export function Concept251() {
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
      <style>{CSS}</style>
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: grad }}
              aria-hidden="true"
            >
              <Layers size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Lenticulair
              </div>
              <div
                className="text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ ...body, color: C.muted }}
              >
                Kantelbeeld · ZZP platform
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
                style={{ ...body, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold text-white"
              style={{ ...display, background: grad }}
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
                style={{
                  ...body,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? "" : C.panel,
                  backgroundImage: on ? grad : "none",
                  border: `1px solid ${on ? "transparent" : C.line}`,
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
          style={{ ...body, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Layers size={12} strokeWidth={2.2} style={{ color: C.magenta }} aria-hidden="true" />
            Kantel over tegels en kaarten voor de tweede laag
          </span>
          <span>Indigo → magenta</span>
        </footer>
      </div>
    </div>
  );
}
