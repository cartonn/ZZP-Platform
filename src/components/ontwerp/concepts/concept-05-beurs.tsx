"use client";

// Concept 05 — "Beurs" · Data-dicht pro (Bloomberg-terminal voor ZZP, LICHT).
// Maximale informatiedichtheid voor de power-user/bemiddelaar — "death of white space".
// Compacte rijen (~py-1.5), kleine type (12–13px), dichte multi-kolomtabellen, tabulaire
// cijfers overal, inline sparklines, persistente dichte statsbalk, twee-paneel list+detail.
// Koele neutrale grijzen, functionele accenten (emerald omhoog / rood omlaag), één
// structureel accent (indigo). Mono-cijfers. Toetshints. Serieus, efficiënt.
// Palet: canvas #f4f5f7, surface #ffffff, line #e3e6eb, ink #1c2026, accent #3556d4.
// Fonts: Geist (UI) + JetBrains Mono (cijfers) + Geist Mono (labels/hints).

import { useState } from "react";
import {
  LayoutGrid,
  CandlestickChart,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  ArrowUp,
  ArrowDown,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  Command,
  Circle,
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
  canvas: "#f4f5f7",
  surface: "#ffffff",
  surfaceAlt: "#fafbfc",
  rowHover: "#f1f3f6",
  line: "#e3e6eb",
  lineSoft: "#eef0f3",
  ink: "#1c2026",
  inkSoft: "#3f4651",
  muted: "#697282",
  faint: "#9aa2b1",
  accent: "#3556d4",
  accentSoft: "#eaeefc",
  up: "#0f9d6b",
  upSoft: "#e4f5ee",
  down: "#d13b3b",
  downSoft: "#fbe9e9",
  amber: "#c2870c",
  amberSoft: "#fbf2dd",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };
const monoLabel = { fontFamily: "var(--font-lab-geist-mono)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: CandlestickChart,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

const NAV_TICK: Record<ScreenKey, string> = {
  dashboard: "DASH",
  marktplaats: "MKT",
  opdracht: "OPD",
  verificatie: "VER",
  acties: "ACT",
  facturen: "FAC",
  documenten: "DOC",
  berichten: "MSG",
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "VERIFIED", fg: C.up, bg: C.upSoft };
    case "SUBMITTED":
      return { label: "IN REVIEW", fg: C.accent, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "EXPIRING", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "REJECTED", fg: C.down, bg: C.downSoft };
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 72;
  const h = 20;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[9.5px] font-medium uppercase tracking-[0.14em]"
      style={{ color: C.faint, ...monoLabel }}
    >
      {children}
    </span>
  );
}

export function Concept05() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar — compact rail */}
        <aside
          className="hidden w-[176px] shrink-0 flex-col border-r md:flex"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div
            className="flex h-11 items-center gap-2 border-b px-3"
            style={{ borderColor: C.line }}
          >
            <div
              className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-white"
              style={{ background: C.accent }}
            >
              Z
            </div>
            <span className="text-[12px] font-semibold tracking-tight">ZZP Terminal</span>
          </div>

          <nav className="flex flex-col py-1.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.accentSoft : "transparent",
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-0 h-full w-[2px]"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={14} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  <span className="flex-1">{s.label}</span>
                  <Tick>{NAV_TICK[s.key]}</Tick>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t px-3 py-2.5" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ background: C.inkSoft, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11.5px] font-semibold">{PROFIEL.naam}</div>
                <div className="truncate text-[10px]" style={{ color: C.faint }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-11 shrink-0 items-center gap-3 border-b px-4"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <span className="text-[12px] font-semibold tracking-tight">
              {SCREENS.find((s) => s.key === screen)?.label}
            </span>
            <span className="text-[10.5px]" style={{ color: C.faint, ...monoLabel }}>
              {PROFIEL.rol}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="flex items-center gap-2 rounded border px-2.5 py-1 text-[11.5px] transition-colors hover:bg-[#f1f3f6] focus-visible:outline-none focus-visible:ring-1"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={13} aria-hidden="true" />
                <span>Zoek / commando</span>
                <kbd
                  className="flex items-center gap-0.5 rounded px-1 text-[9.5px]"
                  style={{ background: C.lineSoft, color: C.faint, ...mono }}
                >
                  <Command size={8} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded border p-1.5 transition-colors hover:bg-[#f1f3f6] focus-visible:outline-none focus-visible:ring-1"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={14} aria-hidden="true" />
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.down }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Persistente dichte statsbalk */}
          <div
            className="flex shrink-0 items-stretch divide-x overflow-x-auto border-b"
            style={{ borderColor: C.line, background: C.surfaceAlt }}
          >
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="flex min-w-[148px] flex-1 items-center justify-between gap-3 px-3.5 py-2"
                style={{ borderColor: C.line }}
              >
                <div className="min-w-0">
                  <Tick>{k.label}</Tick>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-[15px] font-semibold tabular-nums leading-tight"
                      style={mono}
                    >
                      {k.value}
                    </span>
                    <span
                      className="inline-flex items-center text-[10.5px] font-medium tabular-nums"
                      style={{ color: k.up ? C.up : C.down, ...mono }}
                    >
                      {k.up ? (
                        <ArrowUp size={10} aria-hidden="true" />
                      ) : (
                        <ArrowDown size={10} aria-hidden="true" />
                      )}
                      {k.trend}
                    </span>
                  </div>
                </div>
                <Sparkline data={k.spark} color={k.up ? C.up : C.down} />
              </div>
            ))}
          </div>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1 overflow-x-auto border-b px-2 py-1.5 md:hidden"
            style={{ borderColor: C.line, background: C.surface }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1"
                  style={{
                    color: on ? C.accent : C.muted,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats />}
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

function SectionBar({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      className="flex items-center justify-between border-b px-3.5 py-1.5"
      style={{ borderColor: C.line, background: C.surfaceAlt }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{title}</span>
      {hint && (
        <span className="text-[10px]" style={{ color: C.faint, ...monoLabel }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-px lg:grid-cols-3" style={{ background: C.line }}>
      {/* Hoofdtabel: matches */}
      <div className="lg:col-span-2" style={{ background: C.surface }}>
        <SectionBar title="Beste matches" hint="SORTED · MATCH DESC" />
        <table className="w-full text-left">
          <thead>
            <tr
              className="border-b text-[9.5px] uppercase tracking-[0.1em]"
              style={{ borderColor: C.line, color: C.faint }}
            >
              <th className="px-3.5 py-1.5 font-medium">ID</th>
              <th className="px-3.5 py-1.5 font-medium">Opdracht</th>
              <th className="px-3.5 py-1.5 text-right font-medium">Tarief</th>
              <th className="px-3.5 py-1.5 text-right font-medium">Uren</th>
              <th className="px-3.5 py-1.5 text-right font-medium">Match</th>
            </tr>
          </thead>
          <tbody>
            {OPDRACHTEN.map((o) => (
              <tr
                key={o.id}
                onClick={onOpen}
                className="cursor-pointer border-b transition-colors last:border-0 hover:bg-[#f1f3f6]"
                style={{ borderColor: C.lineSoft }}
              >
                <td className="px-3.5 py-1.5 text-[11px]" style={{ color: C.muted, ...mono }}>
                  {o.id}
                </td>
                <td className="px-3.5 py-1.5">
                  <div className="text-[12.5px] font-medium leading-tight">{o.titel}</div>
                  <div className="text-[10.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats}
                  </div>
                </td>
                <td
                  className="px-3.5 py-1.5 text-right text-[12px] tabular-nums"
                  style={{ ...mono, color: C.inkSoft }}
                >
                  {o.tarief.replace(" / uur", "")}
                </td>
                <td
                  className="px-3.5 py-1.5 text-right text-[12px] tabular-nums"
                  style={{ ...mono, color: C.muted }}
                >
                  {o.uren.replace(" u/week", "u")}
                </td>
                <td className="px-3.5 py-1.5 text-right">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums"
                    style={{ background: C.upSoft, color: C.up, ...mono }}
                  >
                    {o.match}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zijpaneel: credentials + acties */}
      <div className="flex flex-col" style={{ background: C.surface }}>
        <SectionBar title="Credentials" hint="2/4 VERIFIED" />
        <div className="divide-y" style={{ borderColor: C.lineSoft }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div key={c.naam} className="flex items-center gap-2.5 px-3.5 py-2">
                <Circle size={7} aria-hidden="true" style={{ color: st.fg, fill: st.fg }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium leading-tight">{c.naam}</div>
                  <div className="truncate text-[10.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide"
                  style={{ color: st.fg, background: st.bg, ...monoLabel }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        <SectionBar title="Acties vereist" hint={`${ACTIES.length} OPEN`} />
        <div className="divide-y" style={{ borderColor: C.lineSoft }}>
          {ACTIES.map((a) => (
            <div key={a.titel} className="flex items-start gap-2.5 px-3.5 py-2">
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: a.urgentie === "warning" ? C.amber : C.accent }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium leading-tight">{a.titel}</div>
                <div className="text-[10.5px]" style={{ color: C.muted }}>
                  {a.cta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Marktplaats() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const current = filtered[sel] ?? filtered[0];

  return (
    <div
      className="grid grid-cols-1 gap-px lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      style={{ background: C.line }}
    >
      {/* Lijst-paneel */}
      <div className="flex flex-col" style={{ background: C.surface }}>
        <div
          className="flex items-center gap-2 border-b px-3 py-1.5"
          style={{ borderColor: C.line, background: C.surfaceAlt }}
        >
          <Search size={13} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            placeholder="Filter opdrachten…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#9aa2b1]"
            style={{ color: C.ink }}
          />
          <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <AlertTriangle size={20} aria-hidden="true" style={{ color: C.faint }} />
            <p className="mt-2 text-[12.5px] font-semibold">Geen resultaten</p>
            <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
              Geen opdrachten voor &ldquo;{q}&rdquo;. Pas de filter aan.
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((o, i) => {
              const on = current?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setSel(i)}
                  aria-current={on ? "true" : undefined}
                  className="flex w-full items-center gap-3 border-b px-3.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset"
                  style={{
                    borderColor: C.lineSoft,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  <span className="text-[10.5px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {o.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium leading-tight">
                      {o.titel}
                    </div>
                    <div className="truncate text-[10.5px]" style={{ color: C.muted }}>
                      {o.plaats}
                    </div>
                  </div>
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ color: C.up, ...mono }}
                  >
                    {o.match}%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail-paneel */}
      <div style={{ background: C.surface }}>
        {current ? (
          <DetailBody opdracht={current} />
        ) : (
          <div className="flex h-full items-center justify-center px-6 py-16 text-center">
            <p className="text-[12px]" style={{ color: C.muted }}>
              Selecteer een opdracht.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailBody({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div>
      <SectionBar title={opdracht.id} hint={`MATCH ${opdracht.match}%`} />
      <div className="px-4 py-3">
        <h2 className="text-[15px] font-semibold leading-tight tracking-tight">{opdracht.titel}</h2>
        <p className="mt-0.5 text-[11.5px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>

        <div
          className="mt-3 grid grid-cols-4 divide-x rounded border"
          style={{ borderColor: C.line }}
        >
          {[
            { l: "TARIEF", v: opdracht.tarief.replace(" / uur", "") },
            { l: "OMVANG", v: opdracht.uren.replace(" u/week", "u") },
            { l: "START", v: opdracht.start.replace("Per ", "") },
            { l: "MATCH", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="px-2.5 py-1.5" style={{ borderColor: C.line }}>
              <Tick>{m.l}</Tick>
              <div className="text-[13px] font-semibold tabular-nums" style={mono}>
                {m.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: C.lineSoft, color: C.inkSoft }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <SectionBar title="Waarom deze match" hint="EXPLAINABLE" />
      <div className="px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: C.up }}>
          Pluspunten
        </p>
        <ul className="mt-1.5 space-y-1">
          {opdracht.redenen.plus.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[12px]">
              <Check size={13} aria-hidden="true" style={{ color: C.up, marginTop: 1 }} />
              {r}
            </li>
          ))}
        </ul>
        <p
          className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: C.amber }}
        >
          Aandachtspunten
        </p>
        <ul className="mt-1.5 space-y-1">
          {opdracht.redenen.min.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.inkSoft }}>
              <Minus size={13} aria-hidden="true" style={{ color: C.amber, marginTop: 1 }} />
              {r}
            </li>
          ))}
        </ul>
        <button
          className="mt-3.5 w-full rounded px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          Reageer op opdracht
        </button>
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-3xl" style={{ background: C.surface }}>
      <DetailBody opdracht={opdracht} />
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div>
      <SectionBar title="Trust-samenvatting" hint={`${verified}/${CREDENTIALS.length} VERIFIED`} />
      <div className="flex items-center gap-4 px-4 py-3" style={{ background: C.surface }}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
          style={{ background: C.upSoft }}
        >
          <ShieldCheck size={20} aria-hidden="true" style={{ color: C.up }} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[11.5px]" style={{ color: C.muted }}>
            <span style={mono}>{verified}</span>/<span style={mono}>{CREDENTIALS.length}</span>{" "}
            credentials geverifieerd · <span style={mono}>1</span> verloopt binnenkort
          </p>
        </div>
        <div className="hidden gap-4 sm:flex">
          {[
            { l: "VERIFIED", v: verified, fg: C.up },
            { l: "PENDING", v: 1, fg: C.accent },
            { l: "EXPIRING", v: 1, fg: C.amber },
          ].map((s) => (
            <div key={s.l} className="text-right">
              <div
                className="text-[16px] font-semibold tabular-nums"
                style={{ ...mono, color: s.fg }}
              >
                {s.v}
              </div>
              <Tick>{s.l}</Tick>
            </div>
          ))}
        </div>
      </div>

      <SectionBar title="Credentials" hint="ALL" />
      <table className="w-full text-left" style={{ background: C.surface }}>
        <thead>
          <tr
            className="border-b text-[9.5px] uppercase tracking-[0.1em]"
            style={{ borderColor: C.line, color: C.faint }}
          >
            <th className="px-4 py-1.5 font-medium">Credential</th>
            <th className="px-4 py-1.5 font-medium">Detail</th>
            <th className="px-4 py-1.5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <tr
                key={c.naam}
                className="border-b transition-colors last:border-0 hover:bg-[#f1f3f6]"
                style={{ borderColor: C.lineSoft }}
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {c.status === "VERIFIED" ? (
                      <Check size={13} aria-hidden="true" style={{ color: st.fg }} />
                    ) : c.status === "SUBMITTED" ? (
                      <Clock size={13} aria-hidden="true" style={{ color: st.fg }} />
                    ) : (
                      <AlertTriangle size={13} aria-hidden="true" style={{ color: st.fg }} />
                    )}
                    <span className="text-[12.5px] font-medium">{c.naam}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </td>
                <td className="px-4 py-2 text-right">
                  <span
                    className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide"
                    style={{ color: st.fg, background: st.bg, ...monoLabel }}
                  >
                    {st.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Acties() {
  return (
    <div>
      <SectionBar title="Volgende acties" hint={`${ACTIES.length} OPEN · PRIORITEIT`} />
      <table className="w-full text-left" style={{ background: C.surface }}>
        <tbody>
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            return (
              <tr
                key={a.titel}
                className="border-b transition-colors last:border-0 hover:bg-[#f1f3f6]"
                style={{ borderColor: C.lineSoft }}
              >
                <td className="w-10 px-4 py-2.5 align-top">
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: C.faint, ...mono }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-2 py-2.5 align-top">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: warn ? C.amber : C.accent }}
                    aria-hidden="true"
                  />
                </td>
                <td className="px-2 py-2.5">
                  <div className="text-[12.5px] font-medium">{a.titel}</div>
                  <div className="text-[11px]" style={{ color: C.muted }}>
                    {a.detail}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right align-top">
                  <button
                    className="rounded border px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-[#f1f3f6] focus-visible:outline-none focus-visible:ring-1"
                    style={{
                      borderColor: warn ? C.amber : C.line,
                      color: warn ? C.amber : C.accent,
                    }}
                  >
                    {a.cta}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.up, bg: C.upSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  return (
    <div>
      <div
        className="flex items-center justify-between border-b px-3.5 py-1.5"
        style={{ borderColor: C.line, background: C.surfaceAlt }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Facturen</span>
        <button
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          <Plus size={12} aria-hidden="true" /> Nieuw
        </button>
      </div>
      <table className="w-full text-left" style={{ background: C.surface }}>
        <thead>
          <tr
            className="border-b text-[9.5px] uppercase tracking-[0.1em]"
            style={{ borderColor: C.line, color: C.faint }}
          >
            <th className="px-4 py-1.5 font-medium">Nummer</th>
            <th className="px-4 py-1.5 font-medium">Klant</th>
            <th className="px-4 py-1.5 font-medium">Datum</th>
            <th className="px-4 py-1.5 text-right font-medium">Bedrag</th>
            <th className="px-4 py-1.5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {FACTUREN.map((f) => {
            const t = statusTone[f.status] ?? { fg: C.muted, bg: C.lineSoft };
            return (
              <tr
                key={f.nr}
                className="border-b transition-colors last:border-0 hover:bg-[#f1f3f6]"
                style={{ borderColor: C.lineSoft }}
              >
                <td className="px-4 py-1.5 text-[11.5px]" style={{ color: C.inkSoft, ...mono }}>
                  {f.nr}
                </td>
                <td className="px-4 py-1.5 text-[12.5px] font-medium">{f.klant}</td>
                <td className="px-4 py-1.5 text-[11.5px]" style={{ color: C.muted, ...mono }}>
                  {f.datum}
                </td>
                <td
                  className="px-4 py-1.5 text-right text-[12.5px] font-semibold tabular-nums"
                  style={mono}
                >
                  {f.bedrag}
                </td>
                <td className="px-4 py-1.5 text-right">
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide"
                    style={{ color: t.fg, background: t.bg, ...monoLabel }}
                  >
                    {f.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
