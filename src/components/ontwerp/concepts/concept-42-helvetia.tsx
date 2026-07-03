"use client";

// Concept 42 — "Helvetia" · Zwitserse typografische stijl (International Style).
// Strikte basislijn-raster, flush-left, wiskundige witruimte, haarlijnen, oversized tabulaire
// cijfers als hoofdrol, minimale kleur. In de geest van Müller-Brockmann: zwart + wit + één
// signaalrood. Grote sectienummers (01/02/03), rigoureus 12-koloms gevoel, alles uitgelijnd op een
// raster, KPI's als reuzencijfers met een haarlijn eronder. Onderscheidend: geen serif, geen
// kaarten-met-schaduw, geen kleurvlakken — pure typografie en lijnwerk op een raster.
// Palet: bg #ffffff, inkt #111111, signaalrood #e2231a, warm-grijze haarlijnen #d6d6d1.
// Fonts: --font-lab-inter (Helvetica-substituut, strakke tracking) + --font-lab-plex-mono (data).

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  X,
  Minus,
  Plus,
  Search,
  Bell,
  Loader2,
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
  bg: "#ffffff",
  ink: "#111111",
  inkSoft: "#4a4a48",
  muted: "#767672",
  faint: "#a3a39e",
  hair: "#d6d6d1",
  hairSoft: "#e7e7e2",
  panel: "#f7f7f4",
  red: "#e2231a",
  redSoft: "#fbe6e5",
  green: "#1a7a3c",
};

const sans = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

type StatusMeta = { label: string; fg: string; Icon: LucideIcon; dot: string };

function statusStyle(s: CredStatus): StatusMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, Icon: Check, dot: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.inkSoft, Icon: Clock, dot: C.faint };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.red, Icon: AlertTriangle, dot: C.red };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.red, Icon: X, dot: C.red };
  }
}

/* ---------- Zwitserse bouwstenen ---------- */

// Sectiekop: groot nummer + haarlijn, flush-left uitlijning.
function SectionHead({
  index,
  title,
  note,
  action,
}: {
  index: string;
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-t-2 pt-3" style={{ borderColor: C.ink }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <span className="text-[13px] font-medium tabular-nums" style={{ ...mono, color: C.red }}>
            {index}
          </span>
          <div>
            <h1
              className="text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[30px]"
              style={{ ...sans, color: C.ink }}
            >
              {title}
            </h1>
            {note && (
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: C.muted }}>
                {note}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

function Kicker({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-[0.22em]"
      style={{ ...mono, color }}
    >
      {children}
    </span>
  );
}

function StatusRow({ meta, right }: { meta: StatusMeta; right?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${right ? "justify-end" : ""}`}
      style={{ ...mono, color: meta.fg }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: meta.dot }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

// Minimalistische lijn-grafiek als haarlijn.
function LineSpark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke={C.ink} strokeWidth={1.25} />
    </svg>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept42() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selected, setSelected] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (o: Opdracht) => {
    setSelected(o);
    setScreen("opdracht");
  };

  const activeIndex = SCREENS.findIndex((s) => s.key === screen);

  return (
    <div
      className="relative min-h-[680px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <div className="relative flex min-h-[680px]">
        {/* Zijbalk — genummerde index */}
        <aside
          className="hidden w-[228px] shrink-0 flex-col border-r px-6 py-7 md:flex"
          style={{ borderColor: C.hair }}
        >
          <div className="flex items-baseline gap-2 pb-8">
            <span className="h-3 w-3" style={{ background: C.red }} aria-hidden="true" />
            <div className="text-[15px] font-semibold tracking-[-0.02em]">Helvetia</div>
          </div>

          <Kicker>Index</Kicker>
          <nav className="mt-3 flex flex-col">
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-baseline gap-3 border-b py-2.5 text-left transition-colors focus-visible:bg-[#f7f7f4] focus-visible:outline-none"
                  style={{ borderColor: C.hairSoft }}
                >
                  <span
                    className="w-6 shrink-0 text-[11px] tabular-nums"
                    style={{ ...mono, color: on ? C.red : C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex-1 text-[13px] font-medium tracking-tight transition-colors"
                    style={{ color: on ? C.ink : C.muted }}
                  >
                    {s.label}
                  </span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.red }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t pt-4" style={{ borderColor: C.hair }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: C.ink, color: "#fff" }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold tracking-tight">
                  {PROFIEL.naam}
                </div>
                <div className="truncate text-[11px]" style={{ color: C.muted }}>
                  {PROFIEL.rol}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-4 border-b px-5 sm:px-8"
            style={{ borderColor: C.hair }}
          >
            <span
              className="text-[12px] font-medium tabular-nums"
              style={{ ...mono, color: C.red }}
            >
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <h2 className="text-[14px] font-semibold tracking-tight">
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-1">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f7f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]"
                aria-label="Zoeken"
              >
                <Search size={16} aria-hidden="true" style={{ color: C.inkSoft }} />
              </button>
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f7f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]"
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" style={{ color: C.inkSoft }} />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.red }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-4 overflow-x-auto border-b px-5 py-2.5 md:hidden"
            style={{ borderColor: C.hair }}
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex shrink-0 items-baseline gap-1.5 pb-1 text-[12.5px] font-medium tracking-tight focus-visible:outline-none"
                  style={{
                    color: on ? C.ink : C.muted,
                    borderBottom: `2px solid ${on ? C.red : "transparent"}`,
                  }}
                >
                  <span className="text-[9px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-8">
            {screen === "dashboard" && <Dashboard onOpen={openOpdracht} onScreen={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={selected} />}
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

function Dashboard({
  onOpen,
  onScreen,
}: {
  onOpen: (o: Opdracht) => void;
  onScreen: (s: ScreenKey) => void;
}) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Kop */}
      <div className="border-t-2 pt-4" style={{ borderColor: C.ink }}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <Kicker color={C.red}>Overzicht · {PROFIEL.plaats}</Kicker>
            <h1 className="mt-3 text-[34px] font-semibold leading-[0.98] tracking-[-0.03em] sm:text-[44px]">
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              Drie matches boven de 80 procent en een hoog vertrouwensniveau. Eén certificaat vraagt
              binnenkort aandacht.
            </p>
          </div>
          <div className="md:col-span-4 md:justify-self-end">
            <button
              onClick={() => onScreen("marktplaats")}
              className="inline-flex items-center gap-2 border px-4 py-2.5 text-[12.5px] font-medium tracking-tight text-white transition-colors hover:bg-[#333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
              style={{ background: C.ink, borderColor: C.ink }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI's als reuzencijfers */}
      <div>
        <div className="grid grid-cols-2 gap-px lg:grid-cols-4" style={{ background: C.hair }}>
          {KPIS.map((k) => (
            <div key={k.label} className="bg-white pb-4 pr-6 pt-1">
              <div className="flex items-start justify-between">
                <Kicker>{k.label}</Kicker>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.red }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p className="mt-3 text-[38px] font-semibold tabular-nums leading-none tracking-[-0.03em]">
                {k.value}
              </p>
              <div className="mt-3 border-t pt-2" style={{ borderColor: C.ink }}>
                <LineSpark data={k.spark} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Matches */}
        <div className="lg:col-span-7">
          <SectionHead index="01" title="Beste matches" />
          <div className="mt-2">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className="group grid w-full grid-cols-12 items-center gap-3 border-b py-4 text-left transition-colors hover:bg-[#f7f7f4] focus-visible:bg-[#f7f7f4] focus-visible:outline-none"
                style={{ borderColor: C.hairSoft }}
              >
                <span
                  className="col-span-2 text-[26px] font-semibold tabular-nums leading-none tracking-[-0.03em]"
                  style={{ color: o.match >= 90 ? C.red : C.ink }}
                >
                  {o.match}
                </span>
                <div className="col-span-8 min-w-0">
                  <p className="truncate text-[13.5px] font-semibold tracking-tight">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </p>
                </div>
                <span className="col-span-2 flex justify-end">
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: C.ink }}
                  />
                </span>
              </button>
            ))}
          </div>

          {/* Berichten */}
          <div className="mt-10">
            <SectionHead index="02" title="Berichten" />
            <div className="mt-2">
              {BERICHTEN.map((b) => (
                <div
                  key={b.van}
                  className="grid grid-cols-12 items-center gap-3 border-b py-3.5"
                  style={{ borderColor: C.hairSoft }}
                >
                  <div className="col-span-1">
                    {b.ongelezen ? (
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: C.red }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: C.hair }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="col-span-9 min-w-0">
                    <p className="truncate text-[12.5px] font-semibold tracking-tight">{b.van}</p>
                    <p className="truncate text-[12px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="col-span-2 text-right text-[11px] tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
              <p className="mt-2 text-[11px]" style={{ ...mono, color: C.muted }}>
                {ongelezen} ongelezen bericht{ongelezen === 1 ? "" : "en"}
              </p>
            </div>
          </div>
        </div>

        {/* Zijkolom */}
        <div className="lg:col-span-5">
          <SectionHead index="03" title="Certificaten" />
          <div className="mt-2">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="grid grid-cols-12 items-center gap-2 border-b py-3.5"
                  style={{ borderColor: C.hairSoft }}
                >
                  <div className="col-span-8 min-w-0">
                    <p className="truncate text-[12.5px] font-semibold tracking-tight">{c.naam}</p>
                    <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <StatusRow meta={st} right />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aanbevolen actie */}
          <div className="mt-8 border p-5" style={{ borderColor: C.ink }}>
            <Kicker color={C.red}>Aanbevolen nu</Kicker>
            <p className="mt-2.5 text-[17px] font-semibold leading-snug tracking-tight">
              {ACTIES[0]?.titel}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
              {ACTIES[0]?.detail}
            </p>
            <button
              onClick={() => onScreen("acties")}
              className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-tight transition-colors hover:text-[#e2231a] focus-visible:underline focus-visible:outline-none"
              style={{ color: C.ink }}
            >
              {ACTIES[0]?.cta} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        index="02"
        title="Open opdrachten"
        note="Gesorteerd op verwantschap. Elke rij uitgelijnd op het raster."
      />

      <div className="flex items-center gap-3 border-b py-2.5" style={{ borderColor: C.ink }}>
        <Search size={17} aria-hidden="true" style={{ color: C.inkSoft }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] tracking-tight outline-none placeholder:text-[#a3a39e]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="border py-20 text-center" style={{ borderColor: C.hair }}>
          <p className="text-[15px] font-semibold tracking-tight">Geen opdrachten gevonden</p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Niets voor &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 text-[12.5px] font-semibold tracking-tight transition-colors hover:text-[#e2231a] focus-visible:underline focus-visible:outline-none"
            style={{ color: C.ink }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div>
          {/* Tabelkop */}
          <div
            className="hidden grid-cols-12 gap-3 border-b pb-2 sm:grid"
            style={{ borderColor: C.ink }}
          >
            <span className="col-span-1">
              <Kicker>Nr</Kicker>
            </span>
            <span className="col-span-5">
              <Kicker>Opdracht</Kicker>
            </span>
            <span className="col-span-2">
              <Kicker>Tarief</Kicker>
            </span>
            <span className="col-span-2">
              <Kicker>Omvang</Kicker>
            </span>
            <span className="col-span-2 text-right">
              <Kicker>Match</Kicker>
            </span>
          </div>
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={() => onOpen(o)}
              className="group grid w-full grid-cols-12 items-center gap-3 border-b py-4 text-left transition-colors hover:bg-[#f7f7f4] focus-visible:bg-[#f7f7f4] focus-visible:outline-none"
              style={{ borderColor: C.hairSoft }}
            >
              <span
                className="col-span-2 text-[11px] tabular-nums sm:col-span-1"
                style={{ ...mono, color: C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="col-span-10 min-w-0 sm:col-span-5">
                <p className="truncate text-[14px] font-semibold tracking-tight">{o.titel}</p>
                <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 sm:hidden">
                  <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.inkSoft }}>
                    {o.tarief}
                  </span>
                  <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                    {o.uren}
                  </span>
                </div>
              </div>
              <span
                className="col-span-2 hidden text-[12.5px] font-medium tabular-nums sm:block"
                style={{ ...mono, color: C.inkSoft }}
              >
                {o.tarief.replace(" / uur", "")}
              </span>
              <span
                className="col-span-2 hidden text-[12.5px] tabular-nums sm:block"
                style={{ ...mono, color: C.muted }}
              >
                {o.uren}
              </span>
              <span
                className="col-span-2 text-right text-[24px] font-semibold tabular-nums leading-none tracking-[-0.03em]"
                style={{ color: o.match >= 90 ? C.red : C.ink }}
              >
                {o.match}
              </span>
            </button>
          ))}
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
    window.setTimeout(() => setState("sent"), 900);
  };

  const metrics: { l: string; v: string }[] = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}%` },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="border-t-2 pt-4" style={{ borderColor: C.ink }}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <Kicker color={C.red}>{opdracht.id}</Kicker>
              <Kicker>{opdracht.match}% verwantschap</Kicker>
            </div>
            <h1 className="mt-2.5 text-[30px] font-semibold leading-none tracking-[-0.03em]">
              {opdracht.titel}
            </h1>
            <p className="mt-2.5 text-[13px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 border px-5 py-2.5 text-[12.5px] font-medium tracking-tight text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
            style={{
              background: state === "sent" ? C.green : C.ink,
              borderColor: state === "sent" ? C.green : C.ink,
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <ArrowRight size={15} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>
      </div>

      {/* Metrics als reuzencijfers */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: C.hair }}>
        {metrics.map((m) => (
          <div key={m.l} className="bg-white pb-3 pr-4 pt-1">
            <Kicker>{m.l}</Kicker>
            <p className="mt-2.5 text-[22px] font-semibold tabular-nums leading-none tracking-[-0.03em]">
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Waarom */}
      <div>
        <SectionHead
          index="04"
          title="Waarom deze match"
          note="Onderbouwd op je geverifieerde profiel."
        />
        <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <Kicker color={C.green}>Pluspunten</Kicker>
            <ul className="mt-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-b py-2.5 text-[13px]"
                  style={{ borderColor: C.hairSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Kicker color={C.red}>Aandachtspunten</Kicker>
            <ul className="mt-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-b py-2.5 text-[13px]"
                  style={{ borderColor: C.hairSoft, color: C.inkSoft }}
                >
                  <Minus
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.red }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="border px-3 py-1 text-[11px] font-medium tracking-tight"
              style={{ borderColor: C.hair, color: C.inkSoft }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  const pct = Math.round((verified / total) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SectionHead
        index="04"
        title="Verificatie"
        note="Elk bewijsstuk onafhankelijk gecontroleerd — de basis van je vertrouwensniveau."
      />

      {/* Reuzencijfer gereedheid */}
      <div
        className="grid grid-cols-1 gap-6 border-y py-6 sm:grid-cols-12"
        style={{ borderColor: C.ink }}
      >
        <div className="sm:col-span-5">
          <Kicker color={C.red}>Gereedheid</Kicker>
          <p className="mt-2 text-[72px] font-semibold tabular-nums leading-none tracking-[-0.05em]">
            {pct}
            <span className="text-[32px]" style={{ color: C.muted }}>
              %
            </span>
          </p>
          <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
            {verified} van {total} geverifieerd · {attention} vraagt actie
          </p>
        </div>
        <div className="flex flex-col justify-end sm:col-span-7">
          <div className="flex h-2 overflow-hidden" style={{ background: C.hairSoft }}>
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="h-full"
                  style={{
                    width: `${100 / total}%`,
                    background: c.status === "VERIFIED" ? C.ink : st.dot,
                    marginRight: 1,
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
          <p
            className="mt-3 flex items-center gap-2 text-[12.5px] font-medium"
            style={{ color: C.green }}
          >
            <Check size={15} aria-hidden="true" /> {PROFIEL.trust}
          </p>
        </div>
      </div>

      {/* Certificaten */}
      <div>
        <div className="grid grid-cols-12 gap-3 border-b pb-2" style={{ borderColor: C.ink }}>
          <span className="col-span-6 sm:col-span-6">
            <Kicker>Certificaat</Kicker>
          </span>
          <span className="col-span-6 hidden sm:col-span-4 sm:block">
            <Kicker>Detail</Kicker>
          </span>
          <span className="col-span-6 text-right sm:col-span-2">
            <Kicker>Status</Kicker>
          </span>
        </div>
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="grid grid-cols-12 items-center gap-3 border-b py-4 transition-colors hover:bg-[#f7f7f4]"
              style={{ borderColor: C.hairSoft }}
            >
              <div className="col-span-6 flex items-center gap-3">
                {c.status === "SUBMITTED" ? (
                  <Loader2
                    size={16}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                    style={{ color: st.fg }}
                  />
                ) : (
                  <st.Icon size={16} aria-hidden="true" style={{ color: st.fg }} />
                )}
                <p className="truncate text-[13px] font-semibold tracking-tight">{c.naam}</p>
              </div>
              <p
                className="col-span-4 hidden truncate text-[12px] sm:block"
                style={{ color: C.muted }}
              >
                {c.detail}
              </p>
              <div className="col-span-6 flex justify-end sm:col-span-2">
                <StatusRow meta={st} right />
              </div>
            </div>
          );
        })}
      </div>

      {/* Documenten */}
      <div>
        <SectionHead index="05" title="Documenten" />
        <div className="mt-2">
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="grid grid-cols-12 items-center gap-3 border-b py-3.5"
                style={{ borderColor: C.hairSoft }}
              >
                <div className="col-span-8 min-w-0">
                  <p className="truncate text-[12.5px] font-semibold tracking-tight">{d.naam}</p>
                  <p className="truncate text-[11px]" style={{ ...mono, color: C.muted }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <div className="col-span-4 flex justify-end">
                  <StatusRow meta={st} right />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; Icon: LucideIcon; label: string }> = {
    warning: { fg: C.red, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.inkSoft, Icon: Bell, label: "Ter info" },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        index="05"
        title="Volgende acties"
        note="Op volgorde van urgentie. Eén regel, één beslissing."
      />
      <div>
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="grid grid-cols-12 items-start gap-4 border-b py-5"
              style={{ borderColor: C.hairSoft }}
            >
              <span
                className="col-span-2 text-[30px] font-semibold tabular-nums leading-none tracking-[-0.03em] sm:col-span-1"
                style={{ color: a.urgentie === "warning" ? C.red : C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="col-span-10 min-w-0 sm:col-span-8">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ ...mono, color: t.fg }}
                >
                  <t.Icon size={11} aria-hidden="true" /> {t.label}
                </span>
                <p className="mt-1.5 text-[14px] font-semibold tracking-tight">{a.titel}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-3 sm:justify-self-end">
                <button
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold tracking-tight transition-colors hover:text-[#e2231a] focus-visible:underline focus-visible:outline-none"
                  style={{ color: C.ink }}
                >
                  {a.cta} <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 border p-5" style={{ borderColor: C.hair }}>
        <Check size={18} aria-hidden="true" style={{ color: C.green }} />
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bijgewerkt. Nieuwe acties verschijnen hier zodra ze relevant worden.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; Icon: LucideIcon; label: string; dot: string }> = {
    Betaald: { fg: C.green, Icon: Check, label: "Betaald", dot: C.green },
    Openstaand: { fg: C.red, Icon: Clock, label: "Openstaand", dot: C.red },
    Concept: { fg: C.muted, Icon: Minus, label: "Concept", dot: C.faint },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        index="06"
        title="Facturen"
        note="Wat binnen is en wat nog komt."
        action={
          <button
            className="inline-flex shrink-0 items-center gap-2 border px-4 py-2 text-[12.5px] font-medium tracking-tight text-white transition-colors hover:bg-[#333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
            style={{ background: C.ink, borderColor: C.ink }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      {/* Reuzentotalen */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3" style={{ background: C.hair }}>
        {[
          { l: "Betaald (mnd)", v: "€ 5.552", c: C.ink },
          { l: "Openstaand", v: "€ 1.350", c: C.red },
          { l: "Concept", v: "€ 880", c: C.muted },
        ].map((s) => (
          <div key={s.l} className="bg-white pb-3 pr-4 pt-1">
            <Kicker>{s.l}</Kicker>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none tracking-[-0.03em]"
              style={{ color: s.c }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.ink}` }}>
              <th className="py-2.5 pr-4">
                <Kicker>Nummer</Kicker>
              </th>
              <th className="py-2.5 pr-4">
                <Kicker>Klant</Kicker>
              </th>
              <th className="hidden py-2.5 pr-4 sm:table-cell">
                <Kicker>Datum</Kicker>
              </th>
              <th className="py-2.5 pr-4 text-right">
                <Kicker>Bedrag</Kicker>
              </th>
              <th className="py-2.5 text-right">
                <Kicker>Status</Kicker>
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = statusTone[f.status] ?? statusTone.Concept!;
              return (
                <tr
                  key={f.nr}
                  className="border-b transition-colors hover:bg-[#f7f7f4]"
                  style={{ borderColor: C.hairSoft }}
                >
                  <td
                    className="py-4 pr-4 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="py-4 pr-4 text-[13px] font-semibold tracking-tight">{f.klant}</td>
                  <td
                    className="hidden py-4 pr-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="py-4 pr-4 text-right text-[14px] font-semibold tabular-nums tracking-tight">
                    {f.bedrag}
                  </td>
                  <td className="py-4 text-right">
                    <StatusRow
                      meta={{ label: t.label, fg: t.fg, Icon: t.Icon, dot: t.dot }}
                      right
                    />
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
