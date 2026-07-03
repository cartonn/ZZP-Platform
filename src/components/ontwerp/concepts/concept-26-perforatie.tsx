"use client";

// Concept 26 — "Perforatie" · Ticket / instapkaart. Elke opdracht, factuur en certificaat is een
// tastbaar ticket: kaarten met geperforeerde scheurrand (ronde inkepingen langs een verticale
// scheurlijn), een afscheurbare stub met barcode en code, en stempels voor status
// (GEVERIFIEERD, BETAALD). Speels-premium, fysieke ticket-metafoor — nooit kinderachtig.
// Palet: bg #eef0f3, kaart #ffffff, ink #1c2530, ticket-accent warm-rood #d1462f,
// navy #274060, geverifieerd-groen #2f8f5b, muted #6b7684.
// Fonts: Space Grotesk (koppen/labels) + Spline Sans Mono (ticket-nummers/cijfers).

import { useState } from "react";
import {
  Search,
  MapPin,
  Check,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Minus,
  Plus,
  FileText,
  Bell,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#eef0f3",
  card: "#ffffff",
  ink: "#1c2530",
  inkSoft: "#3c4655",
  muted: "#6b7684",
  faint: "#98a1af",
  accent: "#d1462f",
  accentDeep: "#b23724",
  accentSoft: "rgba(209,70,47,0.10)",
  navy: "#274060",
  navySoft: "rgba(39,64,96,0.10)",
  green: "#2f8f5b",
  greenSoft: "rgba(47,143,91,0.12)",
  amber: "#c07d1e",
  amberSoft: "rgba(192,125,30,0.12)",
  line: "#e0e3e9",
  perf: "#c3c9d2",
};

const display = { fontFamily: "var(--font-lab-space)" };
const num = { fontFamily: "var(--font-lab-spline-mono)" };

const SHADOW = "0 14px 34px -20px rgba(28,37,48,0.34)";
const SHADOW_SM = "0 8px 20px -14px rgba(28,37,48,0.30)";

function statusStamp(s: CredStatus): { label: string; fg: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.navy, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.accent, Icon: AlertTriangle };
  }
}

// Barcode-strook — dunne verticale strepen, deterministisch uit een code afgeleid.
function Barcode({ seed, height = 30 }: { seed: string; height?: number }) {
  const chars = (seed + seed).split("");
  return (
    <div className="flex items-stretch overflow-hidden" style={{ height }} aria-hidden="true">
      {chars.map((ch, i) => {
        const code = ch.charCodeAt(0);
        const w = (code % 3) + 1;
        const gap = (code % 2) + 1;
        return (
          <span
            key={i}
            style={{
              width: w,
              marginRight: gap,
              background: C.ink,
              opacity: code % 5 === 0 ? 0.45 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

// Ronde inkepingen op de verticale scheurlijn — de perforatie tussen kaart en stub.
function Tear({ color = C.perf }: { color?: string }) {
  return (
    <div aria-hidden="true" className="relative w-0 shrink-0">
      <span
        className="absolute inset-y-3 left-0 border-l-2 border-dashed"
        style={{ borderColor: color }}
      />
      <span
        className="absolute left-0 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: C.bg }}
      />
      <span
        className="absolute bottom-0 left-0 h-3.5 w-3.5 -translate-x-1/2 translate-y-1/2 rounded-full"
        style={{ background: C.bg }}
      />
    </div>
  );
}

// Ronde/gedraaide stempel.
function Stamp({ label, color = C.accent }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex select-none items-center rounded-[6px] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]"
      style={{
        ...display,
        color,
        border: `2px solid ${color}`,
        transform: "rotate(-7deg)",
        boxShadow: `inset 0 0 0 1px ${color}22`,
      }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

function Sparkline({ data, color = C.accent }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 90;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Kicker({ children, color = C.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ ...display, color }}>
      {children}
    </p>
  );
}

export function Concept26() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...display,
        color: C.ink,
        background:
          "radial-gradient(900px 500px at 100% -5%, rgba(209,70,47,0.06), transparent 55%), " +
          C.bg,
      }}
    >
      <div className="flex min-h-[680px] flex-col">
        {/* Boarding-pass header / gate-balk */}
        <header className="shrink-0 border-b" style={{ borderColor: C.line, background: C.card }}>
          <div className="flex items-center gap-3 px-5 py-3.5 lg:px-8">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[16px] font-extrabold text-white"
              style={{ ...display, background: C.accent }}
            >
              Z
            </div>
            <div className="mr-2">
              <div
                className="text-[15px] font-extrabold leading-none tracking-tight"
                style={display}
              >
                ZZP PLATFORM
              </div>
              <div
                className="mt-0.5 text-[10.5px] uppercase tracking-[0.16em]"
                style={{ color: C.muted }}
              >
                Boarding · {PROFIEL.plaats}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2 rounded-[8px] border px-3.5 py-2 text-[12.5px] transition-colors hover:bg-[#f5f6f8] focus-visible:outline-none focus-visible:ring-2 sm:flex"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
              </button>
              <button
                className="relative rounded-[8px] border p-2.5 transition-colors hover:bg-[#f5f6f8] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              </button>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[12px] font-extrabold text-white"
                style={{ ...display, background: C.navy }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
            </div>
          </div>

          {/* Departure-board tabstrip */}
          <nav className="flex gap-1 overflow-x-auto px-4 lg:px-7" aria-label="Schermen">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-3.5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{ ...display, color: on ? C.accent : C.muted }}
                >
                  {s.label}
                  <span
                    className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full"
                    style={{ background: on ? C.accent : "transparent" }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-7 lg:px-8 lg:py-9">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Instapkaart · vandaag</Kicker>
          <h1
            className="mt-2.5 text-[32px] font-extrabold leading-[1.05] tracking-tight"
            style={display}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Drie matches klaar om op in te stappen, één certificaat vraagt aandacht. Scheur af wat
            je oppakt — de rest bewaren we netjes.
          </p>
        </div>
        <span
          className="hidden shrink-0 rounded-[8px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] sm:inline-block"
          style={{ ...num, color: C.navy, background: C.navySoft }}
        >
          {BERICHTEN.filter((b) => b.ongelezen).length} nieuwe berichten
        </span>
      </div>

      {/* KPI-ticketjes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-[14px] p-4"
            style={{ background: C.card, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.muted }}
            >
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-extrabold tabular-nums leading-none"
              style={{ ...num, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                style={{ ...num, color: k.up ? C.green : C.amber }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.green : C.amber} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-7 lg:col-span-2">
          <div>
            <h2 className="mb-4 text-[19px] font-extrabold tracking-tight" style={display}>
              Beste matches voor jou
            </h2>
            <div className="space-y-4">
              {OPDRACHTEN.map((o) => (
                <MatchTicket key={o.id} o={o} onOpen={onOpen} />
              ))}
            </div>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[19px] font-extrabold tracking-tight" style={display}>
                Recente berichten
              </h2>
              <span className="text-[11.5px] font-bold" style={{ color: C.accent }}>
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <div
              className="rounded-[14px] p-2"
              style={{ background: C.card, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
            >
              {BERICHTEN.map((b) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3.5 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[#f5f6f8]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-extrabold text-white"
                    style={{ ...display, background: b.ongelezen ? C.navy : C.faint }}
                  >
                    {b.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-bold" style={display}>
                        {b.van}
                      </p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.accent }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[12px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ ...num, color: C.faint }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-7">
          <div>
            <h2 className="mb-4 text-[19px] font-extrabold tracking-tight" style={display}>
              Jouw certificaten
            </h2>
            <div
              className="rounded-[14px] p-4"
              style={{ background: C.card, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
            >
              <div className="space-y-4">
                {CREDENTIALS.map((c) => {
                  const st = statusStamp(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                        style={{ background: `${st.fg}1f` }}
                        aria-hidden="true"
                      >
                        <st.Icon size={15} style={{ color: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold" style={display}>
                          {c.naam}
                        </p>
                        <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Volgende beste stap — ticket met stub */}
          <div
            className="flex overflow-hidden rounded-[14px]"
            style={{ background: C.card, boxShadow: SHADOW, border: `1px solid ${C.line}` }}
          >
            <div className="min-w-0 flex-1 p-5">
              <Kicker>Volgende stap</Kicker>
              <p className="mt-2 text-[16px] font-extrabold leading-snug" style={display}>
                {primair.titel}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-4 w-full rounded-[9px] px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2"
                style={{ ...display, background: C.accent }}
              >
                {primair.cta}
              </button>
            </div>
            <Tear />
            <div
              className="flex w-[54px] shrink-0 flex-col items-center justify-between py-4"
              style={{ background: "#fbfbfc" }}
            >
              <span
                className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ ...display, writingMode: "vertical-rl", color: C.muted }}
              >
                Actie
              </span>
              <Barcode seed="STEP-01" height={40} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchTicket({ o, onOpen }: { o: Opdracht; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full overflow-hidden rounded-[14px] text-left transition-transform hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2"
      style={{ background: C.card, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
    >
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] tabular-nums" style={{ ...num, color: C.faint }}>
            {o.id}
          </span>
          <span className="text-[10.5px]" style={{ color: C.muted }}>
            · {o.start}
          </span>
        </div>
        <p className="mt-1.5 truncate text-[15px] font-extrabold leading-snug" style={display}>
          {o.titel}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
          <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span
            className="text-[13px] font-extrabold tabular-nums"
            style={{ ...num, color: C.accent }}
          >
            {o.tarief}
          </span>
          <span className="text-[12px] tabular-nums" style={{ ...num, color: C.inkSoft }}>
            {o.uren}
          </span>
          <span
            className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold"
            style={{ color: C.navy }}
          >
            Instappen <ChevronRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
      <Tear />
      <div
        className="flex w-[92px] shrink-0 flex-col items-center justify-center gap-2 px-2 py-4"
        style={{ background: "#fbfbfc" }}
      >
        <span
          className="text-[9px] font-bold uppercase tracking-[0.14em]"
          style={{ ...display, color: C.muted }}
        >
          Match
        </span>
        <span
          className="text-[24px] font-extrabold tabular-nums leading-none"
          style={{ ...num, color: C.green }}
        >
          {o.match}
        </span>
        <Barcode seed={o.id} height={22} />
      </div>
    </button>
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
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Kicker color={C.navy}>Marktplaats · vertrekhal</Kicker>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={display}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-[12px] px-4 py-3.5"
        style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW_SM }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#98a1af]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...num, color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-[14px] px-6 py-16 text-center"
          style={{ background: C.card, border: `1px dashed ${C.perf}` }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.accentSoft }}
          >
            <Search size={26} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <p className="mt-4 text-[18px] font-extrabold" style={display}>
            Geen tickets gevonden
          </p>
          <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekwoorden aan of verbreed je beschikbaarheid. We laten het je weten zodra er
            een passende opdracht binnenkomt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o) => (
            <div
              key={o.id}
              className="flex overflow-hidden rounded-[16px]"
              style={{ background: C.card, boxShadow: SHADOW, border: `1px solid ${C.line}` }}
            >
              <div className="min-w-0 flex-1 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] tabular-nums" style={{ ...num, color: C.faint }}>
                    {o.id}
                  </span>
                  <span
                    className="rounded-[6px] px-2 py-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...num, color: C.green, background: C.greenSoft }}
                  >
                    {o.match}% match
                  </span>
                </div>
                <p className="mt-3 text-[17px] font-extrabold leading-snug" style={display}>
                  {o.titel}
                </p>
                <p
                  className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                      style={{ background: C.bg, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-4 flex items-center justify-between border-t border-dashed pt-4"
                  style={{ borderColor: C.perf }}
                >
                  <span
                    className="text-[14px] font-extrabold tabular-nums"
                    style={{ ...num, color: C.accent }}
                  >
                    {o.tarief}
                  </span>
                  <button
                    onClick={onOpen}
                    className="inline-flex items-center gap-1 text-[12.5px] font-bold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                    style={{ color: C.navy }}
                  >
                    Bekijk ticket <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <Tear />
              <div
                className="flex w-[62px] shrink-0 flex-col items-center justify-between py-5"
                style={{ background: "#fbfbfc" }}
              >
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{ ...display, writingMode: "vertical-rl", color: C.muted }}
                >
                  {o.uren}
                </span>
                <Barcode seed={o.id + o.plaats} height={44} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      {/* Hero-instapkaart */}
      <div
        className="overflow-hidden rounded-[18px]"
        style={{ background: C.card, boxShadow: SHADOW, border: `1px solid ${C.line}` }}
      >
        <div className="flex">
          <div className="min-w-0 flex-1 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Kicker>{opdracht.id}</Kicker>
                <h1
                  className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight"
                  style={display}
                >
                  {opdracht.titel}
                </h1>
                <p
                  className="mt-2 flex items-center gap-1.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} ·{" "}
                  {opdracht.plaats}
                </p>
              </div>
              <Stamp label="Beste match" color={C.green} />
            </div>
            <button
              className="mt-5 rounded-[10px] px-6 py-3 text-[13.5px] font-bold text-white transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2"
              style={{ ...display, background: C.accent }}
            >
              Reageer op opdracht
            </button>
          </div>
          <Tear color={C.perf} />
          <div
            className="flex w-[110px] shrink-0 flex-col items-center justify-center gap-2 py-6"
            style={{ background: "#fbfbfc" }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ ...display, color: C.muted }}
            >
              Match
            </span>
            <span
              className="text-[34px] font-extrabold tabular-nums leading-none"
              style={{ ...num, color: C.green }}
            >
              {opdracht.match}
            </span>
            <Barcode seed={opdracht.id + opdracht.titel} height={30} />
            <span className="text-[9px] tabular-nums" style={{ ...num, color: C.faint }}>
              {opdracht.id}
            </span>
          </div>
        </div>
        {/* gekartelde onderrand */}
        <div
          aria-hidden="true"
          className="h-2"
          style={{
            background: `radial-gradient(circle at 6px 8px, ${C.bg} 4px, transparent 4.5px)`,
            backgroundSize: "12px 8px",
            backgroundRepeat: "repeat-x",
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-[12px] p-4"
            style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW_SM }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[17px] font-extrabold tabular-nums"
              style={{ ...num, color: C.ink }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-[16px] p-6"
        style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW_SM }}
      >
        <h3 className="text-[19px] font-extrabold" style={display}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-[12px] p-5" style={{ background: C.greenSoft }}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ ...display, color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.green }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[12px] p-5" style={{ background: C.amberSoft }}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ ...display, color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${C.amber}30` }}
                    aria-hidden="true"
                  >
                    <Minus size={12} style={{ color: C.amber }} />
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
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={display}>
          Verificatie
        </h1>
      </div>

      <div
        className="flex items-center gap-5 rounded-[16px] p-6"
        style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW_SM }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px]"
          style={{ background: C.greenSoft }}
        >
          <Check size={30} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <div className="flex-1">
          <p className="text-[22px] font-extrabold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="font-bold tabular-nums" style={num}>
              {verified}
            </span>{" "}
            van{" "}
            <span className="font-bold tabular-nums" style={num}>
              {CREDENTIALS.length}
            </span>{" "}
            certificaten geverifieerd · 1 vraagt actie · alles veilig bewaard.
          </p>
        </div>
        <Stamp label="Gecheckt" color={C.green} />
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusStamp(c.status);
          return (
            <div
              key={c.naam}
              className="flex overflow-hidden rounded-[14px]"
              style={{ background: C.card, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4 p-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ background: `${st.fg}1f` }}
                >
                  <st.Icon size={18} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold" style={display}>
                    {c.naam}
                  </p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold sm:inline-flex"
                  style={{ color: st.fg, background: `${st.fg}1a` }}
                >
                  <st.Icon size={12} aria-hidden="true" />
                  {st.label}
                </span>
              </div>
              <Tear />
              <div
                className="flex w-[54px] shrink-0 items-center justify-center"
                style={{ background: "#fbfbfc" }}
              >
                <Barcode seed={c.naam} height={30} />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-[19px] font-extrabold tracking-tight" style={display}>
          Veilig bewaarde documenten
        </h2>
        <div
          className="rounded-[14px] p-2"
          style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW_SM }}
        >
          {DOCUMENTEN.map((d) => {
            const st = statusStamp(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3.5 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[#f5f6f8]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: C.bg }}
                  aria-hidden="true"
                >
                  <FileText size={16} style={{ color: C.muted }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold" style={display}>
                    {d.naam}
                  </p>
                  <p
                    className="truncate text-[11px] tabular-nums"
                    style={{ ...num, color: C.muted }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                  style={{ color: st.fg, background: `${st.fg}1a` }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, Icon: AlertTriangle },
    info: { fg: C.navy, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={display}>
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
          Eén ticket tegelijk. Wij houden de rest voor je in de gaten.
        </p>
      </div>
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex overflow-hidden rounded-[14px]"
              style={{ background: C.card, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
            >
              <div className="w-1.5 shrink-0" style={{ background: t.fg }} aria-hidden="true" />
              <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ background: `${t.fg}1f` }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] tabular-nums" style={{ ...num, color: C.faint }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[14.5px] font-extrabold" style={display}>
                      {a.titel}
                    </p>
                  </div>
                  <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-[9px] px-4 py-2 text-[12.5px] font-bold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                  style={{ ...display, color: t.fg, background: `${t.fg}1a` }}
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

function Facturen() {
  const tone: Record<string, { fg: string; stamp?: string }> = {
    Betaald: { fg: C.green, stamp: "Betaald" },
    Openstaand: { fg: C.amber },
    Concept: { fg: C.muted },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight" style={display}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2"
          style={{ ...display, background: C.accent }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="overflow-hidden rounded-[14px]"
        style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: SHADOW_SM }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10.5px] uppercase tracking-[0.1em]"
                style={{ borderColor: C.line, color: C.muted }}
              >
                <th className="px-5 py-3.5 font-bold">Nummer</th>
                <th className="px-5 py-3.5 font-bold">Klant</th>
                <th className="px-5 py-3.5 font-bold">Datum</th>
                <th className="px-5 py-3.5 text-right font-bold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = tone[f.status] ?? { fg: C.muted };
                return (
                  <tr
                    key={f.nr}
                    className="border-t transition-colors hover:bg-[#f5f6f8]"
                    style={{ borderColor: C.line }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ ...num, color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold">{f.klant}</td>
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ ...num, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-extrabold tabular-nums"
                      style={{ ...num, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold"
                        style={{ color: t.fg, background: `${t.fg}1a` }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
