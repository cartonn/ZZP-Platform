"use client";

// Concept 64 — "Solar" · solarpunk / techno-optimisme.
// Warme, hoopvolle esthetiek: zon-amber en verdant groen op een heldere lucht-achtergrond,
// organische ronde vlakken, zachte curven en subtiele zon-boog / stralen- en blad-motieven als
// accent (nooit druk). Techniek in dienst van mensen — optimistisch, menselijk, maar strak en modern.
// Onderscheidend van Herbarium (botanisch specimen/inkt) en warm-humanist: dit is expliciet
// solarpunk met zon/energie/groei-taal.
// Palet: bg #f6f2e5, ink #22301c, amber #e08a1e, groen #4e7d3a, blad #7aa860, hemel #eaf1e6.
// Fonts: --font-lab-sora (display) + --font-lab-jakarta (body).

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

const C = {
  bg: "#f6f2e5",
  panel: "#fffdf6",
  sky: "#eaf1e6",
  ink: "#22301c",
  muted: "#5c6b4f",
  faint: "#8a9678",
  amber: "#e08a1e",
  amberSoft: "#f6d79a",
  green: "#4e7d3a",
  leaf: "#7aa860",
  line: "#d9d3bd",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };

function eur(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const credMeta: Record<CredStatus, { label: string; tint: string; bg: string; sym: string }> = {
  VERIFIED: { label: "Geverifieerd", tint: "#2f6b3b", bg: "#dcecd4", sym: "✓" },
  SUBMITTED: { label: "In beoordeling", tint: "#8a6a17", bg: "#f6e6bf", sym: "◔" },
  EXPIRING: { label: "Verloopt bijna", tint: "#a9531b", bg: "#f6dcc2", sym: "◑" },
  REJECTED: { label: "Afgewezen", tint: "#9a3222", bg: "#f3d3cb", sym: "✕" },
};

// Zon-boog met stralen — het dragende motief van dit concept.
function SunArc({ size = 120 }: { size?: number }) {
  const rays = [0, 30, 60, 90, 120, 150, 180];
  return (
    <svg width={size} height={size / 2 + 6} viewBox="0 0 120 66" aria-hidden="true">
      {rays.map((a) => {
        const r = (a * Math.PI) / 180;
        const x1 = 60 + Math.cos(Math.PI + r) * 34;
        const y1 = 60 + Math.sin(Math.PI + r) * 34;
        const x2 = 60 + Math.cos(Math.PI + r) * 46;
        const y2 = 60 + Math.sin(Math.PI + r) * 46;
        return (
          <line
            key={a}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.amber}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        );
      })}
      <path d="M14 60 A46 46 0 0 1 106 60 Z" fill={C.amberSoft} />
      <path d="M26 60 A34 34 0 0 1 94 60 Z" fill={C.amber} />
    </svg>
  );
}

function Leaf({ size = 16, color = C.green }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path d="M14 2C6 2 2 6 2 14c8 0 12-4 12-12Z" fill={color} />
      <path
        d="M4 12C7 9 9 7 12 4"
        stroke="#fff"
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / span) * 24 - 2}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pill({ children, bg, tint }: { children: React.ReactNode; bg: string; tint: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, background: bg, color: tint }}
    >
      {children}
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Leaf size={14} color={C.amber} />
      <span
        className="text-[11px] font-bold uppercase tracking-[0.22em]"
        style={{ ...body, color: C.green }}
      >
        {children}
      </span>
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] font-bold leading-[1.02] tracking-tight sm:text-[32px]"
      style={{ ...display, color: C.ink }}
    >
      {children}
    </h1>
  );
}

const NAV_ICON: Record<ScreenKey, string> = {
  dashboard: "◐",
  marktplaats: "❁",
  opdracht: "✦",
  verificatie: "✓",
  acties: "⚡",
  facturen: "€",
  documenten: "▤",
  berichten: "✉",
};

export function Concept64() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      {/* Zachte lucht-gloed bovenaan */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background: `radial-gradient(120% 90% at 78% -10%, ${C.amberSoft}66, transparent 60%)`,
        }}
        aria-hidden="true"
      />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        <aside className="shrink-0 md:w-[244px]">
          <div className="flex h-full flex-col md:border-r" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-3 px-5 py-5">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: C.amber }}
                aria-hidden="true"
              >
                <span className="text-[18px]" style={{ color: C.panel }}>
                  ☀
                </span>
              </span>
              <div className="leading-tight">
                <div className="text-[16px] font-bold tracking-tight" style={display}>
                  Solar
                </div>
                <div
                  className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: C.leaf }}
                >
                  ZZP · groei
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto px-3 pb-2 md:flex-1 md:flex-col md:pb-0"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-left text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4e7d3a] md:w-full"
                    style={{
                      color: on ? C.panel : C.muted,
                      background: on ? C.green : "transparent",
                    }}
                  >
                    <span aria-hidden="true" className="w-4 text-center text-[13px]">
                      {NAV_ICON[s.key]}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="mt-auto hidden items-center gap-3 px-5 py-5 md:flex"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ ...display, background: C.amberSoft, color: C.ink }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold" style={display}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: C.green }}
                >
                  <Leaf size={11} /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(34,48,28,0.02)",
      }}
    >
      {children}
    </section>
  );
}

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);
  const accents = [C.amber, C.green, C.leaf, C.amber];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Overzicht</Kicker>
          <Title>Goedendag, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div className="hidden sm:block">
          <SunArc />
        </div>
      </div>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center"
          style={{ background: "#f6e3cf", border: `1px solid #e6c79c` }}
          role="alert"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full text-[16px]"
            style={{ background: C.amber, color: C.panel }}
            aria-hidden="true"
          >
            ◑
          </span>
          <p className="text-[13px] leading-snug" style={{ color: "#6b4416" }}>
            <span className="font-bold" style={display}>
              {warn.titel}.
            </span>{" "}
            {warn.detail}
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto shrink-0 rounded-full px-4 py-2 text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.amber }}
          >
            {warn.cta}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl p-4"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
                role="status"
                aria-label="Laden"
              >
                <span
                  className="block h-3 w-1/2 animate-pulse rounded-full"
                  style={{ background: C.sky }}
                />
                <span
                  className="mt-4 block h-7 w-2/3 animate-pulse rounded-lg"
                  style={{ background: C.sky }}
                />
                <span
                  className="mt-4 block h-6 w-full animate-pulse rounded-lg"
                  style={{ background: C.sky }}
                />
              </div>
            ))
          : KPIS.map((k, i) => (
              <div
                key={k.label}
                className="flex flex-col justify-between rounded-3xl p-4"
                style={{ background: C.panel, border: `1px solid ${C.line}`, minHeight: 138 }}
              >
                <div className="flex items-start justify-between">
                  <p
                    className="text-[11px] font-semibold uppercase leading-tight tracking-[0.06em]"
                    style={{ color: C.muted, maxWidth: "72%" }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: accents[i % 4] }}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p
                    className="text-[26px] font-bold tabular-nums leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: k.up ? C.green : C.amber }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Spark data={k.spark} color={accents[i % 4] ?? C.green} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h3 className="flex items-center gap-2 text-[14px] font-bold" style={display}>
              <span className="text-[15px]" style={{ color: C.amber }} aria-hidden="true">
                ✦
              </span>{" "}
              Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="rounded-full px-3 py-1 text-[11.5px] font-semibold focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.green, background: C.sky }}
            >
              Alles
            </button>
          </div>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f2f5ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4e7d3a]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full text-[14px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: o.match >= 90 ? C.green : C.amberSoft,
                      color: o.match >= 90 ? C.panel : C.ink,
                    }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold">{o.titel}</span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <Leaf size={16} color={C.leaf} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
              <h3 className="text-[14px] font-bold" style={display}>
                Certificaten
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: C.line }}>
              {CREDENTIALS.map((c) => {
                const m = credMeta[c.status];
                return (
                  <div key={c.naam} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                      {c.naam}
                    </span>
                    <Pill bg={m.bg} tint={m.tint}>
                      <span aria-hidden="true">{m.sym}</span>
                      {m.label}
                    </Pill>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <h3 className="text-[14px] font-bold" style={display}>
                Berichten
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: C.amberSoft, color: C.ink }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            {BERICHTEN.slice(0, 2).map((b) => (
              <div
                key={b.van}
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderTop: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ ...display, background: C.sky, color: C.green }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold">{b.van}</p>
                  <p className="truncate text-[11px]" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
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
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-full px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <span className="text-[14px]" style={{ color: C.leaf }} aria-hidden="true">
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#8a9678]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11.5px] font-bold tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.sky }}
            aria-hidden="true"
          >
            <Leaf size={30} color={C.leaf} />
          </span>
          <p className="mt-4 text-[17px] font-bold" style={display}>
            Nog niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht en laat de zon weer
            schijnen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-full px-5 py-2 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.green }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-3xl p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                  style={{ background: C.panel, border: `1.5px solid ${on ? C.green : C.line}` }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tabular-nums"
                      style={{
                        ...display,
                        background: o.match >= 90 ? C.green : C.amberSoft,
                        color: o.match >= 90 ? C.panel : C.ink,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: C.faint }}
                      >
                        {o.id}
                        {on && <Leaf size={11} color={C.green} />}
                      </div>
                      <p className="truncate text-[15px] font-bold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                            style={{ background: C.sky, color: C.green }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Card>
                <div
                  className="flex items-center justify-between rounded-t-3xl px-5 py-4"
                  style={{ background: C.green }}
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: C.panel }}
                  >
                    {sel.id}
                  </span>
                  <Leaf size={16} color={C.amberSoft} />
                </div>
                <div className="p-5">
                  <p className="text-[16px] font-bold leading-snug" style={display}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div key={m.l} className="rounded-2xl p-3" style={{ background: C.sky }}>
                        <dt
                          className="text-[10px] font-bold uppercase tracking-[0.06em]"
                          style={{ color: C.muted }}
                        >
                          {m.l}
                        </dt>
                        <dd className="mt-0.5 font-bold tabular-nums" style={display}>
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 w-full rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: C.amber }}
                  >
                    Open opdracht
                  </button>
                </div>
              </Card>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <div
          className="relative overflow-hidden rounded-t-3xl p-6"
          style={{ background: `linear-gradient(120deg, ${C.sky}, ${C.panel})` }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-8 opacity-70"
            aria-hidden="true"
          >
            <SunArc size={140} />
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Kicker>{opdracht.id}</Kicker>
              <Title>{opdracht.titel}</Title>
              <p className="mt-2 text-[12.5px] font-medium" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: C.panel, color: C.green, border: `1px solid ${C.line}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
              style={{ background: opdracht.match >= 90 ? C.green : C.amber, color: C.panel }}
            >
              <span className="text-[26px] font-bold tabular-nums leading-none" style={display}>
                {opdracht.match}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">match</span>
            </span>
          </div>
        </div>
        <div className="p-5">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 disabled:translate-y-0 disabled:opacity-90"
            style={{ background: state === "sent" ? C.green : C.amber }}
          >
            {state === "idle" && "Reageer op opdracht"}
            {state === "sending" && "Versturen…"}
            {state === "sent" && "✓ Reactie verstuurd"}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-3xl p-4"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] font-bold tabular-nums" style={display}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <span className="text-[15px]" style={{ color: C.amber }} aria-hidden="true">
            ☀
          </span>
          <h3 className="text-[14px] font-bold" style={display}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="p-5 sm:border-r" style={{ borderColor: C.line }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.green }}
            >
              <Leaf size={12} /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 shrink-0 text-[13px]"
                    style={{ color: C.green }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.line}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.amber }}
            >
              <span aria-hidden="true">◑</span> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <span
                    className="mt-0.5 shrink-0 text-[13px]"
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  >
                    ○
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const pct = Math.round((verified / total) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[15px] font-bold tabular-nums"
            style={{ ...display, background: C.green, color: C.panel }}
          >
            {pct}%
          </span>
          <div className="flex-1">
            <p className="text-[13px] font-bold">Vertrouwensniveau opgebouwd</p>
            <p className="text-[12px]" style={{ color: C.muted }}>
              {verified} van {total} certificaten geverifieerd. Elk groen vinkje versterkt je
              profiel.
            </p>
            <div
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: C.sky }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${C.leaf}, ${C.amber})`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const m = credMeta[c.status];
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 rounded-3xl p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[18px] font-bold"
                style={{ background: m.bg, color: m.tint }}
                aria-hidden="true"
              >
                {m.sym}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{c.naam}</p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <Pill bg={m.bg} tint={m.tint}>
                {m.label}
              </Pill>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan en groei verder.
        </p>
      </div>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? C.amber : C.green;
          return (
            <div
              key={a.titel}
              className="flex items-stretch overflow-hidden rounded-3xl"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2 text-white"
                style={{ background: accent }}
              >
                <span className="text-[16px] font-bold tabular-nums" style={display}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span aria-hidden="true">{warn ? "◑" : "✦"}</span>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: accent }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </span>
                <p className="mt-1 text-[14.5px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 sm:mr-4"
                style={{ background: C.sky, color: C.green }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 rounded-3xl p-4" style={{ background: C.sky }}>
        <Leaf size={22} color={C.green} />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe kansen groeien vanzelf op deze plek.
        </p>
      </div>
    </div>
  );
}

function Facturen() {
  const statusMeta: Record<string, { tint: string; bg: string; sym: string }> = {
    Betaald: { tint: "#2f6b3b", bg: "#dcecd4", sym: "✓" },
    Openstaand: { tint: "#a9531b", bg: "#f6dcc2", sym: "◑" },
    Concept: { tint: "#8a6a17", bg: "#f6e6bf", sym: "◔" },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + eur(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + eur(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.green }}
        >
          <span aria-hidden="true">+</span> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl p-5 text-white" style={{ background: C.green }}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] opacity-90">Ontvangen</p>
          <p className="mt-2 text-[24px] font-bold tabular-nums" style={display}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="rounded-3xl p-5 text-white" style={{ background: C.amber }}>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] opacity-90">
            Openstaand
          </p>
          <p className="mt-2 text-[24px] font-bold tabular-nums" style={display}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3">Nummer</th>
                <th className="px-5 py-3">Klant</th>
                <th className="hidden px-5 py-3 sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right">Bedrag</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = statusMeta[f.status] ?? statusMeta.Concept!;
                return (
                  <tr key={f.nr} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td className="px-5 py-3 text-[12px] font-bold tabular-nums">{f.nr}</td>
                    <td className="px-5 py-3 text-[13px] font-semibold">{f.klant}</td>
                    <td
                      className="hidden px-5 py-3 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3 text-right text-[13px] font-bold tabular-nums"
                      style={display}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Pill bg={m.bg} tint={m.tint}>
                          <span aria-hidden="true">{m.sym}</span>
                          {f.status}
                        </Pill>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
