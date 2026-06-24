"use client";

// Concept 07 — "Klare Taal": high-contrast leesbaarheid als luxe (WCAG-AAA als esthetiek).
// Richting: leesbaarheid is hier het premium-signaal — ideaal voor de zorg/AVG-doelgroep.
// Zuiver wit, diepe inkt, één diepblauw accent. Grote body-tekst, royale regelafstand,
// dikke en zeer zichtbare focus-ringen (3px + offset), tikdoelen van minimaal 44px.
// Status draagt ALTIJD icoon + tekstlabel én een extra niet-kleur-signaal (onderstreping/patroon).
// prefers-reduced-motion wordt overal gerespecteerd via motion-reduce:-varianten.
// Frontend-only, mock-data. Zelfstandige mini-app: rail + topbar + interne schermtabs.

import { useState } from "react";
import {
  Search,
  Bell,
  BadgeCheck,
  CircleCheck,
  TriangleAlert,
  Clock3,
  CircleX,
  ShieldCheck,
  ArrowRight,
  Bookmark,
  LayoutDashboard,
  Store,
  FileCheck2,
  ListChecks,
  Receipt,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  SCREENS,
  type ScreenKey,
  type CredStatus,
} from "./mock";

// --- Palet: hoog contrast, kalm ---
const C = {
  paper: "#ffffff",
  ink: "#0a0a0a",
  sub: "#3f3f46",
  faint: "#71717a",
  line: "#d4d4d8",
  panel: "#f4f4f5",
  accent: "#1d4ed8",
  accentDark: "#1e40af",
  verified: "#15803d",
  expiring: "#b45309",
  rejected: "#b91c1c",
};

const text = { fontFamily: "var(--font-lab-manrope)" } as const;
const num = { fontFamily: "var(--font-lab-mono)" } as const;

// Zeer zichtbare, dikke focus-ring — toegankelijkheid die premium oogt.
const ring =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-[#1d4ed8]";

const SCREEN_ICON: Record<ScreenKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: FileCheck2,
  verificatie: ShieldCheck,
  documenten: FileCheck2,
  facturen: Receipt,
  berichten: Bell,
  acties: ListChecks,
};

export function Concept07() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...text, color: C.ink, background: C.paper }}
      className="flex min-h-[640px] w-full text-[15px] leading-relaxed antialiased [color-scheme:light]"
    >
      {/* Rail */}
      <aside
        className="hidden w-[228px] shrink-0 flex-col border-r md:flex"
        style={{ borderColor: C.line }}
      >
        <div className="flex items-center gap-3 border-b px-5 py-5" style={{ borderColor: C.line }}>
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-extrabold text-white"
            style={{ background: C.ink }}
          >
            Z
          </span>
          <span className="text-[15px] font-bold tracking-tight">ZorgBemiddeling</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const active = s.key === screen;
            const Icon = SCREEN_ICON[s.key];
            return (
              <button
                key={s.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setScreen(s.key)}
                style={active ? { background: C.ink, color: C.paper } : undefined}
                className={[
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-left text-[15px] font-semibold transition-colors duration-150 motion-reduce:transition-none",
                  ring,
                  active ? "" : "text-[#3f3f46] hover:bg-[#f4f4f5]",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden strokeWidth={2.25} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border-2 p-4" style={{ borderColor: C.expiring }}>
          <div className="flex items-center gap-2">
            <TriangleAlert
              className="h-[18px] w-[18px] shrink-0"
              style={{ color: C.expiring }}
              aria-hidden
              strokeWidth={2.5}
            />
            <span className="text-[13px] font-bold uppercase tracking-wide">VOG verloopt</span>
          </div>
          <p className="mt-2 text-[14px] leading-snug" style={{ color: C.sub }}>
            Nog <span className="font-bold">23 dagen</span> geldig. Vernieuw op tijd om
            verifieerbaar te blijven.
          </p>
          <button
            type="button"
            onClick={() => setScreen("acties")}
            style={{ color: C.accentDark }}
            className={[
              "mt-2 inline-flex min-h-[44px] items-center text-[14px] font-bold underline decoration-2 underline-offset-4",
              ring,
            ].join(" ")}
          >
            VOG vernieuwen
          </button>
        </div>
      </aside>

      {/* Rechts */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          className="flex items-center gap-3 border-b px-4 py-3 sm:px-6"
          style={{ borderColor: C.line }}
        >
          <button
            type="button"
            style={{ borderColor: C.line, color: C.faint }}
            className={[
              "flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-lg border-2 px-3 text-left text-[15px] transition-colors hover:border-[#0a0a0a] motion-reduce:transition-none sm:max-w-md",
              ring,
            ].join(" ")}
          >
            <Search className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2.25} />
            <span className="truncate">Zoek opdracht, document of factuur…</span>
          </button>

          <button
            type="button"
            aria-label="Meldingen"
            style={{ borderColor: C.line }}
            className={[
              "relative flex h-11 w-11 items-center justify-center rounded-lg border-2 transition-colors hover:bg-[#f4f4f5] motion-reduce:transition-none",
              ring,
            ].join(" ")}
          >
            <Bell className="h-5 w-5" aria-hidden strokeWidth={2.25} />
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ background: C.accent }}
              aria-hidden
            />
          </button>

          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-[13px] font-bold"
              style={{ borderColor: C.ink }}
            >
              {PROFIEL.initialen}
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[14px] font-bold">{PROFIEL.naam}</div>
              <div className="text-[13px]" style={{ color: C.faint }}>
                {PROFIEL.rol}
              </div>
            </div>
          </div>
        </header>

        {/* Schermtabs */}
        <div className="border-b" style={{ borderColor: C.line }}>
          <div
            className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const active = s.key === screen;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScreen(s.key)}
                  style={active ? { background: C.ink, color: C.paper } : { color: C.sub }}
                  className={[
                    "min-h-[44px] shrink-0 rounded-full px-4 text-[14px] font-bold transition-colors duration-150 motion-reduce:transition-none",
                    ring,
                    active ? "" : "hover:bg-[#f4f4f5]",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <Opdracht />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border-2 p-4" style={{ borderColor: C.line }}>
            <div
              className="text-[13px] font-bold uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {kpi.label}
            </div>
            <div style={num} className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">
              {kpi.value}
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold tabular-nums"
              style={{ color: kpi.up ? C.verified : C.faint }}
            >
              <span aria-hidden>{kpi.up ? "↑" : "•"}</span>
              <span>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-[18px] font-bold tracking-tight">Aanbevolen opdrachten</h2>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={onOpen}
                style={{ borderColor: C.line }}
                className={[
                  "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors hover:border-[#0a0a0a] motion-reduce:transition-none",
                  ring,
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold">{o.titel}</div>
                  <div className="mt-1 text-[14px]" style={{ color: C.sub }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </div>
                </div>
                <span
                  style={{ ...num, color: C.accentDark }}
                  className="shrink-0 text-[20px] font-extrabold tabular-nums"
                >
                  {o.match}%
                </span>
                <ArrowRight
                  className="h-5 w-5 shrink-0"
                  style={{ color: C.faint }}
                  aria-hidden
                  strokeWidth={2.5}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-bold tracking-tight">Wat vraagt je aandacht</h2>
        <ul className="space-y-3">
          {ACTIES.map((a) => {
            const warn = a.urgentie === "warning";
            return (
              <li
                key={a.titel}
                className="flex items-start gap-3 rounded-xl border-2 p-4"
                style={{ borderColor: warn ? C.expiring : C.line }}
              >
                {warn ? (
                  <TriangleAlert
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{ color: C.expiring }}
                    aria-hidden
                    strokeWidth={2.5}
                  />
                ) : (
                  <Clock3
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{ color: C.faint }}
                    aria-hidden
                    strokeWidth={2.5}
                  />
                )}
                <div className="min-w-0">
                  <div className="text-[15px] font-bold">{a.titel}</div>
                  <p className="mt-0.5 text-[14px] leading-snug" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [actief, setActief] = useState(0);
  const filters = ["Alle opdrachten", "85% of hoger", "Utrecht", "Avonddienst"];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        {filters.map((f, i) => {
          const on = i === actief;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActief(i)}
              style={
                on ? { background: C.ink, color: C.paper } : { borderColor: C.line, color: C.sub }
              }
              className={[
                "min-h-[44px] rounded-full px-4 text-[14px] font-bold transition-colors motion-reduce:transition-none",
                ring,
                on ? "" : "border-2 hover:border-[#0a0a0a]",
              ].join(" ")}
            >
              {f}
            </button>
          );
        })}
      </div>

      <ul className="space-y-3">
        {OPDRACHTEN.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={onOpen}
              style={{ borderColor: C.line }}
              className={[
                "flex w-full flex-col gap-3 rounded-xl border-2 p-4 text-left transition-colors hover:border-[#0a0a0a] motion-reduce:transition-none sm:flex-row sm:items-center",
                ring,
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold">{o.titel}</div>
                <div className="mt-1 text-[14px]" style={{ color: C.sub }}>
                  {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border px-2 py-1 text-[12px] font-bold"
                      style={{ borderColor: C.line, color: C.sub }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span
                style={{ ...num, color: C.accentDark }}
                className="shrink-0 self-start text-[20px] font-extrabold tabular-nums sm:self-center"
              >
                {o.match}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function Opdracht() {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div style={{ ...num, color: C.faint }} className="text-[13px] font-bold tabular-nums">
            {o.id}
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{o.titel}</h2>
          <div className="mt-2 text-[15px]" style={{ color: C.sub }}>
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </div>
        </div>
        <div
          className="shrink-0 rounded-xl border-2 px-4 py-3 text-center"
          style={{ borderColor: C.accent }}
        >
          <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color: C.faint }}>
            Match
          </div>
          <div
            style={{ ...num, color: C.accentDark }}
            className="text-3xl font-extrabold tabular-nums"
          >
            {o.match}%
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-2 p-4" style={{ borderColor: C.line }}>
          <div className="mb-3 flex items-center gap-2">
            <CircleCheck
              className="h-5 w-5"
              style={{ color: C.verified }}
              aria-hidden
              strokeWidth={2.5}
            />
            <h3 className="text-[15px] font-bold">Waarom dit past</h3>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[14px]" style={{ color: C.sub }}>
                <CircleCheck
                  className="mt-0.5 h-[18px] w-[18px] shrink-0"
                  style={{ color: C.verified }}
                  aria-hidden
                  strokeWidth={2.5}
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border-2 p-4" style={{ borderColor: C.line }}>
          <div className="mb-3 flex items-center gap-2">
            <TriangleAlert
              className="h-5 w-5"
              style={{ color: C.expiring }}
              aria-hidden
              strokeWidth={2.5}
            />
            <h3 className="text-[15px] font-bold">Let op</h3>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[14px]" style={{ color: C.sub }}>
                <TriangleAlert
                  className="mt-0.5 h-[18px] w-[18px] shrink-0"
                  style={{ color: C.expiring }}
                  aria-hidden
                  strokeWidth={2.5}
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          style={{ background: C.accent }}
          className={[
            "inline-flex min-h-[48px] items-center gap-2 rounded-lg px-5 text-[15px] font-bold text-white transition-colors hover:bg-[#1e40af] motion-reduce:transition-none",
            ring,
          ].join(" ")}
        >
          Reageer op deze opdracht
          <ArrowRight className="h-5 w-5" aria-hidden strokeWidth={2.5} />
        </button>
        <button
          type="button"
          style={{ borderColor: C.line }}
          className={[
            "inline-flex min-h-[48px] items-center gap-2 rounded-lg border-2 px-5 text-[15px] font-bold transition-colors hover:border-[#0a0a0a] motion-reduce:transition-none",
            ring,
          ].join(" ")}
        >
          <Bookmark className="h-5 w-5" aria-hidden strokeWidth={2.5} />
          Bewaar
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

const STATUS: Record<
  CredStatus,
  { label: string; color: string; Icon: typeof CircleCheck; underline: string }
> = {
  VERIFIED: { label: "Geverifieerd", color: C.verified, Icon: CircleCheck, underline: "solid" },
  EXPIRING: {
    label: "Verloopt binnenkort",
    color: C.expiring,
    Icon: TriangleAlert,
    underline: "dashed",
  },
  SUBMITTED: { label: "In beoordeling", color: C.faint, Icon: Clock3, underline: "dotted" },
  REJECTED: { label: "Afgewezen", color: C.rejected, Icon: CircleX, underline: "wavy" },
};

function StatusLabel({ status }: { status: CredStatus }) {
  const s = STATUS[status];
  // Status nooit kleur-alleen: icoon + tekst + onderstrepingspatroon als extra signaal.
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[13px] font-bold"
      style={{
        color: s.color,
        textDecorationLine: "underline",
        textDecorationStyle: s.underline as React.CSSProperties["textDecorationStyle"],
        textDecorationThickness: 2,
        textUnderlineOffset: 3,
      }}
    >
      <s.Icon className="h-[18px] w-[18px]" aria-hidden strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

function Verificatie() {
  return (
    <div className="space-y-5">
      <div
        className="flex items-center gap-3 rounded-xl border-2 p-4"
        style={{ borderColor: C.verified }}
      >
        <ShieldCheck
          className="h-6 w-6 shrink-0"
          style={{ color: C.verified }}
          aria-hidden
          strokeWidth={2.5}
        />
        <div className="min-w-0">
          <div className="text-[16px] font-bold">Vertrouwensniveau: Hoog</div>
          <p className="text-[14px]" style={{ color: C.sub }}>
            3 van 4 documenten zijn geverifieerd. Opdrachtgevers zien dit als een sterk profiel.
          </p>
        </div>
        <span
          className="ml-auto hidden shrink-0 rounded-full px-3 py-1 text-[12px] font-bold text-white sm:inline"
          style={{ background: C.verified }}
        >
          {PROFIEL.trust}
        </span>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const s = STATUS[c.status];
          return (
            <li
              key={c.naam}
              className="flex items-center gap-4 rounded-xl border-2 p-4"
              style={{ borderColor: C.line }}
            >
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2"
                style={{ borderColor: s.color, color: s.color }}
              >
                <s.Icon className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">{c.naam}</div>
                <div className="text-[14px]" style={{ color: C.sub }}>
                  {c.detail}
                </div>
              </div>
              <div className="shrink-0">
                <StatusLabel status={c.status} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function Acties() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-3">
      <h2 className="text-[18px] font-bold tracking-tight">Volgende beste acties</h2>
      <ul className="space-y-3">
        {ordered.map((a) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="flex items-start gap-3 rounded-xl border-2 p-4"
              style={{ borderColor: warn ? C.expiring : C.line }}
            >
              {warn ? (
                <TriangleAlert
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: C.expiring }}
                  aria-hidden
                  strokeWidth={2.5}
                />
              ) : (
                <Clock3
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: C.faint }}
                  aria-hidden
                  strokeWidth={2.5}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">{a.titel}</div>
                <p className="mt-0.5 text-[14px] leading-snug" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                style={{ color: warn ? C.expiring : C.accentDark }}
                className={[
                  "inline-flex min-h-[44px] shrink-0 items-center text-[14px] font-bold underline decoration-2 underline-offset-4",
                  ring,
                ].join(" ")}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FactuurStatus({ status }: { status: string }) {
  const cfg: Record<string, { color: string; Icon: typeof CircleCheck }> = {
    Betaald: { color: C.verified, Icon: BadgeCheck },
    Openstaand: { color: C.expiring, Icon: Clock3 },
    Concept: { color: C.faint, Icon: FileCheck2 },
  };
  const c = cfg[status] ?? { color: C.faint, Icon: FileCheck2 };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[12px] font-bold"
      style={{ color: c.color, borderColor: c.color }}
    >
      <c.Icon className="h-4 w-4" aria-hidden strokeWidth={2.5} />
      {status}
    </span>
  );
}

function Facturen() {
  return (
    <div className="overflow-hidden rounded-xl border-2" style={{ borderColor: C.line }}>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Overzicht van je facturen</caption>
        <thead>
          <tr style={{ background: C.panel }}>
            <th scope="col" className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide">
              Nummer
            </th>
            <th scope="col" className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide">
              Klant
            </th>
            <th scope="col" className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide">
              Datum
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-[13px] font-bold uppercase tracking-wide"
            >
              Bedrag
            </th>
            <th scope="col" className="px-4 py-3 text-[13px] font-bold uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {FACTUREN.map((f) => (
            <tr key={f.nr} className="border-t-2" style={{ borderColor: C.line }}>
              <td style={num} className="px-4 py-3.5 text-[14px] font-bold tabular-nums">
                {f.nr}
              </td>
              <td className="px-4 py-3.5 text-[15px]">{f.klant}</td>
              <td style={num} className="px-4 py-3.5 text-[14px] tabular-nums">
                <span style={{ color: C.sub }}>{f.datum}</span>
              </td>
              <td
                style={num}
                className="px-4 py-3.5 text-right text-[15px] font-extrabold tabular-nums"
              >
                {f.bedrag}
              </td>
              <td className="px-4 py-3.5">
                <FactuurStatus status={f.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
