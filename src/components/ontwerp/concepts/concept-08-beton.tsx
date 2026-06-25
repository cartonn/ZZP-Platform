"use client";

// Concept 08 — "Beton": tactiel brutalisme met B2B-discipline. Zichtbaar raster, dikke 2px
// inkt-randen, harde offset-schaduwen, scherpe hoeken en monospace overal. Eén elektrische
// acid-lime-accent als signatuur. Knoppen drukken in op hover (offset verkleint). Leesbaar en
// professioneel gehouden voor de zorgmarkt. Fonts: Space Grotesk (koppen) + JetBrains Mono.
// Puur presentationeel, mock-data uit ./mock.

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  FileText,
  ShieldCheck,
  Bolt,
  Receipt,
  MessageSquare,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Plus,
  Menu,
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
const INK = "#0f0f0d";
const CANVAS = "#f4f4ef";
const CARD = "#ffffff";
const LIME = "#84cc16";
const MUTED = "#5a5a52";

const SPACE = { fontFamily: "var(--font-lab-space)" } as const;
const MONO = { fontFamily: "var(--font-lab-mono)" } as const;

// harde offset-schaduw (de signatuur)
const hard = (x = 4, y = 4, c = INK): React.CSSProperties => ({
  boxShadow: `${x}px ${y}px 0 0 ${c}`,
});

const NAV_ITEMS: { key: ScreenKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "dashboard", label: "DASHBOARD", icon: LayoutGrid },
  { key: "marktplaats", label: "MARKTPLAATS", icon: Store },
  { key: "opdracht", label: "OPDRACHT", icon: FileText },
  { key: "verificatie", label: "VERIFICATIE", icon: ShieldCheck },
  { key: "acties", label: "ACTIES", icon: Bolt },
  { key: "facturen", label: "FACTUREN", icon: Receipt },
];

const statusMeta: Record<CredStatus, { label: string; bg: string; fg: string }> = {
  VERIFIED: { label: "GEVERIFIEERD", bg: LIME, fg: INK },
  SUBMITTED: { label: "IN BEOORDELING", bg: "#dbeafe", fg: "#1e3a8a" },
  EXPIRING: { label: "VERLOOPT", bg: "#fde68a", fg: "#78350f" },
  REJECTED: { label: "AFGEWEZEN", bg: "#fecaca", fg: "#7f1d1d" },
};

// ---- bouwstenen ---------------------------------------------------------------------------

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ ...MONO, border: `2px solid ${INK}`, background: accent ? LIME : CARD, color: INK }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = statusMeta[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wide"
      style={{ ...MONO, border: `2px solid ${INK}`, background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

// brutalist knop die indrukt op hover (offset 4→1)
function PushButton({
  children,
  primary,
  full,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  primary?: boolean;
  full?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const off = pressed ? 1 : 4;
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setPressed(true)}
      onMouseLeave={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(true)}
      onFocus={() => setPressed(false)}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[12px] font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${full ? "w-full" : ""}`}
      style={{
        ...MONO,
        border: `2px solid ${INK}`,
        background: primary ? LIME : CARD,
        color: INK,
        transform: `translate(${4 - off}px, ${4 - off}px)`,
        boxShadow: `${off}px ${off}px 0 0 ${INK}`,
      }}
    >
      {children}
    </button>
  );
}

function MatchBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1" style={{ border: `2px solid ${INK}`, background: CARD }}>
        <div className="h-full" style={{ width: `${value}%`, background: LIME }} />
      </div>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...MONO, color: INK }}>
        {value}
      </span>
    </div>
  );
}

// ---- hoofdcomponent -----------------------------------------------------------------------

export function Concept08() {
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
      className="min-h-[640px] w-full antialiased"
      style={{
        ...MONO,
        color: INK,
        background: CANVAS,
        backgroundImage:
          "linear-gradient(rgba(15,15,13,0.045) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(15,15,13,0.045) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="flex min-h-[640px]">
        {/* ---------- Sidebar ---------- */}
        <aside
          className="hidden w-[228px] shrink-0 flex-col gap-4 p-4 md:flex"
          style={{ borderRight: `2px solid ${INK}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-10 w-10 place-items-center"
              style={{ background: INK, ...hard(3, 3, LIME) }}
            >
              <span className="text-[16px] font-bold" style={{ ...SPACE, color: LIME }}>
                Z
              </span>
            </div>
            <div>
              <div className="text-[15px] font-bold uppercase tracking-tight" style={SPACE}>
                Beton
              </div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
                ZZP-platform
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const active = screen === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => switchTo(item.key)}
                  aria-current={active ? "page" : undefined}
                  className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    border: `2px solid ${INK}`,
                    background: active ? LIME : CARD,
                    color: INK,
                    transform: active ? "translate(0,0)" : "translate(2px,2px)",
                    boxShadow: active ? `4px 4px 0 0 ${INK}` : `2px 2px 0 0 ${INK}`,
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div
            className="mt-auto p-3"
            style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-wide">{PROFIEL.trust}</span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {[1, 1, 1, 0].map((on, i) => (
                <div
                  key={i}
                  className="h-2.5 flex-1"
                  style={{ border: `2px solid ${INK}`, background: on ? LIME : CARD }}
                />
              ))}
            </div>
            <div className="mt-2 text-[10px] tabular-nums" style={{ color: MUTED }}>
              3/4 DOCUMENTEN OK
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5" style={{ background: INK }}>
            <div
              className="grid h-8 w-8 place-items-center text-[11px] font-bold"
              style={{ background: LIME, color: INK }}
            >
              {PROFIEL.initialen}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-bold" style={{ color: CANVAS }}>
                {PROFIEL.naam}
              </div>
              <div className="truncate text-[10px] uppercase" style={{ color: "#9a9a90" }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- Main ---------- */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex items-center gap-3 p-4"
            style={{ borderBottom: `2px solid ${INK}` }}
          >
            <button
              className="grid h-9 w-9 place-items-center md:hidden"
              style={{ border: `2px solid ${INK}`, background: CARD }}
              aria-label="Menu openen"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <div
              className="hidden items-center gap-2 px-3 py-2 sm:flex"
              style={{ border: `2px solid ${INK}`, background: CARD, flex: 1 }}
            >
              <span className="text-[12px] font-bold" style={{ color: MUTED }}>
                /
              </span>
              <input
                placeholder="ZOEK OPDRACHTEN…"
                className="w-full bg-transparent text-[12px] uppercase tracking-wide outline-none placeholder:text-[#9a9a90]"
                style={{ ...MONO, color: INK }}
                aria-label="Zoeken"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="relative grid h-9 w-9 place-items-center"
                style={{ border: `2px solid ${INK}`, background: CARD }}
                aria-label="Meldingen"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center text-[9px] font-bold"
                  style={{ background: LIME, border: `2px solid ${INK}` }}
                >
                  2
                </span>
              </button>
              <PushButton primary>
                <Plus className="h-4 w-4" aria-hidden="true" />
                FACTUUR
              </PushButton>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-2 overflow-x-auto p-3 md:hidden"
            style={{ borderBottom: `2px solid ${INK}` }}
          >
            {SCREENS.map((s) => (
              <button
                key={s.key}
                onClick={() => switchTo(s.key)}
                className="whitespace-nowrap px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2"
                style={{
                  border: `2px solid ${INK}`,
                  background: screen === s.key ? LIME : CARD,
                  color: INK,
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

function ScreenHeader({ kicker, titel }: { kicker: string; titel: string }) {
  return (
    <div className="mb-5">
      <div
        className="mb-1.5 inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
        style={{ background: INK, color: LIME }}
      >
        {kicker}
      </div>
      <h1 className="text-[30px] font-bold uppercase leading-none tracking-tight" style={SPACE}>
        {titel}
      </h1>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="space-y-5">
      <ScreenHeader kicker="OVERZICHT" titel={`Hallo, ${PROFIEL.naam.split(" ")[0]}`} />

      {/* Waarschuwingsbanner */}
      <div
        className="flex items-center gap-3 p-3.5"
        style={{ background: "#fde68a", border: `2px solid ${INK}`, ...hard() }}
        role="status"
      >
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-wide">
            VOG VERLOOPT OVER 23 DAGEN
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "#78350f" }}>
            Vraag een nieuwe Verklaring Omtrent Gedrag aan om verifieerbaar te blijven.
          </p>
        </div>
        <PushButton>VERNIEUWEN</PushButton>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="p-4"
            style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
              {kpi.label}
            </div>
            <div
              className="mt-2 text-[26px] font-bold tabular-nums leading-none"
              style={{ ...SPACE }}
            >
              {kpi.value}
            </div>
            <div
              className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
              style={{ background: kpi.up ? LIME : "#fde68a", border: `2px solid ${INK}` }}
            >
              {kpi.up ? (
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
              )}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Matches */}
        <div
          className="p-4 lg:col-span-2"
          style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}
        >
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide" style={SPACE}>
            BESTE MATCHES
          </h2>
          <div className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <div
                key={o.id}
                className="p-3 transition-colors hover:bg-[#f4f4ef]"
                style={{ border: `2px solid ${INK}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold" style={{ color: MUTED }}>
                      {o.id}
                    </div>
                    <div className="truncate text-[13px] font-bold" style={SPACE}>
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: MUTED }}>
                      {o.opdrachtgever} · {o.plaats}
                    </div>
                  </div>
                  <div className="text-right text-[13px] font-bold tabular-nums">{o.tarief}</div>
                </div>
                <div className="mt-2">
                  <MatchBar value={o.match} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acties */}
        <div className="p-4" style={{ background: INK, ...hard(4, 4, LIME) }}>
          <h2
            className="mb-3 text-[13px] font-bold uppercase tracking-wide"
            style={{ ...SPACE, color: LIME }}
          >
            VOLGENDE ACTIES
          </h2>
          <div className="space-y-2.5">
            {ACTIES.map((a) => (
              <div
                key={a.titel}
                className="p-2.5"
                style={{
                  background: "#1a1a16",
                  border: `2px solid ${a.urgentie === "warning" ? "#fde68a" : "#3a3a32"}`,
                }}
              >
                <div className="text-[11.5px] font-bold leading-snug" style={{ color: CANVAS }}>
                  {a.titel}
                </div>
                <button
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase"
                  style={{ color: LIME }}
                >
                  {a.cta} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Berichten */}
      <div className="p-4" style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide" style={SPACE}>
          BERICHTEN
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {BERICHTEN.map((b) => (
            <div key={b.van} className="p-3" style={{ border: `2px solid ${INK}` }}>
              <div className="flex items-center gap-2">
                <div
                  className="grid h-7 w-7 place-items-center text-[10px] font-bold"
                  style={{ background: INK, color: LIME }}
                >
                  {b.initialen}
                </div>
                <span className="truncate text-[11px] font-bold uppercase">{b.van}</span>
                {b.ongelezen && (
                  <span
                    className="ml-auto h-2.5 w-2.5"
                    style={{ background: LIME, border: `2px solid ${INK}` }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[11.5px]" style={{ color: MUTED }}>
                {b.preview}
              </p>
              <div className="mt-2 text-[10px] tabular-nums" style={{ color: MUTED }}>
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
  const filters = ["ALLE", "VERPLEGING", "VERZORGING", "GGZ", "AVOND", "DICHTBIJ"];
  const [active, setActive] = useState("ALLE");
  return (
    <div className="space-y-5">
      <ScreenHeader kicker="VERKLAARBARE MATCHES" titel="Marktplaats" />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2"
            style={{
              border: `2px solid ${INK}`,
              background: active === f ? LIME : CARD,
              color: INK,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Opdrachten laden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-4"
              style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}
            >
              <div className="h-4 w-1/2 animate-pulse" style={{ background: "#e4e4dd" }} />
              <div className="mt-3 h-3 w-1/4 animate-pulse" style={{ background: "#ececec" }} />
              <div className="mt-3 h-3 w-full animate-pulse" style={{ background: "#ececec" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {OPDRACHTEN.map((o) => (
            <article
              key={o.id}
              className="p-4 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{ background: CARD, border: `2px solid ${INK}`, ...hard(5, 5) }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold" style={{ color: MUTED }}>
                    {o.id}
                  </div>
                  <h3
                    className="mt-0.5 text-[16px] font-bold uppercase leading-tight"
                    style={SPACE}
                  >
                    {o.titel}
                  </h3>
                  <div
                    className="mt-1 flex items-center gap-1.5 text-[11px]"
                    style={{ color: MUTED }}
                  >
                    <span className="font-bold">{o.opdrachtgever}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {o.plaats}
                    </span>
                  </div>
                </div>
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center"
                  style={{ background: LIME, border: `2px solid ${INK}` }}
                >
                  <span className="text-[16px] font-bold tabular-nums" style={SPACE}>
                    {o.match}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>

              <div
                className="mt-3 flex items-center gap-3 pt-3 text-[11px] font-bold"
                style={{ borderTop: `2px solid ${INK}` }}
              >
                <span className="text-[13px] tabular-nums">{o.tarief}</span>
                <span className="inline-flex items-center gap-1" style={{ color: MUTED }}>
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {o.uren}
                </span>
                <span className="inline-flex items-center gap-1" style={{ color: MUTED }}>
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {o.start}
                </span>
                <span className="ml-auto">
                  <PushButton primary>REAGEER</PushButton>
                </span>
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
      <div className="p-8 text-center" style={{ border: `2px dashed ${INK}`, background: CARD }}>
        <p className="text-[13px] font-bold uppercase">GEEN OPDRACHT GESELECTEERD</p>
        <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
          Kies een opdracht in de marktplaats om de details te bekijken.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <button
        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase"
        style={{ color: MUTED }}
      >
        ← TERUG
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="p-5" style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}>
            <div className="text-[10px] font-bold" style={{ color: MUTED }}>
              {o.id}
            </div>
            <h1
              className="mt-1 text-[26px] font-bold uppercase leading-none tracking-tight"
              style={SPACE}
            >
              {o.titel}
            </h1>
            <div
              className="mt-2 flex items-center gap-1.5 text-[12px] font-bold"
              style={{ color: MUTED }}
            >
              {o.opdrachtgever} · <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {o.plaats}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { l: "TARIEF", v: o.tarief },
                { l: "INZET", v: o.uren },
                { l: "START", v: o.start },
              ].map((m) => (
                <div
                  key={m.l}
                  className="p-3"
                  style={{ border: `2px solid ${INK}`, background: CANVAS }}
                >
                  <div className="text-[10px] font-bold" style={{ color: MUTED }}>
                    {m.l}
                  </div>
                  <div className="mt-1 text-[14px] font-bold tabular-nums" style={SPACE}>
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="mb-1 text-[10px] font-bold uppercase" style={{ color: MUTED }}>
                MATCH-SCORE
              </div>
              <MatchBar value={o.match} />
            </div>
          </div>

          {/* Verklaarbare matching */}
          <div className="p-5" style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide" style={SPACE}>
              WAAROM DEZE MATCH?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div
                  className="mb-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ background: LIME, border: `2px solid ${INK}` }}
                >
                  STERKE PUNTEN
                </div>
                <ul className="space-y-2">
                  {o.redenen.plus.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[12px]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div
                  className="mb-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{ background: "#fde68a", border: `2px solid ${INK}` }}
                >
                  AANDACHTSPUNTEN
                </div>
                <ul className="space-y-2">
                  {o.redenen.min.map((m) => (
                    <li
                      key={m}
                      className="flex items-start gap-2 text-[12px]"
                      style={{ color: MUTED }}
                    >
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
          <div className="p-5" style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}>
            <PushButton primary full>
              REAGEER OP OPDRACHT
            </PushButton>
            <div className="mt-2.5">
              <PushButton full>BEWAAR VOOR LATER</PushButton>
            </div>
          </div>

          <div className="p-5" style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}>
            <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wide" style={SPACE}>
              VEREISTE CERTIFICATEN
            </h3>
            <div className="space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => (
                <div key={c.naam} className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-bold uppercase">{c.naam}</span>
                  <StatusBadge status={c.status} />
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
      <ScreenHeader kicker="VERTROUWENSNIVEAU" titel="Verificatie" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="p-5 lg:col-span-1" style={{ background: INK, ...hard(4, 4, LIME) }}>
          <div
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "#9a9a90" }}
          >
            PROFIEL COMPLEET
          </div>
          <div
            className="mt-2 text-[56px] font-bold tabular-nums leading-none"
            style={{ ...SPACE, color: LIME }}
          >
            75%
          </div>
          <div className="mt-3 flex gap-1" aria-hidden="true">
            {[1, 1, 1, 0].map((on, i) => (
              <div
                key={i}
                className="h-3 flex-1"
                style={{ border: `2px solid ${LIME}`, background: on ? LIME : "transparent" }}
              />
            ))}
          </div>
          <div
            className="mt-4 inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase"
            style={{ background: LIME, color: INK }}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {PROFIEL.trust}
          </div>
          <p className="mt-3 text-[11px]" style={{ color: "#c4c4ba" }}>
            Vernieuw je VOG om op het hoogste niveau te blijven.
          </p>
        </div>

        <div
          className="lg:col-span-2"
          style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}
        >
          {CREDENTIALS.map((c, i) => (
            <div
              key={c.naam}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-[#f4f4ef]"
              style={{ borderTop: i === 0 ? "none" : `2px solid ${INK}` }}
            >
              <div
                className="grid h-10 w-10 shrink-0 place-items-center"
                style={{ background: CANVAS, border: `2px solid ${INK}` }}
              >
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold uppercase">{c.naam}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: MUTED }}>
                  {c.detail}
                </div>
              </div>
              <StatusBadge status={c.status} />
              {c.status === "EXPIRING" && <PushButton>VERNIEUW</PushButton>}
            </div>
          ))}
        </div>
      </div>

      {/* Documenten */}
      <div className="p-4" style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide" style={SPACE}>
          DOCUMENTEN
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => (
            <div
              key={d.naam}
              className="flex items-center gap-3 p-3"
              style={{ border: `2px solid ${INK}` }}
            >
              <div
                className="grid h-9 w-9 place-items-center"
                style={{ background: CANVAS, border: `2px solid ${INK}` }}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold">{d.naam}</div>
                <div className="text-[10px] tabular-nums" style={{ color: MUTED }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusBadge status={d.status} />
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
      <ScreenHeader kicker="GEPRIORITEERD" titel="Acties" />

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const isWarn = a.urgentie === "warning";
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 p-4 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{ background: CARD, border: `2px solid ${INK}`, ...hard(5, 5) }}
            >
              <div
                className="grid h-11 w-11 shrink-0 place-items-center"
                style={{ background: isWarn ? "#fde68a" : LIME, border: `2px solid ${INK}` }}
              >
                {isWarn ? (
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Bolt className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-5 w-5 place-items-center text-[10px] font-bold"
                    style={{ background: INK, color: LIME }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-[14px] font-bold uppercase" style={SPACE}>
                    {a.titel}
                  </h3>
                </div>
                <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                  {a.detail}
                </p>
              </div>
              <div className="self-center">
                <PushButton primary={isWarn}>{a.cta}</PushButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty-state */}
      <div className="p-8 text-center" style={{ border: `2px dashed ${INK}`, background: CARD }}>
        <div
          className="mx-auto grid h-12 w-12 place-items-center"
          style={{ background: LIME, border: `2px solid ${INK}` }}
        >
          <Check className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-3 text-[13px] font-bold uppercase">ALLES BIJGEWERKT</p>
        <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
          Geen verdere acties — je staat er goed voor.
        </p>
      </div>
    </div>
  );
}

function FacturenScreen() {
  const statusBg: Record<string, string> = {
    Betaald: LIME,
    Openstaand: "#fde68a",
    Concept: "#e4e4dd",
  };
  return (
    <div className="space-y-5">
      <ScreenHeader kicker="OMZET & POSTEN" titel="Facturen" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "BETAALD (MND)", v: "€ 5.552" },
          { l: "OPENSTAAND", v: "€ 1.350" },
          { l: "IN CONCEPT", v: "€ 880" },
          { l: "GEM. TERMIJN", v: "11 DGN" },
        ].map((s) => (
          <div
            key={s.l}
            className="p-4"
            style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}
          >
            <div className="text-[10px] font-bold uppercase" style={{ color: MUTED }}>
              {s.l}
            </div>
            <div className="mt-1.5 text-[22px] font-bold tabular-nums" style={SPACE}>
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden"
        style={{ background: CARD, border: `2px solid ${INK}`, ...hard() }}
      >
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: INK }}>
              <th
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: LIME }}
              >
                FACTUUR
              </th>
              <th
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: LIME }}
              >
                KLANT
              </th>
              <th
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: LIME }}
              >
                DATUM
              </th>
              <th
                className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide"
                style={{ color: LIME }}
              >
                BEDRAG
              </th>
              <th
                className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide"
                style={{ color: LIME }}
              >
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr
                key={f.nr}
                className="transition-colors hover:bg-[#f4f4ef]"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${INK}` }}
              >
                <td className="px-4 py-3 text-[12px] font-bold tabular-nums">{f.nr}</td>
                <td className="px-4 py-3 text-[12px] font-bold uppercase">{f.klant}</td>
                <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: MUTED }}>
                  {f.datum}
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                  {f.bedrag}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: statusBg[f.status], border: `2px solid ${INK}` }}
                  >
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="flex items-center gap-2 p-3.5"
        style={{ background: "#fde68a", border: `2px solid ${INK}`, ...hard() }}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-[11.5px] font-bold uppercase">
          FAC-2025-118 STAAT AL 9 DAGEN OPEN — STUUR EEN HERINNERING.
        </p>
      </div>
    </div>
  );
}
