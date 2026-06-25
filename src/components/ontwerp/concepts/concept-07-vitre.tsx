"use client";

// Concept 07 — "Vitre": glas & vibrancy in de geest van visionOS. Translucente, gematteerde
// glaslagen zweven boven een zachte gradient-mesh-backdrop. Contrast wordt streng bewaakt:
// tekst staat altijd op voldoende donkere/opaque glaslagen. Fonts: Sora (koppen) + Inter (body).
// Cijfers in mono = de signatuur. Puur presentationeel, mock-data uit ./mock.

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  Zap,
  Receipt,
  MessageSquare,
  FileText,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  Calendar,
  Check,
  AlertTriangle,
  X,
  Plus,
  Sparkles,
  Star,
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
} from "./mock";

// ---- palet --------------------------------------------------------------------------------
const C = {
  text: "#eaf0fb",
  muted: "#aab4cc",
  faint: "#7c89a6",
  accent: "#38bdf8",
  accentDeep: "#0ea5e9",
  good: "#34d399",
  warn: "#fbbf24",
  bad: "#fb7185",
};

const SORA = { fontFamily: "var(--font-lab-sora)" } as const;
const INTER = { fontFamily: "var(--font-lab-inter)" } as const;
const MONO = { fontFamily: "var(--font-lab-mono)" } as const;

// gematteerde glaslaag — donker genoeg voor AA-contrast op tekst
const glass = (opacity = 0.06): React.CSSProperties => ({
  background: `linear-gradient(180deg, rgba(255,255,255,${opacity + 0.03}), rgba(255,255,255,${opacity}))`,
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.14) inset, 0 18px 50px -24px rgba(0,0,0,0.65)",
});

// donkerder paneel onder dichte tekst (strenger contrast)
const glassSolid: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(17,24,46,0.72), rgba(13,19,38,0.78))",
  backdropFilter: "blur(26px) saturate(135%)",
  WebkitBackdropFilter: "blur(26px) saturate(135%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.12) inset, 0 22px 60px -28px rgba(0,0,0,0.7)",
};

const NAV_ITEMS: { key: ScreenKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "marktplaats", label: "Marktplaats", icon: Store },
  { key: "opdracht", label: "Opdracht", icon: Briefcase },
  { key: "verificatie", label: "Verificatie", icon: ShieldCheck },
  { key: "acties", label: "Acties", icon: Zap },
  { key: "facturen", label: "Facturen", icon: Receipt },
];

const statusMeta: Record<CredStatus, { label: string; color: string; bg: string }> = {
  VERIFIED: { label: "Geverifieerd", color: C.good, bg: "rgba(52,211,153,0.16)" },
  SUBMITTED: { label: "In beoordeling", color: C.accent, bg: "rgba(56,189,248,0.16)" },
  EXPIRING: { label: "Verloopt", color: C.warn, bg: "rgba(251,191,36,0.16)" },
  REJECTED: { label: "Afgewezen", color: C.bad, bg: "rgba(251,113,133,0.16)" },
};

// ---- kleine herbruikbare bouwstenen -------------------------------------------------------

function Sparkline({ data, color = C.accent }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const last = data[data.length - 1] ?? min;
  const w = 92;
  const h = 30;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
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
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={w.toFixed(1)}
        cy={(h - ((last - min) / span) * h).toFixed(1)}
        r={2.4}
        fill={color}
      />
    </svg>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = statusMeta[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ ...INTER, color: m.color, background: m.bg, border: `1px solid ${m.color}33` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: m.color }}
        aria-hidden="true"
      />
      {m.label}
    </span>
  );
}

function MatchRing({ value, size = 46 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <span
        className="absolute text-[12px] font-semibold tabular-nums"
        style={{ ...MONO, color: C.text }}
      >
        {value}
      </span>
    </div>
  );
}

// ---- hoofdcomponent -----------------------------------------------------------------------

export function Concept07() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [loadingMarkt, setLoadingMarkt] = useState(false);

  const switchTo = (k: ScreenKey) => {
    if (k === "marktplaats" && screen !== "marktplaats") {
      setLoadingMarkt(true);
      window.setTimeout(() => setLoadingMarkt(false), 850);
    }
    setScreen(k);
  };

  return (
    <div
      className="relative min-h-[640px] w-full overflow-hidden antialiased"
      style={{
        ...INTER,
        color: C.text,
        background:
          "radial-gradient(120% 90% at 8% -10%, #1b2350 0%, rgba(27,35,80,0) 55%)," +
          "radial-gradient(90% 80% at 100% 0%, #0b3a52 0%, rgba(11,58,82,0) 50%)," +
          "radial-gradient(120% 120% at 50% 120%, #0d1b2a 0%, rgba(13,27,42,0) 60%)," +
          "linear-gradient(160deg, #0f1424 0%, #161d36 52%, #0d1b2a 100%)",
      }}
    >
      {/* langzaam zwevende kleurvlekken op de backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 40% at 75% 20%, rgba(56,189,248,0.18), transparent 70%)," +
            "radial-gradient(34% 34% at 20% 80%, rgba(129,140,248,0.16), transparent 70%)",
          animation: "vitreFloat 18s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes vitreFloat {
          0% { transform: translate3d(0,0,0) scale(1); opacity:.9 }
          100% { transform: translate3d(-3%,2%,0) scale(1.06); opacity:1 }
        }
      `}</style>

      <div className="relative flex min-h-[640px]">
        {/* ---------- Sidebar ---------- */}
        <aside className="hidden w-[232px] shrink-0 flex-col gap-3 p-4 md:flex">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #38bdf8, #6366f1)",
                boxShadow: "0 8px 24px -8px rgba(56,189,248,0.6)",
              }}
            >
              <Sparkles
                className="h-4.5 w-4.5"
                style={{ color: "#06121f", width: 18, height: 18 }}
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="text-[14px] font-semibold leading-none" style={SORA}>
                Vitre
              </div>
              <div className="mt-1 text-[11px]" style={{ color: C.faint }}>
                ZZP-platform
              </div>
            </div>
          </div>

          <nav className="mt-1 flex flex-1 flex-col gap-1 rounded-2xl p-2" style={glass(0.05)}>
            {NAV_ITEMS.map((item) => {
              const active = screen === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => switchTo(item.key)}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: active ? C.text : C.muted,
                    background: active
                      ? "linear-gradient(180deg, rgba(56,189,248,0.22), rgba(56,189,248,0.10))"
                      : "transparent",
                    border: active ? "1px solid rgba(56,189,248,0.35)" : "1px solid transparent",
                  }}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: active ? C.accent : C.faint }}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <ChevronRight
                      className="ml-auto h-3.5 w-3.5"
                      style={{ color: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Vertrouwenskaart */}
          <div className="rounded-2xl p-3.5" style={glassSolid}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: C.good }} aria-hidden="true" />
              <span className="text-[12px] font-medium" style={{ color: C.text }}>
                {PROFIEL.trust}
              </span>
            </div>
            <div
              className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "86%",
                  background: `linear-gradient(90deg, ${C.good}, ${C.accent})`,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug" style={{ color: C.muted }}>
              3 van 4 documenten geverifieerd
            </p>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl p-2.5" style={glass(0.05)}>
            <div
              className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
              style={{
                ...MONO,
                background: "rgba(56,189,248,0.20)",
                color: C.accent,
                border: "1px solid rgba(56,189,248,0.4)",
              }}
            >
              {PROFIEL.initialen}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium">{PROFIEL.naam}</div>
              <div className="truncate text-[11px]" style={{ color: C.faint }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- Main ---------- */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 md:px-6">
            <div className="md:hidden">
              <div
                className="grid h-9 w-9 place-items-center rounded-xl"
                style={{ background: "linear-gradient(135deg,#38bdf8,#6366f1)" }}
              >
                <Sparkles className="h-4 w-4" style={{ color: "#06121f" }} aria-hidden="true" />
              </div>
            </div>
            <div
              className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2"
              style={glass(0.05)}
            >
              <Search className="h-4 w-4" style={{ color: C.faint }} aria-hidden="true" />
              <input
                placeholder="Zoek opdrachten, opdrachtgevers…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#7c89a6]"
                style={{ color: C.text }}
                aria-label="Zoeken"
              />
              <kbd
                className="hidden rounded-md px-1.5 py-0.5 text-[10px] sm:block"
                style={{ ...MONO, background: "rgba(255,255,255,0.08)", color: C.faint }}
              >
                ⌘K
              </kbd>
            </div>
            <button
              className="relative grid h-9 w-9 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2"
              style={glass(0.05)}
              aria-label="Meldingen"
            >
              <Bell className="h-4 w-4" style={{ color: C.muted }} aria-hidden="true" />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: C.accent }}
                aria-hidden="true"
              />
            </button>
            <button
              className="hidden items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 sm:flex"
              style={{
                background: `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`,
                color: "#06121f",
                boxShadow: "0 10px 28px -12px rgba(56,189,248,0.7)",
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nieuwe factuur
            </button>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 md:hidden">
            {SCREENS.map((s) => (
              <button
                key={s.key}
                onClick={() => switchTo(s.key)}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: screen === s.key ? "#06121f" : C.muted,
                  background: screen === s.key ? C.accent : "rgba(255,255,255,0.06)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 md:p-6">{renderScreen(screen, loadingMarkt)}</div>
        </main>
      </div>
    </div>
  );
}

// ---- schermen -----------------------------------------------------------------------------

function renderScreen(screen: ScreenKey, loadingMarkt: boolean) {
  switch (screen) {
    case "dashboard":
      return <DashboardScreen />;
    case "marktplaats":
      return <MarktplaatsScreen loading={loadingMarkt} />;
    case "opdracht":
      return <OpdrachtScreen />;
    case "verificatie":
      return <VerificatieScreen />;
    case "acties":
      return <ActiesScreen />;
    case "facturen":
      return <FacturenScreen />;
    default:
      return null;
  }
}

function ScreenHeader({ titel, sub }: { titel: string; sub: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[22px] font-semibold tracking-tight" style={SORA}>
        {titel}
      </h1>
      <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
        {sub}
      </p>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="space-y-5">
      <ScreenHeader
        titel={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je platform op één rustig overzicht — wat vraagt vandaag je aandacht?"
      />

      {/* Waarschuwingsbanner */}
      <div
        className="flex items-start gap-3 rounded-2xl p-3.5"
        style={{ ...glassSolid, borderColor: "rgba(251,191,36,0.35)" }}
        role="status"
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ background: "rgba(251,191,36,0.16)" }}
        >
          <AlertTriangle className="h-4 w-4" style={{ color: C.warn }} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">Je VOG (zorg) verloopt over 23 dagen</p>
          <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
            Vraag tijdig een nieuwe Verklaring Omtrent Gedrag aan om verifieerbaar te blijven.
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: C.warn,
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.4)",
          }}
        >
          Vernieuwen
        </button>
      </div>

      {/* KPI bento */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
            style={glass(0.06)}
          >
            <div
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {kpi.label}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div
                className="text-[24px] font-semibold tabular-nums leading-none"
                style={{ ...MONO, color: C.text }}
              >
                {kpi.value}
              </div>
              <Sparkline data={kpi.spark} color={kpi.up ? C.accent : C.warn} />
            </div>
            <div
              className="mt-2 flex items-center gap-1 text-[12px]"
              style={{ color: kpi.up ? C.good : C.muted }}
            >
              {kpi.up ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="font-medium tabular-nums" style={MONO}>
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Beste matches */}
        <div className="rounded-2xl p-4 lg:col-span-2" style={glassSolid}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold" style={SORA}>
              Beste matches voor jou
            </h2>
            <span className="text-[12px]" style={{ color: C.accent }}>
              Bekijk alle
            </span>
          </div>
          <div className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <div
                key={o.id}
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <MatchRing value={o.match} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{o.titel}</div>
                  <div
                    className="mt-0.5 flex items-center gap-2 text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <span>{o.opdrachtgever}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {o.plaats}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ ...MONO, color: C.text }}
                  >
                    {o.tarief}
                  </div>
                  <div className="text-[11px]" style={{ color: C.faint }}>
                    {o.uren}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volgende acties */}
        <div className="rounded-2xl p-4" style={glassSolid}>
          <h2 className="mb-3 text-[14px] font-semibold" style={SORA}>
            Volgende beste acties
          </h2>
          <div className="space-y-2.5">
            {ACTIES.map((a) => {
              const isWarn = a.urgentie === "warning";
              return (
                <div
                  key={a.titel}
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: isWarn ? C.warn : C.accent }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-[12.5px] font-medium leading-snug">{a.titel}</div>
                      <button
                        className="mt-1.5 text-[12px] font-medium"
                        style={{ color: isWarn ? C.warn : C.accent }}
                      >
                        {a.cta} →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Berichten preview */}
      <div className="rounded-2xl p-4" style={glass(0.06)}>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[14px] font-semibold" style={SORA}>
            Recente berichten
          </h2>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {BERICHTEN.map((b) => (
            <div
              key={b.van}
              className="rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold"
                  style={{ ...MONO, background: "rgba(56,189,248,0.18)", color: C.accent }}
                >
                  {b.initialen}
                </div>
                <span className="truncate text-[12px] font-medium">{b.van}</span>
                {b.ongelezen && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: C.accent }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[12px]" style={{ color: C.muted }}>
                {b.preview}
              </p>
              <div className="mt-2 text-[10px]" style={{ ...MONO, color: C.faint }}>
                {b.tijd}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarktplaatsScreen({ loading }: { loading: boolean }) {
  const filters = ["Alle", "Verpleging", "Verzorging", "GGZ", "Avond", "Dichtbij"];
  const [active, setActive] = useState("Alle");
  return (
    <div className="space-y-5">
      <ScreenHeader
        titel="Marktplaats"
        sub="Verklaarbare matches op basis van je geverifieerde profiel en voorkeuren."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className="rounded-full px-3.5 py-1.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: active === f ? "#06121f" : C.muted,
              background: active === f ? C.accent : "rgba(255,255,255,0.06)",
              border: active === f ? "none" : "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Opdrachten laden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl p-5" style={glass(0.05)}>
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 animate-pulse rounded-full"
                  style={{ background: "rgba(255,255,255,0.10)" }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-3.5 w-2/3 animate-pulse rounded"
                    style={{ background: "rgba(255,255,255,0.10)" }}
                  />
                  <div
                    className="h-3 w-1/3 animate-pulse rounded"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-2">
          {OPDRACHTEN.map((o) => (
            <article
              key={o.id}
              className="group rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
              style={glassSolid}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="text-[10px] font-medium tracking-wide"
                    style={{ ...MONO, color: C.faint }}
                  >
                    {o.id}
                  </div>
                  <h3 className="mt-1 truncate text-[15px] font-semibold" style={SORA}>
                    {o.titel}
                  </h3>
                  <div
                    className="mt-1 flex items-center gap-2 text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <span>{o.opdrachtgever}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {o.plaats}
                    </span>
                  </div>
                </div>
                <MatchRing value={o.match} size={52} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2 py-0.5 text-[11px]"
                    style={{
                      color: C.muted,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div
                className="mt-3 flex items-center gap-4 border-t pt-3 text-[12px]"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: C.muted }}
              >
                <span
                  className="inline-flex items-center gap-1.5 font-medium tabular-nums"
                  style={{ ...MONO, color: C.text }}
                >
                  {o.tarief}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {o.uren}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {o.start}
                </span>
                <button
                  className="ml-auto rounded-lg px-3 py-1.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: "rgba(56,189,248,0.16)",
                    color: C.accent,
                    border: "1px solid rgba(56,189,248,0.35)",
                  }}
                >
                  Reageer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtScreen() {
  const o = OPDRACHTEN[0];
  if (!o) {
    return (
      <div className="rounded-2xl p-8 text-center" style={glass(0.04)}>
        <p className="text-[13px] font-medium">Geen opdracht geselecteerd</p>
        <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
          Kies een opdracht in de marktplaats om de details te bekijken.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <button className="inline-flex items-center gap-1 text-[12px]" style={{ color: C.muted }}>
        ← Terug naar marktplaats
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Detail */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl p-5" style={glassSolid}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[10px] font-medium tracking-wide"
                  style={{ ...MONO, color: C.faint }}
                >
                  {o.id}
                </div>
                <h1 className="mt-1 text-[22px] font-semibold tracking-tight" style={SORA}>
                  {o.titel}
                </h1>
                <div
                  className="mt-1.5 flex items-center gap-2 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <span>{o.opdrachtgever}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {o.plaats}
                  </span>
                </div>
              </div>
              <MatchRing value={o.match} size={64} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { l: "Tarief", v: o.tarief },
                { l: "Inzet", v: o.uren },
                { l: "Start", v: o.start },
              ].map((m) => (
                <div
                  key={m.l}
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="text-[11px]" style={{ color: C.faint }}>
                    {m.l}
                  </div>
                  <div
                    className="mt-1 text-[14px] font-semibold tabular-nums"
                    style={{ ...MONO, color: C.text }}
                  >
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verklaarbare matching */}
          <div className="rounded-2xl p-5" style={glassSolid}>
            <h2 className="mb-3 text-[14px] font-semibold" style={SORA}>
              Waarom deze match?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-[12px] font-medium" style={{ color: C.good }}>
                  Sterke punten
                </div>
                <ul className="space-y-2">
                  {o.redenen.plus.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.text }}
                    >
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color: C.good }}
                        aria-hidden="true"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-[12px] font-medium" style={{ color: C.warn }}>
                  Aandachtspunten
                </div>
                <ul className="space-y-2">
                  {o.redenen.min.map((m) => (
                    <li
                      key={m}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      <X
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color: C.warn }}
                        aria-hidden="true"
                      />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actiekolom */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={glassSolid}>
            <button
              className="w-full rounded-xl px-4 py-2.5 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`,
                color: "#06121f",
                boxShadow: "0 12px 30px -12px rgba(56,189,248,0.7)",
              }}
            >
              Reageer op opdracht
            </button>
            <button
              className="mt-2.5 w-full rounded-xl px-4 py-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2"
              style={{
                color: C.text,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              Bewaar voor later
            </button>
          </div>

          <div className="rounded-2xl p-5" style={glass(0.06)}>
            <h3 className="mb-3 text-[13px] font-semibold" style={SORA}>
              Vereiste certificaten
            </h3>
            <div className="space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => (
                <div key={c.naam} className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px]" style={{ color: C.text }}>
                    {c.naam}
                  </span>
                  <StatusChip status={c.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificatieScreen() {
  return (
    <div className="space-y-5">
      <ScreenHeader
        titel="Verificatie"
        sub="Je vertrouwensniveau bepaalt je zichtbaarheid bij opdrachtgevers. Houd certificaten actueel."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl p-5 lg:col-span-1" style={glassSolid}>
          <div className="flex flex-col items-center text-center">
            <div className="relative grid h-28 w-28 place-items-center">
              <svg width={112} height={112} className="-rotate-90" aria-hidden="true">
                <circle
                  cx={56}
                  cy={56}
                  r={50}
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth={6}
                />
                <circle
                  cx={56}
                  cy={56}
                  r={50}
                  fill="none"
                  stroke={C.good}
                  strokeWidth={6}
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - 0.75)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <div
                  className="text-[26px] font-semibold tabular-nums"
                  style={{ ...MONO, color: C.text }}
                >
                  75%
                </div>
                <div className="text-[10px]" style={{ color: C.faint }}>
                  compleet
                </div>
              </div>
            </div>
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
              style={{
                color: C.good,
                background: "rgba(52,211,153,0.16)",
                border: "1px solid rgba(52,211,153,0.35)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {PROFIEL.trust}
            </div>
            <p className="mt-3 text-[12px] leading-snug" style={{ color: C.muted }}>
              Vernieuw je VOG om op het hoogste vertrouwensniveau te blijven.
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-2 lg:col-span-2" style={glass(0.05)}>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {CREDENTIALS.map((c) => {
              const m = statusMeta[c.status];
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-3 p-3.5 transition-colors hover:bg-white/[0.03]"
                >
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{ background: m.bg }}
                  >
                    <ShieldCheck
                      className="h-4.5 w-4.5"
                      style={{ color: m.color, width: 18, height: 18 }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{c.naam}</div>
                    <div className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusChip status={c.status} />
                  {c.status === "EXPIRING" && (
                    <button
                      className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        color: C.warn,
                        background: "rgba(251,191,36,0.12)",
                        border: "1px solid rgba(251,191,36,0.35)",
                      }}
                    >
                      Vernieuwen
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Documenten */}
      <div className="rounded-2xl p-4" style={glassSolid}>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[14px] font-semibold" style={SORA}>
            Documenten
          </h2>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => (
            <div
              key={d.naam}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <FileText className="h-4 w-4" style={{ color: C.muted }} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium">{d.naam}</div>
                <div className="text-[11px] tabular-nums" style={{ ...MONO, color: C.faint }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusChip status={d.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActiesScreen() {
  return (
    <div className="space-y-5">
      <ScreenHeader
        titel="Acties"
        sub="De volgende beste stappen, geprioriteerd op urgentie en impact."
      />

      <div className="space-y-3">
        {ACTIES.map((a) => {
          const isWarn = a.urgentie === "warning";
          const col = isWarn ? C.warn : C.accent;
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
              style={{
                ...glassSolid,
                borderColor: isWarn ? "rgba(251,191,36,0.30)" : "rgba(255,255,255,0.10)",
              }}
            >
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                style={{ background: isWarn ? "rgba(251,191,36,0.16)" : "rgba(56,189,248,0.16)" }}
              >
                {isWarn ? (
                  <AlertTriangle className="h-5 w-5" style={{ color: col }} aria-hidden="true" />
                ) : (
                  <Zap className="h-5 w-5" style={{ color: col }} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold">{a.titel}</h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{
                      color: col,
                      background: isWarn ? "rgba(251,191,36,0.14)" : "rgba(56,189,248,0.14)",
                    }}
                  >
                    {isWarn ? "Urgent" : "Info"}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-xl px-4 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: isWarn
                    ? "rgba(251,191,36,0.14)"
                    : `linear-gradient(180deg, ${C.accent}, ${C.accentDeep})`,
                  color: isWarn ? C.warn : "#06121f",
                  border: isWarn ? "1px solid rgba(251,191,36,0.4)" : "none",
                }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty-state voorbeeld */}
      <div className="rounded-2xl p-8 text-center" style={glass(0.04)}>
        <div
          className="mx-auto grid h-12 w-12 place-items-center rounded-2xl"
          style={{ background: "rgba(52,211,153,0.14)" }}
        >
          <Check className="h-5 w-5" style={{ color: C.good }} aria-hidden="true" />
        </div>
        <p className="mt-3 text-[13px] font-medium">Alles bijgewerkt</p>
        <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
          Geen verdere acties op dit moment — je staat er goed voor.
        </p>
      </div>
    </div>
  );
}

function FacturenScreen() {
  const statusColor: Record<string, string> = {
    Betaald: C.good,
    Openstaand: C.warn,
    Concept: C.faint,
  };
  return (
    <div className="space-y-5">
      <ScreenHeader
        titel="Facturen"
        sub="Je omzet en openstaande posten — overzichtelijk en exporteerbaar."
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          { l: "Betaald (mnd)", v: "€ 5.552", c: C.good },
          { l: "Openstaand", v: "€ 1.350", c: C.warn },
          { l: "In concept", v: "€ 880", c: C.faint },
          { l: "Gem. betaaltermijn", v: "11 dgn", c: C.accent },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl p-4" style={glass(0.06)}>
            <div className="text-[11px]" style={{ color: C.faint }}>
              {s.l}
            </div>
            <div
              className="mt-1.5 text-[20px] font-semibold tabular-nums"
              style={{ ...MONO, color: s.c }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl" style={glassSolid}>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide" style={{ color: C.faint }}>
              <th className="px-4 py-3 font-medium">Factuur</th>
              <th className="px-4 py-3 font-medium">Klant</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 text-right font-medium">Bedrag</th>
              <th className="px-4 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr
                key={f.nr}
                className="border-t transition-colors hover:bg-white/[0.04]"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <td className="px-4 py-3 text-[12.5px] font-medium tabular-nums" style={MONO}>
                  {f.nr}
                </td>
                <td className="px-4 py-3 text-[13px]" style={{ color: C.text }}>
                  {f.klant}
                </td>
                <td
                  className="px-4 py-3 text-[12.5px] tabular-nums"
                  style={{ ...MONO, color: C.muted }}
                >
                  {f.datum}
                </td>
                <td
                  className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums"
                  style={{ ...MONO, color: C.text }}
                >
                  {f.bedrag}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: statusColor[f.status] }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusColor[f.status] }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 rounded-2xl p-3.5" style={glass(0.05)}>
        <Star className="h-4 w-4" style={{ color: C.accent }} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Tip: stuur factuur{" "}
          <span className="font-medium tabular-nums" style={{ ...MONO, color: C.text }}>
            FAC-2025-118
          </span>{" "}
          een herinnering — al 9 dagen open.
        </p>
      </div>
    </div>
  );
}
