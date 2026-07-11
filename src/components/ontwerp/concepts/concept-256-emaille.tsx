"use client";

// Concept 256 — "Emaille" · Vintage geëmailleerd reclamebord.
// Signatuur: Nederlandse nostalgie à la oude NS/Verkade-emailleborden. Crème porselein-emaille met
// dikke afgeronde dubbele keyline-randen, subtiel afgeschilferd-randdetail, vet condensed display-
// type (Anton) en een beperkt period-palet: crème, kobalt, baksteenrood, flesgroen, mosterd, zwart.
// Een subtiele speculaire gloss-highlight geeft de panelen porselein-glans. Premium/volwassen, geen
// kinderlijk. Body in Inter voor leesbaarheid. WCAG AA geborgd.

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
  Award,
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

// Vintage enamel palette — limited, period-correct, porcelain cream ground.
const C = {
  cream: "#efe6d2", // enamel ground
  panel: "#f5eede",
  panelDeep: "#e7dcc2",
  line: "rgba(28,26,23,0.16)",
  ink: "#1c1a17", // near-black enamel
  inkSoft: "#4a453c",
  muted: "#6f695c",
  faint: "#938c7c",
  cobalt: "#16457a", // accent kobalt
  cobaltDeep: "#0f3055",
  brick: "#b23a2e", // accent baksteenrood
  brickDeep: "#8a2a20",
  green: "#2f6b3d", // vintage bottle green
  greenSoft: "#dde7d6",
  mustard: "#9a6b12", // vintage mustard
  mustardSoft: "#ece0c2",
  cobaltSoft: "#d8e2ee",
  brickSoft: "#eed7d1",
  gloss: "rgba(255,255,255,0.55)",
};

const display = { fontFamily: "var(--font-lab-anton)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Award,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.cobalt, bg: C.cobaltSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.mustard, bg: C.mustardSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.brick, bg: C.brickSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{ ...body, color: fg, background: bg, border: `1.5px solid ${fg}` }}
    >
      <Icon size={11} strokeWidth={2.6} aria-hidden="true" />
      {label}
    </span>
  );
}

// Double-keyline enamel panel with speculaire gloss on top.
function enamelStyle(border: string = C.cobalt, radius = 16): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${C.gloss}, rgba(255,255,255,0) 34%), ${C.panel}`,
    borderRadius: radius,
    border: `3px solid ${border}`,
    boxShadow: `inset 0 0 0 2px ${C.cream}, inset 0 0 0 3.5px ${border}55, 0 6px 18px -12px rgba(28,26,23,0.6)`,
  };
}

// Small chipped-enamel speckles — decorative worn-edge detail.
function Chips() {
  return (
    <span aria-hidden="true">
      <span
        className="absolute h-1.5 w-1.5 rounded-full"
        style={{ top: 6, left: 10, background: C.faint, opacity: 0.5 }}
      />
      <span
        className="absolute h-1 w-1 rounded-full"
        style={{ bottom: 8, right: 14, background: C.faint, opacity: 0.45 }}
      />
      <span
        className="absolute h-[3px] w-[3px] rounded-full"
        style={{ bottom: 12, left: 18, background: C.faint, opacity: 0.4 }}
      />
    </span>
  );
}

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
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
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ScreenHead({
  title,
  sub,
  tone = C.cobalt,
}: {
  title: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="mb-7">
      <h1
        className="text-[36px] font-normal uppercase leading-[0.95] tracking-[0.01em] sm:text-[46px]"
        style={{ ...display, color: tone }}
      >
        {title}
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

function MatchBadge({ value, size = 60 }: { value: number; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 flex-col items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 38% 30%, #2e6bad, ${C.cobalt})`,
        border: `2.5px solid ${C.cream}`,
        boxShadow: `0 0 0 2.5px ${C.cobalt}, inset 0 2px 3px rgba(255,255,255,0.35)`,
      }}
      aria-hidden="true"
    >
      <span
        className="font-normal tabular-nums leading-none"
        style={{ ...display, fontSize: size * 0.4 }}
      >
        {value}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-[0.14em]" style={body}>
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
      <ScreenHead
        title={`Goedendag, ${voornaam}`}
        sub="Je bord hangt fier: geverifieerd en zichtbaar. Eén zaak vraagt vandaag je aandacht."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = i % 2 === 0 ? C.cobalt : C.brick;
          return (
            <div
              key={k.label}
              className="relative overflow-hidden p-4"
              style={enamelStyle(tone, 14)}
            >
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ ...body, color: C.muted }}
              >
                {k.label}
              </div>
              <div
                className="mt-1 text-[30px] font-normal tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div
                className="mt-1 text-[11px] font-bold tabular-nums"
                style={{ ...body, color: k.up ? C.green : C.mustard }}
              >
                {k.trend}
              </div>
              <div className="mt-2">
                <Sparkline data={k.spark} tone={tone} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2
            className="mb-3 text-[15px] font-normal uppercase tracking-[0.06em]"
            style={{ ...display, color: C.brick }}
          >
            Beste match
          </h2>
          <button
            onClick={onOpen}
            className="group relative flex w-full items-start gap-4 overflow-hidden p-5 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d2]"
            style={enamelStyle(C.cobalt)}
          >
            <Chips />
            <MatchBadge value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[22px] font-normal uppercase leading-[0.98] tracking-[0.01em]"
                style={{ ...display, color: C.ink }}
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
                    className="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
                    style={{
                      ...body,
                      background: C.cobaltSoft,
                      color: C.cobaltDeep,
                      border: `1.5px solid ${C.cobalt}`,
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
              style={{ color: C.brick }}
              aria-hidden="true"
            />
          </button>

          <div
            className="relative mt-6 flex items-start gap-4 overflow-hidden p-5"
            style={enamelStyle(C.green)}
          >
            <Chips />
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background: C.green,
                border: `2px solid ${C.cream}`,
                boxShadow: `0 0 0 2px ${C.green}`,
              }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div
                className="text-[15px] font-normal uppercase tracking-[0.04em]"
                style={{ ...display, color: C.green }}
              >
                {PROFIEL.trust}
              </div>
              <p
                className="mt-1 text-[12.5px] leading-relaxed"
                style={{ ...body, color: C.inkSoft }}
              >
                Je papieren zijn gecontroleerd en geëmailleerd vastgelegd. Opdrachtgevers zien in
                één oogopslag dat het klopt.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2
            className="mb-3 text-[15px] font-normal uppercase tracking-[0.06em]"
            style={{ ...display, color: C.brick }}
          >
            Keurmerken
          </h2>
          <ul className="space-y-2.5">
            {CREDENTIALS.map((c) => (
              <li
                key={c.naam}
                className="flex items-center justify-between gap-3 p-4"
                style={enamelStyle(C.cobalt, 12)}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold" style={{ ...body, color: C.ink }}>
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
        sub="Elke opdracht draagt een keurmerk — we tonen eerlijk waarom het past en waar je op moet letten."
      />

      <div className="mb-6 flex items-center gap-2 px-4 py-2.5" style={enamelStyle(C.cobalt, 999)}>
        <Search size={17} className="shrink-0" style={{ color: C.brick }} aria-hidden="true" />
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
            className="rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
            style={{
              ...body,
              color: C.brick,
              background: C.brickSoft,
              border: `1.5px solid ${C.brick}`,
            }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="relative flex flex-col items-center gap-3 overflow-hidden px-6 py-16 text-center"
          style={enamelStyle(C.brick)}
        >
          <Chips />
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-white"
            style={{
              background: C.brick,
              border: `2px solid ${C.cream}`,
              boxShadow: `0 0 0 2px ${C.brick}`,
            }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={2} />
          </span>
          <h3
            className="text-[26px] font-normal uppercase tracking-[0.02em]"
            style={{ ...display, color: C.brick }}
          >
            Niets gevonden
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.muted }}>
            Geen bord voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d2]"
            style={{ ...body, background: C.cobalt }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            const tone = i % 2 === 0 ? C.cobalt : C.brick;
            return (
              <article
                key={o.id}
                className="relative flex h-full flex-col overflow-hidden p-5"
                style={enamelStyle(tone)}
              >
                <Chips />
                <div className="flex items-start justify-between gap-3">
                  <MatchBadge value={o.match} size={54} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
                    style={{
                      background: isSaved ? C.brickSoft : C.panelDeep,
                      color: isSaved ? C.brick : C.muted,
                      border: `1.5px solid ${isSaved ? C.brick : C.line}`,
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
                  className="mt-3 text-[19px] font-normal uppercase leading-[0.98] tracking-[0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[11.5px]" style={{ ...body, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <div
                  className="my-3 h-0.5 w-full rounded-full"
                  style={{ background: `${tone}44` }}
                  aria-hidden="true"
                />
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
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d2]"
                  style={{ ...body, background: tone }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={13}
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
        className="mb-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
        style={{
          ...body,
          color: C.inkSoft,
          background: C.panelDeep,
          border: `1.5px solid ${C.line}`,
        }}
      >
        <ArrowLeft size={13} strokeWidth={2.6} aria-hidden="true" />
        Terug
      </button>

      <div className="relative overflow-hidden p-6" style={enamelStyle(C.cobalt)}>
        <Chips />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchBadge value={opdracht.match} size={64} />
            <div>
              <h2
                className="text-[28px] font-normal uppercase leading-[0.96] tracking-[0.01em]"
                style={{ ...display, color: C.ink }}
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
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
            style={{
              ...body,
              color: isSaved ? C.brick : C.inkSoft,
              background: isSaved ? C.brickSoft : C.panelDeep,
              border: `1.5px solid ${isSaved ? C.brick : C.line}`,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={13} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Bookmark size={13} strokeWidth={2} aria-hidden="true" />
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
            <div
              key={m.label}
              className="rounded-lg p-3"
              style={{ background: C.panelDeep, border: `1.5px solid ${C.line}` }}
            >
              <m.Icon size={14} style={{ color: C.cobalt }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                style={{ ...body, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[13.5px] font-bold" style={{ ...body, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={enamelStyle(C.green)}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
              style={{ background: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} />
            </span>
            <span
              className="text-[14px] font-normal uppercase tracking-[0.04em]"
              style={{ ...display, color: C.green }}
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
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={enamelStyle(C.mustard)}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
              style={{ background: C.mustard }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} />
            </span>
            <span
              className="text-[14px] font-normal uppercase tracking-[0.04em]"
              style={{ ...display, color: C.mustard }}
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
                  style={{ color: C.mustard }}
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
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d2]"
          style={{ ...body, background: applied ? C.green : C.brick }}
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
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
        title="Verificatie"
        tone={C.green}
        sub="Gekeurd en geëmailleerd vastgelegd. Je gevoelige papieren blijven privé en zorgvuldig bewaard."
      />

      <div
        className="relative mb-6 flex items-center gap-4 overflow-hidden p-5"
        style={enamelStyle(C.green)}
      >
        <Chips />
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{
            background: C.green,
            border: `2px solid ${C.cream}`,
            boxShadow: `0 0 0 2px ${C.green}`,
          }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2.2} />
        </span>
        <div>
          <div
            className="text-[15px] font-normal uppercase tracking-[0.04em]"
            style={{ ...display, color: C.green }}
          >
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
            Versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3 p-4"
                style={enamelStyle(C.cobalt, 12)}
              >
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
                  style={{
                    border: `2px solid ${done ? C.green : C.line}`,
                    background: done ? C.green : "transparent",
                    color: "#fff",
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ ...body, color: C.muted }}>
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
              className="text-[15px] font-normal uppercase tracking-[0.05em]"
              style={{ ...display, color: C.brick }}
            >
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
              style={{ background: C.panelDeep, color: C.cobalt, border: `1.5px solid ${C.line}` }}
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
                className="rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
                style={{
                  ...body,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.cobalt : C.panelDeep,
                  border: `1.5px solid ${feedState === s ? C.cobalt : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={enamelStyle(C.cobalt, 12)}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.panelDeep }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.panelDeep }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={enamelStyle(C.brick)}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-white"
                style={{ background: C.brick }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2.2} />
              </span>
              <div
                className="text-[16px] font-normal uppercase tracking-[0.03em]"
                style={{ ...display, color: C.brick }}
              >
                Niet gelukt
              </div>
              <p className="text-[11.5px]" style={{ ...body, color: C.muted }}>
                We konden de documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-full px-4 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d2]"
                style={{ ...body, background: C.cobalt }}
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
                  className="flex items-center gap-3 p-3"
                  style={enamelStyle(C.cobalt, 12)}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white"
                    style={{ ...body, background: C.cobalt }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12px] font-bold"
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
      <ScreenHead title="Acties" tone={C.brick} />

      {openCount === 0 ? (
        <div
          className="relative flex flex-col items-center gap-3 overflow-hidden px-6 py-16 text-center"
          style={enamelStyle(C.green)}
        >
          <Chips />
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-white"
            style={{ background: C.green }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.4} />
          </span>
          <h3
            className="text-[26px] font-normal uppercase tracking-[0.02em]"
            style={{ ...display, color: C.green }}
          >
            Alles voltooid
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.muted }}>
            Niets meer te doen vandaag.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: C.brickSoft, border: `1.5px solid ${C.brick}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ ...body, background: C.brick }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.04em]"
              style={{ ...body, color: C.brickDeep }}
            >
              {openCount} {openCount === 1 ? "punt" : "punten"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tone = a.urgentie === "warning" ? C.mustard : C.cobalt;
              return (
                <li key={a.titel} className="flex items-start gap-4 p-5" style={enamelStyle(tone)}>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
                    style={{
                      border: `2px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[16px] font-normal uppercase leading-tight tracking-[0.01em]"
                      style={{
                        ...display,
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
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em]"
                        style={{
                          ...body,
                          color: tone,
                          background: a.urgentie === "warning" ? C.mustardSoft : C.cobaltSoft,
                          border: `1.5px solid ${tone}`,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
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
        ? { fg: C.mustard, bg: C.mustardSoft }
        : { fg: C.muted, bg: C.panelDeep };
  return (
    <div>
      <ScreenHead
        title="Facturen"
        sub="Overzichtelijk vastgelegd, zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.mustard },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s, i) => (
          <div
            key={s.label}
            className="p-4"
            style={enamelStyle(i === 0 ? C.green : i === 1 ? C.mustard : C.cobalt, 14)}
          >
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ ...body, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[28px] font-normal tabular-nums"
              style={{ ...display, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2" style={enamelStyle(C.cobalt, 16)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em]"
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
                    className="transition-colors hover:bg-[#e7dcc2]"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12px] font-bold tabular-nums"
                      style={{ ...body, color: C.cobalt }}
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
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
                        style={{
                          ...body,
                          color: t.fg,
                          background: t.bg,
                          border: `1.5px solid ${t.fg}`,
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

export function Concept256() {
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
      style={{ ...body, color: C.ink, background: C.cream }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{
                background: C.brick,
                border: `2px solid ${C.cream}`,
                boxShadow: `0 0 0 2px ${C.brick}`,
              }}
              aria-hidden="true"
            >
              <Award size={22} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[22px] font-normal uppercase tracking-[0.02em]"
                style={{ ...display, color: C.cobalt }}
              >
                Emaille
              </div>
              <div
                className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
                style={{ ...body, color: C.brick }}
              >
                ZZP Platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px] font-semibold"
                style={{ ...body, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-normal text-white"
              style={{
                ...display,
                background: C.cobalt,
                border: `2px solid ${C.cream}`,
                boxShadow: `0 0 0 2px ${C.cobalt}`,
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16457a]"
                style={{
                  ...body,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.cobalt : C.panel,
                  border: `1.5px solid ${on ? C.cobalt : C.line}`,
                }}
              >
                <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t-2 pt-4 text-[10.5px] font-bold uppercase tracking-[0.08em]"
          style={{ ...body, borderColor: C.line, color: C.muted }}
        >
          <span>
            {ACTIES.length} acties · {CREDENTIALS.length} keurmerken
          </span>
          <span>Op emaille vastgelegd</span>
        </footer>
      </div>
    </div>
  );
}
