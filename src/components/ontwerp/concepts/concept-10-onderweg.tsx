"use client";

// Concept 10 — "Onderweg": mobiel-eerst, duim-bereikbaar.
// Richting: Temper-snelheid voor het claimen van diensten, maar met een B2B-vertrouwenslaag
// (geverifieerde certificaten, betrouwbare meldingen). Gerenderd als telefoon-frame op het
// canvas: device-rand, statusbalk, bottom-nav met icoon-tabs, bottom-sheet voor opdracht-detail,
// en optimistisch claimen (een "Claim dienst"-knop die direct bevestigt). Wit, inkt, oranje accent.
// Self-contained mini-app, frontend only, mock data.

import { useState } from "react";
import {
  Home,
  Search,
  ShieldCheck,
  Receipt,
  Bell,
  Check,
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  MapPin,
  Zap,
  Loader2,
  Star,
  Wallet,
  BadgeCheck,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  type ScreenKey,
  type CredStatus,
} from "./mock";

// --- Palet (levendig, mobiel) ---
const C = {
  bg: "#ffffff",
  surface: "#f6f6f7",
  ink: "#16181d",
  sub: "#6a6d77",
  faint: "#9b9ea7",
  line: "#ececef",
  accent: "#e0562d",
  accentSoft: "#e0562d14",
  verified: "#1f8a4c",
  expiring: "#b5740d",
  rejected: "#c63b27",
};

const sans = { fontFamily: "var(--font-lab-inter)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

const STATUS_COLOR: Record<CredStatus, string> = {
  VERIFIED: C.verified,
  EXPIRING: C.expiring,
  SUBMITTED: C.sub,
  REJECTED: C.rejected,
};

function CredIcon({ status, className }: { status: CredStatus; className?: string }) {
  if (status === "VERIFIED") return <BadgeCheck className={className} aria-hidden />;
  if (status === "EXPIRING") return <AlertTriangle className={className} aria-hidden />;
  if (status === "REJECTED") return <X className={className} aria-hidden />;
  return <Clock className={className} aria-hidden />;
}

const TABS: { key: ScreenKey; label: string; icon: typeof Home }[] = [
  { key: "dashboard", label: "Start", icon: Home },
  { key: "marktplaats", label: "Diensten", icon: Search },
  { key: "verificatie", label: "Bewijs", icon: ShieldCheck },
  { key: "facturen", label: "Facturen", icon: Receipt },
];

export function Concept10() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  const openSheet = (id: string) => setSheetId(id);
  const sheetOpdracht = OPDRACHTEN.find((o) => o.id === sheetId) ?? null;

  return (
    <div
      style={{ ...sans, background: C.surface, color: C.ink }}
      className="flex min-h-[640px] w-full items-center justify-center p-4 antialiased [color-scheme:light] sm:p-8"
    >
      {/* Telefoon-frame */}
      <div
        className="relative flex h-[760px] w-full max-w-[400px] flex-col overflow-hidden rounded-[2.25rem] shadow-2xl"
        style={{ background: C.bg, border: "10px solid #16181d" }}
      >
        {/* Statusbalk */}
        <div
          className="flex shrink-0 items-center justify-between px-6 pb-1 pt-3 text-[12px] font-semibold"
          style={{ ...mono }}
        >
          <span className="tabular-nums">09:24</span>
          <span
            aria-hidden
            className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full"
            style={{ background: "#16181d" }}
          />
          <span className="flex items-center gap-1 tabular-nums" style={{ color: C.sub }}>
            <span>5G</span>
            <span>100%</span>
          </span>
        </div>

        {/* App-header */}
        <header
          className="flex shrink-0 items-center gap-2.5 px-4 pb-3 pt-1"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold text-white"
            style={{ background: C.accent }}
          >
            {PROFIEL.initialen}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[14px] font-semibold">Hoi, Sanne</div>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: C.verified }}>
              <BadgeCheck className="h-3 w-3" aria-hidden />
              {PROFIEL.trust}
            </div>
          </div>
          <button
            type="button"
            aria-label="Meldingen"
            className="relative rounded-full p-2 transition-colors hover:bg-[#16181d08] focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.sub }}
          >
            <Bell className="h-5 w-5" aria-hidden />
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white"
              style={{ background: C.accent }}
            />
          </button>
        </header>

        {/* Scrollbaar scherm */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {screen === "dashboard" && <DashboardScreen onOpen={openSheet} />}
          {screen === "marktplaats" && <MarktplaatsScreen onOpen={openSheet} claimed={claimed} />}
          {screen === "opdracht" && <DashboardScreen onOpen={openSheet} />}
          {screen === "verificatie" && <VerificatieScreen />}
          {screen === "acties" && <DashboardScreen onOpen={openSheet} />}
          {screen === "facturen" && <FacturenScreen />}
        </main>

        {/* Bottom-nav */}
        <nav
          className="flex shrink-0 items-stretch justify-around px-2 pb-3 pt-1.5"
          style={{ borderTop: `1px solid ${C.line}`, background: C.bg }}
          aria-label="Hoofdnavigatie"
          role="tablist"
        >
          {TABS.map((t) => {
            const active = t.key === screen;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                onClick={() => setScreen(t.key)}
                style={{ color: active ? C.accent : C.faint }}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <Icon className="h-[22px] w-[22px]" aria-hidden />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom-sheet voor opdracht-detail */}
        {sheetOpdracht && (
          <OpdrachtSheet
            opdracht={sheetOpdracht}
            claimed={!!claimed[sheetOpdracht.id]}
            onClaim={() => setClaimed((prev) => ({ ...prev, [sheetOpdracht.id]: true }))}
            onClose={() => setSheetId(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const top = OPDRACHTEN[0];
  return (
    <div className="space-y-5 p-4 pb-6">
      {/* Verdien-kaart */}
      <section
        className="rounded-2xl p-4 text-white"
        style={{ background: "linear-gradient(135deg,#16181d,#2a2d36)" }}
      >
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#c7cad3" }}>
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          {KPIS[2]?.label}
        </div>
        <div style={{ ...mono }} className="mt-1 text-3xl font-bold tabular-nums">
          {KPIS[2]?.value}
        </div>
        <div className="mt-3 flex gap-4">
          {KPIS.slice(0, 2).map((k) => (
            <div key={k.label}>
              <div style={{ ...mono }} className="text-[15px] font-semibold tabular-nums">
                {k.value}
              </div>
              <div className="text-[10px]" style={{ color: "#9b9ea7" }}>
                {k.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Acties — vertrouwens-meldingen */}
      <section>
        <h2 className="mb-2 text-[13px] font-semibold">Vereist actie</h2>
        <ul className="space-y-2">
          {ACTIES.slice(0, 2).map((a) => {
            const warning = a.urgentie === "warning";
            const color = warning ? C.expiring : C.accent;
            return (
              <li
                key={a.titel}
                className="flex items-start gap-2.5 rounded-2xl p-3"
                style={{ background: C.surface }}
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${color}1f`, color }}
                >
                  {warning ? (
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium">{a.titel}</div>
                  <p className="mt-0.5 text-[11px] leading-snug" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Beste match — duim-zone CTA */}
      {top && (
        <section>
          <h2 className="mb-2 text-[13px] font-semibold">Beste match nu</h2>
          <button
            type="button"
            onClick={() => onOpen(top.id)}
            className="w-full rounded-2xl p-4 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99]"
            style={{ border: `1px solid ${C.line}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{top.titel}</div>
                <div
                  className="mt-0.5 flex items-center gap-1 text-[11px]"
                  style={{ color: C.sub }}
                >
                  <MapPin className="h-3 w-3" aria-hidden />
                  {top.opdrachtgever} · {top.plaats}
                </div>
              </div>
              <span
                className="flex shrink-0 flex-col items-center rounded-xl px-2.5 py-1"
                style={{ background: C.accentSoft, color: C.accent }}
              >
                <span
                  style={{ ...mono }}
                  className="text-[15px] font-bold tabular-nums leading-none"
                >
                  {top.match}%
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wide">match</span>
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span style={{ ...mono }} className="text-[13px] font-semibold tabular-nums">
                {top.tarief}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[12px] font-medium"
                style={{ color: C.accent }}
              >
                Bekijk dienst
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          </button>
        </section>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({
  onOpen,
  claimed,
}: {
  onOpen: (id: string) => void;
  claimed: Record<string, boolean>;
}) {
  const filters = ["Alle", "≥85%", "Avond", "Dichtbij"];
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3 p-4 pb-6">
      {/* Filterchips — horizontaal scrollbaar */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filters"
      >
        {filters.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i)}
              style={
                on ? { background: C.ink, color: "#fff" } : { background: C.surface, color: C.sub }
              }
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Swipe-achtige kaarten */}
      <ul className="space-y-3">
        {OPDRACHTEN.map((o) => {
          const isClaimed = !!claimed[o.id];
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onOpen(o.id)}
                className="w-full rounded-2xl p-4 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 active:scale-[0.99]"
                style={{ border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold">{o.titel}</div>
                    <div
                      className="mt-0.5 flex items-center gap-1 text-[11px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin className="h-3 w-3" aria-hidden />
                      {o.plaats} · {o.uren}
                    </div>
                  </div>
                  <span
                    style={{ ...mono, color: o.match >= 90 ? C.accent : C.sub }}
                    className="shrink-0 text-[15px] font-bold tabular-nums"
                  >
                    {o.match}%
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {o.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: C.surface, color: C.sub }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-3 flex items-center justify-between border-t pt-2.5"
                  style={{ borderColor: C.line }}
                >
                  <span style={{ ...mono }} className="text-[13px] font-semibold tabular-nums">
                    {o.tarief}
                  </span>
                  {isClaimed ? (
                    <span
                      className="inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ color: C.verified }}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Geclaimd
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[12px] font-medium"
                      style={{ color: C.accent }}
                    >
                      Open dienst
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------- Opdracht bottom-sheet */

function OpdrachtSheet({
  opdracht: o,
  claimed,
  onClaim,
  onClose,
}: {
  opdracht: (typeof OPDRACHTEN)[number];
  claimed: boolean;
  onClaim: () => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);

  const handleClaim = () => {
    setPending(true);
    // Optimistisch: bevestig direct in de UI.
    window.setTimeout(() => {
      setPending(false);
      onClaim();
    }, 550);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Sluiten"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 focus-visible:outline-none"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Dienst ${o.titel}`}
        className="relative max-h-[88%] overflow-y-auto rounded-t-[1.75rem] px-5 pb-6 pt-3"
        style={{ background: C.bg }}
      >
        <div className="sticky top-0 -mx-5 mb-3 bg-white/90 px-5 pb-2 pt-1 backdrop-blur">
          <div
            aria-hidden
            className="mx-auto h-1.5 w-10 rounded-full"
            style={{ background: C.line }}
          />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div style={{ ...mono, color: C.faint }} className="text-[11px] tabular-nums">
              {o.id}
            </div>
            <h2 className="mt-0.5 text-[17px] font-bold leading-tight">{o.titel}</h2>
            <div className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: C.sub }}>
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {o.opdrachtgever} · {o.plaats}
            </div>
          </div>
          <span
            className="flex shrink-0 flex-col items-center rounded-2xl px-3 py-1.5"
            style={{ background: C.accentSoft, color: C.accent }}
          >
            <span style={{ ...mono }} className="text-xl font-bold tabular-nums leading-none">
              {o.match}%
            </span>
            <span className="text-[9px] font-medium uppercase tracking-wide">match</span>
          </span>
        </div>

        {/* Kernfeiten */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Tarief", value: o.tarief },
            { label: "Inzet", value: o.uren },
            { label: "Start", value: o.start },
          ].map((f) => (
            <div key={f.label} className="rounded-xl py-2.5" style={{ background: C.surface }}>
              <div style={{ ...mono }} className="text-[12.5px] font-semibold tabular-nums">
                {f.value}
              </div>
              <div className="mt-0.5 text-[10px]" style={{ color: C.sub }}>
                {f.label}
              </div>
            </div>
          ))}
        </div>

        {/* Vertrouwenslaag: geverifieerde eisen */}
        <div
          className="mt-4 flex items-center gap-1.5 text-[12px] font-medium"
          style={{ color: C.verified }}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Jouw bewijsstukken voldoen aan de eisen
        </div>

        {/* Redenen */}
        <div className="mt-3 space-y-1.5">
          {o.redenen.plus.map((r) => (
            <div key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.ink }}>
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: C.verified }}
                aria-hidden
              />
              <span>{r}</span>
            </div>
          ))}
          {o.redenen.min.map((r) => (
            <div key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.sub }}>
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: C.expiring }}
                aria-hidden
              />
              <span>{r}</span>
            </div>
          ))}
        </div>

        {/* Beoordeling-streep */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px]" style={{ color: C.sub }}>
          <Star
            className="h-3.5 w-3.5"
            style={{ color: C.expiring }}
            fill="currentColor"
            aria-hidden
          />
          <span style={{ ...mono }} className="font-semibold tabular-nums">
            4,8
          </span>
          opdrachtgever-beoordeling · reageert binnen 6 u
        </div>
      </div>

      {/* Sticky duim-zone CTA */}
      <div
        className="relative px-5 pb-5 pt-3"
        style={{ background: C.bg, borderTop: `1px solid ${C.line}` }}
      >
        {claimed ? (
          <div
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold"
            style={{ background: `${C.verified}14`, color: C.verified }}
            role="status"
          >
            <BadgeCheck className="h-5 w-5" aria-hidden />
            Dienst geclaimd — opdrachtgever is geïnformeerd
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClaim}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-80"
            style={{ background: C.accent }}
          >
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Claimen…
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" aria-hidden />
                Claim dienst
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

function VerificatieScreen() {
  return (
    <div className="space-y-4 p-4 pb-6">
      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: `${C.verified}0f` }}
      >
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${C.verified}1f`, color: C.verified }}
        >
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <div className="text-[13px] font-semibold">Vertrouwensniveau: Hoog</div>
          <div className="text-[11px]" style={{ color: C.sub }}>
            {PROFIEL.trust} · zichtbaar voor opdrachtgevers
          </div>
        </div>
      </div>

      <ul className="space-y-2.5">
        {CREDENTIALS.map((c) => (
          <li
            key={c.naam}
            className="flex items-center gap-3 rounded-2xl p-3.5"
            style={{ border: `1px solid ${C.line}` }}
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${STATUS_COLOR[c.status]}1a`, color: STATUS_COLOR[c.status] }}
            >
              <CredIcon status={c.status} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{c.naam}</div>
              <div className="truncate text-[11px]" style={{ color: C.sub }}>
                {c.detail}
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: `${STATUS_COLOR[c.status]}14`, color: STATUS_COLOR[c.status] }}
            >
              <CredIcon status={c.status} className="h-3 w-3" />
              {STATUS_LABEL[c.status]}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="w-full rounded-2xl py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{ background: C.surface, color: C.ink }}
      >
        Bewijsstuk toevoegen
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FactuurChip({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    Betaald: { color: C.verified, icon: <Check className="h-3 w-3" aria-hidden /> },
    Openstaand: { color: C.expiring, icon: <Clock className="h-3 w-3" aria-hidden /> },
    Concept: { color: C.faint, icon: <Receipt className="h-3 w-3" aria-hidden /> },
  };
  const c = map[status] ?? { color: C.sub, icon: null };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: `${c.color}14`, color: c.color }}
    >
      {c.icon}
      {status}
    </span>
  );
}

function FacturenScreen() {
  return (
    <div className="space-y-2.5 p-4 pb-6">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="text-[14px] font-semibold">Facturen</h2>
        <span className="text-[11px]" style={{ color: C.sub }}>
          {KPIS[3]?.value} te factureren
        </span>
      </div>
      <ul className="space-y-2.5">
        {FACTUREN.map((f) => (
          <li
            key={f.nr}
            className="flex items-center gap-3 rounded-2xl p-3.5"
            style={{ border: `1px solid ${C.line}` }}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{f.klant}</div>
              <div style={{ ...mono }} className="mt-0.5 text-[11px] tabular-nums">
                <span style={{ color: C.faint }}>{f.nr}</span>
                <span style={{ color: C.sub }}> · {f.datum}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span style={{ ...mono }} className="text-[14px] font-bold tabular-nums">
                {f.bedrag}
              </span>
              <FactuurChip status={f.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
