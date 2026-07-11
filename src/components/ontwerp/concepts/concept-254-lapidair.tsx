"use client";

// Concept 254 — "Lapidair" · Gegraveerde steen & Romeinse capitalen.
// Signatuur: permanentie en vertrouwen als esthetiek. Licht kalksteen-oppervlak, Trajan-achtige
// serif-kapitalen (Cormorant) met ruime letter-spacing, geïnciseerd/"V-cut" teksteffect (donkere
// tekst met lichte onderrand-highlight voor gegraveerde diepte), interpuncten (·) tussen woorden
// zoals Romeinse inscripties, en V-cut scheidingslijnen. Body in Inter voor leesbaarheid. Perfect
// voor de verificatie-/certificatentaal: gebeiteld in steen = betrouwbaar. Contrast blijft WCAG AA.

import { useState, type CSSProperties } from "react";
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
  Landmark,
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

// Limestone palette. Dark slate ink stays AA on the pale stone surfaces.
const C = {
  stone: "#e9e4d8", // limestone base
  slab: "#f2eee4", // lighter carved panel
  slabDeep: "#e2dccc",
  card: "#f6f2ea",
  line: "rgba(63,74,83,0.16)",
  lineSoft: "rgba(63,74,83,0.1)",
  ink: "#2b3238", // deep slate — AA on stone
  inkSoft: "#4b545c",
  muted: "#6c7178",
  faint: "#8b8f93",
  slate: "#3f4a53", // accent leisteen
  slateDeep: "#2c353d",
  bronze: "#7a5a2e", // accent brons — AA for semibold text on stone
  bronzeSoft: "#e6dcc6",
  green: "#3f5a3a",
  greenSoft: "#dde5d5",
  amber: "#7a5a13",
  amberSoft: "#ece1c6",
  red: "#8a3230",
  redSoft: "#ecd7d3",
  highlight: "rgba(255,255,255,0.7)", // V-cut bottom light
};

const display = { fontFamily: "var(--font-lab-cormorant)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Incised "V-cut" text: dark ink with a light lower highlight for engraved depth.
const incised: CSSProperties = { color: C.ink, textShadow: `0 1px 0 ${C.highlight}` };

// A carved separator line: dark groove with a light lip beneath.
function VRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        height: 2,
        background: `linear-gradient(${C.line}, ${C.line})`,
        borderBottom: `1px solid ${C.highlight}`,
      }}
      aria-hidden="true"
    />
  );
}

// Renders words separated by Roman interpuncts.
function Interpunct({
  children,
  className = "",
  style,
}: {
  children: string;
  className?: string;
  style?: CSSProperties;
}) {
  const words = children.trim().split(/\s+/);
  return (
    <span className={className} style={style}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          {w}
          {i < words.length - 1 && <span style={{ color: C.bronze, padding: "0 0.35em" }}>·</span>}
        </span>
      ))}
    </span>
  );
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Landmark,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.slate, bg: C.slabDeep };
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
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
      style={{ ...body, color: fg, background: bg, border: `1px solid ${C.line}` }}
    >
      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function panelStyle(): CSSProperties {
  return {
    background: C.card,
    border: `1px solid ${C.line}`,
    boxShadow: `inset 0 1px 0 ${C.highlight}, 0 1px 0 ${C.highlight}`,
  };
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 80 - 10;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.bronze}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Roman-inscription eyebrow + carved title.
function ScreenHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <div
        className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.32em]"
        style={{ ...body, color: C.bronze }}
      >
        {eyebrow}
      </div>
      <h1
        className="text-[34px] font-semibold uppercase leading-none tracking-[0.06em] sm:text-[42px]"
        style={{ ...display, ...incised }}
      >
        <Interpunct>{title}</Interpunct>
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function MatchStamp({ value, size = 60 }: { value: number; size?: number }) {
  return (
    <span
      className="flex shrink-0 flex-col items-center justify-center leading-none"
      style={{
        width: size,
        height: size,
        border: `1.5px solid ${C.slate}`,
        background: C.slab,
        boxShadow: `inset 0 0 0 3px ${C.card}`,
      }}
      aria-hidden="true"
    >
      <span
        className="font-semibold tabular-nums"
        style={{ ...display, ...incised, fontSize: size * 0.34 }}
      >
        {value}
      </span>
      <span
        className="font-semibold uppercase tracking-[0.14em]"
        style={{ ...body, color: C.bronze, fontSize: size * 0.12 }}
      >
        Match
      </span>
    </span>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <div className="mb-7">
        <div
          className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.32em]"
          style={{ ...body, color: C.bronze }}
        >
          Overzicht
        </div>
        <h1
          className="text-[34px] font-semibold uppercase leading-none tracking-[0.05em] sm:text-[44px]"
          style={{ ...display, ...incised }}
        >
          <Interpunct>{`Salve ${voornaam}`}</Interpunct>
        </h1>
        <p
          className="mt-3 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          Je staat gebeiteld in steen — geverifieerd en zichtbaar. Eén punt vraagt vandaag je
          aandacht.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="p-4" style={panelStyle()}>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...body, color: C.muted }}
            >
              {k.label}
            </div>
            <div
              className="mt-1.5 text-[30px] font-semibold tabular-nums leading-none"
              style={{ ...display, ...incised }}
            >
              {k.value}
            </div>
            <div
              className="mt-1 text-[11px] font-semibold tabular-nums"
              style={{ ...body, color: k.up ? C.green : C.amber }}
            >
              {k.trend}
            </div>
            <div className="mt-2">
              <Sparkline data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2
            className="mb-3 text-[14px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...display, ...incised }}
          >
            Beste match
          </h2>
          <button
            onClick={onOpen}
            className="group flex w-full items-start gap-4 p-5 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e4d8]"
            style={panelStyle()}
          >
            <MatchStamp value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[21px] font-semibold uppercase leading-tight tracking-[0.03em]"
                style={{ ...display, ...incised }}
              >
                {top.titel}
              </div>
              <div className="mt-1 text-[12.5px]" style={{ ...body, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{
                      ...body,
                      background: C.slab,
                      color: C.slate,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.bronze }}
              aria-hidden="true"
            />
          </button>

          <div className="mt-6 flex items-start gap-4 p-5" style={panelStyle()}>
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center"
              style={{ background: C.slab, color: C.slate, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <ShieldCheck size={24} strokeWidth={1.8} />
            </span>
            <div>
              <div
                className="text-[13px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...display, ...incised }}
              >
                {PROFIEL.trust}
              </div>
              <p
                className="mt-1 text-[12.5px] leading-relaxed"
                style={{ ...body, color: C.inkSoft }}
              >
                Je bewijsstukken zijn gecontroleerd en vastgelegd. Opdrachtgevers zien in één
                oogopslag dat het klopt.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2
            className="mb-3 text-[14px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...display, ...incised }}
          >
            Register
          </h2>
          <div style={panelStyle()}>
            {CREDENTIALS.map((c, i) => (
              <div key={c.naam}>
                {i > 0 && <VRule className="mx-4" />}
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div
                      className="truncate text-[12.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...body, color: C.ink }}
                    >
                      {c.naam}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[11.5px]"
                      style={{ ...body, color: C.muted }}
                    >
                      {c.detail}
                    </div>
                  </div>
                  <StatusChip status={c.status} />
                </div>
              </div>
            ))}
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
        eyebrow="Forum"
        title="Marktplaats"
        sub="Elke match is onderbouwd — we tonen eerlijk waarom een opdracht past en waar je op moet letten."
      />

      <div className="mb-6 flex items-center gap-2 px-4 py-2.5" style={panelStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.bronze }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
            style={{ ...body, color: C.slate, background: C.slab, border: `1px solid ${C.line}` }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.slab, color: C.slate, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={1.8} />
          </span>
          <h3
            className="text-[22px] font-semibold uppercase tracking-[0.08em]"
            style={{ ...display, ...incised }}
          >
            Niets gevonden
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.muted }}>
            Geen inscriptie voor &ldquo;{query}&rdquo;. Beproef een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 px-5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e4d8]"
            style={{ ...body, background: C.slate }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article key={o.id} className="flex h-full flex-col p-5" style={panelStyle()}>
                <div className="flex items-start justify-between gap-3">
                  <MatchStamp value={o.match} size={54} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
                    style={{
                      background: isSaved ? C.bronzeSoft : C.slab,
                      color: isSaved ? C.bronze : C.muted,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={1.8} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[18px] font-semibold uppercase leading-tight tracking-[0.03em]"
                  style={{ ...display, ...incised }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[11.5px]" style={{ ...body, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <VRule className="my-3" />
                <dl
                  className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
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
                <button
                  onClick={() => onOpen(o)}
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e4d8]"
                  style={{ ...body, background: C.slate }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={13}
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
        className="mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
        style={{ ...body, color: C.inkSoft, background: C.slab, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={13} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="p-6" style={panelStyle()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchStamp value={opdracht.match} size={64} />
            <div>
              <h2
                className="text-[26px] font-semibold uppercase leading-tight tracking-[0.04em]"
                style={{ ...display, ...incised }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13px]" style={{ ...body, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
            style={{
              ...body,
              color: isSaved ? C.bronze : C.inkSoft,
              background: isSaved ? C.bronzeSoft : C.slab,
              border: `1px solid ${C.line}`,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={13} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Bookmark size={13} strokeWidth={1.8} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <VRule className="my-5" />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3"
              style={{ background: C.slab, border: `1px solid ${C.line}` }}
            >
              <m.Icon size={14} style={{ color: C.bronze }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...body, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[13.5px] font-semibold" style={{ ...body, color: C.ink }}>
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
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.8} />
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...display, ...incised }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
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
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.8} />
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...display, ...incised }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
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
          className="inline-flex items-center gap-2 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e4d8]"
          style={{ ...body, background: applied ? C.green : C.slate }}
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie vastgelegd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12px]" style={{ ...body, color: C.muted }}>
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
        eyebrow="Inscriptie"
        title="Verificatie"
        sub="Gecontroleerd, gebeiteld, permanent. Je gevoelige papieren blijven privé en zorgvuldig bewaard."
      />

      <div className="mb-6 flex items-center gap-4 p-5" style={panelStyle()}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center"
          style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={1.8} />
        </span>
        <div>
          <div
            className="text-[13px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...display, ...incised }}
          >
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2" style={panelStyle()}>
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam}>
                {i > 0 && <VRule className="mx-4" />}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
                    style={{
                      border: `1.5px solid ${done ? C.slate : C.line}`,
                      background: done ? C.slate : "transparent",
                      color: "#fff",
                    }}
                  >
                    {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[13px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...body, color: C.ink }}
                    >
                      {c.naam}
                    </div>
                    <div className="text-[11.5px]" style={{ ...body, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusChip status={c.status} />
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...display, ...incised }}
            >
              Archief
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
              style={{ background: C.slab, color: C.bronze, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw archief"
            >
              <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Archiefweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
                style={{
                  ...body,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.slate : C.slab,
                  border: `1px solid ${C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Archief laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={panelStyle()}>
                  <div className="h-3 w-2/3 animate-pulse" style={{ background: C.slabDeep }} />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.slabDeep }}
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
                className="flex h-12 w-12 items-center justify-center"
                style={{ background: C.redSoft, color: C.red, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={1.8} />
              </span>
              <div
                className="text-[14px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...display, ...incised }}
              >
                Niet gelukt
              </div>
              <p className="text-[11.5px]" style={{ ...body, color: C.muted }}>
                We konden het archief niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e4d8]"
                style={{ ...body, background: C.slate }}
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...body,
                      background: C.slab,
                      color: C.slate,
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[10.5px] tabular-nums" style={{ ...body, color: C.muted }}>
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
      <ScreenHead eyebrow="Agenda" title="Acties" />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2} />
          </span>
          <h3
            className="text-[22px] font-semibold uppercase tracking-[0.08em]"
            style={{ ...display, ...incised }}
          >
            Alles voltooid
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.muted }}>
            Niets meer op de agenda vandaag.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 px-4 py-2"
            style={{ background: C.slab, border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[11px] font-bold text-white"
              style={{ ...body, background: C.slate }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...body, color: C.slate }}
            >
              {openCount} {openCount === 1 ? "punt" : "punten"} open
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold uppercase leading-snug tracking-[0.04em]"
                      style={{
                        ...display,
                        ...incised,
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
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.amber : C.slate,
                          background: a.urgentie === "warning" ? C.amberSoft : C.slab,
                          border: `1px solid ${C.line}`,
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
        : { fg: C.muted, bg: C.slab };
  return (
    <div>
      <ScreenHead
        eyebrow="Rekeningen"
        title="Facturen"
        sub="Overzichtelijk vastgelegd, zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panelStyle()}>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...body, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold tabular-nums"
              style={{ ...display, color: s.tone, textShadow: `0 1px 0 ${C.highlight}` }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2" style={panelStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
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
                    className="transition-colors hover:bg-[#efeade]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12px] font-semibold tabular-nums"
                      style={{ ...body, color: C.slate }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[12.5px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12px] tabular-nums"
                      style={{ ...body, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          ...body,
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={10} strokeWidth={3} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={10} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <FileText size={10} strokeWidth={2.6} aria-hidden="true" />
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

export function Concept254() {
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
      style={{ ...body, color: C.ink, background: C.stone }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center text-white"
              style={{ background: C.slate, boxShadow: `inset 0 0 0 3px ${C.slateDeep}` }}
              aria-hidden="true"
            >
              <Landmark size={20} strokeWidth={1.8} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...display, ...incised }}
              >
                Lapidair
              </div>
              <div
                className="text-[9.5px] font-semibold uppercase tracking-[0.28em]"
                style={{ ...body, color: C.bronze }}
              >
                ZZP · Platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div
                className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...body, color: C.ink }}
              >
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...body, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-semibold uppercase"
              style={{
                ...display,
                background: C.slab,
                color: C.slate,
                border: `1.5px solid ${C.slate}`,
                boxShadow: `inset 0 0 0 3px ${C.card}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <VRule className="mb-6" />

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f4a53]"
                style={{
                  ...body,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.slate : C.card,
                  border: `1px solid ${on ? C.slate : C.line}`,
                }}
              >
                <Icon size={13} strokeWidth={2} aria-hidden="true" />
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

        <VRule className="mt-10" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...body, color: C.muted }}
        >
          <span>
            {ACTIES.length} acties · {CREDENTIALS.length} bewijsstukken
          </span>
          <span>In steen gebeiteld</span>
        </footer>
      </div>
    </div>
  );
}
