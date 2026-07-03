"use client";

// Concept 45 — "Duim" · Mobile-first, duim-zone native (LICHT).
// Het hele platform ontworpen als een best-in-class mobiele app, getoond in een gecentreerd
// telefoon-frame op een zacht bureaublad. Onderste tabbalk (duim-bereik), grote raakvlakken,
// swipe-bare opdrachtkaarten, sheet/drawer-detail, één-hand-ergonomie en grote primaire acties
// verankerd onderaan. Voelt als een verzendklare iOS/Android-app.
// Palet: canvas #eceef2 (bureau), app-bg #ffffff, inkt #12141a, indigo #4f46e5, zacht groen
// #16a34a. Fonts: Manrope (--font-lab-manrope) + Inter (--font-lab-inter).

import { useState } from "react";
import {
  Home,
  Store,
  ShieldCheck,
  Receipt,
  Bell,
  Search,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  BatteryFull,
  SignalHigh,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  canvas: "#eceef2",
  canvasDeep: "#e0e3ea",
  app: "#ffffff",
  appSoft: "#f7f8fb",
  appSoft2: "#eef1f7",
  ink: "#12141a",
  inkSoft: "#3c4150",
  muted: "#6b7180",
  faint: "#a2a8b6",
  line: "#e9ebf1",
  lineSoft: "#f1f2f7",
  indigo: "#4f46e5",
  indigoDeep: "#4338ca",
  indigoSoft: "#eef0fe",
  green: "#16a34a",
  greenSoft: "#e7f6ec",
  amber: "#c2790b",
  amberSoft: "#fcf3e1",
  red: "#dc2626",
  redSoft: "#fdecec",
  bezel: "#1b1e26",
};

const head = { fontFamily: "var(--font-lab-manrope)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Onderste tab-schermen (duim-bereik). Opdracht-detail is een sheet, geen tab.
const TABS: { key: ScreenKey; label: string; Icon: LucideIcon }[] = [
  { key: "dashboard", label: "Start", Icon: Home },
  { key: "marktplaats", label: "Markt", Icon: Store },
  { key: "acties", label: "Acties", Icon: Bell },
  { key: "verificatie", label: "Profiel", Icon: ShieldCheck },
  { key: "facturen", label: "Omzet", Icon: Receipt },
];

type Tone = { label: string; fg: string; bg: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, bg: C.greenSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.amber, bg: C.amberSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.red, bg: C.redSoft, Icon: X };
  }
}

/* ---------- Telefoon-shell ---------- */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-3" style={body}>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.ink, ...head }}>
        9:41
      </span>
      <div className="flex items-center gap-1.5" style={{ color: C.ink }} aria-hidden="true">
        <SignalHigh size={15} />
        <Wifi size={15} />
        <BatteryFull size={17} />
      </div>
    </div>
  );
}

/* ---------- Kleine bouwstenen ---------- */

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: tone.fg, background: tone.bg, ...head }}
    >
      <tone.Icon size={11} aria-hidden="true" /> {children}
    </span>
  );
}

function MatchRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.appSoft2}
          strokeWidth={3.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.indigo}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute text-[12px] font-bold tabular-nums"
        style={{ color: C.ink, ...head }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept45() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sheet, setSheet] = useState<Opdracht | null>(null);

  const openDetail = (o: Opdracht) => setSheet(o);

  return (
    <div
      className="relative flex min-h-[680px] w-full items-center justify-center overflow-hidden p-4 antialiased sm:p-8"
      style={{
        background: `radial-gradient(120% 100% at 50% -10%, ${C.canvas}, ${C.canvasDeep})`,
        ...body,
      }}
    >
      {/* Bureau-textuur / zachte schaduwvlek */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, rgba(27,30,38,0.06), transparent)" }}
        aria-hidden="true"
      />

      {/* Telefoon */}
      <div
        className="relative flex w-full max-w-[390px] flex-col"
        style={{
          height: "min(760px, 88vh)",
          minHeight: 600,
          background: C.bezel,
          borderRadius: 46,
          padding: 5,
          boxShadow:
            "0 40px 80px -30px rgba(18,20,26,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        {/* Scherm */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden"
          style={{ background: C.app, borderRadius: 42 }}
        >
          {/* Dynamic island / notch */}
          <div
            className="pointer-events-none absolute left-1/2 top-2 z-30 h-6 w-[104px] -translate-x-1/2 rounded-full"
            style={{ background: C.bezel }}
            aria-hidden="true"
          />

          <StatusBar />

          {/* Scherm-content */}
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
            {screen === "dashboard" && <Dashboard onOpen={openDetail} onGoto={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={openDetail} />}
            {screen === "acties" && <Acties />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "facturen" && <Facturen />}
          </div>

          {/* Onderste tabbalk (duim-zone) */}
          <nav
            className="relative z-20 flex items-stretch justify-around px-2 pb-5 pt-2"
            style={{
              background: "rgba(255,255,255,0.86)",
              backdropFilter: "blur(12px)",
              borderTop: `1px solid ${C.line}`,
            }}
            aria-label="Hoofdnavigatie"
          >
            {TABS.map((t) => {
              const on = t.key === screen;
              return (
                <button
                  key={t.key}
                  onClick={() => setScreen(t.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                >
                  <t.Icon
                    size={22}
                    aria-hidden="true"
                    style={{ color: on ? C.indigo : C.faint }}
                    strokeWidth={on ? 2.4 : 2}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: on ? C.indigo : C.muted, ...head }}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Home-indicator */}
          <div className="flex justify-center pb-2" aria-hidden="true">
            <div className="h-1 w-32 rounded-full" style={{ background: "#00000022" }} />
          </div>

          {/* Opdracht-detail sheet */}
          {sheet && <DetailSheet opdracht={sheet} onClose={() => setSheet(null)} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Scherm-header (pull-style) ---------- */

function ScreenHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between px-5 pb-3 pt-2">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: C.ink, ...head }}>
          {title}
        </h1>
        {sub && (
          <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
            {sub}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGoto,
}: {
  onOpen: (o: Opdracht) => void;
  onGoto: (s: ScreenKey) => void;
}) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-5 pb-1 pt-2">
        <div>
          <p className="text-[13px]" style={{ color: C.muted }}>
            Goedemorgen,
          </p>
          <h1
            className="text-[24px] font-extrabold tracking-tight"
            style={{ color: C.ink, ...head }}
          >
            {PROFIEL.naam.split(" ")[0]}
          </h1>
        </div>
        <div className="relative">
          <button
            onClick={() => onGoto("acties")}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{ background: C.appSoft }}
            aria-label={`Meldingen, ${ongelezen} ongelezen`}
          >
            <Bell size={20} style={{ color: C.ink }} aria-hidden="true" />
            <span
              className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ background: C.red }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Trust-kaart (indigo hero) */}
      <div className="px-5 pt-2">
        <div
          className="relative overflow-hidden rounded-[26px] p-5 text-white"
          style={{
            background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDeep})`,
            boxShadow: "0 20px 40px -20px rgba(79,70,229,0.6)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-30"
            style={{ background: "#fff", filter: "blur(24px)" }}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-2">
            <ShieldCheck size={16} aria-hidden="true" />
            <span className="text-[12px] font-semibold uppercase tracking-wider" style={head}>
              {PROFIEL.trust}
            </span>
          </div>
          <p className="relative mt-3 text-[15px] font-medium leading-snug">
            Je profiel is sterk. Drie nieuwe matches boven 85% wachten op een reactie.
          </p>
          <button
            onClick={() => onGoto("marktplaats")}
            className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4f46e5] active:scale-[0.97]"
            style={{ color: C.indigo, ...head }}
          >
            Bekijk matches <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* KPI-tegels (2 kolommen) */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-3.5"
            style={{ background: C.appSoft, border: `1px solid ${C.line}` }}
          >
            <p className="text-[11px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-1 text-[20px] font-extrabold tabular-nums tracking-tight"
              style={{ color: C.ink, ...head }}
            >
              {k.value}
            </p>
            <span
              className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
              style={{ color: k.up ? C.green : C.amber }}
            >
              {k.up ? (
                <ArrowUpRight size={12} aria-hidden="true" />
              ) : (
                <ArrowDownRight size={12} aria-hidden="true" />
              )}
              {k.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Beste matches — swipe-bare rij */}
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h2
          className="flex items-center gap-1.5 text-[16px] font-bold"
          style={{ color: C.ink, ...head }}
        >
          <Sparkles size={16} style={{ color: C.indigo }} aria-hidden="true" /> Beste matches
        </h2>
        <button
          onClick={() => onGoto("marktplaats")}
          className="text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
          style={{ color: C.indigo }}
        >
          Alles
        </button>
      </div>
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            onClick={() => onOpen(o)}
            className="w-[230px] shrink-0 snap-start rounded-2xl p-4 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] active:scale-[0.98]"
            style={{
              background: C.app,
              border: `1px solid ${C.line}`,
              boxShadow: "0 8px 22px -16px rgba(18,20,26,0.4)",
            }}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                {o.id}
              </span>
              <MatchRing value={o.match} size={40} />
            </div>
            <p
              className="mt-2 line-clamp-2 text-[14.5px] font-bold leading-snug"
              style={{ color: C.ink, ...head }}
            >
              {o.titel}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: C.muted }}>
              <MapPin size={11} aria-hidden="true" /> {o.plaats}
            </p>
            <div
              className="mt-3 flex items-center justify-between border-t pt-2.5"
              style={{ borderColor: C.lineSoft }}
            >
              <span className="text-[13px] font-bold tabular-nums" style={{ color: C.indigo }}>
                {o.tarief.replace(" / uur", "")}
              </span>
              <span className="text-[11.5px] tabular-nums" style={{ color: C.muted }}>
                {o.uren}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Certificaten-lijst */}
      <div className="px-5 pt-5">
        <h2 className="pb-2 text-[16px] font-bold" style={{ color: C.ink, ...head }}>
          Certificaten
        </h2>
        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                  background: C.app,
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: st.bg }}
                  aria-hidden="true"
                >
                  <st.Icon size={16} style={{ color: st.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink, ...head }}
                  >
                    {c.naam}
                  </p>
                  <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: C.faint }} aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="pb-4">
      <ScreenHeader title="Marktplaats" sub={`${filtered.length} open opdrachten`} />

      {/* Zoekbalk */}
      <div className="px-5">
        <div
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
          style={{ background: C.appSoft, border: `1px solid ${C.line}` }}
        >
          <Search size={18} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a2a8b6]"
            style={{ color: C.ink }}
          />
        </div>
      </div>

      {/* Segmented control (sortering) */}
      <div className="px-5 pt-3">
        <div
          className="flex gap-1 rounded-xl p-1"
          style={{ background: C.appSoft2 }}
          role="tablist"
          aria-label="Sorteren"
        >
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                role="tab"
                aria-selected={on}
                onClick={() => setSort(s)}
                className="flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                style={{
                  color: on ? C.ink : C.muted,
                  background: on ? C.app : "transparent",
                  boxShadow: on ? "0 1px 3px rgba(18,20,26,0.12)" : "none",
                  ...head,
                }}
              >
                {s === "match" ? "Beste match" : "Hoogste tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kaarten */}
      <div className="space-y-3 px-5 pt-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl px-5 py-12 text-center" style={{ background: C.appSoft }}>
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: C.indigoSoft }}
              aria-hidden="true"
            >
              <Search size={22} style={{ color: C.indigo }} />
            </div>
            <p className="mt-3 text-[15px] font-bold" style={{ color: C.ink, ...head }}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-1 max-w-[220px] text-[13px]" style={{ color: C.muted }}>
              Geen opdrachten voor &quot;{q}&quot;. Probeer een andere zoekterm.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-4 rounded-full px-4 py-2 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              style={{ background: C.indigo }}
            >
              Wissen
            </button>
          </div>
        ) : (
          filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpen(o)}
              className="w-full rounded-[22px] p-4 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] active:scale-[0.99]"
              style={{
                background: C.app,
                border: `1px solid ${C.line}`,
                boxShadow: "0 10px 26px -20px rgba(18,20,26,0.5)",
              }}
            >
              <div className="flex items-start gap-3">
                <MatchRing value={o.match} size={46} />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[15px] font-bold leading-snug"
                    style={{ color: C.ink, ...head }}
                  >
                    {o.titel}
                  </p>
                  <p
                    className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ color: C.inkSoft, background: C.appSoft2 }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between border-t pt-3"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="text-[15px] font-extrabold tabular-nums"
                  style={{ color: C.indigo, ...head }}
                >
                  {o.tarief}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[13px] font-semibold"
                  style={{ color: C.ink }}
                >
                  Bekijk <ChevronRight size={15} aria-hidden="true" />
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail sheet (drawer van onderaf) ---------- */

function DetailSheet({ opdracht, onClose }: { opdracht: Opdracht; onClose: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={opdracht.titel}
    >
      <button
        className="absolute inset-0 focus-visible:outline-none"
        style={{ background: "rgba(18,20,26,0.42)" }}
        onClick={onClose}
        aria-label="Sluiten"
      />
      <div
        className="relative flex max-h-[92%] flex-col overflow-hidden"
        style={{
          background: C.app,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          boxShadow: "0 -20px 50px -20px rgba(18,20,26,0.5)",
        }}
      >
        {/* Grip + terug */}
        <div className="flex justify-center pt-3" aria-hidden="true">
          <div className="h-1.5 w-11 rounded-full" style={{ background: C.appSoft2 }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-1 pt-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{ color: C.indigo }}
          >
            <ChevronLeft size={17} aria-hidden="true" /> Terug
          </button>
          <span className="text-[11px] tabular-nums" style={{ color: C.faint }}>
            {opdracht.id}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="flex items-start gap-3 pt-2">
            <MatchRing value={opdracht.match} size={52} />
            <div>
              <h2
                className="text-[20px] font-extrabold leading-tight tracking-tight"
                style={{ color: C.ink, ...head }}
              >
                {opdracht.titel}
              </h2>
              <p className="mt-0.5 flex items-center gap-1 text-[13px]" style={{ color: C.muted }}>
                <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-xl p-3 text-center"
                style={{ background: C.appSoft }}
              >
                <p
                  className="text-[10.5px] font-medium uppercase tracking-wide"
                  style={{ color: C.muted }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1 text-[13px] font-bold tabular-nums"
                  style={{ color: C.ink, ...head }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          <h3
            className="mt-5 flex items-center gap-1.5 text-[14px] font-bold"
            style={{ color: C.ink, ...head }}
          >
            <Sparkles size={15} style={{ color: C.indigo }} aria-hidden="true" /> Waarom deze match
          </h3>
          <div className="mt-2.5 space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <div
                key={r}
                className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: C.greenSoft }}
              >
                <Check size={16} style={{ color: C.green, marginTop: 1 }} aria-hidden="true" />
                <span className="text-[13px]" style={{ color: C.ink }}>
                  {r}
                </span>
              </div>
            ))}
            {opdracht.redenen.min.map((r) => (
              <div
                key={r}
                className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: C.amberSoft }}
              >
                <AlertTriangle
                  size={16}
                  style={{ color: C.amber, marginTop: 1 }}
                  aria-hidden="true"
                />
                <span className="text-[13px]" style={{ color: C.inkSoft }}>
                  {r}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Onderaan verankerde primaire actie */}
        <div
          className="px-5 pb-6 pt-3"
          style={{
            borderTop: `1px solid ${C.line}`,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
          }}
        >
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-95"
            style={{ background: state === "sent" ? C.green : C.indigo, ...head }}
          >
            {state === "sending" && (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            )}
            {state === "sent" && <Check size={18} aria-hidden="true" />}
            {state === "idle" && <Send size={16} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<"warning" | "info", Tone> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.indigo, bg: C.indigoSoft, Icon: Bell, label: "Ter info" },
  };
  return (
    <div className="pb-4">
      <ScreenHeader title="Acties" sub="Wat nu je aandacht vraagt" />
      <div className="space-y-3 px-5 pt-1">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="rounded-[22px] p-4"
              style={{
                background: C.app,
                border: `1px solid ${C.line}`,
                boxShadow: "0 8px 22px -18px rgba(18,20,26,0.5)",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: t.bg }}
                  aria-hidden="true"
                >
                  <t.Icon size={20} style={{ color: t.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: t.fg, background: t.bg, ...head }}
                  >
                    {t.label}
                  </span>
                  <p
                    className="mt-1 text-[14.5px] font-bold leading-snug"
                    style={{ color: C.ink, ...head }}
                  >
                    {a.titel}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
              </div>
              <button
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13.5px] font-bold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] active:scale-[0.99]"
                style={{ color: t.fg, background: t.bg, ...head }}
              >
                {a.cta} <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        {/* Berichten */}
        <h2 className="px-1 pb-1 pt-3 text-[16px] font-bold" style={{ color: C.ink, ...head }}>
          Berichten
        </h2>
        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`, background: C.app }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                style={{ background: b.ongelezen ? C.indigo : C.faint, ...head }}
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className="truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink, ...head }}
                  >
                    {b.van}
                  </p>
                  {b.ongelezen && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: C.indigo }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="truncate text-[12px]" style={{ color: C.muted }}>
                  {b.preview}
                </p>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
                {b.tijd}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie / Profiel ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  return (
    <div className="pb-4">
      <ScreenHeader title="Profiel" sub={PROFIEL.rol} />

      {/* Profielkaart */}
      <div className="px-5">
        <div
          className="flex items-center gap-3.5 rounded-[22px] p-4"
          style={{ background: C.appSoft, border: `1px solid ${C.line}` }}
        >
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDeep})`, ...head }}
          >
            {PROFIEL.initialen}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold" style={{ color: C.ink, ...head }}>
              {PROFIEL.naam}
            </p>
            <p
              className="mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold"
              style={{ color: C.green }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
          </div>
        </div>
      </div>

      {/* Voortgangsbalk */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...head }}>
            Verificatie
          </span>
          <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: C.muted }}>
            {verified}/{total} geverifieerd
          </span>
        </div>
        <div
          className="flex h-2.5 overflow-hidden rounded-full"
          style={{ background: C.appSoft2 }}
          aria-hidden="true"
        >
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="h-full"
                style={{
                  width: `${100 / total}%`,
                  background: st.fg,
                  opacity: c.status === "VERIFIED" ? 1 : 0.55,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Certificaten */}
      <div className="space-y-2.5 px-5 pt-4">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: C.app, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: st.bg }}
                aria-hidden="true"
              >
                {c.status === "SUBMITTED" ? (
                  <Loader2
                    size={18}
                    className="motion-safe:animate-spin"
                    style={{ color: st.fg }}
                  />
                ) : (
                  <st.Icon size={18} style={{ color: st.fg }} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold" style={{ color: C.ink, ...head }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <Pill tone={st}>{st.label}</Pill>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Facturen / Omzet ---------- */

function Facturen() {
  const statusTone: Record<string, Tone> = {
    Betaald: { fg: C.green, bg: C.greenSoft, Icon: Check, label: "Betaald" },
    Openstaand: { fg: C.amber, bg: C.amberSoft, Icon: Clock, label: "Openstaand" },
    Concept: { fg: C.muted, bg: C.appSoft2, Icon: FileText, label: "Concept" },
  };
  return (
    <div className="pb-4">
      <ScreenHeader
        title="Omzet"
        sub="Deze maand"
        action={
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] active:scale-95"
            style={{ background: C.indigo }}
            aria-label="Nieuwe factuur"
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        }
      />

      {/* Omzet-hero */}
      <div className="px-5">
        <div
          className="rounded-[22px] p-4"
          style={{ background: C.appSoft, border: `1px solid ${C.line}` }}
        >
          <p className="text-[12px] font-medium" style={{ color: C.muted }}>
            Omzet deze maand
          </p>
          <p
            className="mt-1 text-[30px] font-extrabold tabular-nums tracking-tight"
            style={{ color: C.ink, ...head }}
          >
            € 8.240
          </p>
          <div className="mt-2 flex items-center gap-3 text-[12px]">
            <span
              className="inline-flex items-center gap-1 font-semibold"
              style={{ color: C.green }}
            >
              <ArrowUpRight size={13} aria-hidden="true" /> +12%
            </span>
            <span style={{ color: C.muted }}>€ 1.350 nog te factureren</span>
          </div>
        </div>
      </div>

      {/* Facturenlijst */}
      <div className="space-y-2.5 px-5 pt-4">
        {FACTUREN.map((f) => {
          const t = statusTone[f.status] ?? statusTone.Concept!;
          return (
            <div
              key={f.nr}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: C.app, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: t.bg }}
                aria-hidden="true"
              >
                <t.Icon size={18} style={{ color: t.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold" style={{ color: C.ink, ...head }}>
                  {f.klant}
                </p>
                <p className="text-[11.5px] tabular-nums" style={{ color: C.muted }}>
                  {f.nr} · {f.datum}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[14px] font-extrabold tabular-nums"
                  style={{ color: C.ink, ...head }}
                >
                  {f.bedrag}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: t.fg }}>
                  {t.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
