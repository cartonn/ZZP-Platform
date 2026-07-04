"use client";

// Concept 61 — "Stroom" · het hele platform als een kanban-flowboard / besturingssysteem.
// Werk (opdrachten, reacties, verificaties, facturen) leeft als kaarten die door kolommen/lanes
// stromen: Nieuw → In behandeling → Actie nodig → Afgerond. Lichte, strakke productiviteits-UI à la
// Linear/Trello-2026: subtiele lane-koppen met tellers, sleep-affordances (visueel), kaart-hover met
// lift, kleuraccent per lane. Onderscheidend van dashboard-concepten: alles is een board.
// Palet: bg #f3f5f8, ink #1b2432, accent #2563eb, lane-tinten zacht (blauw/amber/rood/groen).
// Fonts: --font-lab-geist (display/body) + --font-lab-geist-mono (labels/cijfers).

import { useEffect, useState } from "react";
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

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f3f5f8",
  surface: "#ffffff",
  ink: "#1b2432",
  sub: "#5b6675",
  faint: "#8a93a3",
  line: "#e3e8ef",
  accent: "#2563eb",
  blueTint: "#eef4ff",
  amber: "#b45309",
  amberTint: "#fef6e7",
  red: "#dc2626",
  redTint: "#fef1f1",
  green: "#059669",
  greenTint: "#ecfaf3",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

type Tone = "blue" | "amber" | "red" | "green";
const TONE: Record<Tone, { solid: string; tint: string }> = {
  blue: { solid: C.accent, tint: C.blueTint },
  amber: { solid: C.amber, tint: C.amberTint },
  red: { solid: C.red, tint: C.redTint },
  green: { solid: C.green, tint: C.greenTint },
};

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

function credMeta(s: CredStatus): { label: string; tone: Tone; glyph: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", glyph: "✓" };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "blue", glyph: "◷" };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", glyph: "!" };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", glyph: "✕" };
  }
}

/* ---------- Primitieven ---------- */

function DragDots() {
  return (
    <span
      className="grid shrink-0 grid-cols-2 gap-[2px] opacity-0 transition-opacity group-hover:opacity-100"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full" style={{ background: C.faint }} />
      ))}
    </span>
  );
}

function LaneHead({ title, count, tone }: { title: string; count: number; tone: Tone }) {
  return (
    <div className="mb-3 flex items-center gap-2 px-1">
      <span className="h-2 w-2 rounded-full" style={{ background: TONE[tone].solid }} aria-hidden />
      <span className="text-[12.5px] font-semibold" style={{ ...display, color: C.ink }}>
        {title}
      </span>
      <span
        className="ml-auto rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums"
        style={{ ...mono, background: C.line, color: C.sub }}
      >
        {count}
      </span>
    </div>
  );
}

function Chip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const t = TONE[m.tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: t.tint, color: t.solid }}
    >
      <span aria-hidden>{m.glyph}</span>
      {m.label}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: Tone }) {
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
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={TONE[tone].solid}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Kaart-shell ---------- */

function Card({
  children,
  onClick,
  accent = "blue",
  as = "div",
  active = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: Tone;
  as?: "div" | "button";
  active?: boolean;
}) {
  const style = {
    background: C.surface,
    borderColor: active ? TONE[accent].solid : C.line,
    boxShadow: active ? `0 1px 0 ${TONE[accent].solid}` : undefined,
  };
  const cls =
    "group relative w-full rounded-xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-12px_rgba(27,36,50,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]";
  if (as === "button") {
    return (
      <button onClick={onClick} style={style} className={cls}>
        <span
          className="absolute left-0 top-3 h-[calc(100%-1.5rem)] w-[3px] rounded-full"
          style={{ background: TONE[accent].solid }}
          aria-hidden
        />
        {children}
      </button>
    );
  }
  return (
    <div style={style} className={cls.replace("hover:-translate-y-0.5", "")}>
      <span
        className="absolute left-0 top-3 h-[calc(100%-1.5rem)] w-[3px] rounded-full"
        style={{ background: TONE[accent].solid }}
        aria-hidden
      />
      {children}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept61() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const titelFor: Record<ScreenKey, string> = {
    dashboard: "Overzicht",
    marktplaats: "Marktplaats",
    opdracht: "Opdracht",
    verificatie: "Verificatie",
    acties: "Acties",
    facturen: "Facturen",
    documenten: "Documenten",
    berichten: "Berichten",
  };

  return (
    <div
      className="min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...display, background: C.bg, color: C.ink }}
    >
      <div className="flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 border-b md:w-[228px] md:border-b-0 md:border-r"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="flex items-center gap-2.5 px-4 py-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.accent }}
              aria-hidden
            >
              <svg width={18} height={18} viewBox="0 0 18 18">
                <path
                  d="M3 5h12M3 9h8M3 13h11"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-tight">Stroom</div>
              <div className="mt-1 text-[10px] font-medium" style={{ ...mono, color: C.faint }}>
                flow-os
              </div>
            </div>
          </div>

          <nav
            className="flex flex-row gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-4"
            aria-label="Hoofdnavigatie"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] md:w-full"
                  style={{
                    background: on ? C.blueTint : "transparent",
                    color: on ? C.accent : C.sub,
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: on ? C.accent : C.line }}
                    aria-hidden
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div
            className="hidden items-center gap-2.5 border-t px-4 py-3.5 md:flex"
            style={{ borderColor: C.line }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: C.blueTint, color: C.accent }}
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
              <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.green }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.green }} />
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex items-center justify-between gap-3 border-b px-5 py-3.5"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <div className="flex items-center gap-2 text-[12.5px]">
              <span style={{ color: C.faint }}>Board</span>
              <span style={{ color: C.faint }} aria-hidden>
                /
              </span>
              <span className="font-semibold">{titelFor[screen]}</span>
            </div>
            <div
              className="hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium sm:flex"
              style={{ ...mono, borderColor: C.line, color: C.sub }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.green }} />
              live
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

type Feed = "loading" | "error" | "ready";

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [feed, setFeed] = useState<Feed>("loading");
  useEffect(() => {
    if (feed !== "loading") return;
    const t = window.setTimeout(() => setFeed("ready"), 750);
    return () => window.clearTimeout(t);
  }, [feed]);

  const warn = ACTIES[0];
  const kpiTones: Tone[] = ["green", "blue", "green", "amber"];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">
          Goedendag, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
          {PROFIEL.rol} · {PROFIEL.plaats}
        </p>
      </div>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = kpiTones[i] ?? "blue";
          return (
            <div
              key={k.label}
              className="rounded-xl border p-3.5"
              style={{ background: C.surface, borderColor: C.line }}
            >
              <p className="text-[11px] font-medium" style={{ color: C.sub }}>
                {k.label}
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-[24px] font-bold tabular-nums leading-none" style={mono}>
                  {k.value}
                </p>
                <Spark data={k.spark} tone={tone} />
              </div>
              <p
                className="mt-1.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.green : C.amber }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Waarschuwing */}
      {warn && (
        <div
          className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
          style={{ background: C.amberTint, borderColor: "#f3d9a6" }}
          role="alert"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold text-white"
            style={{ background: C.amber }}
            aria-hidden
          >
            !
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold" style={{ color: C.amber }}>
              {warn.titel}
            </p>
            <p className="text-[12px]" style={{ color: C.sub }}>
              {warn.detail}
            </p>
          </div>
          <button
            onClick={() => onGo("verificatie")}
            className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.amber }}
          >
            {warn.cta}
          </button>
        </div>
      )}

      {/* Board-overzicht */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Lane: beste matches */}
        <section className="lg:col-span-2">
          <LaneHead title="Beste matches" count={OPDRACHTEN.length} tone="blue" />
          <div className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} as="button" accent="blue" onClick={() => onOpen(o.id)}>
                <div className="flex items-start gap-3 pl-1.5">
                  <DragDots />
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      background: o.match >= 90 ? C.accent : C.blueTint,
                      color: o.match >= 90 ? "#fff" : C.accent,
                    }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{o.titel}</span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.sub }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-[16px] transition-transform group-hover:translate-x-0.5"
                    style={{ color: C.faint }}
                    aria-hidden
                  >
                    →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Lane: activiteit met loading/error/ready */}
        <section>
          <LaneHead
            title="Activiteit"
            count={feed === "ready" ? BERICHTEN.length : 0}
            tone="green"
          />
          <div
            className="rounded-xl border p-3"
            style={{ background: C.surface, borderColor: C.line }}
          >
            {feed === "loading" && (
              <div className="space-y-2.5" role="status" aria-live="polite">
                <span className="sr-only">Activiteit wordt geladen…</span>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span
                      className="h-8 w-8 shrink-0 animate-pulse rounded-lg"
                      style={{ background: C.line }}
                    />
                    <div className="flex-1 space-y-1.5">
                      <span
                        className="block h-2.5 w-2/3 animate-pulse rounded"
                        style={{ background: C.line }}
                      />
                      <span
                        className="block h-2 w-1/2 animate-pulse rounded"
                        style={{ background: C.line }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {feed === "error" && (
              <div className="py-4 text-center" role="alert">
                <p className="text-[13px] font-semibold" style={{ color: C.red }}>
                  Kon activiteit niet laden
                </p>
                <p className="mx-auto mt-1 max-w-[200px] text-[11.5px]" style={{ color: C.sub }}>
                  De verbinding werd onderbroken. Probeer het opnieuw.
                </p>
                <button
                  onClick={() => setFeed("loading")}
                  className="mt-3 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                  style={{ background: C.accent }}
                >
                  Opnieuw laden
                </button>
              </div>
            )}
            {feed === "ready" && (
              <div>
                <ul className="space-y-1">
                  {BERICHTEN.map((b) => (
                    <li key={b.van} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
                        style={{ background: C.blueTint, color: C.accent }}
                        aria-hidden
                      >
                        {b.initialen}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-[12px] font-semibold">
                          {b.van}
                          {b.ongelezen && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: C.accent }}
                              aria-label="ongelezen"
                            />
                          )}
                        </p>
                        <p className="truncate text-[11px]" style={{ color: C.sub }}>
                          {b.preview}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px]" style={{ ...mono, color: C.faint }}>
                        {b.tijd}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setFeed("error")}
                  className="mt-2 w-full rounded-lg border px-3 py-1.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                  style={{ borderColor: C.line, color: C.sub }}
                >
                  Verbinding testen
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function laneOf(match: number): { key: Tone; title: string } {
  if (match >= 90) return { key: "green", title: "Topmatch" };
  if (match >= 85) return { key: "blue", title: "Sterke match" };
  return { key: "amber", title: "Passend" };
}

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const lanes: { key: Tone; title: string }[] = [
    { key: "green", title: "Topmatch" },
    { key: "blue", title: "Sterke match" },
    { key: "amber", title: "Passend" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Marktplaats</h1>
          <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
            Kaarten stromen van links (beste match) naar rechts.
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2 sm:w-72"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <span style={{ color: C.faint }} aria-hidden>
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht, plaats, klant…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8a93a3]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: C.surface, borderColor: C.line }}
          role="status"
        >
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-[20px]"
            style={{ background: C.line, color: C.faint }}
            aria-hidden
          >
            ⌕
          </span>
          <p className="mt-3 text-[15px] font-semibold">Geen kaarten gevonden</p>
          <p className="mx-auto mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
            style={{ background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {lanes.map((lane) => {
            const items = filtered.filter((o) => laneOf(o.match).key === lane.key);
            return (
              <div
                key={lane.key}
                className="rounded-xl p-3"
                style={{ background: TONE[lane.key].tint }}
              >
                <LaneHead title={lane.title} count={items.length} tone={lane.key} />
                <div className="space-y-2.5">
                  {items.length === 0 ? (
                    <p
                      className="rounded-lg border border-dashed px-3 py-6 text-center text-[11.5px]"
                      style={{ borderColor: C.line, color: C.faint }}
                    >
                      Geen kaarten in deze lane
                    </p>
                  ) : (
                    items.map((o) => (
                      <Card
                        key={o.id}
                        as="button"
                        accent={lane.key}
                        active={o.id === activeId}
                        onClick={() => {
                          onSelect(o.id);
                          onOpen(o.id);
                        }}
                      >
                        <div className="pl-1.5">
                          <div className="flex items-center gap-2">
                            <DragDots />
                            <span
                              className="text-[10.5px] font-semibold"
                              style={{ ...mono, color: C.faint }}
                            >
                              {o.id}
                            </span>
                            <span
                              className="ml-auto rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums"
                              style={{
                                ...mono,
                                background: TONE[lane.key].solid,
                                color: "#fff",
                              }}
                            >
                              {o.match}%
                            </span>
                          </div>
                          <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">
                            {o.titel}
                          </p>
                          <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                            {o.opdrachtgever} · {o.plaats}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {o.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                                style={{ background: C.surface, color: C.sub }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };
  const lane = laneOf(opdracht.match);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-xl border p-5" style={{ background: C.surface, borderColor: C.line }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: TONE[lane.key].tint, color: TONE[lane.key].solid }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: TONE[lane.key].solid }}
              />
              {lane.title} · {opdracht.id}
            </span>
            <h1 className="mt-2 text-[22px] font-bold leading-tight tracking-tight">
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: C.bg, color: C.sub }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white"
            style={{ background: TONE[lane.key].solid }}
          >
            <span className="text-[22px] font-bold tabular-nums leading-none" style={mono}>
              {opdracht.match}
            </span>
            <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wider">
              match
            </span>
          </span>
        </div>

        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: state === "sent" ? C.green : C.accent }}
        >
          {state === "idle" && "Reageer op opdracht →"}
          {state === "sending" && "Versturen…"}
          {state === "sent" && "✓ Reactie verstuurd"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-xl border p-3.5"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <p
              className="text-[10.5px] font-medium uppercase tracking-wide"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[15px] font-bold tabular-nums" style={mono}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Verklaarbare matching als twee lanes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl p-3" style={{ background: C.greenTint }}>
          <LaneHead title="Waarom deze match" count={opdracht.redenen.plus.length} tone="green" />
          <div className="space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <div
                key={r}
                className="flex items-start gap-2.5 rounded-lg border p-3 text-[12.5px]"
                style={{ background: C.surface, borderColor: C.line }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: C.green }}
                  aria-hidden
                >
                  ✓
                </span>
                {r}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: C.amberTint }}>
          <LaneHead title="Aandachtspunten" count={opdracht.redenen.min.length} tone="amber" />
          <div className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <div
                key={r}
                className="flex items-start gap-2.5 rounded-lg border p-3 text-[12.5px]"
                style={{ background: C.surface, borderColor: C.line }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: C.amber }}
                  aria-hidden
                >
                  !
                </span>
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const lanes: { key: Tone; title: string; match: (s: CredStatus) => boolean }[] = [
    { key: "green", title: "Geverifieerd", match: (s) => s === "VERIFIED" },
    { key: "blue", title: "In beoordeling", match: (s) => s === "SUBMITTED" },
    { key: "amber", title: "Actie nodig", match: (s) => s === "EXPIRING" || s === "REJECTED" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Verificatie</h1>
        <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
          Elke credential is een kaart in zijn status-lane.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {lanes.map((lane) => {
          const items = CREDENTIALS.filter((c) => lane.match(c.status));
          return (
            <div
              key={lane.key}
              className="rounded-xl p-3"
              style={{ background: TONE[lane.key].tint }}
            >
              <LaneHead title={lane.title} count={items.length} tone={lane.key} />
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <p
                    className="rounded-lg border border-dashed px-3 py-6 text-center text-[11.5px]"
                    style={{ borderColor: C.line, color: C.faint }}
                  >
                    Geen kaarten
                  </p>
                ) : (
                  items.map((c) => (
                    <Card key={c.naam} accent={lane.key}>
                      <div className="pl-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13.5px] font-semibold leading-snug">{c.naam}</p>
                          <DragDots />
                        </div>
                        <p className="mt-1 text-[11.5px]" style={{ color: C.sub }}>
                          {c.detail}
                        </p>
                        <div className="mt-2.5">
                          <Chip status={c.status} />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Acties</h1>
        <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
          Op volgorde van urgentie — werk de kaarten van boven naar beneden af.
        </p>
      </div>

      <LaneHead title="Actie nodig" count={ACTIES.length} tone="amber" />
      <div className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const tone: Tone = a.urgentie === "warning" ? "amber" : "blue";
          return (
            <Card key={a.titel} accent={tone}>
              <div className="flex items-start gap-3 pl-1.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold tabular-nums"
                  style={{ ...mono, background: TONE[tone].tint, color: TONE[tone].solid }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{a.titel}</p>
                  <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-center rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ background: TONE[tone].solid }}
                >
                  {a.cta}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-xl border border-dashed p-4"
        style={{ borderColor: C.line, color: C.sub }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ background: C.green }}
          aria-hidden
        >
          ✓
        </span>
        <p className="text-[12.5px]">
          Verder is alles bijgewerkt. Nieuwe kaarten verschijnen automatisch in deze lane.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const laneDef: { key: Tone; title: string; status: string }[] = [
    { key: "green", title: "Betaald", status: "Betaald" },
    { key: "amber", title: "Openstaand", status: "Openstaand" },
    { key: "blue", title: "Concept", status: "Concept" },
  ];
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Facturen</h1>
          <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
            Facturen stromen door de lanes tot ze betaald zijn.
          </p>
        </div>
        <div className="flex gap-2">
          <div
            className="rounded-lg border px-3 py-1.5 text-[12px]"
            style={{ borderColor: C.line }}
          >
            <span style={{ color: C.faint }}>Ontvangen </span>
            <span className="font-bold tabular-nums" style={{ ...mono, color: C.green }}>
              € {betaald.toLocaleString("nl-NL")}
            </span>
          </div>
          <div
            className="rounded-lg border px-3 py-1.5 text-[12px]"
            style={{ borderColor: C.line }}
          >
            <span style={{ color: C.faint }}>Openstaand </span>
            <span className="font-bold tabular-nums" style={{ ...mono, color: C.amber }}>
              € {open.toLocaleString("nl-NL")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {laneDef.map((lane) => {
          const items = FACTUREN.filter((f) => f.status === lane.status);
          return (
            <div
              key={lane.key}
              className="rounded-xl p-3"
              style={{ background: TONE[lane.key].tint }}
            >
              <LaneHead title={lane.title} count={items.length} tone={lane.key} />
              <div className="space-y-2.5">
                {items.map((f) => (
                  <Card key={f.nr} accent={lane.key}>
                    <div className="pl-1.5">
                      <div className="flex items-center gap-2">
                        <DragDots />
                        <span
                          className="text-[10.5px] font-semibold"
                          style={{ ...mono, color: C.faint }}
                        >
                          {f.nr}
                        </span>
                        <span className="ml-auto text-[10px]" style={{ ...mono, color: C.faint }}>
                          {f.datum}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] font-semibold">{f.klant}</p>
                      <p className="mt-1 text-[17px] font-bold tabular-nums" style={mono}>
                        {f.bedrag}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
