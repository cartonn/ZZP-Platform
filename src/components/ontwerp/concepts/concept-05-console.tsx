"use client";

// Concept 05 — "Console" · Terminal/IDE — toetsenbord-eerst.
// Een power-user operator console: monospace-forward, licht IDE/terminal-thema, command-line
// dashboard, persistente onderste statusbalk, J/K-rij-navigatiehints en ⌘K-palet, breadcrumb als
// bestandspad, tree/split-panes. Dicht maar leesbaar — voor wie in het toetsenbord leeft.
// Palet: canvas #fbfbf9, surface #ffffff, ink #14171a, line #e3e5e1, muted #5f6660,
// accent emerald #15803d, accent2 amber #b45309, accentSoft #e7f3ea.
// Fonts: JetBrains Mono (primair) + Inter (proza).

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  CircleDot,
  GitBranch,
  Terminal,
  CornerDownLeft,
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
  canvas: "#fbfbf9",
  surface: "#ffffff",
  ink: "#14171a",
  line: "#e3e5e1",
  lineSoft: "#eef0ec",
  muted: "#5f6660",
  faint: "#9aa09a",
  accent: "#15803d",
  accent2: "#b45309",
  accentSoft: "#e7f3ea",
  amberSoft: "#fbf0df",
};

const mono = { fontFamily: "var(--font-lab-mono)" };
const prose = { fontFamily: "var(--font-lab-inter)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Terminal,
  berichten: Terminal,
};

const PATHS: Record<ScreenKey, string> = {
  dashboard: "~/dashboard",
  marktplaats: "~/marktplaats",
  opdracht: "~/marktplaats/OPD-2041",
  verificatie: "~/verificatie",
  acties: "~/acties",
  facturen: "~/facturen",
  documenten: "~/documenten",
  berichten: "~/berichten",
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; glyph: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "VERIFIED", fg: C.accent, bg: C.accentSoft, glyph: "✓" };
    case "SUBMITTED":
      return { label: "PENDING", fg: "#1d4ed8", bg: "#e6edfb", glyph: "…" };
    case "EXPIRING":
      return { label: "EXPIRING", fg: C.accent2, bg: C.amberSoft, glyph: "!" };
    case "REJECTED":
      return { label: "REJECTED", fg: "#b91c1c", bg: "#fbe9e9", glyph: "✕" };
  }
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[10.5px]"
      style={{ ...mono, background: C.lineSoft, border: `1px solid ${C.line}`, color: C.muted }}
    >
      {children}
    </kbd>
  );
}

export function Concept05() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[640px] w-full antialiased"
      style={{ ...mono, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px] flex-col">
        <div className="flex min-h-0 flex-1">
          {/* Tree pane — bestandsverkenner-stijl */}
          <aside
            className="hidden w-60 shrink-0 flex-col py-3 md:flex"
            style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}
          >
            <div
              className="flex items-center gap-2 px-4 pb-3"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <Terminal size={15} aria-hidden="true" style={{ color: C.accent }} />
              <span className="text-[12px] font-semibold tracking-tight">zzp-platform</span>
              <span
                className="ml-auto flex items-center gap-1 text-[10.5px]"
                style={{ color: C.faint }}
              >
                <GitBranch size={11} aria-hidden="true" /> main
              </span>
            </div>

            <div className="px-2 pt-3">
              <p
                className="px-2 pb-1.5 text-[10px] uppercase tracking-widest"
                style={{ color: C.faint }}
              >
                explorer
              </p>
              <nav className="flex flex-col">
                {SCREENS.map((s) => {
                  const Icon = NAV_ICONS[s.key];
                  const on = s.key === screen;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setScreen(s.key)}
                      aria-current={on ? "page" : undefined}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        color: on ? C.ink : C.muted,
                        background: on ? C.accentSoft : "transparent",
                      }}
                    >
                      <ChevronRight
                        size={12}
                        aria-hidden="true"
                        style={{
                          color: on ? C.accent : C.faint,
                          transform: on ? "rotate(90deg)" : "none",
                          transition: "transform 120ms",
                        }}
                      />
                      <Icon
                        size={13}
                        aria-hidden="true"
                        style={{ color: on ? C.accent : C.faint }}
                      />
                      <span className="truncate">{s.label.toLowerCase()}.tsx</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto px-4 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <div className="flex items-center gap-2 pt-3">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded text-[11px] font-semibold"
                  style={{ background: C.accentSoft, color: C.accent }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[11.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="truncate text-[10px]" style={{ color: C.faint }}>
                    {PROFIEL.trust.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Editor pane */}
          <main className="flex min-w-0 flex-1 flex-col">
            {/* Tab bar + breadcrumb path */}
            <div
              className="flex h-10 shrink-0 items-center gap-2 px-4 text-[11.5px]"
              style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, color: C.muted }}
            >
              <span style={{ color: C.faint }}>$</span>
              <span className="truncate">{PATHS[screen]}</span>
              <span style={{ color: C.faint }}>›</span>
              <span className="font-semibold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
              <button
                onClick={() => setPaletteOpen(true)}
                className="ml-auto flex items-center gap-2 rounded border px-2.5 py-1 transition-colors hover:bg-[#f4f5f2] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line }}
                aria-label="Commandopalet openen"
              >
                <Search size={12} aria-hidden="true" />
                <span>cmd</span>
                <Kbd>⌘K</Kbd>
              </button>
            </div>

            {/* Mobiele tabs */}
            <div
              className="flex gap-1 overflow-x-auto px-3 py-1.5 md:hidden"
              style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    className="shrink-0 rounded px-2.5 py-1 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      color: on ? C.accent : C.muted,
                      background: on ? C.accentSoft : "transparent",
                    }}
                  >
                    {s.label.toLowerCase()}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
              {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
              {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
              {screen === "verificatie" && <Verificatie />}
              {screen === "acties" && <Acties />}
              {screen === "facturen" && <Facturen />}
            </div>
          </main>
        </div>

        {/* Persistente statusbalk */}
        <footer
          className="flex h-7 shrink-0 items-center gap-4 px-4 text-[10.5px]"
          style={{ background: C.accent, color: "#ffffff" }}
        >
          <span className="flex items-center gap-1.5">
            <GitBranch size={11} aria-hidden="true" /> main
          </span>
          <span className="flex items-center gap-1.5">
            <CircleDot size={11} aria-hidden="true" /> trust: {PROFIEL.trust.toLowerCase()}
          </span>
          <span className="hidden sm:inline">{PATHS[screen]}</span>
          <span className="ml-auto hidden items-center gap-3 sm:flex">
            <span>
              <Kbd>j</Kbd>/<Kbd>k</Kbd> nav
            </span>
            <span>UTF-8</span>
            <span>Ln 1, Col 1</span>
          </span>
        </footer>
      </div>

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onPick={(k) => {
            setScreen(k);
            setPaletteOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CommandPalette({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (k: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-center px-4 pt-24"
      style={{ background: "rgba(20,23,26,0.28)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Commandopalet"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg shadow-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2 px-3.5 py-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <span style={{ color: C.accent }}>$</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ga naar of voer commando uit…"
            aria-label="Commando zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa09a]"
            style={mono}
          />
          <Kbd>esc</Kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px]" style={{ color: C.faint }}>
              geen commando&apos;s gevonden voor &quot;{q}&quot;
            </p>
          ) : (
            results.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => onPick(s.key)}
                  className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-[12.5px] transition-colors hover:bg-[#f4f5f2] focus-visible:bg-[#f4f5f2] focus-visible:outline-none"
                  style={{ background: i === 0 ? C.accentSoft : "transparent" }}
                >
                  <Icon size={14} aria-hidden="true" style={{ color: C.accent }} />
                  <span>open {s.label.toLowerCase()}</span>
                  <span className="ml-auto" style={{ color: C.faint }}>
                    <CornerDownLeft size={12} aria-hidden="true" />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Comment({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px]" style={{ color: C.faint }}>
      <span>{"// "}</span>
      {children}
    </p>
  );
}

function Heading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>
        <span style={{ color: C.accent }}>$ </span>
        {children}
      </h2>
      {sub && <Comment>{sub}</Comment>}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Terminal-banner */}
      <div
        className="rounded-md p-4"
        style={{ background: C.amberSoft, border: `1px solid #f0dcb8` }}
      >
        <p
          className="flex items-center gap-2 text-[12.5px] font-semibold"
          style={{ color: C.accent2 }}
        >
          <AlertTriangle size={14} aria-hidden="true" /> warning: VOG verloopt over 23 dagen
        </p>
        <p className="mt-1 pl-6 text-[12px]" style={{ color: "#92560e" }}>
          run <span className="font-semibold">`vog --renew`</span> om verifieerbaar te blijven voor
          opdrachtgevers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-md p-3.5 transition-colors hover:bg-[#fafbf9]"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <p className="text-[11px]" style={{ color: C.faint }}>
              {k.label.toLowerCase().replace(/ /g, "_")}
            </p>
            <p className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none">{k.value}</p>
            <span
              className="mt-2.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-semibold"
              style={{
                background: k.up ? C.accentSoft : C.lineSoft,
                color: k.up ? C.accent : C.muted,
              }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Heading sub="ls matches/ — gesorteerd op score (desc)">matches</Heading>
          <div
            className="overflow-hidden rounded-md"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group flex w-full items-center gap-3 px-3.5 py-3 text-left text-[12.5px] transition-colors hover:bg-[#f4f5f2] focus-visible:bg-[#f4f5f2] focus-visible:outline-none"
                style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}
              >
                <span className="w-4 text-right tabular-nums" style={{ color: C.faint }}>
                  {i + 1}
                </span>
                <span className="text-[10.5px]" style={{ color: C.faint }}>
                  {o.id}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold" style={prose}>
                  {o.titel}
                </span>
                <span className="hidden tabular-nums sm:inline" style={{ color: C.muted }}>
                  {o.tarief}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent }}
                >
                  {o.match}%
                </span>
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: C.faint }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Heading sub="cat credentials.json">credentials</Heading>
          <div
            className="overflow-hidden rounded-md"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            {CREDENTIALS.map((c, i) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px]"
                  style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold"
                    style={{ background: st.bg, color: st.fg }}
                    aria-hidden="true"
                  >
                    {st.glyph}
                  </span>
                  <span className="min-w-0 flex-1 truncate" style={prose}>
                    {c.naam}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Heading sub="grep -i &lt;query&gt; opdrachten/">marktplaats</Heading>

      <div
        className="flex items-center gap-2 rounded-md px-3 py-2"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <span style={{ color: C.accent }}>$</span>
        <span style={{ color: C.faint }}>grep</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="titel of plaats…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[#9aa09a]"
        />
        <span className="text-[10.5px]" style={{ color: C.faint }}>
          {filtered.length} resultaten
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-md px-6 py-12 text-center"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <p className="text-[13px] font-semibold">no matches found</p>
          <Comment>exit code 1 — pas je query of beschikbaarheid aan</Comment>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-md"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-widest"
                style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-3.5 py-2 font-medium">id</th>
                <th className="px-3.5 py-2 font-medium">titel</th>
                <th className="hidden px-3.5 py-2 font-medium sm:table-cell">plaats</th>
                <th className="px-3.5 py-2 text-right font-medium">tarief</th>
                <th className="px-3.5 py-2 text-right font-medium">match</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={onOpen}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => (e.key === "Enter" ? onOpen() : undefined)}
                  className="cursor-pointer transition-colors hover:bg-[#f4f5f2] focus-visible:bg-[#f4f5f2] focus-visible:outline-none"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-3.5 py-2.5 text-[10.5px]" style={{ color: C.faint }}>
                    {o.id}
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold" style={prose}>
                    {o.titel}
                  </td>
                  <td className="hidden px-3.5 py-2.5 sm:table-cell" style={{ color: C.muted }}>
                    {o.plaats}
                  </td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums">{o.tarief}</td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                      style={{ background: C.accentSoft, color: C.accent }}
                    >
                      {o.match}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div
        className="rounded-md p-5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-[10.5px]" style={{ color: C.faint }}>
              {opdracht.id}
            </span>
            <h2 className="mt-1 text-[18px] font-semibold tracking-tight" style={prose}>
              {opdracht.titel}
            </h2>
            <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            className="shrink-0 rounded-md px-4 py-2 text-[12px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.accent }}
          >
            apply --now
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { l: "tarief", v: opdracht.tarief },
            { l: "omvang", v: opdracht.uren },
            { l: "start", v: opdracht.start },
            { l: "match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="rounded-md p-2.5" style={{ background: C.lineSoft }}>
              <p className="text-[10px]" style={{ color: C.faint }}>
                {m.l}
              </p>
              <p className="mt-0.5 text-[14px] font-semibold tabular-nums">{m.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Split-pane: pluspunten | aandachtspunten */}
      <div>
        <Heading sub="explain --match OPD-2041 · waarom deze opdracht past">match_reasons</Heading>
        <div
          className="grid grid-cols-1 gap-px overflow-hidden rounded-md md:grid-cols-2"
          style={{ background: C.line }}
        >
          <div className="p-4" style={{ background: C.surface }}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: C.accent }}
            >
              <Check size={12} aria-hidden="true" /> diff +plus
            </p>
            <ul className="mt-3 space-y-2">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[12.5px]" style={prose}>
                  <span className="font-semibold" style={{ color: C.accent }}>
                    +
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4" style={{ background: C.surface }}>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: C.accent2 }}
            >
              <X size={12} aria-hidden="true" /> diff -min
            </p>
            <ul className="mt-3 space-y-2">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[12.5px]"
                  style={{ ...prose, color: C.muted }}
                >
                  <span className="font-semibold" style={{ color: C.accent2 }}>
                    −
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
    <div className="mx-auto max-w-4xl space-y-4">
      <Heading sub="status --verify · server-side bron van vertrouwen">verificatie</Heading>

      <div
        className="flex items-center gap-4 rounded-md p-4"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-md"
          style={{ background: C.accentSoft }}
        >
          <ShieldCheck size={24} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12px]" style={{ color: C.muted }}>
            <span className="tabular-nums">{verified}</span>/
            <span className="tabular-nums">{CREDENTIALS.length}</span> credentials geverifieerd · 1
            vraagt actie
          </p>
        </div>
        {/* ASCII-achtige voortgangsbalk */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-[12px]" style={{ ...mono, color: C.accent }}>
            [{"█".repeat(verified)}
            {"░".repeat(CREDENTIALS.length - verified)}]
          </span>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-md"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f4f5f2]"
              style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[12px] font-semibold"
                style={{ background: st.bg, color: st.fg }}
                aria-hidden="true"
              >
                {st.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold" style={prose}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="hidden shrink-0 rounded px-2 py-0.5 text-[10.5px] font-semibold sm:inline-flex"
                style={{ background: st.bg, color: st.fg }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; label: string }> = {
    warning: { fg: C.accent2, bg: C.amberSoft, label: "WARN" },
    info: { fg: C.accent, bg: C.accentSoft, label: "INFO" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Heading sub="tail -f acties.log · op prioriteit">acties</Heading>
      <div
        className="overflow-hidden rounded-md"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-3 px-4 py-3.5"
              style={{ borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}
            >
              <span
                className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: t.bg, color: t.fg }}
              >
                {t.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold" style={prose}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ ...prose, color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#f4f5f2] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, color: C.ink }}
              >
                {a.cta.toLowerCase()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.accent, bg: C.accentSoft },
    Openstaand: { fg: C.accent2, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  const fallback = { fg: C.muted, bg: C.lineSoft };
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Heading sub="ls -la facturen/">facturen</Heading>
        <button
          className="rounded-md px-3.5 py-2 text-[12px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          new --invoice
        </button>
      </div>

      <div
        className="overflow-hidden rounded-md"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-widest"
              style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
            >
              <th className="px-4 py-2 font-medium">nummer</th>
              <th className="px-4 py-2 font-medium">klant</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">datum</th>
              <th className="px-4 py-2 text-right font-medium">bedrag</th>
              <th className="px-4 py-2 text-right font-medium">status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = statusTone[f.status] ?? fallback;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#f4f5f2]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-4 py-2.5 text-[11px]" style={{ color: C.muted }}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-2.5 font-semibold" style={prose}>
                    {f.klant}
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{f.bedrag}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className="rounded px-2 py-0.5 text-[10.5px] font-semibold"
                      style={{ background: t.bg, color: t.fg }}
                    >
                      {f.status.toLowerCase()}
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
