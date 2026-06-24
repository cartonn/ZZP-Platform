"use client";

// Concept 09 — "Veld": mobile-first staffing app (Temper-speed, B2B-trust).
// The whole platform lives inside a centered phone frame: device chrome, a status bar,
// a thumb-zone bottom tab nav, and an opdracht-detail that slides up as a bottom-sheet.
// Self-contained mini-app, mock data only. Accent orange. Fast, optimistic actions.

import { useState } from "react";
import {
  Home,
  Search,
  ShieldCheck,
  Zap,
  FileText,
  Bookmark,
  BookmarkCheck,
  Check,
  AlertTriangle,
  Clock,
  X,
  MapPin,
  Signal,
  Wifi,
  BatteryFull,
  ChevronRight,
  Bell,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  type CredStatus,
  type Opdracht,
} from "./mock";

const sans = { fontFamily: "var(--font-lab-inter)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

const ORANGE = "#ea580c";

type TabKey = "dashboard" | "marktplaats" | "verificatie" | "acties" | "facturen";

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "dashboard", label: "Start", icon: Home },
  { key: "marktplaats", label: "Diensten", icon: Search },
  { key: "verificatie", label: "Vertrouwen", icon: ShieldCheck },
  { key: "acties", label: "Acties", icon: Zap },
  { key: "facturen", label: "Facturen", icon: FileText },
];

/* -------------------------------------------------------------- shared bits */

function TrustBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full bg-emerald-50 font-medium text-emerald-700",
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]",
      ].join(" ")}
    >
      <ShieldCheck className={small ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      Geverifieerd
    </span>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 72;
  const h = 24;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? ORANGE : "#a3a3a3"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

function SealIcon({ status }: { status: CredStatus }) {
  const map: Record<CredStatus, { cls: string; icon: typeof Check }> = {
    VERIFIED: { cls: "bg-emerald-50 text-emerald-600", icon: Check },
    EXPIRING: { cls: "bg-orange-50 text-orange-600", icon: AlertTriangle },
    SUBMITTED: { cls: "bg-neutral-100 text-neutral-500", icon: Clock },
    REJECTED: { cls: "bg-red-50 text-red-600", icon: X },
  };
  const c = map[status];
  const Icon = c.icon;
  return (
    <span
      className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-full", c.cls].join(
        " ",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

/* ----------------------------------------------------------------- top-level */

export function Concept09() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [sheet, setSheet] = useState<Opdracht | null>(null);

  function openOpdracht(o: Opdracht) {
    setSheet(o);
  }

  return (
    <div
      style={sans}
      className="flex min-h-[640px] w-full items-center justify-center bg-neutral-100 p-4 antialiased [color-scheme:light] sm:p-8"
    >
      {/* Phone frame */}
      <div className="relative w-full max-w-[420px]">
        <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-neutral-900 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]">
          {/* Notch */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2">
            <div className="h-6 w-32 rounded-b-2xl bg-neutral-900" aria-hidden />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pb-1 pt-2.5 text-[12px] font-semibold text-neutral-900">
            <span style={mono} className="tabular-nums">
              9:41
            </span>
            <div className="flex items-center gap-1.5" aria-hidden>
              <Signal className="h-3.5 w-3.5" />
              <Wifi className="h-3.5 w-3.5" />
              <BatteryFull className="h-4 w-4" />
            </div>
          </div>

          {/* App header */}
          <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                style={{ backgroundColor: ORANGE }}
                aria-hidden
              >
                V
              </span>
              <div className="leading-tight">
                <div className="text-[14px] font-semibold tracking-tight">Veld</div>
                <div className="text-[11px] text-neutral-500">{PROFIEL.plaats}</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Meldingen"
              className="relative rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
            >
              <Bell className="h-5 w-5" aria-hidden />
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white"
                style={{ backgroundColor: ORANGE }}
                aria-hidden
              />
            </button>
          </header>

          {/* Scroll viewport */}
          <main className="h-[560px] overflow-y-auto overflow-x-hidden px-5 pb-28 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tab === "dashboard" && <DashboardScreen onOpen={openOpdracht} onTab={setTab} />}
            {tab === "marktplaats" && <MarktplaatsScreen onOpen={openOpdracht} />}
            {tab === "verificatie" && <VerificatieScreen />}
            {tab === "acties" && <ActiesScreen />}
            {tab === "facturen" && <FacturenScreen />}
          </main>

          {/* Bottom-sheet (opdracht detail) */}
          {sheet && <OpdrachtSheet o={sheet} onClose={() => setSheet(null)} />}

          {/* Bottom tab nav (thumb zone) */}
          <nav
            className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-neutral-200 bg-white/95 px-1 pb-3 pt-1.5 backdrop-blur"
            aria-label="Hoofdnavigatie"
          >
            {TABS.map((t) => {
              const active = t.key === tab;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setTab(t.key);
                    setSheet(null);
                  }}
                  className={[
                    "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50",
                    active ? "text-orange-600" : "text-neutral-400 hover:text-neutral-700",
                  ].join(" ")}
                >
                  <Icon className="h-[22px] w-[22px]" aria-hidden />
                  <span className="text-[10px] font-medium leading-none">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({
  onOpen,
  onTab,
}: {
  onOpen: (o: Opdracht) => void;
  onTab: (t: TabKey) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] text-neutral-500">Goedemorgen,</p>
        <h1 className="text-[20px] font-semibold tracking-tight">{PROFIEL.naam.split(" ")[0]}</h1>
      </div>

      {/* KPI cards (horizontal scroll) */}
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="w-[150px] shrink-0 rounded-2xl border border-neutral-200 bg-white p-3.5"
          >
            <div className="text-[11px] font-medium text-neutral-500">{kpi.label}</div>
            <div className="mt-1.5 flex items-end justify-between">
              <div style={mono} className="text-[19px] font-semibold tabular-nums tracking-tight">
                {kpi.value}
              </div>
              <Sparkline data={kpi.spark} up={kpi.up} />
            </div>
            <div
              style={mono}
              className={[
                "mt-1 text-[11px] font-medium tabular-nums",
                kpi.up ? "text-orange-600" : "text-neutral-500",
              ].join(" ")}
            >
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Top matches */}
      <section>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="text-[14px] font-semibold tracking-tight">Beste matches</h2>
          <button
            type="button"
            onClick={() => onTab("marktplaats")}
            className="text-[12px] font-medium text-orange-600 transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
          >
            Alles
          </button>
        </div>
        <div className="space-y-2.5">
          {OPDRACHTEN.slice(0, 2).map((o) => (
            <MatchCard key={o.id} o={o} onOpen={onOpen} />
          ))}
        </div>
      </section>

      {/* Acties preview */}
      <section>
        <h2 className="mb-2.5 text-[14px] font-semibold tracking-tight">Aandacht nodig</h2>
        <button
          type="button"
          onClick={() => onTab("acties")}
          className="flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/60 p-3.5 text-left transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">{ACTIES[0]?.titel}</div>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500">{ACTIES[0]?.detail}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
        </button>
      </section>
    </div>
  );
}

function MatchCard({ o, onOpen }: { o: Opdracht; onOpen: (o: Opdracht) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(o)}
      className="flex w-full flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-white p-3.5 text-left transition-[transform,box-shadow] duration-150 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 active:scale-[0.99] motion-reduce:transition-none"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold leading-snug tracking-tight">{o.titel}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {o.opdrachtgever} · {o.plaats}
            </span>
          </div>
        </div>
        <div
          className="flex shrink-0 flex-col items-center rounded-xl px-2.5 py-1.5 text-white"
          style={{ backgroundColor: ORANGE }}
        >
          <span style={mono} className="text-[15px] font-bold tabular-nums leading-none">
            {o.match}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wide opacity-90">match</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <TrustBadge small />
        <span style={mono} className="text-[13px] font-semibold tabular-nums text-neutral-900">
          {o.tarief}
        </span>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const filters = ["Alle", "≥85%", "Utrecht", "Avond", "BIG"];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-4">
      <h1 className="text-[18px] font-semibold tracking-tight">Diensten in de buurt</h1>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          aria-label="Zoek diensten"
          placeholder="Zoek dienst, plaats…"
          className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-[14px] placeholder:text-neutral-400 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        />
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === i}
            onClick={() => setActive(i)}
            className={[
              "min-h-[36px] shrink-0 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50",
              active === i
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onOpen(o)}
            className="flex w-full flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-white p-3.5 text-left transition-[transform,box-shadow] duration-150 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 active:scale-[0.99] motion-reduce:transition-none"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold leading-snug tracking-tight">
                  {o.titel}
                </div>
                <div className="mt-1 text-[12px] text-neutral-500">
                  {o.opdrachtgever} · {o.uren} · {o.start}
                </div>
              </div>
              <span
                style={mono}
                className="shrink-0 rounded-lg bg-orange-50 px-2 py-1 text-[13px] font-bold tabular-nums text-orange-600"
              >
                {o.match}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {o.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-2.5">
              <TrustBadge small />
              <span style={mono} className="text-[13px] font-semibold tabular-nums">
                {o.tarief}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Opdracht sheet */

function OpdrachtSheet({ o, onClose }: { o: Opdracht; onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  function claim() {
    if (claimed) return;
    setClaiming(true);
    // Optimistic confirmation — purely presentational.
    window.setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
    }, 650);
  }

  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 motion-reduce:transition-none"
      />
      <div
        role="dialog"
        aria-label={`Opdracht ${o.titel}`}
        className="absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-[2rem] bg-white pb-6 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.3)] duration-200 [animation:slideUp_0.22s_ease-out] [scrollbar-width:none] motion-reduce:[animation:none] [&::-webkit-scrollbar]:hidden"
      >
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div className="sticky top-0 z-10 bg-white px-5 pt-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-200" aria-hidden />
          <button
            type="button"
            aria-label="Sluiten"
            onClick={onClose}
            className="absolute right-4 top-3 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 px-5 pt-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span style={mono} className="text-[11px] tabular-nums text-neutral-400">
                  {o.id}
                </span>
                <h2 className="mt-0.5 text-[18px] font-semibold leading-snug tracking-tight">
                  {o.titel}
                </h2>
              </div>
              <div
                className="flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-white"
                style={{ backgroundColor: ORANGE }}
              >
                <span style={mono} className="text-[20px] font-bold tabular-nums leading-none">
                  {o.match}%
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wide opacity-90">
                  match
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[13px] text-neutral-600">
              <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {o.opdrachtgever} · {o.plaats}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-neutral-50 p-3 text-center">
            {[
              { l: "Tarief", v: o.tarief },
              { l: "Uren", v: o.uren },
              { l: "Start", v: o.start },
            ].map((cell) => (
              <div key={cell.l}>
                <div className="text-[10px] uppercase tracking-wide text-neutral-400">{cell.l}</div>
                <div style={mono} className="mt-0.5 text-[13px] font-semibold tabular-nums">
                  {cell.v}
                </div>
              </div>
            ))}
          </div>

          <TrustBadge />

          {/* Explainable matching */}
          <section className="space-y-3">
            <h3 className="text-[14px] font-semibold tracking-tight">Waarom deze match</h3>
            <div className="space-y-2">
              {o.redenen.plus.map((r) => (
                <div
                  key={r}
                  className="flex items-start gap-2.5 rounded-xl bg-emerald-50/70 px-3 py-2.5"
                >
                  <Plus className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span className="text-[13px] text-neutral-700">{r}</span>
                </div>
              ))}
              {o.redenen.min.map((r) => (
                <div
                  key={r}
                  className="flex items-start gap-2.5 rounded-xl bg-orange-50/70 px-3 py-2.5"
                >
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden />
                  <span className="text-[13px] text-neutral-700">{r}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 mt-5 flex items-center gap-2.5 border-t border-neutral-100 bg-white px-5 pt-4">
          <button
            type="button"
            aria-pressed={saved}
            onClick={() => setSaved((s) => !s)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
          >
            {saved ? (
              <BookmarkCheck className="h-5 w-5 text-orange-600" aria-hidden />
            ) : (
              <Bookmark className="h-5 w-5" aria-hidden />
            )}
            <span className="sr-only">{saved ? "Bewaard" : "Bewaar"}</span>
          </button>
          <button
            type="button"
            onClick={claim}
            disabled={claiming}
            className={[
              "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2",
              claimed ? "bg-emerald-600" : "hover:brightness-95",
            ].join(" ")}
            style={claimed ? undefined : { backgroundColor: ORANGE }}
          >
            {claiming ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
                Bezig…
              </>
            ) : claimed ? (
              <>
                <Check className="h-5 w-5" aria-hidden />
                Gereageerd
              </>
            ) : (
              "Claim dienst"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Verificatie */

function VerificatieScreen() {
  return (
    <div className="space-y-5">
      <h1 className="text-[18px] font-semibold tracking-tight">Vertrouwen</h1>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <div className="text-[15px] font-semibold">{PROFIEL.trust}</div>
            <div className="text-[12px] text-neutral-500">3 van 4 documenten geverifieerd</div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100" aria-hidden>
          <div className="h-full w-3/4 rounded-full bg-emerald-500" />
        </div>
      </div>

      <div className="space-y-2.5">
        {CREDENTIALS.map((c) => (
          <div
            key={c.naam}
            className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5"
          >
            <SealIcon status={c.status} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold leading-snug">{c.naam}</div>
              <div className="mt-0.5 text-[12px] text-neutral-500">{c.detail}</div>
            </div>
            <span
              className={[
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                c.status === "VERIFIED"
                  ? "bg-emerald-50 text-emerald-700"
                  : c.status === "EXPIRING"
                    ? "bg-orange-50 text-orange-700"
                    : c.status === "REJECTED"
                      ? "bg-red-50 text-red-700"
                      : "bg-neutral-100 text-neutral-500",
              ].join(" ")}
            >
              {STATUS_LABEL[c.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function ActiesScreen() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <h1 className="text-[18px] font-semibold tracking-tight">Volgende acties</h1>
      <div className="space-y-3">
        {ordered.map((a) => {
          const warning = a.urgentie === "warning";
          return (
            <div
              key={a.titel}
              className={[
                "rounded-2xl border bg-white p-4",
                warning ? "border-orange-200" : "border-neutral-200",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    warning ? "bg-orange-50 text-orange-600" : "bg-neutral-100 text-neutral-500",
                  ].join(" ")}
                >
                  {warning ? (
                    <AlertTriangle className="h-4.5 w-4.5" aria-hidden />
                  ) : (
                    <Zap className="h-4.5 w-4.5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold leading-snug">{a.titel}</div>
                  <p className="mt-1 text-[13px] leading-snug text-neutral-500">{a.detail}</p>
                </div>
              </div>
              <button
                type="button"
                className={[
                  "mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl text-[14px] font-semibold text-white transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2",
                  warning ? "hover:brightness-95" : "bg-neutral-900 hover:bg-neutral-800",
                ].join(" ")}
                style={warning ? { backgroundColor: ORANGE } : undefined}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FacturenScreen() {
  const chip: Record<string, string> = {
    Betaald: "bg-emerald-50 text-emerald-700",
    Openstaand: "bg-orange-50 text-orange-700",
    Concept: "bg-neutral-100 text-neutral-500",
  };
  const empty = FACTUREN.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-[18px] font-semibold tracking-tight">Facturen</h1>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-neutral-300" aria-hidden />
          <p className="mt-2 text-[13px] text-neutral-500">Nog geen facturen.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {FACTUREN.map((f) => (
            <div
              key={f.nr}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5"
            >
              <div className="min-w-0 flex-1">
                <div style={mono} className="text-[13px] font-semibold tabular-nums">
                  {f.nr}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-neutral-500">
                  {f.klant} · {f.datum}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span style={mono} className="text-[14px] font-semibold tabular-nums">
                  {f.bedrag}
                </span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    chip[f.status] ?? "bg-neutral-100 text-neutral-500",
                  ].join(" ")}
                >
                  {f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
