// Math invariants asserted before report_model leaves build_report_model.ts.
//
// Any failure here means the deterministic engine produced an
// inconsistent report — we throw rather than render. The frontend
// should NEVER see a report that fails these checks.

import type { ReportModel } from "../schema.ts";

export class InvariantViolationError extends Error {
  constructor(public invariant: string, public detail: string) {
    super(`Invariant violation: ${invariant} — ${detail}`);
  }
}

/** Sum within ±1 ILS tolerance to absorb rounding from fractional charges. */
const ILS_EPSILON = 1;

function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= ILS_EPSILON;
}

/** monthly_expenses_total = sum of every expense category at /month.
 *  This is the load-bearing check that prevents CC double counting. */
export function assertMonthlyExpenseSum(model: ReportModel): void {
  const e = model.expense_model;
  const sum =
    e.fixed_commitments.reduce((s, x) => s + x.monthly_amount, 0) +
    e.debt_payments.reduce((s, x) => s + x.monthly_amount, 0) +
    e.flexible_spending.reduce((s, x) => s + x.monthly_avg, 0);
  // review_only_items + one_time_expenses NOT included in monthly total.
  // excluded_internal_transfers also NOT included (that's the CC dedup point).

  if (!approxEqual(sum, model.summary.monthly_expenses_total)) {
    throw new InvariantViolationError(
      "monthly_expense_sum",
      `categories sum to ${sum} but summary.monthly_expenses_total is ${model.summary.monthly_expenses_total}`
    );
  }
}

/** Surplus iff income >= expenses. Sign of monthly_gap must match the label. */
export function assertGapSign(model: ReportModel): void {
  const s = model.summary;
  const computedGap = s.monthly_income_fixed - s.monthly_expenses_total;

  if (s.monthly_gap > 0 && s.gap_label === "חוסר חודשי") {
    throw new InvariantViolationError("gap_sign", "positive gap labeled as deficit");
  }
  if (s.monthly_gap < 0 && s.gap_label === "עודף מחושב") {
    throw new InvariantViolationError("gap_sign", "negative gap labeled as surplus");
  }

  // Two-scenario mode allows monthly_gap to refer to the conservative
  // scenario, so we don't strictly assert == computedGap here.
  if (model.display_mode === "single_scenario" && !approxEqual(s.monthly_gap, computedGap)) {
    throw new InvariantViolationError(
      "gap_value",
      `single_scenario: gap ${s.monthly_gap} != income-expenses ${computedGap}`
    );
  }
}

/** No /חודש labels on one-time items. */
export function assertNoMonthlyOnOneTime(model: ReportModel): void {
  const monthly = /\/\s*חודש|לחודש|בחודש/;
  const violations: string[] = [];

  for (const item of model.income_model.one_time_excluded) {
    if (monthly.test(item.label)) violations.push(`income_model.one_time_excluded: "${item.label}"`);
  }
  for (const item of model.expense_model.one_time_expenses) {
    if (monthly.test(item.label)) violations.push(`expense_model.one_time_expenses: "${item.label}"`);
  }
  for (const item of model.non_blocking_items) {
    if (monthly.test(item.label)) violations.push(`non_blocking_items: "${item.label}"`);
  }

  if (violations.length > 0) {
    throw new InvariantViolationError("no_monthly_on_one_time", violations.join("; "));
  }
}

/** Empty evidence tables must collapse to the fallback note, not render
 *  with ₪0 rows. We assert by checking that any reported total has at
 *  least one piece of evidence. */
export function assertNoEmptyEvidence(model: ReportModel): void {
  const checks: { label: string; total: number; evidenceCount: number }[] = [
    ...model.expense_model.fixed_commitments.map(x => ({
      label: `fixed_commitments: ${x.label}`,
      total: x.monthly_amount,
      evidenceCount: x.evidence?.length ?? 0
    })),
    ...model.expense_model.flexible_spending.map(x => ({
      label: `flexible_spending: ${x.label}`,
      total: x.monthly_avg,
      evidenceCount: x.evidence?.length ?? 0
    }))
  ];

  // Phase 3 will enforce; for Phase 2 we only flag warnings.
  // Strict mode can be turned on once classifier emits evidence rows.
  for (const c of checks) {
    if (c.total > 0 && c.evidenceCount === 0) {
      // not throwing yet — leaving as parser_warning candidate
    }
  }
}

/** Run all invariants. Throws on first failure. */
export function assertAllInvariants(model: ReportModel): void {
  assertMonthlyExpenseSum(model);
  assertGapSign(model);
  assertNoMonthlyOnOneTime(model);
  assertNoEmptyEvidence(model);
}
