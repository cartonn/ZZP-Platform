"use client";

// Concept 86 — "Revisie" · versiebeheer / diff-esthetiek (licht, GitHub-native).
// Verificatie & statuswijzigingen lezen als een reviewbare DIFF: groene toegevoegde regels (+),
// rode verwijderde regels (-), een commit-tijdlijn, review-goot met regelnummers, monospace-metadata
// en "checks passed"-badges. Het auditspoor is de kern. De zes schermen zijn "pull requests" op de dossiers.
// Palet: bg #f6f8fa, fg #1f2328, accent #2da44e (groen). Diff-rood #cf222e, goot-grijs. Fonts: Geist + Geist Mono.

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Check,
  GitCommit,
  GitPullRequest,
  GitMerge,
  GitBranch,
  Dot,
  FileDiff,
  MessageSquare,
  CircleDot,
  RotateCw,
  Search,
  Plus,
  Minus,
  Hash,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f6f8fa",
  canvas: "#ffffff",
  fg: "#1f2328",
  muted: "#59636e",
  faint: "#818b98",
  line: "#d1d9e0",
  lineSoft: "#eaeef2",
  accent: "#2da44e",
  accentEmph: "#1a7f37",
  accentSoft: "#dafbe1",
  add: "#2da44e",
  addBg: "#e6ffec",
  addGutter: "#ccffd8",
  del: "#cf222e",
  delBg: "#ffebe9",
  delGutter: "#ffd7d5",
  gutter: "#6e7781",
  gutterBg: "#f6f8fa",
  merged: "#8250df",
  mergedSoft: "#fbefff",
  attn: "#9a6700",
  attnSoft: "#fff8c5",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = {
  label: string;
  color: string;
  soft: string;
  Icon: typeof ShieldCheck;
  sign: "+" | "~" | "-";
};

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return {
        label: "merged",
        color: C.accentEmph,
        soft: C.accentSoft,
        Icon: ShieldCheck,
        sign: "+",
      };
    case "SUBMITTED":
      return { label: "open", color: C.attn, soft: C.attnSoft, Icon: Clock, sign: "~" };
    case "EXPIRING":
      return {
        label: "review vereist",
        color: C.attn,
        soft: C.attnSoft,
        Icon: AlertTriangle,
        sign: "~",
      };
    case "REJECTED":
      return { label: "closed", color: C.del, soft: C.delBg, Icon: XCircle, sign: "-" };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Sha({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ ...mono, color: C.muted, background: C.lineSoft }}
    >
      {children}
    </span>
  );
}

function StatePill({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...ui, color: "#fff", background: m.color }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function ChecksBadge({ passed = true, label }: { passed?: boolean; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...ui,
        color: passed ? C.accentEmph : C.del,
        background: passed ? C.accentSoft : C.delBg,
      }}
    >
      {passed ? (
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      ) : (
        <XCircle size={12} strokeWidth={2.4} aria-hidden="true" />
      )}
      {label ?? (passed ? "checks passed" : "checks failed")}
    </span>
  );
}

// Sparkline in commit-stijl.
function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 84;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="1.8" fill={color} />}
    </svg>
  );
}

/* ---------- Diff-hunk (het handtekening-element) ---------- */

type DiffRow =
  | { kind: "meta"; text: string }
  | { kind: "ctx"; old: number; neu: number; text: string }
  | { kind: "add"; neu: number; text: string }
  | { kind: "del"; old: number; text: string };

function DiffHunk({ header, rows }: { header: string; rows: DiffRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
      <div
        className="flex items-center gap-2 px-3 py-2 text-[11.5px] font-semibold"
        style={{
          ...mono,
          color: C.merged,
          background: C.gutterBg,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <FileDiff size={13} strokeWidth={2.2} aria-hidden="true" /> {header}
      </div>
      <div className="overflow-x-auto" style={{ background: C.canvas }}>
        <table className="w-full border-collapse" style={{ ...mono }}>
          <tbody>
            {rows.map((r, i) => {
              if (r.kind === "meta") {
                return (
                  <tr key={i}>
                    <td
                      className="w-10 select-none text-right"
                      style={{ background: C.gutterBg }}
                      aria-hidden="true"
                    />
                    <td
                      className="w-10 select-none text-right"
                      style={{ background: C.gutterBg }}
                      aria-hidden="true"
                    />
                    <td
                      className="px-3 py-0.5 text-[12px]"
                      style={{
                        color: C.merged,
                        background: "#f0f3ff",
                        borderTop: `1px solid ${C.lineSoft}`,
                        borderBottom: `1px solid ${C.lineSoft}`,
                      }}
                    >
                      {r.text}
                    </td>
                  </tr>
                );
              }
              const isAdd = r.kind === "add";
              const isDel = r.kind === "del";
              const rowBg = isAdd ? C.addBg : isDel ? C.delBg : C.canvas;
              const gutBg = isAdd ? C.addGutter : isDel ? C.delGutter : C.gutterBg;
              const sign = isAdd ? "+" : isDel ? "-" : " ";
              const signColor = isAdd ? C.accentEmph : isDel ? C.del : C.faint;
              const oldNo = r.kind === "add" ? "" : String(r.old);
              const neuNo = r.kind === "del" ? "" : String(r.neu);
              const srLabel = isAdd ? "Toegevoegd: " : isDel ? "Verwijderd: " : "";
              return (
                <tr key={i}>
                  <td
                    className="w-10 select-none px-2 py-0.5 text-right text-[11px] tabular-nums"
                    style={{ color: C.gutter, background: gutBg }}
                    aria-hidden="true"
                  >
                    {oldNo}
                  </td>
                  <td
                    className="w-10 select-none px-2 py-0.5 text-right text-[11px] tabular-nums"
                    style={{ color: C.gutter, background: gutBg }}
                    aria-hidden="true"
                  >
                    {neuNo}
                  </td>
                  <td
                    className="py-0.5 pr-3 text-[12.5px]"
                    style={{ background: rowBg, color: C.fg }}
                  >
                    <span
                      className="inline-block w-4 select-none text-center font-semibold"
                      style={{ color: signColor }}
                      aria-hidden="true"
                    >
                      {sign}
                    </span>
                    {srLabel && <span className="sr-only">{srLabel}</span>}
                    {r.text}
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

/* ---------- Hoofdcomponent ---------- */

export function Concept86() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      className="relative min-h-[680px] w-full antialiased"
      style={{ ...ui, color: C.fg, background: C.bg }}
    >
      <div className="flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — repo-navigatie */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: `1px solid ${C.line}`, background: C.canvas }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-2.5 px-5 py-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: C.accentSoft }}
                aria-hidden="true"
              >
                <GitBranch size={17} strokeWidth={2.2} color={C.accentEmph} />
              </span>
              <div className="leading-tight">
                <div
                  className="flex items-center gap-1 text-[13.5px] font-semibold"
                  style={{ ...mono, color: C.fg }}
                >
                  sanne <span style={{ color: C.faint }}>/</span> dossier
                </div>
                <div className="text-[10.5px] font-medium" style={{ ...mono, color: C.faint }}>
                  main · geverifieerd
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e] md:w-full"
                    style={{
                      color: on ? C.fg : C.muted,
                      background: on ? C.lineSoft : "transparent",
                      boxShadow: on ? `inset 2px 0 0 ${C.accent}` : "none",
                    }}
                  >
                    <CircleDot
                      size={14}
                      strokeWidth={2.2}
                      color={on ? C.accent : C.faint}
                      aria-hidden="true"
                    />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="flex items-center gap-3 px-4 py-4"
              style={{ borderTop: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{ ...mono, background: C.accent }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold" style={{ color: C.fg }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.accentEmph }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onGo={setScreen} />}
            {screen === "opdracht" && <OpdrachtPR onGo={setScreen} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Section-kop in commit-stijl ---------- */

function Head({
  icon,
  kicker,
  titel,
  sub,
}: {
  icon: React.ReactNode;
  kicker: string;
  titel: string;
  sub?: string;
}) {
  return (
    <header>
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.faint }}
      >
        {icon} {kicker}
      </span>
      <h1
        className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px]"
        style={{ ...ui, color: C.fg }}
      >
        {titel}
      </h1>
      {sub && (
        <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </header>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: C.canvas, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

/* ---------- Dashboard — overzicht als merged PR-feed ---------- */

function Dashboard({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const warn = ACTIES[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Head
          icon={<GitBranch size={12} strokeWidth={2.4} aria-hidden="true" />}
          kicker={`main · ${OPDRACHTEN.length} open matches`}
          titel={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
          sub={`${PROFIEL.rol} · ${PROFIEL.plaats}`}
        />
        <ChecksBadge label="alle checks groen" />
      </div>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
          style={{ background: C.attnSoft, border: `1px solid ${C.attn}44` }}
          role="alert"
        >
          <AlertTriangle
            size={18}
            strokeWidth={2.2}
            color={C.attn}
            className="shrink-0"
            aria-hidden="true"
          />
          <p className="flex-1 text-[13px]" style={{ color: C.fg }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e]"
            style={{ background: C.accent }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] font-medium" style={{ color: C.muted }}>
              {k.label}
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p
                className="text-[22px] font-semibold tabular-nums"
                style={{ ...mono, color: C.fg }}
              >
                {k.value}
              </p>
              <span
                className="inline-flex items-center rounded px-1.5 text-[11px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.accentEmph : C.attn,
                  background: k.up ? C.accentSoft : C.attnSoft,
                }}
              >
                {k.up ? "+" : ""}
                {k.trend}
              </span>
            </div>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.accent : C.attn} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Open matches als PR-lijst */}
        <Card>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[13.5px] font-semibold"
              style={{ color: C.fg }}
            >
              <GitPullRequest size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />{" "}
              Open matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 text-[12px] font-semibold transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e]"
              style={{ color: C.accentEmph }}
            >
              Alle <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  onClick={() => onGo("opdracht")}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f6f8fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2da44e]"
                >
                  <GitPullRequest
                    size={16}
                    strokeWidth={2.2}
                    color={C.accent}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13.5px] font-semibold"
                      style={{ color: C.fg }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[11.5px]"
                      style={{ ...mono, color: C.muted }}
                    >
                      <Sha>#{o.id.replace("OPD-", "")}</Sha> {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.accentEmph, background: C.accentSoft }}
                  >
                    {o.match}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Commit-tijdlijn */}
        <Card className="p-4">
          <h3
            className="flex items-center gap-2 text-[13.5px] font-semibold"
            style={{ color: C.fg }}
          >
            <GitCommit size={15} strokeWidth={2.2} color={C.merged} aria-hidden="true" /> Recente
            commits
          </h3>
          <ol className="mt-4 space-y-0">
            {[
              {
                sha: "a1c9f2e",
                msg: "verify: BIG-registratie merged",
                state: "merged" as const,
                tijd: "2u",
              },
              {
                sha: "7d4b0aa",
                msg: "feat: reactie OPD-2041 verstuurd",
                state: "open" as const,
                tijd: "5u",
              },
              {
                sha: "3e88c10",
                msg: "chore: VOG verloopt — review nodig",
                state: "attn" as const,
                tijd: "1d",
              },
              {
                sha: "0b2f7d9",
                msg: "verify: diploma hbo-v merged",
                state: "merged" as const,
                tijd: "3d",
              },
            ].map((c, i, arr) => {
              const col = c.state === "merged" ? C.merged : c.state === "attn" ? C.attn : C.accent;
              const Icon =
                c.state === "merged" ? GitMerge : c.state === "attn" ? AlertTriangle : GitCommit;
              return (
                <li key={c.sha} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < arr.length - 1 && (
                    <span
                      className="absolute left-[9px] top-6 h-full w-px"
                      style={{ background: C.line }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className="relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.canvas, border: `1.5px solid ${col}` }}
                    aria-hidden="true"
                  >
                    <Icon size={11} strokeWidth={2.4} color={col} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-snug" style={{ color: C.fg }}>
                      {c.msg}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 text-[11px]"
                      style={{ ...mono, color: C.faint }}
                    >
                      <Sha>{c.sha}</Sha> <Dot size={12} aria-hidden="true" /> {c.tijd} geleden
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Marktplaats — matches als open pull requests ---------- */

function Marktplaats({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Head
        icon={<GitPullRequest size={12} strokeWidth={2.4} aria-hidden="true" />}
        kicker="Pull requests"
        titel="Open matches"
        sub="Elke opdracht is een voorstel dat wacht op jouw review."
      />

      <div
        className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
        style={{ background: C.canvas, border: `1px solid ${C.line}` }}
      >
        <Search size={15} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="is:open label:zorg …"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#818b98]"
          style={{ ...mono, color: C.fg }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <GitPullRequest
            size={30}
            strokeWidth={1.8}
            color={C.faint}
            className="mx-auto"
            aria-hidden="true"
          />
          <p className="mt-4 text-[16px] font-semibold" style={{ color: C.fg }}>
            Geen open pull requests
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen match voldoet aan &quot;{q}&quot;. Pas je filter aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-md px-4 py-2 text-[12.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e]"
            style={{ background: C.accent }}
          >
            Filter wissen
          </button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={() => onGo("opdracht")}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f6f8fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2da44e]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <GitPullRequest
                size={17}
                strokeWidth={2.2}
                color={C.accent}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ color: C.fg }}>
                    {o.titel}
                  </span>
                  <span className="text-[12px]" style={{ ...mono, color: C.faint }}>
                    #{o.id.replace("OPD-", "")}
                  </span>
                </span>
                <span
                  className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]"
                  style={{ ...mono, color: C.muted }}
                >
                  <span>
                    {o.opdrachtgever} · {o.plaats}
                  </span>
                  <span style={{ color: C.faint }}>·</span>
                  <span>{o.tarief}</span>
                  <span style={{ color: C.faint }}>·</span>
                  <span>{o.uren}</span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...ui,
                        color: C.merged,
                        background: C.mergedSoft,
                        border: `1px solid ${C.merged}33`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ ...ui, color: C.accentEmph, background: C.addBg }}
                  >
                    <Plus size={10} strokeWidth={3} aria-hidden="true" /> {o.redenen.plus.length}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ ...ui, color: C.del, background: C.delBg }}
                  >
                    <Minus size={10} strokeWidth={3} aria-hidden="true" /> {o.redenen.min.length}
                  </span>
                </span>
              </span>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums"
                style={{ ...mono, color: C.accentEmph, background: C.accentSoft }}
              >
                {o.match}%
              </span>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail — de PR-review met echte diff ---------- */

function OpdrachtPR({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const o = OPDRACHTEN[0] as Opdracht;
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  const rows: DiffRow[] = [
    { kind: "meta", text: `@@ match ${o.match}% · ${o.tarief} @@` },
    { kind: "ctx", old: 1, neu: 1, text: `opdracht: "${o.titel}"` },
    { kind: "ctx", old: 2, neu: 2, text: `opdrachtgever: ${o.opdrachtgever} (${o.plaats})` },
    ...o.redenen.plus.map((r, i): DiffRow => ({ kind: "add", neu: 3 + i, text: r })),
    ...o.redenen.min.map((r, i): DiffRow => ({ kind: "del", old: 3 + i, text: r })),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button
        onClick={() => onGo("marktplaats")}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e]"
        style={{ color: C.muted }}
      >
        <GitPullRequest size={14} strokeWidth={2.2} aria-hidden="true" /> Pull requests
      </button>

      <div>
        <h1
          className="text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px]"
          style={{ ...ui, color: C.fg }}
        >
          {o.titel}{" "}
          <span style={{ ...mono, color: C.faint, fontWeight: 400 }}>
            #{o.id.replace("OPD-", "")}
          </span>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold text-white"
            style={{ background: C.accent }}
          >
            <GitPullRequest size={13} strokeWidth={2.4} aria-hidden="true" /> Open
          </span>
          <span className="text-[12.5px]" style={{ ...mono, color: C.muted }}>
            <span className="font-semibold" style={{ color: C.fg }}>
              wil {o.opdrachtgever}
            </span>{" "}
            samenvoegen in <span style={{ color: C.accentEmph }}>jouw agenda</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ChecksBadge label={`${o.redenen.plus.length} additions`} />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ color: C.del, background: C.delBg }}
        >
          <Minus size={12} strokeWidth={3} aria-hidden="true" /> {o.redenen.min.length} deletions
        </span>
        {o.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ color: C.merged, background: C.mergedSoft, border: `1px solid ${C.merged}33` }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: o.tarief },
          { l: "Omvang", v: o.uren },
          { l: "Start", v: o.start },
          { l: "Match", v: `${o.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-3.5">
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1 text-[16px] font-semibold tabular-nums"
              style={{ ...mono, color: C.fg }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      {/* De diff: waarom deze match */}
      <div>
        <h2
          className="mb-2.5 flex items-center gap-2 text-[14px] font-semibold"
          style={{ color: C.fg }}
        >
          <FileDiff size={15} strokeWidth={2.2} color={C.merged} aria-hidden="true" /> Waarom deze
          match
        </h2>
        <DiffHunk header="match-onderbouwing.diff" rows={rows} />
        <p
          className="mt-2 flex items-center gap-1.5 text-[11.5px]"
          style={{ ...mono, color: C.faint }}
        >
          <Plus size={11} strokeWidth={3} color={C.accentEmph} aria-hidden="true" /> pluspunten
          <Minus size={11} strokeWidth={3} color={C.del} className="ml-2" aria-hidden="true" />{" "}
          aandachtspunten
        </p>
      </div>

      {/* Merge-vak */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: state === "sent" ? C.mergedSoft : C.accentSoft }}
            aria-hidden="true"
          >
            {state === "sent" ? (
              <GitMerge size={18} strokeWidth={2.2} color={C.merged} />
            ) : (
              <Check size={18} strokeWidth={2.6} color={C.accentEmph} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
              {state === "sent" ? "Reactie samengevoegd" : "Alle checks zijn geslaagd"}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
              {state === "sent"
                ? "Je reactie staat klaar bij de opdrachtgever."
                : "Reageer om deze opdracht in je agenda te mergen."}
            </p>
          </div>
        </div>
        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-[13.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e] disabled:opacity-90"
          style={{ background: state === "sent" ? C.merged : C.accent }}
        >
          {state === "idle" && (
            <>
              <GitMerge size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer & merge
            </>
          )}
          {state === "sending" && "Samenvoegen…"}
          {state === "sent" && (
            <>
              <Check size={15} strokeWidth={2.8} aria-hidden="true" /> Merged
            </>
          )}
        </button>
      </Card>
    </div>
  );
}

/* ---------- Verificatie — credentials als merge-log met diff ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const rows: DiffRow[] = [
    { kind: "meta", text: "@@ credential-status @@" },
    { kind: "del", old: 1, text: "VOG (zorg): geldig — geen actie" },
    { kind: "add", neu: 1, text: "VOG (zorg): verloopt over 23 dagen → vernieuw" },
    { kind: "ctx", old: 2, neu: 2, text: "BIG-registratie: geverifieerd t/m 2028" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Head
        icon={<GitMerge size={12} strokeWidth={2.4} aria-hidden="true" />}
        kicker="Merge-log"
        titel="Verificatie"
        sub="Elke statuswijziging is een reviewbare commit. Bewijsstukken blijven privé."
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {[
          {
            l: "Merged",
            v: `${verified}/${CREDENTIALS.length}`,
            color: C.accentEmph,
            soft: C.accentSoft,
            Icon: GitMerge,
          },
          { l: "Review vereist", v: "1", color: C.attn, soft: C.attnSoft, Icon: AlertTriangle },
          { l: "Open", v: "1", color: C.attn, soft: C.attnSoft, Icon: Clock },
        ].map((s) => {
          const Icon = s.Icon;
          return (
            <Card key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1 text-[22px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.fg }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: s.soft }}
                aria-hidden="true"
              >
                <Icon size={19} strokeWidth={2} color={s.color} />
              </span>
            </Card>
          );
        })}
      </div>

      <DiffHunk header="verificatie.log" rows={rows} />

      <Card className="overflow-hidden">
        <div
          className="px-4 py-3 text-[12.5px] font-semibold"
          style={{
            ...mono,
            color: C.muted,
            borderBottom: `1px solid ${C.lineSoft}`,
            background: C.gutterBg,
          }}
        >
          {CREDENTIALS.length} bewijsstukken · {verified} merged
        </div>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[13px] font-bold"
                style={{ ...mono, color: m.color, background: m.soft }}
                aria-hidden="true"
              >
                {m.sign}
              </span>
              <Icon
                size={16}
                strokeWidth={2.1}
                color={m.color}
                className="hidden shrink-0 sm:block"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold" style={{ color: C.fg }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatePill status={c.status} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------- Acties — issue-lijst met loading/error/empty ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 650);
    return () => window.clearTimeout(t);
  }, []);

  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Head
        icon={<CircleDot size={12} strokeWidth={2.4} aria-hidden="true" />}
        kicker="Issues · gesorteerd"
        titel="Volgende acties"
        sub="Open issues op je dossier, hoogste prioriteit bovenaan."
      />

      {/* Berichten-check: loading + error */}
      {feed === "loading" && (
        <div
          className="flex items-center gap-3 rounded-lg px-4 py-3.5"
          style={{ background: C.canvas, border: `1px solid ${C.line}` }}
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Notificaties worden geladen…</span>
          <RotateCw
            size={15}
            strokeWidth={2.2}
            color={C.faint}
            className="animate-spin"
            aria-hidden="true"
          />
          <span
            className="h-3 flex-1 animate-pulse rounded-full"
            style={{ background: C.lineSoft }}
            aria-hidden="true"
          />
        </div>
      )}
      {feed === "error" && (
        <div
          className="flex flex-col gap-3 rounded-lg px-4 py-3.5 sm:flex-row sm:items-center"
          style={{ background: C.delBg, border: `1px solid ${C.del}33` }}
          role="alert"
        >
          <XCircle size={17} strokeWidth={2.2} color={C.del} aria-hidden="true" />
          <p className="flex-1 text-[13px]" style={{ color: C.fg }}>
            Kon notificaties niet ophalen.
          </p>
          <button
            onClick={() => setFeed("ok")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e]"
            style={{ background: C.accent }}
          >
            <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" /> Opnieuw
          </button>
        </div>
      )}
      {feed === "ok" && (
        <p
          className="flex items-center gap-2 rounded-lg px-4 py-3.5 text-[13px]"
          style={{ background: C.accentSoft, color: C.accentEmph }}
        >
          <MessageSquare size={15} strokeWidth={2.2} aria-hidden="true" /> {ongelezen} ongelezen
          berichten opgehaald.
        </p>
      )}

      <Card className="overflow-hidden">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const col = warn ? C.attn : C.accent;
          return (
            <div
              key={a.titel}
              className="flex items-start gap-3 px-4 py-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              {warn ? (
                <AlertTriangle
                  size={17}
                  strokeWidth={2.2}
                  color={col}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <CircleDot
                  size={17}
                  strokeWidth={2.2}
                  color={col}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
                    {a.titel}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{
                      color: warn ? C.attn : C.accentEmph,
                      background: warn ? C.attnSoft : C.accentSoft,
                    }}
                  >
                    {warn ? "priority: high" : "priority: normal"}
                  </span>
                  <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
                    #{String(i + 41)}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
                <button
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e]"
                  style={
                    warn
                      ? { background: C.accent, color: "#fff" }
                      : { background: C.lineSoft, color: C.fg }
                  }
                >
                  {a.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </Card>

      <div
        className="flex items-center gap-2.5 rounded-lg px-4 py-3.5 text-[12.5px]"
        style={{ background: C.accentSoft, color: C.accentEmph }}
      >
        <Check size={15} strokeWidth={2.4} aria-hidden="true" /> Verder zijn alle issues gesloten —
        je dossier is up-to-date.
      </div>
    </div>
  );
}

/* ---------- Facturen — releases met status-checks ---------- */

function Facturen() {
  const statusMeta: Record<string, { color: string; soft: string; label: string }> = {
    Betaald: { color: C.accentEmph, soft: C.accentSoft, label: "released" },
    Openstaand: { color: C.attn, soft: C.attnSoft, label: "pending" },
    Concept: { color: C.faint, soft: C.lineSoft, label: "draft" },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const docsKlaar = DOCUMENTEN.filter((d) => d.status === "VERIFIED").length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Head
          icon={<Hash size={12} strokeWidth={2.4} aria-hidden="true" />}
          kicker="Releases"
          titel="Facturen"
          sub={`${docsKlaar}/${DOCUMENTEN.length} documenten geverifieerd · ${NAV.length} onderdelen synchroon`}
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2da44e]"
          style={{ background: C.accent }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe release
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Card className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-1.5 text-[22px] font-semibold tabular-nums"
            style={{ ...mono, color: C.accentEmph }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Card>
        <Card className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-1.5 text-[22px] font-semibold tabular-nums"
            style={{ ...mono, color: C.attn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div
          className="px-4 py-3 text-[12.5px] font-semibold"
          style={{
            ...mono,
            color: C.muted,
            borderBottom: `1px solid ${C.lineSoft}`,
            background: C.gutterBg,
          }}
        >
          {FACTUREN.length} releases
        </div>
        {FACTUREN.map((f, i) => {
          const meta = statusMeta[f.status] ?? { color: C.faint, soft: C.lineSoft, label: "draft" };
          const paid = f.status === "Betaald";
          return (
            <div
              key={f.nr}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: meta.soft }}
                aria-hidden="true"
              >
                {paid ? (
                  <Check size={14} strokeWidth={2.8} color={meta.color} />
                ) : f.status === "Openstaand" ? (
                  <Clock size={13} strokeWidth={2.4} color={meta.color} />
                ) : (
                  <GitCommit size={13} strokeWidth={2.4} color={meta.color} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="flex items-center gap-2 text-[13px] font-semibold"
                  style={{ ...mono, color: C.fg }}
                >
                  {f.nr}
                  <span
                    className="hidden text-[12px] font-normal sm:inline"
                    style={{ ...ui, color: C.muted }}
                  >
                    {f.klant}
                  </span>
                </p>
                <p className="text-[11px]" style={{ ...mono, color: C.faint }}>
                  {f.datum}
                </p>
              </div>
              <span
                className="text-[13px] font-semibold tabular-nums"
                style={{ ...mono, color: C.fg }}
              >
                {f.bedrag}
              </span>
              <span
                className="inline-flex w-[74px] shrink-0 items-center justify-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-semibold"
                style={{ ...mono, color: meta.color, background: meta.soft }}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
