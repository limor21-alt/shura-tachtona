// Stage C — clarification gate.
//
// Decides which (if any) questions block the report. Strict allowlist:
// a candidate row triggers a question ONLY if its category matches one
// of the BlockingReason values AND answering would materially change
// the final diagnosis.
//
// Never blocking:
//   - utilities, BIT/PayBox, municipal charges
//   - small one-time medical/kids/beauty
//   - known merchants
//   - small subscriptions
//   - grocery/pharmacy/restaurant charges
//
// All those flow to non_blocking_items at the end of the report.

import type {
  ClarificationQuestion,
  Classification,
  Facts,
  GateDecision,
  NormalizedRow
} from "./schema.ts";

export const MAX_BLOCKING_QUESTIONS = 5;
export const IDEAL_BLOCKING_QUESTIONS = 3;

// Thresholds — see spec §"BLOCKING RULES"
const ONE_TIME_INCOME_BLOCKING_MIN     = 5000;   // ₪5k+ one-time → ask
const POSSIBLE_INTERNAL_XFER_MIN       = 3000;   // ₪3k+ unidentified outflow → ask
const PARTNER_INCOME_MIN_TO_MATTER     = 1000;   // ignore tiny partner transfers
const AMBIGUOUS_VENDOR_MONTHLY_MIN     = 400;    // ≥₪400/mo recurring → worth asking
const AMBIGUOUS_VENDOR_MAX_QUESTIONS   = 2;      // cap to avoid quiz feeling

// Vendors whose name says "I'm a municipal/regional/multi-purpose entity"
// without telling us WHAT the charge is for (could be ארנונה / מים /
// חוגים / חינוך / אגרות). The user can resolve this in one tap.
const AMBIGUOUS_VENDOR_PATTERN =
  /חברה לפיתוח|מינהל|מועצה|רשות מקומית|עיריית|תאגיד מים|החברה למשק/i;

// ====================================================================
// HELPERS
// ====================================================================

function rowsByRef(facts: Facts): Map<string, NormalizedRow> {
  const m = new Map<string, NormalizedRow>();
  for (const r of facts.rows) {
    m.set(`${r.source}:${r.file_id}:${r.row_index}`, r);
  }
  return m;
}

function formatILS(n: number): string {
  return "₪" + Math.round(Math.abs(n)).toLocaleString("he-IL");
}

// ====================================================================
// Q1 — Partner / business income
// ====================================================================
//
// Trigger: classifier produced partner-flagged income with confidence
// less than "high", OR amounts span a wide range (>30%) so user
// confirmation materially changes whether we treat as fixed_income or
// variable_income or internal_transfer.

function checkPartnerIncome(
  facts: Facts,
  classification: Classification
): { question: ClarificationQuestion; targets: string[] } | null {
  const partner = facts.context.partner_name?.trim();
  if (!partner) return null;

  // Find decisions that mention partner-related rules.
  const partnerDecisions = classification.decisions.filter(d =>
    d.rule_id.startsWith("partner_") ||
    d.rule_id.startsWith("salary_variable:no_employer")
  );
  if (partnerDecisions.length === 0) return null;

  // High-confidence + uniform amounts → no need to ask.
  const allHigh = partnerDecisions.every(d => d.confidence === "high");
  if (allHigh && partnerDecisions.length >= 2) {
    const refMap = rowsByRef(facts);
    const amts = partnerDecisions
      .map(d => refMap.get(d.row_ref))
      .filter((r): r is NormalizedRow => !!r)
      .map(r => Math.abs(r.amount));
    if (amts.length >= 2) {
      const min = Math.min(...amts), max = Math.max(...amts);
      const spread = min > 0 ? (max - min) / min : 1;
      if (spread < 0.30) return null; // similar amounts, confident → skip
    }
  }

  // Pull the actual rows so we can show real numbers in the question.
  const refMap = rowsByRef(facts);
  const rows = partnerDecisions
    .map(d => refMap.get(d.row_ref))
    .filter((r): r is NormalizedRow => !!r);

  // Filter out tiny transfers (avoid asking about a 80₪ Bit refund).
  const materialRows = rows.filter(r => Math.abs(r.amount) >= PARTNER_INCOME_MIN_TO_MATTER);
  if (materialRows.length === 0) return null;

  const amts = materialRows.map(r => Math.abs(r.amount));
  const min = Math.min(...amts);
  const max = Math.max(...amts);
  const months = new Set(materialRows.map(r => r.date.slice(0, 7))).size;

  const rangeStr = min === max ? formatILS(min) : `${formatILS(min)} עד ${formatILS(max)}`;
  const question: ClarificationQuestion = {
    id: "q-partner-income",
    meta: "הכנסה משתנה",
    title: `האם ההעברות מ${partner} הן משכורת קבועה?`,
    context: `מצאנו ${materialRows.length} העברות מ${partner} ב-${months} חודשים שונים בסכומים ${rangeStr}. אם זו משכורת קבועה, נחשב אחרת.`,
    options: [
      { value: "fixed",    label: "כן — קבועה" },
      { value: "variable", label: "לא — משתנה" },
      { value: "internal", label: "העברה פנימית" }
    ],
    allow_dontknow: true,
    reason: "partner_or_business_income"
  };

  return { question, targets: materialRows.map(r => `${r.source}:${r.file_id}:${r.row_index}`) };
}

// ====================================================================
// Q2 — Large one-time income
// ====================================================================

function checkLargeOneTimeIncome(
  facts: Facts,
  classification: Classification
): { question: ClarificationQuestion; targets: string[] } | null {
  const refMap = rowsByRef(facts);

  const candidates: { row: NormalizedRow; ref: string }[] = [];
  for (const d of classification.decisions) {
    if (d.decision !== "one_time_income_excluded") continue;
    const row = refMap.get(d.row_ref);
    if (!row) continue;
    if (row.amount >= ONE_TIME_INCOME_BLOCKING_MIN) {
      candidates.push({ row, ref: d.row_ref });
    }
  }
  if (candidates.length === 0) return null;

  // Combine all candidates into one question (don't spam the user).
  const total = candidates.reduce((s, c) => s + c.row.amount, 0);
  const firstRow = candidates[0].row;
  const sourceHint = firstRow.raw_description.slice(0, 30);

  const question: ClarificationQuestion = {
    id: "q-large-onetime-income",
    meta: "פריט חד־פעמי",
    title: candidates.length === 1
      ? `הכנסה של ${formatILS(total)} מ${sourceHint} — חד־פעמית?`
      : `${candidates.length} תקבולים גדולים — חד־פעמיים?`,
    context: candidates.length === 1
      ? `מצאנו תקבול של ${formatILS(total)} ב-${firstRow.date} (${sourceHint}). בדרך כלל זו קרן השתלמות / גמל / פיצויים. אם זה חוזר, נעדכן את התמונה.`
      : `מצאנו ${candidates.length} תקבולים גדולים בסך כולל של ${formatILS(total)}. נחשב אותם כחד־פעמיים כברירת מחדל.`,
    options: [
      { value: "one_time",  label: "חד־פעמיים" },
      { value: "recurring", label: "חוזרים חודשית" }
    ],
    allow_dontknow: true,
    reason: "large_one_time_income"
  };

  return { question, targets: candidates.map(c => c.ref) };
}

// ====================================================================
// Q3 — Possible internal transfer (large outflow we can't identify)
// ====================================================================

function checkPossibleInternalTransfer(
  facts: Facts,
  classification: Classification
): { question: ClarificationQuestion; targets: string[] } | null {
  const refMap = rowsByRef(facts);

  // Candidates: bank outflows ≥ threshold, classified as fallback review_only,
  // with description that hints at a transfer ("העברה" / "Transfer").
  const candidates: { row: NormalizedRow; ref: string }[] = [];
  for (const d of classification.decisions) {
    if (d.rule_id !== "fallback:uncertain") continue;
    const row = refMap.get(d.row_ref);
    if (!row || row.source !== "bank" || row.amount >= 0) continue;
    if (Math.abs(row.amount) < POSSIBLE_INTERNAL_XFER_MIN) continue;

    const desc = row.raw_description.toLowerCase();
    const looksLikeTransfer = /העברה|transfer|חיסכון|פק[״"]?מ/i.test(desc);
    if (!looksLikeTransfer) continue;

    candidates.push({ row, ref: d.row_ref });
  }
  if (candidates.length === 0) return null;

  const total = candidates.reduce((s, c) => s + Math.abs(c.row.amount), 0);
  const sample = candidates[0].row.raw_description.slice(0, 40);

  const question: ClarificationQuestion = {
    id: "q-internal-transfer",
    meta: "העברה גדולה",
    title: candidates.length === 1
      ? `העברה של ${formatILS(total)} — לחשבון שלך?`
      : `${candidates.length} העברות גדולות — לחשבון שלך?`,
    context: candidates.length === 1
      ? `מצאנו העברה גדולה ב-${candidates[0].row.date} (${sample}). אם זו העברה לחשבון אחר שלך (חיסכון, פק״מ), לא נכלול אותה בהוצאות.`
      : `מצאנו ${candidates.length} העברות גדולות בסך ${formatILS(total)}. אם הן לחשבון אחר שלך, לא נכלול אותן בהוצאות.`,
    options: [
      { value: "internal", label: "כן — חשבון שלי" },
      { value: "expense",  label: "לא — הוצאה אמיתית" }
    ],
    allow_dontknow: true,
    reason: "possible_internal_transfer"
  };

  return { question, targets: candidates.map(c => c.ref) };
}

// ====================================================================
// Q4 — Missing critical file
// ====================================================================

function checkMissingCriticalFile(
  facts: Facts
): { question: ClarificationQuestion; targets: string[] } | null {
  const planned = facts.context.planned_files;
  const wantsBoth = planned.includes("both") || (planned.includes("bank") && planned.includes("credit_card"));
  if (!wantsBoth) return null;

  // If user only uploaded one of the two — we can't ASK them anything
  // useful in a gate question (the question would be "go upload the
  // other file"). For now, this is surfaced via report_type =
  // partial_credit_only / partial_bank_only, not as a blocking question.
  // Leaving this as a placeholder so Phase 5/6 can add a guided
  // "upload the other file" interstitial if we decide we want one.
  return null;
}

// ====================================================================
// Q5 — Ambiguous municipal/multi-purpose vendor
// ====================================================================
//
// Catches material recurring charges to entities whose name doesn't
// say what the charge is for. Asking the user resolves the category
// in one tap and stops the report from mislabelling them.

function checkAmbiguousVendor(
  facts: Facts,
  classification: Classification,
): { question: ClarificationQuestion; targets: string[] } | null {
  const refMap = rowsByRef(facts);
  const months = Math.max(1, facts.months_covered.length);

  // Group ambiguous-name rows by normalized vendor key.
  const groups = new Map<string, { sample: NormalizedRow; refs: string[]; total: number; months: Set<string> }>();
  for (const d of classification.decisions) {
    const row = refMap.get(d.row_ref);
    if (!row || row.amount >= 0) continue;
    if (!AMBIGUOUS_VENDOR_PATTERN.test(row.raw_description)) continue;
    // Skip rows we've already decided are not real expenses.
    if (
      d.decision === "cc_charge_in_bank" ||
      d.decision === "internal_transfer_excluded" ||
      d.decision === "one_time_income_excluded"
    ) continue;

    const key = row.raw_description.replace(/\s+/g, " ").trim().toLowerCase();
    const prev = groups.get(key) ?? { sample: row, refs: [], total: 0, months: new Set<string>() };
    prev.refs.push(d.row_ref);
    prev.total += Math.abs(row.amount);
    prev.months.add(row.date.slice(0, 7));
    groups.set(key, prev);
  }

  // Pick the largest group whose monthly average crosses the threshold.
  const candidates = Array.from(groups.values())
    .map(g => ({ ...g, monthly: g.total / months }))
    .filter(g => g.monthly >= AMBIGUOUS_VENDOR_MONTHLY_MIN)
    .sort((a, b) => b.monthly - a.monthly);

  if (candidates.length === 0) return null;
  const top = candidates[0];
  const label = top.sample.cleaned_name || top.sample.raw_description;

  const question: ClarificationQuestion = {
    id: "q-ambiguous-vendor",
    meta: "תשלום לבדיקה",
    title: `מה זה התשלום החוזר ל"${label}"?`,
    context: `מצאנו תשלום חוזר של ${formatILS(top.monthly)}/חודש (${top.months.size} חודשים). אנחנו לא יודעים אם זה ארנונה, מים, חינוך או משהו אחר — הסיווג ישפיע על איך זה מוצג בדוח.`,
    options: [
      { value: "municipal", label: "ארנונה / מים / מועצה" },
      { value: "education", label: "חינוך / חוגים / צהרון" },
      { value: "other_fixed", label: "התחייבות אחרת" },
      { value: "one_time", label: "חד־פעמי, לא חוזר" },
    ],
    allow_dontknow: true,
    reason: "ambiguous_municipal_vendor",
  };

  return { question, targets: top.refs };
}

// ====================================================================
// ORCHESTRATOR
// ====================================================================

const QUESTION_CHECKS = [
  checkPartnerIncome,
  checkLargeOneTimeIncome,
  checkPossibleInternalTransfer,
  checkAmbiguousVendor,
  // checkMissingCriticalFile is reserved but currently returns null
];

export function clarificationGate(
  facts: Facts,
  classification: Classification
): GateDecision {
  const questions: ClarificationQuestion[] = [];
  const targets: Record<string, string[]> = {};

  for (const check of QUESTION_CHECKS) {
    if (questions.length >= MAX_BLOCKING_QUESTIONS) break;
    const result = check(facts, classification);
    if (!result) continue;
    questions.push(result.question);
    targets[result.question.id] = result.targets;
  }

  return { blocking_questions: questions, question_targets: targets };
}

// Make the missing-file check reachable even though it's currently a no-op,
// so the linter doesn't flag the import.
void checkMissingCriticalFile;
