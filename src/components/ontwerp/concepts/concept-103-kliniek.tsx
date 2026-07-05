"use client";

// Concept 103 — "Kliniek" · Klinisch medisch dossier (LIGHT, koel mint & helder wit).
// Patiëntenkaart-esthetiek: dunne klinische hairlines, medicijn-etiket-precisie, strakke rijen en
// monospace-labels als op een medicijndoosje. Eén mint/teal-accent. Vertrouwen via precisie en
// netheid — klinische rust en orde, niet warm. Zeer passend bij zorg-ZZP (BIG, VOG, diploma's).
// Fonts: IBM Plex Mono (labels/codes) + Inter (UI/tekst).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Activity,
  ShieldCheck,
  Search,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#f4f8f7",
  paper: "#ffffff",
  ink: "#132a2a",
  inkSoft: "#385050",
  muted: "#6a8382",
  faint: "#9db3b2",
  hair: "#dbe8e6",
  hairStrong: "#c2d6d3",
  mint: "#0f9b8e",
  mintDeep: "#0a7267",
  mintWash: "#e6f4f1",
  ok: "#0f9b8e",
  warn: "#b8792a",
  warnWash: "#faf1e3",
  bad: "#c0453a",
  badWash: "#faeceb",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
  wash: string;
  code: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.ok, wash: C.mintWash, code: "VER" };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        color: C.mintDeep,
        wash: C.mintWash,
        code: "SUB",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        color: C.warn,
        wash: C.warnWash,
        code: "EXP",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.bad, wash: C.badWash, code: "REJ" };
  }
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[10px] font-medium uppercase tracking-[0.18em] ${className}`}
      style={{ ...mono, color: C.muted }}
    >
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: C.paper, border: `1px solid ${C.hair}` }}
    >
      {children}
    </div>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Match ${value} procent`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: C.hair }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg,${C.mintDeep},${C.mint})`,
          }}
        />
      </div>
      <span
        className="text-[12px] font-semibold tabular-nums"
        style={{ ...mono, color: C.mintDeep }}
      >
        {value}%
      </span>
    </div>
  );
}

export function Concept103() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <header
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8"
        style={{ borderBottom: `1px solid ${C.hairStrong}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ background: C.mintWash, border: `1px solid ${C.hairStrong}` }}
            aria-hidden="true"
          >
            <Activity size={17} style={{ color: C.mintDeep }} />
          </span>
          <div>
            <p className="text-[15px] font-bold leading-none tracking-tight">Kliniek</p>
            <p
              className="mt-1 text-[9.5px] uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.faint }}
            >
              Zorg-ZZP dossier
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.mintWash, color: C.mintDeep }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <div className="text-right">
            <p className="text-[12px] font-semibold leading-none">{PROFIEL.naam}</p>
            <p className="mt-0.5 text-[10px]" style={{ ...mono, color: C.muted }}>
              ID-{PROFIEL.initialen.toUpperCase()}-2041
            </p>
          </div>
        </div>
      </header>

      <nav
        className="mx-auto flex max-w-6xl items-center gap-0.5 overflow-x-auto px-5 md:px-8"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.hair}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{ ...mono, color: on ? C.mintDeep : C.muted }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-2 bottom-0 h-0.5"
                  style={{ background: C.mint }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-8">
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
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <Label>Prioriteit · direct</Label>
            <span
              className="rounded-sm px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.warnWash, color: C.warn }}
            >
              Actie vereist
            </span>
          </div>
          <h1 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
            {primair.titel}
          </h1>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <button
            onClick={onOpen}
            className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.mintDeep }}
          >
            {primair.cta} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </Card>

        <Card className="p-5">
          <Label>Beste match · vandaag</Label>
          <p className="mt-3 text-[16px] font-bold leading-snug tracking-tight">{top.titel}</p>
          <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
            {top.opdrachtgever} · {top.plaats}
          </p>
          <div className="mt-4">
            <Meter value={top.match} />
          </div>
          <button
            onClick={onOpen}
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.mintDeep }}
          >
            Open dossier <ArrowRight size={13} aria-hidden="true" />
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <Label>{k.label}</Label>
            </div>
            <p
              className="mt-2 text-[24px] font-bold tabular-nums leading-none tracking-tight"
              style={mono}
            >
              {k.value}
            </p>
            <p
              className="mt-2 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums"
              style={{
                ...mono,
                background: k.up ? C.mintWash : C.warnWash,
                color: k.up ? C.mintDeep : C.warn,
              }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </p>
          </Card>
        ))}
      </div>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label>Marktplaats · open registers</Label>
          <h1 className="mt-1.5 text-[22px] font-bold tracking-tight">Beschikbare opdrachten</h1>
        </div>
        <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
      </div>

      <Card className="flex items-center gap-2.5 px-3 py-2.5">
        <Search size={15} style={{ color: C.faint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9db3b2]"
          style={{ color: C.ink }}
        />
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-[15px] font-bold">Geen resultaten</p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen opdracht past bij “{q}”. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.mintDeep }}
          >
            Filter wissen <ArrowRight size={13} aria-hidden="true" />
          </button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {filtered.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                <button
                  onClick={onOpen}
                  className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-[#f4f8f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10.5px] tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[15px] font-bold leading-snug tracking-tight">
                      {o.titel}
                    </p>
                    <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ ...mono, background: C.mintWash, color: C.mintDeep }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-full shrink-0 sm:w-44">
                    <Meter value={o.match} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={12} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Label>{opdracht.id}</Label>
            <h1 className="mt-1.5 text-[22px] font-bold leading-tight tracking-tight">
              {opdracht.titel}
            </h1>
            <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="rounded-md px-3 py-2 text-center" style={{ background: C.mintWash }}>
            <p
              className="text-[24px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.mintDeep }}
            >
              {opdracht.match}%
            </p>
            <p
              className="mt-0.5 text-[9px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.mintDeep }}
            >
              match-index
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Meter value={opdracht.match} />
        </div>
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.mintDeep }}
        >
          Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
        </button>
      </Card>

      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-lg sm:grid-cols-4"
        style={{ background: C.hair }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Locatie", v: opdracht.plaats },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.paper }}>
            <Label>{m.l}</Label>
            <p className="mt-1.5 text-[14px] font-bold tabular-nums tracking-tight">{m.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Check size={14} style={{ color: C.ok }} aria-hidden="true" />
            <Label className="!tracking-[0.14em]">Indicaties · past</Label>
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px]">
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: C.ok }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: C.warn }} aria-hidden="true" />
            <Label className="!tracking-[0.14em]">Contra-indicaties · let op</Label>
          </div>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: C.warn }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label>Dossier · credentials</Label>
          <h1 className="mt-1.5 text-[22px] font-bold tracking-tight">Verificatie-register</h1>
        </div>
        <span
          className="rounded-md px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{ ...mono, background: C.mintWash, color: C.mintDeep }}
        >
          {verified}/{CREDENTIALS.length} geverifieerd
        </span>
      </div>

      <Card className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.hair}`, background: C.bg }}
        >
          <Label>Credential</Label>
          <Label>Detail</Label>
          <Label>Status</Label>
        </div>
        <ul>
          {CREDENTIALS.map((c, i) => {
            const st = statusMeta(c.status);
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{ background: st.wash }}
                  aria-hidden="true"
                >
                  <st.Icon size={16} style={{ color: st.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold leading-snug tracking-tight">{c.naam}</p>
                  <p className="mt-0.5 text-[12px] sm:hidden" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <p
                  className="hidden max-w-[200px] text-right text-[12px] sm:block"
                  style={{ color: C.muted }}
                >
                  {c.detail}
                </p>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
                  style={{ background: st.wash, color: st.color }}
                >
                  <span className="text-[9.5px] font-bold tabular-nums" style={mono}>
                    {st.code}
                  </span>
                  {st.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div>
        <Label>Behandelplan · next-action</Label>
        <h1 className="mt-1.5 text-[22px] font-bold tracking-tight">Volgende acties</h1>
      </div>
      <div className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <Card key={a.titel} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[12px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: warn ? C.warnWash : C.mintWash,
                    color: warn ? C.warn : C.mintDeep,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {warn ? (
                      <AlertTriangle size={13} style={{ color: C.warn }} aria-hidden="true" />
                    ) : (
                      <Clock size={13} style={{ color: C.mintDeep }} aria-hidden="true" />
                    )}
                    <span
                      className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                      style={{ ...mono, color: warn ? C.warn : C.muted }}
                    >
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                  </div>
                  <p className="mt-1 text-[14.5px] font-bold leading-snug tracking-tight">
                    {a.titel}
                  </p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:self-center"
                  style={
                    warn
                      ? { background: C.mintDeep, color: "#ffffff" }
                      : { border: `1px solid ${C.hairStrong}`, color: C.ink }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label>Financieel · register</Label>
          <h1 className="mt-1.5 text-[22px] font-bold tracking-tight">Facturen</h1>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1px solid ${C.hairStrong}`, color: C.ink }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.hair}`, background: C.bg }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 ${i === 4 ? "text-right" : ""}`}>
                    <Label>{h}</Label>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const betaald = f.status === "Betaald";
                const open = f.status === "Openstaand";
                const col = betaald ? C.ok : open ? C.warn : C.muted;
                const wash = betaald ? C.mintWash : open ? C.warnWash : C.bg;
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hair}` }}>
                    <td
                      className="px-4 py-3 text-[11.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold">{f.klant}</td>
                    <td className="px-4 py-3 text-[12px] tabular-nums" style={{ color: C.muted }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: wash, color: col }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: col }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          className="flex items-baseline justify-between px-4 py-3.5"
          style={{ borderTop: `1px solid ${C.hairStrong}`, background: C.bg }}
        >
          <Label>Totaal betaald</Label>
          <span
            className="text-[18px] font-bold tabular-nums"
            style={{ ...mono, color: C.mintDeep }}
          >
            {total}
          </span>
        </div>
      </Card>
    </div>
  );
}
