"use client";

// Concept 252 — "Nixie" · Gloeiende cijferbuizen op warm-zwart.
// Signatuur: numeriek-zware esthetiek. KPI-getallen, tarieven en factuurbedragen worden
// weergegeven als gloeiende amberkleurige Nixie-buiscijfers — warme glow via text-shadow,
// met flauw-onverlichte "spookcijfers" erachter voor de buis-look. Getallen in glazen-buis
// containers met binnengloed op een mesh/grid-backplate. Monospace + tabular-nums voor alle
// cijfers; body Inter. Labels behouden AA-leesbaarheid; de glow zit alleen op de cijfers.
// Accent amber #ff7a18. Uitstekend voor facturen en KPI's.

import { useState, type CSSProperties, type ReactNode } from "react";
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
  Gauge,
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

// Warm-black Nixie palette. Amber glow reserved for numerals; labels stay high-contrast.
const C = {
  bg: "#0e0b08",
  panel: "#171210",
  panelSoft: "#1e1815",
  glass: "#120d0a",
  line: "rgba(255,138,40,0.16)",
  lineSoft: "rgba(255,255,255,0.07)",
  ink: "#f4ede4",
  inkSoft: "#c9bdb0",
  muted: "#9a8d7e",
  faint: "#6f6559",
  amber: "#ff7a18",
  amberDim: "rgba(255,122,24,0.14)",
  amberGhost: "rgba(255,122,24,0.1)",
  ember: "#ffb15e",
  green: "#5fd08a",
  greenSoft: "rgba(95,208,138,0.14)",
  warn: "#ffcf6b",
  warnSoft: "rgba(255,207,107,0.14)",
  red: "#ff6b5f",
  redSoft: "rgba(255,107,95,0.14)",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const glow = `0 0 4px rgba(255,122,24,0.9), 0 0 12px rgba(255,122,24,0.55), 0 0 26px rgba(255,122,24,0.3)`;
const glowSoft = `0 0 3px rgba(255,122,24,0.8), 0 0 9px rgba(255,122,24,0.4)`;

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Gauge,
};

// Mesh/grid backplate behind glass tubes.
const meshBg: CSSProperties = {
  backgroundColor: C.glass,
  backgroundImage: `linear-gradient(rgba(255,138,40,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,138,40,0.05) 1px, transparent 1px)`,
  backgroundSize: "13px 13px",
};

// Glowing Nixie numeral with faint ghost duplicate behind it (tube look).
function Nixie({
  children,
  size = 26,
  dim = false,
}: {
  children: ReactNode;
  size?: number;
  dim?: boolean;
}) {
  return (
    <span className="relative inline-flex" style={{ ...mono }}>
      <span
        aria-hidden="true"
        className="absolute inset-0 tabular-nums"
        style={{ color: C.amberGhost, fontSize: size, lineHeight: 1 }}
      >
        {children}
      </span>
      <span
        className="relative font-medium tabular-nums"
        style={{ color: C.ember, fontSize: size, lineHeight: 1, textShadow: dim ? glowSoft : glow }}
      >
        {children}
      </span>
    </span>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.ember, bg: C.amberDim };
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
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: fg, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function tubeStyle(): CSSProperties {
  return {
    background: C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 24px rgba(255,122,24,0.05)",
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
        stroke={C.amber}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 0 3px rgba(255,122,24,0.6))" }}
      />
    </svg>
  );
}

function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1
        className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...body, color: C.ink }}
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
  return (
    <div>
      <div className="mb-6">
        <div
          className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.amber, textShadow: glowSoft }}
        >
          <Gauge size={12} strokeWidth={2.6} aria-hidden="true" />
          Meterkast
        </div>
        <h1
          className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]"
          style={{ ...body, color: C.ink }}
        >
          Je cijfers, in buisverlichting
        </h1>
        <p className="mt-1.5 text-[13.5px]" style={{ ...body, color: C.muted }}>
          De kerncijfers gloeien als Nixie-buizen. Eén punt vraagt vandaag aandacht.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} className="p-4" style={tubeStyle()}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium" style={{ ...body, color: C.muted }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...body, color: k.up ? C.green : C.warn }}
                >
                  <Trend size={12} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div className="mt-3 rounded-lg px-3 py-2.5" style={meshBg}>
                <Nixie size={26}>{k.value}</Nixie>
              </div>
              <div className="mt-2">
                <Sparkline data={k.spark} />
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
              style={{ background: C.amber, boxShadow: glowSoft }}
              aria-hidden="true"
            />
            <h2 className="text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
              Sterkste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className="group flex w-full items-center gap-4 p-5 text-left transition-colors hover:border-[rgba(255,122,24,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0b08]"
            style={tubeStyle()}
          >
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl"
              style={meshBg}
              aria-hidden="true"
            >
              <Nixie size={22}>{top.match}</Nixie>
              <span
                className="mt-0.5 text-[7.5px] font-bold uppercase tracking-wider"
                style={{ ...body, color: C.muted }}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-semibold leading-tight"
                style={{ ...body, color: C.ink }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats}
              </div>
              <div
                className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold"
                style={{ ...mono, color: C.ember, textShadow: glowSoft }}
              >
                {top.tarief}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.amber }}
              aria-hidden="true"
            />
          </button>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPDRACHTEN.slice(1).map((o) => (
              <div key={o.id} className="p-4" style={tubeStyle()}>
                <div className="flex items-center justify-between">
                  <span
                    className="rounded px-2 py-0.5 text-[11px]"
                    style={{
                      ...mono,
                      background: meshBg.backgroundColor,
                      color: C.ember,
                      textShadow: glowSoft,
                    }}
                  >
                    {o.match}%
                  </span>
                  <span className="text-[11px]" style={{ ...body, color: C.faint }}>
                    {o.plaats}
                  </span>
                </div>
                <div
                  className="mt-2 text-[14px] font-semibold leading-tight"
                  style={{ ...body, color: C.ink }}
                >
                  {o.titel}
                </div>
                <div className="mt-1 text-[12px] font-medium" style={{ ...mono, color: C.ember }}>
                  {o.tarief}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="h-4 w-1.5 rounded-full"
              style={{ background: C.amber, boxShadow: glowSoft }}
              aria-hidden="true"
            />
            <h2 className="text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
              Vandaag
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <li key={a.titel} className="p-4" style={tubeStyle()}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: a.urgentie === "warning" ? C.warn : C.amber,
                      boxShadow: glowSoft,
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
        title="Marktplaats"
        sub="Match-scores en tarieven in buisverlichting — zo lees je in één oogopslag waar de waarde zit."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={tubeStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.amber }} aria-hidden="true" />
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
            className="rounded px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
            style={{ ...body, color: C.amber, background: C.amberDim }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={tubeStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-xl"
            style={{ background: C.amberDim, color: C.amber }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...body, color: C.ink }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-lg px-5 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0b08]"
            style={{ ...body, background: C.amber, color: "#1a0f04" }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article key={o.id} className="flex h-full flex-col p-5" style={tubeStyle()}>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-xl"
                    style={meshBg}
                    aria-hidden="true"
                  >
                    <Nixie size={20}>{o.match}</Nixie>
                    <span
                      className="mt-0.5 text-[7px] font-bold uppercase tracking-wider"
                      style={{ ...body, color: C.muted }}
                    >
                      match
                    </span>
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
                    style={{
                      background: isSaved ? C.amberDim : C.panelSoft,
                      color: isSaved ? C.amber : C.muted,
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
                  className="mt-3 text-[16px] font-semibold leading-tight"
                  style={{ ...body, color: C.ink }}
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
                    <span style={{ ...mono, color: C.ember }}>{o.tarief}</span>
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
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0b08]"
                  style={{ ...body, background: C.amber, color: "#1a0f04" }}
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
        className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
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

      <div className="p-6" style={tubeStyle()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl"
              style={meshBg}
              aria-hidden="true"
            >
              <Nixie size={22}>{opdracht.match}</Nixie>
              <span
                className="mt-0.5 text-[7.5px] font-bold uppercase tracking-wider"
                style={{ ...body, color: C.muted }}
              >
                match
              </span>
            </span>
            <div>
              <h2
                className="text-[23px] font-semibold leading-tight tracking-tight"
                style={{ ...body, color: C.ink }}
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
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
            style={{
              ...body,
              color: isSaved ? C.amber : C.inkSoft,
              background: isSaved ? C.amberDim : C.panelSoft,
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

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief, glow: true },
            { Icon: Clock, label: "Inzet", value: opdracht.uren, glow: false },
            { Icon: Calendar, label: "Start", value: opdracht.start, glow: false },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats, glow: false },
          ].map((m) => (
            <div key={m.label} className="rounded-lg p-3" style={{ background: C.panelSoft }}>
              <m.Icon size={15} style={{ color: C.amber }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...body, color: C.muted }}
              >
                {m.label}
              </div>
              <div
                className="text-[14px] font-semibold"
                style={
                  m.glow
                    ? { ...mono, color: C.ember, textShadow: glowSoft }
                    : { ...body, color: C.ink }
                }
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={tubeStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
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
        <div className="p-5" style={tubeStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: C.warnSoft, color: C.warn }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
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
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0b08]"
          style={{ ...body, background: applied ? C.green : C.amber, color: "#1a0f04" }}
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
        sub="Server-side de waarheid. Je gevoelige documenten blijven privé en versleuteld bewaard."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => (
            <div key={c.naam} className="flex items-center gap-3 p-4" style={tubeStyle()}>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.amberDim, color: C.amber }}
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
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...body, color: C.ink }}
            >
              <FileText size={17} strokeWidth={2.2} style={{ color: C.amber }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
              style={{ background: C.panelSoft, color: C.amber }}
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
                className="rounded px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
                style={{
                  ...body,
                  color: feedState === s ? "#1a0f04" : C.muted,
                  background: feedState === s ? C.amber : C.panelSoft,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={tubeStyle()}>
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
              style={tubeStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-lg px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0b08]"
                style={{ ...body, background: C.amber, color: "#1a0f04" }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={tubeStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                    style={{ ...body, background: C.amberDim, color: C.amber }}
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
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={tubeStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-xl"
            style={{ background: C.greenSoft, color: C.green }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.4} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...body, color: C.ink }}>
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
            style={{ background: C.amberDim }}
          >
            <span className="inline-flex" aria-hidden="true">
              <Nixie size={16} dim>
                {openCount}
              </Nixie>
            </span>
            <span className="text-[13px] font-semibold" style={{ ...body, color: C.amber }}>
              {openCount} open {openCount === 1 ? "actie" : "acties"}
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <li key={a.titel} className="flex items-start gap-4 p-5" style={tubeStyle()}>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.lineSoft}`,
                      background: isDone ? C.green : "transparent",
                      color: "#1a0f04",
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
                      style={{ ...body, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 rounded px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.warn : C.amber,
                          background: a.urgentie === "warning" ? C.warnSoft : C.amberDim,
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
      <ScreenHead
        title="Facturen"
        sub="Bedragen in buisverlichting — je omzet leest als een teller."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552" },
          { label: "Openstaand", value: "€ 1.350" },
          { label: "Concept", value: "€ 880" },
        ].map((s) => (
          <div key={s.label} className="p-4" style={tubeStyle()}>
            <div className="text-[11.5px] font-medium" style={{ ...body, color: C.muted }}>
              {s.label}
            </div>
            <div className="mt-2 rounded-lg px-3 py-2" style={meshBg}>
              <Nixie size={22}>{s.value}</Nixie>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden p-2" style={tubeStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
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
                    className="transition-colors hover:bg-[#1e1815]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.inkSoft }}
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
                      style={{ ...mono, color: C.ember, textShadow: glowSoft }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[11px] font-semibold"
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

export function Concept252() {
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
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: C.panel,
                border: `1px solid ${C.line}`,
                color: C.amber,
                boxShadow: `inset 0 0 14px rgba(255,122,24,0.15)`,
              }}
              aria-hidden="true"
            >
              <Gauge size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-semibold tracking-tight"
                style={{ ...mono, color: C.ember, textShadow: glowSoft }}
              >
                Nixie
              </div>
              <div
                className="text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ ...body, color: C.muted }}
              >
                Cijferbuizen · ZZP platform
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
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold"
              style={{
                ...mono,
                background: C.panel,
                border: `1px solid ${C.line}`,
                color: C.ember,
                textShadow: glowSoft,
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]"
                style={{
                  ...body,
                  color: on ? C.amber : C.inkSoft,
                  background: on ? C.amberDim : C.panel,
                  border: `1px solid ${on ? "rgba(255,122,24,0.4)" : C.lineSoft}`,
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
          style={{ ...body, borderColor: C.lineSoft, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Gauge size={12} strokeWidth={2.2} style={{ color: C.amber }} aria-hidden="true" />
            Cijfers gloeien als buisverlichting
          </span>
          <span style={{ ...mono, color: C.ember }}>amber 7A18</span>
        </footer>
      </div>
    </div>
  );
}
