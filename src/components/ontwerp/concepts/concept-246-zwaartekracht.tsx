"use client";

// Concept 246 — "Zwaartekracht" · spatial physics for data.
// Every tile, card and control is a PHYSICAL OBJECT WITH MASS. Depth is expressed
// through layered, realistic drop-shadows that scale with "height": the more
// important or urgent an object is, the heavier it sits and the higher it floats
// (larger, softer shadow + more lift on hover). Pressing sinks an object in
// (translateY down + reduced shadow), the way a real key travels. This is tactile
// mass and z-stacking — deliberately NOT glassmorphism. Soft neutral "table"
// surface with cool depth shadows. Manrope for headings, Geist for body, Geist
// Mono for figures (tabular). All motion respects prefers-reduced-motion.

import { useState } from "react";
import {
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  TrendingUp,
  TrendingDown,
  Search,
  MapPin,
  Wallet,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Check,
  Bell,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  FileText,
  RefreshCw,
  CircleAlert,
  Inbox,
  Plus,
  Minus,
  ChevronRight,
  Layers,
  ShieldCheck,
  CheckCircle2,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Cool neutral "table surface" palette — light, tactile, realistic depth.
const C = {
  bg: "#e9ecf3", // ambient table surface (objects rest ON this)
  bgDeep: "#dfe3ec", // vignette edge
  surface: "#ffffff", // raised object faces
  sunken: "#eef1f7", // recessed wells / insets
  text: "#161a22", // primary ink
  textSoft: "#5a6474", // secondary ink
  textFaint: "#8b94a3", // tertiary ink
  line: "rgba(22,26,34,0.09)", // hairline seams
  lineSoft: "rgba(22,26,34,0.06)",
  accent: "#4f46e5", // brand indigo (weight/importance)
  accentSoft: "#eef0fe",
  green: "#0f9d6b",
  greenSoft: "#e6f6ef",
  amber: "#b45309",
  amberSoft: "#fdf1e3",
  red: "#c92f43",
  redSoft: "#fdecef",
  indigo: "#4f46e5",
  indigoSoft: "#eef0fe",
};

const heading = { fontFamily: "var(--font-lab-manrope)" } as const;
const body = { fontFamily: "var(--font-lab-geist)" } as const;
const mono = { fontFamily: "var(--font-lab-geist-mono)" } as const;

// ---- Status semantics (label + icon, NEVER colour alone) -------------------

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
      return { label: "In beoordeling", Icon: Clock, tone: C.indigo, soft: C.indigoSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        tone: C.amber,
        soft: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, soft: C.redSoft };
  }
}

// A status tag reads as a small physical label sitting on its object.
function StatusChip({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className={`c246-s1 inline-flex items-center gap-1.5 rounded-full font-semibold ${
        small ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]"
      }`}
      style={{ ...body, color: tone, background: soft, border: `1px solid ${tone}22` }}
    >
      <Icon size={small ? 11 : 12.5} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// ---- Depth primitives ------------------------------------------------------

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div
        className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
        style={{ ...mono, color: C.accent }}
      >
        {kicker}
      </div>
      <h2
        className="mt-1.5 text-[24px] font-extrabold leading-none tracking-tight sm:text-[28px]"
        style={{ ...heading, color: C.text }}
      >
        {title}
      </h2>
    </div>
  );
}

// Sparkline that sits slightly proud of its tile — line + soft area fill.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 78 - 11;
    return { x, y };
  });
  const line = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  const last = coords[coords.length - 1];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polygon points={area} fill={tone} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <circle cx={last.x} cy={last.y} r={2.6} fill={tone} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}

// A "mass" readout — a weighted disc whose float-height encodes match strength.
function MatchOrb({ value }: { value: number }) {
  const tier = value >= 90 ? "c246-s4" : value >= 84 ? "c246-s3" : "c246-s2";
  const tone = value >= 90 ? C.accent : value >= 84 ? C.green : C.textSoft;
  return (
    <div
      className={`${tier} flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl leading-none`}
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      <span className="text-[17px] font-extrabold tabular-nums" style={{ ...mono, color: tone }}>
        {value}
      </span>
      <span
        className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em]"
        style={{ ...body, color: C.textFaint }}
      >
        match
      </span>
    </div>
  );
}

// ---- Dashboard -------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  return (
    <div className="space-y-8">
      <SectionHead kicker="overzicht" title="Dashboard" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const heavy = !k.up; // objects that need action carry more weight
          const tone = heavy ? C.amber : C.accent;
          return (
            <div
              key={k.label}
              className={`${heavy ? "c246-s3" : "c246-s2"} rounded-2xl p-4`}
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[11.5px] font-semibold leading-tight"
                  style={{ ...body, color: C.textSoft }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    color: k.up ? C.green : C.amber,
                    background: k.up ? C.greenSoft : C.amberSoft,
                  }}
                >
                  <Trend size={11} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[26px] font-extrabold tabular-nums leading-none"
                style={{ ...heading, color: C.text }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} tone={tone} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16px] font-bold" style={{ ...heading, color: C.text }}>
              Beste matches
            </h3>
            <span className="text-[12px]" style={{ ...body, color: C.textFaint }}>
              {OPDRACHTEN.length} opdrachten
            </span>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  onClick={() => onOpen(o)}
                  className={`c246-obj ${i === 0 ? "c246-t3" : "c246-t2"} group flex w-full items-center gap-4 rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]`}
                  style={{ background: C.surface, border: `1px solid ${C.line}` }}
                >
                  <MatchOrb value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-bold"
                      style={{ ...heading, color: C.text }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]"
                      style={{ ...body, color: C.textSoft }}
                    >
                      <span>{o.opdrachtgever}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} aria-hidden="true" />
                        {o.plaats}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold tabular-nums" style={{ color: C.text }}>
                        {o.tarief}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16px] font-bold" style={{ ...heading, color: C.text }}>
              Acties
            </h3>
            <span
              className="c246-s1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
              style={{ ...mono, color: C.accent, background: C.accentSoft }}
            >
              {ACTIES.length}
            </span>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <li
                  key={a.titel}
                  className={`${warn ? "c246-s3" : "c246-s2"} rounded-2xl p-4`}
                  style={{
                    background: C.surface,
                    border: `1px solid ${warn ? `${C.amber}33` : C.line}`,
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="c246-s1 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: warn ? C.amberSoft : C.accentSoft,
                        color: warn ? C.amber : C.accent,
                      }}
                      aria-hidden="true"
                    >
                      {warn ? (
                        <TriangleAlert size={13} strokeWidth={2.4} />
                      ) : (
                        <Bell size={13} strokeWidth={2.4} />
                      )}
                    </span>
                    <span
                      className="text-[13.5px] font-bold leading-snug"
                      style={{ ...heading, color: C.text }}
                    >
                      {a.titel}
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-[12px] leading-snug"
                    style={{ ...body, color: C.textSoft }}
                  >
                    {a.detail}
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-bold"
                    style={{ ...body, color: warn ? C.amber : C.accent }}
                  >
                    {a.cta}
                    <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---- Marktplaats -----------------------------------------------------------

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
    <div className="space-y-6">
      <SectionHead kicker="opdrachten" title="Marktplaats" />

      <div
        className="c246-s2 flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <Search size={18} className="shrink-0" style={{ color: C.textFaint }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none"
          style={{ ...body, color: C.text }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="c246-obj c246-t1 rounded-lg px-2.5 py-1 text-[11.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{ ...body, color: C.textSoft, background: C.sunken }}
          >
            Wissen
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="c246-s2 flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <span
            className="c246-s2 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: C.sunken, color: C.textFaint }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[19px] font-bold" style={{ ...heading, color: C.text }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...body, color: C.textSoft }}>
            Geen opdracht gevonden voor &ldquo;{query}&rdquo;. Pas je zoekterm aan of wis het
            filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="c246-obj c246-t2 mt-1 rounded-xl px-5 py-2.5 text-[13.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{ ...body, background: C.accent }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className={`c246-s${i === 0 ? "3" : "2"} flex h-full flex-col rounded-3xl p-5`}
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchOrb value={o.match} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="c246-obj c246-t1 flex h-10 w-10 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                    style={{
                      background: isSaved ? C.accentSoft : C.sunken,
                      color: isSaved ? C.accent : C.textFaint,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={17} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Bookmark size={17} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>

                <h3 className="mt-3.5 text-[16px] font-bold" style={{ ...heading, color: C.text }}>
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                  {o.opdrachtgever}
                </div>

                <dl
                  className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12.5px]"
                  style={{ ...body, color: C.text }}
                >
                  {[
                    { Icon: MapPin, v: o.plaats },
                    { Icon: Wallet, v: o.tarief },
                    { Icon: Clock, v: o.uren },
                    { Icon: Calendar, v: o.start },
                  ].map((m, k) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <m.Icon size={13.5} style={{ color: C.textFaint }} aria-hidden="true" />
                      <span className="tabular-nums">{m.v}</span>
                    </div>
                  ))}
                </dl>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="c246-s1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ ...body, color: C.textSoft, background: C.sunken }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onOpen(o)}
                  className="c246-obj c246-t2 group mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                  style={{ ...body, background: C.accent }}
                >
                  Open opdracht
                  <ArrowRight
                    size={15}
                    strokeWidth={2.6}
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

// ---- Opdracht detail -------------------------------------------------------

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
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="c246-obj c246-t1 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
        style={{ ...body, color: C.textSoft, background: C.surface, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div
        className="c246-s4 rounded-3xl p-6"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchOrb value={opdracht.match} />
            <div>
              <h2
                className="text-[24px] font-extrabold leading-tight tracking-tight sm:text-[27px]"
                style={{ ...heading, color: C.text }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...body, color: C.textSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="c246-s1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                    style={{ ...body, color: C.textSoft, background: C.sunken }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="c246-obj c246-t1 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{
              ...body,
              color: isSaved ? C.accent : C.textSoft,
              background: isSaved ? C.accentSoft : C.sunken,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={15} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Bookmark size={15} strokeWidth={2} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl p-3"
              style={{ background: C.sunken, border: `1px solid ${C.lineSoft}` }}
            >
              <m.Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...body, color: C.textFaint }}
              >
                {m.label}
              </div>
              <div
                className="text-[14.5px] font-bold tabular-nums"
                style={{ ...heading, color: C.text }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div
          className="c246-s2 rounded-3xl p-5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="c246-s1 flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={15} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-bold" style={{ ...heading, color: C.text }}>
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...body, color: C.text }}
              >
                <Check
                  size={16}
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
          className="c246-s2 rounded-3xl p-5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="c246-s1 flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={15} strokeWidth={2.8} />
            </span>
            <span className="text-[14px] font-bold" style={{ ...heading, color: C.text }}>
              Let op
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...body, color: C.text }}
              >
                <TriangleAlert
                  size={16}
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

      <div
        className="c246-s3 flex flex-wrap items-center gap-4 rounded-3xl p-5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="c246-obj c246-t3 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
          style={{ ...body, background: applied ? C.green : C.accent }}
        >
          {applied ? (
            <Check size={18} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied ? (
          <span
            className="inline-flex items-center gap-1.5 text-[13px]"
            style={{ ...body, color: C.green }}
          >
            <CheckCircle2 size={15} strokeWidth={2.4} aria-hidden="true" />
            Je reactie staat klaar bij {opdracht.opdrachtgever}.
          </span>
        ) : (
          <span className="text-[13px]" style={{ ...body, color: C.textSoft }}>
            Gemiddelde reactietijd opdrachtgever: 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

// ---- Verificatie -----------------------------------------------------------

type FeedState = "ok" | "loading" | "error";

function Verificatie({
  checked,
  toggleCheck,
  feedState,
  setFeedState,
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  feedState: FeedState;
  setFeedState: (s: FeedState) => void;
}) {
  const verifiedCount = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-8">
      <SectionHead kicker="vertrouwen" title="Verificatie" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div
            className="c246-s2 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <span
              className="c246-s1 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <ShieldCheck size={18} strokeWidth={2.2} />
            </span>
            <div className="text-[13px]" style={{ ...body, color: C.textSoft }}>
              <span className="font-bold tabular-nums" style={{ color: C.text }}>
                {verifiedCount}/{CREDENTIALS.length}
              </span>{" "}
              certificaten geverifieerd
            </div>
          </div>

          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div
                key={c.naam}
                className="c246-s2 flex items-center gap-3.5 rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} nagelopen` : `Vink ${c.naam} af als nagelopen`}
                  className="c246-obj c246-t1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                  style={{
                    background: done ? C.accent : C.sunken,
                    color: done ? "#fff" : "transparent",
                    border: `1px solid ${done ? C.accent : C.line}`,
                  }}
                >
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold" style={{ ...heading, color: C.text }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...body, color: C.textSoft }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-bold"
              style={{ ...heading, color: C.text }}
            >
              <FileText
                size={17}
                strokeWidth={2.4}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="c246-obj c246-t1 flex h-9 w-9 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              style={{ background: C.sunken, color: C.accent }}
              aria-label="Documenten opnieuw laden"
            >
              <RefreshCw size={15} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div
            className="c246-s1 mb-3 inline-flex gap-1 rounded-xl p-1"
            role="tablist"
            aria-label="Documentweergave"
            style={{ background: C.sunken }}
          >
            {(["ok", "loading", "error"] as const).map((s) => {
              const on = feedState === s;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFeedState(s)}
                  className={`${on ? "c246-s1" : ""} rounded-lg px-3 py-1.5 text-[11.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]`}
                  style={{
                    ...body,
                    color: on ? C.text : C.textSoft,
                    background: on ? C.surface : "transparent",
                  }}
                >
                  {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
                </button>
              );
            })}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten worden geladen">
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="c246-s2 rounded-2xl p-3.5"
                  style={{ background: C.surface, border: `1px solid ${C.line}` }}
                >
                  <div
                    className="c246-shimmer h-3.5 w-2/3 rounded-full"
                    style={{ background: C.sunken }}
                  />
                  <div
                    className="c246-shimmer mt-2.5 h-2.5 w-1/3 rounded-full"
                    style={{ background: C.sunken }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="c246-s2 flex flex-col items-center gap-2.5 rounded-3xl px-4 py-9 text-center"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <span
                className="c246-s2 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-bold" style={{ ...heading, color: C.text }}>
                Laden mislukt
              </div>
              <p className="text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                De verbinding met de documentenkluis werd verbroken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="c246-obj c246-t2 mt-1 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                style={{ ...body, background: C.accent }}
              >
                <RefreshCw size={13} strokeWidth={2.6} aria-hidden="true" />
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => (
                <li
                  key={d.naam}
                  className="c246-s2 flex items-center gap-3 rounded-2xl p-3.5"
                  style={{ background: C.surface, border: `1px solid ${C.line}` }}
                >
                  <span
                    className="c246-s1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold"
                    style={{ ...mono, background: C.sunken, color: C.accent }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[13px] font-bold"
                      style={{ ...heading, color: C.text }}
                    >
                      {d.naam}
                    </div>
                    <div
                      className="text-[11.5px] tabular-nums"
                      style={{ ...body, color: C.textSoft }}
                    >
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusChip status={d.status} small />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Acties ----------------------------------------------------------------

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  const allDone = openCount === 0;

  return (
    <div className="space-y-6">
      <SectionHead kicker="wachtrij" title="Acties" />

      <div
        className={`c246-s2 inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5`}
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <span
          className="c246-s1 flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold tabular-nums"
          style={{
            ...mono,
            color: "#fff",
            background: allDone ? C.green : C.accent,
          }}
          aria-hidden="true"
        >
          {openCount}
        </span>
        <span className="text-[13.5px] font-semibold" style={{ ...body, color: C.text }}>
          {allDone
            ? "Wachtrij leeg — alles afgehandeld"
            : `${openCount} openstaande ${openCount === 1 ? "actie" : "acties"}`}
        </span>
      </div>

      {allDone ? (
        <div
          className="c246-s2 flex flex-col items-center gap-3 rounded-3xl px-6 py-16 text-center"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <span
            className="c246-s3 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: C.greenSoft, color: C.green }}
            aria-hidden="true"
          >
            <CheckCircle2 size={30} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-bold" style={{ ...heading, color: C.text }}>
            Alles opgeruimd
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...body, color: C.textSoft }}>
            Je hebt alle acties afgehandeld. Nieuwe acties verschijnen hier automatisch.
          </p>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {ACTIES.map((a) => {
            const isDone = done.has(a.titel);
            const warn = a.urgentie === "warning";
            const tier = isDone ? "c246-s1" : warn ? "c246-s3" : "c246-s2";
            return (
              <li
                key={a.titel}
                className={`${tier} flex items-start gap-4 rounded-3xl p-5`}
                style={{
                  background: C.surface,
                  border: `1px solid ${!isDone && warn ? `${C.amber}33` : C.line}`,
                  opacity: isDone ? 0.72 : 1,
                }}
              >
                <button
                  onClick={() => toggleDone(a.titel)}
                  aria-pressed={isDone}
                  aria-label={
                    isDone ? `${a.titel} afgehandeld` : `Markeer ${a.titel} als afgehandeld`
                  }
                  className="c246-obj c246-t1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                  style={{
                    background: isDone ? C.green : C.sunken,
                    color: isDone ? "#fff" : "transparent",
                    border: `1px solid ${isDone ? C.green : C.line}`,
                  }}
                >
                  <Check size={17} strokeWidth={3} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="c246-s1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        ...body,
                        color: warn ? C.amber : C.accent,
                        background: warn ? C.amberSoft : C.accentSoft,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Bell size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Info"}
                    </span>
                    <span
                      className="text-[15px] font-bold leading-snug"
                      style={{
                        ...heading,
                        color: C.text,
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {a.titel}
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-snug"
                    style={{ ...body, color: C.textSoft }}
                  >
                    {a.detail}
                  </p>
                  {!isDone && (
                    <span
                      className="mt-3 inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-[12.5px] font-bold"
                      style={{
                        ...body,
                        color: warn ? C.amber : C.accent,
                        background: warn ? C.amberSoft : C.accentSoft,
                      }}
                    >
                      {a.cta}
                      <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Facturen --------------------------------------------------------------

function facturMeta(status: string): { tone: string; soft: string; Icon: LucideIcon } {
  if (status === "Betaald") return { tone: C.green, soft: C.greenSoft, Icon: CheckCircle2 };
  if (status === "Openstaand") return { tone: C.amber, soft: C.amberSoft, Icon: Clock };
  return { tone: C.textSoft, soft: C.sunken, Icon: FileText };
}

function Facturen() {
  return (
    <div className="space-y-6">
      <SectionHead kicker="administratie" title="Facturen" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green, soft: C.greenSoft },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber, soft: C.amberSoft },
          { label: "Concept", value: "€ 880", tone: C.textSoft, soft: C.sunken },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`c246-s${i === 1 ? "3" : "2"} rounded-2xl p-4`}
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="text-[12px] font-semibold" style={{ ...body, color: C.textSoft }}>
              {s.label}
            </div>
            <div
              className="mt-1 text-[24px] font-extrabold tabular-nums"
              style={{ ...heading, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: a solid table object. Mobile: stacked object rows. */}
      <div
        className="c246-s2 hidden rounded-2xl p-2 sm:block"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...body, color: C.textFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = facturMeta(f.status);
                return (
                  <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <td
                      className="px-3.5 py-3.5 text-[12.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.accent }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3.5 py-3.5 text-[13.5px]" style={{ ...body, color: C.text }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3.5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...body, color: C.textSoft }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3.5 py-3.5 text-[13.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.text }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span
                        className="c246-s1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{ ...body, color: m.tone, background: m.soft }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
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

      <ul className="space-y-3 sm:hidden">
        {FACTUREN.map((f) => {
          const m = facturMeta(f.status);
          return (
            <li
              key={f.nr}
              className="c246-s2 rounded-2xl p-4"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[12.5px] font-bold tabular-nums"
                  style={{ ...mono, color: C.accent }}
                >
                  {f.nr}
                </span>
                <span
                  className="c246-s1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ ...body, color: m.tone, background: m.soft }}
                >
                  <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  {f.status}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <div className="text-[13.5px] font-semibold" style={{ ...body, color: C.text }}>
                    {f.klant}
                  </div>
                  <div className="text-[12px] tabular-nums" style={{ ...body, color: C.textSoft }}>
                    {f.datum}
                  </div>
                </div>
                <div
                  className="text-[16px] font-extrabold tabular-nums"
                  style={{ ...heading, color: C.text }}
                >
                  {f.bedrag}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept246() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<FeedState>("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  const unread = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.text,
        background: `radial-gradient(120% 90% at 50% -10%, ${C.surface} 0%, ${C.bg} 46%, ${C.bgDeep} 100%)`,
      }}
    >
      {/* Depth system: layered drop-shadows encode object mass/height. Interactive
          objects (.c246-obj + tier) hover-lift and press-in; motion is guarded. */}
      <style>{`
        .c246-s1 { box-shadow: 0 1px 2px rgba(23,32,58,0.05), 0 2px 5px rgba(23,32,58,0.05); }
        .c246-s2 { box-shadow: 0 2px 4px rgba(23,32,58,0.06), 0 8px 18px rgba(23,32,58,0.08); }
        .c246-s3 { box-shadow: 0 4px 8px rgba(23,32,58,0.08), 0 16px 34px rgba(23,32,58,0.12); }
        .c246-s4 { box-shadow: 0 8px 16px rgba(23,32,58,0.10), 0 28px 56px rgba(23,32,58,0.16); }

        .c246-obj {
          box-shadow: var(--c246-rest);
          transition: transform 0.17s cubic-bezier(0.2, 0.7, 0.3, 1),
                      box-shadow 0.17s cubic-bezier(0.2, 0.7, 0.3, 1);
        }
        .c246-obj:hover { box-shadow: var(--c246-hover); transform: translateY(-3px); }
        .c246-obj:active { box-shadow: var(--c246-press); transform: translateY(2px); }

        .c246-t1 {
          --c246-rest: 0 1px 2px rgba(23,32,58,0.05), 0 2px 5px rgba(23,32,58,0.05);
          --c246-hover: 0 2px 4px rgba(23,32,58,0.06), 0 8px 18px rgba(23,32,58,0.09);
          --c246-press: 0 1px 1px rgba(23,32,58,0.05);
        }
        .c246-t2 {
          --c246-rest: 0 2px 4px rgba(23,32,58,0.06), 0 8px 18px rgba(23,32,58,0.08);
          --c246-hover: 0 4px 8px rgba(23,32,58,0.08), 0 16px 34px rgba(23,32,58,0.13);
          --c246-press: 0 1px 2px rgba(23,32,58,0.06), 0 2px 6px rgba(23,32,58,0.06);
        }
        .c246-t3 {
          --c246-rest: 0 4px 8px rgba(23,32,58,0.08), 0 16px 34px rgba(23,32,58,0.12);
          --c246-hover: 0 8px 16px rgba(23,32,58,0.10), 0 28px 56px rgba(23,32,58,0.17);
          --c246-press: 0 2px 4px rgba(23,32,58,0.07), 0 6px 14px rgba(23,32,58,0.09);
        }

        @keyframes c246-shimmer {
          0% { opacity: 0.55; }
          50% { opacity: 1; }
          100% { opacity: 0.55; }
        }
        .c246-shimmer { animation: c246-shimmer 1.3s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .c246-obj { transition: none; }
          .c246-obj:hover, .c246-obj:active { transform: none; }
          .c246-shimmer { animation: none; }
        }
      `}</style>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="c246-s3 flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: C.accent, color: "#fff" }}
              aria-hidden="true"
            >
              <Layers size={21} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-extrabold tracking-tight"
                style={{ ...heading, color: C.text }}
              >
                Zwaartekracht
              </div>
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...body, color: C.textFaint }}
              >
                ZZP · werkruimte
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-bold" style={{ ...heading, color: C.text }}>
                {PROFIEL.naam}
              </div>
              <div
                className="c246-s1 mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ ...body, color: C.green, background: C.greenSoft }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="c246-s2 flex h-11 w-11 items-center justify-center rounded-2xl text-[14px] font-bold"
              style={{
                ...heading,
                background: C.surface,
                color: C.accent,
                border: `1px solid ${C.line}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav
          className="c246-s1 mb-8 flex flex-wrap gap-1 rounded-2xl p-1.5"
          aria-label="Hoofdnavigatie"
          style={{ background: C.sunken }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`${on ? "c246-obj c246-t1" : ""} shrink-0 rounded-xl px-3.5 py-2 text-[12.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]`}
                style={{
                  ...body,
                  color: on ? C.text : C.textSoft,
                  background: on ? C.surface : "transparent",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main>
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
          className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[12px]"
          style={{ ...body, borderColor: C.line, color: C.textSoft }}
        >
          <span className="inline-flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare
                size={13}
                strokeWidth={2.2}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              <span className="tabular-nums">{unread}</span> ongelezen
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bell size={13} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
              <span className="tabular-nums">{ACTIES.length}</span> acties
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ color: C.textFaint }}>
            <Layers size={12} strokeWidth={2.2} aria-hidden="true" />
            Objecten met massa · dichtbij = belangrijk
          </span>
        </footer>
      </div>
    </div>
  );
}
