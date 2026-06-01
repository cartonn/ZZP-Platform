// Support-triage — pure, deterministisch. Classificeert een ticket op basis van trefwoorden
// (geen externe call), bepaalt een intentie + betrouwbaarheid, en beslist of de Support-assistent
// zelf mag antwoorden of dat er naar een mens geëscaleerd wordt. Server-side waarheid.
// Geen "AI" in teksten — dit voedt de "Support-assistent".

import { type SupportCategory } from "@/lib/enums";

export type SupportIntent =
  | "INVOICE_STATUS"
  | "CREDENTIAL_STATUS"
  | "PASSWORD_RESET"
  | "JOB_HELP"
  | "ACCOUNT_HELP"
  | "PRIVACY_REQUEST"
  | "GENERAL";

export interface TriageInput {
  subject: string;
  body: string;
}

export interface TriageResult {
  category: SupportCategory;
  intent: SupportIntent;
  /** 0–100, deterministisch: hoe sterk de trefwoorden matchen. */
  confidence: number;
}

interface Rule {
  category: SupportCategory;
  intent: SupportIntent;
  keywords: readonly string[];
}

// Volgorde = prioriteit; privacy bovenaan zodat gevoelige verzoeken altijd herkend worden.
const RULES: readonly Rule[] = [
  {
    category: "PRIVACY",
    intent: "PRIVACY_REQUEST",
    keywords: [
      "avg",
      "privacy",
      "verwijder",
      "vergeten",
      "gegevens wissen",
      "anonimiseer",
      "persoonsgegevens",
    ],
  },
  {
    category: "INVOICE",
    intent: "INVOICE_STATUS",
    keywords: [
      "factuur",
      "facturen",
      "betaling",
      "betaald",
      "openstaand",
      "aanmaning",
      "btw",
      "creditfactuur",
    ],
  },
  {
    category: "CREDENTIAL",
    intent: "CREDENTIAL_STATUS",
    keywords: [
      "certificaat",
      "diploma",
      "vog",
      "verificatie",
      "geverifieerd",
      "big",
      "duo",
      "verlopen",
    ],
  },
  {
    category: "ACCOUNT",
    intent: "PASSWORD_RESET",
    keywords: ["wachtwoord", "inloggen", "reset", "kan niet inloggen", "account geblokkeerd"],
  },
  {
    category: "JOB",
    intent: "JOB_HELP",
    keywords: ["opdracht", "reactie", "solliciteren", "sollicitatie", "matching", "kandidaat"],
  },
  {
    category: "ACCOUNT",
    intent: "ACCOUNT_HELP",
    keywords: ["profiel", "account", "abonnement", "gegevens wijzigen", "e-mailadres"],
  },
  {
    category: "TECHNICAL",
    intent: "GENERAL",
    keywords: ["foutmelding", "werkt niet", "bug", "laadt niet", "kapot", "vastgelopen"],
  },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Classificeert een ticket deterministisch: categorie, intentie, betrouwbaarheid (0–100). */
export function classifyTicket(input: TriageInput): TriageResult {
  const text = normalize(`${input.subject} ${input.body}`);
  let best: { rule: Rule; hits: number } | null = null;

  for (const rule of RULES) {
    const hits = rule.keywords.filter((k) => text.includes(normalize(k))).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { rule, hits };
  }

  if (!best) {
    return { category: "OTHER", intent: "GENERAL", confidence: 0 };
  }

  // Betrouwbaarheid: meer treffers → hoger, gecapt op 95 (nooit 100% zeker zonder mens).
  const confidence = Math.min(95, 45 + best.hits * 25);
  return { category: best.rule.category, intent: best.rule.intent, confidence };
}

export interface DecisionInput {
  category: SupportCategory;
  confidence: number;
  /** Hoeveel keer de assistent al automatisch probeerde te antwoorden. */
  autoAttempts: number;
}

export type TriageDecision = "AUTO_ANSWER" | "ESCALATE";

/**
 * Beslist of de Support-assistent zelf antwoordt of escaleert naar een mens.
 * Escaleer bij: gevoelige categorie (PRIVACY), lage betrouwbaarheid, of na 2 mislukte
 * auto-pogingen (zelfde "stop na 2 pogingen"-guardrail als de monitor).
 */
export function triageDecision(input: DecisionInput): TriageDecision {
  if (input.category === "PRIVACY") return "ESCALATE";
  if (input.autoAttempts >= 2) return "ESCALATE";
  if (input.confidence < 50) return "ESCALATE";
  return "AUTO_ANSWER";
}
