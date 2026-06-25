"use client";

// Concept 04 — "Haven" · Warm-menselijk, vertrouwen eerst.
// Warme zand-palet, grote radii, een centrale circulaire vertrouwensmeter als hero, en
// geruststellende microcopy rond gevoelige documenten (VOG, diploma's). Mensgericht maar strak.

import { useState } from "react";
import {
  ShieldCheck,
  Search,
  FileText,
  MessageCircle,
  Receipt,
  LayoutGrid,
  BadgeCheck,
  Clock,
  AlertTriangle,
  MapPin,
  ArrowUpRight,
  Heart,
  Check,
  Inbox,
  Sparkle,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
} from "./mock";

const C = {
  canvas: "#f7f3ec",
  card: "#fffdf9",
  ink: "#211f1a",
  muted: "#6b6358",
  border: "#e6dfd2",
  accent: "#0d9488",
  accentSoft: "#e2f3f1",
  amber: "#b45309",
  amberSoft: "#fbecd9",
};

const fUI = { fontFamily: "var(--font-lab-jakarta)" };
const fHead = { fontFamily: "var(--font-lab-sora)" };
const fNum = { fontFamily: "var(--font-lab-mono)", fontVariantNumeric: "tabular-nums" as const };

const NAV: { key: ScreenKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "marktplaats", label: "Marktplaats", icon: Search },
  { key: "opdracht", label: "Opdracht", icon: FileText },
  { key: "verificatie", label: "Verificatie", icon: ShieldCheck },
  { key: "acties", label: "Acties", icon: Heart },
  { key: "facturen", label: "Facturen", icon: Receipt },
];

function statusTone(s: CredStatus) {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", bg: C.accentSoft, fg: C.accent, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", bg: "#eef0ec", fg: C.muted, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", bg: C.amberSoft, fg: C.amber, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Aandacht nodig", bg: "#fbe9e6", fg: "#b91c1c", Icon: AlertTriangle };
  }
}

function TrustRing({ score }: { score: number }) {
  const r = 76;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: 184, height: 184 }}>
      <svg width="184" height="184" viewBox="0 0 184 184" aria-hidden="true">
        <circle cx="92" cy="92" r={r} fill="none" stroke={C.border} strokeWidth="14" />
        <circle
          cx="92"
          cy="92"
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          transform="rotate(-90 92 92)"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold" style={{ ...fNum, color: C.ink }}>
          {score}
        </span>
        <span className="mt-0.5 text-[11px] font-medium" style={{ color: C.muted }}>
          van 100
        </span>
        <span
          className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ background: C.accentSoft, color: C.accent }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: "#f1ede4", color: C.muted, border: `1px solid ${C.border}` }}
    >
      {children}
    </span>
  );
}

export function Concept04() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [active, setActive] = useState(OPDRACHTEN[0]!.id);
  const cur = OPDRACHTEN.find((o) => o.id === active) ?? OPDRACHTEN[0]!;
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...fUI, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Sidebar */}
        <aside
          className="hidden w-60 shrink-0 flex-col gap-1 border-r p-4 md:flex"
          style={{ borderColor: C.border, background: C.card }}
        >
          <div className="mb-5 flex items-center gap-2.5 px-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{ background: C.accent, color: "#fff" }}
            >
              <Heart size={17} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold" style={fHead}>
                Haven
              </p>
              <p className="text-[11px]" style={{ color: C.muted }}>
                Zorgplatform
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
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: on ? C.accentSoft : "transparent",
                  color: on ? C.accent : C.muted,
                }}
              >
                <n.icon size={17} aria-hidden="true" /> {n.label}
              </button>
            );
          })}
          <div
            className="mt-auto flex items-center gap-3 rounded-2xl p-3"
            style={{ background: "#f1ede4" }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: C.accent, color: "#fff", ...fHead }}
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{PROFIEL.naam}</p>
              <p className="truncate text-[11px]" style={{ color: C.muted }}>
                {PROFIEL.plaats}
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-hidden">
          {/* Topbar */}
          <header
            className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: C.border, background: C.card }}
          >
            <div>
              <h1 className="text-lg font-semibold" style={fHead}>
                Fijn dat je er bent, {PROFIEL.naam.split(" ")[0]}
              </h1>
              <p className="text-[13px]" style={{ color: C.muted }}>
                {SCREENS.find((s) => s.key === screen)?.label} · alles veilig en op orde
              </p>
            </div>
            <div className="flex gap-2 md:hidden">
              {NAV.slice(0, 4).map((n) => (
                <button
                  key={n.key}
                  onClick={() => setScreen(n.key)}
                  aria-label={n.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: screen === n.key ? C.accentSoft : "transparent",
                    color: screen === n.key ? C.accent : C.muted,
                  }}
                >
                  <n.icon size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          </header>

          <div className="p-6">
            {screen === "dashboard" && (
              <div className="grid gap-5 lg:grid-cols-3">
                {/* Trust hero */}
                <section
                  className="flex flex-col items-center justify-center gap-4 rounded-3xl border p-7 text-center"
                  style={{ borderColor: C.border, background: C.card }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: C.muted }}
                  >
                    Jouw vertrouwensniveau
                  </p>
                  <TrustRing score={92} />
                  <p
                    className="max-w-[15rem] text-[13px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {verified} van {CREDENTIALS.length} documenten geverifieerd. Opdrachtgevers zien
                    in één oogopslag dat ze je kunnen vertrouwen.
                  </p>
                </section>

                {/* KPI's + acties */}
                <div className="flex flex-col gap-5 lg:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    {KPIS.map((k) => (
                      <div
                        key={k.label}
                        className="rounded-3xl border p-4 transition-shadow hover:shadow-sm"
                        style={{ borderColor: C.border, background: C.card }}
                      >
                        <p className="text-[12px]" style={{ color: C.muted }}>
                          {k.label}
                        </p>
                        <div className="mt-1 flex items-end justify-between">
                          <span className="text-2xl font-semibold" style={{ ...fNum }}>
                            {k.value}
                          </span>
                          <span
                            className="text-[11px] font-semibold"
                            style={{ ...fNum, color: k.up ? C.accent : C.amber }}
                          >
                            {k.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <section
                    className="rounded-3xl border p-5"
                    style={{ borderColor: C.border, background: C.card }}
                  >
                    <h2
                      className="mb-3 flex items-center gap-2 text-sm font-semibold"
                      style={fHead}
                    >
                      <Sparkle size={16} style={{ color: C.accent }} aria-hidden="true" /> Wat kun
                      je nu doen?
                    </h2>
                    <ul className="space-y-2.5">
                      {ACTIES.map((a) => {
                        const warn = a.urgentie === "warning";
                        return (
                          <li
                            key={a.titel}
                            className="flex items-start gap-3 rounded-2xl p-3 transition-colors"
                            style={{ background: warn ? C.amberSoft : "#f5f1e9" }}
                          >
                            <span
                              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                              style={{
                                background: warn ? "#fff" : C.card,
                                color: warn ? C.amber : C.accent,
                              }}
                            >
                              {warn ? (
                                <AlertTriangle size={14} aria-hidden="true" />
                              ) : (
                                <Heart size={14} aria-hidden="true" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold">{a.titel}</p>
                              <p className="text-[12px]" style={{ color: C.muted }}>
                                {a.detail}
                              </p>
                            </div>
                            <button
                              className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                              style={{
                                background: warn ? C.amber : C.accent,
                                color: "#fff",
                              }}
                            >
                              {a.cta}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                </div>
              </div>
            )}

            {screen === "marktplaats" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex flex-1 items-center gap-2 rounded-2xl border px-3.5 py-2.5"
                    style={{ borderColor: C.border, background: C.card }}
                  >
                    <Search size={16} style={{ color: C.muted }} aria-hidden="true" />
                    <input
                      className="w-full bg-transparent text-sm outline-none"
                      placeholder="Zoek opdrachten die bij je passen…"
                      aria-label="Zoek opdrachten"
                    />
                  </div>
                  <Chip>Binnen 25 km</Chip>
                  <Chip>Match ≥ 80%</Chip>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {OPDRACHTEN.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setActive(o.id);
                        setScreen("opdracht");
                      }}
                      className="group rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
                      style={{ borderColor: C.border, background: C.card }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold leading-snug" style={fHead}>
                            {o.titel}
                          </p>
                          <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
                            {o.opdrachtgever}
                          </p>
                        </div>
                        <span
                          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-sm font-semibold"
                          style={{ ...fNum, background: C.accentSoft, color: C.accent }}
                        >
                          {o.match}
                        </span>
                      </div>
                      <div
                        className="mt-3 flex flex-wrap gap-2 text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} aria-hidden="true" /> {o.plaats}
                        </span>
                        <span style={fNum}>{o.tarief}</span>
                        <span style={fNum}>{o.uren}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <Chip key={t}>{t}</Chip>
                        ))}
                      </div>
                      <span
                        className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold transition-transform group-hover:translate-x-0.5"
                        style={{ color: C.accent }}
                      >
                        Bekijk opdracht <ChevronRight size={14} aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {screen === "opdracht" && (
              <div className="grid gap-5 lg:grid-cols-3">
                <section
                  className="rounded-3xl border p-6 lg:col-span-2"
                  style={{ borderColor: C.border, background: C.card }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-medium" style={{ ...fNum, color: C.muted }}>
                        {cur.id}
                      </span>
                      <h2 className="text-xl font-semibold leading-snug" style={fHead}>
                        {cur.titel}
                      </h2>
                      <p className="text-[13px]" style={{ color: C.muted }}>
                        {cur.opdrachtgever} · {cur.plaats}
                      </p>
                    </div>
                    <span
                      className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl"
                      style={{ background: C.accentSoft, color: C.accent }}
                    >
                      <span className="text-xl font-semibold" style={fNum}>
                        {cur.match}
                      </span>
                      <span className="text-[10px]">match</span>
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      ["Tarief", cur.tarief],
                      ["Uren", cur.uren],
                      ["Start", cur.start],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-2xl p-3" style={{ background: "#f5f1e9" }}>
                        <p className="text-[11px]" style={{ color: C.muted }}>
                          {l}
                        </p>
                        <p className="text-[14px] font-semibold" style={fNum}>
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[12px] font-semibold" style={{ color: C.accent }}>
                        Waarom dit goed past
                      </p>
                      <ul className="space-y-1.5">
                        {cur.redenen.plus.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-[13px]">
                            <Check
                              size={15}
                              className="mt-0.5 shrink-0"
                              style={{ color: C.accent }}
                              aria-hidden="true"
                            />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-[12px] font-semibold" style={{ color: C.amber }}>
                        Om rekening mee te houden
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
                    className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2"
                    style={{ background: C.accent }}
                  >
                    Reageer op deze opdracht <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </section>
                <aside
                  className="rounded-3xl border p-5"
                  style={{ borderColor: C.border, background: C.card }}
                >
                  <h3 className="mb-3 text-sm font-semibold" style={fHead}>
                    Andere opdrachten
                  </h3>
                  <div className="space-y-2">
                    {OPDRACHTEN.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setActive(o.id)}
                        className="flex w-full items-center justify-between rounded-2xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          background: o.id === active ? C.accentSoft : "#f5f1e9",
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold">{o.titel}</p>
                          <p className="text-[11px]" style={{ color: C.muted }}>
                            {o.opdrachtgever}
                          </p>
                        </div>
                        <span
                          className="text-[12px] font-semibold"
                          style={{ ...fNum, color: C.accent }}
                        >
                          {o.match}%
                        </span>
                      </button>
                    ))}
                  </div>
                </aside>
              </div>
            )}

            {screen === "verificatie" && (
              <div className="space-y-4">
                <div
                  className="flex items-start gap-3 rounded-3xl border p-4"
                  style={{ borderColor: "#f0d9b8", background: C.amberSoft }}
                >
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: C.amber }}>
                      Je VOG verloopt over 23 dagen
                    </p>
                    <p className="text-[12px]" style={{ color: C.muted }}>
                      Geen zorgen — vraag rustig op tijd een nieuwe aan, dan blijf je zichtbaar voor
                      opdrachtgevers.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {CREDENTIALS.map((c) => {
                    const t = statusTone(c.status);
                    return (
                      <div
                        key={c.naam}
                        className="flex items-center gap-3 rounded-3xl border p-4 transition-shadow hover:shadow-sm"
                        style={{ borderColor: C.border, background: C.card }}
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                          style={{ background: t.bg, color: t.fg }}
                        >
                          <t.Icon size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">{c.naam}</p>
                          <p className="text-[12px]" style={{ color: C.muted }}>
                            {c.detail}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: t.bg, color: t.fg }}
                        >
                          {t.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Documenten als extra */}
                <section
                  className="rounded-3xl border p-5"
                  style={{ borderColor: C.border, background: C.card }}
                >
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={fHead}>
                    <FileText size={16} style={{ color: C.accent }} aria-hidden="true" /> Jouw
                    documenten
                  </h3>
                  <div className="space-y-1.5">
                    {DOCUMENTEN.map((d) => {
                      const t = statusTone(d.status);
                      return (
                        <div
                          key={d.naam}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-[#f5f1e9]"
                        >
                          <FileText size={15} style={{ color: C.muted }} aria-hidden="true" />
                          <span className="flex-1 truncate text-[13px] font-medium">{d.naam}</span>
                          <span className="text-[11px]" style={{ ...fNum, color: C.muted }}>
                            {d.grootte}
                          </span>
                          <span className="text-[11px] font-semibold" style={{ color: t.fg }}>
                            {t.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {screen === "acties" && (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                  {ACTIES.map((a) => {
                    const warn = a.urgentie === "warning";
                    return (
                      <div
                        key={a.titel}
                        className="flex items-start gap-4 rounded-3xl border p-5 transition-shadow hover:shadow-sm"
                        style={{ borderColor: C.border, background: C.card }}
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                          style={{
                            background: warn ? C.amberSoft : C.accentSoft,
                            color: warn ? C.amber : C.accent,
                          }}
                        >
                          {warn ? (
                            <AlertTriangle size={18} aria-hidden="true" />
                          ) : (
                            <Sparkle size={18} aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">{a.titel}</p>
                          <p className="text-[13px]" style={{ color: C.muted }}>
                            {a.detail}
                          </p>
                        </div>
                        <button
                          className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2"
                          style={{ background: warn ? C.amber : C.accent }}
                        >
                          {a.cta}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {/* Berichten + lege staat */}
                <aside
                  className="rounded-3xl border p-5"
                  style={{ borderColor: C.border, background: C.card }}
                >
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={fHead}>
                    <MessageCircle size={16} style={{ color: C.accent }} aria-hidden="true" />{" "}
                    Berichten
                  </h3>
                  <div className="space-y-2">
                    {BERICHTEN.map((b) => (
                      <div
                        key={b.van}
                        className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-[#f5f1e9]"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                          style={{ background: C.accentSoft, color: C.accent }}
                        >
                          {b.initialen}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-[13px] font-semibold">{b.van}</p>
                            <span className="text-[10px]" style={{ color: C.muted }}>
                              {b.tijd}
                            </span>
                          </div>
                          <p className="truncate text-[12px]" style={{ color: C.muted }}>
                            {b.preview}
                          </p>
                        </div>
                        {b.ongelezen && (
                          <span
                            className="mt-1 h-2 w-2 shrink-0 rounded-full"
                            style={{ background: C.accent }}
                            aria-label="ongelezen"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            )}

            {screen === "facturen" && (
              <div
                className="overflow-hidden rounded-3xl border"
                style={{ borderColor: C.border, background: C.card }}
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
                      return (
                        <tr
                          key={f.nr}
                          className="border-t transition-colors hover:bg-[#f5f1e9]"
                          style={{ borderColor: C.border }}
                        >
                          <td className="px-5 py-3 font-medium" style={fNum}>
                            {f.nr}
                          </td>
                          <td className="px-5 py-3">{f.klant}</td>
                          <td className="px-5 py-3 text-right font-semibold" style={fNum}>
                            {f.bedrag}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                background: paid ? C.accentSoft : open ? C.amberSoft : "#eef0ec",
                                color: paid ? C.accent : open ? C.amber : C.muted,
                              }}
                            >
                              {f.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right" style={{ ...fNum, color: C.muted }}>
                            {f.datum}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div
                  className="flex items-center justify-center gap-2 border-t px-5 py-6 text-[12px]"
                  style={{ borderColor: C.border, color: C.muted }}
                >
                  <Inbox size={15} aria-hidden="true" /> Dit zijn al je facturen van deze maand —
                  mooi bijgewerkt.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
