"use client";

// Concept 10 — "Maan": refined minimal dark (quiet luxury).
// Near-black surfaces, hairline borders, tabular mono numbers, generous negative space.
// A soft blue accent appears VERY sparingly — only on the single most important element
// per screen. No glow, no glass, no gradient. Flat surfaces + hairlines + restraint.
// Self-contained mini-app, mock data only.

import { useState } from "react";
import { Check, AlertTriangle, Clock, X, ArrowUpRight, ArrowLeft, Bookmark } from "lucide-react";
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
  type Opdracht,
} from "./mock";

const text = { fontFamily: "var(--font-lab-geist)" } as const;
const mono = { fontFamily: "var(--font-lab-geist-mono)" } as const;

const ACCENT = "#93a4ff";
const BG = "#0a0a0c";
const HAIR = "rgba(255,255,255,0.08)";

/* ----------------------------------------------------------------- primitives */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={mono}
      className="text-[10px] uppercase tabular-nums tracking-[0.18em] text-white/35"
    >
      {children}
    </span>
  );
}

function Sparkline({ data, accent }: { data: number[]; accent?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 64;
  const h = 20;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={accent ? ACCENT : "rgba(255,255,255,0.3)"}
        strokeWidth="1.5"
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

function StatusSeal({ status }: { status: CredStatus }) {
  const map: Record<CredStatus, { cls: string; icon: typeof Check }> = {
    VERIFIED: { cls: "border-white/15 text-white/80", icon: Check },
    EXPIRING: { cls: "border-amber-400/30 text-amber-300/90", icon: AlertTriangle },
    SUBMITTED: { cls: "border-white/10 text-white/40", icon: Clock },
    REJECTED: { cls: "border-red-400/30 text-red-300/90", icon: X },
  };
  const c = map[status];
  const Icon = c.icon;
  return (
    <span
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
        c.cls,
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

/* ----------------------------------------------------------------- top-level */

export function Concept10() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0]!);

  function openOpdracht(o: Opdracht) {
    setActive(o);
    setScreen("opdracht");
  }

  return (
    <div
      style={{ ...text, backgroundColor: BG }}
      className="flex min-h-[640px] w-full flex-col text-white/90 antialiased [color-scheme:dark]"
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: `1px solid ${HAIR}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-medium"
            style={{ borderColor: HAIR }}
            aria-hidden
          >
            ◐
          </span>
          <span className="text-[14px] font-medium tracking-tight">Maan</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[12px] font-medium">{PROFIEL.naam}</div>
            <div style={mono} className="text-[10px] tabular-nums text-white/35">
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            style={mono}
            className="flex h-8 w-8 items-center justify-center rounded-full border text-[11px] tabular-nums text-white/70"
            aria-hidden
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="flex gap-7 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${HAIR}` }}
      >
        {SCREENS.map((s) => {
          const isActive = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setScreen(s.key)}
              className={[
                "relative shrink-0 py-3.5 text-[13px] transition-colors duration-200 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0",
                isActive ? "text-white" : "text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {s.label}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px transition-colors duration-200 motion-reduce:transition-none"
                style={{ backgroundColor: isActive ? "rgba(255,255,255,0.85)" : "transparent" }}
              />
            </button>
          );
        })}
      </div>

      {/* Main */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8 sm:py-10">
        {screen === "dashboard" && <DashboardScreen onOpen={openOpdracht} />}
        {screen === "marktplaats" && <MarktplaatsScreen onOpen={openOpdracht} />}
        {screen === "opdracht" && (
          <OpdrachtScreen o={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <VerificatieScreen />}
        {screen === "acties" && <ActiesScreen />}
        {screen === "facturen" && <FacturenScreen />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  return (
    <div className="space-y-12">
      <section>
        <Eyebrow>Overzicht</Eyebrow>
        <div
          className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl lg:grid-cols-4"
          style={{ backgroundColor: HAIR }}
        >
          {KPIS.map((kpi, i) => (
            <div key={kpi.label} className="p-5" style={{ backgroundColor: BG }}>
              <div className="text-[11px] text-white/40">{kpi.label}</div>
              <div
                style={mono}
                className={[
                  "mt-2.5 text-[22px] font-medium tabular-nums tracking-tight",
                  i === 0 ? "" : "text-white/90",
                ].join(" ")}
              >
                {i === 0 ? <span style={{ color: ACCENT }}>{kpi.value}</span> : kpi.value}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span style={mono} className="text-[10px] tabular-nums text-white/35">
                  {kpi.trend}
                </span>
                <Sparkline data={kpi.spark} accent={i === 0} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <Eyebrow>Aanbevolen</Eyebrow>
          <span style={mono} className="text-[10px] tabular-nums text-white/30">
            Top 3
          </span>
        </div>
        <div
          className="mt-5 space-y-px overflow-hidden rounded-xl"
          style={{ backgroundColor: HAIR }}
        >
          {OPDRACHTEN.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onOpen(o)}
              className="flex w-full items-center gap-5 px-5 py-4 text-left transition-colors duration-150 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/20 motion-reduce:transition-none"
              style={{ backgroundColor: BG }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium tracking-tight">{o.titel}</div>
                <div style={mono} className="mt-1 truncate text-[11px] tabular-nums text-white/35">
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <span
                style={mono}
                className="shrink-0 text-[14px] font-medium tabular-nums text-white/70"
              >
                {o.match}
                <span className="text-white/30">%</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25" aria-hidden />
            </button>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>Acties</Eyebrow>
        <div className="mt-5 space-y-3.5">
          {ACTIES.map((a) => (
            <div key={a.titel} className="flex items-start gap-3 text-[13px]">
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    a.urgentie === "warning" ? "rgba(252,211,77,0.8)" : "rgba(255,255,255,0.2)",
                }}
              />
              <p className="leading-relaxed text-white/55">
                <span className="font-medium text-white/90">{a.titel}</span> — {a.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const filters = ["Alle", "≥85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  const visible = OPDRACHTEN.filter((o) => (active === 1 ? o.match >= 85 : true));

  return (
    <div className="space-y-7">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[18px] font-medium tracking-tight">Marktplaats</h1>
        <span style={mono} className="text-[11px] tabular-nums text-white/35">
          {visible.length} resultaten
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === i}
            onClick={() => setActive(i)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-[12px] transition-colors duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              active === i
                ? "border-white/25 bg-white/[0.06] text-white"
                : "border-white/10 text-white/45 hover:border-white/20 hover:text-white/70",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div
          className="rounded-xl border border-dashed py-16 text-center"
          style={{ borderColor: HAIR }}
        >
          <p className="text-[13px] text-white/40">Geen opdrachten in deze filter.</p>
        </div>
      ) : (
        <div className="space-y-px overflow-hidden rounded-xl" style={{ backgroundColor: HAIR }}>
          {visible.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onOpen(o)}
              className="flex w-full flex-col gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/20 motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-5"
              style={{ backgroundColor: BG }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium tracking-tight">{o.titel}</div>
                <div style={mono} className="mt-1 truncate text-[11px] tabular-nums text-white/35">
                  {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border px-1.5 py-0.5 text-[10px] text-white/45"
                      style={{ borderColor: HAIR }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span
                style={mono}
                className="shrink-0 self-start text-[14px] font-medium tabular-nums text-white/70 sm:self-center"
              >
                {o.match}
                <span className="text-white/30">%</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen({ o, onBack }: { o: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] text-white/45 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Marktplaats
      </button>

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Eyebrow>{o.id}</Eyebrow>
          <h1 className="mt-2 text-[22px] font-medium leading-tight tracking-tight">{o.titel}</h1>
          <div style={mono} className="mt-2 text-[12px] tabular-nums text-white/40">
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Eyebrow>Match</Eyebrow>
          <div
            style={{ ...mono, color: ACCENT }}
            className="mt-1 text-[34px] font-medium tabular-nums leading-none"
          >
            {o.match}%
          </div>
        </div>
      </div>

      <div
        className="grid gap-px overflow-hidden rounded-xl sm:grid-cols-2"
        style={{ backgroundColor: HAIR }}
      >
        <div className="p-5" style={{ backgroundColor: BG }}>
          <div className="mb-4 flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-white/55" aria-hidden />
            <Eyebrow>Waarom dit past</Eyebrow>
          </div>
          <ul className="space-y-3">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13px] text-white/75">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/45" aria-hidden />
                <span className="leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={{ backgroundColor: BG }}>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-300/80" aria-hidden />
            <Eyebrow>Let op</Eyebrow>
          </div>
          <ul className="space-y-3">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13px] text-white/75">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/70"
                  aria-hidden
                />
                <span className="leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setApplied(true)}
          aria-pressed={applied}
          className={[
            "rounded-lg px-5 py-2.5 text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]",
            applied ? "text-white/90" : "text-[#0a0a0c] hover:brightness-95",
          ].join(" ")}
          style={
            applied
              ? { backgroundColor: "rgba(255,255,255,0.08)" }
              : { backgroundColor: ACCENT, ["--tw-ring-color" as string]: ACCENT }
          }
        >
          {applied ? "Gereageerd ✓" : "Reageer op opdracht"}
        </button>
        <button
          type="button"
          aria-pressed={saved}
          onClick={() => setSaved((s) => !s)}
          className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[13px] font-medium text-white/75 transition-colors duration-150 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 motion-reduce:transition-none"
          style={{ borderColor: HAIR }}
        >
          <Bookmark
            className={["h-3.5 w-3.5", saved ? "fill-white/70" : ""].join(" ")}
            aria-hidden
          />
          {saved ? "Bewaard" : "Bewaar"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

function VerificatieScreen() {
  return (
    <div className="space-y-8">
      <div
        className="flex items-center gap-3 rounded-xl border px-5 py-4"
        style={{ borderColor: HAIR }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          <Check className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <div className="text-[14px] font-medium" style={{ color: ACCENT }}>
            {PROFIEL.trust}
          </div>
          <div style={mono} className="text-[11px] tabular-nums text-white/40">
            3 van 4 documenten geverifieerd
          </div>
        </div>
      </div>

      <div>
        <Eyebrow>Documenten</Eyebrow>
        <div
          className="mt-5 space-y-px overflow-hidden rounded-xl"
          style={{ backgroundColor: HAIR }}
        >
          {CREDENTIALS.map((c) => (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-5 py-4"
              style={{ backgroundColor: BG }}
            >
              <StatusSeal status={c.status} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{c.naam}</div>
                <div className="truncate text-[11px] text-white/40">{c.detail}</div>
              </div>
              <span
                style={mono}
                className="shrink-0 text-[10px] uppercase tabular-nums tracking-[0.12em] text-white/35"
              >
                {STATUS_LABEL[c.status]}
              </span>
            </div>
          ))}
        </div>
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
      <Eyebrow>Volgende acties</Eyebrow>
      <div className="space-y-3 pt-2">
        {ordered.map((a, idx) => {
          const warning = a.urgentie === "warning";
          // The single most important action (first, warning) gets the lone accent.
          const primary = idx === 0 && warning;
          return (
            <div
              key={a.titel}
              className="rounded-xl border p-5"
              style={{ borderColor: primary ? "rgba(147,164,255,0.3)" : HAIR }}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: warning ? "rgba(252,211,77,0.3)" : HAIR,
                    color: warning ? "rgba(252,211,77,0.9)" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {warning ? (
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{a.titel}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/50">{a.detail}</p>
                </div>
                <button
                  type="button"
                  className={[
                    "shrink-0 rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                    primary
                      ? "text-[#0a0a0c] hover:brightness-95"
                      : "border text-white/70 hover:bg-white/[0.04]",
                  ].join(" ")}
                  style={primary ? { backgroundColor: ACCENT } : { borderColor: HAIR }}
                >
                  {a.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FacturenScreen() {
  const tone: Record<string, string> = {
    Betaald: "text-white/70",
    Openstaand: "text-amber-300/90",
    Concept: "text-white/35",
  };
  const dot: Record<string, string> = {
    Betaald: "rgba(255,255,255,0.5)",
    Openstaand: "rgba(252,211,77,0.85)",
    Concept: "rgba(255,255,255,0.2)",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[18px] font-medium tracking-tight">Facturen</h1>
        <Eyebrow>{FACTUREN.length} totaal</Eyebrow>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: HAIR }}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${HAIR}` }}>
              {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  style={mono}
                  className={[
                    "px-5 py-3 text-[10px] font-normal uppercase tracking-[0.14em] text-white/30",
                    i === 3 ? "text-right" : "",
                  ].join(" ")}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr
                key={f.nr}
                style={i > 0 ? { borderTop: `1px solid ${HAIR}` } : undefined}
                className="transition-colors duration-150 hover:bg-white/[0.02] motion-reduce:transition-none"
              >
                <td style={mono} className="px-5 py-3.5 text-[12px] tabular-nums text-white/55">
                  {f.nr}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-white/85">{f.klant}</td>
                <td style={mono} className="px-5 py-3.5 text-[12px] tabular-nums text-white/40">
                  {f.datum}
                </td>
                <td
                  style={mono}
                  className="px-5 py-3.5 text-right text-[13px] font-medium tabular-nums text-white/90"
                >
                  {f.bedrag}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-2 text-[12px]">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: dot[f.status] ?? "rgba(255,255,255,0.2)" }}
                    />
                    <span className={tone[f.status] ?? "text-white/55"}>{f.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
