// Stage E — assemble the final ReportModel from facts + classification + answers.
//
// Pure, deterministic. Every number on screen is computed here. All
// invariants assert at the end; on failure we throw rather than render.

import type {
  Answer,
  ClassifiedTx,
  ClassificationDecision,
  Classification,
  Confidence,
  Facts,
  NormalizedRow,
  ReportModel,
  ReportType,
  Scenario,
  SummaryStatus,
  VariableRange
} from "./schema.ts";
import { normalizeDesc, monthOf } from "./classify/helpers.ts";
import { assertAllInvariants } from "./validators/invariants.ts";

// ====================================================================
// Thresholds
// ====================================================================

/** Variable income is "material" if it crosses any of these. */
const VARIABLE_MATERIAL_RATIO = 0.10;   // > 10% of fixed_income
const BALANCED_GAP_TOLERANCE  = 200;    // ±₪200 around zero = balanced
const SUBSCRIPTION_REVIEW_MIN = 100;    // surface subscriptions ≥ this monthly
const FLEXIBLE_CONTROL_MIN    = 1000;   // surface flexible items ≥ this monthly
const NON_BLOCKING_TOP_N      = 10;     // cap rendered list

// ====================================================================
// Helpers
// ====================================================================

interface VendorGroup {
  key: string;
  label: string;
  category: string;
  rows: NormalizedRow[];
  total: number;
  months_present: string[];
}

function rowRef(row: NormalizedRow): string {
  return `${row.source}:${row.file_id}:${row.row_index}`;
}

function groupByVendor(rows: NormalizedRow[]): VendorGroup[] {
  const groups = new Map<string, NormalizedRow[]>();
  for (const r of rows) {
    const key = normalizeDesc(r.raw_description);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const out: VendorGroup[] = [];
  for (const [key, arr] of groups) {
    const months = new Set(arr.map(r => monthOf(r)));
    out.push({
      key,
      label: arr[0].cleaned_name || arr[0].raw_description,
      category: inferCategoryLabel(arr[0]),
      rows: arr,
      total: arr.reduce((s, r) => s + Math.abs(r.amount), 0),
      months_present: Array.from(months).sort()
    });
  }
  out.sort((a, b) => b.total - a.total);
  return out;
}

/** Heuristic Hebrew area label for a vendor — used in findings_by_area + display. */
function inferCategoryLabel(row: NormalizedRow): string {
  const d = normalizeDesc(row.raw_description);
  if (/חשמל|מים|גז|בזק|הוט|yes|סלקום|פרטנר|פלאפון|012|013|014/i.test(d)) return "חשבונות";
  if (/ארנונה|ועד בית/.test(d))                                            return "דיור";
  if (/משכנת/.test(d))                                                     return "דיור";
  if (/הלוואה|החזר|ריבית|loan/i.test(d))                                  return "חוב";
  if (/ביטוח|הראל|כלל|הפניקס|מנורה|מגדל ביטוח/.test(d))                  return "ביטוחים";
  if (/wolt|מסעדה|cafe|קפה|10bis|תן ביס/i.test(d))                       return "מזון בחוץ";
  if (/שופרסל|רמי לוי|ויקטורי|מגה|טיב טעם|אושר עד|יוחננוף|סופר/i.test(d)) return "מזון";
  if (/דלק|פז|דור אלון|סונול|paz|delek/i.test(d))                         return "תחבורה";
  if (/חוג|גן|צהרון|מטפלת|בית ספר|playsmart/i.test(d))                   return "ילדים";
  if (/מכבי|כללית|לאומית|מאוחדת|דנט|פארם|בית מרקחת|רופא/.test(d))         return "רפואי";
  if (/netflix|spotify|icloud|apple|nyt|disney|hbo/i.test(d))             return "מנויים";
  if (/bit|paybox|paypal/i.test(d))                                       return "העברות לבדיקה";
  return "אחר";
}

/** Filter decisions by ClassificationDecision label. */
function filterByDecision(
  classification: Classification,
  decision: ClassificationDecision,
  rowByRef: Map<string, NormalizedRow>
): NormalizedRow[] {
  const out: NormalizedRow[] = [];
  for (const d of classification.decisions) {
    if (d.decision !== decision) continue;
    const r = rowByRef.get(d.row_ref);
    if (r) out.push(r);
  }
  return out;
}

function buildRowByRef(rows: NormalizedRow[]): Map<string, NormalizedRow> {
  const m = new Map<string, NormalizedRow>();
  for (const r of rows) m.set(rowRef(r), r);
  return m;
}

// ====================================================================
// Aggregators per category
// ====================================================================

function aggregateFixedIncome(rows: NormalizedRow[], months: number) {
  const groups = groupByVendor(rows);
  return groups.map(g => ({
    label: g.label,
    monthly_amount: months > 0 ? Math.round(g.total / months) : 0,
    evidence_count: g.rows.length,
    source_examples: g.rows.slice(0, 3).map(r => r.raw_description)
  }));
}

function aggregateVariableIncome(rows: NormalizedRow[]) {
  const groups = groupByVendor(rows);
  return groups.map(g => {
    const amts = g.rows.map(r => r.amount);
    const min = Math.min(...amts);
    const max = Math.max(...amts);
    const avg = amts.reduce((s, x) => s + x, 0) / amts.length;
    return {
      label: g.label,
      months_present: g.months_present.length,
      range: { min: Math.round(min), max: Math.round(max), avg: Math.round(avg) },
      evidence: g.rows.map(r => ({ date: r.date, amount: r.amount }))
    };
  });
}

function aggregateOneTimeIncome(rows: NormalizedRow[]) {
  return rows.map(r => ({
    label: r.cleaned_name || r.raw_description,
    amount: Math.round(r.amount),
    date: r.date,
    reason: "סווג כחד־פעמי (קרן/גמל/פיצויים)"
  }));
}

function aggregateInternalTransfers(rows: NormalizedRow[]) {
  const groups = groupByVendor(rows);
  return groups.map(g => ({
    label: g.label,
    amount: Math.round(g.total),
    count: g.rows.length
  }));
}

function aggregateFixedCommitments(rows: NormalizedRow[], months: number) {
  const groups = groupByVendor(rows);
  return groups.map(g => ({
    label: g.label,
    monthly_amount: months > 0 ? Math.round(g.total / months) : 0,
    category: g.category,
    evidence: g.rows.slice(0, 3).map(r => ({ date: r.date, amount: r.amount }))
  }));
}

function aggregateDebt(rows: NormalizedRow[], months: number) {
  const groups = groupByVendor(rows);
  return groups.map(g => ({
    label: g.label,
    monthly_amount: months > 0 ? Math.round(g.total / months) : 0,
    evidence: g.rows.slice(0, 3).map(r => ({ date: r.date, amount: r.amount }))
  }));
}

function aggregateFlexible(rows: NormalizedRow[], months: number) {
  const groups = groupByVendor(rows);
  return groups.map(g => ({
    label: g.label,
    monthly_avg: months > 0 ? Math.round(g.total / months) : 0,
    category: g.category,
    evidence: g.rows.slice(0, 3).map(r => ({ date: r.date, amount: r.amount }))
  }));
}

function aggregateReviewOnly(rows: NormalizedRow[], months: number) {
  const groups = groupByVendor(rows);
  return groups.map(g => {
    // For review-only items we often can't claim it's monthly. Show
    // monthly_avg only if we see ≥2 months; otherwise show period_total.
    const isRecurring = g.months_present.length >= 2;
    if (isRecurring) {
      return {
        label: g.label,
        monthly_avg: months > 0 ? Math.round(g.total / months) : 0,
        reason: "לבדוק אם ההוצאה מוצדקת חודשית",
        evidence: g.rows.slice(0, 3).map(r => ({ date: r.date, amount: r.amount }))
      };
    }
    return {
      label: g.label,
      period_total: Math.round(g.total),
      reason: "תנועות שדורשות סקירה — לא סווגו אוטומטית",
      evidence: g.rows.slice(0, 3).map(r => ({ date: r.date, amount: r.amount }))
    };
  });
}

function aggregateOneTimeExpenses(rows: NormalizedRow[]) {
  return rows.map(r => ({
    label: r.cleaned_name || r.raw_description,
    amount: Math.round(Math.abs(r.amount)),
    date: r.date,
    category: inferCategoryLabel(r)
  }));
}

function aggregateNonBlocking(rows: NormalizedRow[]) {
  return rows
    .slice()
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, NON_BLOCKING_TOP_N)
    .map(r => ({
      label: r.cleaned_name || r.raw_description,
      amount: Math.round(Math.abs(r.amount)),
      date: r.date,
      suggested_category: inferCategoryLabel(r),
      action: "confirm" as const
    }));
}

function aggregateExcludedCcTransfers(
  classification: Classification,
  rowByRef: Map<string, NormalizedRow>
) {
  const grouped = new Map<string, { amount: number; count: number; sample: NormalizedRow }>();
  for (const d of classification.decisions) {
    if (d.decision !== "cc_charge_in_bank") continue;
    const row = rowByRef.get(d.row_ref);
    if (!row) continue;
    const key = normalizeDesc(row.raw_description);
    const prev = grouped.get(key) ?? { amount: 0, count: 0, sample: row };
    prev.amount += Math.abs(row.amount);
    prev.count += 1;
    grouped.set(key, prev);
  }
  return Array.from(grouped.values()).map(g => ({
    label: g.sample.cleaned_name || g.sample.raw_description,
    amount: Math.round(g.amount),
    count: g.count,
    target: "כרטיס אשראי"
  }));
}

// ====================================================================
// Summary + status
// ====================================================================

function determineSummaryStatus(
  monthlyIncomeFixed: number,
  monthlyIncomeVariable: VariableRange | null,
  monthlyExpenses: number
): SummaryStatus {
  if (monthlyIncomeFixed === 0 && !monthlyIncomeVariable) return "insufficient_data";

  const variableAvg = monthlyIncomeVariable?.avg ?? 0;
  const variableMaterial =
    !!monthlyIncomeVariable &&
    (variableAvg > monthlyIncomeFixed * VARIABLE_MATERIAL_RATIO ||
     monthlyIncomeFixed < monthlyExpenses);

  if (variableMaterial) return "variable_dependent";

  const gap = monthlyIncomeFixed - monthlyExpenses;
  if (Math.abs(gap) <= BALANCED_GAP_TOLERANCE) return "balanced";
  return gap > 0 ? "surplus" : "deficit";
}

function gapLabelFor(status: SummaryStatus): "עודף מחושב" | "חוסר חודשי" | "מאוזן" {
  if (status === "surplus" || status === "variable_dependent") return "עודף מחושב";
  if (status === "deficit") return "חוסר חודשי";
  return "מאוזן";
}

function buildScenarios(
  monthlyIncomeFixed: number,
  variable: VariableRange | null,
  monthlyExpenses: number
): Scenario[] | undefined {
  if (!variable) return undefined;
  const variableAvg = variable.avg ?? 0;
  return [
    {
      name: "ללא הכנסה משתנה",
      income: monthlyIncomeFixed,
      expenses: monthlyExpenses,
      gap: monthlyIncomeFixed - monthlyExpenses
    },
    {
      name: "עם הכנסה משתנה",
      income: monthlyIncomeFixed + variableAvg,
      expenses: monthlyExpenses,
      gap: monthlyIncomeFixed + variableAvg - monthlyExpenses
    }
  ];
}

// ====================================================================
// Priority checks + improvements (deterministic seed; Claude writes the copy)
// ====================================================================

function buildPriorityChecks(
  income: ReturnType<typeof aggregateVariableIncome>,
  expenseModel: ReportModel["expense_model"],
  context: Facts["context"]
): ReportModel["priority_checks"] {
  const checks: ReportModel["priority_checks"] = [];

  // 1. Variable income concern — if user has one
  if (income.length > 0) {
    const v = income[0];
    checks.push({
      id: "pc-variable-income",
      title: `ההכנסה ${context.partner_name ? `מ${context.partner_name} ` : ""}לא קבועה`,
      why_it_matters: `הסכומים נעים בין ${formatILS(v.range.min)} ל-${formatILS(v.range.max)} בחודשים שבהם הופיעה.`,
      suggested_action: "אם זה תזרים יציב לטווח ארוך — לתכנן סביבו. אם לא — לבנות תקציב לפי תרחיש הזהיר.",
      amount_context: `${formatILS(v.range.min)}-${formatILS(v.range.max)}`,
      copy_blurb: ""
    });
  }

  // 2. BIT/PayBox total — if it crosses the noise threshold
  const bitPaybox = expenseModel.review_only_items.filter(x =>
    /bit|paybox|paypal/i.test(x.label)
  );
  if (bitPaybox.length > 0) {
    const total = bitPaybox.reduce((s, x) => s + (x.monthly_avg ?? x.period_total ?? 0), 0);
    if (total >= 500) {
      checks.push({
        id: "pc-bit-paybox",
        title: "העברות BIT/PayBox לא מזוהות",
        why_it_matters: `מצאנו ${formatILS(total)} שלא ברור לאן הלכו. שווה לפרק לפני שמסיקים על הפער.`,
        suggested_action: "לעבור על האפליקציה ולסמן את הנמענים הקבועים.",
        amount_context: formatILS(total),
        copy_blurb: ""
      });
    }
  }

  // 3. Subscriptions monthly average
  const subs = expenseModel.review_only_items.filter(x =>
    /netflix|spotify|icloud|apple|disney|hbo|מנוי/i.test(x.label)
  );
  if (subs.length > 0) {
    const total = subs.reduce((s, x) => s + (x.monthly_avg ?? 0), 0);
    if (total >= SUBSCRIPTION_REVIEW_MIN) {
      checks.push({
        id: "pc-subscriptions",
        title: "מנויים שלא נבדקו",
        why_it_matters: `${formatILS(total)}/חודש למנויים. הפוטנציאל תלוי במה שבאמת בשימוש.`,
        suggested_action: "לעבור על הרשימה ולסמן אילו פעילים.",
        amount_context: `${formatILS(total)}/חודש`,
        copy_blurb: ""
      });
    }
  }

  return checks.slice(0, 5);
}

function buildImprovements(expenseModel: ReportModel["expense_model"]): ReportModel["improvement_opportunities"] {
  const out: ReportModel["improvement_opportunities"] = [];

  // Flexible spending — areas under direct control
  for (const f of expenseModel.flexible_spending) {
    if (f.monthly_avg < FLEXIBLE_CONTROL_MIN) continue;
    out.push({
      id: `io-${normalizeDesc(f.label).replace(/\s+/g, "-")}`,
      title: f.label,
      evidence_strength: "likely",
      amount_label: `${formatILS(f.monthly_avg)}/חודש`,
      copy_blurb: ""
    });
  }

  return out.slice(0, 5);
}

function buildFindingsByArea(expenseModel: ReportModel["expense_model"]): ReportModel["findings_by_area"] {
  const byArea = new Map<string, { monthly: number; items: number; strength: "confirmed" | "likely" | "review_only" }>();

  const add = (area: string, amount: number, strength: "confirmed" | "likely" | "review_only") => {
    const prev = byArea.get(area) ?? { monthly: 0, items: 0, strength };
    prev.monthly += amount;
    prev.items += 1;
    // Take the weakest evidence strength seen for that area
    if (strength === "review_only") prev.strength = "review_only";
    else if (strength === "likely" && prev.strength !== "review_only") prev.strength = "likely";
    byArea.set(area, prev);
  };

  for (const f of expenseModel.fixed_commitments) add(f.category, f.monthly_amount, "confirmed");
  for (const f of expenseModel.flexible_spending) add(f.category, f.monthly_avg,    "confirmed");
  for (const d of expenseModel.debt_payments)     add("חוב",      d.monthly_amount, "confirmed");
  for (const r of expenseModel.review_only_items) {
    const amt = r.monthly_avg ?? 0; // period_total not meaningful per month
    if (amt > 0) add(/bit|paybox/i.test(r.label) ? "העברות לבדיקה" : "מנויים", amt, "review_only");
  }

  return Array.from(byArea.entries())
    .map(([area, x]) => ({
      area,
      monthly_avg: Math.round(x.monthly),
      items: x.items,
      evidence_strength: x.strength
    }))
    .sort((a, b) => b.monthly_avg - a.monthly_avg);
}

// ====================================================================
// Confidence + report_type
// ====================================================================

function determineReportType(facts: Facts): ReportType {
  const hasBank = facts.files_present.bank;
  const hasCc   = facts.files_present.credit_card;
  const months  = facts.months_covered.length;

  if (!hasBank && !hasCc)        return "low_confidence";
  if (months < 1)                 return "low_confidence";
  if (hasBank && !hasCc)          return "partial_bank_only";
  if (!hasBank && hasCc)          return "partial_credit_only";
  return "full";
}

function determineConfidence(facts: Facts): { level: Confidence; reason: string } {
  const hasBank = facts.files_present.bank;
  const hasCc   = facts.files_present.credit_card;
  const months  = facts.months_covered.length;

  if (hasBank && hasCc && months >= 3) return { level: "high",   reason: "עו״ש + אשראי + 3 חודשים או יותר" };
  if (hasBank && hasCc && months >= 1) return { level: "medium", reason: "עו״ש + אשראי אבל פחות מ-3 חודשים" };
  if ((hasBank || hasCc) && months >= 1) return { level: "medium", reason: "חסר חלק מהקבצים" };
  return { level: "low", reason: "מעט נתונים זמינים" };
}

// ====================================================================
// Misc utilities
// ====================================================================

function formatILS(n: number): string {
  return "₪" + Math.round(Math.abs(n)).toLocaleString("he-IL");
}

function sumMonthly(items: { monthly_amount?: number; monthly_avg?: number }[]): number {
  return items.reduce((s, i) => s + (i.monthly_amount ?? i.monthly_avg ?? 0), 0);
}

// ====================================================================
// MAIN — buildReportModel
// ====================================================================

export function buildReportModel(
  facts: Facts,
  classification: Classification,
  _answers: Answer[],
  overrides: { question_id: string; before: string; after: string }[]
): ReportModel {
  const rowByRef = buildRowByRef(facts.rows);
  const months = facts.months_covered.length || 1;

  // ----- income aggregation -----
  const fixedIncomeRows    = filterByDecision(classification, "fixed_income", rowByRef);
  const variableIncomeRows = filterByDecision(classification, "variable_income", rowByRef);
  const oneTimeIncomeRows  = filterByDecision(classification, "one_time_income_excluded", rowByRef);
  const internalIncomeRows = filterByDecision(classification, "internal_transfer_excluded", rowByRef);
  const uncertainIncomeRows = filterByDecision(classification, "uncertain_income", rowByRef);

  const fixedIncome    = aggregateFixedIncome(fixedIncomeRows, months);
  const variableIncome = aggregateVariableIncome(variableIncomeRows);
  const oneTimeIncome  = aggregateOneTimeIncome(oneTimeIncomeRows);
  const internalTransfersIncome = aggregateInternalTransfers(internalIncomeRows);
  const uncertain = uncertainIncomeRows.map(r => ({
    label: r.cleaned_name || r.raw_description,
    amount: Math.round(r.amount),
    why: "לא הצלחנו לסווג בוודאות"
  }));

  // ----- expense aggregation -----
  const fixedCommitmentRows = [
    ...filterByDecision(classification, "fixed_commitment", rowByRef),
    ...filterByDecision(classification, "household_bill", rowByRef)
  ];
  const debtRows         = filterByDecision(classification, "debt_payment", rowByRef);
  const flexibleRows     = filterByDecision(classification, "flexible_spending", rowByRef);
  const reviewOnlyRows   = filterByDecision(classification, "review_only", rowByRef);
  const oneTimeExpRows   = filterByDecision(classification, "one_time_expense", rowByRef);
  const nonBlockingRows  = filterByDecision(classification, "non_blocking_item", rowByRef);

  const fixedCommitments = aggregateFixedCommitments(fixedCommitmentRows, months);
  const debtPayments     = aggregateDebt(debtRows, months);
  const flexibleSpending = aggregateFlexible(flexibleRows, months);
  const reviewOnlyItems  = aggregateReviewOnly(reviewOnlyRows, months);
  const oneTimeExpenses  = aggregateOneTimeExpenses(oneTimeExpRows);
  const nonBlockingItems = aggregateNonBlocking(nonBlockingRows);
  const excludedCcTransfers = aggregateExcludedCcTransfers(classification, rowByRef);

  // ----- summary numbers -----
  const monthlyIncomeFixed = sumMonthly(fixedIncome.map(x => ({ monthly_amount: x.monthly_amount })));
  const monthlyExpensesTotal =
    sumMonthly(fixedCommitments.map(x => ({ monthly_amount: x.monthly_amount }))) +
    sumMonthly(debtPayments.map(x => ({ monthly_amount: x.monthly_amount }))) +
    sumMonthly(flexibleSpending.map(x => ({ monthly_avg: x.monthly_avg })));

  const variableRange: VariableRange | null = variableIncome.length > 0
    ? {
        min: Math.min(...variableIncome.map(v => v.range.min)),
        max: Math.max(...variableIncome.map(v => v.range.max)),
        avg: Math.round(variableIncome.reduce((s, v) => s + v.range.avg, 0) / variableIncome.length),
        months_present: Math.max(...variableIncome.map(v => v.months_present))
      }
    : null;

  const summary_status = determineSummaryStatus(monthlyIncomeFixed, variableRange, monthlyExpensesTotal);
  const display_mode = summary_status === "variable_dependent" ? "two_scenarios" : "single_scenario";

  const monthlyGap = summary_status === "variable_dependent"
    ? monthlyIncomeFixed - monthlyExpensesTotal  // conservative scenario
    : monthlyIncomeFixed - monthlyExpensesTotal;

  const scenarios = display_mode === "two_scenarios"
    ? buildScenarios(monthlyIncomeFixed, variableRange, monthlyExpensesTotal)
    : undefined;

  // ----- report type + confidence -----
  const report_type = determineReportType(facts);
  const conf = determineConfidence(facts);

  // ----- expense_model object (used by priority checks etc.) -----
  const expense_model: ReportModel["expense_model"] = {
    fixed_commitments: fixedCommitments,
    debt_payments: debtPayments,
    flexible_spending: flexibleSpending,
    review_only_items: reviewOnlyItems,
    one_time_expenses: oneTimeExpenses,
    excluded_internal_transfers: excludedCcTransfers
  };

  // ----- priority checks + improvements + findings -----
  const priority_checks = buildPriorityChecks(variableIncome, expense_model, facts.context);
  const improvement_opportunities = buildImprovements(expense_model);
  const findings_by_area = buildFindingsByArea(expense_model);

  // ----- work done -----
  const filesAnalyzed = collectFilesAnalyzed(facts.rows);
  const ccDedupCount = classification.decisions.filter(d => d.decision === "cc_charge_in_bank").length;
  const oneTimeExcludedCount =
    oneTimeIncome.length + oneTimeExpenses.length;
  const work_done: ReportModel["work_done"] = {
    files_analyzed: filesAnalyzed,
    months_covered: facts.months_covered.length,
    transactions_reviewed: facts.rows.length,
    cc_charges_deduplicated: ccDedupCount,
    one_time_items_excluded: oneTimeExcludedCount,
    bullets_copy: [] // filled by Claude in Stage F, fallback in copy_writer
  };

  // ----- audit trail -----
  const classification_audit_trail: ReportModel["classification_audit_trail"] = {
    rules_fired: classification.decisions.map(d => ({
      rule_id: d.rule_id,
      row_ref: d.row_ref,
      decision: d.decision,
      confidence: d.confidence
    })),
    user_overrides: overrides,
    excluded_items: [
      ...classification.decisions
        .filter(d => d.decision === "cc_charge_in_bank")
        .map(d => ({ row_ref: d.row_ref, reason: "חיוב פנימי של אשראי בעו״ש" })),
      ...classification.decisions
        .filter(d => d.decision === "one_time_income_excluded")
        .map(d => ({ row_ref: d.row_ref, reason: "הכנסה חד־פעמית — לא נספרת חודשית" }))
    ]
  };

  // ----- assemble -----
  const model: ReportModel = {
    report_type,
    data_confidence: conf.level,
    data_confidence_reason: conf.reason,
    summary_status,
    display_mode,
    summary: {
      headline_copy: "",
      meaning_copy: "",
      monthly_income_fixed: Math.round(monthlyIncomeFixed),
      monthly_income_variable_range: variableRange,
      monthly_expenses_total: Math.round(monthlyExpensesTotal),
      monthly_gap: Math.round(monthlyGap),
      gap_label: gapLabelFor(summary_status),
      scenarios
    },
    work_done,
    income_model: {
      fixed: fixedIncome,
      variable: variableIncome,
      one_time_excluded: oneTimeIncome,
      internal_transfers_excluded: internalTransfersIncome,
      uncertain
    },
    expense_model,
    priority_checks,
    improvement_opportunities,
    findings_by_area,
    non_blocking_items: nonBlockingItems,
    classification_audit_trail,
    export_data: { json_blob_ref: null, pdf_url: null, csv_url: null },
    parser_warnings: facts.parser_warnings,
    forbidden_word_violations: []
  };

  assertAllInvariants(model);
  return model;
}

function collectFilesAnalyzed(rows: NormalizedRow[]) {
  const byFile = new Map<string, { type: NormalizedRow["source"]; name: string; months: Set<string>; rows: number }>();
  for (const r of rows) {
    const key = `${r.source}:${r.file_id}`;
    const prev = byFile.get(key) ?? { type: r.source, name: `${r.source}-${r.file_id}`, months: new Set(), rows: 0 };
    prev.months.add(monthOf(r));
    prev.rows += 1;
    byFile.set(key, prev);
  }
  return Array.from(byFile.values()).map(f => ({
    type: f.type,
    name: f.name,
    months: f.months.size,
    row_count: f.rows
  }));
}
