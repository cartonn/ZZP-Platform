"use client";

// Concept 102 — "Verhaal" · Scrollytelling / data-storytelling (LIGHT, editorial).
// Het dashboard leest als een scrollend narratief: cijfers staan in volzinnen, grote redactionele
// koppen leiden secties in, en secties klappen open (progressive reveal). Rustig, tekst-eerst,
// magazine-achtig. De informatie-architectuur is verhalend en verticaal verteld, niet tegel-gebaseerd.
// Fonts: Newsreader (serif display) + Inter (UI/labels).

import { useState } from "react";
import {
  ArrowRight,
  ArrowDown,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Quote,
  ChevronDown,
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
  bg: "#faf8f4",
  paper: "#ffffff",
  ink: "#1c1a17",
  inkSoft: "#403b34",
  muted: "#78716a",
  faint: "#a8a099",
  hair: "rgba(28,26,23,0.09)",
  hairStrong: "rgba(28,26,23,0.16)",
  accent: "#8a4b2f",
  accentSoft: "#f0e6de",
  ok: "#3d6b4f",
  warn: "#96652a",
  bad: "#9e3b32",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const ui = { fontFamily: "var(--font-lab-inter)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.accent };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, color: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.bad };
  }
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...ui, color: C.accent }}
    >
      {children}
    </p>
  );
}

function Reveal({
  chapter,
  title,
  children,
  defaultOpen = false,
}: {
  chapter: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t py-8" style={{ borderColor: C.hair }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-baseline gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
      >
        <span className="text-[13px] tabular-nums" style={{ ...serif, color: C.faint }}>
          {chapter}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block text-[24px] font-normal leading-tight tracking-tight sm:text-[28px]"
            style={serif}
          >
            {title}
          </span>
        </span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className="mt-1 shrink-0 transition-transform duration-300 motion-reduce:transition-none"
          style={{ color: C.muted, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function Concept102() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-9 md:px-8">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[22px] leading-none" style={serif}>
            Verhaal
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.faint }}>
            ZZP-editie
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[12px] sm:inline" style={{ color: C.muted }}>
            {PROFIEL.naam}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="mx-auto mt-5 flex max-w-3xl items-center gap-1 overflow-x-auto px-6 md:px-8"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.ink : C.muted, fontWeight: on ? 600 : 400 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="h-px w-full" style={{ background: C.hairStrong }} aria-hidden="true" />
      </div>

      <main className="mx-auto max-w-3xl px-6 pb-16 md:px-8">
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
  const boven85 = OPDRACHTEN.filter((o) => o.match >= 85).length;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <section className="pt-12">
        <Kicker>Vandaag · {PROFIEL.plaats}</Kicker>
        <h1
          className="mt-5 text-[40px] font-normal leading-[1.05] tracking-[-0.01em] sm:text-[54px]"
          style={serif}
        >
          Een rustige week, {voornaam}, met één ding dat vraagt om je aandacht.
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: C.inkSoft }}>
          Je matchte deze week met {OPDRACHTEN.length} opdrachten, waarvan {boven85} boven de 85%.
          Je omzet loopt voor op vorige maand, en je vertrouwensniveau blijft{" "}
          <span style={{ color: C.accent }}>{PROFIEL.trust.toLowerCase()}</span>. Toch is er eerst
          iets anders.
        </p>
        <div
          className="mt-8 flex items-center gap-2 text-[12px] uppercase tracking-[0.2em]"
          style={{ color: C.faint }}
        >
          <span>Lees verder</span>
          <ArrowDown size={14} aria-hidden="true" className="animate-none" />
        </div>
      </section>

      <div className="mt-10">
        <Reveal chapter="01" title="Het enige dat nu telt" defaultOpen>
          <blockquote
            className="border-l-2 pl-5 text-[19px] leading-relaxed"
            style={{ borderColor: C.accent, color: C.ink, ...serif }}
          >
            <Quote size={18} style={{ color: C.accent }} aria-hidden="true" className="mb-2" />
            {primair.detail}
          </blockquote>
          <p className="mt-4 text-[14px]" style={{ color: C.muted }}>
            {primair.titel}.
          </p>
          <button
            onClick={onOpen}
            className="group mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
            style={{ background: C.ink, color: C.bg }}
          >
            {primair.cta} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </Reveal>

        <Reveal chapter="02" title="Je week in cijfers, verteld" defaultOpen>
          <div className="space-y-5">
            {KPIS.map((k) => (
              <div key={k.label} className="flex items-baseline gap-4">
                <span
                  className="w-28 shrink-0 text-[34px] font-normal tabular-nums leading-none tracking-tight sm:w-32 sm:text-[40px]"
                  style={{ ...serif, color: C.accent }}
                >
                  {k.value}
                </span>
                <p className="text-[15px] leading-snug" style={{ color: C.inkSoft }}>
                  {narrate(k.label, k.trend, k.up)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal chapter="03" title="De opdracht die het beste past">
          <button
            onClick={onOpen}
            className="block w-full rounded-2xl p-6 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.paper, border: `1px solid ${C.hair}` }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] tabular-nums" style={{ color: C.faint }}>
                {top.id}
              </span>
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.accent }}>
                {top.match}% match
              </span>
            </div>
            <p className="mt-2 text-[22px] leading-snug" style={serif}>
              {top.titel}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
              {top.opdrachtgever} · {top.plaats} · {top.tarief}
            </p>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              Deze past omdat {top.redenen.plus[0]?.toLowerCase()} en{" "}
              {top.redenen.plus[1]?.toLowerCase()}.
            </p>
            <span
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: C.ink }}
            >
              Lees het hele verhaal <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>
        </Reveal>
      </div>
    </div>
  );
}

function narrate(label: string, trend: string, up: boolean): string {
  const dir = up ? "hoger dan vorige week" : "lager dan vorige week";
  switch (label) {
    case "Match-percentage":
      return `Je gemiddelde match staat op recordhoogte — ${trend} punten ${dir}.`;
    case "Open reacties":
      return `reacties staan open bij opdrachtgevers; ${trend} meer dan vorige week.`;
    case "Omzet (mnd)":
      return `deze maand gefactureerd, ${trend} ten opzichte van de vorige.`;
    case "Te factureren":
      return `wacht nog om verstuurd te worden — ${trend}.`;
    default:
      return `${label}: ${trend}, ${dir}.`;
  }
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
    <div className="pt-10">
      <Kicker>Marktplaats</Kicker>
      <h1 className="mt-4 text-[36px] font-normal leading-tight tracking-tight" style={serif}>
        Opdrachten die vandaag op je wachten
      </h1>
      <div className="mt-8 border-b pb-3" style={{ borderColor: C.hairStrong }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[20px] outline-none placeholder:text-[#a8a099]"
          style={{ ...serif, color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[26px]" style={serif}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-3 max-w-xs text-[14px]" style={{ color: C.muted }}>
            Er is geen opdracht die past bij “{q}”. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
            style={{ color: C.accent }}
          >
            Zoekopdracht wissen <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group flex w-full items-baseline gap-5 border-t py-7 text-left transition-colors last:border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderColor: C.hair }}
            >
              <span
                className="w-8 shrink-0 text-[15px] tabular-nums"
                style={{ ...serif, color: C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[20px] leading-snug transition-colors group-hover:text-[#8a4b2f]"
                  style={serif}
                >
                  {o.titel}
                </span>
                <span className="mt-1 block text-[13px]" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span
                  className="block text-[18px] font-semibold tabular-nums"
                  style={{ ...serif, color: C.accent }}
                >
                  {o.match}%
                </span>
                <span
                  className="text-[11px] uppercase tracking-[0.14em]"
                  style={{ color: C.faint }}
                >
                  match
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="pt-10">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>
      <div className="mt-6 flex items-baseline gap-3">
        <Kicker>{opdracht.id}</Kicker>
        <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.accent }}>
          {opdracht.match}% match
        </span>
      </div>
      <h1 className="mt-4 text-[38px] font-normal leading-[1.08] tracking-[-0.01em]" style={serif}>
        {opdracht.titel}
      </h1>
      <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
        {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      <p
        className="mt-8 max-w-xl text-[18px] leading-relaxed"
        style={{ ...serif, color: C.inkSoft }}
      >
        Voor {opdracht.tarief} werk je hier {opdracht.uren}, met start{" "}
        {opdracht.start.toLowerCase()}. Op basis van je geverifieerde profiel schatten we deze
        opdracht op {opdracht.match}% — hier is waarom.
      </p>

      <button
        className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
        style={{ background: C.ink, color: C.bg }}
      >
        Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
      </button>

      <div className="mt-10">
        <Reveal chapter="A" title="Waarom deze opdracht past" defaultOpen>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-3 text-[15px]">
                <Check size={16} style={{ color: C.ok, marginTop: 3 }} aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal chapter="B" title="Waar je op moet letten">
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-3 text-[15px]" style={{ color: C.muted }}>
                <AlertTriangle
                  size={16}
                  style={{ color: C.warn, marginTop: 3 }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="pt-10">
      <Kicker>Vertrouwen</Kicker>
      <h1 className="mt-4 text-[36px] font-normal leading-tight tracking-tight" style={serif}>
        Je dossier vertelt een geloofwaardig verhaal
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: C.inkSoft }}>
        Van je {CREDENTIALS.length} documenten zijn er {verified} volledig geverifieerd. Eén vraagt
        binnenkort je aandacht, en één ligt nog ter beoordeling. Zo bouw je{" "}
        <span style={{ color: C.accent }}>{PROFIEL.trust.toLowerCase()}</span> op.
      </p>

      <ul className="mt-8">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li
              key={c.naam}
              className="flex items-center gap-4 border-t py-5 last:border-b"
              style={{ borderColor: C.hair }}
            >
              <st.Icon
                size={18}
                style={{ color: st.color }}
                aria-hidden="true"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] leading-snug" style={serif}>
                  {c.naam}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="hidden shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold sm:inline"
                style={{ background: C.accentSoft, color: st.color }}
              >
                {st.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="pt-10">
      <Kicker>Volgende hoofdstukken</Kicker>
      <h1 className="mt-4 text-[36px] font-normal leading-tight tracking-tight" style={serif}>
        Wat je verhaal vandaag verder brengt
      </h1>
      <ol className="mt-8">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="border-t py-8 last:border-b"
              style={{ borderColor: C.hair }}
            >
              <div className="flex items-baseline gap-4">
                <span className="text-[15px] tabular-nums" style={{ ...serif, color: C.faint }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={14} style={{ color: C.warn }} aria-hidden="true" />
                    ) : (
                      <Clock size={14} style={{ color: C.accent }} aria-hidden="true" />
                    )}
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: warn ? C.warn : C.muted }}
                    >
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                  </div>
                  <h2 className="mt-2 text-[22px] leading-snug" style={serif}>
                    {a.titel}
                  </h2>
                  <p
                    className="mt-2 max-w-lg text-[14.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
                    style={{ color: warn ? C.accent : C.ink }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  return (
    <div className="pt-10">
      <Kicker>Omzet</Kicker>
      <h1 className="mt-4 text-[36px] font-normal leading-tight tracking-tight" style={serif}>
        Het financiële hoofdstuk van deze maand
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: C.inkSoft }}>
        Vier facturen vertellen samen je maand: <span style={{ color: C.accent }}>{total}</span> is
        binnen, één staat nog open en één is nog een concept.
      </p>

      <div className="mt-8">
        {FACTUREN.map((f) => {
          const betaald = f.status === "Betaald";
          const open = f.status === "Openstaand";
          const col = betaald ? C.ok : open ? C.warn : C.muted;
          return (
            <div
              key={f.nr}
              className="flex items-baseline gap-4 border-t py-5 last:border-b sm:gap-6"
              style={{ borderColor: C.hair }}
            >
              <span
                className="hidden w-28 shrink-0 text-[12px] tabular-nums sm:inline"
                style={{ color: C.faint }}
              >
                {f.nr}
              </span>
              <span className="min-w-0 flex-1 text-[17px] leading-snug" style={serif}>
                {f.klant}
              </span>
              <span
                className="hidden text-[12px] tabular-nums sm:inline"
                style={{ color: C.muted }}
              >
                {f.datum}
              </span>
              <span
                className="inline-flex w-24 items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: col }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: col }}
                  aria-hidden="true"
                />
                {f.status}
              </span>
              <span
                className="w-24 text-right text-[16px] font-semibold tabular-nums"
                style={serif}
              >
                {f.bedrag}
              </span>
            </div>
          );
        })}
        <div
          className="flex items-baseline justify-between border-t py-6"
          style={{ borderColor: C.hairStrong }}
        >
          <span className="text-[12px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
            Totaal betaald
          </span>
          <span
            className="text-[24px] font-normal tabular-nums"
            style={{ ...serif, color: C.accent }}
          >
            {total}
          </span>
        </div>
      </div>
    </div>
  );
}
