"use client";

// Concept 105 — "Karton" · Kraft/karton, duurzaam-tactiel.
// Gerecycled kraftpapier-oppervlak, subtiele corrugated ribbel-textuur, stiksel/dashed-randen en
// stempel-achtige status-badges als op een verzenddoos. Warm, eerlijk, materiaal-echt (sustainability
// 2026). Verzend-/logistiek-metafoor. Bricolage Grotesque (display/UI) + JetBrains Mono (codes).
// Palet: kraft #cbb188 achtergrond, doos-panel #e4d4b4, inkt #3a2f22, stempelrood #b4462f, eco-groen #5a6b3b.

import { useState } from "react";
import {
  Package,
  Stamp,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  ChevronLeft,
  Truck,
  MapPin,
  Leaf,
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
  kraft: "#c9ae83",
  kraftDeep: "#bda173",
  box: "#e6d7b8",
  boxSoft: "#ecdfc4",
  ink: "#3a2f22",
  inkSoft: "#5c4d38",
  muted: "#8a7758",
  faint: "#a8946f",
  line: "#9c8560",
  stampRed: "#b4462f",
  eco: "#5a6b3b",
  amber: "#a9701f",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Corrugated ribbel-textuur voor het karton-oppervlak.
const corrugated =
  "repeating-linear-gradient(90deg, rgba(58,47,34,0.05) 0px, rgba(58,47,34,0.05) 1px, transparent 1px, transparent 7px)";
const kraftGrain =
  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.10), transparent 40%), radial-gradient(circle at 80% 70%, rgba(58,47,34,0.06), transparent 45%)";

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Verzegeld", Icon: Check, color: C.eco };
    case "SUBMITTED":
      return { label: "In sortering", Icon: Clock, color: C.amber };
    case "EXPIRING":
      return { label: "Retour dreigt", Icon: AlertTriangle, color: C.stampRed };
    case "REJECTED":
      return { label: "Geweigerd", Icon: AlertTriangle, color: C.stampRed };
  }
}

function Box({
  children,
  className = "",
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[10px] ${className}`}
      style={{
        background: soft ? C.boxSoft : C.box,
        backgroundImage: corrugated,
        border: `1.5px dashed ${C.line}`,
        boxShadow: "0 1px 0 rgba(58,47,34,0.08), inset 0 0 0 3px rgba(255,255,255,0.20)",
      }}
    >
      {children}
    </div>
  );
}

// Stempel-badge zoals op een verzenddoos (roterende inktafdruk).
function Stamp2({ children, color = C.stampRed }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em]"
      style={{
        ...mono,
        color,
        border: `1.5px solid ${color}`,
        transform: "rotate(-2deg)",
        background: "rgba(255,255,255,0.14)",
      }}
    >
      {children}
    </span>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: C.muted, ...mono }}
    >
      {children}
    </p>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * 100},${26 - ((d - min) / range) * 22}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" className="h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.eco}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

export function Concept105() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...display,
        background: C.kraft,
        backgroundImage: kraftGrain,
        color: C.ink,
      }}
    >
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-7 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[8px]"
            style={{ background: C.ink, color: C.box }}
            aria-hidden="true"
          >
            <Package size={19} />
          </span>
          <div>
            <p className="text-[16px] font-extrabold leading-none tracking-[-0.01em]">Karton</p>
            <p className="mt-1 text-[11px]" style={{ color: C.muted, ...mono }}>
              Eerlijk werk, netjes verpakt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{ color: C.eco, ...mono }}
          >
            <Leaf size={13} aria-hidden="true" /> 100% gerecycled
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: C.ink, color: C.box }}
            aria-label={PROFIEL.naam}
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="mx-auto mt-6 flex max-w-6xl items-center gap-1.5 overflow-x-auto px-5 md:px-8"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[6px] px-3.5 py-2 text-[13px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                on
                  ? { background: C.ink, color: C.box }
                  : { color: C.inkSoft, border: `1.5px dashed transparent` }
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <div
        className="mx-auto mt-5 h-px max-w-6xl px-5 md:px-8"
        style={{ background: C.line }}
        aria-hidden="true"
      />

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
  return (
    <div className="space-y-6">
      <Box className="overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Stamp size={15} aria-hidden="true" style={{ color: C.stampRed }} />
              <Overline>Vrachtbrief · {PROFIEL.plaats}</Overline>
            </div>
            <h1 className="mt-3 text-[27px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[32px]">
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}. Alles staat klaar voor verzending.
            </h1>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Je zending loopt op schema. Eén pakket vraagt aandacht — de rest is netjes verzegeld.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Stamp2 color={C.eco}>Geverifieerd</Stamp2>
              <Stamp2 color={C.amber}>1 in sortering</Stamp2>
              <Stamp2>1 retour dreigt</Stamp2>
            </div>
          </div>
          <div
            className="flex flex-col justify-between rounded-[8px] p-5"
            style={{
              background: C.ink,
              color: C.box,
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 7px)",
            }}
          >
            <div>
              <span
                className="inline-block rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ background: C.stampRed, color: "#fff", ...mono }}
              >
                Prioriteit
              </span>
              <p className="mt-3 text-[16px] font-extrabold leading-snug">{primair.titel}</p>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ color: "rgba(230,215,184,0.72)" }}
              >
                {primair.detail}
              </p>
            </div>
            <button
              onClick={onOpen}
              className="group mt-5 inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-bold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 motion-reduce:hover:gap-2"
              style={{ background: C.box, color: C.ink }}
            >
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Box>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Box key={k.label} soft className="p-4">
            <p className="text-[12px] font-semibold" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div className="mt-1 flex items-end justify-between">
              <p
                className="text-[24px] font-extrabold tabular-nums tracking-[-0.01em]"
                style={mono}
              >
                {k.value}
              </p>
              <span
                className="mb-1 text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.eco : C.amber }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div className="mt-2">
              <Sparkline data={k.spark} />
            </div>
          </Box>
        ))}
      </div>

      <Box className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={16} aria-hidden="true" style={{ color: C.eco }} />
            <Overline>Best passende zending</Overline>
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
            {top.id}
          </span>
        </div>
        <button
          onClick={onOpen}
          className="mt-3 flex w-full items-center gap-4 rounded-[8px] p-3 text-left transition-colors hover:bg-[rgba(58,47,34,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        >
          <span
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[8px] text-[16px] font-extrabold tabular-nums"
            style={{ background: C.ink, color: C.box, ...mono }}
          >
            {top.match}
            <span className="text-[8px] font-semibold uppercase tracking-wider opacity-70">
              match
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-extrabold">{top.titel}</span>
            <span
              className="mt-0.5 flex items-center gap-1 text-[12.5px]"
              style={{ color: C.muted }}
            >
              <MapPin size={12} aria-hidden="true" /> {top.opdrachtgever} · {top.plaats} ·{" "}
              {top.tarief}
            </span>
          </span>
          <ArrowRight size={17} aria-hidden="true" style={{ color: C.faint }} />
        </button>
      </Box>
    </div>
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
          <Overline>Sorteercentrum</Overline>
          <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em]">Open zendingen</h1>
        </div>
        <div
          className="flex items-center gap-2 rounded-[8px] px-3 py-2"
          style={{ background: C.boxSoft, border: `1.5px dashed ${C.line}` }}
        >
          <Package size={15} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek zending…"
            aria-label="Opdrachten zoeken"
            className="w-40 bg-transparent text-[13px] outline-none placeholder:text-[#a8946f]"
            style={{ color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Box className="p-12 text-center">
          <Package size={26} aria-hidden="true" className="mx-auto" style={{ color: C.faint }} />
          <p className="mt-3 text-[15px] font-extrabold">Leeg magazijn</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen zending past bij “{q}”. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ background: C.ink, color: C.box }}
          >
            Zoekopdracht wissen
          </button>
        </Box>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <Box key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] text-[13px] font-extrabold tabular-nums"
                    style={{ background: C.ink, color: C.box, ...mono }}
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                      {o.id}
                    </span>
                    <h2 className="text-[15px] font-extrabold leading-snug">{o.titel}</h2>
                    <p className="text-[12.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: C.kraftDeep, color: C.ink }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between border-t pt-3"
                style={{ borderColor: C.line, borderStyle: "dashed" }}
              >
                <span className="text-[13px] font-extrabold tabular-nums" style={mono}>
                  {o.tarief}
                </span>
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 motion-reduce:hover:gap-1.5"
                  style={{ color: C.stampRed }}
                >
                  Openen <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </Box>
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
    { l: "Levering", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}%` },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors hover:text-[#3a2f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ color: C.muted }}
      >
        <ChevronLeft size={15} aria-hidden="true" /> Terug naar sorteercentrum
      </button>

      <Box className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[8px] text-[17px] font-extrabold tabular-nums"
              style={{ background: C.ink, color: C.box, ...mono }}
            >
              {opdracht.match}
              <span className="text-[8px] font-semibold uppercase tracking-wide opacity-70">
                match
              </span>
            </span>
            <div>
              <p className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                {opdracht.id}
              </p>
              <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
                {opdracht.titel}
              </h1>
              <p className="text-[13px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
          </div>
          <Stamp2 color={C.eco}>Verzendklaar</Stamp2>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {facts.map((f) => (
            <div
              key={f.l}
              className="rounded-[6px] p-3"
              style={{ background: C.boxSoft, border: `1px dashed ${C.line}` }}
            >
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                {f.l}
              </p>
              <p className="mt-1 text-[15px] font-extrabold tabular-nums" style={mono}>
                {f.v}
              </p>
            </div>
          ))}
        </div>
        <button
          className="mt-5 inline-flex items-center gap-2 rounded-[6px] px-5 py-2.5 text-[13px] font-bold transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 motion-reduce:hover:gap-2"
          style={{ background: C.ink, color: C.box }}
        >
          Reageer op zending <ArrowRight size={15} aria-hidden="true" />
        </button>
      </Box>

      <div className="grid gap-3 md:grid-cols-2">
        <Box soft className="p-5">
          <div className="flex items-center gap-2">
            <Check size={15} aria-hidden="true" style={{ color: C.eco }} />
            <Overline>Netjes verpakt · past</Overline>
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13.5px]">
                <Check size={16} aria-hidden="true" style={{ color: C.eco, marginTop: 1 }} />
                {r}
              </li>
            ))}
          </ul>
        </Box>
        <Box soft className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} aria-hidden="true" style={{ color: C.amber }} />
            <Overline>Breekbaar · aandacht</Overline>
          </div>
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
                  style={{ color: C.amber, marginTop: 1 }}
                />
                {r}
              </li>
            ))}
          </ul>
        </Box>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <Box className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Overline>Kwaliteitscontrole</Overline>
            <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em]">Verzegeling</h1>
            <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
              <span style={{ color: C.ink, fontWeight: 700 }}>{PROFIEL.trust}.</span> {verified} van{" "}
              {CREDENTIALS.length} documenten verzegeld en gecontroleerd.
            </p>
          </div>
          <Stamp size={30} aria-hidden="true" style={{ color: C.stampRed }} />
        </div>
      </Box>

      <div className="grid gap-3 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <Box key={c.naam} soft className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.kraftDeep, color: st.color }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-extrabold leading-snug">{c.naam}</p>
                    <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Stamp2 color={st.color}>
                  <st.Icon size={12} aria-hidden="true" /> {st.label}
                </Stamp2>
              </div>
            </Box>
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
        <Overline>Nog te verzenden</Overline>
        <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em]">Volgende acties</h1>
      </div>
      <div className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <Box key={a.titel} soft className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-[13px] font-extrabold tabular-nums"
                  style={{ background: warn ? C.stampRed : C.ink, color: C.box, ...mono }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[14.5px] font-extrabold">{a.titel}</h2>
                    <Stamp2 color={warn ? C.stampRed : C.muted}>{warn ? "Spoed" : "Info"}</Stamp2>
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-center rounded-[6px] px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={
                    warn
                      ? { background: C.stampRed, color: "#fff" }
                      : { border: `1.5px dashed ${C.line}`, color: C.ink }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </Box>
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
          <Overline>Vrachtbrieven</Overline>
          <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em]">Facturen</h1>
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: C.muted }}>
            Totaal afgeleverd
          </p>
          <p className="text-[20px] font-extrabold tabular-nums" style={mono}>
            {total}
          </p>
        </div>
      </div>

      <Box className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr style={{ borderBottom: `1.5px dashed ${C.line}` }}>
              {["Vrachtbrief", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
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
              const col = paid ? C.eco : open ? C.stampRed : C.muted;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(58,47,34,0.04)]"
                  style={{ borderBottom: `1px dashed ${C.line}` }}
                >
                  <td
                    className="px-4 py-3 text-[12.5px] tabular-nums"
                    style={{ color: C.muted, ...mono }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13.5px] font-bold">{f.klant}</td>
                  <td className="px-4 py-3 text-[12.5px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <Stamp2 color={col}>{f.status}</Stamp2>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13.5px] font-extrabold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
      <p className="text-[12px]" style={{ color: C.muted }}>
        {betaald.length} van {FACTUREN.length} vrachtbrieven afgeleverd en betaald.
      </p>
    </div>
  );
}
