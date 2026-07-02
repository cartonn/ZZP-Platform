"use client";

// Concept 14 — "Raster" · Zwitsers monochroom / typografisch raster (International Style).
// Streng, tijdloos, messcherp. Alleen zwart (#0a0a0a) op wit (#ffffff) + één rode signaalkleur
// (#e4002b). Zichtbaar hairline-kolomraster draagt de compositie; cijfers en labels dragen de
// hiërarchie — géén decoratie, geen gradients, geen schaduw, geen ronde hoeken. Grote Libre
// Franklin-koppen tegen mono Spline Sans Mono-labels met brede letter-spacing. Nummers indexeren
// alles (01, 02, …). Rood verschijnt uitsluitend als signaal: actief, urgent, drempel.
// Palet: paper #ffffff, ink #0a0a0a, inkSoft #3a3a3a, muted #6b6b6b, faint #9a9a9a,
// line #e4e4e4, lineHard #0a0a0a, red #e4002b, redSoft #fdecef.
// Fonts: Libre Franklin (tekst/koppen) + Spline Sans Mono (labels/cijfers/index).

import { useState } from "react";
import { ArrowUpRight, ArrowRight, Check, Minus, Plus, Search, X } from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  paper: "#ffffff",
  ink: "#0a0a0a",
  inkSoft: "#3a3a3a",
  muted: "#6b6b6b",
  faint: "#9a9a9a",
  line: "#e4e4e4",
  lineHard: "#0a0a0a",
  red: "#e4002b",
  redSoft: "#fdecef",
};

const sans = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Statuslabels — monochroom; alleen de urgente/afgewezen staat draagt rood.
function statusMeta(s: CredStatus): { label: string; red: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", red: false };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", red: false };
    case "EXPIRING":
      return { label: "VERLOOPT", red: true };
    case "REJECTED":
      return { label: "AFGEWEZEN", red: true };
  }
}

// ── Kleine bouwstenen ─────────────────────────────────────────────────────────

function Idx({ n }: { n: number }) {
  return (
    <span className="text-[11px] tabular-nums tracking-[0.1em]" style={{ ...mono, color: C.red }}>
      {String(n).padStart(2, "0")}
    </span>
  );
}

function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[10.5px] uppercase tracking-[0.22em] ${className}`}
      style={{ ...mono, color: C.muted }}
    >
      {children}
    </span>
  );
}

function SectionHead({ index, title, meta }: { index: number; title: string; meta?: string }) {
  return (
    <div
      className="flex items-end justify-between border-b pb-2"
      style={{ borderColor: C.lineHard }}
    >
      <div className="flex items-baseline gap-3">
        <Idx n={index} />
        <h2 className="text-[17px] font-semibold uppercase tracking-[0.02em]" style={sans}>
          {title}
        </h2>
      </div>
      {meta && (
        <span
          className="text-[11px] tabular-nums tracking-[0.08em]"
          style={{ ...mono, color: C.muted }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}

// Horizontale match-meter — hairline baseline, zwarte vulling, rode drempel op 90.
function MatchMeter({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.muted }}
        >
          Match
        </span>
        <span className="text-[13px] tabular-nums" style={{ ...mono, color: C.ink }}>
          {value}
          <span style={{ color: C.faint }}>%</span>
        </span>
      </div>
      <div className="relative mt-1 h-[6px] w-full" style={{ background: C.line }}>
        <div
          className="absolute left-0 top-0 h-full"
          style={{ width: `${value}%`, background: C.ink }}
        />
        {/* rode drempelmarkering op 90% */}
        <div
          className="absolute top-[-2px] h-[10px] w-[1.5px]"
          style={{ left: "90%", background: C.red }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function Concept14() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, background: C.paper, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Rail — genummerde, monochrome navigatie */}
        <aside
          className="hidden w-[228px] shrink-0 flex-col border-r md:flex"
          style={{ borderColor: C.lineHard }}
        >
          <div className="border-b px-5 py-5" style={{ borderColor: C.lineHard }}>
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center text-[13px] font-bold text-white"
                style={{ background: C.ink }}
              >
                Z
              </div>
              <span className="text-[14px] font-bold uppercase tracking-[0.14em]">Raster</span>
            </div>
            <p
              className="mt-3 text-[10px] uppercase leading-relaxed tracking-[0.18em]"
              style={{ ...mono, color: C.faint }}
            >
              ZZP · Werkplatform
              <br />
              Editie 2026
            </p>
          </div>

          <nav className="flex flex-col py-2">
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 border-b px-5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ borderColor: C.line, background: on ? C.ink : "transparent" }}
                >
                  <span
                    className="text-[11px] tabular-nums tracking-[0.1em]"
                    style={{ ...mono, color: on ? C.red : C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[13.5px] font-medium uppercase tracking-[0.06em]"
                    style={{ color: on ? C.paper : C.inkSoft }}
                  >
                    {s.label}
                  </span>
                  <ArrowRight
                    size={13}
                    aria-hidden="true"
                    className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: on ? C.paper : C.muted }}
                  />
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t px-5 py-4" style={{ borderColor: C.lineHard }}>
            <Kicker>Ingelogd als</Kicker>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center border text-[11px] font-bold tabular-nums"
                style={{ borderColor: C.lineHard, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{PROFIEL.naam}</div>
                <div
                  className="truncate text-[10px] uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Hoofdkolom */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Kop — display-titel + index */}
          <header
            className="flex shrink-0 items-end justify-between gap-4 border-b px-6 py-5"
            style={{ borderColor: C.lineHard }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Idx n={SCREENS.findIndex((s) => s.key === screen) + 1} />
                <Kicker>Werkplatform</Kicker>
              </div>
              <h1 className="mt-1 truncate text-[26px] font-bold uppercase leading-none tracking-[-0.01em]">
                {SCREENS.find((s) => s.key === screen)?.label}
              </h1>
            </div>
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <button
                className="flex items-center gap-2 border px-3 py-2 text-[12px] uppercase tracking-[0.1em] transition-colors hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.lineHard, ...mono }}
                aria-label="Zoeken openen"
              >
                <Search size={13} aria-hidden="true" />
                Zoek
              </button>
              <div
                className="border px-3 py-2 text-[11px] uppercase tracking-[0.14em]"
                style={{ borderColor: C.lineHard, ...mono, color: C.muted }}
              >
                <span style={{ color: C.red }}>●</span> 2 nieuw
              </div>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-0 overflow-x-auto border-b md:hidden"
            style={{ borderColor: C.lineHard }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 border-r px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    borderColor: C.line,
                    background: on ? C.ink : "transparent",
                    color: on ? C.paper : C.muted,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
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

// ── Dashboard ──────────────────────────────────────────────────────────────────

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const urgent =
    ACTIES.find((a) => a.urgentie === "warning") ?? (ACTIES[0] as (typeof ACTIES)[number]);
  return (
    <div>
      {/* KPI-raster met zichtbare kolomlijnen */}
      <div className="grid grid-cols-2 border-b lg:grid-cols-4" style={{ borderColor: C.lineHard }}>
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="border-b border-r px-5 py-6 lg:border-b-0"
            style={{ borderColor: C.line }}
          >
            <div className="flex items-center justify-between">
              <Idx n={i + 1} />
              <span
                className="text-[11px] tabular-nums"
                style={{ ...mono, color: k.up ? C.ink : C.muted }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div
              className="mt-6 text-[34px] font-bold tabular-nums leading-none tracking-[-0.02em]"
              style={sans}
            >
              {k.value}
            </div>
            <div
              className="mt-2 text-[11px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Beste matches */}
        <div
          className="border-b px-6 py-6 lg:col-span-2 lg:border-b-0 lg:border-r"
          style={{ borderColor: C.lineHard }}
        >
          <SectionHead index={1} title="Beste matches" meta={`${OPDRACHTEN.length} OPEN`} />
          <div className="mt-1">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 border-b py-4 text-left transition-colors last:border-0 hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderColor: C.line }}
              >
                <span
                  className="text-[30px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...sans, color: o.match >= 90 ? C.red : C.ink }}
                >
                  {o.match}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{o.titel}</span>
                  <span
                    className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief.replace(" / uur", "/u")}
                  </span>
                </span>
                <ArrowUpRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                  style={{ color: C.muted }}
                />
                <span className="sr-only">Rij {i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Volgende actie + credentials */}
        <div className="flex flex-col">
          <div className="border-b px-6 py-6" style={{ borderColor: C.lineHard }}>
            <SectionHead index={2} title="Actie" meta="PRIORITEIT" />
            <div className="mt-4 border-l-2 pl-4" style={{ borderColor: C.red }}>
              <Kicker className="!text-[#e4002b]">Vereist nu</Kicker>
              <p className="mt-2 text-[16px] font-semibold leading-snug">{urgent.titel}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                {urgent.detail}
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.red, borderColor: C.red }}
              >
                {urgent.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <SectionHead
              index={3}
              title="Credentials"
              meta={`${CREDENTIALS.filter((c) => c.status === "VERIFIED").length}/${CREDENTIALS.length}`}
            />
            <ul className="mt-1">
              {CREDENTIALS.map((c) => {
                const m = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 border-b py-3 last:border-0"
                    style={{ borderColor: C.line }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0"
                      style={{ background: m.red ? C.red : C.ink }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{c.naam}</span>
                    </span>
                    <span
                      className="shrink-0 text-[9.5px] uppercase tracking-[0.14em]"
                      style={{ ...mono, color: m.red ? C.red : C.muted }}
                    >
                      {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────────

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="px-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHead
          index={1}
          title="Open opdrachten"
          meta={`${filtered.length}/${OPDRACHTEN.length}`}
        />
      </div>

      {/* Zoekregel — hairline onder, mono */}
      <div
        className="mt-4 flex items-center gap-3 border-b pb-3"
        style={{ borderColor: C.lineHard }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="FILTER OP TITEL, PLAATS OF OPDRACHTGEVER"
          aria-label="Opdrachten filteren"
          className="w-full bg-transparent text-[12.5px] uppercase tracking-[0.08em] outline-none placeholder:text-[#9a9a9a]"
          style={{ ...mono, color: C.ink }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Filter wissen"
            className="shrink-0 border p-1 transition-colors hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: C.lineHard }}
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center border-b border-l border-r py-20 text-center"
          style={{ borderColor: C.line }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center border"
            style={{ borderColor: C.lineHard }}
          >
            <Search size={20} aria-hidden="true" style={{ color: C.muted }} />
          </div>
          <p className="mt-4 text-[15px] font-bold uppercase tracking-[0.06em]">Geen resultaten</p>
          <p className="mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen opdrachten voor &ldquo;{q}&rdquo;. Pas de filter aan of wis het.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#f5f5f5] focus-visible:outline-none focus-visible:ring-2"
            style={{ ...mono, borderColor: C.lineHard }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div
          className="mt-2 grid grid-cols-1 border-l md:grid-cols-2"
          style={{ borderColor: C.line }}
        >
          {filtered.map((o, i) => (
            <article
              key={o.id}
              className="flex flex-col border-b border-r px-5 py-5"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-start justify-between">
                <Idx n={i + 1} />
                <span
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {o.id}
                </span>
              </div>
              <h3 className="mt-3 text-[17px] font-bold leading-tight">{o.titel}</h3>
              <p
                className="mt-1 text-[11px] uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {o.opdrachtgever} · {o.plaats}
              </p>

              <div className="mt-4">
                <MatchMeter value={o.match} />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="border px-2 py-0.5 text-[9.5px] uppercase tracking-[0.1em]"
                    style={{ ...mono, borderColor: C.line, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div
                className="mt-4 flex items-center justify-between border-t pt-3"
                style={{ borderColor: C.line }}
              >
                <span className="text-[15px] font-bold tabular-nums" style={sans}>
                  {o.tarief}
                </span>
                <button
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:text-[#e4002b] focus-visible:outline-none focus-visible:ring-2"
                  style={{ ...mono }}
                >
                  Bekijk <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  return (
    <div>
      {/* Kop-blok */}
      <div className="border-b px-6 py-6" style={{ borderColor: C.lineHard }}>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.faint }}
          >
            {opdracht.id}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.red }}
          >
            Match {opdracht.match}%
          </span>
        </div>
        <h1 className="mt-2 text-[28px] font-bold uppercase leading-none tracking-[-0.01em]">
          {opdracht.titel}
        </h1>
        <p
          className="mt-2 text-[12px] uppercase tracking-[0.1em]"
          style={{ ...mono, color: C.muted }}
        >
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </div>

      {/* Kerncijfers — 4-koloms hairline-raster */}
      <div className="grid grid-cols-2 border-b sm:grid-cols-4" style={{ borderColor: C.lineHard }}>
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "/ uur" },
          { l: "Omvang", v: opdracht.uren.replace(" u/week", ""), s: "u / week" },
          {
            l: "Start",
            v: opdracht.start.replace("Per ", ""),
            s: opdracht.start.startsWith("Per") ? "per" : "",
          },
          { l: "Match", v: `${opdracht.match}`, s: "%" },
        ].map((m, i) => (
          <div
            key={m.l}
            className="border-r px-5 py-5"
            style={{ borderColor: C.line, borderRight: i === 3 ? "none" : undefined }}
          >
            <Kicker>{m.l}</Kicker>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-[24px] font-bold tabular-nums leading-none" style={sans}>
                {m.v}
              </span>
              <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
                {m.s}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Redenen */}
        <div
          className="border-b px-6 py-6 lg:col-span-2 lg:border-b-0 lg:border-r"
          style={{ borderColor: C.lineHard }}
        >
          <SectionHead index={1} title="Waarom deze match" meta="TRANSPARANT" />
          <div className="mt-5">
            <Kicker>Pluspunten</Kicker>
            <ul className="mt-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-b py-2.5 text-[13.5px] last:border-0"
                  style={{ borderColor: C.line }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    style={{ color: C.ink, marginTop: 1, flexShrink: 0 }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <Kicker className="!text-[#e4002b]">Aandachtspunten</Kicker>
            <ul className="mt-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-b py-2.5 text-[13.5px] last:border-0"
                  style={{ borderColor: C.line, color: C.inkSoft }}
                >
                  <Minus
                    size={16}
                    aria-hidden="true"
                    style={{ color: C.red, marginTop: 1, flexShrink: 0 }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Reageren */}
        <div className="px-6 py-6">
          <SectionHead index={2} title="Reageren" />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="border px-2 py-0.5 text-[9.5px] uppercase tracking-[0.1em]"
                style={{ ...mono, borderColor: C.line, color: C.inkSoft }}
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
            Je geverifieerde profiel wordt direct meegestuurd. De opdrachtgever reageert gemiddeld
            binnen 6 uur.
          </p>

          {state === "sent" ? (
            <div
              className="mt-5 flex items-center gap-3 border px-4 py-3"
              style={{ borderColor: C.lineHard }}
            >
              <Check size={18} aria-hidden="true" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={mono}>
                Reactie verstuurd
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                setState("sending");
                window.setTimeout(() => setState("sent"), 900);
              }}
              disabled={state === "sending"}
              className="mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-70"
              style={{ background: C.ink }}
            >
              {state === "sending" ? (
                <>
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Versturen…
                </>
              ) : (
                <>
                  Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div>
      {/* Trust-balk */}
      <div className="grid grid-cols-2 border-b sm:grid-cols-4" style={{ borderColor: C.lineHard }}>
        {[
          { l: "Vertrouwen", v: "HOOG", red: false, mono: false },
          { l: "Geverifieerd", v: `${verified}/${CREDENTIALS.length}`, red: false, mono: true },
          { l: "In beoordeling", v: "1", red: false, mono: true },
          { l: "Verloopt", v: "1", red: true, mono: true },
        ].map((s, i) => (
          <div
            key={s.l}
            className="border-r px-5 py-6"
            style={{ borderColor: C.line, borderRight: i === 3 ? "none" : undefined }}
          >
            <Kicker className={s.red ? "!text-[#e4002b]" : ""}>{s.l}</Kicker>
            <div
              className="mt-3 text-[26px] font-bold uppercase tabular-nums leading-none"
              style={{ ...(s.mono ? mono : sans), color: s.red ? C.red : C.ink }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-6">
        <SectionHead index={1} title="Credentials" meta="VOLLEDIG OVERZICHT" />
        <table className="mt-2 w-full text-left">
          <thead>
            <tr
              className="border-b text-[9.5px] uppercase tracking-[0.14em]"
              style={{ borderColor: C.lineHard, ...mono, color: C.muted }}
            >
              <th className="py-2 font-medium">Credential</th>
              <th className="hidden py-2 font-medium sm:table-cell">Detail</th>
              <th className="py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((c) => {
              const m = statusMeta(c.status);
              return (
                <tr key={c.naam} className="border-b" style={{ borderColor: C.line }}>
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0"
                        style={{ background: m.red ? C.red : C.ink }}
                        aria-hidden="true"
                      />
                      <span className="text-[14px] font-medium">{c.naam}</span>
                    </div>
                  </td>
                  <td
                    className="hidden py-3.5 text-[12px] sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {c.detail}
                  </td>
                  <td className="py-3.5 text-right">
                    <span
                      className="text-[10px] uppercase tracking-[0.14em]"
                      style={{ ...mono, color: m.red ? C.red : C.inkSoft }}
                    >
                      {m.label}
                    </span>
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

// ── Acties ──────────────────────────────────────────────────────────────────────

function Acties() {
  return (
    <div className="px-6 py-6">
      <SectionHead index={1} title="Volgende acties" meta={`${ACTIES.length} OPEN`} />
      <ol className="mt-1">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b py-5 last:border-0"
              style={{ borderColor: C.line }}
            >
              <span
                className="text-[26px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: warn ? C.red : C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {warn && (
                    <span
                      className="h-2 w-2 shrink-0"
                      style={{ background: C.red }}
                      aria-hidden="true"
                    />
                  )}
                  <p className="text-[15px] font-semibold leading-snug">{a.titel}</p>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={
                  warn
                    ? { background: C.red, borderColor: C.red, color: C.paper }
                    : { borderColor: C.lineHard, color: C.ink }
                }
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ────────────────────────────────────────────────────────────────────

function Facturen() {
  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand").length;
  return (
    <div className="px-6 py-6">
      <div
        className="flex items-center justify-between border-b pb-2"
        style={{ borderColor: C.lineHard }}
      >
        <div className="flex items-baseline gap-3">
          <Idx n={1} />
          <h2 className="text-[17px] font-semibold uppercase tracking-[0.02em]">Facturen</h2>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.ink }}
        >
          <Plus size={13} aria-hidden="true" /> Nieuw
        </button>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr
              className="border-b text-[9.5px] uppercase tracking-[0.14em]"
              style={{ borderColor: C.lineHard, ...mono, color: C.muted }}
            >
              <th className="py-2 font-medium">Nummer</th>
              <th className="py-2 font-medium">Klant</th>
              <th className="py-2 font-medium">Datum</th>
              <th className="py-2 text-right font-medium">Bedrag</th>
              <th className="py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const open = f.status === "Openstaand";
              return (
                <tr key={f.nr} className="border-b" style={{ borderColor: C.line }}>
                  <td
                    className="py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="py-3.5 text-[13.5px] font-medium">{f.klant}</td>
                  <td
                    className="py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="py-3.5 text-right text-[14px] font-bold tabular-nums" style={sans}>
                    {f.bedrag}
                  </td>
                  <td className="py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em]"
                      style={{ ...mono, color: open ? C.red : C.inkSoft }}
                    >
                      {open && (
                        <span
                          className="h-1.5 w-1.5"
                          style={{ background: C.red }}
                          aria-hidden="true"
                        />
                      )}
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className="mt-4 flex items-center justify-between border-t pt-4"
        style={{ borderColor: C.lineHard }}
      >
        <Kicker>
          {NAV[5]} · {openstaand} openstaand
        </Kicker>
        <span className="text-[13px] tabular-nums" style={{ ...mono, color: C.muted }}>
          Totaal open: <span style={{ color: C.red }}>€ 1.350</span>
        </span>
      </div>
    </div>
  );
}
