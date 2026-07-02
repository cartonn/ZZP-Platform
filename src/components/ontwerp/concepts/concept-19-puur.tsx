"use client";

// Concept 19 — "Puur" · Whitespace-maximalisme / kalme luxe (LIGHT, bijna-monochroom).
// Het tegenovergestelde van dicht: royale witruimte, dunne typografie, ÉÉN actie per blik en
// progressive disclosure — details verschijnen pas op verzoek (uitklap/hover). Apple-achtige rust;
// vertrouwen door lucht. Newsreader-serif als stille displaystem, Manrope als lichte UI.
// Palet: bg #fbfbfa, ink #111827, muted #6b7280, hairline rgba(17,24,39,0.08). Eén accent = de inkt.
// Fonts: Manrope (UI) + Newsreader (display/serif).

import { useState } from "react";
import {
  ArrowRight,
  Plus,
  Minus,
  Check,
  Clock,
  AlertTriangle,
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
  bg: "#fbfbfa",
  ink: "#111827",
  inkSoft: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  hair: "rgba(17,24,39,0.08)",
  hairStrong: "rgba(17,24,39,0.14)",
  wash: "#f4f4f2",
  ok: "#4b5563",
  warn: "#8a6d3b",
};

const ui = { fontFamily: "var(--font-lab-manrope)" };
const serif = { fontFamily: "var(--font-lab-newsreader)" };

function statusLabel(s: CredStatus): { label: string; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle };
  }
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.faint }}>
      {children}
    </p>
  );
}

export function Concept19() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      {/* Uiterst rustige kop */}
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 pb-2 pt-10 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="text-[22px] italic leading-none" style={serif}>
            Puur
          </span>
          <span
            className="hidden text-[11px] uppercase tracking-[0.3em] sm:inline"
            style={{ color: C.faint }}
          >
            ZZP
          </span>
        </div>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-medium"
          style={{ border: `1px solid ${C.hairStrong}`, color: C.inkSoft }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </header>

      {/* Navigatie als stille tekstlinks met veel lucht */}
      <nav
        className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-6 pb-8 pt-6 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.ink : C.faint, fontWeight: on ? 600 : 400 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-0.5 left-3 right-3 h-px"
                  style={{ background: C.ink }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="h-px w-full" style={{ background: C.hair }} aria-hidden="true" />

      <main className="mx-auto max-w-4xl px-6 py-14 md:px-10 md:py-20">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const [openStats, setOpenStats] = useState(false);
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-24">
      {/* ÉÉN blik: groet + één stille zin */}
      <section>
        <Overline>Vandaag</Overline>
        <h1
          className="mt-6 text-[44px] font-light leading-[1.06] tracking-[-0.01em] sm:text-[60px]"
          style={serif}
        >
          Goedemorgen,
          <br />
          {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p
          className="mt-8 max-w-md text-[16px] font-light leading-relaxed"
          style={{ color: C.muted }}
        >
          Alles is rustig. Eén ding vraagt vandaag je aandacht — de rest kan wachten.
        </p>
      </section>

      {/* ÉÉN actie per blik */}
      <section>
        <Overline>Het enige dat nu telt</Overline>
        <div className="mt-8 border-t pt-10" style={{ borderColor: C.hairStrong }}>
          <h2 className="max-w-xl text-[28px] font-light leading-snug" style={serif}>
            {primair.titel}
          </h2>
          <p
            className="mt-4 max-w-lg text-[15px] font-light leading-relaxed"
            style={{ color: C.muted }}
          >
            {primair.detail}
          </p>
          <button
            onClick={onOpen}
            className="group mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3 text-[14px] font-medium transition-transform hover:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-3"
            style={{ background: C.ink, color: C.bg }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Cijfers — bewust stil, details op verzoek (progressive disclosure) */}
      <section>
        <div className="flex items-baseline justify-between">
          <Overline>In cijfers</Overline>
          <button
            onClick={() => setOpenStats((v) => !v)}
            aria-expanded={openStats}
            className="inline-flex items-center gap-1.5 text-[12px] transition-colors hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.muted }}
          >
            {openStats ? "Verberg trend" : "Toon trend"}
            {openStats ? (
              <Minus size={13} aria-hidden="true" />
            ) : (
              <Plus size={13} aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label}>
              <p
                className="text-[38px] font-light tabular-nums leading-none tracking-[-0.02em]"
                style={serif}
              >
                {k.value}
              </p>
              <p className="mt-3 text-[12.5px] font-light" style={{ color: C.muted }}>
                {k.label}
              </p>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: openStats ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p
                    className="pt-3 text-[11.5px] tabular-nums"
                    style={{ color: k.up ? C.ok : C.warn }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Opdrachten: titels + match, details pas bij uitklappen */}
      <section>
        <Overline>Opdrachten voor jou</Overline>
        <div className="mt-6">
          <Accordion items={OPDRACHTEN} onOpen={onOpen} />
        </div>
      </section>
    </div>
  );
}

function Accordion({ items, onOpen }: { items: Opdracht[]; onOpen: () => void }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <ul>
      {items.map((o) => {
        const isOpen = open === o.id;
        return (
          <li key={o.id} className="border-t last:border-b" style={{ borderColor: C.hair }}>
            <button
              onClick={() => setOpen(isOpen ? null : o.id)}
              aria-expanded={isOpen}
              className="group flex w-full items-baseline gap-5 py-7 text-left transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span className="w-12 shrink-0 text-[13px] tabular-nums" style={{ color: C.faint }}>
                {o.match}%
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-light leading-snug" style={serif}>
                  {o.titel}
                </span>
                <span className="mt-1 block text-[12.5px] font-light" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats}
                </span>
              </span>
              <span
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none"
                style={{
                  border: `1px solid ${C.hairStrong}`,
                  color: C.inkSoft,
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                }}
                aria-hidden="true"
              >
                <Plus size={14} />
              </span>
            </button>
            <div
              className="grid transition-all duration-300 motion-reduce:transition-none"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 gap-8 pb-8 pl-0 sm:grid-cols-2 sm:pl-[68px]">
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-[0.2em]"
                      style={{ color: C.faint }}
                    >
                      Wat past
                    </p>
                    <ul className="mt-4 space-y-2.5">
                      {o.redenen.plus.map((r) => (
                        <li key={r} className="flex items-start gap-3 text-[14px] font-light">
                          <Check
                            size={15}
                            aria-hidden="true"
                            style={{ color: C.ink, marginTop: 2 }}
                          />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-[0.2em]"
                      style={{ color: C.faint }}
                    >
                      Aandacht
                    </p>
                    <ul className="mt-4 space-y-2.5">
                      {o.redenen.min.map((r) => (
                        <li
                          key={r}
                          className="flex items-start gap-3 text-[14px] font-light"
                          style={{ color: C.muted }}
                        >
                          <Minus
                            size={15}
                            aria-hidden="true"
                            style={{ color: C.faint, marginTop: 2 }}
                          />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={onOpen}
                    className="inline-flex items-center gap-2 text-[13px] font-medium transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2 sm:col-span-2"
                    style={{ color: C.ink }}
                  >
                    Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
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
    <div className="space-y-16">
      <div>
        <Overline>Marktplaats</Overline>
        <h1 className="mt-6 text-[40px] font-light leading-none tracking-[-0.01em]" style={serif}>
          Open opdrachten
        </h1>
      </div>

      <div className="border-b pb-4" style={{ borderColor: C.hairStrong }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoeken…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[24px] font-light outline-none placeholder:text-[#9ca3af]"
          style={{ ...serif, color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[30px] font-light" style={serif}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-4 max-w-xs text-[14px] font-light" style={{ color: C.muted }}>
            Er is geen opdracht die past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
            style={{ color: C.ink }}
          >
            Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <Accordion items={filtered} onOpen={onOpen} />
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="space-y-20">
      <div>
        <button
          className="inline-flex items-center gap-2 text-[12.5px] transition-colors hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted }}
        >
          <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug
        </button>
        <div className="mt-8 flex items-baseline gap-4">
          <Overline>{opdracht.id}</Overline>
          <span className="text-[12px] tabular-nums" style={{ color: C.faint }}>
            {opdracht.match}% match
          </span>
        </div>
        <h1
          className="mt-6 max-w-2xl text-[40px] font-light leading-[1.08] tracking-[-0.01em]"
          style={serif}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-5 text-[15px] font-light" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <button
          className="mt-10 inline-flex items-center gap-3 rounded-full px-6 py-3 text-[14px] font-medium transition-transform hover:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-3"
          style={{ background: C.ink, color: C.bg }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-x-8 gap-y-10 border-t pt-12 sm:grid-cols-4"
        style={{ borderColor: C.hair }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l}>
            <p className="text-[28px] font-light tabular-nums tracking-[-0.01em]" style={serif}>
              {m.v}
            </p>
            <p
              className="mt-2 text-[12px] font-light uppercase tracking-[0.16em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
          </div>
        ))}
      </div>

      <div>
        <Overline>Waarom deze match</Overline>
        <p
          className="mt-6 max-w-lg text-[16px] font-light leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Transparant onderbouwd op je geverifieerde profiel. Altijd de pluspunten én de aandacht —
          zonder verborgen score.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.faint }}>
              Wat past
            </p>
            <ul className="mt-6 space-y-4">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-3 text-[15px] font-light">
                  <Check size={16} aria-hidden="true" style={{ color: C.ink, marginTop: 2 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: C.faint }}>
              Aandacht
            </p>
            <ul className="mt-6 space-y-4">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[15px] font-light"
                  style={{ color: C.muted }}
                >
                  <Minus size={16} aria-hidden="true" style={{ color: C.faint, marginTop: 2 }} />
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
  const [open, setOpen] = useState<string | null>(null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-16">
      <div>
        <Overline>Vertrouwen</Overline>
        <h1 className="mt-6 text-[40px] font-light leading-none tracking-[-0.01em]" style={serif}>
          Verificatie
        </h1>
        <p
          className="mt-8 max-w-md text-[16px] font-light leading-relaxed"
          style={{ color: C.muted }}
        >
          <span style={{ color: C.ink }}>{PROFIEL.trust}.</span> {verified} van {CREDENTIALS.length}{" "}
          credentials volledig geverifieerd. Eén vraagt binnenkort actie.
        </p>
      </div>

      <ul>
        {CREDENTIALS.map((c) => {
          const st = statusLabel(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam} className="border-t last:border-b" style={{ borderColor: C.hair }}>
              <button
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-5 py-7 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <st.Icon size={17} aria-hidden="true" style={{ color: C.inkSoft }} />
                <span className="min-w-0 flex-1 text-[18px] font-light" style={serif}>
                  {c.naam}
                </span>
                <span
                  className="hidden text-[12px] font-light sm:inline"
                  style={{ color: C.muted }}
                >
                  {st.label}
                </span>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none"
                  style={{
                    border: `1px solid ${C.hairStrong}`,
                    color: C.inkSoft,
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                  aria-hidden="true"
                >
                  <Plus size={14} />
                </span>
              </button>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="pb-8 pl-9 text-[14px] font-light" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-16">
      <div>
        <Overline>Aandacht</Overline>
        <h1 className="mt-6 text-[40px] font-light leading-none tracking-[-0.01em]" style={serif}>
          Volgende acties
        </h1>
      </div>
      <ol className="space-y-0">
        {ACTIES.map((a, i) => (
          <li key={a.titel} className="border-t last:border-b" style={{ borderColor: C.hair }}>
            <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:gap-8">
              <span className="text-[13px] tabular-nums" style={{ color: C.faint, ...serif }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="max-w-lg text-[22px] font-light leading-snug" style={serif}>
                  {a.titel}
                </h2>
                <p
                  className="mt-3 max-w-md text-[14px] font-light leading-relaxed"
                  style={{ color: C.muted }}
                >
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-start rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ border: `1px solid ${C.hairStrong}`, color: C.ink }}
              >
                {a.cta}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  return (
    <div className="space-y-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Overline>Omzet</Overline>
          <h1 className="mt-6 text-[40px] font-light leading-none tracking-[-0.01em]" style={serif}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-transform hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.ink, color: C.bg }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="border-t" style={{ borderColor: C.hairStrong }}>
        {FACTUREN.map((f) => (
          <div
            key={f.nr}
            className="flex items-baseline gap-4 border-b py-7 transition-opacity hover:opacity-70 sm:gap-8"
            style={{ borderColor: C.hair }}
          >
            <span
              className="hidden w-28 shrink-0 text-[12px] tabular-nums sm:inline"
              style={{ color: C.faint }}
            >
              {f.nr}
            </span>
            <span className="min-w-0 flex-1 text-[18px] font-light" style={serif}>
              {f.klant}
            </span>
            <span className="hidden text-[12px] tabular-nums sm:inline" style={{ color: C.muted }}>
              {f.datum}
            </span>
            <span className="w-20 text-[12px] font-light" style={{ color: C.muted }}>
              {f.status}
            </span>
            <span className="w-24 text-right text-[18px] font-light tabular-nums" style={serif}>
              {f.bedrag}
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between py-8">
          <span className="text-[12px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
            Totaal betaald
          </span>
          <span className="text-[26px] font-light tabular-nums" style={serif}>
            {total}
          </span>
        </div>
      </div>
    </div>
  );
}
