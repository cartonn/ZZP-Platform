"use client";

// Concept 234 — "Systeem" · Systeem-brutalisme / kale HTML.
// Direction: radical honesty. The anti-Liquid-Glass counter-movement (2026). The UI reads like an
// unstyled but hyper-functional HTML document: serif headings ("Times New Roman"), system-ui body,
// monospace data, blue underlined links, black hairline borders, native-looking rectangular controls.
// No rounded corners, no shadow, no gradient — zero decoration. Hierarchy comes purely from type size
// and horizontal rules. Ironically elegant in its bareness: speed and function above all.
// Deliberately uses browser-default fonts (no lab font variable) — that is the whole point.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BadgeCheck, Clock, TriangleAlert, XCircle, type LucideIcon } from "lucide-react";
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
  type Opdracht,
} from "./mock";

// Minimal, honest palette: pure white, pure black, classic link-blue, one muted grey.
const C = {
  bg: "#ffffff",
  ink: "#000000",
  link: "#0000ee",
  visited: "#551a8b",
  muted: "#767676",
  fill: "#efefef",
};

// Browser-default type stacks — the signature of this concept.
const serif: CSSProperties = { fontFamily: '"Times New Roman", Times, serif' };
const sys: CSSProperties = { fontFamily: "system-ui, -apple-system, sans-serif" };
const mono: CSSProperties = {
  fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
};

// Status is always label + icon (never colour alone). Kept monochrome by design; the icon carries
// the distinction. `kleur` stays black for maximum contrast (WCAG-AA on white).
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; kleur: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, kleur: C.ink };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, kleur: C.ink };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, kleur: C.ink };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, kleur: C.ink };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const { label, Icon } = statusMeta(status);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap" style={{ color: C.ink }}>
      <Icon size={13} aria-hidden="true" strokeWidth={2} />
      <span className="text-[12.5px]">[{label}]</span>
    </span>
  );
}

// A bare horizontal rule — the primary structural device of the document.
function Rule({ heavy = false }: { heavy?: boolean }) {
  return (
    <hr className="my-4 border-0" style={{ borderTop: `${heavy ? 2 : 1}px solid ${C.ink}` }} />
  );
}

// Native-looking rectangular button: 1px border, light grey fill, no radius.
function NativeButton({
  children,
  onClick,
  active = false,
  type = "button",
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  type?: "button" | "submit";
  ariaPressed?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-pressed={ariaPressed}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
      style={{
        ...sys,
        border: `1px solid ${C.ink}`,
        background: active ? C.ink : C.fill,
        color: active ? C.bg : C.ink,
        outlineColor: C.link,
      }}
    >
      {children}
    </button>
  );
}

// A section heading rendered as a serif document title with an anchor-style marker.
function Heading({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h2
      className="mb-1 flex items-baseline gap-2 text-[22px] font-bold"
      style={{ ...serif, color: C.ink }}
    >
      <span className="text-[13px] font-normal" style={{ ...mono, color: C.muted }}>
        §{n}
      </span>
      {children}
    </h2>
  );
}

// Bare ASCII-like sparkline built from monospace block characters — no SVG chrome, no colour.
function TextSpark({ points }: { points: number[] }) {
  const blocks = "▁▂▃▄▅▆▇█";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const s = points
    .map(
      (p) =>
        blocks[Math.min(blocks.length - 1, Math.round(((p - min) / span) * (blocks.length - 1)))],
    )
    .join("");
  return (
    <span className="text-[15px] leading-none" style={{ ...mono, color: C.ink }} aria-hidden="true">
      {s}
    </span>
  );
}

// A bordered table cell helper.
const cell: CSSProperties = {
  border: `1px solid ${C.ink}`,
  padding: "6px 10px",
  textAlign: "left",
};

type LoadState = "loaded" | "loading" | "empty" | "error";

export function Concept234() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div className="min-h-[680px] w-full" style={{ ...sys, background: C.bg, color: C.ink }}>
      {/* Document masthead — plain, like a served HTML page header. */}
      <header className="px-4 pt-5 md:px-8" style={{ background: C.bg }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold leading-none" style={serif}>
              ZZP Platform
            </h1>
            <p className="mt-1 text-[12.5px]" style={{ ...mono, color: C.muted }}>
              /werkruimte/{PROFIEL.naam.toLowerCase().replace(/\s+/g, "-")} · document zonder opsmuk
            </p>
          </div>
          <div className="text-right text-[12.5px]" style={mono}>
            <div>
              {PROFIEL.naam} &lt;{PROFIEL.rol}&gt;
            </div>
            <div style={{ color: C.muted }}>
              {PROFIEL.plaats} · vertrouwen: {PROFIEL.trust}
            </div>
          </div>
        </div>
        <Rule heavy />
      </header>

      {/* Navigation rendered as a list of underlined links, current item bold + not underlined. */}
      <nav className="px-4 md:px-8" aria-label="Hoofdnavigatie">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <li key={s.key} className="flex items-center">
                <button
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                  style={{
                    ...sys,
                    color: on ? C.ink : C.link,
                    fontWeight: on ? 700 : 400,
                    textDecoration: on ? "none" : "underline",
                    textUnderlineOffset: 2,
                    outlineColor: C.link,
                  }}
                >
                  {on ? `[${s.label}]` : s.label}
                </button>
              </li>
            );
          })}
        </ul>
        <Rule />
      </nav>

      <main className="px-4 pb-12 md:px-8">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail
            opdracht={OPDRACHTEN[0] as Opdracht}
            onBack={() => setScreen("marktplaats")}
          />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      <footer className="px-4 pb-10 md:px-8">
        <Rule />
        <p className="text-[12px]" style={{ ...mono, color: C.muted }}>
          Geen tracking · geen decoratie · server-side waarheid · {SCREENS.length} weergaven
        </p>
      </footer>
    </div>
  );
}

function KpiGrid() {
  return (
    <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((k, i) => (
        <div
          key={k.label}
          className="px-3 py-3"
          style={{
            borderTop: `1px solid ${C.ink}`,
            borderBottom: `1px solid ${C.ink}`,
            borderLeft: `1px solid ${C.ink}`,
            borderRight: i === KPIS.length - 1 ? `1px solid ${C.ink}` : "none",
          }}
        >
          <div className="text-[12px] uppercase tracking-wide" style={{ ...mono, color: C.muted }}>
            {k.label}
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-[24px] font-bold tabular-nums" style={serif}>
              {k.value}
            </span>
            <span className="text-[12.5px] tabular-nums" style={mono}>
              {k.up ? "▲" : "▼"} {k.trend}
            </span>
          </div>
          <div className="mt-1">
            <TextSpark points={k.spark} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div>
      <Heading n="1">Overzicht</Heading>
      <p className="mb-3 max-w-2xl text-[14px] leading-relaxed">
        Alles wat telt op één plat document. Blauwe onderstreepte tekst is een link. Status staat
        altijd als [label] met pictogram — nooit alleen kleur.
      </p>
      <KpiGrid />

      <Rule />
      <Heading n="2">Beste volgende actie</Heading>
      <ol className="ml-5 list-decimal space-y-2 text-[14px]">
        {ACTIES.map((a) => (
          <li key={a.titel}>
            <span className="font-bold" style={serif}>
              {a.titel}
            </span>{" "}
            — {a.detail}{" "}
            <button
              onClick={onOpen}
              className="focus-visible:outline focus-visible:outline-2"
              style={{
                color: C.link,
                textDecoration: "underline",
                textUnderlineOffset: 2,
                outlineColor: C.link,
              }}
            >
              {a.cta} →
            </button>
          </li>
        ))}
      </ol>

      <Rule />
      <div className="grid gap-6 lg:grid-cols-2">
        <BerichtenPaneel />
        <div>
          <Heading n="4">Documenten</Heading>
          <DocumentenTabel />
        </div>
      </div>
    </div>
  );
}

// The mandated loading / empty / error demonstration — deterministic, user-driven via native controls.
function BerichtenPaneel() {
  const [state, setState] = useState<LoadState>("loaded");
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Heading n="3">Berichten</Heading>
        <div className="flex items-center gap-1.5" role="group" aria-label="Weergavestaat">
          {(["loaded", "loading", "empty", "error"] as LoadState[]).map((st) => (
            <NativeButton
              key={st}
              onClick={() => setState(st)}
              active={state === st}
              ariaPressed={state === st}
            >
              {st === "loaded"
                ? "data"
                : st === "loading"
                  ? "laden"
                  : st === "empty"
                    ? "leeg"
                    : "fout"}
            </NativeButton>
          ))}
        </div>
      </div>

      {state === "loading" && (
        <ul className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center gap-3 p-2"
              style={{ border: `1px solid ${C.ink}` }}
            >
              <span
                className="h-8 w-8 shrink-0"
                style={{ background: C.fill }}
                aria-hidden="true"
              />
              <span className="flex-1 space-y-1.5">
                <span
                  className="block h-3 w-1/3"
                  style={{ background: C.fill }}
                  aria-hidden="true"
                />
                <span
                  className="block h-3 w-3/4"
                  style={{ background: C.fill }}
                  aria-hidden="true"
                />
              </span>
            </li>
          ))}
          <li className="text-[12.5px]" style={{ ...mono, color: C.muted }}>
            berichten laden…
          </li>
        </ul>
      )}

      {state === "empty" && (
        <div className="p-4 text-center" style={{ border: `1px dashed ${C.ink}` }}>
          <p className="text-[15px] font-bold" style={serif}>
            Geen berichten
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Reageer op een opdracht om een gesprek te starten.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="p-4" style={{ border: `2px solid ${C.ink}`, background: C.fill }}>
          <p className="flex items-center gap-1.5 text-[15px] font-bold" style={serif}>
            <XCircle size={16} aria-hidden="true" /> Laden mislukt
          </p>
          <p className="mt-1 text-[13px]">
            Kon berichten niet ophalen (fout 503). Probeer opnieuw.
          </p>
          <div className="mt-2">
            <NativeButton onClick={() => setState("loaded")}>Opnieuw proberen</NativeButton>
          </div>
        </div>
      )}

      {state === "loaded" && (
        <ul>
          {BERICHTEN.map((b, i) => (
            <li
              key={b.van}
              className="flex items-start gap-3 py-2.5"
              style={{
                borderTop: i === 0 ? `1px solid ${C.ink}` : "none",
                borderBottom: `1px solid ${C.ink}`,
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center text-[12px] font-bold"
                style={{ ...mono, border: `1px solid ${C.ink}`, background: C.fill }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[14px] font-bold" style={serif}>
                    {b.van}
                  </span>
                  <span className="shrink-0 text-[12px]" style={{ ...mono, color: C.muted }}>
                    {b.tijd}
                  </span>
                </span>
                <span
                  className="mt-0.5 block truncate text-[13px]"
                  style={{ color: b.ongelezen ? C.ink : C.muted }}
                >
                  {b.ongelezen ? "● " : ""}
                  {b.preview}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DocumentenTabel() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" style={sys}>
        <thead>
          <tr>
            <th style={{ ...cell, ...serif }}>Bestand</th>
            <th style={{ ...cell, ...serif }}>Grootte</th>
            <th style={{ ...cell, ...serif }}>Status</th>
            <th style={{ ...cell, ...serif }}>Bijgewerkt</th>
          </tr>
        </thead>
        <tbody>
          {DOCUMENTEN.map((d) => (
            <tr key={d.naam}>
              <td style={cell}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: C.link, textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  {d.naam}
                </a>{" "}
                <span style={{ ...mono, color: C.muted }}>· {d.type}</span>
              </td>
              <td style={{ ...cell, ...mono }}>{d.grootte}</td>
              <td style={cell}>
                <StatusTag status={d.status} />
              </td>
              <td style={{ ...cell, ...mono }}>{d.bijgewerkt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return OPDRACHTEN;
    return OPDRACHTEN.filter((o) =>
      [o.titel, o.opdrachtgever, o.plaats, ...o.tags].join(" ").toLowerCase().includes(t),
    );
  }, [q]);

  return (
    <div>
      <Heading n="1">Marktplaats</Heading>
      <form onSubmit={(e) => e.preventDefault()} className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="c234-zoek" className="text-[13px] font-bold" style={serif}>
          Zoek:
        </label>
        <input
          id="c234-zoek"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="titel, plaats of tag…"
          className="min-w-[200px] flex-1 px-2 py-1 text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          style={{
            ...mono,
            border: `1px solid ${C.ink}`,
            background: C.bg,
            color: C.ink,
            outlineColor: C.link,
          }}
        />
        {q && <NativeButton onClick={() => setQ("")}>wissen</NativeButton>}
        <span className="text-[12.5px]" style={{ ...mono, color: C.muted }}>
          {results.length} resultaten
        </span>
      </form>

      {results.length === 0 ? (
        <div className="p-6 text-center" style={{ border: `1px dashed ${C.ink}` }}>
          <p className="text-[16px] font-bold" style={serif}>
            Geen opdrachten gevonden voor “{q}”
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Pas je zoekterm aan of wis het filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]" style={sys}>
            <thead>
              <tr>
                <th style={{ ...cell, ...serif }}>Opdracht</th>
                <th style={{ ...cell, ...serif }}>Plaats</th>
                <th style={{ ...cell, ...serif }}>Tarief</th>
                <th style={{ ...cell, ...serif }}>Match</th>
                <th style={{ ...cell, ...serif }}>Actie</th>
              </tr>
            </thead>
            <tbody>
              {results.map((o) => (
                <tr key={o.id}>
                  <td style={cell}>
                    <button
                      onClick={onOpen}
                      className="text-left focus-visible:outline focus-visible:outline-2"
                      style={{
                        color: C.link,
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                        outlineColor: C.link,
                      }}
                    >
                      {o.titel}
                    </button>
                    <div className="text-[12px]" style={{ ...mono, color: C.muted }}>
                      {o.opdrachtgever} · {o.uren} · {o.start}
                    </div>
                  </td>
                  <td style={{ ...cell, ...mono }}>{o.plaats}</td>
                  <td style={{ ...cell, ...mono }}>{o.tarief}</td>
                  <td style={{ ...cell, ...mono }}>{o.match}%</td>
                  <td style={cell}>
                    <NativeButton
                      onClick={() => setSaved((s) => ({ ...s, [o.id]: !s[o.id] }))}
                      active={!!saved[o.id]}
                      ariaPressed={!!saved[o.id]}
                    >
                      {saved[o.id] ? "bewaard ✓" : "bewaar"}
                    </NativeButton>
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

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [reageer, setReageer] = useState(false);
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-2 text-[13px] focus-visible:outline focus-visible:outline-2"
        style={{
          color: C.link,
          textDecoration: "underline",
          textUnderlineOffset: 2,
          outlineColor: C.link,
        }}
      >
        ← Terug naar marktplaats
      </button>
      <Heading n="1">{opdracht.titel}</Heading>
      <p className="text-[14px]" style={{ ...mono, color: C.muted }}>
        {opdracht.id} · {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      <Rule />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[14px] sm:grid-cols-4">
        {[
          ["Tarief", opdracht.tarief],
          ["Inzet", opdracht.uren],
          ["Start", opdracht.start],
          ["Match", `${opdracht.match}%`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[12px] uppercase" style={{ ...mono, color: C.muted }}>
              {k}
            </dt>
            <dd className="font-bold" style={serif}>
              {v}
            </dd>
          </div>
        ))}
      </dl>

      <Rule />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-1 text-[16px] font-bold" style={serif}>
            Waarom dit past
          </h3>
          <ul className="ml-5 list-disc space-y-1 text-[14px]">
            {opdracht.redenen.plus.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-[16px] font-bold" style={serif}>
            Aandachtspunten
          </h3>
          <ul className="ml-5 list-disc space-y-1 text-[14px]">
            {opdracht.redenen.min.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>

      <Rule />
      <div className="flex flex-wrap items-center gap-2">
        <NativeButton onClick={() => setReageer((r) => !r)} active={reageer} ariaPressed={reageer}>
          {reageer ? "Reactie ingetrokken ✓ → opnieuw" : "Reageer op opdracht"}
        </NativeButton>
        {reageer && (
          <span className="text-[13px]" style={{ ...mono, color: C.ink }}>
            ● Reactie verstuurd. Verwachte reactietijd: 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const checklist = [
    "Upload een leesbaar PDF/JPG van het document",
    "Controleer dat naam en geboortedatum kloppen",
    "Vermeld het registratienummer waar van toepassing",
    "Dien in ter beoordeling door een verificateur",
  ];
  return (
    <div>
      <Heading n="1">Verificatie</Heading>
      <p className="mb-3 max-w-2xl text-[14px]">
        Certificaten en diploma’s worden server-side beoordeeld. De status komt uit de bron van
        waarheid, nooit uit de browser.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]" style={sys}>
          <thead>
            <tr>
              <th style={{ ...cell, ...serif }}>Certificaat</th>
              <th style={{ ...cell, ...serif }}>Status</th>
              <th style={{ ...cell, ...serif }}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((c) => (
              <tr key={c.naam}>
                <td style={{ ...cell, ...serif, fontWeight: 700 }}>{c.naam}</td>
                <td style={cell}>
                  <StatusTag status={c.status} />
                </td>
                <td style={{ ...cell, color: C.muted }}>{c.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Rule />
      <Heading n="2">Checklist indienen</Heading>
      <ul className="space-y-1.5 text-[14px]">
        {checklist.map((item, i) => {
          const id = `c234-chk-${i}`;
          const on = !!done[id];
          return (
            <li key={id}>
              <label htmlFor={id} className="flex cursor-pointer items-start gap-2">
                <input
                  id={id}
                  type="checkbox"
                  checked={on}
                  onChange={() => setDone((d) => ({ ...d, [id]: !d[id] }))}
                  className="mt-0.5 focus-visible:outline focus-visible:outline-2"
                  style={{ accentColor: C.ink, outlineColor: C.link }}
                />
                <span
                  style={{
                    textDecoration: on ? "line-through" : "none",
                    color: on ? C.muted : C.ink,
                  }}
                >
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[12.5px]" style={{ ...mono, color: C.muted }}>
        {Object.values(done).filter(Boolean).length}/{checklist.length} voltooid
      </p>
    </div>
  );
}

function Acties() {
  return (
    <div>
      <Heading n="1">Acties</Heading>
      <ul>
        {ACTIES.map((a, i) => (
          <li
            key={a.titel}
            className="flex flex-wrap items-start justify-between gap-3 py-3"
            style={{
              borderTop: i === 0 ? `1px solid ${C.ink}` : "none",
              borderBottom: `1px solid ${C.ink}`,
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[15px] font-bold" style={serif}>
                {a.urgentie === "warning" ? (
                  <TriangleAlert size={15} aria-hidden="true" />
                ) : (
                  <Clock size={15} aria-hidden="true" />
                )}
                {a.titel}
                <span
                  className="text-[11px] font-normal uppercase"
                  style={{ ...mono, color: C.muted }}
                >
                  [{a.urgentie === "warning" ? "urgent" : "info"}]
                </span>
              </p>
              <p className="mt-0.5 text-[13.5px]">{a.detail}</p>
            </div>
            <NativeButton>{a.cta}</NativeButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Facturen() {
  const totaal = "€ 7.782";
  return (
    <div>
      <Heading n="1">Facturen</Heading>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]" style={sys}>
          <thead>
            <tr>
              <th style={{ ...cell, ...serif }}>Nummer</th>
              <th style={{ ...cell, ...serif }}>Klant</th>
              <th style={{ ...cell, ...serif }}>Bedrag</th>
              <th style={{ ...cell, ...serif }}>Status</th>
              <th style={{ ...cell, ...serif }}>Datum</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr key={f.nr}>
                <td style={{ ...cell, ...mono }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{ color: C.link, textDecoration: "underline", textUnderlineOffset: 2 }}
                  >
                    {f.nr}
                  </a>
                </td>
                <td style={cell}>{f.klant}</td>
                <td style={{ ...cell, ...mono, fontWeight: 700 }}>{f.bedrag}</td>
                <td style={cell}>
                  <span className="inline-flex items-center gap-1">
                    {f.status === "Betaald" ? (
                      <BadgeCheck size={13} aria-hidden="true" />
                    ) : f.status === "Openstaand" ? (
                      <Clock size={13} aria-hidden="true" />
                    ) : (
                      <TriangleAlert size={13} aria-hidden="true" />
                    )}
                    [{f.status}]
                  </span>
                </td>
                <td style={{ ...cell, ...mono }}>{f.datum}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...cell, ...serif, fontWeight: 700 }} colSpan={2}>
                Totaal betaald
              </td>
              <td style={{ ...cell, ...mono, fontWeight: 700 }}>{totaal}</td>
              <td style={cell} colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
