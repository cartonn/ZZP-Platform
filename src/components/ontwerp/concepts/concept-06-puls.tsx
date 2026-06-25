"use client";

// Concept 06 — "Puls" · Expressieve kleur, functionele motion.
// Gradient-headers, rol-gecodeerde accenten (freelancer indigo · opdrachtgever teal · admin amber),
// gedisciplineerde gradient-KPI's en een "vieren bij succes" micro-interactie (puur CSS/transition).

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Search,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Receipt,
  MapPin,
  ArrowUpRight,
  Check,
  AlertTriangle,
  PartyPopper,
  TrendingUp,
  ChevronRight,
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
} from "./mock";

const C = {
  canvas: "#ffffff",
  ink: "#1a1530",
  muted: "#6b6a82",
  border: "#eceaf4",
  violet: "#7c3aed",
  pink: "#ec4899",
  freelancer: "#6366f1",
  client: "#14b8a6",
  admin: "#f59e0b",
  green: "#16a34a",
  amber: "#d97706",
};

const fUI = { fontFamily: "var(--font-lab-jakarta)" };
const fMono = { fontFamily: "var(--font-lab-mono)", fontVariantNumeric: "tabular-nums" as const };
const grad = `linear-gradient(135deg, ${C.violet}, ${C.pink})`;

const NAV: { key: ScreenKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "marktplaats", label: "Marktplaats", icon: Search },
  { key: "opdracht", label: "Opdracht", icon: Briefcase },
  { key: "verificatie", label: "Verificatie", icon: ShieldCheck },
  { key: "acties", label: "Acties", icon: Sparkles },
  { key: "facturen", label: "Facturen", icon: Receipt },
];

function credStyle(s: CredStatus) {
  if (s === "VERIFIED") return { bg: "#eafaf2", fg: C.green, label: "Geverifieerd" };
  if (s === "EXPIRING") return { bg: "#fdf3e7", fg: C.amber, label: "Verloopt" };
  if (s === "REJECTED") return { bg: "#fdeaef", fg: "#dc2626", label: "Afgewezen" };
  return { bg: "#f0eefb", fg: C.violet, label: "In review" };
}

export function Concept06() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sel, setSel] = useState(OPDRACHTEN[0]!.id);
  const [loading, setLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const cur = OPDRACHTEN.find((o) => o.id === sel) ?? OPDRACHTEN[0]!;

  // Korte skeleton-staat bij het openen van de marktplaats — voelbaar laden.
  useEffect(() => {
    if (screen !== "marktplaats") return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [screen]);

  function react() {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1400);
  }

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...fUI, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar */}
        <aside
          className="hidden w-56 shrink-0 flex-col gap-1 border-r p-3.5 md:flex"
          style={{ borderColor: C.border }}
        >
          <div className="mb-5 flex items-center gap-2.5 px-1.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-2xl text-white"
              style={{ background: grad }}
            >
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[15px] font-bold tracking-tight">Puls</p>
              <p className="text-[11px]" style={{ color: C.muted }}>
                in beweging
              </p>
            </div>
          </div>
          {NAV.map((n) => {
            const on = screen === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setScreen(n.key)}
                aria-current={on ? "page" : undefined}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: on ? "#f5f3fd" : "transparent",
                  color: on ? C.violet : C.muted,
                }}
              >
                {on && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                    style={{ background: grad }}
                    aria-hidden="true"
                  />
                )}
                <n.icon size={17} aria-hidden="true" /> {n.label}
              </button>
            );
          })}
          <div
            className="mt-auto flex items-center gap-2.5 rounded-2xl p-3"
            style={{ background: "#f5f3fd" }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: C.freelancer, ...fMono }}
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{PROFIEL.naam}</p>
              <span
                className="inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "#e8e9fe", color: C.freelancer }}
              >
                Freelancer
              </span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-hidden">
          {/* Gradient header */}
          <header
            className="relative overflow-hidden px-6 py-5"
            style={{ background: grad, color: "#fff" }}
          >
            <div
              className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-20"
              style={{ background: "#fff" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium opacity-90">
                  {SCREENS.find((s) => s.key === screen)?.label}
                </p>
                <h1 className="text-xl font-bold tracking-tight">
                  Hoi {PROFIEL.naam.split(" ")[0]}, je staat sterk vandaag
                </h1>
              </div>
              <span
                className="hidden items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-semibold backdrop-blur sm:inline-flex"
                style={fMono}
              >
                <TrendingUp size={14} aria-hidden="true" /> 92% match
              </span>
            </div>
            <div className="relative mt-4 flex gap-1.5 md:hidden">
              {NAV.map((n) => (
                <button
                  key={n.key}
                  onClick={() => setScreen(n.key)}
                  aria-label={n.label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 focus-visible:outline-none focus-visible:ring-2"
                  style={{ opacity: screen === n.key ? 1 : 0.6 }}
                >
                  <n.icon size={15} aria-hidden="true" />
                </button>
              ))}
            </div>
          </header>

          <div className="p-6">
            {screen === "dashboard" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {KPIS.map((k, idx) => {
                    const tones = [C.violet, C.freelancer, C.client, C.admin];
                    const tone = tones[idx % tones.length] ?? C.violet;
                    return (
                      <div
                        key={k.label}
                        className="relative overflow-hidden rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
                        style={{ borderColor: C.border }}
                      >
                        <span
                          className="absolute right-0 top-0 h-full w-1"
                          style={{ background: tone }}
                          aria-hidden="true"
                        />
                        <p className="text-[12px]" style={{ color: C.muted }}>
                          {k.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold" style={fMono}>
                          {k.value}
                        </p>
                        <span
                          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            ...fMono,
                            background: k.up ? "#eafaf2" : "#fdf3e7",
                            color: k.up ? C.green : C.amber,
                          }}
                        >
                          {k.trend}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <section
                    className="rounded-2xl border p-5 lg:col-span-2"
                    style={{ borderColor: C.border }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-bold">Beste matches</h2>
                      <button
                        onClick={() => setScreen("marktplaats")}
                        className="text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
                        style={{ color: C.violet }}
                      >
                        Alles bekijken
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {OPDRACHTEN.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => {
                            setSel(o.id);
                            setScreen("opdracht");
                          }}
                          className="group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:border-transparent hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
                          style={{ borderColor: C.border }}
                        >
                          <MatchBadge value={o.match} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold">{o.titel}</p>
                            <p className="truncate text-[12px]" style={{ color: C.muted }}>
                              {o.opdrachtgever} · {o.plaats} · {o.tarief}
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="transition-transform group-hover:translate-x-0.5"
                            style={{ color: C.muted }}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border p-5" style={{ borderColor: C.border }}>
                    <h2 className="mb-3 text-sm font-bold">Acties</h2>
                    <div className="space-y-2.5">
                      {ACTIES.map((a) => {
                        const warn = a.urgentie === "warning";
                        return (
                          <div
                            key={a.titel}
                            className="rounded-2xl p-3"
                            style={{ background: warn ? "#fdf3e7" : "#f5f3fd" }}
                          >
                            <p
                              className="text-[13px] font-semibold"
                              style={{ color: warn ? C.amber : C.ink }}
                            >
                              {a.titel}
                            </p>
                            <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                              {a.detail}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {screen === "marktplaats" && (
              <div className="space-y-4">
                <div
                  className="flex items-center gap-2 rounded-2xl border px-4 py-2.5"
                  style={{ borderColor: C.border }}
                >
                  <Search size={16} style={{ color: C.muted }} aria-hidden="true" />
                  <input
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="Zoek opdrachten…"
                    aria-label="Zoek opdrachten"
                  />
                </div>
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="Laden">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-2xl border p-5"
                        style={{ borderColor: C.border }}
                      >
                        <div
                          className="mb-3 h-10 w-10 rounded-xl"
                          style={{ background: "#eceaf4" }}
                        />
                        <div className="mb-2 h-4 w-3/4 rounded" style={{ background: "#eceaf4" }} />
                        <div className="mb-4 h-3 w-1/2 rounded" style={{ background: "#f3f1f9" }} />
                        <div className="h-3 w-2/3 rounded" style={{ background: "#f3f1f9" }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {OPDRACHTEN.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setSel(o.id);
                          setScreen("opdracht");
                        }}
                        className="group rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2"
                        style={{ borderColor: C.border }}
                      >
                        <div className="flex items-center justify-between">
                          <MatchBadge value={o.match} />
                          <ArrowUpRight
                            size={16}
                            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            style={{ color: C.muted }}
                            aria-hidden="true"
                          />
                        </div>
                        <p className="mt-3 text-[15px] font-bold leading-snug">{o.titel}</p>
                        <p className="text-[12px]" style={{ color: C.muted }}>
                          {o.opdrachtgever}
                        </p>
                        <div
                          className="mt-3 flex flex-wrap gap-2 text-[12px]"
                          style={{ color: C.muted }}
                        >
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} aria-hidden="true" /> {o.plaats}
                          </span>
                          <span style={fMono}>{o.tarief}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {o.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{ background: "#f5f3fd", color: C.violet }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {screen === "opdracht" && (
              <div className="grid gap-5 lg:grid-cols-3">
                <section
                  className="relative overflow-hidden rounded-2xl border p-6 lg:col-span-2"
                  style={{ borderColor: C.border }}
                >
                  {/* Celebratie-accent bij reageren op een sterke match */}
                  {celebrate && (
                    <div
                      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg"
                        style={{
                          background: grad,
                          animation: "pulsCelebrate 1.4s cubic-bezier(0.22,1,0.36,1)",
                        }}
                      >
                        <PartyPopper size={16} aria-hidden="true" /> Reactie verstuurd!
                      </span>
                    </div>
                  )}
                  <style>{`@keyframes pulsCelebrate{0%{opacity:0;transform:scale(0.7)}20%{opacity:1;transform:scale(1.05)}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(0.95)}}`}</style>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px]" style={{ ...fMono, color: C.muted }}>
                        {cur.id}
                      </span>
                      <h2 className="text-xl font-bold leading-snug">{cur.titel}</h2>
                      <p className="text-[13px]" style={{ color: C.muted }}>
                        {cur.opdrachtgever} · {cur.plaats}
                      </p>
                    </div>
                    <MatchBadge value={cur.match} big />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      ["Tarief", cur.tarief],
                      ["Uren", cur.uren],
                      ["Start", cur.start],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-xl p-3" style={{ background: "#f5f3fd" }}>
                        <p className="text-[11px]" style={{ color: C.muted }}>
                          {l}
                        </p>
                        <p className="text-[14px] font-bold" style={fMono}>
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[12px] font-bold" style={{ color: C.green }}>
                        Sterke punten
                      </p>
                      <ul className="space-y-1.5">
                        {cur.redenen.plus.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-[13px]">
                            <Check
                              size={15}
                              className="mt-0.5 shrink-0"
                              style={{ color: C.green }}
                              aria-hidden="true"
                            />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-[12px] font-bold" style={{ color: C.amber }}>
                        Let op
                      </p>
                      <ul className="space-y-1.5">
                        {cur.redenen.min.map((m) => (
                          <li key={m} className="flex items-start gap-2 text-[13px]">
                            <AlertTriangle
                              size={15}
                              className="mt-0.5 shrink-0"
                              style={{ color: C.amber }}
                              aria-hidden="true"
                            />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={react}
                    className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: grad }}
                  >
                    Reageer nu <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </section>
                <aside className="rounded-2xl border p-5" style={{ borderColor: C.border }}>
                  <h3 className="mb-3 text-sm font-bold">Vergelijkbaar</h3>
                  <div className="space-y-2">
                    {OPDRACHTEN.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setSel(o.id)}
                        className="flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                        style={{ background: o.id === sel ? "#f5f3fd" : "transparent" }}
                      >
                        <MatchBadge value={o.match} small />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold">{o.titel}</p>
                          <p className="truncate text-[11px]" style={{ color: C.muted }}>
                            {o.opdrachtgever}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </aside>
              </div>
            )}

            {screen === "verificatie" && (
              <div className="space-y-4">
                <div
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{ background: "#fdf3e7" }}
                >
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: C.amber }}>
                      VOG verloopt over 23 dagen
                    </p>
                    <p className="text-[12px]" style={{ color: C.muted }}>
                      Vernieuw op tijd zodat je geverifieerd blijft.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {CREDENTIALS.map((c) => {
                    const s = credStyle(c.status);
                    return (
                      <div
                        key={c.naam}
                        className="flex items-center gap-3 rounded-2xl border p-4 transition-transform hover:-translate-y-0.5"
                        style={{ borderColor: C.border }}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: s.bg, color: s.fg }}
                        >
                          <ShieldCheck size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">{c.naam}</p>
                          <p className="text-[12px]" style={{ color: C.muted }}>
                            {c.detail}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: s.bg, color: s.fg }}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <section className="rounded-2xl border p-5" style={{ borderColor: C.border }}>
                  <h3 className="mb-3 text-sm font-bold">Documenten</h3>
                  <div className="space-y-1.5">
                    {DOCUMENTEN.map((d) => {
                      const s = credStyle(d.status);
                      return (
                        <div
                          key={d.naam}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[#f5f3fd]"
                        >
                          <span className="flex-1 truncate text-[13px] font-medium">{d.naam}</span>
                          <span className="text-[11px]" style={{ ...fMono, color: C.muted }}>
                            {d.grootte}
                          </span>
                          <span className="text-[11px] font-bold" style={{ color: s.fg }}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {screen === "acties" && (
              <div className="space-y-3">
                {ACTIES.map((a) => {
                  const warn = a.urgentie === "warning";
                  return (
                    <div
                      key={a.titel}
                      className="flex items-center gap-4 rounded-2xl border p-5 transition-transform hover:-translate-y-0.5"
                      style={{ borderColor: C.border }}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                        style={{ background: warn ? C.amber : grad }}
                      >
                        {warn ? (
                          <AlertTriangle size={18} aria-hidden="true" />
                        ) : (
                          <Sparkles size={18} aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold">{a.titel}</p>
                        <p className="text-[13px]" style={{ color: C.muted }}>
                          {a.detail}
                        </p>
                      </div>
                      <button
                        className="shrink-0 rounded-full px-4 py-2 text-[13px] font-bold text-white transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2"
                        style={{ background: warn ? C.amber : grad }}
                      >
                        {a.cta}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {screen === "facturen" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    ["Betaald", "€ 5.552", C.green],
                    ["Openstaand", "€ 1.350", C.amber],
                    ["Concept", "€ 880", C.muted],
                  ].map(([l, v, col]) => (
                    <div
                      key={l}
                      className="rounded-2xl border p-4"
                      style={{ borderColor: C.border }}
                    >
                      <p className="text-[12px]" style={{ color: C.muted }}>
                        {l}
                      </p>
                      <p className="mt-1 text-xl font-bold" style={{ ...fMono, color: col }}>
                        {v}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="overflow-hidden rounded-2xl border"
                  style={{ borderColor: C.border }}
                >
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr style={{ color: C.muted }}>
                        <th className="px-5 py-3 font-medium">Factuur</th>
                        <th className="px-5 py-3 font-medium">Klant</th>
                        <th className="px-5 py-3 text-right font-medium">Bedrag</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Datum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FACTUREN.map((f) => {
                        const paid = f.status === "Betaald";
                        const open = f.status === "Openstaand";
                        const col = paid ? C.green : open ? C.amber : C.muted;
                        return (
                          <tr
                            key={f.nr}
                            className="border-t transition-colors hover:bg-[#f5f3fd]"
                            style={{ borderColor: C.border }}
                          >
                            <td className="px-5 py-3 font-semibold" style={fMono}>
                              {f.nr}
                            </td>
                            <td className="px-5 py-3">{f.klant}</td>
                            <td className="px-5 py-3 text-right font-bold" style={fMono}>
                              {f.bedrag}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold"
                                style={{ color: col }}
                              >
                                {paid && <Check size={13} aria-hidden="true" />} {f.status}
                              </span>
                            </td>
                            <td
                              className="px-5 py-3 text-right"
                              style={{ ...fMono, color: C.muted }}
                            >
                              {f.datum}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function MatchBadge({ value, big, small }: { value: number; big?: boolean; small?: boolean }) {
  const strong = value >= 90;
  const size = big ? "h-16 w-16 text-2xl" : small ? "h-9 w-9 text-[12px]" : "h-11 w-11 text-sm";
  return (
    <span
      className={`relative flex shrink-0 flex-col items-center justify-center rounded-2xl font-bold ${size}`}
      style={{
        background: strong ? grad : "#f5f3fd",
        color: strong ? "#fff" : C.violet,
        ...fMono,
      }}
    >
      {value}
      {big && <span className="text-[10px] font-medium opacity-90">match</span>}
      {strong && !small && (
        <span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white"
          aria-hidden="true"
        >
          <Sparkles size={10} style={{ color: C.pink }} />
        </span>
      )}
    </span>
  );
}
