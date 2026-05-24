// Bridges the existing Facts + Classification + ReportModel into the
// FactsForPlaybooks shape that the 24-scenario registry expects.
//
// Pure / deterministic / no I/O. All inputs come from the deterministic
// pipeline stages (extract_facts → classify → build_report_model), and
// all outputs are numeric/boolean — no copy.

import type { Facts, ReportModel } from "./schema.ts";
import type { FactsForPlaybooks, ReportType as PBReportType } from "./playbooks.ts";

// ---- regexes shared with build_report_model.ts inferCategoryLabel ----
const RE_WOLT = /wolt|10bis|תן ביס|tenbis/i;
const RE_RESTAURANTS = /מסעדה|cafe|קפה|בורגר|פיצה|סושי/i;
const RE_SUBSCRIPTIONS = /netflix|spotify|icloud|apple\.com|disney|hbo|youtube|chatgpt|openai|מנוי|amazon prime/i;
const RE_PAYMENT_APPS = /\bbit\b|paybox|paypal/i;
const RE_MUNICIPAL = /ארנונה|עירייה|מי\s|תאגיד מים|חינוך|חוג|צהרון|בית ספר/i;
const RE_MEDICAL = /מכבי|כללית|לאומית|מאוחדת|דנט|פארם|בית מרקחת|רופא|רופאה|maccabident/i;
const RE_HOUSING = /משכנת|שכירות|שכ"?ד|ארנונה|ועד בית/i;
const RE_INTEREST = /ריבית|מינוס|עמלת מסגרת|חריגה|overdraft/i;
const RE_LARGE_CHECK = /שיק|המחאה/i;
const RE_SEASONAL = /חגים|חג |פסח|ראש השנה|סוכות|קייטנה|חזרה ללימודים|מתנות/i;
const RE_BUSINESS = /חשבונית|מע"?מ|reimbursement|החזר ?הוצא/i;

const LARGE_CHECK_MIN = 1000;

function safeMonths(facts: Facts): number {
  return Math.max(1, facts.months_covered.length);
}

function mapReportType(rt: ReportModel["report_type"]): PBReportType {
  // existing pipeline uses "low_confidence" for the no-files / too-few-rows case;
  // the playbook spec calls that "insufficient_data".
  switch (rt) {
    case "full":              return "full";
    case "partial_bank_only": return "partial_bank_only";
    case "partial_credit_only": return "partial_cc_only";
    case "low_confidence":    return "insufficient_data";
    default:                  return "full";
  }
}

function sumMonthlyByRegex(
  items: { label: string; monthly_avg?: number; monthly_amount?: number }[],
  regex: RegExp,
): number {
  let s = 0;
  for (const i of items) {
    if (!regex.test(i.label)) continue;
    s += i.monthly_amount ?? i.monthly_avg ?? 0;
  }
  return s;
}

function sumPeriodTotalByRegex(
  items: { label: string; amount?: number; period_total?: number }[],
  regex: RegExp,
): number {
  let s = 0;
  for (const i of items) {
    if (!regex.test(i.label)) continue;
    s += i.amount ?? i.period_total ?? 0;
  }
  return s;
}

function sumOneTimeExpensesByCategoryRegex(
  items: ReportModel["expense_model"]["one_time_expenses"],
  regex: RegExp,
): number {
  let s = 0;
  for (const i of items) {
    const hit = regex.test(i.label) || regex.test(i.category);
    if (hit) s += i.amount;
  }
  return s;
}

/** Sum reviewOnly items' monthly contribution (avg if recurring,
 *  else period_total / months as a fallback). */
function sumReviewOnlyMonthly(
  items: ReportModel["expense_model"]["review_only_items"],
  regex: RegExp,
  months: number,
): number {
  let s = 0;
  for (const i of items) {
    if (!regex.test(i.label)) continue;
    if (typeof i.monthly_avg === "number") {
      s += i.monthly_avg;
    } else if (typeof i.period_total === "number") {
      s += i.period_total / months;
    }
  }
  return s;
}

/** Convert existing pipeline outputs into the FactsForPlaybooks shape
 *  consumed by selectPlaybooks(). Heuristics flagged inline. */
export function factsToPlaybookFacts(
  facts: Facts,
  model: ReportModel,
): FactsForPlaybooks {
  const months = safeMonths(facts);
  const summary = model.summary;
  const expense = model.expense_model;
  const income = model.income_model;

  const fixedMonthlyIncome = summary.monthly_income_fixed;
  const monthlyExpenses = summary.monthly_expenses_total;

  // Variable income — sum across all variable income groups.
  let varAvg = 0, varMin = 0, varMax = 0;
  const varMonthsSet = new Set<string>();
  for (const v of income.variable) {
    varAvg += v.range.avg;
    varMin += v.range.min;
    varMax += v.range.max;
    for (const e of v.evidence) {
      if (e.date) varMonthsSet.add(e.date.slice(0, 7));
    }
  }
  const variableIncomeMonthsSeen = Array.from(varMonthsSet).sort();

  const fixedOnlyGap = fixedMonthlyIncome - monthlyExpenses;
  const withVariableGap = (fixedMonthlyIncome + varAvg) - monthlyExpenses;

  // hasMaterialVariableIncome mirrors build_report_model's VARIABLE_MATERIAL_RATIO
  // (>10% of fixed_income) plus a small absolute floor so tiny noise doesn't trip it.
  const hasMaterialVariableIncome =
    varAvg > 0 &&
    (varAvg > fixedMonthlyIncome * 0.1 || fixedMonthlyIncome < monthlyExpenses);

  // Period totals for one-time aggregates (not monthly).
  const oneTimeIncomeExcludedTotal = income.one_time_excluded.reduce(
    (s, x) => s + Math.abs(x.amount),
    0,
  );
  const oneTimeExpenseTotal = expense.one_time_expenses.reduce(
    (s, x) => s + Math.abs(x.amount),
    0,
  );

  // Debt — monthly payment from debt_payments. Balance is rarely present in
  // current data; default to 0 and let the playbook trigger on monthly payment.
  const debtMonthlyPaymentTotal = expense.debt_payments.reduce(
    (s, d) => s + (d.monthly_amount ?? 0),
    0,
  );
  const debtBalanceTotal = expense.debt_payments.reduce(
    (s, d) => s + (d.balance ?? 0),
    0,
  );

  // Overdraft / interest — surfaced as a fixed_commitment or debt_payment
  // whose label mentions ריבית/מינוס.
  const overdraftInterestMonthly =
    sumMonthlyByRegex(expense.fixed_commitments, RE_INTEREST) +
    sumMonthlyByRegex(expense.debt_payments, RE_INTEREST);

  // Housing — fixed_commitments with category "דיור" plus regex on the label.
  const housingMonthly = expense.fixed_commitments
    .filter((c) => c.category === "דיור" || RE_HOUSING.test(c.label))
    .reduce((s, c) => s + (c.monthly_amount ?? 0), 0);

  const fixedCommitmentsMonthly =
    expense.fixed_commitments.reduce((s, c) => s + (c.monthly_amount ?? 0), 0) +
    debtMonthlyPaymentTotal;

  // Flexible spend breakdowns.
  const woltMonthly = expense.flexible_spending.reduce(
    (s, f) => RE_WOLT.test(f.label) ? s + (f.monthly_avg ?? 0) : s,
    0,
  );
  const restaurantsMonthly = expense.flexible_spending.reduce((s, f) => {
    if (RE_WOLT.test(f.label)) return s; // already counted in woltMonthly
    if (RE_RESTAURANTS.test(f.label) || f.category === "מזון בחוץ") {
      return s + (f.monthly_avg ?? 0);
    }
    return s;
  }, 0);

  // Subscriptions + payment apps live in review_only_items.
  const subscriptionsMonthly = sumReviewOnlyMonthly(
    expense.review_only_items,
    RE_SUBSCRIPTIONS,
    months,
  );
  const paymentAppsMonthly = sumReviewOnlyMonthly(
    expense.review_only_items,
    RE_PAYMENT_APPS,
    months,
  );

  // Municipal / education monthly (from fixed_commitments).
  const municipalMonthly = sumMonthlyByRegex(
    expense.fixed_commitments,
    RE_MUNICIPAL,
  );

  // Medical one-time / seasonal / business — total over the period.
  const medicalOneTimeTotal = sumOneTimeExpensesByCategoryRegex(
    expense.one_time_expenses,
    RE_MEDICAL,
  );
  const seasonalFamilyExpensesTotal = sumOneTimeExpensesByCategoryRegex(
    expense.one_time_expenses,
    RE_SEASONAL,
  );
  const businessOrReimbursablePossibleTotal = sumOneTimeExpensesByCategoryRegex(
    expense.one_time_expenses,
    RE_BUSINESS,
  );

  // Large recurring checks — any fixed_commitment / debt_payment whose label
  // mentions שיק/המחאה and whose monthly amount clears LARGE_CHECK_MIN.
  let recurringLargeChecksTotal = 0;
  for (const c of expense.fixed_commitments) {
    if (RE_LARGE_CHECK.test(c.label) && c.monthly_amount >= LARGE_CHECK_MIN) {
      recurringLargeChecksTotal += c.monthly_amount;
    }
  }
  for (const d of expense.debt_payments) {
    if (RE_LARGE_CHECK.test(d.label) && d.monthly_amount >= LARGE_CHECK_MIN) {
      recurringLargeChecksTotal += d.monthly_amount;
    }
  }

  // Internal transfer risk — the CC dedup already excluded confirmed cases;
  // the remaining risk is BIT/PayBox volume in review_only (could be transfer
  // between own accounts).
  const internalTransferRiskTotal = paymentAppsMonthly * months;

  // Missing income heuristic — observed expenses exceed observed income by a
  // wide margin AND no variable income explains it. Conservative threshold:
  // expenses > 1.25× fixed income and no material variable.
  const missingIncomeLikely =
    !hasMaterialVariableIncome &&
    fixedMonthlyIncome > 0 &&
    monthlyExpenses > fixedMonthlyIncome * 1.25;

  return {
    reportType: mapReportType(model.report_type),
    monthsDetected: facts.months_covered.length,
    hasBankFile: facts.files_present.bank,
    hasCreditCardFile: facts.files_present.credit_card,

    fixedMonthlyIncome,
    variableIncomeMonthlyAvg: varAvg,
    variableIncomeMin: varMin,
    variableIncomeMax: varMax,
    variableIncomeMonthsSeen,

    monthlyExpenses,
    fixedOnlyGap,
    withVariableGap,

    oneTimeIncomeExcludedTotal,
    oneTimeExpenseTotal,

    debtBalanceTotal,
    debtMonthlyPaymentTotal,
    overdraftInterestMonthly,

    housingMonthly,
    fixedCommitmentsMonthly,

    woltMonthly,
    restaurantsMonthly,
    subscriptionsMonthly,
    subscriptionsDuplicateEvidenceAmount: 0, // TODO: requires duplicate-detection rule

    paymentAppsMonthly,
    municipalMonthly,
    medicalOneTimeTotal,
    seasonalFamilyExpensesTotal,
    businessOrReimbursablePossibleTotal,

    recurringLargeChecksTotal,
    internalTransferRiskTotal,

    missingIncomeLikely,
    hasMaterialVariableIncome,
    dataConfidence: model.data_confidence,
  };
}
