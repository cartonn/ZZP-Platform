"use client";

// Concept 03 — "Folio" · Redactioneel / kinetische typografie.
// Palet: papier #faf8f4, inkt #1b1a17, rule-lijnen #ddd9d0, editorial-rood #b91c1c, muted #6f6a60.
// Fonts: Fraunces (oversized serif display) + Inter (body) + JetBrains Mono (kickers/cijfers).
// Filosofie: een magazine dat toevallig software is.

import { useState } from "react";
import {
  Check,
  Clock,
  AlertTriangle,
  X,
  ArrowRight,
  ArrowUpRight,
  Menu,
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
  paper: "#faf8f4",
  ink: "#1b1a17",
  rule: "#ddd9d0",
  ruleSoft: "#e8e4dc",
  red: "#b91c1c",
  muted: "#6f6a60",
  faint: "#a39d90",
};

const serif = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

function statusLabel(s: CredStatus): { label: string; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: "#15803d" };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.muted };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.red };
    case "REJECTED":
      return { label: "Afgewezen", color: C.red };
  }
}

function Kicker({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="text-[12px] font-medium tabular-nums" style={{ color: C.red, ...mono }}>
        {n}
      </span>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: C.muted, ...mono }}
      >
        {children}
      </span>
    </div>
  );
}

function Rule() {
  return <div className="h-px w-full" style={{ background: C.rule }} aria-hidden="true" />;
}

export function Concept03() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      {/* Masthead */}
      <header className="px-6 pt-6 sm:px-10">
        <div className="flex items-end justify-between">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: C.muted, ...mono }}
            >
              ZZP · Editie {new Date().getFullYear()}
            </p>
            <h1 className="mt-1 text-[30px] leading-none tracking-tight" style={serif}>
              Folio
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[12.5px] font-semibold">{PROFIEL.naam}</p>
              <p className="text-[11px]" style={{ color: C.muted }}>
                {PROFIEL.rol}
              </p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{ background: C.ink, color: C.paper, ...mono }}
            >
              {PROFIEL.initialen}
            </div>
            <button
              className="rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/40 sm:hidden"
              aria-label="Menu openen"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-4 h-[3px] w-full" style={{ background: C.ink }} aria-hidden="true" />

        {/* Sectie-navigatie als inhoudsopgave */}
        <nav
          className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b py-2.5"
          style={{ borderColor: C.rule }}
        >
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group relative px-2.5 py-1 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/40"
                style={{ color: on ? C.ink : C.muted }}
              >
                <span
                  className="mr-1.5 text-[10px] tabular-nums"
                  style={{ color: on ? C.red : C.faint, ...mono }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
                <span
                  className="absolute inset-x-2.5 -bottom-[11px] h-[2px] origin-left transition-transform"
                  style={{ background: C.red, transform: on ? "scaleX(1)" : "scaleX(0)" }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </header>

      <div className="px-6 py-7 sm:px-10">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const hero = KPIS[2] as (typeof KPIS)[number]; // Omzet
  return (
    <div className="space-y-9">
      {/* Waarschuwing als redactionele balk */}
      <div className="flex items-center gap-3 border-l-2 py-2 pl-3" style={{ borderColor: C.red }}>
        <AlertTriangle size={15} aria-hidden="true" style={{ color: C.red }} />
        <p className="text-[12.5px]" style={{ color: C.ink }}>
          <span className="font-semibold">Let op —</span> je VOG verloopt over{" "}
          <span style={mono}>23</span> dagen.{" "}
          <button
            className="font-semibold underline decoration-1 underline-offset-2"
            style={{ color: C.red }}
          >
            Vernieuw nu
          </button>
        </p>
      </div>

      {/* Hero: het cijfer dat telt */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Kicker n="01">Hoofdartikel · Omzet deze maand</Kicker>
          <p className="mt-3 text-[88px] leading-[0.85] tracking-tight" style={serif}>
            <span style={mono}>{hero.value}</span>
          </p>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Een stijging van{" "}
            <span className="font-semibold" style={{ color: C.ink, ...mono }}>
              {hero.trend}
            </span>{" "}
            ten opzichte van vorige maand — gedragen door drie geverifieerde opdrachten in de
            wijkzorg.
          </p>
        </div>
        <div className="space-y-4 lg:col-span-5">
          {KPIS.filter((k) => k.label !== hero.label).map((k) => (
            <div key={k.label} className="border-t pt-3" style={{ borderColor: C.rule }}>
              <div className="flex items-baseline justify-between">
                <span
                  className="text-[12px] uppercase tracking-wide"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11.5px] font-medium"
                  style={{ color: k.up ? "#15803d" : C.muted, ...mono }}
                >
                  <ArrowUpRight size={12} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <p className="mt-1 text-[34px] leading-none tracking-tight" style={{ ...serif }}>
                <span style={mono}>{k.value}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* Matches als redactionele lijst */}
      <section>
        <Kicker n="02">Geselecteerd voor jou · Beste matches</Kicker>
        <div className="mt-4">
          {OPDRACHTEN.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group grid w-full grid-cols-12 items-baseline gap-3 border-t py-4 text-left transition-colors hover:bg-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/30"
              style={{ borderColor: i === 0 ? C.ink : C.rule }}
            >
              <span
                className="col-span-1 text-[12px] tabular-nums"
                style={{ color: C.red, ...mono }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="col-span-7 sm:col-span-7">
                <p className="text-[18px] leading-tight tracking-tight" style={serif}>
                  {o.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats} · {o.uren}
                </p>
              </div>
              <span
                className="col-span-2 hidden text-right text-[13px] font-medium sm:block"
                style={mono}
              >
                {o.tarief}
              </span>
              <span className="col-span-3 flex items-center justify-end gap-2 sm:col-span-2">
                <span className="text-[20px] tracking-tight" style={{ ...serif, color: C.red }}>
                  <span style={mono}>{o.match}</span>
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                  style={{ color: C.ink }}
                />
              </span>
            </button>
          ))}
          <Rule />
        </div>
      </section>
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
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker n="01">Marktplaats · Open opdrachten</Kicker>
          <h2 className="mt-2 text-[40px] leading-none tracking-tight" style={serif}>
            Werk dat bij je past
          </h2>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel of plaats…"
          aria-label="Opdrachten zoeken"
          className="w-full border-b bg-transparent pb-1.5 text-[14px] outline-none transition-colors placeholder:text-[#a39d90] focus:border-[#1b1a17] sm:w-64"
          style={{ borderColor: C.rule, color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border-y py-16 text-center" style={{ borderColor: C.rule }}>
          <p className="text-[22px] tracking-tight" style={serif}>
            Niets gevonden in deze editie
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Verbreed je zoekopdracht of beschikbaarheid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group border-r-0 border-t py-5 pr-0 text-left transition-colors hover:bg-[#f4f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/30 md:px-5 md:[&:nth-child(odd)]:border-r"
              style={{ borderColor: C.rule }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-wide" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="text-[12px] font-semibold uppercase tracking-wide"
                  style={{ color: C.red, ...mono }}
                >
                  {o.match}% match
                </span>
              </div>
              <p className="mt-2 text-[22px] leading-tight tracking-tight" style={serif}>
                {o.titel}
              </p>
              <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                {o.opdrachtgever} · {o.plaats}
              </p>
              <p className="mt-3 text-[13px]" style={{ color: C.muted }}>
                {o.tags.join(" · ")}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[14px] font-medium" style={mono}>
                  {o.tarief}
                </span>
                <span className="text-[12px]" style={{ color: C.muted, ...mono }}>
                  {o.start}
                </span>
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
    <article className="space-y-7">
      <header>
        <Kicker n="01">Opdracht · {opdracht.id}</Kicker>
        <h2 className="mt-3 max-w-2xl text-[44px] leading-[0.95] tracking-tight" style={serif}>
          {opdracht.titel}
        </h2>
        <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} — {opdracht.plaats}
        </p>
      </header>

      <Rule />

      <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: C.muted, ...mono }}>
              {m.l}
            </p>
            <p className="mt-1 text-[26px] leading-none tracking-tight" style={serif}>
              <span style={mono}>{m.v}</span>
            </p>
          </div>
        ))}
      </div>

      <Rule />

      {/* Pull-quote moment */}
      <blockquote className="border-l-2 pl-5" style={{ borderColor: C.red }}>
        <Kicker n="02">Waarom deze match</Kicker>
        <p className="mt-3 max-w-xl text-[22px] leading-snug tracking-tight" style={serif}>
          “Je BIG-registratie is geverifieerd, de reistijd is{" "}
          <span style={{ color: C.red }}>12 minuten</span> en het tarief ligt boven je ondergrens.”
        </p>
      </blockquote>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "#15803d", ...mono }}
          >
            Pluspunten
          </p>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[14px]">
                <Check size={16} aria-hidden="true" style={{ color: "#15803d", marginTop: 2 }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.red, ...mono }}
          >
            Aandachtspunten
          </p>
          <ul className="mt-3 space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[14px]" style={{ color: C.muted }}>
                <X size={16} aria-hidden="true" style={{ color: C.red, marginTop: 2 }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        className="inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/40"
        style={{ background: C.ink, color: C.paper }}
      >
        Reageer op opdracht
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
}

function Verificatie() {
  return (
    <div className="space-y-7">
      <div>
        <Kicker n="01">Verificatie · Vertrouwensniveau</Kicker>
        <h2 className="mt-2 text-[40px] leading-none tracking-tight" style={serif}>
          {PROFIEL.trust}
        </h2>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          <span style={mono}>2</span> van <span style={mono}>4</span> credentials volledig
          geverifieerd. Eén vraagt nu actie.
        </p>
      </div>

      <div>
        {CREDENTIALS.map((c, i) => {
          const st = statusLabel(c.status);
          const Icon: LucideIcon =
            c.status === "VERIFIED" ? Check : c.status === "SUBMITTED" ? Clock : AlertTriangle;
          return (
            <div
              key={c.naam}
              className="grid grid-cols-12 items-center gap-3 border-t py-4 transition-colors hover:bg-[#f4f1ea]"
              style={{ borderColor: i === 0 ? C.ink : C.rule }}
            >
              <span
                className="col-span-1 text-[12px] tabular-nums"
                style={{ color: C.faint, ...mono }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="col-span-7">
                <p className="text-[17px] leading-tight tracking-tight" style={serif}>
                  {c.naam}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <div className="col-span-4 flex items-center justify-end gap-2">
                <Icon size={15} aria-hidden="true" style={{ color: st.color }} />
                <span
                  className="text-[12px] font-semibold uppercase tracking-wide"
                  style={{ color: st.color, ...mono }}
                >
                  {st.label}
                </span>
              </div>
            </div>
          );
        })}
        <Rule />
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Kicker n="01">Redactie raadt aan · Volgende acties</Kicker>
        <h2 className="mt-2 text-[40px] leading-none tracking-tight" style={serif}>
          Wat nu telt
        </h2>
      </div>

      <div>
        {ACTIES.map((a, i) => (
          <div
            key={a.titel}
            className="grid grid-cols-12 items-start gap-3 border-t py-5"
            style={{ borderColor: i === 0 ? C.ink : C.rule }}
          >
            <span
              className="col-span-12 text-[12px] uppercase tracking-wide sm:col-span-2"
              style={{ color: a.urgentie === "warning" ? C.red : C.muted, ...mono }}
            >
              {a.urgentie === "warning" ? "Urgent" : "Aanbevolen"}
            </span>
            <div className="col-span-12 sm:col-span-7">
              <p className="text-[18px] leading-tight tracking-tight" style={serif}>
                {a.titel}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                {a.detail}
              </p>
            </div>
            <div className="col-span-12 flex sm:col-span-3 sm:justify-end">
              <button
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold underline decoration-1 underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/30"
                style={{ color: a.urgentie === "warning" ? C.red : C.ink }}
              >
                {a.cta}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        <Rule />
      </div>
    </div>
  );
}

function Facturen() {
  const tone: Record<string, string> = {
    Betaald: "#15803d",
    Openstaand: C.red,
    Concept: C.muted,
  };
  const totaal = "€ 7.782";
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker n="01">Administratie · Facturen</Kicker>
          <h2 className="mt-2 text-[40px] leading-none tracking-tight" style={serif}>
            Het boekjaar
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide" style={{ color: C.muted, ...mono }}>
            Totaal verstuurd
          </p>
          <p className="text-[32px] leading-none tracking-tight" style={serif}>
            <span style={mono}>{totaal}</span>
          </p>
        </div>
      </div>

      <div>
        <div
          className="grid grid-cols-12 border-y py-2 text-[11px] uppercase tracking-wide"
          style={{ borderColor: C.ink, color: C.muted, ...mono }}
        >
          <span className="col-span-3">Nummer</span>
          <span className="col-span-4">Klant</span>
          <span className="col-span-2">Datum</span>
          <span className="col-span-2 text-right">Bedrag</span>
          <span className="col-span-1 text-right">Status</span>
        </div>
        {FACTUREN.map((f) => (
          <div
            key={f.nr}
            className="grid grid-cols-12 items-center border-b py-3.5 text-[13px] transition-colors hover:bg-[#f4f1ea]"
            style={{ borderColor: C.ruleSoft }}
          >
            <span className="col-span-3 font-medium" style={mono}>
              {f.nr}
            </span>
            <span className="col-span-4">{f.klant}</span>
            <span className="col-span-2" style={{ color: C.muted, ...mono }}>
              {f.datum}
            </span>
            <span className="col-span-2 text-right font-semibold tabular-nums" style={mono}>
              {f.bedrag}
            </span>
            <span
              className="col-span-1 text-right text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: tone[f.status], ...mono }}
            >
              {f.status === "Openstaand" ? "Open" : f.status === "Betaald" ? "Vold." : "Concept"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
