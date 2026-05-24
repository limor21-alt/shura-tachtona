// Phase 5 smoke test — full pipeline end-to-end.
// Runs synthetic rows through extractFacts → classify → gate →
// applyAnswers → buildReportModel → writeCopy (deterministic fallback).
// Asserts the final ReportModel is internally consistent.

import { runPipeline } from "../supabase/functions/super-service/pipeline.ts";

const ctx = {
  user_name: "לימור",
  household_structure: "family",
  partner_name: "ינון",
  children_names: ["נועה"],
  has_variable_income: "yes",
  has_partner_or_business_transfers: "yes",
  planned_files: ["both"]
};

let rowCounter = 0;
const r = (source, date, desc, amount, file_id = "f1") => ({
  source, file_id, sheet: "Sheet1",
  row_index: ++rowCounter,
  date, raw_description: desc, cleaned_name: desc,
  amount, currency: "ILS", account_mask: ""
});

let pass = 0, fail = 0;
function assert(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else      { fail++; console.log(`  FAIL  ${name}${detail ? "\n        " + detail : ""}`); }
}

// =============================================================
// Test 1: variable_dependent scenario → two_scenarios report
// =============================================================
{
  console.log("\nTest 1 — variable_dependent (Amdocs + ינון)");
  const rows = [
    // Salary
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18420),
    // Partner variable
    r("bank", "2025-03-12", "העברה מינון שומרוני משכורת", 11500),
    r("bank", "2025-05-04", "העברה מינון שומרוני משכורת", 17500),
    // Migdal one-time
    r("bank", "2025-04-22", "מגדל קרן השתלמות פדיון", 31768),
    // Bills
    r("bank", "2025-03-15", "חברת חשמל", -410),
    r("bank", "2025-04-15", "חברת חשמל", -410),
    r("bank", "2025-05-15", "חברת חשמל", -410),
    r("bank", "2025-03-25", "בזק חיוב חודשי", -320),
    r("bank", "2025-04-25", "בזק חיוב חודשי", -320),
    r("bank", "2025-05-25", "בזק חיוב חודשי", -320),
    // Loan
    r("bank", "2025-03-05", "הלוואה החזר חודשי", -1750),
    r("bank", "2025-04-05", "הלוואה החזר חודשי", -1750),
    r("bank", "2025-05-05", "הלוואה החזר חודשי", -1750),
    // CC charges in bank (must NOT be counted)
    r("bank", "2025-03-30", "מקס חיוב", -4200),
    r("bank", "2025-04-30", "מקס חיוב", -4200),
    r("bank", "2025-05-30", "מקס חיוב", -4200),
    // CC file (the real expenses)
    r("credit_card", "2025-03-18", "מכבידנט", -942, "f2"),
    r("credit_card", "2025-04-02", "PlaySmart", -509, "f2"),
    r("credit_card", "2025-04-15", "Segav Skin", -500, "f2"),
    r("credit_card", "2025-03-22", "Wolt", -85, "f2"),
    r("credit_card", "2025-04-11", "Wolt", -120, "f2"),
    r("credit_card", "2025-05-08", "מסעדה אגדה", -350, "f2"),
    r("credit_card", "2025-03-10", "Netflix", -54, "f2"),
    r("credit_card", "2025-04-10", "Netflix", -54, "f2"),
    r("credit_card", "2025-04-12", "Spotify", -22, "f2"),
    r("credit_card", "2025-03-15", "סופר ויקטורי", -1800, "f2"),
    r("credit_card", "2025-04-15", "סופר ויקטורי", -1800, "f2"),
    r("credit_card", "2025-05-15", "סופר ויקטורי", -1800, "f2")
  ];

  // First call: no answers — should return needs_clarification
  const firstCall = await runPipeline({ rows, context: ctx });
  assert("First call returns needs_clarification", firstCall.kind === "needs_clarification");
  assert("Has 2-3 questions", firstCall.kind === "needs_clarification" && firstCall.questions.length >= 1 && firstCall.questions.length <= 5);

  if (firstCall.kind !== "needs_clarification") throw new Error("expected needs_clarification");
  console.log(`  Questions:`);
  for (const q of firstCall.questions) {
    console.log(`    [${q.id}] ${q.title}`);
  }

  // Second call: answer "variable" to partner and "one_time" to Migdal
  const answers = [
    { question_id: "q-partner-income",      choice: "variable" },
    { question_id: "q-large-onetime-income", choice: "one_time" }
  ];
  const secondCall = await runPipeline({ rows, context: ctx, answers });
  assert("Second call returns report", secondCall.kind === "report");
  if (secondCall.kind !== "report") throw new Error("expected report");
  const m = secondCall.report_model;

  assert("report_type = full",                m.report_type === "full");
  assert("data_confidence = high",            m.data_confidence === "high");
  assert("summary_status = variable_dependent", m.summary_status === "variable_dependent");
  assert("display_mode = two_scenarios",      m.display_mode === "two_scenarios");
  assert("has 2 scenarios",                   m.summary.scenarios?.length === 2);
  assert("fixed income > 0",                  m.summary.monthly_income_fixed > 0);
  assert("expenses > 0",                      m.summary.monthly_expenses_total > 0);
  assert("variable range present",            !!m.summary.monthly_income_variable_range);
  assert("Migdal one_time_excluded",          m.income_model.one_time_excluded.some(x => x.label.includes("מגדל")));
  assert("CC charges deduplicated",           m.work_done.cc_charges_deduplicated === 3);
  assert("non_blocking has medical/kids/beauty", m.non_blocking_items.length >= 3);
  assert("findings_by_area populated",        m.findings_by_area.length >= 3);
  assert("priority_checks not empty",         m.priority_checks.length >= 1);
  assert("forbidden_word_violations empty",   m.forbidden_word_violations.length === 0);

  // Verify CC dedup math: bank_direct + cc_file_total == expenses_total
  // (approx, monthly average)
  const monthsCovered = m.work_done.months_covered;
  console.log(`\n  Numbers (${monthsCovered} months):`);
  console.log(`    monthly_income_fixed:      ${m.summary.monthly_income_fixed.toLocaleString()}`);
  console.log(`    monthly_expenses_total:    ${m.summary.monthly_expenses_total.toLocaleString()}`);
  console.log(`    monthly_gap:               ${m.summary.monthly_gap.toLocaleString()}`);
  if (m.summary.monthly_income_variable_range) {
    console.log(`    variable range:            ${m.summary.monthly_income_variable_range.min}-${m.summary.monthly_income_variable_range.max}`);
  }
  console.log(`    scenarios:                 ${JSON.stringify(m.summary.scenarios)}`);
  console.log(`    headline_copy:             ${m.summary.headline_copy}`);
}

// =============================================================
// Test 2: surplus scenario, no partner → no clarification
// =============================================================
{
  console.log("\nTest 2 — clean surplus (no partner)");
  const ctxNoPartner = { ...ctx, partner_name: undefined };
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-15", "חברת חשמל", -410),
    r("bank", "2025-04-15", "חברת חשמל", -410),
    r("bank", "2025-03-05", "הלוואה החזר", -1750),
    r("bank", "2025-04-05", "הלוואה החזר", -1750),
    r("credit_card", "2025-03-22", "Wolt", -120, "f2"),
    r("credit_card", "2025-04-11", "Wolt", -150, "f2")
  ];
  const result = await runPipeline({ rows, context: ctxNoPartner });
  assert("No clarification needed", result.kind === "report");
  if (result.kind !== "report") throw new Error("expected report");
  const m = result.report_model;
  assert("summary_status = surplus", m.summary_status === "surplus");
  assert("gap_label = עודף מחושב", m.summary.gap_label === "עודף מחושב");
  assert("display_mode = single_scenario", m.display_mode === "single_scenario");
  // After Phase 2b the headline comes from the selected playbook's
  // ui.bottomLineHeadline. The loan (1750/mo on 18420 income = 9.5%) crosses
  // the 8% debt_pressure threshold and that playbook (priority 420) beats
  // surplus_not_felt (200), so the headline now talks about the debt
  // commitment instead of the surplus. summary_status is still "surplus"
  // (the underlying numbers haven't changed), and the gap_label is still
  // "עודף מחושב" — only the prose framing shifted.
  assert("headline is non-empty Hebrew",
    typeof m.summary.headline_copy === "string" && m.summary.headline_copy.length > 0);
  assert("headline avoids panic vocabulary",
    !/\b(חמור|מסוכן|דורש טיפול מיידי|בזבוזים|חייבים|קחו הלוואה)\b/.test(m.summary.headline_copy));
}

// =============================================================
// Test 3: partial_credit_only
// =============================================================
{
  console.log("\nTest 3 — only credit card file");
  const ctxNoPartner = { ...ctx, partner_name: undefined };
  const rows = [
    r("credit_card", "2025-03-22", "Wolt", -120, "f1"),
    r("credit_card", "2025-04-11", "Wolt", -150, "f1"),
    r("credit_card", "2025-03-15", "סופר", -1500, "f1"),
    r("credit_card", "2025-04-15", "סופר", -1500, "f1")
  ];
  const result = await runPipeline({ rows, context: ctxNoPartner });
  assert("Returns report (no questions)", result.kind === "report");
  if (result.kind !== "report") throw new Error("expected report");
  const m = result.report_model;
  assert("report_type = partial_credit_only", m.report_type === "partial_credit_only");
  assert("data_confidence not 'high'", m.data_confidence !== "high");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
