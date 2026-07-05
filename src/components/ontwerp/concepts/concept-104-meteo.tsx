"use client";

// Concept 104 — "Meteo" · Weerbericht-datakaart (KNMI-taal).
// Het platform als meteorologisch dashboard: isobaren-lijnen, temperatuur-heatzones (blauw→rood)
// als visuele metafoor voor matching-druk en beschikbaarheid, druk-/wind-meetwaarden. Data-visueel,
// fris, kaartachtige panelen. Inter (UI) + JetBrains Mono (meetwaarden).
// Palet: koel bg #f2f6fb, ink #0f2a43, lijnen rgba(15,42,67,0.10). Heatzone blauw #2f80ed → rood #eb5757.

import { useState } from "react";
import {
  Wind,
  Gauge,
  Thermometer,
  Compass,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  ChevronLeft,
  Droplets,
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
  bg: "#eef4fb",
  panel: "#ffffff",
  ink: "#0f2a43",
  inkSoft: "#33526e",
  muted: "#6b829a",
  faint: "#9db0c4",
  hair: "rgba(15,42,67,0.10)",
  hairSoft: "rgba(15,42,67,0.06)",
  cold: "#2f80ed",
  warm: "#eb5757",
  mid: "#f2994a",
  ok: "#219653",
  warn: "#c77700",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Kleur op een blauw→rood-schaal op basis van "druk" (0..100). Hoog = warm (veel activiteit/match).
function heat(v: number): string {
  const t = Math.max(0, Math.min(1, v / 100));
  if (t < 0.5) {
    const k = t / 0.5;
    return `rgb(${Math.round(47 + k * 195)}, ${Math.round(128 + k * 25)}, ${Math.round(237 - k * 63)})`;
  }
  const k = (t - 0.5) / 0.5;
  return `rgb(${Math.round(242 - k * 7)}, ${Math.round(153 - k * 66)}, ${Math.round(74 - k * 27)})`;
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.cold };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, color: C.warm };
  }
}

// Achtergrond-isobaren: concentrische kromme lijnen zoals op een weerkaart.
function Isobars({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ opacity }}
    >
      {[0, 24, 48, 72, 96, 120].map((d, i) => (
        <path
          key={d}
          d={`M ${-40 + d} 320 C ${80 + d} ${220 - d} ${180 - d} ${180 + d} ${300 + d} ${40 - d}`}
          fill="none"
          stroke={i % 2 === 0 ? C.cold : C.faint}
          strokeWidth="1"
          strokeOpacity="0.35"
        />
      ))}
    </svg>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 26 - ((d - min) / range) * 22;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" className="h-7 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.hair}` }}
    >
      {children}
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: C.faint, ...mono }}
    >
      {children}
    </p>
  );
}

export function Concept104() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-7 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: C.ink, color: C.bg }}
            aria-hidden="true"
          >
            <Compass size={19} />
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-none">Meteo</p>
            <p className="mt-1 text-[11px]" style={{ color: C.muted, ...mono }}>
              Matching-weerbericht
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-[11px] sm:flex"
            style={{ border: `1px solid ${C.hair}`, color: C.inkSoft, ...mono }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: C.ok }}
              aria-hidden="true"
            />
            Live · 09:24
          </div>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: heat(88), color: "#fff" }}
            aria-label={PROFIEL.naam}
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="mx-auto mt-6 flex max-w-6xl items-center gap-1 overflow-x-auto px-5 md:px-8"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                color: on ? C.ink : C.muted,
                background: on ? "rgba(47,128,237,0.08)" : "transparent",
              }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full"
                  style={{ background: C.cold }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="h-px w-full" style={{ background: C.hair }} aria-hidden="true" />

      <main className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-9">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const metrics = [
    { l: "Luchtdruk", v: "1024 hPa", Icon: Gauge, note: "Stabiel" },
    { l: "Wind", v: "ZW 3 Bft", Icon: Wind, note: "Rustig" },
    { l: "Temp.", v: "18°C", Icon: Thermometer, note: "Aangenaam" },
    { l: "Neerslag", v: "10%", Icon: Droplets, note: "Droog" },
  ];
  return (
    <div className="space-y-6">
      <Panel className="p-0">
        <div className="relative">
          <Isobars opacity={0.9} />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-2xl"
            style={{ background: `radial-gradient(circle, ${heat(90)}55, transparent 70%)` }}
            aria-hidden="true"
          />
          <div className="relative grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
            <div>
              <Overline>Vandaag · {PROFIEL.plaats}</Overline>
              <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-[30px]">
                Gunstig matching-weer, {PROFIEL.naam.split(" ")[0]}.
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                Hoge druk boven jouw regio: veel passende opdrachten, weinig ruis. Eén front nadert
                — je VOG verloopt binnenkort.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {metrics.map((m) => (
                  <div
                    key={m.l}
                    className="rounded-xl p-3"
                    style={{ background: C.bg, border: `1px solid ${C.hairSoft}` }}
                  >
                    <m.Icon size={15} aria-hidden="true" style={{ color: C.cold }} />
                    <p className="mt-2 text-[15px] font-semibold tabular-nums" style={mono}>
                      {m.v}
                    </p>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      {m.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="flex flex-col justify-between rounded-2xl p-5"
              style={{ background: C.ink, color: "#fff" }}
            >
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "rgba(255,255,255,0.6)", ...mono }}
                >
                  Waarschuwing
                </p>
                <p className="mt-2 text-[16px] font-semibold leading-snug">{primair.titel}</p>
                <p
                  className="mt-2 text-[13px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {primair.detail}
                </p>
              </div>
              <button
                onClick={onOpen}
                className="group mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:hover:gap-2"
                style={{ background: C.warm, color: "#fff" }}
              >
                {primair.cta}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-[12px]" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.ok : C.warn,
                  background: k.up ? "rgba(33,150,83,0.10)" : "rgba(199,119,0,0.10)",
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <p
              className="mt-2 text-[24px] font-semibold tabular-nums tracking-[-0.01em]"
              style={mono}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Sparkline data={k.spark} color={heat(70)} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <Overline>Warmste match</Overline>
          <span className="text-[11px] tabular-nums" style={{ color: C.muted, ...mono }}>
            {top.id}
          </span>
        </div>
        <button
          onClick={onOpen}
          className="mt-3 flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(47,128,237,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        >
          <span
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-[15px] font-semibold tabular-nums text-white"
            style={{ background: heat(top.match), ...mono }}
          >
            {top.match}
            <span className="text-[9px] font-normal opacity-80">°match</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{top.titel}</span>
            <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
              {top.opdrachtgever} · {top.plaats} · {top.tarief}
            </span>
          </span>
          <ArrowRight size={17} aria-hidden="true" style={{ color: C.faint }} />
        </button>
      </Panel>
    </div>
  );
}

function MatchBadge({ match }: { match: number }) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold tabular-nums text-white"
      style={{ background: heat(match), ...mono }}
      aria-label={`${match} procent match`}
    >
      {match}
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Marktplaats</Overline>
          <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.01em]">Opdrachtenkaart</h1>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: C.panel, border: `1px solid ${C.hair}` }}
        >
          <Compass size={15} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[13px] outline-none placeholder:text-[#9db0c4]"
            style={{ color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <Wind size={26} aria-hidden="true" className="mx-auto" style={{ color: C.faint }} />
          <p className="mt-3 text-[15px] font-semibold">Windstil</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen opdracht past bij “{q}”. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.ink, color: "#fff" }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <Panel key={o.id} className="p-4">
              <div className="flex items-start gap-3">
                <MatchBadge match={o.match} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                      {o.id}
                    </span>
                  </div>
                  <h2 className="mt-0.5 truncate text-[15px] font-semibold">{o.titel}</h2>
                  <p className="text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{
                      background: C.bg,
                      color: C.inkSoft,
                      border: `1px solid ${C.hairSoft}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between border-t pt-3"
                style={{ borderColor: C.hair }}
              >
                <span className="text-[13px] font-semibold tabular-nums" style={mono}>
                  {o.tarief}
                </span>
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 motion-reduce:hover:gap-1.5"
                  style={{ color: C.cold }}
                >
                  Bekijk <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const facts = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}°` },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#0f2a43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ color: C.muted }}
      >
        <ChevronLeft size={15} aria-hidden="true" /> Terug naar kaart
      </button>

      <Panel className="p-0">
        <div className="relative">
          <Isobars opacity={0.7} />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <MatchBadge match={opdracht.match} />
              <div>
                <p className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                  {opdracht.id}
                </p>
                <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em]">
                  {opdracht.titel}
                </h1>
                <p className="text-[13px]" style={{ color: C.muted }}>
                  {opdracht.opdrachtgever} · {opdracht.plaats}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {facts.map((f) => (
                <div
                  key={f.l}
                  className="rounded-xl p-3"
                  style={{ background: C.panel, border: `1px solid ${C.hairSoft}` }}
                >
                  <p
                    className="text-[10.5px] uppercase tracking-[0.16em]"
                    style={{ color: C.faint }}
                  >
                    {f.l}
                  </p>
                  <p className="mt-1 text-[15px] font-semibold tabular-nums" style={mono}>
                    {f.v}
                  </p>
                </div>
              ))}
            </div>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 motion-reduce:hover:gap-2"
              style={{ background: C.ink, color: "#fff" }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel className="p-5">
          <Overline>Hogedrukgebied · past</Overline>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13.5px]">
                <Check size={16} aria-hidden="true" style={{ color: C.ok, marginTop: 1 }} />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <Overline>Front · aandacht</Overline>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={16}
                  aria-hidden="true"
                  style={{ color: C.mid, marginTop: 1 }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <Panel className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Overline>Vertrouwensindex</Overline>
            <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.01em]">Verificatie</h1>
            <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
              <span style={{ color: C.ink }}>{PROFIEL.trust}.</span> {verified} van{" "}
              {CREDENTIALS.length} credentials geverifieerd.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Gauge size={18} aria-hidden="true" style={{ color: C.cold }} />
            <span className="text-[34px] font-semibold tabular-nums" style={mono}>
              {pct}%
            </span>
          </div>
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full"
          style={{ background: C.bg }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Verificatievoortgang"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.cold}, ${C.ok})` }}
          />
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <Panel key={c.naam} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${st.color}18`, color: st.color }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-snug">{c.naam}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
              </div>
              <span
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: `${st.color}14`, color: st.color }}
              >
                <st.Icon size={12} aria-hidden="true" />
                {st.label}
              </span>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <div>
        <Overline>Weeralarm · volgende acties</Overline>
        <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.01em]">Wat vraagt actie</h1>
      </div>
      <div className="space-y-3">
        {sorted.map((a) => {
          const warn = a.urgentie === "warning";
          return (
            <Panel key={a.titel} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: warn ? "rgba(235,87,87,0.12)" : "rgba(47,128,237,0.10)",
                    color: warn ? C.warm : C.cold,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <AlertTriangle size={17} /> : <Clock size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14.5px] font-semibold">{a.titel}</h2>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        background: warn ? "rgba(235,87,87,0.12)" : C.bg,
                        color: warn ? C.warm : C.muted,
                      }}
                    >
                      {warn ? "Waarschuwing" : "Info"}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-center rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={
                    warn
                      ? { background: C.warm, color: "#fff" }
                      : { border: `1px solid ${C.hair}`, color: C.ink }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald");
  const total = "€ 8.622";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Omzet · neerslag</Overline>
          <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.01em]">Facturen</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px]" style={{ color: C.muted }}>
              Totaal betaald
            </p>
            <p className="text-[20px] font-semibold tabular-nums" style={mono}>
              {total}
            </p>
          </div>
        </div>
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
              {["Factuur", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.faint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const paid = f.status === "Betaald";
              const open = f.status === "Openstaand";
              const col = paid ? C.ok : open ? C.warn : C.muted;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(47,128,237,0.04)]"
                  style={{ borderBottom: `1px solid ${C.hairSoft}` }}
                >
                  <td
                    className="px-4 py-3 text-[12.5px] tabular-nums"
                    style={{ color: C.muted, ...mono }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13.5px] font-medium">{f.klant}</td>
                  <td className="px-4 py-3 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: `${col}14`, color: col }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: col }} />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13.5px] font-semibold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <p className="text-[12px]" style={{ color: C.muted }}>
        {betaald.length} van {FACTUREN.length} facturen betaald · droog weer verwacht.
      </p>
    </div>
  );
}
