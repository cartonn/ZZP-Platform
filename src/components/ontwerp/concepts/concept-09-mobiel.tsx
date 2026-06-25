"use client";

// Concept 09 — "Mobiel" · Mobiel-eerst / duim-zone.
// Palet: app-canvas #ffffff, inkt #15171c, randen #ebedf1, muted #6a6e78, accent oranje #f97316,
// groen #16a34a (geverifieerd). Fonts: Inter (UI) + JetBrains Mono (cijfers).
// Filosofie: realistisch telefoonframe, bottom-tab-nav in de duim-zone, bottom-sheets voor detail,
// grote tap-targets, trust-badges op elke kaart. Temper-snelheid + B2B-vertrouwenslaag.

import { useEffect, useState } from "react";
import {
  Home,
  Search,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Bell,
  MapPin,
  Clock,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  FileText,
  Star,
  Loader2,
  Inbox,
  ArrowRight,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  canvas: "#ffffff",
  shell: "#f2f3f5",
  ink: "#15171c",
  line: "#ebedf1",
  lineSoft: "#f4f5f7",
  muted: "#6a6e78",
  faint: "#9b9fa8",
  accent: "#f97316",
  accentSoft: "#fff3eb",
  green: "#16a34a",
  greenSoft: "#eaf7ef",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// De 5 duim-bereikbare bottom-tabs. "berichten" leeft in een aparte overlay.
const TABS: { key: ScreenKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Start", icon: Home },
  { key: "marktplaats", label: "Diensten", icon: Search },
  { key: "verificatie", label: "Profiel", icon: ShieldCheck },
  { key: "acties", label: "Acties", icon: CheckCircle2 },
  { key: "facturen", label: "Facturen", icon: Receipt },
];

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; dot: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: "#0f7a4d", bg: C.greenSoft, dot: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: "#9a4a07", bg: C.accentSoft, dot: C.accent };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#92400e", bg: "#fdf3e7", dot: "#d97706" };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#9b1c1c", bg: "#fbeaea", dot: "#dc2626" };
  }
}

function TrustBadge({ label = "Geverifieerd" }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: C.greenSoft, color: "#0f7a4d" }}
    >
      <ShieldCheck size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchRing({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div className="relative h-10 w-10 shrink-0">
      <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={r} fill="none" stroke={C.line} strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
        style={{ ...mono, color: C.ink }}
      >
        {value}
      </span>
    </div>
  );
}

function Sparkbars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => (
        <span
          key={i}
          className="w-1 rounded-full"
          style={{
            height: `${Math.max(12, (d / max) * 100)}%`,
            background: i === data.length - 1 ? C.accent : C.line,
          }}
        />
      ))}
    </div>
  );
}

export function Concept09() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sheet, setSheet] = useState<Opdracht | null>(null);
  const [claimed, setClaimed] = useState<Record<string, "idle" | "loading" | "done">>({});
  const [berichten, setBerichten] = useState(false);

  const active: Opdracht = OPDRACHTEN[0]!;

  function claim(id: string) {
    if (claimed[id] === "loading" || claimed[id] === "done") return;
    setClaimed((c) => ({ ...c, [id]: "loading" }));
    window.setTimeout(() => {
      setClaimed((c) => ({ ...c, [id]: "done" }));
    }, 1100);
  }

  const titel = SCREENS.find((s) => s.key === screen)?.label ?? "";

  return (
    <div
      className="flex min-h-[640px] w-full items-center justify-center py-6 antialiased"
      style={{ ...ui, background: C.shell, color: C.ink }}
    >
      {/* Telefoonframe */}
      <div
        className="relative flex w-full max-w-[390px] flex-col overflow-hidden rounded-[2.4rem] border-[10px] shadow-2xl"
        style={{ height: 760, background: C.canvas, borderColor: "#0e0f12" }}
      >
        {/* Notch */}
        <div
          className="absolute left-1/2 top-0 z-30 h-6 w-32 -translate-x-1/2 rounded-b-2xl"
          style={{ background: "#0e0f12" }}
          aria-hidden="true"
        />

        {/* Topbar */}
        <header
          className="relative z-20 flex items-center justify-between px-5 pb-3 pt-7"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold text-white"
              style={{ background: C.ink }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-medium" style={{ color: C.faint }}>
                {screen === "dashboard" ? "Goedemorgen," : titel}
              </p>
              <p className="text-sm font-semibold">
                {screen === "dashboard" ? PROFIEL.naam.split(" ")[0] : PROFIEL.naam}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBerichten(true)}
            aria-label="Berichten openen"
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 active:scale-95"
            style={{ background: C.lineSoft }}
          >
            <Bell size={18} aria-hidden="true" />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2"
              style={{ background: C.accent, boxShadow: `0 0 0 2px ${C.canvas}` }}
              aria-hidden="true"
            />
          </button>
        </header>

        {/* Scroll-zone */}
        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4" style={{ background: C.canvas }}>
          {screen === "dashboard" && <DashboardScreen onOpen={(o) => setSheet(o)} />}
          {screen === "marktplaats" && (
            <MarktplaatsScreen onOpen={(o) => setSheet(o)} claimed={claimed} onClaim={claim} />
          )}
          {screen === "opdracht" && <OpdrachtScreen opdracht={active} />}
          {screen === "verificatie" && <VerificatieScreen />}
          {screen === "acties" && <ActiesScreen />}
          {screen === "facturen" && <FacturenScreen />}
        </main>

        {/* Bottom-tab-nav (duim-zone) */}
        <nav
          className="absolute inset-x-0 bottom-0 z-20 flex items-stretch justify-around px-2 pb-5 pt-2"
          style={{
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(12px)",
            borderTop: `1px solid ${C.line}`,
          }}
          aria-label="Hoofdnavigatie"
        >
          {TABS.map((t) => {
            const on = screen === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setScreen(t.key)}
                aria-current={on ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition focus-visible:outline-none focus-visible:ring-2"
                style={{ color: on ? C.accent : C.faint }}
              >
                <span
                  className="flex h-8 w-12 items-center justify-center rounded-full transition"
                  style={{ background: on ? C.accentSoft : "transparent" }}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="text-[10px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom-sheet: opdracht-detail */}
        {sheet && (
          <DetailSheet
            opdracht={sheet}
            onClose={() => setSheet(null)}
            state={claimed[sheet.id] ?? "idle"}
            onClaim={() => claim(sheet.id)}
          />
        )}

        {/* Berichten-overlay */}
        {berichten && <BerichtenSheet onClose={() => setBerichten(false)} />}
      </div>
    </div>
  );
}

/* ---------------- Schermen ---------------- */

function DashboardScreen({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const warn = ACTIES.find((a) => a.urgentie === "warning");
  return (
    <div className="space-y-4">
      {/* Waarschuwingsbanner */}
      {warn && (
        <div
          className="flex items-start gap-2.5 rounded-2xl p-3"
          style={{ background: "#fdf3e7", border: "1px solid #f6e3c8" }}
          role="status"
        >
          <AlertTriangle
            size={18}
            style={{ color: "#d97706" }}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: "#92400e" }}>
              {warn.titel}
            </p>
            <button
              type="button"
              className="mt-1 text-[12px] font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2"
              style={{ color: "#92400e" }}
            >
              {warn.cta} →
            </button>
          </div>
        </div>
      )}

      {/* KPI-grid */}
      <div className="grid grid-cols-2 gap-3">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-3.5"
            style={{ background: C.lineSoft, border: `1px solid ${C.line}` }}
          >
            <p className="text-[11px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight" style={mono}>
              {k.value}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                style={{ ...mono, color: k.up ? C.green : C.muted }}
              >
                <TrendingUp size={11} aria-hidden="true" />
                {k.trend}
              </span>
              <Sparkbars data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      {/* Aanbevolen diensten */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-sm font-semibold">Voor jou aanbevolen</h2>
        <span className="text-[12px] font-medium" style={{ color: C.accent }}>
          {OPDRACHTEN.length} matches
        </span>
      </div>
      <div className="space-y-3">
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onOpen(o)}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 active:scale-[.99]"
            style={{ background: C.canvas, border: `1px solid ${C.line}` }}
          >
            <MatchRing value={o.match} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{o.titel}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: C.muted }}>
                <MapPin size={11} aria-hidden="true" />
                {o.plaats} · <span style={mono}>{o.tarief}</span>
              </p>
            </div>
            <ChevronRight size={18} style={{ color: C.faint }} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MarktplaatsScreen({
  onOpen,
  claimed,
  onClaim,
}: {
  onOpen: (o: Opdracht) => void;
  claimed: Record<string, "idle" | "loading" | "done">;
  onClaim: (id: string) => void;
}) {
  const [filter, setFilter] = useState("alles");
  const chips = ["alles", "avond", "dagdienst", "ggz", "dichtbij"];
  return (
    <div className="space-y-4">
      {/* Zoekbalk */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3.5 py-3"
        style={{ background: C.lineSoft, border: `1px solid ${C.line}` }}
      >
        <Search size={18} style={{ color: C.faint }} aria-hidden="true" />
        <input
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9b9fa8]"
          placeholder="Zoek diensten in jouw regio"
          aria-label="Zoek diensten"
        />
      </div>

      {/* Filter-chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filters">
        {chips.map((c) => {
          const on = filter === c;
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(c)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: on ? C.ink : C.canvas,
                color: on ? "#fff" : C.muted,
                border: `1px solid ${on ? C.ink : C.line}`,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Swipe-achtige dienstkaarten */}
      <div className="space-y-3.5">
        {OPDRACHTEN.map((o) => {
          const st = claimed[o.id] ?? "idle";
          return (
            <article
              key={o.id}
              className="overflow-hidden rounded-3xl transition"
              style={{ background: C.canvas, border: `1px solid ${C.line}` }}
            >
              <button
                type="button"
                onClick={() => onOpen(o)}
                className="block w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <TrustBadge />
                    <h3 className="mt-2 text-[15px] font-semibold leading-snug">{o.titel}</h3>
                    <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                  <MatchRing value={o.match} />
                </div>
                <div
                  className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <span className="flex items-center gap-1">
                    <MapPin size={13} aria-hidden="true" />
                    {o.plaats}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} aria-hidden="true" />
                    {o.uren}
                  </span>
                  <span className="font-semibold" style={{ ...mono, color: C.ink }}>
                    {o.tarief}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: C.lineSoft, color: C.muted }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>

              {/* Primaire claim-knop in de duim-zone */}
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => onClaim(o.id)}
                  disabled={st !== "idle"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 active:scale-[.98] disabled:opacity-100"
                  style={{ background: st === "done" ? C.green : C.accent }}
                >
                  {st === "idle" && (
                    <>
                      Claim dienst
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                  {st === "loading" && (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      Claimen…
                    </>
                  )}
                  {st === "done" && (
                    <>
                      <Check size={16} aria-hidden="true" />
                      Geclaimd
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OpdrachtScreen({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-3xl p-4"
        style={{ background: C.lineSoft, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <TrustBadge />
            <h2 className="mt-2 text-lg font-bold leading-snug">{opdracht.titel}</h2>
            <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Inzet", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
          ].map((m) => (
            <div
              key={m.l}
              className="rounded-xl bg-white p-2.5 text-center"
              style={{ border: `1px solid ${C.line}` }}
            >
              <p className="text-[10px]" style={{ color: C.muted }}>
                {m.l}
              </p>
              <p className="mt-0.5 text-[12px] font-bold" style={mono}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Match-redenen */}
      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold">Waarom dit past</h3>
        {opdracht.redenen.plus.map((r) => (
          <div key={r} className="flex items-start gap-2.5 text-[13px]">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green }}
            >
              <Check size={13} aria-hidden="true" />
            </span>
            {r}
          </div>
        ))}
        {opdracht.redenen.min.map((r) => (
          <div key={r} className="flex items-start gap-2.5 text-[13px]" style={{ color: C.muted }}>
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: "#fdf3e7", color: "#d97706" }}
            >
              <X size={13} aria-hidden="true" />
            </span>
            {r}
          </div>
        ))}
      </section>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 active:scale-[.98]"
        style={{ background: C.accent }}
      >
        Reageer op deze opdracht
        <ArrowRight size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

function VerificatieScreen() {
  return (
    <div className="space-y-4">
      {/* Trust-kaart */}
      <div
        className="rounded-3xl p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${C.ink}, #24262d)` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px]" style={{ color: "#b9bcc4" }}>
              Vertrouwensniveau
            </p>
            <p className="mt-0.5 text-xl font-bold">{PROFIEL.trust}</p>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "rgba(22,163,74,.18)" }}
          >
            <ShieldCheck size={24} style={{ color: "#4ade80" }} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: "#b9bcc4" }}>
          <Star size={13} style={{ color: "#fbbf24" }} aria-hidden="true" />2 van 4 documenten
          geverifieerd · 1 in beoordeling
        </div>
      </div>

      <div className="space-y-2.5">
        {CREDENTIALS.map((c) => {
          const s = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: C.canvas, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: s.bg }}
              >
                <FileText size={16} style={{ color: s.fg }} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{c.naam}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: s.bg, color: s.fg }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 active:scale-[.98]"
        style={{ background: C.lineSoft, color: C.ink, border: `1px solid ${C.line}` }}
      >
        Document toevoegen
      </button>
    </div>
  );
}

function ActiesScreen() {
  return (
    <div className="space-y-3">
      <p className="text-[13px]" style={{ color: C.muted }}>
        {ACTIES.length} acties vragen je aandacht.
      </p>
      {ACTIES.map((a) => {
        const warn = a.urgentie === "warning";
        return (
          <div
            key={a.titel}
            className="rounded-2xl p-4"
            style={{
              background: warn ? "#fdf3e7" : C.canvas,
              border: `1px solid ${warn ? "#f6e3c8" : C.line}`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: warn ? "#fbe6c4" : C.accentSoft,
                  color: warn ? "#d97706" : C.accent,
                }}
              >
                {warn ? (
                  <AlertTriangle size={14} aria-hidden="true" />
                ) : (
                  <Bell size={14} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-snug">{a.titel}</p>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 active:scale-[.98]"
              style={{ background: warn ? "#d97706" : C.ink }}
            >
              {a.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function FacturenScreen() {
  function fStyle(status: string) {
    if (status === "Betaald") return { bg: C.greenSoft, fg: "#0f7a4d" };
    if (status === "Openstaand") return { bg: C.accentSoft, fg: "#9a4a07" };
    return { bg: C.lineSoft, fg: C.muted };
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3.5" style={{ background: C.greenSoft }}>
          <p className="text-[11px] font-medium" style={{ color: "#0f7a4d" }}>
            Betaald deze maand
          </p>
          <p className="mt-1 text-xl font-bold" style={{ ...mono, color: "#0f7a4d" }}>
            € 5.552
          </p>
        </div>
        <div className="rounded-2xl p-3.5" style={{ background: C.accentSoft }}>
          <p className="text-[11px] font-medium" style={{ color: "#9a4a07" }}>
            Openstaand
          </p>
          <p className="mt-1 text-xl font-bold" style={{ ...mono, color: "#9a4a07" }}>
            € 1.350
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {FACTUREN.map((f) => {
          const s = fStyle(f.status);
          return (
            <div
              key={f.nr}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: C.canvas, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.lineSoft }}
              >
                <Receipt size={16} style={{ color: C.muted }} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold" style={mono}>
                  {f.nr}
                </p>
                <p className="mt-0.5 truncate text-[11px]" style={{ color: C.muted }}>
                  {f.klant} · {f.datum}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold" style={mono}>
                  {f.bedrag}
                </p>
                <span
                  className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: s.bg, color: s.fg }}
                >
                  {f.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Sheets ---------------- */

function DetailSheet({
  opdracht,
  onClose,
  state,
  onClaim,
}: {
  opdracht: Opdracht;
  onClose: () => void;
  state: "idle" | "loading" | "done";
  onClaim: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Opdrachtdetail"
    >
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        className="absolute inset-0 focus-visible:outline-none"
        style={{ background: "rgba(15,17,22,.4)" }}
      />
      <div
        className="relative z-10 max-h-[78%] overflow-y-auto rounded-t-[1.75rem] px-5 pb-7 pt-3"
        style={{ background: C.canvas, animation: "sheetUp .32s cubic-bezier(.22,1,.36,1)" }}
      >
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full"
          style={{ background: C.line }}
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <TrustBadge />
            <h2 className="mt-2 text-[17px] font-bold leading-snug">{opdracht.titel}</h2>
            <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Inzet", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
          ].map((m) => (
            <div
              key={m.l}
              className="rounded-xl p-2.5 text-center"
              style={{ background: C.lineSoft }}
            >
              <p className="text-[10px]" style={{ color: C.muted }}>
                {m.l}
              </p>
              <p className="mt-0.5 text-[12px] font-bold" style={mono}>
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {opdracht.redenen.plus.map((r) => (
            <div key={r} className="flex items-center gap-2 text-[13px]">
              <Check size={15} style={{ color: C.green }} aria-hidden="true" />
              {r}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClaim}
          disabled={state !== "idle"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 active:scale-[.98]"
          style={{ background: state === "done" ? C.green : C.accent }}
        >
          {state === "idle" && (
            <>
              Claim deze dienst <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
          {state === "loading" && (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden="true" /> Claimen…
            </>
          )}
          {state === "done" && (
            <>
              <Check size={17} aria-hidden="true" /> Geclaimd — opdrachtgever ziet je reactie
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function BerichtenSheet({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inbox" | "archief">("inbox");
  // Korte skeleton-load om de loading-state te tonen.
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Berichten"
    >
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(15,17,22,.4)" }}
      />
      <div
        className="relative z-10 flex h-[80%] flex-col rounded-t-[1.75rem] px-5 pb-7 pt-3"
        style={{ background: C.canvas, animation: "sheetUp2 .32s cubic-bezier(.22,1,.36,1)" }}
      >
        <style>{`@keyframes sheetUp2{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full"
          style={{ background: C.line }}
          aria-hidden="true"
        />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Berichten</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.lineSoft }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div
          className="mt-3 flex gap-1 rounded-xl p-1"
          style={{ background: C.lineSoft }}
          role="tablist"
        >
          {(["inbox", "archief"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-lg py-1.5 text-[12px] font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: tab === t ? C.canvas : "transparent",
                color: tab === t ? C.ink : C.muted,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-3 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 pt-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 animate-pulse rounded-full"
                    style={{ background: C.lineSoft }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3 w-1/2 animate-pulse rounded"
                      style={{ background: C.lineSoft }}
                    />
                    <div
                      className="h-3 w-4/5 animate-pulse rounded"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "inbox" ? (
            <div className="space-y-1">
              {BERICHTEN.map((b) => (
                <button
                  key={b.van}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-[#f4f5f7] focus-visible:outline-none focus-visible:ring-2"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                    style={{ background: C.lineSoft, color: C.muted }}
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[13px] font-semibold">{b.van}</p>
                      <span className="shrink-0 text-[10px]" style={{ color: C.faint }}>
                        {b.tijd}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  {b.ongelezen && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: C.accent }}
                      aria-label="ongelezen"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            // Empty-state
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: C.lineSoft }}
              >
                <Inbox size={26} style={{ color: C.faint }} aria-hidden="true" />
              </span>
              <p className="mt-3 text-[14px] font-semibold">Archief is leeg</p>
              <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                Gearchiveerde gesprekken verschijnen hier.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
