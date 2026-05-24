// Playbook registry smoke test.
//
// Verifies:
//   1. All 24 playbook IDs are registered with the expected kind & priority.
//   2. Every trigger is callable and returns boolean on a baseline facts object.
//   3. For each scenario, a tailored facts object causes selectPlaybooks() to
//      pick the expected primary playbook.
//   4. Data-quality playbooks override primary_diagnosis playbooks.
//   5. buildReportUIStructure returns the partial section list for partial
//      report types, and the full FINAL_REPORT_SECTION_ORDER otherwise.

import {
  PLAYBOOKS,
  selectPlaybooks,
  buildReportUIStructure,
  FINAL_REPORT_SECTION_ORDER,
  GLOBAL_LANGUAGE_RULES,
  UI_TITLES,
} from "../supabase/functions/super-service/playbooks.ts";

let pass = 0;
let fail = 0;
const fails = [];

function ok(cond, label) {
  if (cond) {
    pass++;
    return;
  }
  fail++;
  fails.push(label);
  console.error("  ✗", label);
}

function eq(actual, expected, label) {
  ok(actual === expected, `${label}  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

// -------- baseline facts (everything off / zero) --------
function baseFacts(overrides = {}) {
  return {
    reportType: "full",
    monthsDetected: 3,
    hasBankFile: true,
    hasCreditCardFile: true,

    fixedMonthlyIncome: 20000,
    variableIncomeMonthlyAvg: 0,
    variableIncomeMin: 0,
    variableIncomeMax: 0,
    variableIncomeMonthsSeen: [],

    monthlyExpenses: 15000,
    fixedOnlyGap: 5000,
    withVariableGap: 5000,

    oneTimeIncomeExcludedTotal: 0,
    oneTimeExpenseTotal: 0,

    debtBalanceTotal: 0,
    debtMonthlyPaymentTotal: 0,
    overdraftInterestMonthly: 0,

    housingMonthly: 0,
    fixedCommitmentsMonthly: 0,

    woltMonthly: 0,
    restaurantsMonthly: 0,
    subscriptionsMonthly: 0,
    subscriptionsDuplicateEvidenceAmount: 0,

    paymentAppsMonthly: 0,
    municipalMonthly: 0,
    medicalOneTimeTotal: 0,
    seasonalFamilyExpensesTotal: 0,
    businessOrReimbursablePossibleTotal: 0,

    recurringLargeChecksTotal: 0,
    internalTransferRiskTotal: 0,

    missingIncomeLikely: false,
    hasMaterialVariableIncome: false,
    dataConfidence: "high",
    ...overrides,
  };
}

console.log("Playbook registry smoke");
console.log("─".repeat(60));

// 1) Registry shape: all 24 IDs present, IDs match keys, no duplicates.
const EXPECTED_IDS = [
  "partial_credit_only",
  "partial_bank_only",
  "insufficient_data",
  "stable_healthy",
  "surplus_not_felt",
  "small_deficit",
  "large_deficit",
  "variable_income_dependent",
  "missing_income",
  "one_time_income_distortion",
  "one_time_expense_distortion",
  "debt_pressure",
  "overdraft_interest",
  "recurring_large_check",
  "internal_transfer_risk",
  "housing_heavy",
  "fixed_commitments_high",
  "food_delivery_restaurants_high",
  "subscriptions_creep",
  "payment_apps_blind_spot",
  "municipal_education_review",
  "medical_health_one_time",
  "business_reimbursable_expenses",
  "seasonal_family_expenses",
];

eq(Object.keys(PLAYBOOKS).length, 24, "PLAYBOOKS has exactly 24 entries");
for (const id of EXPECTED_IDS) {
  const pb = PLAYBOOKS[id];
  ok(pb != null, `PLAYBOOKS has id "${id}"`);
  if (pb) {
    eq(pb.id, id, `PLAYBOOKS["${id}"].id === "${id}"`);
    ok(typeof pb.trigger.test === "function", `${id} has a trigger.test function`);
    ok(typeof pb.priority === "number", `${id} priority is numeric`);
    ok(Array.isArray(pb.primaryActions), `${id} primaryActions is array`);
    ok(Array.isArray(pb.recommendedSections), `${id} recommendedSections is array`);
  }
}

// 2) Every trigger is callable against the baseline and returns boolean.
for (const id of EXPECTED_IDS) {
  const result = PLAYBOOKS[id].trigger.test(baseFacts());
  ok(typeof result === "boolean", `${id} trigger returns boolean on baseline`);
}

// 3) Per-scenario selection.
//    For each scenario, build facts that should make selectPlaybooks pick it
//    as primary. Data-quality playbooks short-circuit; primary_diagnosis
//    requires reportType === "full" and matching numeric signals.

const cases = [
  {
    id: "partial_credit_only",
    facts: { hasBankFile: false, hasCreditCardFile: true },
  },
  {
    id: "partial_bank_only",
    facts: { hasBankFile: true, hasCreditCardFile: false },
  },
  {
    id: "insufficient_data",
    facts: { reportType: "insufficient_data", dataConfidence: "low" },
  },
  {
    id: "stable_healthy",
    // surplus_not_felt requires fixedOnlyGap > max(1500, income*0.05) = 1500 here.
    // Pick a tiny positive surplus so only stable_healthy triggers.
    facts: {
      fixedOnlyGap: 800,
      monthlyExpenses: 19200,
      debtMonthlyPaymentTotal: 500,
    },
  },
  {
    id: "surplus_not_felt",
    facts: {
      fixedOnlyGap: 4000,
      monthlyExpenses: 16000,
      debtMonthlyPaymentTotal: 500,
    },
    // Both stable_healthy and surplus_not_felt match; surplus_not_felt has higher priority (200 vs 100).
  },
  {
    id: "small_deficit",
    facts: {
      fixedMonthlyIncome: 20000,
      fixedOnlyGap: -1500,
      monthlyExpenses: 21500,
    },
  },
  {
    id: "large_deficit",
    facts: {
      fixedMonthlyIncome: 20000,
      fixedOnlyGap: -6000,
      monthlyExpenses: 26000,
    },
  },
  {
    id: "variable_income_dependent",
    facts: {
      hasMaterialVariableIncome: true,
      variableIncomeMonthlyAvg: 5000,
      fixedOnlyGap: -2000,
      withVariableGap: 3000,
      monthlyExpenses: 22000,
    },
  },
  {
    id: "missing_income",
    // missing_income has priority 480, less than variable_income_dependent (500),
    // so we keep variable income off and only flag missingIncomeLikely.
    facts: {
      fixedOnlyGap: -3000,
      monthlyExpenses: 23000,
      missingIncomeLikely: true,
      // Suppress large_deficit (priority 300) by keeping deficit small — but missing_income
      // requires fixedOnlyGap < 0. small_deficit (priority 250) is still beaten by missing_income (480).
    },
  },
  {
    id: "one_time_income_distortion",
    // priority 470 — beats large_deficit (300) but loses to variable_income_dependent (500)
    // and missing_income (480). Keep both off.
    facts: {
      fixedOnlyGap: 4000, // surplus, suppresses small/large deficit & missing_income
      monthlyExpenses: 16000,
      oneTimeIncomeExcludedTotal: 25000,
    },
    // surplus_not_felt (200) also matches but has lower priority than 470.
  },
  {
    id: "one_time_expense_distortion",
    // priority 430 — must beat one_time_income_distortion (470) by suppressing that.
    facts: {
      fixedOnlyGap: 4000,
      monthlyExpenses: 16000,
      oneTimeExpenseTotal: 8000,
    },
  },
  {
    id: "debt_pressure",
    // priority 420. Suppress higher-priority primary_diagnosis playbooks.
    facts: {
      fixedOnlyGap: 4000,
      monthlyExpenses: 16000,
      debtMonthlyPaymentTotal: 3000, // > max(1200, 20000*0.08=1600)
    },
  },
  // Risk-context and secondary-finding playbooks are not primary candidates,
  // but they should appear in the secondary list when triggered.
];

for (const c of cases) {
  const facts = baseFacts(c.facts);
  const { primary, secondary } = selectPlaybooks(facts);
  eq(primary.id, c.id, `selectPlaybooks → primary "${c.id}"`);
  ok(Array.isArray(secondary), `selectPlaybooks → secondary is array (${c.id})`);
}

// 4) Data-quality precedence: even with strong primary_diagnosis signals,
//    a missing bank file makes partial_credit_only the primary.
{
  const facts = baseFacts({
    hasBankFile: false,
    hasCreditCardFile: true,
    fixedOnlyGap: -10000,
    monthlyExpenses: 30000,
    debtMonthlyPaymentTotal: 4000,
  });
  const { primary } = selectPlaybooks(facts);
  eq(primary.id, "partial_credit_only", "data_quality short-circuits primary_diagnosis");
}

// 5) Secondary findings populate with triggered risk_context / secondary_finding.
//    Keep debtMonthlyPaymentTotal low so large_deficit (priority 300) wins over
//    debt_pressure (priority 420). food_delivery_restaurants_high uses a
//    dynamic threshold of max(1200, monthlyExpenses*0.06); at 26000 expenses
//    that's 1560, so wolt+restaurants must exceed it.
{
  const facts = baseFacts({
    fixedOnlyGap: -6000, // large_deficit primary
    monthlyExpenses: 26000,
    debtMonthlyPaymentTotal: 1000, // below debt_pressure threshold of max(1200, 1600)=1600
    housingMonthly: 7000, // housing_heavy (risk_context)
    woltMonthly: 1100,
    restaurantsMonthly: 700, // sum=1800 > max(1200, 1560)=1560 → triggers
    subscriptionsMonthly: 800, // subscriptions_creep (secondary)
    overdraftInterestMonthly: 250, // overdraft_interest (risk_context)
  });
  const { primary, secondary } = selectPlaybooks(facts);
  eq(primary.id, "large_deficit", "large_deficit primary in stress scenario");
  const secIds = secondary.map((p) => p.id);
  ok(
    secIds.includes("housing_heavy"),
    "housing_heavy appears in secondary findings",
  );
  ok(
    secIds.includes("food_delivery_restaurants_high"),
    "food_delivery_restaurants_high appears in secondary",
  );
  ok(
    secIds.includes("subscriptions_creep"),
    "subscriptions_creep appears in secondary",
  );
  ok(
    secIds.includes("overdraft_interest"),
    "overdraft_interest appears in secondary",
  );
  ok(secondary.length <= 5, "secondary capped at 5 entries");
  ok(
    !secIds.includes("large_deficit"),
    "primary is not duplicated in secondary",
  );
}

// 6) buildReportUIStructure — partial vs full section order.
{
  const facts = baseFacts({ hasBankFile: false, hasCreditCardFile: true });
  const { primary } = selectPlaybooks(facts);
  const ui = buildReportUIStructure(primary, [], facts);
  // partial_credit_only.recommendedSections does NOT include scenario_comparison
  ok(
    !ui.sectionOrder.includes("scenario_comparison"),
    "partial_credit_only sectionOrder omits scenario_comparison",
  );
  ok(
    ui.sectionOrder.includes("bottom_line"),
    "partial_credit_only sectionOrder includes bottom_line",
  );
  eq(ui.titles.bottom_line, "השורה התחתונה שלכם", "bottom_line title is canonical");
}

{
  const facts = baseFacts({
    fixedOnlyGap: 4000,
    monthlyExpenses: 16000,
    debtMonthlyPaymentTotal: 500,
  });
  const { primary } = selectPlaybooks(facts);
  const ui = buildReportUIStructure(primary, [], facts);
  eq(
    ui.sectionOrder.length,
    FINAL_REPORT_SECTION_ORDER.length,
    "non-partial uses FINAL_REPORT_SECTION_ORDER (length)",
  );
  for (let i = 0; i < FINAL_REPORT_SECTION_ORDER.length; i++) {
    eq(
      ui.sectionOrder[i],
      FINAL_REPORT_SECTION_ORDER[i],
      `FINAL_REPORT_SECTION_ORDER[${i}] preserved`,
    );
  }
}

// 7) GLOBAL_LANGUAGE_RULES sanity — forbidden words include the critical ones.
{
  const fw = GLOBAL_LANGUAGE_RULES.forbiddenWords;
  ok(fw.includes("בזבוזים"), "GLOBAL_LANGUAGE_RULES forbids בזבוזים");
  ok(fw.includes("חמור"), "GLOBAL_LANGUAGE_RULES forbids חמור");
  ok(fw.includes("קחו הלוואה"), "GLOBAL_LANGUAGE_RULES forbids קחו הלוואה");
  eq(GLOBAL_LANGUAGE_RULES.surplus.say, "עודף מחושב", "surplus.say is עודף מחושב");
  eq(GLOBAL_LANGUAGE_RULES.deficit.say, "חוסר חודשי", "deficit.say is חוסר חודשי");
}

// 8) UI_TITLES match what buildReportUIStructure emits (canonical strings).
{
  const facts = baseFacts({ fixedOnlyGap: 4000 });
  const { primary } = selectPlaybooks(facts);
  const ui = buildReportUIStructure(primary, [], facts);
  eq(ui.titles.work_done, UI_TITLES.work_done.title, "UI_TITLES.work_done matches builder output");
  eq(ui.titles.bottom_line, UI_TITLES.bottom_line.title, "UI_TITLES.bottom_line matches builder output");
  eq(ui.titles.check_first, UI_TITLES.check_first.title, "UI_TITLES.check_first matches builder output");
  eq(
    ui.titles.control_opportunities,
    UI_TITLES.control_opportunities.title,
    "UI_TITLES.control_opportunities matches builder output",
  );
}

// --- summary ---
console.log("─".repeat(60));
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error("\nFailures:");
  for (const f of fails) console.error("  •", f);
  process.exit(1);
}
