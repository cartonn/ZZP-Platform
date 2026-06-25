"use client";

// Concept 01 — "Helder" · Strategische rust / Linear-grade licht.
// Palet: canvas #fbfbfd, inkt #15161a, hairline #e7e7ec, muted #6b6c75, accent indigo #4f46e5.
// Fonts: Inter (UI) + JetBrains Mono (cijfers). Filosofie: strategisch minimalisme.

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  FileText,
  Plus,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  canvas: "#fbfbfd",
  surface: "#ffffff",
  ink: "#15161a",
  line: "#e7e7ec",
  lineSoft: "#f0f0f3",
  muted: "#6b6c75",
  faint: "#9a9ba3",
  accent: "#4f46e5",
  accentSoft: "#eef0fe",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string; dot: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: "#0f7a4d", bg: "#e9f7f0", dot: "#16a34a" };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: "#3730a3", bg: C.accentSoft, dot: C.accent };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#92400e", bg: "#fdf3e7", dot: "#d97706" };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#9b1c1c", bg: "#fbeaea", dot: "#dc2626" };
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 30;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept01() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar */}
        <aside
          className="hidden w-60 shrink-0 flex-col border-r px-3 py-5 md:flex"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="flex items-center gap-2.5 px-2 pb-6">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-semibold text-white"
              style={{ background: C.accent }}
            >
              Z
            </div>
            <span className="text-[14px] font-semibold tracking-tight">ZZP Platform</span>
          </div>

          <nav className="flex flex-col gap-0.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2.5"
              style={{ borderColor: C.line }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ background: C.accentSoft, color: C.accent, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.faint }}>
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
            className="flex h-14 shrink-0 items-center gap-3 border-b px-5"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={14} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-medium" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12.5px] transition-colors hover:bg-[#f7f7fa] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
                <kbd
                  className="rounded border px-1 text-[10.5px]"
                  style={{ borderColor: C.line, ...mono }}
                >
                  ⌘K
                </kbd>
              </button>
              <button
                className="relative rounded-md border p-1.5 transition-colors hover:bg-[#f7f7fa] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6">
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

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[16px] font-semibold tracking-tight">{children}</h2>
      {sub && (
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Waarschuwingsbanner */}
      <div
        className="flex items-start gap-3 rounded-lg border px-4 py-3"
        style={{ borderColor: "#f3dcb8", background: "#fdf8ef" }}
      >
        <AlertTriangle size={16} aria-hidden="true" style={{ color: "#d97706", marginTop: 1 }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium" style={{ color: "#92400e" }}>
            Je VOG verloopt over <span style={mono}>23</span> dagen
          </p>
          <p className="text-[12.5px]" style={{ color: "#a16207" }}>
            Vraag tijdig een nieuwe aan om verifieerbaar te blijven voor opdrachtgevers.
          </p>
        </div>
        <button
          className="shrink-0 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: "#d97706" }}
        >
          Vernieuwen
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border p-4 transition-shadow hover:shadow-[0_1px_3px_rgba(20,22,26,0.05)]"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div className="mt-1.5 flex items-end justify-between">
              <span className="text-[26px] font-semibold leading-none tracking-tight" style={mono}>
                {k.value}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11.5px] font-medium"
                style={{ color: k.up ? "#0f7a4d" : C.muted, ...mono }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={C.accent} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <SectionTitle sub="Verklaarbaar gesorteerd op match-score">Beste matches</SectionTitle>
          <div
            className="divide-y overflow-hidden rounded-xl border"
            style={{ borderColor: C.line, background: C.surface }}
          >
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#f9f9fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderColor: C.lineSoft }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="text-[13px] font-medium" style={mono}>
                  {o.tarief}
                </span>
                <span
                  className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[12px] font-semibold tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent, ...mono }}
                >
                  {o.match}%
                </span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
              </button>
            ))}
          </div>
        </div>

        {/* Credentials samenvatting */}
        <div>
          <SectionTitle sub="Je verifieerbare bewijs">Credentials</SectionTitle>
          <div
            className="space-y-2.5 rounded-xl border p-4"
            style={{ borderColor: C.line, background: C.surface }}
          >
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div key={c.naam} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: st.dot }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
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
    <div className="mx-auto max-w-5xl space-y-5">
      <SectionTitle sub="Open opdrachten in de zorg, gefilterd op jouw profiel">
        Marktplaats
      </SectionTitle>

      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9ba3]"
          />
        </div>
        {["Per 1 juli", "Avond", "BIG"].map((f) => (
          <span
            key={f}
            className="hidden rounded-md border px-2.5 py-2 text-[12px] font-medium sm:inline"
            style={{ borderColor: C.line, color: C.muted }}
          >
            {f}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-14 text-center"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <p className="text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-xl border p-4 text-left transition-all hover:border-[#c9c9d3] hover:shadow-[0_1px_4px_rgba(20,22,26,0.06)] focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="text-[10.5px] font-medium tracking-wide"
                  style={{ color: C.faint, ...mono }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold"
                  style={{ background: C.accentSoft, color: C.accent, ...mono }}
                >
                  {o.match}% match
                </span>
              </div>
              <p className="mt-2 text-[14px] font-semibold leading-snug">{o.titel}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border px-1.5 py-0.5 text-[11px]"
                    style={{ borderColor: C.line, color: C.muted }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 flex items-center justify-between border-t pt-3 text-[12.5px]"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="font-semibold" style={mono}>
                  {o.tarief}
                </span>
                <span style={{ color: C.muted, ...mono }}>{o.uren}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: (typeof OPDRACHTEN)[number] }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className="text-[10.5px] font-medium tracking-wide"
            style={{ color: C.faint, ...mono }}
          >
            {opdracht.id}
          </span>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{opdracht.titel}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg px-4 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          Reageer op opdracht
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
            style={{ borderColor: C.line, background: C.surface }}
          >
            <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p className="mt-1 text-[16px] font-semibold tracking-tight" style={mono}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: C.line, background: C.surface }}>
        <h3 className="text-[14px] font-semibold">Waarom deze match</h3>
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "#0f7a4d" }}
            >
              Pluspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: "#16a34a", marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "#92400e" }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-2 space-y-1.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <X size={15} aria-hidden="true" style={{ color: "#d97706", marginTop: 1 }} />
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
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionTitle sub="Server-side bepaald — de bron van je vertrouwensniveau">
        Verificatie
      </SectionTitle>

      <div
        className="flex items-center gap-4 rounded-xl border p-5"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "#e9f7f0" }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: "#16a34a" }} />
        </div>
        <div>
          <p className="text-[16px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span style={mono}>2</span> van <span style={mono}>4</span> credentials volledig
            geverifieerd · <span style={mono}>1</span> vraagt actie
          </p>
        </div>
      </div>

      <div
        className="divide-y overflow-hidden rounded-xl border"
        style={{ borderColor: C.line, background: C.surface }}
      >
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[#f9f9fc]"
              style={{ borderColor: C.lineSoft }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: C.lineSoft }}
              >
                {c.status === "VERIFIED" ? (
                  <Check size={16} aria-hidden="true" style={{ color: st.dot }} />
                ) : c.status === "SUBMITTED" ? (
                  <Clock size={16} aria-hidden="true" style={{ color: st.dot }} />
                ) : (
                  <AlertTriangle size={16} aria-hidden="true" style={{ color: st.dot }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex items-center rounded-md px-2.5 py-1 text-[11.5px] font-semibold"
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
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; border: string; Icon: LucideIcon }
  > = {
    warning: { fg: "#92400e", bg: "#fdf8ef", border: "#f3dcb8", Icon: AlertTriangle },
    info: { fg: C.accent, bg: C.accentSoft, border: "#dcdcfb", Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionTitle sub="Wat vraagt nu jouw aandacht — op prioriteit gesorteerd">
        Volgende acties
      </SectionTitle>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-3.5 rounded-xl border p-4 transition-shadow hover:shadow-[0_1px_3px_rgba(20,22,26,0.05)]"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: t.bg }}
              >
                <t.Icon size={17} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#f7f7fa] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: C.line, color: C.ink }}
              >
                {a.cta}
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
    Betaald: { fg: "#0f7a4d", bg: "#e9f7f0" },
    Openstaand: { fg: "#92400e", bg: "#fdf3e7" },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  const fallbackTone = { fg: C.muted, bg: C.lineSoft };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle sub="Overzicht van je verstuurde en openstaande facturen">
          Facturen
        </SectionTitle>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <table className="w-full text-left">
          <thead>
            <tr
              className="border-b text-[11px] uppercase tracking-wide"
              style={{ borderColor: C.line, color: C.faint }}
            >
              <th className="px-4 py-2.5 font-medium">Nummer</th>
              <th className="px-4 py-2.5 font-medium">Klant</th>
              <th className="px-4 py-2.5 font-medium">Datum</th>
              <th className="px-4 py-2.5 text-right font-medium">Bedrag</th>
              <th className="px-4 py-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = statusTone[f.status] ?? fallbackTone;
              return (
                <tr
                  key={f.nr}
                  className="border-b transition-colors last:border-0 hover:bg-[#f9f9fc]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <td className="px-4 py-3 text-[12.5px] font-medium" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                      style={{ background: t.bg, color: t.fg }}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Documenten — extra context */}
      <div>
        <h3 className="mb-2 text-[13px] font-semibold" style={{ color: C.muted }}>
          Recente documenten
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="rounded-lg border p-3"
                style={{ borderColor: C.line, background: C.surface }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} aria-hidden="true" style={{ color: C.faint }} />
                  <span className="text-[10px] font-medium" style={{ color: st.fg }}>
                    {st.label}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[12px] font-medium">{d.naam}</p>
                <p className="text-[11px]" style={{ color: C.faint, ...mono }}>
                  {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
