"use client";

// Concept 15 — "Zenit" · Mobiel-first native app-shell (het ENIGE mobiele concept).
// De ZZP'er regelt reacties, uren en documenten onderweg — met de duim. Een echte telefoon-shell:
// op desktop een gecentreerd device-frame (max-w-[420px]), op mobiel full-width. De thumb-zone is
// centraal: een vaste onderste tab-bar (bottom navigation) met grote raakvlakken, plus bottom-sheets
// die vanaf onder opkomen. Verticale kaartstroom, ronde vormen, zachte diepte. Snel, native.
// Palet: desk #dbe2ea, bg #f2f5f9, surface #ffffff, ink #0f172a, muted #64748b,
// accent #0ea5e9, accentSoft #e0f2fe. Fonts: Plus Jakarta Sans (koppen) + Inter (tekst).

import { useState } from "react";
import {
  Home,
  Compass,
  ShieldCheck,
  Bell,
  Receipt,
  Search,
  ChevronRight,
  ArrowLeft,
  Check,
  Plus,
  Minus,
  X,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
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
  desk: "#dbe2ea",
  bg: "#f2f5f9",
  surface: "#ffffff",
  surfaceAlt: "#f7f9fc",
  ink: "#0f172a",
  inkSoft: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  line: "#e8edf3",
  lineSoft: "#f0f4f8",
  accent: "#0ea5e9",
  accentInk: "#0369a1",
  accentSoft: "#e0f2fe",
  success: "#059669",
  successSoft: "#d1fae5",
  warn: "#d97706",
  warnSoft: "#fef3c7",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
};

const head = { fontFamily: "var(--font-lab-jakarta)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const TABS: { key: ScreenKey; label: string; Icon: LucideIcon }[] = [
  { key: "dashboard", label: "Start", Icon: Home },
  { key: "marktplaats", label: "Markt", Icon: Compass },
  { key: "verificatie", label: "Verificatie", Icon: ShieldCheck },
  { key: "acties", label: "Acties", Icon: Bell },
  { key: "facturen", label: "Facturen", Icon: Receipt },
];

const SCREEN_TITLE: Record<ScreenKey, string> = {
  dashboard: "Vandaag",
  marktplaats: "Marktplaats",
  opdracht: "Opdracht",
  verificatie: "Verificatie",
  acties: "Acties",
  facturen: "Facturen",
  documenten: "Documenten",
  berichten: "Berichten",
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.success, bg: C.successSoft, Icon: CheckCircle2 };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accentInk, bg: C.accentSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.danger, bg: C.dangerSoft, Icon: XCircle };
  }
}

// ── Circulaire match-ring ────────────────────────────────────────────────────────

function MatchRing({
  value,
  size = 54,
  stroke = 5,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.line}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[15px] font-extrabold tabular-nums leading-none"
          style={{ ...head, color: C.ink }}
        >
          {value}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: C.faint }}>
          match
        </span>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function Concept15() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sheet, setSheet] = useState<"none" | "reageren" | "menu">("none");
  const active = OPDRACHTEN[0] as Opdracht;

  const isOpdracht = screen === "opdracht";
  const activeTab: ScreenKey = isOpdracht ? "marktplaats" : screen;

  return (
    <div
      className="flex min-h-[680px] w-full items-stretch justify-center antialiased sm:items-center sm:py-8"
      style={{ ...body, background: C.desk, color: C.ink }}
    >
      {/* Device-frame */}
      <div
        className="relative flex w-full max-w-[420px] flex-col overflow-hidden bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.5)] sm:rounded-[38px] sm:border-[6px]"
        style={{ background: C.bg, borderColor: "#0f172a", height: 720, minHeight: 680 }}
      >
        {/* Statusbalk */}
        <div
          className="flex shrink-0 items-center justify-between px-6 pb-1 pt-3 text-[12px] font-semibold"
          style={{ background: C.surface, color: C.ink, ...head }}
        >
          <span className="tabular-nums">09:41</span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {/* signaal */}
            <span className="flex items-end gap-0.5">
              {[3, 5, 7, 9].map((h) => (
                <span
                  key={h}
                  className="w-[3px] rounded-full"
                  style={{ height: h, background: C.ink }}
                />
              ))}
            </span>
            {/* batterij */}
            <span
              className="ml-1 flex h-[11px] w-[22px] items-center rounded-[3px] border px-[2px]"
              style={{ borderColor: C.ink }}
            >
              <span className="h-[6px] w-[14px] rounded-[1px]" style={{ background: C.ink }} />
            </span>
          </div>
        </div>

        {/* App-bar */}
        <header
          className="flex shrink-0 items-center gap-3 border-b px-5 py-3"
          style={{ background: C.surface, borderColor: C.line }}
        >
          {isOpdracht ? (
            <button
              onClick={() => setScreen("marktplaats")}
              aria-label="Terug naar marktplaats"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#f0f4f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white"
              style={{ background: C.accent, ...head }}
            >
              Z
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {isOpdracht ? "Details" : "ZZP · Zenit"}
            </p>
            <h1
              className="truncate text-[18px] font-extrabold leading-tight tracking-tight"
              style={head}
            >
              {SCREEN_TITLE[screen]}
            </h1>
          </div>
          <button
            onClick={() => setSheet("menu")}
            aria-label="Profiel en meldingen openen"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
            style={{ background: C.accentSoft, color: C.accentInk, ...head }}
          >
            {PROFIEL.initialen}
            <span
              className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
              style={{ background: C.danger }}
              aria-hidden="true"
            />
          </button>
        </header>

        {/* Scrollbare inhoud */}
        <div
          className="relative flex-1 overflow-y-auto overscroll-contain"
          style={{ background: C.bg }}
        >
          <div className="px-4 pb-28 pt-4">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onGo={setScreen}
                onSheet={() => setSheet("reageren")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onReageer={() => setSheet("reageren")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </div>

        {/* Onderste tab-bar (thumb-zone) */}
        <nav
          className="relative z-10 flex shrink-0 items-stretch justify-around border-t px-2 pb-4 pt-2"
          style={{ background: C.surface, borderColor: C.line }}
          aria-label="Hoofdnavigatie"
        >
          {TABS.map((t) => {
            const on = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setScreen(t.key)}
                aria-current={on ? "page" : undefined}
                className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
              >
                <span
                  className="flex h-8 w-full max-w-[52px] items-center justify-center rounded-full transition-colors"
                  style={{ background: on ? C.accentSoft : "transparent" }}
                >
                  <t.Icon
                    size={21}
                    aria-hidden="true"
                    strokeWidth={on ? 2.4 : 1.9}
                    style={{ color: on ? C.accentInk : C.muted }}
                  />
                </span>
                <span
                  className="text-[10px] font-bold tracking-tight"
                  style={{ ...head, color: on ? C.accentInk : C.muted }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom-sheets */}
        {sheet === "reageren" && (
          <ReageerSheet onClose={() => setSheet("none")} opdracht={active} />
        )}
        {sheet === "menu" && <MenuSheet onClose={() => setSheet("none")} />}
      </div>
    </div>
  );
}

// ── Herbruikbare bottom-sheet ────────────────────────────────────────────────────

function Sheet({
  onClose,
  labelledBy,
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      {/* backdrop */}
      <button
        onClick={onClose}
        aria-label="Sluiten"
        className="absolute inset-0 bg-[#0f172a]/40 transition-opacity motion-reduce:transition-none"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative animate-[zenitSheet_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-t-[28px] bg-white pb-6 shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)] motion-reduce:animate-none"
        style={{ background: C.surface }}
      >
        <style>{`@keyframes zenitSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        {/* grabber */}
        <div className="flex justify-center pb-1 pt-3">
          <span
            className="h-1.5 w-11 rounded-full"
            style={{ background: C.line }}
            aria-hidden="true"
          />
        </div>
        {children}
      </div>
    </div>
  );
}

function ReageerSheet({ onClose, opdracht }: { onClose: () => void; opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  return (
    <Sheet onClose={onClose} labelledBy="reageer-titel">
      <div className="px-5 pt-1">
        {state === "sent" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.successSoft }}
            >
              <Check size={30} aria-hidden="true" style={{ color: C.success }} />
            </div>
            <h2
              id="reageer-titel"
              className="mt-4 text-[19px] font-extrabold tracking-tight"
              style={head}
            >
              Reactie verstuurd
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} reageert gemiddeld binnen 6 uur. Je vindt de status terug bij
              je acties.
            </p>
            <button
              onClick={onClose}
              className="mt-5 h-12 w-full rounded-2xl text-[15px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
              style={{ background: C.accent, ...head }}
            >
              Klaar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="reageer-titel"
                  className="text-[19px] font-extrabold leading-tight tracking-tight"
                  style={head}
                >
                  Reageren
                </h2>
                <p className="mt-0.5 truncate text-[13px]" style={{ color: C.muted }}>
                  {opdracht.titel}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Sluiten"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#f0f4f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div
              className="mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3"
              style={{ borderColor: C.line, background: C.surfaceAlt }}
            >
              <ShieldCheck size={20} aria-hidden="true" style={{ color: C.success }} />
              <p className="text-[13px] leading-snug" style={{ color: C.inkSoft }}>
                Je <span className="font-semibold">geverifieerde profiel</span> wordt automatisch
                meegestuurd.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
                { l: "Uren", v: opdracht.uren.replace(" u/week", "u") },
                { l: "Start", v: opdracht.start.replace("Per ", "") },
              ].map((m) => (
                <div
                  key={m.l}
                  className="rounded-2xl px-3 py-2.5 text-center"
                  style={{ background: C.surfaceAlt }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: C.faint }}
                  >
                    {m.l}
                  </p>
                  <p className="mt-1 text-[14px] font-extrabold tabular-nums" style={head}>
                    {m.v}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setState("sending");
                window.setTimeout(() => setState("sent"), 950);
              }}
              disabled={state === "sending"}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] disabled:opacity-75"
              style={{ background: C.accent, ...head }}
            >
              {state === "sending" ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Versturen…
                </>
              ) : (
                <>Verstuur reactie</>
              )}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

function MenuSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} labelledBy="menu-titel">
      <div className="px-5 pt-1">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-[15px] font-extrabold"
            style={{ background: C.accentSoft, color: C.accentInk, ...head }}
          >
            {PROFIEL.initialen}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="menu-titel"
              className="truncate text-[16px] font-extrabold tracking-tight"
              style={head}
            >
              {PROFIEL.naam}
            </h2>
            <p className="truncate text-[12.5px]" style={{ color: C.muted }}>
              {PROFIEL.rol}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: C.successSoft, color: C.success }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>

        <div className="mt-4">
          <p
            className="px-1 text-[12px] font-bold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            Berichten
          </p>
          <ul className="mt-2 space-y-2">
            {BERICHTEN.map((m) => (
              <li key={m.van}>
                <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#f7f9fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                    style={{ background: C.lineSoft, color: C.inkSoft, ...head }}
                  >
                    {m.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-bold" style={head}>
                        {m.van}
                      </span>
                      <span className="shrink-0 text-[11px]" style={{ color: C.faint }}>
                        {m.tijd}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 line-clamp-1 block text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      {m.preview}
                    </span>
                  </span>
                  {m.ongelezen && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onClose}
          className="mt-5 h-12 w-full rounded-2xl border text-[15px] font-bold transition-colors hover:bg-[#f7f9fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
          style={{ borderColor: C.line, color: C.inkSoft, ...head }}
        >
          Sluiten
        </button>
      </div>
    </Sheet>
  );
}

// ── Kaart-primitief ────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-3xl border ${className}`}
      style={{ background: C.surface, borderColor: C.line, ...style }}
    >
      {children}
    </div>
  );
}

function OpdrachtCard({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-3xl border p-4 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] active:scale-[0.985] motion-reduce:active:scale-100"
      style={{ background: C.surface, borderColor: C.line }}
    >
      <div className="flex items-start gap-3">
        <MatchRing value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] font-extrabold leading-snug tracking-tight" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[12.5px]" style={{ color: C.muted }}>
            <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {opdracht.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: C.lineSoft, color: C.inkSoft }}
          >
            {t}
          </span>
        ))}
      </div>
      <div
        className="mt-3 flex items-center justify-between border-t pt-3"
        style={{ borderColor: C.line }}
      >
        <span className="text-[15px] font-extrabold tabular-nums" style={head}>
          {opdracht.tarief}
        </span>
        <span
          className="flex items-center gap-1 text-[12.5px] font-bold"
          style={{ color: C.accentInk }}
        >
          Bekijken <ChevronRight size={15} aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function Dashboard({
  onOpen,
  onGo,
  onSheet,
}: {
  onOpen: () => void;
  onGo: (s: ScreenKey) => void;
  onSheet: () => void;
}) {
  const urgent =
    ACTIES.find((a) => a.urgentie === "warning") ?? (ACTIES[0] as (typeof ACTIES)[number]);
  return (
    <div className="space-y-5">
      {/* Groet */}
      <div>
        <p className="text-[13px] font-semibold" style={{ color: C.muted }}>
          Goedemorgen,
        </p>
        <h2 className="text-[24px] font-extrabold leading-tight tracking-tight" style={head}>
          {PROFIEL.naam.split(" ")[0]} 👋
        </h2>
      </div>

      {/* KPI's — horizontale snap-stroom */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {KPIS.map((k) => (
          <Card key={k.label} className="w-[150px] shrink-0 snap-start p-4">
            <p
              className="text-[11.5px] font-semibold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {k.label}
            </p>
            <p
              className="mt-2 text-[24px] font-extrabold tabular-nums leading-none tracking-tight"
              style={head}
            >
              {k.value}
            </p>
            <p
              className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums"
              style={{
                background: k.up ? C.successSoft : C.warnSoft,
                color: k.up ? C.success : C.warn,
              }}
            >
              {k.up ? (
                <TrendingUp size={13} aria-hidden="true" />
              ) : (
                <TrendingDown size={13} aria-hidden="true" />
              )}
              {k.trend}
            </p>
          </Card>
        ))}
      </div>

      {/* Volgende actie — accent-kaart */}
      <div
        className="overflow-hidden rounded-3xl p-4"
        style={{
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentInk})`,
          color: "#ffffff",
        }}
      >
        <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-white/85">
          <Sparkles size={14} aria-hidden="true" /> Volgende beste actie
        </p>
        <h3 className="mt-2 text-[17px] font-extrabold leading-snug" style={head}>
          {urgent.titel}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-white/85">{urgent.detail}</p>
        <button
          onClick={onSheet}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-bold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 motion-reduce:active:scale-100"
          style={{ color: C.accentInk, ...head }}
        >
          {urgent.cta} <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Beste matches */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-[15px] font-extrabold tracking-tight" style={head}>
            Beste matches
          </h3>
          <button
            onClick={() => onGo("marktplaats")}
            className="flex items-center gap-0.5 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
            style={{ color: C.accentInk }}
          >
            Alles <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <OpdrachtCard key={o.id} opdracht={o} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────────

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"alle" | "top">("alle");
  const base = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const filtered = scope === "top" ? base.filter((o) => o.match >= 85) : base;

  return (
    <div className="space-y-4">
      {/* Zoek */}
      <div
        className="flex items-center gap-2.5 rounded-2xl border px-4 py-3 focus-within:ring-2 focus-within:ring-[#0ea5e9]"
        style={{ background: C.surface, borderColor: C.line }}
      >
        <Search size={18} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek opdracht, plaats of klant"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#94a3b8]"
          style={{ color: C.ink }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Zoekopdracht wissen"
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[#f0f4f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Segmented control */}
      <div className="flex rounded-2xl p-1" style={{ background: C.lineSoft }}>
        {(
          [
            { k: "alle", l: "Alle opdrachten" },
            { k: "top", l: "Boven 85%" },
          ] as const
        ).map((s) => {
          const on = scope === s.k;
          return (
            <button
              key={s.k}
              onClick={() => setScope(s.k)}
              aria-pressed={on}
              className="flex-1 rounded-xl py-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
              style={{
                background: on ? C.surface : "transparent",
                color: on ? C.ink : C.muted,
                boxShadow: on ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                ...head,
              }}
            >
              {s.l}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-3xl border py-14 text-center"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.accentSoft }}
          >
            <Search size={24} aria-hidden="true" style={{ color: C.accentInk }} />
          </div>
          <p className="mt-4 text-[16px] font-extrabold tracking-tight" style={head}>
            Niets gevonden
          </p>
          <p
            className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed"
            style={{ color: C.muted }}
          >
            {scope === "top"
              ? "Geen opdrachten boven 85% voor deze zoekopdracht."
              : `Geen opdrachten voor "${q}".`}
          </p>
          <button
            onClick={() => {
              setQ("");
              setScope("alle");
            }}
            className="mt-4 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
            style={{ background: C.accent, ...head }}
          >
            Wis filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="px-1 text-[12.5px] font-semibold" style={{ color: C.muted }}>
            {filtered.length} van {OPDRACHTEN.length} opdrachten
          </p>
          {filtered.map((o) => (
            <OpdrachtCard key={o.id} opdracht={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────

function OpdrachtDetail({ opdracht, onReageer }: { opdracht: Opdracht; onReageer: () => void }) {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <MatchRing value={opdracht.match} size={64} stroke={6} />
          <div className="min-w-0 flex-1">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: C.accentSoft, color: C.accentInk }}
            >
              {opdracht.id}
            </span>
            <h2
              className="mt-2 text-[19px] font-extrabold leading-tight tracking-tight"
              style={head}
            >
              {opdracht.titel}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-[13px]" style={{ color: C.muted }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
      </Card>

      {/* Kerncijfers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
          { l: "Omvang", v: opdracht.uren.replace(" u/week", "u") },
          { l: "Start", v: opdracht.start.replace("Per ", "") },
        ].map((m) => (
          <Card key={m.l} className="p-3 text-center">
            <p
              className="text-[10.5px] font-semibold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[16px] font-extrabold tabular-nums" style={head}>
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {opdracht.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.inkSoft }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Redenen */}
      <Card className="p-5">
        <h3 className="text-[15px] font-extrabold tracking-tight" style={head}>
          Waarom deze match
        </h3>
        <div className="mt-3">
          <p
            className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide"
            style={{ color: C.success }}
          >
            <CheckCircle2 size={15} aria-hidden="true" /> Pluspunten
          </p>
          <ul className="mt-2 space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13.5px]">
                <Plus
                  size={16}
                  aria-hidden="true"
                  style={{ color: C.success, marginTop: 1, flexShrink: 0 }}
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <p
            className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide"
            style={{ color: C.warn }}
          >
            <AlertTriangle size={15} aria-hidden="true" /> Aandachtspunten
          </p>
          <ul className="mt-2 space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ color: C.inkSoft }}
              >
                <Minus
                  size={16}
                  aria-hidden="true"
                  style={{ color: C.warn, marginTop: 1, flexShrink: 0 }}
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 -mx-4 px-4 pb-1 pt-2">
        <button
          onClick={onReageer}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15.5px] font-bold text-white shadow-[0_10px_30px_-8px_rgba(14,165,233,0.6)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] active:scale-[0.98] motion-reduce:active:scale-100"
          style={{ background: C.accent, ...head }}
        >
          Reageer op opdracht <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      {/* Trust-kaart */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <MatchRing value={pct} size={64} stroke={6} />
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
              style={{ background: C.successSoft, color: C.success }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <p className="mt-2 text-[14px] leading-snug" style={{ color: C.inkSoft }}>
              <span className="font-extrabold tabular-nums" style={head}>
                {verified}
              </span>{" "}
              van{" "}
              <span className="font-extrabold tabular-nums" style={head}>
                {CREDENTIALS.length}
              </span>{" "}
              credentials geverifieerd.
            </p>
          </div>
        </div>
      </Card>

      {/* Credential-lijst */}
      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <Card key={c.naam} className="flex items-center gap-3 p-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: st.bg, color: st.fg }}
              >
                <st.Icon size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold" style={head}>
                  {c.naam}
                </p>
                <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ background: st.bg, color: st.fg }}
              >
                {st.label}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.warn, bg: C.warnSoft, Icon: AlertTriangle },
    info: { fg: C.accentInk, bg: C.accentSoft, Icon: Bell },
  };
  return (
    <div className="space-y-3">
      <p className="px-1 text-[13px]" style={{ color: C.muted }}>
        Op volgorde van urgentie.
      </p>
      {ACTIES.map((a) => {
        const t = tone[a.urgentie];
        return (
          <Card key={a.titel} className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: t.bg, color: t.fg }}
              >
                <t.Icon size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[14.5px] font-extrabold leading-snug tracking-tight"
                  style={head}
                >
                  {a.titel}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
            </div>
            <button
              className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
              style={
                a.urgentie === "warning"
                  ? { background: C.warn, color: "#ffffff", ...head }
                  : { background: C.accentSoft, color: C.accentInk, ...head }
              }
            >
              {a.cta} <ChevronRight size={16} aria-hidden="true" />
            </button>
          </Card>
        );
      })}
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.success, bg: C.successSoft },
    Openstaand: { fg: C.warn, bg: C.warnSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  return (
    <div className="space-y-4">
      {/* Samenvatting */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p
            className="text-[11.5px] font-semibold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            Omzet deze maand
          </p>
          <p className="mt-1.5 text-[22px] font-extrabold tabular-nums leading-none" style={head}>
            € 8.240
          </p>
        </Card>
        <Card className="p-4">
          <p
            className="text-[11.5px] font-semibold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-1.5 text-[22px] font-extrabold tabular-nums leading-none"
            style={{ ...head, color: C.warn }}
          >
            € 1.350
          </p>
        </Card>
      </div>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]"
        style={{ background: C.accent, ...head }}
      >
        <Plus size={18} aria-hidden="true" /> Nieuwe factuur
      </button>

      {/* Facturenlijst */}
      <div className="space-y-2.5">
        {FACTUREN.map((f) => {
          const t = statusTone[f.status] ?? { fg: C.muted, bg: C.lineSoft };
          return (
            <Card key={f.nr} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-bold" style={head}>
                    {f.klant}
                  </p>
                </div>
                <p className="mt-0.5 text-[11.5px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr} · {f.datum}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[15px] font-extrabold tabular-nums" style={head}>
                  {f.bedrag}
                </p>
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                  style={{ background: t.bg, color: t.fg }}
                >
                  {f.status}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
