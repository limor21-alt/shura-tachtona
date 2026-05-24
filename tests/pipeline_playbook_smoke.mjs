// Pipeline-level playbook test.
//
// Runs the real pipeline (extractFacts → classify → gate → applyAnswers →
// buildReportModel) on hand-crafted scenarios and asserts that the
// playbook adapter + selectPlaybooks pick the expected primary playbook
// and that ui_structure is populated.

import { runPipeline } from "../supabase/functions/super-service/pipeline.ts";

let pass = 0, fail = 0;
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
  ok(
    actual === expected,
    `${label}  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`,
  );
}

const ctxFamily = {
  user_name: "לימור",
  household_structure: "family",
  partner_name: "ינון",
  children_names: ["נועה"],
  has_variable_income: "no",
  has_partner_or_business_transfers: "no",
  planned_files: ["both"],
};

let rowCounter = 0;
function r(source, date, desc, amount, file_id = "f1") {
  return {
    source,
    file_id,
    sheet: "Sheet1",
    row_index: ++rowCounter,
    date,
    raw_description: desc,
    cleaned_name: desc,
    amount,
    currency: "ILS",
    account_mask: "",
  };
}

function resetRowCounter() { rowCounter = 0; }

async function runAndGetReport(rows, ctx, answers = []) {
  const result = await runPipeline({ rows, context: ctx, answers });
  if (result.kind !== "report") {
    // If pipeline asks clarification, treat as failure for this test
    // (these scenarios are constructed to bypass clarification).
    throw new Error(
      `expected report, got ${result.kind}${
        result.kind === "needs_clarification"
          ? " — questions: " + result.questions.map(q => q.id).join(", ")
          : ""
      }`,
    );
  }
  return result.report_model;
}

console.log("Pipeline → playbook selection");
console.log("─".repeat(60));

// ── Test 1: stable, no major risk → stable_healthy ─────────────
{
  resetRowCounter();
  const rows = [
    // 3 months stable salary
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
    // Small bills + groceries — well below income
    r("bank", "2025-03-15", "חברת חשמל", -400),
    r("bank", "2025-04-15", "חברת חשמל", -400),
    r("bank", "2025-05-15", "חברת חשמל", -400),
    r("credit_card", "2025-03-15", "סופר ויקטורי", -2000, "f2"),
    r("credit_card", "2025-04-15", "סופר ויקטורי", -2000, "f2"),
    r("credit_card", "2025-05-15", "סופר ויקטורי", -2000, "f2"),
    // CC charge in bank (will be deduped)
    r("bank", "2025-03-30", "מקס חיוב", -2000),
    r("bank", "2025-04-30", "מקס חיוב", -2000),
    r("bank", "2025-05-30", "מקס חיוב", -2000),
  ];
  const m = await runAndGetReport(rows, ctxFamily);
  ok(m.selected_playbooks != null, "Test1: selected_playbooks populated");
  // Expected: surplus_not_felt or stable_healthy depending on surplus size.
  // With income 18000 and expenses ~2400/mo, fixedOnlyGap ≈ 15600 — well above
  // the surplus_not_felt threshold of max(1500, 18000*0.05=900)=1500. So
  // surplus_not_felt wins (priority 200 > stable_healthy 100).
  ok(
    ["surplus_not_felt", "stable_healthy"].includes(m.selected_playbooks?.primary),
    `Test1: primary in {surplus_not_felt, stable_healthy} (got ${m.selected_playbooks?.primary})`,
  );
  ok(m.ui_structure != null, "Test1: ui_structure populated");
  ok(
    Array.isArray(m.ui_structure?.section_order) &&
      m.ui_structure.section_order.length > 0,
    "Test1: section_order populated",
  );
  eq(m.ui_structure?.titles.bottom_line, "השורה התחתונה שלכם", "Test1: bottom_line title");
}

// ── Test 2: only credit card file → partial_credit_only ────────
{
  resetRowCounter();
  const rows = [
    r("credit_card", "2025-03-15", "סופר ויקטורי", -2000, "f2"),
    r("credit_card", "2025-04-15", "סופר ויקטורי", -2000, "f2"),
    r("credit_card", "2025-05-15", "סופר ויקטורי", -2000, "f2"),
    r("credit_card", "2025-03-10", "Netflix", -54, "f2"),
    r("credit_card", "2025-04-10", "Netflix", -54, "f2"),
    r("credit_card", "2025-05-10", "Netflix", -54, "f2"),
  ];
  const ctx = { ...ctxFamily, planned_files: ["cc_only"] };
  const m = await runAndGetReport(rows, ctx);
  eq(m.report_type, "partial_credit_only", "Test2: report_type partial_credit_only");
  eq(
    m.selected_playbooks?.primary,
    "partial_credit_only",
    "Test2: primary playbook is partial_credit_only",
  );
  // partial reports omit scenario_comparison
  ok(
    !m.ui_structure?.section_order.includes("scenario_comparison"),
    "Test2: partial report omits scenario_comparison",
  );
}

// ── Test 3: only bank file → partial_bank_only ─────────────────
{
  resetRowCounter();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-03-15", "חברת חשמל", -400),
    r("bank", "2025-04-15", "חברת חשמל", -400),
    r("bank", "2025-05-15", "חברת חשמל", -400),
  ];
  const ctx = { ...ctxFamily, planned_files: ["bank_only"] };
  const m = await runAndGetReport(rows, ctx);
  eq(m.report_type, "partial_bank_only", "Test3: report_type partial_bank_only");
  eq(
    m.selected_playbooks?.primary,
    "partial_bank_only",
    "Test3: primary playbook is partial_bank_only",
  );
}

// ── Test 4: large deficit + heavy debt → debt_pressure beats large_deficit ─
//    (debt_pressure priority 420 > large_deficit 300)
{
  resetRowCounter();
  const rows = [
    // Modest income
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 12000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 12000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 12000),
    // Heavy loan payment — well above max(1200, 12000*0.08=960) = 1200
    r("bank", "2025-03-05", "הלוואה החזר חודשי", -3500),
    r("bank", "2025-04-05", "הלוואה החזר חודשי", -3500),
    r("bank", "2025-05-05", "הלוואה החזר חודשי", -3500),
    // Big groceries + bills pushing into deficit
    r("credit_card", "2025-03-15", "סופר ויקטורי", -4000, "f2"),
    r("credit_card", "2025-04-15", "סופר ויקטורי", -4000, "f2"),
    r("credit_card", "2025-05-15", "סופר ויקטורי", -4000, "f2"),
    r("bank", "2025-03-15", "חברת חשמל", -500),
    r("bank", "2025-04-15", "חברת חשמל", -500),
    r("bank", "2025-05-15", "חברת חשמל", -500),
    // CC charge in bank — deduped
    r("bank", "2025-03-30", "מקס חיוב", -4000),
    r("bank", "2025-04-30", "מקס חיוב", -4000),
    r("bank", "2025-05-30", "מקס חיוב", -4000),
  ];
  const m = await runAndGetReport(rows, ctxFamily);
  eq(
    m.selected_playbooks?.primary,
    "debt_pressure",
    "Test4: primary playbook is debt_pressure",
  );
}

// ── Test 5: ui_structure.titles cover all expected sections ────
{
  // Re-use Test 1 setup to get a full report.
  resetRowCounter();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-03-15", "חברת חשמל", -400),
    r("bank", "2025-04-15", "חברת חשמל", -400),
    r("bank", "2025-05-15", "חברת חשמל", -400),
    r("credit_card", "2025-03-15", "סופר ויקטורי", -2000, "f2"),
    r("credit_card", "2025-04-15", "סופר ויקטורי", -2000, "f2"),
    r("credit_card", "2025-05-15", "סופר ויקטורי", -2000, "f2"),
    r("bank", "2025-03-30", "מקס חיוב", -2000),
    r("bank", "2025-04-30", "מקס חיוב", -2000),
    r("bank", "2025-05-30", "מקס חיוב", -2000),
  ];
  const m = await runAndGetReport(rows, ctxFamily);
  const t = m.ui_structure?.titles ?? {};
  ok(t.work_done && t.work_done.length > 0, "Test5: work_done title set");
  ok(t.bottom_line && t.bottom_line.length > 0, "Test5: bottom_line title set");
  ok(t.meaning && t.meaning.length > 0, "Test5: meaning title set");
  ok(t.check_first && t.check_first.length > 0, "Test5: check_first title set");
  ok(
    t.control_opportunities && t.control_opportunities.length > 0,
    "Test5: control_opportunities title set",
  );
  ok(t.details_by_area && t.details_by_area.length > 0, "Test5: details_by_area title set");
  ok(t.classify_later && t.classify_later.length > 0, "Test5: classify_later title set");
  ok(t.audit_trail && t.audit_trail.length > 0, "Test5: audit_trail title set");
  ok(t.export && t.export.length > 0, "Test5: export title set");
}

console.log("─".repeat(60));
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error("\nFailures:");
  for (const f of fails) console.error("  •", f);
  process.exit(1);
}
