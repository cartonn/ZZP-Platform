"use client";

// Concept 255 — "Synth" · Modulair synth-rek met patchkabel-routing.
// Signatuur: een Eurorack-modulerek als besturingspaneel. Donker geanodiseerd paneel, jack-sockets,
// draaiknoppen, schuifpotmeters en LED-indicators. Matching wordt getoond als patchkabels —
// gebogen SVG-bezierkabels met catenaire "doorhang" die de ZZP'er-module met opdracht-jacks
// verbinden. Match-redenen zijn signaalroutering (plus = doorverbonden, min = gedempt). Kabels zijn
// deels decoratief, maar elke koppeling is óók in tekst/labels leesbaar — nooit alleen kleur.
// Fonts: Space Grotesk (kop/body) + mono + silkscreen (mini-labels). Accent lime. WCAG AA.

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
  Cable,
  Power,
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

// Anodised dark panel palette with a lime signal accent and coloured patch cables.
const C = {
  panel: "#1b1d22", // anodised base
  rack: "#212429", // module face
  rackHi: "#2a2e35",
  slot: "#15171b", // recessed jack field
  line: "rgba(255,255,255,0.09)",
  lineHi: "rgba(255,255,255,0.16)",
  ink: "#eef1f4",
  inkSoft: "#b7bec7",
  muted: "#7f8792",
  faint: "#5b626c",
  lime: "#a3e635", // signal accent
  limeDim: "#5f7d1f",
  cableRed: "#f43f5e",
  cableBlue: "#38bdf8",
  cableAmber: "#fbbf24",
  green: "#4ade80",
  amber: "#fbbf24",
  red: "#f87171",
};

const CABLES = [C.lime, C.cableBlue, C.cableAmber, C.cableRed];

const head = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const micro = { fontFamily: "var(--font-lab-silkscreen)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Cable,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "PATCHED", Icon: BadgeCheck, fg: C.green };
    case "SUBMITTED":
      return { label: "SYNCING", Icon: Clock, fg: C.cableBlue };
    case "EXPIRING":
      return { label: "LOW SIGNAL", Icon: TriangleAlert, fg: C.amber };
    case "REJECTED":
      return { label: "NO SIGNAL", Icon: XCircle, fg: C.red };
  }
}

const NL_STATUS: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  SUBMITTED: "In beoordeling",
  EXPIRING: "Verloopt bijna",
  REJECTED: "Afgewezen",
};

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg } = statusMeta(status);
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[8px] tracking-[0.1em]"
        style={{
          ...micro,
          color: fg,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${fg}44`,
        }}
      >
        <Icon size={9} strokeWidth={2.6} aria-hidden="true" />
        {label}
      </span>
      <span className="text-[11px] font-medium" style={{ ...body, color: C.inkSoft }}>
        {NL_STATUS[status]}
      </span>
    </span>
  );
}

// A recessed jack socket.
function Jack({ tone = C.lime, size = 22 }: { tone?: string; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: C.slot,
        boxShadow: `inset 0 0 0 2px rgba(0,0,0,0.6), 0 0 0 1px ${C.lineHi}`,
      }}
      aria-hidden="true"
    >
      <span
        className="rounded-full"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          background: tone,
          boxShadow: `0 0 6px ${tone}88`,
        }}
      />
    </span>
  );
}

// A rotary knob with an indicator notch.
function Knob({ pct, label }: { pct: number; label: string }) {
  const angle = -135 + (pct / 100) * 270;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="relative flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${C.rackHi}, ${C.slot})`,
          boxShadow: `inset 0 1px 0 ${C.lineHi}, 0 2px 4px rgba(0,0,0,0.5)`,
          border: `1px solid ${C.line}`,
        }}
        aria-hidden="true"
      >
        <span
          className="absolute h-3 w-[2.5px] rounded-full"
          style={{
            background: C.lime,
            top: 5,
            transformOrigin: "center 17px",
            transform: `rotate(${angle}deg)`,
            boxShadow: `0 0 4px ${C.lime}`,
          }}
        />
      </span>
      <span className="text-[8px] tracking-[0.06em]" style={{ ...micro, color: C.muted }}>
        {label}
      </span>
    </div>
  );
}

// A horizontal slider potmeter (used for sparks / values).
function Slider({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const last = data[data.length - 1] ?? 0;
  const pct = ((last - min) / span) * 100;
  return (
    <div
      className="relative h-2 w-full rounded-full"
      style={{ background: C.slot, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)" }}
      aria-hidden="true"
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{
          width: `${Math.max(8, pct)}%`,
          background: `linear-gradient(90deg, ${C.limeDim}, ${C.lime})`,
        }}
      />
      <div
        className="absolute top-1/2 h-4 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px]"
        style={{
          left: `${Math.max(8, pct)}%`,
          background: C.rackHi,
          border: `1px solid ${C.lineHi}`,
          boxShadow: `0 0 6px ${C.lime}66`,
        }}
      />
    </div>
  );
}

// A patch cable: bezier with catenary sag between two points.
function PatchCable({ tone, sag = 26 }: { tone: string; sag?: number }) {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d={`M4,10 C 30,${10 + sag} 70,${10 + sag} 96,10`}
        fill="none"
        stroke={tone}
        strokeWidth={3.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.9}
      />
      <circle cx={4} cy={10} r={3} fill={tone} />
      <circle cx={96} cy={10} r={3} fill={tone} />
    </svg>
  );
}

function ledStyle(on: boolean, tone: string): CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: on ? tone : C.faint,
    boxShadow: on ? `0 0 6px ${tone}` : "none",
  };
}

function moduleStyle(): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${C.rackHi}, ${C.rack})`,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    boxShadow: `inset 0 1px 0 ${C.lineHi}, 0 8px 24px -14px rgba(0,0,0,0.9)`,
  };
}

function ScreenHead({ mod, title, sub }: { mod: string; title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[8px] tracking-[0.12em]" style={{ ...micro, color: C.lime }}>
          {mod}
        </span>
        <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="text-[28px] font-bold leading-none tracking-tight sm:text-[34px]"
        style={{ ...head, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[13px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
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
      <ScreenHead
        mod="MAIN OUT"
        title={`Patchbay — ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je profiel-module is gepatcht en zendt signaal. Eén verbinding vraagt vandaag aandacht."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div key={k.label} className="p-4" style={moduleStyle()}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] tracking-[0.06em]" style={{ ...micro, color: C.muted }}>
                CH.{i + 1}
              </span>
              <span style={ledStyle(k.up, k.up ? C.lime : C.amber)} aria-hidden="true" />
            </div>
            <div className="mt-2 text-[11px] font-medium" style={{ ...body, color: C.inkSoft }}>
              {k.label}
            </div>
            <div
              className="mt-0.5 text-[24px] font-bold tabular-nums leading-none"
              style={{ ...head, color: C.ink }}
            >
              {k.value}
            </div>
            <div
              className="mt-1 text-[11px] font-semibold tabular-nums"
              style={{ ...mono, color: k.up ? C.lime : C.amber }}
            >
              {k.trend}
            </div>
            <div className="mt-3">
              <Slider data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 text-[8px] tracking-[0.12em]" style={{ ...micro, color: C.lime }}>
            SIGNAL &gt; TOP MATCH
          </div>
          <button
            onClick={onOpen}
            className="group w-full p-5 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d22]"
            style={moduleStyle()}
          >
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <Knob pct={top.match} label={`${top.match}%`} />
                <Jack tone={C.lime} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[18px] font-bold leading-tight"
                  style={{ ...head, color: C.ink }}
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
                      className="rounded-sm px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...body,
                        background: C.slot,
                        color: C.inkSoft,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight
                size={18}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.lime }}
                aria-hidden="true"
              />
            </div>
          </button>

          <div className="mt-5 flex items-center gap-4 p-5" style={moduleStyle()}>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(74,222,128,0.12)", color: C.green }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2} />
            </span>
            <div>
              <div
                className="inline-flex items-center gap-2 text-[13px] font-bold"
                style={{ ...head, color: C.ink }}
              >
                {PROFIEL.trust}
                <span style={ledStyle(true, C.green)} aria-hidden="true" />
              </div>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ ...body, color: C.inkSoft }}>
                Alle bewijs-kabels zijn ingeprikt. Opdrachtgevers ontvangen een schoon, geverifieerd
                signaal.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-[8px] tracking-[0.12em]" style={{ ...micro, color: C.lime }}>
            PATCH RACK
          </div>
          <div className="space-y-2">
            {CREDENTIALS.map((c, i) => (
              <div key={c.naam} className="flex items-center gap-3 p-3.5" style={moduleStyle()}>
                <Jack tone={CABLES[i % CABLES.length]} size={20} />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[12.5px] font-semibold"
                    style={{ ...body, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 truncate text-[11px]" style={{ ...body, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
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
        mod="SEQUENCER"
        title="Marktplaats"
        sub="Elke opdracht is een module — patch de match en zie waarom het signaal klopt."
      />

      <div className="mb-6 flex items-center gap-2 rounded-lg px-4 py-2.5" style={moduleStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.lime }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-50"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-sm px-3 py-1 text-[10px] tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
            style={{ ...micro, color: C.lime, background: C.slot, border: `1px solid ${C.line}` }}
          >
            WIS
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-lg px-6 py-16 text-center"
          style={moduleStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.slot, color: C.lime }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[19px] font-bold" style={{ ...head, color: C.ink }}>
            Geen signaal
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.muted }}>
            Geen module gevonden voor &ldquo;{query}&rdquo;. Draai even aan een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-md px-5 py-2 text-[12px] font-bold text-[#1b1d22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d22]"
            style={{ ...body, background: C.lime }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            const cable = CABLES[i % CABLES.length] as string;
            return (
              <article key={o.id} className="flex h-full flex-col p-5" style={moduleStyle()}>
                <div className="flex items-start justify-between gap-3">
                  <Knob pct={o.match} label={`${o.match}%`} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
                    style={{
                      background: isSaved ? "rgba(163,230,53,0.14)" : C.slot,
                      color: isSaved ? C.lime : C.muted,
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
                  className="mt-3 text-[16px] font-bold leading-tight"
                  style={{ ...head, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[11.5px]" style={{ ...body, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <div className="my-3 h-4" style={{ marginLeft: -4, marginRight: -4 }}>
                  <PatchCable tone={cable} sag={20} />
                </div>
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
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-[12px] font-bold text-[#1b1d22] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d22]"
                  style={{ ...body, background: C.lime }}
                >
                  Patch opdracht
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
        className="mb-5 inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
        style={{ ...body, color: C.inkSoft, background: C.slot, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="p-6" style={moduleStyle()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Knob pct={opdracht.match} label={`${opdracht.match}% MATCH`} />
            <div>
              <h2 className="text-[24px] font-bold leading-tight" style={{ ...head, color: C.ink }}>
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
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
            style={{
              ...body,
              color: isSaved ? C.lime : C.inkSoft,
              background: isSaved ? "rgba(163,230,53,0.14)" : C.slot,
              border: `1px solid ${C.line}`,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={1.8} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "TARIEF", value: opdracht.tarief },
            { Icon: Clock, label: "INZET", value: opdracht.uren },
            { Icon: Calendar, label: "START", value: opdracht.start },
            { Icon: MapPin, label: "PLAATS", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-md p-3"
              style={{ background: C.slot, border: `1px solid ${C.line}` }}
            >
              <m.Icon size={14} style={{ color: C.lime }} aria-hidden="true" />
              <div
                className="mt-1 text-[8px] tracking-[0.08em]"
                style={{ ...micro, color: C.muted }}
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
        <div className="p-5" style={moduleStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span style={ledStyle(true, C.lime)} aria-hidden="true" />
            <span className="text-[8px] tracking-[0.1em]" style={{ ...micro, color: C.lime }}>
              SIGNAL PATCHED · Waarom deze past
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-center gap-2.5">
                <Jack tone={C.lime} size={16} />
                <span
                  className="h-px flex-none"
                  style={{ width: 14, background: C.lime }}
                  aria-hidden="true"
                />
                <span className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                  {r}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={moduleStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span style={ledStyle(true, C.amber)} aria-hidden="true" />
            <span className="text-[8px] tracking-[0.1em]" style={{ ...micro, color: C.amber }}>
              SIGNAL DAMPED · Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-center gap-2.5">
                <Jack tone={C.amber} size={16} />
                <span
                  className="h-px flex-none"
                  style={{ width: 14, background: C.amber, opacity: 0.6 }}
                  aria-hidden="true"
                />
                <span className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                  {r}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-[13px] font-bold text-[#1b1d22] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d22]"
          style={{ ...body, background: applied ? C.green : C.lime }}
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <Power size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Signaal verzonden" : "Reageer op opdracht"}
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
        mod="GATE / VERIFY"
        title="Verificatie"
        sub="Elke bewijs-kabel is ingeprikt en getest. Je gevoelige documenten blijven privé."
      />

      <div className="mb-6 flex items-center gap-4 p-5" style={moduleStyle()}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(74,222,128,0.12)", color: C.green }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div
            className="inline-flex items-center gap-2 text-[13px] font-bold"
            style={{ ...head, color: C.ink }}
          >
            {PROFIEL.trust}
            <span style={ledStyle(true, C.green)} aria-hidden="true" />
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
            Versleuteld bewaard, alleen gepatcht met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={moduleStyle()}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} ingeprikt` : `Prik ${c.naam} in`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
                  style={{
                    background: done ? C.lime : C.slot,
                    color: done ? "#1b1d22" : "transparent",
                    border: `1px solid ${done ? C.lime : C.line}`,
                    boxShadow: done ? `0 0 8px ${C.lime}88` : "none",
                  }}
                >
                  {done && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                </button>
                <Jack tone={CABLES[i % CABLES.length]} size={18} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[11px]" style={{ ...body, color: C.muted }}>
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
            <span className="text-[8px] tracking-[0.12em]" style={{ ...micro, color: C.lime }}>
              DOC BANK
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
              style={{ background: C.slot, color: C.lime, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="rounded-sm px-3 py-1 text-[9px] tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
                style={{
                  ...micro,
                  color: feedState === s ? "#1b1d22" : C.muted,
                  background: feedState === s ? C.lime : C.slot,
                  border: `1px solid ${C.line}`,
                }}
              >
                {s === "ok" ? "LIVE" : s === "loading" ? "LOAD" : "ERR"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={moduleStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.slot }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.slot }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={moduleStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "rgba(248,113,113,0.12)", color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[14px] font-bold" style={{ ...head, color: C.ink }}>
                Kabel los
              </div>
              <p className="text-[11.5px]" style={{ ...body, color: C.muted }}>
                Geen verbinding met de documentbank. Prik opnieuw in.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-md px-4 py-2 text-[11.5px] font-bold text-[#1b1d22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1d22]"
                style={{ ...body, background: C.lime }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={moduleStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                    style={{
                      ...mono,
                      background: C.slot,
                      color: C.lime,
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
                    <div className="text-[10.5px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <span style={ledStyle(true, statusMeta(d.status).fg)} aria-hidden="true" />
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
      <ScreenHead mod="TRIGGER" title="Acties" />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-lg px-6 py-16 text-center"
          style={moduleStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(74,222,128,0.12)", color: C.green }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-bold" style={{ ...head, color: C.ink }}>
            Alles gepatcht
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...body, color: C.muted }}>
            Geen triggers meer open vandaag.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-md px-4 py-2"
            style={{ background: C.slot, border: `1px solid ${C.line}` }}
          >
            <span style={ledStyle(true, C.lime)} aria-hidden="true" />
            <span className="text-[12px] font-bold" style={{ ...body, color: C.ink }}>
              {openCount} {openCount === 1 ? "trigger" : "triggers"} actief
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tone = a.urgentie === "warning" ? C.amber : C.lime;
              return (
                <li key={a.titel} className="flex items-start gap-4 p-5" style={moduleStyle()}>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
                    style={{
                      background: isDone ? C.green : C.slot,
                      color: isDone ? "#1b1d22" : "transparent",
                      border: `1px solid ${isDone ? C.green : C.line}`,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[14.5px] font-bold leading-snug"
                      style={{
                        ...head,
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
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-semibold"
                        style={{
                          ...body,
                          color: tone,
                          background: C.slot,
                          border: `1px solid ${tone}44`,
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
  const badgeTone = (status: string): string =>
    status === "Betaald" ? C.green : status === "Openstaand" ? C.amber : C.muted;
  return (
    <div>
      <ScreenHead
        mod="MIXER"
        title="Facturen"
        sub="De uitgangsmix van je omzet — helder uitgelezen."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <div key={s.label} className="p-4" style={moduleStyle()}>
            <div className="text-[10.5px] font-medium" style={{ ...body, color: C.muted }}>
              {s.label}
            </div>
            <div
              className="mt-1 text-[22px] font-bold tabular-nums"
              style={{ ...head, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2" style={moduleStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[9px] tracking-[0.1em]"
                    style={{ ...micro, color: C.muted }}
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const tone = badgeTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#2a2e35]"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.lime }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[12.5px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
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
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                        style={{ ...body, color: tone }}
                      >
                        <span style={ledStyle(true, tone)} aria-hidden="true" />
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

export function Concept255() {
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
      style={{ ...body, color: C.ink, background: C.panel }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-3"
          style={moduleStyle()}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#1b1d22]"
              style={{ background: C.lime, boxShadow: `0 0 14px ${C.lime}66` }}
              aria-hidden="true"
            >
              <Cable size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...head, color: C.ink }}
              >
                Synth
              </div>
              <div className="text-[8px] tracking-[0.12em]" style={{ ...micro, color: C.lime }}>
                ZZP MODULAR RACK
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px]"
                style={{ ...body, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold"
              style={{
                ...head,
                background: C.slot,
                color: C.lime,
                border: `1px solid ${C.lineHi}`,
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
                style={{
                  ...body,
                  color: on ? "#1b1d22" : C.inkSoft,
                  background: on ? C.lime : C.rack,
                  border: `1px solid ${on ? C.lime : C.line}`,
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10px]"
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span style={ledStyle(true, C.lime)} aria-hidden="true" />
            {ACTIES.length} triggers · {CREDENTIALS.length} bewijs-kabels
          </span>
          <span style={micro} className="text-[8px] tracking-[0.1em]">
            PATCHBAY ONLINE
          </span>
        </footer>
      </div>
    </div>
  );
}
