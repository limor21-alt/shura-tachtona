// Stage F — Claude copy writer with deterministic fallback.
//
// Calls Anthropic API with the system prompt from prompt.ts. The
// response is parsed as ClaudeCopy and validated against
// forbidden_words.ts. On any failure (network, parse, validation), we
// fall back to deterministic Hebrew strings computed from the model.
// This means the product still works when ANTHROPIC_API_KEY is unset
// or unreachable.

import type { ClaudeCopy, ReportModel } from "./schema.ts";
import { validateClaudeCopy } from "./validators/forbidden_words.ts";
import { CLAUDE_MODEL, SYSTEM_PROMPT, buildUserMessage } from "./prompt.ts";
import { PLAYBOOKS, type Playbook, type PlaybookId } from "./playbooks.ts";

/** Resolve the primary playbook for a model, if Phase 2 selection ran. */
function getPlaybookFor(model: ReportModel): Playbook | null {
  const id = model.selected_playbooks?.primary as PlaybookId | undefined;
  if (!id) return null;
  return PLAYBOOKS[id] ?? null;
}

/** Collect every Hebrew string Claude wrote, lowercased, for substring checks. */
function flattenCopy(copy: ClaudeCopy): string {
  return [
    copy.headline_copy,
    copy.meaning_copy,
    ...copy.work_done_bullets,
    ...copy.priority_check_blurbs.map((b) => b.copy_blurb),
    ...copy.improvement_blurbs.map((b) => b.copy_blurb),
  ].join(" ").toLowerCase();
}

/** Phase 2b: validate Claude's output against the playbook's forbiddenClaims
 *  and doNotSay list. Returns a list of violation messages; empty = clean.
 *  This runs in addition to the GLOBAL_LANGUAGE_RULES enforced by
 *  validators/forbidden_words.ts. */
export function validateAgainstPlaybook(
  copy: ClaudeCopy,
  pb: Playbook | null,
): string[] {
  if (!pb) return [];
  const violations: string[] = [];
  const text = flattenCopy(copy);
  for (const phrase of pb.forbiddenClaims) {
    if (!phrase) continue;
    if (text.includes(phrase.toLowerCase())) {
      violations.push(`playbook[${pb.id}] forbids: "${phrase}"`);
    }
  }
  for (const phrase of pb.claudeCopyHints.doNotSay) {
    if (!phrase) continue;
    if (text.includes(phrase.toLowerCase())) {
      violations.push(`playbook[${pb.id}] doNotSay: "${phrase}"`);
    }
  }
  return violations;
}

/** Build a short Hebrew context block describing the selected playbook,
 *  to prepend before the JSON ReportModel in the Claude prompt. */
function buildPlaybookGuidance(pb: Playbook): string {
  const doSay = pb.claudeCopyHints.doSay.map((s) => `  • ${s}`).join("\n");
  const doNot = pb.claudeCopyHints.doNotSay.map((s) => `  • ${s}`).join("\n");
  const forbid = pb.forbiddenClaims.map((s) => `  • ${s}`).join("\n");
  return `## הקשר תרחיש (playbook: ${pb.id})
תווית: ${pb.label}
טון רצוי: ${pb.claudeCopyHints.tone}

הצעות לניסוח כותרת ומשמעות (אפשר לאמץ או להתאים, אסור לסתור):
  • כותרת: "${pb.ui.bottomLineHeadline}"
  • משמעות: "${pb.ui.meaningBody}"

מותר/כדאי לומר:
${doSay}

אסור לומר (משפטים אלה יביאו לדחיית הפלט):
${doNot}
${forbid}`;
}

// deno-lint-ignore no-explicit-any
declare const Deno: any;

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const REQUEST_TIMEOUT_MS = 12_000;

function formatILS(n: number): string {
  return "₪" + Math.round(Math.abs(n)).toLocaleString("he-IL");
}

// ====================================================================
// Deterministic fallback — always safe Hebrew, no judgmental language.
// ====================================================================

function fallbackHeadline(model: ReportModel): string {
  // Phase 2b: prefer the playbook's bottomLineHeadline when available.
  // It's hand-written per scenario and already calm/non-judgmental.
  const pb = getPlaybookFor(model);
  if (pb?.ui?.bottomLineHeadline) return pb.ui.bottomLineHeadline;

  const { summary_status, summary } = model;
  if (summary_status === "insufficient_data") {
    return "בקבצים שהעלאתם אין מספיק נתונים כדי לחשב שורה תחתונה מלאה.";
  }
  if (summary_status === "variable_dependent") {
    return "התמונה החודשית תלויה בהכנסה משתנה — בחודשים בלי ההכנסה נוצר חוסר, בחודשים שבהם היא נכנסת מתקבל עודף.";
  }
  if (summary_status === "surplus") {
    return `ההכנסה הקבועה שלכם מכסה את כל ההוצאות החודשיות, ועוד נשאר ${formatILS(summary.monthly_gap)}.`;
  }
  if (summary_status === "deficit") {
    return `ההוצאות החודשיות חורגות מההכנסה הקבועה ב-${formatILS(summary.monthly_gap)}.`;
  }
  return "ההכנסות וההוצאות החודשיות שלכם קרובות זו לזו.";
}

function fallbackMeaning(model: ReportModel): string {
  // Phase 2b: prefer the playbook's meaningBody when available.
  const pb = getPlaybookFor(model);
  if (pb?.ui?.meaningBody) return pb.ui.meaningBody;

  if (model.summary_status === "insufficient_data") {
    return "כדי לקבל תמונה מלאה, צריך להעלות לפחות עו״ש וכרטיסי אשראי לחודש אחד שלם.";
  }
  if (model.summary_status === "variable_dependent") {
    return "ההכנסה הקבועה מכסה את ההוצאות הקבועות, אבל לא משאירה מרחב. ההכנסות המשתנות יכולות לסגור את הפער כשהן מגיעות.";
  }
  if (model.summary_status === "surplus") {
    return "יש לכם עודף שאפשר להפנות לחיסכון, להלוואה, או להוצאה גמישה. הדוח מראה איפה הוא מסתתר.";
  }
  if (model.summary_status === "deficit") {
    return "החוסר ניתן לטיפול. הדוח מסמן איפה יש לכם הכי הרבה שליטה ואיפה כדאי להתחיל.";
  }
  return "התקציב שלכם מאוזן ברגע זה. הדוח מראה איפה יש גמישות לעתיד.";
}

function fallbackWorkDoneBullets(model: ReportModel): string[] {
  const out: string[] = [];
  out.push(`קראנו ${model.work_done.transactions_reviewed.toLocaleString("he-IL")} תנועות מהקבצים שהעלאתם`);
  if (model.income_model.variable.length > 0) {
    out.push("הפרדנו הכנסה קבועה מהכנסה משתנה");
  }
  if (model.work_done.cc_charges_deduplicated > 0) {
    out.push(`מנענו ספירה כפולה של ${model.work_done.cc_charges_deduplicated} חיובי אשראי שמופיעים גם בעו״ש`);
  }
  if (model.work_done.one_time_items_excluded > 0) {
    out.push(`סימנו ${model.work_done.one_time_items_excluded} פריטים חד־פעמיים — לא נספרים כהוצאה חודשית`);
  }
  return out;
}

function fallbackPriorityBlurb(check: ReportModel["priority_checks"][number]): string {
  return check.why_it_matters;
}

function fallbackImprovementBlurb(io: ReportModel["improvement_opportunities"][number]): string {
  if (io.evidence_strength === "review_only") {
    return `סעיף שדורש סקירה — ${io.amount_label}. לא חיסכון ודאי, אבל שווה בדיקה.`;
  }
  return `${io.amount_label}. סעיף שיש לכם עליו שליטה ישירה — כל הפחתה כאן מתורגמת מיידית לחוסך.`;
}

function buildFallbackCopy(model: ReportModel): ClaudeCopy {
  return {
    headline_copy: fallbackHeadline(model),
    meaning_copy: fallbackMeaning(model),
    work_done_bullets: fallbackWorkDoneBullets(model),
    priority_check_blurbs: model.priority_checks.map(c => ({
      id: c.id,
      copy_blurb: fallbackPriorityBlurb(c)
    })),
    improvement_blurbs: model.improvement_opportunities.map(io => ({
      id: io.id,
      copy_blurb: fallbackImprovementBlurb(io)
    }))
  };
}

// ====================================================================
// Claude call
// ====================================================================

async function callClaude(model: ReportModel, apiKey: string): Promise<ClaudeCopy | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Phase 2b: prepend playbook guidance to the user message so Claude
    // knows the scenario's tone + allowed/forbidden phrasings. The
    // ReportModel JSON itself already contains selected_playbooks, but
    // Hebrew prose hints are easier for the model to follow.
    const pb = getPlaybookFor(model);
    const guidance = pb ? buildPlaybookGuidance(pb) + "\n\n" : "";
    const userMessage = guidance + buildUserMessage(model);

    const res = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.content?.[0]?.text;
    if (!text) return null;

    // Claude is asked to return JSON. Strip code fences if present.
    const cleaned = text
      .replace(/^[\s\S]*?```(?:json)?/, "")
      .replace(/```[\s\S]*$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Shape check
    const copy: ClaudeCopy = {
      headline_copy: String(parsed.headline_copy ?? ""),
      meaning_copy: String(parsed.meaning_copy ?? ""),
      work_done_bullets: Array.isArray(parsed.work_done_bullets) ? parsed.work_done_bullets.map(String) : [],
      priority_check_blurbs: Array.isArray(parsed.priority_check_blurbs)
        ? parsed.priority_check_blurbs.map((b: { id: unknown; copy_blurb: unknown }) =>
            ({ id: String(b.id ?? ""), copy_blurb: String(b.copy_blurb ?? "") }))
        : [],
      improvement_blurbs: Array.isArray(parsed.improvement_blurbs)
        ? parsed.improvement_blurbs.map((b: { id: unknown; copy_blurb: unknown }) =>
            ({ id: String(b.id ?? ""), copy_blurb: String(b.copy_blurb ?? "") }))
        : []
    };

    return copy;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ====================================================================
// Main entry — Stage F
// ====================================================================

export async function writeCopy(model: ReportModel): Promise<ClaudeCopy> {
  const apiKey = (typeof Deno !== "undefined" && Deno.env?.get?.("ANTHROPIC_API_KEY")) || "";

  // Always have a deterministic copy ready as fallback.
  const fallback = buildFallbackCopy(model);

  if (!apiKey) return fallback;

  const fromClaude = await callClaude(model, apiKey);
  if (!fromClaude) return fallback;

  // Validate Claude's output. If any field violates global forbidden
  // words / "/חודש"-on-one-time / "פער" / "כעגע" — drop the whole thing
  // and use the fallback. Partial fields could be salvaged but the
  // cleaner contract is all-or-nothing per request.
  const violations = validateClaudeCopy(fromClaude);
  if (violations.length > 0) {
    return fallback;
  }

  // Phase 2b: also reject if Claude wrote any phrase the selected
  // playbook explicitly forbids (e.g. "פוטנציאל חיסכון" without
  // evidence in subscriptions_creep, or "מסוכן" in debt_pressure).
  const pb = getPlaybookFor(model);
  const playbookViolations = validateAgainstPlaybook(fromClaude, pb);
  if (playbookViolations.length > 0) {
    return fallback;
  }

  return fromClaude;
}

export { buildFallbackCopy };
