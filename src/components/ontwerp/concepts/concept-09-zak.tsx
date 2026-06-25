"use client";

// Concept 09 — "Zak" · Mobiel-eerst, duim-zone, app-store-grade.
// Een telefoonframe op een neutrale stage. Bottom-tab-navigatie, bottom-sheets voor
// opdracht-detail/verificatie, grote duimvriendelijke primaire acties ("Claim dienst"),
// optimistisch claimen en swipe/pull-affordances — mét de B2B-vertrouwenslaag van
// geverifieerde certificaten. Temper/YoungOnes-snelheid + onze verificatie.
// Palet: stage #0e1014, device #ffffff, ink #15171c, line #ececf0, muted #6a7180,
// accent #2563eb, accent2 #5b5bd6, success #16a34a. Fonts: Inter + JetBrains Mono.

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Compass,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  BatteryFull,
  SignalHigh,
  Hand,
  Sparkles,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  stage: "#0e1014",
  device: "#ffffff",
  ink: "#15171c",
  line: "#ececf0",
  lineSoft: "#f4f4f7",
  muted: "#6a7180",
  faint: "#9aa0ad",
  accent: "#2563eb",
  accent2: "#5b5bd6",
  accentSoft: "#eef2ff",
  success: "#16a34a",
  successSoft: "#e9f7f0",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Compass,
  opdracht: Compass,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

// Onderste tab-balk toont vier hoofdbestemmingen; opdracht-detail opent als sheet.
const BOTTOM_TABS: { key: ScreenKey; label: string }[] = [
  { key: "dashboard", label: "Start" },
  { key: "marktplaats", label: "Diensten" },
  { key: "verificatie", label: "Trust" },
  { key: "facturen", label: "Omzet" },
];

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; dot: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: "#0f7a4d", bg: C.successSoft, dot: C.success };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: "#3730a3", bg: C.accentSoft, dot: C.accent };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#92400e", bg: "#fdf3e7", dot: "#d97706" };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#9b1c1c", bg: "#fbeaea", dot: "#dc2626" };
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 64;
  const h = 22;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept09() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sheet, setSheet] = useState<"opdracht" | "verificatie" | null>(null);
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]!.id);
  // Optimistisch claimen: id's die de gebruiker net heeft geclaimd.
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  function openOpdracht(id: string) {
    setActiveId(id);
    setSheet("opdracht");
  }
  function claim(id: string) {
    setClaimed((c) => ({ ...c, [id]: true }));
  }

  // Esc sluit de actieve sheet (toetsenbordtoegankelijkheid).
  useEffect(() => {
    if (!sheet) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSheet(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const activeTab = BOTTOM_TABS.some((t) => t.key === screen) ? screen : "marktplaats";

  return (
    <div
      className="flex min-h-[760px] w-full items-center justify-center px-4 py-10 antialiased"
      style={{ ...ui, background: C.stage, color: C.ink }}
    >
      {/* Stage-label */}
      <div className="pointer-events-none fixed left-6 top-24 hidden flex-col gap-1 lg:flex">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40"
          style={mono}
        >
          Zak
        </span>
        <span className="max-w-[180px] text-[12px] leading-relaxed text-white/35">
          Mobiel-eerst. Alles in de duim-zone, vertrouwen ingebouwd.
        </span>
      </div>

      {/* Telefoonframe */}
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-[44px] border-[10px] shadow-2xl"
        style={{ borderColor: "#000", background: C.device, height: 760 }}
      >
        {/* Notch */}
        <div
          className="absolute left-1/2 top-0 z-40 h-[26px] w-[140px] -translate-x-1/2 rounded-b-2xl"
          style={{ background: "#000" }}
          aria-hidden="true"
        />

        {/* Statusbar */}
        <div
          className="relative z-30 flex h-11 items-center justify-between px-6 pt-1 text-[12px] font-semibold"
          style={{ color: C.ink }}
        >
          <span style={mono}>09:24</span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <SignalHigh size={14} />
            <Wifi size={14} />
            <BatteryFull size={16} />
          </div>
        </div>

        {/* App-header */}
        <header
          className="relative z-20 flex items-center gap-3 border-b px-5 pb-3"
          style={{ borderColor: C.line, background: C.device }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[14px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})` }}
          >
            Z
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold tracking-tight">
              Hoi, {PROFIEL.naam.split(" ")[0]}
            </p>
            <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
              {PROFIEL.rol}
            </p>
          </div>
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-[#f6f7f9] focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: C.line, color: C.muted }}
            aria-label="Meldingen"
          >
            <Bell size={16} aria-hidden="true" />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white"
              style={{ background: C.accent }}
              aria-hidden="true"
            />
          </button>
        </header>

        {/* Scroll-content */}
        <div
          className="relative z-10 overflow-y-auto px-5 pb-28 pt-4"
          style={{ height: 760 - 44 - 57 }}
          role="region"
          aria-label={SCREENS.find((s) => s.key === screen)?.label}
        >
          {/* Pull-affordance */}
          <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
            <Hand size={12} style={{ color: C.faint }} />
            <span className="text-[10.5px]" style={{ color: C.faint }}>
              Trek omlaag om te verversen
            </span>
          </div>

          {screen === "dashboard" && (
            <Dashboard onOpen={openOpdracht} onGoVerify={() => setSheet("verificatie")} />
          )}
          {screen === "marktplaats" && (
            <Marktplaats onOpen={openOpdracht} claimed={claimed} onClaim={claim} />
          )}
          {screen === "opdracht" && (
            <Marktplaats onOpen={openOpdracht} claimed={claimed} onClaim={claim} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </div>

        {/* Bottom-sheet */}
        {sheet && (
          <Sheet onClose={() => setSheet(null)}>
            {sheet === "opdracht" && (
              <OpdrachtSheet
                opdracht={active}
                claimed={!!claimed[active.id]}
                onClaim={() => claim(active.id)}
              />
            )}
            {sheet === "verificatie" && <VerificatieSheet />}
          </Sheet>
        )}

        {/* Bottom-nav (duim-zone) */}
        <nav
          className="absolute inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t px-2 pb-5 pt-2"
          style={{
            borderColor: C.line,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
          }}
          aria-label="Hoofdnavigatie"
        >
          {BOTTOM_TABS.map((t) => {
            const Icon = NAV_ICONS[t.key];
            const on = t.key === activeTab && !sheet;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setSheet(null);
                  setScreen(t.key);
                }}
                aria-current={on ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{ color: on ? C.accent : C.muted }}
              >
                <Icon size={21} aria-hidden="true" />
                <span className="text-[10.5px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Home-indicator */}
        <div
          className="pointer-events-none absolute bottom-1.5 left-1/2 z-40 h-1 w-32 -translate-x-1/2 rounded-full"
          style={{ background: "#000", opacity: 0.25 }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// ---- Bottom-sheet shell ----------------------------------------------------

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50">
      <button
        className="absolute inset-0 cursor-default bg-black/40 motion-safe:animate-[fadeIn_.18s_ease]"
        onClick={onClose}
        aria-label="Sluiten"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-[28px] border-t px-5 pb-8 pt-3 shadow-2xl motion-safe:animate-[sheetUp_.26s_cubic-bezier(.22,1,.36,1)]"
        style={{ background: C.device, borderColor: C.line }}
      >
        <div
          className="mx-auto mb-4 h-1.5 w-11 rounded-full"
          style={{ background: C.line }}
          aria-hidden="true"
        />
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetUp { from { transform: translateY(16px); opacity: .6 } to { transform: translateY(0); opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-\\[fadeIn_.18s_ease\\],
          .motion-safe\\:animate-\\[sheetUp_.26s_cubic-bezier\\(.22\\,1\\,.36\\,1\\)\\] { animation: none !important }
        }
      `}</style>
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function TrustPill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ background: C.successSoft, color: "#0f7a4d" }}
    >
      <ShieldCheck size={11} aria-hidden="true" /> Geverifieerd
    </span>
  );
}

function Dashboard({
  onOpen,
  onGoVerify,
}: {
  onOpen: (id: string) => void;
  onGoVerify: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Trust-card */}
      <button
        onClick={onGoVerify}
        className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2"
        style={{ borderColor: C.line }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: C.successSoft }}
        >
          <ShieldCheck size={24} aria-hidden="true" style={{ color: C.success }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12px]" style={{ color: C.muted }}>
            <span style={mono}>2</span>/<span style={mono}>4</span> credentials geverifieerd ·{" "}
            <span style={mono}>1</span> vraagt actie
          </p>
        </div>
        <ChevronRight size={18} aria-hidden="true" style={{ color: C.faint }} />
      </button>

      {/* Waarschuwing */}
      <div
        className="flex items-start gap-3 rounded-2xl border px-4 py-3"
        style={{ borderColor: "#f3dcb8", background: "#fdf8ef" }}
      >
        <AlertTriangle size={17} aria-hidden="true" style={{ color: "#d97706", marginTop: 1 }} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold" style={{ color: "#92400e" }}>
            VOG verloopt over <span style={mono}>23</span> dagen
          </p>
          <button
            className="mt-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: "#d97706" }}
          >
            VOG vernieuwen
          </button>
        </div>
      </div>

      {/* KPI's, 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border p-3.5" style={{ borderColor: C.line }}>
            <p className="text-[11px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-1 text-[20px] font-bold tabular-nums leading-none tracking-tight"
              style={mono}
            >
              {k.value}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                style={{ color: k.up ? "#0f7a4d" : C.muted, ...mono }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={C.accent} />
            </div>
          </div>
        ))}
      </div>

      {/* Beste matches */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold tracking-tight">Beste matches</h2>
          <span className="flex items-center gap-1 text-[11.5px]" style={{ color: C.accent }}>
            <Sparkles size={12} aria-hidden="true" /> Voor jou
          </span>
        </div>
        <div className="space-y-2.5">
          {OPDRACHTEN.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpen(o.id)}
              className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: C.line }}
            >
              <div
                className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})` }}
              >
                <span className="text-[14px] font-bold tabular-nums leading-none" style={mono}>
                  {o.match}
                </span>
                <span className="text-[8px] font-medium opacity-80">match</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{o.titel}</p>
                <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats}
                </p>
              </div>
              <span className="shrink-0 text-[12.5px] font-semibold tabular-nums" style={mono}>
                {o.tarief.replace(" / uur", "")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Marktplaats({
  onOpen,
  claimed,
  onClaim,
}: {
  onOpen: (id: string) => void;
  claimed: Record<string, boolean>;
  onClaim: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2 rounded-2xl border px-3.5 py-2.5"
        style={{ borderColor: C.line, background: C.lineSoft }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek dienst of plaats…"
          aria-label="Diensten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa0ad]"
        />
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" aria-label="Filters">
        {["Per 1 juli", "Avond", "BIG", "< 20 min", "€ 50+"].map((f, i) => (
          <button
            key={f}
            className="shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={
              i === 0
                ? { borderColor: C.accent, background: C.accentSoft, color: C.accent }
                : { borderColor: C.line, color: C.muted }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border px-6 py-14 text-center" style={{ borderColor: C.line }}>
          <p className="text-[14px] font-semibold">Geen diensten gevonden</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isClaimed = !!claimed[o.id];
            return (
              <div key={o.id} className="rounded-2xl border p-4" style={{ borderColor: C.line }}>
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => onOpen(o.id)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-medium tracking-wide"
                        style={{ color: C.faint, ...mono }}
                      >
                        {o.id}
                      </span>
                      <TrustPill />
                    </div>
                    <p className="mt-1.5 text-[14px] font-semibold leading-snug">{o.titel}</p>
                    <p
                      className="mt-1 flex items-center gap-1 text-[12px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </button>
                  <span
                    className="flex shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-1.5"
                    style={{ background: C.accentSoft }}
                  >
                    <span
                      className="text-[15px] font-bold tabular-nums leading-none"
                      style={{ color: C.accent, ...mono }}
                    >
                      {o.match}%
                    </span>
                    <span className="text-[8.5px] font-medium" style={{ color: C.accent }}>
                      match
                    </span>
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border px-1.5 py-0.5 text-[10.5px]"
                      style={{ borderColor: C.line, color: C.muted }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-3 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: C.lineSoft }}
                >
                  <div className="text-[12px]" style={{ color: C.muted }}>
                    <span className="font-semibold tabular-nums" style={{ color: C.ink, ...mono }}>
                      {o.tarief}
                    </span>{" "}
                    ·{" "}
                    <span className="tabular-nums" style={mono}>
                      {o.uren}
                    </span>
                  </div>
                  <button
                    onClick={() => !isClaimed && onClaim(o.id)}
                    disabled={isClaimed}
                    className="rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default"
                    style={{ background: isClaimed ? C.success : C.accent }}
                    aria-label={isClaimed ? "Dienst geclaimd" : `Claim ${o.titel}`}
                  >
                    {isClaimed ? (
                      <span className="inline-flex items-center gap-1">
                        <Check size={14} aria-hidden="true" /> Geclaimd
                      </span>
                    ) : (
                      "Claim dienst"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpdrachtSheet({
  opdracht,
  claimed,
  onClaim,
}: {
  opdracht: Opdracht;
  claimed: boolean;
  onClaim: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10.5px] font-medium tracking-wide"
            style={{ color: C.faint, ...mono }}
          >
            {opdracht.id}
          </span>
          <TrustPill />
        </div>
        <h2 className="mt-1.5 text-[19px] font-bold leading-tight tracking-tight">
          {opdracht.titel}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px]" style={{ color: C.muted }}>
          <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="rounded-xl border p-3" style={{ borderColor: C.line }}>
            <p className="text-[11px] font-medium" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums tracking-tight" style={mono}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: C.line }}>
        <h3 className="text-[13.5px] font-semibold">Waarom deze match</h3>
        <div className="mt-3 space-y-2">
          {opdracht.redenen.plus.map((r) => (
            <div key={r} className="flex items-start gap-2 text-[12.5px]">
              <Check size={15} aria-hidden="true" style={{ color: C.success, marginTop: 1 }} />
              <span>{r}</span>
            </div>
          ))}
          {opdracht.redenen.min.map((r) => (
            <div
              key={r}
              className="flex items-start gap-2 text-[12.5px]"
              style={{ color: C.muted }}
            >
              <X size={15} aria-hidden="true" style={{ color: "#d97706", marginTop: 1 }} />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grote duim-actie */}
      <button
        onClick={onClaim}
        disabled={claimed}
        className="w-full rounded-2xl py-4 text-[15px] font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-4 disabled:cursor-default"
        style={{ background: claimed ? C.success : C.accent }}
      >
        {claimed ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Check size={18} aria-hidden="true" /> Dienst geclaimd
          </span>
        ) : (
          "Claim deze dienst"
        )}
      </button>
      <p className="text-center text-[11px]" style={{ color: C.faint }}>
        Je reageert direct — de opdrachtgever ziet je geverifieerde profiel.
      </p>
    </div>
  );
}

function Verificatie() {
  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-3 rounded-2xl border p-4"
        style={{ borderColor: C.line, background: C.successSoft }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "#fff" }}
        >
          <ShieldCheck size={24} aria-hidden="true" style={{ color: C.success }} />
        </div>
        <div>
          <p className="text-[15px] font-bold">{PROFIEL.trust}</p>
          <p className="text-[12px]" style={{ color: "#0f7a4d" }}>
            Opdrachtgevers vertrouwen je sneller
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-3 rounded-2xl border p-3.5"
              style={{ borderColor: C.line }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: st.bg }}
              >
                {c.status === "VERIFIED" ? (
                  <Check size={17} aria-hidden="true" style={{ color: st.dot }} />
                ) : c.status === "SUBMITTED" ? (
                  <Clock size={17} aria-hidden="true" style={{ color: st.dot }} />
                ) : (
                  <AlertTriangle size={17} aria-hidden="true" style={{ color: st.dot }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{c.naam}</p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                style={{ background: st.bg, color: st.fg }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2"
        style={{ borderColor: C.line, color: C.accent }}
      >
        <Plus size={16} aria-hidden="true" /> Certificaat toevoegen
      </button>
    </div>
  );
}

function VerificatieSheet() {
  return (
    <div className="space-y-4">
      <h2 className="text-[18px] font-bold tracking-tight">Jouw vertrouwen</h2>
      <Verificatie />
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: "#92400e", bg: "#fdf8ef", Icon: AlertTriangle },
    info: { fg: C.accent, bg: C.accentSoft, Icon: Bell },
  };
  return (
    <div className="space-y-3">
      <h2 className="text-[14px] font-semibold tracking-tight">Volgende acties</h2>
      {ACTIES.map((a) => {
        const t = tone[a.urgentie];
        return (
          <div key={a.titel} className="rounded-2xl border p-4" style={{ borderColor: C.line }}>
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.bg }}
              >
                <t.Icon size={17} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
            </div>
            <button
              className="mt-3 w-full rounded-xl py-2.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.accent }}
            >
              {a.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: "#0f7a4d", bg: C.successSoft },
    Openstaand: { fg: "#92400e", bg: "#fdf3e7" },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  const fallback = { fg: C.muted, bg: C.lineSoft };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold tracking-tight">Facturen</h2>
        <button
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuw
        </button>
      </div>

      <div className="space-y-2.5">
        {FACTUREN.map((f) => {
          const t = statusTone[f.status] ?? fallback;
          return (
            <div
              key={f.nr}
              className="flex items-center gap-3 rounded-2xl border p-3.5"
              style={{ borderColor: C.line }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold" style={mono}>
                  {f.nr}
                </p>
                <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                  {f.klant} · <span style={mono}>{f.datum}</span>
                </p>
              </div>
              <span className="text-[13.5px] font-bold tabular-nums" style={mono}>
                {f.bedrag}
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ background: t.bg, color: t.fg }}
              >
                {f.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
