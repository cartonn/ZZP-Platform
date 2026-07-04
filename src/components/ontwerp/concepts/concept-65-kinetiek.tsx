"use client";

// Concept 65 — "Kinetiek" · kinetische typografie, motion als identiteit.
// Oversized variable-font koppen die ademen (gewicht/tracking via CSS @keyframes), een lopende
// marquee-ticker met live status/KPI's, hover-kinetische kaarten en doorlopende diagonale
// accent-strepen. Donkere, energieke basis met één felle accentkleur; content blijft scherp en
// leesbaar. Motion is de dragende identiteit — smaakvol, geen chaos. Alle beweging via CSS
// (geen JS-timers, geen random). Respecteert prefers-reduced-motion (motion-reduce).
// Onderscheidend van dopamine-kleurblok: dit is typografie-in-beweging.
// Palet: bg #0d0d0f, ink #f6f6f4, lime #c3f53b, hot pink #ff4d6d, paneel #16161a, mist #a2a2ac.
// Fonts: --font-lab-bricolage (display, groot) + --font-lab-space (body/mono-achtig).

import { useEffect, useState } from "react";
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
  bg: "#0d0d0f",
  panel: "#16161a",
  panel2: "#1e1e24",
  ink: "#f6f6f4",
  mist: "#a2a2ac",
  faint: "#6d6d78",
  lime: "#c3f53b",
  pink: "#ff4d6d",
  line: "#2a2a32",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-space)" };

function eur(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const credMeta: Record<CredStatus, { label: string; tint: string; sym: string }> = {
  VERIFIED: { label: "Geverifieerd", tint: C.lime, sym: "✓" },
  SUBMITTED: { label: "In beoordeling", tint: "#7cc2ff", sym: "◔" },
  EXPIRING: { label: "Verloopt bijna", tint: "#ffb648", sym: "◑" },
  REJECTED: { label: "Afgewezen", tint: C.pink, sym: "✕" },
};

// De kinetische stylesheet — alle beweging leeft hier, uit via prefers-reduced-motion.
function KineticStyles() {
  return (
    <style>{`
      @keyframes kx-breathe {
        0%, 100% { font-weight: 800; letter-spacing: -0.02em; }
        50% { font-weight: 500; letter-spacing: 0.01em; }
      }
      @keyframes kx-marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      @keyframes kx-slide {
        0%, 100% { background-position: 0 0; }
        50% { background-position: 28px 0; }
      }
      .kx-breathe { animation: kx-breathe 5.5s ease-in-out infinite; }
      .kx-marquee { animation: kx-marquee 22s linear infinite; }
      .kx-stripes { animation: kx-slide 3.2s linear infinite; }
      .kx-card { transition: transform .28s cubic-bezier(.2,.8,.2,1), border-color .28s; }
      .kx-card:hover { transform: translateY(-4px) scale(1.006); }
      @media (prefers-reduced-motion: reduce) {
        .kx-breathe, .kx-marquee, .kx-stripes { animation: none !important; }
        .kx-card:hover { transform: none; }
      }
    `}</style>
  );
}

function Ticker() {
  const items = [
    `MATCH ${KPIS[0]?.value ?? ""}`,
    `OPEN REACTIES ${KPIS[1]?.value ?? ""}`,
    `OMZET ${KPIS[2]?.value ?? ""}`,
    "VOG VERLOOPT — 23 DAGEN",
    "3 NIEUWE MATCHES > 85%",
    `TE FACTUREREN ${KPIS[3]?.value ?? ""}`,
  ];
  const row = [...items, ...items];
  return (
    <div
      className="overflow-hidden border-y"
      style={{ borderColor: C.line, background: C.lime }}
      aria-hidden="true"
    >
      <div className="kx-marquee flex w-max whitespace-nowrap py-1.5">
        {row.map((t, i) => (
          <span
            key={i}
            className="mx-5 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ ...body, color: C.bg }}
          >
            {t} <span className="mx-3">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const stripeBg = `repeating-linear-gradient(135deg, ${C.line} 0 1px, transparent 1px 14px)`;

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em]"
      style={{ ...body, color: C.lime }}
    >
      <span className="inline-block h-2 w-2" style={{ background: C.pink }} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="kx-breathe mt-2 text-[34px] uppercase leading-[0.92] tracking-tight sm:text-[48px]"
      style={{ ...display, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function Chip({ label, tint, sym }: { label: string; tint: string; sym: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{ ...body, color: tint, border: `1px solid ${tint}`, background: `${tint}14` }}
    >
      <span aria-hidden="true">{sym}</span>
      {label}
    </span>
  );
}

const NAV_TAG: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

export function Concept65() {
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
      <KineticStyles />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: stripeBg }}
        aria-hidden="true"
      />

      <div className="relative flex min-h-[680px] flex-col">
        {/* Topbar */}
        <header
          className="flex items-center justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: C.line }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center"
              style={{ background: C.lime, color: C.bg }}
              aria-hidden="true"
            >
              <span className="text-[16px] font-black" style={display}>
                K
              </span>
            </span>
            <div className="leading-none">
              <div className="text-[15px] font-black uppercase tracking-tight" style={display}>
                Kinetiek
              </div>
              <div
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.24em]"
                style={{ color: C.faint }}
              >
                ZZP · in beweging
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-[12px] font-bold">{PROFIEL.naam}</div>
              <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.lime }}>
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center text-[12px] font-black"
              style={{
                ...display,
                background: C.panel2,
                color: C.lime,
                border: `1px solid ${C.line}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <Ticker />

        {/* Nav */}
        <nav
          className="flex flex-row gap-1 overflow-x-auto border-b px-4 py-2"
          style={{ borderColor: C.line }}
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b]"
                style={{ color: on ? C.bg : C.mist, background: on ? C.lime : "transparent" }}
              >
                <span className="text-[9px] tabular-nums opacity-60">{NAV_TAG[s.key]}</span>
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-5 sm:p-8">
          {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
          {screen === "marktplaats" && (
            <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
          )}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onGo={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={className} style={{ background: C.panel, border: `1px solid ${C.line}` }}>
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
  const accents = [C.lime, C.pink, C.lime, C.pink];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Overzicht</Kicker>
        <Title>
          Hoi,
          <br />
          {PROFIEL.naam.split(" ")[0]}
        </Title>
        <p className="mt-3 text-[13px]" style={{ color: C.mist }}>
          {PROFIEL.rol} · {PROFIEL.plaats}
        </p>
      </div>

      {warn && (
        <div
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
          style={{ background: C.pink, color: C.bg }}
          role="alert"
        >
          <span className="text-[16px] font-black" aria-hidden="true">
            ◑
          </span>
          <p className="text-[13px] font-semibold leading-snug">
            <span className="font-black uppercase" style={display}>
              {warn.titel}.
            </span>{" "}
            {warn.detail}
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="kx-card ml-auto shrink-0 px-4 py-2 text-[12px] font-black uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            style={{ background: C.bg, color: C.lime }}
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
                className="p-4"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
                role="status"
                aria-label="Laden"
              >
                <span className="block h-3 w-1/2 animate-pulse" style={{ background: C.panel2 }} />
                <span
                  className="mt-4 block h-8 w-2/3 animate-pulse"
                  style={{ background: C.panel2 }}
                />
                <span
                  className="mt-3 block h-3 w-full animate-pulse"
                  style={{ background: C.panel2 }}
                />
              </div>
            ))
          : KPIS.map((k, i) => (
              <div
                key={k.label}
                className="kx-card flex flex-col justify-between p-4"
                style={{ background: C.panel, border: `1px solid ${C.line}`, minHeight: 132 }}
              >
                <p
                  className="text-[10.5px] font-bold uppercase leading-tight tracking-[0.08em]"
                  style={{ color: C.mist }}
                >
                  {k.label}
                </p>
                <div>
                  <p
                    className="text-[30px] font-black tabular-nums leading-none"
                    style={{ ...display, color: accents[i % 4] }}
                  >
                    {k.value}
                  </p>
                  <p
                    className="mt-1.5 text-[11px] font-bold uppercase tabular-nums"
                    style={{ color: k.up ? C.lime : C.pink }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </p>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h3 className="text-[13px] font-black uppercase tracking-[0.08em]" style={display}>
              Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="text-[11px] font-bold uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b]"
              style={{ color: C.lime }}
            >
              Alles →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#1e1e24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c3f53b]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[13px] font-black tabular-nums"
                    style={{
                      ...display,
                      background: o.match >= 90 ? C.lime : C.panel2,
                      color: o.match >= 90 ? C.bg : C.lime,
                      border: `1px solid ${o.match >= 90 ? C.lime : C.line}`,
                    }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold">{o.titel}</span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.mist }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="text-[13px]" style={{ color: C.pink }} aria-hidden="true">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
            <h3 className="text-[13px] font-black uppercase tracking-[0.08em]" style={display}>
              Certificaten
            </h3>
          </div>
          <div>
            {CREDENTIALS.map((c, i) => {
              const m = credMeta[c.status];
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                    {c.naam}
                  </span>
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: m.tint }}
                    aria-hidden="true"
                  >
                    {m.sym}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
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
        <Title>Opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <span className="text-[14px]" style={{ color: C.lime }} aria-hidden="true">
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#6d6d78]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11.5px] font-bold tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="p-12 text-center"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
          role="status"
        >
          <p
            className="text-[40px] font-black uppercase leading-none"
            style={{ ...display, color: C.pink }}
          >
            Niets
          </p>
          <p className="mx-auto mt-3 max-w-xs text-[12.5px]" style={{ color: C.mist }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 px-5 py-2 text-[12.5px] font-black uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b]"
            style={{ background: C.lime, color: C.bg }}
          >
            Wissen
          </button>
        </div>
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
                  className="kx-card w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b]"
                  style={{ background: C.panel, border: `1.5px solid ${on ? C.lime : C.line}` }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center text-[14px] font-black tabular-nums"
                      style={{
                        ...display,
                        background: o.match >= 90 ? C.lime : C.panel2,
                        color: o.match >= 90 ? C.bg : C.lime,
                        border: `1px solid ${o.match >= 90 ? C.lime : C.line}`,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: C.faint }}
                      >
                        {o.id}
                        {on && <span style={{ color: C.pink }}>◆</span>}
                      </div>
                      <p className="truncate text-[15px] font-bold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.mist }}>
                        {o.opdrachtgever} · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
                            style={{ color: C.lime, border: `1px solid ${C.line}` }}
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
            <aside
              className="h-fit lg:sticky lg:top-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ background: C.lime, color: C.bg }}
              >
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">{sel.id}</span>
                <span className="text-[13px]" aria-hidden="true">
                  ◆
                </span>
              </div>
              <div className="p-5">
                <p className="text-[16px] font-bold leading-snug" style={display}>
                  {sel.titel}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: C.mist }}>
                  {sel.opdrachtgever} · {sel.plaats}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                    { l: "Match", v: `${sel.match}%` },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="p-3"
                      style={{ background: C.panel2, border: `1px solid ${C.line}` }}
                    >
                      <dt
                        className="text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ color: C.faint }}
                      >
                        {m.l}
                      </dt>
                      <dd className="mt-0.5 font-black tabular-nums" style={display}>
                        {m.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="kx-card mt-4 w-full px-4 py-2.5 text-[12.5px] font-black uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b]"
                  style={{ background: C.lime, color: C.bg }}
                >
                  Open opdracht
                </button>
              </div>
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
      <div style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="relative overflow-hidden p-6">
          <div
            className="kx-stripes pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: `repeating-linear-gradient(135deg, ${C.lime}22 0 1px, transparent 1px 14px)`,
            }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Kicker>{opdracht.id}</Kicker>
              <h1
                className="mt-2 text-[26px] font-black uppercase leading-[0.95] tracking-tight sm:text-[34px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-2 text-[12.5px] font-medium" style={{ color: C.mist }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                    style={{ color: C.lime, border: `1px solid ${C.line}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center"
              style={{ background: opdracht.match >= 90 ? C.lime : C.pink, color: C.bg }}
            >
              <span className="text-[26px] font-black tabular-nums leading-none" style={display}>
                {opdracht.match}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]">match</span>
            </span>
          </div>
        </div>
        <div className="p-5">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="kx-card flex w-full items-center justify-center gap-2 px-5 py-3 text-[13px] font-black uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b] disabled:opacity-90"
            style={{ background: state === "sent" ? C.lime : C.pink, color: C.bg }}
          >
            {state === "idle" && "Reageer op opdracht"}
            {state === "sending" && "Versturen…"}
            {state === "sent" && "✓ Reactie verstuurd"}
          </button>
        </div>
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
            className="p-4"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] font-black tabular-nums" style={display}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
          <h3 className="text-[13px] font-black uppercase tracking-[0.08em]" style={display}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="p-5 sm:border-r" style={{ borderColor: C.line }}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.lime }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 shrink-0 font-black"
                    style={{ color: C.lime }}
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
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.pink }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.mist }}
                >
                  <span
                    className="mt-0.5 shrink-0 font-black"
                    style={{ color: C.pink }}
                    aria-hidden="true"
                  >
                    ◑
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
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

      <div
        className="flex items-center gap-4 p-5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center text-[16px] font-black tabular-nums"
          style={{ ...display, background: C.lime, color: C.bg }}
        >
          {pct}%
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-bold">Vertrouwensniveau</p>
          <p className="text-[12px]" style={{ color: C.mist }}>
            {verified} van {total} certificaten geverifieerd.
          </p>
          <div
            className="mt-2 h-2.5 w-full overflow-hidden"
            style={{ background: C.panel2 }}
            aria-hidden="true"
          >
            <div className="h-full" style={{ width: `${pct}%`, background: C.lime }} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const m = credMeta[c.status];
          return (
            <div
              key={c.naam}
              className="kx-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center text-[18px] font-black"
                style={{ color: m.tint, border: `1px solid ${m.tint}` }}
                aria-hidden="true"
              >
                {m.sym}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{c.naam}</p>
                <p className="text-[11.5px]" style={{ color: C.mist }}>
                  {c.detail}
                </p>
              </div>
              <Chip label={m.label} tint={m.tint} sym={m.sym} />
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
        <Title>Acties</Title>
        <p className="mt-3 text-[13px]" style={{ color: C.mist }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? C.pink : C.lime;
          return (
            <div
              key={a.titel}
              className="kx-card flex items-stretch"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: accent, color: C.bg }}
              >
                <span className="text-[16px] font-black tabular-nums" style={display}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span aria-hidden="true">{warn ? "◑" : "◆"}</span>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: accent }}
                >
                  {warn ? "Waarschuwing" : "Signaal"}
                </span>
                <p className="mt-1 text-[14.5px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.mist }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="shrink-0 self-center px-4 py-2 text-[12px] font-black uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b] sm:mr-4"
                style={{ color: accent, border: `1px solid ${accent}` }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-4 p-4"
        style={{ background: C.panel2, border: `1px solid ${C.line}` }}
      >
        <span className="text-[18px]" style={{ color: C.lime }} aria-hidden="true">
          ◆
        </span>
        <p className="text-[12.5px]" style={{ color: C.mist }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen automatisch op deze plek.
        </p>
      </div>
    </div>
  );
}

function Facturen() {
  const statusMeta: Record<string, { tint: string; sym: string }> = {
    Betaald: { tint: C.lime, sym: "✓" },
    Openstaand: { tint: C.pink, sym: "◑" },
    Concept: { tint: "#ffb648", sym: "◔" },
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
          className="kx-card inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-[12.5px] font-black uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c3f53b]"
          style={{ background: C.lime, color: C.bg }}
        >
          + Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-5" style={{ background: C.lime, color: C.bg }}>
          <p className="text-[10.5px] font-black uppercase tracking-[0.1em]">Ontvangen</p>
          <p className="mt-2 text-[24px] font-black tabular-nums" style={display}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="p-5" style={{ background: C.pink, color: C.bg }}>
          <p className="text-[10.5px] font-black uppercase tracking-[0.1em]">Openstaand</p>
          <p className="mt-2 text-[24px] font-black tabular-nums" style={display}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <div
        className="overflow-x-auto"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
            >
              <th className="px-5 py-3">Nummer</th>
              <th className="px-5 py-3">Klant</th>
              <th className="hidden px-5 py-3 sm:table-cell">Datum</th>
              <th className="px-5 py-3 text-right">Bedrag</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = statusMeta[f.status] ?? statusMeta.Concept!;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <td className="px-5 py-3 text-[12px] font-bold tabular-nums">{f.nr}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold">{f.klant}</td>
                  <td
                    className="hidden px-5 py-3 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.mist }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3 text-right text-[13px] font-black tabular-nums"
                    style={display}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      style={{ color: m.tint }}
                    >
                      <span aria-hidden="true">{m.sym}</span>
                      <span className="text-[11.5px] font-bold uppercase tracking-[0.04em]">
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
